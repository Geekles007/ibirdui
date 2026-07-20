import type { RegistryIndexEntry } from 'ibirdui-core';
import { describe, expect, it } from 'vitest';
import { rankEntries } from './search.js';

function entry(partial: Partial<RegistryIndexEntry> & { name: string }): RegistryIndexEntry {
  return {
    name: partial.name,
    type: partial.type ?? 'component',
    description: partial.description,
    version: partial.version ?? '1.0.0',
    states: partial.states ?? [],
    a11yLevel: partial.a11yLevel,
    intents: partial.intents ?? [],
  };
}

const asyncButton = entry({
  name: 'async-button',
  description: 'A button that owns its own pending and error state.',
  states: ['loading', 'error'],
  intents: ['a button with a built-in loading and error state', 'a submit button'],
});
const dataTable = entry({
  name: 'data-table',
  description: 'A sortable table over an AsyncState.',
  states: ['loading', 'empty', 'error'],
  intents: ['a sortable data table', 'a table with loading and empty states'],
});
const avatar = entry({
  name: 'avatar',
  description: 'A profile image that falls back to initials.',
  intents: ['a user avatar with an image fallback'],
});
const catalog: RegistryIndexEntry[] = [asyncButton, dataTable, avatar];

describe('rankEntries', () => {
  it('orders by relevance and drops non-matches', () => {
    const ranked = rankEntries(catalog, 'a sortable table with an empty state');
    expect(ranked[0]?.entry.name).toBe('data-table');
    expect(ranked.every((r) => r.score > 0)).toBe(true);
    expect(ranked.map((r) => r.entry.name)).not.toContain('avatar');
  });

  it('respects the limit', () => {
    const ranked = rankEntries(catalog, 'button table avatar state', 2);
    expect(ranked).toHaveLength(2);
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(rankEntries(catalog, 'blockchain')).toEqual([]);
  });
});
