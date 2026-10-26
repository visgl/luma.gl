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
    {buffer: view, usage: 'storage-read'},
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
