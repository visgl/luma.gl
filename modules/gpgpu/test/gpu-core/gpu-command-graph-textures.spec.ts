import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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

it('GPUCommandGraph validates texture descriptors, views, and imports', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'texture-validation'});
  expect(
    () =>
      graph.createTransientTexture({
        id: 'invalid-size',
        format: 'rgba8unorm',
        width: 0,
        height: 4,
        usage: Texture.RENDER
      }),
    'zero texture extent is rejected'
  ).toThrow(/positive safe integer/);
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
  expect(mipTwo.width, 'view width reflects base mip').toBe(2);
  expect(mipTwo.height, 'view height reflects base mip').toBe(2);
  expect(
    () => graph.createTextureView(mipTexture, {baseMipLevel: 4, mipLevelCount: 1}),
    'view outside mip range is rejected'
  ).toThrow(/exceeds.*mip levels/);
  expect(
    () =>
      graph.addComputePass({
        id: 'wrong-usage',
        resources: [{texture: mipTwo, usage: 'render-attachment'}],
        compile: () => ({encode: () => {}})
      }),
    'node texture role must be declared by the descriptor'
  ).toThrow(/does not declare usage/);

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
  expect(compiled.stats.importedTextureCount, 'imported texture count is reported').toBe(1);
  expect(compiled.stats.importedTextureBytes, 'imported texture bytes are estimated').toBe(64);
  expect(compiled.stats.logicalTextureCount, 'logical texture count includes imports').toBe(1);
  expect(compiled.stats.logicalTextureBytes, 'logical texture bytes include imports').toBe(64);
  expect(compiled.stats.logicalResourceBytes, 'logical resource bytes include textures').toBe(64);
  expect(
    compiled.stats.physicalTransientResourceBytes,
    'imported textures are excluded from owned transient memory'
  ).toBe(0);
  compiled.encode(device.createCommandEncoder({id: 'texture-import-first'}), {
    parameters: undefined
  });
  compiled.encode(device.createCommandEncoder({id: 'texture-import-second'}), {
    parameters: undefined
  });
  expect(resolvedViews[0], 'concrete texture view is cached across encodes').toBe(resolvedViews[1]);
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
  expect(resolvedViews[1], 'replacement texture resolves a distinct view').not.toBe(
    resolvedViews[2]
  );
  const wrongSize = device.createTexture({
    id: 'wrong-size-texture',
    width: 8,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE
  });
  expect(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'texture-import-invalid'}), {
        parameters: undefined,
        textures: {imported: wrongSize}
      }),
    'fixed-size import rejects resized replacement'
  ).toThrow(/incompatible width/);
  compiled.destroy();
  expect(Boolean(importedTexture.destroyed), 'compiled graph leaves imported texture alive').toBe(
    false
  );
  importedTexture.destroy();
  replacement.destroy();
  wrongSize.destroy();
});

it('GPUCommandGraph resolves multisampled color attachments', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    Boolean(pixels[0] > 240 && pixels[1] < 10 && pixels[2] < 10),
    'multisampled clear resolves into the declared single-sample target'
  ).toBe(true);
  compiled.destroy();
  expect(Boolean(resolvedTexture.destroyed), 'resolve target remains caller-owned').toBe(false);
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
  expect(
    () =>
      invalidGraph.addRenderPass({
        id: 'invalid-resolve-pass',
        attachments: {
          colorAttachments: [invalidGraph.createTextureView(singleSample)],
          resolveTargets: [invalidGraph.createTextureView(invalidTarget)]
        },
        compile: () => ({encode: () => {}})
      }),
    'single-sample sources cannot declare resolve targets'
  ).toThrow(/match a multisampled source and be single-sampled/);
});

