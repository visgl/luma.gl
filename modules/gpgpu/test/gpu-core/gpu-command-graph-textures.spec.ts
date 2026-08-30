// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  Buffer,
  ExternalTexture,
  Sampler,
  Texture,
  type Device,
  type Framebuffer,
  type SamplerProps
} from '@luma.gl/core';
import {Computation, Model} from '@luma.gl/engine';
import {
  decodeGPUIndexPickInfo,
  decodeGPUIndexPickRegion,
  GPUCommandGraph,
  GPUIndexPickingTarget,
  GPUReadbackRing,
  INDEX_PICKING_READBACK_BYTE_LENGTH
} from '@luma.gl/gpgpu/gpu-core';
import {getNullTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

/** Metadata-only external texture used to test graph contracts without importing browser video. */
class TestExternalTexture extends ExternalTexture {
  readonly device: Device;
  readonly handle = null;
  sampler: Sampler;

  constructor(device: Device, sampler: Sampler, id: string, width: number, height: number) {
    super(device, {id, width, height});
    this.device = device;
    this.sampler = sampler;
  }

  setSampler(sampler: Sampler | SamplerProps): this {
    this.sampler = sampler instanceof Sampler ? sampler : this.device.createSampler(sampler);
    return this;
  }
}

test('GPUCommandGraph validates texture descriptors, views, and imports', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'texture-validation'});
  t.throws(
    () =>
      graph.createTransientTexture({
        id: 'invalid-size',
        format: 'rgba8unorm',
        width: 0,
        height: 4,
        usage: Texture.RENDER
      }),
    /positive safe integer/,
    'zero texture extent is rejected'
  );
  const mipTexture = graph.createTransientTexture({
    id: 'mips',
    format: 'rgba8unorm',
    width: 8,
    height: 8,
    mipLevels: 4,
    usage: Texture.SAMPLE | Texture.STORAGE
  });
  const mipTwo = graph.createTextureView(mipTexture, {
    baseMipLevel: 2,
    mipLevelCount: 1
  });
  t.equal(mipTwo.width, 2, 'view width reflects base mip');
  t.equal(mipTwo.height, 2, 'view height reflects base mip');
  t.throws(
    () => graph.createTextureView(mipTexture, {baseMipLevel: 4, mipLevelCount: 1}),
    /exceeds.*mip levels/,
    'view outside mip range is rejected'
  );
  t.throws(
    () =>
      graph.addComputePass({
        id: 'wrong-usage',
        resources: [{texture: mipTwo, usage: 'render-attachment'}],
        compile: () => ({encode: () => {}})
      }),
    /does not declare usage/,
    'node texture role must be declared by the descriptor'
  );

  const importedTexture = device.createTexture({
    id: 'imported-texture',
    width: 4,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  const importGraph = new GPUCommandGraph(device, {id: 'texture-import'});
  const imported = importGraph.importTexture(
    {
      id: 'imported',
      width: 4,
      height: 4,
      format: 'rgba8unorm',
      usage: Texture.SAMPLE
    },
    importedTexture
  );
  const importedView = importGraph.createTextureView(imported);
  const resolvedViews: unknown[] = [];
  importGraph.addComputePass({
    id: 'observe',
    resources: [{texture: importedView, usage: 'sampled'}],
    compile: () => ({
      encode: ({getTextureView}) => void resolvedViews.push(getTextureView(importedView))
    })
  });
  const compiled = importGraph.compile();
  t.equal(compiled.stats.importedTextureCount, 1, 'imported texture count is reported');
  t.equal(compiled.stats.importedTextureBytes, 64, 'imported texture bytes are estimated');
  t.equal(compiled.stats.logicalTextureCount, 1, 'logical texture count includes imports');
  t.equal(compiled.stats.logicalTextureBytes, 64, 'logical texture bytes include imports');
  t.equal(compiled.stats.logicalResourceBytes, 64, 'logical resource bytes include textures');
  t.equal(
    compiled.stats.physicalTransientResourceBytes,
    0,
    'imported textures are excluded from owned transient memory'
  );
  compiled.encode(device.createCommandEncoder({id: 'texture-import-first'}), {
    parameters: undefined
  });
  compiled.encode(device.createCommandEncoder({id: 'texture-import-second'}), {
    parameters: undefined
  });
  t.equal(resolvedViews[0], resolvedViews[1], 'concrete texture view is cached across encodes');
  const replacement = device.createTexture({
    id: 'replacement-texture',
    width: 4,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  compiled.encode(device.createCommandEncoder({id: 'texture-import-replacement'}), {
    parameters: undefined,
    textures: {imported: replacement}
  });
  t.notEqual(resolvedViews[1], resolvedViews[2], 'replacement texture resolves a distinct view');
  const wrongSize = device.createTexture({
    id: 'wrong-size-texture',
    width: 8,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  t.throws(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'texture-import-invalid'}), {
        parameters: undefined,
        textures: {imported: wrongSize}
      }),
    /incompatible width/,
    'fixed-size import rejects resized replacement'
  );
  compiled.destroy();
  t.notOk(importedTexture.destroyed, 'compiled graph leaves imported texture alive');
  importedTexture.destroy();
  replacement.destroy();
  wrongSize.destroy();
  t.end();
});

test('GPUCommandGraph resolves multisampled color attachments', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const resolvedTexture = device.createTexture({
    id: 'resolved-color',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'multisample-resolve'});
  const multisampled = graph.createTransientTexture({
    id: 'multisampled-color',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    samples: 4,
    usage: Texture.RENDER
  });
  const resolved = graph.importTexture(
    {
      id: 'resolved-color',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      usage: Texture.RENDER | Texture.COPY_SRC
    },
    resolvedTexture
  );
  graph.addRenderPass({
    id: 'resolve-red',
    attachments: {
      colorAttachments: [graph.createTextureView(multisampled)],
      resolveTargets: [graph.createTextureView(resolved)]
    },
    compile: () => ({
      getRenderPassProps: () => ({clearColor: [1, 0, 0, 1]}),
      encode: () => {}
    })
  });
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'multisample-resolve'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const pixels = await readPixels(resolvedTexture, 4, 4);
  t.ok(
    pixels[0] > 240 && pixels[1] < 10 && pixels[2] < 10,
    'multisampled clear resolves into the declared single-sample target'
  );
  compiled.destroy();
  t.notOk(resolvedTexture.destroyed, 'resolve target remains caller-owned');
  resolvedTexture.destroy();

  const invalidGraph = new GPUCommandGraph(device, {id: 'invalid-resolve'});
  const singleSample = invalidGraph.createTransientTexture({
    id: 'single-source',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER
  });
  const invalidTarget = invalidGraph.createTransientTexture({
    id: 'single-target',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER
  });
  t.throws(
    () =>
      invalidGraph.addRenderPass({
        id: 'invalid-resolve-pass',
        attachments: {
          colorAttachments: [invalidGraph.createTextureView(singleSample)],
          resolveTargets: [invalidGraph.createTextureView(invalidTarget)]
        },
        compile: () => ({encode: () => {}})
      }),
    /match a multisampled source and be single-sampled/,
    'single-sample sources cannot declare resolve targets'
  );
  t.end();
});

