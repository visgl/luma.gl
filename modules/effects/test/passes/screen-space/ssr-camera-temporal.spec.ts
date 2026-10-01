// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {ssrCameraTemporal, ssrCameraDepthHistoryCopy} from '@luma.gl/effects';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';

it('camera SSR accepts reprojected history and rejects depth, normal, roughness, and offscreen mismatches', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const canvasContext = device.getCanvasContext();
  const originalSize = canvasContext.getDrawingBufferSize();
  canvasContext.setDrawingBufferSize(3, 3);
  const textures: Texture[] = [];
  const createColor = (values: number[]) => {
    const texture = device.createTexture({
      width: 3,
      height: 3,
      format: 'rgba8unorm',
      data: new Uint8Array([...values, ...values, ...values]),
      usage: Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER
    });
    textures.push(texture);
    return texture;
  };
  const sourceTexture = createColor([0, 0, 0, 255, 51, 51, 51, 255, 255, 255, 255, 255]);
  const historyTexture = createColor(Array.from({length: 3}, () => [204, 204, 204, 255]).flat());
  const normalTexture = createColor(Array.from({length: 3}, () => [128, 128, 255, 51]).flat());
  const previousNormalTexture = createColor(
    Array.from({length: 3}, () => [128, 128, 255, 51]).flat()
  );
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
    shaderPasses: [ssrCameraTemporal],
    colorFormat: 'rgba8unorm',
    flipY: false
  });
  const depthRenderer = new ShaderPassRenderer(device, {
    shaderPasses: [ssrCameraDepthHistoryCopy],
    colorFormat: 'rgba8unorm',
    flipY: false
  });
  renderer.resize([3, 3]);
  depthRenderer.resize([3, 3]);
  try {
    const renderPass = device.beginRenderPass({framebuffer, clearColor: false, clearDepth: 0.5});
    renderPass.end();
    const previousDepthTexture = depthRenderer.renderToTexture({
      sourceTexture,
      bindings: {depthTexture}
    })!;
    device.submit();
    const depthLayout = previousDepthTexture.computeMemoryLayout({width: 3, height: 3});
    const depthReadback = device.createBuffer({
      byteLength: depthLayout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      previousDepthTexture.readBuffer({width: 3, height: 3}, depthReadback);
      const bytes = await depthReadback.readAsync(0, depthLayout.byteLength);
      expect(Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset + 4, 4))).toEqual([
        128, 0, 0, 255
      ]);
    } finally {
      depthReadback.destroy();
    }
    const bindings = {
      depthTexture,
      normalTexture,
      historyTexture,
      previousDepthTexture,
      previousNormalTexture
    };
    async function readCenter(uniforms = {}) {
      const output = renderer.renderToTexture({
        sourceTexture,
        bindings,
        uniforms: {
          ssrCameraTemporal: {
            currentClipToPreviousClip: new Matrix4(),
            currentViewToPreviousView: new Matrix4(),
            previousInverseProjectionMatrix: new Matrix4(),
            historyWeight: 0.8,
            depthThreshold: 0.01,
            normalThreshold: 0.96,
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
        return new Uint8Array(bytes.buffer, bytes.byteOffset, 12)[4] / 255;
      } finally {
        buffer.destroy();
      }
    }
    expect(await readCenter()).toBeCloseTo(0.68, 2);
    expect(await readCenter({historyWeight: 0})).toBeCloseTo(0.2, 2);
    expect(
      await readCenter({currentClipToPreviousClip: new Matrix4().translate([4, 0, 0])})
    ).toBeCloseTo(0.2, 2);
    previousNormalTexture.writeData(
      new Uint8Array(Array.from({length: 9}, () => [128, 128, 0, 51]).flat())
    );
    expect(await readCenter()).toBeCloseTo(0.2, 2);
    expect(
      await readCenter({currentViewToPreviousView: new Matrix4().rotateY(Math.PI)})
    ).toBeCloseTo(0.68, 2);
    previousNormalTexture.writeData(
      new Uint8Array(Array.from({length: 9}, () => [128, 128, 255, 255]).flat())
    );
    expect(await readCenter()).toBeCloseTo(0.2, 2);
    previousNormalTexture.writeData(
      new Uint8Array(Array.from({length: 9}, () => [128, 128, 255, 51]).flat())
    );
    const changedDepth = Math.round(0.6 * 16777215);
    const changedDepthTexture = createColor(
      Array.from({length: 3}, () => [
        (changedDepth >>> 16) & 255,
        (changedDepth >>> 8) & 255,
        changedDepth & 255,
        255
      ]).flat()
    );
    bindings.previousDepthTexture = changedDepthTexture;
    expect(await readCenter()).toBeCloseTo(0.2, 2);
    // A camera depth change must compare history against reprojected depth, not current depth.
    expect(
      await readCenter({currentClipToPreviousClip: new Matrix4().translate([0, 0, 0.1])})
    ).toBeCloseTo(0.68, 2);
    // A half-texel camera shift straddles valid water and an invalid foreground depth tap.
    const packedHalf = [128, 0, 0, 255];
    const mixedDepthTexture = createColor([
      ...packedHalf,
      ...packedHalf,
      (changedDepth >>> 16) & 255,
      (changedDepth >>> 8) & 255,
      changedDepth & 255,
      255
    ]);
    bindings.previousDepthTexture = mixedDepthTexture;
    historyTexture.writeData(
      new Uint8Array(
        Array.from({length: 3}, () => [
          204, 204, 204, 255, 204, 204, 204, 255, 26, 26, 26, 255
        ]).flat()
      )
    );
    expect(
      await readCenter({currentClipToPreviousClip: new Matrix4().translate([1 / 3, 0, 0])})
    ).toBeCloseTo(0.68, 2);
  } finally {
    renderer.destroy();
    depthRenderer.destroy();
    framebuffer.destroy();
    for (const texture of textures) texture.destroy();
    canvasContext.setDrawingBufferSize(originalSize[0], originalSize[1]);
  }
});
