# Upgrading GPU Parameters

- Parameters are set on `Pipeline` creation. They can not be modified, or passed as parameters to draw calls.
- Parameters can now only be set, not queried. luma.gl no longer provides a way to query parameters.

## Depth testing

To set up depth testing

```typescript
const value = model.setParameters({
  depthWriteEnabled: true,
  depthCompare: 'less-equal'
});
```


## Parameter Mapping

The following table shows mappings from luma v8 WebGL parameters to luma v9 WebGPU style parameters.

| luma v8 / WebGL Parameter                                | v9 Parameter                       | Values                                 | v9 Values                         |
| -------------------------------------------------------- | ---------------------------------- | -------------------------------------- | --------------------------------- |
| [polygonOffset][polygonoffset]                           | `depthBias`, `depthBiasSlopeScale` |
| [depthRange][depthrange]                                 | N/A                                |
| [clearDepth][cleardepth]                                 |                                    |
| **Rasterization Parameters**                             |
| [`cullFace`][cullface]                                   | `cullMode`                         | Which face to cull                     | **`'none'`**, `'front'`, `'back'` |
| [`frontFace`][frontface]                                 | `frontFace`                        | Which triangle winding order is front  | **`ccw`**, `cw`                   |
| `polygonOffset`                                          | `depthBias`                        | Small depth offset for polygons        | `float`                           |
| `polygonOffset`                                          | `depthBiasSlopeScale`              | Small depth factor for polygons        | `float`                           |
| `polygonOffset`                                          | `depthBiasClamp`                   | Max depth offset for polygons          | `float`                           |
| **Stencil Parameters**                                   |
| [`stencilMask`][stencilmask] / `GL.STENCIL_WRITEMASK`    | `stencilReadMask`                  | Binary mask for reading stencil values | `number` (**`0xffffffff`**)       |
| `stencilFunc` / `GL.STENCIL_VALUE_MASK`                  | `stencilWriteMask`                 | Binary mask for writing stencil values | `number` (**`0xffffffff`**)       |
| `stencilFunc` / `GL.STENCIL_FUNC`                        | `stencilCompare`                   | How the mask is compared               | **`always`**, `not-equal`, ...    |
| [`stencilOp`][stencilop] /  `GL.STENCIL_PASS_DEPTH_PASS` | `stencilPassOperation`             |                                        | **`'keep'`**                      |
| [`stencilOp`][stencilop] / `GL.STENCIL_PASS_DEPTH_FAIL`  | `stencilDepthFailOperation`        |                                        | **`'keep'`**                      |
| [`stencilOp`][stencilop] / `GL.STENCIL_FAIL`             | `stencilFailOperation`             |                                        | **`'keep'`**                      |
| [`stencilOpSeparate`][stencilopseparate]                 | ]                                  | N/                                     |



