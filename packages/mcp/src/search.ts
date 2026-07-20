import { type RegistryIndexEntry, rankBySearch } from 'ibirdui-core';

export interface ScoredEntry {
  entry: RegistryIndexEntry;
  score: number;
}

/**
 * Keyword-rank catalog entries against a plain-language query. A thin adapter
 * over the shared core ranker — deterministic keyword matching, not semantic
 * search. The semantic reasoning is the calling agent's job; this just surfaces
 * the most likely real components to then read in full with `get_component`.
 */
export function rankEntries(
  entries: RegistryIndexEntry[],
  query: string,
  limit = 8,
): ScoredEntry[] {
  return rankBySearch(entries, query, limit).map(({ item, score }) => ({ entry: item, score }));
}
