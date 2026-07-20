import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  type RegistryIndex,
  type RegistryItem,
  asyncStateNameSchema,
  fetchRegistryIndex,
  fetchRegistryItem,
} from 'ibirdui-core';
import { z } from 'zod';
import { nodeFetch, resolveRegistry } from './registry.js';
import { rankEntries } from './search.js';

export const SERVER_NAME = 'ibirdui';
export const SERVER_VERSION = '0.1.0';

/** A text-only tool result, optionally flagged as an error. */
function text(body: string, isError = false) {
  return { content: [{ type: 'text' as const, text: body }], ...(isError ? { isError } : {}) };
}

/** Render one catalog entry as a compact, LLM-readable block. */
function formatEntry(entry: RegistryIndex['items'][number]): string {
  const lines = [`### ${entry.name} (v${entry.version})`];
  if (entry.description) lines.push(entry.description);
  if (entry.intents.length) lines.push(`Use for: ${entry.intents.join('; ')}`);
  const meta = [
    entry.states.length ? `states: ${entry.states.join('/')}` : null,
    entry.a11yLevel ? `a11y: ${entry.a11yLevel}` : null,
  ].filter(Boolean);
  if (meta.length) lines.push(meta.join(' · '));
  lines.push(`Install: \`npx ibirdui add ${entry.name}\``);
  return lines.join('\n');
}

/** Render a full item — including its real source — for `get_component`. */
function formatItem(item: RegistryItem): string {
  const lines = [`# ${item.name} (v${item.version})`];
  if (item.description) lines.push(`\n${item.description}`);

  if (item.states.length) lines.push(`\n**States handled:** ${item.states.join(', ')}`);
  if (item.a11y) {
    lines.push(`**Accessibility:** ${item.a11y.level}${item.a11y.tested ? ' (axe-tested)' : ''}`);
    for (const note of item.a11y.notes) lines.push(`  - ${note}`);
  }

  if (item.manifest?.intents.length) {
    lines.push('\n**Use it when you want:**');
    for (const intent of item.manifest.intents) lines.push(`  - ${intent}`);
  }
  if (item.manifest?.examples.length) {
    lines.push('\n**Examples:**');
    for (const example of item.manifest.examples) lines.push(`\n\`\`\`tsx\n${example}\n\`\`\``);
  }

  if (item.dependencies.length)
    lines.push(`\n**npm dependencies:** ${item.dependencies.join(', ')}`);
  if (item.registryDependencies.length) {
    lines.push(`**Registry dependencies:** ${item.registryDependencies.join(', ')}`);
  }

  lines.push(`\n**Install:** \`npx ibirdui add ${item.name}\``);

  lines.push('\n## Source files');
  for (const file of item.files) {
    lines.push(`\n### ${file.path}\n\`\`\`tsx\n${file.content}\n\`\`\``);
  }
  return lines.join('\n');
}

/**
 * Build the ibirdui MCP server: three tools that let an assistant discover and
 * read the real registry components instead of hallucinating markup.
 *
 *  - `list_components`   — the catalog (optionally filtered by async state)
 *  - `search_components` — rank the catalog against a natural-language need
 *  - `get_component`     — full details + real source for one component
 */
export function createServer(): McpServer {
  const baseUrl = resolveRegistry();

  // The catalog rarely changes within a session; fetch it once and reuse — but
  // never memoize a rejection, or a single transient network blip would leave
  // `list`/`search` permanently broken for the rest of the session.
  let indexCache: Promise<RegistryIndex> | undefined;
  const getIndex = () => {
    if (!indexCache) {
      indexCache = fetchRegistryIndex(baseUrl, { fetch: nodeFetch }).catch((error) => {
        indexCache = undefined; // let the next call retry
        throw error;
      });
    }
    return indexCache;
  };

  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    'list_components',
    {
      title: 'List ibirdui components',
      description:
        'List every component available in the ibirdui registry, with what each is for and the async states it handles. Optionally filter to components that handle a given state.',
      inputSchema: {
        state: asyncStateNameSchema
          .optional()
          .describe('Only return components that handle this async state.'),
      },
    },
    async ({ state }) => {
      try {
        const index = await getIndex();
        const items = state ? index.items.filter((i) => i.states.includes(state)) : index.items;
        if (items.length === 0) return text(`No components handle the "${state}" state.`);
        const header = `${items.length} ibirdui component(s)${state ? ` handling "${state}"` : ''}:\n`;
        return text(`${header}\n${items.map(formatEntry).join('\n\n')}`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return text(`Couldn't load the ibirdui catalog: ${reason}`, true);
      }
    },
  );

  server.registerTool(
    'search_components',
    {
      title: 'Search ibirdui components',
      description:
        'Find the ibirdui components that best fit a natural-language need (e.g. "a button that shows a loading spinner" or "a sortable table with empty state"). Returns ranked matches with their intents and install command.',
      inputSchema: {
        query: z.string().min(1).describe('What you want to build, in plain language.'),
        limit: z.number().int().min(1).max(20).optional().describe('Max results (default 8).'),
      },
    },
    async ({ query, limit }) => {
      try {
        const index = await getIndex();
        const ranked = rankEntries(index.items, query, limit ?? 8);
        if (ranked.length === 0) {
          return text(
            `No ibirdui component matched "${query}". Try \`list_components\` to see the full catalog.`,
          );
        }
        const body = ranked.map(({ entry }) => formatEntry(entry)).join('\n\n');
        return text(`Top ${ranked.length} match(es) for "${query}":\n\n${body}`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return text(`Couldn't search the ibirdui catalog: ${reason}`, true);
      }
    },
  );

  server.registerTool(
    'get_component',
    {
      title: 'Get an ibirdui component',
      description:
        'Get the full details and real source code for one ibirdui component by name: description, accessibility guarantees, usage examples, dependencies and every file it installs. Use this before writing UI so you compose with the actual component API.',
      inputSchema: {
        name: z.string().min(1).describe('The component name, e.g. "data-table".'),
      },
    },
    async ({ name }) => {
      try {
        const item = await fetchRegistryItem(baseUrl, name, { fetch: nodeFetch });
        return text(formatItem(item));
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return text(
          `Couldn't load "${name}": ${reason}\nUse \`search_components\` or \`list_components\` to find a valid name.`,
          true,
        );
      }
    },
  );

  return server;
}
