# GPURaster storage and residency

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)[Concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)

## Start here[​](#start-here "Direct link to Start here")

A raster is a rectangular grid of observations, not necessarily a picture. Its cells might contain reflectance, elevation, temperature, or a land-cover category. GPURaster keeps those observations, their missing-data status, and their geographical meaning available to GPU computation instead of flattening them into display colors.

| If you need to...                                                 | Start with...                                                                                      | Why                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Connect a decoded raster dataset or source-provided overview      | `GPURasterTileSource` and `GPURasterTileReader`                                                    | The application keeps its existing decoder, transport, and source metadata.                                            |
| Avoid repeatedly decoding and uploading bounded tiles             | `GPURasterTileCache`                                                                               | Explicit CPU/GPU budgets, eviction, leases, and compatible graph reuse control residency.                              |
| Calculate NDVI, arithmetic, or a local distribution               | `GPURasterNDVI`, `GPURasterBandMath`, or `GPURasterHistogram`                                      | Operations preserve scientific values, calibration, and observation validity.                                          |
| Filter across a tile boundary without seams                       | `GPURasterTileHaloAssembler`, `GPURasterTileHaloFill`, and `GPURasterTileCoreExtract`              | Real neighboring pixels are processed, but each output pixel has exactly one owner.                                    |
| Create a meaningful lower-resolution analytical grid              | `GPURasterOverview` or `GPURasterCategoricalOverview`                                              | Continuous means preserve valid-sample weights; categorical results preserve exact labels.                             |
| Calculate one histogram or threshold across many tiles            | `GPURasterGlobalInitialize`, `GPURasterGlobalStatisticsMerge`, and `GPURasterGlobalHistogramMerge` | Every tile contributes against the same final dataset-wide numerical domain.                                           |
| Identify connected classified foreground regions                  | `GPURasterConnectedComponents`                                                                     | Four- or eight-neighbor grouping preserves missing-data barriers and publishes an explicit GPU convergence signal.     |
| Obtain contiguous region IDs and a bounded exact component count  | `GPURasterDenseComponents`                                                                         | Converged representative roots become compact deterministic IDs with explicit capacity and overflow.                   |
| Measure intensity, population, centroid, and area for each region | `GPURasterRegionMeasurements`                                                                      | Independent geometry and intensity masks produce bounded GPU records while preserving high-precision spatial metadata. |

For a guided explanation of missing observations, grid ownership, replay, resource lifetimes, and common mistakes, read [GPURaster Concepts and Execution Model](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md).

### What “nodata-aware” means[​](#what-nodata-aware-means "Direct link to What “nodata-aware” means")

**Nodata** means an observation is missing or unusable. It does not mean its value is zero. A cloud can hide a satellite pixel; a sensor can publish a designated sentinel such as `-9999`; floating-point input can contain `NaN`; a calculation can encounter an unstable denominator. A nodata-aware operation excludes those observations without discarding meaningful values such as elevation `0`, category `0`, or valid binary background `0`.

GPURaster represents each observation with two independent pieces of information:

```
sample values:    [12,   0, -9999, 18,  0]

validity mask:    [ 1,   1,     1,  0,  0]

nodata sentinel:              -9999

observation:      valid valid missing missing missing
```

The second observation is a real zero because its validity is `1` and it does not equal the sentinel. The third is missing even though its mask is `1`: the raw sample matches the sentinel. The fourth and fifth are missing because their masks are `0`, regardless of their stored values. Floating operations additionally reject non-finite observations and results. The resulting validity must travel with the resulting values into later filters, histograms, thresholds, overviews, and other analytical stages.

### Tiles, cores, halos, and half-open bounds[​](#tiles-cores-halos-and-half-open-bounds "Direct link to Tiles, cores, halos, and half-open bounds")

A **tile** is a bounded rectangular subset of a larger raster. Its **core** is the set of pixels that tile owns and may publish. Bounds are **half-open**: `[0, 4)` contains columns `0`, `1`, `2`, and `3`, but not column `4`.

```
pixel column:        0  1  2  3 | 4  5  6  7

west owned core:     [0, 4)

east owned core:                  [4, 8)

west halo, radius 1: [0, 5)

east halo, radius 1:          [3, 8)
```

A **halo** is temporary neighboring coverage needed by an operation whose result depends on nearby samples. Both expanded regions may read columns `3` and `4`; only their disjoint cores publish them. This prevents artificial seams without double-counting boundary pixels. Successive neighborhoods accumulate their radii, and true outer dataset edges clip the halo.

### Source overviews versus analytical overviews[​](#source-overviews-versus-analytical-overviews "Direct link to Source overviews versus analytical overviews")

An **overview** is a lower-resolution grid covering the same source region. A source overview already exists in application-owned decoded data; GPURaster can select it, but its sampling policy remains the source's responsibility. An analytical overview is explicitly generated on the GPU from resident observations using a documented numerical policy.

For continuous observations, the footprint `[10, missing, 30, missing]` has mean `20`, not `10`: only the two valid samples contribute. Its separate sum `40` and count `2` preserve correct weights for further pyramid levels. Categorical labels instead use an explicitly selected nearest-center policy or the most frequent valid label. An invalid nearest-selected sample remains invalid rather than silently substituting a neighbor; category `0` remains valid when its separate mask is `1`.

### Local results versus replayable global results[​](#local-results-versus-replayable-global-results "Direct link to Local results versus replayable global results")

A tile-local histogram answers “what values occur in this tile?” A global histogram answers the same question for every selected, disjoint core. Local histograms with independently chosen minimum/maximum values cannot be added: their identically numbered bins represent different numerical intervals.

**Replayable** means the application can revisit bounded resident or reloaded tiles in multiple explicit phases while caller-owned global outputs remain on the GPU:

1. Reset the global accumulator once for the intended dataset run.
2. Visit every owned core to establish the complete global minimum, maximum, count, and sum.
3. Revisit those same cores and bin every valid value against that finalized global domain.
4. Optionally derive a GPU-resident approximate percentile or Otsu threshold.

