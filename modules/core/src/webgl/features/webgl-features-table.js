// Defines luma.gl "feature" names and semantics
export default {
  // API SUPPORT
  VERTEX_ARRAY_OBJECT: ['OES_vertex_array_object', true],
  TIMER_QUERY: ['EXT_disjoint_timer_query', 'EXT_disjoint_timer_query_webgl2'],
  INSTANCED_RENDERING: ['ANGLE_instanced_arrays', true],
  MULTIPLE_RENDER_TARGETS: ['WEBGL_draw_buffers', true],

  // FEATURES
  ELEMENT_INDEX_UINT32: ['OES_element_index_uint', true],
  BLEND_EQUATION_MINMAX: ['EXT_blend_minmax', true],

  // TEXTURES, RENDERBUFFERS
  COLOR_ENCODING_SRGB: ['EXT_sRGB', true],

  // TEXTURES
  TEXTURE_DEPTH: ['WEBGL_depth_texture', true],
  TEXTURE_FLOAT: ['OES_texture_float', true],
  TEXTURE_HALF_FLOAT: ['OES_texture_half_float', true],

  TEXTURE_FILTER_LINEAR_FLOAT: ['OES_texture_float_linear'],
  TEXTURE_FILTER_LINEAR_HALF_FLOAT: ['OES_texture_half_float_linear'],
  TEXTURE_FILTER_ANISOTROPIC: ['EXT_texture_filter_anisotropic'],

  // FRAMEBUFFERS, TEXTURES AND RENDERBUFFERS
  COLOR_ATTACHMENT_RGBA32F: ['WEBGL_color_buffer_float', 'EXT_color_buffer_float'],
  COLOR_ATTACHMENT_FLOAT: [false, 'EXT_color_buffer_float'],
  COLOR_ATTACHMENT_HALF_FLOAT: [false, 'EXT_color_buffer_half_float'],

  // GLSL extensions
  GLSL_FRAG_DATA: ['WEBGL_draw_buffers', true],
  GLSL_FRAG_DEPTH: ['EXT_frag_depth', true],
  GLSL_DERIVATIVES: ['OES_standard_derivatives', true],
  GLSL_TEXTURE_LOD: ['EXT_shader_texture_lod', true]
};
