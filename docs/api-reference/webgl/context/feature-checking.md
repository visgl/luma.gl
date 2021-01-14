# Feature Checking

Provides WebGL feature detection.

WebGL capabilities can vary quite dramatically between browsers (from minimal WebGL 1 (e.g. headless-gl) to WebGL 1 with dozens of extensions to full WebGL 2, which also has a growing number of extensions). Unfortunately, the raw WebGL API sometimes expose the same functionalities through APIs that are slightly different and not exactly compatible.

To simplify detecting and working with conditionally available capabilities (or "features") luma.gl provides:

- A set of functions that enable you to check if the application is currently running on an environment that supports a certain feature (regardless of whether it is supported through e.g. WebGL 2 or a WebGL 1 extension).

In addition, luma.gl's WebGL classes transparently use WebGL extensions or WebGL 2 APIs as appropriate, meaning that the amount of conditional logic in application code can be kept to a minimum. Once you have established that a capability exists, luma.gl offers you one unified way to use it.

## Usage

Check if a feature is available (whether as a WebGL 1 or WebGL 2 extension or through WebGL 2)

```js
import {hasFeature, FEATURES} from '@luma.gl/webgl';
if (hasFeature(gl, FEATURES.INSTANCED_RENDERING)) {
   // Will work both on WebGL 1 (via extension) and WebGL 2 via the standard API
   program.draw({instanceCount: ..., ....});
}
```

Another example of feature detection

```js
import {hasFeature, FEATURES} from '@luma.gl/webgl';
// Checks if `Query` objects can do async queries of GPU timings
if (hasFeature(gl, FEATURES.TIMER_QUERY)) {
   ...
}
// Alternatively - do the same query using raw extensions
if (hasFeature(gl, 'EXT_disjoint_timer_query') || hasFeature(gl, 'EXT_disjoint_timer_query_webgl2')) {
   ...
}
```

There are a few additional capability query functions sprinkled through the luma.gl API. In particular, WebGL 2 specific classes have an `isSupported` method that duplicates some of the queryies that can be made using the capability system

```js
import {Query} from '@luma.gl/webgl';
if (Query.isSupported(gl)) {
  ...
}
```

## Functions

### hasFeature

Allows the app to query whether a capability is supported without being concerned about how it is being provided (WebGL 2, an extension etc)

- `gl` (`WebGLRenderingContext`) - gl context
- capability (`String`) - capability name (can be a webgl extension name or a luma.gl `FEATURES` constant).

### hasFeatures

Allows the app to query whether a capability is supported without being concerned about how it is being provided (WebGL 2, an extension etc)

- `gl` (`WebGLRenderingContext`) - gl context
- feature (`String`|`String[]`) - capability name (can be a webgl extension name or a luma.gl `FEATURES` constant).

### getFeatures

This function returns an object containing all available features.

## WebGL Feature Detection

### WebGL 2 Classes with some WebGL 1 support

Note that luma has a few WebGL 2 classes that **can** be instantiated under WebGL 1

- `VertexAttributeObject`. Can be instanitated under WebGL 1 if the commonly supported extension is available. Also, luma.gl treats the global vertex array as a "default" VertexArrayObject, so that can always be accessed.
- `Query` objects use GPU timing extensions if available. They can always be created but obviously queries will fail if capabilities are not present.
- `UniformBufferLayout` - this class does not create any WebGL resources, it just helps the application access memory in the layout format expected by WebGL 2 uniform buffers.

`VertexAttributeObject` and `Query` have a static `isSupported()` method that you can call instead of checking for WebGL 2.

### WebGL 2 Classes that only work in WebGL 2

A list of luma classes that can only be instantiated under WebGL 2:

- `Texture3D` - e.g for volumetric rendering
- `Texture2DArray` - an array of textures, e.g. a texture atlas
- `Sampler` - holds a separate set of texture sampler parameters
- `TransformFeedback` - holds a list of output buffers for shaders to write to.
- `Sync` -

