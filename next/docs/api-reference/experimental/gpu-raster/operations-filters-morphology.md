# GPURaster filters and morphology

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)[Concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)

## Neighborhood stencils and boundary policies[​](#neighborhood-stencils-and-boundary-policies "Direct link to Neighborhood stencils and boundary policies")

`GPURasterNeighborhood` evaluates an explicit two-dimensional kernel against calibrated, buffer-backed raster samples. Use it when an analytical operator needs complete control over its radius, individual weights, boundary behavior, normalization, and invalid-neighbor policy; use the convolution or smoothing contributors below when their higher-level contracts already describe the operation.

```
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

The radius is either one number for a square kernel or `[horizontalRadius, verticalRadius]` for a rectangular kernel. Each axis is bounded to eight pixels, and the kernel must contain exactly `(2 * horizontalRadius + 1) * (2 * verticalRadius + 1)` coefficients representable as finite `float32` values. Compute workgroups cooperatively cache neighborhood samples and validity in workgroup-local tiles. Output values and canonical `uint32` validity are separate caller-owned buffers: in-place updates are forbidden because neighboring invocations would otherwise observe partially overwritten source pixels. Radius zero is the single-pixel identity when its sole weight is one.

Choose the border mode according to the meaning of samples beyond the known raster:

| Border mode | Out-of-bounds behavior                                                                            | When to use it                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `clamp`     | Repeats the closest edge sample.                                                                  | Continuous fields whose outermost measured value is the best available extension.                    |
| `reflect`   | Mirrors the interior without duplicating the boundary sample; a single-pixel axis repeats itself. | Smoothing terrain, reflectance, or microscopy without the flat edge plateaus introduced by clamping. |
| `constant`  | Uses the caller-provided `borderValue`.                                                           | Padding against a known background, such as zero-valued calibrated intensity.                        |
| `nodata`    | Treats out-of-bounds samples as invalid neighbors.                                                | Keeping missing exterior coverage explicit at genuine dataset boundaries.                            |

The default is `borderMode: 'clamp'`; `constant` defaults to `borderValue: 0` in the calibrated sample domain. For samples `[a, b, c]`, reflect-101 maps both the left position `-1` and right position `3` to `b` instead of repeating the edge pixel.

Raw-format nodata comparisons precede calibration, source masks remain authoritative, and non-finite samples never participate. An invalid center pixel always remains invalid even when the surrounding neighborhood contains valid samples, so clouds and source nodata are never silently inpainted. Neighbor handling is explicit:

* `noDataPolicy: 'propagate'` invalidates the output when a nonzero-weight neighbor is missing. This is the default. Use it for exact analytical stencils, derivative kernels, or workflows that require complete local coverage.
* `noDataPolicy: 'ignore-renormalize'` drops invalid neighbors and rescales the surviving smoothing weights. Use it for nonnegative averaging kernels near clouds, image boundaries, or sparse nodata; a neighborhood without usable weight remains invalid. Signed kernels are rejected with this policy because renormalizing positive and negative response weights would change the operator's meaning.

## Direct convolution[​](#direct-convolution "Direct link to Direct convolution")

`GPURasterConvolution` applies an arbitrary odd-sized two-dimensional kernel in a single GPU compute pass:

```
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

Use direct convolution for custom two-dimensional kernels that cannot be factored into independent horizontal and vertical filters, including asymmetric and signed response operators. Its spatial work grows with the kernel area: a square radius-`r` kernel evaluates `(2r + 1)²` taps per pixel. Keep normalization explicit for kernels whose coefficient sum should preserve constant-valued imagery; `normalize` defaults to `false`, and normalizing a zero-sum kernel is rejected. Signed response operators should retain their intended weights and use the strict `propagate` validity policy.

## Separable Gaussian smoothing[​](#separable-gaussian-smoothing "Direct link to Separable Gaussian smoothing")

`GPURasterGaussianBlur` composes independent horizontal and vertical passes around graph-owned intermediate scratch:

