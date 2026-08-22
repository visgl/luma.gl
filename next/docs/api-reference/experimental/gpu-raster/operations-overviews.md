# GPURaster analytical overviews

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)[Concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)

## GPU-generated analytical overviews[​](#gpu-generated-analytical-overviews "Direct link to GPU-generated analytical overviews")

Use an existing source-provided overview when its source-side sampling or reduction policy is known, its lower resolution avoids unnecessary decoding or upload, and its analytical meaning is appropriate for the task. Use `GPURasterOverview` when continuous floating-point observations must be reduced on the GPU without treating nodata as zero, discarding valid-sample weights, or averaging intermediate averages. Use `GPURasterCategoricalOverview` when classification labels need an explicit nearest-sample or most-frequent-label policy without fractional interpolation.

Generated overviews are distinct from source-provided `GPURasterTileReader` levels. They do not register new source levels, replace a decoder, select a transport, discover a GeoTIFF pyramid, or move source samples between CPU and GPU. Each contributor adds one explicit compute pass to the caller's command graph and writes only caller-owned output views.

| Question                                                 | Source-provided overview                                          | GPU-generated analytical overview                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| Where do its samples originate?                          | A level the application-owned source already exposes.             | Existing resident observations in a caller-owned graph.             |
| Who chooses the sampling policy?                         | The source or application; the reader does not infer its meaning. | The explicit floating mean or categorical nearest/mode contributor. |
| Does selecting it create GPU reduction work?             | No; it requests an existing decoded source level.                 | Yes; the application explicitly adds a bounded compute pass.        |
| Can floating means preserve nodata and future weights?   | Only if the source itself supplies and documents those semantics. | Yes; separate sum, valid count, validity, and mean are published.   |
| Does it become a new decoder/source level automatically? | It is already declared in source metadata.                        | No; the generated output remains application-owned graph data.      |

Display-oriented mipmaps and browser image resampling are not substitutes for either contract: they do not, by themselves, expose exact categorical identity, missing-observation coverage, weighted analytical sums, or the resulting raster's geospatial metadata.

### Floating means, nodata, and valid coverage[​](#floating-means-nodata-and-valid-coverage "Direct link to Floating means, nodata, and valid coverage")

`GPURasterOverview` consumes a `float32` source band and publishes four separate packed output views: the analytical mean, canonical `uint32` validity, calibrated `float32` sum, and `uint32` valid-sample count.

```
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

The reducer first intersects the explicit source validity mask, raw nodata sentinel, and finite raw observation. Source calibration is applied exactly once as `rawValue * input.scale + input.offset`; non-finite calibrated results are excluded. The parent value is the sum of remaining calibrated observations divided by their valid count, not by the nominal footprint area. A `2 × 2` footprint containing `[10, invalid, 30, invalid]` therefore publishes sum `40`, count `2`, mean `20`, and validity `1`. An entirely invalid footprint publishes sum `0`, count `0`, validity `0`, and a canonical quiet `NaN` mean.

Odd right and bottom edges use only existing source observations; missing coverage is not zero-padded. Retaining the sum and count separately makes population coverage and correctly weighted downstream pyramid levels available without downloading samples.

### Weighted multilevel pyramids[​](#weighted-multilevel-pyramids "Direct link to Weighted multilevel pyramids")

Forward both sum and valid count when reducing an already generated mean. Supply an explicit maximum number of raw observations that any input parent can represent:

```
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

For parent inputs with `(sum, count)` of `(10, 1)` and `(60, 3)`, the correct next-level mean is `(10 + 60) / (1 + 3) = 17.5`; averaging their intermediate means `(10 + 20) / 2 = 15` would bias the smaller population. Weighted levels consume the already calibrated sums directly and never apply source calibration a second time.

`inputSum` and `inputValidCount` must be supplied together, and weighted mode requires `maximumInputValidCount`. Construction rejects any configuration whose maximum `horizontalScale * verticalScale * maximumInputValidCount` could exceed the `uint32` count range. An observed child count above its declared bound invalidates the parent instead of wrapping or silently publishing incorrect coverage.

### Exact categorical nearest and mode[​](#exact-categorical-nearest-and-mode "Direct link to Exact categorical nearest and mode")

`GPURasterCategoricalOverview` preserves either `uint32` or `sint32` source identities and requires an explicit categorical policy:

```
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

Choose `'nearest'` when a representative existing sample is required. Even-sized footprints select the upper-left of their central candidates. If that selected observation is masked or matches raw nodata, the result is invalid; it does not silently substitute a different valid label. Choose `'mode'` when the most frequent valid label better represents a region. Invalid samples are ignored, and equal frequencies deterministically select the numerically smallest exact label. Negative signed categories and unsigned identifiers above `2²⁴` remain native integers rather than passing through `float32`.

`outputValidity` is always explicit. An invalid categorical parent publishes value `0` with validity `0`; a valid category whose identity is actually zero remains distinguishable through validity `1`. Optional `validCount` reports the number of valid observations in the complete footprint for either policy, including valid alternatives when a nearest-selected center is itself invalid.

### Spatial metadata, grid alignment, and cost[​](#spatial-metadata-grid-alignment-and-cost "Direct link to Spatial metadata, grid alignment, and cost")

`GPURasterOverviewScale` accepts an integer or `[horizontalScale, verticalScale]`; each axis must be between `1` and `8`. Output dimensions use independent ceiling division, so a `5 × 7` source at `[2, 3]` produces `3 × 3` parents. `makeRasterOverviewMetadata` derives the same target metadata as either contributor without allocating GPU resources:

```
const metadata = makeRasterOverviewMetadata(sourceMetadata, [2, 3], {

  level: 2,

  sourcePixelOrigin: [4, 6]

});
```

For an already positioned source affine `[a, b, c, d, e, f]`, the generated affine is `[a * sx, b * sy, c, d * sx, e * sy, f]`. Existing source translations `c` and `f` stay unchanged, including rotated or sheared grids; source coordinate-reference-system identity, pixel interpretation, and level-zero origin are preserved. The target level defaults to the source level plus one, and an explicitly supplied level must be greater than its source level.

The source origin must align with both reduction axes. When a level-zero source omits `sourcePixelOrigin`, GPURaster infers its `levelZeroOrigin` or `[0, 0]` and rejects globally misaligned translated tiles. A higher-level source with a nonzero `levelZeroOrigin` must supply `sourcePixelOrigin` explicitly in its current-level pixel coordinates; its level-zero origin alone cannot safely recover that current-level grid position. An explicit origin verifies alignment only: source metadata already contains the correct affine translation and preserved level-zero origin, so the helper never translates either value a second time.

The floating reduction evaluates up to `horizontalScale * verticalScale` observations per output pixel. Categorical mode additionally compares bounded candidate frequencies and can cost quadratically more within that footprint. Lower-resolution GPU-resident outputs may reduce work in later histograms, filters, and rendering, but reductions also allocate explicit output/sum/count/mask buffers and add a graph pass. Throughput depends on scale, nodata density, categorical policy, source residency, memory bandwidth, adapter limits, and the measured GPU; neither display-oriented image effects nor ordinary texture mipmaps preserve these analytical validity, weighting, categorical, or affine contracts.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPURaster overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)
* [GPURaster concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)
* [GPURaster operations index](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)
