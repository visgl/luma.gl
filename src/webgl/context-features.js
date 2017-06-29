// Feature detection for WebGL
//
// Provides a function that enables simple checking of which WebGL features are
// available in an WebGL1 or WebGL2 environment.

/* eslint-disable no-inline-comments, max-len */
import {isWebGL2} from './context';
import assert from 'assert';

// Defines luma.gl "feature" names and semantics
const WEBGL_FEATURES = {
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

// Create a key-mirrored FEATURES array
const FEATURES = {};
Object.keys(WEBGL_FEATURES).forEach(key => {
  FEATURES[key] = key;
});
export {FEATURES};

// TODO - cache the value
function getFeature(gl, cap) {
  const feature = WEBGL_FEATURES[cap];
  assert(feature, cap);

  // Get extension name from table
  const extensionName = isWebGL2(gl) ?
    feature[1] || feature[0] :
    feature[0];

  // Check if the value is dependent on checking an extension
  const value = typeof extensionName === 'string' ?
    Boolean(gl.getExtension(extensionName)) :
    extensionName;

  assert(value === false || value === true);

  return value;
}

// capability can be a WebGL extension name or a luma capability name
export function hasFeature(gl, feature) {
  return hasFeatures(gl, feature);
}

export function hasFeatures(gl, features) {
  features = Array.isArray(features) ? features : [features];
  return features.every(feature => {
    return getFeature(gl, feature);
  });
}

export function getFeatures(gl) {
  gl.luma = gl.luma || {};

  if (!gl.luma.caps) {
    gl.luma.caps = {};
    gl.luma.caps.webgl2 = isWebGL2(gl);
    for (const cap in WEBGL_FEATURES) {
      gl.luma.caps[cap] = getFeature(gl, cap);
    }

  }
  return gl.luma.caps;
}

export const TEST_EXPORTS = {
  WEBGL_FEATURES
};
