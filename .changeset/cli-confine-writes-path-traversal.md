---
"ibirdui-core": patch
"ibirdui": patch
---

Refuse registry file paths that escape the project

A registry item whose file `path` was absolute or contained `..` (e.g.
`../../.git/hooks/pre-commit`) could make `add`/`upgrade` write outside the
target directory. The path is now rejected when the item is parsed
(`registryFileSchema`), and the CLI additionally confines every write under
`cwd/baseDir` in `resolveTarget`, throwing otherwise. Defence in depth against a
hostile, compromised, or mistyped registry.
