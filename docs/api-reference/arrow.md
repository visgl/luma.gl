# Overview

[Overview](https://luma.gl/docs/api-reference/arrow.md)[Arrow Representations](https://luma.gl/docs/api-reference/arrow/arrow-representations.md)[Conversion](https://luma.gl/docs/api-reference/arrow/arrow-conversion.md)[Supported Types](https://luma.gl/docs/api-reference/arrow/supported-arrow-types.md)[Utilities](https://luma.gl/docs/api-reference/arrow/arrow-utils.md)[deck.gl API](https://luma.gl/docs/api-reference/arrow/deck-target-api.md)

From v10Experimental API

Apache Arrow conversion is available through optional subpaths of the published luma.gl packages. Install `apache-arrow` alongside the packages whose adapters you use. The generic package roots remain usable without Apache Arrow. The graph package installs its required `@math.gl/geospatial` dependency for GeoArrow conversion automatically.

```
yarn add @luma.gl/graph @luma.gl/engine apache-arrow
```

| Import                  | Responsibilities                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `@luma.gl/graph/arrow`  | Primitive Arrow inspection, colors, matrix and temporal conversion, GPU data/vector upload, and vector readback.           |
| `@luma.gl/graph/arrow`  | Record batches, GPU tables, analytical table ingestion/readback, input schemas, GeoArrow adaptation, and DGGS preparation. |
| `@luma.gl/engine/arrow` | Geometry and picking adapters, path/polygon/text preparation and rendering facades, and Gaussian splat conversion.         |

```
import {makeGPUVectorFromArrow} from '@luma.gl/graph/arrow';

import {makeGPUTableFromArrowTable} from '@luma.gl/graph/arrow';

import {makeGPUGeometryFromArrow} from '@luma.gl/engine/arrow';
```

The standalone private Arrow workspace package has been removed. These entries retain the existing conversion and renderer behavior; they do not introduce a new graph execution model. Application renderers can consume converted GPU vectors and geometries without depending on Arrow themselves.

### GeoArrow

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/arrow/arrow-geoarrow)Info

InfoSource

Mobile quality

```
// Loading source…
```

0

<!-- -->

s

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

0

<!-- -->

s

## API Reference[​](#api-reference "Direct link to API Reference")

* [Arrow Utilities](https://luma.gl/docs/api-reference/arrow/arrow-utils.md)
* [Arrow Representations](https://luma.gl/docs/api-reference/arrow/arrow-representations.md)
* [Arrow Table Conversion](https://luma.gl/docs/api-reference/arrow/arrow-conversion.md)
* [Supported Arrow Types](https://luma.gl/docs/api-reference/arrow/supported-arrow-types.md)
* [deck.gl v10 API Directions](https://luma.gl/docs/api-reference/arrow/deck-target-api.md)

## Choose a column representation[​](#choose-a-column-representation "Direct link to Choose a column representation")

Scalar and fixed-size-list columns can map to vertex attributes. Variable-length lists need a model-specific conversion or storage path. See [Supported Arrow types](https://luma.gl/docs/api-reference/arrow/supported-arrow-types.md) for the support matrix and [Arrow conversion](https://luma.gl/docs/api-reference/arrow/arrow-conversion.md) for path, color, matrix, and temporal conversion helpers.

## GPU Table Interop[​](#gpu-table-interop "Direct link to GPU Table Interop")

The optional Arrow adapters convert Apache Arrow objects into primitive [`@luma.gl/graph/gpu-data`](https://luma.gl/docs/api-reference/graph/gpu-data.md) objects and higher-level [`@luma.gl/graph/gpu-tables`](https://luma.gl/docs/api-reference/experimental/gpu-tables.md) objects:

* `makeGPUDataFromArrowData()` uploads one Arrow `Data` chunk into a `GPUData`.
* `makeGPUVectorFromArrow()` uploads one Arrow `Vector` into a `GPUVector`.
* `convertArrowColumnToGPUVector()` converts numeric and color columns for rendering, optionally applying a row transform and returning validity and residual-low vectors. Its result owns the uploaded buffers; call `destroy()` when finished.
* `makeGPURecordBatchFromArrowRecordBatch()` uploads one Arrow `RecordBatch`.
* `makeGPUTableFromArrowTable()` uploads one Arrow `Table` while preserving source record batch boundaries.
* `makeGPUAnalyticsTableFromArrowTable()` uploads renderer-independent numeric and dictionary columns into existing GPU tables while preserving source batches, validity masks, and category metadata for GPU dataframe execution.
* `makeArrowTableFromGPUAnalyticsTable()` explicitly reads a GPU analytical result back into Arrow, reconstructing nullable numeric/dictionary columns and either preserved per-batch selection or explicitly requested global ordering. Combined with [`GPUSQLContext`](https://luma.gl/docs/api-reference/experimental/gpu-sql.md) from the separate `@luma.gl/graph/gpu-sql` subpath, this provides an Arrow input → GPU dataframe execution → Arrow output workflow without adding Apache Arrow to generic table or SQL packages.
* `makeGPUSplatDataFromArrow()` prepares independently owned Gaussian splat batches for [`@luma.gl/engine/splats`](https://luma.gl/docs/api-reference/splats.md), decoding GraphDECO encodings without clamping or quantizing spherical-harmonic DC radiance.
* `makeGPUSplatDataFromArrowStream()` progressively prepares Gaussian splat batches without concatenating Arrow tables or rebuilding previously uploaded GPU buffers. Both Gaussian conversion helpers accept structurally compatible Arrow objects from other installed Arrow versions, including those produced by loaders.gl 5 alpha.
* `ArrowInputSchema` combines source resolution and conversion with final `GPUInputSchema` validation for model-specific prepared inputs.

The resulting table schema is `GPUSchema`, and each vector has a `GPUVector.format` memory-layout string such as `float32x3`, `unorm8x4`, or `vertex-list<float32x3>`. Arrow `DataType` metadata may still be retained by adapter/readback paths. Apache Arrow is an optional peer of the three owning packages and is loaded only by their Arrow entries. `@luma.gl/graph/arrow` does not import graph or engine; `@luma.gl/graph/arrow` does not import engine.

## Ownership and streaming[​](#ownership-and-streaming "Direct link to Ownership and streaming")

The move preserves source chunks, record batches, nullability, and source-row metadata. Upload helpers retain their existing ownership rules: converted data owns its uploaded buffers, borrowed chunks remain borrowed, and destroying aggregate vectors must not destroy borrowed data. Streaming adapters append independent batches; packing or merging remains an explicit caller decision. Readback remains asynchronous and explicit. `GPUVector.format` describes stored GPU bytes; Arrow type metadata supports conversion and readback rather than replacing the GPU format.
