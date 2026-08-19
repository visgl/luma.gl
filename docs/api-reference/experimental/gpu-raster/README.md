import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {GPUExampleCard} from '@site/src/components/docs/gpu-example-card';
import {RasterLabExample} from '@site/src/examples';

# GPU Raster

<ExperimentalDocsTabs active="gpu-raster" />

## Overview

`@luma.gl/experimental/gpu-raster` provides nodata-aware raster and spatial-field operations that
compose through `GPUCommandGraph`. It makes tile ownership, halos, analytical overviews, residency,
capacity, and replayable global statistics explicit.

## When to use it

Use GPU Raster for analytical raster pipelines whose intermediate bands, masks, labels, statistics,
or contour geometry should remain on the GPU. Image-only presentation effects that do not require
analytical values usually belong in a renderer or shader module instead.

## Quick start

```ts
import {GPUCommandGraph} from '@luma.gl/experimental/gpu-core';
import {GPURasterBand, GPURasterStatistics} from '@luma.gl/experimental/gpu-raster';

const graph = new GPUCommandGraph({device, id: 'raster-analysis'});
const band = new GPURasterBand({device, graph, values, validity, width, height});
const statistics = new GPURasterStatistics({device, graph, band});

statistics.addPasses();
const compiledGraph = graph.compile();
```

## Core concepts and data model

- Raster bands keep values separate from validity so nodata never becomes an accidental value.
- Tiles own half-open pixel cores; halos provide neighboring samples without duplicating ownership.
- Source overviews and GPU-generated analytical overviews have different provenance and policies.
- Global tiled statistics use explicit initialization and replay rather than adding incompatible
  local histograms.
- Resident tiles are leased under separate CPU and GPU budgets controlled by the application.

Read [GPU Raster concepts](/docs/api-reference/experimental/gpu-raster/concepts) for nodata, connectivity, tiling, halos, overviews, replay, and
residency in detail.

## Try the Satellite Raster Lab

<GPUExampleCard
  demonstrates={['nodata masks', 'NDVI', 'histograms', 'raster composition']}
  input="Synthetic satellite reflectance bands and validity masks"
  gpuOutput="Derived bands, valid-pixel statistics, and display texture"
  cpuReadback="Small chart and status summaries"
  execution="Graph-driven analysis recomputed on control changes"
  compatibility="WebGPU"
  fullPageHref="/examples/showcase/raster-lab"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/examples/showcase/raster-lab"
  inspectorHref="/examples/showcase/raster-lab?panel=graph"
/>

<RasterLabExample embedded />

## Operations and API index

| Family | Operations |
| --- | --- |
| Storage and residency | raster bands, decoded tile sources, tile residency, owned-core extraction |
| Overviews | floating mean, weighted pyramids, categorical nearest and mode |
| Pixel operations | pointwise band math, NDVI, contrast, gamma, equalization, thresholds |
| Statistics | valid-pixel reductions, histograms, replayable global statistics, quantiles |
| Filters and morphology | stencils, convolution, Gaussian/box smoothing, gradients, dilation, erosion, opening, closing |
| Regions and contours | connected components, dense labels, region measurements, marching squares, indirect overlays |

The [operations reference](/docs/api-reference/experimental/gpu-raster/operations) documents inputs, outputs, execution, capacity, and cost.

## Limits and compatibility

- GPU Raster is experimental and WebGPU-only.
- Tile sources, decoded arrays, GPU residency, cancellation, and submission remain application-owned.
- Cross-tile component identity is not currently merged automatically.
- Capacity-dependent labels, geometry, and statistics report overflow or incomplete work.

## Related modules

- [GPU Core](/docs/api-reference/experimental/gpu-core) provides scheduling and generic
  aggregation/indexing primitives.
- [GPU Project](/docs/api-reference/experimental/gpu-project) handles coordinate projection and adaptive patches.
- [GPU Raster concepts](/docs/api-reference/experimental/gpu-raster/concepts) explains the execution model independently of individual classes.
