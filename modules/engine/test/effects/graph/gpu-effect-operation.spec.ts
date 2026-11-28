// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, gpuGraph} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {EffectRenderer} from '@luma.gl/engine';
import {
  GPUEffectOperation,
  createEffectRenderOperation,
  effectOperationLowering,
  hdrBloom,
  sepiaEffect
} from '@luma.gl/engine/effects';

it.each([
  {downsample: 'auto', flipY: true},
  {downsample: 'render', flipY: true},
  {downsample: 'auto', flipY: false},
  {downsample: 'empty', flipY: false}
] as const)('matches EffectRenderer for $downsample downsampling and flipY=$flipY', async ({
  downsample,
  flipY
}, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const width = 9;
  const height = 7;
  const canvas = device.getCanvasContext();
  const previousSize = canvas.getDrawingBufferSize();
  canvas.setDrawingBufferSize(width, height);
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index++) {
    data[index * 4] = index % 7 === 0 ? 255 : 0;
    data[index * 4 + 1] = Math.floor(index / width) * 25;
    data[index * 4 + 3] = 255;
  }
  const source = device.createTexture({
    format: 'rgba8unorm',
    width,
    height,
    data,
    usage: Texture.SAMPLE | Texture.COPY_SRC | Texture.COPY_DST
  });
  const bloomOptions = {
    colorFormat: 'rgba8unorm',
    quality: 'low',
    radius: 1,
    downsample: downsample === 'empty' ? 'render' : downsample,
    reuseRenderTargets: true
  } as const;
  const effects =
    downsample === 'empty'
      ? ([] as const)
      : ([sepiaEffect, {effect: hdrBloom, options: bloomOptions}] as const);
  const renderer = new EffectRenderer(device, {effects, colorFormat: 'rgba8unorm', flipY});
  renderer.resize([width, height]);

  const program = new GPUGraph();
  program.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
  program.add(
    new GPUEffectOperation({
      input: 'image',
      output: 'result',
      outputDescriptor: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'image'}}),
      effects,
      flipY
    })
  );
  const compiled = program.compile<{result: Texture}>(device, {
    lowerings: [effectOperationLowering]
  });
  const execution = compiled.prepare({inputs: {image: source}});
  const encoder = device.createCommandEncoder();
  const layout = execution.outputs.result.computeMemoryLayout();
  const expected = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  const actual = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    const rendererOutput = renderer.render({sourceTexture: source, commandEncoder: encoder})!;
    execution.encode(encoder);
    for (const [texture, buffer] of [
      [rendererOutput, expected],
      [execution.outputs.result, actual]
    ] as const) {
      encoder.copyTextureToBuffer({
        sourceTexture: texture,
        destinationBuffer: buffer,
        bytesPerRow: layout.bytesPerRow,
        width,
        height
      });
    }
    device.submit(encoder.finish());
    const [expectedBytes, actualBytes] = await Promise.all([
      expected.readAsync(),
      actual.readAsync()
    ]);
    expect(expectedBytes[3]).toBe(255);
    expect(actualBytes[3]).toBe(255);
    expect(actualBytes.some((value, index) => index % 4 === 0 && value > 0)).toBe(true);
    for (let row = 0; row < height; row++) {
      for (let columnByte = 0; columnByte < width * 4; columnByte++) {
        const offset = row * layout.bytesPerRow + columnByte;
        expect(
          Math.abs(actualBytes[offset] - expectedBytes[offset]),
          'pixel byte ' + offset
        ).toBeLessThanOrEqual(1);
      }
    }
  } finally {
    canvas.setDrawingBufferSize(...previousSize);
    execution.destroy();
    execution.outputs.result.destroy();
    compiled.destroy();
    encoder.destroy();
    renderer.destroy();
    source.destroy();
    expected.destroy();
    actual.destroy();
  }
});

it.each([
  false,
  true
])('runs compatible effects in GPUSimpleGraph on WebGL (in place=%s)', async (inPlace, context) => {
  const device = await getWebGLTestDevice();
  if (!device) return context.skip();
  const source = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
    data: new Uint8Array([255, 0, 0, 255])
  });
  const target = inPlace
    ? source
    : device.createTexture({
        width: 1,
        height: 1,
        format: 'rgba8unorm',
        usage: Texture.RENDER | Texture.COPY_SRC
      });
  const graph = new GPUSimpleGraph(device);
  graph.addRenderOperation(
    createEffectRenderOperation({
      id: 'webgl-sepia',
      input: source,
      output: target,
      effects: [
        {effect: sepiaEffect, uniforms: {sepia: {amount: 1}}},
        {effect: sepiaEffect, uniforms: {sepia: {amount: 0}}}
      ]
    })
  );
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder();
  const layout = target.computeMemoryLayout();
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    await compiled.run();
    encoder.copyTextureToBuffer({
      sourceTexture: target,
      destinationBuffer: readback,
      bytesPerRow: layout.bytesPerRow,
      width: 1,
      height: 1
    });
    device.submit(encoder.finish());
    const bytes = await readback.readAsync();
    expect(bytes[0]).toBeCloseTo(100, -1);
    expect(bytes[1]).toBeCloseTo(89, -1);
    expect(bytes[3]).toBe(255);
  } finally {
    readback.destroy();
    encoder.destroy();
    compiled.destroy();
    expect(source.destroyed).toBe(false);
    expect(target.destroyed).toBe(false);
    if (!inPlace) target.destroy();
    source.destroy();
  }
});
