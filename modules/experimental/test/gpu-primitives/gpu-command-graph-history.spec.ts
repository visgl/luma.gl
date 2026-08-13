// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GPUTextureHistory} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const HISTORY_TEXTURE_USAGE = Texture.SAMPLE | Texture.STORAGE | Texture.COPY_SRC;

test('GPUTextureHistory preserves GPU results across copy-free CORE WebGPU frame rotation', async testCase => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const history = new GPUTextureHistory(device, {
    id: 'core-history',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    mipLevels: 2,
    usage: HISTORY_TEXTURE_USAGE
  });
  const graph = new GPUCommandGraph(device, {id: 'core-texture-history'});
  const previous = graph.importTexture(
    {
      id: 'previous',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      mipLevels: 2,
      usage: HISTORY_TEXTURE_USAGE
    },
    history.previousTexture
  );
  const current = graph.importTexture(
    {
      id: 'current',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      mipLevels: 2,
      usage: HISTORY_TEXTURE_USAGE
    },
    history.currentTexture
  );
  const previousView = graph.createTextureView(previous, {baseMipLevel: 0, mipLevelCount: 1});
  const currentView = graph.createTextureView(current, {baseMipLevel: 0, mipLevelCount: 1});
  graph.addComputePass({
    id: 'accumulate-history',
    resources: [
      {texture: previousView, usage: 'sampled'},
      {texture: currentView, usage: 'storage-write'}
    ],
    compile: ({device: compileDevice}) => {
      const computation = new Computation(compileDevice, {
        id: 'accumulate-core-history',
        source: `
@group(0) @binding(0) var previousImage: texture_2d<f32>;
@group(0) @binding(1) var currentImage: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(4, 4, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let pixel = vec2<i32>(invocation.xy);
  let previousColor = textureLoad(previousImage, pixel, 0);
  textureStore(currentImage, pixel, vec4<f32>(previousColor.r + 0.2, 0.0, 0.0, 1.0));
}`,
        shaderLayout: {
          bindings: [
            {
              name: 'previousImage',
              type: 'texture',
              group: 0,
              location: 0,
              sampleType: 'float'
            },
            {
              name: 'currentImage',
              type: 'storage',
              group: 0,
              location: 1,
              access: 'write-only',
              format: 'rgba8unorm'
            }
          ]
        }
      });
      return {
        encode: ({computePass, getTextureView}) => {
          computation.setBindings({
            previousImage: getTextureView(previousView),
            currentImage: getTextureView(currentView)
          });
          computation.dispatch(computePass, 1, 1, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
  const compiled = graph.compile();
  const textureViewStats = device.statsManager
    .getStats('Resource Counts')
    .get('TextureViews Active');
  const initialTextureViewCount = textureViewStats.count;
  const initialPreviousTexture = history.previousTexture;
  const initialCurrentTexture = history.currentTexture;

  try {
    const rejectedEncoder = device.createCommandEncoder({id: 'rejected-history-alias'});
    testCase.throws(
      () =>
        compiled.encode(rejectedEncoder, {
          parameters: undefined,
          textures: {previous: history.previousTexture, current: history.previousTexture}
        }),
      /previous.*current.*same physical texture/i,
      'read/write aliases fail before any CORE GPU work is recorded'
    );
    rejectedEncoder.destroy();
    testCase.equal(
      history.previousTexture,
      initialPreviousTexture,
      'a failed encoding leaves the previous role unchanged'
    );
    testCase.equal(
      history.currentTexture,
      initialCurrentTexture,
      'a failed encoding leaves the current role unchanged'
    );
    testCase.equal(
      textureViewStats.count,
      initialTextureViewCount,
      'rejected aliases do not allocate concrete texture views'
    );

    for (let frameIndex = 0; frameIndex < 3; frameIndex++) {
      const outputTexture = history.currentTexture;
      const commandEncoder = device.createCommandEncoder({id: `history-frame-${frameIndex}`});
      const encoding = compiled.encode(commandEncoder, {
        parameters: undefined,
        textures: history.getBindings('previous', 'current')
      });
      testCase.equal(encoding.stats.nodeCount, 1, 'history graph encodes only the compute node');
      testCase.equal(encoding.stats.computePassCount, 1, 'the graph opens one CORE compute pass');
      device.submit(commandEncoder.finish());
      const pixel = await readHistoryPixel(device, outputTexture);
      testCase.equal(
        pixel[0],
        Math.round((frameIndex + 1) * 0.2 * 255),
        'the next frame reads the retained previous GPU output'
      );
      history.advance();
    }

    testCase.equal(
      textureViewStats.count,
      initialTextureViewCount + 4,
      'repeated role swaps retain only two concrete views per logical graph role'
    );
    compiled.destroy();
    testCase.equal(
      textureViewStats.count,
      initialTextureViewCount,
      'destroying the graph releases its cached views'
    );
    testCase.notOk(
      initialPreviousTexture.destroyed,
      'the first history texture stays caller-owned'
    );
    testCase.notOk(
      initialCurrentTexture.destroyed,
      'the second history texture stays caller-owned'
    );
  } finally {
    compiled.destroy();
    history.destroy();
  }

  testCase.ok(initialPreviousTexture.destroyed, 'history destruction releases the first texture');
  testCase.ok(initialCurrentTexture.destroyed, 'history destruction releases the second texture');
  testCase.end();
});

async function readHistoryPixel(device: Device, texture: Texture): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const buffer = device.createBuffer({
    id: 'history-readback',
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: 1, height: 1}, buffer);
    return await buffer.readAsync(0, layout.byteLength);
  } finally {
    buffer.destroy();
  }
}
