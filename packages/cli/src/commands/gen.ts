import { type Rankable, normalizeBaseUrl, rankBySearch } from 'ibirdui-core';
import { bold, cyan, dim, green } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';

export interface GenOptions {
  registry?: string;
}

interface ManifestItem extends Rankable {
  examples: string[];
}

interface Manifest {
  name: string;
  items: ManifestItem[];
}

/**
 * Recommend components for a task. A transparent keyword search over each item's
 * `name` / `intents` / `description` in the registry manifest — no model, no code
 * generation — returning the real components to compose from, with the exact
 * `add` command and a usage example.
 *
 * The machine-readable manifest is what a model *could* rank or generate from;
 * `gen` is the honest, deterministic baseline, and shares its ranker with the MCP
 * `search_components` tool so a CLI user and an AI agent see the same suggestions.
 */
export async function gen(prompt: string, options: GenOptions): Promise<void> {
  const baseUrl = resolveRegistry(options.registry);
  const res = await nodeFetch(`${normalizeBaseUrl(baseUrl)}/r/manifest.json`);
  if (!res.ok) {
    throw new Error(`Could not load the registry manifest (${res.status}).`);
  }
  const manifest = (await res.json()) as Manifest;

  const ranked = rankBySearch(manifest.items, prompt);

  console.log(bold(`\nPrompt: ${dim(prompt)}\n`));

  if (ranked.length === 0) {
    console.log("No components matched. Try `ibirdui list` to see what's available.");
    return;
  }

  console.log(bold('Suggested components:\n'));
  for (const { item } of ranked) {
    console.log(`${green(item.name)} ${dim(`— ${item.description ?? ''}`)}`);
    if (item.states.length) console.log(`  states: ${dim(item.states.join(', '))}`);
    const example = item.examples[0];
    if (example) console.log(`  ${dim(example)}`);
    console.log('');
  }

  const addList = ranked.map((r) => r.item.name).join(' ');
  console.log(cyan(`Add them:\n  ibirdui add ${addList}`));
}
