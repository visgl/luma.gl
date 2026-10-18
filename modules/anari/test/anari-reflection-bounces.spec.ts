// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ANARIDevice} from '@luma.gl/anari';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it, vi} from 'vitest';

it('two opaque reflections reach hidden emission and analytic lighting at the reflected surface', async () => {
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
    depthStencilAttachment: graphics.preferredDepthFormat
  });
  const presentation = vi
    .spyOn(graphics.getCanvasContext(), 'getCurrentFramebuffer')
    .mockReturnValue(framebuffer);
  const device = new ANARIDevice(graphics);
  // Camera rays travel -Z, then the two tilted mirrors send them +X and +Z.
  const firstGeometry = device.newGeometry('triangle', {
    'vertex.position': new Float32Array([
      -0.7, -1, 0.7, 0.7, -1, -0.7, 0.7, 1, -0.7, -0.7, -1, 0.7, 0.7, 1, -0.7, -0.7, 1, 0.7
    ])
  });
  const secondGeometry = device.newGeometry('triangle', {
    'vertex.position': new Float32Array([
      1.3, -1, -0.7, 2.7, -1, 0.7, 2.7, 1, 0.7, 1.3, -1, -0.7, 2.7, 1, 0.7, 1.3, 1, -0.7
    ])
  });
  const targetMaterial = device.newMaterial('physicallyBased', {
    baseColor: [0, 0, 0],
    emissive: [1, 1, 1],
    roughness: 1
  });
  const target = device.newInstance({
    group: device.newGroup({
      surface: [
        device.newSurface({
          geometry: device.newGeometry('sphere', {radius: 0.5}),
          material: targetMaterial
        })
      ]
    }),
    transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 2, 1]
  });
  // Absorb direct first-mirror-to-target rays, including GGX tail samples.
  const blocker = device.newInstance({
    group: device.newGroup({
      surface: [
        device.newSurface({
          geometry: device.newGeometry('sphere', {radius: 0.4}),
          material: device.newMaterial('physicallyBased', {baseColor: [0, 0, 0], metallic: 1})
        })
      ]
    }),
    transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1]
  });
  const light = device.newLight('point', {position: [2.4, 0, 1], intensity: 0, color: [1, 1, 1]});
  const world = device.newWorld({
    surface: [
      device.newSurface({
        geometry: firstGeometry,
        material: device.newMaterial('physicallyBased', {
          baseColor: [0.8, 0.5, 0.25],
          metallic: 1,
          roughness: 0.04
        })
      }),
      device.newSurface({
        geometry: secondGeometry,
        material: device.newMaterial('physicallyBased', {
          baseColor: [0.5, 0.8, 1],
          metallic: 1,
          roughness: 0.04
        })
      })
    ],
    instance: [target, blocker],
    light: [light]
  });
  const camera = device.newCamera('perspective', {position: [0, 0, 3], fovy: 0.000001});
  const render = async (maxBounces: number) => {
    const renderer = device.newRenderer('raytrace', {
      transportMode: 'pbr',
      maxBounces,
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
    });
    const frame = device.newFrame({world, camera, renderer, size: [16, 16]});
    const buffer = graphics.createBuffer({
      byteLength: color.computeMemoryLayout().byteLength,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    try {
      frame.render();
      graphics.submit();
      color.readBuffer({}, buffer);
      const bytes = await buffer.readAsync();
      const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      expect(Array.from(values).every(Number.isFinite)).toBe(true);
      let red = 0;
      const rowStride = color.computeMemoryLayout().bytesPerRow / 4;
      for (let vertical = 0; vertical < 16; vertical++) {
        for (let horizontal = 0; horizontal < 16; horizontal++)
          red += values[vertical * rowStride + horizontal * 4];
      }
      return red / (16 * 16);
    } finally {
      buffer.destroy();
      frame.destroy();
    }
  };
  try {
    expect(await render(0)).toBe(0);
    expect(await render(1)).toBe(0);
    const twoReflections = await render(2);
    expect(twoReflections).toBeGreaterThan(0.3);
    expect(twoReflections).toBeLessThan(0.5);
    targetMaterial
      .setParameters({emissive: [0, 0, 0], baseColor: [0.8, 0.8, 0.8]})
      .commitParameters();
    expect(await render(2)).toBe(0);
    light.setParameter('intensity', 1).commitParameters();
    const oneReflection = await render(1);
    expect(await render(2)).toBeGreaterThan(oneReflection + 0.03);
    expect(errors.mock.calls.map(([error]) => error.message)).toEqual([]);
  } finally {
    device.destroy();
    presentation.mockRestore();
    framebuffer.destroy();
    color.destroy();
    graphics.destroy();
  }
}, 120000);
