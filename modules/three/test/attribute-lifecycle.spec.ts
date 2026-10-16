// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {
  BufferAttribute,
  BufferGeometry,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicNodeMaterial,
  OrthographicCamera,
  RenderTarget,
  Scene,
  UnsignedByteType
} from 'three/webgpu';
import {LumaRenderer} from '../src';
import {LumaBackend} from '../src/luma-backend';

for (const backendType of ['webgpu', 'webgl'] as const) {
  test(`${backendType}: odd indices update and interleaved geometry releases its shared buffer`, async context => {
    if (
      backendType === 'webgpu'
        ? !navigator.gpu
        : !document.createElement('canvas').getContext('webgl2')
    ) {
      return context.skip(`${backendType} unavailable`);
    }
    const device = await luma.createDevice({
      type: backendType,
      adapters: [backendType === 'webgpu' ? webgpuAdapter : webgl2Adapter],
      createCanvasContext: {canvas: document.createElement('canvas'), autoResize: false}
    });
    const renderer = new LumaRenderer({device});
    const source = new InterleavedBuffer(
      new Float32Array([
        -0.8, -0.6, 0, 1, 0, 0, -0.2, -0.6, 0, 1, 0, 0, -0.5, 0.6, 0, 1, 0, 0, 0.2, -0.6, 0, 0, 1,
        0, 0.8, -0.6, 0, 0, 1, 0, 0.5, 0.6, 0, 0, 1, 0
      ]),
      6
    );
    const position = new InterleavedBufferAttribute(source, 3, 0);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', position);
    geometry.setAttribute('color', new InterleavedBufferAttribute(source, 3, 3));
    const indexValues = new Uint16Array([99, 0, 1, 2, 88]);
    const indices = new BufferAttribute(indexValues.subarray(1, 4), 1);
    geometry.setIndex(indices);
    const material = new MeshBasicNodeMaterial({vertexColors: true});
    const scene = new Scene();
    scene.add(new Mesh(geometry, material));
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;
    const target = new RenderTarget(64, 64, {type: UnsignedByteType});
    const errors: string[] = [];
    if (backendType === 'webgpu') {
      (device.handle as GPUDevice).addEventListener('uncapturederror', event =>
        errors.push(event.error.message)
      );
    }
    try {
      await renderer.init();
      renderer.outputColorSpace = LinearSRGBColorSpace;
      renderer.setSize(64, 64, false);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      const initial = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64);
      const left = (32 * 64 + 16) * 4;
      const right = (32 * 64 + 48) * 4;
      expect(initial[left]).toBeGreaterThan(200);
      expect(initial[right + 1]).toBe(0);
      indices.array.set([3, 4, 5]);
      indices.needsUpdate = true;
      renderer.render(scene, camera);
      const updated = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64);
      expect(updated[left]).toBe(0);
      expect(updated[right + 1]).toBeGreaterThan(200);
      for (let vertex = 3; vertex < 6; vertex++) source.array.set([0, 0, 1], vertex * 6 + 3);
      source.needsUpdate = true;
      renderer.render(scene, camera);
      const recolored = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64);
      expect(recolored[right + 1]).toBe(0);
      expect(recolored[right + 2]).toBeGreaterThan(200);
      expect(Array.from(new Float32Array(await renderer.getArrayBufferAsync(position)))).toEqual(
        Array.from(source.array)
      );
      const backend = renderer.backend as LumaBackend;
      const buffer = backend.get(source).buffer as Buffer;
      const destroyBuffer = vi.spyOn(buffer, 'destroy');
      geometry.dispose();
      expect(destroyBuffer).toHaveBeenCalledTimes(1);
      renderer.dispose();
      expect(destroyBuffer).toHaveBeenCalledTimes(1);
      if (backendType === 'webgpu') await (device.handle as GPUDevice).queue.onSubmittedWorkDone();
      expect(errors).toEqual([]);
    } finally {
      geometry.dispose();
      material.dispose();
      target.dispose();
      renderer.dispose();
      device.destroy();
      vi.restoreAllMocks();
    }
  }, 30000);
}
