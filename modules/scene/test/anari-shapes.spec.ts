// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ANARIDevice} from '@luma.gl/scene';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';
import {expect, it, vi} from 'vitest';

it('mesh-backed chart shapes render in raster and ray modes and preserve transformed picks', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const graphics = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(64, 64)}
  });
  const errors = vi.spyOn(graphics, 'reportError');
  const framebuffer = graphics.createFramebuffer({
    width: 64,
    height: 64,
    colorAttachments: [graphics.preferredColorFormat],
    depthStencilAttachment: graphics.preferredDepthFormat
  });
  const presentation = vi
    .spyOn(graphics.getCanvasContext(), 'getCurrentFramebuffer')
    .mockReturnValue(framebuffer);
  const device = new ANARIDevice(graphics);
  const material = device.newMaterial('matte', {color: [0.8, 0.4, 0.2]});
  const geometry = device.newGeometry('torus', {
    majorRadius: 1,
    minorRadius: 0.25,
    majorSegments: 32,
    minorSegments: 16
  });
  const surface = device.newSurface({geometry, material});
  const instance = device.newInstance({group: device.newGroup({surface: [surface]})});
  const world = device.newWorld({instance: [instance]});
  // Looking down Y exposes the empty ring center and the open sweep quadrant.
  const camera = device.newCamera('orthographic', {
    position: [0, 5, 0],
    direction: [0, -1, 0],
    up: [0, 0, -1],
    height: 4
  });
  const rayRenderer = device.newRenderer('raytrace', {
    resolutionScale: 1,
    adaptiveResolution: false,
    progressive: false,
    ambientRadiance: 1
  });
  const rasterRenderer = device.newRenderer('default', {ambientRadiance: 1});
  const frame = device.newFrame({world, camera, renderer: rasterRenderer, size: [64, 64]});
  const render = () => {
    frame.render();
    graphics.submit();
  };
  try {
    render();
    frame.setParameter('renderer', rayRenderer).commitParameters();
    render();
    expect(await frame.pick(32, 32)).toBeNull();
    const ringHit = await frame.pick(48, 32);
    expect(ringHit?.surface).toBe(surface);
    expect(ringHit?.instance).toBe(instance);
    expect(ringHit!.position[1]).toBeGreaterThan(0.2);
    expect(ringHit!.normal[1]).toBeGreaterThan(0.9);
    geometry.setParameter('arc', Math.PI).commitParameters();
    render();
    expect((await frame.pick(48, 30))?.instance).toBe(instance);
    expect(await frame.pick(48, 34)).toBeNull();
    instance
      .setParameter('transform', new Matrix4().translate([0.5, 0, 0]).scale([0.5, 1, 1]))
      .commitParameters();
    render();
    expect((await frame.pick(48, 30))?.instance).toBe(instance);
    expect(await frame.pick(16, 30)).toBeNull();
    const prism = device.newGeometry('hexPrism', {radius: 1, height: 2});
    surface.setParameter('geometry', prism).commitParameters();
    instance.setParameter('transform', new Matrix4()).commitParameters();
    render();
    const prismHit = await frame.pick(32, 32);
    expect(prismHit?.instance).toBe(instance);
    expect(prismHit!.position[1]).toBeCloseTo(1, 4);
    expect(prismHit!.normal[1]).toBeCloseTo(1, 4);
    frame.setParameter('renderer', rasterRenderer).commitParameters();
    render();
    expect(errors).not.toHaveBeenCalled();
  } finally {
    device.destroy();
    presentation.mockRestore();
    framebuffer.destroy();
    errors.mockRestore();
    graphics.destroy();
  }
});
