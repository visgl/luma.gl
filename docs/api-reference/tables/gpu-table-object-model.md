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

`GPUData`, `GPUVector`, `GPURecordBatch`, and `GPUTable`
are GPU-side representations for typed table columns and batches. Arrow vectors,
record batches, and tables are common construction inputs through
`@luma.gl/arrow`; the generic GPU objects do not retain references to those
sources after extracting the buffer data and metadata they need.

The object model is batch-preserving by default:

- `GPUTable.batches[]` contains real GPU record batches with batch-local
  buffers.
- Table-level `gpuVectors` aggregate those batch-local chunks through
  `GPUVector.data[]`.
- `GPUData` is the chunk/range primitive. It always points at a
  `DynamicBuffer`, even when that wrapper adopts an existing static GPU buffer.
- `ArrowModel.drawBatches(renderPass)` draws preserved GPU batches by reusing one
  compatible layout/pipeline and rebinding only each batch's attribute buffers.

This means a multi-batch Arrow table stays multi-batch after GPU upload. If the
application prefers fewer draw units, it packs explicitly:

```ts
const arrowGPUTable = makeArrowGPUTable(device, table, {shaderLayout});

// Replace preserved batches with one packed batch.
arrowGPUTable.packBatches();

// Or greedily merge adjacent batches until each emitted batch reaches the threshold.
arrowGPUTable.packBatches({minBatchSize: 50_000});
```

Packing mutates the table in place. It rebuilds `batches[]`, table-level
`gpuVectors`, and `attributes`, then destroys only superseded GPU buffers that
were owned by the removed batches. Borrowed external buffers are not destroyed.

### Ownership Rules

- GPU objects created from Arrow data own the GPU storage they allocate.
- GPU objects wrapping caller-supplied buffers are non-owning by default unless
  `ownsBuffer` is requested.
- `GPUData` is the storage-owning layer. A data view may own its `DynamicBuffer`
  or borrow an existing one, but `GPUVector` never owns raw buffers directly.
- `GPUVector` owns or borrows ordered `GPUData[]` chunks. Its `buffer` accessor
  is only a direct-bind convenience for vectors that resolve to one concrete
  backing surface.
- Detach operations transfer live objects out of the table instead of destroying
  them.
- `destroy()` always follows the current ownership graph. It never destroys
  borrowed buffers.

## GPUData

`GPUData` describes one typed GPU data range. It stores logical type metadata,
logical row count, byte offset, row byte stride, and a stable
`DynamicBuffer` handle.

Construction modes:

```ts
// Upload one Arrow Data chunk into a new owned DynamicBuffer.
const gpuData = makeArrowGPUData(device, arrowData);

// Describe an existing DynamicBuffer range.
const gpuDataView = new GPUData({
  buffer: dynamicBuffer,
  dataType,
  length,
  byteOffset,
  byteStride
});
```

Public state:

| Member | Meaning |
| --- | --- |
| `buffer` | Stable `DynamicBuffer` for the uploaded or wrapped storage |
| `type` | Arrow data type |
| `length` | Logical row count |
| `stride` | Scalar values per logical row |
| `byteOffset` | First logical row in the GPU buffer |
| `byteStride` | Bytes between logical rows |
| `ownsBuffer` | Whether `destroy()` releases the buffer |

Public methods:

| Method | Behavior |
| --- | --- |
| `readArrowGPUDataAsync(gpuData)` | Reconstructs one Arrow data chunk for supported numeric and fixed-size-list types |
| `destroy()` | Destroys the owned dynamic buffer, if any |

## GPUVector

`GPUVector` is a logical typed vector over one or more `GPUData` chunks. Its
`data[]` array is the authoritative storage surface for batch-aware code.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeArrowGPUVector(device, arrowVector)` | Upload an Arrow vector into owned GPU storage |
| `makeArrowGPUVector(device, arrowVector, {name})` | Named Arrow upload form used by table helpers |
| `{type: 'buffer', ...}` | Wrap an existing typed GPU buffer |
| `{type: 'interleaved', ...}` | Wrap one interleaved opaque binary row buffer |
| `{type: 'data', ...}` | Aggregate existing `GPUData[]` chunks |
| `makeAppendableArrowGPUVector(device, dataType, props)` | Create empty growable Arrow-backed `DynamicBuffer` storage |

Public state:

| Member | Meaning |
| --- | --- |
| `name` | Vector/table column name |
| `type` | Arrow logical type |
| `length` | Aggregate logical row count |
| `stride` | Scalar values per logical row |
| `byteOffset` | First row offset when the vector has one direct backing buffer |
| `byteStride` | Bytes between logical rows |
| `bufferLayout` | Optional layout for interleaved vectors |
| `data[]` | Ordered GPU data chunks |
| `buffer` | Directly bindable buffer when the vector has exactly one concrete backing surface |
| `ownsBuffer` | Whether destruction follows any owning `GPUData` retained by this vector |
| `capacityRows` | Current appendable storage capacity in rows, when applicable |

Public methods:

| Method | Behavior |
| --- | --- |
| `addData(gpuData)` | Appends an existing GPU data chunk to the logical vector without adopting its buffer |
| `appendArrowDataToGPUVector(gpuVector, arrowData)` | Appends one Arrow data chunk into appendable trailing storage |
| `appendArrowVectorToGPUVector(gpuVector, arrowVector)` | Appends every Arrow data chunk from an Arrow vector into appendable storage |
| `resetLastBatch()` | Clears appendable logical rows while retaining allocation |
| `readArrowGPUVectorAsync(gpuVector)` | Reads a packed vector back for supported non-interleaved layouts |
| `transferBufferOwnership(target)` | Moves same-buffer `GPUData` ownership to another vector view |
| `destroy()` | Releases owned vector storage |

## GPURecordBatch

`GPURecordBatch` is one drawable GPU batch. It owns batch-local vectors,
schema metadata, buffer layout, and model-ready attributes.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeArrowGPURecordBatch(device, recordBatch, props)` | Upload one Arrow record batch |
| `{vectors, ...}` | Build a GPU batch from existing vectors |
| `makeAppendableArrowGPURecordBatch({...})` | Create an empty mutable GPU batch |

