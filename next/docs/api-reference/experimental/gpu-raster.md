# GPU Raster

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)[Concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/experimental/gpu-raster` provides nodata-aware raster and spatial-field operations that compose through `GPUCommandGraph`. It makes tile ownership, halos, analytical overviews, residency, capacity, and replayable global statistics explicit.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use GPU Raster for analytical raster pipelines whose intermediate bands, masks, labels, statistics, or contour geometry should remain on the GPU. Image-only presentation effects that do not require analytical values usually belong in a renderer or shader module instead.

## Quick start[​](#quick-start "Direct link to Quick start")

```
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';

import {GPURasterBand, GPURasterStatistics} from '@luma.gl/experimental/gpu-raster';



const graph = new GPUCommandGraph({device, id: 'raster-analysis'});

const band = new GPURasterBand({device, graph, values, validity, width, height});

const statistics = new GPURasterStatistics({device, graph, band});



statistics.addPasses();

const compiledGraph = graph.compile();
```

## Core concepts and data model[​](#core-concepts-and-data-model "Direct link to Core concepts and data model")

* Raster bands keep values separate from validity so nodata never becomes an accidental value.
* Tiles own half-open pixel cores; halos provide neighboring samples without duplicating ownership.
* Source overviews and GPU-generated analytical overviews have different provenance and policies.
* Global tiled statistics use explicit initialization and replay rather than adding incompatible local histograms.
* Resident tiles are leased under separate CPU and GPU budgets controlled by the application.

Read [GPU Raster concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md) for nodata, connectivity, tiling, halos, overviews, replay, and residency in detail.

## Try the Satellite Raster Lab[​](#try-the-satellite-raster-lab "Direct link to Try the Satellite Raster Lab")

* Demonstrates

  nodata masks · NDVI · histograms · raster composition

* Input

  Synthetic satellite reflectance bands and validity masks

* GPU output

  Derived bands, valid-pixel statistics, and display texture

* CPU readback

  Small chart and status summaries

* Execution

  Graph-driven analysis recomputed on control changes

* Compatibility

  WebGPU

[Open full page](https://luma.gl/next/examples/showcase/raster-lab)[View source](https://github.com/visgl/luma.gl/tree/master/examples/showcase/raster-lab)[Inspect graph](https://luma.gl/next/examples/showcase/raster-lab?panel=graph)

Preparing GPU experience**GPURaster: Satellite Raster Lab**Loading synthetic satellite bands and the GPU-native raster-analysis graph.

Scroll page · Ctrl/⌘ + scroll to interact

## Operations and API index[​](#operations-and-api-index "Direct link to Operations and API index")

| Family                 | Operations                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| Storage and residency  | raster bands, decoded tile sources, tile residency, owned-core extraction                     |
| Overviews              | floating mean, weighted pyramids, categorical nearest and mode                                |
| Pixel operations       | pointwise band math, NDVI, contrast, gamma, equalization, thresholds                          |
| Statistics             | valid-pixel reductions, histograms, replayable global statistics, quantiles                   |
| Filters and morphology | stencils, convolution, Gaussian/box smoothing, gradients, dilation, erosion, opening, closing |
| Regions and contours   | connected components, dense labels, region measurements, marching squares, indirect overlays  |

The [operations reference](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md) documents inputs, outputs, execution, capacity, and cost.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

* GPU Raster is experimental and WebGPU-only.
* Tile sources, decoded arrays, GPU residency, cancellation, and submission remain application-owned.
* Cross-tile component identity is not currently merged automatically.
* Capacity-dependent labels, geometry, and statistics report overflow or incomplete work.

## Related modules[​](#related-modules "Direct link to Related modules")

* [GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md) provides scheduling and generic aggregation/indexing primitives.
* [GPU Project](https://luma.gl/next/docs/api-reference/experimental/gpu-project.md) handles coordinate projection and adaptive patches.
* [GPU Raster concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md) explains the execution model independently of individual classes.
