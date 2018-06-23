# WebGL Extensions

This section provides an overview of available WebGL extensions. It describes luma's builtin support for extensions (and note that even if no built-in support is provided, the application can always work directly with any extensions it needs). The Khronos group's official list of [WebGL Extensions](https://www.khronos.org/registry/webgl/extensions/) is intimidatingly long, but it can be digested more easily by categorizing them into a few basic categories.

Many extensions are used automatically by luma.gl to polyfill WebGL2 functionality on WebGL1 devices.

## General Extensions

These extensions expose optional general capability that was not included in the initial standard perhaps due to performance or security concerns.

| Extension | Enables | luma.gl support |
| ---       | ---     | ---             |
| [WEBGL_shared_resources](https://www.khronos.org/registry/webgl/WEBGL_shared_resources/) | Share resource between WebGL contexts | N/A |
| [WEBGL_security_sensitive_resources](https://www.khronos.org/registry/webgl/WEBGL_security_sensitive_resources/) | Cross-origin resource loading | N/A |


## Debug Extensions

These extensions expose additional information and capabilities that help debug and profile a WebGL program. luma.gl carefully uses these extensions under the hood to provide a better debug experience.

| Extension | Enables | luma.gl support |
| ---       | ---     | ---             |
| [WEBGL_lose_context](https://www.khronos.org/registry/webgl/extensions/WEBGL_lose_context/) | Simulate context loss | N/A |
| [WEBGL_debug_renderer_info](https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/) | Returns strings identifying GPU | glGetDebugInfo, logged to console on startup |
| WEBGL_debug_shaders | Gives access to translated shader source | `Shader` class method |
| EXT_disjoint_timer_query | Enables async queries of GPU timings | Used to implement `Query` under WebGL1 |
| EXT_disjoint_timer_query_webgl2 | Enables async queries of GPU timings | Built into WebGL2 `Query` object |


## WebGL1 Extensions

These extensions expose various OpenGL ES 3.0 features that are often available on the target devices that run the OpenGL ES 2.0 based WebGL1 standard today.

Note that many of these extensions are no longer available in WebGL2 as the functionality they enable is provided by default in WebGL2 (which requires an OpenGL ES 3.0 compliant device).

| Extension                   | Enables | luma.gl support |
| ---                         | ---     | ---             |
| `OES_vertex_array_object`   | `VertexArray` in WebGL1 | Used as WebGL2 polyfill for `VertexArray` under WebGL1. Note that luma.gl also has a "client side" implmentation of this extenion which is used in case the extension is not available (e.g. under headless gl). |
| `ANGLE_instanced_arrays`    | instanced draw functions in WebGL1 | luma's draw function automatically uses this extension when required |
| `OES_texture_float`         | Enables Float32Array textures | |
| `OES_texture_half_float`    | Enables Uint16Array / HALF_FLOAT_OES textures | |
| `OES_standard_derivatives`  | Enables derivative functions in GLSL | |
| `WEBGL_depth_texture`       | Enables storing depth buffers in textures | |
| `OES_element_index_uint`    | Querying enables Uint32Array ELEMENTS | luma queries on startup to enable, app needs to query again it wants to test platform |
| `EXT_frag_depth`            | Enables fragment shader to control depth value | |
| `WEBGL_draw_buffers`        | Enables fragment shaders to draw to multiple framebuffers | |
| `OES_texture_half_float_linear` | Enables linear filter for half float textures | |
| `EXT_blend_minmax`          | Extends blending function | Polyfills WebGL2 MIN and MAX blending modes |
| `EXT_shader_texture_lod`    | enables shader control of LOD | |
| `EXT_texture_filter_anisotropic` | Enables anisotropic filtering | |
| `OES_texture_float_linear`  | Enables linear filter for float textures | |
| `OES_fbo_render_mipmap`     | Render to specific texture mipmap level | |
| `EXT_sRGB`                  | sRGB encoded rendering | |
| `EXT_color_buffer_half_float` | framebuffer render to half float color buffer | |


## WebGL2 Extensions

These extensions expose various OpenGL ES 3.1 and 3.2 features that are often available on target devices that run the OpenGL ES 3.0 based WebGL2 standard today. These extensions can bring OpenGL ES 3.1 or 3.2 capabilities to WebGL2 contexts, if the device supports them.

| Extension | Enables | luma.gl support |
| ---       | ---     | ---             |
| EXT_color_buffer_float | framebuffer render to float color buffer | |
| WEBGL_color_buffer_float | frame buffer render of various floating point format | |


## Proposed Extensions

Khronos lists a couple of proposed extensions. They will be considered by luma.gl as they become available in browsers.

| Extension                         | Enables | luma.gl support |
| ---                               | ---     | ---             |
| `EXT_clip_cull_distance` (WebGL2) | hardware clip/cull planes (ES3.2) | N/A |
| `EXT_float_blend`                 | 32 bit color blending | N/A |
| `EXT_texture_storage`             | texture storage effiency | N/A |
| `WEBGL_debug`                     | Debug events | N/A |
| `WEBGL_dynamic_texture`           | frequently changin textures | N/A |
| `WEBGL_subarray_uploads`          | Efficient buffer update | N/A |


## Compressed Texture Format Extensions

Used to query if the GPU supports specific proprietary compressed texture formats.

The primary advantage of compressed texture formats is that in contrast to JPGs or PNGs, they do not have to be decompressed to be used by the GPU. As a non-scientific guideline, compressed texture formats might achieve about 4x compression, compared to say 16x compression for JPEG. So while they are usually slower to load, but they could allow 4x more textures to be stored in the same amount of GPU memory.

The main issue of compressed texture formats is that they tend to be highly propietary (patent-encumbered) and there tends to be royalty requirements when using them. 
Note that (presumably due to patent issues), finding a compressed texture format which is supported across a range of target devices can be challenging.

To side-step patent issues when using these formats an application would typically:

1. generate these in external commercial applications (which have already licensed any supported formats).
2. load them in binary form without touching the content
3. Pass them directly to a texture, so that they are processed inside the GPU driver (which also has licensed the formats).

For these reasons, luma.gl leaves the support and handling of compressed texture formats to the application.

| Extension                            | Enables | luma.gl support |
| ---                                  | ---     | --- |
| `WEBGL_compressed_texture_s3tc`      | Certain S3TC compressed texture formats | N/A |
| `WEBGL_compressed_texture_atc`       | Certain AMD compressed texture formats | N/A |
| `WEBGL_compressed_texture_pvrtc`     | Certain IMG compressed texture formats | N/A |
| `WEBGL_compressed_texture_etc1`      | Certain compressed texture formats | N/A |
| `WEBGL_compressed_texture_etc`       | Certain compressed texture formats | N/A |
| `WEBGL_compressed_texture_astc`      | Certain compressed texture formats | N/A |
| `WEBGL_compressed_texture_s3tc_srgb` | Certain compressed texture formats | N/A |
