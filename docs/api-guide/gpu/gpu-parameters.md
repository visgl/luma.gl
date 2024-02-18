# Using GPU Parameters

luma.gl provides a unified API for controlling GPU parameters providing control of GPU pipeline features such as culling, depth and stencil buffers, blending, clipping etc.

## Usage

To set up depth testing

```typescript
const value = device.createRenderPipeline({
  parameters: {
    depthWriteEnabled: true,
    depthCompare: 'less-equal'
  },
```

```typescript
const value = device.createRenderPipeline({
  parameters: {
    depthWriteEnabled: true,
    depthCompare: 'less-equal'
  },
  targets: [
    {
      blendColor: ...,

    }
  ]
});

const framebuffer = device.createFramebuffer({
  colorAttachments: {clearColor: [1, 0, 0]},
})

const device.beginRenderPass({
  framebuffer,
  parameters: {

  }
})

renderPass.setPipeline(pipeline);
renderPass.setParameters({viewport: MAIN_MAP})
renderPass.draw();
renderPass.setParameters({viewport: MINI_MAP})
renderPass.draw();
```

## GPU Pipeline Overview

Parameters control the GPU pipeline and can be GPU Pipeline Stages

Describes luma.gl setting names and values

0. Vertex Fetch (buffers)
1. Vertex Shader
2. Primitive assembly (`topology`)
3. Rasterization (multisampling parameters)
4. Fragment shader `Framebuffer`
5. Stencil test and operation (stencil parameters)
6. Depth test and write (depth parameters)
7. Output merging, controlled by `Framebuffer`

## Parameter Mutability

Most luma.gl parameters are stored on the `RenderPipeline` or `RenderPass` classes which are either fully or partially immutable, meaning that parameters are fixed when these objects are created, and cannot be changed without creating new resources. The following table summarizes the situation:

| Parameter Mutability              | Examples                                          | Constraint                                                              |
| --------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| Dynamic `RenderPass` parameters   | `viewport`, `scissor`, `blendConstant`            | Can be freely changed between draw calls. |
| Fixed `RenderPass` parameters     | `clearColors`, `discard`, `depthClearValue`...    | Can not be changed. A new `RenderPass` must be created.                 |
| Fixed `RenderPipeline` parameters | `cullMode`, `frontFace`, `depthWriteEnabled`, ... | Can not be changed. A new `RenderPipeline` must be created.             |

## Dynamic RenderPass Parameters

The only parameters that can be changed at any time (using `renderPass.setParameters()`) are viewport size, scissor rectangle, and blend constant

## Fixed RenderPass Parameters

A `RenderPass` holds parameters specifying how color and depth / stencil attachments should be cleared (clear colors, values), discarded etc. 

Note that there is no explicit `clear` function in the luma.gl v9 API. Instead attachments are cleared when a `RenderPass` is created (begins), 
