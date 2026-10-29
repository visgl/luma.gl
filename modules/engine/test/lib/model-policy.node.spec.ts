// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, assert, type ShaderLayout} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/core/test-utils';
import {
  Geometry,
  GPUGeometry,
  GPUVectorGeometry,
  GPUVectorModel,
  MaterialFactory,
  Model,
  ShaderInputs
} from '../../src';
import type {ShaderModule} from '@luma.gl/shaders';

const VERTEX_SHADER =
  '#version 300 es\nin vec3 positions;\nvoid main() {gl_Position = vec4(positions, 1.0);}';
const FRAGMENT_SHADER =
  '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() {color = vec4(1.0);}';
const SHADER_LAYOUT = {
  attributes: [{name: 'positions', location: 0, type: 'vec3<f32>'}],
  bindings: []
} satisfies ShaderLayout;

it.each([
  false,
  true
])('Model adapts geometry before pipeline initialization (async: %s)', async asynchronous => {
  const device = new NullDevice({});
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}}
  });
  const props = {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER, shaderLayout: SHADER_LAYOUT, geometry};
  const model = asynchronous ? await Model.createAsync(device, props) : new Model(device, props);
  expect(model.vertexCount).toBe(3);
  expect(model.bufferLayout.some(layout => layout.name === 'geometry')).toBe(true);
  const gpuGeometry = model._gpuGeometry!;
  const geometryBuffer = Object.values(gpuGeometry.attributes)[0]!;
  const destroyGeometry = vi.spyOn(gpuGeometry, 'destroy');
  model.setBufferLayout([{name: 'extra', format: 'float32'}]);
  expect(model.bufferLayout.some(layout => layout.name === 'geometry')).toBe(true);
  expect(model.vertexArray.attributes).toContain(geometryBuffer);
  model.destroy();
  model.destroy();
  expect(destroyGeometry).toHaveBeenCalledTimes(1);
  expect(geometryBuffer.destroyed).toBe(true);
  device.destroy();
});

const materialModule: ShaderModule<{value: number}> = {
  name: 'surface',
  uniformTypes: {value: 'f32'},
  defaultUniforms: {value: 1},
  bindingLayout: [{name: 'surface', group: 3}],
  getUniforms: props => props || {}
};

it('Model preserves material uniform ownership, binding precedence, uploads, and borrowing', () => {
  const device = new NullDevice({});
  const factory = new MaterialFactory(device, {modules: [materialModule]});
  const material = factory.createMaterial();
  const conflictingBuffer = device.createBuffer({byteLength: 16, usage: Buffer.UNIFORM});
  const shaderInputs = new ShaderInputs({surface: materialModule});
  shaderInputs.setProps({surface: {value: 7}});
  const model = new Model(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    shaderInputs,
    material,
    bindings: {surfaceUniforms: conflictingBuffer},
    shaderLayout: {
      ...SHADER_LAYOUT,
      bindings: [{name: 'surfaceUniforms', type: 'uniform', group: 3, location: 0}]
    }
  });
  const materialBuffer = material.getBindings()['surfaceUniforms'];
  assert(materialBuffer instanceof Buffer);
  const uploadMaterial = vi.spyOn(material, 'updateShaderInputs');
  model.predraw(device.commandEncoder);
  expect(uploadMaterial).toHaveBeenCalledWith(device.commandEncoder);
  expect(model._getBindGroups()[3]?.surfaceUniforms).toBe(materialBuffer);
  expect(model._getBindGroupCacheKeys()[3]).toBe(material.getBindGroupCacheKey(3));
  expect(new Float32Array(materialBuffer.debugData, 0, 1)[0]).toBe(1);
  model.setMaterial(null);
  expect(model._getBindGroupCacheKeys()).toEqual({});
  model.setMaterial(material);
  const destroyMaterial = vi.spyOn(material, 'destroy');
  model.destroy();
  expect(destroyMaterial).not.toHaveBeenCalled();
  expect(conflictingBuffer.destroyed).toBe(false);
  material.destroy();
  conflictingBuffer.destroy();
  device.destroy();
});

