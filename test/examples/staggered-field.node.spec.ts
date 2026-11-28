// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {makeStaggeredGyre} from '../../examples/experimental/vector-observatory/staggered-field';

it('manufactures closed faces and vanishing finite-volume cell divergence', () => {
  const field = makeStaggeredGyre();
  const [rows, columns] = field.shape;
  let maximumDivergence = 0;
  for (let row = 0; row < rows; row++) {
    expect(Math.abs(field.eastward[row * (columns + 1)])).toBe(0);
    expect(Math.abs(field.eastward[row * (columns + 1) + columns])).toBe(0);
    for (let column = 0; column < columns; column++) {
      const divergence =
        (field.eastward[row * (columns + 1) + column + 1] -
          field.eastward[row * (columns + 1) + column]) *
          columns +
        (field.northward[(row + 1) * columns + column] - field.northward[row * columns + column]) *
          rows;
      maximumDivergence = Math.max(maximumDivergence, Math.abs(divergence));
    }
  }
  for (let column = 0; column < columns; column++) {
    expect(field.northward[column]).toBe(0);
    expect(field.northward[rows * columns + column]).toBe(0);
  }
  expect(maximumDivergence).toBeLessThan(0.000001);
  expect(field.eastwardValid.every(value => value === 1)).toBe(true);
  expect(field.northwardValid.every(value => value === 1)).toBe(true);
});
