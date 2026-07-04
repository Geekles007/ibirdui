---
"ibirdui-core": patch
"ibirdui": patch
---

`add` now accepts a registry path or URL as an item, not just a bare name

`ibirdui add blocks.ibird.dev/r/hero` (and `https://…/r/hero.json`) previously
resolved as a bare item name against the default registry, producing a 404. A
new `normalizeItemRef` in core turns a scheme-less registry path into a
fully-qualified `https://…/r/<name>.json` URL, so the CLI fetches it directly
and resolves its cross-registry `registryDependencies` against their own origin.
Bare names still resolve against the `--registry` base as before.
