// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {BufferAttribute, type WebGPURenderer} from 'three/webgpu';
import {getThreeBufferBridgeSupport, ThreeBufferBridge} from '../src/interop';

function createFixture() {
  const device = {type: 'webgpu', handle: {}} as unknown as Device;
  const data = new Map<BufferAttribute, {buffer?: unknown}>();
  const backend = {
    isWebGPUBackend: true,
    device: device.handle,
    get(attribute: BufferAttribute) {
      if (!data.has(attribute)) data.set(attribute, {});
      return data.get(attribute)!;
    },
    delete: vi.fn((attribute: BufferAttribute) => data.delete(attribute)),
    createAttribute: vi.fn(),
    createIndexAttribute: vi.fn(),
    updateAttribute: vi.fn(),
    destroyAttribute: vi.fn()
  };
  const renderer = {backend} as unknown as WebGPURenderer;
  const buffer = {
    device,
    handle: {},
    usage: Buffer.VERTEX | Buffer.STORAGE,
    byteLength: 36,
    destroyed: false,
    destroy: vi.fn()
  } as unknown as Buffer;
  return {device, renderer, backend, buffer, data};
}

test('bridge borrows buffers, delegates ordinary attributes and restores backend hooks', () => {
  const {device, renderer, backend, buffer} = createFixture();
  const originalCreate = backend.createAttribute;
  const originalCreateIndex = backend.createIndexAttribute;
  const originalUpdate = backend.updateAttribute;
  const originalDestroy = backend.destroyAttribute;
  const bridge = new ThreeBufferBridge(device, renderer);
  const attribute = bridge.createAttribute(buffer, 3, 3);
  backend.createAttribute(attribute);
  expect(backend.get(attribute).buffer).toBe(buffer.handle);
  expect(originalCreate).not.toHaveBeenCalled();
  expect(() => backend.updateAttribute(attribute)).toThrow('CPU needsUpdate');
  expect(() => bridge.dispose()).toThrow('Dispose rendered geometries');
  const ordinary = new BufferAttribute(new Float32Array(3), 3);
  backend.createAttribute(ordinary);
  backend.createIndexAttribute(ordinary);
  backend.updateAttribute(ordinary);
  backend.destroyAttribute(ordinary);
  expect(originalCreate).toHaveBeenCalledWith(ordinary);
  expect(originalCreateIndex).toHaveBeenCalledWith(ordinary);
  expect(originalUpdate).toHaveBeenCalledWith(ordinary);
  expect(originalDestroy).toHaveBeenCalledWith(ordinary);
  backend.destroyAttribute(attribute);
  expect(buffer.destroy).not.toHaveBeenCalled();
  // A geometry can recreate its backend cache while the bridge remains attached.
  backend.createAttribute(attribute);
  expect(backend.get(attribute).buffer).toBe(buffer.handle);
  backend.destroyAttribute(attribute);
  bridge.dispose();
  bridge.dispose();
  expect(backend.createAttribute).toBe(originalCreate);
  expect(backend.createIndexAttribute).toBe(originalCreateIndex);
  expect(backend.updateAttribute).toBe(originalUpdate);
  expect(backend.destroyAttribute).toBe(originalDestroy);
  expect(() => bridge.createAttribute(buffer, 3, 3)).toThrow('live buffer');
});

test('bridge rejects mismatched devices and incompatible buffer metadata', () => {
  const {device, renderer, backend, buffer} = createFixture();
  backend.device = {};
  expect(() => new ThreeBufferBridge(device, renderer)).toThrow('same WebGPU');
  backend.device = device.handle;
  const bridge = new ThreeBufferBridge(device, renderer);
  expect(() => new ThreeBufferBridge(device, renderer)).toThrow('already attached');
  expect(() => bridge.createAttribute(buffer, 3, 4)).toThrow('covering');
  expect(() => bridge.createAttribute(buffer, 3, 0)).toThrow('covering');
  expect(() => bridge.createAttribute({...buffer, device: {}} as Buffer, 3, 3)).toThrow(
    'live buffer'
  );
  expect(() => bridge.createAttribute({...buffer, usage: Buffer.STORAGE} as Buffer, 3, 3)).toThrow(
    'covering'
  );
  bridge.createAttribute(buffer, 3, 3);
  bridge.dispose();
});