| WebGL Function                           | WebGL Parameters                                                                                                                                                              | luma.gl v9 counterpart                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`clearStencil`][clearstencil]           | `GL.STENCIL_CLEAR_VALUE`                                                                                                                                                      |                                                                         |
|                                          | []                                                                                                                                                                            | `stencilWriteMask`                                                      |
| [`stencilFunc`][stencilfunc]             | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`]                                                                                                                | `stencilCompare`, `stencilReadMask`                                     |
| [`stencilOp`][stencilop]                 | `GL.STENCIL_FAIL`, `,                                                                                                                                                         | `stencilPassOperation`, `stencilFailDepth                               |
| [`stencilOpSeparate`][stencilopseparate] | [`GL.STENCIL_FAIL`, `GL.STENCIL_FAIL_DEPTH_FAIL`, `GL.STENCIL_FAIL_DEPTH_PASS`, `GL.STENCIL_BACK_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_PASS`] | N/A                                                                     |
| `GL.STENCIL_TEST`                        | `false`                                                                                                                                                                       | Enables stencil testing                                                 |
| `GL.STENCIL_CLEAR_VALUE`                 | `0`                                                                                                                                                                           | Sets index used when stencil buffer is cleared.                         |
| `GL.STENCIL_WRITEMASK`                   | `0xFFFFFFFF`                                                                                                                                                                  | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_BACK_WRITEMASK`              | `0xFFFFFFFF`                                                                                                                                                                  | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FUNC`                        | `GL.ALWAYS`                                                                                                                                                                   |                                                                         |
| `GL.STENCIL_REF`                         | `0`                                                                                                                                                                           |                                                                         |
| `GL.STENCIL_VALUE_MASK`                  | `0xFFFFFFFF`                                                                                                                                                                  | Sets bit mask                                                           |
| `GL.STENCIL_BACK_FUNC`                   | `GL.ALWAYS`                                                                                                                                                                   |                                                                         |
| `GL.STENCIL_BACK_REF`                    | `0`                                                                                                                                                                           |                                                                         |
| `GL.STENCIL_BACK_VALUE_MASK`             | `0xFFFFFFFF`                                                                                                                                                                  | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FAIL`                        | `GL.KEEP`                                                                                                                                                                     | stencil test fail action                                                |
| `GL.STENCIL_PASS_DEPTH_FAIL`             | `GL.KEEP`                                                                                                                                                                     | depth test fail action                                                  |
| `GL.STENCIL_PASS_DEPTH_PASS`             | `GL.KEEP`                                                                                                                                                                     | depth test pass action                                                  |
| `GL.STENCIL_BACK_FAIL`                   | `GL.KEEP`                                                                                                                                                                     | stencil test fail action, back                                          |
| `GL.STENCIL_BACK_PASS_DEPTH_FAIL`        | `GL.KEEP`                                                                                                                                                                     | depth test fail action, back                                            |
| `GL.STENCIL_BACK_PASS_DEPTH_PASS`        | `GL.KEEP`                                                                                                                                                                     | depth test pass action, back                                            |
**Blending**
| [blendColor][blendcolor]               | `GL.BLEND_COLOR`                                                                     |
| [blendEquation][blendequation]         | [`GL.BLEND_EQUATION_RGB`, `GL.BLEND_EQUATION_ALPHA`]                                 |
| [blendFunc][blendfunc]                 | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`]                                           |
| [blendFuncSeparate][blendfuncseparate] | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`, `GL.BLEND_DST_RGB`, `GL.BLEND_DST_ALPHA`] |
| `GL.BLEND`                | GLboolean       | `false`        | Blending enabled |
| `GL.BLEND_COLOR`          | Float32Array(4) | `[0, 0, 0, 0]` |                  |
| `GL.BLEND_EQUATION_RGB`   | GLenum          | `GL.FUNC_ADD`  |                  |
| `GL.BLEND_EQUATION_ALPHA` | GLenum          | `GL.FUNC_ADD`  |                  |
| `GL.BLEND_SRC_RGB`        | GLenum          | `GL.ONE`       | srcRgb           |
| `GL.BLEND_SRC_ALPHA`      | GLenum          | `GL.ZERO`      | srcAlpha         |
| `GL.BLEND_DST_RGB`        | GLenum          | `GL.ONE`       | dstRgb           |
| `GL.BLEND_DST_ALPHA`      | GLenum          | `GL.ZERO`      | dstAlpha         |


- **Depth Bias** - Sometimes referred to as "polygon offset". Adds small offset to fragment depth values (by factor × DZ + r × units). Usually used as a heuristic to avoid z-fighting, but can also be used for effects like applying decals to surfaces, and for rendering solids with highlighted edges. The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.


After the fragment shader runs, optional stencil tests are performed, with resulting operations on the the stencil buffer.

