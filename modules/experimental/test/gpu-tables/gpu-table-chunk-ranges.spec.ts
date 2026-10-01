// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  Buffer,
  Texture,
  type ComputeShaderLayout,
  type Device,
  type ShaderLayout
} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {
  GPURecordBatch,
  GPUTable,
  GPUTableComputation,
  GPUTableModel,
  type GPUInputSchema
} from '@luma.gl/experimental/gpu-tables';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

const TRIPLE_COMPUTE_SHADER = /* wgsl */ `\
@group(0) @binding(0) var<storage, read_write> values : array<i32>;

@compute @workgroup_size(1)
fn computeMain(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  values[globalInvocationId.x] = values[globalInvocationId.x] * 3;
}
`;

const TRIPLE_COMPUTE_SHADER_LAYOUT = {
  bindings: [{name: 'values', type: 'storage', group: 0, location: 0}]
} satisfies ComputeShaderLayout;

const PIXEL_VALUE_WGSL = /* wgsl */ `\
struct VertexInputs {
  @location(0) pixelIndex : f32,
  @location(1) value : f32,
};

struct VertexOutputs {
  @builtin(position) position : vec4<f32>,
  @location(0) @interpolate(flat) value : f32,
};

@vertex
fn vertexMain(inputs : VertexInputs) -> VertexOutputs {
  var outputs : VertexOutputs;
  outputs.position = vec4<f32>((inputs.pixelIndex + 0.5) / 2.0 - 1.0, 0.0, 0.0, 1.0);
  outputs.value = inputs.value;
  return outputs;
}

@fragment
fn fragmentMain(inputs : VertexOutputs) -> @location(0) vec4<f32> {
  return vec4<f32>(inputs.value / 255.0, 0.0, 0.0, 1.0);
}
`;

const PIXEL_VALUE_VERTEX_SHADER = /* glsl */ `\
#version 300 es
in float pixelIndex;
in float value;
flat out float pixelValue;
void main() {
  gl_Position = vec4((pixelIndex + 0.5) / 2.0 - 1.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
  pixelValue = value;
}
`;

