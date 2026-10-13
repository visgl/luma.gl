// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {luma, Buffer, Texture} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {WebGPURenderer, RenderTarget, UnsignedByteType, LinearSRGBColorSpace} from 'three/webgpu';
import {createObjectScene} from '../../../examples/experimental/three/object-scene';
import {MixedObjectRenderer} from '../../../examples/experimental/three/mixed-object-renderer';

test('WebGPU: adapted Three mesh and native luma Model share one caller-owned pass', async context => {
  if (!navigator.gpu) {
    context.skip('WebGPU unavailable');
    return;
  }
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas: document.createElement('canvas'), autoResize: false}
  });
  const renderer = new MixedObjectRenderer(device, 'rgba8unorm', 'linear');
  const reference = new WebGPURenderer({
    canvas: document.createElement('canvas'),
    antialias: false,
    outputBufferType: UnsignedByteType
  });
  const scene = createObjectScene();
  const referenceScene = createObjectScene();
  const color = device.createTexture({
    width: 128,
    height: 128,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 128,
    height: 128,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const target = new RenderTarget(128, 128, {type: UnsignedByteType, generateMipmaps: false});
  const readback = device.createBuffer({
    byteLength: 128 * 128 * 4,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const readPixels = async () => {
    color.readBuffer({}, readback);
    return readback.readAsync();
  };
  const beginPass = vi.spyOn(device, 'beginRenderPass');
  const geometryDispose = vi.spyOn(scene.mesh.geometry, 'dispose');
  const materialDispose = vi.spyOn(scene.mesh.material, 'dispose');
  const errors: string[] = [];
  const nativeDevice = device.handle as GPUDevice;
  nativeDevice.addEventListener('uncapturederror', event =>
    errors.push((event as GPUUncapturedErrorEvent).error.message)
  );
  try {
    await reference.init();
    reference.outputColorSpace = LinearSRGBColorSpace;
    reference.setRenderTarget(target);
    let previous: Uint8Array | undefined;
    for (const seconds of [0, Math.PI / 2]) {
      scene.update(seconds);
      referenceScene.update(seconds);
      const before = beginPass.mock.calls.length;
      renderer.render(scene.scene, scene.camera, framebuffer);
      expect(beginPass.mock.calls.length - before).toBe(1);
      reference.render(referenceScene.scene, referenceScene.camera);
      const pixels = await readPixels();
      const referencePixels = await reference.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      let maximum = 0;
      let total = 0;
      for (let index = 0; index < pixels.length; index++) {
        const difference = Math.abs(pixels[index] - referencePixels[index]);
        maximum = Math.max(maximum, difference);
        total += difference;
      }
      expect(maximum).toBeLessThanOrEqual(2);
      expect(total / pixels.length).toBeLessThan(0.25);
      const center = (64 * 128 + 64) * 4;
      if (seconds === 0) expect(pixels[center]).toBeGreaterThan(pixels[center + 1]);
      else expect(pixels[center + 1]).toBeGreaterThan(pixels[center]);
      // The triangle moves from behind the cube to in front despite being drawn last both times.
      if (previous) expect(Array.from(pixels)).not.toEqual(Array.from(previous));
      previous = pixels;
    }
    const position = scene.mesh.geometry.getAttribute('position');
    position.setX(0, position.getX(0) + 0.4);
    position.needsUpdate = true;
    const referencePosition = referenceScene.mesh.geometry.getAttribute('position');
    referencePosition.setX(0, referencePosition.getX(0) + 0.4);
    referencePosition.needsUpdate = true;
    scene.mesh.position.x = referenceScene.mesh.position.x = 0.35;
    renderer.render(scene.scene, scene.camera, framebuffer);
    reference.render(referenceScene.scene, referenceScene.camera);
    const updated = await readPixels();
    const referenceUpdated = await reference.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
    expect(Array.from(updated)).not.toEqual(Array.from(previous!));
    expect(
      Math.max(...updated.map((value, index) => Math.abs(value - referenceUpdated[index])))
    ).toBeLessThanOrEqual(2);
    renderer.dispose();
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
    const probe = device.createBuffer({byteLength: 16});
    probe.destroy();
    await nativeDevice.queue.onSubmittedWorkDone();
    expect(errors).toEqual([]);
  } finally {
    beginPass.mockRestore();
    geometryDispose.mockRestore();
    materialDispose.mockRestore();
    renderer.dispose();
    reference.dispose();
    scene.dispose();
    referenceScene.dispose();
    framebuffer.destroy();
    color.destroy();
    target.dispose();
    readback.destroy();
    device.destroy();
  }
}, 60000);
