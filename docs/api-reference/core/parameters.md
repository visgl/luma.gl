import {BlendingExample} from '@site/src/examples';

# GPU parameters

Pipeline parameters are fixed state; pass parameters describe a target and its mutable draw state.
See [Using GPU parameters](/docs/api-guide/gpu/gpu-parameters) for examples.

## Parameter ownership

| State | API | Lifetime |
| --- | --- | --- |
| Rasterization, depth, stencil, blending, multisampling | `RenderPipelineProps.parameters` | Fixed for a pipeline. |
| Viewport, scissor rectangle, blend constant, stencil reference | `RenderPass.setParameters()` | Mutable between draws. |
| Clearing, read-only attachments, rasterizer discard | `RenderPassProps` | Fixed for a pass. |
| Texture sampling | `Sampler` | Fixed for a sampler. |

Create another pipeline for different fixed state, or use `Model.setParameters()` to let
Engine manage pipeline selection. [PipelineFactory](/docs/api-reference/core/pipeline-factory)
can reuse compatible pipeline descriptors.

## Dynamic RenderPass parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `viewport` | `NumberArray4 \| NumberArray6` | `[x, y, width, height]`, optionally followed by minimum and maximum depth. |
| `scissorRect` | `NumberArray4` | `[x, y, width, height]` clipping rectangle in drawing-buffer pixels. |
| `blendConstant` | `NumberArray4` | RGBA value used by `constant` and `one-minus-constant` blend factors. |
| `stencilReference` | `number` | Reference value for stencil comparisons and replacement. |

## Fixed RenderPass options

