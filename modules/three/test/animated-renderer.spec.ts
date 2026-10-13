// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webgl2Adapter} from '@luma.gl/webgl';
import {
  WebGPURenderer,
  RenderTarget,
  UnsignedByteType,
  LinearSRGBColorSpace,
  Mesh,
  SkinnedMesh,
  InstancedMesh
} from 'three/webgpu';
import {LumaRenderer} from '../src';
import {createGLTFScene, type GLTFSceneKind} from '../../../examples/experimental/three/gltf-scene';

for (const backendType of ['webgpu', 'webgl'] as const) {
  for (const kind of ['morph', 'skin', 'instances'] satisfies GLTFSceneKind[]) {
    test(`${backendType}: ${kind} animation matches upstream at fixed times`, async context => {
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
        scene = await createGLTFScene(renderer, kind);
        referenceScene = await createGLTFScene(reference, kind);
        let featureCount = 0;
        scene.scene.traverse(object => {
          if (kind === 'skin' && object instanceof SkinnedMesh) featureCount++;
          if (kind === 'morph' && object instanceof Mesh && object.morphTargetInfluences?.length)
            featureCount++;
          if (
            kind === 'instances' &&
            object instanceof InstancedMesh &&
            object.count === 64 &&
            object.instanceColor
          )
            featureCount++;
        });
        expect(featureCount).toBeGreaterThan(0);
        if (kind !== 'instances') expect(scene.animationCount).toBeGreaterThan(0);
        renderer.setRenderTarget(target);
        reference.setRenderTarget(referenceTarget);
        let previous: Uint8Array | undefined;
        for (const seconds of [0.15, 0.75]) {
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
          if (previous) expect(Array.from(pixels)).not.toEqual(Array.from(previous));
          previous = new Uint8Array(pixels);
        }
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
}
