// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {createShaderViewer} from '../../examples/tutorials/slang-shaders/shader-viewer';
import {WGSL_EXAMPLES} from '../../examples/tutorials/slang-shaders/wgsl-examples';
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
    application.updateScene(0, 1, 0);
    const draw = () => {
      const pass = device!.beginRenderPass({framebuffer, clearColor: [0.01, 0.02, 0.04, 1]});
      const drawn = application.model.draw(pass);
      pass.end();
      return drawn;
    };
    await vi.waitFor(() => {
      const drawn = draw();
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
      application.updateScene(4, 1, 0);
      draw();
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
      // Keep the scene fixed: the typed native call and Slang callback add grain.
      application.updateScene(4, 1, 0.15);
      draw();
      device!.submit();
      texture.readBuffer(options, buffer);
      const grainPixels = new Uint8Array(await buffer.readAsync());
      expect(grainPixels).not.toEqual(animatedPixels);
    } finally {
      buffer.destroy();
    }
    if (backend === 'webgl2') {
      expect(application.model.vs).toContain('#version 300 es');
      expect(application.model.fs).toContain('_slang_function_getPaletteColor');
      expect(application.model.fs).toContain('_slang_function_getSculptureDistance');
      expect(application.model.fs).toContain('valueNoise_noise(coordinates');
      expect(application.model.fs).toContain('float scaleGrain(');
    } else {
      expect(application.model.props.vertexEntryPoint).toBe('_slang_entry_vertexMain');
      expect(application.model.props.fragmentEntryPoint).toBe('_slang_entry_fragmentMain');
      expect(application.model.source).toContain('_slang_function_getPaletteColor');
      expect(application.model.source).toContain('_slang_function_getSculptureDistance');
      expect(application.model.source).toContain('valueNoise_noise(coordinates');
      expect(application.model.source).toContain('fn scaleGrain(');
    }
  } finally {
    application.onFinalize();
    framebuffer.destroy();
    texture.destroy();
  }
});

it('Slang shader viewer compiles and runs each WGSL source sample as GLSL', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const viewer = createShaderViewer(host, WGSL_EXAMPLES, [], true);
  try {
    const selector = host.querySelector<HTMLSelectElement>('[aria-label="Shader source"]')!;
    const canvas = host.querySelector<HTMLCanvasElement>(
      '[aria-label="WGSL sample rendered as GLSL"]'
    )!;
    const generated = host.querySelector<HTMLSelectElement>('[aria-label="Generated shader"]')!;
    for (let index = 0; index < WGSL_EXAMPLES.length; index++) {
      selector.selectedIndex = index;
      selector.dispatchEvent(new Event('change'));
      expect(canvas.hidden).toBe(false);
      expect(generated.options[0].text).toContain('GLSL ES 300');
      expect(host.querySelector('[aria-label="Generated shader code"]')!.textContent).toContain(
        '#version 300 es'
      );
      const context = canvas.getContext('webgl2')!;
      const pixel = new Uint8Array(4);
      context.readPixels(
        canvas.width / 2,
        canvas.height / 2,
        1,
        1,
        context.RGBA,
        context.UNSIGNED_BYTE,
        pixel
      );
      expect(pixel[0] + pixel[1] + pixel[2]).toBeGreaterThan(70);
      expect(pixel[3]).toBe(255);
      expect(context.getError()).toBe(context.NO_ERROR);
    }
  } finally {
    viewer.destroy();
    host.remove();
  }
});
