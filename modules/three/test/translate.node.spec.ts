// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {MeshBasicNodeMaterial, LessEqualCompare, Compatibility, LinearFilter} from 'three/webgpu';
import {translateBinding, translateMaterial, translateVertexFormat} from '../src/translate';
import {LumaBackend} from '../src/luma-backend';
import {LumaRenderer} from '../src';

test('bindings preserve group, location, visibility and storage access', () => {
  expect(
    translateBinding(
      {name: 'source', visibility: 4, isStorageBuffer: true, access: 'readWrite'},
      2,
      3
    )
  ).toEqual({name: 'group2Binding3', group: 2, location: 3, visibility: 4, type: 'storage'});
  expect(
    translateBinding(
      {name: 'source', visibility: 1, isStorageBuffer: true, access: 'readWrite'},
      0,
      0
    ).type
  ).toBe('read-only-storage');
  expect(
    translateBinding(
      {name: 'source', visibility: 4, isStorageBuffer: true, access: 'readOnly'},
      0,
      0
    ).type
  ).toBe('read-only-storage');
  expect(translateBinding({name: 'camera', visibility: 3, isUniformBuffer: true}, 1, 0).type).toBe(
    'uniform'
  );
  // SampledTexture inherits Sampler, so both flags are true upstream.
  expect(
    translateBinding({name: 'image', visibility: 2, isSampler: true, isSampledTexture: true}, 1, 1)
      .type
  ).toBe('texture');
  expect(() => translateBinding({name: 'unknown', visibility: 1}, 0, 0)).toThrow('unsupported');
  expect(
    translateBinding(
      {
        name: 'morphTargets',
        visibility: 1,
        isSampledTexture: true,
        texture: {type: 1015, isDataArrayTexture: true}
      },
      0,
      1
    )
  ).toMatchObject({type: 'texture', viewDimension: '2d-array', sampleType: 'unfilterable-float'});
});

test('vertex formats distinguish stored bytes and normalization', () => {
  expect(translateVertexFormat(new Float32Array(9), 3)).toBe('float32x3');
  expect(translateVertexFormat(new Uint8Array(4), 4, true)).toBe('unorm8x4');
  expect(translateVertexFormat(new Int32Array(1), 1)).toBe('sint32');
  expect(() => translateVertexFormat(new Uint8Array(3), 3)).toThrow();
  expect(() => translateVertexFormat(new Float64Array(3), 3)).toThrow();
});

function makeBackend() {
  const resources: Array<{
    destroy: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    byteLength: number;
  }> = [];
  const device = {
    type: 'webgpu',
    limits: {},
    features: new Set(),
    destroy: vi.fn(),
    getDefaultCanvasContext: () => ({
      canvas: {width: 16, height: 16},
      getCurrentFramebuffer: () => ({})
    }),
    beginRenderPass: vi.fn(() => ({end: vi.fn(), setParameters: vi.fn()})),
    submit: vi.fn(),
    generateMipmapsWebGPU: vi.fn(),
    createSampler: vi.fn(() => ({destroy: vi.fn()})),
    createBuffer: vi.fn(properties => {
      const resource = {
        destroy: vi.fn(),
        write: vi.fn(),
        byteLength: properties.byteLength,
        usage: properties.usage
      };
      resources.push(resource);
      return resource;
    })
  } as unknown as Device;
  return {backend: new LumaBackend(device), device, resources};
}

test('uniform updates preserve upstream packed bytes and disposal borrows device', () => {
  const {backend, device, resources} = makeBackend();
  const binding = {buffer: new Float32Array([1, 2, 3, 4]), byteLength: 16};
  backend.createUniformBuffer(binding);
  binding.buffer[0] = 5;
  backend.updateBinding(binding);
  expect(resources[0].write).toHaveBeenCalledWith(binding.buffer);
  backend.destroyUniformBuffer(binding);
  backend.dispose();
  backend.dispose();
  expect(resources[0].destroy).toHaveBeenCalledTimes(1);
  expect(device.destroy).not.toHaveBeenCalled();
});