Replay is not a background loader, an automatic second network fetch, or an implicit command submission. The application chooses tile traversal, caching, graph encoding, submission, and completion. Cached tiles can remain GPU-resident across both passes when budgets permit.

### CPU and GPU ownership at a glance[​](#cpu-and-gpu-ownership-at-a-glance "Direct link to CPU and GPU ownership at a glance")

| Stage                                                | Where the work happens                      | Who owns the policy or resource                                                           |
| ---------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Read, authenticate, decode, and select source levels | CPU/application-defined transport           | The application and its chosen decoder, potentially a future loaders.gl integration.      |
| Upload decoded samples                               | CPU-to-GPU transfer                         | The application, or an explicitly selected `GPURasterTileCache` for cache-owned buffers.  |
| Describe analysis and allocate final outputs         | CPU graph construction                      | The application owns imported buffers, graph selection, and published output allocations. |
| Execute analysis, reductions, and replay             | GPU compute passes                          | Contributors declare graph work; the application encodes and submits it.                  |
| Display or inspect results                           | GPU rendering; optional GPU-to-CPU transfer | The application chooses indirect rendering, compact summaries, or explicit readback.      |
| Release resident tiles and graphs                    | CPU-controlled GPU lifetime                 | The application retains leases and creates a completion fence after the final submission. |

GPURaster does not ship a GeoTIFF/COG parser, HTTP range transport, reprojection system, or implicit loaders.gl dependency. An application can place loaders.gl or another decoder on the CPU side of `GPURasterTileSource`; future loaders.gl 5 integration does not change ownership of GPU graphs, uploads, submissions, or fences.

### Analytical compute versus image effects[​](#analytical-compute-versus-image-effects "Direct link to Analytical compute versus image effects")

Use an ordinary image effect when the goal is to change how an already rendered image looks. Use GPURaster when the result must remain a scientifically meaningful GPU observation that a later histogram, threshold, filter, contour, or application can consume. Bounded tile residency, reusable graphs, separable filters, and compact scalar summaries can avoid full-image allocation, repeated upload, and unnecessary GPU-to-CPU transfers. Actual speed still depends on tile size, cache behavior, source latency, memory bandwidth, workload, and measured GPU performance; GPURaster does not promise that every analytical operation outruns a visual effect.

## Import the optional subpath[​](#import-the-optional-subpath "Direct link to Import the optional subpath")

```
import {DrawCommandBuffer, GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';

import {

  GPURasterBandMath,

  GPURasterBoxBlur,

  GPURasterCategoricalOverview,

  GPURasterClosing,

  GPURasterConnectedComponents,

  GPURasterContourClassifier,

  GPURasterContours,

  GPURasterContrast,

  GPURasterConvolution,

  GPURasterDenseComponents,

  GPURasterDilation,

  GPURasterErosion,

  GPURasterGaussianBlur,

  GPURasterGlobalHistogramMerge,

  GPURasterGlobalInitialize,

  GPURasterGlobalPercentile,

  GPURasterGlobalStatisticsMerge,

  GPURasterGradient,

  GPURasterGradientMagnitude,

  GPURasterHistogram,

  GPURasterLaplacian,

  GPURasterMorphology,

  GPURasterNDVI,

  GPURasterNeighborhood,

  GPURasterOpening,

  GPURasterOtsuThreshold,

  GPURasterOverview,

  GPURasterRegionMeasurements,

  GPURasterScharr,

  GPURasterSobel,

  GPURasterStatistics,

  GPURasterThreshold,

  GPURasterTileCache,

  GPURasterTileCoreExtract,

  GPURasterTileHaloAssembler,

  GPURasterTileHaloFill,

  GPURasterTileReader,

  getRasterRegionWorldCentroid,

  makeRasterOverviewMetadata,

  type GPURasterBufferBand,

  type GPURasterCategoricalOverviewFormat,

  type GPURasterCategoricalOverviewProps,

  type GPURasterConnectedComponentsProps,

  type GPURasterConnectivity,

  type GPURasterDecodedBand,

  type GPURasterDenseComponentsProps,

  type GPURasterGlobalAccumulator,

  type GPURasterGlobalHistogramMergeProps,

  type GPURasterGlobalInitializeProps,

  type GPURasterGlobalPercentileProps,

  type GPURasterGlobalStatisticsMergeProps,

  type GPURasterOverviewCategoricalPolicy,

  type GPURasterOverviewMetadataOptions,

  type GPURasterOverviewProps,

  type GPURasterOverviewScale,

  type GPURasterRegionMeasurementOutputs,

  type GPURasterRegionMeasurementsProps,

  type GPURasterTileGraphLease,

  type GPURasterTileHaloLease,

  type GPURasterTileHaloRequest,

  type GPURasterTileHaloSource,

  type GPURasterTileLease,

  type GPURasterTileRequest,

  type GPURasterTileSource

} from '@luma.gl/experimental/gpu-raster';
```

The `./gpu-raster` subpath is an explicit opt-in. Its runtime symbols are not exported from `@luma.gl/experimental`, and the existing experimental package remains private.

## Quick start: analyze valid observations on the GPU[​](#quick-start-analyze-valid-observations-on-the-gpu "Direct link to Quick start: analyze valid observations on the GPU")

The application supplies a device, raster dimensions, uploaded red and near-infrared bands, and explicitly allocated output views in the same command graph. In this example, `createApplicationOwnedRasterViews` represents application code; it is not a GPURaster loader or allocation helper.

