// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ANARIDevice} from '@luma.gl/scene';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it, vi} from 'vitest';

it('closed ring segments preserve raster pixels, holes, masked visibility and both radial caps', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const graphics = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(64, 64)}
  });
  const errors = vi.spyOn(graphics, 'reportError');
  const color = graphics.createTexture({
    width: 64,
    height: 64,
    format: graphics.preferredColorFormat,
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = graphics.createFramebuffer({
    width: 64,
    height: 64,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const presentation = vi
    .spyOn(graphics.getCanvasContext(), 'getCurrentFramebuffer')
    .mockReturnValue(framebuffer);
  const device = new ANARIDevice(graphics);
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.8, 0.4, 0.2],
    opacity: 1,
    alphaMode: 'mask',
    alphaCutoff: 0.5
  });
  const surface = device.newSurface({
    geometry: device.newGeometry('ring', {
      innerRadius: 0.5,
      outerRadius: 1,
      height: 0.4,
      angle: Math.PI * 1.5,
      segments: 32
    }),
    material
  });
  const instance = device.newInstance({group: device.newGroup({surface: [surface]})});
  const world = device.newWorld({instance: [instance]});
  const camera = device.newCamera('perspective', {
    position: [0, 5, 0],
    direction: [0, -1, 0],
    up: [0, 0, -1],
    fovy: 2 * Math.atan(2 / 5)
  });
  const raster = device.newRenderer('default', {
    ambientRadiance: 1,
    temporalAntialiasing: false,
    background: [0, 0, 0, 1]
  });
  const ray = device.newRenderer('raytrace', {
    ambientRadiance: 1,
    resolutionScale: 1,
    adaptiveResolution: false,
    temporalReprojection: false,
    progressive: false,
    background: [0, 0, 0, 1]
  });
  const frame = device.newFrame({world, camera, renderer: raster, size: [64, 64]});
  const buffer = graphics.createBuffer({byteLength: 256, usage: Buffer.MAP_READ | Buffer.COPY_DST});
  const readColor = async (x: number, y: number) => {
    color.readBuffer({x, y, width: 1, height: 1}, buffer);
    return (await buffer.readAsync())[0];
  };
  const render = () => {
    frame.render();
    graphics.submit();
  };
  try {
    render();
    expect(await readColor(45, 28)).toBeGreaterThan(20);
    expect(await readColor(32, 32)).toBe(0);
    expect(await readColor(45, 36)).toBe(0);
    material.setParameter('opacity', 0).commitParameters();
    render();
    expect(await readColor(45, 28)).toBe(0);
    frame.setParameter('renderer', ray).commitParameters();
    render();
    expect(await frame.pick(45, 28)).toBeNull();
    material.setParameter('opacity', 1).commitParameters();
    render();
    expect((await frame.pick(45, 28))?.instance).toBe(instance);
    expect(await frame.pick(32, 32)).toBeNull();
    expect(await frame.pick(45, 36)).toBeNull();
    camera
      .setParameters({position: [0.75, 0, 3], direction: [0, 0, -1], up: [0, 1, 0], fovy: 0.2})
      .commitParameters();
    render();
    const startCap = await frame.pick(32, 32);
    expect(startCap?.instance).toBe(instance);
    expect(startCap!.position[2]).toBeCloseTo(0, 4);
    expect(startCap!.normal[2]).toBeGreaterThan(0.99);
    camera.setParameters({position: [3, 0, 0.75], direction: [-1, 0, 0]}).commitParameters();
    render();
    const endCap = await frame.pick(32, 32);
    expect(endCap?.instance).toBe(instance);
    expect(endCap!.position[0]).toBeCloseTo(0, 4);
    expect(endCap!.normal[0]).toBeGreaterThan(0.99);
    expect(errors).not.toHaveBeenCalled();
  } finally {
    device.destroy();
    buffer.destroy();
    presentation.mockRestore();
    framebuffer.destroy();
    color.destroy();
    errors.mockRestore();
    graphics.destroy();
  }
});
