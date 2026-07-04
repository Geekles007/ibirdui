import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { normalizeItemRef, resolveItemTreeWithOrigin } from 'ibirdui-core';
import { bold, cyan, dim, green, red, yellow } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';
import { type Lockfile, readLockfile, recordItem, writeLockfile } from '../lockfile.js';
import {
  ROOT_BASE_DIR,
  detectBaseDir,
  displayPath,
  normalizeBaseDir,
  resolveTarget,
} from '../paths.js';

export interface AddOptions {
  registry?: string;
  cwd?: string;
  overwrite?: boolean;
  /** Force the source dir to install into (e.g. `src`); auto-detected otherwise. */
  dir?: string;
}

/**
 * Decide where files land and whether to announce it. Precedence:
 *   1. an explicit `--dir` flag                     → honour it
 *   2. a baseDir already pinned in the lockfile     → reuse it (stable installs)
 *   3. a pre-existing install with no baseDir        → root, for back-compat
 *   4. a fresh project                               → auto-detect the layout
 * The chosen dir is written back to the lockfile so upgrade/doctor agree.
 */
function resolveBaseDir(
  cwd: string,
  lock: Lockfile,
  flag: string | undefined,
): { baseDir: string; note: string } {
  if (flag !== undefined) return { baseDir: normalizeBaseDir(flag), note: dim(' (--dir)') };
  if (lock.baseDir !== undefined) return { baseDir: lock.baseDir, note: '' };
  if (Object.keys(lock.items).length > 0) return { baseDir: ROOT_BASE_DIR, note: '' };
  const detected = detectBaseDir(cwd);
  return { baseDir: detected, note: detected === ROOT_BASE_DIR ? '' : dim(' (detected)') };
}

export async function add(names: string[], options: AddOptions): Promise<void> {
  if (names.length === 0) {
    console.error(red('Specify at least one item to add.'));
    process.exitCode = 1;
    return;
  }

  const baseUrl = resolveRegistry(options.registry);
  const cwd = resolve(options.cwd ?? process.cwd());

  console.log(dim(`Registry: ${baseUrl}`));

  // Accept bare names ("button") or registry paths/URLs
  // ("blocks.ibird.dev/r/hero", "https://…/r/hero.json") as roots.
  const roots = names.map(normalizeItemRef);
  const tree = await resolveItemTreeWithOrigin(baseUrl, roots, { fetch: nodeFetch });
  const lock = await readLockfile(cwd, baseUrl);

  const { baseDir, note } = resolveBaseDir(cwd, lock, options.dir);
  lock.baseDir = baseDir;
  if (baseDir !== ROOT_BASE_DIR) console.log(dim(`Installing into ${baseDir}/`) + note);

  const npmDeps = new Set<string>();
  const npmDevDeps = new Set<string>();
  let written = 0;
  let skipped = 0;

  for (const { item, url } of tree) {
    for (const dep of item.dependencies) npmDeps.add(dep);
    for (const dep of item.devDependencies) npmDevDeps.add(dep);

    let itemWritten = false;
    for (const file of item.files) {
      const target = resolveTarget(cwd, baseDir, file.path);
      const shown = displayPath(baseDir, file.path);
      if (existsSync(target) && !options.overwrite) {
        console.log(`${yellow('skip')} ${shown} ${dim('(exists)')}`);
        skipped += 1;
        continue;
      }
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.content);
      console.log(`${green('add ')} ${shown}`);
      written += 1;
      itemWritten = true;
    }
    // Track what we installed — version, per-file hashes, and the origin URL —
    // so `ibirdui upgrade` can detect local edits and re-fetch from the right
    // registry later.
    if (itemWritten || !lock.items[item.name]) recordItem(lock, item, url);
  }

  await writeLockfile(cwd, lock);

  const skippedNote = skipped ? `, ${skipped} skipped (use --overwrite)` : '';
  console.log(`\n${bold('Done.')} ${written} file(s) written${skippedNote}.`);

  if (npmDeps.size || npmDevDeps.size) {
    console.log(`\n${bold('Install the required dependencies:')}`);
    if (npmDeps.size) {
      console.log(cyan(`  npm install ${[...npmDeps].join(' ')}`));
    }
    if (npmDevDeps.size) {
      console.log(cyan(`  npm install -D ${[...npmDevDeps].join(' ')}`));
    }
  }
}
