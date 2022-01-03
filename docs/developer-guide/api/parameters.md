# Parameters

> This section describes the experimental, work-in-progress v9 luma.gl API.

The luma.gl API provides a unified key/value API for GPU parameters enabling applications to control GPU pipeline features such as culling, depth and stencil buffers, blending, clipping etc.

1. Vertex Shader
2. Primitive assembly (`topology`)
3. Rasterization (multisampling parameters)
4. Fragment shader `Framebuffer`
5. Stencil test and operation (stencil parameters)
6. Depth test and write (depth parameters)
7. Output merging, controlled by `Framebuffer`

A number of parameters are set when certain GPU objects are created, and cannot be changed without creating a new object.

| Parameter "Type" | Comments                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `RenderPipeline` | `RenderPipeline` is created.                                                                                  |
| `RenderPass`     | Render targets, clear colors etc. To vary these parameters, additional RenderPasses would need to be created. |
| Dynamic          | (`viewport`, `scissor` and `blendConstant`) can be changed dynamically on a RenderPass between draw calls.    |

For completeness, there are certain types of parameters affecting GPU operation that are not

| Parameters    | Comments                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Sampler`     | How to sample from textures is controlled by `Sampler` objects.                                                              |
| `Framebuffer` | luma.gl uses Framebuffer objects to collect render targets and also certain per-render-target settings, such as clearColors. |

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

## Parameters by GPU Pipeline Stages

Describes luma.gl setting names and values

### Primitive Assembly Parameters (RenderPipeline)

Note: `topology` must be specified on a `RenderPipeline` to describe the layout of vertex buffers.

### Rasterization Parameters (RenderPipeline)

These parameters control the primitive assembly stage (which happens before fragment shader runs).

| Function    | How to set                            | Description                       | Values | WebGL counterpart |
| ----------- | ------------------------------------- | --------------------------------- | ------ | ----------------- |
| `cullMode`  | Which face to cull                    | **`'none'`**, `'front'`, `'back'` |
| `frontFace` | Which triangle winding order is front | **`ccw`**, `cw`                   |

## Multisample Parameters (RenderPipeline)

| Function                 | Description | Values     |
| ------------------------ | ----------- | ---------- |
| `sampleCount`            |             | 1          |
| `sampleMask`             |             | 0xFFFFFFFF |
| `alphaToCoverageEnabled` |             | false      |

### Blending

| Parameter        | How to set                             | Description |
| ---------------- | -------------------------------------- | ----------- |
| `blendColor`     | `RenderPass.setParameters()`           |
| `blendEquation`  | `createRenderPipeline({targets: ...})` |
| `blendOperation` | `createRenderPipeline({targets}).`     |
| `blendSrcFactor` | `createRenderPipeline({targets}).`     |
| `blendDstFactor` | `createRenderPipeline({targets}).`     |

[color_blending]: https://csawesome.runestone.academy/runestone/books/published/learnwebgl2/12_advanced_rendering/05_color_blending.html

### Stencil Test (RenderPipeline)

After the fragment shader runs, optional stencil tests are performed, with resulting operations on the the stencil buffer.

| Function                    | Description              | Values                                 |
| --------------------------- | ------------------------ | -------------------------------------- | ------------------------------ | ---------------- |
| `stencilReadMask`           | `createRenderPipeline()` | Binary mask for reading stencil values | `number` (**`0xffffffff`**)    |
| `stencilWriteMask`          | `createRenderPipeline()` | Binary mask for writing stencil values | `number` (**`0xffffffff`**)    | `gl.frontFace`   |
| `stencilCompare`            | `createRenderPipeline()` | How the mask is compared               | **`always`**, `not-equal`, ... | `gl.stencilFunc` |
| `stencilPassOperation`      | `createRenderPipeline()` |                                        | **`'keep'`**                   | `gl.stencilOp`   |
| `stencilDepthFailOperation` | `createRenderPipeline()` |                                        | **`'keep'`**                   | `gl.stencilOp`   |
| `stencilFailOperation`      | `createRenderPipeline()` |                                        | **`'keep'`**                   | `gl.stencilOp`   |

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

#### Stencil Operations (RenderPipeline)

| `stencil<>Operation` | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `'keep'`             | Keeps current value                                            |
| `'zero'`             | Sets stencil buffer value to 0                                 |
| `'replace'`          | Sets stencil buffer value to reference value per `stencilFunc` |
| `'invert'`           | Inverts stencil buffer value bitwise                           |
| `'increment-clamp'`  | Increments stencil buffer value. Clamps to max value           |
| `'increment-wrap'`   | Increments stencil buffer value. Wraps to zero                 |
| `'decrement-clamp'`  | Decrements stencil buffer value. Clamps to 0                   |
| `'decrement-wrap'`   | Decrements stencil buffer value, wraps to max unsigned value   |

Action when the stencil test fails

- stencil test fail action,
- depth test fail action,
- pass action

Remarks:

- By using binary masks, an 8 bit stencil buffer can effectively contain 8 separate masks or stencils
- The luma.gl API currently does not support setting stencil operations separately for front and back faces.

## Depth Test Parameters (RenderPipeline)

After the GPU completes stencil tests, depth tests and writes are performed. These can be controlled by the following parameters:

| Function              | Description                            | Values               | WebGL counterpart                   |
| --------------------- | -------------------------------------- | -------------------- | ----------------------------------- | --- |
| `depthWriteEnabled`   | Whether depth buffer is updated        | `boolean` **`true`** | `gl.depthMask`                      |
| `depthCompare`        | If and how depth testing is done       | **`always`**, ...    | `gl.depthFunc`                      |
| `depthBias`           | Small depth offset for polygons        | `float`              | `gl.polygonOffset`                  |
| `depthBiasSlopeScale` | Small depth factor for polygons        | `float`              | `gl.polygonOffset`                  |
| `depthBiasClamp`      | Max depth offset for polygons          | `float`              | N/A                                 |
| `unclippedDepth`      | Disable depth value clipping to [0, 1] | **false** boolean    | N/A - Requires `depth-clip-control` |     |

- **Depth Bias** - Sometimes referred to as "polygon offset". Adds small offset to fragment depth values (by factor × DZ + r × units). Usually used as a heuristic to avoid z-fighting, but can also be used for effects like applying decals to surfaces, and for rendering solids with highlighted edges. The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.


## Render Targets (Framebuffers)

### Clear Color

| Function   | Sets parameters                        |
| ---------- | -------------------------------------- |
| clearColor | `createRenderPass({colorAttachments})` |
