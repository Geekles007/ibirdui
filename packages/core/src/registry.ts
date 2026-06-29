import {
  type RegistryIndex,
  type RegistryItem,
  registryIndexSchema,
  registryItemSchema,
} from './schema.js';

/** Strip trailing slashes so we can join paths predictably. */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

/** URL of the published index for a given registry base URL. */
export function indexUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/r/index.json`;
}

/** URL of a single published item for a given registry base URL. */
export function itemUrl(baseUrl: string, name: string): string {
  return `${normalizeBaseUrl(baseUrl)}/r/${name}.json`;
}

/** True for an http(s) absolute URL — i.e. a cross-registry dependency. */
export function isAbsoluteUrl(ref: string): boolean {
  return /^https?:\/\//i.test(ref);
}

/**
 * The registry base URL that served a given item URL — the inverse of
 * `itemUrl` (`…/r/<name>.json` → `…`). Used so an item pulled from another
 * registry resolves *its* name-based dependencies against *its* origin.
 */
export function baseUrlFromItemUrl(url: string): string {
  return url.replace(/\/r\/[^/]+\.json$/, '');
}

type FetchLike = (input: string) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

interface FetchOptions {
  /** Inject a fetch implementation (defaults to global `fetch`). */
  fetch?: FetchLike;
}

function resolveFetch(options?: FetchOptions): FetchLike {
  const impl = options?.fetch ?? (globalThis.fetch as FetchLike | undefined);
  if (!impl) {
    throw new Error('No fetch implementation available. Pass `{ fetch }` or run on Node >= 18.');
  }
  return impl;
}

/** Fetch and validate the registry index from a base URL. */
export async function fetchRegistryIndex(
  baseUrl: string,
  options?: FetchOptions,
): Promise<RegistryIndex> {
  const fetchImpl = resolveFetch(options);
  const res = await fetchImpl(indexUrl(baseUrl));
  if (!res.ok) {
    throw new Error(`Failed to fetch registry index (${res.status}).`);
  }
  return registryIndexSchema.parse(await res.json());
}

/** Fetch and validate a single registry item from its fully-qualified URL. */
export async function fetchRegistryItemByUrl(
  url: string,
  options?: FetchOptions,
): Promise<RegistryItem> {
  const fetchImpl = resolveFetch(options);
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Registry item not found at "${url}" (${res.status}).`);
  }
  return registryItemSchema.parse(await res.json());
}

/** Fetch and validate a single registry item by name from a base URL. */
export async function fetchRegistryItem(
  baseUrl: string,
  name: string,
  options?: FetchOptions,
): Promise<RegistryItem> {
  const fetchImpl = resolveFetch(options);
  const res = await fetchImpl(itemUrl(baseUrl, name));
  if (!res.ok) {
    throw new Error(`Registry item "${name}" not found (${res.status}).`);
  }
  return registryItemSchema.parse(await res.json());
}

/** A resolved registry item paired with the canonical URL it was fetched from. */
export interface ResolvedItem {
  item: RegistryItem;
  /** Canonical URL the item came from — its origin, recorded for upgrade. */
  url: string;
}

/**
 * Resolve an item and all of its transitive `registryDependencies` into a flat,
 * de-duplicated, install-ordered list (dependencies before dependents), each
 * paired with the canonical URL it was fetched from.
 *
 * Each `registryDependencies` entry — and each root in `names` — may be either:
 *
 *  - a **name** (`"button"`), resolved against the registry the *referencing*
 *    item came from, or
 *  - an **absolute URL** (`"https://ui.ibird.dev/r/button.json"`), fetched
 *    directly from another registry.
 *
 * This is what lets a block on one registry depend on primitives on another
 * without inlining a copy: the primitive is referenced, deduplicated, and stays
 * independently upgradeable. A cross-registry item's own name-based deps resolve
 * against *its* origin, not the root base URL. The paired `url` is what the
 * installer records so `upgrade` can re-fetch each item from where it came from.
 *
 * De-duplication runs on two levels: the canonical fetch URL (so a diamond is
 * fetched once and cycles are detected), and the resolved `item.name` (so the
 * same component referenced by name here and by URL there is emitted once).
 */
export async function resolveItemTreeWithOrigin(
  baseUrl: string,
  names: string[],
  options?: FetchOptions,
): Promise<ResolvedItem[]> {
  const rootBase = normalizeBaseUrl(baseUrl);
  const fetched = new Map<string, RegistryItem>(); // canonical URL -> item
  const emitted = new Set<string>(); // item.name already pushed
  const ordered: ResolvedItem[] = [];

  async function visit(ref: string, fromBase: string, stack: string[]): Promise<void> {
    const absolute = isAbsoluteUrl(ref);
    const url = absolute ? ref : itemUrl(fromBase, ref);
    if (stack.includes(url)) {
      throw new Error(`Circular registry dependency: ${[...stack, url].join(' -> ')}`);
    }
    if (fetched.has(url)) return;
    const item = absolute
      ? await fetchRegistryItemByUrl(url, options)
      : await fetchRegistryItem(fromBase, ref, options);
    fetched.set(url, item);
    // A cross-registry item's local deps resolve against its own origin.
    const childBase = absolute ? baseUrlFromItemUrl(url) : fromBase;
    for (const dep of item.registryDependencies) {
      await visit(dep, childBase, [...stack, url]);
    }
    if (!emitted.has(item.name)) {
      emitted.add(item.name);
      ordered.push({ item, url });
    }
  }

  for (const name of names) {
    await visit(name, rootBase, []);
  }
  return ordered;
}

/**
 * Like {@link resolveItemTreeWithOrigin} but returns just the items, dropping
 * the per-item origin URL. Kept for callers that don't need to record origin.
 */
export async function resolveItemTree(
  baseUrl: string,
  names: string[],
  options?: FetchOptions,
): Promise<RegistryItem[]> {
  const resolved = await resolveItemTreeWithOrigin(baseUrl, names, options);
  return resolved.map((r) => r.item);
}
