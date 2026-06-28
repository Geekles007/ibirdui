import type { RegistryIndexEntry } from 'ibirdui-core';

export interface ScoredEntry {
  entry: RegistryIndexEntry;
  score: number;
}

/** Split a query into lowercase word tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Score one catalog entry against a free-text query. Deliberately simple and
 * deterministic — an LLM only needs a sensible ordering, not BM25. Weights favour
 * the fields that describe *what a component is for*:
 *
 *   name match           +20   (exact name — always wins) / +6 (name contains a token)
 *   intent token hit     +5    (intents are the "I want to…" phrasings)
 *   description hit       +2
 *   state token hit      +3    ("loading", "error", "offline"…)
 */
export function scoreEntry(entry: RegistryIndexEntry, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const name = entry.name.toLowerCase();
  const intentText = entry.intents.join(' ').toLowerCase();
  const descText = (entry.description ?? '').toLowerCase();
  const stateText = entry.states.join(' ').toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (name === token) score += 20;
    else if (name.includes(token)) score += 6;
    if (intentText.includes(token)) score += 5;
    if (descText.includes(token)) score += 2;
    if (stateText.includes(token)) score += 3;
  }
  return score;
}

/**
 * Rank catalog entries by relevance to `query`, dropping zero-score misses.
 * Ties break alphabetically so the output is stable.
 */
export function rankEntries(
  entries: RegistryIndexEntry[],
  query: string,
  limit = 8,
): ScoredEntry[] {
  const tokens = tokenize(query);
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limit);
}
