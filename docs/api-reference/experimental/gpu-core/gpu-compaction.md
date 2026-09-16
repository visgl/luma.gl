import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUCompaction

<GPUCoreDocsTabs active="compaction" />

## Overview

`GPUCompaction` stably selects packed `uint32` values using packed `uint32` flags.

<GPUOperationContract operation="gpu-compaction" />

## Concepts

Compaction converts a sparse keep/discard decision into a dense output. An exclusive scan assigns
each selected row its destination index, a scatter copies selected values in source order, and one
count reports the valid output prefix. For input `[8, 3, 5, 2]` and flags `[1, 0, 1, 0]`, the valid
output is `[8, 5]` with count `2`; capacity beyond that prefix is unspecified.

### When to use it

Use compaction when a later stage needs a dense work list rather than one flag per source row. It
can turn a frustum mask into visible object IDs, a brush mask into selected record IDs, or a validity
mask into jobs for a follow-up compute pass. Writing `count` into a `DrawCommandBuffer` also turns
the same result directly into an indirect instance list.

Keep the mask un-compacted when downstream shaders already visit every source row or need random
source-aligned membership tests. Compaction adds scan and scatter work, and only the prefix selected
by `count` is meaningful; it does not shrink the caller-owned output allocation.

```ts
graph.add(new GPUCompaction({
  id: 'visible-ids',
  input: sourceIds,
  flags: visibilityFlags,
  output: visibleIds,
  count: visibleCount
}));
```

Flags should contain `0` or `1`. Nonzero values are clamped to one by the scatter pass. Selected
values retain their source order. `count` must provide at least one packed `uint32` row.

`input`, `flags`, and `output` may each be a packed `GraphDataView<'uint32'>` or
`GraphVectorView<'uint32'>`. Input and flag lengths must match, but their atomic/vector boundaries
may differ. The output only needs enough logical capacity and may use an independent atomic or
vector topology. Scan and compaction align source rows by logical position, preserve caller-owned
buffers and output chunk boundaries, and report one vector-wide total without concatenating data.

The algorithm composes `GPUScan`, allocates one logical offset scratch view as a graph transient,
scatters selected values, and writes the final count. The count view may point at the
`instanceCount` field of a `DrawCommandBuffer`, enabling compute-to-indirect-render dataflow without
readback. Alignment borrows subviews from the original buffers; it does not pack source, flag, or
output chunks.

The initial implementation compacts IDs rather than arbitrary records. Renderers and subsequent
kernels use those IDs to fetch source data.

## Performance notes

`GPUCompaction` inherits the optional subgroup acceleration of its unsegmented `GPUScan`.
`GPUIndexedRangeCompaction` and `GPUPartitionedIndexedRangeCompaction` also use subgroup prefix
collectives for their dedicated per-range scans, reducing each local scan from 17 workgroup
barriers to two. This path is used by the GPU Trace Viewer for stable span and dependency lists;
CORE devices retain the original workgroup implementation.
