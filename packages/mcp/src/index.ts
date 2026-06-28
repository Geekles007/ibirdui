import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolveRegistry } from './registry.js';
import { createServer } from './server.js';

/**
 * Entry point for the ibirdui MCP server. Speaks the Model Context Protocol over
 * stdio, so MCP-aware assistants (Claude Desktop, Claude Code, Cursor, …) can add
 * it as a server and query the registry directly.
 *
 *   { "command": "npx", "args": ["-y", "ibirdui-mcp"] }
 */
async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe to log on — stdout is the protocol channel.
  console.error(`[ibirdui-mcp] serving registry ${resolveRegistry()}`);
}

main().catch((error: unknown) => {
  console.error('[ibirdui-mcp] fatal:', error instanceof Error ? error.message : error);
  process.exit(1);
});
