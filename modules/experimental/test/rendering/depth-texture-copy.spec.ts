// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {DepthTextureCopy} from '@luma.gl/experimental';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it, vi} from 'vitest';

it('projected depth preserves color and occludes later raster overlays at viewport offsets', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(8, 8)},
    debug: true
  });
  const errors: Error[] = [];
  const reportError = vi.spyOn(device, 'reportError').mockImplementation(error => {
    errors.push(error);
    return () => {};
  });
  const depthTexture = device.createTexture({
    width: 4,
    height: 4,
    format: 'r32float',
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const depths = new Float32Array(16).fill(1);
  depths[5] = 0.25;
  depths[6] = 0.75;
  depthTexture.writeData(depths);
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
    depthStencilAttachment: 'depth32float'
  });
  const depthOnlyFramebuffer = device.createFramebuffer({
    width: 8,
    height: 8,
    colorAttachments: [],
    depthStencilAttachment: framebuffer.depthStencilAttachment
  });
  const copy = new DepthTextureCopy(device);
  const overlay = new Model(device, {
    source: `
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[index], 0.5, 1.0);
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> { return vec4<f32>(0.0, 1.0, 0.0, 1.0); }
`,
    vertexCount: 3,
    shaderLayout: {attributes: [], bindings: []},
    parameters: {depthCompare: 'less-equal', depthWriteEnabled: false}
  });
  const readImage = async () => {
    const buffer = device.createBuffer({
      byteLength: colorTexture.computeMemoryLayout().byteLength,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    try {
      colorTexture.readBuffer({}, buffer);
      return await buffer.readAsync();
    } finally {
      buffer.destroy();
    }
  };
  const pixel = (bytes: Uint8Array, column: number, row: number) =>
    Array.from(bytes.slice(row * 256 + column * 4, row * 256 + column * 4 + 4));
  try {
    let pass = device.beginRenderPass({
      framebuffer,
      clearColor: [1, 0, 0, 1],
      clearDepth: 1,
      parameters: {viewport: [2, 2, 4, 4]}
    });
    pass.setParameters({viewport: [2, 2, 4, 4]});
    copy.draw(pass, {depthTexture, viewportOrigin: [2, 2]});
    pass.end();
    device.submit();
    const preserved = await readImage();
    expect(pixel(preserved, 3, 3)).toEqual([255, 0, 0, 255]);
    // Reuse the same helper with a depth-only target sharing the destination attachment.
    pass = device.beginRenderPass({framebuffer: depthOnlyFramebuffer, clearDepth: 1});
    pass.setParameters({viewport: [2, 2, 4, 4]});
    copy.draw(pass, {depthTexture, viewportOrigin: [2, 2]});
    pass.end();
    device.submit();
    pass = device.beginRenderPass({
      framebuffer,
      clearColor: false,
      clearDepth: false,
      parameters: {viewport: [2, 2, 4, 4]}
    });
    pass.setParameters({viewport: [2, 2, 4, 4]});
    overlay.draw(pass);
    pass.end();
    device.submit();
    const pixels = await readImage();
    expect(pixel(pixels, 3, 3)).toEqual([255, 0, 0, 255]);
    expect(pixel(pixels, 4, 3)).toEqual([0, 255, 0, 255]);
    expect(pixel(pixels, 2, 2)).toEqual([0, 255, 0, 255]);
    expect(pixel(pixels, 1, 3)).toEqual([255, 0, 0, 255]);
    expect(errors).toEqual([]);
    copy.destroy();
    expect(depthTexture.destroyed).toBe(false);
  } finally {
    overlay.destroy();
    copy.destroy();
    depthOnlyFramebuffer.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
    depthTexture.destroy();
    reportError.mockRestore();
    device.destroy();
  }
}, 120000);
