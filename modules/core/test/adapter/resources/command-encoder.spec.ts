// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  Buffer,
  CommandBuffer,
  CommandEncoder,
  ComputePass,
  Device,
  QuerySet,
  QuerySetProps,
  RenderPass,
  type ResourceProps,
  Texture,
  TextureFormat
} from '@luma.gl/core';
import {
  getNullTestDevice,
  getTestDevices,
  getWebGLTestDevice,
  getWebGPUTestDevice
} from '@luma.gl/test-utils';

const EPSILON = 1e-6;
const {abs} = Math;

function getResourceStats(device: Device): Record<string, number> {
  const stats = device.statsManager.getStats('Resource Counts');
  return {
    resourcesActive: stats.get('Resources Active').count,
    commandEncodersActive: stats.get('CommandEncoders Active').count,
    commandBuffersActive: stats.get('CommandBuffers Active').count,
    renderPasssActive: stats.get('RenderPasss Active').count,
    computePasssActive: stats.get('ComputePasss Active').count,
    framebuffersActive: stats.get('Framebuffers Active').count,
    texturesActive: stats.get('Textures Active').count,
    samplersActive: stats.get('Samplers Active').count,
    textureViewsActive: stats.get('TextureViews Active').count
  };
}

class TestCommandBuffer extends CommandBuffer {
  readonly device: Device;
  readonly handle = null;

  constructor(device: Device, props: ResourceProps = {}) {
    super(device, props);
    this.device = device;
  }
}

class TestQuerySet extends QuerySet {
  readonly device: Device;
  readonly handle = null;
  readResultsCallCount = 0;
  readTimestampDurationCallCount = 0;

  constructor(device: Device, props: QuerySetProps) {
    super(device, props);
    this.device = device;
  }

  isResultAvailable(_queryIndex?: number): boolean {
    return true;
  }

  async readResults(options?: {firstQuery?: number; queryCount?: number}): Promise<bigint[]> {
    this.readResultsCallCount++;
    const firstQuery = options?.firstQuery || 0;
    const queryCount = options?.queryCount || this.props.count - firstQuery;
    return [10n, 20n, 100n, 130n].slice(firstQuery, firstQuery + queryCount);
  }

  async readTimestampDuration(_beginIndex: number, _endIndex: number): Promise<number> {
    this.readTimestampDurationCallCount++;
    throw new Error('resolveTimeProfilingQuerySet should use bulk readResults');
  }
}

class TestCommandEncoder extends CommandEncoder {
  readonly device: Device;
  readonly handle = null;

  constructor(device: Device, querySet: QuerySet) {
    super(device, {timeProfilingQuerySet: querySet});
    this.device = device;
    this._timeProfilingSlotCount = 4;
  }

  finish(): CommandBuffer {
    return new TestCommandBuffer(this.device, {id: this.id, userData: this.userData});
  }

  beginRenderPass(): RenderPass {
    throw new Error('not implemented');
  }

  beginComputePass(): ComputePass {
    throw new Error('not implemented');
  }

  copyBufferToBuffer(): void {
    throw new Error('not implemented');
  }

  copyBufferToTexture(): void {
    throw new Error('not implemented');
  }

  copyTextureToBuffer(): void {
    throw new Error('not implemented');
  }

  copyTextureToTexture(): void {
    throw new Error('not implemented');
  }

  resolveQuerySet(): void {
    throw new Error('not implemented');
  }
}

