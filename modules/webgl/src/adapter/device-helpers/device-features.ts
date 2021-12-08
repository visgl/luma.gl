// Feature detection for WebGL
// Provides a function that enables simple checking of which WebGL features are
// available in an WebGL1 or WebGL2 environment.

import GL from '@luma.gl/constants';
import {isWebGL2} from '../../context/context/webgl-checks';
import {isOldIE} from './is-old-ie';

export type DeviceFeature =
  'depth-clamping' |
  'depth24unorm-stencil8' |
  'depth32float-stencil8' |
  'pipeline-statistics-query' |
  'timestamp-query' |
  'texture-compression-bc';

// TODO - this should be the default export, test cases need updating
export type WebGLFeature =
  'webgl2' |

  // api support (unify with WebGPU timestamp-query?)
  'webgl-timer-query' |

  // api support
  'webgl-vertex-array-object' |
  'webgl-instanced-rendering' |
  'webgl-multiple-render-targets' |

  // features
  'webgl-element-index-uint32' |

  // blending
  'webgl-blend-equation-minmax' |
  'webgl-float-blend' |

  // textures | renderbuffers
  'webgl-color-encoding-srgb' |

  // textures
  'webgl-texture-depth' |
  'webgl-texture-float' |
  'webgl-texture-half-float' |

  'webgl-texture-filter-linear-float' |
  'webgl-texture-filter-linear-half-float' |
  'webgl-texture-filter-anisotropic' |

  // framebuffers | textures and renderbuffers
  'webgl-color-attachment-rgba32f' |
  'webgl-color-attachment-float' |
  'webgl-color-attachment-half-float' |

  // glsl extensions
  'glsl-frag-data' |
  'glsl-frag-depth' |
  'glsl-derivatives' |
  'glsl-texture-lod';

/** Valid feature strings */
export type Feature = DeviceFeature | WebGLFeature;

/** Get WebGPU style feature strings */
export function getDeviceFeatures(gl: WebGLRenderingContext): Set<DeviceFeature | WebGLFeature> {
  const features = getWebGLFeatures(gl);
  // features.add('depth-clamping'); // GPUPrimitiveState.clampDepth
  // features.add('depth24unorm-stencil8'); // GPUTextureFormat 'depth24unorm-stencil8'.
  // features.add('depth32float-stencil8'); // GPUTextureFormat 'depth32float-stencil8'.
  // features.add('pipeline-statistics-query'); // GPUQueryType "pipeline-statistics"
  // features.add('timestamp-query'); // GPUQueryType "timestamp-query"
  // TODO
  // features.add('texture-compression-bc'); //  GPUQueryType "timestamp"
  // TODO
  return features;
}

/** Extract all WebGL features */
export function getWebGLFeatures(gl: WebGLRenderingContext): Set<WebGLFeature> {
  // Enable EXT_float_blend first: https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
  gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('WEBGL_color_buffer_float');
  gl.getExtension('EXT_float_blend');

  const features = new Set<WebGLFeature>();
  for (const feature in WEBGL_FEATURES) {
    if (isFeatureSupported(gl, feature as WebGLFeature)) {
      features.add(feature as WebGLFeature );
    }
  }
  return features;
}

function isFeatureSupported(gl: WebGLRenderingContext, feature: WebGLFeature): boolean {
  const [webgl1Feature, webgl2Feature] = WEBGL_FEATURES[feature];;

  // Get extension name from table
  const featureDefinition = isWebGL2(gl) ? webgl2Feature : webgl1Feature;

  // Check if the value is dependent on checking one or more extensions
  if (typeof featureDefinition === 'boolean') {
    return featureDefinition;
  }

  switch (feature) {
    case 'webgl-color-attachment-rgba32f':
      return isWebGL2(gl) ? Boolean(gl.getExtension(featureDefinition)) :
        checkFloat32ColorAttachment(gl);
    case 'glsl-derivatives':
      return canCompileGLSLExtension(gl, featureDefinition); // TODO options
    case 'glsl-frag-data':
      return canCompileGLSLExtension(gl, featureDefinition, {behavior: 'require'}); // TODO options
    case 'glsl-frag-depth':
      return canCompileGLSLExtension(gl, featureDefinition); // TODO options
    default:
      return Boolean(gl.getExtension(featureDefinition));
  }
}


