// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {formatValue} from '@luma.gl/core';

const FORMAT_VALUE_TEST_CASES = [
  {
    value: 10.1,
    opts: {isInteger: true},
    result: '10'
  },
  {
    value: 10.99,
    opts: {isInteger: true},
    result: '11'
  },
  {
    value: 100.5,
    result: '101'
  },
  {
    value: 100.49,
    result: '100'
  },
  {
    value: 'non-finite',
    result: 'non-finite'
  },
  {
    value: 1e-17,
    result: '0.'
  },
  {
    value: 1e-17,
    opts: {isInteger: true},
    result: '0'
  },
  {
    value: 1e-16,
    result: '1.0e-16'
  },
  {
    value: 1e-16,
    opts: {isInteger: true},
    result: '0'
  },
  {
    value: [1, 2, 3],
    opts: {isInteger: true},
    result: '[1, 2, 3]'
  },
  {
    value: [1, 2, 3],
    opts: {size: 0},
    result: '[1.,2.,3.]'
  }
];

test('formatValue', (t) => {
  FORMAT_VALUE_TEST_CASES.forEach((tc) => {
    t.equal(formatValue(tc.value, tc.opts), tc.result);
  });
  t.end();
});
