# LuRaster: GPU-Resident Raster Analytics

`@luma.gl/experimental/luraster` provides optional, graph-native WebGPU operations for
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
reductions. The reader, cache, and assembler never submit commands.

Current contributors cover raster metadata, explicit texture/buffer conversion, calibrated
pointwise band math, normalized difference vegetation index (NDVI), validity-aware histograms,
scalar summaries, contrast/gamma/equalization transforms, analytical thresholds, mask-aware
neighborhood stencils, direct convolution, separable Gaussian/box smoothing, signed
Sobel/Scharr/Laplacian derivatives, gradient magnitude, binary/grayscale dilation, erosion,
opening, and closing, GPU-resident marching-squares contours, indirect vector overlays, and
adapter-limit planning. They implement `GPUCommandGraphContributor` structurally: calling
`addToGraph(graph)` only declares work. No contributor submits commands or reads results back.

```ts
import {DrawCommandBuffer, GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPURasterBandMath,
  GPURasterBoxBlur,
  GPURasterCategoricalOverview,
  GPURasterClosing,
  GPURasterContourClassifier,
  GPURasterContours,
  GPURasterContrast,
  GPURasterConvolution,
  GPURasterDilation,
  GPURasterErosion,
  GPURasterGaussianBlur,
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
  GPURasterScharr,
  GPURasterSobel,
  GPURasterStatistics,
  GPURasterThreshold,
  GPURasterTileCache,
  GPURasterTileCoreExtract,
  GPURasterTileHaloAssembler,
  GPURasterTileHaloFill,
  GPURasterTileReader,
  makeRasterOverviewMetadata,
  type GPURasterBufferBand,
  type GPURasterCategoricalOverviewFormat,
  type GPURasterCategoricalOverviewProps,
  type GPURasterDecodedBand,
  type GPURasterOverviewCategoricalPolicy,
  type GPURasterOverviewMetadataOptions,
  type GPURasterOverviewProps,
  type GPURasterOverviewScale,
  type GPURasterTileGraphLease,
  type GPURasterTileHaloLease,
  type GPURasterTileHaloRequest,
  type GPURasterTileHaloSource,
  type GPURasterTileLease,
  type GPURasterTileRequest,
  type GPURasterTileSource
} from '@luma.gl/experimental/luraster';
```

The `./luraster` subpath is an explicit opt-in. Its runtime symbols are not exported from
`@luma.gl/experimental`, and the existing experimental package remains private.

## Try the Satellite Raster Lab

The [Satellite Raster Lab](/examples/showcase/raster-lab) visualizes deterministic synthetic
red and near-infrared imagery, GPU-derived NDVI, nodata/cloud masks, and a valid-pixel
histogram. Source controls load full, western, or eastern synthetic windows at either the
original resolution or an application-provided 2× overview; the displayed tile key, dimensions,
level-zero origin, and `EPSG:32610` identity follow the actual decoded tile. Layer selection,
Gaussian or box smoothing, neighborhood radius, Gaussian sigma,
Sobel/Scharr/Laplacian edge operators, signed direction or gradient magnitude, contrast, gamma,
manual or automatic Otsu threshold selection, denominator tolerance, and contour levels rebuild
the actual GPU analysis pipeline. Morphology controls exercise all four dilation, erosion,
opening, and closing operations; binary and grayscale modes; square and Manhattan-diamond
footprints; radii zero through eight; strict/ignore nodata; and clamp, reflect, constant, or
nodata borders, including the constant value. Grayscale morphology runs before contrast; binary
morphology cleans the manual/Otsu threshold mask and exposes its boundary as a contour at `0.5`.
The displayed raster, histogram, and scalar statistics reflect selected, smoothed, differentiated,
morphologically processed, transformed valid pixels; interpolated contour lines are generated and
drawn directly from GPU buffers. Only 228 bytes of scalar summaries, histogram bins, cutoff, and
contour diagnostics are read back after graph submission. The indirect draw consumes its
GPU-written instance count rather than a CPU-supplied count.

Changing to an uncached source window or overview explicitly decodes and uploads its native
samples; revisiting a resident window reuses its existing CPU arrays and GPU buffers. The
capacity slider exposes deterministic eviction, separate CPU/GPU occupancy, cache hits and
misses, active lease pins, and compiled-graph reuse. Equally sized western and eastern windows
reuse one compiled graph through per-encoding source-buffer replacement; full-resolution,
overview, or differently specialized pipelines use separate compatible graph entries. Rapid
changes cancel stale requests without destroying submitted GPU resources. CPU-to-GPU uploads do
not increase the unchanged 228-byte GPU-to-CPU summary. Select **TILE ONLY** to analyze one
source tile independently or **SEAMLESS HALO** to gather real neighboring resident samples,
run smoothing, derivatives, and grayscale morphology over the cumulative padded region, and
extract only the selected half-open core before displaying its statistics. Cumulative halo,
owned-core bounds, and resident-source counts update with analytical controls and the chosen
source overview. Choose **SOURCE NEAREST** to use the adapter's existing nearest-sample 2×
overview, or **GPU MEAN** to generate a validity-aware mean from native source observations;
selecting **GPU MEAN** automatically switches a native-resolution view to its 2× target.
**MASK NEAREST** and **MASK MODE** become available in GPU-generated mode and select exact
categorical coverage policies. Provenance and displayed analytical valid-pixel coverage
distinguish the resulting inputs without increasing the 228-byte readback. This visible
coverage is the existing post-filter/threshold valid count, not the unretrieved per-parent
source contribution count. The current example deliberately
makes **GPU MEAN** and **SEAMLESS HALO** mutually
exclusive: selecting either switches the other back to its compatible source/tile mode. All
analytical filters work on generated means, and source-nearest overviews retain their complete
seam-safe path; composing native halo assembly before generated overviews remains future demo
work. Global tiled reductions remain separate work.

## Raster bands and validity

`GPURaster` combines caller-owned bands with explicit width, height, affine pixel transform,
pixel interpretation, optional coordinate-reference-system identity, overview level, and tile
origin. Supported scalar formats are `float32`, `uint32`, and `sint32`. A band uses exactly one
borrowed representation: a packed `GraphDataView` buffer or a compatible single-mip texture view.

Band metadata can define:

- `validity`: a packed, source-aligned `uint32` mask; zero rejects a pixel.
- `noDataValue`: a raw source-format sentinel compared before calibration.
- `scale` and `offset`: independent per-band calibration,
  `calibratedValue = rawValue * scale + offset`.

Pointwise analysis consumes buffer-backed bands and produces separate caller-owned `float32`
values and canonical `uint32` validity flags. Invalid pixels receive `NaN` and validity `0`;
valid pixels receive validity `1`. Non-finite raw or calibrated inputs and non-finite results
are rejected. Integer nodata comparisons occur before float conversion, preserving exact
`uint32` and `sint32` sentinel identities.

Use `GPURasterTextureToBuffer` and `GPURasterBufferToTexture` for explicit representation
changes. Texture upload, decoding, and readback are application responsibilities.

## Application-owned decoded tile sources

Use `GPURasterTileSource` when an application obtains raster windows from a decoded GeoTIFF,
cloud-optimized GeoTIFF, microscopy container, offline fixture, service endpoint, or another
custom image provider. The source implementation, transport, authentication, worker scheduling,
decoder licensing, CPU arrays, and upload policy remain entirely application-owned.

`GPURasterTileReader` validates this interface and each asynchronous decoded result. Unlike
`GPURaster`, whose bands already refer to caller-owned GPU graph resources, a
`GPURasterDecodedTile` holds native CPU typed arrays that the application must upload explicitly.
The reader does not allocate GPU buffers, add graph passes, submit commands, cache results, or
take ownership of the source.

