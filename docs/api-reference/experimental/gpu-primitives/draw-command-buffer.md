import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# DrawCommandBuffer

<GPUPrimitivesDocsTabs active="draw-command-buffer" />

## Overview

`DrawCommandBuffer` owns or borrows a buffer containing WebGPU indirect draw records.

## Concepts

An indirect draw record is a small GPU-readable argument block containing counts and starting
indices. A compute pass can update those fields, and a later render pass can issue the draw without
waiting for the CPU to inspect the result. `DrawCommandBuffer` supplies the exact WebGPU layouts,
byte offsets, and ownership rules; it does not decide what is visible or record a render pass.

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
that field. `draw(renderPass, index)` chooses `drawIndirect` or `drawIndexedIndirect` from the
configured type.

`destroy()` releases only owned backing storage and is idempotent.