test('GPUCommandGraph redirects reusable render passes to caller-owned framebuffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const firstTexture = device.createTexture({
    id: 'caller-owned-color-0',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const secondTexture = device.createTexture({
    id: 'caller-owned-color-1',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const firstFramebuffer = device.createFramebuffer({
    id: 'caller-owned-framebuffer-0',
    width: 4,
    height: 4,
    colorAttachments: [firstTexture],
    depthStencilAttachment: null
  });
  const secondFramebuffer = device.createFramebuffer({
    id: 'caller-owned-framebuffer-1',
    width: 4,
    height: 4,
    colorAttachments: [secondTexture],
    depthStencilAttachment: null
  });
  const graph = new GPUCommandGraph<{
    framebuffer: Framebuffer;
    clearColor: [number, number, number, number];
  }>(device, {id: 'caller-owned-framebuffers'});
  let compilationCount = 0;
  let encodingCount = 0;

  graph.addRenderPass({
    id: 'redirect-render-target',
    compile: () => {
      compilationCount++;
      return {
        getRenderPassProps: ({parameters}) => ({
          framebuffer: parameters.framebuffer,
          clearColor: parameters.clearColor
        }),
        encode: () => {
          encodingCount++;
        }
      };
    }
  });

  const compiled = graph.compile();
  const firstEncoder = device.createCommandEncoder({id: 'caller-owned-encoding-0'});
  compiled.encode(firstEncoder, {
    parameters: {framebuffer: firstFramebuffer, clearColor: [1, 0, 0, 1]}
  });
  device.submit(firstEncoder.finish());

  const secondEncoder = device.createCommandEncoder({id: 'caller-owned-encoding-1'});
  compiled.encode(secondEncoder, {
    parameters: {framebuffer: secondFramebuffer, clearColor: [0, 1, 0, 1]}
  });
  device.submit(secondEncoder.finish());

  t.deepEqual(
    Array.from((await readPixels(firstTexture, 4, 4)).subarray(0, 4)),
    [255, 0, 0, 255],
    'the first offscreen framebuffer receives only its own render pass'
  );
  t.deepEqual(
    Array.from((await readPixels(secondTexture, 4, 4)).subarray(0, 4)),
    [0, 255, 0, 255],
    'the next encoding can target a different caller-owned framebuffer'
  );
  t.equal(compilationCount, 1, 'changing the target does not recompile the render executable');
  t.equal(encodingCount, 2, 'the same compiled render executable records both frames');

  const conflictingGraph = new GPUCommandGraph(device, {id: 'conflicting-framebuffer'});
  const managedColor = conflictingGraph.importTexture(
    {
      id: 'managed-color',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      usage: Texture.RENDER
    },
    firstTexture
  );
  conflictingGraph.addRenderPass({
    id: 'conflicting-render-target',
    attachments: {colorAttachments: [conflictingGraph.createTextureView(managedColor)]},
    compile: () => ({
      getRenderPassProps: () => ({framebuffer: secondFramebuffer}),
      encode: () => {}
    })
  });
  const conflictingCompiled = conflictingGraph.compile();
  t.throws(
    () =>
      conflictingCompiled.encode(device.createCommandEncoder({id: 'conflicting-encoding'}), {
        parameters: undefined
      }),
    /cannot supply framebuffer with graph attachments/,
    'graph-managed attachments cannot be replaced by a callback-supplied framebuffer'
  );

  conflictingCompiled.destroy();
  compiled.destroy();
  t.notOk(firstFramebuffer.destroyed, 'the first framebuffer remains caller-owned');
  t.notOk(secondFramebuffer.destroyed, 'the replacement framebuffer remains caller-owned');
  t.notOk(firstTexture.destroyed, 'the first framebuffer texture remains caller-owned');
  t.notOk(secondTexture.destroyed, 'the replacement framebuffer texture remains caller-owned');
  firstFramebuffer.destroy();
  secondFramebuffer.destroy();
  firstTexture.destroy();
  secondTexture.destroy();
  t.end();
});

test('GPUCommandGraph enforces frame-scoped texture bindings', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const firstTexture = device.createTexture({
    id: 'frame-color-0',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    depth: 2,
    usage: Texture.RENDER
  });
  const secondTexture = device.createTexture({
    id: 'frame-color-1',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    depth: 2,
    usage: Texture.RENDER
  });
  const auxiliaryTexture = device.createTexture({
    id: 'frame-auxiliary',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER
  });
  const graph = new GPUCommandGraph(device, {id: 'frame-texture'});
  const frameColor = graph.importFrameTexture({
    id: 'frame-color',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    depth: 2,
    usage: Texture.RENDER
  });
  graph.importFrameTexture({
    id: 'frame-auxiliary',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER
  });
  graph.addRenderPass({
    id: 'render-frame',
    attachments: {
      colorAttachments: [
        graph.createTextureView(frameColor, {
          dimension: '2d',
          baseArrayLayer: 1,
          arrayLayerCount: 1
        })
      ]
    },
    compile: () => ({encode: () => {}})
  });
  const compiled = graph.compile();
  const resourceStats = device.statsManager.getStats('Resource Counts');
  const baselineFramebufferCount = resourceStats.get('Framebuffers Active').count;
  const baselineTextureViewCount = resourceStats.get('TextureViews Active').count;
  t.throws(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'missing-frame'}), {
        parameters: undefined
      }),
    /frame texture "frame-color" is required/,
    'frame-scoped imports have no persistent default'
  );
  const firstEncoder = device.createCommandEncoder({id: 'frame-0'});
  compiled.encode(firstEncoder, {
    parameters: undefined,
    frameTextures: {
      ['frame-color']: {texture: firstTexture, frameId: 0},
      ['frame-auxiliary']: {texture: auxiliaryTexture, frameId: 0}
    }
  });
  device.submit(firstEncoder.finish());
  t.equal(
    resourceStats.get('Framebuffers Active').count,
    baselineFramebufferCount + 1,
    'the first frame owns one cached framebuffer'
  );
  t.equal(
    resourceStats.get('TextureViews Active').count,
    baselineTextureViewCount + 1,
    'the first frame owns one non-default attachment view'
  );
  t.throws(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'stale-frame'}), {
        parameters: undefined,
        frameTextures: {
          ['frame-color']: {texture: firstTexture, frameId: 0},
          ['frame-auxiliary']: {texture: auxiliaryTexture, frameId: 0}
        }
      }),
    /frameId 0 is stale/,
    'a consumed frame ID cannot be reused'
  );
  t.throws(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'mixed-frame'}), {
        parameters: undefined,
        frameTextures: {
          ['frame-color']: {texture: secondTexture, frameId: 1},
          ['frame-auxiliary']: {texture: auxiliaryTexture, frameId: 2}
        }
      }),
    /must share one frameId/,
    'all frame-scoped imports in one encoding share a coherent frame ID'
  );
  const secondEncoder = device.createCommandEncoder({id: 'frame-1'});
  compiled.encode(secondEncoder, {
    parameters: undefined,
    frameTextures: {
      ['frame-color']: {texture: secondTexture, frameId: 1},
      ['frame-auxiliary']: {texture: auxiliaryTexture, frameId: 1}
    }
  });
  device.submit(secondEncoder.finish());
  t.equal(
    resourceStats.get('Framebuffers Active').count,
    baselineFramebufferCount + 1,
    'refreshing a frame view retires its stale framebuffer'
  );
  t.equal(
    resourceStats.get('TextureViews Active').count,
    baselineTextureViewCount + 1,
    'refreshing a frame view retires its stale texture view'
  );
  compiled.destroy();
  t.equal(
    resourceStats.get('Framebuffers Active').count,
    baselineFramebufferCount,
    'destroy releases the final cached framebuffer'
  );
  t.notOk(firstTexture.destroyed, 'first frame texture remains caller-owned');
  t.notOk(secondTexture.destroyed, 'replacement frame texture remains caller-owned');
  firstTexture.destroy();
  secondTexture.destroy();
  auxiliaryTexture.destroy();
  t.end();
});

