// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import SlangShadersExample from '../../examples/tutorials/slang-shaders/app';

it.each([
  'webgl2',
  'webgpu'
] as const)('Slang Shaders example animates Slang modules and an imported native noise module on %s', async backend => {
  const device =
    backend === 'webgl2' ? await getWebGLTestDevice() : await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const application = new SlangShadersExample({device: device!} as AnimationProps);
  const texture = device!.createTexture({
    width: 64,
    height: 64,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device!.createFramebuffer({
    colorAttachments: [texture],
    depthStencilAttachment: 'depth24plus',
    width: 64,
    height: 64
  });
  try {
    await vi.waitFor(() => {
      const drawn = application.filmGrainPass.draw(application.model, 64, 64, 0, 0, framebuffer);
      device!.submit();
      expect(drawn).toBe(true);
    });
    const options = {x: 0, y: 0, width: 64, height: 64};
    const buffer = device!.createBuffer({
      byteLength: texture.computeMemoryLayout(options).byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      texture.readBuffer(options, buffer);
      const pixels = new Uint8Array(await buffer.readAsync());
      const centerOffset = (32 * 64 + 32) * 4;
      expect(pixels[centerOffset]).toBeGreaterThan(70);
      expect(pixels[centerOffset + 1]).toBeGreaterThan(30);
      expect(pixels[centerOffset + 2]).toBeGreaterThan(40);
      expect(pixels[centerOffset + 3]).toBe(255);
      // Advancing the shared ConstantBuffer changes the rendered geometry and material.
      application.updateScene(4, 1);
      application.filmGrainPass.draw(application.model, 64, 64, 0, 0, framebuffer);
      device!.submit();
      texture.readBuffer(options, buffer);
      const animatedPixels = new Uint8Array(await buffer.readAsync());
      let changedPixels = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        const difference =
          Math.abs(pixels[offset] - animatedPixels[offset]) +
          Math.abs(pixels[offset + 1] - animatedPixels[offset + 1]) +
          Math.abs(pixels[offset + 2] - animatedPixels[offset + 2]);
        if (difference > 20) changedPixels++;
      }
      expect(changedPixels).toBeGreaterThan(200);
      // Keep the Slang scene fixed: changing only the native module pass changes the pixels.
      application.filmGrainPass.draw(application.model, 64, 64, 0, 0.15, framebuffer);
      device!.submit();
      texture.readBuffer(options, buffer);
      const grainPixels = new Uint8Array(await buffer.readAsync());
      expect(grainPixels).not.toEqual(animatedPixels);
      // Resizing replaces the sampled target and keeps the native pass bound to the new texture.
      application.filmGrainPass.draw(application.model, 32, 32, 0, 0.15, framebuffer);
      expect(application.filmGrainPass.draw(application.model, 64, 64, 0, 0.15, framebuffer)).toBe(
        true
      );
      device!.submit();
    } finally {
      buffer.destroy();
    }
    if (backend === 'webgl2') {
      expect(application.model.vs).toContain('#version 300 es');
      expect(application.model.fs).toContain('_slang_function_getPaletteColor');
      expect(application.model.fs).toContain('_slang_function_getSculptureDistance');
      expect(application.filmGrainPass.model.fs).toContain('valueNoise_noise(gl_FragCoord.xy');
    } else {
      expect(application.model.props.vertexEntryPoint).toBe('_slang_entry_vertexMain');
      expect(application.model.props.fragmentEntryPoint).toBe('_slang_entry_fragmentMain');
      expect(application.model.source).toContain('_slang_function_getPaletteColor');
      expect(application.model.source).toContain('_slang_function_getSculptureDistance');
      expect(application.filmGrainPass.model.source).toContain(
        'valueNoise_noise(input.position.xy'
      );
    }
  } finally {
    application.onFinalize();
    framebuffer.destroy();
    texture.destroy();
  }
});