it('GPUCommandGraph redirects reusable render passes to caller-owned framebuffers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(
    Array.from((await readPixels(firstTexture, 4, 4)).subarray(0, 4)),
    'the first offscreen framebuffer receives only its own render pass'
  ).toEqual([255, 0, 0, 255]);
  expect(
    Array.from((await readPixels(secondTexture, 4, 4)).subarray(0, 4)),
    'the next encoding can target a different caller-owned framebuffer'
  ).toEqual([0, 255, 0, 255]);
  expect(compilationCount, 'changing the target does not recompile the render executable').toBe(1);
  expect(encodingCount, 'the same compiled render executable records both frames').toBe(2);

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
  expect(
    () =>
      conflictingCompiled.encode(device.createCommandEncoder({id: 'conflicting-encoding'}), {
        parameters: undefined
      }),
    'graph-managed attachments cannot be replaced by a callback-supplied framebuffer'
  ).toThrow(/cannot supply framebuffer with graph attachments/);

  conflictingCompiled.destroy();
  compiled.destroy();
  expect(Boolean(firstFramebuffer.destroyed), 'the first framebuffer remains caller-owned').toBe(
    false
  );
  expect(
    Boolean(secondFramebuffer.destroyed),
    'the replacement framebuffer remains caller-owned'
  ).toBe(false);
  expect(
    Boolean(firstTexture.destroyed),
    'the first framebuffer texture remains caller-owned'
  ).toBe(false);
  expect(
    Boolean(secondTexture.destroyed),
    'the replacement framebuffer texture remains caller-owned'
  ).toBe(false);
  firstFramebuffer.destroy();
  secondFramebuffer.destroy();
  firstTexture.destroy();
  secondTexture.destroy();
});

it('GPUCommandGraph enforces frame-scoped texture bindings', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'missing-frame'}), {
        parameters: undefined
      }),
    'frame-scoped imports have no persistent default'
  ).toThrow(/frame texture "frame-color" is required/);
  const firstEncoder = device.createCommandEncoder({id: 'frame-0'});
  compiled.encode(firstEncoder, {
    parameters: undefined,
    frameTextures: {
      ['frame-color']: {texture: firstTexture, frameId: 0},
      ['frame-auxiliary']: {texture: auxiliaryTexture, frameId: 0}
    }
  });
  device.submit(firstEncoder.finish());
  expect(
    resourceStats.get('Framebuffers Active').count,
    'the first frame owns one cached framebuffer'
  ).toBe(baselineFramebufferCount + 1);
  expect(
    resourceStats.get('TextureViews Active').count,
    'the first frame owns one non-default attachment view'
  ).toBe(baselineTextureViewCount + 1);
  expect(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'stale-frame'}), {
        parameters: undefined,
        frameTextures: {
          ['frame-color']: {texture: firstTexture, frameId: 0},
          ['frame-auxiliary']: {texture: auxiliaryTexture, frameId: 0}
        }
      }),
    'a consumed frame ID cannot be reused'
  ).toThrow(/frameId 0 is stale/);
  expect(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'mixed-frame'}), {
        parameters: undefined,
        frameTextures: {
          ['frame-color']: {texture: secondTexture, frameId: 1},
          ['frame-auxiliary']: {texture: auxiliaryTexture, frameId: 2}
        }
      }),
    'all frame-scoped imports in one encoding share a coherent frame ID'
  ).toThrow(/must share one frameId/);
  const secondEncoder = device.createCommandEncoder({id: 'frame-1'});
  compiled.encode(secondEncoder, {
    parameters: undefined,
    frameTextures: {
      ['frame-color']: {texture: secondTexture, frameId: 1},
      ['frame-auxiliary']: {texture: auxiliaryTexture, frameId: 1}
    }
  });
  device.submit(secondEncoder.finish());
  expect(
    resourceStats.get('Framebuffers Active').count,
    'refreshing a frame view retires its stale framebuffer'
  ).toBe(baselineFramebufferCount + 1);
  expect(
    resourceStats.get('TextureViews Active').count,
    'refreshing a frame view retires its stale texture view'
  ).toBe(baselineTextureViewCount + 1);
  compiled.destroy();
  expect(
    resourceStats.get('Framebuffers Active').count,
    'destroy releases the final cached framebuffer'
  ).toBe(baselineFramebufferCount);
  expect(Boolean(firstTexture.destroyed), 'first frame texture remains caller-owned').toBe(false);
  expect(Boolean(secondTexture.destroyed), 'replacement frame texture remains caller-owned').toBe(
    false
  );
  firstTexture.destroy();
  secondTexture.destroy();
  auxiliaryTexture.destroy();
});

