import { describe, expect, it } from 'vitest';
import type { LockedItem } from '../lockfile.js';
import { upgradeOrigin } from './upgrade.js';

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
