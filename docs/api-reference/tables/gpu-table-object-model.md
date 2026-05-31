# GPUTable Object Model

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

This page documents the generic GPU table object model in `@luma.gl/tables`:
ownership, batching, packing, table-backed rendering, transform, compute, and
buffer planning. For Apache Arrow column compatibility and preparation helpers,
see [Supported Arrow Types](/docs/api-reference/arrow/supported-arrow-types).

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

## GPUData

`GPUData` describes one GPU buffer plus typed row metadata. It stores the
canonical `GPUVectorFormat`, logical row count, optional flattened
`valueLength`, byte offset, row byte stride, and ownership flag.

Construction modes:

```ts
// Upload one Arrow Data chunk into a new owned GPU buffer.
const gpuData = makeArrowGPUData(device, arrowData);

// Describe an existing GPU buffer as one data chunk.
const gpuDataView = new GPUData({
  buffer,
  format: 'float32x3',
  length,
  byteStride: 12
});
```

Public state:

| Member | Meaning |
| --- | --- |
| `buffer` | `Buffer` or `DynamicBuffer` for this chunk |
| `format` | Canonical GPU memory format |
| `type` | Deprecated adapter-owned logical type metadata |
| `length` | Logical row count |
| `valueLength` | Fixed-row count or flattened vertex-list element count |
| `stride` | Scalar values per fixed row or flattened element |
| `byteOffset` | First logical row in the GPU buffer |
| `byteStride` | Bytes between fixed rows or flattened elements |
| `ownsBuffer` | Whether `destroy()` releases the buffer |

Public methods:

| Method | Behavior |
| --- | --- |
| `readArrowGPUDataAsync(gpuData)` | Adapter readback helper in `@luma.gl/arrow` |
| `destroy()` | Destroys the owned buffer, if any |

## GPUVector

`GPUVector` is a logical typed vector over one or more `GPUData` chunks. Its
`data[]` array is the authoritative storage surface for batch-aware code.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeGPUVectorFromArrow(device, arrowVector)` | Upload an Arrow vector into owned GPU storage |
| `makeGPUVectorFromArrow(device, arrowVector, {name})` | Named Arrow upload form used by table helpers |
| `{type: 'buffer', ...}` | Wrap an existing typed GPU buffer as one `GPUData` chunk |
| `{type: 'interleaved', ...}` | Wrap one interleaved opaque binary row buffer as one `GPUData` chunk plus `BufferLayout` |
| `{type: 'data', ...}` | Aggregate existing `GPUData[]` chunks |
| `makeAppendableArrowGPUVector(device, dataType, props)` | Create an empty vector that accepts future adapter-created `GPUData` chunks |

Public state:

| Member | Meaning |
| --- | --- |
| `name` | Vector/table column name |
| `format` | Canonical GPU memory format |
| `type` | Deprecated adapter-owned logical type metadata |
| `length` | Aggregate logical row count |
| `valueLength` | Aggregate fixed-row or flattened vertex-list element count |
| `stride` | Scalar values per fixed row or flattened element |
| `byteOffset` | Compatibility metadata for the first row when the vector has one chunk |
| `byteStride` | Bytes between fixed rows or flattened elements |
| `bufferLayout` | Optional layout for interleaved vectors |
| `data[]` | Ordered GPU data chunks |
| `ownsBuffer` | Whether destruction follows any owning `GPUData` retained by this vector |
| `capacityRows` | Current logical rows for appendable vectors |

Public methods:

| Method | Behavior |
| --- | --- |
| `addData(gpuData)` | Appends an existing GPU data chunk to the logical vector without adopting its buffer |
| `appendArrowDataToGPUVector(gpuVector, arrowData)` | Uploads one Arrow data chunk into a new GPU buffer and appends it |
| `appendArrowVectorToGPUVector(gpuVector, arrowVector)` | Appends every Arrow data chunk from an Arrow vector into appendable storage |
| `resetLastBatch()` | Clears appendable logical rows and destroys appended buffers |
| `readArrowGPUVectorAsync(gpuVector)` | Adapter readback helper in `@luma.gl/arrow` |
| `transferBufferOwnership(target)` | Moves same-buffer `GPUData` ownership to another vector view |
| `destroy()` | Releases owned vector storage |

## GPURecordBatch

`GPURecordBatch` is one drawable or dispatchable GPU batch. It owns batch-local
vectors, `GPUSchema` metadata, buffer layout, and model-ready attributes.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeArrowGPURecordBatch(device, recordBatch, props)` | Upload one Arrow record batch |
| `{vectors, ...}` | Build a GPU batch from existing vectors |
| `makeAppendableArrowGPURecordBatch({...})` | Create an empty mutable GPU batch |

Public state:

| Member | Meaning |
| --- | --- |
| `schema` | GPU-facing `GPUSchema` for the selected columns |
| `numRows` | Batch row count |
| `numCols` | Selected GPU column count |
| `nullCount` | Batch null count |
| `bufferLayout` | Layout entries for model binding |
| `gpuVectors` | Batch-local vectors keyed by selected attribute name |
| `attributes` | Batch-local attribute buffers keyed by shader attribute name |
| `bindings` | Batch-local storage buffers keyed by shader binding name |

Public methods:

| Method | Behavior |
| --- | --- |
| `appendArrowRecordBatchToGPURecordBatch(batch, recordBatch)` | Uploads Arrow rows into an initially empty appendable batch |
| `resetLastBatch()` | Clears appendable rows and destroys appended chunk buffers |
| `destroy()` | Destroys owned vectors and their storage |

