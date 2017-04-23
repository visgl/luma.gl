# GL State

# Overview

luma.gl manages WebGL state and enables 'stateless' WebGL programming,
in which settings are passed to rendering commands rather than being set
directly on the global state.

Remarks:
* A large part of the WebGL API is devoted to settings.
  When reading, querying individual values using GL constants is the norm,
  and when writing, special purpose functions are provided for most settings.
  luma.gl supports both forms for both reading and writing settings.
* Reading values from WebGL can be very slow if it requires a GPU roundtrip.
  To get around this, luma.gl reads values once, caches them and tracks
  them as they are changed through luma functions.
  The cached values can get out of sync if the context is shared outside
  of luma.gl.


## Overview

## Getters and Setters

### `getGLParameter`(gl, key)

Sets value with key to context.
Value may be "normalized" (in case a short form is supported). In that case
the normalized value is retured.

* gl {WebGLRenderingContext} - context
* key {String}  - parameter name
* value {*}  - parameter value
Returns {*} - "normalized" parameter value after assignment

### `setGLParameter(gl, key, value)`

Sets value with key to context.
Value may be "normalized" (in case a short form is supported). In that case
the normalized value is retured.

* `gl` {WebGLRenderingContext} - context
* `key` {String} - parameter name
* `value` {*} - parameter value
Returns {*} - "normalized" parameter value after assignment


### `withGLState`(gl, {frameBuffer, ...params}, func)
Executes a function with gl states temporarily set
Exception safe



## Parameters

### Blending

| Function style      | Sets parameter(s)      |
| ------------------- | ---------------------- |
| [blendColor]()        | `GL.BLEND_COLOR`       |
| [blendEquation]()     | [`GL.BLEND_EQUATION_RGB`, `GL.BLEND_EQUATION_ALPHA`] |
| [blendFunc]()         | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`] |
| [blendFuncSeparate]() | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`, `GL.BLEND_DST_RGB`, `GL.BLEND_DST_ALPHA`] |

| `GL.BLEND`                | GLboolean       | `false`         | Blending enabled |
| `GL.BLEND_COLOR`          | Float32Array(4) | `[0, 0, 0, 0]` | |
| `GL.BLEND_EQUATION_RGB`   | GLenum          | `GL.FUNC_ADD` | |
| `GL.BLEND_EQUATION_ALPHA` | GLenum          | `GL.FUNC_ADD` | |
| `GL.BLEND_SRC_RGB`        | GLenum          | `GL.ONE` | srcRgb |
| `GL.BLEND_SRC_ALPHA`      | GLenum          | `GL.ZERO` | srcAlpha |
| `GL.BLEND_DST_RGB`        | GLenum          | `GL.ONE` | dstRgb |
| `GL.BLEND_DST_ALPHA`      | GLenum          | `GL.ZERO` | dstAlpha |


### Clear Color

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [clearColor]() | GL.COLOR_CLEAR_VALUE |

| `GL.COLOR_CLEAR_VALUE` | new Float32Array(4) | [0, 0, 0, 0] |


### Color Mask

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [colorMask]() | GL.COLOR_WRITEMASK |

| `GL.COLOR_WRITEMASK` | [GLboolean, GLboolean, GLboolean, GLboolean] | [true, true, true, true] | |


### Depth Test

| Function style   | Sets parameters        |
| ---------------- | ---------------------- |
| [clearDepth]()     | `GL.DEPTH_CLEAR_VALUE` |
| [depthFunc]()      | `GL.DEPTH_FUNC`        |
| [depthRange]()     | `GL.DEPTH_RANGE`       |
| [depthMask]()      | `GL.DEPTH_WRITEMASK`   |

