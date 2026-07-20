import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { hashContent } from 'ibirdui-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCKFILE_NAME, type LockedItem, type Lockfile } from '../lockfile.js';
import { upgrade, upgradeOrigin } from './upgrade.js';

const BASE = 'https://ui.ibird.dev';

function locked(partial: Partial<LockedItem> = {}): LockedItem {
  return { version: '1.0.0', files: {}, ...partial };
}

describe('upgradeOrigin', () => {
  it('uses the recorded origin when present', () => {
    const item = locked({ origin: 'https://blocks.ibird.dev/r/pricing.json' });
    expect(upgradeOrigin(item, BASE, 'pricing')).toBe('https://blocks.ibird.dev/r/pricing.json');
  });

  it('derives the URL from the base by name for legacy lockfiles (no origin)', () => {
    expect(upgradeOrigin(locked(), BASE, 'button')).toBe('https://ui.ibird.dev/r/button.json');
  });

  it('keeps a cross-registry item pointed at its own registry, not the base', () => {
    // Same lockfile, two items from different registries: each upgrades from its
    // own origin. The block must not be re-fetched from the primitives' base.
    const primitive = locked({ origin: 'https://ui.ibird.dev/r/button.json' });
    const block = locked({ origin: 'https://blocks.ibird.dev/r/pricing.json' });
    expect(upgradeOrigin(primitive, BASE, 'button')).toContain('ui.ibird.dev');
    expect(upgradeOrigin(block, BASE, 'pricing')).toContain('blocks.ibird.dev');
  });
});

/**
 * Integration tests drive the real `upgrade()` against a `file://` registry in a
 * temp dir, exercising the whole 3-way merge / dependency / deletion logic.
 */