```ts
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

The source metadata describes the complete level-zero raster: dimensions, pixel interpretation,
double-precision JavaScript affine coefficients, optional coordinate-reference-system identity,
optional level-zero origin, native band descriptors, and explicitly provided overview levels.
Each band preserves its scalar format, exact raw-domain nodata sentinel, and optional calibration
scale/offset. The source adapter implements `readTile(request, signal)` and must forward the
provided `AbortSignal` to any application-owned fetch or decoder.

### Source windows, tile addressing, and selected bands

`GPURasterTileRequest.level` selects an explicitly declared source level. Omitting both `column`
and `row` selects the entire level; providing both addresses one source tile of that level's
declared `tileWidth` and `tileHeight`. Optional `pixelBounds` intersects that selection with a
half-open `[minimumColumn, minimumRow, maximumColumn, maximumRow]` window. Ragged right/bottom
tiles are clipped to actual level dimensions rather than padded implicitly.

`coordinateSpace: 'level'`, the default, expresses the optional window in the selected level's
own pixel grid. `coordinateSpace: 'level-zero'` expresses it in the dataset's original
full-resolution grid. `bandIds` explicitly selects a subset of declared source bands; omitting
it selects every band in source order. Their native formats and metadata are preserved. The
Raster Lab requests both red and near-infrared bands because NDVI needs both; other applications
can request only the bands required by their own operation.

Each result includes the selected level, tile column/row, half-open `pixelBounds` in level-local
pixels, corresponding `levelZeroBounds`, fully translated `GPURasterMetadata`, and the requested
decoded bands. Missing or duplicate identifiers, inconsistent dimensions, incompatible typed
arrays, malformed masks, or mismatched metadata are rejected rather than silently converted.
The reader passes the adapter a normalized request with explicit `bandIds`, level-local
`pixelBounds`, and `coordinateSpace: 'level'`; the adapter returns complete matching bounds,
translated metadata, and bands in the requested order.

Call `reader.normalizeTileRequest(request)` when application scheduling, deduplication, or cache
identity needs the same validated request that the source adapter will receive. An omitted band
list expands to every source band in metadata order; omitted bounds expand to the complete
selected level or addressed tile; an omitted coordinate space defaults to `'level'`; and
equivalent level-zero windows project into the same clipped, half-open level-space bounds.
Explicit tile column/row identity and selected band order remain meaningful and are preserved.
Invalid requests fail before source decoding or GPU allocation.

### Native typed arrays and validity

Decoded source bands retain an exact discriminated scalar representation:

```ts
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

Every sample array contains exactly `width * height` packed, row-major elements; an optional
`Uint32Array` validity mask has the same length. `uint32` samples and nodata values remain exact
even above `2²⁴`; they are not rounded through an intermediate `float32`. Decoded nodata and
calibration remain source-domain metadata. Later GPU contributors reject raw nodata before
applying calibration according to their existing documented contracts.

### Overview scale, odd dimensions, and spatial metadata

Every `GPURasterTileLevel` supplies its own positive, potentially anisotropic
`downsample: [horizontalFactor, verticalFactor]`. Level zero must declare `[1, 1]`. A source
overview has exactly `ceil(sourceWidth / horizontalFactor)` by
`ceil(sourceHeight / verticalFactor)` pixels; odd dimensions retain their ragged final coverage.
For example, a `5 × 7` source at `[2, 2]` has a `3 × 4` overview, while `[2, 3]` has a
`3 × 3` overview. Deriving the factor as `5 / 3` would produce an incorrect affine transform.

A level-zero request maps to overview bounds using `floor(start / factor)` and
`ceil(end / factor)`, then clips them to the requested tile and actual overview dimensions.
Overview pixels map back to level-zero coverage with `floor(start * factor)` and
`ceil(end * factor)`, clipped to the source extent. This half-open convention retains partially
covered edge pixels instead of dropping or duplicating ragged coverage.

For a level-zero affine `[a, b, c, d, e, f]`, explicit overview factors `[sx, sy]`, and tile
origin `[column, row]` in overview pixels, the decoded tile affine is:

```text
[
  a * sx,
  b * sy,
  c + a * column * sx + b * row * sy,
  d * sx,
  e * sy,
  f + d * column * sx + e * row * sy
]
```

The tile retains source pixel interpretation, coordinate-reference-system identity, declared
level, and level-zero origin; affine translation and metadata remain JavaScript numbers rather
than being silently uploaded as low-precision world coordinates. A CRS identifier does not
reproject pixels or convert derivatives into physical-world distances.

### Cancellation, ownership, and current limits

The optional reader `AbortSignal` is checked before starting a read, supplied to the
application-owned source, and respected if cancellation occurs while a result is pending or
before it is published. Cancel superseded application requests when a user quickly changes
source window or overview. Cancellation does not destroy application-owned arrays, GPU buffers,
or in-flight command submissions; applications remain responsible for their own upload and
resource-lifetime boundaries.

This reader contract returns one explicitly requested decoded result. It does not implement an
HTTP range transport, GeoTIFF/COG decoder, loader package, GPU upload, or cache by itself.
Applications that need bounded upload, residency, eviction, deduplicated concurrent requests,
and graph reuse can explicitly compose it with `GPURasterTileCache`, described below.
`GPURasterTileHaloAssembler` can then acquire the complete neighboring coverage required by an
explicitly declared analytical pipeline. None of these reader, cache, or halo objects stitches
contour geometry, merges global tiled statistics, or implicitly generates analytical overviews.
Existing source overviews are accepted as source-provided samples; their scientific aggregation
policy remains application-owned. Applications explicitly compose `GPURasterOverview` or
`GPURasterCategoricalOverview` when a verified GPU-generated policy is required.

## GPU-generated analytical overviews

Use an existing source-provided overview when its source-side sampling or reduction policy is
known, its lower resolution avoids unnecessary decoding or upload, and its analytical meaning
is appropriate for the task. Use `GPURasterOverview` when continuous floating-point observations
must be reduced on the GPU without treating nodata as zero, discarding valid-sample weights, or
averaging intermediate averages. Use `GPURasterCategoricalOverview` when classification labels
need an explicit nearest-sample or most-frequent-label policy without fractional interpolation.

Generated overviews are distinct from source-provided `GPURasterTileReader` levels. They do not
register new source levels, replace a decoder, select a transport, discover a GeoTIFF pyramid,
or move source samples between CPU and GPU. Each contributor adds one explicit compute pass to
the caller's command graph and writes only caller-owned output views.

### Floating means, nodata, and valid coverage

`GPURasterOverview` consumes a `float32` source band and publishes four separate packed output
views: the analytical mean, canonical `uint32` validity, calibrated `float32` sum, and `uint32`
valid-sample count.

```ts
const generatedMetadata = makeRasterOverviewMetadata(sourceMetadata, [2, 3]);

new GPURasterOverview({
  id: 'nodata-aware-reflectance-overview',
  metadata: sourceMetadata,
  scale: [2, 3],
  input: reflectanceBand,
  output: overviewValues,
  outputValidity: overviewValidity,
  sum: overviewSums,
  validCount: overviewValidCounts
}).addToGraph(graph);
```

The reducer first intersects the explicit source validity mask, raw nodata sentinel, and
finite raw observation. Source calibration is applied exactly once as
`rawValue * input.scale + input.offset`; non-finite calibrated results are excluded. The parent
value is the sum of remaining calibrated observations divided by their valid count, not by the
nominal footprint area. A `2 × 2` footprint containing `[10, invalid, 30, invalid]` therefore
publishes sum `40`, count `2`, mean `20`, and validity `1`. An entirely invalid footprint
publishes sum `0`, count `0`, validity `0`, and a canonical quiet `NaN` mean.

Odd right and bottom edges use only existing source observations; missing coverage is not
zero-padded. Retaining the sum and count separately makes population coverage and correctly
weighted downstream pyramid levels available without downloading samples.

### Weighted multilevel pyramids

Forward both sum and valid count when reducing an already generated mean. Supply an explicit
maximum number of raw observations that any input parent can represent:

```ts
new GPURasterOverview({
  id: 'weighted-coarser-overview',
  metadata: generatedMetadata,
  scale: 2,
  input: firstOverviewBand,
  inputSum: overviewSums,
  inputValidCount: overviewValidCounts,
  maximumInputValidCount: 6,
  output: coarserValues,
  outputValidity: coarserValidity,
  sum: coarserSums,
  validCount: coarserValidCounts
}).addToGraph(graph);
```

For parent inputs with `(sum, count)` of `(10, 1)` and `(60, 3)`, the correct next-level mean
is `(10 + 60) / (1 + 3) = 17.5`; averaging their intermediate means `(10 + 20) / 2 = 15`
would bias the smaller population. Weighted levels consume the already calibrated sums directly
and never apply source calibration a second time.

`inputSum` and `inputValidCount` must be supplied together, and weighted mode requires
`maximumInputValidCount`. Construction rejects any configuration whose maximum
`horizontalScale * verticalScale * maximumInputValidCount` could exceed the `uint32` count
range. An observed child count above its declared bound invalidates the parent instead of
wrapping or silently publishing incorrect coverage.

### Exact categorical nearest and mode

`GPURasterCategoricalOverview` preserves either `uint32` or `sint32` source identities and
requires an explicit categorical policy:

```ts
new GPURasterCategoricalOverview({
  id: 'land-cover-majority-overview',
  metadata: sourceMetadata,
  scale: [2, 2],
  input: landCoverLabels,
  policy: 'mode',
  output: overviewLabels,
  outputValidity: overviewLabelValidity,
  validCount: overviewLabelCoverage
}).addToGraph(graph);
```

Choose `'nearest'` when a representative existing sample is required. Even-sized footprints
select the upper-left of their central candidates. If that selected observation is masked or
matches raw nodata, the result is invalid; it does not silently substitute a different valid
label. Choose `'mode'` when the most frequent valid label better represents a region. Invalid
samples are ignored, and equal frequencies deterministically select the numerically smallest
exact label. Negative signed categories and unsigned identifiers above `2²⁴` remain native
integers rather than passing through `float32`.