it('GPUCommandGraph enforces sampled-only external texture frames', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    () => graph.importExternalTexture({id: 'invalid-video', width: 0, height: 4}),
    'external texture descriptors require positive fixed dimensions'
  ).toThrow(/positive safe integer/);
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
  expect(
    () =>
      graph.addComputePass({
        id: 'invalid-external-compute',
        resources: [{externalTexture, usage: 'sampled'}],
        compile: () => ({encode: () => {}})
      }),
    'external texture bindings cannot leak into incompatible pass types'
  ).toThrow(/only by render nodes/);
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
  expect(
    () =>
      compiled.encode(missingFrameEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 0}}
      }),
    'external texture imports have no persistent default'
  ).toThrow(/external texture "video" is required/);
  missingFrameEncoder.destroy();
  const wrongSizeEncoder = device.createCommandEncoder({id: 'wrong-size-external-frame'});
  expect(
    () =>
      compiled.encode(wrongSizeEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 0}},
        externalTextures: {video: {texture: wrongSizeExternalTexture, frameId: 0}}
      }),
    'external frame dimensions must match the compiled contract'
  ).toThrow(/incompatible dimensions/);
  wrongSizeEncoder.destroy();
  const firstFrameEncoder = device.createCommandEncoder({id: 'external-frame-0'});
  compiled.encode(firstFrameEncoder, {
    parameters: undefined,
    frameTextures: {color: {texture: frameTexture, frameId: 0}},
    externalTextures: {video: {texture: firstExternalTexture, frameId: 0}}
  });
  firstFrameEncoder.destroy();
  expect(resolvedExternalTextures[0], 'first frame resolves its snapshot').toBe(
    firstExternalTexture
  );
  const reusedFrameEncoder = device.createCommandEncoder({id: 'reused-external-frame'});
  expect(
    () =>
      compiled.encode(reusedFrameEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 1}},
        externalTextures: {video: {texture: firstExternalTexture, frameId: 1}}
      }),
    'the same opaque external binding cannot cross frame boundaries'
  ).toThrow(/requires a fresh binding/);
  reusedFrameEncoder.destroy();
  const mixedFrameEncoder = device.createCommandEncoder({id: 'mixed-external-frame'});
  expect(
    () =>
      compiled.encode(mixedFrameEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 1}},
        externalTextures: {video: {texture: secondExternalTexture, frameId: 2}}
      }),
    'ordinary and external frame imports share one coherent frame ID'
  ).toThrow(/must share one frameId/);
  mixedFrameEncoder.destroy();
  const secondFrameEncoder = device.createCommandEncoder({id: 'external-frame-1'});
  compiled.encode(secondFrameEncoder, {
    parameters: undefined,
    frameTextures: {color: {texture: frameTexture, frameId: 1}},
    externalTextures: {video: {texture: secondExternalTexture, frameId: 1}}
  });
  secondFrameEncoder.destroy();
  expect(resolvedExternalTextures[1], 'the next frame resolves a fresh binding').toBe(
    secondExternalTexture
  );
  const nonconsecutiveReuseEncoder = device.createCommandEncoder({
    id: 'nonconsecutive-reused-external-frame'
  });
  expect(
    () =>
      compiled.encode(nonconsecutiveReuseEncoder, {
        parameters: undefined,
        frameTextures: {color: {texture: frameTexture, frameId: 2}},
        externalTextures: {video: {texture: firstExternalTexture, frameId: 2}}
      }),
    'an expired binding cannot be reused after an intervening frame'
  ).toThrow(/requires a fresh binding/);
  nonconsecutiveReuseEncoder.destroy();
  compiled.destroy();
  expect(
    Boolean(firstExternalTexture.destroyed),
    'compiled graph leaves external bindings caller-owned'
  ).toBe(false);
  expect(
    Boolean(secondExternalTexture.destroyed),
    'replacement external binding remains caller-owned'
  ).toBe(false);
  firstExternalTexture.destroy();
  secondExternalTexture.destroy();
  wrongSizeExternalTexture.destroy();
  frameTexture.destroy();
  externalTextureSampler.destroy();
});

