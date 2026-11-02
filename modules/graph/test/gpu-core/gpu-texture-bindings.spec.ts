// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture, TextureView, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  GPUCopyOperation,
  GPUUploadOperation,
  GPUExpressionOperation,
  gpuGraph,
  type GPUOperationLowering
} from '@luma.gl/graph';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

function makeTexture(device: Device, width: number, value?: number) {
  return device.createTexture({
    format: 'rgba8unorm',
    width,
    height: width,
    usage: Texture.COPY_SRC | Texture.COPY_DST | Texture.SAMPLE,
    ...(value === undefined ? {} : {data: new Uint8Array(width * width * 4).fill(value)})
  });
}
async function readPixel(texture: Texture, mipLevel = 0, z = 0) {
  const buffer = texture.device.createBuffer({
    byteLength: 256,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  texture.readBuffer({width: 1, height: 1, depthOrArrayLayers: 1, mipLevel, z}, buffer);
  try {
    return Array.from((await buffer.readAsync()).subarray(0, 4));
  } finally {
    buffer.destroy();
  }
}
for (const simple of [false, true]) {
  test(`texture copies and numeric operations preserve independent outputs on repeated runs (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.add([
      new GPUCopyOperation({input: 'image', output: 'temporary'}),
      new GPUUploadOperation({
        output: 'numbers',
        format: 'float32',
        data: new Float32Array([2, 3])
      }),
      new GPUExpressionOperation({output: 'scaled', expression: 'numbers * 3'}),
      new GPUCopyOperation({input: 'temporary', output: 'result'})
    ]);
    const compiled = graph.compile<{result: Texture; scaled: GPUVector}>(device, {
      outputs: ['result', 'scaled']
    });
    try {
      for (const [width, value] of [
        [2, 31],
        [4, 173]
      ]) {
        const input = makeTexture(device, width, value);
        const result = await compiled.run({inputs: {image: input}});
        try {
          expect(result.result.width).toBe(width);
          expect(await readPixel(result.result)).toEqual([value, value, value, value]);
          const bytes = await result.scaled.data[0].buffer.readAsync();
          expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 2))).toEqual([6, 9]);
          expect(input.destroyed).toBe(false);
        } finally {
          result.result.destroy();
          result.scaled.destroy();
          input.destroy();
        }
      }
    } finally {
      compiled.destroy();
    }
  });

  test(`caller encoding preserves selected mip/layer inputs and borrowed targets (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.add(new GPUCopyOperation({input: 'image', output: 'result'}));
    const compiled = graph.compile<{result: TextureView}>(device);
    const input = device.createTexture({
      format: 'rgba8unorm',
      dimension: '2d-array',
      width: 4,
      height: 4,
      depth: 2,
      mipLevels: 2,
      usage: Texture.COPY_SRC | Texture.COPY_DST
    });
    const output = device.createTexture({
      format: 'rgba8unorm',
      dimension: '2d-array',
      width: 8,
      height: 8,
      depth: 3,
      mipLevels: 3,
      usage: Texture.COPY_SRC | Texture.COPY_DST
    });
    input.writeData(new Uint8Array(16).fill(127), {
      mipLevel: 1,
      z: 1,
      width: 2,
      height: 2,
      depthOrArrayLayers: 1
    });
    const source = input.createView({
      dimension: '2d',
      baseMipLevel: 1,
      mipLevelCount: 1,
      baseArrayLayer: 1,
      arrayLayerCount: 1
    });
    const destination = output.createView({
      dimension: '2d',
      baseMipLevel: 2,
      mipLevelCount: 1,
      baseArrayLayer: 2,
      arrayLayerCount: 1
    });
    const submit = vi.spyOn(device, 'submit');
    const execution = compiled.prepare({
      inputs: {image: source},
      outputTargets: {result: destination}
    });
    const encoder = device.createCommandEncoder();
    try {
      execution.encode(encoder);
      expect(submit).not.toHaveBeenCalled();
      device.submit(encoder.finish());
      expect(submit).toHaveBeenCalledTimes(1);
      submit.mockRestore();
      expect(await readPixel(output, 2, 2)).toEqual([127, 127, 127, 127]);
      expect(execution.outputs.result).toBe(destination);
      execution.destroy();
      expect(output.destroyed).toBe(false);
      expect(destination.destroyed).toBe(false);
    } finally {
      submit.mockRestore();
      execution.destroy();
      encoder.destroy();
      source.destroy();
      destination.destroy();
      input.destroy();
      output.destroy();
      compiled.destroy();
    }
  });
}

test('custom render lowering produces scaled textures with inferred attachment usage', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const graph = new GPUGraph();
  graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
  graph.add({
    id: 'clear',
    type: 'test-clear',
    contract: {
      values: [
        {value: 'image', access: 'read', textureUsage: 'sampled'},
        {value: 'result', access: 'write', textureUsage: 'render-attachment'}
      ],
      outputs: {
        result: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'image', scale: [0.5, 0.5]}})
      }
    }
  });
  const lowerings: GPUOperationLowering[] = [
    {
      type: 'test-clear',
      lower: (_operation, context) => {
        const output = context.resolveTextureView('result');
        context.graph.addRenderPass({
          id: 'clear',
          attachments: {colorAttachments: [output]},
          compile: () => ({
            getRenderPassProps: () => ({clearColor: [1, 0, 0, 1], clearDepth: false}),
            encode: () => {}
          })
        });
      }
    }
  ];
  const compiled = graph.compile<{result: Texture}>(device, {lowerings});
  const input = makeTexture(device, 8);
  try {
    const {result} = await compiled.run({inputs: {image: input}});
    try {
      expect(result.width).toBe(4);
      expect(await readPixel(result)).toEqual([255, 0, 0, 255]);
    } finally {
      result.destroy();
    }
  } finally {
    compiled.destroy();
    input.destroy();
  }
});

for (const dimension of ['2d-array', '3d'] as const) {
  test(`copy retains mip chains and ${dimension} depth`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm', dimension}));
    graph.add(new GPUCopyOperation({input: 'image', output: 'result'}));
    const compiled = graph.compile<{result: Texture}>(device);
    const input = device.createTexture({
      format: 'rgba8unorm',
      dimension,
      width: 4,
      height: 4,
      depth: 4,
      mipLevels: 2,
      usage: Texture.COPY_SRC | Texture.COPY_DST
    });
    input.writeData(new Uint8Array(4 * 4 * 4 * 4).fill(37), {
      width: 4,
      height: 4,
      depthOrArrayLayers: 4
    });
    const mipDepth = dimension === '3d' ? 2 : 4;
    input.writeData(new Uint8Array(2 * 2 * mipDepth * 4).fill(199), {
      mipLevel: 1,
      width: 2,
      height: 2,
      depthOrArrayLayers: mipDepth
    });
    try {
      const {result} = await compiled.run({inputs: {image: input}});
      try {
        expect(result.mipLevels).toBe(2);
        expect(result.depth).toBe(4);
        expect(await readPixel(result, 0, 3)).toEqual([37, 37, 37, 37]);
        expect(await readPixel(result, 1, mipDepth - 1)).toEqual([199, 199, 199, 199]);
      } finally {
        result.destroy();
      }
    } finally {
      input.destroy();
      compiled.destroy();
    }
  });
}
