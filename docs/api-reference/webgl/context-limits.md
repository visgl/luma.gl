# Capability Management

## Capabilities

| CAPABILITY                   | WebGL2  | WebGL1 | Description |
| ---                          | ---     | ---    | ---         |
| **PROVIDES ADDITIONAL APIS** |         |        | |
| `INSTANCED_RENDERING`        | **Yes** | ext    | [`ANGLE_instanced_arrays`]() |
| `VERTEX_ARRAY_OBJECT`        | **Yes** | ext    | [`OES_vertex_array_object`]() |
| `MULTIPLE_RENDER_TARGETS`    | **Yes** | ext    | [`WEBGL_draw_buffers`]() |
| `DISJOINT_TIMER_QUERY`       | ext     | ext    | [`EXT_disjoint_timer_query_webgl2`](), [`EXT_disjoint_timer_query`]() |
| **FEATURE**                  |         |        | |
| `ELEMENT_INDEX_UINT32`       | **Yes** | opt    | 32 bit indices available for `GL.ELEMENT_ARRAY_BUFFER`s [`OES_element_index_uint`]() |
| `BLEND_MINMAX`               | **Yes** | opt    | `GL.MIN`, `GL.MAX` blending modes are available: [`EXT_blend_minmax`]() |
| `COLOR_BUFFER_FLOAT_RGBA32F` |         |        | [`EXT_color_buffer_float`]() [`WEBGL_color_buffer_float`]() |
| `COLOR_ATTACHMENT_FLOAT`     | ext     | **No** | [`EXT_color_buffer_float`]() |
| `COLOR_ATTACHMENT_HALF_FLOAT`| ext     | **No** | [`EXT_color_buffer_half_float`]() |
| `SRGB`                       | **Yes** | ext    | [`EXT_sRGB`]() |
| `DEPTH_TEXTURE`              | **Yes** | ext    | [`WEBGL_depth_texture`]() |
| `TEXTURE_FLOAT_LINEAR`       | **Yes** |        | [`OES_texture_half_float_linear`]() |
| `TEXTURE_HALF_FLOAT_LINEAR`  | **Yes** |        | [`OES_texture_half_float_linear`]() |
| `TEXTURE_FILTER_ANISOTROPIC` | ext     | ext    | [`EXT_texture_filter_anisotropic`]() |
| `TEXTURE_FILTER_FLOAT`       | **Yes** | ext    | [`OES_texture_float`]() |
| `TEXTURE_HALF_FLOAT`         | **Yes** |        | [`OES_texture_half_float`]() [`WEBGL_color_buffer_float`]() |
| **GLSL extensions**          |         |        | |
| `DRAW_BUFFERS`               | `ES300` | ext    | [`WEBGL_draw_buffers`]() |
| `FRAG_DEPTH`                 | `ES300` | ext    | [`EXT_frag_depth`]() |
| `SHADER_TEXTURE_LOD`         | `ES300` | ext    | [`EXT_shader_texture_lod`]() |
| `STANDARD_DERIVATIVES`       | `ES300` | ext    | [`OES_standard_derivatives`]() |
| **COMPRESSED TEXTURES**      |         |        | |
| `COMPRESSED_TEXTURE_S3TC`    | ext     | ext    | [`WEBGL_compressed_texture_s3tc`]() |
| `COMPRESSED_TEXTURE_ATC`     | ext     | ext    | [`WEBGL_compressed_texture_atc`]() |
| `COMPRESSED_TEXTURE_ETC`     | ext     | ext    | [`WEBGL_compressed_texture_etc`]() |
| `COMPRESSED_TEXTURE_ETC1`    | ext     | ext    | [`WEBGL_compressed_texture_etc1`]() |
| `COMPRESSED_TEXTURE_PVRTC`   | ext     | ext    | [`WEBGL_compressed_texture_pvrtc`]() |

Notes:
* WebGL1 only supports one color buffer format (RBG32F is deprecated)
* WebGL2 supports multiple color buffer formats


# Limits

In addition to capabilities, luma.gl can also query the context for all limits.
These are available as `glGetInfo(gl).limits` and can be indexed with the
GL constant representing the limit.

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
