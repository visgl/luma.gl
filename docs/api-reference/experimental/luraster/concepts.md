import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# LuRaster Concepts and Execution Model

<ExperimentalDocsTabs active="luraster" />

A satellite image, microscope slide, terrain model, and weather grid can all be represented as
**rasters**: rectangular grids whose pixels contain measurements. The hard part is not drawing
those measurements. It is preserving what they mean when observations are missing, an image is
too large to process at once, neighboring pixels cross tile boundaries, or several resolutions
must describe the same location.

LuRaster addresses those problems inside an explicitly submitted WebGPU command graph. This guide
explains the vocabulary and decisions before the
[complete LuRaster API reference](/docs/api-reference/experimental/luraster). The
[Satellite Raster Lab](/examples/showcase/raster-lab) makes each concept visible in a working
application.

## The execution model in one picture

```text
Application-owned source or loaders.gl adapter
                 |
                 | decode selected bands and a validity mask
                 v
CPU tile: native measurements + validity + spatial metadata
                 |
                 | explicit upload or bounded LuRaster tile cache
                 v
GPU tile: source-band buffers + separate validity buffer
                 |
                 | caller-owned command graph
                 v
NDVI / smoothing / halo assembly / overview / histogram / contours
                 |
                 | explicit command submission
                 v
GPU-resident analytical results and directly renderable geometry
                 |
                 | optional, application-selected readback
                 v
Compact statistics, a histogram, or another requested result
```

LuRaster does not download GeoTIFFs, select a network transport, decode image formats, submit GPU
commands, or implicitly copy raster pixels back to JavaScript. The application keeps those
decisions. A LuRaster tile cache can explicitly own uploads, resident source buffers, and reusable
graphs when an application opts into it.

## Raster, band, pixel, and metadata

A **raster** is a two-dimensional grid. A **band** is one measurement at every grid location:
red-light reflectance, near-infrared reflectance, elevation, temperature, or an integer class.
Several aligned bands describe the same pixels.

```text
Pixel location (x, y)
    |
    +-- red band:          0.18
    +-- near-infrared:     0.54
    +-- cloud class:       0
    +-- observation valid: 1
```

Values alone do not explain where a pixel is or what it measures. LuRaster preserves:

- The grid width and height.
- Each band's native scalar format: `float32`, `uint32`, or `sint32`.
- Optional band calibration: `physicalValue = rawValue * scale + offset`.
- An affine transform from pixel positions to spatial coordinates.
- The coordinate reference system, when supplied.
- Whether a pixel represents an area or a point.
- The overview level and the tile's origin in the full-resolution dataset.

An affine transform and coordinate reference system identify where data already lives; LuRaster
does not silently reproject it.

## What “nodata” means

**Nodata** means a pixel has no usable observation. A cloud may hide the ground, a satellite swath
may not cover the whole rectangular output, a sensor may fail, or a processing step may produce a
non-finite number. A missing measurement is different from a measurement whose value is zero.

For four pixels:

```text
Observed values: 10, missing, 30, missing

Correct valid count: 2
Correct sum:         40
Correct mean:        40 / 2 = 20

Incorrect mean:      (10 + 0 + 30 + 0) / 4 = 10
```

“**Nodata-aware**” means an operation respects that distinction. Missing observations do not
become zeros, contribute to a histogram, lower a mean, create a contour, or silently fill a cloud
hole. If every contributing observation is missing, the result stays invalid.

### The three ways a pixel can be invalid

LuRaster combines independent signals instead of assuming one special numeric value always means
missing:

| Signal                    | Example            | Meaning                                              |
| ------------------------- | ------------------ | ---------------------------------------------------- |
| Separate validity mask    | `validity = 0`     | The application explicitly rejects this pixel.       |
| Raw nodata sentinel       | `rawValue = -9999` | The source declares this exact stored value missing. |
| Non-finite floating value | `NaN` or infinity  | The measurement or calibrated result is not usable.  |

A pixel is valid only when every applicable signal accepts it. Nodata sentinels are compared
against the **raw native value before calibration**, so large unsigned identifiers and signed
sentinels retain their exact meaning.

```ts
const band = {
  format: "uint32",
  noDataValue: 65535,
  scale: 0.0001,
  offset: 0,
};

// Raw 1200 becomes the valid physical measurement 0.12.
// Raw 65535 is rejected before multiplication; it never becomes a real measurement.
// Raw 0 is the valid physical measurement 0 when its separate validity flag is 1.
```

