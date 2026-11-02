// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import type {WebGPUDevice} from '@luma.gl/core/webgpu';
import type {ShaderModule} from '@luma.gl/shaders';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUVectorModel, Model, ShaderInputs} from '../../src';

const batchModule = {
  name: 'batch',
  uniformTypes: {color: 'vec4<f32>'},
  defaultUniforms: {color: [1, 1, 1, 1]},
  getUniforms: (props: {color?: number[]}) => props
} satisfies ShaderModule<{color?: number[]}>;

const shaders = {
  vs: `#version 300 es
in vec2 positions;
void main() { gl_Position = vec4(positions, 0., 1.); }`,
  fs: `#version 300 es
precision highp float;
uniform batchUniforms {vec4 color;} batch;
out vec4 fragmentColor;
void main() {fragmentColor = batch.color;}`,
  source: `struct Batch {color: vec4<f32>};
@group(0) @binding(0) var<uniform> batch: Batch;
@vertex fn vertexMain(@location(0) positions: vec2<f32>) -> @builtin(position) vec4<f32> {
  return vec4<f32>(positions, 0., 1.);
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> {return batch.color;}`
};

for (const backend of ['webgl', 'webgpu'] as const) {
  for (const ModelClass of [GPUVectorModel, Model]) {
    it(`${ModelClass.name} retains each batch's managed uniforms on ${backend}`, async ({skip}) => {
      const device =
        backend === 'webgl' ? await getWebGLTestDevice() : await getWebGPUTestDevice('core');
      if (!device) return skip();
      const buffers = [
        new Float32Array([-1, -1, 0, -1, -0.5, 1]),
        new Float32Array([0, -1, 1, -1, 0.5, 1])
      ].map(data => device.createBuffer({data}));
      const positions = new GPUVector({
        type: 'data',
        format: 'float32x2',
        data: buffers.map(buffer => new GPUData({buffer, format: 'float32x2', length: 3}))
      });
      const model = new ModelClass(device, {
        ...shaders,
        shaderInputs: new ShaderInputs({batch: batchModule}),
        bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'vertex'}],
        attributes: {positions: buffers[0]},
        isInstanced: false,
        vertexCount: 3
      });
      const originalBinding = model.bindings.batchUniforms;
      const texture = device.createTexture({
        width: 4,
        height: 1,
        format: 'rgba8unorm',
        usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
      });
      const framebuffer = device.createFramebuffer({
        width: 4,
        height: 1,
        colorAttachments: [texture]
      });
      const encoder = device.createCommandEncoder();
      const renderPass = encoder.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
      const snapshots = vi.spyOn(renderPass, '_createUniformBufferSnapshot');
      const colors = [
        [1, 0, 0, 1],
        [0, 1, 0, 1],
        [0, 0, 1, 1],
        [1, 1, 0, 1]
      ];
      const rows: number[] = [];
      for (let callIndex = 0; callIndex < 2; callIndex++) {
        renderPass.setParameters({viewport: [callIndex * 2, 0, 2, 1]});
        expect(
          model.drawBatches(renderPass, {
            vectors: {positions},
            onBatch: ({rowIndexOffset, rowCount, batchIndex}) => {
              rows.push(rowIndexOffset);
              expect(rowCount).toBe(3);
              model.shaderInputs.setProps({batch: {color: colors[callIndex * 2 + batchIndex]}});
            }
          })
        ).toBe(true);
        expect(model.bindings.batchUniforms).toBe(originalBinding);
      }
      expect(rows).toEqual([0, 3, 0, 3]);
      renderPass.end();
      const snapshotBuffers = snapshots.mock.results.map(result => result.value as Buffer);
      // Later writes and model destruction must not change already encoded batch draws.
      model.shaderInputs.setProps({batch: {color: [1, 1, 1, 1]}});
      model.updateShaderInputs();
      if (backend === 'webgpu') model.destroy();
      const commandBuffer = encoder.finish();
      expect(snapshotBuffers.every(buffer => !buffer.destroyed)).toBe(true);
      // Submitting the default encoder must not retire a caller-owned encoder's snapshots.
      device.submit();
      expect(snapshotBuffers.every(buffer => !buffer.destroyed)).toBe(true);
      device.submit(commandBuffer);
      expect(snapshotBuffers.every(buffer => !buffer.destroyed)).toBe(true);
      const memoryLayout = texture.computeMemoryLayout({width: 4, height: 1});
      const readback = device.createBuffer({
        byteLength: memoryLayout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      texture.readBuffer({width: 4, height: 1}, readback);
      const bytes = await readback.readAsync();
      expect(Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset, 16))).toEqual([
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255
      ]);
      expect(snapshotBuffers).toHaveLength(backend === 'webgpu' ? 4 : 0);
      if (backend === 'webgpu') {
        await (device as WebGPUDevice).handle.queue.onSubmittedWorkDone();
        expect(snapshotBuffers.every(buffer => buffer.destroyed)).toBe(true);
      } else model.destroy();
      readback.destroy();
      framebuffer.destroy();
      texture.destroy();
      for (const buffer of buffers) buffer.destroy();
    });
  }
}

