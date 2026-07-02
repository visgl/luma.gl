import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUIndexPickingTarget

<GPUPrimitivesDocsTabs active="index-picking" />

`GPUIndexPickingTarget` declares fixed-size WebGPU attachments for integer object picking and adds
an explicit single-pixel texture-to-buffer copy. It does not render, submit, map buffers, manage
highlight state, or own application UI.

```ts
const target = new GPUIndexPickingTarget(graph, {
  id: 'objects',
  width,
  height,
  readbackBuffer
});

graph.addRenderPass({
  id: 'render-picking',
  attachments: target.attachments,
  compile: () => ({
    getRenderPassProps: () => target.renderPassProps,
    encode: ({renderPass}) => pickingModel.draw(renderPass)
  })
});

target.addReadbackPass({
  after: 'render-picking',
  getPixel: parameters => parameters.pickPixel
});
```

The target uses `rgba8unorm`, `rg32sint`, and `depth24plus` attachments. The integer attachment
stores `(objectIndex, batchIndex)` and clears both components to `-1`. Picking models therefore
declare color formats `['rgba8unorm', 'rg32sint']`, depth format `depth24plus`, and write stable IDs
to fragment location 1. The existing `indexPicking` shader module supplies this convention.

The readback buffer is exactly 256 bytes with `COPY_DST | MAP_READ`, matching WebGPU copy-row
alignment. After the caller submits the encoder, read its first eight bytes and pass them to
`decodeGPUIndexPickInfo()`. Supplying different `buffers` overrides while encoding permits
concurrent requests without writing a mapped staging buffer.

Coordinates are integer WebGPU device pixels with a top-left origin. The helper validates them
against its compiled extent. Recreate and recompile the target after a canvas resize.

The helper intentionally handles one pixel. Region reduction, color fallback, automatic staging
rings, submission, callbacks, highlighting, and tooltips remain application policy.
