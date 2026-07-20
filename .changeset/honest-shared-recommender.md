---
"ibirdui-core": patch
"ibirdui": patch
"ibirdui-mcp": patch
---

Honest, shared keyword ranking for `gen` and `search_components`

`ibirdui gen` and the MCP `search_components` tool each ran their own naive
substring matcher — sold, in the copy, as more than it was. They now share one
ranker in `ibirdui-core` (`rankBySearch`) that matches on **whole words** (so
"on" no longer matches "confirm"), **ignores stop words** (so "a … with an …"
adds no noise), weights the fields that say what a component is *for*
(name/intents over description), and caps results.

The CLI help, MCP tool descriptions, and READMEs are reframed to describe it
accurately — deterministic keyword ranking, not semantic search or code
generation. The genuinely AI-native part is unchanged and stays the headline: the
manifest and `get_component` hand an assistant the *real* component source to
compose with instead of hallucinating markup.