### Why validity must be separate from values

Zero is often meaningful: zero rainfall, sea-level elevation, a zero-valued class, or the
background of a binary classification. These situations must not be confused:

| Stored value | Validity flag | Interpretation                                                  |
| -----------: | ------------: | --------------------------------------------------------------- |
|          `0` |           `1` | A real observation or a valid background/category value.        |
|          `1` |           `1` | A different real observation or foreground/category value.      |
|          `0` |           `0` | Missing; the stored value has no analytical meaning.            |
|      `-9999` |           `1` | Missing if `-9999` is this band's declared raw nodata sentinel. |

For a threshold mask, `0` means **valid observation below the threshold**, while a separate
validity flag of `0` means **no observation at all**. For a categorical overview, class `0` can
win the mode because it remains an actual category.

### Multiple bands must agree

An index that combines red and near-infrared measurements is valid only when both inputs are
valid. LuRaster's normalized difference vegetation index is:

```text
NDVI = (nearInfrared - red) / (nearInfrared + red)
```

If either band is missing, or the denominator is too close to zero, the output is invalid. A
missing red sample does not become `0`, and a visually plausible result does not override the
scientific validity contract.

Neighborhood operations have their own explicit policies. Some reject a result when required
neighbors are missing; others ignore missing neighbors and renormalize their weights. Neither
policy means “replace missing observations with zero.”

## Connected foreground components

A **connected component** is a maximal group of touching foreground pixels. Thresholding first
classifies observations: nonzero means foreground, zero can mean valid background, and a separate
zero validity flag still means the observation is missing. Component labeling answers “which
foreground pixels belong to the same region?” without confusing these three states.

```text
Foreground values:       Observation validity:    Interpretation:

1 0 1                    1 1 1                    region, background, region
0 1 0                    1 0 1                    background, missing, background
1 0 1                    1 1 1                    region, background, region
```

The central value is nonzero, but its separate validity is zero, so it must not join any region.
The other zero values remain legitimate background observations; they are not missing.

### Four neighbors or eight neighbors

**Four-connectivity** considers the north, south, east, and west neighbors. **Eight-connectivity**
also considers diagonal neighbors:

```text
Four-connected neighbors:       Eight-connected neighbors:

        N                              NW N NE
      W X E                             W X E
        S                              SW S SE
```

Consider five valid foreground pixels arranged diagonally:

```text
Foreground:       Four-connected:       Eight-connected:

1 0 1             1 0 3                 1 0 1
0 1 0             0 5 0                 0 1 0
1 0 1             7 0 9                 1 0 1
```

Four-connectivity produces five separate regions. Eight-connectivity joins them through the
center. If that center is invalid, neither policy can use it as a bridge. The choice depends on
whether corner contact should represent a real connection in the application's spatial model.

### Why representative labels are sparse

Each foreground region receives the smallest row-major pixel index in that region, plus one.
The extra one reserves label `0` for background. This makes results deterministic regardless of
GPU workgroup execution order, but identifiers are not densely renumbered: labels `1`, `3`, and
`9` identify three regions, not nine.

Do not use the largest representative as a component count or directly index a compact
per-region array. Compose `GPURasterDenseComponents` when contiguous IDs, an actual region count,
or an explicit capacity bound are required, then `GPURasterRegionMeasurements` for bounded
geometry and scientific intensity records. Cross-tile identity reconciliation remains a
separate future contract.

### Convergence must be proven

The GPU repeatedly hooks neighboring foreground representatives toward their minimum and
compresses parent pointers. The application supplies a fixed maximum number of graph rounds;
long, thin, or winding regions can require more than a small budget.

`GPURasterConnectedComponents` publishes an explicit GPU-resident `converged` scalar. A value of
`1` means the bounded computation reached a fixed point. A value of `0` means it did not; in
that case **every published label and output-validity flag is cleared**. Incomplete region shapes
therefore cannot appear as trustworthy classifications or feed later measurement.

An optional GPU iteration scalar records how many rounds actually ran, including the final
unchanged round that proves convergence. Remaining predeclared work can be suppressed on the GPU
without polling status or downloading source pixels to JavaScript.

### Dense labels count regions, not pixels

