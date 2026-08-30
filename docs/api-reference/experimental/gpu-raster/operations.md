---
title: GPURaster operations
description: Index of GPURaster storage, overview, statistics, pixel, filtering, morphology, region, and contour operations.
---

import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPURaster operations reference

<ExperimentalDocsTabs active="gpu-raster-operations" />

## Overview

`@luma.gl/experimental/gpu-raster` provides optional, graph-native WebGPU operations for
two-dimensional scientific and geospatial rasters. Applications control image decoding,
coordinate transforms, source buffers and textures, output allocation, command submission, and
optional readback; an explicitly selected residency cache can upload and own source buffers on
their behalf.

`GPURasterTileReader` validates application-owned, asynchronously decoded raster sources without
choosing a network transport, image codec, or GPU uploader. `GPURasterTileCache` optionally adds
explicitly budgeted CPU/GPU tile residency, cancellation-safe loading, and reusable compiled
graphs around that reader. `GPURasterTileHaloAssembler` coordinates cumulative receptive-field
planning and fence-safe neighboring tile leases; `GPURasterTileHaloFill` and
`GPURasterTileCoreExtract` explicitly assemble native samples and publish seam-safe owned cores
through the caller's command graph. `GPURasterOverview` and
`GPURasterCategoricalOverview` separately generate nodata-aware analytical overview values and
coverage without mistaking source-selected samples or presentation mipmaps for scientific
reductions. Explicit global initialization, tiled statistic merges, stable-domain histogram
replay, and bounded percentile selection preserve caller-owned dataset-wide results across
separately processed tiles. The reader, cache, and assembler never submit commands.

Current contributors cover raster metadata, explicit texture/buffer conversion, calibrated
pointwise band math, normalized difference vegetation index (NDVI), validity-aware histograms,
scalar summaries, contrast/gamma/equalization transforms, analytical thresholds, mask-aware
neighborhood stencils, direct convolution, separable Gaussian/box smoothing, signed
Sobel/Scharr/Laplacian derivatives, gradient magnitude, binary/grayscale dilation, erosion,
opening, closing, deterministic connected foreground components, bounded dense region labels and
counts, grouped intensity and spatial region measurements, GPU-resident marching-squares
contours, indirect vector overlays, and adapter-limit planning. They implement
`GPUCommandGraphContributor` structurally: calling `addToGraph(graph)` only declares work. No
contributor submits commands or reads results back.

## Choose an operation family

| Family | Use it for |
| --- | --- |
| [Storage and residency](/docs/api-reference/experimental/gpu-raster/operations-storage-residency) | Validity, decoded sources, tile caches, cancellation, halos, and owned cores. |
| [Analytical overviews](/docs/api-reference/experimental/gpu-raster/operations-overviews) | Continuous and categorical multiresolution summaries. |
| [Statistics](/docs/api-reference/experimental/gpu-raster/operations-statistics) | Histograms, scalar summaries, tiled replay, and quantiles. |
| [Pixel operations](/docs/api-reference/experimental/gpu-raster/operations-pixel) | Band math, NDVI, contrast, gamma, equalization, and thresholds. |
| [Filters and morphology](/docs/api-reference/experimental/gpu-raster/operations-filters-morphology) | Neighborhood filters, convolution, gradients, dilation, erosion, opening, and closing. |
| [Regions and contours](/docs/api-reference/experimental/gpu-raster/operations-regions-contours) | Connected components, region measurements, marching squares, and indirect overlays. |

## How to use this reference

Start with [GPURaster concepts](/docs/api-reference/experimental/gpu-raster/concepts) if nodata,
validity masks, tile cores, halos, or analytical overviews are unfamiliar. Each operation-family
page states ownership, capacity, failure, and performance behavior alongside its API examples.

## Related pages

- [GPURaster overview](/docs/api-reference/experimental/gpu-raster)
- [Satellite Raster Lab](/examples/showcase/raster-lab)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
