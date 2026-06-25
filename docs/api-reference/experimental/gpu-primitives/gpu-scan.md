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

Both views must be packed, four-byte-aligned `GraphBufferView<'uint32'>` values. The output must
contain at least as many rows as the input.

For input `[1, 0, 1, 1]`, the output is `[0, 1, 1, 2]`.

The implementation scans 256 values per workgroup, recursively scans block sums, and propagates
block offsets back to lower levels. Scratch allocations are graph transients and therefore
participate in lifetime reuse. Arbitrary non-power-of-two lengths are supported. A zero-length scan
adds no nodes.

The experimental implementation supports only exclusive `uint32` addition. Inclusive, segmented,
floating-point, and custom associative scans are future work.