test('GPUCommandGraph enforces sampled-only external texture frames', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const externalTextureSampler = device.createSampler({id: 'external-texture-test-sampler'});
  const makeExternalTexture = (id: string, width = 4, height = 4) => {
    return new TestExternalTexture(device, externalTextureSampler, id, width, height);
  };
  const firstExternalTexture = makeExternalTexture('external-frame-0');
  const secondExternalTexture = makeExternalTexture('external-frame-1');
  const wrongSizeExternalTexture = makeExternalTexture('external-wrong-size', 8, 4);
  const frameTexture = device.createTexture({
    id: 'external-frame-color',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER
  });
  const graph = new GPUCommandGraph(device, {id: 'external-texture'});
  t.throws(
    () => graph.importExternalTexture({id: 'invalid-video', width: 0, height: 4}),
    /positive safe integer/,
    'external texture descriptors require positive fixed dimensions'
  );
  const externalTexture = graph.importExternalTexture({id: 'video', width: 4, height: 4});
  const frameTextureHandle = graph.importFrameTexture({
    id: 'color',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER
  });
  const frameTextureView = graph.createTextureView(frameTextureHandle);
  const resolvedExternalTextures: unknown[] = [];
  t.throws(
    () =>
      graph.addComputePass({
        id: 'invalid-external-compute',
        resources: [{externalTexture, usage: 'sampled'}],
        compile: () => ({encode: () => {}})
      }),
    /only by render nodes/,
    'external texture bindings cannot leak into incompatible pass types'
  );
  graph.addRenderPass({
    id: 'sample-video',
    attachments: {colorAttachments: [frameTextureView]},
    resources: [{externalTexture, usage: 'sampled'}],
    compile: () => ({
      encode: ({getExternalTexture}) =>
        void resolvedExternalTextures.push(getExternalTexture(externalTexture))
    })
  });
  const compiled = graph.compile();
  const missingFrameEncoder = device.createCommandEncoder({id: 'missing-external-frame'});
  t.throws(
    () =>
      compiled.encode(missingFrameEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 0}}
      }),
    /external texture "video" is required/,
    'external texture imports have no persistent default'
  );
  missingFrameEncoder.destroy();
  const wrongSizeEncoder = device.createCommandEncoder({id: 'wrong-size-external-frame'});
  t.throws(
    () =>
      compiled.encode(wrongSizeEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 0}},
        externalTextures: {video: {texture: wrongSizeExternalTexture, frameId: 0}}
      }),
    /incompatible dimensions/,
    'external frame dimensions must match the compiled contract'
  );
  wrongSizeEncoder.destroy();
  const firstFrameEncoder = device.createCommandEncoder({id: 'external-frame-0'});
  compiled.encode(firstFrameEncoder, {
    parameters: undefined,
    frameTextures: {color: {texture: frameTexture, frameId: 0}},
    externalTextures: {video: {texture: firstExternalTexture, frameId: 0}}
  });
  firstFrameEncoder.destroy();
  t.equal(resolvedExternalTextures[0], firstExternalTexture, 'first frame resolves its snapshot');
  const reusedFrameEncoder = device.createCommandEncoder({id: 'reused-external-frame'});
  t.throws(
    () =>
      compiled.encode(reusedFrameEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 1}},
        externalTextures: {video: {texture: firstExternalTexture, frameId: 1}}
      }),
    /requires a fresh binding/,
    'the same opaque external binding cannot cross frame boundaries'
  );
  reusedFrameEncoder.destroy();
  const mixedFrameEncoder = device.createCommandEncoder({id: 'mixed-external-frame'});
  t.throws(
    () =>
      compiled.encode(mixedFrameEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 1}},
        externalTextures: {video: {texture: secondExternalTexture, frameId: 2}}
      }),
    /must share one frameId/,
    'ordinary and external frame imports share one coherent frame ID'
  );
  mixedFrameEncoder.destroy();
  const secondFrameEncoder = device.createCommandEncoder({id: 'external-frame-1'});
  compiled.encode(secondFrameEncoder, {
    parameters: undefined,
    frameTextures: {color: {texture: frameTexture, frameId: 1}},
    externalTextures: {video: {texture: secondExternalTexture, frameId: 1}}
  });
  secondFrameEncoder.destroy();
  t.equal(
    resolvedExternalTextures[1],
    secondExternalTexture,
    'the next frame resolves a fresh binding'
  );
  const nonconsecutiveReuseEncoder = device.createCommandEncoder({
    id: 'nonconsecutive-reused-external-frame'
  });
  t.throws(
    () =>
      compiled.encode(nonconsecutiveReuseEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 2}},
        externalTextures: {video: {texture: firstExternalTexture, frameId: 2}}
      }),
    /requires a fresh binding/,
    'an expired binding cannot be reused after an intervening frame'
  );
  nonconsecutiveReuseEncoder.destroy();
  compiled.destroy();
  t.notOk(firstExternalTexture.destroyed, 'compiled graph leaves external bindings caller-owned');
  t.notOk(secondExternalTexture.destroyed, 'replacement external binding remains caller-owned');
  firstExternalTexture.destroy();
  secondExternalTexture.destroy();
  wrongSizeExternalTexture.destroy();
  frameTexture.destroy();
  externalTextureSampler.destroy();
  t.end();
});

