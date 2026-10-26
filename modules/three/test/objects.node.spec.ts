// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {Device, RenderPass} from '@luma.gl/core';
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  MeshStandardMaterial,
  Float32BufferAttribute
} from 'three/webgpu';
import {ThreeMeshAdapter} from '../src/objects';

function createDevice() {
  const uniformSnapshots: Float32Array[] = [];
  const resources: {destroy: ReturnType<typeof vi.fn>; write: ReturnType<typeof vi.fn>}[] = [];
  const createResource = (props: Record<string, unknown> = {}) => {
    const resource = {
      ...props,
      destroy: vi.fn(),
      write: vi.fn((data: Float32Array) => {
        if (props.byteLength === 96) uniformSnapshots.push(new Float32Array(data));
      })
    };
    resources.push(resource);
    return resource;
  };
  const vertexArray = {...createResource(), setBuffer: vi.fn(), setIndexBuffer: vi.fn()};
  const device = {
    type: 'webgpu',
    preferredColorFormat: 'rgba8unorm',
    createShader: vi.fn(createResource),
    createBuffer: vi.fn(createResource),
    createRenderPipeline: vi.fn(createResource),
    createVertexArray: vi.fn(() => vertexArray),
    submit: vi.fn(),
    destroy: vi.fn()
  } as unknown as Device;
  return {device, resources, uniformSnapshots};
}

test('object adapter honors groups/ranges, updates versions and borrows source ownership', () => {
  const {device, resources, uniformSnapshots} = createDevice();
  const geometry = new BoxGeometry();
  const materials = [new MeshBasicMaterial({color: 'red'}), new MeshBasicMaterial({color: 'blue'})];
  const mesh = new Mesh(geometry, materials);
  materials[0].opacity = 0.25;
  geometry.clearGroups();
  geometry.addGroup(0, 12, 0);
  geometry.addGroup(12, 24, 1);
  geometry.setDrawRange(6, 18);
  const sourceDispose = vi.spyOn(geometry, 'dispose');
  const adapter = new ThreeMeshAdapter({device, mesh});
  const camera = new PerspectiveCamera();
  camera.position.z = 4;
  const pass = {
    setPipeline: vi.fn(),
    setBindings: vi.fn(),
    setVertexArray: vi.fn(),
    draw: vi.fn(),
    end: vi.fn()
  } as unknown as RenderPass;
  expect(() => adapter.draw(pass)).toThrow('synchronize');
  adapter.synchronize(camera);
  expect(uniformSnapshots[0][19]).toBe(1);
  adapter.draw(pass);
  expect(pass.draw).toHaveBeenNthCalledWith(1, {indexCount: 6, firstIndex: 6});
  expect(pass.draw).toHaveBeenNthCalledWith(2, {indexCount: 12, firstIndex: 12});
  expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
  adapter.synchronize(camera);
  expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
  const positions = geometry.getAttribute('position');
  positions.setX(0, 2);
  positions.needsUpdate = true;
  adapter.synchronize(camera);
  expect(
    resources.filter(resource => resource.write.mock.calls.length > 0).length
  ).toBeGreaterThanOrEqual(3);
  materials[0].transparent = true;
  adapter.synchronize(camera);
  expect(uniformSnapshots.at(-2)![19]).toBe(0.25);
  expect(device.createRenderPipeline).toHaveBeenCalledTimes(3);
  mesh.visible = false;
  const draws = vi.mocked(pass.draw).mock.calls.length;
  adapter.draw(pass);
  expect(pass.draw).toHaveBeenCalledTimes(draws);
  adapter.dispose();
  adapter.dispose();
  expect(resources.every(resource => resource.destroy.mock.calls.length === 1)).toBe(true);
  expect(device.submit).not.toHaveBeenCalled();
  expect(device.destroy).not.toHaveBeenCalled();
  expect(pass.end).not.toHaveBeenCalled();
  expect(sourceDispose).not.toHaveBeenCalled();
  expect(() => adapter.synchronize(camera)).toThrow('disposed');
});

test('object adapter replaces geometry buffers and rejects unsupported materials', () => {
  const {device} = createDevice();
  const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const adapter = new ThreeMeshAdapter({device, mesh});
  const camera = new PerspectiveCamera();
  adapter.synchronize(camera);
  const before = vi.mocked(device.createBuffer).mock.calls.length;
  mesh.geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(90), 3));
  adapter.synchronize(camera);
  expect(device.createBuffer).toHaveBeenCalledTimes(before + 1);
  adapter.dispose();
  expect(
    () =>
      new ThreeMeshAdapter({
        device,
        mesh: new Mesh(new BoxGeometry(), new MeshStandardMaterial()) as never
      })
  ).toThrow('MeshBasicMaterial');
});
