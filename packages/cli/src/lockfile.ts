import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RegistryItem } from 'ibirdui-core';
import { hashContent } from 'ibirdui-core';

export const LOCKFILE_NAME = 'ibirdui.lock.json';

/** One installed item: the version pinned and the hash of each file we wrote. */
export interface LockedItem {
  version: string;
  /**
   * Canonical URL the item was fetched from — its upgrade origin. Lets a block
   * pulled from one registry and a primitive pulled from another both upgrade
   * against the right source. Optional for back-compat with lockfiles written
   * before multi-origin support; `upgrade` falls back to the top-level
   * `registry` base when it's absent.
   */
  origin?: string;
  files: Record<string, string>;
}

export interface Lockfile {
  $schema?: string;
  registry: string;
  /**
   * Source root that registry files are written under: `'.'` for the repo root
   * (the default), `'src'` for a src-based layout (TanStack Start, src-based
   * Next/Vite). Chosen once at first `add` and reused by `upgrade`/`doctor` so
   * every command resolves the same on-disk paths. Optional for back-compat:
   * lockfiles written before this field are treated as root (`'.'`).
   */
  baseDir?: string;
  items: Record<string, LockedItem>;
}

function emptyLock(registry: string): Lockfile {
  return {
    $schema: 'https://ibirdui/schema/lockfile.json',
    registry,
    items: {},
  };
}

export async function readLockfile(cwd: string, registry: string): Promise<Lockfile> {
  const path = join(cwd, LOCKFILE_NAME);
  if (!existsSync(path)) return emptyLock(registry);
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as Lockfile;
    return { ...emptyLock(registry), ...parsed, items: parsed.items ?? {} };
  } catch {
    return emptyLock(registry);
  }
}

export async function writeLockfile(cwd: string, lock: Lockfile): Promise<void> {
  await writeFile(join(cwd, LOCKFILE_NAME), `${JSON.stringify(lock, null, 2)}\n`);
}

/**
 * Record an installed item's version, origin and per-file fingerprints. Pass
 * `origin` (the canonical URL the item came from) so `upgrade` can re-fetch it
 * from the right registry; omit it for same-registry items written the old way.
 */
export function recordItem(lock: Lockfile, item: RegistryItem, origin?: string): void {
  const files: Record<string, string> = {};
  for (const file of item.files) {
    files[file.path] = file.hash ?? hashContent(file.content);
  }
  lock.items[item.name] = { version: item.version, ...(origin ? { origin } : {}), files };
}
