# GPUGroupAggregation

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUGroupAggregation` computes counts or floating-point statistics by dense `uint32` group key, optionally restricted by a GPU-resident selection mask. It answers categorical questions such as “how many selected requests belong to each service?”, “what is the mean latency of each visible service?”, or “what value range does each rendered material contribute?” without downloading the selected rows or rebuilding a CPU group-by.

For `'count'`, the caller supplies a `uint32` output. For `'sum'`, `'min'`, `'max'`, or `'mean'`, the caller supplies one aligned `float32` value per key and a `float32` output. The output length defines the number of groups. Group key `i` contributes to output row `i`; keys outside the output range are ignored.

## Concepts[​](#concepts "Direct link to Concepts")

Use grouped aggregation for stable categorical summaries: counts by status, mean latency by service, total bytes by protocol, or extrema by rendered material. The group rows remain stable while an optional GPU mask changes the participating population, which is especially useful for linked charts and legends that must track the same interactive selection as a renderer.

It assumes dense integer category IDs and returns one aggregate per category. Use a histogram for numeric intervals, grid aggregation for spatial cells, or sorting when the application needs the contributing rows rather than a summary.

### Categories are identities, not numeric ranges[​](#categories-are-identities-not-numeric-ranges "Direct link to Categories are identities, not numeric ranges")

A numeric histogram partitions an ordered domain into intervals. Category codes instead identify unrelated labels: code `3` may mean “timed out” and code `4` may mean “cancelled”, with no useful distance between them. Treating those codes as histogram coordinates obscures the real contract, especially when a dictionary has unused entries or an invalid sentinel.

`GPUGroupAggregation` makes the identity mapping explicit. Valid keys are the dense range `[0, output.length)`. Applications keep the label dictionary on the CPU while uploading only its compact unsigned codes. This maps directly to dictionary-encoded Arrow columns without adding an Arrow dependency to the GPU primitive.

### Counts describe population; statistics describe behavior[​](#counts-describe-population-statistics-describe-behavior "Direct link to Counts describe population; statistics describe behavior")

A count can show that one service dominates a selected interval, but not whether that service is slow, expensive, or anomalous. Aligned values let the same stable category rows answer a second class of questions: sum gives total work or bytes, minimum and maximum expose the observed range, and mean compares typical magnitude even when group populations differ.

This distinction is why grouped statistics are not modeled as numeric histograms. A latency histogram explains the shape of one numeric distribution; a grouped mean compares named services. Applications often need both views over the same GPU-resident selection.

### Filtered groups stay on the GPU[​](#filtered-groups-stay-on-the-gpu "Direct link to Filtered groups stay on the GPU")

An optional mask has one `uint32` value per key. Zero excludes a row and any nonzero value includes it. The mask can come from visibility, time-range, bounds, LOD, or selection workflows. Rewriting an imported mask between encodings updates every group result without recompiling the graph or reading the selected row IDs back first.

This is useful when group distributions accompany an interactive view. A chart can retain stable service, status, or object-type rows while their counts respond to the same GPU selection that drives rendering.

### Chunk preservation and contention[​](#chunk-preservation-and-contention "Direct link to Chunk preservation and contention")

For `GraphVectorView` inputs, keys, masks, and values must have identical ordered chunk lengths. Every encoding initializes the output once, then each non-empty chunk accumulates into the shared group rows without concatenation or repacking. Empty chunks retain their place in the source topology but add no accumulation pass.

Counts with up to 256 groups use workgroup-local atomics before merging into the result; larger count outputs and floating-point statistics use global atomics directly. This keeps small, highly contended count dictionaries efficient while avoiding unbounded workgroup storage. Large input chunks use bounded three-dimensional dispatches rather than assuming every workgroup fits in one device dimension.

Counts wrap modulo 2^32. Sum and mean use atomic compare-exchange addition, so ordinary `float32` rounding applies but accumulation order is not deterministic. Non-finite values are ignored. Minimum and maximum use ordered float encodings and preserve the documented `-0`/`+0` ordering. Empty sum groups contain positive zero; empty minimum, maximum, and mean groups contain NaN. Mean uses one graph-owned transient `uint32` count per group and divides after all chunks accumulate.

## Usage[​](#usage "Direct link to Usage")

```
new GPUGroupAggregation({
  keys: serviceCodes,
  mask: visibleRequests,
  output: requestCountsByService,
  operation: 'count'
}).addToGraph(graph);

new GPUGroupAggregation({
  keys: serviceCodes,
  values: requestLatencies,
  mask: visibleRequests,
  output: meanLatencyByService,
  operation: 'mean'
}).addToGraph(graph);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
type GPUGroupAggregationProps = {
  id?: string;
  keys: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  mask?: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
} & (
  | {output: GraphDataView<'uint32'>; operation?: 'count'; values?: never}
  | {
      values: GraphDataView<'float32'> | GraphVectorView<'float32'>;
      output: GraphDataView<'float32'>;
      operation: 'sum' | 'min' | 'max' | 'mean';
    }
);
```

`output` must contain at least one group and must not alias the key, mask, or value buffers. Paired inputs must use the same atomic/vector view kind and, for vectors, identical chunk topology. All inputs and output must belong to the target graph.

The graph owns no persistent result buffer, performs no submission, and introduces no readback. Out-of-range keys are ignored so callers can use a sentinel such as `0xffffffff` for missing or unmapped values.
