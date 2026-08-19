---
title: GPU Dataframe sorting and top-K
description: Stable per-batch and explicit global ordering with bounded top-K selection.
---

import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPU Dataframe sorting and top-K

<ExperimentalDocsTabs active="gpu-dataframe-sorting" />

## Sort and select top-K rows per source batch

Numeric ordering is stable for `uint32`, `sint32`, and `float32` keys. Sorting returns GPU-resident
stable source-row identifiers rather than rewriting the source table:

```ts
const sorted = dataframe.sortBy('fare', {
  direction: 'ascending',
  nulls: 'last',
  nans: 'last',
  algorithm: 'auto'
});

const highestPerBatch = dataframe.topK('fare', 10, {
  direction: 'descending',
  nulls: 'last'
});

const lowestPerBatch = dataframe.sortBy('fare').topK(10);
```

`sortBy` defaults to ascending order; direct `topK` defaults to descending order; calling `topK` on
an existing sorted plan preserves its established ordering. `nulls` places nulls outside all
nonnull values, while `nans` orders NaNs among the remaining nonnull floating-point values. Positive
and negative zero compare equally and retain stable source order; infinities are ordinary numeric
values. Deselected rows never enter the published selected prefix.

Sorting and top-K are performed independently within every original source batch. There is no
implicit global cross-batch materialization. Compiled results expose the original table, sorted
`rowIndices`, updated `selectionMask`, and one selected count per preserved batch.

### Explicit global ordering and top-K

Use `sortByGlobal` or `topKGlobal` when ordering must span every source batch. These operations
explicitly stage numeric sort keys and source identities into GPU scratch; they never concatenate,
copy, or reorder the original dataframe columns:

```ts
const globallySorted = dataframe.sortByGlobal('fare', {
  direction: 'ascending',
  nulls: 'last',
  nans: 'last'
});

const highestOverall = dataframe.topKGlobal('fare', 10);
const lowestOverall = dataframe.sortByGlobal('fare').topK(10);

const compiled = highestOverall.compile(
  new GPUCommandGraph<GPUDataFrameQueryParameters>(device)
);

compiled.globalRowIndices;
compiled.globalSelectedCount;
compiled.selectionMask;
compiled.selectedCounts;
```

`globalRowIndices` contains one globally stable source-row permutation, including discontinuous
adapter-provided source offsets. `globalSelectedCount` is one GPU-owned scalar describing its
valid prefix. Equal keys retain their original cross-batch source order; null placement, NaN
placement, signed zeros, infinities, filtered rows, and derived values follow the same rules as
per-batch sorting. A global top-K limit is applied once across all batches; the original
batch-aligned selection masks and counts are updated to match that same global result.

### Scaling beyond one-dimensional workgroup limits

WebGPU limits the number of workgroups in each individual dispatch dimension, but that does not
limit a dataframe batch to one dimension. GPU Dataframe maps linear source rows and dense result rows across
bounded three-dimensional workgroup layouts while preserving their original row order and batch
boundaries. Filtering, derived expressions, visibility compaction, grouped statistics, scalar
reductions, histograms, stable sorting, and join preparation all use the same overflow-safe linear
indexing scheme.

For example, an adapter limited to two workgroups per dimension can still process 1,025 rows with
256-thread workgroups by dispatching a `2 × 2 × 2` grid. The shader converts each workgroup's
three-dimensional coordinate back into its original linear row index and ignores padded lanes.
Dense histogram bins and categorical group outputs are initialized and finalized the same way.

Actual dataset capacity remains constrained by unsigned 32-bit row indices, the full
three-dimensional workgroup capacity, and adapter storage-buffer size limits. Dispatch scaling
does not concatenate batches, make per-batch sorting global, or transfer GPU-resident rows back to
the CPU.

## Related pages

- [GPU Dataframe overview](/docs/api-reference/experimental/gpu-dataframe)
- [GPU Dataframe operations index](/docs/api-reference/experimental/gpu-dataframe-operations)
- [GPU tables](/docs/api-reference/tables)
