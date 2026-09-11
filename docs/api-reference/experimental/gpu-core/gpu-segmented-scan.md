import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUSegmentedScan

<GPUCoreDocsTabs active="scan" />

## Overview

`GPUSegmentedScan` computes independent prefix sums over variable-length contiguous ranges described by CSR-style offsets.

## Motivation

A global prefix scan is one of the most useful GPU primitives, but many real data structures contain many logical sequences packed into one buffer. Adjacency lists, Arrow list values, grouped rows, spatial buckets and run-length encoded keys all need prefix state to reset at segment boundaries. Without a canonical segmented scan, each higher-level subsystem tends to grow a private scan/reset kernel.

`GPUSegmentedScan` makes that operation reusable and gives the graph library a direct counterpart to `GPUSegmentedReduction`.

## Contract

The operation consumes packed `uint32` values and packed `uint32` `segmentOffsets`. Offsets use the standard CSR/list convention: segment `s` owns rows in `[segmentOffsets[s], segmentOffsets[s + 1])`. Therefore `segmentOffsets.length - 1` is the number of segments.

The output has the same logical length as the input. Both exclusive and inclusive modes are supported. Empty segments write no rows and are valid.

```ts
new GPUSegmentedScan({
  id: 'neighbor-offsets',
  input: weights,
  segmentOffsets,
  output: prefixWeights,
  mode: 'exclusive'
}).addToGraph(graph);
```

For input `[2, 3, 4, 5]` with offsets `[0, 2, 4]`, exclusive output is `[0, 2, 0, 4]`; inclusive output is `[2, 5, 4, 9]`.

## Composition

Segmented scan is useful after grouping or topology construction:

```text
sort / RLE / CSR construction
            ↓
      segmentOffsets
            ↓
     GPUSegmentedScan
            ↓
per-group offsets / local ranks / allocation positions
```

Together with `GPUSegmentedReduction`, it establishes the basic segmented algebra needed by grouped aggregation, graph adjacency processing, sparse structures and columnar list data.

## Performance notes

The first implementation deliberately establishes the API contract before optimizing the execution strategy. It assigns one workgroup to each segment and currently uses one lane to scan that segment serially. This is appropriate only as a correctness baseline and for small segments.

The intended optimized implementation should use parallel workgroup scans for medium segments, subgroup collectives when available, and a hierarchical strategy for segments larger than one workgroup. Highly skewed segment distributions require special care because one-workgroup-per-segment scheduling can leave the GPU underutilized. These optimizations do not require changing the CSR-style API.

## Limitations

The initial primitive supports `uint32` addition only. General scalar formats and operators can follow once the execution strategy is established. Input/output aliasing is intentionally rejected in the first implementation. Offsets are assumed to be monotonic and within input bounds; validation of GPU-resident offset contents is left to producers rather than requiring readback.
