import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# DrawCommandBuffer

<GPUPrimitivesDocsTabs active="draw-command-buffer" />

`DrawCommandBuffer` owns or borrows a buffer containing WebGPU indirect draw records.

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