// function to test if Float 32 bit format texture can be bound as color attachment
function checkFloat32ColorAttachment(gl: WebGLRenderingContext): boolean {
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

const compiledGLSLExtensions = {};

/*
 * Enables feature detection in IE11 due to a bug where gl.getExtension may return true
 * but fail to compile when the extension is enabled in the shader. Specifically,
 * the OES_standard_derivatives and WEBGL_draw_buffers extensions fails to compile in IE11 even though its included
 * in the list of supported extensions.
 * opts allows user agent to be overridden for testing
 * Inputs :
 *  gl : WebGL context
 *  cap : Key of WEBGL_FEATURES object identifying the extension
 *  opts :
 *   behavior : behavior of extension to be tested, by defualt `enable` is used
 * Returns : true, if shader is compiled successfully, false otherwise
 */
export function canCompileGLSLExtension(gl: WebGLRenderingContext, extensionName, opts: {behavior?} = {}) {
  if (!isOldIE(opts)) {
    return true;
  }

  if (extensionName in compiledGLSLExtensions) {
    return compiledGLSLExtensions[extensionName];
  }

  const behavior = opts.behavior || 'enable';
  const source = `#extension GL_${extensionName} : ${behavior}\nvoid main(void) {}`;

  const shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const canCompile = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  gl.deleteShader(shader);
  compiledGLSLExtensions[extensionName] = canCompile;
  return canCompile;
}

/** Defines luma.gl "feature" names and semantics
 * Format: 'feature-name: [WebGL1 support, WebGL2 support] / [WebGL1 and WebGL2 support]', when support is 'string' it is the name of the extension
 */
const WEBGL_FEATURES: Record<WebGLFeature, [boolean | string, boolean | string]> = {
  'webgl2': [false, true],

  // API SUPPORT
  'webgl-vertex-array-object': ['OES_vertex_array_object', true],
  'webgl-timer-query': ['EXT_disjoint_timer_query', 'EXT_disjoint_timer_query_webgl2'],
  'webgl-instanced-rendering': ['ANGLE_instanced_arrays', true],
  'webgl-multiple-render-targets': ['WEBGL_draw_buffers', true],

  // FEATURES
  'webgl-element-index-uint32': ['OES_element_index_uint', true],

  // BLENDING
  'webgl-blend-equation-minmax': ['EXT_blend_minmax', true],
  'webgl-float-blend': ['EXT_float_blend', 'EXT_float_blend'],

  // TEXTURES, RENDERBUFFERS
  'webgl-color-encoding-srgb': ['EXT_sRGB', true],

  // TEXTURES
  'webgl-texture-depth': ['WEBGL_depth_texture', true],
  'webgl-texture-float': ['OES_texture_float', true],
  'webgl-texture-half-float': ['OES_texture_half_float', true],

  'webgl-texture-filter-linear-float': ['OES_texture_float_linear', 'OES_texture_float_linear'],
  'webgl-texture-filter-linear-half-float': ['OES_texture_half_float_linear', 'OES_texture_half_float_linear'],
  'webgl-texture-filter-anisotropic': ['EXT_texture_filter_anisotropic', 'EXT_texture_filter_anisotropic'],

  // FRAMEBUFFERS, TEXTURES AND RENDERBUFFERS
  'webgl-color-attachment-rgba32f': [false, 'EXT_color_buffer_float'], // Note override check
  'webgl-color-attachment-float': [false, 'EXT_color_buffer_float'],
  'webgl-color-attachment-half-float': ['EXT_color_buffer_half_float', 'EXT_color_buffer_half_float'],

  // GLSL extensions
  'glsl-frag-data': ['WEBGL_draw_buffers', true],
  'glsl-frag-depth': ['EXT_frag_depth', true],
  'glsl-derivatives': ['OES_standard_derivatives', true],
  'glsl-texture-lod': ['EXT_shader_texture_lod', true]
};
