// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture, type Device, type TextureView} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  GPUShaderPassOperation,
  GPUCopyOperation,
  GPUExpressionOperation,
  RenderKernel,
  gpuGraph
} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {compileColorAdjustment} from '../../../../examples/v10/gpu-simple-graph/src/color-adjustment';

function makeImage(device: Device, width = 2) {
  const data = new Uint8Array(width * width * 4);
  for (let index = 0; index < width * width; index++)
    data.set([40 + index * 2, 80, 120, 255], index * 4);
  return device.createTexture({
    format: 'rgba8unorm',
    width,
    height: width,
    data,
    usage: Texture.SAMPLE | Texture.COPY_DST | Texture.COPY_SRC
  });
}
async function readPixel(texture: Texture, x = 0, y = 0, mipLevel = 0, z = 0) {
  const buffer = texture.device.createBuffer({
    byteLength: 256,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: 1, height: 1, depthOrArrayLayers: 1, x, y, z, mipLevel}, buffer);
    return Array.from((await buffer.readAsync()).subarray(0, 4));
  } finally {
    buffer.destroy();
  }
}

for (const simple of [false, true]) {
  test(`shader-pass unsupported bound topology releases allocated outputs (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const compiled = compileColorAdjustment(device, simple);
    const image = device.createTexture({
      format: 'rgba8unorm',
      width: 2,
      height: 2,
      samples: 4,
      usage: Texture.SAMPLE | Texture.RENDER
    });
    const allocate = vi.spyOn(device, 'createTexture');
    try {
      expect(() => compiled.prepare({inputs: {image, gain: 1}})).toThrow();
      expect(allocate.mock.results.every(entry => entry.value.destroyed)).toBe(true);
      expect(image.destroyed).toBe(false);
    } finally {
      allocate.mockRestore();
      compiled.destroy();
      image.destroy();
    }
  });
  test(`shader-pass multiple named textures and samplers share one description (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.addInput('overlay', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.add(
      new GPUShaderPassOperation({
        inputs: {imageTexture: 'image', overlayTexture: 'overlay'},
        samplers: {nearestSampler: {}, linearSampler: {minFilter: 'linear', magFilter: 'linear'}},
        output: 'result',
        outputDescriptor: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'image'}}),
        fragmentSource: `fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {
        return mix(textureSample(imageTexture, nearestSampler, textureCoordinates),
          textureSample(overlayTexture, linearSampler, textureCoordinates), 0.5);
      }`
      })
    );
    const compiled = graph.compile<{result: Texture}>(device);
    const image = makeImage(device);
    const overlay = device.createTexture({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      data: new Uint8Array([100, 100, 100, 255]),
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    try {
      const {result} = await compiled.run({inputs: {image, overlay}});
      try {
        expect(await readPixel(result)).toEqual([70, 90, 110, 255]);
      } finally {
        result.destroy();
      }
    } finally {
      image.destroy();
      overlay.destroy();
      compiled.destroy();
    }
  });
  test(`shader-pass run failure releases outputs and preserves inputs (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const compiled = compileColorAdjustment(device, simple);
    const image = makeImage(device);
    const allocate = vi.spyOn(device, 'createTexture');
    const draw = vi.spyOn(RenderKernel.prototype, 'draw').mockImplementation(() => {
      throw new Error('injected shader-pass failure');
    });
    try {
      await expect(compiled.run({inputs: {image, gain: 1}})).rejects.toThrow(
        'injected shader-pass failure'
      );
      expect(allocate.mock.results.every(entry => entry.value.destroyed)).toBe(true);
      expect(image.destroyed).toBe(false);
    } finally {
      draw.mockRestore();
      allocate.mockRestore();
      compiled.destroy();
      image.destroy();
    }
  });
  test(`shader-pass color adjustment preserves orientation and supports repeated sizes (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const compiled = compileColorAdjustment(device, simple);
    try {
      for (const width of [2, 4]) {
        const image = makeImage(device, width);
        const {result} = await compiled.run({inputs: {image, gain: 0.5}});
        try {
          expect(result.width).toBe(width);
          expect(await readPixel(result)).toEqual([20, 40, 60, 255]);
          expect(await readPixel(result, width - 1, width - 1)).toEqual([
            20 + width * width - 1,
            40,
            60,
            255
          ]);
          expect(image.destroyed).toBe(false);
        } finally {
          result.destroy();
          image.destroy();
        }
      }
    } finally {
      compiled.destroy();
    }
  });

  test(`shader-pass caller encoding isolates overlapping invocation parameters (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const compiled = compileColorAdjustment(device, simple);
    const image = makeImage(device);
    const submit = vi.spyOn(device, 'submit');
    const first = compiled.prepare({inputs: {image, gain: 0.5}});
    const second = compiled.prepare({inputs: {image, gain: 1}});
    const encoder = device.createCommandEncoder();
    try {
      expect(submit).not.toHaveBeenCalled();
      first.encode(encoder);
      second.encode(encoder);
      expect(submit).not.toHaveBeenCalled();
      expect(() => first.encode(encoder)).toThrow();
      device.submit(encoder.finish());
      expect(submit).toHaveBeenCalledTimes(1);
      first.destroy();
      second.destroy();
      expect(await readPixel(first.outputs.result)).toEqual([20, 40, 60, 255]);
      expect(await readPixel(second.outputs.result)).toEqual([40, 80, 120, 255]);
    } finally {
      submit.mockRestore();
      first.destroy();
      second.destroy();
      encoder.destroy();
      first.outputs.result.destroy();
      second.outputs.result.destroy();
      compiled.destroy();
      image.destroy();
    }
  });

  test(`shader-pass parameters consume GPU-produced scalars and typed input scalars (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.addInput('gain', gpuGraph.scalar('float32'));
    graph.addInput('offset', gpuGraph.scalar('sint32'));
    graph.addInput('blue', gpuGraph.scalar('uint32'));
    graph.add(new GPUExpressionOperation({output: 'effectiveGain', expression: 'gain * 2'}));
    graph.add(
      new GPUShaderPassOperation({
        inputs: {imageTexture: 'image'},
        samplers: {imageSampler: {}},
        parameters: {gain: 'effectiveGain', offset: 'offset', blue: 'blue'},
        output: 'filtered',
        outputDescriptor: gpuGraph.texture({
          format: 'rgba8unorm',
          extent: {like: 'image', scale: [0.5, 0.5]}
        }),
        fragmentSource: `fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {
        let color = textureSample(imageTexture, imageSampler, textureCoordinates);
        return vec4<f32>(color.r * parameters.gain, f32(parameters.offset + 1), f32(parameters.blue), 1.0);
      }`
      })
    );
    graph.add(new GPUCopyOperation({input: 'filtered', output: 'result'}));
    const compiled = graph.compile<{result: Texture}>(device);
    const image = makeImage(device, 4);
    const allocate = vi.spyOn(device, 'createTexture');
    try {
      const {result} = await compiled.run({inputs: {image, gain: 0.25, offset: -1, blue: 1}});
      try {
        expect(result.width).toBe(2);
        expect(await readPixel(result)).toEqual([25, 0, 255, 255]);
        expect(
          allocate.mock.results
            .filter(entry => entry.value !== result)
            .every(entry => entry.value.destroyed)
        ).toBe(true);
      } finally {
        result.destroy();
      }
    } finally {
      allocate.mockRestore();
      compiled.destroy();
      image.destroy();
    }
  });

  test(`shader-pass selected views and borrowed targets retain ownership (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.add(
      new GPUShaderPassOperation({
        inputs: {imageTexture: 'image'},
        samplers: {imageSampler: {}},
        output: 'result',
        outputDescriptor: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'image'}}),
        fragmentSource:
          'fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {return textureSample(imageTexture, imageSampler, textureCoordinates);}'
      })
    );
    const compiled = graph.compile<{result: TextureView}>(device);
    const source = device.createTexture({
      format: 'rgba8unorm',
      dimension: '2d-array',
      width: 4,
      height: 4,
      depth: 2,
      mipLevels: 2,
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    source.writeData(new Uint8Array(16).fill(77), {mipLevel: 1, z: 1, width: 2, height: 2});
    const target = device.createTexture({
      format: 'rgba8unorm',
      dimension: '2d-array',
      width: 4,
      height: 4,
      depth: 2,
      mipLevels: 2,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const image = source.createView({
      dimension: '2d',
      baseMipLevel: 1,
      mipLevelCount: 1,
      baseArrayLayer: 1,
      arrayLayerCount: 1
    });
    const result = target.createView({
      dimension: '2d',
      baseMipLevel: 1,
      mipLevelCount: 1,
      baseArrayLayer: 1,
      arrayLayerCount: 1
    });
    try {
      const outputs = await compiled.run({inputs: {image}, outputTargets: {result}});
      expect(outputs.result).toBe(result);
      expect(await readPixel(target, 1, 1, 1, 1)).toEqual([77, 77, 77, 77]);
      expect(result.destroyed).toBe(false);
      expect(image.destroyed).toBe(false);
    } finally {
      image.destroy();
      result.destroy();
      source.destroy();
      target.destroy();
      compiled.destroy();
    }
  });
}