| V8/WebGL Function           | Description                            | Values                         |
| --------------------------- | -------------------------------------- | ------------------------------ | ---------------- |
| **Stencil Parameters**      |
| `stencilReadMask`           | Binary mask for reading stencil values | `number` (**`0xffffffff`**)    |
| `stencilWriteMask`          | Binary mask for writing stencil values | `number` (**`0xffffffff`**)    | `gl.frontFace`   |
| `stencilCompare`            | How the mask is compared               | **`always`**, `not-equal`, ... | `gl.stencilFunc` |
| `stencilPassOperation`      |                                        | **`'keep'`**                   | `gl.stencilOp`   |
| `stencilDepthFailOperation` |                                        | **`'keep'`**                   | `gl.stencilOp`   |
| `stencilFailOperation`      |                                        | **`'keep'`**                   | `gl.stencilOp`   |

Action when the stencil test fails

- stencil test fail action,
- depth test fail action,
- pass action

Remarks:

- By using binary masks, an 8 bit stencil buffer can effectively contain 8 separate masks or stencils
- The luma.gl API currently does not support setting stencil operations separately for front and back faces.

| WebGL Function                           | WebGL Parameters                                                                   | luma.gl v9 counterpart                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| [`clearStencil`][clearstencil]           | `GL.STENCIL_CLEAR_VALUE`                                                           |                                           |
| [`stencilMask`][stencilmask]             | [`GL.STENCIL_WRITEMASK`]                                                           | `stencilWriteMask`                        |
| [`stencilFunc`][stencilfunc]             | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`]                     | `stencilCompare`, `stencilReadMask`       |
| [`stencilOp`][stencilop]                 | `GL.STENCIL_FAIL`, `GL.STENCIL_PASS_DEPTH_FAIL`, `GL.STENCIL_PASS_DEPTH_PASS`      | `stencilPassOperation`, `stencilFailDepth |
| [`stencilOpSeparate`][stencilopseparate] | [`GL.STENCIL_FAIL`, `GL.STENCIL_FAIL_DEPTH_FAIL`, `GL.STENCIL_FAIL_DEPTH_PASS`] \* | N/A                                       |

\* `GL.STENCIL_BACK_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_PASS`


[polygonoffset]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
[depthrange]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthRange
[cleardepth]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth

[cullface]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
[frontface]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace


[clearstencil]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil
[stencilmask]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
[stencilfunc]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
[stencilop]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
[stencilopseparate]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOpSeparate

- In WebGL, setting any value will enable stencil testing (i.e. enable `GL.STENCIL_TEST`).


[clearstencil]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil
[stencilmask]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
[stencilfunc]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
[stencilop]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
[stencilopseparate]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOpSeparate

- In WebGL, setting any value will enable stencil testing (i.e. enable `GL.STENCIL_TEST`).

[blendcolor]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor
[blendequation]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
[blendfunc]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
[blendfuncseparate]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate

### Clear Color

| Function                                                                                        | Sets parameters      |
| ----------------------------------------------------------------------------------------------- | -------------------- |
| [clearColor][https]//developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor) | GL.COLOR_CLEAR_VALUE |

| Parameter              | Type                | Default      | Description |
| ---------------------- | ------------------- | ------------ | ----------- |
| `GL.COLOR_CLEAR_VALUE` | new Float32Array(4) | [0, 0, 0, 0] | .           |


### Color Mask

| Function                                                                                      | Sets parameters    |
| --------------------------------------------------------------------------------------------- | ------------------ |
| [colorMask](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask) | GL.COLOR_WRITEMASK |

| Parameter            | Type                                         | Default                  | Description |
| -------------------- | -------------------------------------------- | ------------------------ | ----------- |
| `GL.COLOR_WRITEMASK` | [GLboolean, GLboolean, GLboolean, GLboolean] | [true, true, true, true] | .           |

### Dithering

| Parameter   | Type      | Default | Description                                                                      |
| ----------- | --------- | ------- | -------------------------------------------------------------------------------- |
| `GL.DITHER` | GLboolean | `true`  | Enable dithering of color components before they get written to the color buffer |

- Note: Dithering is driver dependent and typically has a stronger effect when the color components have a lower number of bits.

### PolygonOffset

