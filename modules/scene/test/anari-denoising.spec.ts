// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it, vi} from 'vitest';
import {getRayTracingScenePresentationShader} from '../../experimental/src/engine/ray-tracing-scene-shaders';

it('guided presentation reduces noise while preserving identity, normal and depth edges', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(8, 8)}
  });
  const errors = vi.spyOn(device, 'reportError');
  const radiance = new Float32Array(8 * 8 * 4);
  const guidance = new Float32Array(radiance.length);
  for (let vertical = 0; vertical < 8; vertical++) {
    for (let horizontal = 0; horizontal < 8; horizontal++) {
      const offset = (vertical * 8 + horizontal) * 4;
      radiance.set(
        [horizontal < 4 ? (horizontal + vertical) % 2 : 0, horizontal < 4 ? 0 : 1, 0, 1],
        offset
      );
      guidance.set([0.5, 0.5, 1, horizontal < 4 ? 1 : 2], offset);
    }
  }
  const image = device.createTexture({width: 8, height: 8, format: 'rgba32float', data: radiance});
  const metadata = device.createTexture({
    width: 8,
    height: 8,
    format: 'rgba32float',
    data: guidance
  });
  const output = device.createTexture({
    width: 8,
    height: 8,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({width: 8, height: 8, colorAttachments: [output]});
  const readback = device.createBuffer({
    byteLength: output.computeMemoryLayout().byteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const model = new Model(device, {
    source: getRayTracingScenePresentationShader({
      toneMapMode: 0,
      outputEncoding: 0,
      denoiseRadius: 1
    }),
    vertexCount: 3,
    colorAttachmentFormats: ['rgba8unorm'],
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'image', type: 'texture', group: 0, location: 0, sampleType: 'unfilterable-float'},
        {name: 'metadata', type: 'texture', group: 0, location: 1, sampleType: 'unfilterable-float'}
      ]
    }
  });
  const render = async () => {
    model.setBindings({image, metadata});
    const pass = device.beginRenderPass({framebuffer});
    expect(model.draw(pass)).toBe(true);
    pass.end();
    device.submit();
    output.readBuffer({}, readback);
    return new Uint8Array(await readback.readAsync());
  };
  try {
    const stride = output.computeMemoryLayout().bytesPerRow;
    const pixel = (data: Uint8Array, horizontal: number, vertical: number) =>
      Array.from(
        data.slice(vertical * stride + horizontal * 4, vertical * stride + horizontal * 4 + 3)
      );
    const filtered = await render();
    expect(errors.mock.calls.map(([error]) => error.message)).toEqual([]);
    expect(pixel(filtered, 2, 2)[0]).toBeGreaterThan(50);
    expect(pixel(filtered, 2, 2)[0]).toBeLessThan(200);
    expect(pixel(filtered, 3, 2)[1]).toBe(0);
    expect(pixel(filtered, 4, 2)).toEqual([0, 255, 0]);
    // Same identity, but a discontinuous normal or depth must remain isolated.
    for (const discontinuity of [
      [1, 0.5, 1, 1],
      [0.5, 0.5, 10, 1],
      [0.5, 0.5, 1, 0],
      [0.5, 0.5, 1, 65504]
    ]) {
      guidance.set(discontinuity, (2 * 8 + 2) * 4);
      metadata.writeData(guidance);
      expect(pixel(await render(), 2, 2)).toEqual([0, 0, 0]);
    }
  } finally {
    model.destroy();
    readback.destroy();
    framebuffer.destroy();
    output.destroy();
    metadata.destroy();
    image.destroy();
    device.destroy();
  }
}, 120000);
