# ibirdui-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the
**ibirdui registry** to AI assistants. Instead of hallucinating component markup, an
assistant can search the catalog by intent and read the **real source** of each
state-complete, accessible component before it writes any UI.

It's the AI-native half of ibirdui's manifest (`intents` + `examples`), turned into
live tools.

## Tools

| Tool | What it does |
| --- | --- |
| `list_components` | List the whole catalog — name, purpose, async states. Optional `state` filter (`loading` · `empty` · `error` · `optimistic` · `offline`). |
| `search_components` | Rank the catalog against a natural-language need (`"a sortable table with an empty state"`). Returns matches with their intents + install command. |
| `get_component` | Full details and **real source** for one component: description, a11y guarantees, examples, dependencies, and every file it installs. |

## Use it

Add the server to any MCP-aware client (Claude Desktop, Claude Code, Cursor, …):

```json
{
  "mcpServers": {
    "ibirdui": {
      "command": "npx",
      "args": ["-y", "ibirdui-mcp"]
    }
  }
}
```

Then ask, e.g., *"use ibirdui to build a user list with loading and empty states"* —
the assistant calls `search_components`, then `get_component` to pull the actual code.

### Claude Code

```bash
claude mcp add ibirdui -- npx -y ibirdui-mcp
```

## Configuration

| Env | Default | Purpose |
| --- | --- | --- |
| `IBIRDUI_REGISTRY_URL` | `https://Geekles007.github.io/ibirdui` | Registry base URL. Supports `file://` for a local build. |

```bash
# Point at a local registry build (registry/public) for development:
IBIRDUI_REGISTRY_URL="file://$(pwd)/registry/public" npx ibirdui-mcp
```

## How it relates to the CLI

The MCP server is **read-only discovery**; the [`ibirdui`](../cli) CLI is what writes
files. A typical agent loop: `search_components` → `get_component` → suggest
`npx ibirdui add <name>` so the user owns the code, with `ibirdui upgrade` /
`ibirdui doctor` keeping it current.
