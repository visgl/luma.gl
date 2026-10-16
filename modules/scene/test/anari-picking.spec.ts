// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Texture} from '@luma.gl/core';
import {ANARIDevice} from '@luma.gl/scene';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core';
import {expect, it, vi} from 'vitest';

it('ray channels and picking resolve nearest retained objects at full display resolution', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {graphicsDevice, destroyGraphicsResources} = await makePickingTestDevice();
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
    expect(frame.captureChannels()).toBe(null);
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

    const snapshot = frame.captureChannels()!;
    try {
      expect(snapshot.identifierTexture.width).toBe(64);
      expect(snapshot.identifierTexture.height).toBe(64);
      const identifierBytes = await readChannelPixel(snapshot.identifierTexture, 32, 32);
      const identifier = new Uint32Array(identifierBytes.buffer)[0];
      expect(snapshot.identifiers[identifier - 1].instance).toBe(front);
      const distanceBytes = await readChannelPixel(snapshot.distanceTexture, 32, 32);
      expect(new Float32Array(distanceBytes.buffer)[0]).toBeCloseTo(sphereHit!.distance, 5);
      const normalBytes = await readChannelPixel(snapshot.normalTexture, 32, 32);
      const normal = new Float32Array(normalBytes.buffer);
      expect(Array.from(normal.slice(0, 3))).toEqual(sphereHit!.normal);
      expect(normal[3]).toBe(1);
      const projectedDepth = new Float32Array(
        (await readChannelPixel(snapshot.projectedDepthTexture, 32, 32)).buffer
      )[0];
      const viewProjection = new Matrix4()
        .perspective({fovy: Math.PI / 2, aspect: 1, near: 0.05, far: 500})
        .multiplyRight(new Matrix4().lookAt({eye: [0, 0, 5], center: [0, 0, 4], up: [0, 1, 0]}));
      const clipPosition = viewProjection.transform([...sphereHit!.position, 1]);
      expect(projectedDepth).toBeCloseTo((clipPosition[2] / clipPosition[3]) * 0.5 + 0.5, 6);
      expect(
        new Float32Array((await readChannelPixel(snapshot.projectedDepthTexture, 0, 0)).buffer)[0]
      ).toBe(1);
      for (const texture of [
        snapshot.identifierTexture,
        snapshot.distanceTexture,
        snapshot.normalTexture
      ]) {
        expect(Array.from(await readChannelPixel(texture, 0, 0)).every(value => value === 0)).toBe(
          true
        );
      }
    } finally {
      snapshot.destroy();
    }

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
    destroyGraphicsResources();
  }
  expect(await frame.pick(32, 32)).toBe(null);
}, 120000);

