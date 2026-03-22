import {expect, test} from 'vitest';
import { toHalfFloat, fromHalfFloat } from '@luma.gl/shadertools';
test('fp16#toHalfFloat', () => {
  expect(toHalfFloat(0) === 0, 'Passed!').toBeTruthy();

  // surpress the following console message during testing
  // THREE.toHalfFloat(): Value out of range.

  expect(toHalfFloat(100000) === 31743, 'Passed!').toBeTruthy();
  expect(toHalfFloat(-100000) === 64511, 'Passed!').toBeTruthy();
  expect(toHalfFloat(65504) === 31743, 'Passed!').toBeTruthy();
  expect(toHalfFloat(-65504) === 64511, 'Passed!').toBeTruthy();
  expect(toHalfFloat(Math.PI) === 16968, 'Passed!').toBeTruthy();
  expect(toHalfFloat(-Math.PI) === 49736, 'Passed!').toBeTruthy();
});
test('fp16#fromHalfFloat', () => {
  expect(fromHalfFloat(0) === 0, 'Passed!').toBeTruthy();
  expect(fromHalfFloat(31744) === Infinity, 'Passed!').toBeTruthy();
  expect(fromHalfFloat(64512) === -Infinity, 'Passed!').toBeTruthy();
  expect(fromHalfFloat(31743) === 65504, 'Passed!').toBeTruthy();
  expect(fromHalfFloat(64511) === -65504, 'Passed!').toBeTruthy();
  expect(fromHalfFloat(16968) === 3.140625, 'Passed!').toBeTruthy();
  expect(fromHalfFloat(49736) === -3.140625, 'Passed!').toBeTruthy();
});
