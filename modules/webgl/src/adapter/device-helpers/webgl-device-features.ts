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
  // Enable EXT_float_blend first: https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
  gl.getExtension('EXT_color_buffer_float');

  const features = new Set<DeviceFeature>();
  for (const feature of Object.keys(WEBGL_FEATURES) as DeviceFeature[]) {
    if (isFeatureSupported(gl, feature)) {
      features.add(feature);
    }
  }
  return features;
}

function isFeatureSupported(gl: WebGL2RenderingContext, feature: DeviceFeature): boolean {
  const featureInfo = WEBGL_FEATURES[feature];

  // string value requires checking the corresponding WebGL extension
  return typeof featureInfo === 'string'
    ? Boolean(gl.getExtension(featureInfo))
    : Boolean(featureInfo);
}

/**
 * Defines luma.gl "feature" names and semantics
 * when value is 'string' it is the name of the extension that enables this feature
 */
const WEBGL_FEATURES: Partial<Record<DeviceFeature, boolean | string>> = {
  webgl: true,
  glsl: true,

  'uniforms-webgl': true,
  'transform-feedback-webgl': true,
  'constant-attributes-webgl': true,

  'timer-query-webgl': 'EXT_disjoint_timer_query_webgl2',
  'shader-status-async-webgl': 'KHR_parallel_shader_compile',
  'provoking-vertex-webgl': 'WEBGL_provoking_vertex',
  'polygon-mode-webgl': 'WEBGL_polygon_mode',

  // Textures are handled by getTextureFeatures()
};