A **dense component label** is a contiguous region ID beginning at `1`; background remains `0`.
`GPURasterDenseComponents` marks the canonical sparse roots, applies an unsigned exclusive GPU
prefix scan, and assigns each representative its row-major rank:

```text
Sparse roots:          Dense IDs:

1 0 3                  1 0 2
0 5 0                  0 3 0
7 0 9                  4 0 5

largest sparse representative: 9
actual component count:        5
```

The five labels identify five regions, not five foreground pixels; one region can cover many
pixels. The count describes the selected raster or owned tile core only. Regions touching a
different tile are reconciled only when `GPURasterCrossTileComponents` is composed explicitly.

### Required count, bounded count, and overflow

An application can limit how many dense regions it is prepared to consume. For the five regions
above, `capacity: 3` produces exact required count `5`, bounded published count `3`, and
overflow `1`:

```text
Bounded labels:       Output validity:

1 0 2                 1 1 1
0 3 0                 1 1 1
0 0 0                 0 1 0
```

The outer zeros in the last row are dropped foreground and therefore **invalid**; its middle
zero is real background and remains **valid**. Missing observations are invalid as usual.
Consumers must check both validity and overflow; zero alone cannot distinguish these states.
Zero capacity invalidates every foreground region without turning real background into missing
data. Empty/background-only input has required count `0`, bounded count `0`, and no overflow.

The required and published populations are different, honest measurements:

- **Required count:** all converged regions present before a capacity limit.
- **Published count:** `min(required count, capacity)`.
- **Overflow:** whether the current converged execution required more than capacity.

Overflow is recomputed on each graph execution; it is not a sticky historical flag. If upstream
labeling does not converge, dense labels, their validity, both counts, and overflow are cleared.
An overflow value of zero is therefore meaningful only together with a proven convergence flag.
Malformed sparse roots fail closed without indexing outside their valid raster.

### Region geometry and intensity use different masks

A connected region can contain a real geometric pixel even when an independently measured
intensity is missing at that position. For example:

```text
Region pixels:         A     B     C
Region validity:       1     1     1
Intensity values:     10    --    20
Intensity validity:    1     0     1

Geometric pixel count:    3
Valid intensity count:    2
Intensity sum:           30
Intensity mean:          15
```

The three pixels all contribute to region shape, centroid, and area. Only the two valid
observations contribute to intensity count, sum, minimum, maximum, and mean. Dividing by the
geometric pixel count would invent a missing measurement. LuRaster therefore publishes separate
exact `pixelCounts` and `intensityCounts` alongside floating intensity summaries.

Intensity bands are explicitly `float32`; integer measurements are never silently converted.
Calibration is applied once after validity and raw nodata checks. Large integer values require
an explicit application-side promotion and a documented precision tradeoff.

### Centroids stay local; area keeps its real units

The GPU accumulates local column and row moments, then divides by geometric pixel count.
Pixels representing covered **areas** contribute their centers at `(column + 0.5, row + 0.5)`;
pixels representing sampled **points** use `(column, row)`.

World translations can be very large: a projected east/north origin might be `552400` and
`4187600`. Adding a small fractional centroid directly to those numbers in `float32` can erase
the fraction. LuRaster keeps the centroid local on the GPU and applies the retained raster
affine in JavaScript double precision with `getRasterRegionWorldCentroid`. A tile's affine
already includes its spatial origin, so `levelZeroOrigin` must not be added a second time.

For affine `[a, b, c, d, e, f]`, one pixel covers `abs(a * e - b * d)` square coordinate
units. Region area multiplies that determinant by its geometric pixel count. If the coordinate
reference system uses meters, the result can be labeled square meters; if it uses geographic
degrees, it is square degrees, not a geodesic area. No implicit reprojection or unit conversion
is performed.

### Empty intensity and failed segmentation are explicit

A real region with no accepted intensity samples retains its geometry: pixel count, centroid,
and area remain meaningful, while intensity count and sum are zero and intensity minimum,
maximum, and mean are `NaN`. An unused region row has zero counts, sums, moments, and area;
its intensity extrema/mean and centroid are `NaN`.

Nonconverged labels, dense capacity overflow, or an out-of-range published component count
invalidate **every** region measurement row. Individual missing/truncated labels cannot enter a
region. This fail-closed contract prevents a partial or stale measurement table from looking
like a completed segmentation. Cross-tile component identity is never inferred implicitly.

### One object can cross an owned tile boundary