Each of these classes has a static `isSupported()` method that you can call instead of checking for WebGL 2.

### WebGL 2-only Features

A partial list of features that are only available in WebGL 2:

- Non-power-of-2 textures - non-POT textures can have mipmaps in WebGL 2
- Sized texture formats -
- Integer based texture formats and attributes -
- Multi-Sampled renderbuffers -
- Guaranteed texture access in vertex shaders - WebGL 1 is not required to support this (although it often does)

### GLSL 3.00

- `textureSize` - query **size of texture** from within shaders
- `texelFetch` - access textures by **pixel** coordinates (0-width, 0-height) instead of **texel** coordinates (0-1)
- `inverse` and `transpose` Matrix operations available in GLSL
- loop restrictions removed

### Optional Feature Detection

The WebGL standard comes with an elaborate "extension" system allowing applications to check for the availability of features beyond the base WebGL 1 and WebGL 2 standards. These extensions tend to be rather technical, plus they have to be used differently in WebGL 1 and WebGL 2, so luma provides a simplified feature detection system. Following table lists all the available features, and their support under WebGL 1 and WebGL 2 , `NO` implies not supported, 'YES' implies supported and `*` implies supported through an extension.

Parameters to `hasFeatures`:

| `FEATURE`                                                                                     | WebGL 2 | WebGL 1 | Description                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **General WebGL Features**                                                                    |         |         |                                                                                                                                                                                                                                                                                                                          |
| `FEATURES.WEBGL2`                                                                             | **YES** | **NO**  | True for WebGL 2 Context                                                                                                                                                                                                                                                                                                 |
| `FEATURES.INSTANCED_RENDERING`                                                                | **YES** | \*      | Instanced rendering (via instanced vertex attributes) [`ANGLE_instanced_arrays`](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays)                                                                                                                                                                |
| `FEATURES.VERTEX_ARRAY_OBJECT`                                                                | **YES** | \*      | `VertexArrayObjects` can be created [`OES_vertex_array_object`](https://developer.mozilla.org/en-US/docs/Web/API/OES_vertex_array_object)                                                                                                                                                                                |
| `FEATURES.ELEMENT_INDEX_UINT32`                                                               | **YES** | \*      | 32 bit indices available for `GL.ELEMENT_ARRAY_BUFFER`s [`OES_element_index_uint`](https://developer.mozilla.org/en-US/docs/Web/API/OES_element_index_uint)                                                                                                                                                              |
| `FEATURES.BLEND_MINMAX`                                                                       | **YES** | \*      | `GL.MIN`, `GL.MAX` blending modes are available: [`EXT_blend_minmax`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_blend_minmax)                                                                                                                                                                                 |
| `FEATURES.TIMER_QUERY`                                                                        | \*      | \*      | [`Query`](/docs/api-reference/webgl/query.md) objects support asynchronous GPU timings [`EXT_disjoint_timer_query_webgl2`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query_webgl2/), [`EXT_disjoint_timer_query`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query)  |
| **`Texture`s and `Framebuffer`s**                                                             |         |         |                                                                                                                                                                                                                                                                                                                          |
| `FEATURES.TEXTURE_FLOAT`                                                                      | **YES** | \*      | Floating point (`Float32Array`) textures can be created and set as samplers (Note that filtering and rendering need to be queried separately, even in WebGL 2) [`OES_texture_float`](https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float)                                                                 |
| `FEATURES.TEXTURE_HALF_FLOAT`                                                                 | **YES** |         | Half float (`Uint16Array`) textures can be created and set as samplers [`OES_texture_half_float`](https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_half_float) [`WEBGL_color_buffer_float`](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_color_buffer_float)                                       |
| `FEATURES.MULTIPLE_RENDER_TARGETS`                                                            | **YES** | \*      | `Framebuffer`s can have multiple color attachments that fragment shaders can access, see `Framebuffer.drawBuffers` [`WEBGL_draw_buffers`](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_draw_buffers)                                                                                                           |
| `FEATURES.COLOR_ATTACHMENT_RGBA32F`                                                           | \*      | \*      | Floating point `Texture`s using the `GL.RGBA32F` format are renderable and readable [`EXT_color_buffer_float`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float) [`WEBGL_color_buffer_float`](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_color_buffer_float)                          |
| `FEATURES.COLOR_ATTACHMENT_FLOAT`                                                             | \*      | **NO**  | Floating point `Texture`s are renderable and readable, i.e. can be attached to `Framebuffer`s and written to from fragment shaders, and read from with `readPixels` etc. Note that the formats include `GL.RGBA32F`. [`EXT_color_buffer_float`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float) |
| `FEATURES.COLOR_ATTACHMENT_HALF_FLOAT`                                                        | \*      | **NO**  | Half float format `Texture`s are renderable and readable[`EXT_color_buffer_half_float`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_half_float)                                                                                                                                                    |
| `FEATURES.FLOAT_BLEND`                                                                        | \*      | \*      | Blending with 32-bit floating point color buffers[`EXT_float_blend`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend)                                                                                                                                                                                   |
| [`WEBGL_depth_texture`](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_depth_texture) |
| `FEATURES.TEXTURE_DEPTH_BUFFERS`                                                              | **YES** | \*      | Depth buffers can be stored in `Texture`s, e.g. for shadow map calculations                                                                                                                                                                                                                                              |
| `TEXTURE_FILTER_LINEAR_FLOAT`                                                                 | **YES** | \*      | Linear texture filtering for floating point textures [`OES_texture_float_linear`](https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float_linear)                                                                                                                                                             |
| `FEATURES.TEXTURE_FILTER_LINEAR_HALF_FLOAT`                                                   | **Yes** | \*      | Linear texture filtering for half float textures [`OES_texture_half_float_linear`](https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_half_float_linear)                                                                                                                                                       |
| `FEATURES.TEXTURE_FILTER_ANISOTROPIC`                                                         | \*      | \*      | Anisotropic texture filtering [`EXT_texture_filter_anisotropic`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_filter_anisotropic)                                                                                                                                                                        |
| `FEATURES.SRGB`                                                                               | **YES** | \*      | sRGB encoded rendering is available [`EXT_sRGB`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_sRGB)                                                                                                                                                                                                              |
| extensions\*\*                                                                                |         |         |                                                                                                                                                                                                                                                                                                                          |
| `FEATURES.SHADER_TEXTURE_LOD`                                                                 | `ES300` | \*      | Enables shader control of LOD [`EXT_shader_texture_lod`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_shader_texture_lod)                                                                                                                                                                                        |
| `FEATURES.FRAGMENT_SHADER_DRAW_BUFFERS`                                                       | `ES300` | \*      | Fragment shader can draw to multiple render targets [`WEBGL_draw_buffers`](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_draw_buffers)                                                                                                                                                                          |
| `FEATURES.FRAGMENT_SHADER_DEPTH`                                                              | `ES300` | \*      | Fragment shader can control fragment depth value [`EXT_frag_depth`](https://developer.mozilla.org/en-US/docs/Web/API/EXT_frag_depth)                                                                                                                                                                                     |
| `FEATURES.FRAGMENT_SHADER_DERIVATIVES`                                                        | `ES300` | \*      | Derivative functions are available in GLSL [`OES_standard_derivatives`](https://developer.mozilla.org/en-US/docs/Web/API/OES_standard_derivatives)                                                                                                                                                                       |

## Remarks

- WebGL 1 only supports one color buffer format (RBG32F is deprecated)
- WebGL 2 supports multiple color buffer formats
- Some extensions will not be enabled until they have been queries. luma always queries on startup to enable, app only needs to query again it wants to test platform.
- The capability detection system works regardless of whether the app is running in a browser or in headless mode under Node.js.
- Naturally, given that queries to driver and GPU are typically expensive in WebGL, the capabilities system will cache any queries.
