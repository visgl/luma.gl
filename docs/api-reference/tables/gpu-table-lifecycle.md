# GPU Table Lifecycle

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

This page documents the lifecycle of generic GPU table objects in
`@luma.gl/tables`: ownership, batching, packing, table-backed rendering,
transform, compute, and buffer planning. For Apache Arrow column compatibility
and preparation helpers, see
[Supported Arrow Types](/docs/api-reference/arrow/supported-arrow-types).

## Overview

`GPUData`, `GPUVector`, `GPURecordBatch`, `GPUTable`, and `GPUSchema`
are GPU-side representations for typed table columns and batches. Arrow vectors,
record batches, and tables are common construction inputs through
`@luma.gl/arrow`; the generic GPU objects do not retain references to those
sources after extracting the buffer data and metadata they need.

The object model is batch-preserving by default:

- `GPUTable.batches[]` contains real GPU record batches with batch-local
  buffers.
- Table-level `gpuVectors` aggregate those batch-local chunks through
  `GPUVector.data[]`.
- `GPUData` is the chunk primitive. It owns or borrows one `Buffer` or
  `DynamicBuffer`.
- `GPUTableModel.drawBatches(renderPass)` draws preserved GPU batches by reusing one
  compatible layout/pipeline and rebinding only each batch's attribute buffers.

This means a multi-batch Arrow table stays multi-batch after GPU upload. If the
application prefers fewer draw units, it packs explicitly:

```ts
const gpuTable = makeArrowGPUTable(device, table, {shaderLayout});

// Replace preserved batches with one packed batch.
gpuTable.packBatches();

// Or greedily merge adjacent batches until each emitted batch reaches the threshold.
gpuTable.packBatches({minBatchSize: 50_000});
```

Packing mutates the table in place. It rebuilds `batches[]`, table-level
`gpuVectors`, and `attributes`, then destroys only superseded GPU buffers that
were owned by the removed batches. Borrowed external buffers are not destroyed.

### Ownership Rules

- GPU objects created from Arrow data own the GPU storage they allocate.
- GPU objects wrapping caller-supplied buffers are non-owning by default unless
  `ownsBuffer` is requested.
- `GPUData` is the storage-owning layer. A chunk may own its buffer or borrow an
  existing one, but `GPUVector` never owns raw buffers directly.
- `GPUVector` owns or borrows ordered `GPUData[]` chunks. Code that needs one
  directly bindable buffer should require exactly one chunk and bind
  `vector.data[0].buffer`.
- Detach operations transfer live objects out of the table instead of destroying
  them.
- `destroy()` always follows the current ownership graph. It never destroys
  borrowed buffers.

## GPUSchema and Formats

`GPUSchema` is plain selected-column metadata:

```ts
type GPUSchema<T extends GPUTypeMap = GPUTypeMap> = {
  fields: Array<GPUField<keyof T & string>>;
  metadata: Map<string, string>;
};
```

`GPUField.format` is a `GPUVectorFormat`, not a shader type. Fixed vectors use
core `VertexFormat` strings such as `float32x3` and `unorm8x4`. Variable-length
vertex-aligned rows use `VertexList`, for example `vertex-list<float32x3>`.

Shader-facing values remain in `ShaderLayout`:

```ts
const shaderLayout = {
  attributes: [{name: 'colors', location: 0, type: 'vec4<f32>'}],
  bindings: []
};
```

Compatibility checks decide whether a memory format can feed a shader value. For
example, `unorm8x4` can feed `vec4<f32>`, while `uint32x4` cannot feed
`vec4<f32>`.

See [GPUSchema](/docs/api-reference/tables/gpu-schema) and
[GPUVectorFormat](/docs/api-reference/tables/gpu-vector-format) for the type
reference.

## Object Responsibilities

This page stays at the relationship level. Constructor modes, properties, and
method signatures live on the individual reference pages:

| Object | Responsibility | Detailed reference |
| --- | --- | --- |
| `GPUData` | One GPU buffer plus row/stride metadata and buffer ownership. | [GPUData](/docs/api-reference/tables/gpu-data) |
| `GPUVector` | One logical column over ordered `GPUData[]` chunks. | [GPUVector](/docs/api-reference/tables/gpu-vector) |
| `GPURecordBatch` | One preserved batch with batch-local vectors, attributes, and bindings. | [GPURecordBatch](/docs/api-reference/tables/gpu-record-batch) |
| `GPUTable` | Table-level owner that preserves batches, exposes aggregate vectors, and controls packing/detach/destruction. | [GPUTable](/docs/api-reference/tables/gpu-table) |
| `GPUSchema` | Selected-column metadata with `GPUVectorFormat` fields. | [GPUSchema](/docs/api-reference/tables/gpu-schema) |

The important invariant is that buffers are reached through `GPUData`, not
directly through `GPUVector`. Code that needs one directly bindable buffer should
require `vector.data.length === 1` and bind `vector.data[0].buffer`. Batch-aware
render and compute paths should iterate `GPUTable.batches[]` or the corresponding
`GPUVector.data[]` chunks.

## Batching, Append, and Packing

Low-level incremental assembly stays ownership-explicit with
`gpuTable.addBatch(gpuRecordBatch)` and `gpuVector.addData(gpuData)`. These
operations aggregate existing GPU objects instead of allocating replacement
tables.

