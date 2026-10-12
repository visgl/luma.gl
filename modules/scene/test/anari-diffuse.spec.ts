// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ANARIDevice} from '@luma.gl/scene';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {expect, it, vi} from 'vitest';

it('diffuse transport receives emissive light with bounded, seeded paths and fresh history', async () => {
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
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.8, 0.8, 0.8],
    roughness: 1
  });
  const emitter = device.newMaterial('physicallyBased', {
    baseColor: [0, 0, 0],
    emissive: [1, 0, 0]
  });
  // The camera and matte receiver sit inside an emissive sphere: every secondary ray
  // reaches the emitter, making the incident-light assertion independent of noise.
  const world = device.newWorld({
    surface: [
      device.newSurface({geometry: device.newGeometry('sphere', {radius: 0.9}), material}),
      device.newSurface({geometry: device.newGeometry('sphere', {radius: 10}), material: emitter})
    ]
  });
  const camera = device.newCamera('perspective', {position: [0, 0, 3], fovy: Math.PI / 3});
  const readColor = async () => {
    const buffer = graphics.createBuffer({
      byteLength: color.computeMemoryLayout().byteLength,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    try {
      color.readBuffer({}, buffer);
      return new Uint8Array(await buffer.readAsync());
    } finally {
      buffer.destroy();
    }
  };
  const render = async (maxBounces?: number, samplingSeed = 17) => {
    const renderer = device.newRenderer('raytrace', {
      ambientRadiance: 0,
      toneMapMode: 0,
      exposure: 0.1,
      maxBounces,
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
    const direct = await render(0);
    expect(await render()).toEqual(direct);
    const diffuse = await render(1);
    const centerOffset = (16 * 32 + 16) * 4;
    expect(direct[centerOffset]).toBe(0);
    expect(diffuse[centerOffset]).toBeGreaterThan(50);
    expect(diffuse[centerOffset + 1]).toBe(0);
    expect(await render(1)).toEqual(diffuse);
    expect(await render(100)).toEqual(await render(8));
    emitter.setParameter('baseColor', [0.5, 0.5, 0.5]).commitParameters();
    expect((await render(2))[centerOffset]).toBeGreaterThan(diffuse[centerOffset]);
    expect(await render(100)).toEqual(await render(8));
    emitter.setParameter('baseColor', [0, 0, 0]).commitParameters();
    material.setParameter('metallic', 1).commitParameters();
    expect((await render(1))[centerOffset]).toBe(0);
    material.setParameter('metallic', 0).commitParameters();
    material.setParameter('baseColor', [0, 0, 1]).commitParameters();
    expect((await render(1))[centerOffset]).toBe(0);
    material.setParameter('baseColor', [0.8, 0.8, 0.8]).commitParameters();
    const renderer = device.newRenderer('raytrace', {
      ambientRadiance: 0,
      toneMapMode: 0,
      exposure: 0.1,
      maxBounces: 1,
      samplingSeed: 17,
      progressive: true,
      temporalReprojection: false,
      adaptiveResolution: false,
      resolutionScale: 1
    });
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
    try {
      frame.render();
      graphics.submit();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(2);
      graphics.submit();
      renderer.setParameter('maxBounces', 0).commitParameters();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
      expect((await readColor())[centerOffset]).toBe(0);
      renderer.setParameter('maxBounces', 1).commitParameters();
      emitter.setParameter('emissive', [0, 1, 0]).commitParameters();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
      expect((await readColor())[centerOffset + 1]).toBeGreaterThan(50);
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(2);
      graphics.submit();
      emitter.setParameter('emissive', [1, 0, 0]).commitParameters();
      expect(frame.render().rayTracing?.accumulatedSamples).toBe(1);
      graphics.submit();
      expect((await readColor())[centerOffset]).toBeGreaterThan(50);
      expect((await readColor())[centerOffset + 1]).toBe(0);
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