`outputValidity` is always explicit. An invalid categorical parent publishes value `0` with
validity `0`; a valid category whose identity is actually zero remains distinguishable through
validity `1`. Optional `validCount` reports the number of valid observations in the complete
footprint for either policy, including valid alternatives when a nearest-selected center is
itself invalid.

### Spatial metadata, grid alignment, and cost

`GPURasterOverviewScale` accepts an integer or `[horizontalScale, verticalScale]`; each axis
must be between `1` and `8`. Output dimensions use independent ceiling division, so a `5 × 7`
source at `[2, 3]` produces `3 × 3` parents. `makeRasterOverviewMetadata` derives the same
target metadata as either contributor without allocating GPU resources:

```ts
const metadata = makeRasterOverviewMetadata(sourceMetadata, [2, 3], {
  level: 2,
  sourcePixelOrigin: [4, 6]
});
```

For an already positioned source affine `[a, b, c, d, e, f]`, the generated affine is
`[a * sx, b * sy, c, d * sx, e * sy, f]`. Existing source translations `c` and `f` stay
unchanged, including rotated or sheared grids; source coordinate-reference-system identity,
pixel interpretation, and level-zero origin are preserved. The target level defaults to the
source level plus one, and an explicitly supplied level must be greater than its source level.

The source origin must align with both reduction axes. When a level-zero source omits
`sourcePixelOrigin`, LuRaster infers its `levelZeroOrigin` or `[0, 0]` and rejects globally
misaligned translated tiles. A higher-level source with a nonzero `levelZeroOrigin` must supply
`sourcePixelOrigin` explicitly in its current-level pixel coordinates; its level-zero origin
alone cannot safely recover that current-level grid position. An explicit origin verifies
alignment only: source metadata already contains the correct affine translation and preserved
level-zero origin, so the helper never translates either value a second time.

The floating reduction evaluates up to `horizontalScale * verticalScale` observations per
output pixel. Categorical mode additionally compares bounded candidate frequencies and can
cost quadratically more within that footprint. Lower-resolution GPU-resident outputs may
reduce work in later histograms, filters, and rendering, but reductions also allocate explicit
output/sum/count/mask buffers and add a graph pass. Throughput depends on scale, nodata density,
categorical policy, source residency, memory bandwidth, adapter limits, and the measured GPU;
neither display-oriented image effects nor ordinary texture mipmaps preserve these analytical
validity, weighting, categorical, or affine contracts.

## Bounded tile residency and compiled-graph reuse

Use `GPURasterTileCache` when repeated viewport changes would otherwise decode and upload the
same source windows, or when a large dataset must be processed through explicitly bounded GPU
tiles. Keep `GPURasterTileReader` alone when the application already owns a residency policy or
only needs a one-off decoded result. The cache owns buffers it uploads; the source, decoder,
network transport, graph construction, command encoder, submission, and completion fence remain
application-owned.

```ts
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

The application must create a completion fence **after** submitting every command buffer that
uses those leases. A WebGPU fence snapshots work already submitted when the fence is created;
constructing it before `device.submit()` cannot protect the later submission. Acquire both leases
before encoding, retain them across any encoded-but-unsubmitted interval, and release them only
after the relevant post-submit fence resolves. `releaseAfter()` also accepts a completion
`Promise<void>`. Use immediate `release()` only when no encoded or submitted GPU work can still
reference that tile or graph. If graph creation or encoding fails before submission, release
every already acquired lease during application-owned cleanup; if commands were submitted,
preserve the normal post-submit fence boundary.

### Independent CPU/GPU budgets and eviction

`maxTiles` and `maxGraphs` independently bound the resident entry counts. `maxCpuBytes` counts
the full `byteLength` of every distinct `ArrayBuffer` or `SharedArrayBuffer` retained by each
tile's decoded sample and validity views. Several views into one backing allocation, including
a validity array shared by multiple bands, count that allocation once for the tile. A small
subarray backed by a large pooled slab retains the entire slab and is therefore charged for its
full allocation, not merely its visible view range. Use appropriately sized dedicated backing
allocations or a budget large enough for the retained pool. `maxGpuBytes` bounds three disjoint
allocation sets:

- Unique cache-owned uploaded native band and validity buffers, counted by their actual
  `buffer.byteLength`. One shared validity array produces one shared GPU buffer.
- Each compiled graph's `graph.stats.physicalTransientResourceBytes`, including its real
  graph-owned transient buffer and texture allocations after physical reuse.
- Application-owned graph resources declared by `GPURasterTileGraphEntry.byteLength`, such as
  output buffers, render attachments, indirect records, or other owner-managed GPU allocations.

Imported resident tile buffers are already included in the first category and must not also be
reported through `byteLength`. Compiled-graph transient allocations are already included in the
second category and must not be added to the third. `estimatedByteLength` must conservatively
cover the graph's expected physical transients **plus** separately owned graph resources before
the factory allocates them. Underestimating that combined footprint breaks safe admission;
actual bytes are validated again after creation.

When an additional tile or graph would exceed an entry-count or byte budget, the cache evicts
the least recently used compatible unpinned entries deterministically. Tiles or graphs protected
by outstanding leases are never destroyed. A resource larger than the configured capacity, or a
request that cannot fit because every eviction candidate is pinned, is rejected instead of
silently exceeding the budget or destroying in-flight resources. `cache.setBudgets({...})`
applies a feasible lower limit through the same deterministic eviction policy; a requested
budget smaller than the pinned footprint is rejected atomically without changing existing
budgets or evicting entries. `cache.budgets` exposes current limits; `cache.stats` exposes
resident counts, CPU/GPU bytes, hits, misses, tile evictions, graph compilations/reuses, and
active tile/graph pins.

`cache.destroy()` cancels pending source requests and immediately destroys unpinned cache-owned
tile buffers and graph entries. Resources protected by tile or graph leases remain alive until
their final immediate or fence-delayed release; the source reader and decoder are never owned or
destroyed by the cache. Destruction does not create a fence or protect leases the application has
already released: during application shutdown, call `releaseAfter()` with a fence created after
the final analysis/render submission before destroying the cache.

Tile residency preserves native `float32`, `uint32`, and `sint32` sample buffers, exact raw
nodata values, validity, calibration, overview, and spatial metadata. The resident band buffers
are borrowed by graphs and renderers; neither may destroy them. The cache does not merge tiles,
repack an entire source raster, download samples, submit commands, or hide synchronization.

### Concurrent requests and cancellation

Concurrent equivalent requests share one application-source read and one upload. Identity uses
the reader's validated, normalized request rather than the raw caller spelling, so omitted and
explicit all-band selections, omitted and explicit full windows, default and explicit
`coordinateSpace: 'level'`, and equivalent level-zero/level-local windows coalesce. Every caller
receives its own lease and may cancel its own `AbortSignal`; canceling one waiter does not cancel
other callers waiting for the same tile. The underlying source read can be aborted after its
last interested waiter goes away. Changing the normalized overview, window, explicit tile
addressing, or selected-band order creates a separate request identity.

Cancel superseded viewport requests promptly, but do not use request cancellation as a GPU fence.
An already acquired tile or graph remains alive while its lease is pinned, including while
commands are encoded, submitted, and executing. Releasing cache ownership is independent from
canceling a pending source operation.

### Shape compatibility and imported-buffer replacement

Compiled graphs are reusable only when every property baked into their topology or WGSL matches.
The cache's shape identity includes tile width and height, ordered band identities/formats/
validity/native nodata/calibration, overview level, pixel interpretation, explicit halo width,
and the caller's `pipelineKey`. Include analytical options, selected operations, specialized
constants, kernel parameters, output layouts, and any other application-specific specialization
in that key. Differently sized edge tiles, source overviews, band layouts, halo widths, or
pipeline keys compile separate graph entries.

World-space tile origin and affine translation do not affect a shape whose WGSL and resource
layout are otherwise identical. Accordingly, equally sized western and eastern windows can use
the exact same compiled graph even though their geospatial origin and source buffers differ.
Supply the current tile's imported buffer replacements to **every** `compiledGraph.encode()`;
the buffers captured when the graph was originally compiled may already have been evicted. The
existing command graph validates replacement device, usage, capacity, and alias compatibility
for each encoding without mutating an already compiled graph.

`GPURasterTileGraphEntry.value` can retain the application-owned analysis engine associated with
a compiled graph. Its `destroy()` callback releases that owner's output allocations and compiled
graph exactly once when an unpinned graph entry is evicted. Cache-owned source buffers remain
borrowed and must not be destroyed by the callback. Keep a graph lease pinned until any render
submission consuming its outputs has also completed.

## Seam-safe tile halos and owned cores

Use `GPURasterTileHaloAssembler` when a neighborhood operation crosses an independently owned
tile boundary. Filtering, derivatives, and morphology need real adjacent observations; treating
an interior tile edge as a dataset border produces visible seams and analytically incorrect
values. Pointwise-only pipelines can omit stages or use the cache directly because neighboring
pixels cannot influence their outputs.

The assembler wraps an existing bounded `GPURasterTileCache`; it does not install a decoder,
create a CPU-side stitched raster, allocate an unbounded full-dataset image, submit GPU commands,
or replace the source-owned transport policy:

```ts
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

