// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, assert, type ShaderLayout} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUConstant, GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPUVectorGeometry, GPUVectorModel} from '../../src';

const SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>'},
    {name: 'instancePositions', location: 1, type: 'vec3<f32>'},
    {name: 'instancePositions64Low', location: 2, type: 'vec3<f32>'},
    {name: 'colors', location: 3, type: 'vec4<f32>'}
  ],
  bindings: []
};
const VERTEX_SHADER = `#version 300 es
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 colors;
out vec4 color;
void main() {
  gl_Position = vec4(positions * 0.1 + instancePositions.xy * 0.01 + instancePositions64Low.xy * 0.01, 0., 1.);
  color = colors;
}`;
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec4 color;
out vec4 fragmentColor;
void main() {fragmentColor = color;}`;
const SOURCE = `
struct VertexOutput { @builtin(position) position: vec4<f32>, @location(0) color: vec4<f32> };
@vertex fn vertexMain(@location(0) positions: vec2<f32>, @location(1) instancePositions: vec3<f32>, @location(2) instancePositions64Low: vec3<f32>, @location(3) colors: vec4<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(positions * 0.1 + instancePositions.xy * 0.01 + instancePositions64Low.xy * 0.01, 0., 1.);
  output.color = colors;
  return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {return input.color;}
`;

for (const backend of ['webgl', 'webgpu'] as const) {
  it(`GPUVectorModel binds deck-style mixed and packed columns on ${backend}`, async ({skip}) => {
    const device =
      backend === 'webgl' ? await getWebGLTestDevice() : await getWebGPUTestDevice('core');
    if (!device) {
      skip();
      return;
    }
    const geometryBuffer = device.createBuffer({
      data: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    });
    const positions = new GPUVector({
      name: 'positions',
      type: 'data',
      format: 'float32x2',
      data: [new GPUData({buffer: geometryBuffer, format: 'float32x2', length: 4})]
    });
    const instanceBuffer = device.createBuffer({
      data: new Float32Array([99, 1, 2, 3, 99, 4, 5, 6])
    });
    const instancePositions = new GPUVector({
      name: 'instancePositions',
      type: 'data',
      format: 'float32x3',
      data: [
        new GPUData({
          buffer: instanceBuffer,
          format: 'float32x3',
          length: 2,
          byteOffset: 4,
          byteStride: 16
        })
      ]
    });
    const low = new GPUConstant({format: 'float32x3', value: new Float32Array(3)});
    const colors = new GPUConstant({
      format: 'unorm8x4',
      value: new Uint8Array([128, 64, 255, 255])
    });
    const layouts = [
      {
        name: 'instancePositions',
        byteStride: 16,
        stepMode: 'instance' as const,
        attributes: [
          {attribute: 'instancePositions', format: 'float32x3' as const, byteOffset: 4},
          {attribute: 'instancePositions64Low', format: 'float32x3' as const, byteOffset: 16}
        ]
      },
      {name: 'colors', format: 'unorm8x4' as const, stepMode: 'instance' as const}
    ];
    const model = new GPUVectorModel(device, {
      ...(backend === 'webgpu' ? {source: SOURCE} : {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER}),
      shaderLayout: SHADER_LAYOUT,
      isInstanced: true,
      geometry: new GPUVectorGeometry({attributes: {positions}, topology: 'triangle-strip'})
    });
    model.setGPUAttributes({instancePositions, instancePositions64Low: low, colors}, layouts);
    expect(model.vertexCount).toBe(4);
    expect(model.instanceCount).toBe(2);
    expect(model.bufferLayout.some(layout => layout.name === 'positions')).toBe(true);
    let ownedLowBuffer: Buffer | undefined;
    if (backend === 'webgpu') {
      const highSlot = model.vertexArray.getBufferSlot('instancePositions');
      const lowSlot = model.vertexArray.getBufferSlot('instancePositions-constants');
      assert(highSlot !== null && lowSlot !== null);
      expect(highSlot).not.toBe(lowSlot);
      expect(model.vertexArray.attributes[highSlot]).toBe(instanceBuffer);
      const buffer = model.vertexArray.attributes[lowSlot];
      assert(buffer instanceof Buffer);
      ownedLowBuffer = buffer;
      const bytes = await buffer.readAsync();
      expect(new Float32Array(bytes.buffer, bytes.byteOffset + 16, 3)).toEqual(new Float32Array(3));
    } else {
      expect(model.vertexArray.attributes[3]).toEqual(
        new Float32Array([128 / 255, 64 / 255, 1, 1])
      );
    }
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 0]});
    expect(model.draw(renderPass)).toBe(true);
    renderPass.end();
    device.submit();
    const packedBuffer = device.createBuffer({data: new Uint8Array(56)});
    const packed = new GPUVector({
      type: 'interleaved',
      name: 'packed',
      buffer: packedBuffer,
      length: 2,
      byteStride: 28,
      attributes: [
        {attribute: 'instancePositions', format: 'float32x3', byteOffset: 0},
        {attribute: 'instancePositions64Low', format: 'float32x3', byteOffset: 12},
        {attribute: 'colors', format: 'unorm8x4', byteOffset: 24}
      ]
    });
    model.setGPUAttributes({packed}, [packed.bufferLayout!]);
    if (ownedLowBuffer) expect(ownedLowBuffer.destroyed).toBe(true);
    expect(model.vertexCount).toBe(4);
    expect(model.instanceCount).toBe(2);
    const chunkedPositions = new GPUVector({
      name: 'instancePositions',
      type: 'data',
      format: 'float32x3',
      data: [4, 20].map(
        byteOffset =>
          new GPUData({
            buffer: instanceBuffer,
            format: 'float32x3',
            byteOffset,
            byteStride: 16,
            length: 1
          })
      )
    });
    model.setGPUAttributes(
      {instancePositions: chunkedPositions, instancePositions64Low: low, colors},
      layouts
    );
    const batchPass = device.beginRenderPass({clearColor: [0, 0, 0, 0]});
    const instanceCounts: (number | undefined)[] = [];
    const draw = batchPass.draw.bind(batchPass);
    batchPass.draw = options => {
      instanceCounts.push(options.instanceCount);
      return draw(options);
    };
    expect(model.draw(batchPass)).toBe(true);
    expect(instanceCounts).toEqual([1, 1]);
    expect(model.instanceCount).toBe(2);
    expect(model.vertexCount).toBe(4);
    batchPass.end();
    device.submit();
    model.destroy();
    for (const buffer of [geometryBuffer, instanceBuffer, packedBuffer]) {
      expect(buffer.destroyed).toBe(false);
      buffer.destroy();
    }
  });
}
