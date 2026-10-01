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
  model.predraw(device.commandEncoder);
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

it.each([
  {indexed: false, prepareFirstDraw: false},
  {indexed: false, prepareFirstDraw: true},
  {indexed: true, prepareFirstDraw: false},
  {indexed: true, prepareFirstDraw: true}
])('Model indirect geometry stays ordered across passes: %j', async ({
  indexed,
  prepareFirstDraw
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const targets = [createTarget(device), createTarget(device), createTarget(device)];
  const indexBuffer = indexed
    ? device.createBuffer({
        usage: Buffer.INDEX,
        data: new Uint16Array([0, 1, 2, 2, 1, 3])
      })
    : null;
  const drawRecord = device.createBuffer({
    usage: Buffer.INDIRECT | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: new Uint32Array([0, 2, 0, 0, 0])
  });
  const model = new Model(device, {
    source: INSTANCE_PER_PIXEL_WGSL,
    topology: indexed ? 'triangle-list' : 'triangle-strip',
    indexBuffer,
    indirectBuffer: drawRecord,
    instanceCount: 0,
    isInstanced: true
  });

  try {
    for (let passIndex = 0; passIndex < targets.length; passIndex++) {
      const count = passIndex === 1 ? 0 : indexed ? 6 : 4;
      if (indexed) model.setIndexCount(count);
      else model.setVertexCount(count);
      if (passIndex > 0 || prepareFirstDraw) model.predraw(device.commandEncoder);
      const renderPass = device.beginRenderPass({
        framebuffer: targets[passIndex].framebuffer,
        clearColor: [0, 0, 0, 0]
      });
      expect(model.draw(renderPass)).toBe(true);
      renderPass.end();
    }
    // All three passes deliberately share a submission: queue writes cannot preserve their order.
    device.submit();
    expect(await readRedChannel(targets[0].texture)).toEqual([255, 255, 0, 0]);
    expect(await readRedChannel(targets[1].texture)).toEqual([0, 0, 0, 0]);
    expect(await readRedChannel(targets[2].texture)).toEqual([255, 255, 0, 0]);
    expect((await readWords(drawRecord))[1], 'ordered geometry uploads preserve the count').toBe(2);
  } finally {
    model.destroy();
    indexBuffer?.destroy();
    drawRecord.destroy();
    for (const {framebuffer, texture} of targets) {
      framebuffer.destroy();
      texture.destroy();
    }
  }
});

it('Model rejects unprepared indirect changes without corrupting a pending draw', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const {framebuffer, texture} = createTarget(device);
  const drawRecord = device.createBuffer({
    usage: Buffer.INDIRECT | Buffer.COPY_DST,
    data: new Uint32Array([0, 1, 0, 0])
  });
  const model = new Model(device, {
    source: INSTANCE_PER_PIXEL_WGSL,
    topology: 'triangle-strip',
    vertexCount: 4,
    indirectBuffer: drawRecord
  });
  const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  try {
    expect(model.draw(renderPass)).toBe(true);
    model.setVertexCount(0);
    expect(() => model.draw(renderPass)).toThrow();
    // Rebinding the same record must not reopen the queue-initialization path.
    model.setIndirectBuffer(null);
    model.setIndirectBuffer(drawRecord);
    expect(() => model.draw(renderPass)).toThrow();
  } finally {
    renderPass.end();
    device.submit();
  }
  try {
    expect(await readRedChannel(texture), 'the first draw retains its geometry').toEqual([
      255, 0, 0, 0
    ]);
  } finally {
    model.destroy();
    drawRecord.destroy();
    framebuffer.destroy();
    texture.destroy();
  }
});

it('Model prepares unchanged indirect geometry on independent command encoders', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const {framebuffer, texture} = createTarget(device);
  const drawRecord = device.createBuffer({
    usage: Buffer.INDIRECT | Buffer.COPY_DST,
    data: new Uint32Array([0, 1, 0, 0])
  });
  const model = new Model(device, {
    source: INSTANCE_PER_PIXEL_WGSL,
    topology: 'triangle-strip',
    vertexCount: 4,
    indirectBuffer: drawRecord
  });
  const discardedEncoder = device.createCommandEncoder();
  const submittedEncoder = device.createCommandEncoder();
  try {
    // Force an ordered update after the one-time queue initialization.
    model.setVertexCount(0);
    model.predraw(device.commandEncoder);
    model.setVertexCount(4);
    model.predraw(discardedEncoder);
    model.predraw(submittedEncoder);
    const renderPass = submittedEncoder.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    expect(model.draw(renderPass)).toBe(true);
    renderPass.end();
    device.submit(submittedEncoder.finish());
    expect(await readRedChannel(texture)).toEqual([255, 0, 0, 0]);
  } finally {
    discardedEncoder.destroy();
    model.destroy();
    drawRecord.destroy();
    framebuffer.destroy();
    texture.destroy();
  }
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

  model.setIndirectBuffer(drawRecord);
  expect(() => model.setIndirectBuffer(storageOnly)).toThrow();
  for (const invalidOffset of [-4, 2, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => model.setIndirectBuffer(drawRecord, invalidOffset)).toThrow();
    expect(model.indirectBuffer, 'invalid binding leaves the buffer unchanged').toBe(drawRecord);
    expect(model.indirectOffset, 'invalid binding leaves the offset unchanged').toBe(0);
  }

  // A 16-byte buffer cannot hold a record at offset 4.
  model.setIndirectBuffer(drawRecord, 4);
  const {framebuffer, texture} = createTarget(device);
  const renderPass = device.beginRenderPass({framebuffer});
  try {
    expect(() => model.draw(renderPass)).toThrow();
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

  expect(() => model.setIndirectBuffer(buffer)).toThrow();
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
