# GPUSegmentedReduction

[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-reduction.md)[Segmented Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-segmented-reduction.md)[RLE and Unique](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-run-length-encode.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-histogram.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md)

## Overview[​](#overview "Direct link to Overview")

`GPUSegmentedReduction` computes one scalar aggregate for every contiguous segment in a packed GPU vector. Segments are described by **offset-delimited segments**, a general representation shared by grouped data, adjacency lists, Arrow-style lists and CSR sparse matrices.

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Reduce packed scalar values independently over offset-delimited segments.                                     |
| **Reads / writes**       | Reads values and CSR-style offsets; writes one sum, minimum, or maximum per segment.                          |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | One scalar per segment; empty segments produce zero.                                                          |
| **Expected work**        | One workgroup reduction per segment in the baseline implementation.                                           |
| **Chunks**               | Consumes one packed value domain with explicit segment boundaries.                                            |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | segment offsets + values → GPUSegmentedReduction → grouped aggregates.                                        |

**Cost**Segment count and skew determine utilization; very long segments serialize across one workgroup.

**Common mistake**Do not provide fewer or more than output.length + 1 segment offsets.

## What is an offset-delimited segment?[​](#what-is-an-offset-delimited-segment "Direct link to What is an offset-delimited segment?")

Many logical lists can be packed back-to-back into one flat GPU buffer. A second array stores the boundary of each list:

```
values  = [10, 20 | 30, 40, 50 | 60, 70]

offsets = [0,     2,           5,      7]
```

Segment `s` owns the half-open range `[offsets[s], offsets[s + 1])`. The final offset closes the last segment, so N segments require N+1 offsets. Repeated offsets represent empty segments.

This pattern is sometimes encountered as the row-offset part of CSR sparse matrices, but segmented primitives use the more general term **offset-delimited segments** because no matrix is required.

## What is segmented reduction?[​](#what-is-segmented-reduction "Direct link to What is segmented reduction?")

A normal reduction combines an entire vector into one result. A segmented reduction performs the same reduction independently inside every segment:

```
values  = [10, 20 | 30, 40, 50 | 60, 70]

                 sum each segment

                         ↓

output  = [30, 120, 130]
```

For `min` the same input produces `[10, 30, 60]`; for `max`, `[20, 50, 70]`.

This is useful for totals per group, edge-weight totals per graph vertex, statistics per variable-length list, and values per spatial bucket.

## Contract[​](#contract "Direct link to Contract")

Given offsets `[o0, o1, ... oN]`, output row `i` reduces `input[oi..o(i+1))`.

```
import {GPUSegmentedReduction} from '@luma.gl/graph/gpu-core';



graph.add(new GPUSegmentedReduction({

  input: values,

  segmentOffsets,

  output: segmentTotals,

  operation: 'sum'

}));
```

The primitive accepts packed `uint32`, `sint32`, and `float32` values and supports `sum`, `min`, and `max`. `segmentOffsets.length` must equal `output.length + 1`. Empty segments produce zero.

Offsets are nondecreasing and relative to the input view. Offsets beyond its length are clamped. A terminal offset below the input length can exclude a sorted tail. The output uses the input format and a separate buffer. Use an exactly sized subview when the output allocation has spare capacity.

## Composition[​](#composition "Direct link to Composition")

```
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

## Performance notes[​](#performance-notes "Direct link to Performance notes")

One 256-thread workgroup handles each segment. Threads stride through the segment and combine their partial results with a fixed binary tree. Floating-point sums use ordinary float32 rounding. Integer sums use 32-bit arithmetic.

Very large or highly skewed segments may need hierarchical multi-workgroup partials; subgroup operations can reduce barrier cost. Those optimizations preserve the offset-delimited API.