## GPUTable

`GPUTable` is the table-level owner and mutation surface. It preserves real
GPU batches, exposes aggregate vectors, and controls packing, detaching, and
streaming append, and destruction.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeArrowGPUTable(device, table, props)` | Upload an Arrow table and preserve source record-batch boundaries |
| `{vectors, ...}` | Build one GPU table/batch from existing vectors |
| `makeAppendableArrowGPUTable({...})` | Create an empty table with one initially empty appendable trailing GPU batch |

The appendable discriminator matters because this form does not upload an
existing Arrow table. It creates empty schema-selected vectors that retain device
and buffer props. Later `appendArrowBatchToGPUTable()` calls upload each source
record batch into new `GPUData` chunks instead of merging rows into one shared
buffer.

Public state:

| Member | Meaning |
| --- | --- |
| `schema` | GPU-facing `GPUSchema` for selected columns |
| `numRows` | Aggregate table row count |
| `numCols` | Selected GPU column count |
| `nullCount` | Aggregate null count |
| `bufferLayout` | Layout entries shared by compatible batches |
| `gpuVectors` | Aggregate vectors keyed by shader attribute name |
| `attributes` | Attribute buffers for the first directly drawable batch |
| `bindings` | Storage buffers for the first directly bindable batch |
| `batches[]` | Real batch-local `GPURecordBatch` objects |

Public methods:

| Method | Behavior |
| --- | --- |
| `packBatches(options?)` | Greedily merges adjacent batches in place; no options collapses all batches into one |
| `addBatch(gpuRecordBatch)` | Adds an already-created GPU batch and rebuilds aggregate vectors |
| `appendArrowBatchToGPUTable(table, recordBatchOrTable)` | Uploads Arrow rows into preserved append batches without merging previous buffers |
| `resetLastBatch()` | Clears only the current trailing appendable GPU batch |
| `select(...columnNames)` | Destructively keeps requested columns and destroys dropped batch-local vectors |
| `detachVector(columnName)` | Removes one live column and returns an aggregate vector that owns its detached storage |
| `detachBatches({first, last})` | Removes and returns a half-open batch range `[first, last)` |
| `destroy()` | Destroys owned batches and their vectors |

Low-level incremental assembly can stay ownership-explicit with
`gpuTable.addBatch(gpuRecordBatch)` and `gpuVector.addData(gpuData)`. These
operations aggregate existing GPU objects instead of allocating replacement
tables.

Appendable regular tables use the same table and batch classes:

```ts
const gpuTable = makeAppendableArrowGPUTable({
  device,
  schema,
  shaderLayout
});

appendArrowBatchToGPUTable(gpuTable, recordBatch);
appendArrowBatchToGPUTable(gpuTable, nextArrowTable);
```

```ts
import {makeArrowGPUTable} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/tables';

const gpuTable = makeArrowGPUTable(device, table, {shaderLayout});

// The schema describes the selected GPU columns, not necessarily the full table.
const [colorField] = gpuTable.schema.fields;

// Each GPU vector exposes Arrow-derived type/shape metadata plus GPU data chunks.
const colorVector: GPUVector = gpuTable.gpuVectors.instanceColors;
```

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

See the standalone
[`GPUTableBufferPlanner`](/docs/api-reference/tables/gpu-table-buffer-planner)
reference for the full planner API.

```ts
import {GPUTableBufferPlanner} from '@luma.gl/tables';

const plan = GPUTableBufferPlanner.getAllocationPlan({
  device,
  modelInfo: {isInstanced: true},
  generateConstantAttributes: device.type === 'webgpu',
  columns: [
    {
      id: 'positions',
      byteStride: 8,
      byteLength: 8 * 4,
      rowCount: 4,
      stepMode: 'vertex',
      supportsPackedBuffer: true
    },
    {
      id: 'instancePositions',
      byteStride: 12,
      byteLength: 12 * table.numRows,
      rowCount: table.numRows,
      stepMode: 'instance',
      isPosition: true,
      supportsPackedBuffer: true,
      priority: 'high'
    },
    {
      id: 'instanceColors',
      byteStride: 4,
      byteLength: 4 * table.numRows,
      rowCount: table.numRows,
      stepMode: 'instance',
      supportsPackedBuffer: true
    }
  ]
});
```

The planner supports two modes:

- `table-with-shared-geometry`: one reusable geometry is drawn once for each
  table row. Vertex-rate columns describe the shared geometry; table columns are
  usually instance-rate attributes.
- `table-with-row-geometries`: each table row expands into its own generated
  vertices, such as paths or polygons. Constants are planned as a one-row
  instance-rate group.

The returned `plan.groups` describe physical allocation groups such as
`separate-attribute-column`, `interleaved-attribute-columns`,
`position-attribute-columns`, and `interleaved-constant-attribute-columns`.
`plan.mappingsByColumnId` maps each source column to shader-visible attribute
names and group ids. `plan.packedColumnIds` identifies columns that callers may
pack into planner-owned vertex buffers.

When `useStorageBuffers` is enabled, WebGPU row-geometry data columns may be
assigned to `separate-storage-column` or `stacked-storage-columns` groups. This
is planner output only in the current implementation; callers still need their own
storage-buffer upload and shader binding path. Storage planning observes
`maxStorageBuffersPerShaderStage`, `maxStorageBufferBindingSize`, and uses
256-byte alignment for stacked column offsets.

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
