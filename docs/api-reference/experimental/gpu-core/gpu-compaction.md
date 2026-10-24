# GPUCompaction

[Galloping Search](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-galloping-search.md)[Compaction](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-compaction.md)[Segmented Layout](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-layout.md)[Masks](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-mask.md)[Visibility](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-virtual-geometry-selection.md)

## Overview[​](#overview "Direct link to Overview")

`GPUCompaction` stably selects packed `uint32` values using packed `uint32` flags.

## At a glance

| Question                 | Answer                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| **Problem**              | Turn a sparse keep/discard decision into a stable dense work list.                       |
| **Reads / writes**       | Reads source IDs and flags; writes packed IDs plus one valid-row count.                  |
| **Ownership**            | Inputs, output capacity, and count are caller-owned; offsets are graph-owned transients. |
| **Output contract**      | Bounded; only the count-named prefix is valid, with source order preserved.              |
| **Expected work**        | One hierarchical exclusive scan plus scatter/count work over the input domain.           |
| **Chunks**               | Preserved as one logical sequence; matching vector topology is required.                 |
| **Conditions / budgets** | Can sit inside a conditioned branch; standalone compaction has no resumable plan.        |
| **Neighborhood**         | mask and IDs → GPUCompaction → indirect compute, drawing, or dense analysis.             |

**Cost**Scan and scatter visit the input domain even when the compacted result is small.

**Common mistake**Do not treat unused output capacity beyond the GPU-written count as valid rows.

## Concepts[​](#concepts "Direct link to Concepts")

Compaction converts a sparse keep/discard decision into a dense output. An exclusive scan assigns each selected row its destination index, a scatter copies selected values in source order, and one count reports the valid output prefix. For input `[8, 3, 5, 2]` and flags `[1, 0, 1, 0]`, the valid output is `[8, 5]` with count `2`; capacity beyond that prefix is unspecified.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Use compaction when a later stage needs a dense work list rather than one flag per source row. It can turn a frustum mask into visible object IDs, a brush mask into selected record IDs, or a validity mask into jobs for a follow-up compute pass. Writing `count` into a `DrawCommandBuffer` also turns the same result directly into an indirect instance list.

Keep the mask un-compacted when downstream shaders already visit every source row or need random source-aligned membership tests. Compaction adds scan and scatter work, and only the prefix selected by `count` is meaningful; it does not shrink the caller-owned output allocation.

```
graph.add(new GPUCompaction({

  id: 'visible-ids',

  input: sourceIds,

  flags: visibilityFlags,

  output: visibleIds,

  count: visibleCount

}));
```

Flags should contain `0` or `1`. Nonzero values are clamped to one by the scatter pass. Selected values retain their source order. `count` must provide at least one packed `uint32` row.

`input`, `flags`, and `output` may each be a packed `GraphDataView<'uint32'>` or `GraphVectorView<'uint32'>`. Input and flag lengths must match, but their atomic/vector boundaries may differ. The output only needs enough logical capacity and may use an independent atomic or vector topology. Scan and compaction align source rows by logical position, preserve caller-owned buffers and output chunk boundaries, and report one vector-wide total without concatenating data.

The algorithm composes `GPUScan`, allocates graph-owned offset scratch with the flags' chunking when needed, scatters selected values, and writes the final count. The count view may point at the `instanceCount` field of a `DrawCommandBuffer`, enabling compute-to-indirect-render dataflow without readback. Alignment borrows subviews from the original buffers; it does not pack source, flag, or output chunks, or require one scratch allocation for a streamed vector.

The initial implementation compacts IDs rather than arbitrary records. Renderers and subsequent kernels use those IDs to fetch source data.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

`GPUCompaction` inherits the optional subgroup acceleration of its unsegmented `GPUScan`. `GPUIndexedRangeCompaction` and `GPUPartitionedIndexedRangeCompaction` also use subgroup prefix collectives for their dedicated per-range scans, reducing each local scan from 17 workgroup barriers to two. This path is used by the GPU Trace Viewer for stable span and dependency lists; CORE devices retain the original workgroup implementation.
