// Feature detection for WebGL
//
// Provides a function that enables simple checking of which WebGL features are
// available in an WebGL1 or WebGL2 environment.

/* eslint-disable no-inline-comments, max-len */
import {isWebGL2} from './context';
import assert from 'assert';

export const ES300 = 'ES300';
const WEBGL1 = 'WEBGL1';

export const FEATURE = {
  // DEBUG CAPABILITIS
  DEBUG_RENDERER_INFO: 'DEBUG_RENDERER_INFO',
  DEBUG_SHADERS: 'DEBUG_SHADERS',
  DEBUG_LOSE_CONTEXT: 'DEBUG_LOSE_CONTEXT',

  // API SUPPORT
  VERTEX_ARRAY_OBJECT: 'VERTEX_ARRAY_OBJECT',
  TIMER_QUERY: 'TIMER_QUERY',
  INSTANCED_RENDERING: 'INSTANCED_ARRAYS',
  MULTIPLE_RENDER_TARGETS: 'MULTIPLE_RENDER_TARGETS',

  // FEATURES
  ELEMENT_INDEX_UINT32: 'ELEMENT_INDEX_UINT32',
  BLEND_MINMAX: 'BLEND_MINMAX',
  SRGB: 'SRGB',

  TEXTURE_FILTER_ANISOTROPIC: 'TEXTURE_FILTER_ANISOTROPIC',
  TEXTURE_FILTER_LINEAR_FLOAT: 'TEXTURE_FILTER_LINEAR_FLOAT',
  TEXTURE_FILTER_LINEAR_HALF_FLOAT: 'TEXTURE_FILTER_LINEAR_HALF_FLOAT',
  TEXTURE_FLOAT: 'TEXTURE_FLOAT',
  TEXTURE_HALF_FLOAT: 'TEXTURE_HALF_FLOAT',
  DEPTH_TEXTURE: 'DEPTH_TEXTURE',
  COLOR_ATTACHMENT_RGBA32F: 'COLOR_ATTACHMENT_RGBA32F',
  COLOR_ATTACHMENT_FLOAT: 'COLOR_ATTACHMENT_FLOAT',
  COLOR_ATTACHMENT_HALF_FLOAT: 'COLOR_ATTACHMENT_HALF_FLOAT',

  // GLSL extensions
  GLSL_MULTIPLE_RENDER_TARGETS: 'GLSL_MULTIPLE_RENDER_TARGETS',
  GLSL_FRAGMENT_SHADER_DEPTH: 'GLSL_FRAGMENT_SHADER_DEPTH',
  GLSL_FRAGMENT_SHADER_DERIVATIVES: 'GLSL_FRAGMENT_SHADER_DERIVATIVES',
  GLSL_SHADER_TEXTURE_LOD: 'GLSL_SHADER_TEXTURE_LOD',

  // COMPRESSED TEXTURES
  COMPRESSED_TEXTURE_S3TC: 'COMPRESSED_TEXTURE_S3TC',
  COMPRESSED_TEXTURE_ATC: 'COMPRESSED_TEXTURE_ATC',
  COMPRESSED_TEXTURE_ETC: 'COMPRESSED_TEXTURE_ETC',
  COMPRESSED_TEXTURE_ETC1: 'COMPRESSED_TEXTURE_ETC1',
  COMPRESSED_TEXTURE_PVRTC: 'COMPRESSED_TEXTURE_PVRTC'
};

const F = FEATURE;

