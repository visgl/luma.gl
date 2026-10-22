# Using GPU parameters

[Overview](https://luma.gl/next/docs/api-guide/gpu.md)[Rendering](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md)[Antialiasing](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md)[Parameters](https://luma.gl/next/docs/api-guide/gpu/gpu-parameters.md)[Bindings](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md)

GPU parameters control culling, depth and stencil tests, blending, and rasterization. Choose the owner from when the value needs to change:

| State                                                          | Where to set it                  | When it can change                                                                |
| -------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| Culling, depth tests, blending, multisampling                  | `RenderPipelineProps.parameters` | Create a different pipeline; Engine `Model.setParameters()` manages this for you. |
| Clear values and read-only attachments                         | `RenderPassProps`                | Begin a new pass.                                                                 |
| Viewport, scissor rectangle, blend constant, stencil reference | `renderPass.setParameters()`     | Between draws in the same pass.                                                   |

## Configure a model[​](#configure-a-model "Direct link to Configure a model")

```
model.setParameters({

  depthWriteEnabled: true,

  depthCompare: 'less-equal',

  cullMode: 'back'

});



const renderPass = device.beginRenderPass({

  clearColor: [0, 0, 0, 1],

  clearDepth: 1

});

model.draw(renderPass);

renderPass.end();

device.submit();
```

The target must have a depth attachment compatible with the pipeline's `depthFormat`. Inside `AnimationLoop.onRender`, the loop handles submission.

## Change a viewport between draws[​](#change-a-viewport-between-draws "Direct link to Change a viewport between draws")

```
renderPass.setParameters({viewport: [0, 0, 800, 600]});

model.draw(renderPass);

renderPass.setParameters({viewport: [600, 0, 200, 150]});

model.draw(renderPass);
```

Viewport and scissor coordinates use drawing-buffer pixels, not CSS pixels. Use `scissorRect` to restrict writes; changing a viewport alone does not clip to its rectangle.

## Next steps[​](#next-steps "Direct link to Next steps")

* [GPU parameter reference](https://luma.gl/next/docs/api-reference/core/parameters.md) lists accepted values.
* [Rendering](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md) explains targets, passes, and submission.
* [Antialiasing](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md) explains sampling choices.
