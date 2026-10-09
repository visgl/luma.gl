import {GpuGuideDocsTabs} from '@site/src/components/docs/gpu-guide-docs-tabs';

# Using GPU parameters

<GpuGuideDocsTabs group="rendering" active="parameters" />

GPU parameters control culling, depth and stencil tests, blending, and rasterization.
Choose the owner from when the value needs to change:

| State | Where to set it | When it can change |
| --- | --- | --- |
| Culling, depth tests, blending, multisampling | `RenderPipelineProps.parameters` | Create a different pipeline; Engine `Model.setParameters()` manages this for you. |
| Clear values and read-only attachments | `RenderPassProps` | Begin a new pass. |
| Viewport, scissor rectangle, blend constant, stencil reference | `renderPass.setParameters()` | Between draws in the same pass. |

## Configure a model

```ts
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

The target must have a depth attachment compatible with the pipeline's `depthFormat`.
Inside `AnimationLoop.onRender`, the loop handles submission.

## Change a viewport between draws

```ts
renderPass.setParameters({viewport: [0, 0, 800, 600]});
model.draw(renderPass);
renderPass.setParameters({viewport: [600, 0, 200, 150]});
model.draw(renderPass);
```

Viewport and scissor coordinates use drawing-buffer pixels, not CSS pixels.
Use `scissorRect` to restrict writes; changing a viewport alone does not clip to its rectangle.

## Next steps

- [GPU parameter reference](/docs/api-reference/core/parameters) lists accepted values.
- [Rendering](/docs/api-guide/gpu/gpu-rendering) explains targets, passes, and submission.
- [Antialiasing](/docs/api-guide/gpu/gpu-antialiasing) explains sampling choices.