test('GPUCommandGraph tracks texture subresources and reuses compatible transients', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const disjointGraph = new GPUCommandGraph(device, {id: 'disjoint-subresources'});
  const disjointTexture = disjointGraph.createTransientTexture({
    id: 'mipped',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    mipLevels: 2,
    usage: Texture.STORAGE
  });
  const mipZero = disjointGraph.createTextureView(disjointTexture, {
    baseMipLevel: 0,
    mipLevelCount: 1
  });
  const mipOne = disjointGraph.createTextureView(disjointTexture, {
    baseMipLevel: 1,
    mipLevelCount: 1
  });
  disjointGraph.addComputePass({
    id: 'read-mip-one',
    dependsOn: ['write-mip-zero'],
    resources: [{texture: mipOne, usage: 'storage-read'}],
    compile: () => ({encode: () => {}})
  });
  disjointGraph.addComputePass({
    id: 'write-mip-zero',
    resources: [{texture: mipZero, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  const disjointCompiled = disjointGraph.compile();
  t.deepEqual(
    disjointCompiled.stats.nodeOrder,
    ['write-mip-zero', 'read-mip-one'],
    'disjoint subresources do not create a reverse hazard cycle'
  );
  disjointCompiled.destroy();

  const overlapGraph = new GPUCommandGraph(device, {id: 'overlap-subresources'});
  const overlapTexture = overlapGraph.createTransientTexture({
    id: 'mipped',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    mipLevels: 2,
    usage: Texture.STORAGE
  });
  const overlapMip = overlapGraph.createTextureView(overlapTexture, {
    baseMipLevel: 0,
    mipLevelCount: 1
  });
  overlapGraph.addComputePass({
    id: 'read',
    dependsOn: ['write'],
    resources: [{texture: overlapMip, usage: 'storage-read'}],
    compile: () => ({encode: () => {}})
  });
  overlapGraph.addComputePass({
    id: 'write',
    resources: [{texture: overlapMip, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  t.throws(() => overlapGraph.compile(), /dependency cycle/, 'overlapping view hazard is detected');

  const reuseGraph = new GPUCommandGraph(device, {id: 'texture-reuse'});
  const first = reuseGraph.createTransientTexture({
    id: 'first',
    format: 'rgba8unorm',
    width: 8,
    height: 8,
    usage: Texture.STORAGE | Texture.SAMPLE
  });
  const second = reuseGraph.createTransientTexture({
    id: 'second',
    format: 'rgba8unorm',
    width: 8,
    height: 8,
    usage: Texture.STORAGE | Texture.SAMPLE
  });
  reuseGraph.addComputePass({
    id: 'write-first',
    resources: [{texture: first, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  reuseGraph.addComputePass({
    id: 'read-first',
    resources: [{texture: first, usage: 'sampled'}],
    compile: () => ({encode: () => {}})
  });
  reuseGraph.addComputePass({
    id: 'write-second',
    dependsOn: ['read-first'],
    resources: [{texture: second, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  reuseGraph.addComputePass({
    id: 'read-second',
    resources: [{texture: second, usage: 'sampled'}],
    compile: () => ({encode: () => {}})
  });
  const reused = reuseGraph.compile();
  t.equal(reused.stats.logicalTransientTextureCount, 2, 'two logical textures are tracked');
  t.equal(reused.stats.physicalTransientTextureCount, 1, 'compatible lifetimes share texture');
  t.equal(reused.stats.logicalTextureCount, 2, 'logical texture count includes both transients');
  t.equal(reused.stats.logicalTextureBytes, 512, 'logical texture bytes include both transients');
  t.equal(
    reused.stats.physicalTransientResourceBytes,
    256,
    'owned transient memory reflects physical texture reuse'
  );
  t.ok(reused.stats.reusedTransientTextureBytes > 0, 'texture reuse reports saved bytes');
  reused.destroy();
  t.end();
});

test('GPUCommandGraph composes storage texture output with sampled rendering', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'storage-sampled'});
  const storageTexture = graph.createTransientTexture({
    id: 'storage',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.STORAGE | Texture.SAMPLE
  });
  const outputTexture = device.createTexture({
    id: 'sampled-output',
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const outputHandle = graph.importTexture(
    {
      id: 'output',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      usage: outputTexture.props.usage
    },
    outputTexture
  );
  const storageView = graph.createTextureView(storageTexture);
  const outputView = graph.createTextureView(outputHandle);
  graph.addComputePass({
    id: 'write-storage',
    resources: [{texture: storageView, usage: 'storage-write'}],
    compile: ({device: compileDevice}) => {
      const computation = new Computation(compileDevice, {
        id: 'write-storage-computation',
        source: `@group(0) @binding(0) var image: texture_storage_2d<rgba8unorm, write>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  textureStore(image, vec2<i32>(id.xy), vec4<f32>(1.0, 0.25, 0.0, 1.0));
}`,
        shaderLayout: {
          bindings: [
            {
              name: 'image',
              type: 'storage',
              group: 0,
              location: 0,
              access: 'write-only',
              format: 'rgba8unorm'
            }
          ]
        }
      });
      return {
        encode: ({computePass, getTextureView}) => {
          computation.setBindings({image: getTextureView(storageView)});
          computation.dispatch(computePass, 4, 4, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
  graph.addRenderPass({
    id: 'sample-storage',
    attachments: {colorAttachments: [outputView]},
    resources: [{texture: storageView, usage: 'sampled'}],
    compile: ({device: compileDevice}) => {
      const model = new Model(compileDevice, {
        id: 'sample-storage-model',
        source: `@group(0) @binding(0) var image: texture_2d<f32>;
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  return vec4(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  return textureLoad(image, vec2<i32>(position.xy), 0);
}`,
        vertexCount: 3,
        colorAttachmentFormats: ['rgba8unorm'],
        shaderLayout: {
          attributes: [],
          bindings: [
            {
              name: 'image',
              type: 'texture',
              group: 0,
              location: 0,
              sampleType: 'float'
            }
          ]
        }
      });
      return {
        encode: ({renderPass, getTextureView}) => {
          model.setBindings({image: getTextureView(storageView)});
          model.draw(renderPass);
        },
        destroy: () => model.destroy()
      };
    }
  });
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'storage-sampled'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const pixels = await readPixels(outputTexture, 4, 4);
  t.ok(pixels[0] > 240 && pixels[1] > 50, 'sampled render observes storage texture writes');
  compiled.destroy();
  t.notOk(outputTexture.destroyed, 'imported output texture remains caller-owned');
  outputTexture.destroy();
  t.end();
});

test('GPUIndexPickingTarget renders stable integer IDs and copies dynamic pixels', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const defaultReadback = makePickingReadbackBuffer(device, 'picking-readback-default');
  const graph = new GPUCommandGraph<{pixel: readonly [number, number]}>(device, {
    id: 'index-picking'
  });
  const target = new GPUIndexPickingTarget(graph, {
    id: 'pick',
    width: 4,
    height: 4,
    readbackBuffer: defaultReadback
  });
  graph.addRenderPass({
    id: 'pick-render',
    attachments: target.attachments,
    compile: ({device: compileDevice}) => {
      const model = new Model(compileDevice, {
        id: 'index-picking-model',
        source: `struct FragmentOutputs {
  @location(0) color: vec4<f32>,
  @location(1) indices: vec2<i32>,
};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  return vec4(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> FragmentOutputs {
  if (position.y >= 3.0) { discard; }
  var output: FragmentOutputs;
  output.color = vec4(0.0);
  output.indices = vec2<i32>(
    select(7, 9, position.x >= 2.0),
    select(-1, 3, position.x >= 2.0)
  );
  return output;
}`,
        vertexCount: 3,
        colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
        depthStencilAttachmentFormat: 'depth24plus'
      });
      return {
        getRenderPassProps: () => target.renderPassProps,
        encode: ({renderPass}) => model.draw(renderPass),
        destroy: () => model.destroy()
      };
    }
  });
  target.addReadbackPass({after: 'pick-render', getPixel: parameters => parameters.pixel});
  const compiled = graph.compile();
  await encodePick(device, compiled, [0, 0]);
  t.deepEqual(
    decodeGPUIndexPickInfo(await defaultReadback.readAsync(0, 8)),
    {objectIndex: 7, batchIndex: null},
    'left pixel preserves a stable object without a batch ID'
  );
  const replacementReadback = makePickingReadbackBuffer(device, 'picking-readback-replacement');
  await encodePick(device, compiled, [3, 0], replacementReadback, target.readback.id);
  t.deepEqual(
    decodeGPUIndexPickInfo(await replacementReadback.readAsync(0, 8)),
    {objectIndex: 9, batchIndex: 3},
    'per-encoding staging override returns second stable ID'
  );
  const backgroundReadback = makePickingReadbackBuffer(device, 'picking-readback-background');
  await encodePick(device, compiled, [1, 3], backgroundReadback, target.readback.id);
  t.deepEqual(
    decodeGPUIndexPickInfo(await backgroundReadback.readAsync(0, 8)),
    {objectIndex: null, batchIndex: null},
    'cleared background decodes to no pick'
  );
  t.throws(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'picking-out-of-range'}), {
        parameters: {pixel: [4, 0]}
      }),
    /outside 4x4 target/,
    'out-of-range dynamic pixel is rejected'
  );
  compiled.destroy();
  t.notOk(defaultReadback.destroyed, 'compiled graph preserves caller-owned staging buffer');
  defaultReadback.destroy();
  replacementReadback.destroy();
  backgroundReadback.destroy();
  t.end();
});

test('GPUIndexPickingTarget reduces regions through a reusable readback ring', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const capacity = 6;
  const resultByteLength = (2 + capacity * 2) * Uint32Array.BYTES_PER_ELEMENT;
  const regionBuffer = device.createBuffer({
    id: 'picking-region',
    data: new Uint32Array([0, 0, 4, 4]),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const resultBuffer = device.createBuffer({
    id: 'picking-region-result',
    byteLength: resultByteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'index-region-picking'});
  const regionHandle = graph.importBuffer(
    {id: 'region', byteLength: regionBuffer.byteLength, usage: Buffer.STORAGE},
    regionBuffer
  );
  const resultHandle = graph.importBuffer(
    {
      id: 'region-result',
      byteLength: resultBuffer.byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    },
    resultBuffer
  );
  const target = new GPUIndexPickingTarget(graph, {id: 'pick-region', width: 4, height: 4});
  graph.addRenderPass({
    id: 'pick-region-render',
    attachments: target.attachments,
    compile: ({device: compileDevice}) => {
      const model = new Model(compileDevice, {
        id: 'index-region-picking-model',
        source: `struct FragmentOutputs {
  @location(0) color: vec4<f32>,
  @location(1) indices: vec2<i32>,
};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  return vec4(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> FragmentOutputs {
  if (position.y >= 3.0) { discard; }
  var output: FragmentOutputs;
  output.color = vec4(0.0);
  output.indices = vec2<i32>(
    select(7, 9, position.x >= 2.0),
    select(-1, 3, position.x >= 2.0)
  );
  return output;
}`,
        vertexCount: 3,
        colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
        depthStencilAttachmentFormat: 'depth24plus'
      });
      return {
        getRenderPassProps: () => target.renderPassProps,
        encode: ({renderPass}) => model.draw(renderPass),
        destroy: () => model.destroy()
      };
    }
  });
  target.addRegionPass({
    after: 'pick-region-render',
    region: graph.createDataView(regionHandle, {format: 'uint32', length: 4}),
    result: graph.createDataView(resultHandle, {
      format: 'uint32',
      length: resultByteLength / Uint32Array.BYTES_PER_ELEMENT
    })
  });
  const compiled = graph.compile();
  const ring = new GPUReadbackRing(device, {
    id: 'picking-region-readback',
    byteLength: resultByteLength,
    slotCount: 2
  });

  const firstTicket = ring.tryAcquire();
  const reservedTicket = ring.tryAcquire();
  t.ok(firstTicket && reservedTicket, 'all configured staging slots can be reserved');
  t.equal(ring.tryAcquire(), null, 'tryAcquire exposes drop-on-pressure policy');
  const waitingTicketPromise = ring.acquire();
  reservedTicket?.cancel();
  const waitingTicket = await waitingTicketPromise;
  t.ok(waitingTicket, 'acquire waits for the next released slot');
  waitingTicket.cancel();

  const firstEncoder = device.createCommandEncoder({id: 'pick-region-first'});
  compiled.encode(firstEncoder, {parameters: undefined});
  firstTicket?.copyFrom(firstEncoder, resultBuffer);
  device.submit(firstEncoder.finish());
  const firstResult = decodeGPUIndexPickRegion(await firstTicket!.read());
  t.equal(firstResult.count, 12, 'count includes every non-background covered pixel');
  t.equal(firstResult.picks.length, capacity, 'stored pairs stop at caller capacity');
  t.ok(firstResult.overflow, 'overflow reports truncated results');
  t.ok(
    firstResult.picks.every(
      pick =>
        (pick.objectIndex === 7 && pick.batchIndex === null) ||
        (pick.objectIndex === 9 && pick.batchIndex === 3)
    ),
    'stable object IDs survive collection with optional batch IDs'
  );

  regionBuffer.write(new Uint32Array([0, 0, 2, 3]));
  const exactTicket = ring.tryAcquire();
  const exactEncoder = device.createCommandEncoder({id: 'pick-region-exact-capacity'});
  compiled.encode(exactEncoder, {parameters: undefined});
  exactTicket?.copyFrom(exactEncoder, resultBuffer);
  device.submit(exactEncoder.finish());
  const exactResult = decodeGPUIndexPickRegion(await exactTicket!.read());
  t.equal(exactResult.count, capacity, 'exact-capacity selection reports the complete count');
  t.equal(exactResult.picks.length, capacity, 'exact-capacity selection stores every pair');
  t.notOk(exactResult.overflow, 'exact capacity does not report overflow');

  regionBuffer.write(new Uint32Array([0, 0, 0, 3]));
  const emptyTicket = ring.tryAcquire();
  const emptyEncoder = device.createCommandEncoder({id: 'pick-region-empty'});
  compiled.encode(emptyEncoder, {parameters: undefined});
  emptyTicket?.copyFrom(emptyEncoder, resultBuffer);
  device.submit(emptyEncoder.finish());
  t.deepEqual(
    decodeGPUIndexPickRegion(await emptyTicket!.read()),
    {picks: [], count: 0, overflow: false},
    'empty rectangles clear prior results'
  );

  regionBuffer.write(new Uint32Array([0, 0, 1, 1]));
  const secondTicket = ring.tryAcquire();
  t.ok(secondTicket, 'mapped slot is reusable after read completion');
  const secondEncoder = device.createCommandEncoder({id: 'pick-region-second'});
  compiled.encode(secondEncoder, {parameters: undefined});
  secondTicket?.copyFrom(secondEncoder, resultBuffer);
  device.submit(secondEncoder.finish());
  t.deepEqual(
    decodeGPUIndexPickRegion(await secondTicket!.read()),
    {picks: [{objectIndex: 7, batchIndex: null}], count: 1, overflow: false},
    'GPU-resident rectangle updates produce exact results without rebuilding the graph'
  );

  const heldTicket = ring.tryAcquire();
  const cancelledTicket = ring.tryAcquire();
  const overlapEncoder = device.createCommandEncoder({id: 'pick-region-overlapping-readbacks'});
  heldTicket?.copyFrom(overlapEncoder, resultBuffer);
  cancelledTicket?.copyFrom(overlapEncoder, resultBuffer);
  device.submit(overlapEncoder.finish());
  const cancelledRead = cancelledTicket!.read().then(
    () => '',
    error => String(error)
  );
  cancelledTicket?.cancel();
  t.match(
    await cancelledRead,
    /cancelled/,
    'in-progress cancellation drains and discards its slot'
  );
  t.equal(
    ring.availableSlotCount,
    1,
    'a later ticket can complete while an earlier encoded ticket remains reserved'
  );
  await heldTicket?.read();
  t.equal(ring.availableSlotCount, 2, 'out-of-order completion eventually releases every slot');

  const pendingTicket = ring.tryAcquire();
  const secondPendingTicket = ring.tryAcquire();
  const rejectedWaiter = ring.acquire();
  const rejectionMessage = rejectedWaiter.then(
    () => '',
    error => String(error)
  );
  ring.destroy();
  t.match(await rejectionMessage, /destroyed/, 'destroy rejects pending backpressure waiters');
  pendingTicket?.cancel();
  secondPendingTicket?.cancel();
  compiled.destroy();
  regionBuffer.destroy();
  resultBuffer.destroy();
  t.end();
});

function makePickingReadbackBuffer(device: Device, id: string): Buffer {
  return device.createBuffer({
    id,
    byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
}

async function encodePick(
  device: Device,
  compiled: ReturnType<GPUCommandGraph<{pixel: readonly [number, number]}>['compile']>,
  pixel: readonly [number, number],
  readbackBuffer?: Buffer,
  readbackId?: string
): Promise<void> {
  const commandEncoder = device.createCommandEncoder({id: `pick-${pixel[0]}-${pixel[1]}`});
  compiled.encode(commandEncoder, {
    parameters: {pixel},
    ...(readbackBuffer && readbackId ? {buffers: {[readbackId]: readbackBuffer}} : {})
  });
  device.submit(commandEncoder.finish());
}

async function readPixels(texture: Texture, width: number, height: number): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, buffer);
    const paddedPixels = await buffer.readAsync(0, layout.byteLength);
    const pixels = new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++) {
      pixels.set(
        new Uint8Array(
          paddedPixels.buffer,
          paddedPixels.byteOffset + row * layout.bytesPerRow,
          width * 4
        ),
        row * width * 4
      );
    }
    return pixels;
  } finally {
    buffer.destroy();
  }
}

test('GPUCommandGraph rejects texture imports from another device', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const nullDevice = await getNullTestDevice();
  const wrongDeviceTexture = nullDevice.createTexture({
    width: 4,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  const graph = new GPUCommandGraph(device);
  t.throws(
    () =>
      graph.importTexture(
        {
          id: 'wrong-device',
          width: 4,
          height: 4,
          format: 'rgba8unorm',
          usage: Texture.SAMPLE
        },
        wrongDeviceTexture
      ),
    /another device/,
    'wrong-device texture import is rejected'
  );
  wrongDeviceTexture.destroy();
  t.end();
});
