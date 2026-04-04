// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type ShaderLayout, type BufferLayout} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('WebGPUVertexArray rebinds split vertex layouts with repeated buffers and binding offsets', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
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

  t.deepEqual(
    vertexBufferCalls.map(call => ({
      slot: call.slot,
      gpuBuffer: call.gpuBuffer,
      offset: call.offset
    })),
    [
      {slot: 0, gpuBuffer: buffer.handle, offset: 0},
      {slot: 1, gpuBuffer: buffer.handle, offset: 24},
      {slot: 2, gpuBuffer: buffer.handle, offset: 48},
      {slot: 3, gpuBuffer: buffer.handle, offset: 72}
    ],
    'same GPU buffer is rebound across the expanded slots with the expected offsets'
  );

  buffer.destroy();
  vertexArray.destroy();
  t.end();
});

test('WebGPUVertexArray keeps simple single-slot bindings unchanged', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
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

  t.deepEqual(
    vertexBufferCalls.map(call => ({
      slot: call.slot,
      gpuBuffer: call.gpuBuffer,
      offset: call.offset
    })),
    [{slot: 0, gpuBuffer: buffer.handle, offset: 0}],
    'simple vertex buffers still bind once at offset 0'
  );

  buffer.destroy();
  vertexArray.destroy();
  t.end();
});
