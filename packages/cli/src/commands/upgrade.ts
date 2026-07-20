import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { type RegistryItem, hashContent, itemUrl, resolveItemTreeWithOrigin } from 'ibirdui-core';
import { bold, cyan, dim, green, red, yellow } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';
import { type LockedItem, type Lockfile, readLockfile, writeLockfile } from '../lockfile.js';
import { ROOT_BASE_DIR, displayPath, resolveTarget } from '../paths.js';

export interface UpgradeOptions {
  registry?: string;
  cwd?: string;
}

/**
 * The URL to re-fetch an installed item from on upgrade. Prefers the origin
 * recorded at install time (so cross-registry items go back to their own
 * registry); falls back to deriving it from the base URL by name for lockfiles
 * written before multi-origin support.
 */
export function upgradeOrigin(locked: LockedItem, baseUrl: string, name: string): string {
  return locked.origin ?? itemUrl(baseUrl, name);
}

const msg = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Running tally for the summary line and exit code. */
interface UpgradeStats {
  /** Existing items whose version advanced. */
  updated: number;
  /** Items pulled in fresh because a new version added them as a dependency. */
  newDeps: number;
  /** Files kept as the user's, with the upstream version dropped alongside as `.new`. */
  conflicts: number;
  /** Files deleted because they were removed from the item upstream. */
  removed: number;
  /** Items already at the latest version. */
  upToDate: number;
  /** Targets/items that errored (network, disk, …). */
  failed: number;
}

/**
 * The feature copy-paste libraries don't have: bring installed items up to date
 * while preserving local edits — now dependency- and deletion-aware.
 *
 * For each **target** we resolve its full dependency tree from the origin it was
 * installed from (isolated, so one unreachable item can't abort the rest). A new
 * version that adds a registry dependency pulls the new item in; new npm packages
 * are surfaced like `add`.
 *
 * For each **file** we compare three fingerprints — the version we originally
 * wrote (the lockfile's per-file hash), what's on disk now, and the new upstream
 * version:
 *
 *  - on-disk matches the lock  → untouched by the user, safe to overwrite
 *  - on-disk already equals new → nothing to do
 *  - on-disk differs from both  → locally edited: keep theirs, drop a `.new` file
 *    next to it, and **keep the previous hash as the 3-way base** so a later
 *    upgrade doesn't re-conflict against a version the user never had.
 *
 * Files an item drops upstream are deleted from disk (unless the user edited
 * them) and from the lockfile, instead of being orphaned.
 */
export async function upgrade(names: string[], options: UpgradeOptions): Promise<void> {
  const baseUrl = resolveRegistry(options.registry);
  const cwd = resolve(options.cwd ?? process.cwd());
  const lock = await readLockfile(cwd, baseUrl);
  const baseDir = lock.baseDir ?? ROOT_BASE_DIR;

  const requested = names.length > 0 ? names : Object.keys(lock.items);
  if (requested.length === 0) {
    console.log(yellow('Nothing installed yet. Run `ibirdui add <item>` first.'));
    return;
  }

  // Only items we actually installed can be upgraded; flag unknown names.
  const targets = requested.filter((name) => {
    if (lock.items[name]) return true;
    console.log(`${yellow('skip')} ${name} ${dim('(not in lockfile — use `add`)')}`);
    return false;
  });
  if (targets.length === 0) return;

  console.log(dim(`Registry: ${baseUrl}\n`));

  const stats: UpgradeStats = {
    updated: 0,
    newDeps: 0,
    conflicts: 0,
    removed: 0,
    upToDate: 0,
    failed: 0,
  };
  const npmDeps = new Set<string>();
  const npmDevDeps = new Set<string>();
  const processed = new Set<string>(); // item.name already handled — dedupe shared deps

  for (const name of targets) {
    const locked = lock.items[name];
    if (!locked) continue; // filtered above; keeps the type checker honest

    // Resolve each target's dependency tree from its own recorded origin, isolated
    // so one unreachable item can't abort the whole run.
    let tree: Awaited<ReturnType<typeof resolveItemTreeWithOrigin>>;
    try {
      const origin = upgradeOrigin(locked, baseUrl, name);
      tree = await resolveItemTreeWithOrigin(baseUrl, [origin], { fetch: nodeFetch });
    } catch (error) {
      console.log(`${red('fail')} ${name} ${dim(`(${msg(error)})`)}`);
      stats.failed += 1;
      continue;
    }

    for (const { item, url } of tree) {
      if (processed.has(item.name)) continue;
      processed.add(item.name);
      try {
        await upgradeItem({ item, url, lock, baseDir, cwd, stats, npmDeps, npmDevDeps });
      } catch (error) {
        console.log(`${red('fail')} ${item.name} ${dim(`(${msg(error)})`)}`);
        stats.failed += 1;
      }
    }
  }

  // Persist once, capturing every item that succeeded even if a later one threw.
  await writeLockfile(cwd, lock);

  printSummary(stats, npmDeps, npmDevDeps);

  // A genuine error (unreachable item, unwritable file) fails the run so CI notices.
  if (stats.failed > 0) process.exitCode = 1;
}