Independent local region IDs do not describe dataset-wide identity. Consider two nonoverlapping
owned cores with one foreground object crossing their shared boundary:

```text
Owned core:                   west   |   east

Local dense labels:          1 1 0  |  0 0 0
                             0 0 0  |  0 1 1
                             0 2 2  |  1 1 0

Global dense labels:         1 1 0  |  0 0 0
                             0 0 0  |  0 2 2
                             0 2 2  |  2 2 0
```

Western local label `2` and eastern local label `1` meet directly across the seam, so both
become global label `2`. Western label `1` remains global label `1`; no halo pixel is counted
twice. Local number `1` on the two tiles never implied the same region.

With **four-connectivity**, only direct horizontal or vertical seam neighbors join. With
**eight-connectivity**, diagonal seam neighbors and genuine opposing corners at a four-tile
junction also join. Both endpoints must be valid foreground. Real zero-valued background does
not connect regions, and an invalid seam pixel is a missing-data barrier.

`GPURasterCrossTileComponents` accepts separately converged, nonoverflowing local dense labels,
their independent masks, half-open owned bounds, and local measurement tables. It resolves seam
equivalences on the GPU and assigns global IDs by the actual minimum **dataset-wide row-major
pixel** in each object. This distinction matters: sorting whole tiles before their local labels
can place a later western row ahead of an earlier eastern row. Sorting the globally translated
representative pixels instead reproduces monolithic IDs and remains unchanged when the caller
supplies the tiles in a different order.

### Merge counts and raw moments, never tile averages

A region split across tiles must be measured once from its merged populations:

```text
                           west      east      global

geometric pixel count:       3         2           5
valid intensity count:       1         2           3
intensity sum:              10        50          60
intensity mean:             10        25          20
```

The true global mean is `60 / 3 = 20`; averaging the tile means gives `17.5`, which incorrectly
weights a tile containing one observation equally with a tile containing two. Missing intensity
therefore reduces only the intensity population, not the object's geometric count or area.

Local spatial moments likewise require translation before merging. A region row with geometric
count `n`, local column sum `s`, and owned-core origin `x0` contributes `s + n * x0` in the
dataset's pixel coordinate system. Divide the merged moments by merged geometric count to
obtain the global local-pixel centroid, then apply the dataset affine once in JavaScript double
precision. Square coordinate-unit area follows the same affine determinant as a local region.

Global dense labels are explicitly bounded. The exact required population can exceed the
published capacity; retained IDs stay deterministic, dropped foreground becomes invalid, true
background remains valid, and overflow is visible. Unconverged or overflowing local inputs
cannot be promoted to completed global regions. Counter domains are bounded rather than silently
wrapping. Applications still choose the disjoint tiles, pin their leases, submit the graph,
provide completion fences, and decide whether to inspect one compact result.

The Satellite Raster Lab lets you switch between **OFF** and **COMPONENTS**, select
**4-CONNECTED** or **8-CONNECTED**, compare **SPARSE ROOTS** with **DENSE 1..N**, and adjust
separate propagation and region-capacity budgets. Its foreground readout counts selected pixels;
the component readout reports actual regions. Exact required count, convergence, and actual
rounds reuse three existing contour diagnostic words; the displayed bounded count and overflow
derive from that exact GPU count and visible capacity. Dense coloring is hidden entirely when
capacity is exceeded or convergence fails, while correctly converged sparse roots remain visible
even if the separate dense capacity is too small.

Its optional **INSPECT REGION** control publishes exactly one selected dense region record,
not the complete GPU measurement table. **LOCAL TILE** displays the selected core's own region;
**STITCHED DATASET** displays the same merged global row from either explicitly pinned source
tile. Reversing **WEST → EAST** and **EAST → WEST** cannot change the globally row-major region
ID or its merged population. Stitched scope requires **DENSE 1..N**; choosing **SPARSE ROOTS**
explicitly restores **LOCAL TILE**. It deliberately supports native/source-provided
overview samples, pointwise analysis, and manual thresholds only; generated means, seamless
neighborhoods, smoothing, edge/morphology operators, local Otsu, and dataset-wide histogram
mode return to an explicitly compatible scope.

Inspection explicitly changes the real displayed histogram from 48 bins to 40 bins; the eight
freed four-byte positions contain one local or stitched geometric count, intensity
sum/minimum/maximum/mean, local column/row centroid, and affine area. World coordinates are
reconstructed after that same read using the double-precision affine. Leaving inspection
restores the full 48-bin histogram. Every scope transfers exactly 228 bytes; the separate Otsu
baseline, global population, component count, convergence, and selected tile's local iteration
slots remain intact.

