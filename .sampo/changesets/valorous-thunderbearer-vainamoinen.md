---
cargo/satteri-ast: patch
cargo/satteri-napi: patch
npm/satteri: patch
---

Fixed `ctx.wrapNode()` dropping content: the wrapper's own children are now kept after the wrapped node, and `prependChild`/`appendChild` calls on a node in the same pass it is wrapped are applied instead of being silently dropped.
