// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {GPUVectorModel} from '../../src';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUConstant, GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUVectorBindings} from '../../src/model/gpu-vector-bindings';

for (const backend of ['webgl', 'webgpu'] as const) {
  it(`consolidates inferred constant and interleaved layouts on ${backend}`, async ({skip}) => {
    const device =
      backend === 'webgl' ? await getWebGLTestDevice() : await getWebGPUTestDevice('core');
    if (!device) return skip();
    const buffers = [0, 1].map(() =>
      device.createBuffer({data: new Float32Array([99, 1, 2, 3, 4, 5, 6])})
    );
    const vector = (byteOffset: number) =>
      new GPUVector({
        type: 'data',
        format: 'float32',
        data: buffers.map(
          buffer => new GPUData({buffer, format: 'float32', length: 2, byteOffset, byteStride: 12})
        )
      });
    const first = vector(4);
    const second = vector(8);
    const color = new GPUConstant({format: 'unorm8x2', value: new Uint8Array([128, 255])});
    const scale = new GPUConstant({format: 'float32', value: new Float32Array([3])});
    const bindings = new GPUVectorBindings(device, 'inferred');
    bindings.setInputs({second, first, color, scale}, undefined, 'instance');
    expect(bindings.layouts).toHaveLength(2);
    const shared = bindings.layouts.find(layout => layout.name === 'first')!;
    expect(shared.attributes).toEqual([
      {attribute: 'first', format: 'float32', byteOffset: 0},
      {attribute: 'second', format: 'float32', byteOffset: 4}
    ]);
    expect(bindings.byteOffsets.first).toBe(4);
    expect(bindings.buffers.first).toBe(buffers[0]);
    expect(bindings.constants.color).toEqual(new Float32Array([128 / 255, 1]));
    if (backend === 'webgpu') {
      const constantBuffer = bindings.buffers.color;
      const bytes = await constantBuffer.readAsync();
      expect(Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset, 2))).toEqual([128, 255]);
      expect(new Float32Array(bytes.buffer, bytes.byteOffset + 4, 1)[0]).toBe(3);
    }
    bindings.setInputs(bindings.getBatch(1), undefined, 'instance');
    expect(bindings.buffers.first).toBe(buffers[1]);
    expect(bindings.byteOffsets.first).toBe(4);
    const explicit = [
      {name: 'first', format: 'float32' as const, byteStride: 12},
      {name: 'second', format: 'float32' as const, byteStride: 12}
    ];
    bindings.setInputs({first, second}, explicit, 'instance');
    expect(bindings.layouts).toHaveLength(2);
    expect(explicit).toEqual([
      {name: 'first', format: 'float32', byteStride: 12},
      {name: 'second', format: 'float32', byteStride: 12}
    ]);
    bindings.destroy();
    for (const buffer of buffers) {
      expect(buffer.destroyed).toBe(false);
      buffer.destroy();
    }
  });
}

for (const backend of ['webgl', 'webgpu'] as const) {
  it(`renders inferred shared views across chunks on ${backend}`, async ({skip}) => {
    const device =
      backend === 'webgl' ? await getWebGLTestDevice() : await getWebGPUTestDevice('core');
    if (!device) return skip();
    const buffers = [
      new Float32Array([99, -1, -1, 0.25, 0, -1, 0.25, -0.5, 1, 0.25]),
      new Float32Array([99, 0, -1, 0.75, 1, -1, 0.75, 0.5, 1, 0.75])
    ].map(data => device.createBuffer({data}));
    const positions = new GPUVector({
      type: 'data',
      format: 'float32x2',
      data: buffers.map(
        buffer =>
          new GPUData({buffer, format: 'float32x2', length: 3, byteOffset: 4, byteStride: 12})
      )
    });
    const intensity = new GPUVector({
      type: 'data',
      format: 'float32',
      data: buffers.map(
        buffer =>
          new GPUData({buffer, format: 'float32', length: 3, byteOffset: 12, byteStride: 12})
      )
    });
    const model = new GPUVectorModel(device, {
      vs: `#version 300 es
in vec2 positions;
in float intensity;
out float value;
void main() {gl_Position = vec4(positions, 0., 1.); value = intensity;}`,
      fs: `#version 300 es
precision highp float;
in float value;
out vec4 color;
void main() {color = vec4(value, 0., 0., 1.);}`,
      source: `struct Output { @builtin(position) position: vec4<f32>, @location(0) value: f32 };
@vertex fn vertexMain(@location(0) positions: vec2<f32>, @location(1) intensity: f32) -> Output {
  var output: Output; output.position = vec4<f32>(positions, 0., 1.); output.value = intensity; return output;
}
@fragment fn fragmentMain(input: Output) -> @location(0) vec4<f32> {return vec4<f32>(input.value, 0., 0., 1.);}`,
      shaderLayout: {
        attributes: [
          {name: 'positions', location: 0, type: 'vec2<f32>'},
          {name: 'intensity', location: 1, type: 'f32'}
        ],
        bindings: []
      },
      topology: 'triangle-list'
    });
    model.setAttributeVectors({intensity, positions});
    expect(model.bufferLayout).toHaveLength(1);
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
    const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    expect(model.draw(renderPass)).toBe(true);
    renderPass.end();
    device.submit();
    const memoryLayout = texture.computeMemoryLayout({width: 2, height: 1});
    const readback = device.createBuffer({
      byteLength: memoryLayout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    texture.readBuffer({width: 2, height: 1}, readback);
    const bytes = await readback.readAsync();
    expect(Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset, 8))).toEqual([
      64, 0, 0, 255, 191, 0, 0, 255
    ]);
    readback.destroy();
    framebuffer.destroy();
    texture.destroy();
    model.destroy();
    for (const buffer of buffers) buffer.destroy();
  });
}