## Tiles and owned pixel cores

A large raster is divided into smaller **tiles** so an application can decode, upload, and
process bounded pieces. The **core** is the part of a tile for which that tile owns the output.
LuRaster uses **half-open bounds**: `[start, end)` includes `start` and excludes `end`.

```text
Full width: 9 pixels

western core  [0, 4): pixels 0, 1, 2, 3
middle core   [4, 8): pixels 4, 5, 6, 7
eastern core  [8, 9): pixel  8
```

The cores cover every pixel once. No boundary pixel belongs to both tiles, and an odd final tile
keeps its real width instead of inventing padded measurements.

Two coordinate spaces are used:

- **Level coordinates** address pixels in the currently selected overview.
- **Level-zero coordinates** address the original, full-resolution raster.

LuRaster canonicalizes equivalent source requests before caching them. A default full window and
the equivalent explicit window share an identity; incompatible levels, tile cores, and ordered
band selections remain distinct.

## What a halo is, and why seams appear

A **halo** is a temporary border of real neighboring samples surrounding an owned tile core.
The tile borrows those samples for a spatial operation, but it does not claim their outputs.

```text
Dataset:        0  1  2  3 | 4  5  6  7 | 8
Middle core:                [4  5  6  7]
Radius-2 halo:        [2  3  4  5  6  7  8]
Published result:           [4  5  6  7]
```

A blur, gradient, or morphological operation needs neighboring measurements. If a middle tile
pretends its internal seam is the edge of the whole dataset, the operation invents a border where
real pixels exist. A visible or analytical discontinuity appears at the seam.

LuRaster gathers available neighboring source tiles on the GPU, runs the operation over the
padded region, and publishes only the half-open owned core. Border policies such as clamp,
reflect, constant, or nodata apply only at an actual dataset boundary.

### Halos add across composed operations

The required source neighborhood is the **cumulative receptive field**, not merely the largest
single radius:

```text
Gaussian blur, radius 2                    -> 2 source pixels
Sobel gradient, radius 1                   -> 1 more source pixel
Opening, radius 2: erosion then dilation   -> 4 more source pixels

Total required halo                         = 7 source pixels
```

At a 2× overview, a seven-pixel overview halo covers fourteen pixels in each corresponding
full-resolution direction. Non-square sampling factors are tracked independently per axis.

A halo is temporary processing context. It is not duplicated output, an extrapolated tile, a
texture mipmap, or permission to count the same pixel twice.

## Overviews: one dataset at several resolutions

An **overview** is a lower-resolution representation of the same raster. A 2× overview maps up
to four original pixels into one overview pixel. An odd `5 × 7` raster becomes `3 × 4`, not
`2 × 3`; right and bottom edge pixels keep their remaining source coverage.

LuRaster distinguishes two very different sources of an overview.

### Source-provided overviews

An application or decoder supplies an existing lower-resolution image. The source owns its
sampling or aggregation policy, which might use nearest selection, averaging, or another
documented strategy. LuRaster does not infer how that level was produced.

This is useful when the source already stores an appropriate overview and minimizing native tile
decoding matters. The Satellite Raster Lab specifically provides a nearest-sample source overview,
which selects one existing observation per footprint. Its selected value is not a weighted mean;
if that observation is missing, a different valid sample is not automatically substituted.

### GPU-generated analytical mean

`GPURasterOverview` visits the original observations and publishes separate GPU-resident sum,
valid-count, mean, and validity results:

```text
2 × 2 source footprint:

    10       missing
    30       missing

sum         = 40
valid count = 2
mean        = 20
validity    = 1
```

An all-missing footprint produces zero sum, zero count, invalid output, and a `NaN` mean. It does
not create a real zero-valued observation.

When building a pyramid, later levels combine earlier **sums and valid counts**, not earlier
means:

```text
First child:  mean 10, count 1, sum 10
Second child: mean 30, count 3, sum 90

Correct parent mean: (10 + 90) / (1 + 3) = 25
Incorrect mean of means: (10 + 30) / 2   = 20
```

This distinction matters whenever cloud cover, partial edge footprints, or another validity
mask leaves overview pixels with unequal coverage.

