# GPURecordBatch

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GPURecordBatch` represents one preserved GPU batch. It owns batch-local
[`GPUVector`](/docs/api-reference/tables/gpu-vector) objects,
[`GPUSchema`](/docs/api-reference/tables/gpu-schema) metadata, model-ready
attributes, and WebGPU storage bindings.

## Usage

```ts
import {GPURecordBatch} from '@luma.gl/tables';

const batch = new GPURecordBatch({
  vectors: {
    positions,
    colors
  }
});
```

When the source is an Arrow `RecordBatch`, prefer
[`makeGPURecordBatchFromArrowRecordBatch()`](/docs/api-reference/arrow/supported-arrow-types) from
`@luma.gl/arrow`.

## Constructor

### `new GPURecordBatch(props)`

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `vectors` | `Record<string, GPUVector> \| GPUVector[]` | Required | Batch-local GPU vectors keyed by name or supplied as named vectors. |
| `bufferLayout` | `BufferLayout[]` | Derived | Precomputed batch buffer layouts. |
| `fields` | `GPUField[]` | Derived | Selected schema fields. |
| `numRows` | `number` | Derived | Explicit row count for intentionally vector-less batches. |
| `metadata` | `Map<string, string>` | `undefined` | Batch-level schema metadata. |
| `nullCount` | `number` | `0` | Number of null rows retained in batch metadata. |
| `bindings` | `Record<string, Buffer \| DynamicBuffer>` | `{}` | Model-ready storage bindings keyed by shader binding name. |

## Properties

| Property | Type | Meaning |
| --- | --- | --- |
| `schema` | `GPUSchema` | GPU-facing schema for selected columns. |
| `numRows` | `number` | Number of logical rows in the batch. |
| `numCols` | `number` | Number of selected GPU columns. |
| `nullCount` | `number` | Number of null rows retained in metadata. |
| `bufferLayout` | `BufferLayout[]` | Buffer layouts derived by the producing adapter. |
| `gpuVectors` | `Record<string, GPUVector>` | Batch-local vectors keyed by shader/table column name. |
| `attributes` | `Record<string, Buffer \| DynamicBuffer>` | Model-ready attribute buffers keyed by buffer layout name. |
| `bindings` | `Record<string, Buffer \| DynamicBuffer>` | Model-ready storage bindings keyed by shader binding name. |

## Methods

### `appendRows(numRows, nullCount?): this`

Adds logical row and null counts after an adapter appends into batch-local
vectors.

### `resetRows(): this`

Clears logical row and null counts while retaining vectors and allocations.

### `resetLastBatch(): this`

Clears appendable vector payloads plus batch row/null counts while retaining
allocations.

### `destroy(): void`

Destroys every owned `GPUVector` retained by this batch.

## Notes

`GPURecordBatch` is the natural unit for preserved source batches. Rendering and
compute helpers can rebind `attributes` and `bindings` one batch at a time.
