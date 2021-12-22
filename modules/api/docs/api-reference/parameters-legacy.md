# Legacy Parameters (TODO delete)



| WebGL Function | WebGL Parameters | luma.gl v9 counterpart |
| -------- | -------------- |
| [`clearStencil`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil) | `GL.STENCIL_CLEAR_VALUE` | |
| [`stencilMask`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask) | [`GL.STENCIL_WRITEMASK`] | `stencilWriteMask` |
| [`stencilFunc`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc) | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`] | `stencilCompare`, `stencilReadMask` |
| [`stencilOp`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp) | `GL.STENCIL_FAIL`, `GL.STENCIL_PASS_DEPTH_FAIL`, `GL.STENCIL_PASS_DEPTH_PASS` | `stencilPassOperation`, `stencilFailDepth
| [`stencilOpSeparate`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOpSeparate) | [`GL.STENCIL_FAIL`, `GL.STENCIL_FAIL_DEPTH_FAIL`, `GL.STENCIL_FAIL_DEPTH_PASS`, `GL.STENCIL_BACK_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_PASS`]| N/A |


- In WebGL, setting any value will enable stencil testing (i.e. enable `GL.STENCIL_TEST`).


| Parameter                         | Type      | Default      | Description             |
| --------------------------------- | --------- | ------------ | ----------------------- |
| `GL.STENCIL_TEST`                 | GLboolean | `false`      | Enables stencil testing |
| `GL.STENCIL_CLEAR_VALUE`          | GLint     | `0`          | Sets index used when stencil buffer is cleared. |
| `GL.STENCIL_WRITEMASK`            | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_BACK_WRITEMASK`       | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FUNC`                 | GLenum    | `GL.ALWAYS`  | |
| `GL.STENCIL_REF`                  | GLint     | `0`          | |
| `GL.STENCIL_VALUE_MASK`           | GLuint    | `0xFFFFFFFF` | Sets bit mask |
| `GL.STENCIL_BACK_FUNC`            | GLenum    | `GL.ALWAYS`  | |
| `GL.STENCIL_BACK_REF`             | GLint     | `0`          | |
| `GL.STENCIL_BACK_VALUE_MASK`      | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FAIL`                 | GLenum    | `GL.KEEP`    | stencil test fail action |
| `GL.STENCIL_PASS_DEPTH_FAIL`      | GLenum    | `GL.KEEP`    | depth test fail action |
| `GL.STENCIL_PASS_DEPTH_PASS`      | GLenum    | `GL.KEEP`    | depth test pass action |
| `GL.STENCIL_BACK_FAIL`            | GLenum    | `GL.KEEP`    | stencil test fail action, back |
| `GL.STENCIL_BACK_PASS_DEPTH_FAIL` | GLenum    | `GL.KEEP`    | depth test fail action, back |
| `GL.STENCIL_BACK_PASS_DEPTH_PASS` | GLenum    | `GL.KEEP`    | depth test pass action, back |

## Depth Test Parameters

After stencil tests, depth tests and writes are done, controlled by the following parameters:

| Function     | Description                              | Values                  | WebGL counterpart |
| ---------    | ----------------------------------       | ---                     | --- |
| `depthWriteEnabled`   | Whether depth buffer is updated | `boolean` **`true`**        | `gl.depthMask` |
| `depthCompare`        | If and how depth testing is done | **`always`**, `less-equal`, ...  | `gl.depthFunc` |


### Blending

| Function style        | Sets parameter(s)      |
| --------------------- | ---------------------- |
| [blendColor](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor)        | `GL.BLEND_COLOR`       |
| [blendEquation](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation)     | [`GL.BLEND_EQUATION_RGB`, `GL.BLEND_EQUATION_ALPHA`] |
| [blendFunc](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc)         | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`] |
| [blendFuncSeparate](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate) | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`, `GL.BLEND_DST_RGB`, `GL.BLEND_DST_ALPHA`] |

| Parameter                 | Type            | Default         | Description |
| ------------------------- | --------------- | --------------- | -------- |
| `GL.BLEND`                | GLboolean       | `false`         | Blending enabled |
| `GL.BLEND_COLOR`          | Float32Array(4) | `[0, 0, 0, 0]`  | |
| `GL.BLEND_EQUATION_RGB`   | GLenum          | `GL.FUNC_ADD`   | |
| `GL.BLEND_EQUATION_ALPHA` | GLenum          | `GL.FUNC_ADD`   | |
| `GL.BLEND_SRC_RGB`        | GLenum          | `GL.ONE`        | srcRgb |
| `GL.BLEND_SRC_ALPHA`      | GLenum          | `GL.ZERO`       | srcAlpha |
| `GL.BLEND_DST_RGB`        | GLenum          | `GL.ONE`        | dstRgb |
| `GL.BLEND_DST_ALPHA`      | GLenum          | `GL.ZERO`       | dstAlpha |


### Clear Color

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [clearColor](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor) | GL.COLOR_CLEAR_VALUE |

| Parameter              | Type            | Default  | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.COLOR_CLEAR_VALUE` | new Float32Array(4) | [0, 0, 0, 0] | . |