```
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

Use Gaussian smoothing to suppress sensor noise or small-scale variation before thresholding, segmentation, contour extraction, or scientific visualization. `radius` sets the bounded kernel footprint; `sigma` controls how broadly its normalized weights spread within that footprint. Increasing radius permits a wider neighborhood, while increasing sigma gives more influence to distant neighbors. Omitted sigma defaults to `max(radius / 2, 0.5)`. Gaussian weights are normalized and nonnegative, making valid-neighbor renormalization appropriate beside masked clouds or nodata.

The horizontal and vertical passes evaluate `2 * (2r + 1)` taps per pixel instead of `(2r + 1)²` for an equivalent direct square kernel: `O(r)` rather than `O(r²)` spatial work. This is an algorithmic scaling comparison, not a benchmark or a claim that every adapter and image size runs faster. Scratch values and intermediate validity occupy two graph-owned transient buffers, reused according to the existing graph allocator rather than downloaded to the CPU. Radius zero uses one identity/calibration pass without allocating smoothing scratch.

With `ignore-renormalize`, each separable axis independently renormalizes its own valid neighbors. Fully valid imagery matches the corresponding separable two-dimensional kernel, but irregular nodata holes can produce different weights from a direct full-neighborhood masked renormalization. Use `GPURasterConvolution` when that exact two-dimensional masked behavior is required.

## Separable box smoothing[​](#separable-box-smoothing "Direct link to Separable box smoothing")

`GPURasterBoxBlur` applies the same two-pass graph structure with uniform, normalized weights:

```
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

Use box smoothing when a local arithmetic mean is the intended measurement or when uniformly weighted denoising is sufficient. Gaussian smoothing is generally preferable when nearby observations should contribute more strongly than distant ones; neither filter should be used where preserving sharp boundaries exactly is the primary requirement. As with Gaussian smoothing, the separable box kernel performs `O(r)` taps per pixel and publishes GPU-resident values and validity for later graph contributors.

## Directional Sobel and Scharr gradients[​](#directional-sobel-and-scharr-gradients "Direct link to Directional Sobel and Scharr gradients")

`GPURasterSobel`, `GPURasterScharr`, and the configurable `GPURasterGradient` apply signed first-derivative operators to calibrated raster samples. Use a directional gradient when the orientation and sign of a boundary matter, such as locating transitions between water and vegetation or measuring horizontal versus vertical microscopy intensity changes.

```
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

`GPURasterSobel` is equivalent to `GPURasterGradient` with `operator: 'sobel'`; `GPURasterScharr` selects `operator: 'scharr'`. All three contributors use a single bounded `3 × 3` neighborhood pass with radius one. Their raw, row-major coefficients are:

```
Sobel x:  [-1, 0, 1]    Sobel y:  [-1, -2, -1]

          [-2, 0, 2]              [ 0,  0,  0]

          [-1, 0, 1]              [ 1,  2,  1]



Scharr x: [ -3, 0,  3]  Scharr y: [ -3, -10, -3]

          [-10, 0, 10]            [  0,   0,  0]

          [ -3, 0,  3]            [  3,  10,  3]
```

A value increasing with raster column produces a positive `x` derivative; a value increasing with raster row produces a positive `y` derivative. Raster rows increase downward, so `y` does not automatically mean north or positive projected-world Y. A unit-per-pixel ramp produces raw interior responses of `8` for Sobel and `32` for Scharr. The optional positive, finite `scale` multiplies every response and defaults to `1`: use `1 / 8` or `1 / 32` when a unit ramp should return approximately `1`. Signed direction and magnitude remain meaningful rather than being clamped to display colors.

Choose Sobel for a familiar, compact first derivative with moderate perpendicular smoothing. Choose Scharr when improved angular symmetry makes diagonal or orientation-sensitive edges more useful; its stronger perpendicular weights do not imply a larger source footprint. Both operators evaluate the same `3 × 3` neighborhood, so Scharr does not have an algorithmic tap-count advantage or disadvantage here. Actual GPU cost depends on the adapter, dispatch, memory traffic, and measured workload.

All derivatives are expressed per raster pixel, not in projected meters, geographic degrees, or other CRS/world units. Non-square pixel spacing, rotation, shear, orientation, or geographic distance requires an explicit application-side conversion using the raster affine transform and appropriate coordinate-reference-system semantics.

The default `borderMode` is `clamp`; `reflect`, `constant`, and `nodata` reuse the same explicit neighborhood boundary contract described above. Raw nodata and source masks are checked before calibration. An invalid center or an invalid nonzero-coefficient neighbor invalidates the output; signed derivative coefficients cannot use smoothing-style missing-neighbor renormalization. A zero-coefficient position does not participate and therefore does not invalidate the response. Each derivative publishes separate caller-owned `float32` values and canonical `uint32` validity; invalid outputs remain `NaN`.

## Laplacian response and second-order edges[​](#laplacian-response-and-second-order-edges "Direct link to Laplacian response and second-order edges")

`GPURasterLaplacian` measures the signed second derivative across either four cardinal neighbors or all eight neighboring pixels:

```
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

