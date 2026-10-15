// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {
  BufferAttribute,
  BufferGeometry,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RenderTarget,
  Scene,
  UnsignedByteType,
  WebGPURenderer
} from 'three/webgpu';
import {ThreeBufferBridge} from '../src/interop';
import {createComputeScene} from '../../../examples/experimental/three/compute-scene';

test('shared luma vertex, index and instance buffers render through upstream Three without geometry transfers', async context => {
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
    const sharedBuffers = [positions, scene.indexBuffer!, scene.offsets!];
    const nativeBuffer = positions.handle as GPUBuffer;
    const destroySharedBuffers = sharedBuffers.map(buffer =>
      vi.spyOn(buffer.handle as GPUBuffer, 'destroy')
    );
    const mapBuffer = vi.spyOn(nativeBuffer, 'mapAsync');
    expect(positions.usage).toBe(Buffer.STORAGE | Buffer.VERTEX);
    expect(scene.indexBuffer!.usage).toBe(Buffer.STORAGE | Buffer.INDEX);
    expect(scene.offsets!.usage).toBe(Buffer.STORAGE | Buffer.VERTEX);
    expect(scene.geometry.instanceCount).toBe(3);
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
    expect(backend.get(scene.geometry.index!).buffer).toBe(scene.indexBuffer!.handle);
    expect(backend.get(scene.geometry.getAttribute('instanceOffset')).buffer).toBe(
      scene.offsets!.handle
    );
    expect(requestDevice).not.toHaveBeenCalled();
    expect(mapBuffer).not.toHaveBeenCalled();
    for (const sharedBuffer of sharedBuffers) {
      expect(writeBuffer.mock.calls.some(([buffer]) => buffer === sharedBuffer.handle)).toBe(false);
      expect(
        sharedBuffer.usage &
          (Buffer.COPY_SRC | Buffer.COPY_DST | Buffer.MAP_READ | Buffer.MAP_WRITE)
      ).toBe(0);
    }
    expect(Array.from(scene.geometry.index!.array).every(value => value === 0)).toBe(true);
    expect(
      Array.from(scene.geometry.getAttribute('instanceOffset').array).every(value => value === 0)
    ).toBe(true);
    expect(
      Array.from(scene.geometry.getAttribute('position').array).every(value => value === 0)
    ).toBe(true);
    scene.geometry.dispose();
    for (const destroySharedBuffer of destroySharedBuffers)
      expect(destroySharedBuffer).not.toHaveBeenCalled();
    renderer.setRenderTarget(null);
    renderer.setSize(96, 80, false);
    scene.dispose();
    for (const destroySharedBuffer of destroySharedBuffers)
      expect(destroySharedBuffer).toHaveBeenCalledTimes(1);
    renderer.dispose();
    const recreated = new WebGPURenderer({
      device: nativeDevice,
      canvas: document.createElement('canvas')
    });
    await recreated.init();
    const recreatedScene = createComputeScene(device, recreated);
    recreated.setSize(96, 80, false);
    // Headless SwiftShader does not support canvas swap-chain presentation.
    target.setSize(96, 80);
    recreated.setRenderTarget(target);
    recreatedScene.update(1);
    recreated.render(recreatedScene.scene, recreatedScene.camera);
    const recreatedPixels = await recreated.readRenderTargetPixelsAsync(target, 0, 0, 96, 80);
    // Upstream WebGPU readback can include 256-byte row padding.
    expect(recreatedPixels.length).toBeGreaterThanOrEqual(96 * 80 * 4);
    expect(new Set(recreatedPixels).size).toBeGreaterThan(5);
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

test.each(['uint16', 'uint32'] as const)(
  'borrowed %s indices draw the GPU topology and survive geometry disposal',
  async (format, context) => {
    if (!navigator.gpu) return context.skip('WebGPU is unavailable');
    const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter]});
    const nativeDevice = device.handle as GPUDevice;
    const renderer = new WebGPURenderer({
      device: nativeDevice,
      canvas: document.createElement('canvas')
    });
    const target = new RenderTarget(32, 32, {type: UnsignedByteType});
    const geometry = new BufferGeometry();
    const material = new MeshBasicMaterial({color: 'red'});
    const indexValues =
      format === 'uint16' ? new Uint16Array([0, 1, 2]) : new Uint32Array([0, 1, 2]);
    const indexBuffer = device.createBuffer({data: indexValues, usage: Buffer.INDEX});
    let bridge: ThreeBufferBridge | undefined;
    const errors: string[] = [];
    nativeDevice.addEventListener('uncapturederror', event => errors.push(event.error.message));
    try {
      await renderer.init();
      bridge = new ThreeBufferBridge(device, renderer);
      geometry.setAttribute(
        'position',
        new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]), 3)
      );
      geometry.setIndex(bridge.createIndexAttribute(indexBuffer, 3));
      const scene = new Scene();
      scene.add(new Mesh(geometry, material));
      const camera = new PerspectiveCamera(60, 1, 0.1, 10);
      camera.position.z = 2;
      renderer.setSize(32, 32, false);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      const pixels = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 32, 32);
      // Readback rows are aligned to 256 bytes by the upstream WebGPU backend.
      const center = 16 * 256 + 16 * 4;
      expect(pixels[center]).toBe(255);
      expect(pixels[center + 1]).toBe(0);
      expect(pixels[center + 3]).toBe(255);
      expect(geometry.index!.array).toBeInstanceOf(format === 'uint16' ? Uint16Array : Uint32Array);
      const destroyBuffer = vi.spyOn(indexBuffer.handle as GPUBuffer, 'destroy');
      geometry.dispose();
      expect(destroyBuffer).not.toHaveBeenCalled();
      bridge.dispose();
      await nativeDevice.queue.onSubmittedWorkDone();
      expect(errors).toEqual([]);
    } finally {
      geometry.dispose();
      bridge?.dispose();
      material.dispose();
      target.dispose();
      renderer.dispose();
      indexBuffer.destroy();
      device.destroy();
      vi.restoreAllMocks();
    }
  },
  30000
);
