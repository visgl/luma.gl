// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// Special utility functions for df64 tests

/* eslint-disable camelcase, prefer-template, max-len */

import {Device} from '@luma.gl/core';
import {BufferTransform} from '@luma.gl/engine';
import {fp64, fp64arithmetic} from '@luma.gl/shadertools';
import {equals, config} from '@math.gl/core';
const {fp64ify} = fp64;

// Use 'invariant' specifier to work around some issues on Apple GPUs. The
// specifier may or may not have an effect, depending on the browser and the
// ANGLE backend, but it's an improvement when it's supported.
// See: https://github.com/visgl/luma.gl/issues/1764

function getBinaryShader(operation: string): string {
  const shader = `\
#version 300 es
in vec2 a;
in vec2 b;
invariant out vec2 result;
void main(void) {
  result = ${operation}(a, b);
}
`;
  return shader;
}

function getUnaryShader(operation: string): string {
  return `\
#version 300 es
in vec2 a;
in vec2 b;
invariant out vec2 result;
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
  const transform = new BufferTransform(device, {
    vs,
    modules: [fp64],
    attributes: {a: bufferA, b: bufferB},
    bufferLayout: [{name: 'a', format: 'float32x2'}, {name: 'b', format: 'float32x2'}],
    feedbackBuffers: {result: bufferResult},
    varyings: ['result'],
    vertexCount: testCases.length
  });
  return {a, b, expected, a_fp64, b_fp64, expected_fp64, transform};
}

export async function runTests(device: Device, {glslFunc, binary = false, op, limit = 256, testCases, t}) {
  if (!BufferTransform.isSupported(device)) {
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
    const result64 = gpuResult[2 * idx] + gpuResult[2 * idx + 1];

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
