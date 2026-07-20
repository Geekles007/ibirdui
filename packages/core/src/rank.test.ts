import { describe, expect, it } from 'vitest';
import { type Rankable, rankBySearch, searchTokens } from './index.js';

function item(partial: Partial<Rankable> & { name: string }): Rankable {
  return { intents: [], states: [], ...partial };
}

const asyncButton = item({
  name: 'async-button',
  description: 'A button that owns its own pending and error state.',
  states: ['loading', 'error'],
  intents: ['a button with a built-in loading and error state', 'a submit button'],
});
const dataTable = item({
  name: 'data-table',
  description: 'A sortable table over an AsyncState.',
  states: ['loading', 'empty', 'error'],
  intents: ['a sortable data table', 'a table with loading and empty states'],
});
const avatar = item({
  name: 'avatar',
  description: 'A profile image that falls back to initials.',
  intents: ['a user avatar with an image fallback'],
});
const confirmDialog = item({
  name: 'confirm-dialog',
  intents: ['an "are you sure?" confirmation dialog'],
});
const catalog = [asyncButton, dataTable, avatar, confirmDialog];

describe('searchTokens', () => {
  it('drops stop words, single chars, and duplicates', () => {
    expect(searchTokens('a sortable table with an empty state')).toEqual([
      'sortable',
      'table',
      'empty',
      'state',
    ]);
    expect(searchTokens('a table and a table')).toEqual(['table']);
  });
});

describe('rankBySearch', () => {
  it('ranks the most relevant item first and drops non-matches', () => {
    const ranked = rankBySearch(catalog, 'a sortable table with an empty state');
    expect(ranked[0]?.item.name).toBe('data-table');
    expect(ranked.map((r) => r.item.name)).not.toContain('avatar');
  });

  it('matches whole words only, so "on" does not hit "confirm"', () => {
    // Substring matching used to score `confirm-dialog` for the token "on".
    const ranked = rankBySearch(catalog, 'on');
    expect(ranked.map((r) => r.item.name)).not.toContain('confirm-dialog');
  });

  it('weights an exact name match above a mere description hit', () => {
    const ranked = rankBySearch(catalog, 'avatar');
    expect(ranked[0]?.item.name).toBe('avatar');
  });

  it('ignores stop words so a verbose prompt is not all noise', () => {
    // Only stop words + single chars → nothing meaningful to match.
    expect(rankBySearch(catalog, 'i want to build an app with the')).toEqual([]);
  });

  it('respects the result limit', () => {
    expect(rankBySearch(catalog, 'button table avatar dialog', 2)).toHaveLength(2);
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(rankBySearch(catalog, 'blockchain')).toEqual([]);
  });
});
