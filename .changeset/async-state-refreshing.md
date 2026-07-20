---
"ibirdui-core": minor
---

Add `refreshing` to the `success` async state (stale-while-revalidate)

The `success` variant of `AsyncState<T>` gains an optional `refreshing?: boolean`,
so a state can represent "data is on screen while a background refetch is in
flight" instead of collapsing back to `loading`. Optional and backward-compatible
— `success(data)` and every existing consumer keep working unchanged. The registry
hooks (`use-async`, `use-poll`) set it during a revalidation and `state-boundary`
surfaces it as `aria-busy`.
