// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  appendEffects,
  effectOperationLowering,
  hdrBloom,
  ssaoEffect,
  sepiaEffect
} from '@luma.gl/engine/effects';
import {GPUGraph, gpuGraph} from '@luma.gl/graph';
import type {GPUOperation, GPUOperationLowering} from '@luma.gl/graph/gpu-core';

/** Small MRT scene whose color, encoded view normal and depth remain graph values. */
const sceneSource = /* wgsl */ `
struct SceneOutputs {
  @location(0) color: vec4f,
  @location(1) normal: vec4f,
  @builtin(frag_depth) depth: f32,
}
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let corners = array<vec2f, 3>(vec2f(-1., -1.), vec2f(3., -1.), vec2f(-1., 3.));
  return vec4f(corners[index], 0., 1.);
}
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> SceneOutputs {
  let bright = select(0.12, 0.9, position.x < 4.);
  return SceneOutputs(vec4f(bright, 0.2, 0.1, 1.), vec4f(0.5, 0.5, 1., 1.), 0.6);
}`;

const extent = {width: 8, height: 8};
const scene = {
  id: 'scene',
  type: 'test-scene',
  contract: {
    values: ['color', 'normal', 'depth'].map(value => ({
      value,
      access: 'write' as const,
      textureUsage: 'render-attachment' as const
    })),
    outputs: {
      color: gpuGraph.texture({format: 'rgba8unorm', extent}),
      normal: gpuGraph.texture({format: 'rgba8unorm', extent}),
      depth: gpuGraph.texture({format: 'depth32float', extent})
    }
  }
} satisfies GPUOperation;

const sceneLowering = {
  type: scene.type,
  lower: (_operation, context) => {
    context.graph.addRenderPass({
      id: scene.id,
      attachments: {
        colorAttachments: [
          context.resolveTextureView('color'),
          context.resolveTextureView('normal')
        ],
        depthStencilAttachment: context.resolveTextureView('depth')
      },
      compile: ({device}) => {
        const vs = device.createShader({stage: 'vertex', source: sceneSource});
        const fs = device.createShader({stage: 'fragment', source: sceneSource});
        const pipeline = device.createRenderPipeline({
          vs,
          fs,
          topology: 'triangle-list',
          colorAttachmentFormats: ['rgba8unorm', 'rgba8unorm'],
          depthStencilAttachmentFormat: 'depth32float',
          parameters: {depthWriteEnabled: true, depthCompare: 'always'}
        });
        return {
          encode: ({renderPass}) => {
            renderPass.setPipeline(pipeline);
            renderPass.draw({vertexCount: 3});
          },
          destroy: () => {
            pipeline.destroy();
            vs.destroy();
            fs.destroy();
          }
        };
      }
    });
  }
} satisfies GPUOperationLowering;

it('composes scene capture, SSAO and bloom into a caller-owned destination', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const program = new GPUGraph();
  program.add(scene);
  const output = appendEffects(program, {
    input: 'color',
    output: 'present',
    outputDescriptor: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'color'}}),
    effects: [
      {
        effect: ssaoEffect,
        options: {normalSource: 'normal-texture', resolutionScale: 0.5},
        bindings: {depthTexture: 'depth', normalTexture: 'normal'}
      },
      {
        effect: hdrBloom,
        options: {quality: 'low', colorFormat: 'rgba8unorm', downsample: 'auto'}
      },
      {effect: sepiaEffect, uniforms: {sepia: {amount: 0.6}}},
      {effect: sepiaEffect, uniforms: {sepia: {amount: 0.2}}}
    ]
  });
  const compiled = program.compile<{present: Texture}>(device, {
    outputs: [output],
    lowerings: [sceneLowering, effectOperationLowering]
  });
  const destination = device.createTexture({
    ...extent,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const encoder = device.createCommandEncoder();
  const layout = destination.computeMemoryLayout();
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  const execution = compiled.prepare({outputTargets: {present: destination}});
  device.handle.pushErrorScope('validation');
  try {
    expect(execution.outputs.present).toBe(destination);
    execution.encode(encoder);
    encoder.copyTextureToBuffer({
      sourceTexture: destination,
      destinationBuffer: readback,
      bytesPerRow: layout.bytesPerRow,
      ...extent
    });
    device.submit(encoder.finish());
    const result = await readback.readAsync();
    expect(result[3]).toBe(255);
    expect(result[0]).toBeGreaterThan(result[(extent.width - 1) * 4]);
  } finally {
    const error = await device.handle.popErrorScope();
    execution.destroy();
    compiled.destroy();
    encoder.destroy();
    readback.destroy();
    expect(destination.destroyed).toBe(false);
    destination.destroy();
    expect(error).toBeNull();
  }
});
