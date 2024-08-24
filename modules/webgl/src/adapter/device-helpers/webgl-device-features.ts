// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Feature detection for WebGL
// Provides a function that enables simple checking of which WebGL features are

import {DeviceFeature, DeviceFeatures} from '@luma.gl/core';
import {GLExtensions} from '@luma.gl/constants';
import {getWebGLExtension} from '../../context/helpers/webgl-extensions';
import {
  isTextureFeature,
  checkTextureFeature,
  TEXTURE_FEATURES
} from '../converters/webgl-texture-table';

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

/**
 * WebGL extensions exposed as luma.gl features
 * To minimize GL log noise and improve performance, this class ensures that
 * - WebGL extensions are not queried until the corresponding feature is checked.
 * - WebGL extensions are only queried once.
 */
export class WebGLDeviceFeatures extends DeviceFeatures {
  protected gl: WebGL2RenderingContext;
  protected extensions: GLExtensions;
  protected testedFeatures = new Set<DeviceFeature>();

  constructor(
    gl: WebGL2RenderingContext,
    extensions: GLExtensions,
    disabledFeatures: Partial<Record<DeviceFeature, boolean>>
  ) {
    super([], disabledFeatures);
    this.gl = gl;
    this.extensions = extensions;
    // TODO - is this really needed?
    // Enable EXT_float_blend first: https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
    getWebGLExtension(gl, 'EXT_color_buffer_float', extensions);
  }

  *[Symbol.iterator](): IterableIterator<DeviceFeature> {
    const features = this.getFeatures();
    for (const feature of features) {
      if (this.has(feature)) {
        yield feature;
      }
    }
    return [];
  }

  override has(feature: DeviceFeature): boolean {
    if (this.disabledFeatures?.[feature]) {
      return false;
    }

    // We have already tested this feature
    if (!this.testedFeatures.has(feature)) {
      this.testedFeatures.add(feature);

      // Check the feature once
      if (isTextureFeature(feature) && checkTextureFeature(this.gl, feature, this.extensions)) {
        this.features.add(feature);
      }

      if (this.getWebGLFeature(feature)) {
        this.features.add(feature);
      }
    }
    return this.features.has(feature);
  }

  // FOR DEVICE

  initializeFeatures() {
    // Initialize all features by checking them.
    // Except WEBGL_polygon_mode since Chrome logs ugly console warnings
    const features = this.getFeatures().filter(feature => feature !== 'polygon-mode-webgl');
    for (const feature of features) {
      this.has(feature);
    }
  }

  // IMPLEMENTATION

  getFeatures() {
    return [...Object.keys(WEBGL_FEATURES), ...Object.keys(TEXTURE_FEATURES)] as DeviceFeature[];
  }

  /** Extract all WebGL features */
  protected getWebGLFeature(feature: DeviceFeature): boolean {
    const featureInfo = WEBGL_FEATURES[feature];
    // string value requires checking the corresponding WebGL extension
    const isSupported =
      typeof featureInfo === 'string'
        ? Boolean(getWebGLExtension(this.gl, featureInfo, this.extensions))
        : Boolean(featureInfo);

    return isSupported;
  }
}
