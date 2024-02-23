# GPU Parameters

GPU parameters provide control of GPU pipeline features such as culling, depth and stencil buffers, blending, clipping etc.

luma.gl provides a unified API for working with GPU parameters.

All parameters listed in a single table

| Function                     | How to set                             | Description                                                                | Values                            | WebGL counterpart        |
| ---------------------------- | -------------------------------------- | -------------------------------------------------------------------------- | --------------------------------- | ------------------------ |
| **Rasterization Parameters** |
| `cullMode`                   | `createRenderPipeline()`               | Which face to cull                                                         | **`'none'`**, `'front'`, `'back'` |
| `frontFace`                  | `createRenderPipeline()`               | Which triangle winding order is front                                      | **`ccw`**, `cw`                   |
| `provokingVertex`            | `createRenderPipeline()`               | Vertex used for flat shading. Requires `provoking-vertex-webgl`            | **`'last'`**, `'first'`           | `WEBGL_provoking_vertex` |
| `viewport`                   | `RenderPass.setParameters()`           | Specifying viewport size                                                   |
| `scissor`                    | `RenderPass.setParameters()`           | Specifying scissor rect size                                               |
| **Depth Buffer Parameters**  |
| `depthBias`                  | `createRenderPipeline()`               | Small depth offset for polygons                                            | `float`                           | `gl.polygonOffset`       |
| `depthBiasSlopeScale`        | `createRenderPipeline()`               | Small depth factor for polygons                                            | `float`                           | `gl.polygonOffset`       |
| `depthBiasClamp`             | `createRenderPipeline()`               | Max depth offset for polygons                                              | `float`                           | N/A                      |
| **Extension Parameters**     |
| `unclippedDepth`             | `createRenderPipeline()`               | Disable depth value clipping to [0, 1]. Requires `depth-clip-control`      | **`false`** `boolean`             |
| `provokingVertex`            | `createRenderPipeline()`               | Vertex used for flat shading. Requires `provoking-vertex-webgl`            | **`'last'`**, `'first'`           | `WEBGL_provoking_vertex` |
| `polygonMode`                | `createRenderPipeline()`               | Enable wire frame rendering. Requires `polygon-mode-webgl`                 | **`'fill'`**, `'line'`            | `WEBGL_polygon_mode`     |
| `polygonOffsetLine`          | `createRenderPipeline()`               | Vertex used for flat shading. Requires `polygon-mode-webgl`                | **`false`** `boolean`             | `WEBGL_polygon_mode`     |
| **Stencil Buffer**           |
| `stencilReference`           | `RenderPass.setParameters()`           |
| `stencilReadMask`            | `createRenderPipeline()`               | Binary mask for reading stencil values                                     | `number` (**`0xffffffff`**)       |
| `stencilWriteMask`           | `createRenderPipeline()`               | Binary mask for writing stencil values                                     | `number` (**`0xffffffff`**)       | `gl.frontFace`           |
| `stencilCompare`             | `createRenderPipeline()`               | How the mask is compared                                                   | **`always`**, `not-equal`, ...    | `gl.stencilFunc`         |
| `stencilPassOperation`       | `createRenderPipeline()`               |                                                                            | **`'keep'`**                      | `gl.stencilOp`           |
| `stencilDepthFailOperation`  | `createRenderPipeline()`               |                                                                            | **`'keep'`**                      | `gl.stencilOp`           |
| `stencilFailOperation`       | `createRenderPipeline()`               |                                                                            | **`'keep'`**                      | `gl.stencilOp`           |
| **Blending**                 |
| `blendConstant`              |                                        | Color referenced by special blend factors `constant`, `one-minus-constant` |
| `blendColor`                 | `RenderPass.setParameters()`           |
| `blendEquation`              | `createRenderPipeline({targets: ...})` |
| `blendOperation`             | `createRenderPipeline({targets}).`     |
| `blendSrcFactor`             | `createRenderPipeline({targets}).`     |
| `blendDstFactor`             | `createRenderPipeline({targets}).`     |
| **Clear color**              |
| `clearColor`                 | `beginRenderPass({colorAttachments})`  |


## Other types of parameters

Note that there are certain types of parameters affecting GPU operation that are not handled by the main parameter system:

| Parameters    | Comments                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| `Sampler`     | Describes how to sample from textures is controlled by `Sampler` objects. |
| `Framebuffer` | luma.gl uses Framebuffer objects specify collections of render targets.   |


[color_blending]: https://csawesome.runestone.academy/runestone/books/published/learnwebgl2/12_advanced_rendering/05_color_blending.html


## Control Points

The only parameters that can be changed freely at any time (i.e. between each draw call) are viewport parameters, blend constant and stencil reference.

| Parameter          | Description                                                   | Values                           |
| ------------------ | ------------------------------------------------------------- | -------------------------------- |
| `viewport`         | Specifying viewport size                                      | `number` (**`0xffffffff`**)      |
| `scissor`          | Specifying scissor region                                     | `number` (**`0xffffffff`**)      |
| `blendConstant`    | Sets color referenced by pipeline targets using blend factors | `constant`, `one-minus-constant` |
| `stencilReference` |                                                               |                                  |

