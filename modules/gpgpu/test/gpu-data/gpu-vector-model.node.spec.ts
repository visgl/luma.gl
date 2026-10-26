// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type ShaderLayout} from '@luma.gl/core';
import {GPUVectorModel as EngineGPUVectorModel, Model} from '@luma.gl/engine';
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

it.each([
  {name: 'GPUVectorModel', ModelClass: GPUVectorModel},
  {name: 'Model', ModelClass: Model}
])('$name draws aligned borrowed chunks without taking buffer ownership', ({ModelClass}) => {
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
  const model = new ModelClass(device, {
    id: 'gpu-vector-model-test',
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    shaderLayout: SHADER_LAYOUT,
    bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'instance'}],
    attributes: {positions: firstBuffer},
    isInstanced: true,
    vertexCount: 1
  });
  const previousBuffer = device.createBuffer({data: new Float32Array([9, 9])});
  model.setAttributes({positions: previousBuffer});
  model.setInstanceCount(7);
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
  expect(model.instanceCount).toBe(7);
  expect(renderPass.vertexArray?.attributes[0]).toBe(previousBuffer);

  model.destroy();
  expect(firstBuffer.destroyed).toBe(false);
  expect(secondBuffer.destroyed).toBe(false);
  previousBuffer.destroy();
  positions.destroy();
  expect(firstBuffer.destroyed).toBe(true);
  expect(secondBuffer.destroyed).toBe(true);
  renderPass.destroy();
  void 0;
});

it.each([
  0, 8
])('GPUVectorModel accounts for layout offset %s when binding chunk offsets', layoutOffset => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 24});
  const positions = new GPUVector<'float32x2'>({
    type: 'data',
    name: 'positions',
    format: 'float32x2',
    data: [new GPUData({buffer, byteOffset: 8, format: 'float32x2', length: 2})]
  });
  const model = new GPUVectorModel(device, {
    id: 'gpu-vector-layout-test',
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    shaderLayout: SHADER_LAYOUT,
    bufferLayout: [
      {
        name: 'positions',
        stepMode: 'instance',
        attributes: [{attribute: 'positions', format: 'float32x2', byteOffset: layoutOffset}]
      }
    ],
    attributes: {positions: buffer},
    isInstanced: true,
    vertexCount: 1
  });
  const renderPass = device.getDefaultRenderPass();

  expect(
    model.drawBatches(renderPass, {
      vectors: {positions},
      onBatch: () => expect(model.vertexArray.attributeByteOffsets[0]).toBe(8 - layoutOffset)
    })
  ).toBe(true);
  expect(model.vertexArray.attributeByteOffsets[0]).toBe(0);
  model.setGPUVectors({positions});
  expect(model.vertexArray.attributeByteOffsets[0]).toBe(8 - layoutOffset);
  const colors = new GPUVector<'unorm8x4'>({
    type: 'data',
    name: 'positions',
    format: 'unorm8x4',
    data: [new GPUData({buffer, format: 'unorm8x4', length: 2})]
  });
  expect(() => model.drawBatches(renderPass, {vectors: {positions: colors}})).toThrow(
    'must match its Model buffer layout'
  );

  model.destroy();
  renderPass.destroy();
  buffer.destroy();
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

it('Model inherits the single gpgpu GPUVectorModel re-exported through engine', () => {
  expect(GPUVectorModel).toBe(EngineGPUVectorModel);
  expect(Object.getPrototypeOf(Model.prototype)).toBe(GPUVectorModel.prototype);
  const device = new NullDevice({});
  const model = new Model(device, {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER});
  expect(model).toBeInstanceOf(GPUVectorModel);
  expect(model.toString()).toBe('Model(unnamed)');
  model.destroy();
});

