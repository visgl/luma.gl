// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {WebGPURenderer, RenderTarget, UnsignedByteType, LinearSRGBColorSpace} from 'three/webgpu';
import {LumaRenderer} from '../src';
import {createGLTFScene} from '../../../examples/experimental/three/gltf-scene';

for (const backendType of ['webgpu', 'webgl'] as const) {
  test(`${backendType}: glTF standard materials, directional shadows and PMREM match upstream`, async context => {
    if (
      backendType === 'webgpu'
        ? !navigator.gpu
        : !document.createElement('canvas').getContext('webgl2')
    ) {
      context.skip(`${backendType} is unavailable`);
      return;
    }
    const device = await luma.createDevice({
      type: backendType,
      adapters: [backendType === 'webgpu' ? webgpuAdapter : webgl2Adapter],
      createCanvasContext: {canvas: document.createElement('canvas'), autoResize: false}
    });
    const renderer = new LumaRenderer({device});
    const reference = new WebGPURenderer({
      canvas: document.createElement('canvas'),
      antialias: false,
      forceWebGL: backendType === 'webgl',
      outputBufferType: UnsignedByteType
    });
    const target = new RenderTarget(128, 128, {type: UnsignedByteType, generateMipmaps: false});
    const referenceTarget = target.clone();
    const errors: string[] = [];
    const nativeDevice = device.handle as GPUDevice;
    if (backendType === 'webgpu')
      nativeDevice.addEventListener('uncapturederror', event =>
        errors.push((event as GPUUncapturedErrorEvent).error.message)
      );
    let scene: Awaited<ReturnType<typeof createGLTFScene>> | undefined;
    let referenceScene: Awaited<ReturnType<typeof createGLTFScene>> | undefined;
    try {
      await renderer.init();
      await reference.init();
      renderer.outputColorSpace = reference.outputColorSpace = LinearSRGBColorSpace;
      scene = await createGLTFScene(renderer);
      referenceScene = await createGLTFScene(reference);
      expect(scene.materialCount).toBeGreaterThan(0);
      renderer.setRenderTarget(target);
      reference.setRenderTarget(referenceTarget);
      renderer.render(scene.scene, scene.camera);
      reference.render(referenceScene.scene, referenceScene.camera);
      const pixels = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      const referencePixels = await reference.readRenderTargetPixelsAsync(
        referenceTarget,
        0,
        0,
        128,
        128
      );
      let difference = 0;
      let maximumDifference = 0;
      for (let index = 0; index < pixels.length; index++) {
        const value = Math.abs(pixels[index] - referencePixels[index]);
        difference += value;
        maximumDifference = Math.max(maximumDifference, value);
      }
      expect(difference / pixels.length).toBeLessThan(0.25);
      expect(maximumDifference).toBeLessThanOrEqual(2);
      expect(new Set(pixels).size).toBeGreaterThan(50);
      scene.ground.receiveShadow = false;
      scene.ground.material.needsUpdate = true;
      renderer.render(scene.scene, scene.camera);
      const withoutShadows = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      let shadowedPixelCount = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (
          withoutShadows[index] + withoutShadows[index + 1] + withoutShadows[index + 2] >
          pixels[index] + pixels[index + 1] + pixels[index + 2] + 6
        )
          shadowedPixelCount++;
      }
      expect(shadowedPixelCount).toBeGreaterThan(25);
      scene.ground.receiveShadow = true;
      scene.ground.material.needsUpdate = true;
      scene.light.shadow.intensity = 1;
      scene.light.position.set(-3, 4, 2);
      referenceScene.light.position.copy(scene.light.position);
      // Three updates each camera's shadow map once per animation frame.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      renderer.render(scene.scene, scene.camera);
      reference.render(referenceScene.scene, referenceScene.camera);
      const movedLight = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      const referenceMovedLight = await reference.readRenderTargetPixelsAsync(
        referenceTarget,
        0,
        0,
        128,
        128
      );
      expect(Array.from(movedLight)).not.toEqual(Array.from(pixels));
      let movedDifference = 0;
      for (let index = 0; index < movedLight.length; index++)
        movedDifference = Math.max(
          movedDifference,
          Math.abs(movedLight[index] - referenceMovedLight[index])
        );
      expect(movedDifference).toBeLessThanOrEqual(2);
      scene.light.shadow.intensity = 0;
      renderer.render(scene.scene, scene.camera);
      const disabledShadows = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      expect(Array.from(disabledShadows)).not.toEqual(Array.from(movedLight));
      scene.light.intensity = 0;
      renderer.render(scene.scene, scene.camera);
      const withoutLight = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      expect(Array.from(withoutLight)).not.toEqual(Array.from(pixels));
      scene.scene.environmentIntensity = 0;
      renderer.render(scene.scene, scene.camera);
      const withoutEnvironment = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      expect(Array.from(withoutEnvironment)).not.toEqual(Array.from(withoutLight));
      if (backendType === 'webgpu') await nativeDevice.queue.onSubmittedWorkDone();
      else {
        const nativeContext = device.handle as WebGL2RenderingContext;
        expect(nativeContext.getError()).toBe(nativeContext.NO_ERROR);
      }
      expect(errors).toEqual([]);
    } finally {
      scene?.dispose();
      referenceScene?.dispose();
      target.dispose();
      referenceTarget.dispose();
      renderer.dispose();
      reference.dispose();
      device.destroy();
    }
  }, 60000);
}
