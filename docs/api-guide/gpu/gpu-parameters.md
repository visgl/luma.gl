# Using GPU Parameters

[Overview](https://luma.gl/docs/api-guide/gpu.md)[Rendering](https://luma.gl/docs/api-guide/gpu/gpu-rendering.md)[Antialiasing](https://luma.gl/docs/api-guide/gpu/gpu-antialiasing.md)[Parameters](https://luma.gl/docs/api-guide/gpu/gpu-parameters.md)[Bindings](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md)

luma.gl provides a unified API for controlling GPU parameters providing control of GPU pipeline features such as culling, depth and stencil buffers, blending, clipping etc.

## Usage[​](#usage "Direct link to Usage")

To set up depth testing

```
const value = device.createRenderPipeline({

  parameters: {

    depthWriteEnabled: true,

    depthCompare: 'less-equal'

  },
```

```
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

## GPU Pipeline Overview[​](#gpu-pipeline-overview "Direct link to GPU Pipeline Overview")

Parameters control the GPU pipeline and can be GPU Pipeline Stages

Describes luma.gl setting names and values

1. Vertex Fetch (buffers)
2. Vertex Shader
3. Primitive assembly (`topology`)
4. Rasterization ([multisampling parameters](https://luma.gl/docs/api-guide/gpu/gpu-antialiasing.md))
5. Fragment shader `Framebuffer`
6. Stencil test and operation (stencil parameters)
7. Depth test and write (depth parameters)
8. Output merging, controlled by `Framebuffer`

## Parameter Mutability[​](#parameter-mutability "Direct link to Parameter Mutability")

Most luma.gl parameters are stored on the `RenderPipeline` or `RenderPass` classes which are either fully or partially immutable, meaning that parameters are fixed when these objects are created, and cannot be changed without creating new resources. The following table summarizes the situation:

| Parameter Mutability              | Examples                                          | Constraint                                                  |
| --------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Dynamic `RenderPass` parameters   | `viewport`, `scissor`, `blendConstant`            | Can be freely changed between draw calls.                   |
| Fixed `RenderPass` parameters     | `clearColors`, `discard`, `depthClearValue`...    | Can not be changed. A new `RenderPass` must be created.     |
| Fixed `RenderPipeline` parameters | `cullMode`, `frontFace`, `depthWriteEnabled`, ... | Can not be changed. A new `RenderPipeline` must be created. |

## Dynamic RenderPass Parameters[​](#dynamic-renderpass-parameters "Direct link to Dynamic RenderPass Parameters")

The only parameters that can be changed at any time (using `renderPass.setParameters()`) are viewport size, scissor rectangle, and blend constant

## Fixed RenderPass Parameters[​](#fixed-renderpass-parameters "Direct link to Fixed RenderPass Parameters")

A `RenderPass` holds parameters specifying how color and depth / stencil attachments should be cleared (clear colors, values), discarded etc.

Note that there is no explicit `clear` function in the luma.gl v9 API. Instead attachments are cleared when a `RenderPass` is created (begins),