it('Transient command resources release core stats', async () => {
  for (const device of await getTestDevices(['webgl', 'webgpu', 'null'])) {
    const framebuffer =
      device.type === 'webgpu'
        ? device.createFramebuffer({
            width: 1,
            height: 1,
            colorAttachments: ['rgba8unorm']
          })
        : undefined;
    const beforeStats = getResourceStats(device);

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 0], framebuffer});
    const duringRenderPassStats = getResourceStats(device);
    expect(
      duringRenderPassStats.renderPasssActive - beforeStats.renderPasssActive,
      `${device.type} beginRenderPass increments RenderPasss Active`
    ).toBe(1);

    renderPass.end();

    const afterRenderPassStats = getResourceStats(device);
    expect(
      afterRenderPassStats.renderPasssActive,
      `${device.type} RenderPass.end restores RenderPasss Active`
    ).toBe(beforeStats.renderPasssActive);

    const commandEncoder = device.createCommandEncoder();
    const afterCommandEncoderStats = getResourceStats(device);
    expect(
      afterCommandEncoderStats.commandEncodersActive - afterRenderPassStats.commandEncodersActive,
      `${device.type} createCommandEncoder increments CommandEncoders Active`
    ).toBe(1);

    const commandBuffer = commandEncoder.finish();
    expect(commandBuffer.id, `${device.type} command buffer inherits the encoder id`).toBe(
      commandEncoder.id
    );
    expect(
      commandBuffer.userData,
      `${device.type} command buffer inherits the encoder userData`
    ).toBe(commandEncoder.userData);
    const afterFinishStats = getResourceStats(device);
    expect(
      afterFinishStats.commandEncodersActive,
      `${device.type} CommandEncoder.finish restores CommandEncoders Active`
    ).toBe(afterRenderPassStats.commandEncodersActive);
    expect(
      afterFinishStats.commandBuffersActive - afterRenderPassStats.commandBuffersActive,
      `${device.type} CommandEncoder.finish increments CommandBuffers Active`
    ).toBe(1);

    device.submit(commandBuffer);

    const afterSubmitStats = getResourceStats(device);
    expect(
      afterSubmitStats.commandBuffersActive,
      `${device.type} Device.submit restores CommandBuffers Active`
    ).toBe(afterRenderPassStats.commandBuffersActive);
    expect(
      afterSubmitStats.resourcesActive,
      `${device.type} transient command resources restore total Resources Active`
    ).toBe(beforeStats.resourcesActive);

    framebuffer?.destroy();
  }

  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }
  const beforeStats = getResourceStats(webgpuDevice);
  const computePass = webgpuDevice.beginComputePass({});
  const duringComputePassStats = getResourceStats(webgpuDevice);
  expect(
    duringComputePassStats.computePasssActive - beforeStats.computePasssActive,
    'webgpu beginComputePass increments ComputePasss Active'
  ).toBe(1);

  computePass.end();

  const afterComputePassStats = getResourceStats(webgpuDevice);
  expect(
    afterComputePassStats.computePasssActive,
    'webgpu ComputePass.end restores ComputePasss Active'
  ).toBe(beforeStats.computePasssActive);

  const beforeCanvasStats = getResourceStats(webgpuDevice);
  const firstDefaultFramebufferRenderPass = webgpuDevice.beginRenderPass({
    clearColor: [0, 0, 0, 1]
  });
  const duringFirstCanvasStats = getResourceStats(webgpuDevice);
  expect(
    duringFirstCanvasStats.samplersActive - beforeCanvasStats.samplersActive,
    'webgpu default render pass reuses the shared default sampler wrapper'
  ).toBe(0);

  firstDefaultFramebufferRenderPass.end();
  webgpuDevice.submit();

  const afterFirstCanvasStats = getResourceStats(webgpuDevice);
  expect(
    afterFirstCanvasStats.framebuffersActive,
    'webgpu cached framebuffer wrapper remains active after submit'
  ).toBe(duringFirstCanvasStats.framebuffersActive);
  expect(
    afterFirstCanvasStats.texturesActive,
    'webgpu cached swapchain texture wrapper remains active after submit'
  ).toBe(duringFirstCanvasStats.texturesActive);
  expect(
    afterFirstCanvasStats.samplersActive,
    'webgpu cached default framebuffer path does not add sampler wrappers after submit'
  ).toBe(duringFirstCanvasStats.samplersActive);
  expect(
    afterFirstCanvasStats.textureViewsActive,
    'webgpu cached texture view wrapper remains active after submit'
  ).toBe(duringFirstCanvasStats.textureViewsActive);

  const secondDefaultFramebufferRenderPass = webgpuDevice.beginRenderPass({
    clearColor: [0, 0, 0, 1]
  });
  const duringSecondCanvasStats = getResourceStats(webgpuDevice);
  expect(
    duringSecondCanvasStats.framebuffersActive,
    'webgpu second default render pass reuses cached framebuffer wrapper'
  ).toBe(afterFirstCanvasStats.framebuffersActive);
  expect(
    duringSecondCanvasStats.texturesActive,
    'webgpu second default render pass reuses cached texture wrapper'
  ).toBe(afterFirstCanvasStats.texturesActive);
  expect(
    duringSecondCanvasStats.textureViewsActive,
    'webgpu second default render pass reuses cached texture view wrapper'
  ).toBe(afterFirstCanvasStats.textureViewsActive);

  secondDefaultFramebufferRenderPass.end();
  webgpuDevice.submit();

  void 0;
});

