// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {WebGPURenderer, RenderTarget, UnsignedByteType, LinearSRGBColorSpace} from 'three/webgpu';
import {LumaRenderer} from '../src';
import {createScene} from '../../../examples/experimental/three/scene';

test('WebGL2: TSL texture/displacement updates, resize and borrowed-device recreation', async context => {
  if (!document.createElement('canvas').getContext('webgl2')) {
    context.skip('WebGL2 unavailable');
    return;
  }
  const device = await luma.createDevice({
    type: 'webgl',
    adapters: [webgl2Adapter],
    createCanvasContext: {canvas: document.createElement('canvas'), autoResize: false}
  });
  let renderer = new LumaRenderer({device});
  const reference = new WebGPURenderer({
    canvas: document.createElement('canvas'),
    forceWebGL: true,
    antialias: false,
    outputBufferType: UnsignedByteType
  });
  const scene = createScene();
  const referenceScene = createScene();
  const target = new RenderTarget(128, 128, {type: UnsignedByteType, generateMipmaps: false});
  const referenceTarget = target.clone();
  const nativeContext = device.handle as WebGL2RenderingContext;
  try {
    await renderer.init();
    expect(renderer.getContext()).toBe(nativeContext);
    await reference.init();
    renderer.outputColorSpace = reference.outputColorSpace = LinearSRGBColorSpace;
    renderer.setRenderTarget(target);
    reference.setRenderTarget(referenceTarget);
    let previous: Uint8Array | undefined;
    for (const phase of [0.25, 0.9]) {
      scene.phase.value = referenceScene.phase.value = phase;
      renderer.render(scene.scene, scene.camera);
      reference.render(referenceScene.scene, referenceScene.camera);
      const pixels = await renderer.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
      const expected = await reference.readRenderTargetPixelsAsync(referenceTarget, 0, 0, 128, 128);
      let maximum = 0;
      let total = 0;
      for (let index = 0; index < pixels.length; index++) {
        const difference = Math.abs(pixels[index] - expected[index]);
        maximum = Math.max(maximum, difference);
        total += difference;
      }
      expect(maximum).toBeLessThanOrEqual(2);
      expect(total / pixels.length).toBeLessThan(0.25);
      expect(new Set(pixels).size).toBeGreaterThan(50);
      if (previous) expect(Array.from(pixels)).not.toEqual(Array.from(previous));
      previous = pixels;
    }
    await expect(renderer.computeAsync(scene.compute)).rejects.toThrow('WebGL2 compute');
    renderer.setRenderTarget(null);
    renderer.setSize(96, 80, false);
    expect(device.getDefaultCanvasContext().canvas.width).toBe(96);
    renderer.dispose();
    renderer = new LumaRenderer({device});
    await renderer.init();
    renderer.render(scene.scene, scene.camera);
    expect(nativeContext.isContextLost()).toBe(false);
    expect(nativeContext.getError()).toBe(nativeContext.NO_ERROR);
  } finally {
    renderer.dispose();
    reference.dispose();
    scene.dispose();
    referenceScene.dispose();
    target.dispose();
    referenceTarget.dispose();
    device.destroy();
  }
}, 60000);