Add small offset to fragment depth values (by factor × DZ + r × units)
Useful for rendering hidden-line images, for applying decals to surfaces,
and for rendering solids with highlighted edges.

| Function                                                                                              | Sets parameters                                     |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [polygonOffset](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset) | [GL.POLYGON_OFFSET_FACTOR, GL.POLYGON_OFFSET_UNITS] |

| Parameter                  | Type      | Default | Description |
| -------------------------- | --------- | ------- | ----------- |
| `GL.POLYGON_OFFSET_FILL`   | GLboolean | `false` | .           |
| `GL.POLYGON_OFFSET_FACTOR` | GLfloat   | `0`     | .           |
| `GL.POLYGON_OFFSET_UNITS`  | GLfloat   | `0`     | .           |

- Note: The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.

### Rasterization (WebGL 2)

Primitives are discarded immediately before the rasterization stage, but after the optional transform feedback stage. `gl.clear()` commands are ignored.

| Parameter               | Type      | Default | Description           |
| ----------------------- | --------- | ------- | --------------------- |
| `GL.RASTERIZER_DISCARD` | GLboolean | `false` | Disable rasterization |

### Sampling

Specify multisample coverage parameters

| Function                                                                                                | Sets parameters                                           |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [sampleCoverage](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/sampleCoverage) | [`GL.SAMPLE_COVERAGE_VALUE`, `GL.SAMPLE_COVERAGE_INVERT`] |

| Parameter                     | Type      | Default | Description                                                                            |
| ----------------------------- | --------- | ------- | -------------------------------------------------------------------------------------- |
| `GL_SAMPLE_COVERAGE`          | GLboolean | `false` | Activates the computation of a temporary coverage value determined by the alpha value. |
| `GL_SAMPLE_ALPHA_TO_COVERAGE` | GLboolean | `false` | Activates ANDing the fragment's coverage with the temporary coverage value             |
| `GL.SAMPLE_COVERAGE_VALUE`    | GLfloat   | 1.0     |                                                                                        |
| `GL.SAMPLE_COVERAGE_INVERT`   | GLboolean | `false` |                                                                                        |


### Scissor Test

Settings for scissor test and scissor box.

| Function                                                                                  | Sets parameters  |
| ----------------------------------------------------------------------------------------- | ---------------- |
| [scissor](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor) | `GL.SCISSOR_BOX` |
| scissorTest                                                                               | GL.SCISSOR_TEST  |

| Parameter         | Type          | Default                           | Description |
| ----------------- | ------------- | --------------------------------- | ----------- |
| `GL.SCISSOR_TEST` | GLboolean     | `false`                           |
| `GL.SCISSOR_BOX`  | Int32Array(4) | [null, null, null, null]), // TBD |

## Viewport

Specifies the transformation from normalized device coordinates to
window/framebuffer coordinates. The maximum supported value, is defined by the
`GL.MAX_VIEWPORT_DIMS` limit.

| Function                                                                                    | Parameters    |
| ------------------------------------------------------------------------------------------- | ------------- |
| [viewport](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport) | `GL.VIEWPORT` |

| Parameter     | Type          | Default   | Description |
| ------------- | ------------- | --------- | ----------- |
| `GL.VIEWPORT` | Int32Array(4) | [...] TBD | Viewport    |

Example:

```typescript
// Set viewport to maximum supported size
const maxViewport = getLimits(gl)[GL.MAX_VIEWPORT_DIMS];
setState(gl, {
  viewport: [0, 0, maxViewport[0], maxViewport[1]]
});
```

## Remarks

GPU State Management can be quite complicated.

- A large part of the WebGL API is devoted to parameters. When reading, querying individual values using GL constants is the norm, and when writing, special purpose functions are provided for most parameters. luma.gl supports both forms for both reading and writing parameters.
- Reading values from WebGL can be very slow if it requires a GPU roundtrip. To get around this, luma.gl reads values once, caches them and tracks them as they are changed through luma functions. The cached values can get out of sync if the context is shared outside of luma.gl.
- luma.gl's state management enables "conflict-free" programming, so that even when setting global state, one part of the code does not need to worry about whether other parts are changing the global state.
- Note that to fully support the conflict-free model and detect changes done e.g. in other WebGL libraries, luma.gl needs to hook into the WebGL context to track state changes.

