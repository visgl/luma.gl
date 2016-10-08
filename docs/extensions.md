---
layout: docs
title: WebGL Extensions
categories: [Documentation]
---

This section describes luma's builtin support for WebGL extensions.

While the Khronos group's official list of
[WebGL Extensions](https://www.khronos.org/registry/webgl/extensions/)
is intimidatingly long, the extensions can be categorized into a few
basic categories:

* **General Extensions** - These extensions expose some optional general
    capability that was not included in the initial standards perhaps due to
    performance or security concerns.
* **Debug Extensions** - These extensions expose additional information and
    capabilities that help debug and profile a WebGL program.
* **WebGL1 Feature Extensions** - These extensions expose various OpenGL ES 3.0
    features that are often available on the target devices that run the
    OpenGL ES 2.0 based WebGL1 standard today.
* **WebGL2 Feature Extensions** - These extensions expose various
    OpenGL ES 3.1 and 3.2 features that are occasionally available on target
    devices that run the OpenGL ES 3.0 based WebGL2 standard today.
* **Compressed Texture Extensions** - Used to query if the GPU supports
    specific proprietary compressed texture formats.

Also note that because luma.gl gives the application direct access to the WebGL
context, the application can always work directly with any extensions it needs.
Using the support that luma.gl provides for a specific extension is optional.


## General Extensions

| Extension | Enables | luma.gl support |
| --- | --- | --- |
| [WEBGL_shared_resources](https://www.khronos.org/registry/webgl/WEBGL_shared_resources/) | Share resource between WebGL contexts | TBD |
| [WEBGL_security_sensitive_resources](https://www.khronos.org/registry/webgl/WEBGL_security_sensitive_resources/) | Cross-origin resource loading | TBD |


## Debug Extensions

luma carefully uses these extensions under the hood to provide a better
debug experience.

| Extension | Enables | luma.gl support |
| --- | --- | --- |
| [WEBGL_lose_context](https://www.khronos.org/registry/webgl/extensions/WEBGL_lose_context/) | Simulate context loss | TBD |
| [WEBGL_debug_renderer_info](https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/) | Returns strings identifying GPU | glGetDebugInfo, logged to console on startup |
| WEBGL_debug_shaders | TBD |
| EXT_disjoint_timer_query | Enables async queries of GPU timings | Luma offers TimerQueryObjects under WebGL1 |
| EXT_disjoint_timer_query_webgl2 | Will soon be implemented, probably merging the WebGL1 TimerQueryObject with WebGL2 Queries |


## WebGL1 Extensions

These extensions expose selected OpenGL ES 3.0 functionality to WebGL1 apps.
Note that these extensions are no longer available in WebGL2 as the
functionality they enable is provided by default in WebGL2
(which requires an OpenGL ES 3.0 compliant device).

| Extension | Enables | luma.gl support |
| --- | --- | --- |
| OES_vertex_array_object | WebGL2 VertexArrayObjects | `VertexArrayObject` uses this extension under WebGL1 |
| ANGLE_instanced_arrays | Offers WebGL2 instanced draw functions and instance divisor | luma's draw function automatically uses this extension when required |
| --- | --- | --- |
| OES_texture_float | Enables Float32Array textures | |
| OES_texture_half_float | Enables Uint16Array / HALF_FLOAT_OES textures | |
| OES_standard_derivatives | Enables derivative functions in GLSL | |
| WEBGL_depth_texture | Enables storing depth buffers in textures | |
| OES_element_index_uint | Querying enables Uint32Array ELEMENTS | luma queries on startup to enable, app needs to query again it wants to test platform |
| EXT_frag_depth | Enables fragment shader to control depth value | |
| WEBGL_draw_buffers | Enables fragment shaders to draw to multiple framebuffers | |
| OES_texture_half_float_linear | Enables linear filter for half float textures | |
| EXT_blend_minmax | Extends blending function | |
| EXT_shader_texture_lod | enables shader control of LOD | |
| EXT_texture_filter_anisotropic | Enables anisotropic filtering | |
| OES_texture_float_linear | Enables linear filter for float textures | |
| OES_fbo_render_mipmap | Render to specific texture mipmap level | |
| EXT_sRGB | sRGB encoded rendering | |
| EXT_color_buffer_half_float | framebuffer render to half float color buffer | |


## WebGL2 Extensions

These extensions can bring OpenGL ES 3.1 or 3.2 capabilities to WebGL2 contexts,
if the device supports them.

| EXT_color_buffer_float | framebuffer render to float color buffer | |
| WEBGL_color_buffer_float | frame buffer render of various floating point format | |


## Proposed Extensions

Khronos lists a couple of proposed extensions. They will be considered by
luma.gl as they become available in browsers.

| Extension | Enables | luma.gl support |
| --- | --- | --- |
| EXT_clip_cull_distance (WebGL2) | hardware clip/cull planes (ES3.2) |  |
| EXT_float_blend | 32 bit color blending | |
| EXT_texture_storage | texture storage effiency | |
| WEBGL_debug | Debug events | |
| WEBGL_dynamic_texture | frequently changin textures | |
| WEBGL_subarray_uploads | Efficient buffer update | |


## Compressed Texture Format Extensions

These enable various proprietary (patent-encumbered) compressed texture formats.

The primary advantage of compressed texture formats is that in contrast to
JPGs or PNGs, they do not have to be decompressed to be used by the GPU.
As a non-scientific guideline, compressed texture formats might achieve about 4x
compression, compared to say 16x compression for JPEG. So while they might be
slower to load, they could allow 4x more textures to be uploaded in the same
amount of GPU memory.

Because of patent issues, to use these formats an application would typically:
1. generate these in external commercial applications (which have already
   licensed any supported formats).
2. load them in binary form without touching the content
3. Pass them directly to a texture, so that they are processed inside the
   GPU driver (which also has licensed the formats).

Also note that due to the patent issues, finding a compressed texture format
which is supported across a range of target devices can be challenging.

For these reasons, luma.gl leaves the handling of these formats (and extensions)
to the application.

| Extension | Enables | luma.gl support |
| --- | --- | --- |
| WEBGL_compressed_texture_s3tc | Certain S3TC compressed texture formats | None |
| WEBGL_compressed_texture_atc | Certain AMD compressed texture formats | None |
| WEBGL_compressed_texture_pvrtc | Certain IMG compressed texture formats | None |
| WEBGL_compressed_texture_etc1 | Certain compressed texture formats | None |
| WEBGL_compressed_texture_etc | Certaincompressed texture formats | None |
| WEBGL_compressed_texture_astc | Certain compressed texture formats | None |
| WEBGL_compressed_texture_s3tc_srgb | Certain compressed texture formats | None |
