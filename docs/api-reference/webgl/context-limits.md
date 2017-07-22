# Capability Management

Provides WebGL feature detection and queries for max values.

WebGL capabilities can vary quite dramatically between browsers (from minimal WebGL1 (e.g. headless-gl) through WebGL1 with dozens of extensions through WebGL2, which also has a growing number of extensions). Unfortunately, the raw WebGL API does not exactly make it trivial to write code that dynamically uses available features.

To simplify detecting and working with conditionally available capabilities (or "features") luma.gl provides:
* A set of functions (e.g. `isWebGL2`, `getFeatures` and `hasFeatures`, described in this document) that enable you to check if the application is currently running on an environment that supports a certain feature (regardless of whether it is supported through e.g. WebGL2 or a WebGL1 extension).
* Definitions of all WebGL2 constants (whether defined by WebGL1, WebGL2 or extensions). This enables applications to directly query for any WebGL constant or limit without having to first determine what environment they are running on.
* Enables apps to use the WebGL2 constant definitions to query any parameters supported by WebGL2 or extensions regardless of whether current platform actually supports them (returning some kind of "sane" defaults, usually 0).

In addition, luma.gl's WebGL classes transparently use WebGL extensions or WebGL2 APIs as appropriate, meaning that the amount of conditional logic in application code can be kept to a minimum. Once you have established that a capability exists, luma.gl offers you one unified way to use it.


## Usage

Check if a feature is available (whether as a WebGL1 or WebGL2 extension or through WebGL2)
```js
import {checkCapability, FEATURES} from 'luma.gl';
if (checkCapabilty(gl, FEATURES.INSTANCED_RENDERING)) {
   // Will work both on WebGL1 (via extension) and WebGL2 via the standard API
   program.draw({instanceCount: ..., ....});
}
```