### Categorical overviews

Integer categories are labels, not continuous measurements. Averaging class `1` and class `3`
into class `2` invents a category that may not exist.

`GPURasterCategoricalOverview` offers two explicit policies:

- **Nearest** selects one actual source label. If that source observation is invalid, the parent
  is invalid.
- **Mode** selects the most frequent valid source label. Ties select the smallest native label.

Signed categories remain signed, large unsigned categories keep their full integer precision,
and class `0` remains valid whenever its separate validity flag is set.

### Spatial metadata follows the overview

If source pixels are `10` meters wide, 2× overview pixels are `20` meters wide. The affine
transform scales accordingly, while the coordinate reference system, pixel interpretation, and
original origin remain meaningful. GPU-generated overview input origins must align with their
reduction grid; shifting a tile-local grouping by one source pixel would create an incorrect seam
between neighboring overview tiles. Source-reader windows are normalized separately and may begin
at arbitrary valid source coordinates.

An analytical overview is not the same thing as a graphics texture mipmap. Presentation mipmaps
optimize sampling; they do not, by themselves, preserve missing-data masks, weighted counts,
exact integer classes, or scientific spatial metadata.

## What “replayable” means

For LuRaster, **replay** means executing the analytical work for a tile again after another
phase has discovered information about the complete dataset. It does not mean recording video,
restarting the application, duplicating the full raster, or reading every pixel back to the CPU.

The clearest example is a dataset-wide histogram.

### Why local histograms cannot simply be added

Suppose two tiles contain:

```text
Western tile:  10, 20
Eastern tile: 100, 200
```

If each tile chooses its own minimum and maximum, its histogram bins describe different ranges:

```text
Western local domain: [10, 20]
Eastern local domain: [100, 200]
```

Adding the first western bin to the first eastern bin combines unrelated measurements. The bin
numbers match, but the value intervals do not.

### First pass: discover one global domain

LuRaster first visits every owned tile core to determine the full valid population:

```text
minimum = 10
maximum = 200
count   = 4
sum     = 330
```

Missing observations never contribute, and halo pixels are not counted because they do not belong
to the owned core.

### Second pass: replay every core against that domain

The same tile observations are processed again, this time using the already-known global range
`[10, 200]`. With four equal-width histogram bins:

```text
Western tile contributes: [2, 0, 0, 0]
Eastern tile contributes: [0, 1, 0, 1]

Global histogram:         [2, 1, 0, 1]
```

Every bin now means the same thing for every tile. Global percentiles, an automatic Otsu
threshold, contrast selection, and any other distribution-based decision operate on one
consistent dataset-wide distribution.

Resident tiles can be replayed directly from their existing GPU buffers. An evicted tile may need
to be decoded and uploaded again under the application's cache policy; “replayable” does not
promise every possible dataset fits in GPU memory.

### Reset and replay have different lifetimes

LuRaster explicitly separates:

1. **Dataset initialization:** clear the caller-owned global accumulator once for a new dataset.
2. **Statistics merges:** combine every tile's count, sum, minimum, and maximum.
3. **Histogram replays:** clear each tile's temporary partial histogram, then merge it into the
   still-live global bins.
4. **Consumption:** derive percentiles, thresholds, rendering inputs, or requested summaries.

Re-encoding a tile graph must clear that tile's temporary scratch, not erase the global work that
previous tiles already contributed. Conversely, intentionally starting a new dataset requires an
explicit global reset. Replaying a tile twice in the same phase contributes it twice; the caller
owns dataset membership and traversal order.

```ts
new GPURasterGlobalInitialize({ accumulator }).addToGraph(graph);

for (const tile of tiles) {
  new GPURasterGlobalStatisticsMerge({
    width: tile.width,
    height: tile.height,
    input: tile.band,
    accumulator,
  }).addToGraph(graph);
}

for (const tile of tiles) {
  new GPURasterGlobalHistogramMerge({
    width: tile.width,
    height: tile.height,
    input: tile.band,
    accumulator,
  }).addToGraph(graph);
}
```

The first loop must finish declaring all global-domain work before the second loop declares any
histogram replay. Tile order does not change unsaturated counts or bin identities; floating sums
can differ by ordinary floating-point addition-order rounding.

## Percentiles, Otsu, and overflow

