// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {cameraReprojectionTaaResolve, ssrTemporal} from '@luma.gl/effects';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';

it.each([
  cameraReprojectionTaaResolve,
  ssrTemporal
])('$name preserves history rejection, neighborhood bounds, and alpha behavior', async (shaderPass, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const cameraAntialiasing = shaderPass === cameraReprojectionTaaResolve;
  const canvasContext = device.getCanvasContext();
  const originalSize = canvasContext.getDrawingBufferSize();
  canvasContext.setDrawingBufferSize(3, 3);
  const textures: Texture[] = [];
  const repeatRow = (row: number[]) => new Uint8Array([...row, ...row, ...row]);
  const repeatPixel = (pixel: number[]) => repeatRow([...pixel, ...pixel, ...pixel]);
  const createColor = (data: Uint8Array) => {
    const texture = device.createTexture({
      width: 3,
      height: 3,
      format: 'rgba8unorm',
      data,
      usage: Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER
    });
    textures.push(texture);
    return texture;
  };
  const sourceTexture = createColor(repeatRow([0, 0, 0, 0, 51, 51, 51, 128, 255, 255, 255, 255]));
  const historyTexture = createColor(repeatPixel([204, 204, 204, 51]));
  const previousDepthTexture = createColor(repeatPixel([128, 0, 0, 255]));
  const velocityTexture = createColor(repeatPixel([0, 0, 0, 255]));
  const depthTexture = device.createTexture({
    width: 3,
    height: 3,
    format: 'depth24plus',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  textures.push(depthTexture);
  const framebuffer = device.createFramebuffer({
    width: 3,
    height: 3,
    colorAttachments: [sourceTexture],
    depthStencilAttachment: depthTexture
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [shaderPass],
    colorFormat: 'rgba8unorm',
    flipY: false
  });
  renderer.resize([3, 3]);
  const bindings = cameraAntialiasing
    ? {depthTexture, historyTexture, previousDepthTexture}
    : {depthTexture, historyTexture, previousDepthTexture, velocityTexture};
  const initialUniforms = cameraAntialiasing
    ? {
        inverseViewProjectionMatrix: new Matrix4(),
        previousViewProjectionMatrix: new Matrix4(),
        currentJitter: [0, 0],
        previousJitter: [0, 0]
      }
    : {inverseProjectionMatrix: new Matrix4()};
  function clearDepth(depth: number) {
    const renderPass = device.beginRenderPass({framebuffer, clearColor: false, clearDepth: depth});
    renderPass.end();
  }
  async function readCenter(uniforms = {}) {
    const output = renderer.renderToTexture({
      sourceTexture,
      bindings,
      uniforms: {
        [shaderPass.name]: {
          ...initialUniforms,
          historyWeight: 0.8,
          depthThreshold: 0.01,
          ...uniforms
        }
      }
    })!;
    device.submit();
    const layout = output.computeMemoryLayout({width: 3, height: 3});
    const buffer = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      output.readBuffer({width: 3, height: 3}, buffer);
      const bytes = await buffer.readAsync(0, layout.byteLength);
      return Array.from(
        new Uint8Array(bytes.buffer, bytes.byteOffset + layout.bytesPerRow + 4, 4),
        value => value / 255
      );
    } finally {
      buffer.destroy();
    }
  }
  try {
    clearDepth(0.5);
    const resolved = await readCenter();
    expect(resolved[0]).toBeCloseTo(0.68, 2);
    expect(resolved[3]).toBeCloseTo(
      cameraAntialiasing ? 128 / 255 : (0.2 * 128) / 255 + 0.8 * 0.2,
      2
    );
    expect((await readCenter({historyWeight: 0}))[0]).toBeCloseTo(0.2, 2);

    // Offscreen history must never wrap or clamp back into the image.
    velocityTexture.writeData(repeatPixel([255, 0, 0, 255]));
    expect(
      (
        await readCenter(
          cameraAntialiasing
            ? {previousViewProjectionMatrix: new Matrix4().translate([4, 0, 0])}
            : {}
        )
      )[0]
    ).toBeCloseTo(0.2, 2);
    velocityTexture.writeData(repeatPixel([0, 0, 0, 255]));
    previousDepthTexture.writeData(repeatPixel([153, 0, 0, 255]));
    expect((await readCenter())[0]).toBeCloseTo(0.2, 2);

    if (cameraAntialiasing) {
      // Fractional camera motion straddles valid history and an occluding foreground tap.
      previousDepthTexture.writeData(repeatRow([128, 0, 0, 255, 128, 0, 0, 255, 153, 0, 0, 255]));
      historyTexture.writeData(repeatRow([204, 204, 204, 51, 204, 204, 204, 51, 26, 26, 26, 51]));
      expect((await readCenter({previousJitter: [1 / 6, 0]}))[0]).toBeCloseTo(0.68, 2);
    }
    previousDepthTexture.writeData(repeatPixel([128, 0, 0, 255]));
    historyTexture.writeData(repeatPixel([204, 204, 204, 51]));
    sourceTexture.writeData(repeatPixel([51, 51, 51, 128]));
    expect((await readCenter())[0]).toBeCloseTo(0.2, 2);

    if (!cameraAntialiasing) {
      // Missing current rays retain radiance but decay their confidence.
      sourceTexture.writeData(repeatPixel([0, 0, 0, 0]));
      const unsupported = await readCenter();
      expect(unsupported[0]).toBeCloseTo(0.8, 2);
      expect(unsupported[3]).toBeCloseTo(0.16, 2);
    }
    sourceTexture.writeData(repeatPixel([51, 51, 51, 128]));
    clearDepth(1);
    const background = await readCenter();
    expect(background[0]).toBeCloseTo(cameraAntialiasing ? 0.2 : 0, 2);
    expect(background[3]).toBeCloseTo(cameraAntialiasing ? 128 / 255 : 0, 2);
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    for (const texture of textures) texture.destroy();
    canvasContext.setDrawingBufferSize(originalSize[0], originalSize[1]);
  }
});