it('GPUVectorModel manages module uniforms without geometry or material policy', () => {
  const device = new NullDevice({});
  const shaderInputs = new ShaderInputs({surface: materialModule});
  const model = new GPUVectorModel(device, {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER, shaderInputs});
  shaderInputs.setProps({surface: {value: 4}});
  model.predraw(device.commandEncoder);
  const uniformBuffer = model.bindings['surfaceUniforms'] as Buffer;
  expect(new Float32Array(uniformBuffer.debugData, 0, 1)[0]).toBe(4);
  expect('setGeometryVectors' in model).toBe(true);
  expect('setMaterial' in model).toBe(false);
  model.destroy();
  expect(uniformBuffer.destroyed).toBe(true);
  device.destroy();
});

it.each([
  undefined,
  2,
  0
])('Model preserves legacy indexed draw counts with vertexCount %s', vertexCount => {
  const device = new NullDevice({});
  const positions = device.createBuffer({data: new Float32Array(12)});
  const indices = device.createBuffer({
    data: new Uint16Array([0, 1, 2, 2, 1, 3]),
    usage: Buffer.INDEX
  });
  const geometry = new GPUGeometry({
    attributes: {positions},
    indices,
    topology: 'triangle-list',
    vertexCount: 3,
    bufferLayout: [{name: 'positions', format: 'float32x3'}]
  });
  const model = new Model(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    shaderLayout: SHADER_LAYOUT,
    geometry,
    ...(vertexCount === undefined ? {} : {vertexCount})
  });
  const renderPass = device.getDefaultRenderPass();
  const indexCounts: (number | undefined)[] = [];
  const draw = renderPass.draw.bind(renderPass);
  renderPass.draw = options => {
    indexCounts.push(options.indexCount);
    return draw(options);
  };
  expect(model.draw(renderPass)).toBe(true);
  expect(indexCounts).toEqual([vertexCount ?? 3]);
  model.destroy();
  renderPass.destroy();
  device.destroy();
});

it.each([
  undefined,
  2
])('switching typed geometry to legacy geometry retains only caller index count %s', indexCount => {
  const device = new NullDevice({});
  const indices = device.createBuffer({
    data: new Uint16Array([0, 1, 2, 2, 1, 3]),
    usage: Buffer.INDEX
  });
  const indexVector = new GPUVector({
    name: 'indices',
    type: 'data',
    format: 'uint16',
    data: [new GPUData({buffer: indices, format: 'uint16', length: 6})]
  });
  const model = new Model(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    geometry: new GPUVectorGeometry({attributes: {}, indices: indexVector})
  });
  if (indexCount !== undefined) model.setIndexCount(indexCount);
  model.setGeometry(
    new GPUGeometry({
      attributes: {},
      indices,
      vertexCount: 3,
      topology: 'triangle-list',
      bufferLayout: []
    })
  );
  expect(model.indexCount).toBe(indexCount);
  expect(model.vertexCount).toBe(3);
  model.destroy();
  device.destroy();
});

it('Model accepts indexed legacy attributes with unequal spare capacity', () => {
  const device = new NullDevice({});
  const positions = device.createBuffer({byteLength: 4 * 12});
  const colors = device.createBuffer({byteLength: 8 * 4});
  const indices = device.createBuffer({
    data: new Uint16Array([0, 1, 2, 2, 1, 3]),
    usage: Buffer.INDEX
  });
  const geometry = new GPUGeometry({
    attributes: {positions, colors},
    indices,
    vertexCount: 6,
    topology: 'triangle-list',
    bufferLayout: [
      {name: 'positions', format: 'float32x3'},
      {name: 'colors', format: 'unorm8x4'}
    ]
  });
  const model = new Model(device, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    geometry,
    shaderLayout: SHADER_LAYOUT
  });
  expect(model.vertexCount).toBe(6);
  expect(model.indexCount).toBeUndefined();
  model.destroy();
  device.destroy();
});