Appendable Arrow-backed tables use the same table and batch classes:

```ts
const gpuTable = makeAppendableArrowGPUTable({
  device,
  schema,
  shaderLayout
});

appendArrowBatchToGPUTable(gpuTable, recordBatch);
appendArrowBatchToGPUTable(gpuTable, nextArrowTable);
```

Each append call uploads source chunks into new `GPUData` buffers and preserves
previous batches. To reduce draw or dispatch units, call `packBatches()` on the
table explicitly.

## Table-Backed Render, Transform, and Compute Helpers

The table APIs are meant to feed more than one execution style.

### `GPUTableModel`

Use `GPUTableModel` when a prepared GPU table should drive ordinary rendering.
If the source data starts as an Arrow table, convert it first with
`makeArrowGPUTable()` in layer/data-preparation code:

```ts
const table = makeArrowGPUTable(device, arrowTable, {shaderLayout});

const model = new GPUTableModel(device, {
  source,
  shaderLayout,
  table,
  tableCount: 'instance'
});
```

`tableCount` chooses whether table row counts become `instanceCount`,
`vertexCount`, or neither. The converted `GPUTable` stays caller-owned.

### `TableTransform`

`TableTransform` is the WebGL transform-feedback counterpart. It consumes a
generic `GPUTable`, merges the table attribute layouts into the underlying
`BufferTransform`, accepts already-created `GPUVector` inputs, and can run one
preserved GPU batch at a time. Use `makeArrowGPUTable()` before construction
when the source data starts as an Arrow table:

```ts
const transform = new TableTransform(device, {
  vs,
  varyings,
  shaderLayout,
  table: makeArrowGPUTable(device, arrowTable, {shaderLayout}),
  tableCount: 'vertex'
});

transform.dispatchBatches({
  outputBuffers: (batch, batchIndex) => makeOutputBuffers(batch, batchIndex)
});
```

For a compute-like update path, pass `inputVectors` plus
`copyOutputToInputVectors`. `outputs` is inferred from the copy map when it is
omitted:

```ts
const transform = new TableTransform(device, {
  vs,
  shaderLayout,
  inputVectors: {
    particlePositions,
    particleVelocities
  },
  copyOutputToInputVectors: {
    nextParticlePositions: 'particlePositions',
    nextParticleVelocities: 'particleVelocities'
  }
});
```

Transform feedback writes a dense output stream, so automatic copy-back targets
tightly packed, directly bindable GPUVectors. It can not scatter-copy into
padded or interleaved rows.

Use `TableTransform` only for attribute-backed WebGL transform feedback. It is
not a storage-buffer compute abstraction.

Relevant public types:

| Type | Meaning |
| --- | --- |
| `TableTransformProps` | Construction props, including `table`, `inputVectors`, `copyOutputToInputVectors`, and `tableCount`. |
| `TableTransformBatchOptions` | `dispatchBatches()` options, including fixed or per-batch `outputBuffers`. |

### `GPUTableComputation`

`GPUTableComputation` is the WebGPU compute helper for table vectors exposed as
storage bindings. Supply `GPUVector` objects by binding name:

```ts
const computation = new GPUTableComputation(device, {
  source: computeShader,
  shaderLayout: computeShaderLayout,
  inputVectors: {
    particlePositions,
    particleVelocities
  }
});
```

Direct single-buffer vectors bind once. Multi-batch aggregate vectors use
`dispatchBatches(computePass, batch => workgroupCount)` so each batch is rebound
with the correct storage-buffer range before dispatch.

Relevant public types:

| Type | Meaning |
| --- | --- |
| `GPUTableComputationProps` | Construction props, including ordinary `bindings` plus `inputVectors`. |
| `GPUTableComputationBatch` | Batch metadata passed to a dynamic workgroup-count callback. |

## Planning Table Buffer Groups

`GPUTableBufferPlanner` is a lower-level helper for applications that already have
column descriptors and need to decide how those columns should consume GPU
buffer bindings. It does not upload buffers, interleave data, or bind storage
buffers. It only returns a plan that describes allocation groups, column
mappings, and which columns should be represented by planner-owned packed or
storage buffers.

Use it when a table has more columns than the target device can expose as
separate vertex buffers, or when row-geometry data may later be read from WebGPU
storage buffers instead of expanded into per-vertex attributes.

The object-model point is that planning is metadata-only. The planner does not
create `GPUData`, `GPUVector`, or `GPUTable` instances. See
[`GPUTableBufferPlanner`](/docs/api-reference/tables/gpu-table-buffer-planner)
for modes, options, and output shapes.

## Related References

- [Supported Arrow Types](/docs/api-reference/arrow/supported-arrow-types)
- [GPU Table Structure](/docs/api-reference/tables/gpu-table-structure)
- [GPUTable](/docs/api-reference/tables/gpu-table)
- [GPURecordBatch](/docs/api-reference/tables/gpu-record-batch)
- [GPUVector](/docs/api-reference/tables/gpu-vector)
- [GPUData](/docs/api-reference/tables/gpu-data)
- [GPUSchema](/docs/api-reference/tables/gpu-schema)
- [GPUVectorFormat](/docs/api-reference/tables/gpu-vector-format)
- [GPUTableBufferPlanner](/docs/api-reference/tables/gpu-table-buffer-planner)
