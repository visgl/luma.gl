// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {LinearSRGBColorSpace, RenderTarget, UnsignedByteType, WebGPURenderer} from 'three/webgpu';
import {createComputeScene} from '../../../examples/experimental/three/compute-scene';

test('shared luma compute buffer renders through upstream Three without vertex transfers', async context => {
  if (!navigator.gpu) return context.skip('WebGPU is unavailable');
  const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter]});
  const nativeDevice = device.handle as GPUDevice;
  const errors: string[] = [];
  nativeDevice.addEventListener('uncapturederror', event => errors.push(event.error.message));
  const requestDevice = vi.spyOn(GPUAdapter.prototype, 'requestDevice');
  const writeBuffer = vi.spyOn(nativeDevice.queue, 'writeBuffer');
  const beginComputePass = vi.spyOn(device, 'beginComputePass');
  const renderer = new WebGPURenderer({
    device: nativeDevice,
    canvas: document.createElement('canvas')
  });
  const reference = new WebGPURenderer({
    device: nativeDevice,
    canvas: document.createElement('canvas')
  });
  const target = new RenderTarget(128, 128, {type: UnsignedByteType});
  const referenceTarget = target.clone();
  let scene: ReturnType<typeof createComputeScene> | undefined;
  let referenceScene: ReturnType<typeof createComputeScene> | undefined;
  try {
    await renderer.init();
    await reference.init();
    scene = createComputeScene(device, renderer);
    referenceScene = createComputeScene();
    renderer.outputColorSpace = reference.outputColorSpace = LinearSRGBColorSpace;
    renderer.setSize(128, 128, false);
    reference.setSize(128, 128, false);
    renderer.setRenderTarget(target);
    reference.setRenderTarget(referenceTarget);
    const positions = scene.positions!;
    const nativeBuffer = positions.handle as GPUBuffer;
    const mapBuffer = vi.spyOn(nativeBuffer, 'mapAsync');
    const destroyBuffer = vi.spyOn(nativeBuffer, 'destroy');
    expect(positions.usage).toBe(Buffer.STORAGE | Buffer.VERTEX);
    let previousPixels: ArrayLike<number> | undefined;
    for (const phase of [0, 0.75, 2]) {
      scene.update(phase);
      referenceScene.update(phase);
      renderer.render(scene.scene, scene.camera);
      reference.render(referenceScene.scene, referenceScene.camera);
      // Only rendered pixels are read back by the test, never the shared vertex buffer.
      const pixels = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      const referencePixels = await reference.readRenderTargetPixelsAsync(
        referenceTarget,
        0,
        0,
        128,
        128
      );
      let maximumDifference = 0;
      for (let index = 0; index < pixels.length; index++)
        maximumDifference = Math.max(
          maximumDifference,
          Math.abs(pixels[index] - referencePixels[index])
        );
      expect(maximumDifference).toBeLessThanOrEqual(2);
      expect(new Set(pixels).size).toBeGreaterThan(5);
      if (previousPixels) expect(Array.from(pixels)).not.toEqual(Array.from(previousPixels));
      previousPixels = pixels;
    }
    expect(beginComputePass).toHaveBeenCalledTimes(3);
    const backend = renderer.backend as unknown as {
      device: GPUDevice;
      get(attribute: object): {buffer: GPUBuffer};
    };
    expect(backend.device).toBe(nativeDevice);
    expect(backend.get(scene.geometry.getAttribute('position')).buffer).toBe(nativeBuffer);
    expect(requestDevice).not.toHaveBeenCalled();
    expect(mapBuffer).not.toHaveBeenCalled();
    expect(writeBuffer.mock.calls.some(([buffer]) => buffer === nativeBuffer)).toBe(false);
    expect(
      Array.from(scene.geometry.getAttribute('position').array).every(value => value === 0)
    ).toBe(true);
    scene.geometry.dispose();
    expect(destroyBuffer).not.toHaveBeenCalled();
    renderer.setRenderTarget(null);
    renderer.setSize(96, 80, false);
    scene.dispose();
    expect(destroyBuffer).toHaveBeenCalledTimes(1);
    renderer.dispose();
    const recreated = new WebGPURenderer({
      device: nativeDevice,
      canvas: document.createElement('canvas')
    });
    await recreated.init();
    const recreatedScene = createComputeScene(device, recreated);
    recreated.setSize(96, 80, false);
    recreatedScene.update(1);
    recreated.render(recreatedScene.scene, recreatedScene.camera);
    recreatedScene.dispose();
    recreated.dispose();
    await nativeDevice.queue.onSubmittedWorkDone();
    expect(errors).toEqual([]);
  } finally {
    scene?.dispose();
    referenceScene?.dispose();
    target.dispose();
    referenceTarget.dispose();
    renderer.dispose();
    reference.dispose();
    device.destroy();
    vi.restoreAllMocks();
  }
}, 30000);
