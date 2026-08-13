import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';
import {WorkgroupScanBenchmark} from '@site/src/components/docs/workgroup-scan-benchmark';

# GPUScan

<GPUPrimitivesDocsTabs active="scan" />

## Overview

`GPUScan` computes a parallel prefix sum, commonly called a scan, over `uint32` values in a
`GPUCommandGraph`. Scans are exclusive by default and may be inclusive, segmented, or both.

## Concepts

A prefix sum turns a sequence into running totals. Whether the current value participates in its
own total distinguishes the two modes:

| Mode | Input `[3, 1, 4, 2]` produces | Typical uses |
| --- | --- | --- |
| Exclusive | `[0, 3, 4, 8]` | Output offsets, stream compaction, variable-size allocation |
| Inclusive | `[3, 4, 8, 10]` | Cumulative distributions, running counts, cumulative sizes |

A segmented scan restarts that running total within one input. For segment-start flags
`[1, 0, 1, 0]`, the same input produces exclusive output `[0, 3, 0, 4]` or inclusive output
`[3, 4, 4, 6]`. This is useful for grouped table rows, per-path geometry, per-level layout, and
other adjacent records that need independent prefixes without separate dispatches.

Choose a scan when each row needs the total contributed by preceding rows. Besides compaction,
this supports vertex offsets for variable-size geometry, text or path expansion, cumulative
distributions, grouped layout offsets, and allocation positions in fixed-capacity output. Use a
reduction when only the final total matters; use compaction when the desired result is already a
dense list rather than the offsets used to build one.

“Hierarchical” describes how the implementation scales, not another output mode. Each workgroup
scans a block, higher levels scan the block summaries, and offset passes propagate those totals
back down. Callers see one logical result even when the input spans many workgroups or vector
chunks.

## Usage

```ts
new GPUScan({
  id: 'selection-offsets',
  input: flags,
  output: offsets
}).addToGraph(graph);
```

Set `mode: 'inclusive'` when each output should include its corresponding input value. Supply
`segmentFlags` to reset the prefix at every nonzero flag:

```ts
new GPUScan({
  id: 'cumulative-counts-by-group',
  input: counts,
  output: cumulativeCounts,
  mode: 'inclusive',
  segmentFlags: groupStarts
}).addToGraph(graph);
```

`input` and `output` may both be packed, four-byte-aligned `GraphDataView<'uint32'>` values or both
be `GraphVectorView<'uint32'>` values. A data-view output must contain at least as many rows as its
input. Vector input and output must have identical ordered chunk lengths.

`segmentFlags`, when supplied, must use the same view kind as `input` and must not share an
underlying graph buffer with `output`. An atomic flags view must contain at least as many rows as
the input; vector flags must have identical ordered chunk lengths. The first logical row begins a
segment even if its flag is zero. Every later nonzero flag begins a new segment. Segments continue
across vector chunk boundaries unless the first row in a later chunk is flagged.

Scan treats chunked vectors as one logical sequence, while all caller-visible buffers and chunk
boundaries remain intact. It scans each chunk locally, scans the ordered chunk totals, and adds the
resulting carry to each original output chunk. Empty chunks retain their place in that sequence.

For input `[1, 0, 1, 1]`, exclusive output is `[0, 1, 1, 2]` and inclusive output is
`[1, 1, 2, 3]`. With segment flags `[1, 0, 1, 0]`, those outputs become `[0, 1, 0, 1]` and
`[1, 1, 1, 2]` respectively.

The implementation scans 256 values per workgroup, recursively scans block sums, and propagates
block offsets back to lower levels. Segmented scans propagate associative `(sum, segment)`
summaries between workgroups and only apply a carry before the first local segment start. Vector
scans add transient chunk-summary and carry buffers; they never concatenate or repack caller data.
All scratch allocations participate in graph lifetime reuse. Arbitrary non-power-of-two lengths
are supported. A zero-length scan adds no nodes.

All arithmetic wraps modulo 2^32. Signed, floating-point, minimum/maximum, and custom associative
scans remain future work.

## Subgroup acceleration

Unsegmented scans automatically use WebGPU subgroup operations when the created device exposes the
`subgroups` feature and the browser exposes the `subgroup_id` WGSL language extension. The portable
workgroup implementation remains the fallback, and segmented scans always use it. Subgroup lanes
are mapped to explicit logical indices so prefix order does not depend on implementation-defined
invocation layout.

See [Optional WebGPU and WGSL features](/docs/api-reference/webgpu/optional-features) for why these
two capabilities use different discovery and request mechanisms.

This path is especially relevant to GPU-resident trace visualization: hierarchy layout and stable
visibility compaction both scan large flag arrays on interactive updates. The GPU Trace Viewer uses
`featureLevel: 'max'`, so recent Chrome releases opt into the fast path automatically when the
adapter supports it and report the selected path in the inspector.

### Performance expectations

The standalone subgroup scan reduces block-local synchronization, but its global reads, writes,
summary hierarchy, and offset passes can make the full operation bandwidth-bound. On an Apple M4
Max, isolated 250K–10M element `GPUScan` measurements did not show a consistent end-to-end gain.
Do not assume that fewer barriers automatically improve a bandwidth-bound scan or trace update.

`runGPUWorkgroupScanBenchmark(device)` provides a complementary command-graph benchmark for the
synchronization-sensitive case. It compares graph-owned portable and subgroup compute nodes that
repeatedly scan generated values and write only one checksum per workgroup. Correctness is gated by
a shared CPU checksum oracle, strategy order alternates between measured iterations, and reported
GPU timings are normalized per dispatch. On the same M4 Max, its default 32-round workload was
approximately 60% faster with subgroups. This is a compute-local upper-bound use case rather than a
prediction for standalone `GPUScan`.

<WorkgroupScanBenchmark />