Public state:

| Member | Meaning |
| --- | --- |
| `schema` | GPU-facing Arrow schema for the selected columns |
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
| `appendArrowRecordBatchToGPURecordBatch(batch, recordBatch)` | Appends Arrow rows into an appendable batch |
| `resetLastBatch()` | Clears appendable rows while retaining allocations |
| `destroy()` | Destroys owned vectors and their storage |

## GPUTable

`GPUTable` is the table-level owner and mutation surface. It preserves real
GPU batches, exposes aggregate vectors, and controls packing, detaching, and
appendability.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeArrowGPUTable(device, table, props)` | Upload an Arrow table and preserve source record-batch boundaries |
| `{vectors, ...}` | Build one GPU table/batch from existing vectors |
| `makeAppendableArrowGPUTable({...})` | Create an empty table with one mutable trailing GPU batch |

The appendable discriminator matters because this form does not upload an
existing Arrow table. It creates empty schema-selected vectors backed by growable
`DynamicBuffer`s so later `appendArrowBatchToGPUTable()` calls can append rows in place.

Public state:

| Member | Meaning |
| --- | --- |
| `schema` | GPU-facing Arrow schema for selected columns |
| `numRows` | Aggregate table row count |
| `numCols` | Selected GPU column count |
| `nullCount` | Aggregate null count |
| `bufferLayout` | Layout entries shared by compatible batches |
| `gpuVectors` | Aggregate vectors keyed by shader attribute name |
| `attributes` | Attribute buffers for the first directly drawable batch surface |
| `bindings` | Storage buffers for the first directly bindable batch surface |
| `batches[]` | Real batch-local `GPURecordBatch` objects |

Public methods:

| Method | Behavior |
| --- | --- |
| `packBatches(options?)` | Greedily merges adjacent batches in place; no options collapses all batches into one |
| `addBatch(gpuRecordBatch)` | Adds an already-created GPU batch and rebuilds aggregate vectors |
| `appendArrowBatchToGPUTable(table, recordBatchOrTable)` | Appends Arrow rows into the current trailing appendable GPU batch |
| `resetLastBatch()` | Clears only the current trailing appendable GPU batch |
| `select(...columnNames)` | Destructively keeps requested columns and destroys dropped batch-local vectors |
| `detachVector(columnName)` | Removes one live column and returns an aggregate vector that owns its detached storage |
| `detachBatches({first, last})` | Removes and returns a half-open batch range `[first, last)` |
| `destroy()` | Destroys owned batches and their vectors |

Low-level incremental assembly can stay ownership-explicit with
`arrowGPUTable.addBatch(gpuRecordBatch)` and
`arrowGPUVector.addData(gpuData)`, which aggregate existing GPU objects instead
of allocating replacement tables.

Appendable regular tables use the same table and batch classes:

```ts
const arrowGPUTable = makeAppendableArrowGPUTable({
  device,
  schema,
  shaderLayout,
  initialCapacityRows: 4_096
});

appendArrowBatchToGPUTable(arrowGPUTable, recordBatch);
appendArrowBatchToGPUTable(arrowGPUTable, nextArrowTable);
```

```ts
import {makeArrowGPUTable} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/tables';

const arrowGPUTable = makeArrowGPUTable(device, table, {shaderLayout});

// The schema describes the selected GPU columns, not necessarily the full table.
const [colorField] = arrowGPUTable.schema.fields;

// Each GPU vector exposes Arrow-derived type/shape metadata plus GPU data chunks.
const colorVector: GPUVector = arrowGPUTable.gpuVectors.instanceColors;
```

## Table-Backed Render, Transform, and Compute Helpers

The table APIs are meant to feed more than one execution style.

### `GPUTableModel` and `ArrowModel`

Use `GPUTableModel` when a prepared GPU table should drive ordinary rendering:

```ts
const model = new GPUTableModel(device, {
  source,
  shaderLayout,
  table,
  tableCount: 'instance'
});
```

Use `ArrowModel` when selected Arrow table columns should first be adapted into
GPU table storage:

```ts
const model = new ArrowModel(device, {
  source,
  shaderLayout,
  arrowTable,
  arrowCount: 'instance'
});
```

`tableCount` and Arrow's compatibility `arrowCount` choose whether table row
counts become `instanceCount`, `vertexCount`, or neither. Existing `GPUTable`
instances can be supplied through `arrowGPUTable` when ownership should stay
with the caller.

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
- [GPUTableBufferPlanner](/docs/api-reference/tables/gpu-table-buffer-planner)
