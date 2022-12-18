// luma.gl, MIT license
// Special utility functions for df64 tests

/* eslint-disable camelcase, prefer-template, max-len */

import {Device} from '@luma.gl/api';
import {Buffer} from '@luma.gl/webgl-legacy';
import {Transform} from '@luma.gl/webgl-legacy';
import {fp64} from '@luma.gl/shadertools';
import {equals, config} from '@math.gl/core';
const {fp64ify} = fp64;

function getBinaryShader(operation: string): string {
  const shader = `\
attribute vec2 a;
attribute vec2 b;
varying vec2 result;
void main(void) {
  result = ${operation}(a, b);
}
`;
  return shader;
}

function getUnaryShader(operation: string): string {
  return `\
attribute vec2 a;
attribute vec2 b;
varying vec2 result;
void main(void) {
  result = ${operation}(a);
}
`;
}

config.EPSILON = 1e-11;

function setupFloatData({limit, op, testCases}) {
  const count = testCases.length;
  const a_fp64 = new Float32Array(count * 2);
  const b_fp64 = new Float32Array(count * 2);
  const expected_fp64 = new Float32Array(count * 2);
  const a = new Array(count);
  const b = new Array(count);
  const expected = new Array(count);
  for (let idx = 0; idx < count; idx++) {
    const index = idx * 2;
    a[idx] = testCases[idx].a;
    b[idx] = testCases[idx].b;
    expected[idx] = op(a[idx], b[idx]);

    fp64ify(a[idx], a_fp64, index);
    fp64ify(b[idx], b_fp64, index);
    fp64ify(expected[idx], expected_fp64, index);
  }
  return {a, b, expected, a_fp64, b_fp64, expected_fp64};
}

function setupFloatTest(device: Device, {glslFunc, binary = false, limit = 256, op, testCases}) {
  const {a, b, expected, a_fp64, b_fp64, expected_fp64} = setupFloatData({limit, op, testCases});
  const vs = binary ? getBinaryShader(glslFunc) : getUnaryShader(glslFunc);
  const transform = new Transform(device, {
    sourceBuffers: {
      a: new Buffer(device, {data: a_fp64}),
      b: new Buffer(device, {data: b_fp64})
    },
    vs,
    modules: [fp64],
    feedbackMap: {
      a: 'result'
    },
    varyings: ['result'],
    elementCount: testCases.length
  });
  return {a, b, expected, a_fp64, b_fp64, expected_fp64, transform};
}

export function runTests(device: Device, {glslFunc, binary = false, op, limit = 256, testCases, t}) {
  if (!Transform.isSupported(device)) {
    t.comment('Transform not supported, skipping tests');
    t.end();
    return;
  }

  const {a, b, a_fp64, b_fp64, expected_fp64, transform} = setupFloatTest(device, {
    glslFunc,
    binary,
    op,
    limit,
    testCases
  });
  transform.run({uniforms: {ONE: 1}});
  const gpu_result = transform.getBuffer('result').getData();
  for (let idx = 0; idx < testCases.length; idx++) {
    const reference64 = expected_fp64[2 * idx] + expected_fp64[2 * idx + 1];
    const result64 = gpu_result[2 * idx] + gpu_result[2 * idx + 1];

    const args = binary
      ? `(${a[idx].toPrecision(2)}, ${b[idx].toPrecision(2)})`
      : `(${a[idx].toPrecision(2)})`;
    const message = `${glslFunc}${args} error within tolerance`;
    const isEqual = equals(reference64, result64);
    t.ok(isEqual, message);
    if (!isEqual) {
      t.comment(` (tested ${a_fp64.toString()}, ${b_fp64.toString()})`);
    }
  }
}
