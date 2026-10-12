// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ANARIDevice, type ANARIRendererParameters} from '@luma.gl/scene';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {expect, it, vi} from 'vitest';

it('opaque PBR paths reflect emissive geometry with roughness, tint and fresh seeded history', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const graphics = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(32, 32)}
  });
  const errors = vi.spyOn(graphics, 'reportError');
  const color = graphics.createTexture({
    width: 32,
    height: 32,
    format: 'rgba32float',
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
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.8, 0.2, 0.05],
    metallic: 1,
    roughness: 0.04
  });
  const emitter = device.newMaterial('physicallyBased', {
    baseColor: [0, 0, 0],
    emissive: [1, 1, 1]
  });
  // The emitter is behind the camera, unseen by primary rays but visible in the
  // receiver's near-normal reflection. A tiny FOV isolates secondary sampling.
  const emitterInstance = device.newInstance({
    group: device.newGroup({
      surface: [
        device.newSurface({
          geometry: device.newGeometry('sphere', {radius: 0.7}),
          material: emitter
        })
      ]
    }),
    transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 5, 1]
  });
  const world = device.newWorld({
    surface: [device.newSurface({geometry: device.newGeometry('sphere', {radius: 0.9}), material})],
    instance: [emitterInstance],
    light: [device.newLight('directional', {direction: [0, 0, -1], irradiance: 0})]
  });
  const camera = device.newCamera('perspective', {position: [0, 0, 3], fovy: 0.000001});
  const settings: ANARIRendererParameters = {
    transportMode: 'pbr',
    maxBounces: 1,
    samplesPerPixel: 16,
    samplingSeed: 17,
    ambientRadiance: 0,
    exposure: 1,
    toneMapMode: 0,
    outputColorSpace: 'linear',
    resolutionScale: 1,
    adaptiveResolution: false,
    temporalReprojection: false,
    progressive: false,
    background: [0, 0, 0, 1]
  };
  const readColor = async () => {
    const buffer = graphics.createBuffer({
      byteLength: color.computeMemoryLayout().byteLength,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    try {
      color.readBuffer({}, buffer);
      const data = await buffer.readAsync();
      const values = new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4);
      expect(Array.from(values).every(Number.isFinite)).toBe(true);
      return values;
    } finally {
      buffer.destroy();
    }
  };
  const render = async (parameters: ANARIRendererParameters = {}) => {
    const renderer = device.newRenderer('raytrace', {...settings, ...parameters});
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
    try {
      frame.render();
      graphics.submit();
      return await readColor();
    } finally {
      frame.destroy();
    }
  };
  const meanChannel = (values: Float32Array, channel: number) => {
    let total = 0;
    const rowStride = color.computeMemoryLayout().bytesPerRow / 4;
    for (let vertical = 0; vertical < 32; vertical++) {
      for (let horizontal = 0; horizontal < 32; horizontal++)
        total += values[vertical * rowStride + horizontal * 4 + channel];
    }
    return total / (32 * 32);
  };
  try {
    expect(meanChannel(await render({maxBounces: 0}), 0)).toBe(0);
    const legacyDiffuse = await render({transportMode: 'diffuse'});
    expect(meanChannel(legacyDiffuse, 0)).toBe(0);
    expect(await render({transportMode: undefined})).toEqual(legacyDiffuse);
    const smooth = await render();
    expect(meanChannel(smooth, 0)).toBeGreaterThan(0.7);
    expect(meanChannel(smooth, 1)).toBeGreaterThan(0.15);
    expect(meanChannel(smooth, 1)).toBeLessThan(0.25);
    expect(meanChannel(smooth, 2)).toBeGreaterThan(0.02);
    expect(meanChannel(smooth, 2)).toBeLessThan(0.08);
    expect(await render()).toEqual(smooth);
    material.setParameter('roughness', 0).commitParameters();
    expect(await render()).toEqual(smooth);
    material.setParameter('roughness', 1).commitParameters();
    const rough = await render();
    expect(meanChannel(rough, 0)).toBeGreaterThan(0.001);
    expect(meanChannel(rough, 0)).toBeLessThan(meanChannel(smooth, 0) / 4);
    expect(await render()).toEqual(rough);
    expect(await render({samplingSeed: 18})).not.toEqual(rough);
    expect(await render({maxBounces: 100})).toEqual(await render({maxBounces: 8}));
    material.setParameters({roughness: 0.04, metallic: 0.5}).commitParameters();
    const mixed = await render();
    expect(meanChannel(mixed, 0)).toBeGreaterThan(0.35);
    expect(meanChannel(mixed, 0)).toBeLessThan(0.5);
    material
      .setParameters({roughness: 0.04, metallic: 0, baseColor: [0, 0, 0.8]})
      .commitParameters();
    const dielectric = await render();
    expect(meanChannel(dielectric, 0)).toBeGreaterThan(0.02);
    expect(meanChannel(dielectric, 0)).toBeLessThan(0.08);
    expect(meanChannel(await render({transportMode: 'diffuse'}), 0)).toBe(0);
    material.setParameters({metallic: 1, baseColor: [0, 0, 0]}).commitParameters();
    expect(meanChannel(await render(), 0)).toBe(0);
    material.setParameter('baseColor', [0.8, 0.2, 0.05]).commitParameters();
    const renderer = device.newRenderer('raytrace', {
      ...settings,
      progressive: true,
      samplesPerPixel: 1,
      temporalReprojection: true
    });
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
    try {
      frame.render();
      graphics.submit();
      const pick = await frame.pick(16, 16);
      expect(pick).not.toBeNull();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(2);
      graphics.submit();
      camera.setParameter('position', [0.01, 0, 3]).commitParameters();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(2);
      graphics.submit();
      renderer.setParameter('transportMode', 'diffuse').commitParameters();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
      expect(meanChannel(await readColor(), 0)).toBe(0);
      expect((await frame.pick(16, 16))?.placementId).toBe(pick?.placementId);
      renderer.setParameter('transportMode', 'pbr').commitParameters();
      frame.render();
      graphics.submit();
      expect(meanChannel(await readColor(), 0)).toBeGreaterThan(0.7);
      frame.render();
      graphics.submit();
      emitter.setParameter('emissive', [0, 1, 0]).commitParameters();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
      expect(meanChannel(await readColor(), 0)).toBe(0);
      expect(meanChannel(await readColor(), 1)).toBeGreaterThan(0.15);
    } finally {
      frame.destroy();
    }
    expect(errors.mock.calls.map(([error]) => error.message)).toEqual([]);
  } finally {
    device.destroy();
    presentation.mockRestore();
    framebuffer.destroy();
    color.destroy();
    graphics.destroy();
  }
}, 120000);
