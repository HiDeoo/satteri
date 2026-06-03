---
cargo/satteri-ast: patch
cargo/satteri-napi: patch
npm/satteri: patch
---

Fixed a crash when a plugin returned a replacement node whose children included the node being visited (for example, wrapping a heading in a `<div>` that contains it).
