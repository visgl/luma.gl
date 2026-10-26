// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {WebGPURenderer, RenderTarget, UnsignedByteType, LinearSRGBColorSpace} from 'three/webgpu';
import {LumaRenderer} from '../src';
import {createGLTFScene, type GLTFSceneKind} from '../../../examples/experimental/three/gltf-scene';

for (const backendType of ['webgpu', 'webgl'] as const) {
  for (const kind of ['materials', 'transmission'] satisfies GLTFSceneKind[]) {
    test(`${backendType}: ${kind} physical materials match upstream`, async context => {
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
      const copyTexture = vi.spyOn(
        Object.getPrototypeOf(device.commandEncoder),
        'copyTextureToTexture'
      );
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
        scene = await createGLTFScene(renderer, kind);
        referenceScene = await createGLTFScene(reference, kind);
        expect(scene.physicalMaterials.length).toBe(kind === 'materials' ? 4 : 2);
        renderer.setRenderTarget(target);
        reference.setRenderTarget(referenceTarget);

        for (const seconds of [0.15]) {
          scene.update(seconds);
          referenceScene.update(seconds);
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
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
          let maximum = 0;
          let total = 0;
          for (let index = 0; index < pixels.length; index++) {
            const difference = Math.abs(pixels[index] - referencePixels[index]);
            maximum = Math.max(maximum, difference);
            total += difference;
          }
          expect(maximum).toBeLessThanOrEqual(2);
          expect(total / pixels.length).toBeLessThan(0.25);
          expect(new Set(pixels).size).toBeGreaterThan(50);
          if (kind === 'transmission') expect(copyTexture).toHaveBeenCalled();
          for (const material of scene.physicalMaterials) {
            material.clearcoat =
              material.sheen =
              material.iridescence =
              material.anisotropy =
              material.transmission =
                0;
            material.needsUpdate = true;
          }
          renderer.render(scene.scene, scene.camera);
          const withoutFeatures = await renderer.readRenderTargetPixelsAsync(
            target,
            0,
            0,
            128,
            128
          );
          let changedPixels = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            if (
              Math.abs(pixels[index] - withoutFeatures[index]) +
                Math.abs(pixels[index + 1] - withoutFeatures[index + 1]) +
                Math.abs(pixels[index + 2] - withoutFeatures[index + 2]) >
              6
            )
              changedPixels++;
          }
          expect(changedPixels).toBeGreaterThan(25);
        }
        if (backendType === 'webgpu') await nativeDevice.queue.onSubmittedWorkDone();
        else {
          const nativeContext = device.handle as WebGL2RenderingContext;
          expect(nativeContext.getError()).toBe(nativeContext.NO_ERROR);
        }
        expect(errors).toEqual([]);
      } finally {
        copyTexture.mockRestore();
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
}