`connectivity: 4` is the default and uses `[0, 1, 0, 1, -4, 1, 0, 1, 0]`; `connectivity: 8` uses `[1, 1, 1, 1, -8, 1, 1, 1, 1]`. Both compute neighboring samples minus the center-weighted sample, so an isolated bright impulse has a negative response at its center, while an isolated dark depression has a positive response. A constant field has zero interior response. The same optional positive `scale`, border policy, raw nodata, and strict validity rules apply; missing diagonal neighbors do not affect four-connected output because their coefficients are zero.

Use the Laplacian when curvature, signed ridge/valley response, isotropic-looking boundary emphasis, or subsequent zero-crossing detection matters more than first-derivative orientation. Choose four connectivity for cardinal-only neighborhoods and eight connectivity when diagonal samples should participate explicitly. Second derivatives amplify local sensor noise, so apply `GPURasterGaussianBlur` first when the source is noisy; smoothing and Laplacian remain separate, declared graph stages with separately defined validity behavior. The Laplacian is not a replacement for directional Sobel/Scharr response when edge orientation is required.

## Gradient magnitude and graph-owned scratch[​](#gradient-magnitude-and-graph-owned-scratch "Direct link to Gradient magnitude and graph-owned scratch")

`GPURasterGradientMagnitude` combines horizontal and vertical first derivatives into the nonnegative response `sqrt(x * x + y * y)`:

```
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

Use magnitude when total boundary strength matters regardless of direction: threshold candidate field boundaries, prepare a segmentation mask, compare edge contrast, or colorize transitions without treating opposite edge orientations differently. `operator` defaults to `sobel`; select `scharr` for the same improved angular response described above. The positive `scale` applies to both directional derivatives before their magnitude is combined, so `1 / 8` or `1 / 32` normalizes a unit horizontal or vertical ramp for its selected operator.

One contributor declares three ordered GPU graph passes: the horizontal derivative, vertical derivative, and magnitude combination. It allocates four graph-owned transient buffers: one `float32` response and one `uint32` validity mask for each direction. Their logical scratch cost is `16 * width * height` bytes in addition to caller-owned output values and validity. The combination intersects both directional masks; missing samples cannot be revived or silently renormalized. Its magnitude pass uses a ratio-scaled hypot calculation to avoid unnecessarily overflowing intermediate squares and requires six available storage-buffer bindings; an unrepresentable final response remains invalid. Graph compilation owns and eventually releases scratch and compute allocations, while inputs and final outputs remain caller-owned.

Directional Sobel, Scharr, and Laplacian each need one fixed-footprint `3 × 3` pass without additional global scratch; full gradient magnitude adds the two intermediate derivative pairs and a third pass. Every option scales linearly with bounded pixel count, with different dispatch and memory constants. These structural costs and reusable GPU-resident outputs explain when a particular operation is appropriate; they do not establish an unmeasured speedup over another implementation or a screen-space image effect.

## Binary and grayscale morphology[​](#binary-and-grayscale-morphology "Direct link to Binary and grayscale morphology")

Morphology changes a raster according to the minimum or maximum within a selected neighborhood. Use it after classification when foreground shapes, small islands, holes, or narrow connections matter, or use grayscale morphology when local brightness/intensity extrema are themselves the intended analytical result.

`GPURasterMorphology` exposes one explicit `operation: 'dilate' | 'erode'` pass; `GPURasterDilation` and `GPURasterErosion` name those operations directly. `GPURasterOpening` composes erosion followed by dilation, while `GPURasterClosing` composes dilation followed by erosion. Every contributor supports two strictly typed data domains:

* `mode: 'binary'` requires a packed `GPURasterBufferBand<'uint32'>` input and a caller-owned `GraphDataView<'uint32'>` output. Every nonzero input is foreground; valid output values are canonical `0` or `1`. Binary input calibration must be identity: `scale` can only be omitted or `1`, and `offset` can only be omitted or `0`.
* `mode: 'grayscale'`, or omitted `mode`, accepts any supported scalar input format and publishes caller-owned `GraphDataView<'float32'>` extrema. Raw nodata is checked in the original source format before applying source scale and offset exactly once, including opening/closing.

Both domains require a separate caller-owned `GraphDataView<'uint32'>` `outputValidity`. An invalid binary result contains value `0` and validity `0`; a valid background pixel contains the same value `0` with validity `1`. Invalid grayscale results contain `NaN` and validity `0`.

### Binary classification and observation validity[​](#binary-classification-and-observation-validity "Direct link to Binary classification and observation validity")

`GPURasterThreshold` writes zero for both legitimate below-threshold background and invalid observations. Therefore, its output is the binary morphology **value band**, not the binary validity mask. Supply the original analyzed observation validity separately:

```
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

