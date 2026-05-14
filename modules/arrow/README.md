# @luma.gl/arrow

Apache Arrow utilities for luma.gl.

The module can derive GPU `BufferLayout` entries from Arrow schemas and create
GPU-side `GPUData`, `GPUVector`, `GPURecordBatch`,
`GPUTable`, and `ArrowModel` objects from compatible Arrow columns. Arrow
tables and vectors are construction inputs; the GPU objects retain GPU buffers
plus Arrow-derived type and schema metadata. `GPUTable.batches` preserves
source record-batch boundaries as real GPU batches with batch-local buffers.
`GPUTable.packBatches()` explicitly replaces those batches with fewer
packed batches when callers want a coarser draw surface.
Low-level incremental assembly can use `GPUTable.addBatch()`,
`GPUVector.addData()`, and appendable
`GPUVector.addToLastData()` storage without minting replacement tables.
`GPUTable.select()` destructively narrows selected columns, while
`detachVector()` and `detachBatches()` remove live GPU objects from the table and
return ownership to the caller.
Append-only uploads can use `GPUTable({type: 'appendable', ...})` plus
`addToLastBatch()` so the trailing GPU batch grows through stable `DynamicBuffer`
attributes without switching to a separate table abstraction.
Uploaded vectors own their generated buffers. Wrapped-buffer vectors are
non-owning by default unless ownership is explicitly requested or transferred by
an in-place operation.

`ArrowGeometry` and `ArrowModel` can also consume loaders.gl-compatible Mesh
Arrow tables through the local structural `ArrowMeshTable` type. Mesh Arrow
attributes are uploaded as GPU geometry, defaulting to one interleaved vertex
buffer plus a separate optional index buffer.

For lower-level table pipelines, `TableBufferPlanner` can produce deterministic
GPU allocation plans from column descriptors while respecting device vertex and
storage buffer limits.

See [luma.gl](http://luma.gl) for documentation.
