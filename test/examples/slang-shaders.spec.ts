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
] as const)('Slang Shaders example renders its palette module on %s', async backend => {
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
      const renderPass = device!.beginRenderPass({framebuffer, clearColor: [0.04, 0.06, 0.12, 1]});
      const drawn = application.model.draw(renderPass);
      renderPass.end();
      device!.submit();
      expect(drawn).toBe(true);
    });
    const options = {x: 32, y: 32, width: 1, height: 1};
    const buffer = device!.createBuffer({
      byteLength: texture.computeMemoryLayout(options).byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      texture.readBuffer(options, buffer);
      const pixels = new Uint8Array(await buffer.readAsync());
      expect(pixels[0]).toBeGreaterThan(70);
      expect(pixels[1]).toBeGreaterThan(30);
      expect(pixels[2]).toBeGreaterThan(40);
      expect(pixels[3]).toBe(255);
    } finally {
      buffer.destroy();
    }
    if (backend === 'webgl2') {
      expect(application.model.vs).toContain('#version 300 es');
      expect(application.model.fs).toContain('_slang_function_getPaletteColor');
    } else {
      expect(application.model.props.vertexEntryPoint).toBe('_slang_entry_vertexMain');
      expect(application.model.props.fragmentEntryPoint).toBe('_slang_entry_fragmentMain');
      expect(application.model.source).toContain('_slang_function_getPaletteColor');
    }
  } finally {
    application.onFinalize();
    framebuffer.destroy();
    texture.destroy();
  }
});
