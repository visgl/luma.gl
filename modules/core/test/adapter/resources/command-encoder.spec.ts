// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test, {Test} from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  Buffer,
  CommandBuffer,
  CommandBufferProps,
  CommandEncoder,
  ComputePass,
  Device,
  QuerySet,
  QuerySetProps,
  RenderPass,
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

  constructor(device: Device, props: CommandBufferProps = {}) {
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

  finish(_props?: CommandBufferProps): CommandBuffer {
    return new TestCommandBuffer(this.device, {});
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

test('Transient command resources release core stats', async t => {
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
    t.equal(
      duringRenderPassStats.renderPasssActive - beforeStats.renderPasssActive,
      1,
      `${device.type} beginRenderPass increments RenderPasss Active`
    );

    renderPass.end();

    const afterRenderPassStats = getResourceStats(device);
    t.equal(
      afterRenderPassStats.renderPasssActive,
      beforeStats.renderPasssActive,
      `${device.type} RenderPass.end restores RenderPasss Active`
    );

    const commandEncoder = device.createCommandEncoder();
    const afterCommandEncoderStats = getResourceStats(device);
    t.equal(
      afterCommandEncoderStats.commandEncodersActive - afterRenderPassStats.commandEncodersActive,
      1,
      `${device.type} createCommandEncoder increments CommandEncoders Active`
    );

    const commandBuffer = commandEncoder.finish();
    const afterFinishStats = getResourceStats(device);
    t.equal(
      afterFinishStats.commandEncodersActive,
      afterRenderPassStats.commandEncodersActive,
      `${device.type} CommandEncoder.finish restores CommandEncoders Active`
    );
    t.equal(
      afterFinishStats.commandBuffersActive - afterRenderPassStats.commandBuffersActive,
      1,
      `${device.type} CommandEncoder.finish increments CommandBuffers Active`
    );

    device.submit(commandBuffer);

    const afterSubmitStats = getResourceStats(device);
    t.equal(
      afterSubmitStats.commandBuffersActive,
      afterRenderPassStats.commandBuffersActive,
      `${device.type} Device.submit restores CommandBuffers Active`
    );
    t.equal(
      afterSubmitStats.resourcesActive,
      beforeStats.resourcesActive,
      `${device.type} transient command resources restore total Resources Active`
    );

    framebuffer?.destroy();
  }

  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const beforeStats = getResourceStats(webgpuDevice);
  const computePass = webgpuDevice.beginComputePass({});
  const duringComputePassStats = getResourceStats(webgpuDevice);
  t.equal(
    duringComputePassStats.computePasssActive - beforeStats.computePasssActive,
    1,
    'webgpu beginComputePass increments ComputePasss Active'
  );

  computePass.end();

  const afterComputePassStats = getResourceStats(webgpuDevice);
  t.equal(
    afterComputePassStats.computePasssActive,
    beforeStats.computePasssActive,
    'webgpu ComputePass.end restores ComputePasss Active'
  );

  const beforeCanvasStats = getResourceStats(webgpuDevice);
  const firstDefaultFramebufferRenderPass = webgpuDevice.beginRenderPass({
    clearColor: [0, 0, 0, 1]
  });
  const duringFirstCanvasStats = getResourceStats(webgpuDevice);
  t.equal(
    duringFirstCanvasStats.samplersActive - beforeCanvasStats.samplersActive,
    0,
    'webgpu default render pass reuses the shared default sampler wrapper'
  );

  firstDefaultFramebufferRenderPass.end();
  webgpuDevice.submit();

  const afterFirstCanvasStats = getResourceStats(webgpuDevice);
  t.equal(
    afterFirstCanvasStats.framebuffersActive,
    duringFirstCanvasStats.framebuffersActive,
    'webgpu cached framebuffer wrapper remains active after submit'
  );
  t.equal(
    afterFirstCanvasStats.texturesActive,
    duringFirstCanvasStats.texturesActive,
    'webgpu cached swapchain texture wrapper remains active after submit'
  );
  t.equal(
    afterFirstCanvasStats.samplersActive,
    duringFirstCanvasStats.samplersActive,
    'webgpu cached default framebuffer path does not add sampler wrappers after submit'
  );
  t.equal(
    afterFirstCanvasStats.textureViewsActive,
    duringFirstCanvasStats.textureViewsActive,
    'webgpu cached texture view wrapper remains active after submit'
  );

  const secondDefaultFramebufferRenderPass = webgpuDevice.beginRenderPass({
    clearColor: [0, 0, 0, 1]
  });
  const duringSecondCanvasStats = getResourceStats(webgpuDevice);
  t.equal(
    duringSecondCanvasStats.framebuffersActive,
    afterFirstCanvasStats.framebuffersActive,
    'webgpu second default render pass reuses cached framebuffer wrapper'
  );
  t.equal(
    duringSecondCanvasStats.texturesActive,
    afterFirstCanvasStats.texturesActive,
    'webgpu second default render pass reuses cached texture wrapper'
  );
  t.equal(
    duringSecondCanvasStats.textureViewsActive,
    afterFirstCanvasStats.textureViewsActive,
    'webgpu second default render pass reuses cached texture view wrapper'
  );

  secondDefaultFramebufferRenderPass.end();
  webgpuDevice.submit();

  t.end();
});

test('CommandEncoder resolves time profiling with a single bulk query read', async t => {
  const device = await getNullTestDevice();
  const querySet = new TestQuerySet(device, {type: 'timestamp', count: 4});
  const commandEncoder = new TestCommandEncoder(device, querySet);

  await commandEncoder.resolveTimeProfilingQuerySet();

  t.equal(
    querySet.readResultsCallCount,
    1,
    'resolveTimeProfilingQuerySet uses one bulk readResults call'
  );
  t.equal(
    querySet.readTimestampDurationCallCount,
    0,
    'resolveTimeProfilingQuerySet does not call readTimestampDuration per pair'
  );
  t.equal(
    commandEncoder._gpuTimeMs,
    0.00004,
    'resolveTimeProfilingQuerySet sums durations from bulk results'
  );

  commandEncoder.destroy();
  querySet.destroy();
  t.end();
});

test('CommandEncoder default submit rolls over to a fresh default encoder', async t => {
  for (const device of await getTestDevices(['webgl', 'webgpu'])) {
    if (device.type === 'webgpu') {
      t.comment('Skipping WebGPU default encoder rollover test due to flaky device-loss behavior');
      continue;
    }
    if (device.type === 'webgl' && isSoftwareBackedDevice(device)) {
      t.comment('Skipping WebGL default encoder rollover test on a software-backed adapter');
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
    t.deepEqual(
      Array.from(receivedData),
      [1, 2, 3],
      `${device.type} default encoder submits recorded commands`
    );

    sourceBuffer.write(new Float32Array([4, 5, 6]));
    device.commandEncoder.copyBufferToBuffer({
      sourceBuffer,
      destinationBuffer,
      size: 3 * Float32Array.BYTES_PER_ELEMENT
    });
    device.submit();

    receivedData = await readAsyncF32(destinationBuffer);
    t.deepEqual(
      Array.from(receivedData),
      [4, 5, 6],
      `${device.type} default encoder is replaced and remains usable after submit`
    );
  }

  t.end();
});

test('Device.writeBufferViaCommandEncoder preserves WebGPU upload order and retires staging buffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
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
  t.equal(
    encodedBufferCount - beforeBufferCount,
    4,
    'webgpu encoder uploads allocate transient staging buffers before submit'
  );

  device.submit(commandEncoder.finish());

  const receivedData = await destinationBuffer.readAsync();
  t.deepEqual(
    Array.from(
      new Uint32Array(
        receivedData.buffer,
        receivedData.byteOffset,
        receivedData.byteLength / Uint32Array.BYTES_PER_ELEMENT
      )
    ),
    [1, 2],
    'webgpu encoder uploads stay ordered with subsequent buffer copies'
  );

  await device.handle.queue.onSubmittedWorkDone();
  t.equal(
    stats.get('Buffers Active').count - beforeBufferCount,
    2,
    'webgpu staging buffers are released after submitted work completes'
  );

  sourceBuffer.destroy();
  destinationBuffer.destroy();
  t.end();
});

test('CommandBuffer#copyBufferToBuffer', async t => {
  const device = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(device)) {
    t.comment('Skipping WebGL buffer copy test on a software-backed adapter');
    t.end();
    return;
  }

  const sourceData = new Float32Array([1, 2, 3]);
  const sourceBuffer = device.createBuffer({data: sourceData});
  const destinationData = new Float32Array([4, 5, 6]);
  const destinationBuffer = device.createBuffer({data: destinationData});

  let receivedData = await readAsyncF32(destinationBuffer);
  let expectedData = new Float32Array([4, 5, 6]);
  t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: default parameters successful');

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
  t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: with size successful');

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
  t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: with size and offsets successful');

  t.end();
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

test('CommandBuffer#copyTextureToBuffer', async t => {
  const device = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(device)) {
    t.comment('Skipping WebGL texture-to-buffer copy test on a software-backed adapter');
    t.end();
    return;
  }

  for (const fixture of COPY_TEXTURE_TO_BUFFER_FIXTURES) {
    await testCopyTextureToBuffer(t, device, {...fixture});
    await testCopyTextureToBuffer(t, device, {
      ...fixture,
      useFramebuffer: true,
      title: `${fixture.title} + framebuffer`
    });
  }

  t.end();
});

test('CommandEncoder#copyTextureToBuffer honors origin and byteOffset across backends', async t => {
  for (const device of await getTestDevices(['webgl', 'webgpu'])) {
    if (device.type === 'webgpu') {
      t.comment(
        'Skipping WebGPU texture-to-buffer origin/offset test due to flaky device-loss behavior'
      );
      continue;
    }
    if (device.type === 'webgl' && isSoftwareBackedDevice(device)) {
      t.comment('Skipping WebGL origin/byteOffset texture copy test on a software-backed adapter');
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
    t.deepEqual(
      Array.from(color.slice(0, 8)),
      [0, 0, 0, 0, 5, 6, 7, 8],
      `${device.type} copyTextureToBuffer uses canonical origin/byteOffset semantics`
    );
  }

  t.end();
});

test.skip('WebGPU custom CommandEncoder render pass records on the owning encoder', async t => {
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
  t.deepEqual(
    Array.from(pixelData.slice(0, 4)),
    [255, 0, 0, 255],
    'custom WebGPU encoder owns the render pass it creates'
  );

  readBuffer.destroy();
  framebuffer.destroy();
  t.end();
});

test.skip('WebGPU CommandEncoder#copyTextureToBuffer does not submit before finish/submit', async t => {
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
  t.deepEqual(
    Array.from(preSubmitData.slice(0, 4)),
    [0, 0, 0, 0],
    'copyTextureToBuffer leaves the destination buffer unchanged until submit'
  );

  const commandBuffer = commandEncoder.finish();
  device.submit(commandBuffer);

  const postSubmitData = await readAsyncU8(destinationBuffer);
  t.deepEqual(
    Array.from(postSubmitData.slice(0, 4)),
    [9, 8, 7, 6],
    'copyTextureToBuffer writes into the destination buffer after submit'
  );

  t.end();
});

async function testCopyTextureToBuffer(
  t: Test,
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

  t.ok(abs(dstPixel[0] - color[0 + dstOffset]) < EPSILON, `reads "R" channel (${title})`);
  t.ok(abs(dstPixel[1] - color[1 + dstOffset]) < EPSILON, `reads "G" channel (${title})`);
  t.ok(abs(dstPixel[2] - color[2 + dstOffset]) < EPSILON, `reads "B" channel (${title})`);
  t.ok(abs(dstPixel[3] - color[3 + dstOffset]) < EPSILON, `reads "A" channel (${title})`);
}

async function readAsyncU8(source: Buffer): Promise<Uint8Array> {
  return source.readAsync();
}

async function readAsyncF32(source: Buffer): Promise<Float32Array> {
  const {buffer, byteOffset, byteLength} = await source.readAsync();
  return new Float32Array(buffer, byteOffset, byteLength / Float32Array.BYTES_PER_ELEMENT);
}

test('CommandEncoder#copyTextureToTexture', async t => {
  const device = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(device)) {
    t.comment('Skipping WebGL texture-to-texture copy test on a software-backed adapter');
    t.end();
    return;
  }

  // for (const device of await getTestDevices()) {
  testCopyToTexture(t, device, {isSubCopy: false, sourceIsFramebuffer: false});
  // testCopyToTexture(t, device, {isSubCopy: false, sourceIsFramebuffer: true});
  // testCopyToTexture(t, device, {isSubCopy: true, sourceIsFramebuffer: false});
  // testCopyToTexture(t, device, {isSubCopy: true, sourceIsFramebuffer: true});
  // }
});

function testCopyToTexture(
  t: Test,
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

  t.deepEqual(color, sourceColor, 'copyTextureToTexture() successful');

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

  t.end();
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
