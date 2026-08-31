// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {applyMorphTargets} from '@luma.gl/engine';
import {expect, it} from 'vitest';

it('Animation#applyMorphTargets preserves immutable bases and combines all target weights', () => {
  const positions = new Float32Array([1, 2, 3, 4, 5, 6]);
  const normals = new Float32Array([0, 0, 1, 0, 1, 0]);
  const tangents = new Float32Array([1, 0, 0, -1, 0, 1, 0, 1]);
  const morphed = applyMorphTargets(
    {POSITION: positions, NORMAL: normals, TANGENT: tangents},
    [
      {
        POSITION: new Float32Array([2, 0, 0, 0, 2, 0]),
        NORMAL: new Float32Array([0, 1, 0, 1, 0, 0]),
        TANGENT: new Float32Array([0, 1, 0, 1, 0, 0])
      },
      {POSITION: new Float32Array([0, 4, 0, 0, 0, 4])}
    ],
    [0.5, 0.25]
  );

  expect(Array.from(positions), 'leaves source positions untouched').toEqual([1, 2, 3, 4, 5, 6]);
  expect(Array.from(morphed.POSITION || []), 'combines weighted positions').toEqual([
    2, 3, 3, 4, 6, 7
  ]);
  expect(
    Math.abs(Math.hypot(...Array.from(morphed.NORMAL?.slice(0, 3) || [])) - 1) < 1e-6,
    'renormalizes morphed normals'
  ).toBe(true);
  expect(morphed.TANGENT?.[3], 'preserves tangent handedness').toBe(-1);
  expect(morphed.TANGENT?.[7], 'preserves every tangent handedness component').toBe(1);
});

it('Animation#applyMorphTargets handles more than four independent target weights', () => {
  const targets = Array.from({length: 8}, (_, index) => ({
    POSITION: new Float32Array([index + 1, 0, 0])
  }));
  const weights = Array.from({length: 8}, () => 0.25);
  const morphed = applyMorphTargets({POSITION: new Float32Array([0, 0, 0])}, targets, weights);

  expect(morphed.POSITION?.[0], 'applies the complete MorphStressTest-sized target set').toBe(9);
});
