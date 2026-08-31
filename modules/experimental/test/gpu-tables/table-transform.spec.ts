// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {TableTransform} from '@luma.gl/experimental/gpu-tables';
import type {ShaderLayout} from '@luma.gl/core';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

const TRANSFORM_VERTEX_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in float values;
out float nextValues;

void main() {
  nextValues = values * 2.0;
}
`;

const TRANSFORM_SHADER_LAYOUT = {
  attributes: [{name: 'values', location: 0, type: 'f32'}],
  bindings: []
} satisfies ShaderLayout;

it('TableTransform copies dense outputs back into inputVectors', async () => {
  const device = await getWebGLTestDevice();
  const values = makeGPUVectorFromArrow(device, arrow.makeVector(new Float32Array([1, 2, 3])), {
    name: 'values'
  });
  const transform = new TableTransform(device, {
    vs: TRANSFORM_VERTEX_SHADER,
    shaderLayout: TRANSFORM_SHADER_LAYOUT,
    inputVectors: {values},
    copyOutputToInputVectors: {nextValues: 'values'}
  });

  expect(
    Boolean(transform.outputVectors.nextValues),
    'allocates an output vector for writeback'
  ).toBe(true);
  transform.run();

  const transformedValues = await readFloat32GPUVector(values);
  expect(
    Array.from(transformedValues),
    'copies transform outputs back into the input vector buffer'
  ).toEqual([2, 4, 6]);

  transform.destroy();
  values.destroy();
  void 0;
});

it('TableTransform rejects padded automatic writeback vectors', async () => {
  const device = await getWebGLTestDevice();
  const buffer = device.createBuffer({byteLength: 16});
  const values = new GPUVector({
    type: 'buffer',
    name: 'values',
    buffer,
    format: 'float32',
    length: 2,
    stride: 1,
    byteStride: 8,
    rowByteLength: Float32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });

  expect(
    () =>
      new TableTransform(device, {
        vs: TRANSFORM_VERTEX_SHADER,
        shaderLayout: TRANSFORM_SHADER_LAYOUT,
        inputVectors: {values},
        copyOutputToInputVectors: {nextValues: 'values'}
      }),
    'automatic writeback documents its dense-copy limitation in behavior'
  ).toThrow(/requires tightly packed input vector/);

  values.destroy();
  void 0;
});

async function readFloat32GPUVector(vector: GPUVector): Promise<Float32Array> {
  const data = vector.data[0];
  const bytes = await data.buffer.readAsync(data.byteOffset, data.length * data.byteStride);
  return new Float32Array(bytes.buffer, bytes.byteOffset, vector.length);
}
