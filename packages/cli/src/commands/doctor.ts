import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { type RegistryIndex, fetchRegistryIndex, hashContent } from 'ibirdui-core';
import { bold, cyan, dim, green, red, yellow } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';
import { type LockedItem, readLockfile } from '../lockfile.js';

export interface DoctorOptions {
  registry?: string;
  cwd?: string;
  /** Skip the registry round-trip and only diff disk against the lockfile. */
  offline?: boolean;
}

/** How an installed file compares to the version recorded in the lockfile. */
export type FileDiffState = 'clean' | 'modified' | 'missing';

export interface FileReport {
  path: string;
  state: FileDiffState;
}

export interface ItemReport {
  name: string;
  /** Version pinned in the lockfile. */
  version: string;
  /** Newest version the registry advertises, or `null` when not checked/found. */
  latest: string | null;
  files: FileReport[];
}

/**
 * Pure disk-vs-lock comparison for a single file. `current` is the on-disk
 * content, or `null` when the file is gone. Modified means the user (or
 * something) changed it since `add`/`upgrade` last wrote it.
 */
export function diffFile(lockedHash: string, current: string | null): FileDiffState {
  if (current === null) return 'missing';
  return hashContent(current) === lockedHash ? 'clean' : 'modified';
}

/** True when the registry advertises a version different from the pinned one. */
export function isOutdated(report: ItemReport): boolean {
  return report.latest !== null && report.latest !== report.version;
}

export interface DoctorSummary {
  items: number;
  clean: number;
  modified: number;
  missing: number;
  outdated: number;
}

/** Roll a set of item reports up into the one-line tally doctor prints. */
export function summarize(reports: ItemReport[]): DoctorSummary {
  const summary: DoctorSummary = {
    items: reports.length,
    clean: 0,
    modified: 0,
    missing: 0,
    outdated: 0,
  };
  for (const report of reports) {
    if (isOutdated(report)) summary.outdated += 1;
    let touched = false;
    for (const file of report.files) {
      if (file.state === 'missing') summary.missing += 1;
      else if (file.state === 'modified') summary.modified += 1;
      if (file.state !== 'clean') touched = true;
    }
    if (!touched) summary.clean += 1;
  }
  return summary;
}

/** Build one item's report by reading its locked files off disk. */
async function inspectItem(
  cwd: string,
  name: string,
  locked: LockedItem,
  index: RegistryIndex | null,
): Promise<ItemReport> {
  const files: FileReport[] = [];
  for (const [path, lockedHash] of Object.entries(locked.files)) {
    let current: string | null;
    try {
      current = await readFile(join(cwd, path), 'utf8');
    } catch {
      current = null;
    }
    files.push({ path, state: diffFile(lockedHash, current) });
  }
  const latest = index?.items.find((entry) => entry.name === name)?.version ?? null;
  return { name, version: locked.version, latest, files };
}

const STATE_LABEL: Record<FileDiffState, string> = {
  clean: green('clean   '),
  modified: yellow('modified'),
  missing: red('missing '),
};

/**
 * Read-only health check for an installed project. Uses the per-file hashes the
 * registry build already computed (recorded in `ibirdui.lock.json` at install
 * time) to find bricks you've edited locally or that have drifted, and — unless
 * `--offline` — checks the registry for newer versions. Nothing is written; it
 * just tells you what `ibirdui upgrade` would touch.
 */
export async function doctor(options: DoctorOptions): Promise<void> {
  const baseUrl = resolveRegistry(options.registry);
  const cwd = resolve(options.cwd ?? process.cwd());
  const lock = await readLockfile(cwd, baseUrl);

  const names = Object.keys(lock.items);
  if (names.length === 0) {
    console.log(yellow('Nothing installed yet. Run `ibirdui add <item>` first.'));
    return;
  }

  // One index fetch covers every item's latest version. Failure is non-fatal:
  // doctor still reports local edits offline.
  let index: RegistryIndex | null = null;
  if (!options.offline) {
    try {
      index = await fetchRegistryIndex(baseUrl, { fetch: nodeFetch });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.log(yellow(`Couldn't reach the registry (${reason}). Checking local files only.\n`));
    }
  }

  if (index) console.log(dim(`Registry: ${baseUrl}\n`));

  const reports: ItemReport[] = [];
  for (const [name, locked] of Object.entries(lock.items)) {
    reports.push(await inspectItem(cwd, name, locked, index));
  }

  for (const report of reports.sort((a, b) => a.name.localeCompare(b.name))) {
    // Only assert a version verdict when we actually consulted the registry.
    const tag = !index
      ? ''
      : isOutdated(report)
        ? ` ${cyan(`update available → ${report.latest}`)}`
        : report.latest === null
          ? ` ${dim('(not in registry)')}`
          : ` ${dim('up to date')}`;
    console.log(`${bold(report.name)}@${report.version}${tag}`);
    for (const file of report.files) {
      if (file.state === 'clean') continue; // only surface what needs attention
      console.log(`  ${STATE_LABEL[file.state]} ${file.path}`);
    }
  }

  const summary = summarize(reports);
  const parts = [
    `${summary.items} item(s)`,
    summary.modified ? yellow(`${summary.modified} modified`) : null,
    summary.missing ? red(`${summary.missing} missing`) : null,
    summary.outdated ? cyan(`${summary.outdated} update(s) available`) : null,
  ].filter(Boolean);

  const allClean = summary.modified === 0 && summary.missing === 0 && summary.outdated === 0;
  console.log(`\n${bold('Summary:')} ${parts.join(' · ')}`);

  if (allClean) {
    console.log(green('Everything is in sync. ✔'));
  } else if (summary.outdated > 0) {
    console.log(cyan('\nRun `ibirdui upgrade` to update (your local edits are preserved).'));
  }

  // A missing file is a genuinely broken install — make that visible to CI.
  if (summary.missing > 0) process.exitCode = 1;
}
