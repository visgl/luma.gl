# GPUCompaction

[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scan.md)[Galloping Search](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-galloping-search.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-virtual-geometry-selection.md)

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
new GPUCompaction({

  id: 'visible-ids',

  input: sourceIds,

  flags: visibilityFlags,

  output: visibleIds,

  count: visibleCount

}).addToGraph(graph);
```

Flags should contain `0` or `1`. Nonzero values are clamped to one by the scatter pass. Selected values retain their source order. `count` must provide at least one packed `uint32` row.

`input`, `flags`, and `output` may all be packed `GraphDataView<'uint32'>` values or all be `GraphVectorView<'uint32'>` values. Vector inputs, flags, and outputs must have identical ordered chunk lengths. Scan and compaction treat chunked vectors as one logical sequence, while all caller-visible buffers and chunk boundaries remain intact. Selected values fill the logical output sequence across those existing output chunks, and `count` reports one vector-wide total.

The algorithm composes `GPUScan`, allocates offsets as graph transients, scatters selected values, and writes the final count. The count view may point at the `instanceCount` field of a `DrawCommandBuffer`, enabling compute-to-indirect-render dataflow without readback. The vector path uses vector-wide scan offsets directly and does not pack source or output chunks.

The initial implementation compacts IDs rather than arbitrary records. Renderers and subsequent kernels use those IDs to fetch source data.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

`GPUCompaction` inherits the optional subgroup acceleration of its unsegmented `GPUScan`. `GPUIndexedRangeCompaction` and `GPUPartitionedIndexedRangeCompaction` also use subgroup prefix collectives for their dedicated per-range scans, reducing each local scan from 17 workgroup barriers to two. This path is used by the GPU Trace Viewer for stable span and dependency lists; CORE devices retain the original workgroup implementation.
