// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {GPUCommandGraph, GPUCommandGraphInspector} from '@luma.gl/graph/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {expect, test} from 'vitest';

test('inspector reads bounded current buffer and texture contents after graph submission', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const source = device.createBuffer({data: new Uint8Array([1, 2, 3, 4]), usage: Buffer.COPY_SRC});
  const texture = device.createTexture({
    format: 'rgba8unorm',
    width: 2,
    height: 2,
    usage: Texture.COPY_SRC | Texture.COPY_DST,
    data: new Uint8Array([1, 2, 3, 255, 4, 5, 6, 255, 7, 8, 9, 255, 10, 11, 12, 255])
  });
  const arrayTexture = device.createTexture({
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    dimension: '2d-array',
    depth: 2,
    mipLevels: 2,
    usage: Texture.COPY_SRC | Texture.COPY_DST
  });
  const graph = new GPUCommandGraph(device);
  const bufferHandle = graph.importBuffer(
    {id: 'buffer', byteLength: source.byteLength, usage: Buffer.COPY_SRC},
    source
  );
  const textureHandle = graph.importTexture(
    {id: 'texture', format: 'rgba8unorm', width: 2, height: 2, usage: Texture.COPY_SRC},
    texture
  );
  const arrayHandle = graph.importTexture(
    {
      id: 'array',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      dimension: '2d-array',
      depth: 2,
      mipLevels: 2,
      usage: Texture.COPY_SRC | Texture.COPY_DST
    },
    arrayTexture
  );
  const view = graph.createTextureView(arrayHandle, {
    dimension: '2d',
    baseMipLevel: 1,
    mipLevelCount: 1,
    baseArrayLayer: 1,
    arrayLayerCount: 1
  });
  graph.addCopyPass({
    id: 'inspect',
    resources: [
      {buffer: bufferHandle, usage: 'copy-source'},
      {texture: textureHandle, usage: 'copy-source'},
      {texture: view, usage: 'copy-destination'}
    ],
    compile: () => ({
      encode: ({commandEncoder, getTexture}) => {
        commandEncoder.copyTextureToTexture({
          sourceTexture: getTexture(textureHandle),
          destinationTexture: getTexture(view),
          destinationMipLevel: 1,
          destinationOrigin: [0, 0, 1],
          width: 2,
          height: 2,
          depthOrArrayLayers: 1
        });
      }
    })
  });
  const compiled = graph.compile();
  const inspector = new GPUCommandGraphInspector();
  const observation = inspector.observeGraph(compiled);
  const encoder = device.createCommandEncoder();
  try {
    observation.encode(encoder, {});
    device.submit(encoder.finish());
    expect(Array.from((await inspector.readResource(compiled.id, 'inspect', 0)).data)).toEqual([
      1, 2, 3, 4
    ]);
    const pixels = await inspector.readResource(compiled.id, 'inspect', 1);
    expect(pixels.width).toBe(2);
    expect(Array.from(pixels.data)).toEqual([
      1, 2, 3, 255, 4, 5, 6, 255, 7, 8, 9, 255, 10, 11, 12, 255
    ]);
    const selected = await inspector.readResource(compiled.id, 'inspect', 2);
    expect(selected.width).toBe(2);
    expect(selected.data).toEqual(pixels.data);
    expect(inspector.getSnapshot().graphs[0].nodes[0].resources?.[2]).toMatchObject({
      baseMipLevel: 1,
      baseArrayLayer: 1
    });
    compiled.destroy();
    await expect(inspector.readResource(compiled.id, 'inspect', 0)).rejects.toThrow('destroyed');
    expect(source.destroyed).toBe(false);
    expect(texture.destroyed).toBe(false);
  } finally {
    observation.detach();
    compiled.destroy();
    encoder.destroy();
    source.destroy();
    texture.destroy();
    arrayTexture.destroy();
  }
});