Setting `validity: vegetationForeground` would incorrectly treat every background pixel as missing and prevent dilation from growing foreground into valid background. Likewise, do not set `noDataValue: 0` on an ordinary threshold mask: background zero is a meaningful observation. Use the morphology output values together with their separately published output validity when creating a later histogram selection or contour overlay. A binary boundary crosses level `0.5`.

## Dilation and erosion[​](#dilation-and-erosion "Direct link to Dilation and erosion")

Dilation selects the maximum over its valid participating footprint. In binary mode, this is an OR of foreground flags: it expands foreground, can connect sufficiently close valid regions, and can fill gaps smaller than the chosen footprint. In grayscale mode, it computes a local maximum and enlarges bright features.

```
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

Erosion selects the footprint minimum. In binary mode, this is an AND of participating foreground flags: it shrinks foreground, can remove sufficiently small islands, and can separate thin connections. In grayscale mode, it computes a local minimum and enlarges dark features.

```
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

Choose single-pass dilation or erosion when the actual expansion, contraction, local maximum, or local minimum is the desired product. These are analytical operations on stored samples and validity, not temporary outlines painted over a rendered image. The exact result depends on footprint, radius, border policy, and missing observations; no operation guarantees preservation of source topology.

## Opening and closing[​](#opening-and-closing "Direct link to Opening and closing")

Opening applies erosion first and dilation second. Use it to remove isolated foreground islands, suppress small bright speckles, or break thin foreground connections while allowing surviving features to recover their footprint-dependent extent:

```
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

Closing applies dilation first and erosion second. Use it to reduce small background holes, suppress dark speckles, or reconnect sufficiently narrow breaks while approximately restoring the surviving foreground's outside extent:

```
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

Opening and closing operate on either binary or grayscale rasters. For grayscale composition, the first pass calibrates the original scalar band; the second pass consumes already-calibrated `float32` scratch without reapplying scale or offset. Binary composition preserves canonical `uint32` foreground throughout. Neither operation revives an invalid center.

Both contributors snapshot their normalized options and input-band metadata at construction. Later mutations to the caller's props, band description, or storage descriptor cannot change the scheduled passes, borrowed source/output views, or reported `requiredHalo`.

## Structuring elements, borders, and nodata[​](#structuring-elements-borders-and-nodata "Direct link to Structuring elements, borders, and nodata")

Every morphology contributor requires an integer `radius` between `0` and `8`, inclusive. `structuringElement: 'square'` is the default; it includes offsets whose Chebyshev distance is at most the radius. `structuringElement: 'cross'` includes offsets whose Manhattan distance is at most the radius. At radius one, these correspond to eight-connected and four-connected neighborhoods:

