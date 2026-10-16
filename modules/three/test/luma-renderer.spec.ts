// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {
  RenderTarget,
  WebGPURenderer,
  UnsignedByteType,
  NearestFilter,
  LinearSRGBColorSpace,
  Mesh,
  BoxGeometry,
  MeshBasicNodeMaterial,
  Color
} from 'three/webgpu';
import {LumaRenderer} from '../src';
import {createScene} from '../../../examples/experimental/three/scene';

test('WebGPU: upstream TSL render parity, updates, compute and borrowed device lifetime', async context => {
  if (!navigator.gpu) {
    context.skip('WebGPU is unavailable');
    return;
  }
  const canvas = document.createElement('canvas');
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas, autoResize: false}
  });
  const errors: string[] = [];
  const nativeDevice = device.handle as GPUDevice;
  nativeDevice.addEventListener('uncapturederror', event =>
    errors.push((event as GPUUncapturedErrorEvent).error.message)
  );
  const createBuffer = vi.spyOn(device, 'createBuffer');
  const createShader = vi.spyOn(device, 'createShader');
  const createPipeline = vi.spyOn(device, 'createRenderPipeline');
  const createComputePipeline = vi.spyOn(device, 'createComputePipeline');
  const beginRenderPass = vi.spyOn(device, 'beginRenderPass');
  const destroyDevice = vi.spyOn(device, 'destroy');
  const renderer = new LumaRenderer({device});
  const reference = new WebGPURenderer({
    canvas: document.createElement('canvas'),
    antialias: false,
    outputBufferType: UnsignedByteType
  });
  const scene = createScene();
  const target = new RenderTarget(64, 64, {
    type: UnsignedByteType,
    generateMipmaps: false,
    minFilter: NearestFilter
  });
  const referenceTarget = target.clone();
  try {
    await renderer.init();
    await reference.init();
    renderer.outputColorSpace = reference.outputColorSpace = LinearSRGBColorSpace;
    renderer.setSize(64, 64, false);
    reference.setSize(64, 64, false);
    renderer.setRenderTarget(target);
    reference.setRenderTarget(referenceTarget);
    renderer.render(scene.scene, scene.camera);
    reference.render(scene.scene, scene.camera);
    const pixels = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64);
    const referencePixels = await reference.readRenderTargetPixelsAsync(
      referenceTarget,
      0,
      0,
      64,
      64
    );
    expect(pixels.length).toBe(64 * 64 * 4);
    let maximumDifference = 0;
    for (let index = 0; index < pixels.length; index++)
      maximumDifference = Math.max(
        maximumDifference,
        Math.abs(pixels[index] - referencePixels[index])
      );
    expect(maximumDifference).toBeLessThanOrEqual(2);
    expect(new Set(pixels).size).toBeGreaterThan(20);

    scene.phase.value = 1;
    renderer.render(scene.scene, scene.camera);
    const updated = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64);
    expect(Array.from(updated)).not.toEqual(Array.from(pixels));

    // Add a farther mesh covering the foreground. Depth must preserve the front cube.
    const geometry = new BoxGeometry(2, 2, 1);
    const material = new MeshBasicNodeMaterial({color: new Color(0, 1, 0)});
    const background = new Mesh(geometry, material);
    background.position.z = -2;
    scene.scene.add(background);
    renderer.render(scene.scene, scene.camera);
    const withBackground = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64);
    const center = (32 * 64 + 32) * 4;
    expect(Array.from(withBackground.slice(center, center + 4))).toEqual(
      Array.from(updated.slice(center, center + 4))
    );
    scene.scene.remove(background);
    geometry.dispose();
    material.dispose();

    await renderer.computeAsync(scene.compute);
    const computed = new Float32Array(await renderer.getArrayBufferAsync(scene.attribute));
    expect(Array.from(computed)).toEqual(Array.from({length: 16}, (_, index) => index * 2 + 1));
    const ranged = new Float32Array(
      await renderer.getArrayBufferAsync(scene.attribute, new ArrayBuffer(8), 4, 8)
    );
    expect(Array.from(ranged)).toEqual([3, 5]);

    target.setSize(32, 48);
    renderer.render(scene.scene, scene.camera);
    expect((await renderer.readRenderTargetPixelsAsync(target, 0, 0, 32, 48)).length).toBe(
      32 * 48 * 4
    );
    // SwiftShader headless runners cannot allocate onscreen swap-chain surfaces.
    // Keep pixel/resize/recreation checks offscreen; live smoke tests cover presentation.
    renderer.setSize(80, 48, false);
    renderer.render(scene.scene, scene.camera);
    expect(canvas.width).toBe(80);
    expect(canvas.height).toBe(48);
    expect(createBuffer).toHaveBeenCalled();
    expect(createShader).toHaveBeenCalled();
    expect(createPipeline).toHaveBeenCalled();
    expect(createComputePipeline).toHaveBeenCalled();
    expect(beginRenderPass).toHaveBeenCalled();
    renderer.dispose();
    expect(destroyDevice).not.toHaveBeenCalled();
    const recreated = new LumaRenderer({device});
    await recreated.init();
    recreated.setSize(32, 32, false);
    recreated.setRenderTarget(target);
    recreated.render(scene.scene, scene.camera);
    recreated.dispose();
    await nativeDevice.queue.onSubmittedWorkDone();
    expect(errors).toEqual([]);
  } finally {
    target.dispose();
    referenceTarget.dispose();
    scene.dispose();
    renderer.dispose();
    reference.dispose();
    device.destroy();
    vi.restoreAllMocks();
  }
}, 30000);
