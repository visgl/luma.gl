# Capability Management

luma.gl offers a set of functions that simplify run-time detection of which specific WebGL features are available to your program.

To simplify capability detection luma.gl provides:
* Definitions of all WebGL constants (whether defined by WebGL1, WebGL2 or extensions). This enables applications to directly query for any WebGL constant without having to first determine what environment they are running on.
* A query API for capabilities (WebGL extensions) that determines whether a feature is supported regardless of whether it is supported through WebGL2 or a WebGL1 extension.
* A query API for limits (e.g. implementation dependent maximum values for various resources, such as maximum texture size) that allows apps to query all parameters supported by WebGL2 and WebGL extensions regardless of whether current platform actually knows about them. Querying parameters that are not known by the platform will return a value indicating that the feature is not available (`0` or similar).
* It is also possible to query for the guaranteed minimums for various limits (might be less than the current platform supports).

Also note that all luma.gl WebGL classes transparently use WebGL extensions or WebGL2 APIs as appropriate, meaning that the amount of conditional logic in application code can be kept to a minimum.


## Usage

Import definitions for all WebGL constants (WebGL1, WebGL2, extensions)
```js
import {GL} from 'luma.gl';
const gl = ...;
const limit = gl.MAX_COLOR_ATTACHMENTS // Evaluates to 'undefined' in a WebGL1 context
const limit = GL.MAX_COLOR_ATTACHMENTS; // Always works
```


Check a certain limit (whether through an extension under WebGL1 or through WebGL2)
```js
import {getLimit, GL} from 'luma.gl';
if (getLimit(gl, GL.MAX_COLOR_ATTACHMENTS)) {
   ...
}
```

Check a certain limit's minimal allowed value (per the WebGL standards) under webgl1 and webgl2
```js
import {getLimit, GL} from 'luma.gl';
if (getLimit(gl, GL.MAX_COLOR_ATTACHMENTS, {value: 'webgl1-min'})) {
   ...
}
if (getLimit(gl, GL.MAX_COLOR_ATTACHMENTS, {value: 'webgl2-min'})) {
   ...
}
```

