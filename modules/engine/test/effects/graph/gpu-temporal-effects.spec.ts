// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph, GPUTextureHistory} from '@luma.gl/graph/gpu-core';
import {addGraphTAA, importTemporalGraphHistory, type TemporalFrame} from '@luma.gl/engine/effects';

/** Three identical rows with a neighborhood that permits retained middle-pixel colors. */
function makePixels(center: number): Uint8Array {
  const row = [0, 0, 0, 255, center, center, center, 255, 255, 255, 255, 255];
  return new Uint8Array([...row, ...row, ...row]);
}

it('uses retained color and depth on the next graph frame and discards them on reset', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const width = 3;
  const height = 3;
  const colorFormat = 'rgba8unorm';
  const historyUsage = Texture.SAMPLE | Texture.RENDER;
  const source = device.createTexture({
    width,
    height,
    format: colorFormat,
    data: makePixels(64),
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const output = device.createTexture({
    width,
    height,
    format: colorFormat,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const velocity = device.createTexture({
    width,
    height,
    format: colorFormat,
    data: new Uint8Array(width * height * 4),
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const depth = device.createTexture({
    width,
    height,
    format: 'depth24plus',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  const depthTarget = device.createFramebuffer({width, height, depthStencilAttachment: depth});
  const colorHistory = new GPUTextureHistory(device, {
    width,
    height,
    format: colorFormat,
    usage: historyUsage
  });
  const depthHistory = new GPUTextureHistory(device, {
    width,
    height,
    format: 'rgba16float',
    usage: historyUsage
  });
  const graph = new GPUCommandGraph<TemporalFrame>(device);
  const importView = <Format extends 'rgba8unorm' | 'depth24plus'>(
    id: string,
    texture: Texture,
    format: Format
  ) =>
    graph.createTextureView(
      graph.importTexture(
        {
          id,
          width,
          height,
          format,
          usage: texture.props.usage
        },
        texture
      )
    );
  const colorRoles = importTemporalGraphHistory(graph, 'color-history', colorHistory);
  const depthRoles = importTemporalGraphHistory(graph, 'depth-history', depthHistory);
  addGraphTAA(graph, {
    id: 'taa',
    input: importView('scene-color', source, colorFormat),
    output: importView('resolved-color', output, colorFormat),
    depth: importView('scene-depth', depth, 'depth24plus'),
    velocity: importView('scene-velocity', velocity, colorFormat),
    colorHistory: colorRoles,
    depthHistory: depthRoles
  });
  const compiled = graph.compile();
  const layout = output.computeMemoryLayout();
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });

  /** Record into the existing graph and publish both histories only after submission. */
  async function renderFrame(center: number, hardwareDepth: number, resetHistory = false) {
    source.writeData(makePixels(center));
    const encoder = device.createCommandEncoder();
    try {
      encoder
        .beginRenderPass({
          framebuffer: depthTarget,
          clearColor: false,
          clearDepth: hardwareDepth
        })
        .end();
      compiled.encode(encoder, {
        parameters: {currentJitter: [0, 0], previousJitter: [0, 0], resetHistory},
        textures: {...colorRoles.getBindings(), ...depthRoles.getBindings()}
      });
      encoder.copyTextureToBuffer({
        sourceTexture: output,
        destinationBuffer: readback,
        bytesPerRow: layout.bytesPerRow,
        width,
        height
      });
      device.submit(encoder.finish());
      colorHistory.advance();
      depthHistory.advance();
      return (await readback.readAsync())[layout.bytesPerRow + 4];
    } finally {
      encoder.destroy();
    }
  }

  try {
    const missingBindings = device.createCommandEncoder();
    try {
      expect(() =>
        compiled.encode(missingBindings, {
          parameters: {currentJitter: [0, 0], previousJitter: [0, 0], resetHistory: true}
        })
      ).toThrow(/imported texture .* is required/);
    } finally {
      missingBindings.destroy();
    }
    expect(await renderFrame(64, 0.5, true)).toBe(64);
    expect(await renderFrame(128, 0.5)).toBe(70);
    expect(await renderFrame(192, 0.7)).toBe(192);
    expect(await renderFrame(128, 0.7, true)).toBe(128);
  } finally {
    compiled.destroy();
    expect(colorHistory.previousTexture.destroyed).toBe(false);
    expect(depthHistory.previousTexture.destroyed).toBe(false);
    readback.destroy();
    depthTarget.destroy();
    depthHistory.destroy();
    colorHistory.destroy();
    depth.destroy();
    velocity.destroy();
    output.destroy();
    source.destroy();
  }
});
