// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray3} from '@math.gl/core';
import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting';
import {normalizeByteColor3} from '../../../lib/color/normalize-byte-colors';
import {areaLightingGLSL, areaLightingWGSL} from './area-lighting-shaders';

/** A uniformly emitting, one-sided rectangle or disk in world space. */
export type AreaLight = {
  type: 'rect' | 'disk';
  position: Readonly<NumberArray3>;
  /** Orthogonal world-space half-extent vectors; disk vectors represent radii. */
  halfAxisX: Readonly<NumberArray3>;
  halfAxisY: Readonly<NumberArray3>;
  /** World-space emitting normal, corresponding to local -Z. */
  normal: Readonly<NumberArray3>;
  color?: Readonly<NumberArray3>;
  /** Luminance in nits (cd/m²), independent of surface area. */
  intensity?: number;
};

export type AreaLightingProps = {lights?: readonly AreaLight[]; useByteColors?: boolean};
type AreaLightUniform = {
  color: Readonly<NumberArray3>;
  position: Readonly<NumberArray3>;
  halfAxisX: Readonly<NumberArray3>;
  halfAxisY: Readonly<NumberArray3>;
  normal: Readonly<NumberArray3>;
  disk: number;
};
type AreaLightingUniforms = {lightCount: number; lights: readonly AreaLightUniform[]};

const MAX_AREA_LIGHTS = 4;
function makeEmptyLight(): AreaLightUniform {
  return {
    color: [0, 0, 0],
    position: [0, 0, 0],
    halfAxisX: [0, 0, 0],
    halfAxisY: [0, 0, 0],
    normal: [0, 0, -1],
    disk: 0
  };
}

/** Deterministic 16-sample surface quadrature for PBR direct illumination. */
export const areaLighting = {
  name: 'areaLighting',
  props: {} as AreaLightingProps,
  uniforms: {} as AreaLightingUniforms,
  dependencies: [lighting],
  defaultUniforms: {lightCount: 0, lights: Array.from({length: MAX_AREA_LIGHTS}, makeEmptyLight)},
  uniformTypes: {
    lightCount: 'i32',
    lights: [
      {
        color: 'vec3<f32>',
        position: 'vec3<f32>',
        halfAxisX: 'vec3<f32>',
        halfAxisY: 'vec3<f32>',
        normal: 'vec3<f32>',
        disk: 'i32'
      },
      MAX_AREA_LIGHTS
    ]
  },
  bindingLayout: [{name: 'areaLighting', group: 2}],
  source: areaLightingWGSL,
  vs: areaLightingGLSL,
  fs: areaLightingGLSL,
  getUniforms(props: AreaLightingProps = {}): AreaLightingUniforms {
    const source = props.lights || [];
    return {
      lightCount: Math.min(source.length, MAX_AREA_LIGHTS),
      lights: Array.from({length: MAX_AREA_LIGHTS}, (_, index) => {
        const light = source[index];
        if (!light) return makeEmptyLight();
        const color = normalizeByteColor3(light.color || [1, 1, 1], props.useByteColors ?? false);
        return {
          position: light.position,
          halfAxisX: light.halfAxisX,
          halfAxisY: light.halfAxisY,
          normal: light.normal,
          color: color.map(component => component * (light.intensity ?? 1000)) as NumberArray3,
          disk: light.type === 'disk' ? 1 : 0
        };
      })
    };
  }
} as const satisfies ShaderModule<AreaLightingProps, AreaLightingUniforms, {}>;
