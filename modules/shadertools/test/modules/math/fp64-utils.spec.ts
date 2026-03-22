import {expect, test} from 'vitest';
import { fp64 } from '@luma.gl/shadertools';
import { _Pose as Pose } from '@math.gl/core';
test('fp64#fp64LowPart', () => {
  const x = Math.PI;
  const x32 = new Float32Array([x])[0];
  expect(fp64.fp64LowPart(x) + x32, 'returns correct result').toBe(x);
});
test('fp64#fp64ify', () => {
  const x = Math.PI;
  const xHi = Math.fround(x);
  const xLow = x - xHi;
  expect(fp64.fp64ify(x), 'returns correct result').toEqual([xHi, xLow]);
  const target = new Array(10);
  fp64.fp64ify(x, target, 4);
  expect(target.slice(4, 6), 'populates target array').toEqual([xHi, xLow]);
});
test('fp64#fp64ifyMatrix4', () => {
  const matrix = new Pose({
    yaw: -0.00032679972032649654,
    pitch: 0.0017499351314303354,
    roll: 0.0006456183945756637,
    x: -29.95600959142378,
    y: 33.72513623131151,
    z: -0.40325097780902214
  }).getTransformationMatrix();
  const matrix64 = fp64.fp64ifyMatrix4(matrix);
  expect(matrix64 instanceof Float32Array, 'returns Float32Array').toBeTruthy();
  expect(matrix64.every(Number.isFinite), 'returns valid matrix').toBeTruthy();
});
