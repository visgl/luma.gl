import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUScan

<GPUPrimitivesDocsTabs active="scan" />

`GPUScan` adds a hierarchical exclusive `uint32` prefix sum to a `GPUCommandGraph`.

```ts
new GPUScan({
  id: 'selection-offsets',
  input: flags,
  output: offsets
}).addToGraph(graph);
```

`input` and `output` may both be packed, four-byte-aligned `GraphDataView<'uint32'>` values or both
be `GraphVectorView<'uint32'>` values. A data-view output must contain at least as many rows as its
input. Vector input and output must have identical ordered chunk lengths.

Scan treats chunked vectors as one logical sequence, while all caller-visible buffers and chunk
boundaries remain intact. It scans each chunk locally, scans the ordered chunk totals, and adds the
resulting carry to each original output chunk. Empty chunks retain their place in that sequence.

For input `[1, 0, 1, 1]`, the output is `[0, 1, 1, 2]`.

The implementation scans 256 values per workgroup, recursively scans block sums, and propagates
block offsets back to lower levels. Vector scans add transient chunk-total and carry buffers; they
never concatenate or repack caller data. All scratch allocations participate in graph lifetime
reuse. Arbitrary non-power-of-two lengths are supported. A zero-length scan adds no nodes.

The experimental implementation supports only exclusive `uint32` addition. Inclusive, segmented,
floating-point, and custom associative scans are future work.
