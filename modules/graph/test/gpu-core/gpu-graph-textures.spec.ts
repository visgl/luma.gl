// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {GPUGraph, GPUGraphCompiler, type GPUOperationLowering} from '@luma.gl/graph/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, test, vi} from 'vitest';

test('program texture subresources and rebound imports compose in one submission', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const program = new GPUGraph();
  const source = program.texture('source', {
    format: 'rgba8unorm',
    width: 2,
    height: 2,
    usage: Texture.COPY_SRC,
    external: true
  });
  const scratch = program.texture('scratch', {
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    dimension: '2d-array',
    depth: 2,
    mipLevels: 2,
    usage: Texture.COPY_SRC | Texture.COPY_DST
  });
  const view = program.textureView(scratch, {
    dimension: '2d',
    baseMipLevel: 1,
    mipLevelCount: 1,
    baseArrayLayer: 1,
    arrayLayerCount: 1
  });
  const output = program.texture('output', {
    format: 'rgba8unorm',
    width: 2,
    height: 2,
    usage: Texture.COPY_DST | Texture.COPY_SRC,
    external: true
  });
  const lowerings: GPUOperationLowering[] = [];
  let physicalScratch: Texture | undefined;
  lowerings.push({
    type: 'copy',
    lower: (_operation, context) => {
      const input = context.resolveTexture(source);
      const selected = context.resolveTextureView(view);
      const destination = context.resolveTexture(output);
      context.graph.addCopyPass({
        id: 'write-layer-mip',
        resources: [
          {texture: input, usage: 'copy-source'},
          {texture: selected, usage: 'copy-destination'}
        ],
        compile: () => ({
          encode: ({commandEncoder, getTexture}) => {
            physicalScratch = getTexture(selected);
            commandEncoder.copyTextureToTexture({
              sourceTexture: getTexture(input),
              destinationTexture: physicalScratch,
              destinationMipLevel: selected.baseMipLevel,
              destinationOrigin: [0, 0, selected.baseArrayLayer],
              width: 2,
              height: 2
            });
          }
        })
      });
      context.graph.addCopyPass({
        id: 'read-layer-mip',
        resources: [
          {texture: selected, usage: 'copy-source'},
          {texture: destination, usage: 'copy-destination'}
        ],
        compile: () => ({
          encode: ({commandEncoder, getTexture}) => {
            commandEncoder.copyTextureToTexture({
              sourceTexture: getTexture(selected),
              mipLevel: selected.baseMipLevel,
              origin: [0, 0, selected.baseArrayLayer],
              destinationTexture: getTexture(destination),
              width: 2,
              height: 2
            });
          }
        })
      });
    }
  });
  program.add({id: 'copy', type: 'copy'});
  const compilation = new GPUGraphCompiler(device, lowerings).compile(program);
  const compiled = compilation.graph.compile();
  const sources = [37, 191].map(value =>
    device.createTexture({
      format: 'rgba8unorm',
      width: 2,
      height: 2,
      usage: Texture.COPY_SRC | Texture.COPY_DST,
      data: new Uint8Array(16).fill(value)
    })
  );
  const outputs = sources.map(() =>
    device.createTexture({
      format: 'rgba8unorm',
      width: 2,
      height: 2,
      usage: Texture.COPY_SRC | Texture.COPY_DST
    })
  );
  const readbacks = sources.map(() =>
    device.createBuffer({byteLength: 512, usage: Buffer.COPY_DST | Buffer.MAP_READ})
  );
  const encoder = device.createCommandEncoder();
  const submit = vi.spyOn(device, 'submit');
  try {
    for (let index = 0; index < sources.length; index++) {
      compiled.encode(encoder, {
        parameters: undefined,
        textures: {source: sources[index], output: outputs[index]}
      });
      encoder.copyTextureToBuffer({
        sourceTexture: outputs[index],
        destinationBuffer: readbacks[index],
        bytesPerRow: 256,
        width: 2,
        height: 2
      });
    }
    expect(submit).not.toHaveBeenCalled();
    device.submit(encoder.finish());
    for (let index = 0; index < readbacks.length; index++) {
      const data = await readbacks[index].readAsync();
      const expected = index === 0 ? 37 : 191;
      expect(Array.from(data.slice(0, 8))).toEqual(new Array(8).fill(expected));
      expect(Array.from(data.slice(256, 264))).toEqual(new Array(8).fill(expected));
    }
    compiled.destroy();
    expect(physicalScratch?.destroyed).toBe(true);
    expect(sources.every(texture => !texture.destroyed)).toBe(true);
    expect(outputs.every(texture => !texture.destroyed)).toBe(true);
  } finally {
    submit.mockRestore();
    compiled.destroy();
    encoder.destroy();
    for (const resource of [...sources, ...outputs, ...readbacks]) resource.destroy();
  }
});