### Cumulative, anisotropic, and overview receptive fields

`stages` is ordered, explicit, and required. Each stage advertises its complete `requiredHalo`;
optional `horizontalRadius` and `verticalRadius` narrow its independent axes. Omitted axes use
`requiredHalo`, and neither axis may exceed that stage's declared maximum. The planner sums
each axis across the entire pipeline rather than choosing only the largest stage.

For example, Gaussian radius `3` followed by Sobel radius `1` requires four source pixels per
axis. Opening or closing at radius `2` already reports `requiredHalo: 4` because its erosion and
dilation passes both contribute. Combining those three operations therefore requires eight
source pixels, not three, four, or six. An explicitly horizontal radius-three stage followed by
an explicitly vertical radius-two stage can instead declare:

```ts
stages: [
  {requiredHalo: 3, horizontalRadius: 3, verticalRadius: 0},
  {requiredHalo: 2, horizontalRadius: 0, verticalRadius: 2}
];
// horizontalHalo === 3; verticalHalo === 2; requiredHalo === 3.
```

All stage radii, `corePixelBounds`, and `availablePixelBounds` use the selected overview's own
pixel grid. `levelZeroHalo` separately exposes the original-resolution footprint as
`[ceil(horizontalHalo * downsampleX), ceil(verticalHalo * downsampleY)]`, preserving odd source
dimensions and anisotropic overview scales without conflating coordinate systems.

The core and available coverage are half-open rectangles. Available coverage expands the core
by the complete per-axis halo and clips only against the selected level's actual dimensions;
ragged right/bottom tiles are never implicitly padded. An explicitly addressed core acquires its
canonical owning tile first, then every intersecting physical neighbor, including diagonal
neighbors. An unaddressed full-level or explicit-window request instead acquires one normalized
expanded source window. Source readers, formats, selected bands, budgets, and cancellation
remain the existing cache's responsibility.

### GPU-native neighbor assembly and core extraction

Create caller-owned packed output views for the planned expanded width/height, import each
leased resident band into the same graph, and identify its absolute overview-space coverage:

```ts
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

The application supplies `makeApplicationOwnedGraphSources` and every output allocation; it is
not an implicit LuRaster loader. `GPURasterTileHaloFill` requires exact, nonoverlapping source
coverage of the expanded destination and identical band identity, native format, nodata, and
calibration metadata across all contributors. It declares one bounded compute pass per source,
keeping even diagonal neighborhoods below portable WebGPU storage-binding limits. Exact
`float32`, `uint32`, and `sint32` values are copied without recalibration, and each pixel's
separate validity is preserved; a source without a mask publishes valid observations.

Execute smoothing, gradients, or morphology over the expanded intermediate region before
`GPURasterTileCoreExtract` copies exactly the owned half-open core and its validity into
separate caller-owned packed views. Adjacent cores therefore never overlap or double-publish
seam pixels. A neighborhood border policy is meaningful only where available coverage meets a
true dataset edge; sufficient real halo coverage keeps interior tile boundaries out of every
owned output's receptive field. Missing observations remain missing rather than being silently
filled by adjacent tiles.

### Neighbor lifetime, cost, and remaining boundaries

`GPURasterTileHaloLease` pins both `core` and every entry in `tiles`. Retain that composite
lease while imported source buffers are encoded or submitted. After application-owned command
submission, create the completion fence and release every source through the same fence:

```ts
device.submit(encoder.finish());
const completionFence = device.createFence();
await Promise.all([
  graphLease.releaseAfter(completionFence),
  haloLease.releaseAfter(completionFence)
]);
```

Use immediate `haloLease.release()` only before encoding or after completion is already known.
Cancellation or a cache-admission failure releases partially acquired pins without destroying
resources retained by another lease. Cache capacity must fit all simultaneously pinned neighbors;
otherwise admission fails explicitly instead of evicting an in-flight source.

A nominal `w × h` core with horizontal/vertical radii `rx`/`ry` processes at most
`(w + 2rx) × (h + 2ry)` pixels before real dataset-edge clipping. Each selected band adds one
GPU gather pass per intersecting source tile; core extraction adds one more pass per published
band. Larger tiles reduce repeated halo work while smaller tiles lower peak resident memory;
actual throughput depends on radius, source tiling, band count, cache hits, GPU bandwidth,
graph specialization, and measured workloads. This explicit numerical workflow preserves
downstream analytical values and bounded residency, unlike a framebuffer-only image effect,
but it does not guarantee a universal performance improvement.

Halo planning and graph contributors do not automatically write one global stitched image,
deduplicate contour segments across tiles, merge dataset-wide histograms, or integrate a
GeoTIFF/COG transport. Applications explicitly add `GPURasterOverview` or
`GPURasterCategoricalOverview` when generated overviews are needed; halo contributors do not
add them implicitly. Applications own result placement and command submission; automatic
full-image stitching, contour seam ownership, and global statistics remain separate work.

### Analytical tiling versus screen-space image effects

Use bounded residency when source dimensions or interaction frequency make monolithic raster
allocation, repeated decode/upload, or repeated graph compilation impractical. A resident revisit
avoids source decoding and buffer upload; a compatible new tile avoids pipeline and graph
recompilation while still performing its required analysis. Work and memory scale with selected
tile dimensions, concurrent resident budgets, graph variants, and actual scratch/output sizes,
rather than requiring allocation proportional to the entire dataset.

Existing luma.gl image effects are appropriate for changing a rendered framebuffer's
appearance. LuRaster retains native scientific samples, validity, calibration, explicit tile
ownership, reusable compute graphs, and downstream histograms, morphology, contours, or other
numerical consumers. Those differences can reduce redundant CPU/GPU work in repeated large-raster
pipelines, but they do not guarantee a particular speedup: source latency, tile size, cache hit
rate, memory bandwidth, graph complexity, adapter limits, and measured application workloads
determine actual performance.

Bounded residency alone does not assemble neighborhoods or decide output ownership; applications
explicitly compose `GPURasterTileHaloAssembler`, `GPURasterTileHaloFill`, and
`GPURasterTileCoreExtract` when those contracts are required, or the separate analytical
overview contributors when a verified GPU-generated reduction is needed. Automatic full-image
output stitching, contour seam ownership, and dataset-wide statistic merges remain separate
roadmap tranches.

## Pointwise band math

`GPURasterBandMath` accepts two packed bands on the same graph and grid:

```ts
new GPURasterBandMath({
  id: 'calibrated-difference',
  width,
  height,
  left: nearInfrared,
  right: red,
  operation: 'subtract',
  output: difference,
  outputValidity: differenceValidity
}).addToGraph(graph);
```

Available operations are `add`, `subtract`, `multiply`, `divide`, and
`normalized-difference`. Both source masks intersect. For division and normalized difference,
`epsilon` rejects denominators whose absolute value is less than or equal to the configured
non-negative threshold; the default is zero. `clamp: [minimum, maximum]` is optional and never
applied implicitly.

Sources may use different scalar formats and different calibration coefficients. Output values,
output validity, and source storage must occupy separate buffers. All views must belong to the
same command graph and contain exactly `width * height` packed rows.

## NDVI

`GPURasterNDVI` specializes pointwise normalized difference:

```ts
const nearInfrared: GPURasterBufferBand<'uint32'> = {
  id: 'near-infrared',
  format: 'uint32',
  storage: {kind: 'buffer', values: nearInfraredValues},
  validity: nearInfraredValidity,
  noDataValue: 65535,
  scale: 0.0001
};

const red: GPURasterBufferBand<'uint32'> = {
  id: 'red',
  format: 'uint32',
  storage: {kind: 'buffer', values: redValues},
  validity: redValidity,
  noDataValue: 65535,
  scale: 0.0002,
  offset: -0.01
};

new GPURasterNDVI({
  id: 'vegetation-index',
  width,
  height,
  nearInfrared,
  red,
  output: vegetationIndex,
  outputValidity: vegetationValidity,
  epsilon: 0.000001
}).addToGraph(graph);
```

The mathematical operation is:

```text
nearInfraredCalibrated = nearInfraredRaw * nearInfraredScale + nearInfraredOffset
redCalibrated = redRaw * redScale + redOffset
ndvi = (nearInfraredCalibrated - redCalibrated)
       / (nearInfraredCalibrated + redCalibrated)
