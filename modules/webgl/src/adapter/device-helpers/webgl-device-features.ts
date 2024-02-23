// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// Feature detection for WebGL
// Provides a function that enables simple checking of which WebGL features are

import {DeviceFeature} from '@luma.gl/core';
import {GLExtensions} from '@luma.gl/constants';
import {getWebGLExtension} from '../../context/helpers/webgl-extensions';
import {isTextureFeature, checkTextureFeature} from '../converters/texture-formats';

/**
 * Defines luma.gl "feature" names and semantics
 * when value is 'string' it is the name of the extension that enables this feature
 */
const WEBGL_FEATURES: Partial<Record<DeviceFeature, boolean | string>> = {
  // optional WebGPU features
  'depth-clip-control': 'EXT_depth_clamp', // TODO these seem subtly different
  // 'timestamp-query' // GPUQueryType "timestamp-query"
  // "indirect-first-instance"
  // Textures are handled by getTextureFeatures()
  // 'depth24unorm-stencil8' // GPUTextureFormat 'depth24unorm-stencil8'
  // 'depth32float-stencil8' // GPUTextureFormat 'depth32float-stencil8'

  // optional WebGL features
  'timer-query-webgl': 'EXT_disjoint_timer_query_webgl2',
  'compilation-status-async-webgl': 'KHR_parallel_shader_compile',
  'polygon-mode-webgl': 'WEBGL_polygon_mode',
  'provoking-vertex-webgl': 'WEBGL_provoking_vertex',
  'shader-clip-cull-distance-webgl': 'WEBGL_clip_cull_distance',
  'shader-noperspective-interpolation-webgl': 'NV_shader_noperspective_interpolation',
  'shader-conservative-depth-webgl': 'EXT_conservative_depth'

  // Textures are handled by getTextureFeatures()
};

/** Extract all WebGL features */
export function getWebGLFeature(gl: WebGL2RenderingContext, feature: DeviceFeature, extensions: GLExtensions): boolean {
  const featureInfo = WEBGL_FEATURES[feature];
  // string value requires checking the corresponding WebGL extension
  const isSupported =
    typeof featureInfo === 'string'
      ? Boolean(getWebGLExtension(gl, featureInfo, extensions))
      : Boolean(featureInfo);

  return isSupported;
}
export class DeviceFeatures {
  protected features = new Set<DeviceFeature>();

  constructor(features: DeviceFeature[] = []) {
    for (const feature of features) {
      this.features.add(feature);
    }
  }

  has(feature: DeviceFeature): boolean {
    return this.features.has(feature);
  }
}

export class WebGLFeatures extends DeviceFeatures {
  protected gl: WebGL2RenderingContext;
  protected extensions: GLExtensions;
  protected testedFeatures = new Set<DeviceFeature>();

  constructor(gl: WebGL2RenderingContext, extensions: GLExtensions) {
    super();
    this.gl = gl;
    this.extensions = extensions;
    // TODO - is this really needed?
    // Enable EXT_float_blend first: https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
    getWebGLExtension(gl, 'EXT_color_buffer_float', extensions);
  }

  override has(feature: DeviceFeature): boolean {
    // We have already tested this feature
    if (this.testedFeatures.has(feature)) {
      return this.features.has(feature);
    }

    // Check the feature once
    this.testedFeatures.add(feature);
    if (isTextureFeature(feature) && checkTextureFeature(this.gl, feature, this.extensions)) {
      this.features.add(feature);
      return true;
    }

    if (getWebGLFeature(this.gl, feature, this.extensions)) {
      this.features.add(feature);
      return true;
    }

    return false;
  }
}
