# Capability Management

WebGL capabilities can vary quite dramatically between browsers, and the raw WebGL API does not exactly make it trivial to write code that dynamically uses available features.

So, to simplify capability detection luma.gl provides:
* A set of functions (like `isWebGL2`, `getFeatures` and `hasFeatures`, described in this document) that enable you to check if the application is currently running on an environment that supports a certain capability.
* Enhancements to the webg API for capabilities that determines whether a feature is supported regardless of whether it is supported through e.g. WebGL2 or a WebGL1 extension.
* Enhancements to the WebGL query API (`gl.getParamater`, `getParameters`) for "limits" (i.e. implementation dependent maximum values for various resources, such as maximum texture size) that allows apps to query any parameters supported by WebGL2 or extensions regardless of whether current platform actually supports them.
* Definitions of all WebGL constants (whether defined by WebGL1, WebGL2 or extensions). This enables applications to directly query for any WebGL constant without having to first determine what environment they are running on.
* In addition, luma.gl WebGL classes transparently use WebGL extensions or WebGL2 APIs as appropriate, meaning that the amount of conditional logic in application code can be kept to a minimum. Once you have established that a capability exists, luma.gl offers you one unified way to use it.


## Usage

Feature detection
```js
import {hasFeature, FEATURES} from 'luma.gl';
// Checks if `Query` objects can do async queries of GPU timings
if (hasFeature(gl, FEATURES.TIMER_QUERY)) {
   ...
}
if (hasFeature(gl, 'EXT_disjoint_timer_query') || hasFeature(gl, 'EXT_disjoint_timer_query_webgl2')) {
   ...
}
```

Import definitions for all WebGL constants (whether WebGL1, WebGL2, extensions)
```js
import {GL} from 'luma.gl';
const gl = ...;
const limit = gl.MAX_COLOR_ATTACHMENTS // Evaluates to 'undefined' in a WebGL1 context
const limit = GL.MAX_COLOR_ATTACHMENTS; // Always works
```


Check a certain limit (whether through an extension under WebGL1 or through WebGL2)
```js
import {getLimit, GL} from 'luma.gl';
const limit = getLimit(gl, GL.MAX_COLOR_ATTACHMENTS); // In WebGL1, works and returns 0
if (limit > 0) {
   ...
}
```

