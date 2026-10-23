// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type ShaderLayout} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUVectorGeometry, GPUVectorModel} from '../../src';

const SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>'},
    {name: 'colors', location: 1, type: 'vec4<f32>'}
  ],
  bindings: []
};
const SHADERS = {
  vs: '#version 300 es\nin vec2 positions; in vec4 colors; void main() {gl_Position = vec4(positions, 0., 1.);}',
  fs: '#version 300 es\nprecision highp float; out vec4 color; void main() {color = vec4(1.);}',
  shaderLayout: SHADER_LAYOUT
};

function makePositions(device: NullDevice, length: number): GPUVector<'float32x2'> {
  return new GPUVector({
    name: 'positions',
    type: 'data',
    format: 'float32x2',
    data: [
      new GPUData({
        format: 'float32x2',
        buffer: device.createBuffer({byteLength: length * 8}),
        length
      })
    ]
  });
}

it.each([
  false,
  true
])('vector groups infer independent layouts and counts (instanced: %s)', isInstanced => {
  const device = new NullDevice({});
  const positions = makePositions(device, 4);
  const nextPositions = makePositions(device, 4);
  const colors = new GPUVector({
    name: 'colors',
    type: 'data',
    format: 'unorm8x4',
    data: [
      new GPUData({
        format: 'unorm8x4',
        buffer: device.createBuffer({byteLength: 4 * (isInstanced ? 7 : 4)}),
        length: isInstanced ? 7 : 4
      })
    ]
  });
  const geometry = new GPUVectorGeometry({attributes: {positions}, topology: 'triangle-strip'});
  const model = new GPUVectorModel(device, {
    ...SHADERS,
    geometry,
    isInstanced,
    attributeVectors: {colors}
  });
  expect(model.vertexCount).toBe(4);
  expect(model.topology).toBe('triangle-strip');
  if (isInstanced) expect(model.instanceCount).toBe(7);
  expect(model.bufferLayout.find(layout => layout.name === 'positions')?.stepMode).toBe('vertex');
  expect(model.bufferLayout.find(layout => layout.name === 'colors')?.stepMode).toBe(
    isInstanced ? 'instance' : 'vertex'
  );
  model.setGeometryVectors({positions: nextPositions});
  expect(model.vertexArray.attributes[0]).toBe(nextPositions.data[0].buffer);
  expect(model.vertexArray.attributes[1]).toBe(colors.data[0].buffer);
  model.setAttributeVectors({});
  expect(model.bufferLayout.some(layout => layout.name === 'colors')).toBe(false);
  expect(model.vertexArray.attributes[0]).toBe(nextPositions.data[0].buffer);
  model.destroy();
  for (const vector of [positions, nextPositions, colors]) {
    expect(vector.data[0].buffer.destroyed).toBe(false);
    vector.data[0].buffer.destroy();
  }
  device.destroy();
});

it('GPUVectorGeometry binds sliced indices without taking ownership', () => {
  const device = new NullDevice({});
  const positions = makePositions(device, 4);
  const buffer = device.createBuffer({
    data: new Uint16Array([99, 99, 0, 1, 2, 2, 1, 3]),
    usage: Buffer.INDEX,
    indexType: 'uint16'
  });
  const indices = new GPUVector({
    type: 'data',
    name: 'indices',
    format: 'uint16',
    data: [new GPUData({buffer, format: 'uint16', byteOffset: 4, length: 6})]
  });
  const model = new GPUVectorModel(device, {
    ...SHADERS,
    geometry: new GPUVectorGeometry({attributes: {positions}, indices})
  });
  expect(model.vertexCount).toBe(4);
  expect(model.indexBuffer).toBe(buffer);
  expect(model.indexCount).toBe(6);
  expect(model.firstIndex).toBe(2);
  expect(model.firstVertex).toBe(4);
  const overridden = new GPUVectorModel(device, {
    ...SHADERS,
    geometry: new GPUVectorGeometry({attributes: {positions}, indices}),
    indexCount: 3,
    firstIndex: 1,
    firstVertex: 2
  });
  expect(overridden.indexCount).toBe(3);
  expect(overridden.firstIndex).toBe(1);
  expect(overridden.firstVertex).toBe(2);
  overridden.destroy();
  model.setIndexVector(null);
  expect(model.indexBuffer).toBeNull();
  expect(model.indexCount).toBeUndefined();
  model.destroy();
  expect(buffer.destroyed).toBe(false);
  buffer.destroy();
  positions.data[0].buffer.destroy();
  device.destroy();
});

