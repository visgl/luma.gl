// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {validateGPUVectorBatchStructure} from '../../src';

const vector = (lengths: number[]) => ({
  length: lengths.reduce((total, length) => total + length, 0),
  data: lengths.map(length => ({length}))
});

it('batch validation preserves boundaries and broadcasts constants', () => {
  expect(() =>
    validateGPUVectorBatchStructure({
      positions: vector([0, 2, 3]),
      colors: vector([0, 2, 3]),
      constant: {isConstant: true}
    })
  ).not.toThrow();
  expect(() => validateGPUVectorBatchStructure([])).not.toThrow();
});

it.each([
  {lengths: [1, 4]},
  {lengths: [5]},
  {lengths: [2, 4]}
])('batch validation rejects incompatible chunks $lengths', ({lengths}) => {
  expect(() => validateGPUVectorBatchStructure([vector([2, 3]), vector(lengths)])).toThrow();
});

it('batch validation rejects row counts that disagree with chunk storage', () => {
  expect(() =>
    validateGPUVectorBatchStructure([{length: 6, data: [{length: 2}, {length: 3}]}])
  ).toThrow();
});
