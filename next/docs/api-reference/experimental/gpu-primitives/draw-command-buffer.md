# DrawCommandBuffer

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`DrawCommandBuffer` owns or borrows a buffer containing WebGPU indirect draw records.

## Concepts[​](#concepts "Direct link to Concepts")

An indirect draw record is a small GPU-readable argument block containing counts and starting indices. A compute pass can update those fields, and a later render pass can issue the draw without waiting for the CPU to inspect the result. `DrawCommandBuffer` supplies the exact WebGPU layouts, byte offsets, and ownership rules; it does not decide what is visible or record a render pass.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Use an indirect command when the GPU already knows how much work should be drawn. Common examples include a visibility workflow that writes the number of accepted instances, a particle simulation that creates or removes particles, and a tiled renderer that maintains one command per material or draw group. Keeping the count in GPU memory avoids a readback stall between compute and rendering.

Use a normal `draw()` call when the CPU already has the authoritative count and it changes cheaply. `DrawCommandBuffer` is deliberately not a scene or batching system: applications still choose the geometry, pipelines, resource bindings, command grouping, and the compute operation that updates each record.

```
const commands = new DrawCommandBuffer(device, {
  type: 'draw',
  commands: [{vertexCount: 6, instanceCount: 0}]
});

commands.draw(renderBundleEncoder, 0);
```

Supported layouts are:

| Type           | 32-bit fields                                                                     |
| -------------- | --------------------------------------------------------------------------------- |
| `draw`         | `vertexCount`, `instanceCount`, `firstVertex`, `firstInstance`                    |
| `draw-indexed` | `indexCount`, `instanceCount`, `firstIndex`, signed `baseVertex`, `firstInstance` |

Owned buffers use `Buffer.STORAGE`, `Buffer.INDIRECT`, `Buffer.COPY_DST`, and `Buffer.COPY_SRC`. Borrowed buffers must already provide those usages and sufficient capacity.

`getCommandByteOffset(index)` returns the record offset. `getInstanceCountByteOffset(index)` returns the writable count field. `getInstanceCountData(index)` returns a borrowed `GPUData<'uint32'>` over that field. `draw(renderPass, index)` chooses `drawIndirect` or `drawIndexedIndirect` from the configured type.

`destroy()` releases only owned backing storage and is idempotent.
