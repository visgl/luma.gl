# @luma.gl/arrow

Apache Arrow utilities for luma.gl.

The module can derive GPU `BufferLayout` entries from Arrow schemas and create
`@luma.gl/tables` objects from compatible Arrow columns through
`makeArrowGPUData()`, `makeArrowGPUVector()`, `makeArrowGPURecordBatch()`, and
`makeArrowGPUTable()`. Arrow tables and vectors are construction inputs; the
generic GPU objects retain storage owners plus Arrow-derived type and schema
metadata. `GPUTable.batches` preserves source record-batch boundaries as real
GPU batches with batch-local buffers.
`GPUTable.packBatches()` explicitly replaces those batches with fewer
packed batches when callers want a coarser draw surface.
Low-level incremental assembly can use `GPUTable.addBatch()`,
`GPUVector.addData()`, and Arrow append adapters such as
`appendArrowDataToGPUVector()` without minting replacement tables.
`GPUTable.select()` destructively narrows selected columns, while
`detachVector()` and `detachBatches()` remove live GPU objects from the table and
return ownership to the caller.
Append-only uploads can use `makeAppendableArrowGPUTable()` plus
`appendArrowBatchToGPUTable()` so the trailing GPU batch grows through stable
`DynamicBuffer` attributes without switching to a separate table abstraction.
`GPUVector` does not own raw buffers directly. Generated and adopted storage is
owned by `GPUData`, while vectors aggregate those chunks and expose a direct
`buffer` convenience only when one concrete backing surface is bindable.
Wrapped-buffer vectors are non-owning by default unless ownership is explicitly
requested or transferred by an in-place operation.
Arrow vector factories also support variable-length Arrow list columns whose
nested elements contain one to four numeric components. This covers scalar lists
plus tuple-style data such as XY, XYZ, and XYZM coordinates, while copying only
compact list-offset metadata needed for readback instead of retaining the
uploaded Arrow value arrays.
`closeArrowPaths()` normalizes Float32 path rows before rendering or expansion:
closed paths whose first and last vertices differ by more than an epsilon receive
an appended copy of their first vertex, while already-closed, open, empty, and
single-point paths remain unchanged. WebGPU uses compute classification and
scatter passes; other devices use equivalent CPU fallback semantics.
`ArrowPathModel` consumes Float32 XY, XYZ, or XYZM nested coordinate rows from that
representation, expands one logical path row into packed per-segment render records,
and repeats optional per-path color and width columns only for the attribute-backed
render table that needs them. CPU path/style vectors used for that expansion remain
explicit caller-owned `sourceVectors`.
`ArrowStoragePathModel` is the WebGPU storage-backed counterpart. It expands nested
path rows into compact indexed segment records through compute using the
GPU-resident path values plus copied list-offset metadata. Render shaders fetch
coordinates from the original path-value storage buffer, while per-path color and
width rows remain storage-buffer bindings instead of being duplicated per generated
segment. Reusable storage state can be built separately with
`createArrowStoragePathState`.

`ArrowTableGeometry`, `makeGPUGeometryFromArrow()`, and `ArrowModel` can also
consume loaders.gl-compatible Mesh Arrow tables through the local structural
`ArrowMeshTable` type. Mesh Arrow attributes are uploaded as table-backed GPU
geometry, defaulting to one interleaved vertex buffer plus a separate optional
index buffer. `ArrowGeometry` remains as a deprecated compatibility alias for
`ArrowTableGeometry`.

For lower-level table pipelines, import `TableBufferPlanner` from
`@luma.gl/tables` to produce deterministic GPU allocation plans from column
descriptors while respecting device vertex and storage buffer limits.

See [luma.gl](http://luma.gl) for documentation.
