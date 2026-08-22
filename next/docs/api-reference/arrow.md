# Overview

[Overview](https://luma.gl/next/docs/api-reference/arrow.md)[Arrow Representations](https://luma.gl/next/docs/api-reference/arrow/arrow-representations.md)[Conversion](https://luma.gl/next/docs/api-reference/arrow/arrow-conversion.md)[Supported Types](https://luma.gl/next/docs/api-reference/arrow/supported-arrow-types.md)[Utilities](https://luma.gl/next/docs/api-reference/arrow/arrow-utils.md)[deck.gl API](https://luma.gl/next/docs/api-reference/arrow/deck-target-api.md)

From v10Experimental API

Apache Arrow utilities for luma.gl.

### GeoArrow

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/arrow/arrow-geoarrow)Info

InfoSource

```
// Loading source…
```

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

## API Reference[​](#api-reference "Direct link to API Reference")

* [Arrow Utilities](https://luma.gl/next/docs/api-reference/arrow/arrow-utils.md)
* [Arrow Representations](https://luma.gl/next/docs/api-reference/arrow/arrow-representations.md)
* [Arrow Table Conversion](https://luma.gl/next/docs/api-reference/arrow/arrow-conversion.md)
* [Supported Arrow Types](https://luma.gl/next/docs/api-reference/arrow/supported-arrow-types.md)
* [deck.gl v10 API Directions](https://luma.gl/next/docs/api-reference/arrow/deck-target-api.md)

## Apache Arrow Preliminaries[​](#apache-arrow-preliminaries "Direct link to Apache Arrow Preliminaries")

Apache Arrow has a rich type system that can represent a wide variety of binary data columns. A subset of these column types can be used directly as GPU vertex attribute data, meaning that such arrow columns can be uploaded efficiently to the GPU.

Apache Arrow supports primitive types like `Float32`, `Uint32`, and `Uint8` that describe the value stored in each row. It also supports fixed-length vectors of these types with `FixedSizeList`. These scalar and fixed-length vector types map directly to the memory layouts used by GPU vertex attributes.

Arrow also supports variable-length `List` columns. These are useful for data such as polygons and paths, but they do not map directly to a single vertex attribute without an additional conversion step. `PathAttributeModel` provides the attribute-backed conversion for prepared Float32 XY, XYZ, and XYZM path coordinate rows, expanding each logical path into segment instances while keeping row-level style columns at the path boundary. `PathStorageModel` provides the WebGPU storage-backed form: compute expands GPU-resident path values into compact indexed segment records from copied list-offset metadata, render shaders fetch coordinates from the original path-value storage buffer, and per-path style rows remain storage bindings instead of being repeated for every generated segment. Use `ArrowPathRenderer.convertToGPUVectors()` or `convertArrowPathToGPUVectors()` to turn raw Float32 or Float64 Arrow path vectors into prepared path-attribute inputs. Use `ArrowPathRenderer.convertToGPUVectors(..., {model: 'storage'})` or `convertArrowPathStorageToGPUVectors()` when WebGPU storage rendering should convert Float64 path payloads into Float32 deltas on the GPU before rendering.

## GPU Table Interop[​](#gpu-table-interop "Direct link to GPU Table Interop")

`@luma.gl/arrow` adapts Apache Arrow objects into primitive [`@luma.gl/gpgpu/gpu-data`](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data.md) objects and higher-level [`@luma.gl/experimental/gpu-tables`](https://luma.gl/next/docs/api-reference/experimental/gpu-tables.md) objects:

* `makeGPUDataFromArrowData()` uploads one Arrow `Data` chunk into a `GPUData`.
* `makeGPUVectorFromArrow()` uploads one Arrow `Vector` into a `GPUVector`.
* `makeGPURecordBatchFromArrowRecordBatch()` uploads one Arrow `RecordBatch`.
* `makeGPUTableFromArrowTable()` uploads one Arrow `Table` while preserving source record batch boundaries.
* `makeGPUAnalyticsTableFromArrowTable()` uploads renderer-independent numeric and dictionary columns into existing GPU tables while preserving source batches, validity masks, and category metadata for GPU dataframe execution.
* `makeArrowTableFromGPUAnalyticsTable()` explicitly reads a GPU analytical result back into Arrow, reconstructing nullable numeric/dictionary columns and either preserved per-batch selection or explicitly requested global ordering. Combined with [`LuSQLContext`](https://luma.gl/next/docs/api-reference/experimental/gpu-sql.md) from the separate `@luma.gl/experimental/gpu-sql` subpath, this provides an Arrow input → GPU dataframe execution → Arrow output workflow without adding Apache Arrow to generic table or SQL packages.
* `makeGPUSplatDataFromArrow()` prepares independently owned Gaussian splat batches for [`@luma.gl/splats`](https://luma.gl/next/docs/api-reference/splats.md), decoding GraphDECO encodings without clamping or quantizing spherical-harmonic DC radiance.
* `makeGPUSplatDataFromArrowStream()` progressively prepares Gaussian splat batches without concatenating Arrow tables or rebuilding previously uploaded GPU buffers. Both Gaussian conversion helpers accept structurally compatible Arrow objects from other installed Arrow versions, including those produced by loaders.gl 5 alpha.
* `ArrowInputSchema` combines source resolution and conversion with final `GPUInputSchema` validation for model-specific prepared inputs.

The resulting table schema is `GPUSchema`, and each vector has a `GPUVector.format` memory-layout string such as `float32x3`, `unorm8x4`, or `vertex-list<float32x3>`. Arrow `DataType` metadata may still be retained by adapter/readback paths, but neither `@luma.gl/gpgpu` nor `@luma.gl/experimental` depends on `apache-arrow`.

See [luma.gl](http://luma.gl) for documentation.
