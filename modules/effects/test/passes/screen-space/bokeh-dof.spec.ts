// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {bokehDof} from '@luma.gl/effects';
import {getTestDevice} from '@luma.gl/test-utils';

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`bokeh DOF preserves HDR radiance and zero-aperture detail on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const size = 16;
    const canvasContext = device.getCanvasContext();
    const previousSize = canvasContext.getDrawingBufferSize();
    canvasContext.setDrawingBufferSize(size, size);
    const pixels = new Float32Array(size * size * 4);
    for (let index = 0; index < size * size; index++) pixels.set([4, 2, 1, 1], index * 4);
    const source = device.createTexture({
      width: size,
      height: size,
      format: 'rgba32float',
      data: pixels
    });
    const depth = device.createTexture({
      width: size,
      height: size,
      format: 'depth32float',
      usage: Texture.TEXTURE | Texture.RENDER_ATTACHMENT
    });
    const framebuffer = device.createFramebuffer({
      width: size,
      height: size,
      colorAttachments: [],
      depthStencilAttachment: depth
    });
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [bokehDof],
      colorFormat: 'rgba32float'
    });
    renderer.resize([size, size]);
    async function render(blurCoefficient: number) {
      const encoder = device.createCommandEncoder();
      const clear = encoder.beginRenderPass({framebuffer, clearColor: false, clearDepth: 0.99});
      clear.end();
      const output = renderer.encodeToTexture(encoder, {
        sourceTexture: source,
        bindings: {depthTexture: depth},
        uniforms: {bokehDof: {focusDistance: 1, blurCoefficient}}
      });
      device.submit(encoder.finish());
      return readColors(output!);
    }
    try {
      const blurred = await render(30);
      for (let index = 0; index < pixels.length; index++)
        expect(blurred[index]).toBeCloseTo(pixels[index], 4);
      pixels.fill(0);
      pixels.set([8, 4, 2, 1], (8 * size + 8) * 4);
      source.writeData(pixels);
      const sharp = await render(0);
      expect(Math.max(...sharp)).toBeCloseTo(8, 4);
      expect(sharp.filter(value => value > 0)).toHaveLength(4);
      const defocused = await render(30);
      expect(Math.max(...defocused)).toBeLessThan(8);
      expect(defocused.filter(value => value > 0).length).toBeGreaterThan(4);
    } finally {
      canvasContext.setDrawingBufferSize(...previousSize);
      renderer.destroy();
      framebuffer.destroy();
      depth.destroy();
      source.destroy();
    }
  });
}

async function readColors(texture: Texture): Promise<number[]> {
  const layout = texture.computeMemoryLayout();
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({}, buffer);
    const bytes = await buffer.readAsync();
    const colors: number[] = [];
    for (let row = 0; row < texture.height; row++)
      colors.push(
        ...new Float32Array(
          bytes.buffer,
          bytes.byteOffset + row * layout.bytesPerRow,
          texture.width * 4
        )
      );
    return colors;
  } finally {
    buffer.destroy();
  }
}
