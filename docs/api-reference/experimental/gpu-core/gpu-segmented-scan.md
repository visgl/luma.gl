import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUSegmentedScan

<GPUCoreDocsTabs active="segmented-scan" />

## Overview

`GPUSegmentedScan` computes independent prefix sums over variable-length contiguous ranges described by **offset-delimited segments**.

<GPUOperationContract operation="gpu-segmented-scan" />

## Prefix scans and segmented scans

A prefix scan turns values into running totals. For example, an exclusive scan of:

```text
input  = [2, 3, 4, 5]
output = [0, 2, 5, 9]
```

while the inclusive form is:

```text
output = [2, 5, 9, 14]
```

A segmented scan packs several independent sequences into one buffer and resets the running total at each boundary:

```text
values  = [2, 3 | 4, 5, 6 | 7]
offsets = [0,   2,        5,   6]

exclusive = [0, 2 | 0, 4, 9 | 0]
inclusive = [2, 5 | 4, 9,15 | 7]
```

Segment `s` is `[offsets[s], offsets[s + 1])`. N segments require N+1 offsets; repeated offsets describe empty segments. Offsets are nondecreasing and relative to the input view. Offsets beyond the input length are
clamped, and rows outside the covered ranges are left alone. Prefix sums wrap modulo 2^32.

This general representation also appears in Arrow lists, graph adjacency and CSR matrices, but the segmented API is not matrix-specific.

## Why it matters

Many GPU structures contain thousands of logical lists packed into one allocation. They need local ranks, local allocation positions or prefix weights without launching a separate scan for every list. A canonical segmented scan makes that operation reusable.

## Contract

The initial operation consumes packed `uint32` values and `segmentOffsets`. The output has the same length as the input and supports `exclusive` and `inclusive` modes.

```ts
import {GPUSegmentedScan} from '@luma.gl/graph/gpu-core';


graph.add(new GPUSegmentedScan({
  input: weights,
  segmentOffsets,
  output: prefixWeights,
  mode: 'exclusive'
}));
```

Empty segments are valid and write no rows.

## Composition

```text
sort / RLE / grouping / sparse construction
                     ↓
              segmentOffsets
                     ↓
             GPUSegmentedScan
                     ↓
       local ranks / offsets / positions
```

Together with `GPUSegmentedReduction`, this establishes the basic segmented algebra needed by grouped aggregation, graph adjacency processing, sparse structures and columnar list data.

## Performance notes


Each segment gets a 256-lane workgroup. The lanes scan tiles in parallel and carry the previous tile total forward. Dispatch spans multiple axes when needed. Long segments process their tiles sequentially within one workgroup.


## Limitations

The initial primitive supports `uint32` addition only. Input/output aliasing is rejected. The GPU trusts the producer to supply nondecreasing offsets.
