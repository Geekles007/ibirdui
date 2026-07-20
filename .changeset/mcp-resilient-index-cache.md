---
"ibirdui-mcp": patch
---

Survive a transient registry fetch failure

The MCP server memoized the catalog fetch as a promise — including its rejection,
so a single network blip left `list_components` and `search_components` broken for
the whole session. A failed fetch is no longer cached (the next call retries), and
both tools now return a friendly error result instead of throwing a raw protocol
exception, matching `get_component`. The `list_components` state filter also
reuses `asyncStateNameSchema` instead of a hand-copied enum.
