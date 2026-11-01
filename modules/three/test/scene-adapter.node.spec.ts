// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {Device, RenderPass} from '@luma.gl/core';
import {LumaBackend} from '../src/luma-backend';

function createFixture() {
  const device = {
    type: 'webgpu',
    getDefaultCanvasContext: () => ({canvas: {}}),
    limits: {},
    submit: vi.fn(),
    beginRenderPass: vi.fn()
  } as unknown as Device;
  const framebuffer = {
    width: 64,
    height: 48,
    colorAttachments: [{texture: {format: 'rgba8unorm', samples: 1}}],
    depthStencilAttachment: {texture: {format: 'depth32float', samples: 1}}
  };
  const pass = {
    device,
    props: {framebuffer},
    end: vi.fn(),
    setParameters: vi.fn()
  } as unknown as RenderPass;
  return {backend: new LumaBackend(device), device, pass};
}

test('borrowed scene pass preserves caller lifecycle and actual attachment formats', () => {
  const {backend, device, pass} = createFixture();
  const context = {textures: null, depth: true, clearColor: true, clearDepth: true};
  backend.withRenderPass(pass, () => {
    backend.beginRender(context);
    backend.updateViewport(context);
    backend.finishRender();
  });
  expect(pass.end).not.toHaveBeenCalled();
  expect(pass.setParameters).not.toHaveBeenCalled();
  expect(device.beginRenderPass).not.toHaveBeenCalled();
  expect(device.submit).not.toHaveBeenCalled();
  expect(context).toMatchObject({width: 64, height: 48});
  backend.dispose();
  expect(pass.end).not.toHaveBeenCalled();
});

test('borrowed pass rejects auxiliary work before touching the caller encoder and recovers scope', () => {
  const {backend, device, pass} = createFixture();
  backend.withRenderPass(pass, () => {
    expect(() => backend.generateMipmaps({})).toThrow('prepare texture');
    expect(() => backend.beginRender({textures: [{}]})).toThrow('nested');
    expect(() => backend.clear(true, true, false)).toThrow('caller owns');
    expect(() => backend.copyFramebufferToTexture({}, {}, {})).toThrow('transmission');
    expect(() => backend.beginCompute()).toThrow('borrowed pass');
  });
  expect(() =>
    backend.withRenderPass(pass, () => {
      throw new Error('caller error');
    })
  ).toThrow('caller error');
  expect(() => backend.withRenderPass(pass, () => {})).not.toThrow();
  expect(device.submit).not.toHaveBeenCalled();
  expect(pass.end).not.toHaveBeenCalled();
});
