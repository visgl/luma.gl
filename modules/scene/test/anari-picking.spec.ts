// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ANARIDevice} from '@luma.gl/scene';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('ray picking resolves nearest retained objects independently of rendering resolution', async () => {
  const graphicsDevice = await getWebGPUTestDevice('core');
  if (!graphicsDevice) {
    return;
  }
  const device = new ANARIDevice(graphicsDevice);
  const material = device.newMaterial('matte', {color: [0.8, 0.4, 0.2]});
  const sphere = device.newSurface({
    geometry: device.newGeometry('sphere', {radius: 0.5, segments: 8}),
    material
  });
  const group = device.newGroup({surface: [sphere]});
  const front = device.newInstance({group, transform: new Matrix4().translate([0, 0, 1])});
  const back = device.newInstance({group, transform: new Matrix4().translate([0, 0, -1])});
  const triangle = device.newSurface({
    geometry: device.newGeometry('triangle', {
      'vertex.position': new Float32Array([2, -1, 0, 4, -1, 0, 3, 1, 0]),
      'primitive.index': new Uint32Array([0, 1, 2])
    }),
    material
  });
  const world = device.newWorld({surface: [triangle], instance: [front, back]});
  const renderer = device.newRenderer('raytrace', {
    resolutionScale: 0.25,
    adaptiveResolution: false,
    temporalReprojection: true
  });
  const frame = device.newFrame({
    world,
    renderer,
    size: [64, 64],
    camera: device.newCamera('perspective', {position: [0, 0, 5], fovy: Math.PI / 2})
  });
  try {
    expect(await frame.pick(32, 32)).toBe(null);
    frame.render();
    graphicsDevice.submit();
    const [sphereHit, triangleHit, background] = await Promise.all([
      frame.pick(32, 32),
      frame.pick(50, 32),
      frame.pick(0, 0)
    ]);
    expect(sphereHit?.surface).toBe(sphere);
    expect(sphereHit?.instance).toBe(front);
    expect(sphereHit?.position[2]).toBeGreaterThan(1.4);
    expect(sphereHit?.normal[2]).toBeGreaterThan(0.9);
    expect(sphereHit?.distance).toBeCloseTo(3.5, 1);
    expect(triangleHit?.surface).toBe(triangle);
    expect(triangleHit?.instance).toBeUndefined();
    expect(triangleHit?.position[2]).toBeCloseTo(0);
    expect(background).toBe(null);
    expect(await frame.pick(-1, 32)).toBe(null);
    expect(await frame.pick(64, 32)).toBe(null);
    expect(await frame.pick(NaN, 32)).toBe(null);

    const originalPlacementId = sphereHit?.placementId;
    const pendingHit = frame.pick(32, 32);
    // Reordering changes packed primitive indices while preserving retained identity.
    world.setParameter('instance', [back, front]).commitParameters();
    frame.render();
    graphicsDevice.submit();
    expect((await pendingHit)?.instance).toBe(front);
    expect((await frame.pick(32, 32))?.placementId).toBe(originalPlacementId);

    front.setParameter('transform', new Matrix4().translate([-2, 0, 1])).commitParameters();
    frame.render();
    graphicsDevice.submit();
    expect((await frame.pick(32, 32))?.instance).toBe(back);

    world.setParameters({surface: [], instance: []}).commitParameters();
    frame.render();
    graphicsDevice.submit();
    expect(await frame.pick(32, 32)).toBe(null);
  } finally {
    frame.destroy();
    device.destroy();
  }
  expect(await frame.pick(32, 32)).toBe(null);
}, 120000);

it('ray picking follows orthographic cameras and resized display pixels', async () => {
  const graphicsDevice = await getWebGPUTestDevice('core');
  if (!graphicsDevice) {
    return;
  }
  const device = new ANARIDevice(graphicsDevice);
  const surface = device.newSurface({
    geometry: device.newGeometry('sphere', {radius: 0.6}),
    material: device.newMaterial('matte')
  });
  const frame = device.newFrame({
    world: device.newWorld({surface: [surface]}),
    camera: device.newCamera('orthographic', {position: [0, 0, 5], height: 4}),
    renderer: device.newRenderer('raytrace', {resolutionScale: 0.5, adaptiveResolution: false}),
    size: [32, 32]
  });
  try {
    frame.render();
    graphicsDevice.submit();
    const originalHit = await frame.pick(16, 16);
    expect(originalHit?.surface).toBe(surface);
    const originalWorld = frame.getParameter('world');
    frame.setParameter('world', device.newWorld()).commitParameters();
    // Committing a replacement without rendering still queries the last rendered frame.
    expect((await frame.pick(16, 16))?.surface).toBe(surface);
    frame.setParameter('world', originalWorld).commitParameters();
    frame.setParameter('size', [64, 48]).commitParameters();
    frame.render();
    graphicsDevice.submit();
    const resizedHit = await frame.pick(32, 24);
    expect(resizedHit?.placementId).toBe(originalHit?.placementId);
    expect(resizedHit?.position[2]).toBeGreaterThan(0.5);
    expect(await frame.pick(0, 0)).toBe(null);
  } finally {
    frame.destroy();
    device.destroy();
  }
}, 120000);

it('ray picking preserves integer identity beyond temporal guide encoding limits', async () => {
  const graphicsDevice = await getWebGPUTestDevice('core');
  if (!graphicsDevice) {
    return;
  }
  const device = new ANARIDevice(graphicsDevice);
  const surface = device.newSurface({
    geometry: device.newGeometry('sphere', {radius: 0.5, segments: 8}),
    material: device.newMaterial('matte')
  });
  const group = device.newGroup({surface: [surface]});
  const instances = Array.from({length: 2050}, (_, index) =>
    device.newInstance({group, transform: new Matrix4().translate([index + 10, 0, 0])})
  );
  const selectedInstance = instances[2049];
  selectedInstance.setParameter('transform', new Matrix4()).commitParameters();
  const frame = device.newFrame({
    world: device.newWorld({instance: instances}),
    camera: device.newCamera('perspective', {position: [0, 0, 5]}),
    renderer: device.newRenderer('raytrace', {resolutionScale: 0.25, adaptiveResolution: false}),
    size: [16, 16]
  });
  try {
    frame.render();
    graphicsDevice.submit();
    expect((await frame.pick(8, 8))?.instance).toBe(selectedInstance);
  } finally {
    frame.destroy();
    device.destroy();
  }
}, 120000);
