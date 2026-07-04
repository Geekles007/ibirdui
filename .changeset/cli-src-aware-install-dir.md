---
"ibirdui": minor
---

`add` now installs into your project's source directory instead of always the repo root

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
