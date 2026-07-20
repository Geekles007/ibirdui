---
"ibirdui-core": patch
---

`upgrade`/`doctor` no longer flag untouched files as edited on Windows

`hashContent` now normalizes line endings (CRLF / lone CR → LF) before hashing.
The registry build and the CLI both fingerprint files through it, so a checkout
with `git autocrlf`, an editor's newline setting, or a CRLF working tree no
longer makes every file's hash differ from the lockfile — which previously made
`doctor` report everything "modified" and `upgrade` write spurious `*.new`
conflicts. Hashes are unchanged for LF content, so existing lockfiles and the
published registry stay valid.
