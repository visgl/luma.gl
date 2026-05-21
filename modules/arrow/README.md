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
single-point paths remain unchanged. The Float32 rows can be absolute path
coordinates or origin-relative deltas produced from Float64 path preparation.
WebGPU uses compute classification and scatter passes; other devices use
equivalent CPU fallback semantics.
`ArrowPathModel.prepareGPUVectors()` and `prepareArrowPathGPUVectors()` are the
attribute-path preparation boundary. Float32 XY, XYZ, and XYZM path rows upload
unchanged unless closure is requested. Float64 path rows convert on the CPU into
stable per-row Float32 deltas from the first point; CPU Float64 origins are kept
separately, and `updateViewOrigins()` refreshes the per-row view-origin buffers
when the view or model matrix changes. `ArrowStoragePathModel.prepareGPUVectors()`
and `prepareArrowStoragePathGPUVectors()` provide the storage-only WebGPU boundary:
Float64 rows upload temporarily, convert once into Float32 deltas with
`sub_fp64u32_to_f32`, then release the transient Float64 GPU payload before
returning storage path props.
`ArrowPathModel` consumes prepared path props and expands one logical path row
into packed per-segment render records. `ArrowStoragePathModel` is the WebGPU
storage-backed counterpart. It expands nested path rows into compact indexed
segment records through compute using the GPU-resident prepared path values plus
copied list-offset metadata. Render shaders fetch coordinates from path-value
storage and add per-row view origins, while per-path color and width rows remain
storage-buffer bindings instead of being duplicated per generated segment.
Default storage records use three `u32` words per segment
(`segmentStartPointIndex`, `segmentFlags`, and `globalRowIndex`) plus one
persistent `vec4<u32>` path range per source row. Shaders that request legacy
end, previous, or next segment index attributes automatically keep the older
six-word record layout.
Reusable storage state can be built separately with `createArrowStoragePathState`.

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
