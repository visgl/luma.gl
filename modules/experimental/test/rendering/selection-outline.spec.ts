// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device} from '@luma.gl/core';
import {SelectionOutline} from '@luma.gl/experimental';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {expect, it} from 'vitest';

it('selection outlines preserve interior, background and occluders with exact uint32 IDs', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(8, 8)},
    debug: true
  });
  const identifierTexture = device.createTexture({
    width: 8,
    height: 8,
    format: 'r32uint',
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const colorTexture = device.createTexture({
    width: 8,
    height: 8,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 8,
    height: 8,
    colorAttachments: [colorTexture],
    depthStencilAttachment: device.preferredDepthFormat
  });
  const outline = new SelectionOutline(device);
  const identifiers = new Uint32Array(64);
  for (let row = 1; row <= 6; row++) {
    for (let column = 1; column <= 6; column++) identifiers[row * 8 + column] = 0xffffffff;
  }
  identifiers[3 * 8 + 5] = 7;
  identifierTexture.writeData(identifiers);
  try {
    const render = async (selectedIdentifier: number, width: number) => {
      const renderPass = device.beginRenderPass({framebuffer, clearColor: [0.2, 0.4, 0.6, 1]});
      outline.draw(renderPass, {
        identifierTexture,
        selectedIdentifier,
        width,
        color: [1, 0, 0, 0.5]
      });
      renderPass.end();
      device.submit();
      return readOutlineImage(device, framebuffer.colorAttachments[0].texture);
    };
    const pixels = await render(0xffffffff, 1);
    expect(getPixel(pixels, 0, 0, 8)).toEqual([51, 102, 153, 255]);
    expect(getPixel(pixels, 3, 3, 8)).toEqual([51, 102, 153, 255]);
    expect(getPixel(pixels, 5, 3, 8)).toEqual([51, 102, 153, 255]);
    expect(getPixel(pixels, 1, 3, 8)[0]).toBeCloseTo(153, 0);
    expect(getPixel(pixels, 4, 3, 8)[1]).toBeCloseTo(51, 0);
    const widerPixels = await render(0xffffffff, 2);
    expect(getPixel(widerPixels, 2, 3, 8)[0]).toBeCloseTo(153, 0);
    for (const [selectedIdentifier, width] of [
      [0, 2],
      [0xffffffff, 0],
      [2050, 2]
    ]) {
      const disabledPixels = await render(selectedIdentifier, width);
      expect(Array.from(disabledPixels)).toEqual(Array.from(await render(0, 0)));
    }
    outline.destroy();
    expect(identifierTexture.destroyed).toBe(false);
  } finally {
    outline.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
    identifierTexture.destroy();
    device.destroy();
  }
}, 120000);

it('selection outlines respect viewport origins and clipped image borders', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(8, 8)},
    debug: true
  });
  const identifierTexture = device.createTexture({
    width: 4,
    height: 4,
    format: 'r32uint',
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  identifierTexture.writeData(new Uint32Array(16).fill(2050));
  const colorTexture = device.createTexture({
    width: 8,
    height: 8,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 8,
    height: 8,
    colorAttachments: [colorTexture]
  });
  const outline = new SelectionOutline(device);
  try {
    const renderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 1],
      parameters: {viewport: [2, 2, 4, 4]}
    });
    outline.draw(renderPass, {
      identifierTexture,
      selectedIdentifier: 2050,
      width: 1,
      color: [0, 1, 0, 1],
      viewportOrigin: [2, 2]
    });
    renderPass.end();
    device.submit();
    const pixels = await readOutlineImage(device, framebuffer.colorAttachments[0].texture);
    expect(getPixel(pixels, 2, 3, 8)).toEqual([0, 255, 0, 255]);
    expect(getPixel(pixels, 5, 3, 8)).toEqual([0, 255, 0, 255]);
    expect(getPixel(pixels, 3, 3, 8)).toEqual([0, 0, 0, 255]);
    expect(getPixel(pixels, 1, 3, 8)).toEqual([0, 0, 0, 255]);
  } finally {
    outline.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
    identifierTexture.destroy();
    device.destroy();
  }
}, 120000);

async function readOutlineImage(device: Device, texture: Texture): Promise<Uint8Array> {
  const buffer = device.createBuffer({
    byteLength: texture.computeMemoryLayout().byteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  try {
    texture.readBuffer({}, buffer);
    return await buffer.readAsync();
  } finally {
    buffer.destroy();
  }
}

function getPixel(pixels: Uint8Array, x: number, y: number, width: number): number[] {
  const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
  const offset = y * bytesPerRow + x * 4;
  return Array.from(pixels.slice(offset, offset + 4));
}