Another example of feature detection
```js
import {hasFeature, FEATURES} from 'luma.gl';
// Checks if `Query` objects can do async queries of GPU timings
if (hasFeature(gl, FEATURES.TIMER_QUERY)) {
   ...
}
// Alternatively - do the same query using raw extensions
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

A major check that can be done is whether you are working with a `WebGL2RenderingContext`. An advantage of using this method is that it can correctly identify a luma.gl debug context (which is not a subclass of a `WebGL2RendringContext`).

`isWebGL2(gl)`

* `gl` (WebGLRenderingContext) - gl context
Returns true if the context is a WebGL2RenderingContext.

See also: `isWebGLRenderingContext`.


### hasFeature

Allows the app to query whether a capability is supported without being concerned about how it is being provided (WebGL2, an extension etc)

* `gl` (`WebGLRenderingContext`) - gl context
* capability (`String`) - capability name (can be a webgl extension name or a luma.gl `FEATURES` constant).

### hasFeatures

Allows the app to query whether a capability is supported without being concerned about how it is being provided (WebGL2, an extension etc)

* `gl` (`WebGLRenderingContext`) - gl context
* feature (`String`|`String[]`) - capability name (can be a webgl extension name or a luma.gl `FEATURES` constant).


## WebGL Feature Detection

### WebGL2 Classes with some WebGL1 support

Note that luma has a few WebGL2 classes that **can** be instantiated under WebGL1
* `VertexAttributeObject`. Can be instanitated under WebGL1 if the commonly supported extension is available. Also, luma.gl treats the global vertex array as a "default" VertexArrayObject, so that can always be accessed.
* `Query` objects use GPU timing extensions if available. They can always be created but obviously queries will fail if capabilities are not present.
* `UniformBufferLayout` - this class does not create any WebGL resources, it just helps the application access memory in the layout format expected by WebGL2 uniform buffers.

`VertexAttributeObject` and `Query` have a static `isSupported()` method that you can call instead of checking for WebGL2.


### WebGL2 Classes that only work in WebGL2

A list of luma classes that can only be instantiated under WebGL2:
* `Texture3D` - e.g for volumetric rendering
* `Texture2DArray` - an array of textures, e.g. a texture atlas
* `Sampler` - holds a separate set of texture sampler paramters
* `TransformFeedback` - holds a list of output buffers for shaders to write to.
* `Sync` -

Each of these classes has a static `isSupported()` method that you can call instead of checking for WebGL2.


### WebGL2-only Features

A partial list of features that are only available in WebGL2:

* Non-power-of-2 textures - non-POT textures can have mipmaps in WebGL2
* Sized texture formats -
* Integer based texture formats and attributes -
* Multi-Sampled renderbuffers -
* Guaranteed texture access in vertex shaders - WebGL1 is not required to support this (although it often does)


### GLSL 3.00

* `textureSize` - query **size of texture** from within shaders
* `texelFetch` - access textures by **pixel** coordinates (0-width, 0-height) instead of **texel** coordinates (0-1)
* `inverse` and `transpose` Matrix operations available in GLSL
* loop restrictions removed


### Optional Feature Detection

The WebGL standard comes with an elaborate "extension" system allowing applications to check for the availability of features beyond the base WebGL1 and WebGL2 standards. These extensions tend to be rather technical, plus they have to be used differently in WebGL1 and WebGL2, so luma provides a simplified feature detection system.

Parameters to `hasFeatures`:

| `FEATURE`                    | WebGL2  | WebGL1 | Description |
| ---                          | ---     | ---    | ---         |
| **General WebGL Features**   |         |        | |
| `FEATURES.INSTANCED_RENDERING`        | **YES** | *      | Instanced rendering (via instanced vertex attributes) [`ANGLE_instanced_arrays`]() |
| `FEATURES.VERTEX_ARRAY_OBJECT`        | **YES** | *      | `VertexArrayObjects` can be created [`OES_vertex_array_object`]() |
| `FEATURES.ELEMENT_INDEX_UINT32`       | **YES** | *      | 32 bit indices available for `GL.ELEMENT_ARRAY_BUFFER`s [`OES_element_index_uint`]() |
| `FEATURES.BLEND_MINMAX`               | **YES** | *      | `GL.MIN`, `GL.MAX` blending modes are available: [`EXT_blend_minmax`]() |
| `FEATURES.TIMER_QUERY`                | *       | *      | [`Query`]() objects support asynchronous GPU timings [`EXT_disjoint_timer_query_webgl2`](), [`EXT_disjoint_timer_query`]() |
| **`Texture`s and `Framebuffer`s** |    |        | |
| `FEATURES.TEXTURE_FLOAT`              | **YES** | *      | Floating point (`Float32Array`) textures can be created and set as samplers (Note that filtering and rendering need to be queried separately, even in WebGL2)  [`OES_texture_float`]() |
| `FEATURES.TEXTURE_HALF_FLOAT`         | **YES** |        | Half float (`Uint16Array`) textures can be created and set as samplers [`OES_texture_half_float`]() [`WEBGL_color_buffer_float`]() |
| `FEATURES.MULTIPLE_RENDER_TARGETS`    | **YES** | *      | `Framebuffer`s can have multiple color attachments that fragment shaders can access, see `Framebuffer.drawBuffers` [`WEBGL_draw_buffers`]() |
| `FEATURES.COLOR_ATTACHMENT_RGBA32F`   |         | *      | Floating point `Texture`s using the `GL.RGBA32F` format are renderable and readable [`EXT_color_buffer_float`]() [`WEBGL_color_buffer_float`]() |
| `FEATURES.COLOR_ATTACHMENT_FLOAT`     | *       | **NO** | Floating point `Texture`s are renderable and readable, i.e. can be attached to `Framebuffer`s and written to from fragment shaders, and read from with `readPixels` etc. Note that the formats include `GL.RGBA32F`. [`EXT_color_buffer_float`]() |
| `FEATURES.COLOR_ATTACHMENT_HALF_FLOAT`| *       | **NO** | Half float format `Texture`s are renderable and readable[`EXT_color_buffer_half_float`]() |
| `WEBGL_depth_texture`]() |
| `FEATURES.TEXTURE_DEPTH_BUFFERS`      | **YES** | *      | Depth buffers can be stored in `Texture`s, e.g. for shadow map calculations [| **GLSL | `TEXTURE_FILTER_LINEAR_FLOAT`      | **Yes** | * | Linear texture filtering for floating point textures [`OES_texture_float_linear`]() |
| `FEATURES.TEXTURE_FILTER_LINEAR_HALF_FLOAT` | **Yes** | * | Linear texture filtering for half float textures [`OES_texture_half_float_linear`]() |
| `FEATURES.TEXTURE_FILTER_ANISOTROPIC` | *       | *      | Anisotropic texture filtering [`EXT_texture_filter_anisotropic`]() |
| `FEATURES.SRGB`                       | **YES** | *      | sRGB encoded rendering is available [`EXT_sRGB`]() |
| extensions**          |         |        | |
| `FEATURES.SHADER_TEXTURE_LOD`         | `ES300` | *      | Enables shader control of LOD [`EXT_shader_texture_lod`]() |
| `FEATURES.FRAGMENT_SHADER_DRAW_BUFFERS` | `ES300` | *      | Fragment shader can draw to multiple render targets [`WEBGL_draw_buffers`]() |
| `FEATURES.FRAGMENT_SHADER_DEPTH`      | `ES300` | *  | Fragment shader can control fragment depth value [`EXT_frag_depth`]() |
| `FEATURES.FRAGMENT_SHADER_DERIVATIVES`| `ES300` | *      | Derivative functions are available in GLSL [`OES_standard_derivatives`]() |


## Remarks

* WebGL1 only supports one color buffer format (RBG32F is deprecated)
* WebGL2 supports multiple color buffer formats
* Some extensions will not be enabled until they have been queries. luma always queries on startup to enable, app only needs to query again it wants to test platform.
* The capability detection system works regardless of whether the app is running in a browser or in headless mode under Node.js.
* Naturally, given that queries to driver and GPU are typically expensive in WebGL, the capabilities system will cache any queries.



# WebGL Limits

In addition to capabilities, luma.gl can also query the context for all limits.

| Limits                               | WebGL2 | WebGL1 | Description |
| ---                                  | ---    | ---    | --- |
| `GL.ALIASED_LINE_WIDTH_RANGE`        |        | [1, 1] | |
| `GL.ALIASED_POINT_SIZE_RANGE`        |        | [1, 1] | |
| `GL.MAX_TEXTURE_SIZE`                | 2048   | 64     | |
| `GL.MAX_CUBE_MAP_TEXTURE_SIZE`       |        | 16     | |
| `GL.MAX_TEXTURE_IMAGE_UNITS`         |        | 8      | |
| `GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS`|        | 8      | |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS`  |        | 0      | |
| `GL.MAX_RENDERBUFFER_SIZE`           |        | 1      | |
| `GL.MAX_VARYING_VECTORS`             |        | 8      | |
| `GL.MAX_VERTEX_ATTRIBS`              |        | 8      | |
| `GL.MAX_VERTEX_UNIFORM_VECTORS`      |        | 128    | |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS`    |        | 16     | |
| `GL.MAX_VIEWPORT_DIMS`               |        | [0, 0] | |
| `GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT`  |  1.0   | 1.0    | ['EXT_texture_filter_anisotropic']() |

| WebGL2 Limits                        | WebGL2 | WebGL1 (mock) | Description
| ---                                  | ---    | ---           | --- |
| `GL.MAX_3D_TEXTURE_SIZE`             | `256`  | `0`    | |
| `GL.MAX_ARRAY_TEXTURE_LAYERS`        | `256`  | `0`    | |
| `GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL`   | `0`    | `0`    | |
| `GL.MAX_COLOR_ATTACHMENTS`           | `4`    | `0`    | |
| `GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS`| `0`|`0` | |
| `GL.MAX_COMBINED_UNIFORM_BLOCKS`     | `0`    | `0`    | |
| `GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS`|`0`| `0`   | |
| `GL.MAX_DRAW_BUFFERS`                | `4`    | `0`    | |
| `GL.MAX_ELEMENT_INDEX`               | `0`    | `0`    | |
| `GL.MAX_ELEMENTS_INDICES`            | `0`    | `0`    | |
| `GL.MAX_ELEMENTS_VERTICES`           | `0`    | `0`    | |
| `GL.MAX_FRAGMENT_INPUT_COMPONENTS`   | `0`    | `0`    | |
| `GL.MAX_FRAGMENT_UNIFORM_BLOCKS`     | `0`    | `0`    | |
| `GL.MAX_FRAGMENT_UNIFORM_COMPONENTS` | `0`    | `0`    | |
| `GL.MAX_PROGRAM_TEXEL_OFFSET`        | `0`    | `0`    | |
| `GL.MAX_SAMPLES`                     | `0`    | `0`    | |
| `GL.MAX_SERVER_WAIT_TIMEOUT`         | `0`    | `0`    | |
| `GL.MAX_TEXTURE_LOD_BIAS`            | `0`    | `0`    | |
| `GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS`|`0`|`0`| |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS` |`0`| `0` | |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS`|`0`|`0`| |
| `GL.MAX_UNIFORM_BLOCK_SIZE`          | `0`    | `0`    | |
| `GL.MAX_UNIFORM_BUFFER_BINDINGS`     | `0`    | `0`    | |
| `GL.MAX_VARYING_COMPONENTS`          | `0`    | `0`    | |
| `GL.MAX_VERTEX_OUTPUT_COMPONENTS`    | `0`    | `0`    | |
| `GL.MAX_VERTEX_UNIFORM_BLOCKS`       | `0`    | `0`    | |
| `GL.MAX_VERTEX_UNIFORM_COMPONENTS`   | `0`    | `0`    | |
| `GL.MIN_PROGRAM_TEXEL_OFFSET`        | `0`    | `0`    | |
| `GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT` | `0`    | `0`    | |


### getGLContextInfo(gl)

| 'GL.VENDOR' | |
| 'GL.RENDERER' | |
| 'GL.UNMASKED_VENDOR_WEBGL' | |
| 'GL.UNMASKED_RENDERER_WEBGL' | |
| 'GL.VERSION' | |
| 'GL.SHADING_LANGUAGE_VERSION' | |


### getContextLimits(gl)

Each limit is an object with multiple values
- `value` - the value of the limit in the current context
- `webgl1` - the minimum allowed value of the limit for WebGL1 contexts
- `webgl2` - the minimum allowed value of the limit for WebGL2 contexts


### getContextCaps(gl)


### getContextInfo(gl)

* vendor: info[GL.UNMASKED_VENDOR_WEBGL] || info[GL.VENDOR],
* renderer: info[GL.UNMASKED_RENDERER_WEBGL] || info[GL.RENDERER],
* version: info[GL.VERSION],
* shadingLanguageVersion: info[GL.SHADING_LANGUAGE_VERSION],
* info,
* caps: getContextCaps(gl),
* limits,
* webgl1MinLimits: gl.luma.webgl1MinLimits,
* webgl2MinLimits: gl.luma.webgl2MinLimits
