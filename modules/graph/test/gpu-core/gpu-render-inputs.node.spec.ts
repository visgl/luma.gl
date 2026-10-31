// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPURenderInputs} from '@luma.gl/graph/gpu-core';
import {GPUCommandGraphBuilder} from '../../src/gpu-core/gpu-command-graph';

it('derives access and binds current resources while preserving attribute and storage ranges', () => {
  const device = new NullDevice({});
  const graph = new GPUCommandGraphBuilder(device);
  const source = graph.importBuffer({
    id: 'data',
    byteLength: 64,
    usage: Buffer.VERTEX | Buffer.STORAGE
  });
  const view = graph.createDataView(source, {
    format: 'float32x2',
    length: 2,
    byteOffset: 16,
    byteStride: 16
  });
  const texture = graph.createTransientTexture({
    id: 'image',
    width: 4,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  const textureView = graph.createTextureView(texture);
  const declaration = {
    attributes: {position: {source: view, stepMode: 'instance' as const}},
    storage: {values: {source: view, access: 'read' as const, byteOffset: 4, byteLength: 16}},
    textures: {image: {source: textureView}}
  };
  const inputs = new GPURenderInputs(declaration);
  declaration.storage.values.byteOffset = 0;
  expect(inputs.bufferLayout).toEqual([
    {name: 'position', format: 'float32x2', byteStride: 16, stepMode: 'instance'}
  ]);
  expect(inputs.getResourceUses()).toEqual([
    {buffer: view, usage: 'vertex'},
    {
      buffer: expect.objectContaining({buffer: source, byteOffset: 20, length: 4, byteStride: 4}),
      usage: 'storage-read'
    },
    {texture: textureView, usage: 'sampled'}
  ]);
  const first = device.createBuffer({byteLength: 64});
  const second = device.createBuffer({byteLength: 64});
  const physicalTexture = device.createTexture({width: 4, height: 4});
  const model = {
    setAttributes: vi.fn(),
    setBindings: vi.fn(),
    pipeline: {
      shaderLayout: {
        bindings: [{name: 'values', type: 'read-only-storage' as const, group: 0, location: 0}]
      }
    }
  };
  try {
    for (const buffer of [first, second]) {
      const getBuffer = vi.fn(() => buffer);
      const getTextureView = vi.fn(() => physicalTexture.view);
      inputs.apply(model, {getBuffer, getTextureView});
      expect(model.setAttributes).toHaveBeenLastCalledWith(
        {position: buffer},
        {byteOffsets: {position: 16}}
      );
      expect(model.setBindings).toHaveBeenLastCalledWith({
        values: {buffer, offset: 20, size: 16},
        image: physicalTexture.view
      });
      expect(getTextureView).toHaveBeenCalledWith(textureView);
    }
    const incompatibleModel = {
      ...model,
      pipeline: {
        shaderLayout: {
          bindings: [{name: 'values', type: 'storage' as const, group: 0, location: 0}]
        }
      }
    };
    expect(() =>
      inputs.apply(incompatibleModel, {
        getBuffer: () => first,
        getTextureView: () => physicalTexture.view
      })
    ).toThrow();
    expect(first.destroyed).toBe(false);
    expect(physicalTexture.destroyed).toBe(false);
  } finally {
    first.destroy();
    second.destroy();
    physicalTexture.destroy();
    device.destroy();
  }
});

it('rejects invalid storage ranges and duplicate shader bindings', () => {
  const device = new NullDevice({});
  const graph = new GPUCommandGraphBuilder(device);
  const source = graph.importBuffer({id: 'source', byteLength: 16, usage: Buffer.STORAGE});
  for (const byteOffset of [-4, 2, 20]) {
    expect(
      () => new GPURenderInputs({storage: {data: {source, access: 'read', byteOffset}}})
    ).toThrow();
  }
  const texture = graph.createTransientTexture({
    id: 'image',
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  expect(
    () =>
      new GPURenderInputs({
        storage: {data: {source, access: 'read'}},
        textures: {data: {source: texture}}
      })
  ).toThrow();
  const inputs = new GPURenderInputs({storage: {data: {source, access: 'read'}}});
  expect(() =>
    graph.addRenderPass({id: 'unsupported', inputs, compile: () => ({encode: () => {}})})
  ).toThrow(/require WebGPU/);
  device.destroy();
});

it('preserves packed vertex offsets in the layout and aligns the buffer binding', () => {
  const device = new NullDevice({});
  const graph = new GPUCommandGraphBuilder(device);
  const source = graph.importBuffer({id: 'packed', byteLength: 16, usage: Buffer.VERTEX});
  const view = graph.createDataView(source, {
    format: 'unorm8x2',
    length: 2,
    byteOffset: 6,
    byteStride: 4
  });
  const inputs = new GPURenderInputs({attributes: {position: {source: view}}});
  const layout = inputs.bufferLayout;
  expect(layout[0].attributes).toEqual([
    {attribute: 'position', format: 'unorm8x2', byteOffset: 2}
  ]);
  layout[0].attributes![0].byteOffset = 0;
  expect(inputs.bufferLayout[0].attributes![0].byteOffset).toBe(2);
  const buffer = device.createBuffer({byteLength: 16});
  const model = {
    setAttributes: vi.fn(),
    setBindings: vi.fn(),
    pipeline: {shaderLayout: {bindings: []}}
  };
  inputs.apply(model, {getBuffer: () => buffer, getTextureView: vi.fn()});
  expect(model.setAttributes).toHaveBeenCalledWith(
    {position: buffer},
    {byteOffsets: {position: 4}}
  );
  buffer.destroy();
  device.destroy();
});

it('declares selected storage ranges so disjoint writes are accepted and overlaps rejected', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraphBuilder(device);
  const buffer = graph.importBuffer({id: 'ranges', byteLength: 512, usage: Buffer.STORAGE});
  const first = graph.createDataView(buffer, {format: 'uint32', length: 128});
  const second = graph.createDataView(buffer, {format: 'uint32', length: 128});
  const inputs = new GPURenderInputs({
    storage: {
      first: {source: first, access: 'read-write', byteOffset: 0, byteLength: 256},
      second: {source: second, access: 'read-write', byteOffset: 256, byteLength: 256}
    }
  });
  const node = {
    id: 'ranges',
    type: 'render' as const,
    resources: inputs.getResourceUses(),
    compile: () => ({encode: () => {}})
  };
  expect(() => graph.addRenderPass(node)).not.toThrow();
  const overlapping = new GPURenderInputs({
    storage: {
      first: {source: first, access: 'read-write', byteLength: 512},
      second: {source: second, access: 'read', byteOffset: 256, byteLength: 256}
    }
  });
  expect(() =>
    graph.addRenderPass({...node, id: 'overlap', resources: overlapping.getResourceUses()})
  ).toThrow(/overlapping/);
  device.destroy();
});
