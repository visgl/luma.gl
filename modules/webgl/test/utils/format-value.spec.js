// Copyright (c) 2015 - 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import test from 'tape-promise/tape';
import {formatValue} from '@luma.gl/webgl/utils/format-value';

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
