---
"ibirdui-core": patch
---

Single-source the async-state vocabulary

The registry's `states` capability tags (`asyncStateNameSchema`) were a separate,
hand-maintained list that had drifted from the runtime `AsyncStatus` union: it
couldn't express `success`/`idle` and carried an `offline` tag no component used.
It's now derived from `ASYNC_STATUSES` (the runtime states) plus `optimistic`, so
the two can't diverge. The unused `offline` tag is dropped.