```

Raw nodata, each band's mask, non-finite calibrated values, and denominators within `epsilon`
produce invalid output. NDVI is not implicitly limited to `[-1, 1]`: negative calibrated
reflectance can produce valid values outside that interval. Supply `clamp` explicitly only when
the application intends to discard that analytical range.

## Validity-aware histograms

`GPURasterHistogram` keeps its inferred domain and binning on the GPU:

```ts
const ndviBand: GPURasterBufferBand<'float32'> = {
  id: 'vegetation-index',
  format: 'float32',
  storage: {kind: 'buffer', values: vegetationIndex},
  validity: vegetationValidity
};

new GPURasterHistogram({
  id: 'vegetation-distribution',
  input: ndviBand,
  output: histogramBins,
  domainOutput: validExtent
}).addToGraph(graph);

const compiled = graph.compile();
const encoder = device.createCommandEncoder();
compiled.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());
```

The default `domain: 'valid-auto'` computes a masked extent and passes that two-row GPU result
explicitly to the existing histogram primitive. Finite raw nodata sentinels are excluded before
the extent and histogram; source validity is preserved. `domainOutput` optionally publishes the
caller-owned extent. If omitted, the extent is graph-owned transient storage.

An application may instead supply a fixed `[minimum, maximum]` tuple or a caller-owned two-row
GPU domain in the same scalar format. `domainOutput` is valid only with the automatic domain.
Output bins are cleared on every encoding, so re-encoding a compiled graph recomputes the
distribution instead of accumulating stale counts.

The generic `GPUHistogram({mask, domain: 'auto'})` intentionally infers its domain from all
input values before applying its mask. `GPURasterHistogram` does not change that shared
primitive contract; it creates the raster-specific valid-pixel domain explicitly.

## Valid-pixel scalar statistics

`GPURasterStatistics` normalizes a floating-point band's raw nodata, non-finite samples, source
validity, and calibration before composing graph-native reductions:

```ts
new GPURasterStatistics({
  id: 'vegetation-summary',
  width,
  height,
  input: ndviBand,
  count: validPixelCount,
  sum: validPixelSum,
  mean: validPixelMean,
  extent: validPixelExtent
}).addToGraph(graph);
```

The caller provides one `uint32` count row, one `float32` sum row, one `float32` mean row,
and a two-row `float32` extent. Empty or all-invalid selections have count, sum, mean, and
extent equal to zero. Integer-wide sums, percentile estimates, and automatic large-raster
partitioning remain separate future work.

## Contrast, gamma, and histogram equalization

`GPURasterContrast` transforms calibrated samples while preserving a separate validity mask:

```ts
new GPURasterContrast({
  id: 'vegetation-contrast',
  width,
  height,
  input: ndviBand,
  domain: [-1, 1],
  contrast: 1.4,
  gamma: 1.15,
  mode: 'gamma',
  output: adjustedValues,
  outputValidity: adjustedValidity
}).addToGraph(graph);
```

`mode: 'linear'` applies midpoint-centered contrast and never applies gamma, even when a
nondefault `gamma` value is supplied. `mode: 'gamma'` additionally applies the normalized gamma
transform; select it explicitly when nonlinear correction is intended. Both literal
`[minimum, maximum]` domains and caller-owned two-row GPU domains are supported. For
`mode: 'equalize'`, pass an existing `uint32` histogram in the same domain; the contributor
computes an inclusive CDF in graph-owned transient storage.
Degenerate or all-invalid histograms have explicit behavior, and no source pixels are copied
back. Percentile-domain estimation and `rgba8unorm` presentation conversion are not yet
implemented.

## Analytical threshold masks

`GPURasterThreshold` writes a caller-owned, canonical `uint32` selection mask:

```ts
new GPURasterThreshold({
  id: 'dense-vegetation',
  width,
  height,
  input: adjustedBand,
  threshold: 0.4,
  operation: 'above',
  inclusive: true,
  output: selectedPixelValidity
}).addToGraph(graph);
```

Operations are `above`, `below`, and `range`. Scalar thresholds accept one finite literal or a
one-row GPU `float32` view; range thresholds accept an ordered literal pair or a two-row GPU
view. Raw native-format nodata, source validity, non-finite values, and source calibration are
applied before classification. Feeding the resulting mask to `GPURasterHistogram` or
`GPURasterStatistics` changes actual counts and distributions rather than merely dimming a
presentation layer.

For automatic segmentation, `GPURasterOtsuThreshold` selects a threshold from a bounded
caller-owned histogram without CPU synchronization:

```ts
new GPURasterOtsuThreshold({
  id: 'automatic-vegetation-threshold',
  histogram: histogramBins,
  domain: validExtent,
  output: automaticThreshold
}).addToGraph(graph);

new GPURasterThreshold({
  id: 'automatic-vegetation-mask',
  width,
  height,
  input: adjustedBand,
  threshold: automaticThreshold,
  output: selectedPixelValidity
}).addToGraph(graph);
```

Histograms contain between one and 256 bins, with combined counts that fit in `uint32`. Equal
between-class scores deterministically select the lowest threshold; an empty histogram produces
zero. The selected threshold remains GPU-resident when consumed by the downstream
classification pass.

## Neighborhood stencils and boundary policies

`GPURasterNeighborhood` evaluates an explicit two-dimensional kernel against calibrated,
buffer-backed raster samples. Use it when an analytical operator needs complete control over
its radius, individual weights, boundary behavior, normalization, and invalid-neighbor policy;
use the convolution or smoothing contributors below when their higher-level contracts already
describe the operation.

```ts
new GPURasterNeighborhood({
  id: 'weighted-local-mean',
  width,
  height,
  input: ndviBand,
  radius: 1,
  kernel: [1, 2, 1, 2, 4, 2, 1, 2, 1],
  normalize: true,
  borderMode: 'reflect',
  noDataPolicy: 'ignore-renormalize',
  output: neighborhoodValues,
  outputValidity: neighborhoodValidity
}).addToGraph(graph);
```

The radius is either one number for a square kernel or `[horizontalRadius, verticalRadius]` for
a rectangular kernel. Each axis is bounded to eight pixels, and the kernel must contain exactly
`(2 * horizontalRadius + 1) * (2 * verticalRadius + 1)` coefficients representable as finite
`float32` values. Compute workgroups cooperatively cache neighborhood samples and validity in
workgroup-local tiles. Output values and canonical `uint32` validity are separate caller-owned
buffers: in-place updates are forbidden because neighboring invocations would otherwise observe
partially overwritten source pixels. Radius zero is the single-pixel identity when its sole
weight is one.

Choose the border mode according to the meaning of samples beyond the known raster:

| Border mode | Out-of-bounds behavior                                                                            | When to use it                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `clamp`     | Repeats the closest edge sample.                                                                  | Continuous fields whose outermost measured value is the best available extension.                    |
| `reflect`   | Mirrors the interior without duplicating the boundary sample; a single-pixel axis repeats itself. | Smoothing terrain, reflectance, or microscopy without the flat edge plateaus introduced by clamping. |
| `constant`  | Uses the caller-provided `borderValue`.                                                           | Padding against a known background, such as zero-valued calibrated intensity.                        |
| `nodata`    | Treats out-of-bounds samples as invalid neighbors.                                                | Keeping missing exterior coverage explicit at genuine dataset boundaries.                            |

The default is `borderMode: 'clamp'`; `constant` defaults to `borderValue: 0` in the calibrated
sample domain. For samples `[a, b, c]`, reflect-101 maps both the left position `-1` and right
position `3` to `b` instead of repeating the edge pixel.

Raw-format nodata comparisons precede calibration, source masks remain authoritative, and
non-finite samples never participate. An invalid center pixel always remains invalid even when
the surrounding neighborhood contains valid samples, so clouds and source nodata are never
silently inpainted. Neighbor handling is explicit:

- `noDataPolicy: 'propagate'` invalidates the output when a nonzero-weight neighbor is missing.
  This is the default. Use it for exact analytical stencils, derivative kernels, or workflows
  that require complete local coverage.
- `noDataPolicy: 'ignore-renormalize'` drops invalid neighbors and rescales the surviving
  smoothing weights. Use it for nonnegative averaging kernels near clouds, image boundaries, or
  sparse nodata; a neighborhood without usable weight remains invalid. Signed kernels are
  rejected with this policy because renormalizing positive and negative response weights would
  change the operator's meaning.

## Direct convolution

`GPURasterConvolution` applies an arbitrary odd-sized two-dimensional kernel in a single GPU
compute pass:

```ts
new GPURasterConvolution({
  id: 'weighted-spatial-filter',
  width,
  height,
  input: ndviBand,
  kernelWidth: 3,
  kernelHeight: 3,
  kernel: [1, 2, 1, 2, 4, 2, 1, 2, 1],
  normalize: true,
  borderMode: 'reflect',
  noDataPolicy: 'ignore-renormalize',
  output: convolutionValues,
  outputValidity: convolutionValidity
}).addToGraph(graph);
```

Use direct convolution for custom two-dimensional kernels that cannot be factored into
independent horizontal and vertical filters, including asymmetric and signed response
operators. Its spatial work grows with the kernel area: a square radius-`r` kernel evaluates
`(2r + 1)²` taps per pixel. Keep normalization explicit for kernels whose coefficient sum should
preserve constant-valued imagery; `normalize` defaults to `false`, and normalizing a zero-sum
kernel is rejected. Signed response operators should retain their intended weights and use the
strict `propagate` validity policy.

## Separable Gaussian smoothing

`GPURasterGaussianBlur` composes independent horizontal and vertical passes around graph-owned
intermediate scratch:

```ts
new GPURasterGaussianBlur({
  id: 'denoise-vegetation-index',
  width,
  height,
  input: ndviBand,
  radius: 3,
  sigma: 1.4,
  borderMode: 'reflect',
  noDataPolicy: 'ignore-renormalize',
  output: smoothedValues,
  outputValidity: smoothedValidity
}).addToGraph(graph);
```

Use Gaussian smoothing to suppress sensor noise or small-scale variation before thresholding,
segmentation, contour extraction, or scientific visualization. `radius` sets the bounded kernel
footprint; `sigma` controls how broadly its normalized weights spread within that footprint.
Increasing radius permits a wider neighborhood, while increasing sigma gives more influence to
distant neighbors. Omitted sigma defaults to `max(radius / 2, 0.5)`. Gaussian weights are
normalized and nonnegative, making valid-neighbor renormalization appropriate beside masked
clouds or nodata.

The horizontal and vertical passes evaluate `2 * (2r + 1)` taps per pixel instead of
`(2r + 1)²` for an equivalent direct square kernel: `O(r)` rather than `O(r²)` spatial work.
This is an algorithmic scaling comparison, not a benchmark or a claim that every adapter and
image size runs faster. Scratch values and intermediate validity occupy two graph-owned transient
buffers, reused according to the existing graph allocator rather than downloaded to the CPU.
Radius zero uses one identity/calibration pass without allocating smoothing scratch.

With `ignore-renormalize`, each separable axis independently renormalizes its own valid
neighbors. Fully valid imagery matches the corresponding separable two-dimensional kernel, but
irregular nodata holes can produce different weights from a direct full-neighborhood masked
renormalization. Use `GPURasterConvolution` when that exact two-dimensional masked behavior is
required.

## Separable box smoothing

`GPURasterBoxBlur` applies the same two-pass graph structure with uniform, normalized weights:

```ts
new GPURasterBoxBlur({
  id: 'local-mean-vegetation-index',
  width,
  height,
  input: ndviBand,
  radius: 2,
  borderMode: 'reflect',
  noDataPolicy: 'ignore-renormalize',
  output: localMeanValues,
  outputValidity: localMeanValidity
}).addToGraph(graph);
```

Use box smoothing when a local arithmetic mean is the intended measurement or when uniformly
weighted denoising is sufficient. Gaussian smoothing is generally preferable when nearby
observations should contribute more strongly than distant ones; neither filter should be used
where preserving sharp boundaries exactly is the primary requirement. As with Gaussian
smoothing, the separable box kernel performs `O(r)` taps per pixel and publishes GPU-resident
values and validity for later graph contributors.

## Directional Sobel and Scharr gradients

`GPURasterSobel`, `GPURasterScharr`, and the configurable `GPURasterGradient` apply signed
first-derivative operators to calibrated raster samples. Use a directional gradient when the
orientation and sign of a boundary matter, such as locating transitions between water and
vegetation or measuring horizontal versus vertical microscopy intensity changes.

```ts
new GPURasterSobel({
  id: 'vegetation-horizontal-gradient',
  width,
  height,
  input: ndviBand,
  direction: 'x',
  scale: 1 / 8,
  borderMode: 'reflect',
  output: horizontalGradientValues,
  outputValidity: horizontalGradientValidity
}).addToGraph(graph);