---

## Depth testing

To set up depth testing

```typescript
const value = model.setParameters({
  depthWriteEnabled: true,
  depthCompare: 'less-equal'
});
```



| Parameter                         | Type      | Default      | Description                                                             |
| --------------------------------- | --------- | ------------ | ----------------------------------------------------------------------- |
| `GL.STENCIL_TEST`                 | GLboolean | `false`      | Enables stencil testing                                                 |
| `GL.STENCIL_CLEAR_VALUE`          | GLint     | `0`          | Sets index used when stencil buffer is cleared.                         |
| `GL.STENCIL_WRITEMASK`            | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_BACK_WRITEMASK`       | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FUNC`                 | GLenum    | `GL.ALWAYS`  |                                                                         |
| `GL.STENCIL_REF`                  | GLint     | `0`          |                                                                         |
| `GL.STENCIL_VALUE_MASK`           | GLuint    | `0xFFFFFFFF` | Sets bit mask                                                           |
| `GL.STENCIL_BACK_FUNC`            | GLenum    | `GL.ALWAYS`  |                                                                         |
| `GL.STENCIL_BACK_REF`             | GLint     | `0`          |                                                                         |
| `GL.STENCIL_BACK_VALUE_MASK`      | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FAIL`                 | GLenum    | `GL.KEEP`    | stencil test fail action                                                |
| `GL.STENCIL_PASS_DEPTH_FAIL`      | GLenum    | `GL.KEEP`    | depth test fail action                                                  |
| `GL.STENCIL_PASS_DEPTH_PASS`      | GLenum    | `GL.KEEP`    | depth test pass action                                                  |
| `GL.STENCIL_BACK_FAIL`            | GLenum    | `GL.KEEP`    | stencil test fail action, back                                          |
| `GL.STENCIL_BACK_PASS_DEPTH_FAIL` | GLenum    | `GL.KEEP`    | depth test fail action, back                                            |
| `GL.STENCIL_BACK_PASS_DEPTH_PASS` | GLenum    | `GL.KEEP`    | depth test pass action, back                                            |

### Blending

| Function style                         | Sets parameter(s)                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| [blendColor][blendColor]               | `GL.BLEND_COLOR`                                                                     |
| [blendEquation][blendEquation]         | [`GL.BLEND_EQUATION_RGB`, `GL.BLEND_EQUATION_ALPHA`]                                 |
| [blendFunc][blendFunc]                 | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`]                                           |
| [blendFuncSeparate][blendFuncSeparate] | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`, `GL.BLEND_DST_RGB`, `GL.BLEND_DST_ALPHA`] |

[blendColor]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor
[blendEquation]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
[blendFunc]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
[blendFuncSeparate]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate

| Parameter                 | Type            | Default        | Description      |
| ------------------------- | --------------- | -------------- | ---------------- |
| `GL.BLEND`                | GLboolean       | `false`        | Blending enabled |
| `GL.BLEND_COLOR`          | Float32Array(4) | `[0, 0, 0, 0]` |                  |
| `GL.BLEND_EQUATION_RGB`   | GLenum          | `GL.FUNC_ADD`  |                  |
| `GL.BLEND_EQUATION_ALPHA` | GLenum          | `GL.FUNC_ADD`  |                  |
| `GL.BLEND_SRC_RGB`        | GLenum          | `GL.ONE`       | srcRgb           |
| `GL.BLEND_SRC_ALPHA`      | GLenum          | `GL.ZERO`      | srcAlpha         |
| `GL.BLEND_DST_RGB`        | GLenum          | `GL.ONE`       | dstRgb           |
| `GL.BLEND_DST_ALPHA`      | GLenum          | `GL.ZERO`      | dstAlpha         |
