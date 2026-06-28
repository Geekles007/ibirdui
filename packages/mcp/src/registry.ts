import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/** Default registry base URL. Override with IBIRDUI_REGISTRY_URL. */
export const DEFAULT_REGISTRY = 'https://ui.ibird.dev';

/** Resolve the registry base URL: env override > built-in default. */
export function resolveRegistry(): string {
  return process.env.IBIRDUI_REGISTRY_URL ?? DEFAULT_REGISTRY;
}

/**
 * Node-aware fetch passed to the (browser-safe) core helpers. Adds `file://`
 * support so the server can run against a local registry build without a server:
 *
 *   IBIRDUI_REGISTRY_URL="file:///abs/path/registry/public" ibirdui-mcp
 */
export async function nodeFetch(input: string) {
  if (input.startsWith('file://')) {
    try {
      const content = await readFile(fileURLToPath(input), 'utf8');
      return { ok: true, status: 200, json: async () => JSON.parse(content) };
    } catch {
      return { ok: false, status: 404, json: async () => null };
    }
  }
  const res = await fetch(input);
  return { ok: res.ok, status: res.status, json: () => res.json() };
}