There are a few additional capability query functions sprinkled through the luma.gl API. In particular, WebGL2 specific classes have an `isSupported` method that duplicates some of the queryies that can be made using the capability system
```js
import {Query} from 'luma.gl';
if (Query.isSupported(gl)) {
  ...
}

## Background

Check if the application is running on an environment that supports a certain capability (regardless of whether through an extension or ).


The capabilities accessible to your WebGL application is influenced by three things:
* The type of WebGLRenderingContext you have created (i.e. WebGL1 or WebGL2)
* What WebGL extensions are available (which, perhaps surprisingly, will be different on the same platform depending on whether you created a WebGL1 or WebGL2 context).
* The limits on various resources imposed by the current platform.

Querying for all of these things, and adapting your code to use different APIs whether you are using running on WebGL1 with an extension or WebGL2 can be surprisingly complicated.


## Functions

## isWebGL2Context

The main check that can be done is whether you are working with a `WebGL2RenderingContext`. An advantage of using this method is that it can correctly identify a luma.gl debug context (which is not a subclass of a `WebGL2RendringContext`).

`isWebGL2Context(gl)`

* `gl` (WebGLRenderingContext) - gl context
Returns true if the context is a WebGL2RenderingContext.

See also: `isWebGLRenderingContext`.


## getLimit

Queries the gl context for an implementation defined limit. A GL constant specifies which limit is being requested. At the application's option, the returned limit can either be the implementations actual limit, or the minimum limit defined by the WebGL standard.

`getLimit(gl, limit)`
`getLimit(gl, limit, {value: 'min-webgl1'})`

* `gl` (WebGLRenderingContext) - gl context
* `limit` - See table below for valid values
* `opts.value` (String) - Can be `min-webgl1` or `min-webgl2`

### WebGL1 Limits
| Limit | WebGL1 Min | WebGL2 Min | Type | Description |
| --- | --- | --- | --- |
| `GL.ALIASED_LINE_WIDTH_RANGE`         | `[1, 1]` | `[1, 1]` | `Float32Array` | |
| `GL.ALIASED_POINT_SIZE_RANGE`         | `[1, 1]` | `[1, 1]` | `Float32Array` | |
| `GL.MAX_TEXTURE_SIZE`                 | `64`     | `2048`   | `GLint`  | |
| `GL.MAX_CUBE_MAP_TEXTURE_SIZE`        | `16`     | `tbd`    | `GLint`  | |
| `GL.MAX_TEXTURE_IMAGE_UNITS`          | `8`      | `tbd`    | `GLint`  | |
| `GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS` | `8`      | `tbd`    | `GLint`  | |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS`   | `0`      | `tbd`    | `GLint`  | |
| `GL.MAX_RENDERBUFFER_SIZE`            | `1`      | `tbd`    | `GLint`  | |
| `GL.MAX_VARYING_VECTORS`              | `8`      | `tbd`    | `GLint`  | |
| `GL.MAX_VERTEX_ATTRIBS`               | `8`      | `tbd`    | `GLint`  | |
| `GL.MAX_VERTEX_UNIFORM_VECTORS`       | `128`    | `tbd`    | `GLint`  | |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS`     | `16`     | `tbd`    | `GLint`  | |
| `GL.MAX_VIEWPORT_DIMS`                | `[0, 0]` | `[0, 0]` |`Int32Array` | |

### Extension Limits
| Limit | WebGL1 | WebGL2 | Description |
| `GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT`   | `1.0` | `1.0` |  `GLfloat` | extension: 'EXT_texture_filter_anisotropic' |

### WebGL2 Limits
| Limit | WebGL1 Min | WebGL2 Min | Description |
| --- | --- | --- | --- |
| `GL.MAX_3D_TEXTURE_SIZE`              | `0`    | `256` | `GLint` | |
| `GL.MAX_ARRAY_TEXTURE_LAYERS`         | `0`    | `256` | `GLint` | |
| `GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL`    | `0`    | `0`   | `GLint64` | |
| `GL.MAX_COLOR_ATTACHMENTS`            | `0`    | `4`   | `GLint` | |
| `GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS` | `0` | `0` | `GLint64` | |
| `GL.MAX_COMBINED_UNIFORM_BLOCKS`      | `0`    | `0` | `GLint` | |
| `GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS` | `0` | `0` | `GLint64` | |
| `GL.MAX_DRAW_BUFFERS`                 | `0`    | `4`   | `GLint` | |
| `GL.MAX_ELEMENT_INDEX`                | `0`    | `0`   | `GLint64` | |
| `GL.MAX_ELEMENTS_INDICES`             | `0`    | `0`   | `GLint` | |
| `GL.MAX_ELEMENTS_VERTICES`            | `0`    | `0`   | `GLint` | |
| `GL.MAX_FRAGMENT_INPUT_COMPONENTS`    | `0`    | `0`   | `GLint` | |
| `GL.MAX_FRAGMENT_UNIFORM_BLOCKS`      | `0`    | `0`   | `GLint` | |
| `GL.MAX_FRAGMENT_UNIFORM_COMPONENTS`  | `0`    | `0`   | `GLint` | |
| `GL.MAX_PROGRAM_TEXEL_OFFSET`         | `0`    | `0`   | `GLint` | |
| `GL.MAX_SAMPLES`                      | `0`    | `0`   | `GLint` | |
| `GL.MAX_SERVER_WAIT_TIMEOUT`          | `0`    | `0`   | `GLint64` | |
| `GL.MAX_TEXTURE_LOD_BIAS`             | `0`    | `0`   | `GLfloat` | |
| `GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` | `0`    | `0` | `GLint` | |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS`       | `0`    | `0` | `GLint` | |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS`    | `0`    | `0` | `GLint` | |
| `GL.MAX_UNIFORM_BLOCK_SIZE`           | `0`    | `0`   | `GLint64` | |
| `GL.MAX_UNIFORM_BUFFER_BINDINGS`      | `0`    | `0`   | `GLint` | |
| `GL.MAX_VARYING_COMPONENTS`           | `0`    | `0`   | `GLint` | |
| `GL.MAX_VERTEX_OUTPUT_COMPONENTS`     | `0`    | `0`   | `GLint` | |
| `GL.MAX_VERTEX_UNIFORM_BLOCKS`        | `0`    | `0`   | `GLint` | |
| `GL.MAX_VERTEX_UNIFORM_COMPONENTS`    | `0`    | `0`   | `GLint` | |
| `GL.MIN_PROGRAM_TEXEL_OFFSET`         | `0`    | `0`   | `GLint` | |
| `GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT`  | `0`    | `0`   | `GLint` | |


## hasCapability

Allows the app to query whether a capability is supported without being concerned about how it is being provided (WebGL2, an extension etc)

* `gl` (`WebGLRenderingContext`) - gl context
* capability (`String`) - capability name (can be a webgl extension name or a luma.gl `CAPS` constant).


Parameters to the Capability interface:

| Capability | Enables | Description | WebGL2 |
| --- | --- | --- |
| `CAPS.DISJOINT_TIMER_QUERY`, `EXT_disjoint_timer_query`, `EXT_disjoint_timer_query_webgl2` | Use either to check if the `Query` object can be used to check for async queries of GPU timings | |
| `CAPS.VERTEX_ARRAY_OBJECT`, `OES_vertex_array_object` | Use this to check if `VertexArrayObject`s are available. | Yes |
| `CAPS.INSTANCED_ARRAYS`, `ANGLE_instanced_arrays` | check if instanced draw and instance divisors are supported | Yes |
| `CAPS.TEXTURE_FLOAT`, `OES_texture_float` | Checks if Float32Array textures are available | Yes |
| `CAPS.TEXTURE_HALF_FLOAT`, `OES_texture_half_float` | Enables Uint16Array / HALF_FLOAT_OES textures | Yes |
| `CAPS.STANDARD_DERIVATIVES`, `OES_standard_derivatives` | Checks if derivative functions are available in GLSL | |
| `CAPS.DEPTH_TEXTURE`, `WEBGL_depth_texture` | Checks if depth buffers can be stored in `Texture`s (in addition to `RenderBuffer`s | |
| `CAPS.ELEMENT_INDEX_UINT`, `OES_element_index_uint` | Checks if Uint32Array ELEMENTS (Note luma always queries on startup to enable, app only needs to query again it wants to test platform) | Yes |
| `CAPS.FRAG_DEPTH`, `EXT_frag_depth` | Check if fragment shader can control depth value | |
| `CAPS.DRAW_BUFFERS`, `WEBGL_draw_buffers` | Check if fragment shaders can draw to multiple framebuffers | Yes |
| `CAPS.TEXTURE_FLOAT_HALF_LINEAR`, `OES_texture_half_float_linear` | Enables linear filter for half float textures | |
| `CAPS.BLEND_MINMAX`, `EXT_blend_minmax` | Checks if MIN_MAX blending functions are available | Yes |
| `CAPS.SHADER_TEXTURE_LOD`, `EXT_shader_texture_lod` | enables shader control of LOD |
| `CAPS.FILTER_ANISOTROPIC`, `EXT_texture_filter_anisotropic` | Enables anisotropic filtering | |
| `CAPS.TEXTURE_FLOAT_LINEAR`, `OES_texture_float_linear | Enables linear filter for float textures |
| `CAPS.FBO_RENDER_MIPMAP`, `OES_fbo_render_mipmap` | Render to specific texture mipmap level |
| `CAPS.sRGB`, `EXT_sRGB` | Check if sRGB encoded rendering is available | Yes |
| `CAPS.COLOR_BUFFER_HALF_FLOAT`. `EXT_color_buffer_half_float` | Checks if framebuffer can render to half float color buffer | |
| `CAPS.COLOR_BUFFER_FLOAT`, `EXT_color_buffer_float` | framebuffer render to float color buffer | |
| `CAPS.COLOR_BUFFER_FLOAT_FORMATS`, `WEBGL_color_buffer_float | frame buffer render of various floating point format | |

## Compressed Texture Format Extensions
| Extension | Enables | Description | WebGL2 |
| --- | --- | --- |
| `WEBGL_compressed_texture_s3tc` | Certain S3TC compressed texture formats | N/A |
| `WEBGL_compressed_texture_atc` | Certain AMD compressed texture formats | N/A |
| `WEBGL_compressed_texture_pvrtc` | Certain IMG compressed texture formats | N/A |
| `WEBGL_compressed_texture_etc1` | Certain compressed texture formats | N/A |
| `WEBGL_compressed_texture_etc` | Certaincompressed texture formats | N/A |
| `WEBGL_compressed_texture_astc` | Certain compressed texture formats | N/A |
| `WEBGL_compressed_texture_s3tc_srgb` | Certain compressed texture formats | N/A |

## Note on Other Extensions


## Remarks

* The capability detection system works regardless of whether the app is running in a browser or in headless mode under Node.js.
* Naturally, given that queries to driver and GPU are typically expensive in WebGL, the capabilities system will cache any queries.