interface UpgradeItemContext {
  item: RegistryItem;
  url: string;
  lock: Lockfile;
  baseDir: string;
  cwd: string;
  stats: UpgradeStats;
  npmDeps: Set<string>;
  npmDevDeps: Set<string>;
}

/** Reconcile one resolved item against disk + lockfile. */
async function upgradeItem(ctx: UpgradeItemContext): Promise<void> {
  const { item, url, lock, baseDir, cwd, stats, npmDeps, npmDevDeps } = ctx;
  const locked = lock.items[item.name];
  const isNew = !locked;

  if (locked && item.version === locked.version) {
    console.log(`${dim('ok  ')} ${item.name}@${item.version} ${dim('(up to date)')}`);
    stats.upToDate += 1;
    return;
  }

  // A newer version may need new npm packages — surface them like `add` does.
  for (const dep of item.dependencies) npmDeps.add(dep);
  for (const dep of item.devDependencies) npmDevDeps.add(dep);

  if (isNew) {
    console.log(`${bold(item.name)} ${dim(`${item.version} (new dependency)`)}`);
    stats.newDeps += 1;
  } else {
    console.log(`${bold(item.name)} ${dim(`${locked.version} → ${item.version}`)}`);
    stats.updated += 1;
  }

  const prevFiles = locked?.files ?? {};
  const newFiles: Record<string, string> = {};

  for (const file of item.files) {
    const target = resolveTarget(cwd, baseDir, file.path);
    const shown = displayPath(baseDir, file.path);
    const newHash = file.hash ?? hashContent(file.content);
    const lockedHash = prevFiles[file.path];

    if (!existsSync(target)) {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.content);
      console.log(`  ${green('add ')} ${shown} ${dim('(new file)')}`);
      newFiles[file.path] = newHash;
      continue;
    }

    const currentHash = hashContent(await readFile(target, 'utf8'));
    if (currentHash === newHash) {
      console.log(`  ${dim('ok  ')} ${shown} ${dim('(already current)')}`);
      newFiles[file.path] = newHash;
    } else if (currentHash === lockedHash) {
      await writeFile(target, file.content);
      console.log(`  ${green('upd ')} ${shown}`);
      newFiles[file.path] = newHash;
    } else {
      // Locally edited AND upstream changed → keep theirs, write a `.new` sidecar.
      const sidecar = `${target}.new`;
      const replaced = existsSync(sidecar);
      await writeFile(sidecar, file.content);
      console.log(
        `  ${red('conflict')} ${shown} ${dim(`→ wrote ${shown}.new${replaced ? ' (replaced)' : ''}`)}`,
      );
      stats.conflicts += 1;
      // Keep the previous locked hash as the 3-way base. Advancing it to the new
      // hash would make every later upgrade re-conflict against a version the user
      // never accepted. Fall back to the new hash only when there's no prior base.
      newFiles[file.path] = lockedHash ?? newHash;
    }
  }

  // Delete files present before but dropped from the new version — but never a
  // file the user has edited (that becomes a warning, not a silent deletion).
  const newPaths = new Set(item.files.map((f) => f.path));
  for (const [oldPath, oldHash] of Object.entries(prevFiles)) {
    if (newPaths.has(oldPath)) continue;
    const target = resolveTarget(cwd, baseDir, oldPath);
    const shown = displayPath(baseDir, oldPath);
    if (!existsSync(target)) {
      stats.removed += 1;
      continue;
    }
    const currentHash = hashContent(await readFile(target, 'utf8'));
    if (currentHash === oldHash) {
      await rm(target, { force: true });
      console.log(`  ${yellow('del ')} ${shown} ${dim('(removed upstream)')}`);
      stats.removed += 1;
    } else {
      console.log(`  ${yellow('kept')} ${shown} ${dim('(removed upstream but locally modified)')}`);
    }
  }

  // Record the new version + origin with the per-file base hashes decided above
  // (conflicted files keep their old base; dropped files fall out of the map).
  lock.items[item.name] = {
    version: item.version,
    ...(url ? { origin: url } : {}),
    files: newFiles,
  };
}

function printSummary(stats: UpgradeStats, npmDeps: Set<string>, npmDevDeps: Set<string>): void {
  const parts = [
    `${stats.updated} updated`,
    stats.newDeps ? `${stats.newDeps} new dep(s)` : null,
    stats.conflicts ? yellow(`${stats.conflicts} conflict(s)`) : null,
    stats.removed ? `${stats.removed} removed` : null,
    `${stats.upToDate} up to date`,
    stats.failed ? red(`${stats.failed} failed`) : null,
  ].filter(Boolean);
  console.log(`\n${bold('Done.')} ${parts.join(', ')}.`);

  if (npmDeps.size || npmDevDeps.size) {
    console.log(`\n${bold('Install any new dependencies:')}`);
    if (npmDeps.size) console.log(cyan(`  npm install ${[...npmDeps].join(' ')}`));
    if (npmDevDeps.size) console.log(cyan(`  npm install -D ${[...npmDevDeps].join(' ')}`));
  }
  if (stats.conflicts > 0) {
    console.log(
      cyan(
        '\nResolve conflicts by merging each *.new into your edited file, then delete the *.new.',
      ),
    );
  }
}