A **histogram** counts valid measurements in fixed value intervals. A **percentile** estimates
the value below which a chosen share of those measurements falls; the median is the 50th
percentile. LuRaster's global percentile uses the finalized histogram: minimum and maximum
endpoints are exact, while interior values are estimated from histogram-bin centers.

**Otsu thresholding** chooses a cutoff that separates two groups in a histogram. On a tiled
dataset, its input must be the stable global histogram and global domain; combining independently
thresholded tiles can produce inconsistent classifications.

GPU counters are finite. LuRaster saturates unsigned 32-bit counts at `4,294,967,295` instead of
wrapping back to zero and records explicit sticky overflow bits:

| Overflow bit | Meaning                                                           |
| -----------: | ----------------------------------------------------------------- |
|          `1` | The total valid-pixel count exceeded the supported integer range. |
|          `2` | At least one histogram bin exceeded the supported integer range.  |
|          `4` | Adding floating sums would produce a non-finite result.           |

Global percentile output is invalid when its input is empty or any overflow bit is set. Consumers
of other derived decisions, including Otsu, must inspect overflow before trusting a saturated
distribution. Explicit dataset initialization clears sticky overflow for the next dataset.

## Resident tiles, budgets, and leases

A **resident tile** is a decoded tile retained in CPU memory, GPU memory, or both by the explicit
LuRaster cache. Reusing a resident tile avoids repeating a source read and GPU upload.

CPU and GPU budgets are independent:

- CPU accounting charges the complete retained typed-array backing allocation, not only the
  visible subarray. A small view into a `256 MB` pooled buffer still retains that whole buffer.
- GPU accounting includes uploaded source-band and validity buffers, compiled-graph scratch, and
  separately declared graph-owner outputs.
- Least-recently-used unpinned entries can be evicted to make room.
- A **lease** pins a tile or compiled graph so eviction cannot destroy resources that an active
  operation still needs.

Submitted GPU commands can continue after JavaScript returns. When a tile was used in submitted
work, create the completion fence **after submission**, then release the lease after the fence:

```ts
const encoder = device.createCommandEncoder({ id: "raster-analysis" });
compiledGraph.encode(encoder, { parameters: undefined });
device.submit(encoder.finish());

const fence = device.createFence();
tileLease.releaseAfter(fence);
graphLease.releaseAfter(fence);
```

A fence created before submission cannot protect work that has not yet been submitted. The cache
does not submit commands or create an implicit completion fence.

## What belongs to LuRaster and what belongs elsewhere

| Responsibility                                                                         | Owner                                                                 |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| URLs, authentication, range requests, workers, codecs, GeoTIFF, and COG decoding       | The application or a dedicated loader such as loaders.gl.             |
| Decoded tile metadata, source windows, native arrays, and cancellation                 | An application-owned tile source, validated by `GPURasterTileReader`. |
| Optional bounded uploads, GPU residency, eviction, and compiled-graph reuse            | `GPURasterTileCache`, when explicitly selected.                       |
| Neighbor planning, borrowed source tiles, GPU halo assembly, and owned-core extraction | LuRaster halo contributors and explicit leases.                       |
| Cross-tile region equivalences, canonical global IDs, and merged measurement rows      | Explicit LuRaster contributors over application-owned, pinned cores.  |
| Analytical overview values, counts, validity, and exact category policies              | LuRaster GPU overview contributors.                                   |
| Indices, filters, morphology, distributions, thresholds, regions, and contours         | LuRaster contributors inside the caller's command graph.              |
| Command submission, completion fences, renderer integration, and optional readback     | The application.                                                      |

LuRaster is a GPU analytical layer, not a replacement for loaders.gl. A future loaders.gl 5
integration can adapt decoded raster tiles into the LuRaster source contract while leaving
transport, format parsing, and worker policy on the loading side of the boundary.

## Choose the right path

