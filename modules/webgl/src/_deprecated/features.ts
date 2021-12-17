// Feature detection for WebGL
// Provides a function that enables simple checking of which WebGL features are
// available in an WebGL1 or WebGL2 environment.

import GL from '@luma.gl/constants';
import {isWebGL2} from '@luma.gl/webgl';
import {assert} from '@luma.gl/api';

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

/** Extract all WebGL features */
export function getWebGLFeatures(gl: WebGLRenderingContext): Set<string> {
  // Enable EXT_float_blend first: https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
  gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('WEBGL_color_buffer_float');
  gl.getExtension('EXT_float_blend');

  const features = new Set<string>();
  for (const feature in WEBGL_FEATURES) {
    if (isFeatureSupported(gl, feature)) {
      features.add(feature);
    }
  }
  return features;
}

function isFeatureSupported(gl: WebGLRenderingContext, cap: string): boolean {
  const feature = WEBGL_FEATURES[cap];
  assert(feature, cap);

  const [webgl1Feature, webgl2Feature] = feature;

  // Get extension name from table
  const featureDefinition = isWebGL2(gl) ? webgl2Feature : webgl1Feature;

  if (cap === DEPRECATED_FEATURES.COLOR_ATTACHMENT_RGBA32F && !isWebGL2(gl)) {
    return checkFloat32ColorAttachment(gl);
  }

  // Check if the value is dependent on checking one or more extensions
  if (typeof featureDefinition === 'string') {
    return Boolean(gl.getExtension(featureDefinition));
  }

  return featureDefinition;
}


// function to test if Float 32 bit format texture can be bound as color attachment
function checkFloat32ColorAttachment(gl: WebGLRenderingContext) {
  let texture: WebGLTexture;
  let framebuffer: WebGLFramebuffer;
  try {
    const texture = gl.createTexture();
    gl.bindTexture(GL.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(GL.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(GL.FRAMEBUFFER) === GL.FRAMEBUFFER_COMPLETE;
    return status;
  } finally {
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(framebuffer);
  }
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