These parameters can be set on the current `RenderPass`, and these parameters can be changed at any time.


## Dynamic Parameters

- A number of parameters are fixed when a RenderPipeline is created. They cannot be changed without creating a new RenderPass.
- An additional set of parameters are fixed when a RenderPass is created, and thus applies to all RenderPipelines rendered with that RenderPass. To vary these parameters, additional RenderPasses would need to be created.
- A small set of parameters can be changed dynamically on a RenderPass between draw calls.

For completeness, there are certain types of parameters that are not
- Sampler parameters - How to sample from textures is controlled by `Sampler` objects.

The only parameters that can be changed at any time are viewport parameters, blend constant and stencil reference.

These parameters control the rasterization stage (which happens before fragment shader runs).


## Usage

```typescript
renderPass.setParameters({
  viewport: ...,
  scissor: ...,
  blendConstant: ...
})
```

However, parameters are set on the `RenderPipeline` and are immutable. (luma.gl provides a `RenderPipelineFactory` to help applications work around this limitation.)

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
  ]
});
```

Some parameters, in particular clear values, are set on specific color attachments and become immutable when used to initialize a `RenderPass`

```typescript
const framebuffer = device.createFramebuffer({
  colorAttachments: {clearColor: [1, 0, 0]},
})

const device.beginRenderPass({framebuffer})

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

Most luma.gl parameters are stored on `RenderPipeline` or `RenderPass` objects, both of which are either fully or partially immutable. This means that most parameters are fixed when these objects are created, and cannot be changed without creating new resources. The following table summarizes the situation:

| Parameter Mutability              | Examples                                          | Constraint                                                                                             |
| --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Dynamic `RenderPass` parameters   | `viewport`, `scissor`, `blendConstant`            | Can be freely changed between draw calls.                                                              |
| Fixed `RenderPass` parameters     | `clearColors`, `discard`, `depthClearValue`...    | Can not be changed between draw calls after `RenderPass` creation. A new `RenderPass` must be created. |
| Fixed `RenderPipeline` parameters | `cullMode`, `frontFace`, `depthWriteEnabled`, ... | Can not be changed between draw calls or render passes. A new `RenderPipeline` must be created.        |

Workarounds

- luma.gl provides a `RenderPipelineFactory` to help applications work around this limitation.
- It is obviously not too hard to create new RenderPass though it can require some management to end and run them in order.

## Dynamic RenderPass Parameters

The only parameters that can be changed at any time (using `renderPass.setParameters()`) are viewport size, scissor rectangle, and blend constant

| Parameter       | Type        | Description                                                                           |
| --------------- | ----------- | ------------------------------------------------------------------------------------- |
| `viewport`      | `number[6]` | Specifying viewport size                                                              |
| `scissor`       | `number[4]` | Specifying scissor rect                                                               |
| `blendConstant` | `number[4]` | Sets color for pipeline targets with blend factors `constant` or `one-minus-constant` |

## Fixed RenderPass Parameters

A `RenderPass` instance contains information about color and depth / stencil attachments as well as whether and how those attachments should be cleared be cleared (clear colors, values), whether fragment shader output should be discarded etc.


In luma.gl, the information about attachments (render targets) and clear colors etc is stored in `Framebuffer` objects. Thus, Framebuffer objects basically contain the parameters required to begin a new render pass, and `Framebuffer` objects can be reused repeatedly to create new `RenderPass` objects.

:::note
Note that there is no separate `clear` function in luma.gl. Instead attachments are "automatically" cleared when a `RenderPass` begins (clearing can be controlled and disabled with `Framebuffer` parameters).
:::

`beginRenderPass({framebuffer, parameters})`

| `Framebuffer` Parameter | Type          | Description                                                                                        |
| ----------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `clearColors?`          | `number[4][]` | If not supplied, loads the value from the attached texture (less performant)                       |
| `discard?`              | `boolean[]`   | If `true`, does not store the result in the attached texture                                       |
| `depthClearValue?`      | `number`      | Typically set to `0`. If not supplied, loads the value from the attached texture (less performant) |
| `depthDiscard?`         | `boolean`     | If `true`, does not store the result in the attached texture                                       |
| `depthReadonly?`        | `boolean`     | If `true`, indicated depth component is readonly                                                   |
| `stencilClearValue?`    | `number`      | Typically set to `0`. If not supplied, loads the value from the attached texture (less performant) |
| `stencilDiscard?`       | `boolean`     | If `true`, does not store the result in the attached texture                                       |
| `stencilReadonly?`      | `boolean`     | If `true`, indicated stencil component is readonly                                                 |

## RenderPipeline Parameters

### Assembly (Culling)

These parameters control the primitive assembly stage (which happens before fragment shader runs).