const PIXEL_VALUE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
flat in float pixelValue;
out vec4 fragColor;
void main() {
  fragColor = vec4(pixelValue / 255.0, 0.0, 0.0, 1.0);
}
`;

const PIXEL_VALUE_SHADER_LAYOUT = {
  attributes: [
    {name: 'pixelIndex', location: 0, type: 'f32'},
    {name: 'value', location: 1, type: 'f32'}
  ],
  bindings: []
} satisfies ShaderLayout;

const PIXEL_VALUE_INPUT_SCHEMA = [
  {
    columnName: 'pixelIndex',
    attributeName: 'pixelIndex',
    kind: 'scalars',
    required: true,
    formats: ['float32']
  },
  {
    columnName: 'value',
    attributeName: 'value',
    kind: 'scalars',
    required: true,
    formats: ['float32']
  }
] as const satisfies GPUInputSchema;

const PIXEL_COUNT = 4;

it('GPUTableComputation skips empty batches and dispatches the remaining batches', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }
  const batchValues = [new Int32Array([2, 4]), new Int32Array(0), new Int32Array([6])];
  // Empty batches still need a backing buffer, but WebGPU rejects zero-size storage bindings.
  const buffers = batchValues.map(values =>
    device.createBuffer({
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
      data: values.length > 0 ? values : new Int32Array(1)
    })
  );
  const values = new GPUVector({
    type: 'data',
    name: 'values',
    format: 'sint32',
    data: batchValues.map(
      (batch, batchIndex) =>
        new GPUData({buffer: buffers[batchIndex], format: 'sint32', length: batch.length})
    ),
    ownsData: false
  });
  const computation = new GPUTableComputation(device, {
    source: TRIPLE_COMPUTE_SHADER,
    shaderLayout: TRIPLE_COMPUTE_SHADER_LAYOUT,
    inputVectors: {values}
  });
  const dispatchedBatchIndices: number[] = [];

  const computePass = device.beginComputePass({});
  computation.dispatchBatches(computePass, batch => {
    dispatchedBatchIndices.push(batch.batchIndex);
    return batch.numRows;
  });
  computePass.end();
  device.submit();

  expect(
    await readInt32Values(buffers[0], 2),
    'dispatches the batch before the empty batch'
  ).toEqual([6, 12]);
  expect(
    await readInt32Values(buffers[2], 1),
    'dispatches the batch after the empty batch'
  ).toEqual([18]);
  expect(dispatchedBatchIndices, 'does not dispatch the empty batch').toEqual([0, 2]);
  expect(values.data.length, 'preserves the empty output chunk').toBe(3);

  computation.destroy();
  values.destroy();
  for (const buffer of buffers) {
    buffer.destroy();
  }
});

it('GPUTableModel reads vertex attributes from each chunk byteOffset', async ({skip}) => {
  const devices = [await getWebGPUTestDevice(), await getWebGLTestDevice()].filter(
    (device): device is Device => Boolean(device)
  );
  if (devices.length === 0) {
    skip('No GPU test device available');
    return;
  }

  for (const device of devices) {
    for (const gpuInputSchema of [undefined, PIXEL_VALUE_INPUT_SCHEMA]) {
      const label = `${device.type} ${gpuInputSchema ? 'with' : 'without'} gpuInputSchema`;
      const {table, buffers} = makeSharedBufferPixelTable(device);
      const model = new GPUTableModel(device, {
        id: 'gpu-table-chunk-byte-offsets',
        ...(device.type === 'webgpu'
          ? {source: PIXEL_VALUE_WGSL}
          : {vs: PIXEL_VALUE_VERTEX_SHADER, fs: PIXEL_VALUE_FRAGMENT_SHADER}),
        shaderLayout: PIXEL_VALUE_SHADER_LAYOUT,
        topology: 'point-list',
        table,
        tableCount: 'vertex',
        gpuInputSchema,
        colorAttachmentFormats: ['rgba8unorm']
      });
      const colorTexture = device.createTexture({
        width: PIXEL_COUNT,
        height: 1,
        format: 'rgba8unorm',
        usage: Texture.RENDER | Texture.COPY_SRC
      });
      const framebuffer = device.createFramebuffer({
        width: PIXEL_COUNT,
        height: 1,
        colorAttachments: [colorTexture]
      });

      const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
      expect(Boolean(model.drawBatches(renderPass)), `${label} draws every batch`).toBe(true);
      renderPass.end();
      device.submit();

      const pixels = await readPixels(colorTexture, PIXEL_COUNT);
      expect(
        Array.from({length: PIXEL_COUNT}, (_, pixelIndex) => pixels[pixelIndex * 4]),
        `${label} reads the rows that start at each chunk byteOffset`
      ).toEqual([1, 2, 3, 0]);

      framebuffer.destroy();
      colorTexture.destroy();
      model.destroy();
      table.destroy();
      for (const buffer of buffers) {
        buffer.destroy();
      }
    }
  }
});

/**
 * Builds two batches whose chunks are views into shared buffers at non-zero byte offsets.
 * Row 0 of each buffer is a sentinel that must never be drawn.
 */
function makeSharedBufferPixelTable(device: Device): {table: GPUTable; buffers: Buffer[]} {
  const pixelIndexBuffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.COPY_DST,
    data: new Float32Array([-9, 0, 1, 2])
  });
  const valueBuffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.COPY_DST,
    data: new Float32Array([200, 1, 2, 3])
  });
  const makeBatch = (rowOffset: number, length: number) =>
    new GPURecordBatch({
      gpuData: {
        pixelIndex: new GPUData({
          buffer: pixelIndexBuffer,
          format: 'float32',
          length,
          byteOffset: rowOffset * Float32Array.BYTES_PER_ELEMENT
        }),
        value: new GPUData({
          buffer: valueBuffer,
          format: 'float32',
          length,
          byteOffset: rowOffset * Float32Array.BYTES_PER_ELEMENT
        })
      }
    });
  return {
    table: new GPUTable({batches: [makeBatch(1, 2), makeBatch(3, 1)]}),
    buffers: [pixelIndexBuffer, valueBuffer]
  };
}

async function readInt32Values(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync(0, length * Int32Array.BYTES_PER_ELEMENT);
  return Array.from(new Int32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readPixels(texture: Texture, width: number): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height: 1}, buffer);
    texture.device.submit();
    const data = new Uint8Array(await buffer.readAsync(0, layout.byteLength));
    return Array.from(data.slice(0, width * 4));
  } finally {
    buffer.destroy();
  }
}