Use `clearColor`, `clearDepth`, and `clearStencil` to choose clear values, or boolean
`false` to preserve an attachment. Attachment textures belong to `Framebuffer`; clear
values belong to the pass. See
[RenderPassProps](/docs/api-reference/core/resources/render-pass#renderpassprops)
for the complete contract and defaults.

## RenderPipeline Parameters

### Assembly (Culling)

These parameters control the primitive assembly stage (which happens before fragment shader runs).

| Function    | Type / Values                     | Description                           |
| ----------- | --------------------------------- | ------------------------------------- |
| `cullMode` | **`'none'`**, `'front'`, `'back'` | Which face to cull |
| `frontFace` | **`'ccw'`**, `'cw'` | Which triangle winding order is front |

In addition, the following `RenderPipeline` properties are not typically considered GPU parameters but do impact the assembly stage:
- `topology` must be specified on a `RenderPipeline` to describe the layout of vertex buffers.
- `stripIndexFormat` can be specified on the `RenderPipeline` to define sub-list separators.

### Depth Test Parameters

After the GPU completes stencil tests, depth tests and writes are performed. These can be controlled by the following parameters:

| Function              | Description                            | Values               | WebGL counterpart                   |
| --------------------- | -------------------------------------- | -------------------- | ----------------------------------- |
| `depthWriteEnabled` | Whether depth buffer is updated | `boolean` **`false`** | `gl.depthMask` |
| `depthCompare` | If and how depth testing is done | **`always`**, ... | `gl.depthFunc` |
| `depthBias` | Small depth offset for polygons | `float` | `gl.polygonOffset` |
| `depthBiasSlopeScale` | Small depth factor for polygons | `float` | `gl.polygonOffset` |
| `depthBiasClamp` | Max depth offset for polygons | `float` | N/A |
| `unclippedDepth` | Disable depth value clipping to [0, 1] | **false** boolean | N/A - Requires `depth-clip-control` |

- **Depth Bias** - Sometimes referred to as "polygon offset". Adds small offset to fragment depth values (by factor × DZ + r × units). Usually used as a heuristic to avoid z-fighting, but can also be used for effects like applying decals to surfaces, and for rendering solids with highlighted edges. The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.


### Multisampling

| Function                 | Values           | Description |
| ------------------------ | ---------------- | ----------- |
| `sampleCount` | **`1`** | — |
| `sampleMask` | **`0xFFFFFFFF`** | — |
| `sampleAlphaToCoverageEnabled` | **`false`** | — |

### Stencil Test

After the fragment shader runs, optional stencil tests are performed, with resulting operations on the stencil buffer.

| Function                    | Type               | Default            | Description                            |
| --------------------------- | ------------------ | ------------------ | -------------------------------------- |
| `stencilReadMask` | `number` | (**`0xffffffff`**) | Binary mask for reading stencil values |
| `stencilWriteMask` | `number` | (**`0xffffffff`**) | Binary mask for writing stencil values |
| `stencilCompare` | `StencilCompare` | **`always`** | How the mask is compared |
| `stencilPassOperation` | `StencilOperation` | **`'keep'`** | — |
| `stencilDepthFailOperation` | `StencilOperation` | **`'keep'`** | — |
| `stencilFailOperation` | `StencilOperation` | **`'keep'`** | — |


| `StencilCompare` | Description                                |
| ---------------- | ------------------------------------------ |
| `'always'` | Always pass |
| `'never'` | Never pass |
| `'less'` | Pass if (ref & mask) < (stencil & mask) |
| `'equal'` | Pass if (ref & mask) = (stencil & mask) |
| `'less-equal'` | Pass if (ref & mask) \<\= (stencil & mask) |
| `'greater'` | Pass if (ref & mask) > (stencil & mask) |
| `'not-equal'` | Pass if (ref & mask) != (stencil & mask) |
| `'greater-equal'` | Pass if (ref & mask) \>\= (stencil & mask) |

`StencilOperation` values describe action when the stencil test fails

- stencil test fail action,
- depth test fail action,
- pass action


| `StencilOperation`  | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `'keep'` | Keeps current value |
| `'zero'` | Sets stencil buffer value to 0 |
| `'replace'` | Sets stencil buffer value to reference value per `stencilFunc` |
| `'invert'` | Inverts stencil buffer value bitwise |
| `'increment-clamp'` | Increments stencil buffer value. Clamps to max value |
| `'increment-wrap'` | Increments stencil buffer value. Wraps to zero |
| `'decrement-clamp'` | Decrements stencil buffer value. Clamps to 0 |
| `'decrement-wrap'` | Decrements stencil buffer value, wraps to max unsigned value |


Remarks:

- By using binary masks, an 8 bit stencil buffer can effectively contain 8 separate masks or stencils
- The luma.gl API currently does not support setting stencil operations separately for front and back faces.

### Color Targets

A `RenderPipeline` requires information about each color attachments:

| Target setting         | Type            | Default   | Description                                                |
| ---------------------- | --------------- | --------- | ---------------------------------------------------------- |
| `format` | `TextureFormat` | N/A | — |
| `writeMask?` | `number` | ALL = 0xF | RED = 0x1, GREEN = 0x2, BLUE = 0x4, ALPHA = 0x8, ALL = 0xF |
| `blendColorOperation?` | BlendOperation | `'add'` | — |
| `blendColorSrcFactor?` | BlendFactor | `'one'` | — |
| `blendColorDstFactor?` | BlendFactor | `'zero'` | — |
| `blendAlphaOperation?` | BlendOperation | `'add'` | — |
| `blendAlphaSrcFactor?` | BlendFactor | `'one'` | — |
| `blendAlphaDstFactor?` | BlendFactor | `'zero'` | — |

### Blending

Blending mixes the source color and the target color:

Use the interactive playground to compare blend operations, source and destination factors,
blend constants, and separate color and alpha output.

<BlendingExample embedded showStats={false} />

- The two colors are first multiplied with chosen factors (controlled by "blend function" parameters).
- The two colors are then either added, subtracted, or the min or max color is used per the "blend operation" parameter.

The default blending settings do not perform any visual "blending" but simply overwrites the destination color with the source color by:

- multiplying the src color with 1
- multiplying the destination color with 0
- using the `'add'` blend operation.

The following link provides more information on [color blending][color_blending].

[color_blending]: https://csawesome.runestone.academy/runestone/books/published/learnwebgl2/12_advanced_rendering/05_color_blending.html

- `blendConstant` The constant blend color referenced by `constant` and `one-minus-constant` can be changed at any time with `RenderPass.setParameters({})`.

| BlendOperation       | Output color                    | Visual effect                                                           |
| -------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `'add'` | source + destination | Incrementally brighten as multiple elements render on top of each other |
| `'subtract'` | source - destination | - |
| `'reverse-subtract'` | destination - source | - |
| `'min'` | minimum of source and destination | - |
| `'max'` | maximum of source and destination | Ensure brightest color is preserved |

| BlendFunction           | All colors multiplied with                             | Comment                                  |
| ----------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `'zero'` | `[0,0,0,0]` | — |
| `'one'` | `[1,1,1,1]` | — |
| `'src'` | RBGAsrc | — |
| `'one-minus-src'` | 1 - RGBAsrc | — |
| `'src-alpha'` | AAAAsrc | — |
| `'one-minus-src-alpha'` | 1 - AAAAsrc | — |
| `'dst'` | RBGAdst | — |
| `'one-minus-dst'` | 1 - RBGAdst | — |
| `'dst-alpha'` | AAAAdest | — |
| `'one-minus-dst-alpha'` | 1 - AAAAdst | — |
| `'src-alpha-saturated'` | [min(AS, 1 - AD), min(AS, 1 - AD), min(AS, 1 - AD), 1] | — |
| `'constant'` | RGBAconstant | constant set with `blendConstant` parameter |
| `'one-minus-constant'` | 1- RGBAconstant | constant set with `blendConstant` parameter |
