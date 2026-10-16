// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it, vi} from 'vitest';
import {getRayTracingScenePresentationShader} from '../../experimental/src/engine/ray-tracing-scene-shaders';

it('ray debug presentation decodes stored hit metadata and bypasses tone mapping', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(4, 1)}
  });
  const errors = vi.spyOn(device, 'reportError');
  const image = device.createTexture({
    width: 4,
    height: 1,
    format: 'rgba32float',
    data: new Float32Array([8, 8, 8, 16, 8, 8, 8, 16, 8, 8, 8, 16, 8, 8, 8, 256])
  });
  const metadata = device.createTexture({
    width: 4,
    height: 1,
    format: 'rgba32float',
    data: new Float32Array([0.5, 0.5, 1, 1, 0, 0, 0, 0, 0.5, 0.5, 10, 65504, 1, 0.5, 1, 2])
  });
  const output = device.createTexture({
    width: 4,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({width: 4, height: 1, colorAttachments: [output]});
  const readback = device.createBuffer({
    byteLength: output.computeMemoryLayout().byteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  try {
    for (const debugView of ['normal', 'cameraDistance', 'identity', 'history'] as const) {
      const model = new Model(device, {
        source: getRayTracingScenePresentationShader({
          toneMapMode: 3,
          outputEncoding: 1,
          denoiseRadius: 2,
          debugView
        }),
        vertexCount: 3,
        colorAttachmentFormats: ['rgba8unorm'],
        shaderLayout: {
          attributes: [],
          bindings: [
            {
              name: 'image',
              type: 'texture',
              group: 0,
              location: 0,
              sampleType: 'unfilterable-float'
            },
            {
              name: 'metadata',
              type: 'texture',
              group: 0,
              location: 1,
              sampleType: 'unfilterable-float'
            }
          ]
        }
      });
      try {
        model.setBindings({image, metadata});
        const pass = device.beginRenderPass({framebuffer});
        expect(model.draw(pass)).toBe(true);
        pass.end();
        device.submit();
        output.readBuffer({}, readback);
        const pixels = await readback.readAsync();
        const first = Array.from(pixels.slice(0, 3));
        const background = Array.from(pixels.slice(4, 7));
        if (debugView === 'normal') {
          expect(first).toEqual([128, 128, 255]);
          expect(Array.from(pixels.slice(12, 15))).toEqual([255, 128, 128]);
        } else if (debugView === 'cameraDistance') {
          expect(first).toEqual([128, 128, 128]);
          expect(pixels[8]).toBeGreaterThan(pixels[0]);
        } else if (debugView === 'identity') {
          const hashed = (Math.imul(1, 747796405) + 2891336453) >>> 0;
          expect(first).toEqual([hashed & 255, (hashed >>> 8) & 255, (hashed >>> 16) & 255]);
          expect(Array.from(pixels.slice(8, 11))).toEqual([255, 0, 255]);
          expect(Array.from(pixels.slice(12, 15))).not.toEqual(first);
        } else {
          const confidence = Math.round((Math.log2(17) / Math.log2(257)) * 255);
          expect(first).toEqual([confidence, confidence, confidence]);
          expect(Array.from(pixels.slice(12, 15))).toEqual([255, 255, 255]);
        }
        if (debugView !== 'history') expect(background).toEqual([0, 0, 0]);
      } finally {
        model.destroy();
      }
    }
    expect(errors.mock.calls.map(([error]) => error.message)).toEqual([]);
  } finally {
    readback.destroy();
    framebuffer.destroy();
    output.destroy();
    metadata.destroy();
    image.destroy();
    device.destroy();
  }
}, 120000);
