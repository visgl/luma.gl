# GPURaster pixel operations

[Overview](https://luma.gl/docs/api-reference/experimental/gpu-raster.md)[Concepts](https://luma.gl/docs/api-reference/experimental/gpu-raster/concepts.md)[Operations](https://luma.gl/docs/api-reference/experimental/gpu-raster/operations.md)

## Pointwise band math[​](#pointwise-band-math "Direct link to Pointwise band math")

`GPURasterBandMath` accepts two packed bands on the same graph and grid:

```
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

Available operations are `add`, `subtract`, `multiply`, `divide`, and `normalized-difference`. Both source masks intersect. For division and normalized difference, `epsilon` rejects denominators whose absolute value is less than or equal to the configured non-negative threshold; the default is zero. `clamp: [minimum, maximum]` is optional and never applied implicitly.

Sources may use different scalar formats and different calibration coefficients. Output values, output validity, and source storage must occupy separate buffers. All views must belong to the same command graph and contain exactly `width * height` packed rows.

## NDVI[​](#ndvi "Direct link to NDVI")

`GPURasterNDVI` specializes pointwise normalized difference:

```
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

```
nearInfraredCalibrated = nearInfraredRaw * nearInfraredScale + nearInfraredOffset

redCalibrated = redRaw * redScale + redOffset

ndvi = (nearInfraredCalibrated - redCalibrated)

       / (nearInfraredCalibrated + redCalibrated)
```

Raw nodata, each band's mask, non-finite calibrated values, and denominators within `epsilon` produce invalid output. NDVI is not implicitly limited to `[-1, 1]`: negative calibrated reflectance can produce valid values outside that interval. Supply `clamp` explicitly only when the application intends to discard that analytical range.

## Contrast, gamma, and histogram equalization[​](#contrast-gamma-and-histogram-equalization "Direct link to Contrast, gamma, and histogram equalization")

`GPURasterContrast` transforms calibrated samples while preserving a separate validity mask:

```
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

`mode: 'linear'` applies midpoint-centered contrast and never applies gamma, even when a nondefault `gamma` value is supplied. `mode: 'gamma'` additionally applies the normalized gamma transform; select it explicitly when nonlinear correction is intended. Both literal `[minimum, maximum]` domains and caller-owned two-row GPU domains are supported. For `mode: 'equalize'`, pass an existing `uint32` histogram in the same domain; the contributor computes an inclusive CDF in graph-owned transient storage. Degenerate or all-invalid histograms have explicit behavior, and no source pixels are copied back. Percentile-domain estimation and `rgba8unorm` presentation conversion are not yet implemented.

## Analytical threshold masks[​](#analytical-threshold-masks "Direct link to Analytical threshold masks")

`GPURasterThreshold` writes a caller-owned, canonical `uint32` selection mask:

```
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

Operations are `above`, `below`, and `range`. Scalar thresholds accept one finite literal or a one-row GPU `float32` view; range thresholds accept an ordered literal pair or a two-row GPU view. Raw native-format nodata, source validity, non-finite values, and source calibration are applied before classification. Feeding the resulting mask to `GPURasterHistogram` or `GPURasterStatistics` changes actual counts and distributions rather than merely dimming a presentation layer.

For automatic segmentation, `GPURasterOtsuThreshold` selects a threshold from a bounded caller-owned histogram without CPU synchronization:

```
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

Histograms contain between one and 256 bins, with combined counts that fit in `uint32`. Equal between-class scores deterministically select the lowest threshold; an empty histogram produces zero. The selected threshold remains GPU-resident when consumed by the downstream classification pass.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPURaster overview](https://luma.gl/docs/api-reference/experimental/gpu-raster.md)
* [GPURaster concepts](https://luma.gl/docs/api-reference/experimental/gpu-raster/concepts.md)
* [GPURaster operations index](https://luma.gl/docs/api-reference/experimental/gpu-raster/operations.md)
