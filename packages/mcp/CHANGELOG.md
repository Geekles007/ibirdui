# ibirdui-mcp

## 0.1.4

### Patch Changes

- de82657: Honest, shared keyword ranking for `gen` and `search_components`

  `ibirdui gen` and the MCP `search_components` tool each ran their own naive
  substring matcher — sold, in the copy, as more than it was. They now share one
  ranker in `ibirdui-core` (`rankBySearch`) that matches on **whole words** (so
  "on" no longer matches "confirm"), **ignores stop words** (so "a … with an …"
  adds no noise), weights the fields that say what a component is _for_
  (name/intents over description), and caps results.

  The CLI help, MCP tool descriptions, and READMEs are reframed to describe it
  accurately — deterministic keyword ranking, not semantic search or code
  generation. The genuinely AI-native part is unchanged and stays the headline: the
  manifest and `get_component` hand an assistant the _real_ component source to
  compose with instead of hallucinating markup.

- 5339192: Survive a transient registry fetch failure

  The MCP server memoized the catalog fetch as a promise — including its rejection,
  so a single network blip left `list_components` and `search_components` broken for
  the whole session. A failed fetch is no longer cached (the next call retries), and
  both tools now return a friendly error result instead of throwing a raw protocol
  exception, matching `get_component`. The `list_components` state filter also
  reuses `asyncStateNameSchema` instead of a hand-copied enum.

- Updated dependencies [f0f463f]
- Updated dependencies [1d253f4]
- Updated dependencies [4748b38]
- Updated dependencies [55f372c]
- Updated dependencies [c80ec6e]
- Updated dependencies [de82657]
  - ibirdui-core@0.2.0

## 0.1.3

### Patch Changes

- Updated dependencies [76173d0]
  - ibirdui-core@0.1.1
