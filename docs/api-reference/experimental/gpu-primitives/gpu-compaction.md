import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUCompaction

<GPUPrimitivesDocsTabs active="compaction" />

`GPUCompaction` stably selects packed `uint32` values using packed `uint32` flags.

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

The algorithm composes `GPUScan`, allocates offsets as graph transients, scatters selected values,
and writes the final count. The count view may point at the `instanceCount` field of a
`DrawCommandBuffer`, enabling compute-to-indirect-render dataflow without readback.

The initial implementation compacts IDs rather than arbitrary records. Renderers and subsequent
kernels use those IDs to fetch source data.
