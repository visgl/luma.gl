// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type ShaderLayout, type BufferLayout} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('WebGPUVertexArray rebinds split vertex layouts with repeated buffers and binding offsets', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'instancePositions', location: 0, type: 'vec3<f32>', stepMode: 'instance'},
      {name: 'instancePositions64Low', location: 1, type: 'vec3<f32>', stepMode: 'instance'},
      {name: 'instanceNormals', location: 2, type: 'vec3<f32>', stepMode: 'instance'},
      {name: 'instanceNormals64Low', location: 3, type: 'vec3<f32>', stepMode: 'instance'}
    ],
    bindings: []
  };

  const bufferLayout: BufferLayout[] = [
    {
      name: 'instanceAttributes',
      byteStride: 24,
      attributes: [
        {attribute: 'instancePositions', byteOffset: 0, format: 'float32x3'},
        {attribute: 'instancePositions64Low', byteOffset: 24, format: 'float32x3'},
        {attribute: 'instanceNormals', byteOffset: 48, format: 'float32x3'},
        {attribute: 'instanceNormals64Low', byteOffset: 72, format: 'float32x3'}
      ]
    }
  ];

  const vertexArray = webgpuDevice.createVertexArray({shaderLayout, bufferLayout});
  const buffer = webgpuDevice.createBuffer({
    byteLength: 96,
    usage: Buffer.VERTEX | Buffer.COPY_DST
  });
  vertexArray.setBuffer(0, buffer);

  const vertexBufferCalls: Array<{slot: number; gpuBuffer: GPUBuffer; offset?: number}> = [];
  vertexArray.bindBeforeRender({
    handle: {
      setVertexBuffer(slot: number, gpuBuffer: GPUBuffer, offset?: number) {
        vertexBufferCalls.push({slot, gpuBuffer, offset});
      }
    }
  } as any);

  expect(
    vertexBufferCalls.map(call => ({
      slot: call.slot,
      gpuBuffer: call.gpuBuffer,
      offset: call.offset
    })),
    'same GPU buffer is rebound across the expanded slots with the expected offsets'
  ).toEqual([
    {slot: 0, gpuBuffer: buffer.handle, offset: 0},
    {slot: 1, gpuBuffer: buffer.handle, offset: 24},
    {slot: 2, gpuBuffer: buffer.handle, offset: 48},
    {slot: 3, gpuBuffer: buffer.handle, offset: 72}
  ]);

  buffer.destroy();
  vertexArray.destroy();
  void 0;
});

it('WebGPUVertexArray keeps simple single-slot bindings unchanged', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'positions', location: 0, type: 'vec3<f32>', stepMode: 'vertex'}],
    bindings: []
  };

  const bufferLayout: BufferLayout[] = [{name: 'positions', format: 'float32x3'}];
  const vertexArray = webgpuDevice.createVertexArray({shaderLayout, bufferLayout});
  const buffer = webgpuDevice.createBuffer({
    byteLength: 12,
    usage: Buffer.VERTEX | Buffer.COPY_DST
  });
  vertexArray.setBuffer(0, buffer);

  const vertexBufferCalls: Array<{slot: number; gpuBuffer: GPUBuffer; offset?: number}> = [];
  vertexArray.bindBeforeRender({
    handle: {
      setVertexBuffer(slot: number, gpuBuffer: GPUBuffer, offset?: number) {
        vertexBufferCalls.push({slot, gpuBuffer, offset});
      }
    }
  } as any);

  expect(
    vertexBufferCalls.map(call => ({
      slot: call.slot,
      gpuBuffer: call.gpuBuffer,
      offset: call.offset
    })),
    'simple vertex buffers still bind once at offset 0'
  ).toEqual([{slot: 0, gpuBuffer: buffer.handle, offset: 0}]);

  buffer.destroy();
  vertexArray.destroy();
  void 0;
});
