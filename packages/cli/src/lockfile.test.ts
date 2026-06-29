import { type RegistryItem, registryItemSchema } from 'ibirdui-core';
import { describe, expect, it } from 'vitest';
import { type LockedItem, type Lockfile, recordItem } from './lockfile.js';

function makeItem(partial: Partial<RegistryItem> & { name: string }): RegistryItem {
  return registryItemSchema.parse({
    files: [{ path: `components/${partial.name}.tsx`, content: '// noop\n' }],
    ...partial,
  });
}

function emptyLock(): Lockfile {
  return { registry: 'https://ui.ibird.dev', items: {} };
}

/** Grab a recorded item, failing the test if it wasn't recorded at all. */
function recorded(lock: Lockfile, name: string): LockedItem {
  const item = lock.items[name];
  if (!item) throw new Error(`expected "${name}" to be recorded`);
  return item;
}

describe('recordItem', () => {
  it('stores version, origin and per-file hashes when an origin is given', () => {
    const lock = emptyLock();
    recordItem(
      lock,
      makeItem({ name: 'button', version: '1.2.0' }),
      'https://ui.ibird.dev/r/button.json',
    );

    const locked = recorded(lock, 'button');
    expect(locked.version).toBe('1.2.0');
    expect(locked.origin).toBe('https://ui.ibird.dev/r/button.json');
    expect(Object.keys(locked.files)).toEqual(['components/button.tsx']);
  });

  it('omits origin entirely when none is given (back-compat)', () => {
    const lock = emptyLock();
    recordItem(lock, makeItem({ name: 'card' }));

    const locked = recorded(lock, 'card');
    expect(locked.origin).toBeUndefined();
    expect('origin' in locked).toBe(false);
  });

  it('records a cross-registry origin distinct from the lockfile base', () => {
    const lock = emptyLock(); // base is ui.ibird.dev
    recordItem(lock, makeItem({ name: 'pricing' }), 'https://blocks.ibird.dev/r/pricing.json');

    expect(recorded(lock, 'pricing').origin).toBe('https://blocks.ibird.dev/r/pricing.json');
  });
});
