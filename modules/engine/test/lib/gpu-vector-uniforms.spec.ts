// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import type {ShaderModule} from '@luma.gl/shaders';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUVectorModel, Model, ShaderInputs} from '../../src';

const batchModule = {
  name: 'batch',
  uniformTypes: {color: 'vec4<f32>'},
  defaultUniforms: {color: [1, 1, 1, 1]},
  getUniforms: (props: {color?: number[]}) => props
} satisfies ShaderModule<{color?: number[]}>;

const styleModule = {
  name: 'batchStyle',
  uniformTypes: {opacity: 'f32'},
  defaultUniforms: {opacity: 1},
  getUniforms: (props: {opacity?: number}) => props
} satisfies ShaderModule<{opacity?: number}>;

const shaders = {
  vs: `#version 300 es
in vec2 positions;
void main() { gl_Position = vec4(positions, 0., 1.); }`,
  fs: `#version 300 es
precision highp float;
uniform batchUniforms {vec4 color;} batch;
uniform batchStyleUniforms {float opacity;} batchStyle;
out vec4 fragmentColor;
void main() {fragmentColor = vec4(batch.color.rgb * batchStyle.opacity, batch.color.a);}`,
  source: `struct Batch {color: vec4<f32>};
@group(0) @binding(0) var<uniform> batch: Batch;
struct BatchStyle {opacity: f32};
@group(0) @binding(1) var<uniform> batchStyle: BatchStyle;
@vertex fn vertexMain(@location(0) positions: vec2<f32>) -> @builtin(position) vec4<f32> {
  return vec4<f32>(positions, 0., 1.);
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> {return vec4<f32>(batch.color.rgb * batchStyle.opacity, batch.color.a);}`
};

for (const backend of ['webgl', 'webgpu'] as const) {
  for (const ModelClass of [GPUVectorModel, Model]) {
    it(`${ModelClass.name} isolates batch uniforms and reuses submitted slots on ${backend}`, async ({
      skip
    }) => {
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
        shaderInputs: new ShaderInputs({batch: batchModule, batchStyle: styleModule}),
        bufferLayout: [{name: 'positions', format: 'float32x2', stepMode: 'vertex'}],
        attributes: {positions: buffers[0]},
        isInstanced: false,
        vertexCount: 3
      });
      const originalBinding = model.bindings.batchUniforms;
      const bindings = vi.spyOn(model, '_getBindings');
      const texture = device.createTexture({
        width: 2,
        height: 1,
        format: 'rgba8unorm',
        usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
      });
      const framebuffer = device.createFramebuffer({
        width: 2,
        height: 1,
        colorAttachments: [texture]
      });
      const colors = [
        [1, 0, 0, 1],
        [0, 1, 0, 1],
        [0, 0, 1, 1],
        [1, 1, 0, 1]
      ];
      const rows: number[] = [];
      for (let callIndex = 0; callIndex < 2; callIndex++) {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
        expect(
          model.drawBatches(pass, {
            vectors: {positions},
            onBatch: ({rowIndexOffset, rowCount, batchIndex}) => {
              rows.push(rowIndexOffset);
              expect(rowCount).toBe(3);
              model.shaderInputs.setProps({
                batch: {color: colors[callIndex * 2 + batchIndex]},
                batchStyle: {opacity: batchIndex === 0 ? 0.5 : 1}
              });
            }
          })
        ).toBe(true);
        expect(model.bindings.batchUniforms).toBe(originalBinding);
        pass.end();
        // Canonical uniforms can change without overwriting this call's batch slots.
        model.shaderInputs.setProps({batch: {color: [1, 1, 1, 1]}});
        model.updateShaderInputs();
        // Submit before the next drawBatches call writes new values into reused slots.
        device.submit(encoder.finish());
        const memoryLayout = texture.computeMemoryLayout({width: 2, height: 1});
        const readback = device.createBuffer({
          byteLength: memoryLayout.byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        texture.readBuffer({width: 2, height: 1}, readback);
        const bytes = await readback.readAsync();
        expect(Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset, 8))).toEqual(
          callIndex === 0 ? [128, 0, 0, 255, 0, 255, 0, 255] : [0, 0, 128, 255, 255, 255, 0, 255]
        );
        readback.destroy();
      }
      expect(rows).toEqual([0, 3, 0, 3]);
      const ranges = bindings.mock.results.map(
        result => result.value.batchUniforms as {buffer: Buffer; offset: number; size: number}
      );
      if (backend === 'webgpu') {
        expect(ranges).toHaveLength(4);
        expect(new Set(ranges.map(range => range.buffer)).size).toBe(1);
        expect(ranges.map(range => range.offset)).toEqual([
          0,
          device.limits.minUniformBufferOffsetAlignment * 2,
          0,
          device.limits.minUniformBufferOffsetAlignment * 2
        ]);
        expect(ranges.every(range => range.size === 16 && !range.buffer.destroyed)).toBe(true);
      }
      model.destroy();
      if (backend === 'webgpu') expect(ranges.every(range => range.buffer.destroyed)).toBe(true);
      framebuffer.destroy();
      texture.destroy();
      for (const buffer of buffers) buffer.destroy();
    });
  }
}

it('preserves external buffers and restores state after a batch callback error', async ({skip}) => {
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
    shaderInputs: new ShaderInputs({batch: batchModule, batchStyle: styleModule}),
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
  const bindings = vi.spyOn(model, '_getBindings');
  model.setBindings({batchUniforms: externalBuffer});
  expect(
    model.drawBatches(pass, {
      vectors: {positions},
      onBatch: () => {
        model.shaderInputs.setProps({batch: {color: [1, 0, 0, 1]}});
      }
    })
  ).toBe(true);
  expect(bindings.mock.results.every(result => result.value.batchUniforms === externalBuffer)).toBe(
    true
  );
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
  pass.end();
  encoder.destroy();
  const bytes = await externalBuffer.readAsync();
  expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([0, 1, 0, 1]);
  framebuffer.destroy();
  model.destroy();
  externalBuffer.destroy();
  buffer.destroy();
});
