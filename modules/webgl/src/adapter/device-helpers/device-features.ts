// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// Feature detection for WebGL
// Provides a function that enables simple checking of which WebGL features are

import {DeviceFeature} from '@luma.gl/core';
import {getTextureFeatures} from '../converters/texture-formats';

/** Get WebGPU style feature strings */
export function getDeviceFeatures(gl: WebGL2RenderingContext): Set<DeviceFeature> {
  const features = getWebGLFeatures(gl);

  // texture features
  // features.add('texture-compression-bc'); 
  for (const textureFeature of getTextureFeatures(gl)) {
    features.add(textureFeature);
  }

  // TODO
  // features.add('depth-clip-control'); // GPUPrimitiveState.clampDepth
  // features.add('depth24unorm-stencil8'); // GPUTextureFormat 'depth24unorm-stencil8'.
  // features.add('depth32float-stencil8'); // GPUTextureFormat 'depth32float-stencil8'.
  // features.add('timestamp-query'); // GPUQueryType "timestamp-query"
  // "indirect-first-instance"

  return features;
}

/** Extract all WebGL features */
export function getWebGLFeatures(gl: WebGL2RenderingContext): Set<DeviceFeature> {
  // Enables EXT_float_blend first: https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
  gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('WEBGL_color_buffer_float');
  gl.getExtension('EXT_float_blend');

  const features = new Set<DeviceFeature>(WEBGL_ALWAYS_FEATURES);
  for (const feature of Object.keys(WEBGL_FEATURES)) {
    // @ts-expect-error
    if (isFeatureSupported(gl, feature)) {
      // @ts-expect-error
      features.add(feature);
    }
  }
  return features;
}

function isFeatureSupported(gl: WebGL2RenderingContext, feature: DeviceFeature): boolean {
  const featureInfo = WEBGL_FEATURES[feature];
  if (!featureInfo) {
    return false;
  }

  // Get extension name from table
  const featureDefinition = featureInfo;

  // Check if the value is dependent on checking one or more extensions
  if (typeof featureDefinition === 'boolean') {
    return featureDefinition;
  }

  return Boolean(gl.getExtension(featureDefinition));
}

const WEBGL_ALWAYS_FEATURES: DeviceFeature[] = ['webgl', 'glsl', 'transform-feedback-webgl'];

/** 
 * Defines luma.gl "feature" names and semantics
 * when value is 'string' it is the name of the extension that enables this feature
 */
const WEBGL_FEATURES: Partial<Record<DeviceFeature, boolean | string>> = {
  'timer-query-webgl': 'EXT_disjoint_timer_query_webgl2',
  'transform-feedback-webgl': true,

  // WEBGL1 SUPPORT
  'texture-blend-float-webgl': 'EXT_float_blend',

  'float32-filterable-linear-webgl': 'OES_texture_float_linear',
  'float16-filterable-linear-webgl': 'OES_texture_half_float_linear',
  'texture-filterable-anisotropic-webgl': 'EXT_texture_filter_anisotropic',

  // FRAMEBUFFERS, TEXTURES AND RENDERBUFFERS
  'float32-renderable-webgl': 'EXT_color_buffer_float',
  'float16-renderable-webgl': 'EXT_color_buffer_half_float',
};
