import {expect, test} from 'vitest';
import { fillArray } from '@luma.gl/webgl/utils/fill-array';
const FILL_ARRAY_TEST_CASES = [{
  title: 'test array',
  arguments: {
    target: new Float32Array(10),
    source: [1, 2],
    count: 5
  },
  result: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
}];
test('fillArray#import', () => {
  expect(typeof fillArray === 'function', 'fillArray imported OK').toBeTruthy();
});
test('fillArray#tests', () => {
  for (const tc of FILL_ARRAY_TEST_CASES) {
    const result = fillArray(tc.arguments);
    expect(result, `fillArray ${tc.title} returned expected result`).toEqual(tc.result);
  }
});