new GPURasterGradient({
  id: 'vegetation-vertical-scharr-gradient',
  width,
  height,
  input: ndviBand,
  operator: 'scharr',
  direction: 'y',
  scale: 1 / 32,
  output: verticalGradientValues,
  outputValidity: verticalGradientValidity
}).addToGraph(graph);
```

`GPURasterSobel` is equivalent to `GPURasterGradient` with `operator: 'sobel'`;
`GPURasterScharr` selects `operator: 'scharr'`. All three contributors use a single bounded
`3 × 3` neighborhood pass with radius one. Their raw, row-major coefficients are:

```text
Sobel x:  [-1, 0, 1]    Sobel y:  [-1, -2, -1]
          [-2, 0, 2]              [ 0,  0,  0]
          [-1, 0, 1]              [ 1,  2,  1]

Scharr x: [ -3, 0,  3]  Scharr y: [ -3, -10, -3]
          [-10, 0, 10]            [  0,   0,  0]
          [ -3, 0,  3]            [  3,  10,  3]
```

A value increasing with raster column produces a positive `x` derivative; a value increasing
with raster row produces a positive `y` derivative. Raster rows increase downward, so `y` does
not automatically mean north or positive projected-world Y. A unit-per-pixel ramp produces raw
interior responses of `8` for Sobel and `32` for Scharr. The optional positive, finite `scale`
multiplies every response and defaults to `1`: use `1 / 8` or `1 / 32` when a unit ramp should
return approximately `1`. Signed direction and magnitude remain meaningful rather than being
clamped to display colors.

Choose Sobel for a familiar, compact first derivative with moderate perpendicular smoothing.
Choose Scharr when improved angular symmetry makes diagonal or orientation-sensitive edges more
useful; its stronger perpendicular weights do not imply a larger source footprint. Both operators
evaluate the same `3 × 3` neighborhood, so Scharr does not have an algorithmic tap-count
advantage or disadvantage here. Actual GPU cost depends on the adapter, dispatch, memory traffic,
and measured workload.

All derivatives are expressed per raster pixel, not in projected meters, geographic degrees, or
other CRS/world units. Non-square pixel spacing, rotation, shear, orientation, or geographic
distance requires an explicit application-side conversion using the raster affine transform and
appropriate coordinate-reference-system semantics.

The default `borderMode` is `clamp`; `reflect`, `constant`, and `nodata` reuse the same explicit
neighborhood boundary contract described above. Raw nodata and source masks are checked before
calibration. An invalid center or an invalid nonzero-coefficient neighbor invalidates the output;
signed derivative coefficients cannot use smoothing-style missing-neighbor renormalization. A
zero-coefficient position does not participate and therefore does not invalidate the response.
Each derivative publishes separate caller-owned `float32` values and canonical `uint32`
validity; invalid outputs remain `NaN`.

## Laplacian response and second-order edges

`GPURasterLaplacian` measures the signed second derivative across either four cardinal neighbors
or all eight neighboring pixels:

```ts
new GPURasterLaplacian({
  id: 'vegetation-second-derivative',
  width,
  height,
  input: ndviBand,
  connectivity: 4,
  borderMode: 'reflect',
  output: laplacianValues,
  outputValidity: laplacianValidity
}).addToGraph(graph);
```

`connectivity: 4` is the default and uses `[0, 1, 0, 1, -4, 1, 0, 1, 0]`; `connectivity: 8`
uses `[1, 1, 1, 1, -8, 1, 1, 1, 1]`. Both compute neighboring samples minus the center-weighted
sample, so an isolated bright impulse has a negative response at its center, while an isolated
dark depression has a positive response. A constant field has zero interior response. The same
optional positive `scale`, border policy, raw nodata, and strict validity rules apply; missing
diagonal neighbors do not affect four-connected output because their coefficients are zero.

Use the Laplacian when curvature, signed ridge/valley response, isotropic-looking boundary
emphasis, or subsequent zero-crossing detection matters more than first-derivative orientation.
Choose four connectivity for cardinal-only neighborhoods and eight connectivity when diagonal
samples should participate explicitly. Second derivatives amplify local sensor noise, so apply
`GPURasterGaussianBlur` first when the source is noisy; smoothing and Laplacian remain separate,
declared graph stages with separately defined validity behavior. The Laplacian is not a
replacement for directional Sobel/Scharr response when edge orientation is required.

## Gradient magnitude and graph-owned scratch

`GPURasterGradientMagnitude` combines horizontal and vertical first derivatives into the
nonnegative response `sqrt(x * x + y * y)`:

```ts
new GPURasterGradientMagnitude({
  id: 'vegetation-edge-strength',
  width,
  height,
  input: ndviBand,
  operator: 'scharr',
  scale: 1 / 32,
  borderMode: 'reflect',
  output: edgeMagnitudeValues,
  outputValidity: edgeMagnitudeValidity
}).addToGraph(graph);
```

Use magnitude when total boundary strength matters regardless of direction: threshold candidate
field boundaries, prepare a segmentation mask, compare edge contrast, or colorize transitions
without treating opposite edge orientations differently. `operator` defaults to `sobel`; select
`scharr` for the same improved angular response described above. The positive `scale` applies to
both directional derivatives before their magnitude is combined, so `1 / 8` or `1 / 32`
normalizes a unit horizontal or vertical ramp for its selected operator.

One contributor declares three ordered GPU graph passes: the horizontal derivative, vertical
derivative, and magnitude combination. It allocates four graph-owned transient buffers: one
`float32` response and one `uint32` validity mask for each direction. Their logical scratch cost
is `16 * width * height` bytes in addition to caller-owned output values and validity. The
combination intersects both directional masks; missing samples cannot be revived or silently
renormalized. Its magnitude pass uses a ratio-scaled hypot calculation to avoid unnecessarily
overflowing intermediate squares and requires six available storage-buffer bindings; an
unrepresentable final response remains invalid. Graph compilation owns and eventually releases
scratch and compute allocations, while inputs and final outputs remain caller-owned.

Directional Sobel, Scharr, and Laplacian each need one fixed-footprint `3 × 3` pass without
additional global scratch; full gradient magnitude adds the two intermediate derivative pairs
and a third pass. Every option scales linearly with bounded pixel count, with different dispatch
and memory constants. These structural costs and reusable GPU-resident outputs explain when a
particular operation is appropriate; they do not establish an unmeasured speedup over another
implementation or a screen-space image effect.

## Binary and grayscale morphology

Morphology changes a raster according to the minimum or maximum within a selected neighborhood.
Use it after classification when foreground shapes, small islands, holes, or narrow connections
matter, or use grayscale morphology when local brightness/intensity extrema are themselves the
intended analytical result.

`GPURasterMorphology` exposes one explicit `operation: 'dilate' | 'erode'` pass;
`GPURasterDilation` and `GPURasterErosion` name those operations directly.
`GPURasterOpening` composes erosion followed by dilation, while `GPURasterClosing` composes
dilation followed by erosion. Every contributor supports two strictly typed data domains:

- `mode: 'binary'` requires a packed `GPURasterBufferBand<'uint32'>` input and a caller-owned
  `GraphDataView<'uint32'>` output. Every nonzero input is foreground; valid output values are
  canonical `0` or `1`. Binary input calibration must be identity: `scale` can only be omitted
  or `1`, and `offset` can only be omitted or `0`.
- `mode: 'grayscale'`, or omitted `mode`, accepts any supported scalar input format and publishes
  caller-owned `GraphDataView<'float32'>` extrema. Raw nodata is checked in the original source
  format before applying source scale and offset exactly once, including opening/closing.

Both domains require a separate caller-owned `GraphDataView<'uint32'>` `outputValidity`. An invalid
binary result contains value `0` and validity `0`; a valid background pixel contains the same
value `0` with validity `1`. Invalid grayscale results contain `NaN` and validity `0`.

### Binary classification and observation validity

`GPURasterThreshold` writes zero for both legitimate below-threshold background and invalid
observations. Therefore, its output is the binary morphology **value band**, not the binary
validity mask. Supply the original analyzed observation validity separately:

```ts
new GPURasterThreshold({
  id: 'vegetation-foreground',
  width,
  height,
  input: adjustedBand,
  threshold: 0.35,
  output: vegetationForeground
}).addToGraph(graph);

