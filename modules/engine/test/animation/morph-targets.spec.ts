// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {applyMorphTargets} from '@luma.gl/engine';
import test from 'test/utils/vitest-tape';

test('Animation#applyMorphTargets preserves immutable bases and combines all target weights', t => {
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

  t.deepEqual(Array.from(positions), [1, 2, 3, 4, 5, 6], 'leaves source positions untouched');
  t.deepEqual(
    Array.from(morphed.POSITION || []),
    [2, 3, 3, 4, 6, 7],
    'combines weighted positions'
  );
  t.ok(
    Math.abs(Math.hypot(...Array.from(morphed.NORMAL?.slice(0, 3) || [])) - 1) < 1e-6,
    'renormalizes morphed normals'
  );
  t.equal(morphed.TANGENT?.[3], -1, 'preserves tangent handedness');
  t.equal(morphed.TANGENT?.[7], 1, 'preserves every tangent handedness component');
  t.end();
});

test('Animation#applyMorphTargets handles more than four independent target weights', t => {
  const targets = Array.from({length: 8}, (_, index) => ({
    POSITION: new Float32Array([index + 1, 0, 0])
  }));
  const weights = Array.from({length: 8}, () => 0.25);
  const morphed = applyMorphTargets({POSITION: new Float32Array([0, 0, 0])}, targets, weights);

  t.equal(morphed.POSITION?.[0], 9, 'applies the complete MorphStressTest-sized target set');
  t.end();
});
