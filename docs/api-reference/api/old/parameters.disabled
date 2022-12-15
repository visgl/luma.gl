# Parameters

> This section describes the experimental, work-in-progress v9 luma.gl API.

GPUs can be controlled through a range of parameters.
The luma.gl API proves a unified key/value style API enabling applications to set all WebGPU or WebGL parameters with a single plain, non-nested JavaScript object.

## Overview of Parameters

- A number of parameters are fixed when a RenderPipeline is created. They cannot be changed without creating a new RenderPass.
- An additional set of parameters are fixed when a RenderPass is created, and thus applies to all RenderPipelines rendered with that RenderPass. To vary these parameters, additional RenderPasses would need to be created.
- A small set of parameters can be changed dynamically on a RenderPass between draw calls.

For completeness, there are certain types of parameters that are not
- Sampler parameters - How to sample from textures is controlled by `Sampler` objects.

Also note that  luma.gl uses Framebuffer objects to collect render targets and also certain per-render-target settings, such as clearColors.

## Dynamic Parameters

The only parameters that can be changed at any time are viewport parameters, blend constant and stencil reference.

| Parameter          | Description                                                                                    | Values                      |
| ------------------ | ---------------------------------------------------------------------------------------------- | --------------------------- | -------------- |
| `viewport`         | Specifying viewport size                                                                       | `number` (**`0xffffffff`**) |
| `scissor`          | Specifyi                                                                                       | `number` (**`0xffffffff`**) | `gl.frontFace` |
| `blendConstant`    | Sets color referenced by pipeline targets using blend factors `constant`, `one-minus-constant` |
| `stencilReference` |                                                                                                |


## Usage

To set up depth testing

```typescript
const value = device.createPipeline({
  parameters: {
    depthWriteEnabled: true,
    depthCompare: 'less-equal'
  },
```

```typescript
const value = device.createPipeline({
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

const device.createFramebuffer({
  colorAttachments: {clearColor: [1, 0, 0]},
})

const device.createRenderPass({
  parameters: {

  }
})

renderPass.setPipeline(pipeline);
renderPass.setParameters({viewport: MAIN_MAP})
renderPass.draw();
renderPass.setParameters({viewport: MINI_MAP})
renderPass.draw();
```

## Parameters

Describes luma.gl setting names and values

### Rasterization Parameters

These parameters control the rasterization stage (which happens before fragment shader runs).

| Function         | How to set               | Description                                                           | Values                            | WebGL counterpart |
| ---------------- | ------------------------ | --------------------------------------------------------------------- | --------------------------------- | ----------------- |
| `cullMode`       | `createRenderPipeline()` | Which face to cull                                                    | **`'none'`**, `'front'`, `'back'` |
| `frontFace`      | `createRenderPipeline()` | Which triangle winding order is front                                 | **`ccw`**, `cw`                   |
| `unclippedDepth` | `createRenderPipeline()` | Disable depth value clipping to [0, 1]. Requires `depth-clip-control` | **false** boolean                 |

### Depth Buffer Parameters

| `depthBias` | `createRenderPipeline()` | Small depth offset for polygons | `float` | `gl.polygonOffset` |
| `depthBiasSlopeScale` | `createRenderPipeline()` | Small depth factor for polygons | `float` | `gl.polygonOffset` |
| `depthBiasClamp` | `createRenderPipeline()` | Max depth offset for polygons | `float` |

- **Depth Bias** - Sometimes referred to as "polygon offset". Adds small offset to fragment depth values (by factor × DZ + r × units). Usually used as a heuristic to avoid z-fighting, but can also be used for effects like applying decals to surfaces, and for rendering solids with highlighted edges. The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.

### Stencil Buffer

After the fragment shader runs, optional stencil tests are performed, with resulting operations on the the stencil buffer.

