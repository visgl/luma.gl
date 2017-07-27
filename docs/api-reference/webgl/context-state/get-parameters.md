# getParameters, getParamter, setParameters, setParameter

luma.gl simplifies the usage of WebGL parameters by providing a unified API for setting and getting values. Any GL parameter can be queried or set using `getParameters` and `setParameters` (no need to keep track of what underlying WebGL calls are required), and luma.gl also provide *setting names* that allow the normal WebGL setter functions (like `gl.blendEquation` or `gl.clearColor`) to be specified as keys in a `setParameters` call.

In addition, state queries are done towards cached values and are thus much faster than working directly with the WebGL API, where synchronous WebGL queries can be a performance bottleneck.

The following functions are provided:
* `getParameter` - Returns the value(s) of a GL context parameter
* `getParameters` - Returns the values of some or all GL context parameters
* `setParameters` - Sets a the value(s) of the specified GL context parameters

## Usage

Get a global parameter value using a WebGL GLenum
```js
const value = getParameter(gl, gl.DEPTH_TEST);
```

Set a global parameter value using a WebGL GLenum
```js
const value = setParameters(gl, {
  [gl.DEPTH_TEST]: true
});
```

Set a global parameter value using a luma.gl setting function name
```js
const value = setParameters(gl, {
  depthTest: true
});
```

Get all gl parameter values (values will be an object map keyed with parameter names)
```js
const values = getParameters(gl);
```

## Methods

### getParameter

Gets the value(s) of a single gl context parameter.

```js
getParameter(gl, pname)
```

* `gl` {WebGLRenderingContext} - context
* `pname` {GLenum}  - parameter name, a GL parameter constant
Returns {*} - value(s) of this parameter


### getParameters

Gets the values of a gl context parameter.

```js
getParameters(gl, values)
```

* `gl` {WebGLRenderingContext} - context
* `values`= {Object | GLenum[] | null}  - parameters, either as keys in object or elements of array. Defaults to all parameters.
Returns {Object} - object with keys and values corresponding to supplied parameter names and the current values of those parameters.


### setParameters

Sets a number of parameters.

```js
setParameters(gl, {key: value, ...})
```

* `gl` {WebGLRenderingContext} - context
* `key` {String} - parameter names, (, either )luma.gl setting name or a GL parameter constants
* `value` {*} - parameter value
Returns {*} - "normalized" parameter value after assignment

Note:
* If both luma.gl setting names and GL parameter constants representing the same value are submitted the results are undefined.
* value may be "normalized" (in case a short form is supported). In that case the normalized value is returned.

## Parameters

Describes luma.gl setting names and values

### Blending

| Function style        | Sets parameter(s)      |
| --------------------- | ---------------------- |
| [blendColor](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor)        | `GL.BLEND_COLOR`       |
| [blendEquation](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation)     | [`GL.BLEND_EQUATION_RGB`, `GL.BLEND_EQUATION_ALPHA`] |
| [blendFunc](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc)         | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`] |
| [blendFuncSeparate](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquationSeparate) | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`, `GL.BLEND_DST_RGB`, `GL.BLEND_DST_ALPHA`] |

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


### Depth Test

| Function style   | Sets parameters        |
| ---------------- | ---------------------- |
| [clearDepth](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth)     | `GL.DEPTH_CLEAR_VALUE` |
| [depthFunc](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc)      | `GL.DEPTH_FUNC`        |
| [depthRange](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthRange)     | `GL.DEPTH_RANGE`       |
| [depthMask](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthMask)      | `GL.DEPTH_WRITEMASK`   |

| Parameter              | Type            | Default | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.DEPTH_TEST`        | GLboolean       | false |  |
| `GL.DEPTH_CLEAR_VALUE` | GLfloat         | true |  |
| `GL.DEPTH_FUNC`        | GLenum          | null |  |
| `GL.DEPTH_RANGE`       | Float32Array(2) | [null, null] // TBD |  |
| `GL.DEPTH_WRITEMASK`   | GLboolean       | null |  |


### Derivative Hints (WebGL2 or extension)

Requires WebGL2 or `OES_standard_derivatives`.

| Parameter              | Type            | Default | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.FRAGMENT_SHADER_DERIVATIVE_HINT` | GLenum     | `GL.DONT_CARE` | Accuracy of derivates in built-in GLSL functions |


#### Hints

| Value          | Description        |
| -------------- | ---------------------- |
| `GL.FASTEST`   | The most efficient behavior should be used |
| `GL.NICEST`    | The most correct or the highest quality option should be used |
| `GL.DONT_CARE` | There is no preference for this behavior |


### Dithering

| Parameter              | Type            | Default | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.DITHER` | GLboolean | `true` | Enable dithering of color components before they get written to the color buffer |

* Note: Dithering is driver dependent and typically has a stronger effect when the color components have a lower number of bits.


### Face Culling

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [cullFace](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace)  | `GL.CULL_FACE_MODE` |
| [frontFace](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace) | `GL.FRONT_FACE` |

| Parameter              | Type            | Default | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.CULL_FACE`         | GLboolean | `false` | Enable face culling |
| `GL.CULL_FACE_MODE`    | GLenum    | `GL.BACK` | Which face to cull |
| `GL.FRONT_FACE`        | GLenum    | `GL.CCW` | Which face is front |

#### Cull Face Modes

| Value               | Description            |
| ------------------- | ---------------------- |
| `GL.FRONT`          | Clock wise             |
| `GL.BACK`           | Counter clock wise     |
| `GL.FRONT_AND_BACK` | No polygons are drawn (but LINES and POINTS are) |