```
const graph = new GPUCommandGraph(device, {id: 'vegetation-analysis'});



// Application-defined: import source buffers and allocate every published graph view.

const {

  redBand,

  nearInfraredBand,

  vegetationValues,

  vegetationValidity,

  histogramBins,

  histogramDomain

} = createApplicationOwnedRasterViews(graph, device);



new GPURasterNDVI({

  id: 'calibrated-vegetation-index',

  width,

  height,

  red: redBand,

  nearInfrared: nearInfraredBand,

  output: vegetationValues,

  outputValidity: vegetationValidity,

  epsilon: 0.0001

}).addToGraph(graph);



const vegetationBand: GPURasterBufferBand<'float32'> = {

  id: 'vegetation-index',

  format: 'float32',

  storage: {kind: 'buffer', values: vegetationValues},

  validity: vegetationValidity

};



new GPURasterHistogram({

  id: 'valid-vegetation-distribution',

  input: vegetationBand,

  output: histogramBins,

  domainOutput: histogramDomain

}).addToGraph(graph);



const compiled = graph.compile();

const encoder = device.createCommandEncoder();

compiled.encode(encoder, {parameters: undefined});

device.submit(encoder.finish());
```

The NDVI stage intersects the source masks, rejects raw nodata before calibration, and publishes a separate validity mask. The histogram consumes that mask and derives its domain only from valid index values. Compilation and encoding do not submit work; the final application-owned `device.submit` does. No raster pixels or histogram values are downloaded unless application code explicitly requests a readback after submission.

## Try the Satellite Raster Lab[​](#try-the-satellite-raster-lab "Direct link to Try the Satellite Raster Lab")