it('GPUCommandGraph tracks texture subresources and reuses compatible transients', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    disjointCompiled.stats.nodeOrder,
    'disjoint subresources do not create a reverse hazard cycle'
  ).toEqual(['write-mip-zero', 'read-mip-one']);
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
  expect(() => overlapGraph.compile(), 'overlapping view hazard is detected').toThrow(
    /dependency cycle/
  );

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
  expect(reused.stats.logicalTransientTextureCount, 'two logical textures are tracked').toBe(2);
  expect(reused.stats.physicalTransientTextureCount, 'compatible lifetimes share texture').toBe(1);
  expect(reused.stats.logicalTextureCount, 'logical texture count includes both transients').toBe(
    2
  );
  expect(reused.stats.logicalTextureBytes, 'logical texture bytes include both transients').toBe(
    512
  );
  expect(
    reused.stats.physicalTransientResourceBytes,
    'owned transient memory reflects physical texture reuse'
  ).toBe(256);
  expect(
    Boolean(reused.stats.reusedTransientTextureBytes > 0),
    'texture reuse reports saved bytes'
  ).toBe(true);
  reused.destroy();
});

it('GPUCommandGraph composes storage texture output with sampled rendering', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    Boolean(pixels[0] > 240 && pixels[1] > 50),
    'sampled render observes storage texture writes'
  ).toBe(true);
  compiled.destroy();
  expect(Boolean(outputTexture.destroyed), 'imported output texture remains caller-owned').toBe(
    false
  );
  outputTexture.destroy();
});

it('GPUIndexPickingTarget renders stable integer IDs and copies dynamic pixels', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    decodeGPUIndexPickInfo(await defaultReadback.readAsync(0, 8)),
    'left pixel preserves a stable object without a batch ID'
  ).toEqual({objectIndex: 7, batchIndex: null});
  const replacementReadback = makePickingReadbackBuffer(device, 'picking-readback-replacement');
  await encodePick(device, compiled, [3, 0], replacementReadback, target.readback.id);
  expect(
    decodeGPUIndexPickInfo(await replacementReadback.readAsync(0, 8)),
    'per-encoding staging override returns second stable ID'
  ).toEqual({objectIndex: 9, batchIndex: 3});
  const backgroundReadback = makePickingReadbackBuffer(device, 'picking-readback-background');
  await encodePick(device, compiled, [1, 3], backgroundReadback, target.readback.id);
  expect(
    decodeGPUIndexPickInfo(await backgroundReadback.readAsync(0, 8)),
    'cleared background decodes to no pick'
  ).toEqual({objectIndex: null, batchIndex: null});
  expect(
    () =>
      compiled.encode(device.createCommandEncoder({id: 'picking-out-of-range'}), {
        parameters: {pixel: [4, 0]}
      }),
    'out-of-range dynamic pixel is rejected'
  ).toThrow(/outside 4x4 target/);
  compiled.destroy();
  expect(
    Boolean(defaultReadback.destroyed),
    'compiled graph preserves caller-owned staging buffer'
  ).toBe(false);
  defaultReadback.destroy();
  replacementReadback.destroy();
  backgroundReadback.destroy();
});

