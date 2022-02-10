# GPU Parameters

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

const device.createRenderPass({
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

| Parameter       | Type        | Description                                                                         |
| --------------- | ----------- | ----------------------------------------------------------------------------------- |
| `viewport`      | `number[6]` | Specifying viewport size                                                            |
| `scissor`       | `number[4]` | Specifying scissor rect                                                             |
| `blendConstant` | `number[4]` | Sets color for pipeline targets w/ blend factors `constant` or `one-minus-constant` |

## Fixed RenderPass Parameters

A `RenderPass` holds parameters specifying how color and depth / stencil attachments should be cleared (clear colors, values), discarded etc. 

Note that there is no explicit `clear` function in the luma.gl v9 API. Instead attachments are cleared when a `RenderPass` is created (begins), 

`createRenderPass({framebuffer, parameters})`

| Parameter            | Type          | Description                                                                                        |
| -------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `clearColors?`       | `number[4][]` | If not supplied, loads the value from the attached texture (less performant)                       |
| `discard?`           | `boolean[]`   | If `true`, does not store the result in the attached texture                                       |
| `depthClearValue?`   | `number`      | Typically set to `0`. If not supplied, loads the value from the attached texture (less performant) |
| `depthDiscard?`      | `boolean`     | If `true`, does not store the result in the attached texture                                       |
| `depthReadonly?`     | `boolean`     | If `true`, indicated depth component is readonly                                                   |
| `stencilClearValue?` | `number`      | Typically set to `0`. If not supplied, loads the value from the attached texture (less performant) |
| `stencilDiscard?`    | `boolean`     | If `true`, does not store the result in the attached texture                                       |
| `stencilReadonly?`   | `boolean`     | If `true`, indicated stencil component is readonly                                                 |


## RenderPipeline Parameters

### Culling Assembly

These parameters control the primitive assembly stage (which happens before fragment shader runs).

Notes:

- `topology` must be specified on a `RenderPipeline` to describe the layout of vertex buffers.
- `stripIndexFormat` must be specified on the `RenderPipeline` to define sub-list separators.

| Function    | Type / Values                     | Description                           |
| ----------- | --------------------------------- | ------------------------------------- |
| `cullMode`  | **`'none'`**, `'front'`, `'back'` | Which face to cull                    |
| `frontFace` | **`ccw`**, `cw`                   | Which triangle winding order is front |

### Multisampling

| Function                 | Description | Values       |
| ------------------------ | ----------- | ------------ |
| `sampleCount`            |             | `1`          |
| `sampleMask`             |             | `0xFFFFFFFF` |
| `alphaToCoverageEnabled` |             | `false`      |

### Stencil Test (RenderPipeline)

After the fragment shader runs, optional stencil tests are performed, with resulting operations on the the stencil buffer.

| Function                    | Type               | Default            | Description                            |
| --------------------------- | ------------------ | ------------------ | -------------------------------------- |
| `stencilReadMask`           | `number`           | (**`0xffffffff`**) | Binary mask for reading stencil values |
| `stencilWriteMask`          | `number`           | (**`0xffffffff`**) | Binary mask for writing stencil values |
| `stencilCompare`            | `StencilCompare`   | **`always`**       | How the mask is compared               |
| `stencilPassOperation`      | `StencilOperation` | **`'keep'`**       |                                        |
| `stencilDepthFailOperation` | `StencilOperation` | **`'keep'`**       |                                        |
| `stencilFailOperation`      | `StencilOperation` | **`'keep'`**       |                                        |

#### Stencil Test

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

### Depth Test Parameters

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

### Color Targets

A `RenderPipeline` requires information about each color attachments:

| Target setting         | Type            | Default   | Description                                                |
| ---------------------- | --------------- | --------- | ---------------------------------------------------------- |
| `format`               | `TextureFormat` | N/A       |                                                            |
| `writeMask?`           | `number`        | ALL = 0xF | RED = 0x1, GREEN = 0x2, BLUE = 0x4, ALPHA = 0x8, ALL = 0xF |
| `colorBlendOperation?` | BlendOperation  | `'add'`   |                                                            |
| `colorBlendSrcFactor?` | BlendEquation   | `'one'`   |                                                            |
| `colorBlendDstFactor?` | BlendEquation   | `'zero'`  |                                                            |
| `alphaBlendOperation?` | BlendOperation  | `'add'`   |                                                            |
| `alphaBlendSrcFactor?` | BlendEquation   | `'one'`   |                                                            |
| `alphaBlendDstFactor?` | BlendEquation   | `'zero'`  |                                                            |

### Blending

Blending mixes the source color and the target color:

- The two colors are first multiplied with chosen factors (controlled by "blend function" parameters).
- The two colors are then either added, subtracted, or the min or max color is used per the "blend operation" parameter.

The default blending settings do not perform any visual "blending" but simply overwrites the destination color with the source color by:

- multiplying the src color with 1
- multiplying the destination color with 0
- using the `'add'` blend operation.

The following link provides more information on [color blending][color_blending].

[color_blending]: https://csawesome.runestone.academy/runestone/books/published/learnwebgl2/12_advanced_rendering/05_color_blending.html

- `blendColor` The constant blend color referenced by `constant` and `one-minus-constant` can be changed at any time with with `RenderPass.setParameters({})`.

| BlendOperation       | Output color                    | Visual effect                                                           |
| -------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `'add'`              | source + destination            | Incrementally brighten as multiple elements render on top of each other |
| `'subtract'`         | source - destination            | -                                                                       |
| `'reverse-subtract'` | destination - source            | -                                                                       |
| `'min'`              | minimum of source + destination | -                                                                       |
| `'max'`              | maximum of source + destination | Ensure brightest color is preserved                                     |

| BlendFunction           | All colors multiplied with                             |
| ----------------------- | ------------------------------------------------------ |
| `'zero'`                | `[0,0,0,0]`                                            |
| `'one'`                 | `[1,1,1,1]`                                            |
| `'src'`                 | RBGAsrc                                                |
| `'one-minus-src'`       | 1 - RGBAsrc                                            |
| `'src-alpha'`           | AAAAsrc                                                |
| `'one-minus-src-alpha'` | 1 - AAAAsrc                                            |
| `'dst'`                 | RBGAdst                                                |
| `'one-minus-dst'`       | 1 - RBGAdst                                            |
| `'dst-alpha'`           | AAAAdest                                               |
| `'one-minus-dst-alpha'` | 1 - AAAAdst                                            |
| `'src-alpha-saturated'` | [min(AS, 1 - AD), min(AS, 1 - AD), min(AS, 1 - AD), 1] |
| `'constant'`            | RGBAconstant                                           |
| `'one-minus-constant'`  | 1- RGBAconstant                                        |

## Remarks

Note that there are certain types of parameters affecting GPU operation that are not handled by the main parameter system:

| Parameters    | Comments                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| `Sampler`     | Describes how to sample from textures is controlled by `Sampler` objects. |
| `Framebuffer` | luma.gl uses Framebuffer objects specify collections of render targets.   |
