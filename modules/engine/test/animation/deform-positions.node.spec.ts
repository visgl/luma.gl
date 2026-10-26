// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {deformPositions} from '../../src/animation/deform-positions';
it('snapshots morph and normalized skin positions without mutating source geometry', () => {
  const positions = new Float32Array([1, 0, 0]);
  const target = new Float32Array([2, 0, 0]);
  const result = deformPositions({
    positions,
    targets: [target],
    weights: [0.5],
    jointMatrices: [new Matrix4().translate([3, 0, 0])],
    influences: [{joints: [0, 0, 0, 0], weights: [2, 0, 0, 0]}]
  });
  expect(Array.from(result)).toEqual([5, 0, 0]);
  expect(Array.from(positions)).toEqual([1, 0, 0]);
  expect(() => deformPositions({positions, targets: [new Float32Array(2)]})).toThrow();
  expect(() =>
    deformPositions({
      positions,
      jointMatrices: [],
      influences: [{joints: [0, 0, 0, 0], weights: [1, 0, 0, 0]}]
    })
  ).toThrow();
});
