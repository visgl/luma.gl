// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  ALGEBRAIC_VARIETIES_WGSL,
  ALGEBRAIC_VARIETY_PRESETS,
  getAlgebraicVarietyPreset
} from '../../examples/showcase/algebraic-varieties/algebraic-varieties';
import {buildImplicitSurfaceShader} from '../../examples/showcase/algebraic-varieties/implicit-surface-shader';
import {
  intersectImplicitRay,
  intersectRayWithBoundingSphere
} from '../../examples/showcase/algebraic-varieties/implicit-surface';

describe('algebraic variety implicit intersection', () => {
  test('clips rays to a forward bounding-sphere interval', () => {
    expect(intersectRayWithBoundingSphere({origin: [0, 0, 3], direction: [0, 0, -1]}, 1)).toEqual({
      near: 2,
      far: 4
    });
    expect(intersectRayWithBoundingSphere({origin: [0, 0, 3], direction: [0, 1, 0]}, 1)).toBeNull();
  });

  test('returns the nearest positive bracketed root without treating f as an SDF', () => {
    const distance = intersectImplicitRay(
      {origin: [0, 0, 3], direction: [0, 0, -1]},
      ([x, y, z]) => x * x + y * y + z * z - 1,
      {boundingRadius: 1.2, sampleCount: 24}
    );
    expect(distance).toBeCloseTo(2, 5);
  });

  test('keeps presets and generic shader assembly independently reusable', () => {
    expect(ALGEBRAIC_VARIETY_PRESETS.map(preset => preset.degree)).toEqual([
      3, 3, 4, 4, 5, 6, 6, 4, 4, 3
    ]);
    expect(ALGEBRAIC_VARIETY_PRESETS.map(preset => preset.defaultDeformation)).toEqual([
      -0.12, 0.08, -0.06, 0, 0.06, 0, 0, 0, 0, 0
    ]);
    expect(getAlgebraicVarietyPreset('barth').shaderIndex).toBe(5);
    expect(getAlgebraicVarietyPreset('whitney').shaderIndex).toBe(9);
    const shader = buildImplicitSurfaceShader(ALGEBRAIC_VARIETIES_WGSL);
    expect(shader).toContain('fn evaluateImplicitField(point: vec3f) -> vec4f');
    expect(shader).toContain('fn evaluateTorus(point: vec3f) -> vec4f');
    expect(shader).toContain('fn evaluateTanglecube(point: vec3f) -> vec4f');
    expect(shader).toContain('fn evaluateWhitneyUmbrella(point: vec3f) -> vec4f');
    expect(shader).toContain('fn refineSignChange(');
    expect(shader).toContain('fn refineNearRoot(');
    expect(shader).toContain('fn acesFilm(');
    expect(shader).toContain('@fragment');
    expect(shader).toContain('fn fragmentMain');
    expect(shader).not.toContain('sphereTrace');
  });
});
