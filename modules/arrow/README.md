# @luma.gl/arrow

Apache Arrow utilities for luma.gl.

The module can derive GPU `BufferLayout` entries from Arrow schemas and create
GPU-side `ArrowGPUVector`, `ArrowGPUTable`, and `ArrowModel` objects from
compatible Arrow columns. Arrow tables and vectors are construction inputs; the
GPU objects retain GPU buffers plus Arrow-derived type and schema metadata.
Uploaded vectors own their generated buffers. Wrapped-buffer vectors are
non-owning by default unless ownership is explicitly requested or transferred by
an in-place operation.

For lower-level table pipelines, `TableBufferPlanner` can produce deterministic
GPU allocation plans from column descriptors while respecting device vertex and
storage buffer limits.

See [luma.gl](http://luma.gl) for documentation.