it('Model.createAsync preserves the requested subclass and its defaults', async () => {
  class CustomModel extends Model {
    static override defaultProps = {...Model.defaultProps, vertexCount: 3};
    readonly customValue = 'custom-model';
  }
  const device = new NullDevice({});
  const model: CustomModel = await CustomModel.createAsync(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER
  });
  expect(model).toBeInstanceOf(CustomModel);
  expect(model.customValue).toBe('custom-model');
  expect(model.vertexCount).toBe(3);
  model.destroy();
  const vectorModel = await GPUVectorModel.createAsync(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER
  });
  expect(vectorModel.constructor).toBe(GPUVectorModel);
  vectorModel.destroy();
});

it.each([
  'instance',
  'vertex',
  'none'
] as const)('GPUVectorModel preserves draw state and byte offsets after a failed %s batch', gpuVectorCount => {
  const device = new NullDevice({});
  const positions = makeVector(device, 'positions', 'float32x2', [2, 3]);
  const previousBuffer = device.createBuffer({byteLength: 128});
  const model = new GPUVectorModel(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    shaderLayout: SHADER_LAYOUT,
    bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'instance'}],
    attributes: {positions: previousBuffer},
    gpuVectorCount,
    vertexCount: 7,
    instanceCount: 5
  });
  model.setAttributes({positions: previousBuffer}, {byteOffsets: {positions: 16}});
  model.setBindings({original: previousBuffer});
  const renderPass = device.getDefaultRenderPass();
  expect(() =>
    model.drawBatches(renderPass, {
      vectors: {positions},
      onBatch: batch => {
        // Inferred batch chunks retain the full GPUData API, including ownership metadata.
        expect(batch.data.positions.ownsBuffer).toBe(true);
        expect(model.vertexCount).toBe(gpuVectorCount === 'vertex' ? 2 : 7);
        expect(model.instanceCount).toBe(gpuVectorCount === 'instance' ? 2 : 5);
        model.setBindings({temporary: previousBuffer});
        throw new Error('stop batch');
      }
    })
  ).toThrow('stop batch');
  expect(model.vertexCount).toBe(7);
  expect(model.instanceCount).toBe(5);
  expect(model.bindings).toEqual({original: previousBuffer});
  expect(model.vertexArray.attributes[0]).toBe(previousBuffer);
  expect(model.vertexArray.attributeByteOffsets[0]).toBe(16);
  model.destroy();
  expect(previousBuffer.destroyed).toBe(false);
  positions.destroy();
  previousBuffer.destroy();
  renderPass.destroy();
});

it('GPUVectorModel direct vector binding rejects implicit multi-chunk packing', () => {
  const device = new NullDevice({});
  const positions = makeVector(device, 'positions', 'float32x2', [2, 3]);
  const model = new GPUVectorModel(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    shaderLayout: SHADER_LAYOUT,
    bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'instance'}]
  });
  expect(() => model.setGPUVectors({positions})).toThrow();
  model.destroy();
  positions.destroy();
});

it.each([
  'instance',
  'vertex'
] as const)('GPUVectorModel restores automatic indexed draw counts after %s batching', gpuVectorCount => {
  const device = new NullDevice({});
  const positions = makeVector(device, 'positions', 'float32x2', [3]);
  const indexBuffer = device.createBuffer({
    data: new Uint16Array([0, 1, 2]),
    usage: Buffer.INDEX,
    indexType: 'uint16'
  });
  const model = new GPUVectorModel(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    shaderLayout: SHADER_LAYOUT,
    bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'instance'}],
    attributes: {positions: positions.data[0].buffer},
    indexBuffer,
    gpuVectorCount
  });
  const renderPass = device.getDefaultRenderPass();
  const draws: Array<{indexCount?: number; instanceCount?: number}> = [];
  const draw = renderPass.draw.bind(renderPass);
  renderPass.draw = options => {
    draws.push({indexCount: options.indexCount, instanceCount: options.instanceCount});
    return draw(options);
  };
  expect(model.drawBatches(renderPass, {vectors: {positions}})).toBe(true);
  expect(model.isInstanced).toBeUndefined();
  expect(model.draw(renderPass)).toBe(true);
  expect(draws[draws.length - 1]).toEqual({indexCount: 3, instanceCount: undefined});
  model.destroy();
  positions.destroy();
  indexBuffer.destroy();
  renderPass.destroy();
});
