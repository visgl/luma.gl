// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {getCompoundBodyInertia} from '../../src/gpu-physics/rigid-body-properties';

it('compound inertia includes rotated tensors and the parallel-axis contribution', () => {
  const orientation: [number, number, number, number] = [
    0,
    0,
    Math.sin(Math.PI / 8),
    Math.cos(Math.PI / 8)
  ];
  const result = getCompoundBodyInertia(
    6,
    [-1, 1].map(offset => ({
      shape: {type: 'box', halfExtents: [1, 0.5, 0.25]},
      position: [offset, 0, 0],
      orientation
    })),
    [0, 0, 0]
  );
  const rotation = new Matrix4().fromQuaternion(result.orientation);
  const expected = [1.375, -0.75, 0, -0.75, 7.375, 0, 0, 0, 8.5];
  for (let row = 0; row < 3; row++)
    for (let column = 0; column < 3; column++) {
      let actual = 0;
      for (let axis = 0; axis < 3; axis++)
        actual += rotation[axis * 4 + row] * result.diagonal[axis] * rotation[axis * 4 + column];
      expect(actual).toBeCloseTo(expected[row * 3 + column], 8);
    }
});
