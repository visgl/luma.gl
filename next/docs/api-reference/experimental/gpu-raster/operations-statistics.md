# GPURaster statistics

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)[Concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)

## Replayable global tiled statistics[​](#replayable-global-tiled-statistics "Direct link to Replayable global tiled statistics")

Use tile-local statistics when a displayed window intentionally defines its own numerical extent, histogram, and classification threshold. Use explicit global accumulators when independently resident windows must share one dataset-wide contrast domain, histogram, percentile, or Otsu threshold. Computing a separate automatic domain per tile and adding those bin arrays is incorrect: equivalent bin indexes then refer to different numerical ranges.

`GPURasterGlobalAccumulator` groups five caller-owned graph views:

```
const accumulator: GPURasterGlobalAccumulator = {

  extent: globalExtent,       // float32[2]: minimum, maximum

  count: globalValidCount,    // uint32[1]: saturating valid population

  sum: globalValueSum,        // float32[1]: calibrated population sum

  histogram: globalHistogram, // uint32[1..256]: saturating persistent bins

  overflow: globalOverflow    // uint32[1]: sticky population/bin/sum flags

};
```

All five buffers remain caller-owned. Extent and sum retain calibrated scientific values, while population and histogram bins use `uint32`. Initialization, statistics, histogram replay, and percentile publication are separate `GPUCommandGraphContributor` operations. None of them decodes tiles, loads an adapter, acquires residency, submits commands, creates completion fences, downloads pixels, or polls a GPU result.

### Why local histograms cannot simply be added[​](#why-local-histograms-cannot-simply-be-added "Direct link to Why local histograms cannot simply be added")

Suppose two owned tiles each contain three valid observations and each independently creates four bins:

```
west samples:        [0, 5, 10]       local domain [0, 10]

west local bins:     [1, 0, 1, 1]



east samples:        [100, 105, 110]  local domain [100, 110]

east local bins:     [1, 0, 1, 1]



incorrect bin sum:   [2, 0, 2, 2]     incomparable local intervals

global domain:       [0, 110]

correct global bins: [3, 0, 0, 3]     every sample uses the same intervals
```

Local bin `0` refers to values near zero in the west but near `100` in the east. Merely adding those arrays invents a distribution that does not correspond to any shared numerical axis. The first global pass discovers the common `[0, 110]` extent; only the second pass can assign both tiles to scientifically comparable bins.

### Explicit initialization and first-pass global domain[​](#explicit-initialization-and-first-pass-global-domain "Direct link to Explicit initialization and first-pass global domain")

Initialize one accumulator exactly once for each intended dataset-wide run:

```
new GPURasterGlobalInitialize({

  id: 'begin-global-vegetation-analysis',

  accumulator

}).addToGraph(graph);



for (const tile of applicationOwnedTiles) {

  new GPURasterGlobalStatisticsMerge({

    id: `global-statistics-${tile.id}`,

    width: tile.width,

    height: tile.height,

    input: tile.observedBand,

    accumulator

  }).addToGraph(graph);

}
```

Initialization explicitly writes extent `[0, 0]`, count `0`, sum `0`, every histogram bin `0`, and overflow `0`. Each first-pass merge excludes masked observations, exact raw nodata, and non-finite values before source calibration. A tile with no valid observations is a strict no-op, so an all-invalid dataset retains its initialized zero extent/count/sum. Valid tiles expand the persistent minimum/maximum and accumulate their calibrated count and sum.

Do not put `GPURasterGlobalInitialize` inside a compiled tile graph that will be encoded once per tile. Doing so resets the global results on every replay and leaves only the final tile. Keep initialization in an explicitly encoded one-time graph or register it once before every tile merge in a single graph.

### Stable-domain second-pass histogram replay[​](#stable-domain-second-pass-histogram-replay "Direct link to Stable-domain second-pass histogram replay")

After **every** first-pass tile has contributed to the final domain, replay those same half-open owned cores against the persistent extent:

```
for (const tile of applicationOwnedTiles) {

  new GPURasterGlobalHistogramMerge({

    id: `global-histogram-${tile.id}`,

    width: tile.width,

    height: tile.height,

    input: tile.observedBand,

    accumulator

  }).addToGraph(graph);

}



new GPURasterOtsuThreshold({

  id: 'global-vegetation-cutoff',

  histogram: accumulator.histogram,

  domain: accumulator.extent,

  output: globalThreshold

}).addToGraph(graph);
```

Each histogram contributor clears only its bounded graph-owned **tile partial**, fills that partial using the already finalized GPU-resident global extent, and explicitly adds it into the separate persistent global bins. Re-encoding a compatible tile graph therefore clears stale local counts without erasing previously merged tiles. Binning retains the existing inclusive upper endpoint. Merge only disjoint owned cores; including padded source halos as separate population observations would double-count tile seams.

The application may declare all first-pass and second-pass work in one command graph when all participating tiles can remain pinned together. For larger bounded-residency datasets, import the same caller-owned accumulator buffers into independently compiled initialization, first-pass tile, second-pass tile, and finalization graphs. Replay source tiles through the application-owned decoder or explicit residency cache, preserve imported-buffer replacement, and retain every source/graph lease until its caller-created post-submit fence resolves. Never start histogram replay before global extent merging finishes.

