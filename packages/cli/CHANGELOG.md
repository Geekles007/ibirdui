# ibirdui

## 0.2.1

### Patch Changes

- 1d253f4: Refuse registry file paths that escape the project

  A registry item whose file `path` was absolute or contained `..` (e.g.
  `../../.git/hooks/pre-commit`) could make `add`/`upgrade` write outside the
  target directory. The path is now rejected when the item is parsed
  (`registryFileSchema`), and the CLI additionally confines every write under
  `cwd/baseDir` in `resolveTarget`, throwing otherwise. Defence in depth against a
  hostile, compromised, or mistyped registry.

- 4748b38: Make `upgrade` dependency-, deletion-, and conflict-aware

  `ibirdui upgrade` now resolves each item's full dependency tree from the origin it
  was installed from, instead of fetching the single item in isolation:

  - **New dependencies are installed.** A new version that adds a `registryDependency`
    now writes the new file and records it, and any new npm packages are surfaced
    like `add` — previously the upgraded component imported a file/package that was
    never installed.
  - **Removed files are cleaned up.** A file the new version drops is deleted from
    disk and the lockfile instead of being orphaned; a locally-edited orphan is kept
    with a warning rather than silently removed.
  - **Conflicts keep the right 3-way base.** On a conflict the lockfile now keeps the
    _previous_ file hash as the base. Advancing it to the new hash made every later
    upgrade re-conflict against a version the user never accepted, so conflicted
    files never converged.
  - **One bad item no longer aborts the run.** Each target resolves in isolation, the
    lockfile is written once (capturing partial progress), and a genuine failure
    (unreachable item, unwritable file) exits non-zero for CI.

  Supporting change in `ibirdui-core`: `isAbsoluteUrl` now recognizes `file://`
  URLs, so items installed from a local `file://` registry resolve and upgrade
  correctly (and can be referenced as cross-registry deps).

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

- Updated dependencies [f0f463f]
- Updated dependencies [1d253f4]
- Updated dependencies [4748b38]
- Updated dependencies [55f372c]
- Updated dependencies [c80ec6e]
- Updated dependencies [de82657]
  - ibirdui-core@0.2.0

## 0.2.0

### Minor Changes

- b347df4: `add` now installs into your project's source directory instead of always the repo root

  Frameworks disagree on where source lives — TanStack Start, src-based Next and
  Vite keep it under `src/`, others sit at the root. The CLI now resolves a
  `baseDir` on the first `add` and pins it in `ibirdui.lock.json`, so files land
  where the framework expects: a tsconfig path alias / `baseUrl` into `src/`, or an
  existing top-level `src/` directory, resolves to `src` (e.g.
  `src/components/button.tsx`); otherwise the repo root, as before. Pass
  `--dir <path>` to force any target (e.g. `--dir app` for Remix). `upgrade` and
  `doctor` read the same `baseDir`, so installs never split across two folders.
  Lockfiles written before this change are treated as root — fully backward
  compatible.

## 0.1.2

### Patch Changes

- 76173d0: `add` now accepts a registry path or URL as an item, not just a bare name

  `ibirdui add blocks.ibird.dev/r/hero` (and `https://…/r/hero.json`) previously
  resolved as a bare item name against the default registry, producing a 404. A
  new `normalizeItemRef` in core turns a scheme-less registry path into a
  fully-qualified `https://…/r/<name>.json` URL, so the CLI fetches it directly
  and resolves its cross-registry `registryDependencies` against their own origin.
  Bare names still resolve against the `--registry` base as before.

- Updated dependencies [76173d0]
  - ibirdui-core@0.1.1
