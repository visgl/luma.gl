// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// Special utility functions for df64 tests

/* eslint-disable camelcase, prefer-template, max-len */

import {Device} from '@luma.gl/core';
import {Transform} from '@luma.gl/engine';
import {fp64, fp64arithmetic} from '@luma.gl/shadertools';
import {equals, config} from '@math.gl/core';
const {fp64ify} = fp64;

function getBinaryShader(operation: string): string {
  const shader = `\
attribute vec2 a;
attribute vec2 b;
invariant varying vec2 result;
void main(void) {
  //// original ////

  result = ${operation}(a, b);

  //// from fp64-arithmetic.glsl.ts ////

  // vec2 s, t;
  // s = twoSum(a.x, b.x);
  // t = twoSum(a.y, b.y);
  // s.y += t.x;
  // s = quickTwoSum(s.x, s.y);
  // s.y += t.y;
  // s = quickTwoSum(s.x, s.y);
  // result = s;

  //// from https://blog.cyclemap.link/2011-06-09-glsl-part2-emu/ ////

  // float t1 = a.x + b.x;
  // float e = t1 - a.x;
  // float t2 = ((b.x - e) + (a.x - (t1 - e))) + a.y + b.y;
  // result.x = t1 + t2;
  // result.y = t2 - (result.x - t1);
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
  const bufferA = device.createBuffer({data: a_fp64});
  const bufferB = device.createBuffer({data: b_fp64});
  const bufferResult = device.createBuffer({byteLength: a_fp64.byteLength});
  const transform = new Transform(device, {
    vs,
    modules: [fp64],
    attributes: {a: bufferA, b: bufferB},
    bufferLayout: [{name: 'a', format: 'float32'}, {name: 'b', format: 'float32'}],
    feedbackBuffers: {result: bufferResult},
    varyings: ['result'],
    vertexCount: testCases.length
  });
  return {a, b, expected, a_fp64, b_fp64, expected_fp64, transform};
}

export async function runTests(device: Device, {glslFunc, binary = false, op, limit = 256, testCases, t}) {
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

  transform.run({uniforms: fp64arithmetic.getUniforms()});

  const {buffer, byteOffset, byteLength} = await transform.readAsync('result');
  const gpuResult = new Float32Array(buffer, byteOffset, byteLength / Float32Array.BYTES_PER_ELEMENT);
  for (let idx = 0; idx < testCases.length; idx++) {
    const reference64 = expected_fp64[2 * idx] + expected_fp64[2 * idx + 1];
    const stride = 4; // 2; ???
    const result64 = gpuResult[stride * idx] + gpuResult[stride * idx + 1];

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
