import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# DrawCommandBuffer

<GPUCoreDocsTabs active="draw-command-buffer" />

## Overview

`DrawCommandBuffer` owns or borrows a buffer containing WebGPU indirect draw records.

<GPUOperationContract operation="draw-command-buffer" />

## Concepts

An indirect draw record is a small GPU-readable argument block containing counts and starting
indices. A compute pass can update those fields, and a later render pass can issue the draw without
waiting for the CPU to inspect the result. `DrawCommandBuffer` supplies the exact WebGPU layouts,
byte offsets, and ownership rules; it does not decide what is visible or record a render pass.

### When to use it

Use an indirect command when the GPU already knows how much work should be drawn. Common examples
include a visibility workflow that writes the number of accepted instances, a particle simulation
that creates or removes particles, and a tiled renderer that maintains one command per material or
draw group. Keeping the count in GPU memory avoids a readback stall between compute and rendering.

Use a normal `draw()` call when the CPU already has the authoritative count and it changes cheaply.
`DrawCommandBuffer` is deliberately not a scene or batching system: applications still choose the
geometry, pipelines, resource bindings, command grouping, and the compute operation that updates
each record.

```ts
const commands = new DrawCommandBuffer(device, {
  type: 'draw',
  commands: [{vertexCount: 6, instanceCount: 0}]
});

commands.draw(renderBundleEncoder, 0);
```

Supported layouts are:

| Type | 32-bit fields |
| --- | --- |
| `draw` | `vertexCount`, `instanceCount`, `firstVertex`, `firstInstance` |
| `draw-indexed` | `indexCount`, `instanceCount`, `firstIndex`, signed `baseVertex`, `firstInstance` |

Owned buffers use `Buffer.STORAGE`, `Buffer.INDIRECT`, `Buffer.COPY_DST`, and `Buffer.COPY_SRC`.
Borrowed buffers must already provide those usages and sufficient capacity.

`getCommandByteOffset(index)` returns the record offset. `getInstanceCountByteOffset(index)` returns
the writable count field. `getInstanceCountData(index)` returns a borrowed `GPUData<'uint32'>` over
that field. `importToGraph(graph)` returns the imported buffer handle plus packed command words and
strided `instanceCounts` and `firstInstances` views, allowing graph workflows such as
[`GPUSceneDrawGeneration`](/docs/api-reference/experimental/gpu-core/gpu-scene-draw-generation)
to preserve geometry arguments while publishing draw selection. `draw(renderPass, index)` chooses
`drawIndirect` or `drawIndexedIndirect` from the configured type.

`destroy()` releases only owned backing storage and is idempotent.