#### Face orientation

| Value          | Description        |
| -------------- | ------------------ |
| `GL.CW`        | Clock wise         |
| `GL.CCW`       | Counter clock wise |


### MipmapHint

Hint for quality of images generated with glGenerateMipmap

| Parameter              | Type            | Default | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.GENERATE_MIPMAP_HINT` | GLenum | `GL.DONT_CARE` | . |

#### Mipmap Hints

| Value          | Description            |
| -------------- | ---------------------- |
| `GL.FASTEST`   | The most efficient behavior should be used |
| `GL.NICEST`    | The most correct or the highest quality option should be used |
| `GL.DONT_CARE` | There is no preference for this behavior |


### LineWidth

Line widths are between 1 and GL.ALIASED_LINE_WIDTH_RANGE.

| Function  | Sets parameters                    |
| --------- | ---------------------------------- |
| [lineWidth](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth) | `GL.LINE_WIDTH` |

| Parameter              | Type            | Default | Description |
| ---------------------- | --------------- | -------- | -------- |
| `GL.LINE_WIDTH` | GLfloat | 1 | . |

Example:
```js
// Set viewport to maximum supported size
const lineWidthRange = getLimits(gl)[GL.ALIASED_LINE_WIDTH_RANGE];
setState(gl, {
  lineWidth: lineWidthRange[1]
});
```

* Note: Line widths will be clamped to [1, `GL.ALIASED_LINE_WIDTH_RANGE`]. This is different from `gl.lineWidth` which generates errors on lineWidth 0.
* Caution: line aliasing is driver dependent and `GL.LINES` may not give desired results.


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


### Rasterization (WebGL2)

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


### Stencil Test

Setting any value will enable stencil testing (i.e. enable `GL.STENCIL_TEST`).

| Function | Parameters Set |
| -------- | -------------- |
| [clearStencil](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil) | `GL.STENCIL_CLEAR_VALUE` |
| [stencilMask](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask) | [`GL.STENCIL_WRITEMASK`] |
| [stencilMaskSeparate](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMaskSeparate) | [`GL.STENCIL_WRITEMASK`, `GL.STENCIL_BACK_WRITEMASK`] |
| [stencilFunc](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc) | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`] |
| [stencilFuncSeparate](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFuncSeparate) | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`, `GL.STENCIL_BACK_FUNC`, `GL.STENCIL_BACK_REF`, `GL.STENCIL_BACK_VALUE_MASK` ]
| [stencilOp](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp) | [`GL.STENCIL_FAIL`, `GL.STENCIL_FAIL_DEPTH_FAIL`, `GL.STENCIL_FAIL_DEPTH_PASS`]|
| [stencilOpSeparate](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOpSeparate) | [`GL.STENCIL_FAIL`, `GL.STENCIL_FAIL_DEPTH_FAIL`, `GL.STENCIL_FAIL_DEPTH_PASS`, `GL.STENCIL_BACK_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_PASS`]|

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

#### Stencil Test Functions

Values for `GL.STENCIL_TEST`

| Value          | Description            |
| -------------- | ---------------------- |
| `GL.NEVER`     | Never pass |
| `GL.LESS`      | Pass if (ref & mask) <  (stencil & mask) |
| `GL.EQUAL`     | Pass if (ref & mask) =  (stencil & mask) |
| `GL.LEQUAL`    | Pass if (ref & mask) <= (stencil & mask) |
| `GL.GREATER`   | Pass if (ref & mask) >  (stencil & mask) |
| `GL.NOTEQUAL`  | Pass if (ref & mask) != (stencil & mask) |
| `GL.GEQUAL`    | Pass if (ref & mask) >= (stencil & mask) |
| `GL.ALWAYS`    | Always pass |

#### Stencil Operations

| Value          | Description            |
| -------------- | ---------------------- |
| `GL.KEEP`      | Keeps the current value |
| `GL.ZERO`      | Sets the stencil buffer value to 0 |
| `GL.REPLACE`   | Sets the stencil buffer value to the reference value as specified by `stencilFunc` |
| `GL.INCR`      | Increments the current stencil buffer value. Clamps to the maximum representable unsigned value |
| `GL.INCR_WRAP` | Increments the current stencil buffer value. Wraps to zero when incrementing the maximum representable unsigned value |
| `GL.DECR`      | Decrements current stencil buffer value. Clamps to 0 |
| `GL.DECR_WRAP` | Decrements  current stencil buffer value, wraps to maximum unsigned value when decrementing 0 |
| `GL.INVERT`    | Inverts the current stencil buffer value bitwise |

Action when the stencil test fails, front and back.
* stencil test fail action,
* depth test fail action,
* pass action


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


## Remarks

WebGL State Management can be quite complicated.
* A large part of the WebGL API is devoted to parameters. When reading, querying individual values using GL constants is the norm, and when writing, special purpose functions are provided for most parameters. luma.gl supports both forms for both reading and writing parameters.
* Reading values from WebGL can be very slow if it requires a GPU roundtrip. To get around this, luma.gl reads values once, caches them and tracks them as they are changed through luma functions. The cached values can get out of sync if the context is shared outside of luma.gl.
* luma.gl's state management enables "conflict-free" programming, so that even when setting global state, one part of the code does not need to worry about whether other parts are changing the global state.
* Note that to fully support the conflict-free model and detect changes done e.g. in other WebGL libraries, luma.gl needs to hook into the WebGL context to track state changes.