test('geometry churn releases live cache entries and preserves surviving borrowed attributes', () => {
  const {device, renderer, backend, buffer, data} = createFixture();
  const bridge = new ThreeBufferBridge(device, renderer);
  const surviving = bridge.createAttribute(buffer, 3, 3);
  backend.createAttribute(surviving);
  for (let index = 0; index < 100; index++) {
    const attribute = bridge.createAttribute(buffer, 3, 3);
    backend.createAttribute(attribute);
    backend.destroyAttribute(attribute);
  }
  expect(data.size).toBe(1);
  expect(() => bridge.dispose()).toThrow('Dispose rendered geometries');
  backend.destroyAttribute(surviving);
  backend.createAttribute(surviving);
  expect(backend.get(surviving).buffer).toBe(buffer.handle);
  backend.destroyAttribute(surviving);
  const getAttribute = vi.spyOn(backend, 'get');
  backend.delete.mockClear();
  bridge.dispose();
  // Already-disposed and never-rendered attributes must not be revived in backend caches.
  expect(getAttribute).not.toHaveBeenCalled();
  expect(backend.delete).not.toHaveBeenCalled();
  expect(data.size).toBe(0);
  expect(buffer.destroy).not.toHaveBeenCalled();
});

test('support probing diagnoses incompatible backends without installing hooks', () => {
  const {device, renderer, backend} = createFixture();
  const originalCreate = backend.createAttribute;
  expect(getThreeBufferBridgeSupport(device, renderer)).toEqual({supported: true});
  Object.defineProperty(backend, 'device', {value: undefined, writable: true});
  expect(getThreeBufferBridgeSupport(device, renderer)).toEqual({
    supported: false,
    reason: 'Initialize the Three renderer before attaching'
  });
  expect(() => new ThreeBufferBridge(device, renderer)).toThrow('Initialize');
  backend.device = device.handle;
  Object.defineProperty(backend, 'createIndexAttribute', {value: undefined, configurable: true});
  expect(getThreeBufferBridgeSupport(device, renderer)).toEqual({
    supported: false,
    reason: 'Unsupported Three attribute backend'
  });
  expect(() => new ThreeBufferBridge(device, renderer)).toThrow('Unsupported');
  expect(backend.createAttribute).toBe(originalCreate);
  expect('borrowedBufferBridge' in backend).toBe(false);
});

test.each([
  'uint16',
  'uint32'
] as const)('bridge borrows %s indices without converting their layout', format => {
  const {device, renderer, backend, buffer} = createFixture();
  const indexBuffer = {
    ...buffer,
    indexType: format,
    usage: Buffer.INDEX | Buffer.STORAGE
  } as Buffer;
  const bridge = new ThreeBufferBridge(device, renderer);
  const attribute = bridge.createIndexAttribute(indexBuffer, 3);
  expect(attribute.itemSize).toBe(1);
  expect(attribute.count).toBe(3);
  expect(attribute.array).toBeInstanceOf(format === 'uint16' ? Uint16Array : Uint32Array);
  backend.createIndexAttribute(attribute);
  expect(backend.get(attribute).buffer).toBe(indexBuffer.handle);
  expect(() => backend.createAttribute(attribute)).toThrow('usage');
  expect(() => backend.updateAttribute(attribute)).toThrow('CPU needsUpdate');
  expect(() => bridge.dispose()).toThrow('Dispose rendered geometries');
  backend.destroyAttribute(attribute);
  expect(indexBuffer.destroy).not.toHaveBeenCalled();
  expect(() => bridge.createIndexAttribute({...buffer, indexType: format} as Buffer, 3)).toThrow(
    'usage'
  );
  expect(() => bridge.createIndexAttribute(indexBuffer, 100)).toThrow('covering');
  bridge.dispose();
});

test('bridge borrows instance attributes and validates their complete element count', () => {
  const {device, renderer, backend, buffer} = createFixture();
  const bridge = new ThreeBufferBridge(device, renderer);
  const attribute = bridge.createInstancedAttribute(buffer, 3, 3);
  expect(attribute.isInstancedBufferAttribute).toBe(true);
  expect(attribute.meshPerAttribute).toBe(1);
  expect(attribute.count).toBe(3);
  backend.createAttribute(attribute);
  expect(backend.get(attribute).buffer).toBe(buffer.handle);
  expect(() => bridge.createIndexAttribute(buffer, 3)).toThrow('index metadata');
  expect(() => bridge.createInstancedAttribute(buffer, 3, 4)).toThrow('covering');
  expect(() => bridge.createInstancedAttribute(buffer, 3, 0.5)).toThrow('covering');
  expect(() =>
    bridge.createIndexAttribute(
      {...buffer, indexType: 'uint32', usage: Buffer.INDEX} as Buffer,
      NaN
    )
  ).toThrow('covering');
  backend.destroyAttribute(attribute);
  bridge.dispose();
  expect(buffer.destroy).not.toHaveBeenCalled();
});
