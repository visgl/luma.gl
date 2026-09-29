// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, type Device, type Framebuffer} from '@luma.gl/core';
import {Kernel, Model} from '@luma.gl/engine';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

const PIXEL_COUNT = 4;

/** One instance per pixel column: instance `i` covers pixel `i` of a 4x1 target. */
const INSTANCE_PER_PIXEL_WGSL = /* WGSL */ `
@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> @builtin(position) vec4<f32> {
  // Two triangles covering one pixel column: corners (0,0) (1,0) (0,1) (1,1).
  let corner = vec2<f32>(f32(vertexIndex & 1u), f32((vertexIndex >> 1u) & 1u));
  let x = (f32(instanceIndex) + corner.x) / ${PIXEL_COUNT}.0 * 2.0 - 1.0;
  let y = corner.y * 2.0 - 1.0;
  return vec4<f32>(x, y, 0.0, 1.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}
`;

/** Compute pass that publishes a GPU-resident count, as a filter/compaction pass would. */
const WRITE_COUNT_WGSL = /* WGSL */ `
@group(0) @binding(0) var<storage, read_write> selectedCount: array<u32>;
@compute @workgroup_size(1) fn main() {
  selectedCount[0] = 2u;
}
`;

it('Model#setIndirectBuffer draws a GPU-written instance count', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const {framebuffer, texture} = createTarget(device);
  // A lone u32 count, produced on the GPU with no CPU readback.
  const selectedCount = device.createBuffer({
    byteLength: 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const drawRecord = device.createBuffer({
    byteLength: 16,
    usage: Buffer.INDIRECT | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const kernel = new Kernel(device, {
    source: WRITE_COUNT_WGSL,
    shaderLayout: {
      bindings: [{name: 'selectedCount', type: 'storage', group: 0, location: 0}]
    }
  });
  const model = new Model(device, {
    id: 'indirect-instance-count',
    source: INSTANCE_PER_PIXEL_WGSL,
    topology: 'triangle-strip',
    vertexCount: 4,
    // CPU counts are ignored while an indirect record is set; 0 must not early-out.
    instanceCount: 0,
    isInstanced: true,
    indirectBuffer: drawRecord
  });

  const computePass = device.beginComputePass({});
  kernel.dispatch(computePass, {bindings: {selectedCount}, x: 1});
  computePass.end();
  // Copy the count into the record's instanceCount word before the render pass opens.
  device.commandEncoder.copyBufferToBuffer({
    sourceBuffer: selectedCount,
    destinationBuffer: drawRecord,
    destinationOffset: 4,
    size: 4
  });

  // Draw inside an already-open pass without predraw(), like deck.gl does.
  const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  expect(model.draw(renderPass), 'indirect draw is recorded').toBe(true);
  renderPass.end();
  device.submit();

  expect(await readRedChannel(texture), 'exactly the GPU-counted instances drew').toEqual([
    255, 255, 0, 0
  ]);
  expect(await readWords(drawRecord), 'model filled the non-indexed geometry words').toEqual([
    4, 2, 0, 0
  ]);

  // Returning to CPU counts draws instanceCount again.
  model.setIndirectBuffer(null);
  model.setInstanceCount(3);
  const cpuPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  model.draw(cpuPass);
  cpuPass.end();
  device.submit();
  expect(await readRedChannel(texture), 'CPU instanceCount is used after reset').toEqual([
    255, 255, 255, 0
  ]);

  model.destroy();
  kernel.destroy();
  selectedCount.destroy();
  drawRecord.destroy();
  framebuffer.destroy();
  texture.destroy();
});

it('Model#setIndirectBuffer uses indexed records and tracks geometry changes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const {framebuffer, texture} = createTarget(device);
  const indexBuffer = device.createBuffer({
    usage: Buffer.INDEX,
    data: new Uint16Array([0, 1, 2, 2, 1, 3])
  });
  // Record at a non-zero offset inside a larger buffer; the instanceCount word is pre-seeded.
  const drawRecords = device.createBuffer({
    usage: Buffer.INDIRECT | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: new Uint32Array([0, 0, 0, 0, 99, 0, 3, 0, 0, 0])
  });
  const model = new Model(device, {
    id: 'indexed-indirect-instance-count',
    source: INSTANCE_PER_PIXEL_WGSL,
    topology: 'triangle-list',
    indexBuffer,
    isInstanced: true
  });
  model.setIndirectBuffer(drawRecords, 20);

  let renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  model.draw(renderPass);
  renderPass.end();
  device.submit();

  expect(await readRedChannel(texture), 'indexed indirect draw used the GPU count').toEqual([
    255, 255, 255, 0
  ]);
  expect(
    (await readWords(drawRecords)).slice(5),
    'model filled indexCount, firstIndex, baseVertex, firstInstance'
  ).toEqual([6, 3, 0, 0, 0]);
  expect((await readWords(drawRecords))[4], 'words outside the record are untouched').toBe(99);

  // An index-count change is rewritten into the record; the GPU-owned instanceCount is kept.
  model.setIndexCount(3);
  renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  model.draw(renderPass);
  renderPass.end();
  device.submit();
  expect((await readWords(drawRecords)).slice(5), 'indexCount change is synced').toEqual([
    3, 3, 0, 0, 0
  ]);

  model.destroy();
  indexBuffer.destroy();
  drawRecords.destroy();
  framebuffer.destroy();
  texture.destroy();
});

it('Model#setIndirectBuffer validates buffer usage and alignment', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const model = new Model(device, {
    source: INSTANCE_PER_PIXEL_WGSL,
    topology: 'triangle-strip',
    vertexCount: 4
  });
  const storageOnly = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
  const drawRecord = device.createBuffer({
    byteLength: 16,
    usage: Buffer.INDIRECT | Buffer.COPY_DST
  });

  expect(() => model.setIndirectBuffer(storageOnly)).toThrow(
    'Model indirectBuffer requires Buffer.INDIRECT | Buffer.COPY_DST usage'
  );
  expect(() => model.setIndirectBuffer(drawRecord, 2)).toThrow(
    'Model indirectOffset must be a multiple of 4'
  );

  // A 16-byte buffer cannot hold a record at offset 4.
  model.setIndirectBuffer(drawRecord, 4);
  const {framebuffer, texture} = createTarget(device);
  const renderPass = device.beginRenderPass({framebuffer});
  try {
    expect(() => model.draw(renderPass)).toThrow(
      'Model indirectBuffer is too small for the draw record'
    );
  } finally {
    renderPass.end();
    device.submit();
  }

  model.destroy();
  storageOnly.destroy();
  drawRecord.destroy();
  framebuffer.destroy();
  texture.destroy();
});

it('Model#setIndirectBuffer throws on WebGL', async () => {
  const device = await getWebGLTestDevice();
  if (!device) return;

  const model = new Model(device, {
    vs: `#version 300 es
void main() { gl_Position = vec4(0.0); }`,
    fs: `#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(1.0); }`,
    vertexCount: 3
  });
  const buffer = device.createBuffer({byteLength: 16});

  expect(() => model.setIndirectBuffer(buffer)).toThrow('Model indirect draws require WebGPU');
  expect(model.indirectBuffer, 'failed call leaves CPU instance counts active').toBe(null);
  expect(() => model.setIndirectBuffer(null), 'clearing is always allowed').not.toThrow();

  model.destroy();
  buffer.destroy();
});

function createTarget(device: Device): {framebuffer: Framebuffer; texture: Texture} {
  const texture = device.createTexture({
    width: PIXEL_COUNT,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: PIXEL_COUNT,
    height: 1,
    colorAttachments: [texture]
  });
  return {framebuffer, texture};
}

async function readRedChannel(texture: Texture): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width: PIXEL_COUNT, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: PIXEL_COUNT, height: 1}, buffer);
    const bytes = await buffer.readAsync(0, layout.byteLength);
    return Array.from({length: PIXEL_COUNT}, (_, pixel) => bytes[pixel * 4]);
  } finally {
    buffer.destroy();
  }
}

async function readWords(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}