### Color Mask

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [colorMask](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask) | GL.COLOR_WRITEMASK |

| Parameter              | Type            | Default  | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.COLOR_WRITEMASK` | [GLboolean, GLboolean, GLboolean, GLboolean] | [true, true, true, true] | . |


### Dithering

| Parameter              | Type            | Default | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.DITHER` | GLboolean | `true` | Enable dithering of color components before they get written to the color buffer |

* Note: Dithering is driver dependent and typically has a stronger effect when the color components have a lower number of bits.



### PolygonOffset

Add small offset to fragment depth values (by factor × DZ + r × units)
Useful for rendering hidden-line images, for applying decals to surfaces,
and for rendering solids with highlighted edges.

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [polygonOffset](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset) | [GL.POLYGON_OFFSET_FACTOR, GL.POLYGON_OFFSET_UNITS] |

| Parameter                  | Type          | Default  | Description             |
| -------------------------- | ------------- | -------- | ----------------------- |
| `GL.POLYGON_OFFSET_FILL`   | GLboolean     |  `false` | . |
| `GL.POLYGON_OFFSET_FACTOR` | GLfloat       |      `0` | . |
| `GL.POLYGON_OFFSET_UNITS`  | GLfloat       |      `0` | . |

* Note: The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.


### Rasterization (WebGL 2)

Primitives are discarded immediately before the rasterization stage, but after the optional transform feedback stage. `gl.clear()` commands are ignored.

| Parameter                           | Type          | Default  | Description             |
| ----------------------------------- | ------------- | -------- | ----------------------- |
| `GL.RASTERIZER_DISCARD`             | GLboolean     | `false`  | Disable rasterization |


### Sampling

Specify multisample coverage parameters

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [sampleCoverage](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/sampleCoverage) | [`GL.SAMPLE_COVERAGE_VALUE`, `GL.SAMPLE_COVERAGE_INVERT`] |

| Parameter                          | Type          | Default  | Description             |
| ---------------------------------- | ------------- | -------- | ----------------------- |
| `GL_SAMPLE_COVERAGE`               | GLboolean | `false` | Activates the computation of a temporary coverage value determined by the alpha value. |
| `GL_SAMPLE_ALPHA_TO_COVERAGE`      | GLboolean | `false` | Activates ANDing the fragment's coverage with the temporary coverage value |
| `GL.SAMPLE_COVERAGE_VALUE`         | GLfloat   | 1.0     |  |
| `GL.SAMPLE_COVERAGE_INVERT`        | GLboolean | `false` |  |


### Scissor Test

Settings for scissor test and scissor box.

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [scissor](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor) | `GL.SCISSOR_BOX`                   |
| scissorTest | GL.SCISSOR_TEST |

| Parameter                          | Type          | Default  | Description             |
| ---------------------------------- | ------------- | -------- | ----------------------- |
| `GL.SCISSOR_TEST`                  | GLboolean     | `false`  |
| `GL.SCISSOR_BOX`                   | Int32Array(4) | [null, null, null, null]), // TBD |




## Viewport

Specifies the transformation from normalized device coordinates to
window/framebuffer coordinates. The maximum supported value, is defined by the
`GL.MAX_VIEWPORT_DIMS` limit.

| Function     | Parameters     |
| ------------ | -------------- |
| [viewport](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport) | `GL.VIEWPORT`  |

| Parameter                          | Type          | Default   | Description             |
| ---------------------------------- | ------------- | --------- | ----------------------- |
| `GL.VIEWPORT`                      | Int32Array(4) | [...] TBD | Viewport                |

Example:
```js
// Set viewport to maximum supported size
const maxViewport = getLimits(gl)[GL.MAX_VIEWPORT_DIMS];
setState(gl, {
  viewport: [0, 0, maxViewport[0], maxViewport[1]]
});
```


## Remarks

GPU State Management can be quite complicated.
* A large part of the WebGL API is devoted to parameters. When reading, querying individual values using GL constants is the norm, and when writing, special purpose functions are provided for most parameters. luma.gl supports both forms for both reading and writing parameters.
* Reading values from WebGL can be very slow if it requires a GPU roundtrip. To get around this, luma.gl reads values once, caches them and tracks them as they are changed through luma functions. The cached values can get out of sync if the context is shared outside of luma.gl.
* luma.gl's state management enables "conflict-free" programming, so that even when setting global state, one part of the code does not need to worry about whether other parts are changing the global state.
* Note that to fully support the conflict-free model and detect changes done e.g. in other WebGL libraries, luma.gl needs to hook into the WebGL context to track state changes.