| Function                    | Description              | Values                                 |
| --------------------------- | ------------------------ | -------------------------------------- | ------------------------------ | ---------------- |
| `stencilReadMask`           | `createRenderPipeline()` | Binary mask for reading stencil values | `number` (**`0xffffffff`**)    |
| `stencilWriteMask`          | `createRenderPipeline()` | Binary mask for writing stencil values | `number` (**`0xffffffff`**)    | `gl.frontFace`   |
| `stencilCompare`            | `createRenderPipeline()` | How the mask is compared               | **`always`**, `not-equal`, ... | `gl.stencilFunc` |
| `stencilPassOperation`      | `createRenderPipeline()` |                                        | **`'keep'`**                   | `gl.stencilOp`   |
| `stencilDepthFailOperation` | `createRenderPipeline()` |                                        | **`'keep'`**                   | `gl.stencilOp`   |
| `stencilFailOperation`      | `createRenderPipeline()` |                                        | **`'keep'`**                   | `gl.stencilOp`   |

### Blending

| Parameter        | How to set                             | Description |
| ---------------- | -------------------------------------- | ----------- |
| `blendColor`     | `RenderPass.setParameters()`           |
| `blendEquation`  | `createRenderPipeline({targets: ...})` |
| `blendOperation` | `createRenderPipeline({targets}).`     |
| `blendSrcFactor` | `createRenderPipeline({targets}).`     |
| `blendDstFactor` | `createRenderPipeline({targets}).`     |


[color_blending]: https://csawesome.runestone.academy/runestone/books/published/learnwebgl2/12_advanced_rendering/05_color_blending.html

### Clear Color

| Function                                                                                        | Sets parameters      |
| ----------------------------------------------------------------------------------------------- | -------------------- |
| clearColor | `createRenderPass({colorAttachments})` |

## Values

#### Stencil Test Functions

| `stencilCompare` Value | Description                              |
| ---------------------- | ---------------------------------------- |
| `'always'`             | Always pass                              |
| `'never'`              | Never pass                               |
| `'less'`               | Pass if (ref & mask) < (stencil & mask)  |
| `'equal'`              | Pass if (ref & mask) = (stencil & mask)  |
| `'lequal'`             | Pass if (ref & mask) <= (stencil & mask) |
| `'greater'`            | Pass if (ref & mask) > (stencil & mask)  |
| `'notequal'`           | Pass if (ref & mask) != (stencil & mask) |
| `'gequal'`             | Pass if (ref & mask) >= (stencil & mask) |

#### Stencil Operations

| `stencil<>Operation` Value | Description                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `'keep'`                   | Keeps the current value                                                                                               |
| `'zero'`                   | Sets the stencil buffer value to 0                                                                                    |
| `'replace'`                | Sets the stencil buffer value to the reference value as specified by `stencilFunc`                                    |
| `'invert'`                 | Inverts the current stencil buffer value bitwise                                                                      |
| `'increment-clamp'`        | Increments the current stencil buffer value. Clamps to the maximum representable unsigned value                       |
| `'increment-wrap'`         | Increments the current stencil buffer value. Wraps to zero when incrementing the maximum representable unsigned value |
| `'decrement-clamp'`        | Decrements current stencil buffer value. Clamps to 0                                                                  |
| `'decrement-wrap'`         | Decrements current stencil buffer value, wraps to maximum unsigned value when decrementing 0                          |

Action when the stencil test fails

- stencil test fail action,
- depth test fail action,
- pass action

Remarks:

- By using binary masks, an 8 bit stencil buffer can effectively contain 8 separate masks or stencils
- The luma.gl API currently does not support setting stencil operations separately for front and back faces.

## v8 to v9 API Mapping

- Parameters are set on `Pipeline`/`Program` creation. They can not be modified, or passed in draw calls.
- Parameters can only be set, not queried. luma.gl longer provides a way to query parameters.

| WebGL Function                                                                                        | luma.gl parameter counterparts     |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [polygonOffset](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset) | `depthBias`, `depthBiasSlopeScale` |
| [depthRange](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthRange)       | N/A                                |
| [clearDepth](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth)       |                                    |
