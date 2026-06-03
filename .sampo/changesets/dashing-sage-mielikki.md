---
cargo/satteri-plugin-api: patch
cargo/satteri-napi: patch
npm/satteri: patch
---

Made HAST plugins match MDAST when a transform targets a node removed or replaced earlier in the same pass: the stranded transform is now dropped with a warning instead of throwing a fatal error.
