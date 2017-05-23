# Capability Management
# Capability Management

## Capabilities

| CAPABILITY CONSTANT | WEBGL1 | WEBGL2 |
| MAJOR FEATURE/OBJECT SUPPORT |
| `INSTANCED_ARRAYS` | `ANGLE_instanced_arrays` | `true` |
| `VERTEX_ARRAY_OBJECT` | `OES_vertex_array_object` | `true` |
| `ELEMENT_INDEX_UINT` | `OES_element_index_uint` | `true` |
| `BLEND_MINMAX` | `EXT_blend_minmax` | `true` |
| `SRGB` | `EXT_sRGB` | `true` |
| `DEPTH_TEXTURE` | `WEBGL_depth_texture` | `true` |
| `TEXTURE_FILTER_ANISOTROPIC` | `EXT_texture_filter_anisotropic` | `<-` |
| `TEXTURE_FLOAT` | `OES_texture_float` | `true` |
| `TEXTURE_FLOAT_LINEAR` | `OES_texture_float_linear` | `<-` |
| `TEXTURE_HALF_FLOAT` | `OES_texture_half_float` | `true` |
| `TEXTURE_HALF_FLOAT_LINEAR` | `OES_texture_half_float_linear` | `true` |
| `COLOR_BUFFER_FLOAT_RGBA32F` | `WEBGL_color_buffer_float` | `'EXT_color_buffer_float`' |
| `COLOR_BUFFER_FLOAT` | `alse`| w`EXT_color_buffer_float`' |
| `COLOR_BUFFER_HALF_FLOAT` | `alse`| w`EXT_color_buffer_half_float`' |
| GLSL extensions | |
| `FRAG_DEPTH` | `EXT_frag_depth` | `ES300` |
| `SHADER_TEXTURE_LOD` | `EXT_shader_texture_lod` | `ES300` |
| `STANDARD_DERIVATIVES` | `OES_standard_derivatives` | `ES300` |
| `MULTIPLE_RENDER_TARGETS` | `WEBGL_draw_buffers` | `ES300` |
| DEBUG CAPABILITIES | |
| `DEBUG_RENDERER_INFO` | `WEBGL_debug_renderer_info` | <- |
| `DEBUG_SHADERS` | `WEBGL_debug_shaders` | <- |
| `LOSE_CONTEXT` | `WEBGL_lose_context` | <- |
| `DISJOINT_TIMER_QUERY` | `EXT_disjoint_timer_query` | `'EXT_disjoint_timer_query_webgl2`|
| COMPRESSED TEXTURES | |
| `COMPRESSED_TEXTURE_S3TC` | `WEBGL_compressed_texture_s3tc` | `<-` |
| `COMPRESSED_TEXTURE_ATC` | `WEBGL_compressed_texture_atc` | `<-` |
| `COMPRESSED_TEXTURE_ETC` | `WEBGL_compressed_texture_etc` | `<-` |
| `COMPRESSED_TEXTURE_ETC1` | `WEBGL_compressed_texture_etc1` | `<-` |
| `COMPRESSED_TEXTURE_PVRTC` | `WEBGL_compressed_texture_pvrtc` | `<-` |

Notes:
* WebGL1 only supports one color buffer format (RBG32F is deprecated)
* WebGL2 supports multiple color buffer formats

# Limits

In addition to capabilities, luma.gl can also query the context for all limits.
These are available as `glGetInfo(gl).limits` and can be indexed with the
GL constant representing the limit.

 | WebGL1 Limits | | |
 | --- | --- | --- |
 | `GL.ALIASED_LINE_WIDTH_RANGE` | webgl1: new Float32Array([1, 1])},
 | `GL.ALIASED_POINT_SIZE_RANGE` | webgl1: new Float32Array([1, 1])},
 | `GL.MAX_TEXTURE_SIZE` | webgl1: 64, webgl2: 2048}, // GLint
 | `GL.MAX_CUBE_MAP_TEXTURE_SIZE` | webgl1: 16}, // GLint
 | `GL.MAX_TEXTURE_IMAGE_UNITS` | webgl1: 8}, // GLint
 | `GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS` | webgl1: 8}, // GLint
 | `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS` | webgl1: 0}, // GLint
 | `GL.MAX_RENDERBUFFER_SIZE` | webgl1: 1}, // GLint
 | `GL.MAX_VARYING_VECTORS` | webgl1: 8}, // GLint
 | `GL.MAX_VERTEX_ATTRIBS` | webgl1: 8}, // GLint
 | `GL.MAX_VERTEX_UNIFORM_VECTORS` | webgl1: 128}, // GLint
 | `GL.MAX_FRAGMENT_UNIFORM_VECTORS` | webgl1: 16}, // GLint
 | `GL.MAX_VIEWPORT_DIMS` | webgl1: new Int32Array([0, 0])},

 | WebGL2 Limits | | |
 | --- | --- | --- |
 | `GL.MAX_3D_TEXTURE_SIZE` | webgl1: 0, webgl2: 256}, //  GLint
 | `GL.MAX_ARRAY_TEXTURE_LAYERS` | webgl1: 0, webgl2: 256}, // GLint
 | `GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL` | webgl1: 0, webgl2: 0}, //  GLint64
 | `GL.MAX_COLOR_ATTACHMENTS` | webgl1: 0, webgl2: 4}, //  GLint
 | `GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS` | webgl1: 0, webgl2: 0}, // GLint64
 | `GL.MAX_COMBINED_UNIFORM_BLOCKS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS` | webgl1: 0, webgl2: 0}, // GLint64
 | `GL.MAX_DRAW_BUFFERS` | webgl1: 0, webgl2: 4}, // GLint
 | `GL.MAX_ELEMENT_INDEX` | webgl1: 0, webgl2: 0}, //  GLint64
 | `GL.MAX_ELEMENTS_INDICES` | webgl1: 0, webgl2: 0}, // GLint
 | `GL.MAX_ELEMENTS_VERTICES` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_FRAGMENT_INPUT_COMPONENTS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_FRAGMENT_UNIFORM_BLOCKS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_FRAGMENT_UNIFORM_COMPONENTS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_PROGRAM_TEXEL_OFFSET` | webgl1: 0, webgl2: 0}, // GLint
 | `GL.MAX_SAMPLES` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_SERVER_WAIT_TIMEOUT` | webgl1: 0, webgl2: 0}, //  GLint64
 | `GL.MAX_TEXTURE_LOD_BIAS` | webgl1: 0, webgl2: 0}, // GLfloat
 | `GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS` | webgl1: 0, webgl2: 0}, // GLint
 | `GL.MAX_UNIFORM_BLOCK_SIZE` | webgl1: 0, webgl2: 0}, // GLint64
 | `GL.MAX_UNIFORM_BUFFER_BINDINGS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_VARYING_COMPONENTS` | webgl1: 0, webgl2: 0}, // GLint
 | `GL.MAX_VERTEX_OUTPUT_COMPONENTS` | webgl1: 0, webgl2: 0}, // GLint
 | `GL.MAX_VERTEX_UNIFORM_BLOCKS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MAX_VERTEX_UNIFORM_COMPONENTS` | webgl1: 0, webgl2: 0}, //  GLint
 | `GL.MIN_PROGRAM_TEXEL_OFFSET` | webgl1: 0, webgl2: 0}, // GLint
 | `GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT` | webgl1: 0, webgl2: 0} // GLint

  // Extensions
 | `GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT` |  webgl1: 1.0, extension: 'EXT_texture_filter_anisotropic' },

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
