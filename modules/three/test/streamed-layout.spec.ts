// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {
  BufferAttribute,
  BufferGeometry,
  OrthographicCamera,
  Points,
  PointsMaterial,
  RenderTarget,
  Scene,
  UnsignedByteType,
  WebGPURenderer
} from 'three/webgpu';
import {createStreamedLayout} from '../../../examples/experimental/three/streamed-layout';

test('streamed layout preserves batches and renders computed positions without transfers', async context => {
  if (!navigator.gpu) return context.skip('WebGPU unavailable');
  const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter]});
  const renderer = new WebGPURenderer({
    device: device.handle as GPUDevice,
    canvas: document.createElement('canvas')
  });
  await renderer.init();
  const layout = createStreamedLayout(device, renderer);
  const target = new RenderTarget(64, 64, {type: UnsignedByteType});
  const camera = new OrthographicCamera(-2, 2, 2, -2, 0.1, 10);
  camera.position.z = 2;
  const reference = new Scene();
  const material = new PointsMaterial({color: '#32b6dc', size: 0.08});
  const errors: string[] = [];
  const nativeDevice = device.handle as GPUDevice;
  nativeDevice.addEventListener('uncapturederror', event => errors.push(event.error.message));
  const write = vi.spyOn(nativeDevice.queue, 'writeBuffer');
  try {
    renderer.setRenderTarget(target);
    for (const data of [new Float32Array([-1, 0.5]), new Float32Array([0, 1, 1, 2])]) {
      const batch = layout.append(data);
      const map = vi.spyOn(batch.positions.handle as GPUBuffer, 'mapAsync');
      const positions = new Float32Array((data.length / 2) * 3);
      for (let row = 0; row < data.length / 2; row++) {
        positions[row * 3] = data[row * 2];
        positions[row * 3 + 1] = Math.log(1 + Math.abs(data[row * 2 + 1]));
      }
      reference.add(
        new Points(
          new BufferGeometry().setAttribute('position', new BufferAttribute(positions, 3)),
          material
        )
      );
      renderer.render(layout.scene, camera);
      const actual = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64);
      renderer.render(reference, camera);
      const expected = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64);
      expect(Array.from(actual)).toEqual(Array.from(expected));
      expect(actual.some((value, index) => index % 4 !== 3 && value !== 0)).toBe(true);
      expect(write.mock.calls.some(([buffer]) => buffer === batch.positions.handle)).toBe(false);
      expect(map).not.toHaveBeenCalled();
    }
    expect(layout.scene.children).toHaveLength(2);
    target.setSize(96, 80);
    const replacement = layout.append(new Float32Array([0, 0]));
    renderer.render(layout.scene, camera);
    const destroy = vi.spyOn(replacement.positions.handle as GPUBuffer, 'destroy');
    replacement.remove();
    replacement.remove();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(layout.scene.children).toHaveLength(2);
    layout.dispose();
    layout.dispose();
    expect(() => layout.append(new Float32Array([0, 1]))).toThrow('live layout');
    await nativeDevice.queue.onSubmittedWorkDone();
    expect(errors).toEqual([]);
  } finally {
    layout.dispose();
    for (const object of reference.children)
      if (object instanceof Points) object.geometry.dispose();
    material.dispose();
    target.dispose();
    renderer.dispose();
    device.destroy();
    vi.restoreAllMocks();
  }
});
