# ibirdui

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
