// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {BufferAttribute, type WebGPURenderer} from 'three/webgpu';
import {ThreeBufferBridge} from '../src/interop';

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
  return {device, renderer, backend, buffer};
}

test('bridge borrows buffers, delegates ordinary attributes and restores backend hooks', () => {
  const {device, renderer, backend, buffer} = createFixture();
  const originalCreate = backend.createAttribute;
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
  backend.updateAttribute(ordinary);
  backend.destroyAttribute(ordinary);
  expect(originalCreate).toHaveBeenCalledWith(ordinary);
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
