// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {waterMaterial} from './water-material';
import {RIVER_WATER_GLSL, RIVER_WATER_WGSL} from './river-water-shaders';

export type RiverWaterMaterialProps = {
  enabled?: number;
};

export type RiverWaterMaterialUniforms = {
  enabled?: number;
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
    uniformTypes: {enabled: 'i32'},
    defaultUniforms: {enabled: 0},
    getUniforms(props = {}) {
      return {enabled: props.enabled ?? 0};
    }
  };
