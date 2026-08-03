# GPUScan

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUScan` adds a hierarchical `uint32` prefix sum to a `GPUCommandGraph`. Scans are exclusive by default and may be inclusive, segmented, or both.

## Concepts[​](#concepts "Direct link to Concepts")

A prefix sum turns a sequence into running totals. Whether the current value participates in its own total distinguishes the two modes:

| Mode      | Input `[3, 1, 4, 2]` produces | Typical uses                                                |
| --------- | ----------------------------- | ----------------------------------------------------------- |
| Exclusive | `[0, 3, 4, 8]`                | Output offsets, stream compaction, variable-size allocation |
| Inclusive | `[3, 4, 8, 10]`               | Cumulative distributions, running counts, cumulative sizes  |

A segmented scan restarts that running total within one input. For segment-start flags `[1, 0, 1, 0]`, the same input produces exclusive output `[0, 3, 0, 4]` or inclusive output `[3, 4, 4, 6]`. This is useful for grouped table rows, per-path geometry, per-level layout, and other adjacent records that need independent prefixes without separate dispatches.

Choose a scan when each row needs the total contributed by preceding rows. Besides compaction, this supports vertex offsets for variable-size geometry, text or path expansion, cumulative distributions, grouped layout offsets, and allocation positions in fixed-capacity output. Use a reduction when only the final total matters; use compaction when the desired result is already a dense list rather than the offsets used to build one.

“Hierarchical” describes how the implementation scales, not another output mode. Each workgroup scans a block, higher levels scan the block summaries, and offset passes propagate those totals back down. Callers see one logical result even when the input spans many workgroups or vector chunks.

## Usage[​](#usage "Direct link to Usage")

```
new GPUScan({
  id: 'selection-offsets',
  input: flags,
  output: offsets
}).addToGraph(graph);
```

Set `mode: 'inclusive'` when each output should include its corresponding input value. Supply `segmentFlags` to reset the prefix at every nonzero flag:

```
new GPUScan({
  id: 'cumulative-counts-by-group',
  input: counts,
  output: cumulativeCounts,
  mode: 'inclusive',
  segmentFlags: groupStarts
}).addToGraph(graph);
```

`input` and `output` may both be packed, four-byte-aligned `GraphDataView<'uint32'>` values or both be `GraphVectorView<'uint32'>` values. A data-view output must contain at least as many rows as its input. Vector input and output must have identical ordered chunk lengths.

`segmentFlags`, when supplied, must use the same view kind as `input` and must not share an underlying graph buffer with `output`. An atomic flags view must contain at least as many rows as the input; vector flags must have identical ordered chunk lengths. The first logical row begins a segment even if its flag is zero. Every later nonzero flag begins a new segment. Segments continue across vector chunk boundaries unless the first row in a later chunk is flagged.

Scan treats chunked vectors as one logical sequence, while all caller-visible buffers and chunk boundaries remain intact. It scans each chunk locally, scans the ordered chunk totals, and adds the resulting carry to each original output chunk. Empty chunks retain their place in that sequence.

For input `[1, 0, 1, 1]`, exclusive output is `[0, 1, 1, 2]` and inclusive output is `[1, 1, 2, 3]`. With segment flags `[1, 0, 1, 0]`, those outputs become `[0, 1, 0, 1]` and `[1, 1, 1, 2]` respectively.

The implementation scans 256 values per workgroup, recursively scans block sums, and propagates block offsets back to lower levels. Segmented scans propagate associative `(sum, segment)` summaries between workgroups and only apply a carry before the first local segment start. Vector scans add transient chunk-summary and carry buffers; they never concatenate or repack caller data. All scratch allocations participate in graph lifetime reuse. Arbitrary non-power-of-two lengths are supported. A zero-length scan adds no nodes.

All arithmetic wraps modulo 2^32. Signed, floating-point, minimum/maximum, and custom associative scans remain future work.