describe('upgrade', () => {
  let reg: string; // registry dir (served as file://)
  let proj: string; // consumer project dir (cwd)

  beforeEach(() => {
    process.exitCode = 0;
    reg = mkdtempSync(join(tmpdir(), 'ibirdui-reg-'));
    proj = mkdtempSync(join(tmpdir(), 'ibirdui-proj-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = 0;
    rmSync(reg, { recursive: true, force: true });
    rmSync(proj, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  const regUrl = () => `file://${reg}`;
  const originOf = (name: string) => `${regUrl()}/r/${name}.json`;

  interface FileSpec {
    path: string;
    content: string;
  }
  interface PublishOpts {
    registryDependencies?: string[];
    dependencies?: string[];
  }

  /** Publish an item to the fake registry as `r/<name>.json`. */
  async function publish(name: string, version: string, files: FileSpec[], opts: PublishOpts = {}) {
    const item = {
      name,
      type: 'component',
      version,
      states: [],
      dependencies: opts.dependencies ?? [],
      devDependencies: [],
      registryDependencies: opts.registryDependencies ?? [],
      files: files.map((f) => ({
        path: f.path,
        content: f.content,
        type: 'component',
        hash: hashContent(f.content),
      })),
    };
    await mkdir(join(reg, 'r'), { recursive: true });
    await writeFile(join(reg, 'r', `${name}.json`), JSON.stringify(item));
  }

  /** Write files into the project and return the lock entry a prior `add` would have. */
  async function install(name: string, version: string, files: FileSpec[]): Promise<LockedItem> {
    const lockFiles: Record<string, string> = {};
    for (const f of files) {
      await mkdir(dirname(join(proj, f.path)), { recursive: true });
      await writeFile(join(proj, f.path), f.content);
      lockFiles[f.path] = hashContent(f.content);
    }
    return { version, origin: originOf(name), files: lockFiles };
  }

  async function writeLock(items: Record<string, LockedItem>) {
    const lock: Lockfile = { registry: regUrl(), baseDir: '.', items };
    await writeFile(join(proj, LOCKFILE_NAME), JSON.stringify(lock, null, 2));
  }

  async function readLock(): Promise<Lockfile> {
    return JSON.parse(await readFile(join(proj, LOCKFILE_NAME), 'utf8'));
  }

  const onDisk = (p: string) => readFile(join(proj, p), 'utf8');
  const run = (names: string[]) => upgrade(names, { registry: regUrl(), cwd: proj });

  it('updates an untouched file in place and advances the lock', async () => {
    await publish('button', '2.0.0', [{ path: 'components/button.tsx', content: 'v2' }]);
    await writeLock({
      button: await install('button', '1.0.0', [{ path: 'components/button.tsx', content: 'v1' }]),
    });

    await run(['button']);

    expect(await onDisk('components/button.tsx')).toBe('v2');
    const lock = await readLock();
    expect(lock.items.button?.version).toBe('2.0.0');
    expect(lock.items.button?.files['components/button.tsx']).toBe(hashContent('v2'));
  });

  it('keeps a locally edited file, writes .new, and preserves the 3-way base hash', async () => {
    await publish('button', '2.0.0', [{ path: 'components/button.tsx', content: 'v2' }]);
    const entry = await install('button', '1.0.0', [
      { path: 'components/button.tsx', content: 'v1' },
    ]);
    // User edits the file after install (lock still records the v1 hash as base).
    await writeFile(join(proj, 'components/button.tsx'), 'my local edit');
    await writeLock({ button: entry });

    await run(['button']);

    expect(await onDisk('components/button.tsx')).toBe('my local edit'); // theirs kept
    expect(await onDisk('components/button.tsx.new')).toBe('v2'); // upstream alongside
    const lock = await readLock();
    expect(lock.items.button?.version).toBe('2.0.0');
    // The base stays at the version the user actually has (v1), NOT the new v2 —
    // otherwise every later upgrade re-conflicts against a version never accepted.
    expect(lock.items.button?.files['components/button.tsx']).toBe(hashContent('v1'));
    expect(lock.items.button?.files['components/button.tsx']).not.toBe(hashContent('v2'));
  });

  it('pulls in a registry dependency added by the new version', async () => {
    await publish('icon', '1.0.0', [{ path: 'components/icon.tsx', content: 'icon' }]);
    await publish('button', '2.0.0', [{ path: 'components/button.tsx', content: 'v2' }], {
      registryDependencies: ['icon'],
    });
    await writeLock({
      button: await install('button', '1.0.0', [{ path: 'components/button.tsx', content: 'v1' }]),
    });

    await run(['button']);

    expect(await onDisk('components/icon.tsx')).toBe('icon'); // new dep written to disk
    const lock = await readLock();
    expect(lock.items.icon?.version).toBe('1.0.0'); // and recorded
    expect(lock.items.button?.version).toBe('2.0.0');
  });

  it('deletes a file the new version dropped, and removes it from the lock', async () => {
    await publish('button', '2.0.0', [{ path: 'components/button.tsx', content: 'v2' }]);
    await writeLock({
      button: await install('button', '1.0.0', [
        { path: 'components/button.tsx', content: 'v1' },
        { path: 'components/legacy.tsx', content: 'old' },
      ]),
    });

    await run(['button']);

    expect(existsSync(join(proj, 'components/legacy.tsx'))).toBe(false); // orphan removed
    const lock = await readLock();
    expect(lock.items.button?.files['components/legacy.tsx']).toBeUndefined();
    expect(lock.items.button?.files['components/button.tsx']).toBe(hashContent('v2'));
  });

  it('keeps a dropped file the user edited instead of deleting it', async () => {
    await publish('button', '2.0.0', [{ path: 'components/button.tsx', content: 'v2' }]);
    const entry = await install('button', '1.0.0', [
      { path: 'components/button.tsx', content: 'v1' },
      { path: 'components/legacy.tsx', content: 'old' },
    ]);
    await writeFile(join(proj, 'components/legacy.tsx'), 'i changed this'); // user edit
    await writeLock({ button: entry });

    await run(['button']);

    expect(existsSync(join(proj, 'components/legacy.tsx'))).toBe(true); // kept
    expect(await onDisk('components/legacy.tsx')).toBe('i changed this');
    const lock = await readLock();
    expect(lock.items.button?.files['components/legacy.tsx']).toBeUndefined(); // still dropped from lock
  });

  it('isolates an unreachable item so the rest still upgrade', async () => {
    await publish('alpha', '2.0.0', [{ path: 'components/alpha.tsx', content: 'a2' }]);
    // `beta` is installed but never published → its origin 404s.
    await writeLock({
      beta: await install('beta', '1.0.0', [{ path: 'components/beta.tsx', content: 'b1' }]),
      alpha: await install('alpha', '1.0.0', [{ path: 'components/alpha.tsx', content: 'a1' }]),
    });

    await run(['beta', 'alpha']); // beta first: its failure must not block alpha

    expect(await onDisk('components/alpha.tsx')).toBe('a2'); // alpha still upgraded
    expect(await onDisk('components/beta.tsx')).toBe('b1'); // beta untouched
    const lock = await readLock();
    expect(lock.items.alpha?.version).toBe('2.0.0');
    expect(lock.items.beta?.version).toBe('1.0.0');
    expect(process.exitCode).toBe(1); // failure signalled for CI
  });
});
