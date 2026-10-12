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
    const renderSequence = async (progressive: boolean, samplesPerPixel: number) => {
      const renderer = device.newRenderer('raytrace', {
        samplingSeed: 17,
        samplesPerPixel,
        historySampleLimit: 1,
        resolutionScale: 1,
        adaptiveResolution: false,
        temporalReprojection: true,
        progressive,
        background: [0, 0, 0, 1]
      });
      const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
      const pixels: Uint8Array[] = [];
      try {
        for (let frameIndex = 0; frameIndex < 4; frameIndex++) {
          frame.render();
          graphics.submit();
          pixels.push(await readColor());
        }
        return pixels;
      } finally {
        frame.destroy();
      }
    };
    // The non-progressive reference advances the identical random sequence through
    // temporal mode but never consumes history. A saturated one-sample budget must
    // match its current frame, both at and below samplesPerPixel.
    for (const samplesPerPixel of [1, 16]) {
      const reference = await renderSequence(false, samplesPerPixel);
      expect(reference[1]).not.toEqual(reference[0]);
      expect(await renderSequence(true, samplesPerPixel)).toEqual(reference);
    }
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
      const beforeMemory = frame.render().rayTracing?.memory;
      graphics.submit();
      expect(beforeMemory?.historyTextureBytes).toBe(32 * 32 * 32);
      expect(beforeMemory?.totalBytes).toBe(
        beforeMemory!.sceneBufferBytes +
          beforeMemory!.historyTextureBytes +
          beforeMemory!.graphTransientBytes
      );
      renderer.setParameter('denoiseRadius', 1).commitParameters();
      const filtered = frame.render().rayTracing;
      graphics.submit();
      expect(filtered?.accumulatedSamples).toBe(4);
      expect(filtered?.memory).toEqual(beforeMemory);
      renderer
        .setParameters({historySampleLimit: 1, samplesPerPixel: 16, denoiseRadius: 2})
        .commitParameters();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
      expect(Array.from(await readColor()).some(value => value > 0)).toBe(true);
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
