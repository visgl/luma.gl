import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUSegmentedReduction

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUSegmentedReduction` computes one scalar aggregate for every contiguous segment in a packed GPU vector. Segments are described by **offset-delimited segments**, a general representation shared by grouped data, adjacency lists, Arrow-style lists and CSR sparse matrices.

## What is an offset-delimited segment?

Many logical lists can be packed back-to-back into one flat GPU buffer. A second array stores the boundary of each list:

```text
values  = [10, 20 | 30, 40, 50 | 60, 70]
offsets = [0,     2,           5,      7]
```

Segment `s` owns the half-open range `[offsets[s], offsets[s + 1])`. The final offset closes the last segment, so N segments require N+1 offsets. Repeated offsets represent empty segments.

This pattern is sometimes encountered as the row-offset part of CSR sparse matrices, but segmented primitives use the more general term **offset-delimited segments** because no matrix is required.

## What is segmented reduction?

A normal reduction combines an entire vector into one result. A segmented reduction performs the same reduction independently inside every segment:

```text
values  = [10, 20 | 30, 40, 50 | 60, 70]
                 sum each segment
                         ↓
output  = [30, 120, 130]
```

For `min` the same input produces `[10, 30, 60]`; for `max`, `[20, 50, 70]`.

This is useful for totals per group, edge-weight totals per graph vertex, statistics per variable-length list, and values per spatial bucket.

## Contract

Given offsets `[o0, o1, ... oN]`, output row `i` reduces `input[oi..o(i+1))`.

```ts
new GPUSegmentedReduction({
  input: values,
  segmentOffsets,
  output: segmentTotals,
  operation: 'sum'
}).addToGraph(graph);
```

The initial implementation accepts packed `uint32`, `sint32`, and `float32` values and supports `sum`, `min`, and `max`. `segmentOffsets.length` must equal `output.length + 1`. Empty segments produce zero.

Offsets are expected to be monotonically nondecreasing and within input bounds. These GPU-resident invariants are normally guaranteed by the producer rather than validated through CPU readback.

## Composition

```text
sort / RLE / grouping / adjacency construction
                     ↓
              segment offsets
                     ↓
          GPUSegmentedReduction
                     ↓
           one aggregate per group
```

`GPUSegmentedLayout` can materialize offsets from segment-start flags. CSR row offsets are another natural source: reducing edge weights by each adjacency segment produces one aggregate per vertex.

Use `GPUReduction` for one global aggregate and `GPUSegmentedReduction` when the same operation must run independently over many contiguous ranges.

## Performance notes

The first implementation assigns one 256-thread workgroup to each segment. Threads stride through the segment and perform a workgroup-tree reduction. This is effective for many small and medium segments.

Very large or highly skewed segments may need hierarchical multi-workgroup partials; subgroup operations can reduce barrier cost. Those optimizations preserve the offset-delimited API.