it('CommandEncoder resolves time profiling with a single bulk query read', async () => {
  const device = await getNullTestDevice();
  const querySet = new TestQuerySet(device, {type: 'timestamp', count: 4});
  const commandEncoder = new TestCommandEncoder(device, querySet);

  await commandEncoder.resolveTimeProfilingQuerySet();

  expect(
    querySet.readResultsCallCount,
    'resolveTimeProfilingQuerySet uses one bulk readResults call'
  ).toBe(1);
  expect(
    querySet.readTimestampDurationCallCount,
    'resolveTimeProfilingQuerySet does not call readTimestampDuration per pair'
  ).toBe(0);
  expect(
    commandEncoder._gpuTimeMs,
    'resolveTimeProfilingQuerySet sums durations from bulk results'
  ).toBe(0.00004);

  commandEncoder.destroy();
  querySet.destroy();
  void 0;
});

it('CommandEncoder default submit rolls over to a fresh default encoder', async () => {
  for (const device of await getTestDevices(['webgl', 'webgpu'])) {
    if (device.type === 'webgpu') {
      void 0;
      continue;
    }
    if (device.type === 'webgl' && isSoftwareBackedDevice(device)) {
      void 0;
      continue;
    }

    const sourceBuffer = device.createBuffer({
      byteLength: 3 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    });
    sourceBuffer.write(new Float32Array([1, 2, 3]));
    const destinationBuffer = device.createBuffer({
      byteLength: 3 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    destinationBuffer.write(new Float32Array([0, 0, 0]));

    device.commandEncoder.copyBufferToBuffer({
      sourceBuffer,
      destinationBuffer,
      size: 3 * Float32Array.BYTES_PER_ELEMENT
    });
    device.submit();

    let receivedData = await readAsyncF32(destinationBuffer);
    expect(
      Array.from(receivedData),
      `${device.type} default encoder submits recorded commands`
    ).toEqual([1, 2, 3]);

    sourceBuffer.write(new Float32Array([4, 5, 6]));
    device.commandEncoder.copyBufferToBuffer({
      sourceBuffer,
      destinationBuffer,
      size: 3 * Float32Array.BYTES_PER_ELEMENT
    });
    device.submit();

    receivedData = await readAsyncF32(destinationBuffer);
    expect(
      Array.from(receivedData),
      `${device.type} default encoder is replaced and remains usable after submit`
    ).toEqual([4, 5, 6]);
  }

  void 0;
});

it.skip('Device.writeBufferViaCommandEncoder preserves WebGPU upload order and retires staging buffers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const stats = device.statsManager.getStats('Resource Counts');
  const beforeBufferCount = stats.get('Buffers Active').count;
  const sourceBuffer = device.createBuffer({
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const destinationBuffer = device.createBuffer({
    byteLength: 2 * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_SRC | Buffer.COPY_DST
  });

  const commandEncoder = device.createCommandEncoder({id: 'ordered-upload-test'});
  device.writeBufferViaCommandEncoder(commandEncoder, sourceBuffer, new Uint32Array([1]));
  commandEncoder.copyBufferToBuffer({
    sourceBuffer,
    destinationBuffer,
    destinationOffset: 0,
    size: Uint32Array.BYTES_PER_ELEMENT
  });
  device.writeBufferViaCommandEncoder(commandEncoder, sourceBuffer, new Uint32Array([2]));
  commandEncoder.copyBufferToBuffer({
    sourceBuffer,
    destinationBuffer,
    destinationOffset: Uint32Array.BYTES_PER_ELEMENT,
    size: Uint32Array.BYTES_PER_ELEMENT
  });

  const encodedBufferCount = stats.get('Buffers Active').count;
  expect(
    encodedBufferCount - beforeBufferCount,
    'webgpu encoder uploads allocate transient staging buffers before submit'
  ).toBe(4);

  device.submit(commandEncoder.finish());

  const receivedData = await destinationBuffer.readAsync();
  expect(
    Array.from(
      new Uint32Array(
        receivedData.buffer,
        receivedData.byteOffset,
        receivedData.byteLength / Uint32Array.BYTES_PER_ELEMENT
      )
    ),
    'webgpu encoder uploads stay ordered with subsequent buffer copies'
  ).toEqual([1, 2]);

  const fence = device.createFence();
  await fence.signaled;
  fence.destroy();
  expect(
    stats.get('Buffers Active').count - beforeBufferCount,
    'webgpu staging buffers are released after submitted work completes'
  ).toBe(2);

  sourceBuffer.destroy();
  destinationBuffer.destroy();
  void 0;
});

it('Abandoned WebGPU command buffers release transient upload buffers on destroy', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const stats = device.statsManager.getStats('Resource Counts');
  const beforeBufferCount = stats.get('Buffers Active').count;
  const destinationBuffer = device.createBuffer({
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const commandEncoder = device.createCommandEncoder({id: 'abandoned-upload-test'});

  device.writeBufferViaCommandEncoder(commandEncoder, destinationBuffer, new Uint32Array([7]));
  const commandBuffer = commandEncoder.finish();

  expect(
    stats.get('Buffers Active').count - beforeBufferCount,
    'webgpu abandoned command buffer retains destination and transient staging buffer'
  ).toBe(2);

  commandBuffer.destroy();

  expect(
    stats.get('Buffers Active').count - beforeBufferCount,
    'webgpu command buffer destroy releases transient staging buffer when never submitted'
  ).toBe(1);

  destinationBuffer.destroy();
  void 0;
});

it('CommandBuffer#copyBufferToBuffer', async () => {
  const device = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  const sourceData = new Float32Array([1, 2, 3]);
  const sourceBuffer = device.createBuffer({data: sourceData});
  const destinationData = new Float32Array([4, 5, 6]);
  const destinationBuffer = device.createBuffer({data: destinationData});

  let receivedData = await readAsyncF32(destinationBuffer);
  let expectedData = new Float32Array([4, 5, 6]);
  expect(receivedData, 'copyBufferToBuffer: default parameters successful').toEqual(expectedData);

  let commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToBuffer({
    sourceBuffer,
    destinationBuffer,
    size: 2 * Float32Array.BYTES_PER_ELEMENT
  });
  let commandBuffer = commandEncoder.finish();
  device.submit(commandBuffer);

  receivedData = await readAsyncF32(destinationBuffer);
  expectedData = new Float32Array([1, 2, 6]);
  expect(receivedData, 'copyBufferToBuffer: with size successful').toEqual(expectedData);

  commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToBuffer({
    sourceBuffer,
    sourceOffset: Float32Array.BYTES_PER_ELEMENT,
    destinationBuffer,
    destinationOffset: 2 * Float32Array.BYTES_PER_ELEMENT,
    size: Float32Array.BYTES_PER_ELEMENT
  });
  commandBuffer = commandEncoder.finish();
  device.submit(commandBuffer);

  receivedData = await readAsyncF32(destinationBuffer);
  expectedData = new Float32Array([1, 2, 2]);
  expect(receivedData, 'copyBufferToBuffer: with size and offsets successful').toEqual(
    expectedData
  );

  void 0;
});

type CopyTextureToBufferFixture = {
  title: string;
  format: TextureFormat;
  srcPixel: Uint8Array | Float32Array;
  dstPixel: Uint8Array | Float32Array;
  dstOffset?: number;
};

const COPY_TEXTURE_TO_BUFFER_FIXTURES: CopyTextureToBufferFixture[] = [
  {
    title: 'rgba8',
    format: 'rgba8unorm',
    srcPixel: new Uint8Array([255, 128, 64, 32]),
    dstPixel: new Uint8Array([255, 128, 64, 32])
  },
  {
    title: 'rgba8 + offset',
    format: 'rgba8unorm',
    srcPixel: new Uint8Array([255, 128, 64, 32]),
    dstPixel: new Uint8Array([255, 128, 64, 32]),
    dstOffset: 4
  },
  // {
  //   // TODO: Framebuffer creation fails under Node (browser WebGL1 is fine)
  //   format: 'rgb8unorm-webgl',
  //   srcPixel: new Uint8Array([255, 64, 32]),
  //   dstPixel: new Uint8Array([255, 64, 32]),
  // },
  {
    title: 'rgba32',
    format: 'rgba32float',
    srcPixel: new Float32Array([0.214, -32.23, 1242, -123.847]),
    dstPixel: new Float32Array([0.214, -32.23, 1242, -123.847])
  },
  {
    title: 'rgba32 + offset',
    format: 'rgba32float',
    srcPixel: new Float32Array([0.214, -32.23, 1242, -123.847]),
    dstPixel: new Float32Array([0.214, -32.23, 1242, -123.847]),
    dstOffset: 8
  },
  // {
  //   // RGB32F is not a renderable format even when EXT_color_buffer_float is supported
  //   title: 'rgb32',
  //   format: 'rgb32float-webgl',
  //   srcPixel: new Float32Array([-0.214, 32.23, 1242]),
  //   dstPixel: new Float32Array([-0.214, 32.23, 1242]),
  // },
  {
    title: 'rg32',
    format: 'rg32float',
    srcPixel: new Float32Array([-0.214, 32.23]),
    dstPixel: new Float32Array([-0.214, 32.23, 0, 0])
  },
  {
    title: 'r32',
    format: 'r32float',
    srcPixel: new Float32Array([0.124]),
    dstPixel: new Float32Array([0.124, 0, 0, 0])
  }
];

it('CommandBuffer#copyTextureToBuffer', async () => {
  const device = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  for (const fixture of COPY_TEXTURE_TO_BUFFER_FIXTURES) {
    await testCopyTextureToBuffer(device, {...fixture});
    await testCopyTextureToBuffer(device, {
      ...fixture,
      useFramebuffer: true,
      title: `${fixture.title} + framebuffer`
    });
  }

  void 0;
});

it('CommandEncoder#copyTextureToBuffer honors origin and byteOffset across backends', async () => {
  for (const device of await getTestDevices(['webgl', 'webgpu'])) {
    if (device.type === 'webgpu') {
      void 0;
      continue;
    }
    if (device.type === 'webgl' && isSoftwareBackedDevice(device)) {
      void 0;
      continue;
    }

    const sourceTexture = device.createTexture({
      data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC,
      mipmaps: false
    });
    const destinationBuffer = device.createBuffer({
      byteLength: 8,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    destinationBuffer.write(new Uint8Array(8));

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyTextureToBuffer({
      sourceTexture,
      origin: [1, 0, 0],
      width: 1,
      height: 1,
      destinationBuffer,
      byteOffset: 4
    });
    const commandBuffer = commandEncoder.finish();
    device.submit(commandBuffer);

    const color = await readAsyncU8(destinationBuffer);
    expect(
      Array.from(color.slice(0, 8)),
      `${device.type} copyTextureToBuffer uses canonical origin/byteOffset semantics`
    ).toEqual([0, 0, 0, 0, 5, 6, 7, 8]);
  }

  void 0;
});

it.skip('WebGPU custom CommandEncoder render pass records on the owning encoder', async () => {
  const device = await getWebGPUTestDevice();

  const colorTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: [colorTexture]
  });
  const layout = colorTexture.computeMemoryLayout({width: 1, height: 1});
  const readBuffer = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const commandEncoder = device.createCommandEncoder({id: 'custom-renderpass-owner'});
  const renderPass = commandEncoder.beginRenderPass({
    framebuffer,
    clearColor: [1, 0, 0, 1]
  });
  renderPass.end();

  commandEncoder.copyTextureToBuffer({
    sourceTexture: colorTexture,
    width: 1,
    height: 1,
    destinationBuffer: readBuffer
  });

  const commandBuffer = commandEncoder.finish();
  device.submit(commandBuffer);

  const pixelData = new Uint8Array(await readBuffer.readAsync(0, layout.byteLength));
  expect(
    Array.from(pixelData.slice(0, 4)),
    'custom WebGPU encoder owns the render pass it creates'
  ).toEqual([255, 0, 0, 255]);

  readBuffer.destroy();
  framebuffer.destroy();
  void 0;
});

it.skip('WebGPU CommandEncoder#copyTextureToBuffer does not submit before finish/submit', async () => {
  const device = await getWebGPUTestDevice();

  const sourceTexture = device.createTexture({
    data: new Uint8Array([9, 8, 7, 6]),
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.COPY_DST | Texture.COPY_SRC,
    mipmaps: false
  });
  const destinationBuffer = device.createBuffer({
    byteLength: 4,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  destinationBuffer.write(new Uint8Array([0, 0, 0, 0]));

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyTextureToBuffer({
    sourceTexture,
    width: 1,
    height: 1,
    destinationBuffer
  });

  const preSubmitData = await readAsyncU8(destinationBuffer);
  expect(
    Array.from(preSubmitData.slice(0, 4)),
    'copyTextureToBuffer leaves the destination buffer unchanged until submit'
  ).toEqual([0, 0, 0, 0]);

  const commandBuffer = commandEncoder.finish();
  device.submit(commandBuffer);

  const postSubmitData = await readAsyncU8(destinationBuffer);
  expect(
    Array.from(postSubmitData.slice(0, 4)),
    'copyTextureToBuffer writes into the destination buffer after submit'
  ).toEqual([9, 8, 7, 6]);

  void 0;
});

async function testCopyTextureToBuffer(
  device_: Device,
  options: CopyTextureToBufferFixture & {useFramebuffer?: boolean}
) {
  const {title, srcPixel, dstPixel, dstOffset = 0} = options;

  const elementCount = 6;
  const bytesPerElement = srcPixel.BYTES_PER_ELEMENT;
  const dstByteOffset = dstOffset * bytesPerElement;
  const byteLength = elementCount * bytesPerElement + dstByteOffset;

  let sourceTexture;

  const colorTexture = device_.createTexture({
    data: srcPixel,
    width: 1,
    height: 1,
    format: options.format,
    usage: Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
    mipmaps: false
  });

  const destinationBuffer = device_.createBuffer({byteLength});

  if (options.useFramebuffer) {
    sourceTexture = device_.createFramebuffer({colorAttachments: [colorTexture]});
  } else {
    sourceTexture = colorTexture;
  }

  const commandEncoder = device_.createCommandEncoder();
  commandEncoder.copyTextureToBuffer({
    sourceTexture,
    width: 1,
    height: 1,
    destinationBuffer,
    byteOffset: dstByteOffset
  });
  const commandBuffer = commandEncoder.finish();
  device_.submit(commandBuffer);

  const color =
    srcPixel instanceof Uint8Array
      ? await readAsyncU8(destinationBuffer)
      : await readAsyncF32(destinationBuffer);

  expect(
    Boolean(abs(dstPixel[0] - color[0 + dstOffset]) < EPSILON),
    `reads "R" channel (${title})`
  ).toBe(true);
  expect(
    Boolean(abs(dstPixel[1] - color[1 + dstOffset]) < EPSILON),
    `reads "G" channel (${title})`
  ).toBe(true);
  expect(
    Boolean(abs(dstPixel[2] - color[2 + dstOffset]) < EPSILON),
    `reads "B" channel (${title})`
  ).toBe(true);
  expect(
    Boolean(abs(dstPixel[3] - color[3 + dstOffset]) < EPSILON),
    `reads "A" channel (${title})`
  ).toBe(true);
}

async function readAsyncU8(source: Buffer): Promise<Uint8Array> {
  return source.readAsync();
}

async function readAsyncF32(source: Buffer): Promise<Float32Array> {
  const {buffer, byteOffset, byteLength} = await source.readAsync();
  return new Float32Array(buffer, byteOffset, byteLength / Float32Array.BYTES_PER_ELEMENT);
}

it('CommandEncoder#copyTextureToTexture', async () => {
  const device = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  // for (const device of await getTestDevices()) {
  testCopyToTexture(device, {isSubCopy: false, sourceIsFramebuffer: false});
  // testCopyToTexture(t, device, {isSubCopy: false, sourceIsFramebuffer: true});
  // testCopyToTexture(t, device, {isSubCopy: true, sourceIsFramebuffer: false});
  // testCopyToTexture(t, device, {isSubCopy: true, sourceIsFramebuffer: true});
  // }
});

function testCopyToTexture(
  device_: Device,
  options: {isSubCopy: boolean; sourceIsFramebuffer: boolean}
): void {
  // const byteLength = 6 * 4; // 6 floats
  const sourceColor = [255, 128, 64, 32];

  const sourceTexture = device_.createTexture({
    data: options.sourceIsFramebuffer ? null : new Uint8Array(sourceColor),
    width: 1,
    height: 1
  });

  const destinationTexture = sourceTexture.clone();

  const commandEncoder = device_.createCommandEncoder();
  commandEncoder.copyTextureToTexture({sourceTexture, destinationTexture});
  const commandBuffer = commandEncoder.finish();
  device_.submit(commandBuffer);

  // Read data form destination texture
  const color = device_.readPixelsToArrayWebGL(destinationTexture);

  expect(Array.from(color), 'copyTextureToTexture() successful').toEqual(sourceColor);

  // const opts = {width: 1, height: 1};
  // if (options.isSubCopy) {
  //   // @ts-expect-error
  //   opts.targetX = 1;
  //   // @ts-expect-error
  //   opts.targetY = 1;
  // }

  // const clearColor = [1, 0.5, 0.25, 0.125];
  // const colorOffset = options.isSubCopy ? 4 * 3 /* skip first 3 pixels * : 0;

  // t.ok(
  //   abs(sourceColor[0] - color[0 + colorOffset]) < EPSILON,
  //   `Red channel should have correct value when using ${
  //     options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
  //   } as source, isSubCopy=${options.isSubCopy}`
  // );
  // t.ok(
  //   abs(sourceColor[1] - color[1 + colorOffset]) < EPSILON,
  //   `Green channel should have correct value when using ${
  //     options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
  //   } as source, isSubCopy=${options.isSubCopy}`
  // );
  // t.ok(
  //   abs(sourceColor[2] - color[2 + colorOffset]) < EPSILON,
  //   `Blue channel should have correct value when using ${
  //     options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
  //   } as source, isSubCopy=${options.isSubCopy}`
  // );
  // t.ok(
  //   abs(sourceColor[3] - color[3 + colorOffset]) < EPSILON,
  //   `Alpha channel should have correct value when using ${
  //     options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
  //   } as source, isSubCopy=${options.isSubCopy}`
  // );

  void 0;
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

/*

import type {TextureFormat} from '@luma.gl/core';
import {Device, CommandEncoder, Framebuffer, Renderbuffer, Texture, Buffer} from '@luma.gl/core';

type WebGLTextureInfo = {
  dataFormat: number;
  types: number[];
  gl2?: boolean;
  gl1?: boolean | string;
  compressed?: boolean;
};

const WEBGL_TEXTURE_FORMATS: Record<TextureFormat, WebGLTextureInfo> = {
  // TODO: format: GL.RGBA type: GL.FLOAT is supported in WebGL1 when 'OES_texure_float' is suported
  // we need to update this table structure to specify extensions (gl1ext: 'OES_texure_float', gl2ext: false) for each type.
  rgba8unorm: {
    dataFormat: GL.RGBA,
    types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4, GL.UNSIGNED_SHORT_5_5_5_1]
  },
  // [GL.ALPHA]: {dataFormat: GL.ALPHA, types: [GL.UNSIGNED_BYTE]},
  // [GL.LUMINANCE]: {dataFormat: GL.LUMINANCE, types: [GL.UNSIGNED_BYTE]},
  // [GL.LUMINANCE_ALPHA]: {dataFormat: GL.LUMINANCE_ALPHA, types: [GL.UNSIGNED_BYTE]},

  // 32 bit floats
  r32float: {dataFormat: GL.RED, types: [GL.FLOAT], gl2: true},
  rg32float: {dataFormat: GL.RG, types: [GL.FLOAT], gl2: true},
  // 'rgb32float': {dataFormat: GL.RGB, types: [GL.FLOAT], gl2: true},
  rbga32float: {dataFormat: GL.RGBA, types: [GL.FLOAT], gl2: true}
};

// COPY TEXTURE TO TEXTURE


function testCopyToArray(t: Test, device: Device) {
  [true, false].forEach(sourceIsFramebuffer => {
    for (const testCase of FB_READPIXELS_TEST_CASES) {
      const format = testCase.format;
      if (Texture2D.isSupported(gl, {format})) {
        const formatInfo = WEBGL_TEXTURE_FORMATS[format];
        const type = formatInfo.types[0]; // TODO : test all other types
        const dataFormat = formatInfo.dataFormat;
        const texOptions = Object.assign({}, formatInfo, {
          format,
          type,
          mipmaps: format !== GL.RGB32F
        });

        const frameBufferOptions = {
          attachments: {
            [GL.COLOR_ATTACHMENT0]: new Texture2D(gl, texOptions),
            [GL.DEPTH_STENCIL_ATTACHMENT]: new Renderbuffer(gl, {format: GL.DEPTH_STENCIL})
          }
        };
        let source;
        const width = 1;
        const height = 1;
        if (sourceIsFramebuffer) {
          const framebuffer = new Framebuffer(gl, frameBufferOptions);

          framebuffer.resize({width: 1000, height: 1000});
          framebuffer.checkStatus();

          framebuffer.clear({color: testCase.clearColor});
          source = framebuffer;
        } else {
          const texture = new Texture2D(gl, {
            format,
            dataFormat,
            type,
            mipmaps: false,
            width,
            height,
            data: testCase.textureColor
          });
          source = texture;
        }

        const color = readPixelsToArray(source, {
          sourceX: 0,
          sourceY: 0,
          sourceWidth: width,
          sourceHeight: height,
          sourceFormat: type === GL.FLOAT ? GL.RGBA : dataFormat, // For float textures only RGBA is supported.
          sourceType: type
        });

        const expectedColor = testCase.expectedColor || testCase.clearColor;
        for (const index in color) {
          t.ok(
            Math.abs(color[index] - expectedColor[index]) < EPSILON,
            `Readpixels({format: ${getKey(gl, format)}, type: ${getKey(
              gl,
              type
            )}) returned expected value for channel:${index}`
          );
        }
      }
    }
  });
}

test('WebGL1#CopyAndBlit readPixelsToArray', async t => {
  for (const device of getWebGLTestDevices()) {
    testCopyToArray(t, device);
  }
  t.end();
});

test('Unsupported command encoder operations fail explicitly', async t => {
  const webglDevice = await getWebGLTestDevice();
  const webglCommandEncoder = webglDevice.createCommandEncoder();
  t.throws(
    () => webglCommandEncoder.resolveQuerySet(null as unknown as QuerySet, null as unknown as Buffer),
    /resolveQuerySet is not supported in WebGL/,
    'WebGL resolveQuerySet fails explicitly'
  );

  const sourceBuffer = webglDevice.createBuffer({data: new Uint8Array([255, 0, 0, 255])});
  const destinationTexture = webglDevice.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    mipmaps: false
  });
  const webglCopyEncoder = webglDevice.createCommandEncoder();
  webglCopyEncoder.copyBufferToTexture({
    sourceBuffer,
    destinationTexture,
    byteOffset: 0,
    bytesPerRow: 4,
    rowsPerImage: 1,
    size: [1, 1, 1]
  });
  const webglCopyCommandBuffer = webglCopyEncoder.finish();
  t.throws(
    () => webglDevice.submit(webglCopyCommandBuffer),
    /copyBufferToTexture is not supported in WebGL/,
    'WebGL copyBufferToTexture fails explicitly on submit'
  );

  const nullDevice = await getNullTestDevice();
  const nullCommandEncoder = nullDevice.createCommandEncoder();
  t.throws(
    () => nullCommandEncoder.beginComputePass({}),
    /ComputePass is not supported on NullDevice/,
    'NullDevice beginComputePass fails explicitly'
  );
  t.throws(
    () => nullCommandEncoder.resolveQuerySet(null as unknown as QuerySet, null as unknown as Buffer),
    /resolveQuerySet is not supported on NullDevice/,
    'NullDevice resolveQuerySet fails explicitly'
  );

  t.end();
});

test('WebGL2#CopyAndBlit readPixels', async t => {
  for (const device of getWebGLTestDevices()) {
      testCopyToArray(t, device);
  }
  t.end();
});

/*
const DEFAULT_TEXTURE_OPTIONS = {
  format: GL.RGBA,
  mipmaps: false,
  width: 1,
  height: 1,
  data: null
};

function createTexture(device, opts) {
  return new Texture2D(device, Object.assign({}, DEFAULT_TEXTURE_OPTIONS, opts));
}

/* eslint-disable max-statements *
function testBlit(t: Test, device: Device) {
  [true, false].forEach(destinationIsFramebuffer => {
    [true, false].forEach(sourceIsFramebuffer => {
      // const byteLength = 6 * 4; // 6 floats
      const sourceColor = [255, 128, 64, 32];
      const clearColor = [1, 0.5, 0.25, 0.125];

      const sourceTexture = createTexture(device, {
        data: sourceIsFramebuffer ? null : new Uint8Array(sourceColor)
      });

      const destinationTexture = createTexture(device, {
        // allocate extra size to test x/y offsets when using sub copy
        width: 2,
        height: 2,
        // allocate memory with 0's
        data: new Uint8Array(4 * 4)
      });

      let source;
      if (sourceIsFramebuffer) {
        const framebuffer = new Framebuffer(device, {
          attachments: {
            [GL.COLOR_ATTACHMENT0]: sourceTexture
          }
        });
        framebuffer.checkStatus();
        framebuffer.clear({color: clearColor});
        source = framebuffer;
      } else {
        source = sourceTexture;
      }
      let destination;
      if (destinationIsFramebuffer) {
        const framebuffer = new Framebuffer(device, {
          width: 2,
          height: 2,
          attachments: {
            [GL.COLOR_ATTACHMENT0]: destinationTexture
          }
        });
        framebuffer.checkStatus();
        framebuffer.clear({color: [0, 0, 0, 0]});
        destination = framebuffer;
      } else {
        destination = destinationTexture;
      }

      // const color = new Float32Array(6);
      blit(source, destination, {
        targetX0: 1,
        targetY0: 1
      });

      // Read data form destination texture
      const color = readPixelsToArray(destination);
      const colorOffset = 4 * 3; /* skip first 3 pixels *

      const src = `${sourceIsFramebuffer ? 'Framebuffer' : 'Texture'}`;
      const dst = `${destinationIsFramebuffer ? 'Framebuffer' : 'Texture'}`;
      t.ok(
        abs(sourceColor[0] - color[0 + colorOffset]) < EPSILON,
        `Red channel should have correct value when blintting from ${src} to ${dst}`
      );
      t.ok(
        abs(sourceColor[1] - color[1 + colorOffset]) < EPSILON,
        `Green channel should have correct value when blintting from ${src} to ${dst}`
      );
      t.ok(
        abs(sourceColor[2] - color[2 + colorOffset]) < EPSILON,
        `Blue channel should have correct value when blintting from ${src} to ${dst}`
      );
      t.ok(
        abs(sourceColor[3] - color[3 + colorOffset]) < EPSILON,
        `Alpha channel should have correct value when blintting from ${src} to ${dst}`
      );
    });
  });
  t.end();
}
/* eslint-disable max-statements */
