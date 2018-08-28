// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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

import test from 'tape-catch';
import {flattenToTypedArray} from 'loaders.gl/common/loader-utils/flatten';

const FLATTEN_VERTICES_TEST_CASES = [
  {
    title: 'empty array',
    argument: [],
    result: []
  },
  {
    title: 'flat arrays',
    argument: [1, 2, 3],
    result: [1, 2, 3]
  },
  {
    title: 'nested one level',
    argument: [[1, 2], [1, 2, 3]],
    result: [1, 2, 0, 1, 2, 3]
  }
  // {
  //   title: 'nested empty',
  //   argument: [1, [1, 2, 3], 3],
  //   result: [1, 1, 2, 3, 3, 0]
  // }
];

test('flatten#import', t => {
  t.ok(typeof flattenToTypedArray === 'function', 'flattenToTypedArray imported OK');
  t.end();
});

test('flatten#flattenToTypedArray', t => {
  for (const tc of FLATTEN_VERTICES_TEST_CASES) {
    const result = flattenToTypedArray(tc.argument);
    t.deepEqual(result, tc.result, `flattenToTypedArray ${tc.title} returned expected result`);
  }
  t.end();
});
