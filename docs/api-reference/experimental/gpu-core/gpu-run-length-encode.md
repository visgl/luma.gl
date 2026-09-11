import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPURunLengthEncode and GPUUnique

## Overview

`GPURunLengthEncode` turns an ordered `uint32` sequence into one row per contiguous run: the run value, its length, and a scalar count describing the valid output prefix. `GPUUnique` exposes the same ordered-run contract for callers interested primarily in distinct adjacent values.

## Motivation

Sorting is only the first half of many GPU grouping pipelines. Once equal keys are adjacent, downstream work needs explicit group boundaries before it can aggregate values, build CSR-style offsets, or emit one record per key. Without a reusable RLE primitive, group-by, histogram-like workflows, graph adjacency construction and columnar dictionary operations each tend to grow their own boundary detection and prefix-scan kernels.

RLE supplies that missing bridge:

```text
sort keys
   ↓
run-length encode
   ↓
unique keys + run lengths / boundaries
   ↓
segmented reduction
   ↓
grouped aggregates
```

## Contract

Input must be an ordered packed `GraphDataView<'uint32'>`. Equal adjacent values form a run. `values` and `lengths` are caller-owned capacity buffers; only the prefix described by `count` is valid.

For:

```text
[2, 2, 2, 7, 7, 9]
```

RLE produces:

```text
values  = [2, 7, 9, ...]
lengths = [3, 2, 1, ...]
count   = 3
```

The operation preserves first-occurrence order. It does not sort the input. Compose it after `GPUSort` when global uniqueness/grouping by key is required.

```ts
new GPURunLengthEncode({
  input: sortedKeys,
  values: uniqueKeys,
  lengths: runLengths,
  count: runCount
}).addToGraph(graph);
```

Empty input writes `count = 0`.

## Composition

The implementation deliberately composes existing graph machinery: one pass identifies run starts, `GPUScan` converts those flags into dense run indices, and a materialization pass publishes run values, lengths and the final count. This keeps run indexing consistent with the same scan substrate used by compaction and segmented layout.

The resulting metadata is useful for constructing CSR-style segment offsets and is intended to compose directly with `GPUSegmentedReduction` for GPU group-by pipelines.

## Performance notes

The initial implementation prioritizes a clear reusable contract. Boundary detection and scan are parallel. Run-length materialization may perform additional work around run boundaries; future implementations can specialize length publication using explicit start offsets or subgroup operations without changing the public API.

For unsorted data with few downstream grouped operations, a hash aggregation may be cheaper than sort + RLE. RLE is strongest when keys are already ordered, stable ordering matters, or the resulting run structure is reused by multiple consumers.

## Relationship to GPUUnique

`GPUUnique` is intentionally aligned with RLE rather than inventing a second notion of equality or ordering. A future value-only optimized path may avoid materializing lengths when they are not requested, while retaining the same adjacent-run semantics.
