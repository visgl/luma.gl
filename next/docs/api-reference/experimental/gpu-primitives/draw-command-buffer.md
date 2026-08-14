# DrawCommandBuffer

[Foundation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Tables & joins](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Graphs](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Spatial](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Rendering](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)

[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

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

`getCommandByteOffset(index)` returns the record offset. `getInstanceCountByteOffset(index)` returns the writable count field. `getInstanceCountData(index)` returns a borrowed `GPUData<'uint32'>` over that field. `importToGraph(graph)` returns the imported buffer handle plus packed command words and strided `instanceCounts` and `firstInstances` views, allowing graph workflows such as [`GPUSceneDrawGeneration`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md) to preserve geometry arguments while publishing draw selection. `draw(renderPass, index)` chooses `drawIndirect` or `drawIndexedIndirect` from the configured type.

`destroy()` releases only owned backing storage and is idempotent.