it('GPUIndexPickingTarget reduces regions through a reusable readback ring', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    Boolean(firstTicket && reservedTicket),
    'all configured staging slots can be reserved'
  ).toBe(true);
  expect(ring.tryAcquire(), 'tryAcquire exposes drop-on-pressure policy').toBe(null);
  const waitingTicketPromise = ring.acquire();
  reservedTicket?.cancel();
  const waitingTicket = await waitingTicketPromise;
  expect(Boolean(waitingTicket), 'acquire waits for the next released slot').toBe(true);
  waitingTicket.cancel();

  const firstEncoder = device.createCommandEncoder({id: 'pick-region-first'});
  compiled.encode(firstEncoder, {parameters: undefined});
  firstTicket?.copyFrom(firstEncoder, resultBuffer);
  device.submit(firstEncoder.finish());
  const firstResult = decodeGPUIndexPickRegion(await firstTicket!.read());
  expect(firstResult.count, 'count includes every non-background covered pixel').toBe(12);
  expect(firstResult.picks.length, 'stored pairs stop at caller capacity').toBe(capacity);
  expect(Boolean(firstResult.overflow), 'overflow reports truncated results').toBe(true);
  expect(
    Boolean(
      firstResult.picks.every(
        pick =>
          (pick.objectIndex === 7 && pick.batchIndex === null) ||
          (pick.objectIndex === 9 && pick.batchIndex === 3)
      )
    ),
    'stable object IDs survive collection with optional batch IDs'
  ).toBe(true);

  regionBuffer.write(new Uint32Array([0, 0, 2, 3]));
  const exactTicket = ring.tryAcquire();
  const exactEncoder = device.createCommandEncoder({id: 'pick-region-exact-capacity'});
  compiled.encode(exactEncoder, {parameters: undefined});
  exactTicket?.copyFrom(exactEncoder, resultBuffer);
  device.submit(exactEncoder.finish());
  const exactResult = decodeGPUIndexPickRegion(await exactTicket!.read());
  expect(exactResult.count, 'exact-capacity selection reports the complete count').toBe(capacity);
  expect(exactResult.picks.length, 'exact-capacity selection stores every pair').toBe(capacity);
  expect(Boolean(exactResult.overflow), 'exact capacity does not report overflow').toBe(false);

  regionBuffer.write(new Uint32Array([0, 0, 0, 3]));
  const emptyTicket = ring.tryAcquire();
  const emptyEncoder = device.createCommandEncoder({id: 'pick-region-empty'});
  compiled.encode(emptyEncoder, {parameters: undefined});
  emptyTicket?.copyFrom(emptyEncoder, resultBuffer);
  device.submit(emptyEncoder.finish());
  expect(
    decodeGPUIndexPickRegion(await emptyTicket!.read()),
    'empty rectangles clear prior results'
  ).toEqual({picks: [], count: 0, overflow: false});

  regionBuffer.write(new Uint32Array([0, 0, 1, 1]));
  const secondTicket = ring.tryAcquire();
  expect(Boolean(secondTicket), 'mapped slot is reusable after read completion').toBe(true);
  const secondEncoder = device.createCommandEncoder({id: 'pick-region-second'});
  compiled.encode(secondEncoder, {parameters: undefined});
  secondTicket?.copyFrom(secondEncoder, resultBuffer);
  device.submit(secondEncoder.finish());
  expect(
    decodeGPUIndexPickRegion(await secondTicket!.read()),
    'GPU-resident rectangle updates produce exact results without rebuilding the graph'
  ).toEqual({picks: [{objectIndex: 7, batchIndex: null}], count: 1, overflow: false});

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
  expect(await cancelledRead, 'in-progress cancellation drains and discards its slot').toMatch(
    /cancelled/
  );
  expect(
    ring.availableSlotCount,
    'a later ticket can complete while an earlier encoded ticket remains reserved'
  ).toBe(1);
  await heldTicket?.read();
  expect(ring.availableSlotCount, 'out-of-order completion eventually releases every slot').toBe(2);

  const pendingTicket = ring.tryAcquire();
  const secondPendingTicket = ring.tryAcquire();
  const rejectedWaiter = ring.acquire();
  const rejectionMessage = rejectedWaiter.then(
    () => '',
    error => String(error)
  );
  ring.destroy();
  expect(await rejectionMessage, 'destroy rejects pending backpressure waiters').toMatch(
    /destroyed/
  );
  pendingTicket?.cancel();
  secondPendingTicket?.cancel();
  compiled.destroy();
  regionBuffer.destroy();
  resultBuffer.destroy();
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

it('GPUCommandGraph rejects texture imports from another device', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
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
    'wrong-device texture import is rejected'
  ).toThrow(/another device/);
  wrongDeviceTexture.destroy();
});
