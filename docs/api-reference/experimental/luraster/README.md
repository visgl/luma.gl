# LuRaster: GPU-Resident Raster Analytics

`@luma.gl/experimental/luraster` provides optional, graph-native WebGPU operations for
two-dimensional scientific and geospatial rasters. Applications retain ownership of image
decoding, coordinate transforms, source buffers and textures, output allocation, command
submission, and optional readback.

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
  GPURasterScharr,
  GPURasterSobel,
  GPURasterStatistics,
  GPURasterThreshold,
  type GPURasterBufferBand
} from '@luma.gl/experimental/luraster';
```

The `./luraster` subpath is an explicit opt-in. Its runtime symbols are not exported from
`@luma.gl/experimental`, and the existing experimental package remains private.

## Try the Satellite Raster Lab

The [Satellite Raster Lab](/examples/showcase/raster-lab) visualizes deterministic synthetic
red and near-infrared imagery, GPU-derived NDVI, nodata/cloud masks, and a valid-pixel
histogram. Layer selection, Gaussian or box smoothing, neighborhood radius, Gaussian sigma,
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

`mode: 'linear'` applies midpoint-centered contrast; `mode: 'gamma'` additionally applies a
normalized gamma transform. Both literal `[minimum, maximum]` domains and caller-owned two-row
GPU domains are supported. For `mode: 'equalize'`, pass an existing `uint32` histogram in the
same domain; the contributor computes an inclusive CDF in graph-owned transient storage.
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
| `nodata`    | Treats out-of-bounds samples as invalid neighbors.                                                | Keeping missing exterior coverage explicit, especially before tiled halo support is available.       |

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
metadata does not assemble tiled halos or partition oversized rasters automatically.

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
graphs and transient scratch, or fit a future tiled analytical pipeline. Separable Gaussian and
box kernels have a documented tap-count advantage over equivalent direct square convolution;
end-to-end speed and large-raster throughput remain adapter- and workload-dependent until they
are measured. Automatic halo assembly, transparent oversized-raster partitioning, and
FFT-backed filtering are not provided by these contributors.

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
  commands: [{vertexCount: 2, instanceCount: 0}]
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
must describe a non-indexed, two-vertex instanced line; only its instance count is rewritten
on the GPU.

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
Transparent large-raster partitioning, tiled halo assembly, and global tiled histogram merges
are not yet implemented.

Compiled graph destruction releases graph-owned transient allocations and computations but not
caller-owned imported buffers or textures. The application controls graph encoding, submission,
resource lifetimes, coordinate reprojection, and any synchronization or readback.

## Current scope and clean-room implementation

Percentile-based contrast, tiled GeoTIFF/COG processing, connected components, tiled contour
stitching, and FFT-backed raster convolution are not part of the current implementation.
Sobel, Scharr, Laplacian, gradient magnitude, bounded spatial smoothing, binary/grayscale
dilation, erosion, opening, closing, and single-raster contour extraction are implemented.

The design is informed by public [cuCIM documentation](https://docs.rapids.ai/api/cucim/stable/),
but all TypeScript and WGSL are independently implemented for browser WebGPU. LuRaster does not
copy cuCIM kernels or bundle CUDA, OpenSlide, NVIDIA codecs, or image decoders. Review the
[cuCIM third-party license notices](https://github.com/rapidsai/cucim/blob/main/LICENSE-3rdparty.md)
when selecting separately licensed application-side decoders.
