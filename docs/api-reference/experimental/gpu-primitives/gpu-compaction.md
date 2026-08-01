import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUCompaction

<GPUPrimitivesDocsTabs active="compaction" />

## Overview

`GPUCompaction` stably selects packed `uint32` values using packed `uint32` flags.

## Concepts

Compaction converts a sparse keep/discard decision into a dense output. An exclusive scan assigns
each selected row its destination index, a scatter copies selected values in source order, and one
count reports the valid output prefix. For input `[8, 3, 5, 2]` and flags `[1, 0, 1, 0]`, the valid
output is `[8, 5]` with count `2`; capacity beyond that prefix is unspecified.

```ts
new GPUCompaction({
  id: 'visible-ids',
  input: sourceIds,
  flags: visibilityFlags,
  output: visibleIds,
  count: visibleCount
}).addToGraph(graph);
```

Flags should contain `0` or `1`. Nonzero values are clamped to one by the scatter pass. Selected
values retain their source order. `count` must provide at least one packed `uint32` row.

`input`, `flags`, and `output` may all be packed `GraphDataView<'uint32'>` values or all be
`GraphVectorView<'uint32'>` values. Vector inputs, flags, and outputs must have identical ordered
chunk lengths. Scan and compaction treat chunked vectors as one logical sequence, while all
caller-visible buffers and chunk boundaries remain intact. Selected values fill the logical output
sequence across those existing output chunks, and `count` reports one vector-wide total.

The algorithm composes `GPUScan`, allocates offsets as graph transients, scatters selected values,
and writes the final count. The count view may point at the `instanceCount` field of a
`DrawCommandBuffer`, enabling compute-to-indirect-render dataflow without readback. The vector path
uses vector-wide scan offsets directly and does not pack source or output chunks.

The initial implementation compacts IDs rather than arbitrary records. Renderers and subsequent
kernels use those IDs to fetch source data.