const classifiedBand: GPURasterBufferBand<'uint32'> = {
  id: 'classified-vegetation',
  format: 'uint32',
  storage: {kind: 'buffer', values: vegetationForeground},
  validity: analyzedObservationValidity
};

new GPURasterDilation({
  id: 'expand-vegetation-foreground',
  width,
  height,
  mode: 'binary',
  input: classifiedBand,
  radius: 2,
  structuringElement: 'cross',
  noDataPolicy: 'ignore',
  borderMode: 'reflect',
  output: expandedForeground,
  outputValidity: expandedObservationValidity
}).addToGraph(graph);
```

Setting `validity: vegetationForeground` would incorrectly treat every background pixel as
missing and prevent dilation from growing foreground into valid background. Likewise, do not
set `noDataValue: 0` on an ordinary threshold mask: background zero is a meaningful observation.
Use the morphology output values together with their separately published output validity when
creating a later histogram selection or contour overlay. A binary boundary crosses level `0.5`.

## Dilation and erosion

Dilation selects the maximum over its valid participating footprint. In binary mode, this is an
OR of foreground flags: it expands foreground, can connect sufficiently close valid regions, and
can fill gaps smaller than the chosen footprint. In grayscale mode, it computes a local maximum
and enlarges bright features.

```ts
new GPURasterMorphology({
  id: 'bright-feature-maximum',
  width,
  height,
  operation: 'dilate',
  input: vegetationBand,
  radius: 2,
  structuringElement: 'square',
  output: localMaximum,
  outputValidity: localMaximumValidity
}).addToGraph(graph);
```

Erosion selects the footprint minimum. In binary mode, this is an AND of participating foreground
flags: it shrinks foreground, can remove sufficiently small islands, and can separate thin
connections. In grayscale mode, it computes a local minimum and enlarges dark features.

```ts
new GPURasterErosion({
  id: 'local-vegetation-minimum',
  width,
  height,
  mode: 'grayscale',
  input: vegetationBand,
  radius: 2,
  structuringElement: 'square',
  output: localMinimum,
  outputValidity: localMinimumValidity
}).addToGraph(graph);
```

Choose single-pass dilation or erosion when the actual expansion, contraction, local maximum, or
local minimum is the desired product. These are analytical operations on stored samples and
validity, not temporary outlines painted over a rendered image. The exact result depends on
footprint, radius, border policy, and missing observations; no operation guarantees preservation
of source topology.

## Opening and closing

Opening applies erosion first and dilation second. Use it to remove isolated foreground islands,
suppress small bright speckles, or break thin foreground connections while allowing surviving
features to recover their footprint-dependent extent:

```ts
new GPURasterOpening({
  id: 'remove-small-vegetation-islands',
  width,
  height,
  mode: 'binary',
  input: classifiedBand,
  radius: 1,
  structuringElement: 'cross',
  noDataPolicy: 'ignore',
  output: openedForeground,
  outputValidity: openedObservationValidity
}).addToGraph(graph);
```

Closing applies dilation first and erosion second. Use it to reduce small background holes,
suppress dark speckles, or reconnect sufficiently narrow breaks while approximately restoring the
surviving foreground's outside extent:

```ts
new GPURasterClosing({
  id: 'repair-small-vegetation-holes',
  width,
  height,
  mode: 'binary',
  input: classifiedBand,
  radius: 1,
  structuringElement: 'square',
  noDataPolicy: 'ignore',
  output: closedForeground,
  outputValidity: closedObservationValidity
}).addToGraph(graph);
```

Opening and closing operate on either binary or grayscale rasters. For grayscale composition, the
first pass calibrates the original scalar band; the second pass consumes already-calibrated
`float32` scratch without reapplying scale or offset. Binary composition preserves canonical
`uint32` foreground throughout. Neither operation revives an invalid center.

Both contributors snapshot their normalized options and input-band metadata at construction.
Later mutations to the caller's props, band description, or storage descriptor cannot change the
scheduled passes, borrowed source/output views, or reported `requiredHalo`.

## Structuring elements, borders, and nodata

Every morphology contributor requires an integer `radius` between `0` and `8`, inclusive.
`structuringElement: 'square'` is the default; it includes offsets whose Chebyshev distance is
at most the radius. `structuringElement: 'cross'` includes offsets whose Manhattan distance is
at most the radius. At radius one, these correspond to eight-connected and four-connected
neighborhoods:

```text
radius 1 square:  ###    radius 1 cross:   .#.
                  ###                      ###
                  ###                      .#.

radius 2 cross:   ..#..
                  .###.
                  #####
                  .###.
                  ..#..
