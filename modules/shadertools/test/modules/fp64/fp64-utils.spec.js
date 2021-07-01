import test from 'tape-promise/tape';
import {fp64} from '@luma.gl/shadertools';
import {_Pose as Pose} from '@math.gl/core';

test('fp64#fp64LowPart', (t) => {
  const x = Math.PI;
  const x32 = new Float32Array([x])[0];

  t.is(fp64.fp64LowPart(x) + x32, x, 'returns correct result');

  t.end();
});

test('fp64#fp64ify', (t) => {
  const x = Math.PI;

  const xHi = Math.fround(x);
  const xLow = x - xHi;

  t.deepEqual(fp64.fp64ify(x), [xHi, xLow], 'returns correct result');

  const target = new Array(10);
  fp64.fp64ify(x, target, 4);

  t.deepEqual(target.slice(4, 6), [xHi, xLow], 'populates target array');

  t.end();
});

test('fp64#fp64ifyMatrix4', (t) => {
  const matrix = new Pose({
    yaw: -0.00032679972032649654,
    pitch: 0.0017499351314303354,
    roll: 0.0006456183945756637,
    x: -29.95600959142378,
    y: 33.72513623131151,
    z: -0.40325097780902214
  }).getTransformationMatrix();

  const matrix64 = fp64.fp64ifyMatrix4(matrix);

  t.ok(matrix64 instanceof Float32Array, 'returns Float32Array');
  t.ok(matrix64.every(Number.isFinite), 'returns valid matrix');

  t.end();
});
