// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {arrayEqual} from '../../src/utils/array-equal';

it('arrayEqual compares small number arrays by value', () => {
  expect(
    Boolean(arrayEqual([1, 2, 3], [1, 2, 3])),
    'small number arrays with equal values compare equal'
  ).toBe(true);
  expect(
    Boolean(arrayEqual([1, 2, 3], [1, 2, 4])),
    'small number arrays with different values compare unequal'
  ).toBe(false);
  expect(
    Boolean(arrayEqual(new Float32Array([1, 2, 3]), new Float32Array([1, 2, 3]))),
    'small typed arrays with equal values compare equal'
  ).toBe(true);
  expect(
    Boolean(arrayEqual(new Float32Array([1, 2, 3]), new Float32Array([1, 2, 4]))),
    'small typed arrays with different values compare unequal'
  ).toBe(false);
  void 0;
});

it('arrayEqual avoids element-wise comparison for large arrays unless references match', () => {
  const largeArray = Array.from({length: 17}, (_, index) => index);

  expect(
    Boolean(arrayEqual(largeArray, largeArray)),
    'same large array reference compares equal'
  ).toBe(true);
  expect(
    Boolean(
      arrayEqual(
        largeArray,
        Array.from({length: 17}, (_, index) => index)
      )
    ),
    'distinct large arrays do not trigger element-wise comparison by default'
  ).toBe(false);
  expect(
    Boolean(
      arrayEqual(
        new Float32Array(Array.from({length: 129}, (_, index) => index)),
        new Float32Array(Array.from({length: 129}, (_, index) => index)),
        256
      )
    ),
    'distinct typed arrays above the hard compare cap do not trigger element-wise comparison'
  ).toBe(false);
  void 0;
});