| Function    | Type / Values                     | Description                           |
| ----------- | --------------------------------- | ------------------------------------- |
| `cullMode`  | **`'none'`**, `'front'`, `'back'` | Which face to cull                    |
| `frontFace` | **`'ccw'`**, `'cw'`               | Which triangle winding order is front |

In addition, the following `RenderPipeline` properties are not typically considered GPU parameters but do impact the assembly stage:
- `topology` must be specified on a `RenderPipeline` to describe the layout of vertex buffers.
- `stripIndexFormat` can be specified on the `RenderPipeline` to define sub-list separators.

### Depth Test Parameters

After the GPU completes stencil tests, depth tests and writes are performed. These can be controlled by the following parameters:

| Function              | Description                            | Values               | WebGL counterpart                   |
| --------------------- | -------------------------------------- | -------------------- | ----------------------------------- |
| `depthWriteEnabled`   | Whether depth buffer is updated        | `boolean` **`true`** | `gl.depthMask`                      |
| `depthCompare`        | If and how depth testing is done       | **`always`**, ...    | `gl.depthFunc`                      |
| `depthBias`           | Small depth offset for polygons        | `float`              | `gl.polygonOffset`                  |
| `depthBiasSlopeScale` | Small depth factor for polygons        | `float`              | `gl.polygonOffset`                  |
| `depthBiasClamp`      | Max depth offset for polygons          | `float`              | N/A                                 |
| `unclippedDepth`      | Disable depth value clipping to [0, 1] | **false** boolean    | N/A - Requires `depth-clip-control` |

- **Depth Bias** - Sometimes referred to as "polygon offset". Adds small offset to fragment depth values (by factor × DZ + r × units). Usually used as a heuristic to avoid z-fighting, but can also be used for effects like applying decals to surfaces, and for rendering solids with highlighted edges. The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.


### Multisampling

| Function                 | Values           | Description |
| ------------------------ | ---------------- | ----------- |
| `sampleCount`            | **`1`**          |             |
| `sampleMask`             | **`0xFFFFFFFF`** |             |
| `alphaToCoverageEnabled` | **`false`**      |             |

### Stencil Test

After the fragment shader runs, optional stencil tests are performed, with resulting operations on the the stencil buffer.

| Function                    | Type               | Default            | Description                            |
| --------------------------- | ------------------ | ------------------ | -------------------------------------- |
| `stencilReadMask`           | `number`           | (**`0xffffffff`**) | Binary mask for reading stencil values |
| `stencilWriteMask`          | `number`           | (**`0xffffffff`**) | Binary mask for writing stencil values |
| `stencilCompare`            | `StencilCompare`   | **`always`**       | How the mask is compared               |
| `stencilPassOperation`      | `StencilOperation` | **`'keep'`**       |                                        |
| `stencilDepthFailOperation` | `StencilOperation` | **`'keep'`**       |                                        |
| `stencilFailOperation`      | `StencilOperation` | **`'keep'`**       |                                        |


| `StencilCompare` | Description                                |
| ---------------- | ------------------------------------------ |
| `'always'`       | Always pass                                |
| `'never'`        | Never pass                                 |
| `'less'`         | Pass if (ref & mask) < (stencil & mask)    |
| `'equal'`        | Pass if (ref & mask) = (stencil & mask)    |
| `'lequal'`       | Pass if (ref & mask) \<\= (stencil & mask) |
| `'greater'`      | Pass if (ref & mask) > (stencil & mask)    |
| `'notequal'`     | Pass if (ref & mask) != (stencil & mask)   |
| `'gequal'`       | Pass if (ref & mask) \>\= (stencil & mask) |

`StencilOperation` values describe action when the stencil test fails

- stencil test fail action,
- depth test fail action,
- pass action


| `StencilOperation`  | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `'keep'`            | Keeps current value                                            |
| `'zero'`            | Sets stencil buffer value to 0                                 |
| `'replace'`         | Sets stencil buffer value to reference value per `stencilFunc` |
| `'invert'`          | Inverts stencil buffer value bitwise                           |
| `'increment-clamp'` | Increments stencil buffer value. Clamps to max value           |
| `'increment-wrap'`  | Increments stencil buffer value. Wraps to zero                 |
| `'decrement-clamp'` | Decrements stencil buffer value. Clamps to 0                   |
| `'decrement-wrap'`  | Decrements stencil buffer value, wraps to max unsigned value   |


Remarks:

- By using binary masks, an 8 bit stencil buffer can effectively contain 8 separate masks or stencils
- The luma.gl API currently does not support setting stencil operations separately for front and back faces.

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

| BlendFunction           | All colors multiplied with                             | Comment                                  |
| ----------------------- | ------------------------------------------------------ | ---------------------------------------- |
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
| `'constant'`            | RGBAconstant                                           | constant set with `blendColor` parameter |
| `'one-minus-constant'`  | 1- RGBAconstant                                        | constant set with `blendColor` parameter |
