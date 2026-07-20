/**
 * Deterministic keyword ranking over the registry — no model, no network. It's
 * what `ibirdui gen` and the MCP `search_components` tool use to turn a plain
 * task description into the real components most likely to fit. It is honest
 * about what it is: a transparent keyword ranker, not semantic search. A model
 * consuming the same manifest can rank far better; this is the zero-dependency
 * baseline that hands it (or a human) real components to start from.
 */

/** Common English + UI-prompt filler words that carry no ranking signal. */
const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'to',
  'for',
  'with',
  'in',
  'on',
  'at',
  'by',
  'as',
  'is',
  'are',
  'be',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'we',
  'my',
  'me',
  'want',
  'wants',
  'need',
  'needs',
  'build',
  'make',
  'some',
  'any',
  'all',
  'app',
  'page',
  'component',
  'components',
  'ui',
  'when',
  'where',
  'show',
  'shows',
]);

/** Split text into lowercase word tokens (whole words, no punctuation). */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Distinct, meaningful tokens of a query: whole words, lowercased, minus stop
 * words, single characters, and duplicates. Exported so callers (and tests) can
 * see exactly what a prompt reduces to.
 */
export function searchTokens(text: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const word of words(text)) {
    if (word.length < 2 || STOP_WORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    tokens.push(word);
  }
  return tokens;
}

/** The fields a registry item exposes for ranking (index entry or manifest item). */
export interface Rankable {
  name: string;
  description?: string;
  intents: string[];
  states: string[];
}

export interface Ranked<T> {
  item: T;
  score: number;
}

/** Field weights: what an item *is for* (name, intents) beats how it reads. */
const WEIGHT = { nameExact: 12, nameWord: 6, intent: 4, state: 3, description: 2 } as const;

function scoreItem(item: Rankable, queryTokens: string[]): number {
  const name = item.name.toLowerCase();
  const nameWords = new Set(words(item.name));
  const intentWords = new Set(words(item.intents.join(' ')));
  const stateWords = new Set(words(item.states.join(' ')));
  const descWords = new Set(words(item.description ?? ''));

  let score = 0;
  for (const token of queryTokens) {
    if (name === token) score += WEIGHT.nameExact;
    else if (nameWords.has(token)) score += WEIGHT.nameWord;
    if (intentWords.has(token)) score += WEIGHT.intent;
    if (stateWords.has(token)) score += WEIGHT.state;
    if (descWords.has(token)) score += WEIGHT.description;
  }
  return score;
}

/**
 * Rank items by how well they match a plain-language query, dropping zero-score
 * misses and capping at `limit`. Matching is by **whole word** (so `on` doesn't
 * match `confirm`), **stop words are ignored** (so `a … with an …` adds no
 * noise), and ties break alphabetically for stable output.
 */
export function rankBySearch<T extends Rankable>(
  items: T[],
  query: string,
  limit = 8,
): Ranked<T>[] {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return [];
  return items
    .map((item) => ({ item, score: scoreItem(item, tokens) }))
    .filter((ranked) => ranked.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit);
}
