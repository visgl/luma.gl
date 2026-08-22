# DrawCommandBuffer

[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-command-graph.md)[Texture History](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-texture-history.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-core/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`DrawCommandBuffer` owns or borrows a buffer containing WebGPU indirect draw records.

## At a glance

| Question                 | Answer                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| **Problem**              | Carry GPU-produced draw counts into rendering without CPU synchronization.            |
| **Reads / writes**       | Compute may write command fields; indirect draw calls read one record.                |
| **Ownership**            | The helper owns storage it creates and borrows caller-supplied storage by default.    |
| **Output contract**      | Fixed-capacity standard WebGPU indirect records; no hidden resizing or readback.      |
| **Expected work**        | No compute by itself; one indirect draw call for each record the application chooses. |
| **Chunks**               | Not applicable; records occupy one typed command buffer.                              |
| **Conditions / budgets** | A writable count can be produced by conditioned or resumable graph work.              |
| **Neighborhood**         | compaction or draw generation → DrawCommandBuffer → render pass.                      |

**Cost**Persistent command storage plus the fixed draw calls the renderer records.

**Common mistake**Do not read the count to JavaScript before drawing; that defeats the indirect path.

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

`getCommandByteOffset(index)` returns the record offset. `getInstanceCountByteOffset(index)` returns the writable count field. `getInstanceCountData(index)` returns a borrowed `GPUData<'uint32'>` over that field. `importToGraph(graph)` returns the imported buffer handle plus packed command words and strided `instanceCounts` and `firstInstances` views, allowing graph workflows such as [`GPUSceneDrawGeneration`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene-draw-generation.md) to preserve geometry arguments while publishing draw selection. `draw(renderPass, index)` chooses `drawIndirect` or `drawIndexedIndirect` from the configured type.

`destroy()` releases only owned backing storage and is idempotent.
