# LuRaster: GPU-Resident Raster Analytics

`@luma.gl/experimental/luraster` provides optional, graph-native WebGPU operations for
two-dimensional scientific and geospatial rasters. Applications retain ownership of image
decoding, coordinate transforms, source buffers and textures, output allocation, command
submission, and optional readback.

Current contributors cover raster metadata, explicit texture/buffer conversion, calibrated
pointwise band math, normalized difference vegetation index (NDVI), validity-aware histograms,
scalar summaries, contrast/gamma/equalization transforms, analytical thresholds, and
adapter-limit planning. They implement `GPUCommandGraphContributor` structurally: calling
`addToGraph(graph)` only declares work. No contributor submits commands or reads results back.

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPURasterBandMath,
  GPURasterContrast,
  GPURasterHistogram,
  GPURasterNDVI,
  GPURasterOtsuThreshold,
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
histogram. Layer selection, contrast, gamma, manual or automatic Otsu threshold selection, and
denominator tolerance rebuild the actual GPU analysis pipeline; the histogram reflects the
selected, transformed, valid pixels. Only 216 bytes of scalar summaries, histogram bins, and
the automatic cutoff are read back after graph submission.

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

## Adapter limits and ownership

`getRasterDeviceLimits(device)` reports effective dispatch, allocation, and storage-binding
ceilings. `planRasterDispatchStripes(device, {width, height})` returns caller-managed,
whole-row stripes that respect those limits; it does not automatically rewrite large inputs.

Pointwise contributors use bounded two-dimensional dispatch. Histogram and extent primitives
still use bounded 256-invocation one-dimensional passes. On adapters allowing 65,535 workgroups
per dimension, a `4096 × 4096` single-view histogram needs 65,536 workgroups and is rejected;
the application must process smaller tiles or explicitly managed stripes. Transparent
large-raster partitioning and global tiled histogram merges are not yet implemented.

Compiled graph destruction releases graph-owned transient allocations and computations but not
caller-owned imported buffers or textures. The application controls graph encoding, submission,
resource lifetimes, coordinate reprojection, and any synchronization or readback.

## Current scope and clean-room implementation

Percentile-based contrast, neighborhood filters, morphology, tiled GeoTIFF/COG processing,
connected components, contour extraction, and FFT-backed raster convolution are not part of
the current implementation.

The design is informed by public [cuCIM documentation](https://docs.rapids.ai/api/cucim/stable/),
but all TypeScript and WGSL are independently implemented for browser WebGPU. LuRaster does not
copy cuCIM kernels or bundle CUDA, OpenSlide, NVIDIA codecs, or image decoders. Review the
[cuCIM third-party license notices](https://github.com/rapidsai/cucim/blob/main/LICENSE-3rdparty.md)
when selecting separately licensed application-side decoders.
