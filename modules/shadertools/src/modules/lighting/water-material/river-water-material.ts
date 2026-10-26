// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {waterMaterial} from './water-material';
import {RIVER_WATER_GLSL, RIVER_WATER_WGSL} from './river-water-shaders';

export type RiverWaterMaterialProps = {
  enabled?: number;
  /** Local east/north direction of river flow. */
  flowDirection?: [number, number];
  /** Linear sky tint above the horizon. The horizon uses waterMaterial.fresnelColor. */
  skyZenithColor?: [number, number, number];
  /** Unit up direction in the same coordinate frame as the supplied surface normal. */
  skyUpDirection?: [number, number, number];
};

export type RiverWaterMaterialUniforms = {
  enabled?: number;
  flowDirection?: [number, number];
  /** Linear sky tint above the horizon. The horizon uses waterMaterial.fresnelColor. */
  skyZenithColor?: [number, number, number];
  /** Unit up direction in the same coordinate frame as the supplied surface normal. */
  skyUpDirection?: [number, number, number];
};

/** A layered, animated river surface variant built on top of the shared water uniforms. */
export const riverWaterMaterial: ShaderModule<RiverWaterMaterialProps, RiverWaterMaterialUniforms> =
  {
    name: 'riverWaterMaterial',
    firstBindingSlot: 1,
    bindingLayout: [{name: 'riverWaterMaterial', group: 3}],
    dependencies: [waterMaterial],
    source: RIVER_WATER_WGSL,
    fs: RIVER_WATER_GLSL,
    uniformTypes: {
      enabled: 'i32',
      flowDirection: 'vec2<f32>',
      skyZenithColor: 'vec3<f32>',
      skyUpDirection: 'vec3<f32>'
    },
    defaultUniforms: {
      enabled: 0,
      flowDirection: [0, 1],
      skyZenithColor: [0.22, 0.48, 0.57],
      skyUpDirection: [0, 0, 1]
    },
    getUniforms(props = {}, previousUniforms = {}) {
      return {
        enabled: props.enabled ?? previousUniforms.enabled ?? 0,
        flowDirection: props.flowDirection ?? previousUniforms.flowDirection ?? [0, 1],
        skyZenithColor: props.skyZenithColor ??
          previousUniforms.skyZenithColor ?? [0.22, 0.48, 0.57],
        skyUpDirection: props.skyUpDirection ?? previousUniforms.skyUpDirection ?? [0, 0, 1]
      };
    }
  };
