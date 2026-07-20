---
"ibirdui": patch
"ibirdui-core": patch
---

Make `upgrade` dependency-, deletion-, and conflict-aware

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
  *previous* file hash as the base. Advancing it to the new hash made every later
  upgrade re-conflict against a version the user never accepted, so conflicted
  files never converged.
- **One bad item no longer aborts the run.** Each target resolves in isolation, the
  lockfile is written once (capturing partial progress), and a genuine failure
  (unreachable item, unwritable file) exits non-zero for CI.

Supporting change in `ibirdui-core`: `isAbsoluteUrl` now recognizes `file://`
URLs, so items installed from a local `file://` registry resolve and upgrade
correctly (and can be referenced as cross-registry deps).