Each graph must import the same underlying persistent GPU buffers and construct its own graph-local `GraphDataView` objects; views from the initialization graph cannot be passed directly to a different tile graph. Compile a merge-only tile graph once when its shape is compatible, replace imported source buffers at each encoding, and submit every first-pass encoding before any second-pass encoding. The WebGPU queue preserves submitted command order; no intermediate CPU readback is needed to discover the finalized global domain. Place reset only in the one-time initialization graph, never in either replayed tile graph.

### Quantile approximation and overflow policy[​](#quantile-approximation-and-overflow-policy "Direct link to Quantile approximation and overflow policy")

`GPURasterGlobalPercentile` consumes the finalized global histogram, extent, count, and sticky overflow flags without synchronizing with the CPU:

```
new GPURasterGlobalPercentile({

  id: 'global-median',

  accumulator,

  percentile: 0.5,

  output: globalMedian,

  outputValidity: globalMedianValidity

}).addToGraph(graph);
```

`percentile` is a number from `0` through `1`. Rank selection uses `floor(percentile * (globalCount - 1))`; the `0` and `1` endpoints are the exact global minimum and maximum. Intermediate values are the center of their selected histogram bin, not exact sample-order statistics. Their quantization error is bounded by half the bin width; choosing more bins improves resolution at the cost of persistent storage and merge work. Histogram length is explicitly limited to `1` through `256` bins.

Population and individual histogram-bin counters saturate at `4,294,967,295` rather than wrapping. `accumulator.overflow` accumulates sticky bit flags:

* Bit `1`: the global valid population exceeded `uint32` capacity.
* Bit `2`: at least one global histogram bin exceeded `uint32` capacity.
* Bit `4`: an accumulated global `float32` sum became non-finite.

Only explicit reinitialization clears these flags. Empty populations or **any** overflow flag make percentile output an invalid quiet `NaN`, with optional validity `0`. Existing `GPURasterOtsuThreshold` does not inspect this separate overflow buffer automatically; use its result only when the application establishes that overflow is absent. Global extrema, exact unsaturated population/bin counts, and histogram-derived thresholds do not depend on tile arrival order. Floating sums can differ by ordinary `float32` addition-order rounding.

### Replay cost and explicit ownership[​](#replay-cost-and-explicit-ownership "Direct link to Replay cost and explicit ownership")

A complete global histogram reads each selected analytical tile twice: once to establish its valid global domain and once to bin against that stable domain. One-time initialization and optional percentile/Otsu selection add bounded graph passes. Persistent accumulator memory scales with histogram-bin count; temporary validity, calibrated samples, reduction scratch, and per-tile bin partials scale with selected tile size, never with full dataset dimensions.

Resident replay can avoid repeat decoding and GPU upload when cache budgets retain a tile; bounded applications may instead reacquire or re-decode it between phases. Command submission, source transport, loaders.gl 5 integration, decoder cancellation, residency policy, leases, fences, threshold application, and optional readback remain caller-controlled. Throughput depends on tile size, histogram bins, cache hits, source latency, dispatch count, bandwidth, and GPU; global analytical replay provides consistent scientific domains rather than a universal speedup over display-only image effects.

## Validity-aware histograms[​](#validity-aware-histograms "Direct link to Validity-aware histograms")

`GPURasterHistogram` keeps its inferred domain and binning on the GPU:

```
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

The default `domain: 'valid-auto'` computes a masked extent and passes that two-row GPU result explicitly to the existing histogram primitive. Finite raw nodata sentinels are excluded before the extent and histogram; source validity is preserved. `domainOutput` optionally publishes the caller-owned extent. If omitted, the extent is graph-owned transient storage.

An application may instead supply a fixed `[minimum, maximum]` tuple or a caller-owned two-row GPU domain in the same scalar format. `domainOutput` is valid only with the automatic domain. Output bins are cleared on every encoding, so re-encoding a compiled graph recomputes the distribution instead of accumulating stale counts.

The generic `GPUHistogram({mask, domain: 'auto'})` intentionally infers its domain from all input values before applying its mask. `GPURasterHistogram` does not change that shared primitive contract; it creates the raster-specific valid-pixel domain explicitly.

## Valid-pixel scalar statistics[​](#valid-pixel-scalar-statistics "Direct link to Valid-pixel scalar statistics")

`GPURasterStatistics` normalizes a floating-point band's raw nodata, non-finite samples, source validity, and calibration before composing graph-native reductions:

```
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

The caller provides one `uint32` count row, one `float32` sum row, one `float32` mean row, and a two-row `float32` extent. Empty or all-invalid selections have count, sum, mean, and extent equal to zero. Integer-wide sums, exact or standalone tile-local percentile estimation, and automatic large-raster partitioning remain separate future work; `GPURasterGlobalPercentile` already provides histogram-estimated percentiles for an explicit global accumulator.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPURaster overview](https://luma.gl/next/docs/api-reference/experimental/gpu-raster.md)
* [GPURaster concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/concepts.md)
* [GPURaster operations index](https://luma.gl/next/docs/api-reference/experimental/gpu-raster/operations.md)