// Defines luma.gl "feature" names and semantics
const WEBGL_FEATURES = {
  // DEBUG CAPABILITIS
  [F.DEBUG_RENDERER_INFO]: {gl1: 'WEBGL_debug_renderer_info', gl2: WEBGL1},
  [F.DEBUG_SHADERS]: {gl1: 'WEBGL_debug_shaders', gl2: WEBGL1},
  [F.DEBUG_LOSE_CONTEXT]: {gl1: 'WEBGL_lose_context', gl2: WEBGL1},

  // API SUPPORT
  [F.VERTEX_ARRAY_OBJECT]: {gl1: 'OES_vertex_array_object', gl2: true},
  [F.TIMER_QUERY]: {gl1: 'EXT_disjoint_timer_query', gl2: 'EXT_disjoint_timer_query_webgl2'},
  [F.INSTANCED_ARRAYS]: {gl1: 'ANGLE_instanced_arrays', gl2: true},
  [F.MULTIPLE_RENDER_TARGETS]: {gl1: 'WEBGL_draw_buffers', gl2: ES300},

  // FEATURES
  [F.ELEMENT_INDEX_UINT]: {gl1: 'OES_element_index_uint', gl2: true},
  [F.BLEND_MINMAX]: {gl1: 'EXT_blend_minmax', gl2: true},
  [F.SRGB]: {gl1: 'EXT_sRGB', gl2: true},
  [F.TEXTURE_FILTER_ANISOTROPIC]: {gl1: 'EXT_texture_filter_anisotropic', gl2: WEBGL1},
  [F.TEXTURE_FLOAT]: {gl1: 'OES_texture_float', gl2: true},
  [F.TEXTURE_HALF_FLOAT]: {gl1: 'OES_texture_half_float', gl2: true},
  [F.TEXTURE_LINEAR_FILTERING_FLOAT]: {gl1: 'OES_texture_float_linear', gl2: WEBGL1},
  [F.TEXTURE_LINEAR_FILTERING_HALF_FLOAT]: {gl1: 'OES_texture_half_float_linear', gl2: true},
  [F.DEPTH_TEXTURE]: {gl1: 'WEBGL_depth_texture', gl2: true},
  [F.COLOR_ATTACHMENT_RGBA32F]: {gl1: 'WEBGL_color_buffer_float', gl2: 'EXT_color_buffer_float'},
  [F.COLOR_ATTACHMENT_FLOAT]: {gl1: false, gl2: 'EXT_color_buffer_float'},
  [F.COLOR_ATTACHMENT_HALF_FLOAT]: {gl1: false, gl2: 'EXT_color_buffer_half_float'},

  // GLSL extensions
  [F.FRAGMENT_SHADER_DEPTH]: {gl1: 'EXT_frag_depth', gl2: ES300},
  [F.FRAGMENT_SHADER_DERIVATIVES]: {gl1: 'OES_standard_derivatives', gl2: ES300},
  [F.SHADER_TEXTURE_LOD]: {gl1: 'EXT_shader_texture_lod', gl2: ES300},

  // COMPRESSED TEXTURES
  [F.COMPRESSED_TEXTURE_S3TC]: {gl1: 'WEBGL_compressed_texture_s3tc', gl2: WEBGL1},
  [F.COMPRESSED_TEXTURE_ATC]: {gl1: 'WEBGL_compressed_texture_atc', gl2: WEBGL1},
  [F.COMPRESSED_TEXTURE_ETC]: {gl1: 'WEBGL_compressed_texture_etc', gl2: WEBGL1},
  [F.COMPRESSED_TEXTURE_ETC1]: {gl1: 'WEBGL_compressed_texture_etc1', gl2: WEBGL1},
  [F.COMPRESSED_TEXTURE_PVRTC]: {gl1: 'WEBGL_compressed_texture_pvrtc', gl2: WEBGL1}
};

function getFeature({gl, cap, webglVersion}) {
  const feature = WEBGL_FEATURES[cap];
  assert(feature, cap);

  if (!feature.value) {
    // Get extension name, and replace if webgl2 uses the webgl1 extension
    let extensionName = feature[webglVersion];
    if (extensionName === WEBGL1) {
      extensionName = feature.gl1;
    }

    let value = extensionName;
    // Check if the value is dependent on checking an extension
    if (typeof extensionName === 'string' && extensionName !== ES300) {
      value = Boolean(gl.getExtension(extensionName));
    }
    assert(value === false || value === true || value === ES300);

    feature.value = value;
  }
  return feature.value;
}

// capability can be a WebGL extension name or a luma capability name
export function hasFeatures(gl, features) {
  features = Array.isArray(features) ? features : [features];
  return features.every(feature => {
    const webglVersion = isWebGL2(gl) ? 'gl2' : 'gl1';
    return getFeature({gl, feature, webglVersion}) || gl.getExtension(feature);
  });
}

export function getFeatures(gl) {
  gl.luma = gl.luma || {};

  if (!gl.luma.caps) {
    gl.luma.caps = {};
    const webglVersion = isWebGL2(gl) ? 'webgl2' : 'webgl1';
    for (const cap in WEBGL_FEATURES) {
      gl.luma.caps[cap] = getFeature({gl, cap, webglVersion});
    }

  }
  return gl.luma.caps;
}

export const TEST_EXPORTS = {
  WEBGL_FEATURES
};
