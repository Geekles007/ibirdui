import { describe, expect, it } from 'vitest';
import {
  type RegistryItem,
  fetchRegistryItem,
  indexUrl,
  itemUrl,
  normalizeBaseUrl,
  registryItemSchema,
  resolveItemTree,
  resolveItemTreeWithOrigin,
} from './index.js';

function makeItem(partial: Partial<RegistryItem> & { name: string }): RegistryItem {
  return registryItemSchema.parse({
    files: [{ path: `src/${partial.name}.ts`, content: '// noop\n' }],
    ...partial,
  });
}

/** Build a fake fetch backed by an in-memory registry. */
function fakeFetch(items: Record<string, RegistryItem>) {
  return async (input: string) => {
    const match = input.match(/\/r\/(.+)\.json$/);
    const name = match?.[1];
    const item = name ? items[name] : undefined;
    return {
      ok: Boolean(item),
      status: item ? 200 : 404,
      json: async () => item,
    };
  };
}

describe('url helpers', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizeBaseUrl('https://x.dev///')).toBe('https://x.dev');
  });

  it('builds index and item urls', () => {
    expect(indexUrl('https://x.dev')).toBe('https://x.dev/r/index.json');
    expect(itemUrl('https://x.dev/', 'button')).toBe('https://x.dev/r/button.json');
  });
});

describe('schema defaults', () => {
  it('fills empty dependency arrays', () => {
    const item = makeItem({ name: 'button' });
    expect(item.dependencies).toEqual([]);
    expect(item.registryDependencies).toEqual([]);
    expect(item.files[0]?.type).toBe('file');
  });
});

describe('fetchRegistryItem', () => {
  it('throws on a missing item', async () => {
    const fetch = fakeFetch({});
    await expect(fetchRegistryItem('https://x.dev', 'nope', { fetch })).rejects.toThrow(
      /not found/,
    );
  });
});

describe('resolveItemTree', () => {
  it('orders dependencies before dependents and de-duplicates', async () => {
    const items = {
      utils: makeItem({ name: 'utils' }),
      button: makeItem({ name: 'button', registryDependencies: ['utils'] }),
      card: makeItem({ name: 'card', registryDependencies: ['utils', 'button'] }),
    };
    const tree = await resolveItemTree('https://x.dev', ['card'], {
      fetch: fakeFetch(items),
    });
    expect(tree.map((i) => i.name)).toEqual(['utils', 'button', 'card']);
  });

  it('detects circular dependencies', async () => {
    const items = {
      a: makeItem({ name: 'a', registryDependencies: ['b'] }),
      b: makeItem({ name: 'b', registryDependencies: ['a'] }),
    };
    await expect(
      resolveItemTree('https://x.dev', ['a'], { fetch: fakeFetch(items) }),
    ).rejects.toThrow(/Circular/);
  });
});

/** A fake fetch backed by an in-memory registry keyed by full canonical URL. */
function urlFetch(items: Record<string, RegistryItem>) {
  return async (input: string) => {
    const item = items[input];
    return {
      ok: Boolean(item),
      status: item ? 200 : 404,
      json: async () => item,
    };
  };
}

describe('resolveItemTree (cross-registry)', () => {
  const UI = 'https://ui.ibird.dev';
  const BLOCKS = 'https://blocks.ibird.dev';

  it('follows an absolute-URL dependency into another registry', async () => {
    // pricing (blocks) → card (ui, by URL) → button (ui, by local name). The
    // local "button" must resolve against UI, not the blocks root base.
    const items = {
      [`${UI}/r/button.json`]: makeItem({ name: 'button' }),
      [`${UI}/r/card.json`]: makeItem({ name: 'card', registryDependencies: ['button'] }),
      [`${BLOCKS}/r/pricing.json`]: makeItem({
        name: 'pricing',
        registryDependencies: [`${UI}/r/card.json`],
      }),
    };
    const tree = await resolveItemTree(BLOCKS, ['pricing'], { fetch: urlFetch(items) });
    expect(tree.map((i) => i.name)).toEqual(['button', 'card', 'pricing']);
  });

  it('de-duplicates a primitive referenced by both URL and local name', async () => {
    // pricing depends on button (by URL) AND card (by URL); card also depends on
    // button (by local name). Same canonical URL → button is emitted once.
    const items = {
      [`${UI}/r/button.json`]: makeItem({ name: 'button' }),
      [`${UI}/r/card.json`]: makeItem({ name: 'card', registryDependencies: ['button'] }),
      [`${BLOCKS}/r/pricing.json`]: makeItem({
        name: 'pricing',
        registryDependencies: [`${UI}/r/button.json`, `${UI}/r/card.json`],
      }),
    };
    const tree = await resolveItemTree(BLOCKS, ['pricing'], { fetch: urlFetch(items) });
    expect(tree.map((i) => i.name)).toEqual(['button', 'card', 'pricing']);
  });

  it('accepts an absolute URL as a root', async () => {
    const items = {
      [`${UI}/r/button.json`]: makeItem({ name: 'button' }),
      [`${UI}/r/card.json`]: makeItem({ name: 'card', registryDependencies: ['button'] }),
    };
    const tree = await resolveItemTree(BLOCKS, [`${UI}/r/card.json`], {
      fetch: urlFetch(items),
    });
    expect(tree.map((i) => i.name)).toEqual(['button', 'card']);
  });

  it('pairs each item with the canonical URL it was fetched from', async () => {
    // The block lives on BLOCKS; its primitives on UI. Each item's origin URL
    // is what the installer records so upgrade re-fetches from the right place.
    const items = {
      [`${UI}/r/button.json`]: makeItem({ name: 'button' }),
      [`${BLOCKS}/r/pricing.json`]: makeItem({
        name: 'pricing',
        registryDependencies: [`${UI}/r/button.json`],
      }),
    };
    const tree = await resolveItemTreeWithOrigin(BLOCKS, ['pricing'], {
      fetch: urlFetch(items),
    });
    expect(tree.map((r) => [r.item.name, r.url])).toEqual([
      ['button', `${UI}/r/button.json`],
      ['pricing', `${BLOCKS}/r/pricing.json`],
    ]);
  });
});
