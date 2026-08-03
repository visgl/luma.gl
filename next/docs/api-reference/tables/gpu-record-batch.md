# GPURecordBatch

[Overview](https://luma.gl/next/docs/api-reference/tables.md)[Structure](https://luma.gl/next/docs/api-reference/tables/gpu-table-structure.md)[Lifecycle](https://luma.gl/next/docs/api-reference/tables/gpu-table-lifecycle.md)[GPUTable](https://luma.gl/next/docs/api-reference/tables/gpu-table.md)[GPUConstant](https://luma.gl/next/docs/api-reference/tables/gpu-constant.md)[GPURecordBatch](https://luma.gl/next/docs/api-reference/tables/gpu-record-batch.md)[GPUVector](https://luma.gl/next/docs/api-reference/tables/gpu-vector.md)[GPUData](https://luma.gl/next/docs/api-reference/tables/gpu-data.md)[GPUDataView](https://luma.gl/next/docs/api-reference/tables/gpu-data-view.md)[GPUSchema](https://luma.gl/next/docs/api-reference/tables/gpu-schema.md)[GPUInputSchema](https://luma.gl/next/docs/api-reference/tables/gpu-input-schema.md)[Shader Bindings](https://luma.gl/next/docs/api-reference/tables/gpu-table-shader-bindings.md)[GPUVectorFormat](https://luma.gl/next/docs/api-reference/tables/gpu-vector-format.md)[Buffer Planner](https://luma.gl/next/docs/api-reference/tables/gpu-table-buffer-planner.md)

![From: v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`GPURecordBatch` represents one immutable preserved GPU batch. It owns one batch-local [`GPUData`](https://luma.gl/next/docs/api-reference/tables/gpu-data.md) chunk per selected column, [`GPUSchema`](https://luma.gl/next/docs/api-reference/tables/gpu-schema.md) metadata, and buffer-layout metadata.

## Usage[​](#usage "Direct link to Usage")

```
import {GPURecordBatch} from '@luma.gl/tables';

const batch = new GPURecordBatch({
  gpuData: {
    positions: positions.data[0],
    colors: colors.data[0]
  }
});
```

When the source is an Arrow `RecordBatch`, prefer [`makeGPURecordBatchFromArrowRecordBatch()`](https://luma.gl/next/docs/api-reference/arrow/supported-arrow-types.md) from `@luma.gl/arrow`.

## Constructor[​](#constructor "Direct link to Constructor")

### `new GPURecordBatch(props)`[​](#new-gpurecordbatchprops "Direct link to new-gpurecordbatchprops")

| Prop           | Type                      | Default     | Meaning                                                       |
| -------------- | ------------------------- | ----------- | ------------------------------------------------------------- |
| `gpuData`      | `Record<string, GPUData>` | Required    | One batch-local GPU data chunk keyed by selected column name. |
| `bufferLayout` | `BufferLayout[]`          | Derived     | Precomputed batch buffer layouts.                             |
| `fields`       | `GPUField[]`              | Derived     | Selected schema fields.                                       |
| `numRows`      | `number`                  | Derived     | Explicit row count for intentionally data-less batches.       |
| `metadata`     | `Map<string, string>`     | `undefined` | Batch-level schema metadata.                                  |
| `nullCount`    | `number`                  | `0`         | Number of null rows retained in batch metadata.               |

## Properties[​](#properties "Direct link to Properties")

| Property       | Type                      | Meaning                                                    |
| -------------- | ------------------------- | ---------------------------------------------------------- |
| `schema`       | `GPUSchema`               | GPU-facing schema for selected columns.                    |
| `numRows`      | `number`                  | Number of logical rows in the batch.                       |
| `numCols`      | `number`                  | Number of selected GPU columns.                            |
| `nullCount`    | `number`                  | Number of null rows retained in metadata.                  |
| `bufferLayout` | `BufferLayout[]`          | Buffer layouts derived by the producing adapter.           |
| `gpuData`      | `Record<string, GPUData>` | Batch-local data chunks keyed by shader/table column name. |

## Reserved Draw Columns[​](#reserved-draw-columns "Direct link to Reserved Draw Columns")

`gpuData.indices` is reserved for batch-local indexed rendering. It is a `vertex-list<uint32>` chunk whose flattened `valueLength` is the index count for this batch. The chunk remains part of `gpuData` and `schema`, but it is not emitted as an attribute buffer layout; its single `GPUData` buffer must be created with `Buffer.INDEX` usage so `GPUTableModel` can bind it as the model index buffer.

## Methods[​](#methods "Direct link to Methods")

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys every retained `GPUData` chunk. Each chunk destroys its buffer only when it owns that buffer.

## Notes[​](#notes "Direct link to Notes")

`GPURecordBatch` mirrors Arrow `RecordBatch`: each selected column contributes one batch-local data chunk. Multi-chunk logical columns are table-level `GPUVector` views built by `GPUTable`.
