# GPUTable

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GPUTable` is the table-level owner and mutation surface for GPU-resident
columns. It preserves real
[`GPURecordBatch`](/docs/api-reference/tables/gpu-record-batch) objects, exposes
aggregate [`GPUVector`](/docs/api-reference/tables/gpu-vector) views, and
controls packing, detaching, selection, reset, and destruction.

## Usage

```ts
import {GPUTable} from '@luma.gl/tables';

const table = new GPUTable({
  vectors: {
    positions,
    colors
  }
});
```

When the source is an Arrow `Table`, prefer
[`makeArrowGPUTable()`](/docs/api-reference/arrow/supported-arrow-types) from
`@luma.gl/arrow`.

## Constructor Modes

| Mode | Key props | Use when |
| --- | --- | --- |
| `{vectors}` | `vectors`, `metadata`, `nullCount` | Build one GPU table and one GPU record batch from existing vectors. |
| `{batches}` | `batches`, `schema`, `bufferLayout`, `numRows`, `nullCount` | Preserve already-created GPU record batches. |

## Properties

| Property | Type | Meaning |
| --- | --- | --- |
| `schema` | `arrow.Schema` | GPU-facing schema for selected columns. |
| `numRows` | `number` | Aggregate logical row count. |
| `numCols` | `number` | Number of selected GPU columns. |
| `nullCount` | `number` | Aggregate null row count. |
| `bufferLayout` | `BufferLayout[]` | Buffer layout shared by compatible preserved batches. |
| `gpuVectors` | `Record<string, GPUVector>` | Aggregate vectors keyed by table/shader column name. |
| `attributes` | `Record<string, Buffer \| DynamicBuffer>` | Attribute buffers for the first directly drawable batch surface. |
| `bindings` | `Record<string, Buffer \| DynamicBuffer>` | Storage bindings for the first directly bindable batch surface. |
| `batches` | `GPURecordBatch[]` | Preserved batch-local GPU storage. |

## Methods

### `packBatches(options?): this`

Replaces preserved GPU batches with fewer packed batches. With no options, all
batches are packed into one. With `minBatchSize`, adjacent batches are greedily
merged until each emitted batch reaches the requested row count.

### `addBatch(batch): this`

Adds one already-created `GPURecordBatch` and rebuilds aggregate row counts and
vectors. The batch must match the table's buffer layout and selected schema
fields.

### `refreshFromBatches(): this`

Recomputes aggregate row counts and aggregate vector views from preserved
batches.

### `resetLastBatch(): this`

Clears only the trailing appendable GPU batch while retaining its allocations.

### `select(...columnNames): this`

Destructively keeps only the requested columns. Dropped batch-local vectors are
destroyed.

### `detachVector(columnName): GPUVector`

Removes one live column and returns an aggregate vector that owns its detached
batch-local storage.

### `detachBatches(options?): GPURecordBatch[]`

Removes and returns a half-open batch range. `first` defaults to `0`; `last`
defaults to `batches.length`.

### `destroy(): void`

Destroys retained GPU batches and follows their vector-level ownership graphs.

## Ownership

`GPUTable` owns the batches it retains. Detach operations transfer live objects
out of the table instead of destroying them. Packing allocates replacement GPU
buffers and destroys superseded owned batches after the table has swapped to the
new packed representation.
