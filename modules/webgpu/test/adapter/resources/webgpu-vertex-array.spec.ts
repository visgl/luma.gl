// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, Texture, type ShaderLayout, type BufferLayout} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const CONSTANT_ATTRIBUTE_SOURCE = /* WGSL */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>
};

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) color: vec4<f32>
) -> VertexOutput {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  output.color = color;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
`;

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

test('WebGPUVertexArray broadcasts a one-row zero-stride attribute across instances', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'color', location: 0, type: 'vec4<f32>', stepMode: 'instance'}],
    bindings: []
  };
  const bufferLayout: BufferLayout[] = [
    {name: 'color', format: 'unorm8x4', byteStride: 0, stepMode: 'instance'}
  ];
  const shader = webgpuDevice.createShader({source: CONSTANT_ATTRIBUTE_SOURCE});
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    shaderLayout,
    bufferLayout,
    topology: 'triangle-list',
    colorAttachmentFormats: ['rgba8unorm']
  });
  const vertexArray = webgpuDevice.createVertexArray({shaderLayout, bufferLayout});
  const colorBuffer = webgpuDevice.createBuffer({
    data: new Uint8Array([51, 102, 153, 255]),
    usage: Buffer.VERTEX | Buffer.COPY_DST
  });
  const colorTexture = webgpuDevice.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = webgpuDevice.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: [colorTexture]
  });
  vertexArray.setBuffer(0, colorBuffer);

  webgpuDevice.handle.pushErrorScope('validation');
  const renderPass = webgpuDevice.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  t.ok(
    renderPipeline.draw({renderPass, vertexArray, vertexCount: 3, instanceCount: 3}),
    'records a multi-instance draw using a four-byte attribute buffer'
  );
  renderPass.end();
  webgpuDevice.submit();
  const validationError = await webgpuDevice.handle.popErrorScope();
  t.equal(validationError, null, 'draw-time buffer length validation accepts zero stride');

  const memoryLayout = colorTexture.computeMemoryLayout({width: 1, height: 1});
  const readBuffer = webgpuDevice.createBuffer({
    byteLength: memoryLayout.byteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const commandEncoder = webgpuDevice.createCommandEncoder();
  commandEncoder.copyTextureToBuffer({
    sourceTexture: colorTexture,
    width: 1,
    height: 1,
    destinationBuffer: readBuffer
  });
  webgpuDevice.submit(commandEncoder.finish());
  const pixels = new Uint8Array(await readBuffer.readAsync(0, memoryLayout.byteLength));
  t.deepEqual(
    Array.from(pixels.slice(0, 4)),
    [51, 102, 153, 255],
    'all instances read the one stored constant color'
  );

  readBuffer.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  colorBuffer.destroy();
  vertexArray.destroy();
  renderPipeline.destroy();
  shader.destroy();
  t.end();
});
