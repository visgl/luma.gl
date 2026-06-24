# @luma.gl/tables

GPU-resident table primitives for luma.gl.

`@luma.gl/tables` defines Arrow-free table core types: `GPUData`,
`GPUVector`, `GPURecordBatch`, `GPUTable`, `GPUSchema`, `GPUField`,
`GPUVectorFormat`, `VertexList`, and `GPUInputSchema`. Adapter modules such
as `@luma.gl/arrow` create these objects from source data. Models expose
`gpuInputSchema` to declare the prepared `GPUVector` inputs they accept.

Table-backed indexed rendering reserves the `indices` GPU vector name for a
non-attribute `vertex-list<uint32>` draw column. Each preserved batch supplies
one `Buffer.INDEX` `GPUData` chunk; `GPUTableModel.drawBatches()` binds that
batch-local index buffer and uses the vector `valueLength` as the indexed draw
count.

See [luma.gl](https://luma.gl/docs/api-reference/tables) for documentation.