| If you need to...                                                               | Start with...                                                                                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Understand the terms or compare execution models                                | This concepts guide.                                                                                                   |
| Experiment with actual source, halo, overview, and global controls              | The [Satellite Raster Lab](/examples/showcase/raster-lab).                                                             |
| Define or upload a single application-owned raster                              | Raster metadata and bands in the [API reference](/docs/api-reference/experimental/luraster#raster-bands-and-validity). |
| Read selected windows without importing a decoder into LuRaster                 | `GPURasterTileSource` and `GPURasterTileReader`.                                                                       |
| Keep uploaded windows within explicit memory budgets                            | `GPURasterTileCache` and its tile/graph leases.                                                                        |
| Blur, differentiate, or morph neighboring tiles without seams                   | `GPURasterTileHaloAssembler`, `GPURasterTileHaloFill`, and `GPURasterTileCoreExtract`.                                 |
| Downsample continuous measurements without averaging missing pixels             | `GPURasterOverview` with caller-owned sum, count, mean, and validity outputs.                                          |
| Downsample exact class identifiers                                              | `GPURasterCategoricalOverview` with nearest or mode policy.                                                            |
| Build one histogram or threshold across many tiles                              | Explicit global initialization, statistics merges, and stable-domain histogram replay.                                 |
| Identify connected thresholded foreground without inventing missing samples     | `GPURasterConnectedComponents` with four/eight connectivity and explicit convergence.                                  |
| Count regions or obtain bounded contiguous region identifiers                   | `GPURasterDenseComponents` after converged sparse labeling, with explicit capacity and overflow.                       |
| Measure each region's valid intensity, geometry, centroid, and affine area      | `GPURasterRegionMeasurements`; use `getRasterRegionWorldCentroid` for precise world coordinates.                       |
| Give a region crossing tile seams one global ID and correctly merged metrics    | `GPURasterCrossTileComponents` over converged owned cores and mergeable local measurement rows.                        |
| Look up complete constructors, format constraints, ownership, and code examples | The [LuRaster API reference](/docs/api-reference/experimental/luraster).                                               |

## A short glossary

- **Band:** one aligned grid of measurements, such as red reflectance or temperature.
- **Calibration:** conversion from a native stored value to a physical value using scale and offset.
- **Categorical value:** an exact integer label; it is not a continuous quantity to interpolate.
- **Centroid:** a region's geometric mean local pixel center; its world position uses retained
  double-precision affine metadata.
- **Connected component:** a maximal group of valid foreground pixels reachable under one
  declared four- or eight-neighbor relationship.
- **Connectivity:** the pixel-neighbor policy; four excludes diagonals and eight includes them.
- **Convergence:** GPU proof that bounded component-label propagation reached a stable fixed point.
- **Core:** the half-open region of a tile that owns analytical outputs.
- **Cross-tile equivalence:** valid foreground contact proving two owned tiles describe the
  same four- or eight-connected region.
- **Dense component ID:** a contiguous row-major region rank starting at `1`; `0` remains background.
- **Domain:** the minimum and maximum values used to interpret histogram bins.
- **Fence:** proof that previously submitted GPU work has completed.
- **Halo:** borrowed neighboring samples surrounding an owned tile core.
- **Histogram replay:** a second tile pass against a previously discovered global value domain.
- **Intensity population:** valid finite calibrated observations inside a region; it can be
  smaller than the region's geometric pixel population.
- **Lease:** a temporary pin preventing resident GPU resources from being evicted too early.
- **Nodata:** an absent or unusable observation, distinct from a valid numeric zero.
- **Nodata-aware:** excludes missing observations while preserving genuine zero values.
- **Otsu threshold:** a histogram-derived cutoff that separates two measurement groups.
- **Overview:** a lower-resolution representation of the same spatial raster.
- **Overflow:** an explicit signal that the current converged population exceeded caller capacity.
- **Pixel interpretation:** whether a source pixel represents a sampled point or a covered area.
- **Pixel population:** all valid labeled geometry pixels in a region, independent of intensity
  measurement availability.
- **Raster:** a rectangular grid of observations.
- **Receptive field:** the source neighborhood needed to produce one analytical output.
- **Representative label:** one plus the smallest row-major foreground pixel index in a
  connected component; these labels can be sparse.
- **Region area:** geometric pixel population times the absolute affine determinant, in square
  CRS coordinate units rather than implicitly square meters.
- **Region moment:** an additive population-weighted pixel-coordinate sum that can be translated
  into one dataset frame before calculating a merged centroid.
- **Required component count:** the exact converged region population before capacity clamping.
- **Replayable:** able to process tiles again after discovering global dataset information.
- **Sentinel:** a source-defined raw numeric value that means missing.
- **Tile:** a bounded rectangular subset of a raster.
- **Validity mask:** a separate per-pixel flag identifying usable observations.

For constructor signatures, graph examples, numerical constraints, and current feature limits,
continue to the [LuRaster API reference](/docs/api-reference/experimental/luraster).
