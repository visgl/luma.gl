// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ANARIDevice} from '@luma.gl/scene';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';
import {expect, it, vi} from 'vitest';

it('explicit emissive connections preserve energy, reject masked occluders and track committed emitters', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const graphics = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(16, 16)}
  });
  const errors = vi.spyOn(graphics, 'reportError');
  const color = graphics.createTexture({
    width: 16,
    height: 16,
    format: 'rgba32float',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = graphics.createFramebuffer({
    width: 16,
    height: 16,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const presentation = vi
    .spyOn(graphics.getCanvasContext(), 'getCurrentFramebuffer')
    .mockReturnValue(framebuffer);
  const device = new ANARIDevice(graphics);
  const rectangle = (left: number, right: number, bottom: number, top: number, depth: number) =>
    device.newGeometry('triangle', {
      'vertex.position': new Float32Array([
        left,
        bottom,
        depth,
        right,
        bottom,
        depth,
        right,
        top,
        depth,
        left,
        bottom,
        depth,
        right,
        top,
        depth,
        left,
        top,
        depth
      ])
    });
  const receiver = device.newSurface({
    geometry: rectangle(-2, 2, -2, 2, 0),
    material: device.newMaterial('matte', {color: [0.8, 0.8, 0.8]})
  });
  const emitterMaterial = device.newMaterial('physicallyBased', {
    baseColor: [0, 0, 0],
    emissive: [100, 25, 0]
  });
  const emitter = device.newSurface({
    geometry: device.newGeometry('sphere', {radius: 0.1}),
    material: emitterMaterial
  });
  const lightInstance = device.newInstance({
    group: device.newGroup({surface: [emitter]}),
    transform: new Matrix4().translate([0.5, 0, 2])
  });
  const occluderMaterial = device.newMaterial('physicallyBased', {
    baseColor: [0, 0, 0, 0],
    alphaMode: 'mask',
    alphaCutoff: 0.5
  });
  // This card intersects receiver-to-emitter segments while remaining outside the camera frustum.
  const occluder = device.newSurface({
    geometry: rectangle(0.1, 0.4, -0.5, 0.5, 1),
    material: occluderMaterial
  });
  const foregroundMaterial = device.newMaterial('physicallyBased', {
    baseColor: [0, 0, 0, 0],
    alphaMode: 'mask',
    alphaCutoff: 0.5
  });
  const foreground = device.newSurface({
    geometry: rectangle(-0.5, 0.5, -0.5, 0.5, 0.5),
    material: foregroundMaterial
  });
  const world = device.newWorld({
    surface: [receiver, occluder, foreground],
    instance: [lightInstance]
  });
  const renderer = device.newRenderer('raytrace', {
    resolutionScale: 1,
    adaptiveResolution: false,
    temporalReprojection: false,
    progressive: false,
    samplesPerPixel: 16,
    maxBounces: 0,
    emitterSampling: false,
    samplingSeed: 17,
    exposure: 1,
    ambientRadiance: 0,
    background: [0, 0, 0, 1],
    toneMapMode: 0,
    outputColorSpace: 'linear'
  });
  const frame = device.newFrame({
    world,
    renderer,
    camera: device.newCamera('perspective', {position: [0, 0, 3], fovy: 0.05}),
    size: [16, 16]
  });
  const layout = color.computeMemoryLayout();
  const buffer = graphics.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.MAP_READ | Buffer.COPY_DST
  });
  const render = async () => {
    const statistics = frame.render();
    graphics.submit();
    color.readBuffer({}, buffer);
    const bytes = await buffer.readAsync();
    const pixels = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    expect(Array.from(pixels).every(Number.isFinite)).toBe(true);
    const mean = [0, 0, 0];
    for (let index = 0; index < pixels.length; index += 4)
      for (let component = 0; component < 3; component++)
        mean[component] += pixels[index + component] / 256;
    return {mean, pixels: pixels.slice(), statistics};
  };
  try {
    expect((await render()).mean[0]).toBe(0);
    renderer.setParameter('emitterSampling', true).commitParameters();
    const lit = await render();
    expect(lit.mean[0]).toBeGreaterThan(0.1);
    expect(lit.mean[0]).toBeLessThan(0.3);
    expect(lit.mean[0] / lit.mean[1]).toBeCloseTo(4, 3);
    expect(lit.mean[2]).toBe(0);
    expect((await render()).pixels).toEqual(lit.pixels);
    expect((await frame.pick(8, 8))?.surface).toBe(receiver);
    occluderMaterial.setParameter('baseColor', [0, 0, 0, 1]).commitParameters();
    expect((await render()).mean[0]).toBeLessThan(0.0001);
    renderer.setParameter('shadows', false).commitParameters();
    expect((await render()).mean[0]).toBeGreaterThan(lit.mean[0]);
    renderer.setParameter('shadows', true).commitParameters();
    occluderMaterial.setParameter('baseColor', [0, 0, 0, 0]).commitParameters();
    lightInstance
      .setParameter('transform', new Matrix4().translate([0.5, 0, 2]).scale([2, 1, 1]))
      .commitParameters();
    const stretched = await render();
    expect(stretched.mean[0] / lit.mean[0]).toBeGreaterThan(1.7);
    expect(stretched.mean[0] / lit.mean[0]).toBeLessThan(2.3);
    emitter.setParameter('geometry', rectangle(-0.1, 0.1, -0.1, 0.1, 0)).commitParameters();
    lightInstance
      .setParameter('transform', new Matrix4().translate([0.5, 0, 2]))
      .commitParameters();
    const mesh = await render();
    expect(mesh.mean[0]).toBeGreaterThan(0.15);
    expect(mesh.mean[0]).toBeLessThan(0.35);
    renderer.setParameter('maxBounces', 1).commitParameters();
    expect((await render()).pixels).toEqual(mesh.pixels);
    renderer.setParameter('maxBounces', 0).commitParameters();
    emitterMaterial.setParameter('emissiveStrength', 2).commitParameters();
    expect((await render()).mean[0] / mesh.mean[0]).toBeCloseTo(2, 2);
    renderer.setParameters({progressive: true, transportMode: 'pbr'}).commitParameters();
    await render();
    expect((await render()).statistics.rayTracing?.accumulatedSamples).toBe(32);
    emitterMaterial.setParameter('emissiveStrength', 0).commitParameters();
    const removed = await render();
    expect(removed.mean[0]).toBe(0);
    expect(removed.statistics.rayTracing?.accumulatedSamples).toBe(16);
    emitterMaterial.setParameter('emissiveStrength', 1).commitParameters();
    expect((await render()).mean[0]).toBeGreaterThan(0.1);
    emitterMaterial.setParameters({alphaMode: 'mask', opacity: 0}).commitParameters();
    expect((await render()).mean[0]).toBe(0);
    emitterMaterial.setParameter('opacity', 1).commitParameters();
    expect((await render()).mean[0]).toBeGreaterThan(0.1);
    renderer.setParameter('temporalReprojection', true).commitParameters();
    await render();
    expect((await render()).statistics.rayTracing?.accumulatedSamples).toBe(32);
    frame.getParameter('camera')!.setParameter('position', [0.1, 0, 3]).commitParameters();
    expect((await render()).statistics.rayTracing?.accumulatedSamples).toBe(16);
    foregroundMaterial.setParameter('opacity', 0.5).commitParameters();
    await render();
    expect((await frame.pick(8, 8))?.surface).toBe(foreground);
    foregroundMaterial.setParameter('opacity', 0.499).commitParameters();
    await render();
    expect((await frame.pick(8, 8))?.surface).toBe(receiver);
    const snapshot = frame.captureChannels()!;
    try {
      snapshot.identifierTexture.readBuffer({x: 8, y: 8, width: 1, height: 1}, buffer);
      const bytes = await buffer.readAsync();
      const identifier = new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
      expect(snapshot.identifiers[identifier - 1].surface).toBe(receiver);
    } finally {
      snapshot.destroy();
    }
    foregroundMaterial.setParameter('alphaMode', 'opaque').commitParameters();
    await render();
    expect((await frame.pick(8, 8))?.surface).toBe(foreground);
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
