# GPUHistogram

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUHistogram` counts packed scalar values into a caller-owned `uint32` output view. The output length defines the bin count. Bins can be equal-width over a domain or separated by explicit, irregular edges.

## Concepts[​](#concepts "Direct link to Concepts")

A histogram partitions a numeric domain into intervals and counts how many values land in each interval. Equal-width histograms accept a literal domain, a GPU domain produced by another node, or `'auto'`, which inserts an extent reduction. Irregular histograms accept explicit literal or GPU-resident edges. In both forms, the minimum is inclusive, the maximum is included in the final bin, and values outside the domain are ignored.

Use histograms to inspect distribution shape without downloading every value: latency tails, duration profiles, sensor-value ranges, particle speeds, or selected-value summaries in a linked chart. Equal-width bins are convenient for exploratory views over compact domains; irregular edges are better when meaningful thresholds or several orders of magnitude must remain visible.

A histogram discards source identity and order. Use group aggregation for named categories, sorting for ordered rows, or compaction when the application needs the selected IDs rather than counts.

### Why irregular edges matter[​](#why-irregular-edges-matter "Direct link to Why irregular edges matter")

Equal-width bins work well for compact numeric domains. They are less useful for heavy-tailed measurements such as trace durations and request latency, where values may range from microseconds to seconds. A linear histogram can collapse most observations into one short-duration bin while leaving much of the long tail almost empty.

Irregular edges let applications preserve useful resolution across orders of magnitude and align bins with meaningful thresholds. A latency histogram can use boundaries such as `10 µs`, `100 µs`, `1 ms`, `10 ms`, `100 ms`, `1 s`, and `10 s`. The same bins can then compare processes, releases, or dynamically filtered subsets while remaining in the original unit and without first materializing a log-transformed GPU column. Exact service-level or alert boundaries can also become bin edges instead of falling somewhere inside a uniform interval.

Each irregular bin is `[edges[i], edges[i + 1])`, except the final bin also includes its upper edge. Edges must be finite, representable in the input format, strictly increasing, and contain exactly `output.length + 1` values. Literal arrays support up to 257 edges. GPU-resident edges support larger histograms and can be rewritten between encodings without recompiling the graph. A small validation pass checks their ordering without CPU readback; invalid GPU edges produce zero counts for that encoding.

The output is a distribution, not a prefix sum. Compose it with inclusive `GPUScan` to obtain a cumulative distribution, or reduce the bins to validate the accepted-row total.

```
new GPUHistogram({input: values, output: counts, domain: 'auto'}).addToGraph(graph);

new GPUHistogram({
  input: durations,
  output: latencyCounts,
  edges: [0.00001, 0.0001, 0.001, 0.01, 0.1, 1, 10]
}).addToGraph(graph);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
type GPUHistogramProps<T extends 'uint32' | 'sint32' | 'float32'> = {
  id?: string;
  input: GraphDataView<T> | GraphVectorView<T>;
  output: GraphDataView<'uint32'>;
} &
  (
    | {domain: readonly [number, number] | GraphDataView<T> | 'auto'; edges?: never}
    | {edges: readonly number[] | GraphDataView<T>; domain?: never}
  );
```

For a `GraphVectorView`, the histogram preserves the ordered input topology: it does not pack, concatenate, or rewrite chunks. The output is cleared once, then each non-empty `GraphDataView` chunk accumulates into the same bins in source order. Empty chunks add no accumulation pass.

`'auto'` inserts one multi-chunk `GPUReduction` extent, so its domain covers every non-empty chunk. Values outside the domain or edge range and non-finite floats are ignored. An exact maximum enters the final bin. For a degenerate equal-width domain, matching values enter bin zero. Counts wrap as `uint32`.

Every encoding clears the output before accumulation, so a compiled graph is safely reusable. Up to 256 bins use workgroup-local atomics; larger histograms use direct global atomics.