test('storage creation includes render, copy and compute usage', () => {
  const {backend, device} = makeBackend();
  const attribute = {array: new Float32Array(4)};
  backend.createStorageAttribute(attribute);
  expect(device.createBuffer).toHaveBeenCalledWith(
    expect.objectContaining({
      usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
    })
  );
  backend.dispose();
});

test('pipeline invalidation follows material and render target changes', () => {
  const {backend} = makeBackend();
  const material = new MeshBasicNodeMaterial();
  const renderObject = {
    material,
    object: {matrixWorld: {determinant: () => 1}},
    context: {textures: null, depth: true},
    getGeometryCacheKey: () => 'geometry',
    clippingContextCacheKey: ''
  };
  expect(backend.needsRenderUpdate(renderObject)).toBe(true);
  expect(backend.needsRenderUpdate(renderObject)).toBe(false);
  material.transparent = true;
  expect(backend.needsRenderUpdate(renderObject)).toBe(true);
  material.needsUpdate = true;
  expect(backend.needsRenderUpdate(renderObject)).toBe(true);
  renderObject.context.depth = false;
  expect(backend.needsRenderUpdate(renderObject)).toBe(true);
  material.stencilWrite = true;
  expect(() => translateMaterial(material, false)).toThrow('unsupported');
});

test('renderer requires a canvas on both supported device types', () => {
  for (const type of ['webgpu', 'webgl'] as const)
    expect(() => new LumaRenderer({device: {type} as Device})).toThrow('canvas context');
});

test('mipmap uploads end the active pass and subsequent draws preserve attachments', () => {
  const {backend, device} = makeBackend();
  const texture = {};
  const resource = {};
  backend.get(texture).texture = resource;
  backend.beginRender({
    textures: null,
    depth: true,
    clearColor: true,
    clearDepth: true,
    clearColorValue: {r: 1, g: 0, b: 0, a: 1},
    clearDepthValue: 1,
    viewportValue: {x: 0, y: 0, z: 16, w: 16}
  });
  backend.generateMipmaps(texture);
  expect(device.submit).toHaveBeenCalledTimes(1);
  expect(device.generateMipmapsWebGPU).toHaveBeenCalledWith(resource);
  backend.draw({object: {}, camera: {}, getDrawParameters: () => null}, {});
  expect(device.beginRenderPass).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({clearColor: [1, 0, 0, 1], clearDepth: 1})
  );
  expect(device.beginRenderPass).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({clearColor: false, clearDepth: false})
  );
  backend.finishRender();
  backend.dispose();
});

test('nested shadow passes restore the parent viewport and load its attachments', () => {
  const {backend, device} = makeBackend();
  const parent = {
    textures: null,
    depth: true,
    clearColor: true,
    clearDepth: true,
    clearColorValue: {r: 1, g: 0, b: 0, a: 1},
    clearDepthValue: 1,
    viewportValue: {x: 0, y: 0, z: 16, w: 16}
  };
  backend.beginRender(parent);
  backend.beginRender({...parent, viewportValue: {x: 0, y: 0, z: 8, w: 8}});
  backend.finishRender();
  backend.draw({object: {}, camera: {}, getDrawParameters: () => null}, {});
  expect(device.beginRenderPass).toHaveBeenNthCalledWith(
    3,
    expect.objectContaining({clearColor: false, clearDepth: false})
  );
  backend.finishRender();
  backend.dispose();
});

test('shadow depth comparison uses a comparison sampler and depth binding', () => {
  const {backend, device} = makeBackend();
  const texture = {
    compareFunction: LessEqualCompare,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    wrapS: 1001,
    wrapT: 1001
  };
  expect(backend.hasCompatibility(Compatibility.TEXTURE_COMPARE)).toBe(true);
  backend.updateSampler({texture});
  expect(device.createSampler).toHaveBeenCalledWith(
    expect.objectContaining({type: 'comparison-sampler', compare: 'less-equal'})
  );
  expect(
    translateBinding(
      {
        name: 'shadow',
        visibility: 2,
        isSampledTexture: true,
        texture: {type: 1014, isDepthTexture: true, compareFunction: LessEqualCompare}
      },
      1,
      0
    )
  ).toMatchObject({type: 'texture', sampleType: 'depth'});
  backend.dispose();
});