There are a few additional capability query functions sprinkled through the luma.gl API. In particular, WebGL2 specific classes have an `isSupported` method that duplicates some of the queryies that can be made using the capability system
```js
import {Query} from 'luma.gl';
if (Query.isSupported(gl)) {
  ...
}


## Functions


### isWebGL2

The main check that can be done is whether you are working with a `WebGL2RenderingContext`. An advantage of using this method is that it can correctly identify a luma.gl debug context (which is not a subclass of a `WebGL2RendringContext`).

`isWebGL2(gl)`

* `gl` (WebGLRenderingContext) - gl context
Returns true if the context is a WebGL2RenderingContext.

See also: `isWebGLRenderingContext`.


### getLimit

Queries the gl context for an implementation defined limit. A GL constant specifies which limit is being requested. At the application's option, the returned limit can either be the implementations actual limit, or the minimum limit defined by the WebGL standard.

`getLimit(gl, limit)`
`getLimit(gl, limit, {value: 'min-webgl1'})`

* `gl` (WebGLRenderingContext) - gl context
* `limit` - See table below for valid values
* `opts.value` (String) - Can be `min-webgl1` or `min-webgl2`


### hasFeature

Allows the app to query whether a capability is supported without being concerned about how it is being provided (WebGL2, an extension etc)

* `gl` (`WebGLRenderingContext`) - gl context
* capability (`String`) - capability name (can be a webgl extension name or a luma.gl `CAPS` constant).


## WebGL Capabilities

The luma.gl capability interface provides a set of feature constants that are more aligned with the luma.gl API than the raw WebGL extension strings.

| Capability                      | WebGL2 | WebGL1 | Description |
| ---                             | ---    | ---    | ---  |
| `CAPS.VERTEX_ARRAY_OBJECT`     | Yes    | *      | Checks if `VertexArrayObject`s are available. | `OES_vertex_array_object` |
| `CAPS.TIMER_QUERIES`            | *      | *      | Checks if `Query` objects can do async queries of GPU timings (`EXT_disjoint_timer_query`, `EXT_disjoint_timer_query_webgl2`) |
| `CAPS.INSTANCED_RENDERING`      | Yes    | *      | Checks if instanced drawing and instance divisors are supported (`ANGLE_instanced_arrays`) |
| `CAPS.MULTIPLE_RENDER_TARGETS`  | Yes    | *      | Check if fragment shaders can draw to multiple framebuffers (`WEBGL_draw_buffers`) |
| `CAPS.ELEMENT_INDEX_UINT32`     | Yes    | *      | Checks if `Uint32Array` ELEMENTS are available (`OES_element_index_uint`) |
| `CAPS.COLOR_ENCODING_SRGB`      | Yes    | *      | Checks if sRGB encoded rendering is available (`EXT_sRGB`) |
| `CAPS.BLEND_EQUATION_MINMAX`    | Yes    | *      | Checks if `GL.MIN` and `GL.MAX` blend equations are available (`EXT_blend_minmax`) |
| `CAPS.TEXTURE_DEPTH`            | Yes    | *      | Checks if depth buffers can be stored in `Texture`s (in addition to `RenderBuffer`s (`WEBGL_depth_texture`) |
| `CAPS.TEXTURE_FLOAT`            | Yes    | *      | Checks if `Float32Array` textures are available (`OES_texture_float`) |
| `CAPS.TEXTURE_HALF_FLOAT`,      | Yes    | *      | Enables `Uint16Array` / HALF_FLOAT_OES textures (`OES_texture_half_float`) |
| `CAPS.TEXTURE_FILTER_ANISOTROPIC`   | *  | *      | Enables anisotropic filtering (`EXT_texture_filter_anisotropic`) |
| `CAPS.TEXTURE_FILTER_LINEAR_FLOAT`  | *  | *      | Enables linear filter for float textures (`OES_texture_float_linear`)|
| `CAPS.TEXTURE_FILTER_LINEAR_FLOAT_HALF` | * | *   | Enables linear filter for half float textures (`OES_texture_half_float_linear`) |
| `CAPS.COLOR_BUFFER_RGBA32F`     | *      | *      | Frame buffer render of various floating point format (`WEBGL_color_buffer_float`) |
| `CAPS.COLOR_BUFFER_FLOAT`       | *      | No     | Framebuffer render to float color buffer (`EXT_color_buffer_float`)|
| `CAPS.COLOR_BUFFER_HALF_FLOAT`  | *      | No     | Checks if framebuffer can render to half float color buffer (`EXT_color_buffer_half_float`) |
| `CAPS.GLSL_FRAG_DATA`           | Yes    | *      | Checks if fragment shader write to `gl_FragData` (`WEBGL_draw_buffers`) |
| `CAPS.GLSL_FRAG_DEPTH`          | Yes    | *      | Checks if fragment shader can control depth value (`EXT_frag_depth`) |
| `CAPS.GLSL_DERIVATIVES`         | Yes    | *      | Checks if derivative functions are available in GLSL (`OES_standard_derivatives`) |
| `CAPS.GLSL_TEXTURE_LOD`         | Yes    | *      | Checks if shader control of LOD (`EXT_shader_texture_lod`) |


## WebGL Limits

| Limit                                 | WebGL2   | WebGL1   | Type    | Description |
| --- | --- | --- | --- |
| `GL.ALIASED_LINE_WIDTH_RANGE`         | `[1,1]`  | `[1, 1]` | `Float32Array` | |
| `GL.ALIASED_POINT_SIZE_RANGE`         | `[1,1]`  | `[1, 1]` | `Float32Array` | |
| `GL.MAX_TEXTURE_SIZE`                 | `2048`   | `64`     | `GLint`  | |
| `GL.MAX_CUBE_MAP_TEXTURE_SIZE`        | `tbd`    | `16`     | `GLint`  | |
| `GL.MAX_TEXTURE_IMAGE_UNITS`          | `tbd`    | `8`      | `GLint`  | |
| `GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS` | `tbd`    | `8`      | `GLint`  | |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS`   | `tbd`    | `0`      | `GLint`  | |
| `GL.MAX_RENDERBUFFER_SIZE`            | `tbd`    | `1`      | `GLint`  | |
| `GL.MAX_VARYING_VECTORS`              | `tbd`    | `8`      | `GLint`  | |
| `GL.MAX_VERTEX_ATTRIBS`               | `tbd`    | `8`      | `GLint`  | |
| `GL.MAX_VERTEX_UNIFORM_VECTORS`       | `tbd`    | `128`    | `GLint`  | |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS`     | `tbd`    | `16`     | `GLint`  | |
| `GL.MAX_VIEWPORT_DIMS`                | `[0,0]`  | `[0, 0]` | `Int32Array` | |
| `GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT`   | `1.0`*   | `1.0`*   | `GLfloat` | extension: 'EXT_texture_filter_anisotropic' |
| `GL.MAX_3D_TEXTURE_SIZE`              | `256`    | `0` N/A  | `GLint` | |
| `GL.MAX_ARRAY_TEXTURE_LAYERS`         | `256`    | `0` N/A  | `GLint` | |
| `GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL`    | `0`      | `0` N/A  | `GLint64` | |
| `GL.MAX_COLOR_ATTACHMENTS`            | `4`      | `0` N/A  | `GLint` | |
| `GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS`   | `0` | `0` | `GLint64` | |
| `GL.MAX_COMBINED_UNIFORM_BLOCKS`      | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS`     | `0` | `0` | `GLint64` | |
| `GL.MAX_DRAW_BUFFERS`                 | `4`      | `0` N/A  | `GLint` | |
| `GL.MAX_ELEMENT_INDEX`                | `tbd`    | *        | `GLint64` | |
| `GL.MAX_ELEMENTS_INDICES`             | `tbd`    | *        | `GLint` | |
| `GL.MAX_ELEMENTS_VERTICES`            | `tbd`    | *        | `GLint` | |
| `GL.MAX_FRAGMENT_INPUT_COMPONENTS`    | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_FRAGMENT_UNIFORM_BLOCKS`      | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_FRAGMENT_UNIFORM_COMPONENTS`  | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_PROGRAM_TEXEL_OFFSET`         | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_SAMPLES`                      | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_SERVER_WAIT_TIMEOUT`          | `tbd`    | `0` N/A  | `GLint64` | |
| `GL.MAX_TEXTURE_LOD_BIAS`             | `tbd`    | `0` N/A  | `GLfloat` | |
| `GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` | `0` | `0` N/A | GLint` | |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS`       | `0` | `0` N/A | GLint` | |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS`    | `0` | `0` N/A | GLint` | |
| `GL.MAX_UNIFORM_BLOCK_SIZE`           | `tbd`    | `0` N/A  | `GLint64` | |
| `GL.MAX_UNIFORM_BUFFER_BINDINGS`      | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_VARYING_COMPONENTS`           | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_VERTEX_OUTPUT_COMPONENTS`     | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_VERTEX_UNIFORM_BLOCKS`        | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MAX_VERTEX_UNIFORM_COMPONENTS`    | `tbd`    | `0` N/A  | `GLint` | |
| `GL.MIN_PROGRAM_TEXEL_OFFSET`         | `tbd`    | `0` N/A  | `GLint` | |
| `GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT`  | `tbd`    | `0` N/A  | `GLint` | |


## Remarks

* The capability detection system works regardless of whether the app is running in a browser or in headless mode under Node.js.
* Given that queries to driver and GPU are typically expensive in WebGL, the capabilities system will cache any queries.
* The capabilities accessible to your WebGL application is influenced by three things:
    * The type of WebGLRenderingContext you have created (i.e. WebGL1 or WebGL2)
    * What WebGL extensions are available (which, perhaps surprisingly, will be different on the same platform depending on whether you created a WebGL1 or WebGL2 context).
    * The limits on various resources imposed by the current platform.
* Querying for all of these things, and adapting your code to use different APIs whether you are using running on WebGL1 with an extension or WebGL2 can be surprisingly complicated.
