---
cargo/satteri-ast: patch
---

Fix URL percent-encoding to re-encode bare `%` that isn't a valid escape, and resolve duplicate-identifier reference definitions by source position (first-wins matches remark).
