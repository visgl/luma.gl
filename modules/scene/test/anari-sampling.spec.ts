// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ANARIDevice} from '@luma.gl/scene';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {expect, it, vi} from 'vitest';

it('primary sampling seeds reproduce pixels and invalidate progressive history', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const graphics = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(32, 32)},
    debug: true
  });
  const color = graphics.createTexture({
    width: 32,
    height: 32,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = graphics.createFramebuffer({
    width: 32,
    height: 32,
    colorAttachments: [color],
    depthStencilAttachment: graphics.preferredDepthFormat
  });
  const presentation = vi
    .spyOn(graphics.getCanvasContext(), 'getCurrentFramebuffer')
    .mockReturnValue(framebuffer);
  const device = new ANARIDevice(graphics);
  const surface = device.newSurface({
    geometry: device.newGeometry('sphere', {radius: 0.9}),
    material: device.newMaterial('physicallyBased', {emissive: [1, 0.2, 0.2]})
  });
  const world = device.newWorld({surface: [surface]});
  const camera = device.newCamera('perspective', {position: [0, 0, 3], fovy: Math.PI / 3});
  const readColor = async () => {
    const buffer = graphics.createBuffer({
      byteLength: color.computeMemoryLayout().byteLength,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    try {
      color.readBuffer({}, buffer);
      return await buffer.readAsync();
    } finally {
      buffer.destroy();
    }
  };
  const render = async (samplingSeed: number) => {
    const renderer = device.newRenderer('raytrace', {
      samplingSeed,
      resolutionScale: 1,
      adaptiveResolution: false,
      temporalReprojection: false,
      progressive: false,
      background: [0, 0, 0, 1]
    });
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
    try {
      frame.render();
      graphics.submit();
      return await readColor();
    } finally {
      frame.destroy();
    }
  };
  try {
    const first = await render(17);
    expect(await render(17)).toEqual(first);
    expect(await render(0xffffffff)).not.toEqual(first);
    const renderer = device.newRenderer('raytrace', {
      samplingSeed: 17,
      resolutionScale: 1,
      adaptiveResolution: false,
      temporalReprojection: false,
      progressive: true
    });
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
    try {
      frame.render();
      graphics.submit();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(2);
      graphics.submit();
      renderer.setParameter('samplingSeed', 18).commitParameters();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
    } finally {
      frame.destroy();
    }
  } finally {
    device.destroy();
    presentation.mockRestore();
    framebuffer.destroy();
    color.destroy();
    graphics.destroy();
  }
}, 120000);
