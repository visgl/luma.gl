// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting';
import {areaLTCGLSL, areaLTCWGSL} from './ltc-shaders';
import {areaLightingGLSL, areaLightingWGSL} from './area-lighting-shaders';

export type {AreaLight} from './area-light-types';
import {
  type AreaLight,
  type AreaLightUniform,
  MAX_AREA_LIGHTS,
  AREA_LIGHT_UNIFORM_TYPE,
  packAreaLights,
  makeEmptyLight
} from './area-light-types';

export type AreaLightingProps = {
  lights?: readonly AreaLight[];
  useByteColors?: boolean;
  sampleCount?: 16 | 64 | 256;
};
type AreaLightingUniforms = {
  lightCount: number;
  sampleCount: number;
  lights: readonly AreaLightUniform[];
};

/** Area-light compatibility props and shader resources for LTC or numerical reference integration. */
export const areaLighting = {
  name: 'areaLighting',
  props: {} as AreaLightingProps,
  uniforms: {} as AreaLightingUniforms,
  dependencies: [lighting],
  defaultUniforms: {
    lightCount: 0,
    sampleCount: 64,
    lights: Array.from({length: MAX_AREA_LIGHTS}, makeEmptyLight)
  },
  uniformTypes: {
    lightCount: 'i32',
    sampleCount: 'i32',
    lights: [AREA_LIGHT_UNIFORM_TYPE, MAX_AREA_LIGHTS]
  },
  bindingLayout: [
    {name: 'areaLighting', group: 2},
    {name: 'areaLTCMatrix', group: 2},
    {name: 'areaLTCAmplitude', group: 2}
  ],
  source: areaLightingWGSL + areaLTCWGSL,
  vs: areaLightingGLSL + areaLTCGLSL,
  fs: areaLightingGLSL + areaLTCGLSL,
  getUniforms(props: AreaLightingProps = {}): AreaLightingUniforms {
    const source = props.lights || [];
    return {
      lightCount: Math.min(source.length, MAX_AREA_LIGHTS),
      sampleCount: props.sampleCount || 64,
      lights: packAreaLights(source, props.useByteColors)
    };
  }
} as const satisfies ShaderModule<AreaLightingProps, AreaLightingUniforms, {}>;