| Parameter              | Type            | Default | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.DEPTH_TEST`        | GLboolean       | false |  |
| `GL.DEPTH_CLEAR_VALUE` | GLfloat         | true |  |
| `GL.DEPTH_FUNC`        | GLenum          | null |  |
| `GL.DEPTH_RANGE`       | Float32Array(2) | [null, null] // TBD |  |
| `GL.DEPTH_WRITEMASK`   | GLboolean       | null |  |


### Derivative Hints (WebGL2 or extension)

Requires WebGL2 or `OES_standard_derivatives`.

| `GL.FRAGMENT_SHADER_DERIVATIVE_HINT` | GLenum     | `GL.DONT_CARE` | Accuracy of derivates in built-in GLSL functions |

Hints
| `GL.FASTEST`   | The most efficient behavior should be used |
| `GL.NICEST`    | The most correct or the highest quality option should be used |
| `GL.DONT_CARE` | There is no preference for this behavior |


### Dithering

| `GL.DITHER` | GLboolean | `true` | Enable dithering of color components before they get written to the color buffer |

Remarks:
* Dithering is driver dependent and typically has a stronger effect when the
  color components have a lower number of bits.


### Face Culling

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [cullFace]() | `GL.CULL_FACE_MODE` |
| [frontFace]() | `GL.FRONT_FACE` |

| `GL.CULL_FACE` |  GLboolean | false | Enable face culling |
| `GL.CULL_FACE_MODE` | GLenum | `GL.BACK` | Which face to cull |
| `GL.FRONT_FACE` | GLenum | `GL.CCW` | Which face is front |

Cull Face Modes
| `GL.FRONT`          | Clock wise         |
| `GL.BACK`           | Counter clock wise |
| `GL.FRONT_AND_BACK` | No polygons are drawn (but LINES and POINTS are) |

Face orientation
| `GL.CW`  | Clock wise         |
| `GL.CCW` | Counter clock wise |


### MipmapHint

Hint for quality of images generated with glGenerateMipmap

| `GL.GENERATE_MIPMAP_HINT` | GLenum | `GL.DONT_CARE` |

Hints
| `GL.FASTEST`   | The most efficient behavior should be used |
| `GL.NICEST`    | The most correct or the highest quality option should be used |
| `GL.DONT_CARE` | There is no preference for this behavior |


### LineWidth

Line widths are between 1 and GL.ALIASED_LINE_WIDTH_RANGE.

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [lineWidth](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glLineWidth.xml) | `GL.LINE_WIDTH` |

| `GL.LINE_WIDTH` | GLfloat | 1 |

Example:
```js
// Set viewport to maximum supported size
const lineWidthRange = getLimits(gl)[GL.ALIASED_LINE_WIDTH_RANGE];
setState(gl, {
  lineWidth: lineWidthRange[1]
});
```

Remarks:
* Line widths will be clamped to [1, `GL.ALIASED_LINE_WIDTH_RANGE`].
  This is different from `gl.lineWidth` which generates errors on lineWidth 0.
* Caution: line aliasing is driver dependent and `GL.LINES` may not
  give desired results.


### PolygonOffset

Add small offset to fragment depth values (by factor × DZ + r × units)
Useful for rendering hidden-line images, for applying decals to surfaces,
and for rendering solids with highlighted edges.

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [polygonOffset](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glPolygonOffset.xml) | [GL.POLYGON_OFFSET_FACTOR, GL.POLYGON_OFFSET_UNITS] |

| `GL.POLYGON_OFFSET_FILL`   | GLboolean | `false` |
| `GL.POLYGON_OFFSET_FACTOR` | GLfloat   |     `0` |
| `GL.POLYGON_OFFSET_UNITS`  | GLfloat   |     `0` |


Remarks:
* Polygon offsets are loosely specified and results can thus be
  driver dependent.


### Sampling

Specify multisample coverage parameters

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [sampleCoverage](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glSampleCoverage.xml) | [`GL.SAMPLE_COVERAGE_VALUE`, `GL.SAMPLE_COVERAGE_INVERT`] |

| `GL_SAMPLE_COVERAGE` | GLboolean | `false` | Activates the computation of a temporary coverage value determined by the alpha value. |
| `GL_SAMPLE_ALPHA_TO_COVERAGE` | GLboolean | `false` | Activates ANDing the fragment's coverage with the temporary coverage value |
| `GL.SAMPLE_COVERAGE_VALUE`   | GLfloat   | 1.0     |  |
| `GL.SAMPLE_COVERAGE_INVERT`  | GLboolean | `false` |  |


## Rasterization (**WebGL2**)

Primitives are discarded immediately before the rasterization stage,
but after the optional transform feedback stage.
`gl.clear()` commands are ignored.

| `GL.RASTERIZER_DISCARD` | GLboolean | `false` | Disable rasterization |


### Scissor Test

Setting scissor box value will enable scissor testing.

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [scissor](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glScissor.xml) | `GL.SCISSOR_BOX`                   |

| Parameter                          | Type          | Default  | Description             |
| ---------------------------------- | ------------- | -------- | ----------------------- |
| `GL.SCISSOR_TEST`                  | GLboolean     | false    |
| `GL.SCISSOR_BOX`                   | Int32Array(4) | [null, null, null, null]), // TBD |


### Stencil Test

Setting any value will enable stencil testing (i.e. enable `GL.STENCIL_TEST`).

| Function | Parameters Set |
| -------- | -------------- |
| [clearStencil](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilMask.xml) | `GL.STENCIL_CLEAR_VALUE` |
| [stencilMask](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilMask.xml) | [`GL.STENCIL_WRITEMASK`] |
| [stencilMaskSeparate](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilMaskSeparate.xml) | [`GL.STENCIL_WRITEMASK`, `GL.STENCIL_BACK_WRITEMASK`] |
| [stencilFunc](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilFunc.xml) | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`] |
| [stencilFuncSeparate](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilFuncSeparate.xml) | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`, `GL.STENCIL_BACK_FUNC`, `GL.STENCIL_BACK_REF`, `GL.STENCIL_BACK_VALUE_MASK` ]
| [stencilOp](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilOp.xml) | |
| [stencilOpSeparate](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilOpSeparate.xml) | |

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

Test functions
| `GL.NEVER`    | Never pass |
| `GL.LESS`     | Pass if (ref & mask) <  (stencil & mask) |
| `GL.EQUAL`    | Pass if (ref & mask) =  (stencil & mask) |
| `GL.LEQUAL`   | Pass if (ref & mask) <= (stencil & mask) |
| `GL.GREATER`  | Pass if (ref & mask) >  (stencil & mask) |
| `GL.NOTEQUAL` | Pass if (ref & mask) != (stencil & mask) |
| `GL.GEQUAL`   | Pass if (ref & mask) >= (stencil & mask) |
| `GL.ALWAYS`   | Always pass |

Stencil ops
| `GL.KEEP`      | Keeps the current value |
| `GL.ZERO`      | Sets the stencil buffer value to 0 |
| `GL.REPLACE`   | Sets the stencil buffer value to the reference value as specified by `stencilFunc` |
| `GL.INCR`      | Increments the current stencil buffer value. Clamps to the maximum representable unsigned value |
| `GL.INCR_WRAP` | Increments the current stencil buffer value. Wraps to zero when incrementing the maximum representable unsigned value |
| `GL.DECR`      | Decrements current stencil buffer value. Clamps to 0 |
| `GL.DECR_WRAP` | Decrements  current stencil buffer value, wraps to maximum unsigned value when decrementing 0 |
| `GL.INVERT`    | Inverts the current stencil buffer value bitwise |

Action when the stencil test fails, front and back.
  stencil test fail action,
  depth test fail action,
  pass action


## Viewport

Specifies the transformation from normalized device coordinates to
window/framebuffer coordinates. The maximum supported value, is defined by the
`GL.MAX_VIEWPORT_DIMS` limit.

| Function     | Parameters     |
| ------------ | -------------- |
| [viewport]() | `GL.VIEWPORT`  |

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

## Pixel Pack/Unpack Modes

Specifies how bitmaps are written to and read from memory

| Parameter                             | Type          | Default  | Description             |
| ------------------------------------- | ------------- | -------- | ----------------------- |
| `GL.PACK_ALIGNMENT`                   | GLint         |        4 | Byte alignment of pixel row data in memory (1,2,4,8 bytes) when storing data |
| `GL.UNPACK_ALIGNMENT`                 | GLint         |        4 | Byte alignment of pixel row data in memory (1,2,4,8 bytes) when reading data |
| `GL.UNPACK_FLIP_Y_WEBGL`              | GLboolean     |  `false` | Flip source data along its vertical axis |
| `GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL`   | GLboolean     |  `false` | Multiplies the alpha channel into the other color channels |
| `GL.UNPACK_COLORSPACE_CONVERSION_WEBGL` | GLenum      | `GL.BROWSER_DEFAULT_WEBGL` | Use default or no color space conversion. |


## Pixel Pack/Unpack Modes **WebGL2**

Specifies how bitmaps are written to and read from memory

| Parameter                          | Type          | Default  | Description               |
| ---------------------------------- | ------------- | -------- | ------------------------- |
| `GL.PACK_ROW_LENGTH`               | GLint         |      `0` | Number of pixels in a row |
| `GL.PACK_SKIP_PIXELS`              | GLint         |      `0` | Number of pixels skipped before the first pixel is written into memory |
| `GL.PACK_SKIP_ROWS`                | GLint         |      `0` | Number of rows of pixels skipped before first pixel is written to memory |
| `GL.UNPACK_ROW_LENGTH`             | GLint         |      `0` | Number of pixels in a row. |
| `GL.UNPACK_IMAGE_HEIGHT`           | GLint         |      `0` | Image height used for reading pixel data from memory |
| `GL.UNPACK_SKIP_PIXELS`            | GLint         |      `0` | Number of pixel images skipped before first pixel is read from memory |
| `GL.UNPACK_SKIP_ROWS`              | GLint         |      `0` | Number of rows of pixels skipped before first pixel is read from memory |
| `GL.UNPACK_SKIP_IMAGES`            | GLint         |      `0` | Number of pixel images skipped before first pixel is read from memory |