it('ray channels and picking follow orthographic cameras and resized display pixels', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {graphicsDevice, destroyGraphicsResources} = await makePickingTestDevice();
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
    const snapshot = frame.captureChannels()!;
    const originalHit = await frame.pick(16, 16);
    expect(originalHit?.surface).toBe(surface);
    const originalWorld = frame.getParameter('world');
    frame.setParameter('world', device.newWorld()).commitParameters();
    // Committing a replacement without rendering still queries the last rendered frame.
    expect((await frame.pick(16, 16))?.surface).toBe(surface);
    frame.setParameter('world', originalWorld).commitParameters();
    frame
      .getParameter('camera')!
      .setParameters({position: [0, 0, 8], near: 0.1, far: 100})
      .commitParameters();
    frame.setParameter('size', [64, 48]).commitParameters();
    frame.render();
    graphicsDevice.submit();
    const resizedHit = await frame.pick(32, 24);
    const resizedSnapshot = frame.captureChannels()!;
    try {
      expect(resizedSnapshot.identifierTexture.width).toBe(64);
      expect(resizedSnapshot.identifierTexture.height).toBe(48);
      expect(snapshot.identifierTexture.width).toBe(32);
      const originalIdentifier = new Uint32Array(
        (await readChannelPixel(snapshot.identifierTexture, 16, 16)).buffer
      )[0];
      expect(snapshot.identifiers[originalIdentifier - 1].surface).toBe(surface);
      const distance = new Float32Array(
        (await readChannelPixel(resizedSnapshot.distanceTexture, 32, 24)).buffer
      )[0];
      expect(distance).toBeCloseTo(resizedHit!.distance, 5);
      const depth = new Float32Array(
        (await readChannelPixel(resizedSnapshot.projectedDepthTexture, 32, 24)).buffer
      )[0];
      expect(depth).toBeCloseTo((8 - resizedHit!.position[2] - 0.1) / (100 - 0.1), 6);
      const savedDepth = new Float32Array(
        (await readChannelPixel(snapshot.projectedDepthTexture, 16, 16)).buffer
      )[0];
      expect(savedDepth).toBeCloseTo((5 - originalHit!.position[2] - 0.05) / (500 - 0.05), 6);
    } finally {
      snapshot.destroy();
      resizedSnapshot.destroy();
    }
    expect(resizedHit?.placementId).toBe(originalHit?.placementId);
    expect(resizedHit?.position[2]).toBeGreaterThan(0.5);
    expect(await frame.pick(0, 0)).toBe(null);

    const rayRenderer = frame.getParameter('renderer');
    const rasterWorld = device.newWorld();
    frame
      .setParameters({world: rasterWorld, renderer: device.newRenderer('default')})
      .commitParameters();
    frame.render();
    graphicsDevice.submit();
    frame.setParameter('renderer', rayRenderer).commitParameters();
    expect(frame.captureChannels()).toBe(null);
    // The displayed raster frame must not expose the previous ray scene's hit.
    expect(await frame.pick(32, 24)).toBe(null);
  } finally {
    frame.destroy();
    device.destroy();
    destroyGraphicsResources();
  }
}, 120000);

it('ray picking preserves integer identity beyond temporal guide encoding limits', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {graphicsDevice, destroyGraphicsResources} = await makePickingTestDevice();
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
    const snapshot = frame.captureChannels()!;
    try {
      const identifier = new Uint32Array(
        (await readChannelPixel(snapshot.identifierTexture, 8, 8)).buffer
      )[0];
      expect(identifier).toBeGreaterThan(2048);
      expect(snapshot.identifiers[identifier - 1].instance).toBe(selectedInstance);
      frame.destroy();
      expect(
        new Uint32Array((await readChannelPixel(snapshot.identifierTexture, 8, 8)).buffer)[0]
      ).toBe(identifier);
    } finally {
      snapshot.destroy();
    }
  } finally {
    frame.destroy();
    device.destroy();
    destroyGraphicsResources();
  }
}, 120000);

async function makePickingTestDevice() {
  const graphicsDevice = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(64, 64)},
    debug: true
  });
  const framebuffer = graphicsDevice.createFramebuffer({
    width: 64,
    height: 64,
    colorAttachments: [graphicsDevice.preferredColorFormat],
    depthStencilAttachment: graphicsDevice.preferredDepthFormat
  });
  // Exercise real rendering and readback without the headless browser's swap chain.
  const presentation = vi
    .spyOn(graphicsDevice.getCanvasContext(), 'getCurrentFramebuffer')
    .mockReturnValue(framebuffer);
  return {
    graphicsDevice,
    destroyGraphicsResources() {
      presentation.mockRestore();
      framebuffer.destroy();
      graphicsDevice.destroy();
    }
  };
}

async function readChannelPixel(texture: Texture, x: number, y: number): Promise<Uint8Array> {
  const options = {x, y, width: 1, height: 1};
  const layout = texture.computeMemoryLayout(options);
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  try {
    texture.readBuffer(options, buffer);
    return await buffer.readAsync();
  } finally {
    buffer.destroy();
  }
}