```
radius 1 square:  ###    radius 1 cross:   .#.

                  ###                      ###

                  ###                      .#.



radius 2 cross:   ..#..

                  .###.

                  #####

                  .###.

                  ..#..
```

For radii greater than one, `cross` is a Manhattan **diamond**, not merely one horizontal and one vertical arm. A square includes `(2r + 1)²` positions; a diamond includes `2r(r + 1) + 1`. At radius two that is 25 versus 13 samples; at radius eight, 289 versus 145. Both footprints scale as `O(r²)` per pixel, although the diamond visits fewer positions.

The default `borderMode: 'clamp'` repeats the nearest edge observation. `reflect` mirrors without repeating the nearest edge sample, `constant` supplies the explicit calibrated `borderValue` (default `0`), and `nodata` treats exterior positions as missing. For binary constant borders, zero becomes background `0` and every nonzero finite representable value, including negative or fractional values, becomes foreground `1`.

`noDataPolicy: 'propagate'` is the default: any invalid included footprint sample invalidates the output. `noDataPolicy: 'ignore'` skips invalid participating neighbors instead. Under either policy, an invalid center always remains invalid; an all-invalid footprint cannot produce a valid output. Ignoring missing positions is not a geodesic barrier: with radius greater than one, another valid sample can still influence a center across an intervening nodata gap.

## Morphology graph costs and ownership[​](#morphology-graph-costs-and-ownership "Direct link to Morphology graph costs and ownership")

Dilation, erosion, and `GPURasterMorphology` register one bounded two-dimensional compute pass; their `requiredHalo` equals `radius`. For positive radii, opening and closing register two ordered passes and expose `requiredHalo = 2 * radius`. They allocate exactly two graph-owned intermediate buffers: a domain-typed `uint32` or `float32` value band and a separate `uint32` validity band. Their combined logical scratch footprint is `8 * width * height` bytes, excluding the caller-owned inputs/outputs, implementation allocation alignment, and graph bookkeeping.

At `radius: 0`, every operation performs one identity pass that still canonicalizes binary flags, applies grayscale calibration, and publishes source validity; opening/closing allocate no intermediate scratch. Compatible nonoverlapping transient lifetimes can share graph-managed allocations. Contributors declare resource hazards explicitly and never read back pixels, submit commands, or silently replace caller-owned buffers.

The square and diamond both perform `O(r²)` neighborhood work per pixel; opening/closing repeat that footprint across two passes. These explicit pass counts, buffer formats, and residency properties describe scalability and composability, not a measured throughput claim. Actual performance depends on pixel count, radius, GPU limits, memory bandwidth, and workload. Halo metadata can drive explicit `GPURasterTileHaloAssembler` planning, but does not partition oversized rasters or schedule neighborhood assembly automatically.

## Raster compute versus image effects[​](#raster-compute-versus-image-effects "Direct link to Raster compute versus image effects")

Existing luma.gl image-processing effects are useful for presentation: they transform rendered color textures or screen-space imagery as part of an effects pipeline. GPURaster neighborhood and edge, and morphology contributors instead process explicit scientific raster bands with raw nodata, source validity, calibration, signed derivative conventions, analytical boundary policies, foreground/background topology, and separately published validity masks. Their output can flow directly into GPU histograms, statistics, thresholding, contour extraction, or later raster algorithms without copying intermediate pixels to the CPU.

Prefer ordinary image effects when the desired result is only a visual postprocess. Prefer GPURaster when filtered values must retain scientific meaning, compose with reusable command graphs and transient scratch, or fit an explicitly tiled analytical pipeline. Separable Gaussian and box kernels have a documented tap-count advantage over equivalent direct square convolution; end-to-end speed and large-raster throughput remain adapter- and workload-dependent until they are measured. Halo assembly remains explicitly requested; transparent oversized-raster partitioning and FFT-backed filtering are not provided by these contributors.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPURaster overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)
* [GPURaster concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)
* [GPURaster operations index](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)
