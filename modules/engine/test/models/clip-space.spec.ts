// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {ClipSpace, type ClipSpaceProps} from '@luma.gl/engine';
import {getTestDevices} from '@luma.gl/test-utils';

const FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
in vec2 position;
in vec2 coordinate;
in vec2 uv;
out vec4 fragmentColor;
void main() {
  float error = length(coordinate - uv) + length((position + 1.0) / 2.0 - uv);
  fragmentColor = vec4(uv, error, 1.0);
}
`;

const FRAGMENT_SOURCE = /* wgsl */ `
@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let error = length(inputs.coordinate - inputs.uv) +
    length((inputs.position + 1.0) / 2.0 - inputs.uv);
  return vec4<f32>(inputs.uv, error, 1.0);
}
`;

it('ClipSpace geometries cover the viewport with matching interpolated coordinates', async () => {
  const devices = await getTestDevices();
  expect(devices.length, 'at least one GPU backend is available').toBeGreaterThan(0);
  for (const device of devices) {
    const defaultPixels = await renderGeometry(device);
    const quadPixels = await renderGeometry(device, 'quad');
    const trianglePixels = await renderGeometry(device, 'triangle');
    expect(defaultPixels, `${device.type}: default is quad`).toEqual(quadPixels);
    for (let pixelIndex = 0; pixelIndex < quadPixels.length; pixelIndex += 4) {
      // Compare each pixel, including edges and the quad's internal diagonal.
      for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
        expect(
          Math.abs(
            trianglePixels[pixelIndex + channelIndex] - quadPixels[pixelIndex + channelIndex]
          )
        ).toBeLessThanOrEqual(1);
      }
      expect(quadPixels[pixelIndex + 2]).toBe(0);
      expect(trianglePixels[pixelIndex + 2]).toBe(0);
      expect(quadPixels[pixelIndex + 3]).toBe(255);
      expect(trianglePixels[pixelIndex + 3]).toBe(255);
      const horizontalIndex = (pixelIndex / 4) % 7;
      expect(
        Math.abs(quadPixels[pixelIndex] - Math.round(((horizontalIndex + 0.5) / 7) * 255))
      ).toBeLessThanOrEqual(1);
      const verticalIndex = Math.floor(pixelIndex / 4 / 7);
      const expectedVertical =
        device.type === 'webgpu' ? 1 - (verticalIndex + 0.5) / 5 : (verticalIndex + 0.5) / 5;
      expect(
        Math.abs(quadPixels[pixelIndex + 1] - Math.round(expectedVertical * 255))
      ).toBeLessThanOrEqual(1);
    }
  }
});

async function renderGeometry(
  device: Device,
  geometryType?: ClipSpaceProps['geometryType']
): Promise<number[]> {
  const texture = device.createTexture({
    width: 7,
    height: 5,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({width: 7, height: 5, colorAttachments: [texture]});
  const model = new ClipSpace(device, {
    geometryType,
    fs: FRAGMENT_SHADER,
    ...(device.type === 'webgpu' ? {source: FRAGMENT_SOURCE} : {}),
    parameters: {cullMode: 'back', depthWriteEnabled: false}
  });
  const layout = texture.computeMemoryLayout({width: 7, height: 5});
  const buffer = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    expect(model.vertexCount).toBe(geometryType === 'triangle' ? 3 : 4);
    expect(model.topology).toBe(geometryType === 'triangle' ? 'triangle-list' : 'triangle-strip');
    const commandEncoder = device.createCommandEncoder();
    model.predraw(commandEncoder);
    const renderPass = commandEncoder.beginRenderPass({framebuffer, clearColor: [0, 0, 1, 0]});
    expect(model.draw(renderPass)).toBe(true);
    renderPass.end();
    device.submit(commandEncoder.finish());
    texture.readBuffer({width: 7, height: 5}, buffer);
    const data = await buffer.readAsync(0, layout.byteLength);
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const pixels: number[] = [];
    for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
      pixels.push(
        ...bytes.subarray(rowIndex * layout.bytesPerRow, rowIndex * layout.bytesPerRow + 28)
      );
    }
    return pixels;
  } finally {
    model.destroy();
    framebuffer.destroy();
    texture.destroy();
    buffer.destroy();
  }
}
