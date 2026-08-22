# GPU Tables

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-tables.md)[Structure](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table-structure.md)[Lifecycle](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table-lifecycle.md)

From v9.4Experimental API

`@luma.gl/experimental/gpu-tables` provides private batch-preserving table helpers for rendering, transforms, and compute. It builds on the primitive objects in [`@luma.gl/gpgpu/gpu-data`](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data.md).

## Start Here[​](#start-here "Direct link to Start Here")

* Read the [GPU Tables guide](https://luma.gl/next/docs/api-guide/gpu/gpu-tables.md) for end-to-end attribute and storage workflows.
* Read [GPU Table Structure](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table-structure.md) for the logical-column and physical-batch object model.
* Use [`GPUTable`](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table.md) for data ownership and [`GPUTableShaderBindings`](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table-shader-bindings.md) for backend-specific shader resources.
* Use `@luma.gl/arrow` adapters when source data is Apache Arrow.

## API Reference[​](#api-reference "Direct link to API Reference")

* [GPU Table Structure](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table-structure.md)
* [GPU Table Lifecycle](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table-lifecycle.md)
* [GPUTable](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table.md)
* [GPURecordBatch](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-record-batch.md)
* [GPUSchema](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-schema.md)
* [GPUInputSchema](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-input-schema.md)
* [GPUTable Shader Bindings](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table-shader-bindings.md)
* [GPUTableBufferPlanner](https://luma.gl/next/docs/api-reference/experimental/gpu-tables/gpu-table-buffer-planner.md)
* [GPGPU Data Primitives](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data.md)
* [Supported Arrow Types](https://luma.gl/next/docs/api-reference/arrow/supported-arrow-types.md)

The subpath owns `GPURecordBatch`, `GPUTable`, `GPUSchema`, `GPUField`, `GPUTypeMap`, table bindings, table computations, and generic table planners. Models can publish `GPUInputSchema` declarations for the prepared table inputs they accept. `GPUTableShaderBindings` resolves those declarations into owned, batch-preserving attribute and storage resources for a shader layout. Table-oriented execution helpers include `TableTransform`, `GPUTableComputation`, `GPUTableBufferPlanner`, and generated-buffer batching utilities. `GPUTableModel` renders preserved table batches through one model pipeline, while `GPUTableGeometry` exposes a packed static table as ordinary GPU geometry. Specialized path and polygon models live separately in `@luma.gl/experimental/models`.

Arrow-specific construction and analysis helpers live in `@luma.gl/arrow`. Applications that ingest Apache Arrow data should use those adapters to build the generic GPU table objects exposed here.

## Installing[​](#installing "Direct link to Installing")

This subpath is experimental in 9.4 and is installed with its containing package. Install GPGPU as well when constructing primitive data objects directly:

```
npm install @luma.gl/gpgpu @luma.gl/experimental
```
