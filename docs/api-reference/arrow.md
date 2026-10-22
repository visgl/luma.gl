# Overview

[Overview](https://luma.gl/docs/api-reference/arrow.md)[Arrow Representations](https://luma.gl/docs/api-reference/arrow/arrow-representations.md)[Conversion](https://luma.gl/docs/api-reference/arrow/arrow-conversion.md)[Supported Types](https://luma.gl/docs/api-reference/arrow/supported-arrow-types.md)[Utilities](https://luma.gl/docs/api-reference/arrow/arrow-utils.md)[deck.gl API](https://luma.gl/docs/api-reference/arrow/deck-target-api.md)

From v10Experimental API

Apache Arrow utilities for luma.gl.

### GeoArrow

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/arrow/arrow-geoarrow)Info

InfoSource

Mobile quality

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## Arrow Rendering[​](#arrow-rendering "Direct link to Arrow Rendering")

These live examples exercise luma.gl's Arrow path, polygon, and text conversion and rendering stack through temporary deck.gl integration layers. They demonstrate progressive `RecordBatch` streaming, direct columnar inputs, constant and column styling, attribute rendering, and WebGPU storage rendering.

PathsPolygonsText

### Arrow Path Layer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/deck/arrow-path-layer/app.ts)Info

InfoSource

```
// Loading source…
```

**Loading example**Preparing GPU resources…

## API Reference[​](#api-reference "Direct link to API Reference")

* [Arrow Utilities](https://luma.gl/docs/api-reference/arrow/arrow-utils.md)
* [Arrow Representations](https://luma.gl/docs/api-reference/arrow/arrow-representations.md)
* [Arrow Table Conversion](https://luma.gl/docs/api-reference/arrow/arrow-conversion.md)
* [Supported Arrow Types](https://luma.gl/docs/api-reference/arrow/supported-arrow-types.md)
* [deck.gl v10 API Directions](https://luma.gl/docs/api-reference/arrow/deck-target-api.md)

## Choose a column representation[​](#choose-a-column-representation "Direct link to Choose a column representation")

Scalar and fixed-size-list columns can map to vertex attributes. Variable-length lists need a model-specific conversion or storage path. See [Supported Arrow types](https://luma.gl/docs/api-reference/arrow/supported-arrow-types.md) for the support matrix and [Arrow conversion](https://luma.gl/docs/api-reference/arrow/arrow-conversion.md) for path, color, matrix, and temporal conversion helpers.

## GPU Table Interop[​](#gpu-table-interop "Direct link to GPU Table Interop")

`@luma.gl/arrow` adapts Apache Arrow objects into primitive [`@luma.gl/gpgpu/gpu-data`](https://luma.gl/docs/api-reference/gpgpu/gpu-data.md) objects and higher-level [`@luma.gl/experimental/gpu-tables`](https://luma.gl/docs/api-reference/experimental/gpu-tables.md) objects:

* `makeGPUDataFromArrowData()` uploads one Arrow `Data` chunk into a `GPUData`.
* `makeGPUVectorFromArrow()` uploads one Arrow `Vector` into a `GPUVector`.
* `makeGPURecordBatchFromArrowRecordBatch()` uploads one Arrow `RecordBatch`.
* `makeGPUTableFromArrowTable()` uploads one Arrow `Table` while preserving source record batch boundaries.
* `makeGPUAnalyticsTableFromArrowTable()` uploads renderer-independent numeric and dictionary columns into existing GPU tables while preserving source batches, validity masks, and category metadata for GPU dataframe execution.
* `makeArrowTableFromGPUAnalyticsTable()` explicitly reads a GPU analytical result back into Arrow, reconstructing nullable numeric/dictionary columns and either preserved per-batch selection or explicitly requested global ordering. Combined with [`LuSQLContext`](https://luma.gl/docs/api-reference/experimental/gpu-sql.md) from the separate `@luma.gl/experimental/gpu-sql` subpath, this provides an Arrow input → GPU dataframe execution → Arrow output workflow without adding Apache Arrow to generic table or SQL packages.
* `makeGPUSplatDataFromArrow()` prepares independently owned Gaussian splat batches for [`@luma.gl/splats`](https://luma.gl/docs/api-reference/splats.md), decoding GraphDECO encodings without clamping or quantizing spherical-harmonic DC radiance.
* `makeGPUSplatDataFromArrowStream()` progressively prepares Gaussian splat batches without concatenating Arrow tables or rebuilding previously uploaded GPU buffers. Both Gaussian conversion helpers accept structurally compatible Arrow objects from other installed Arrow versions, including those produced by loaders.gl 5 alpha.
* `ArrowInputSchema` combines source resolution and conversion with final `GPUInputSchema` validation for model-specific prepared inputs.

The resulting table schema is `GPUSchema`, and each vector has a `GPUVector.format` memory-layout string such as `float32x3`, `unorm8x4`, or `vertex-list<float32x3>`. Arrow `DataType` metadata may still be retained by adapter/readback paths, but neither `@luma.gl/gpgpu` nor `@luma.gl/experimental` depends on `apache-arrow`.