it.each([
  false,
  true
])('bound vector groups draw preserved batches (instanced: %s)', isInstanced => {
  const device = new NullDevice({});
  const geometryRows = isInstanced ? [4] : [2, 3];
  const positions = new GPUVector({
    name: 'positions',
    type: 'data',
    format: 'float32x2',
    data: geometryRows.map(
      length =>
        new GPUData({
          buffer: device.createBuffer({byteLength: length * 8}),
          format: 'float32x2',
          length
        })
    )
  });
  const colors = new GPUVector({
    name: 'colors',
    type: 'data',
    format: 'unorm8x4',
    data: [2, 3].map(
      length =>
        new GPUData({
          buffer: device.createBuffer({byteLength: length * 4}),
          format: 'unorm8x4',
          length
        })
    )
  });
  const model = new GPUVectorModel(device, {
    ...SHADERS,
    isInstanced,
    geometry: new GPUVectorGeometry({attributes: {positions}}),
    attributeVectors: {colors}
  });
  const renderPass = device.getDefaultRenderPass();
  const calls: Array<{vertexCount?: number; instanceCount?: number}> = [];
  const draw = renderPass.draw.bind(renderPass);
  renderPass.draw = options => {
    calls.push({vertexCount: options.vertexCount, instanceCount: options.instanceCount});
    return draw(options);
  };
  expect(model.draw(renderPass)).toBe(true);
  expect(calls).toEqual(
    isInstanced
      ? [
          {vertexCount: 4, instanceCount: 2},
          {vertexCount: 4, instanceCount: 3}
        ]
      : [
          {vertexCount: 2, instanceCount: undefined},
          {vertexCount: 3, instanceCount: undefined}
        ]
  );
  expect(model.vertexCount).toBe(isInstanced ? 4 : 5);
  if (isInstanced) expect(model.instanceCount).toBe(5);
  expect(model.vertexArray.attributes[0]).toBe(positions.data[0].buffer);
  renderPass.draw = () => {
    throw new Error('draw failed');
  };
  expect(() => model.draw(renderPass)).toThrow('draw failed');
  expect(model.vertexCount).toBe(isInstanced ? 4 : 5);
  expect(model.vertexArray.attributes[0]).toBe(positions.data[0].buffer);
  renderPass.draw = draw;
  expect(model.draw(renderPass)).toBe(true);
  model.destroy();
  renderPass.destroy();
  for (const vector of [positions, colors]) for (const chunk of vector.data) chunk.buffer.destroy();
  device.destroy();
});

it.each([
  false,
  true
])('supplemental vertex columns share geometry batches (instanced: %s)', isInstanced => {
  const device = new NullDevice({});
  const positions = new GPUVector({
    name: 'positions',
    type: 'data',
    format: 'float32x2',
    data: [2, 3].map(
      length =>
        new GPUData({
          buffer: device.createBuffer({byteLength: length * 8}),
          format: 'float32x2',
          length
        })
    )
  });
  const colors = new GPUVector({
    name: 'colors',
    type: 'data',
    format: 'unorm8x4',
    data: [1, 4].map(
      length =>
        new GPUData({
          buffer: device.createBuffer({byteLength: length * 4}),
          format: 'unorm8x4',
          length
        })
    )
  });
  const model = new GPUVectorModel(device, {
    ...SHADERS,
    isInstanced,
    geometry: new GPUVectorGeometry({attributes: {positions}})
  });
  expect(() =>
    model.setAttributeVectors({colors}, [{name: 'colors', format: 'unorm8x4', stepMode: 'vertex'}])
  ).toThrow();
  expect(model.vertexCount).toBe(5);
  model.destroy();
  for (const vector of [positions, colors]) for (const chunk of vector.data) chunk.buffer.destroy();
  device.destroy();
});

it('constructor layouts override inferred attribute step modes', () => {
  const device = new NullDevice({});
  const positions = makePositions(device, 4);
  const colors = new GPUVector({
    name: 'colors',
    type: 'data',
    format: 'unorm8x4',
    data: [
      new GPUData({buffer: device.createBuffer({byteLength: 28}), format: 'unorm8x4', length: 7})
    ]
  });
  const model = new GPUVectorModel(device, {
    ...SHADERS,
    geometry: new GPUVectorGeometry({attributes: {positions}}),
    attributeVectors: {colors},
    bufferLayout: [{name: 'colors', format: 'unorm8x4', stepMode: 'instance'}]
  });
  expect(model.isInstanced).toBe(true);
  expect(model.instanceCount).toBe(7);
  expect(model.vertexCount).toBe(4);
  model.destroy();
  positions.data[0].buffer.destroy();
  colors.data[0].buffer.destroy();
  device.destroy();
});