The [Satellite Raster Lab](https://luma.gl/next/examples/showcase/raster-lab) visualizes deterministic synthetic red and near-infrared imagery, GPU-derived NDVI, nodata/cloud masks, and a valid-pixel histogram. Source controls load full, western, or eastern synthetic windows at either the original resolution or an application-provided 2× overview; the displayed tile key, dimensions, level-zero origin, and `EPSG:32610` identity follow the actual decoded tile. Layer selection, Gaussian or box smoothing, neighborhood radius, Gaussian sigma, Sobel/Scharr/Laplacian edge operators, signed direction or gradient magnitude, contrast, gamma, manual or automatic Otsu threshold selection, denominator tolerance, and contour levels rebuild the actual GPU analysis pipeline. Morphology controls exercise all four dilation, erosion, opening, and closing operations; binary and grayscale modes; square and Manhattan-diamond footprints; radii zero through eight; strict/ignore nodata; and clamp, reflect, constant, or nodata borders, including the constant value. Grayscale morphology runs before contrast; binary morphology cleans the manual/Otsu threshold mask and exposes its boundary as a contour at `0.5`. The displayed raster, histogram, and scalar statistics reflect selected, smoothed, differentiated, morphologically processed, transformed valid pixels; interpolated contour lines are generated and drawn directly from GPU buffers. Only 228 bytes of scalar summaries, histogram bins, cutoff, and contour diagnostics are read back after graph submission. The indirect draw consumes its GPU-written instance count rather than a CPU-supplied count.

Changing to an uncached source window or overview explicitly decodes and uploads its native samples; revisiting a resident window reuses its existing CPU arrays and GPU buffers. The capacity slider exposes deterministic eviction, separate CPU/GPU occupancy, cache hits and misses, active lease pins, and compiled-graph reuse. Equally sized western and eastern windows reuse one compiled graph through per-encoding source-buffer replacement; full-resolution, overview, or differently specialized pipelines use separate compatible graph entries. Rapid changes cancel stale requests without destroying submitted GPU resources. CPU-to-GPU uploads do not increase the unchanged 228-byte GPU-to-CPU summary. Select **TILE ONLY** to analyze one source tile independently or **SEAMLESS HALO** to gather real neighboring resident samples, run smoothing, derivatives, and grayscale morphology over the cumulative padded region, and extract only the selected half-open core before displaying its statistics. Cumulative halo, owned-core bounds, and resident-source counts update with analytical controls and the chosen source overview. Choose **SOURCE NEAREST** to use the adapter's existing nearest-sample 2× overview, or **GPU MEAN** to generate a validity-aware mean from native source observations; selecting **GPU MEAN** automatically switches a native-resolution view to its 2× target. **MASK NEAREST** and **MASK MODE** become available in GPU-generated mode and select exact categorical coverage policies. Provenance and displayed analytical valid-pixel coverage distinguish the resulting inputs without increasing the 228-byte readback. This visible coverage is the existing post-filter/threshold valid count, not the unretrieved per-parent source contribution count. The current example deliberately makes **GPU MEAN** and **SEAMLESS HALO** mutually exclusive: selecting either switches the other back to its compatible source/tile mode. All analytical filters work on generated means, and source-nearest overviews retain their complete seam-safe path; composing native halo assembly before generated overviews remains future demo work. Choose **TILE** to keep the current window's local analytical domain or **FULL GLOBAL** to merge both owned synthetic windows into one stable dataset-wide extent, histogram, and GPU Otsu threshold. **WEST → EAST** and **EAST → WEST** change the explicit traversal order while preserving the global distribution; tile count, replay count, domain, population, and threshold diagnostics expose real graph work without increasing the existing 228-byte scalar readback. The **FULL GLOBAL** example supports native or source-nearest overview NDVI/red/near-infrared, contrast, gamma, manual thresholds, and global Otsu. It explicitly resets Gaussian/box smoothing, edge operators, morphology, generated overviews, and seamless halos; enabling any of those unsupported combinations returns to **TILE** mode. A generated global median reuses the existing four-byte threshold summary slot only when automatic Otsu is inactive.

Choose **COMPONENTS** to classify the current foreground into actual GPU-resident regions. **SPARSE ROOTS** preserves their minimum-pixel representative IDs; **DENSE 1..N** shows their contiguous row-major ranks. **4-CONNECTED** and **8-CONNECTED** determine whether diagonal touching joins regions, while an explicit component capacity distinguishes the exact required population from its bounded published count. Both presentation modes run the real GPU dense relabeling and count contributor. Sparse coloring remains usable if dense capacity overflows; the dense overlay is suppressed entirely when capacity is insufficient or propagation did not converge. Missing observations remain distinct from valid background.

Region mode operates on the selected local tile, explicitly exits **FULL GLOBAL**, and disables contours temporarily. Three existing contour diagnostic words carry exact required component count, GPU convergence, and actual rounds; the displayed bounded count and overflow derive from that required count and visible capacity. This does not replace the contributor's genuine caller-owned GPU bounded-count and overflow outputs. The separate foreground readout still counts selected pixels rather than regions. Existing source/analytical overviews, seam-safe local processing, smoothing, derivatives, morphology, manual thresholds, and local Otsu remain available; leaving component mode restores the previous contour policy and the summary remains exactly 228 bytes.

The optional **REGION METRICS** inspector selects one converged dense region and displays its real GPU pixel count, intensity sum/minimum/maximum/mean, local centroid transformed by the original double-precision affine, and coordinate-aware area. In this explicitly selected mode, the analytical histogram truly uses **40 bins** instead of its ordinary **48 bins**; the eight freed four-byte positions contain exactly one selected region record. The existing population, domain, component count, convergence, iteration count, and automatic threshold retain their previous slots. Turning the inspector off restores the genuine 48-bin histogram. Both paths use one 228-byte GPU-to-CPU readback; no complete region table or label raster is copied.

## Raster bands and validity[​](#raster-bands-and-validity "Direct link to Raster bands and validity")

`GPURaster` combines caller-owned bands with explicit width, height, affine pixel transform, pixel interpretation, optional coordinate-reference-system identity, overview level, and tile origin. Supported scalar formats are `float32`, `uint32`, and `sint32`. A band uses exactly one borrowed representation: a packed `GraphDataView` buffer or a compatible single-mip texture view.

Band metadata can define:

* `validity`: a packed, source-aligned `uint32` mask; zero rejects a pixel.
* `noDataValue`: a raw source-format sentinel compared before calibration.
* `scale` and `offset`: independent per-band calibration, `calibratedValue = rawValue * scale + offset`.

Pointwise analysis consumes buffer-backed bands and produces separate caller-owned `float32` values and canonical `uint32` validity flags. Invalid pixels receive `NaN` and validity `0`; valid pixels receive validity `1`. Non-finite raw or calibrated inputs and non-finite results are rejected. Integer nodata comparisons occur before float conversion, preserving exact `uint32` and `sint32` sentinel identities.

### How an observation becomes valid[​](#how-an-observation-becomes-valid "Direct link to How an observation becomes valid")

Interpret a sample in this order:

1. If a source validity mask exists and its entry is `0`, the observation is missing.
2. If the raw sample equals its band's raw-format `noDataValue`, it is missing.
3. Floating contributors reject non-finite raw values before calibration.
4. Apply the band's own scale and offset to the remaining raw sample.
5. Reject non-finite calibrated values or an operation-specific invalid result, such as an NDVI denominator whose magnitude does not exceed `epsilon`.

For example, a `uint32` band with `noDataValue: 65535`, `scale: 0.0001`, and `offset: -1` rejects raw `65535` **before** conversion or scaling. Raw `0` instead becomes a valid calibrated `-1` when its source mask is nonzero. Comparing calibrated values with the raw sentinel, or using truthiness to reject raw zero, would corrupt both observations.

Do not use stored result values as a substitute for their masks:

| Stored value              | Output validity | Meaning                                           |
| ------------------------- | --------------- | ------------------------------------------------- |
| Floating `0`              | `1`             | A real observed or calculated zero.               |
| Floating `NaN`            | `0`             | An invalid floating-point result.                 |
| Categorical or binary `0` | `1`             | A valid zero-valued category or valid background. |
| Categorical or binary `0` | `0`             | A missing categorical observation.                |

`GPURasterThreshold` publishes a classification band, not a complete observation-validity band: both below-threshold background and invalid samples contain zero. Preserve the original observation mask separately when passing threshold values into binary morphology or categorical analysis. Neighborhood operators also have explicit invalid-neighbor policies; “ignore and renormalize” and “propagate missingness” are different scientific choices, not interchangeable rendering effects.

Use `GPURasterTextureToBuffer` and `GPURasterBufferToTexture` for explicit representation changes. Texture upload, decoding, and readback are application responsibilities.

## Application-owned decoded tile sources[​](#application-owned-decoded-tile-sources "Direct link to Application-owned decoded tile sources")

Use `GPURasterTileSource` when an application obtains raster windows from a decoded GeoTIFF, cloud-optimized GeoTIFF, microscopy container, offline fixture, service endpoint, or another custom image provider. The source implementation, transport, authentication, worker scheduling, decoder licensing, CPU arrays, and upload policy remain entirely application-owned.

`GPURasterTileReader` validates this interface and each asynchronous decoded result. Unlike `GPURaster`, whose bands already refer to caller-owned GPU graph resources, a `GPURasterDecodedTile` holds native CPU typed arrays that the application must upload explicitly. The reader does not allocate GPU buffers, add graph passes, submit commands, cache results, or take ownership of the source.

```
const source: GPURasterTileSource = {

  metadata: {

    id: 'application-reflectance',

    width: 4096,

    height: 3072,

    affine: [30, 0, 500000, 0, -30, 4100000],

    pixelInterpretation: 'area',

    coordinateReferenceSystem: {authority: 'EPSG:32610'},

    bands: [

      {id: 'red', format: 'uint32', noDataValue: 65535, scale: 0.0001},

      {id: 'near-infrared', format: 'uint32', noDataValue: 65535, scale: 0.0001}

    ],

    levels: [

      {

        level: 0,

        width: 4096,

        height: 3072,

        tileWidth: 512,

        tileHeight: 512,

        downsample: [1, 1]

      },

      {

        level: 1,

        width: 2048,

        height: 1536,

        tileWidth: 256,

        tileHeight: 256,

        downsample: [2, 2]

      }

    ]

  },

  async readTile(request, signal) {

    signal.throwIfAborted();

    const tile = await applicationOwnedDecoder.readTile(request, signal);

    signal.throwIfAborted();

    return tile;

  }

};



const reader = new GPURasterTileReader(source);

const controller = new AbortController();

const request = {

  level: 1,

  pixelBounds: [256, 128, 768, 640],

  coordinateSpace: 'level-zero',

  bandIds: ['red', 'near-infrared']

} satisfies GPURasterTileRequest;

const normalizedRequest = reader.normalizeTileRequest(request);

// normalizedRequest.pixelBounds is [128, 64, 384, 320] in level coordinates.

const decoded = await reader.readTile(normalizedRequest, controller.signal);



// The application uploads decoded.bands and their separate validity arrays into its own graph.
```

The source metadata describes the complete level-zero raster: dimensions, pixel interpretation, double-precision JavaScript affine coefficients, optional coordinate-reference-system identity, optional level-zero origin, native band descriptors, and explicitly provided overview levels. Each band preserves its scalar format, exact raw-domain nodata sentinel, and optional calibration scale/offset. The source adapter implements `readTile(request, signal)` and must forward the provided `AbortSignal` to any application-owned fetch or decoder.

### Source windows, tile addressing, and selected bands[​](#source-windows-tile-addressing-and-selected-bands "Direct link to Source windows, tile addressing, and selected bands")

`GPURasterTileRequest.level` selects an explicitly declared source level. Omitting both `column` and `row` selects the entire level; providing both addresses one source tile of that level's declared `tileWidth` and `tileHeight`. Optional `pixelBounds` intersects that selection with a half-open `[minimumColumn, minimumRow, maximumColumn, maximumRow]` window. Ragged right/bottom tiles are clipped to actual level dimensions rather than padded implicitly.

`coordinateSpace: 'level'`, the default, expresses the optional window in the selected level's own pixel grid. `coordinateSpace: 'level-zero'` expresses it in the dataset's original full-resolution grid. `bandIds` explicitly selects a subset of declared source bands; omitting it selects every band in source order. Their native formats and metadata are preserved. The Raster Lab requests both red and near-infrared bands because NDVI needs both; other applications can request only the bands required by their own operation.

Each result includes the selected level, tile column/row, half-open `pixelBounds` in level-local pixels, corresponding `levelZeroBounds`, fully translated `GPURasterMetadata`, and the requested decoded bands. Missing or duplicate identifiers, inconsistent dimensions, incompatible typed arrays, malformed masks, or mismatched metadata are rejected rather than silently converted. The reader passes the adapter a normalized request with explicit `bandIds`, level-local `pixelBounds`, and `coordinateSpace: 'level'`; the adapter returns complete matching bounds, translated metadata, and bands in the requested order.

Call `reader.normalizeTileRequest(request)` when application scheduling, deduplication, or cache identity needs the same validated request that the source adapter will receive. An omitted band list expands to every source band in metadata order; omitted bounds expand to the complete selected level or addressed tile; an omitted coordinate space defaults to `'level'`; and equivalent level-zero windows project into the same clipped, half-open level-space bounds. Explicit tile column/row identity and selected band order remain meaningful and are preserved. Invalid requests fail before source decoding or GPU allocation.

### Native typed arrays and validity[​](#native-typed-arrays-and-validity "Direct link to Native typed arrays and validity")

Decoded source bands retain an exact discriminated scalar representation:

```
const floatingBand: GPURasterDecodedBand<'float32'> = {

  id: 'reflectance',

  format: 'float32',

  values: new Float32Array(pixelCount),

  validity: new Uint32Array(pixelCount)

};



const categoricalBand: GPURasterDecodedBand<'uint32'> = {

  id: 'classification',

  format: 'uint32',

  values: new Uint32Array(pixelCount),

  noDataValue: 4294967295

};



const signedBand: GPURasterDecodedBand<'sint32'> = {

  id: 'elevation',

  format: 'sint32',

  values: new Int32Array(pixelCount)

};
```

Every sample array contains exactly `width * height` packed, row-major elements; an optional `Uint32Array` validity mask has the same length. `uint32` samples and nodata values remain exact even above `2²⁴`; they are not rounded through an intermediate `float32`. Decoded nodata and calibration remain source-domain metadata. Later GPU contributors reject raw nodata before applying calibration according to their existing documented contracts.

### Overview scale, odd dimensions, and spatial metadata[​](#overview-scale-odd-dimensions-and-spatial-metadata "Direct link to Overview scale, odd dimensions, and spatial metadata")

Every `GPURasterTileLevel` supplies its own positive, potentially anisotropic `downsample: [horizontalFactor, verticalFactor]`. Level zero must declare `[1, 1]`. A source overview has exactly `ceil(sourceWidth / horizontalFactor)` by `ceil(sourceHeight / verticalFactor)` pixels; odd dimensions retain their ragged final coverage. For example, a `5 × 7` source at `[2, 2]` has a `3 × 4` overview, while `[2, 3]` has a `3 × 3` overview. Deriving the factor as `5 / 3` would produce an incorrect affine transform.

A level-zero request maps to overview bounds using `floor(start / factor)` and `ceil(end / factor)`, then clips them to the requested tile and actual overview dimensions. Overview pixels map back to level-zero coverage with `floor(start * factor)` and `ceil(end * factor)`, clipped to the source extent. This half-open convention retains partially covered edge pixels instead of dropping or duplicating ragged coverage.

For a level-zero affine `[a, b, c, d, e, f]`, explicit overview factors `[sx, sy]`, and tile origin `[column, row]` in overview pixels, the decoded tile affine is:

```
[

  a * sx,

  b * sy,

  c + a * column * sx + b * row * sy,

  d * sx,

  e * sy,

  f + d * column * sx + e * row * sy

]
```

The tile retains source pixel interpretation, coordinate-reference-system identity, declared level, and level-zero origin; affine translation and metadata remain JavaScript numbers rather than being silently uploaded as low-precision world coordinates. A CRS identifier does not reproject pixels or convert derivatives into physical-world distances.

### Cancellation, ownership, and current limits[​](#cancellation-ownership-and-current-limits "Direct link to Cancellation, ownership, and current limits")

The optional reader `AbortSignal` is checked before starting a read, supplied to the application-owned source, and respected if cancellation occurs while a result is pending or before it is published. Cancel superseded application requests when a user quickly changes source window or overview. Cancellation does not destroy application-owned arrays, GPU buffers, or in-flight command submissions; applications remain responsible for their own upload and resource-lifetime boundaries.

This reader contract returns one explicitly requested decoded result. It does not implement an HTTP range transport, GeoTIFF/COG decoder, loader package, GPU upload, or cache by itself. Applications that need bounded upload, residency, eviction, deduplicated concurrent requests, and graph reuse can explicitly compose it with `GPURasterTileCache`, described below. `GPURasterTileHaloAssembler` can then acquire the complete neighboring coverage required by an explicitly declared analytical pipeline. None of these reader, cache, or halo objects stitches contour geometry, implicitly merges global tiled statistics, or implicitly generates analytical overviews. Existing source overviews are accepted as source-provided samples; their scientific aggregation policy remains application-owned. Applications explicitly compose `GPURasterOverview` or `GPURasterCategoricalOverview` when a verified GPU-generated policy is required, and add the global accumulator contributors explicitly for stable cross-tile statistics.

## Bounded tile residency and compiled-graph reuse[​](#bounded-tile-residency-and-compiled-graph-reuse "Direct link to Bounded tile residency and compiled-graph reuse")

Use `GPURasterTileCache` when repeated viewport changes would otherwise decode and upload the same source windows, or when a large dataset must be processed through explicitly bounded GPU tiles. Keep `GPURasterTileReader` alone when the application already owns a residency policy or only needs a one-off decoded result. The cache owns buffers it uploads; the source, decoder, network transport, graph construction, command encoder, submission, and completion fence remain application-owned.

```
const cache = new GPURasterTileCache({

  device,

  reader,

  maxTiles: 4,

  maxGraphs: 2,

  maxCpuBytes: 64 * 1024 * 1024,

  maxGpuBytes: 128 * 1024 * 1024

});



const abortController = new AbortController();

const tileLease = await cache.acquire(

  {level: 0, column: 0, row: 0, bandIds: ['red', 'near-infrared']},

  abortController.signal

);



const graphLease = await cache.acquireGraph(tileLease, {

  pipelineKey: 'calibrated-ndvi-histogram',

  halo: 0,

  estimatedByteLength: 24 * 1024 * 1024,

  create: () => {

    const analysis = createApplicationOwnedAnalysis(tileLease);

    return {

      graph: analysis.compiledGraph,

      value: analysis,

      byteLength: analysis.ownedOutputByteLength,

      destroy: () => analysis.destroy()

    };

  }

});



const red = tileLease.bands.find(band => band.id === 'red')!;

const nearInfrared = tileLease.bands.find(band => band.id === 'near-infrared')!;

const encoder = device.createCommandEncoder();



graphLease.graph.encode(encoder, {

  parameters: undefined,

  buffers: {

    red: red.buffer,

    'near-infrared': nearInfrared.buffer,

    'source-validity': red.validity!

  }

});



device.submit(encoder.finish());

const completionFence = device.createFence();

await Promise.all([

  graphLease.releaseAfter(completionFence),

  tileLease.releaseAfter(completionFence)

]);
```

The application must create a completion fence **after** submitting every command buffer that uses those leases. A WebGPU fence snapshots work already submitted when the fence is created; constructing it before `device.submit()` cannot protect the later submission. Acquire both leases before encoding, retain them across any encoded-but-unsubmitted interval, and release them only after the relevant post-submit fence resolves. `releaseAfter()` also accepts a completion `Promise<void>`. Use immediate `release()` only when no encoded or submitted GPU work can still reference that tile or graph. If graph creation or encoding fails before submission, release every already acquired lease during application-owned cleanup; if commands were submitted, preserve the normal post-submit fence boundary.

### Independent CPU/GPU budgets and eviction[​](#independent-cpugpu-budgets-and-eviction "Direct link to Independent CPU/GPU budgets and eviction")

`maxTiles` and `maxGraphs` independently bound the resident entry counts. `maxCpuBytes` counts the full `byteLength` of every distinct `ArrayBuffer` or `SharedArrayBuffer` retained by each tile's decoded sample and validity views. Several views into one backing allocation, including a validity array shared by multiple bands, count that allocation once for the tile. A small subarray backed by a large pooled slab retains the entire slab and is therefore charged for its full allocation, not merely its visible view range. Use appropriately sized dedicated backing allocations or a budget large enough for the retained pool. `maxGpuBytes` bounds three disjoint allocation sets:

* Unique cache-owned uploaded native band and validity buffers, counted by their actual `buffer.byteLength`. One shared validity array produces one shared GPU buffer.
* Each compiled graph's `graph.stats.physicalTransientResourceBytes`, including its real graph-owned transient buffer and texture allocations after physical reuse.
* Application-owned graph resources declared by `GPURasterTileGraphEntry.byteLength`, such as output buffers, render attachments, indirect records, or other owner-managed GPU allocations.

Imported resident tile buffers are already included in the first category and must not also be reported through `byteLength`. Compiled-graph transient allocations are already included in the second category and must not be added to the third. `estimatedByteLength` must conservatively cover the graph's expected physical transients **plus** separately owned graph resources before the factory allocates them. Underestimating that combined footprint breaks safe admission; actual bytes are validated again after creation.

When an additional tile or graph would exceed an entry-count or byte budget, the cache evicts the least recently used compatible unpinned entries deterministically. Tiles or graphs protected by outstanding leases are never destroyed. A resource larger than the configured capacity, or a request that cannot fit because every eviction candidate is pinned, is rejected instead of silently exceeding the budget or destroying in-flight resources. `cache.setBudgets({...})` applies a feasible lower limit through the same deterministic eviction policy; a requested budget smaller than the pinned footprint is rejected atomically without changing existing budgets or evicting entries. `cache.budgets` exposes current limits; `cache.stats` exposes resident counts, CPU/GPU bytes, hits, misses, tile evictions, graph compilations/reuses, and active tile/graph pins.

`cache.destroy()` cancels pending source requests and immediately destroys unpinned cache-owned tile buffers and graph entries. Resources protected by tile or graph leases remain alive until their final immediate or fence-delayed release; the source reader and decoder are never owned or destroyed by the cache. Destruction does not create a fence or protect leases the application has already released: during application shutdown, call `releaseAfter()` with a fence created after the final analysis/render submission before destroying the cache.

Tile residency preserves native `float32`, `uint32`, and `sint32` sample buffers, exact raw nodata values, validity, calibration, overview, and spatial metadata. The resident band buffers are borrowed by graphs and renderers; neither may destroy them. The cache does not merge tiles, repack an entire source raster, download samples, submit commands, or hide synchronization.

### Concurrent requests and cancellation[​](#concurrent-requests-and-cancellation "Direct link to Concurrent requests and cancellation")

Concurrent equivalent requests share one application-source read and one upload. Identity uses the reader's validated, normalized request rather than the raw caller spelling, so omitted and explicit all-band selections, omitted and explicit full windows, default and explicit `coordinateSpace: 'level'`, and equivalent level-zero/level-local windows coalesce. Every caller receives its own lease and may cancel its own `AbortSignal`; canceling one waiter does not cancel other callers waiting for the same tile. The underlying source read can be aborted after its last interested waiter goes away. Changing the normalized overview, window, explicit tile addressing, or selected-band order creates a separate request identity.

Cancel superseded viewport requests promptly, but do not use request cancellation as a GPU fence. An already acquired tile or graph remains alive while its lease is pinned, including while commands are encoded, submitted, and executing. Releasing cache ownership is independent from canceling a pending source operation.

### Shape compatibility and imported-buffer replacement[​](#shape-compatibility-and-imported-buffer-replacement "Direct link to Shape compatibility and imported-buffer replacement")

Compiled graphs are reusable only when every property baked into their topology or WGSL matches. The cache's shape identity includes tile width and height, ordered band identities/formats/ validity/native nodata/calibration, overview level, pixel interpretation, explicit halo width, and the caller's `pipelineKey`. Include analytical options, selected operations, specialized constants, kernel parameters, output layouts, and any other application-specific specialization in that key. Differently sized edge tiles, source overviews, band layouts, halo widths, or pipeline keys compile separate graph entries.

World-space tile origin and affine translation do not affect a shape whose WGSL and resource layout are otherwise identical. Accordingly, equally sized western and eastern windows can use the exact same compiled graph even though their geospatial origin and source buffers differ. Supply the current tile's imported buffer replacements to **every** `compiledGraph.encode()`; the buffers captured when the graph was originally compiled may already have been evicted. The existing command graph validates replacement device, usage, capacity, and alias compatibility for each encoding without mutating an already compiled graph.

`GPURasterTileGraphEntry.value` can retain the application-owned analysis engine associated with a compiled graph. Its `destroy()` callback releases that owner's output allocations and compiled graph exactly once when an unpinned graph entry is evicted. Cache-owned source buffers remain borrowed and must not be destroyed by the callback. Keep a graph lease pinned until any render submission consuming its outputs has also completed.

## Seam-safe tile halos and owned cores[​](#seam-safe-tile-halos-and-owned-cores "Direct link to Seam-safe tile halos and owned cores")

Use `GPURasterTileHaloAssembler` when a neighborhood operation crosses an independently owned tile boundary. Filtering, derivatives, and morphology need real adjacent observations; treating an interior tile edge as a dataset border produces visible seams and analytically incorrect values. Pointwise-only pipelines can omit stages or use the cache directly because neighboring pixels cannot influence their outputs.

The assembler wraps an existing bounded `GPURasterTileCache`; it does not install a decoder, create a CPU-side stitched raster, allocate an unbounded full-dataset image, submit GPU commands, or replace the source-owned transport policy:

```
const assembler = new GPURasterTileHaloAssembler(cache);

const request: GPURasterTileHaloRequest = {

  level: 0,

  column: 1,

  row: 0,

  bandIds: ['red', 'near-infrared'],

  stages: [

    {requiredHalo: 3}, // Gaussian smoothing, radius three.

    {requiredHalo: 1}, // Sobel derivative, radius one.

    {requiredHalo: 4} // Opening at radius two includes both morphology passes.

  ]

};



const plan = assembler.plan(request);

// plan.horizontalHalo === 8; plan.verticalHalo === 8.

// plan.corePixelBounds owns only this tile; availablePixelBounds includes its real neighbors.



const controller = new AbortController();

const haloLease = await assembler.acquire(request, controller.signal);

// haloLease.core is the first pinned tile; haloLease.tiles includes every required neighbor.
```

### Cumulative, anisotropic, and overview receptive fields[​](#cumulative-anisotropic-and-overview-receptive-fields "Direct link to Cumulative, anisotropic, and overview receptive fields")

`stages` is ordered, explicit, and required. Each stage advertises its complete `requiredHalo`; optional `horizontalRadius` and `verticalRadius` narrow its independent axes. Omitted axes use `requiredHalo`, and neither axis may exceed that stage's declared maximum. The planner sums each axis across the entire pipeline rather than choosing only the largest stage.

For example, Gaussian radius `3` followed by Sobel radius `1` requires four source pixels per axis. Opening or closing at radius `2` already reports `requiredHalo: 4` because its erosion and dilation passes both contribute. Combining those three operations therefore requires eight source pixels, not three, four, or six. An explicitly horizontal radius-three stage followed by an explicitly vertical radius-two stage can instead declare:

```
stages: [

  {requiredHalo: 3, horizontalRadius: 3, verticalRadius: 0},

  {requiredHalo: 2, horizontalRadius: 0, verticalRadius: 2}

];

// horizontalHalo === 3; verticalHalo === 2; requiredHalo === 3.
```

All stage radii, `corePixelBounds`, and `availablePixelBounds` use the selected overview's own pixel grid. `levelZeroHalo` separately exposes the original-resolution footprint as `[ceil(horizontalHalo * downsampleX), ceil(verticalHalo * downsampleY)]`, preserving odd source dimensions and anisotropic overview scales without conflating coordinate systems.

The core and available coverage are half-open rectangles. Available coverage expands the core by the complete per-axis halo and clips only against the selected level's actual dimensions; ragged right/bottom tiles are never implicitly padded. An explicitly addressed core acquires its canonical owning tile first, then every intersecting physical neighbor, including diagonal neighbors. An unaddressed full-level or explicit-window request instead acquires one normalized expanded source window. Source readers, formats, selected bands, budgets, and cancellation remain the existing cache's responsibility.

### GPU-native neighbor assembly and core extraction[​](#gpu-native-neighbor-assembly-and-core-extraction "Direct link to GPU-native neighbor assembly and core extraction")

Create caller-owned packed output views for the planned expanded width/height, import each leased resident band into the same graph, and identify its absolute overview-space coverage:

```
const sources: GPURasterTileHaloSource<'float32'>[] =

  makeApplicationOwnedGraphSources(haloLease.tiles, 'red');



new GPURasterTileHaloFill({

  id: 'assemble-red-neighborhood',

  pixelBounds: plan.availablePixelBounds,

  sources,

  output: assembledRedValues,

  outputValidity: assembledRedValidity

}).addToGraph(graph);



// Run every selected neighborhood stage over plan.width × plan.height.

// Keep stage scratch and source band metadata explicit and caller-controlled.



new GPURasterTileCoreExtract({

  id: 'publish-owned-red-core',

  availablePixelBounds: plan.availablePixelBounds,

  corePixelBounds: plan.corePixelBounds,

  input: processedExpandedBand,

  output: ownedCoreValues,

  outputValidity: ownedCoreValidity

}).addToGraph(graph);
```

The application supplies `makeApplicationOwnedGraphSources` and every output allocation; it is not an implicit GPURaster loader. `GPURasterTileHaloFill` requires exact, nonoverlapping source coverage of the expanded destination and identical band identity, native format, nodata, and calibration metadata across all contributors. It declares one bounded compute pass per source, keeping even diagonal neighborhoods below portable WebGPU storage-binding limits. Exact `float32`, `uint32`, and `sint32` values are copied without recalibration, and each pixel's separate validity is preserved; a source without a mask publishes valid observations.

Execute smoothing, gradients, or morphology over the expanded intermediate region before `GPURasterTileCoreExtract` copies exactly the owned half-open core and its validity into separate caller-owned packed views. Adjacent cores therefore never overlap or double-publish seam pixels. A neighborhood border policy is meaningful only where available coverage meets a true dataset edge; sufficient real halo coverage keeps interior tile boundaries out of every owned output's receptive field. Missing observations remain missing rather than being silently filled by adjacent tiles.

### Neighbor lifetime, cost, and remaining boundaries[​](#neighbor-lifetime-cost-and-remaining-boundaries "Direct link to Neighbor lifetime, cost, and remaining boundaries")

`GPURasterTileHaloLease` pins both `core` and every entry in `tiles`. Retain that composite lease while imported source buffers are encoded or submitted. After application-owned command submission, create the completion fence and release every source through the same fence:

```
device.submit(encoder.finish());

const completionFence = device.createFence();

await Promise.all([

  graphLease.releaseAfter(completionFence),

  haloLease.releaseAfter(completionFence)

]);
```

Use immediate `haloLease.release()` only before encoding or after completion is already known. Cancellation or a cache-admission failure releases partially acquired pins without destroying resources retained by another lease. Cache capacity must fit all simultaneously pinned neighbors; otherwise admission fails explicitly instead of evicting an in-flight source.

A nominal `w × h` core with horizontal/vertical radii `rx`/`ry` processes at most `(w + 2rx) × (h + 2ry)` pixels before real dataset-edge clipping. Each selected band adds one GPU gather pass per intersecting source tile; core extraction adds one more pass per published band. Larger tiles reduce repeated halo work while smaller tiles lower peak resident memory; actual throughput depends on radius, source tiling, band count, cache hits, GPU bandwidth, graph specialization, and measured workloads. This explicit numerical workflow preserves downstream analytical values and bounded residency, unlike a framebuffer-only image effect, but it does not guarantee a universal performance improvement.

Halo planning and graph contributors do not automatically write one global stitched image, deduplicate contour segments across tiles, implicitly merge dataset-wide histograms, or integrate a GeoTIFF/COG transport. Applications explicitly add `GPURasterOverview` or `GPURasterCategoricalOverview` when generated overviews are needed; halo contributors do not add them implicitly. They separately compose global statistic/histogram merge contributors when dataset-wide results are needed. Applications own result placement and command submission; automatic full-image stitching and contour seam ownership remain separate work.

### Analytical tiling versus screen-space image effects[​](#analytical-tiling-versus-screen-space-image-effects "Direct link to Analytical tiling versus screen-space image effects")

Use bounded residency when source dimensions or interaction frequency make monolithic raster allocation, repeated decode/upload, or repeated graph compilation impractical. A resident revisit avoids source decoding and buffer upload; a compatible new tile avoids pipeline and graph recompilation while still performing its required analysis. Work and memory scale with selected tile dimensions, concurrent resident budgets, graph variants, and actual scratch/output sizes, rather than requiring allocation proportional to the entire dataset.

Existing luma.gl image effects are appropriate for changing a rendered framebuffer's appearance. GPURaster retains native scientific samples, validity, calibration, explicit tile ownership, reusable compute graphs, and downstream histograms, morphology, contours, or other numerical consumers. Those differences can reduce redundant CPU/GPU work in repeated large-raster pipelines, but they do not guarantee a particular speedup: source latency, tile size, cache hit rate, memory bandwidth, graph complexity, adapter limits, and measured application workloads determine actual performance.

Bounded residency alone does not assemble neighborhoods or decide output ownership; applications explicitly compose `GPURasterTileHaloAssembler`, `GPURasterTileHaloFill`, and `GPURasterTileCoreExtract` when those contracts are required, or the separate analytical overview and global merge contributors when verified GPU-generated reductions or cross-tile statistics are needed. Automatic full-image output stitching and contour seam ownership remain outside the current contract.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPURaster overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)
* [GPURaster concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)
* [GPURaster operations index](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)
