// Feature detection for WebGL
// Provides a function that enables simple checking of which WebGL features are
// available in an WebGL1 or WebGL2 environment.

import {Device, DeviceFeature, assert} from '@luma.gl/core';
import {WebGLDevice, _checkFloat32ColorAttachment} from '@luma.gl/webgl';

// TODO - this should be the default export, test cases need updating
export const DEPRECATED_FEATURES = {
  WEBGL2: 'WEBGL2',

  // API SUPPORT
  VERTEX_ARRAY_OBJECT: 'VERTEX_ARRAY_OBJECT',
  TIMER_QUERY: 'TIMER_QUERY',
  INSTANCED_RENDERING: 'INSTANCED_RENDERING',
  MULTIPLE_RENDER_TARGETS: 'MULTIPLE_RENDER_TARGETS',

  // FEATURES
  ELEMENT_INDEX_UINT32: 'ELEMENT_INDEX_UINT32',

  // BLENDING
  BLEND_EQUATION_MINMAX: 'BLEND_EQUATION_MINMAX',
  FLOAT_BLEND: 'FLOAT_BLEND',

  // TEXTURES: '// TEXTURES', RENDERBUFFERS
  COLOR_ENCODING_SRGB: 'COLOR_ENCODING_SRGB',

  // TEXTURES
  TEXTURE_DEPTH: 'TEXTURE_DEPTH',
  TEXTURE_FLOAT: 'TEXTURE_FLOAT',
  TEXTURE_HALF_FLOAT: 'TEXTURE_HALF_FLOAT',

  TEXTURE_FILTER_LINEAR_FLOAT: 'TEXTURE_FILTER_LINEAR_FLOAT',
  TEXTURE_FILTER_LINEAR_HALF_FLOAT: 'TEXTURE_FILTER_LINEAR_HALF_FLOAT',
  TEXTURE_FILTER_ANISOTROPIC: 'TEXTURE_FILTER_ANISOTROPIC',

  // FRAMEBUFFERS: '// FRAMEBUFFERS', TEXTURES AND RENDERBUFFERS
  COLOR_ATTACHMENT_RGBA32F: 'COLOR_ATTACHMENT_RGBA32F',
  COLOR_ATTACHMENT_FLOAT: 'COLOR_ATTACHMENT_FLOAT',
  COLOR_ATTACHMENT_HALF_FLOAT: 'COLOR_ATTACHMENT_HALF_FLOAT',

  // GLSL extensions
  GLSL_FRAG_DATA: 'GLSL_FRAG_DATA',
  GLSL_FRAG_DEPTH: 'GLSL_FRAG_DEPTH',
  GLSL_DERIVATIVES: 'GLSL_DERIVATIVES',
  GLSL_TEXTURE_LOD: 'GLSL_TEXTURE_LOD'
};

// TODO - this should be the default export, test cases need updating
export const DEPRECATED_TO_CLASSIC_FEATURES: Record<string, DeviceFeature> = {
  WEBGL2: 'webgl2',

  // API SUPPORT
  VERTEX_ARRAY_OBJECT: 'webgl',
  TIMER_QUERY: 'timer-query-webgl',
  INSTANCED_RENDERING: 'instanced-rendering-webgl1',
  MULTIPLE_RENDER_TARGETS: 'multiple-render-targets-webgl1',

  // FEATURES
  ELEMENT_INDEX_UINT32: 'index-uint32-webgl1',

  // BLENDING
  BLEND_EQUATION_MINMAX: 'blend-minmax-webgl1',
  FLOAT_BLEND: 'texture-blend-float-webgl1',

  // TEXTURES: '//_webgl1 TEXTURES', RENDERBUFFERS
  COLOR_ENCODING_SRGB: 'texture-formats-srgb-webgl1',

  // TEXTURES
  TEXTURE_DEPTH: 'texture-formats-depth-webgl1',
  TEXTURE_FLOAT: 'texture-formats-float32-webgl1',
  TEXTURE_HALF_FLOAT: 'texture-formats-float16-webgl1',

  TEXTURE_FILTER_LINEAR_FLOAT: 'texture-filter-linear-float32-webgl',
  TEXTURE_FILTER_LINEAR_HALF_FLOAT: 'texture-filter-linear-float16-webgl',
  TEXTURE_FILTER_ANISOTROPIC: 'texture-filter-anisotropic-webgl',

  // FRAMEBUFFERS: '//_webgl1 FRAMEBUFFERS', TEXTURES AND RENDERBUFFERS
  COLOR_ATTACHMENT_RGBA32F: 'texture-renderable-rgba32float-webgl',
  COLOR_ATTACHMENT_FLOAT: 'texture-renderable-float32-webgl',
  COLOR_ATTACHMENT_HALF_FLOAT: 'texture-renderable-float16-webgl',

  // GLSL extensions
  GLSL_FRAG_DATA: 'glsl-frag-data',
  GLSL_FRAG_DEPTH: 'glsl-frag-depth',
  GLSL_DERIVATIVES: 'glsl-derivatives',
  GLSL_TEXTURE_LOD: 'glsl-texture-lod'
};

