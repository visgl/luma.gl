import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUScan

<GPUPrimitivesDocsTabs active="scan" />

## Overview

`GPUScan` adds a hierarchical `uint32` prefix sum to a `GPUCommandGraph`. Scans are exclusive by
default and may be inclusive, segmented, or both.

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
