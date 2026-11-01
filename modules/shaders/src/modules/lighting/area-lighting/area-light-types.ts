// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray3} from '@math.gl/core';
import {normalizeByteColor3} from '../../../lib/color/normalize-byte-colors';

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

export type AreaLightUniform = {
  color: Readonly<NumberArray3>;
  position: Readonly<NumberArray3>;
  halfAxisX: Readonly<NumberArray3>;
  halfAxisY: Readonly<NumberArray3>;
  normal: Readonly<NumberArray3>;
  disk: number;
};
export const MAX_AREA_LIGHTS = 4;
export function makeEmptyLight(): AreaLightUniform {
  return {
    color: [0, 0, 0],
    position: [0, 0, 0],
    halfAxisX: [0, 0, 0],
    halfAxisY: [0, 0, 0],
    normal: [0, 0, -1],
    disk: 0
  };
}

export const AREA_LIGHT_UNIFORM_TYPE = {
  color: 'vec3<f32>',
  position: 'vec3<f32>',
  halfAxisX: 'vec3<f32>',
  halfAxisY: 'vec3<f32>',
  normal: 'vec3<f32>',
  disk: 'i32'
} as const;

export function packAreaLights(
  lights: readonly AreaLight[],
  useByteColors = false
): AreaLightUniform[] {
  return Array.from({length: MAX_AREA_LIGHTS}, (_, index) => {
    const light = lights[index];
    if (!light) return makeEmptyLight();
    const color = normalizeByteColor3(
      light.color || (useByteColors ? [255, 255, 255] : [1, 1, 1]),
      useByteColors
    );
    return {
      position: light.position,
      halfAxisX: light.halfAxisX,
      halfAxisY: light.halfAxisY,
      normal: light.normal,
      disk: light.type === 'disk' ? 1 : 0,
      color: color.map(component => component * (light.intensity ?? 1000)) as NumberArray3
    };
  });
}
