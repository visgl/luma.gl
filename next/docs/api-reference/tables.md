# Overview

[Overview](https://luma.gl/next/docs/api-reference/tables.md)[Structure](https://luma.gl/next/docs/api-reference/tables/gpu-table-structure.md)[Lifecycle](https://luma.gl/next/docs/api-reference/tables/gpu-table-lifecycle.md)[GPUTable](https://luma.gl/next/docs/api-reference/tables/gpu-table.md)[GPUConstant](https://luma.gl/next/docs/api-reference/tables/gpu-constant.md)[GPURecordBatch](https://luma.gl/next/docs/api-reference/tables/gpu-record-batch.md)[GPUVector](https://luma.gl/next/docs/api-reference/tables/gpu-vector.md)[GPUData](https://luma.gl/next/docs/api-reference/tables/gpu-data.md)[GPUDataView](https://luma.gl/next/docs/api-reference/tables/gpu-data-view.md)[GPUSchema](https://luma.gl/next/docs/api-reference/tables/gpu-schema.md)[GPUInputSchema](https://luma.gl/next/docs/api-reference/tables/gpu-input-schema.md)[Shader Bindings](https://luma.gl/next/docs/api-reference/tables/gpu-table-shader-bindings.md)[GPUVectorFormat](https://luma.gl/next/docs/api-reference/tables/gpu-vector-format.md)[Buffer Planner](https://luma.gl/next/docs/api-reference/tables/gpu-table-buffer-planner.md)

![From: v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

Typed, batch-preserving GPU table primitives for rendering, transforms, and compute.

## Start Here[​](#start-here "Direct link to Start Here")

* Read the [GPU Tables guide](https://luma.gl/next/docs/api-guide/gpu/gpu-tables.md) for end-to-end attribute and storage workflows.
* Read [GPU Table Structure](https://luma.gl/next/docs/api-reference/tables/gpu-table-structure.md) for the logical-column and physical-batch object model.
* Use [`GPUTable`](https://luma.gl/next/docs/api-reference/tables/gpu-table.md) for data ownership and [`GPUTableShaderBindings`](https://luma.gl/next/docs/api-reference/tables/gpu-table-shader-bindings.md) for backend-specific shader resources.
* Use `@luma.gl/arrow` adapters when source data is Apache Arrow.

## API Reference[​](#api-reference "Direct link to API Reference")

* [GPU Table Structure](https://luma.gl/next/docs/api-reference/tables/gpu-table-structure.md)
* [GPU Table Lifecycle](https://luma.gl/next/docs/api-reference/tables/gpu-table-lifecycle.md)
* [GPUTable](https://luma.gl/next/docs/api-reference/tables/gpu-table.md)
* [GPUConstant](https://luma.gl/next/docs/api-reference/tables/gpu-constant.md)
* [GPURecordBatch](https://luma.gl/next/docs/api-reference/tables/gpu-record-batch.md)
* [GPUVector](https://luma.gl/next/docs/api-reference/tables/gpu-vector.md)
* [GPUData](https://luma.gl/next/docs/api-reference/tables/gpu-data.md)
* [GPUDataView](https://luma.gl/next/docs/api-reference/tables/gpu-data-view.md)
* [GPUSchema](https://luma.gl/next/docs/api-reference/tables/gpu-schema.md)
* [GPUInputSchema](https://luma.gl/next/docs/api-reference/tables/gpu-input-schema.md)
* [GPUTable Shader Bindings](https://luma.gl/next/docs/api-reference/tables/gpu-table-shader-bindings.md)
* [GPUVectorFormat](https://luma.gl/next/docs/api-reference/tables/gpu-vector-format.md)
* [GPUTableBufferPlanner](https://luma.gl/next/docs/api-reference/tables/gpu-table-buffer-planner.md)
* [Supported Arrow Types](https://luma.gl/next/docs/api-reference/arrow/supported-arrow-types.md)

The `@luma.gl/tables` module owns reusable table-side GPU objects such as `GPUData`, `GPUDataView`, `GPUVector`, `GPUConstant`, `GPURecordBatch`, and `GPUTable`, plus structural typing types such as `GPUSchema`, `GPUField`, `GPUTypeMap`, `GPUVectorFormat`, `GPUDataStructFormat`, and `VertexList`. Physical struct formats let one `GPUData` expose named zero-copy child views over interleaved rows. Models can publish `GPUInputSchema` declarations for the prepared table inputs they accept. `GPUTableShaderBindings` resolves those declarations into owned, batch-preserving attribute and storage resources for a shader layout. Table-oriented execution helpers include `TableTransform`, `GPUTableComputation`, `GPUTableBufferPlanner`, and generated-buffer batching utilities. `GPUTableModel` renders preserved table batches through one model pipeline, while `GPUTableGeometry` exposes a packed static table as ordinary GPU geometry.

Arrow-specific construction and analysis helpers live in `@luma.gl/arrow`. Applications that ingest Apache Arrow data should use those adapters to build the generic GPU table objects exposed here.

## Installing[​](#installing "Direct link to Installing")

```
npm install @luma.gl/tables
```