```

For radii greater than one, `cross` is a Manhattan **diamond**, not merely one horizontal and
one vertical arm. A square includes `(2r + 1)²` positions; a diamond includes
`2r(r + 1) + 1`. At radius two that is 25 versus 13 samples; at radius eight, 289 versus 145.
Both footprints scale as `O(r²)` per pixel, although the diamond visits fewer positions.

The default `borderMode: 'clamp'` repeats the nearest edge observation. `reflect` mirrors
without repeating the nearest edge sample, `constant` supplies the explicit calibrated
`borderValue` (default `0`), and `nodata` treats exterior positions as missing. For binary
constant borders, zero becomes background `0` and every nonzero finite representable value,
including negative or fractional values, becomes foreground `1`.

`noDataPolicy: 'propagate'` is the default: any invalid included footprint sample invalidates
the output. `noDataPolicy: 'ignore'` skips invalid participating neighbors instead. Under either
policy, an invalid center always remains invalid; an all-invalid footprint cannot produce a valid
output. Ignoring missing positions is not a geodesic barrier: with radius greater than one,
another valid sample can still influence a center across an intervening nodata gap.

## Morphology graph costs and ownership

Dilation, erosion, and `GPURasterMorphology` register one bounded two-dimensional compute pass;
their `requiredHalo` equals `radius`. For positive radii, opening and closing register two
ordered passes and expose `requiredHalo = 2 * radius`. They allocate exactly two graph-owned
intermediate buffers: a domain-typed `uint32` or `float32` value band and a separate `uint32`
validity band. Their combined logical scratch footprint is `8 * width * height` bytes, excluding
the caller-owned inputs/outputs, implementation allocation alignment, and graph bookkeeping.

At `radius: 0`, every operation performs one identity pass that still canonicalizes binary flags,
applies grayscale calibration, and publishes source validity; opening/closing allocate no
intermediate scratch. Compatible nonoverlapping transient lifetimes can share graph-managed
allocations. Contributors declare resource hazards explicitly and never read back pixels, submit
commands, or silently replace caller-owned buffers.

The square and diamond both perform `O(r²)` neighborhood work per pixel; opening/closing repeat
that footprint across two passes. These explicit pass counts, buffer formats, and residency
properties describe scalability and composability, not a measured throughput claim. Actual
performance depends on pixel count, radius, GPU limits, memory bandwidth, and workload. Halo
metadata can drive explicit `GPURasterTileHaloAssembler` planning, but does not partition
oversized rasters or schedule neighborhood assembly automatically.

## Raster compute versus image effects

Existing luma.gl image-processing effects are useful for presentation: they transform rendered
color textures or screen-space imagery as part of an effects pipeline. LuRaster neighborhood and
edge, and morphology contributors instead process explicit scientific raster bands with raw
nodata, source validity, calibration, signed derivative conventions, analytical boundary
policies, foreground/background topology, and separately published validity masks. Their output
can flow directly into GPU histograms, statistics, thresholding, contour extraction, or later
raster algorithms without copying intermediate pixels to the CPU.

Prefer ordinary image effects when the desired result is only a visual postprocess. Prefer
LuRaster when filtered values must retain scientific meaning, compose with reusable command
graphs and transient scratch, or fit an explicitly tiled analytical pipeline. Separable Gaussian and
box kernels have a documented tap-count advantage over equivalent direct square convolution;
end-to-end speed and large-raster throughput remain adapter- and workload-dependent until they
are measured. Halo assembly remains explicitly requested; transparent oversized-raster
partitioning and FFT-backed filtering are not provided by these contributors.

## Marching-squares contour classification

Use `GPURasterContourClassifier` when another GPU algorithm needs to know where a scalar
surface crosses a value, but should own geometry emission or downstream topology itself. For
example, classify vegetation-index boundaries before creating custom polygon overlays, or
mark temperature isotherms without copying the source raster to the CPU.

```ts
new GPURasterContourClassifier({
  id: 'vegetation-boundary-cells',
  width,
  height,
  input: ndviBand,
  level: 0.35,
  cases: contourCases,
  segmentCounts: contourSegmentCounts
}).addToGraph(graph);
```

The caller allocates one `uint32` case and count for each of
`(width - 1) * (height - 1)` cells. Corners are classified with `value >= level`; the low
four case bits represent top-left, top-right, bottom-right, and bottom-left. Ambiguous
diagonal cases 5 and 10 use a deterministic bilinear/asymptotic decider, recorded in the
`0x10` flag.
A cell touching masked, nodata, or non-finite corners produces no segments. Each valid case
emits zero, one, or two segments. A one-row GPU `float32` view can replace a literal level
when another graph pass computes the threshold.

Classification is useful when callers need compact topology, custom styling, or a later
segmentation step. It is not a replacement for a screen-space shader when the only goal is a
temporary visual highlight.

## GPU contour geometry and indirect overlays

Use `GPURasterContours` when an analytical boundary should become reusable line geometry:
vegetation isolines, elevation contours, concentration thresholds, or map overlays. The
contributor composes case classification, a GPU prefix scan, bounded segment scattering, and
an optional GPU-written indirect draw count without reading the raster or segment count.

```ts
const contourCommands = new DrawCommandBuffer(device, {
  id: 'vegetation-contour-draw',
  type: 'draw',
  commands: [{vertexCount: 2, instanceCount: 0, firstVertex: 0, firstInstance: 0}]
});

new GPURasterContours({
  id: 'vegetation-contours',
  width,
  height,
  input: ndviBand,
  level: 0.35,
  vertices: contourVertices,
  segmentCount: visibleSegmentCount,
  overflow: contourOverflow,
  requiredSegmentCount: totalSegmentCount,
  draw: contourCommands.importToGraph(graph),
  metadata: rasterMetadata
}).addToGraph(graph);

// Bind a line-list model whose vertex shader reads contourVertices, then:
contourCommands.draw(renderPass, 0);
```

`vertices` is a caller-owned packed `float32x2` view containing two vertices per segment.
Its length must therefore be even. `segmentCount` is clamped to vertex capacity, `overflow`
signals truncated output, and optional `requiredSegmentCount` reports the original
unclamped requirement. Cases are emitted in deterministic row-major order. The draw record
describes a non-indexed, two-vertex instanced line. Every encoding publishes the complete
four-word indirect command: `vertexCount: 2`, the capacity-clamped `instanceCount`,
`firstVertex: 0`, and `firstInstance: 0`. This remains valid when the selected indirect-command
slot was zero-initialized or reused for a different draw.

Coordinates remain raster-local `float32` pixel positions. Pixel-area rasters use pixel
centers; point-sampled rasters use integer sample coordinates. Preserve the supplied affine
transform, tile origin, and CRS on the CPU when projecting positions into a geographic
overlay; silently converting large world coordinates to `float32` would lose precision.
Multi-tile seam ownership and deck.gl-specific adapters remain separate future work.

### Analytical contours versus presentation effects

Existing luma.gl image effects primarily shade or filter a rendered framebuffer. They are
appropriate when the output only needs to look different on screen. LuRaster contours process
the original scalar samples and nodata mask, produce reusable numerical vector geometry, and
keep classification, scan, scatter, and indirect rendering in one GPU-owned workflow.

Classification and bounded scattering scale linearly with raster-cell count, while emitted
geometry scales with crossing-segment count. Prefix scanning introduces explicit additional
passes and scratch storage. GPU-written indirect counts also let an application draw without
waiting for a CPU count, although this particular dashboard separately reads compact scalar
summaries for its controls. These structural advantages matter for repeated analysis or
downstream vector consumers, but they are not a universal speed guarantee: source resolution,
memory bandwidth, segment density, adapter limits, and application benchmarks determine actual
cost.

## Adapter limits and ownership

`getRasterDeviceLimits(device)` reports effective dispatch, allocation, and storage-binding
ceilings. `planRasterDispatchStripes(device, {width, height})` returns caller-managed,
whole-row stripes that respect those limits; it does not automatically rewrite large inputs.

Pointwise and neighborhood contributors use bounded two-dimensional dispatch. Histogram and
extent primitives still use bounded 256-invocation one-dimensional passes. On adapters allowing
65,535 workgroups per dimension, a `4096 × 4096` single-view histogram needs 65,536 workgroups
and is rejected; the application must process smaller tiles or explicitly managed stripes.
Transparent large-raster partitioning and global tiled histogram merges are not yet implemented.
Halo planning, neighbor assembly, and core extraction are explicit caller-composed operations;
they do not automatically partition an oversized source or bypass adapter limits.

Compiled graph destruction releases graph-owned transient allocations and computations but not
caller-owned imported buffers or textures. The application controls graph encoding, submission,
resource lifetimes, coordinate reprojection, and any synchronization or readback.

## Current scope and clean-room implementation

Percentile-based contrast, built-in GeoTIFF/COG decoding, global merged statistics, connected
components, tiled contour stitching, automatic whole-image result placement, and FFT-backed
raster convolution are not part of the current implementation.
Application-owned tile ingress, source-provided overviews/windows, independently budgeted
multi-tile CPU/GPU residency, fence-safe eviction, compatible compiled-graph reuse, explicit
cumulative neighborhood halo planning and native-format GPU assembly, half-open core
extraction, nodata-aware calibrated floating-point overview means and weighted pyramids, exact
integer categorical nearest/mode overviews, generated affine/CRS metadata, Sobel, Scharr,
Laplacian, gradient magnitude, bounded spatial smoothing, binary/grayscale dilation, erosion,
opening, closing, and single-raster contour extraction are implemented.

The design is informed by public [cuCIM documentation](https://docs.rapids.ai/api/cucim/stable/),
but all TypeScript and WGSL are independently implemented for browser WebGPU. LuRaster does not
copy cuCIM kernels or bundle CUDA, OpenSlide, NVIDIA codecs, or image decoders. Review the
[cuCIM third-party license notices](https://github.com/rapidsai/cucim/blob/main/LICENSE-3rdparty.md)
when selecting separately licensed application-side decoders.