/** 
 * Extract all WebGL features 
 * @deprecated Use `device.features.has(...)`
 */
export function getWebGLFeatures(device: Device | WebGLRenderingContext): Set<string> {
  const webglDevice = WebGLDevice.attach(device);
  // Enable EXT_float_blend first: https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
  webglDevice.gl.getExtension('EXT_color_buffer_float');
  webglDevice.gl.getExtension('WEBGL_color_buffer_float');
  webglDevice.gl.getExtension('EXT_float_blend');

  const features = new Set<string>();
  for (const feature in WEBGL_FEATURES) {
    if (isFeatureSupported(webglDevice.gl, feature)) {
      features.add(feature);
    }
  }
  return features;
}

function isFeatureSupported(device: Device | WebGLRenderingContext, cap: string): boolean {
  const webglDevice = WebGLDevice.attach(device);

  const feature = WEBGL_FEATURES[cap];
  assert(feature, cap);

  const [webgl1Feature, webgl2Feature] = feature;

  // Get extension name from table
  const featureDefinition = webglDevice.isWebGL2 ? webgl2Feature : webgl1Feature;

  if (cap === DEPRECATED_FEATURES.COLOR_ATTACHMENT_RGBA32F && !webglDevice.isWebGL2) {
    return _checkFloat32ColorAttachment(webglDevice.gl);
  }

  // Check if the value is dependent on checking one or more extensions
  if (typeof featureDefinition === 'string') {
    return Boolean(webglDevice.gl.getExtension(featureDefinition));
  }

  return featureDefinition;
}

// Defines luma.gl "feature" names and semantics
// Format: 'feature-name: [WebGL1 support, WebGL2 support] / [WebGL1 and WebGL2 support]', when support is 'string' it is the name of the extension
const WEBGL_FEATURES: Record<string, [boolean | string, boolean | string]> = {
  [DEPRECATED_FEATURES.WEBGL2]: [false, true],

  // API SUPPORT
  [DEPRECATED_FEATURES.VERTEX_ARRAY_OBJECT]: ['OES_vertex_array_object', true],
  [DEPRECATED_FEATURES.TIMER_QUERY]: ['EXT_disjoint_timer_query', 'EXT_disjoint_timer_query_webgl2'],
  [DEPRECATED_FEATURES.INSTANCED_RENDERING]: ['ANGLE_instanced_arrays', true],
  [DEPRECATED_FEATURES.MULTIPLE_RENDER_TARGETS]: ['WEBGL_draw_buffers', true],

  // FEATURES
  [DEPRECATED_FEATURES.ELEMENT_INDEX_UINT32]: ['OES_element_index_uint', true],

  // BLENDING
  [DEPRECATED_FEATURES.BLEND_EQUATION_MINMAX]: ['EXT_blend_minmax', true],
  [DEPRECATED_FEATURES.FLOAT_BLEND]: ['EXT_float_blend', 'EXT_float_blend'],

  // TEXTURES, RENDERBUFFERS
  [DEPRECATED_FEATURES.COLOR_ENCODING_SRGB]: ['EXT_sRGB', true],

  // TEXTURES
  [DEPRECATED_FEATURES.TEXTURE_DEPTH]: ['WEBGL_depth_texture', true],
  [DEPRECATED_FEATURES.TEXTURE_FLOAT]: ['OES_texture_float', true],
  [DEPRECATED_FEATURES.TEXTURE_HALF_FLOAT]: ['OES_texture_half_float', true],

  [DEPRECATED_FEATURES.TEXTURE_FILTER_LINEAR_FLOAT]: ['OES_texture_float_linear', 'OES_texture_float_linear'],
  [DEPRECATED_FEATURES.TEXTURE_FILTER_LINEAR_HALF_FLOAT]: ['OES_texture_half_float_linear', 'OES_texture_half_float_linear'],
  [DEPRECATED_FEATURES.TEXTURE_FILTER_ANISOTROPIC]: ['EXT_texture_filter_anisotropic', 'EXT_texture_filter_anisotropic'],

  // FRAMEBUFFERS, TEXTURES AND RENDERBUFFERS
  [DEPRECATED_FEATURES.COLOR_ATTACHMENT_RGBA32F]: [false, 'EXT_color_buffer_float'], // Note override check
  [DEPRECATED_FEATURES.COLOR_ATTACHMENT_FLOAT]: [false, 'EXT_color_buffer_float'],
  [DEPRECATED_FEATURES.COLOR_ATTACHMENT_HALF_FLOAT]: ['EXT_color_buffer_half_float', 'EXT_color_buffer_half_float'],

  // GLSL extensions
  [DEPRECATED_FEATURES.GLSL_FRAG_DATA]: ['WEBGL_draw_buffers', true],
  [DEPRECATED_FEATURES.GLSL_FRAG_DEPTH]: ['EXT_frag_depth', true],
  [DEPRECATED_FEATURES.GLSL_DERIVATIVES]: ['OES_standard_derivatives', true],
  [DEPRECATED_FEATURES.GLSL_TEXTURE_LOD]: ['EXT_shader_texture_lod', true]
};
