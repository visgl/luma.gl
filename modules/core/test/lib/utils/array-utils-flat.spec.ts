// luma.gl, MIT license

import test from 'tape-promise/tape';
import {fillArray} from '@luma.gl/core';

const FILL_ARRAY_TEST_CASES = [
  {
    title: 'test array',
    arguments: {target: new Float32Array(10), source: [1, 2], count: 5},
    result: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
  }
];

test('flatten#import', (t) => {
  t.ok(typeof fillArray === 'function', 'fillArray imported OK');
  t.end();
});

test('fillArray#tests', (t) => {
  for (const tc of FILL_ARRAY_TEST_CASES) {
    const result = fillArray(tc.arguments);
    t.deepEqual(result, tc.result, `fillArray ${tc.title} returned expected result`);
  }
  t.end();
});
