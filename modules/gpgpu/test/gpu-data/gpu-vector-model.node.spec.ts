// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Buffer, ShaderLayout} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUData,
  GPUVector,
  GPUVectorModel,
  getGPUVectorModelBatches
} from '@luma.gl/gpgpu/gpu-data';

const SHADER_LAYOUT = {
  attributes: [{name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'}],
  bindings: []
} satisfies ShaderLayout;

const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 positions;
void main() { gl_Position = vec4(positions, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(1.0); }
`;

it('GPUVectorModel draws aligned borrowed chunks without taking buffer ownership', () => {
  const device = new NullDevice({});
  const firstBuffer = device.createBuffer({data: new Float32Array([0, 0, 1, 1])});
  const secondBuffer = device.createBuffer({data: new Float32Array([2, 2, 3, 3, 4, 4])});
  const positions = new GPUVector<'float32x2'>({
    type: 'data',
    name: 'positions',
    format: 'float32x2',
    data: [
      new GPUData({
        buffer: firstBuffer,
        format: 'float32x2',
        length: 2,
        ownsBuffer: true
      }),
      new GPUData({
        buffer: secondBuffer,
        format: 'float32x2',
        length: 3,
        ownsBuffer: true
      })
    ],
    ownsData: true
  });
  const model = new GPUVectorModel(device, {
    id: 'gpu-vector-model-test',
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    shaderLayout: SHADER_LAYOUT,
    bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'instance'}],
    attributes: {positions: firstBuffer},
    isInstanced: true,
    vertexCount: 1
  });
  const renderPass = device.getDefaultRenderPass();
  const drawCalls: Array<{instanceCount?: number; buffer?: Buffer}> = [];
  const draw = renderPass.draw.bind(renderPass);
  renderPass.draw = options => {
    drawCalls.push({
      instanceCount: options.instanceCount,
      buffer: renderPass.vertexArray?.attributes[0] as Buffer
    });
    return draw(options);
  };

  const batches: Array<{batchIndex: number; rowIndexOffset: number}> = [];
  expect(
    model.drawBatches(renderPass, {
      vectors: {positions},
      onBatch: ({batchIndex, rowIndexOffset}) => batches.push({batchIndex, rowIndexOffset})
    })
  ).toBe(true);
  expect(drawCalls.map(call => call.instanceCount)).toEqual([2, 3]);
  expect(drawCalls.map(call => call.buffer)).toEqual([firstBuffer, secondBuffer]);
  expect(batches).toEqual([
    {batchIndex: 0, rowIndexOffset: 0},
    {batchIndex: 1, rowIndexOffset: 2}
  ]);

  model.destroy();
  expect(firstBuffer.destroyed).toBe(false);
  expect(secondBuffer.destroyed).toBe(false);
  positions.destroy();
  expect(firstBuffer.destroyed).toBe(true);
  expect(secondBuffer.destroyed).toBe(true);
  renderPass.destroy();
  void 0;
});

it('getGPUVectorModelBatches validates aligned fixed-width chunks', () => {
  const device = new NullDevice({});
  const positions = makeVector(device, 'positions', 'float32x2', [2, 3]);
  const colors = makeVector(device, 'colors', 'unorm8x4', [2, 3]);

  expect(getGPUVectorModelBatches('test-model', {positions, colors})).toMatchObject([
    {batchIndex: 0, rowIndexOffset: 0, rowCount: 2},
    {batchIndex: 1, rowIndexOffset: 2, rowCount: 3}
  ]);

  const misalignedColors = makeVector(device, 'colors', 'unorm8x4', [3, 2]);
  expect(() =>
    getGPUVectorModelBatches('test-model', {positions, colors: misalignedColors})
  ).toThrow('chunk 0 row counts must align');

  positions.destroy();
  colors.destroy();
  misalignedColors.destroy();
});

function makeVector(
  device: NullDevice,
  name: string,
  format: 'float32x2' | 'unorm8x4',
  chunkLengths: number[]
): GPUVector<'float32x2' | 'unorm8x4'> {
  const byteStride = 8;
  return new GPUVector({
    type: 'data',
    name,
    format,
    data: chunkLengths.map(
      length =>
        new GPUData({
          buffer: device.createBuffer({byteLength: length * byteStride}),
          format,
          length,
          ownsBuffer: true
        })
    ),
    ownsData: true
  });
}