it('releases unsubmitted uniform snapshots with their encoder or command buffer', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return skip();
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: ['rgba8unorm']
  });
  for (const finish of [false, true]) {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({framebuffer});
    const buffer = pass._createUniformBufferSnapshot(new Uint8Array(16));
    pass.end();
    if (finish) encoder.finish().destroy();
    else encoder.destroy();
    expect(buffer.destroyed).toBe(true);
  }
  framebuffer.destroy();
});

it('preserves explicit buffers and restores batch state after a callback error', async ({skip}) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return skip();
  const buffer = device.createBuffer({data: new Float32Array([-1, -1, 3, -1, -1, 3])});
  const positions = new GPUVector({
    type: 'data',
    format: 'float32x2',
    data: [0, 1].map(() => new GPUData({buffer, format: 'float32x2', length: 3}))
  });
  const model = new Model(device, {
    ...shaders,
    shaderInputs: new ShaderInputs({batch: batchModule}),
    bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'vertex'}],
    attributes: {positions: buffer},
    isInstanced: false,
    vertexCount: 3
  });
  const managedBuffer = model.bindings.batchUniforms;
  const externalBuffer = device.createBuffer({
    data: new Float32Array([0, 1, 0, 1]),
    usage: Buffer.UNIFORM | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: ['rgba8unorm']
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({framebuffer});
  const snapshots = vi.spyOn(pass, '_createUniformBufferSnapshot');
  model.setBindings({batchUniforms: externalBuffer});
  expect(
    model.drawBatches(pass, {
      vectors: {positions},
      onBatch: () => {
        model.shaderInputs.setProps({batch: {color: [1, 0, 0, 1]}});
      }
    })
  ).toBe(true);
  expect(snapshots).not.toHaveBeenCalled();
  expect(model.bindings.batchUniforms).toBe(externalBuffer);
  model.setBindings({batchUniforms: managedBuffer});
  expect(() =>
    model.drawBatches(pass, {
      vectors: {positions},
      onBatch: ({batchIndex}) => {
        if (batchIndex === 1) throw new Error('callback failed');
      }
    })
  ).toThrow('callback failed');
  expect(model.bindings.batchUniforms).toBe(managedBuffer);
  expect(model.vertexCount).toBe(3);
  expect(model.isInstanced).toBe(false);
  expect(snapshots).toHaveBeenCalledTimes(1);
  pass.end();
  encoder.destroy();
  expect((snapshots.mock.results[0].value as Buffer).destroyed).toBe(true);
  expect(
    Array.from(new Float32Array(await externalBuffer.readAsync().then(bytes => bytes.buffer)))
  ).toEqual([0, 1, 0, 1]);
  framebuffer.destroy();
  model.destroy();
  externalBuffer.destroy();
  buffer.destroy();
});

it('retains managed batch uniforms when a render bundle is replayed', async ({skip}) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return skip();
  const buffers = [
    new Float32Array([-1, -1, 0, -1, -0.5, 1]),
    new Float32Array([0, -1, 1, -1, 0.5, 1])
  ].map(data => device.createBuffer({data}));
  const positions = new GPUVector({
    type: 'data',
    format: 'float32x2',
    data: buffers.map(buffer => new GPUData({buffer, format: 'float32x2', length: 3}))
  });
  const model = new Model(device, {
    ...shaders,
    shaderInputs: new ShaderInputs({batch: batchModule}),
    bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'vertex'}],
    attributes: {positions: buffers[0]},
    isInstanced: false,
    vertexCount: 3
  });
  const encoder = device.createRenderBundleEncoder({
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: false
  });
  const snapshots = vi.spyOn(encoder, '_createUniformBufferSnapshot');
  model.drawBatches(encoder, {
    vectors: {positions},
    onBatch: ({batchIndex}) => {
      model.shaderInputs.setProps({batch: {color: batchIndex ? [0, 1, 0, 1] : [1, 0, 0, 1]}});
    }
  });
  const bundle = encoder.finish();
  model.destroy();
  const snapshotBuffers = snapshots.mock.results.map(result => result.value as Buffer);
  expect(snapshotBuffers).toHaveLength(2);
  const texture = device.createTexture({
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({width: 2, height: 1, colorAttachments: [texture]});
  for (let replay = 0; replay < 2; replay++) {
    const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    pass.executeBundles([bundle]);
    pass.end();
    device.submit();
    const layout = texture.computeMemoryLayout({width: 2, height: 1});
    const readback = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    texture.readBuffer({width: 2, height: 1}, readback);
    const bytes = await readback.readAsync();
    expect(Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset, 8))).toEqual([
      255, 0, 0, 255, 0, 255, 0, 255
    ]);
    expect(snapshotBuffers.every(buffer => !buffer.destroyed)).toBe(true);
    readback.destroy();
  }
  bundle.destroy();
  expect(snapshotBuffers.every(buffer => buffer.destroyed)).toBe(true);
  const abandonedEncoder = device.createRenderBundleEncoder({
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: false
  });
  const abandonedBuffer = abandonedEncoder._createUniformBufferSnapshot(new Uint8Array(16));
  abandonedEncoder.destroy();
  expect(abandonedBuffer.destroyed).toBe(true);
  framebuffer.destroy();
  texture.destroy();
  for (const buffer of buffers) buffer.destroy();
});
