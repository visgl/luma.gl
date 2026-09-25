// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, type Device, type Shader} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/test-utils';

const DEVICE_TYPES = ['webgl', 'webgpu'] as const;
const EMPTY_SHADER_LAYOUT = {attributes: [], bindings: []};

const GLSL_VERTEX_SOURCE = `#version 300 es
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const GLSL_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() {
  fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

const WGSL_RENDER_SOURCE = `
@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`;

const GLSL_INDEXED_VERTEX_SOURCE = `#version 300 es
const vec2 positions[6] = vec2[6](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0),
  vec2(2.0, 2.0),
  vec2(2.0, 2.0),
  vec2(2.0, 2.0)
);
void main() {
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
}
`;

const WGSL_INDEXED_RENDER_SOURCE = `
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0),
    vec2<f32>(2.0, 2.0),
    vec2<f32>(2.0, 2.0),
    vec2<f32>(2.0, 2.0)
  );
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
`;

type DestroyableResource = {
  readonly id: string;
  destroyed: boolean;
  destroy(): void;
};

function getActiveResourceCount(device: Device): number {
  return device.statsManager.getStats('Resource Counts').get('Resources Active').count;
}

function expectResourceDestroyConformance(
  device: Device,
  resourceName: string,
  beforeCreateCount: number,
  resource: DestroyableResource
): void {
  expect(resource.destroyed, `${device.type} ${resourceName} starts active`).toBe(false);
  expect(
    getActiveResourceCount(device),
    `${device.type} ${resourceName} creation increments active resource count`
  ).toBeGreaterThan(beforeCreateCount);

  resource.destroy();
  expect(resource.destroyed, `${device.type} ${resourceName} is marked destroyed`).toBe(true);
  expect(
    getActiveResourceCount(device),
    `${device.type} ${resourceName} destruction restores active resource count`
  ).toBe(beforeCreateCount);

  resource.destroy();
  expect(
    getActiveResourceCount(device),
    `${device.type} repeated ${resourceName} destruction is idempotent`
  ).toBe(beforeCreateCount);
}

async function createRenderShaders(
  device: Device
): Promise<{vertexShader: Shader; fragmentShader: Shader}> {
  if (device.info.shadingLanguage === 'wgsl') {
    const shader = device.createShader({source: WGSL_RENDER_SOURCE});
    await shader.asyncCompilationStatus;
    return {vertexShader: shader, fragmentShader: shader};
  }

  const vertexShader = device.createShader({stage: 'vertex', source: GLSL_VERTEX_SOURCE});
  const fragmentShader = device.createShader({stage: 'fragment', source: GLSL_FRAGMENT_SOURCE});
  await Promise.all([vertexShader.asyncCompilationStatus, fragmentShader.asyncCompilationStatus]);
  return {vertexShader, fragmentShader};
}

async function createIndexedRenderShaders(
  device: Device
): Promise<{vertexShader: Shader; fragmentShader: Shader}> {
  if (device.info.shadingLanguage === 'wgsl') {
    const shader = device.createShader({source: WGSL_INDEXED_RENDER_SOURCE});
    await shader.asyncCompilationStatus;
    return {vertexShader: shader, fragmentShader: shader};
  }

  const vertexShader = device.createShader({
    stage: 'vertex',
    source: GLSL_INDEXED_VERTEX_SOURCE
  });
  const fragmentShader = device.createShader({stage: 'fragment', source: GLSL_FRAGMENT_SOURCE});
  await Promise.all([vertexShader.asyncCompilationStatus, fragmentShader.asyncCompilationStatus]);
  return {vertexShader, fragmentShader};
}

async function readFirstTexturePixel(device: Device, texture: Texture): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const readBuffer = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: 1, height: 1}, readBuffer);
    const data = await readBuffer.readAsync();
    return Array.from(data.slice(0, 4));
  } finally {
    readBuffer.destroy();
  }
}

it('Device buffer initialization honors byteOffset and byteLength', async () => {
  const data = new Float32Array([1, 2, 3]);

  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const buffer = device.createBuffer({
      data,
      byteOffset: 8,
      byteLength: data.byteLength + 12,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    });

    expect(buffer.byteLength, `${device.type} allocates the requested buffer size`).toBe(24);
    const receivedData = await buffer.readAsync();
    expect(
      Array.from(new Float32Array(receivedData.buffer, receivedData.byteOffset, 6)),
      `${device.type} places constructor data at the requested byte offset`
    ).toEqual([0, 0, 1, 2, 3, 0]);
    buffer.destroy();
  }
});

it('Device texture storage capabilities agree with storage texture limits', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const capabilities = device.getTextureFormatCapabilities('rgba8unorm');
    const hasStorageTextureBindings =
      device.limits.maxStorageTexturesInVertexStage > 0 ||
      device.limits.maxStorageTexturesInFragmentStage > 0;

    if (!hasStorageTextureBindings) {
      expect(
        capabilities.store,
        `${device.type} does not advertise storage formats without storage bindings`
      ).toBe(false);
    }
  }
});

it('Device resource destruction is observable, idempotent, and restores resource counts', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    // Warm any device-owned shared default resources before taking per-resource baselines.
    const warmupTexture = device.createTexture({width: 1, height: 1});
    warmupTexture.destroy();

    let beforeCreateCount = getActiveResourceCount(device);
    const sampler = device.createSampler({id: `${device.type}-conformance-sampler`});
    expectResourceDestroyConformance(device, 'Sampler', beforeCreateCount, sampler);

    beforeCreateCount = getActiveResourceCount(device);
    const texture = device.createTexture({
      id: `${device.type}-conformance-texture`,
      width: 1,
      height: 1,
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
    const textureView = texture.view;
    const textureSampler = texture.sampler;
    expectResourceDestroyConformance(device, 'Texture', beforeCreateCount, texture);
    expect(textureView.destroyed, `${device.type} Texture destroys its default view`).toBe(true);
    expect(textureSampler.destroyed, `${device.type} Texture destroys its owned sampler`).toBe(
      true
    );

    beforeCreateCount = getActiveResourceCount(device);
    const framebuffer = device.createFramebuffer({
      id: `${device.type}-conformance-framebuffer`,
      width: 1,
      height: 1,
      colorAttachments: ['rgba8unorm']
    });
    expectResourceDestroyConformance(device, 'Framebuffer', beforeCreateCount, framebuffer);

    beforeCreateCount = getActiveResourceCount(device);
    const vertexArray = device.createVertexArray({
      id: `${device.type}-conformance-vertex-array`,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      bufferLayout: []
    });
    expectResourceDestroyConformance(device, 'VertexArray', beforeCreateCount, vertexArray);

    const {vertexShader, fragmentShader} = await createRenderShaders(device);
    beforeCreateCount = getActiveResourceCount(device);
    const renderPipeline = device.createRenderPipeline({
      id: `${device.type}-conformance-render-pipeline`,
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT
    });
    expectResourceDestroyConformance(device, 'RenderPipeline', beforeCreateCount, renderPipeline);

    const shaders = new Set([vertexShader, fragmentShader]);
    for (const shader of shaders) {
      beforeCreateCount = getActiveResourceCount(device);
      expectResourceDestroyConformance(device, 'Shader', beforeCreateCount - 1, shader);
    }

    beforeCreateCount = getActiveResourceCount(device);
    const fence = device.createFence();
    await fence.signaled;
    expectResourceDestroyConformance(device, 'Fence', beforeCreateCount, fence);
  }
});

it('Device command-encoder buffer writes preserve command order', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const sourceBuffer = device.createBuffer({
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const destinationBuffer = device.createBuffer({
      byteLength: 2 * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const commandEncoder = device.createCommandEncoder({id: `${device.type}-ordered-writes`});

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
      `${device.type} preserves encoded write/copy order`
    ).toEqual([1, 2]);

    sourceBuffer.destroy();
    destinationBuffer.destroy();
  }
});

it('Device render passes accept zero-valued dynamic stencil state without a vertex array', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const {vertexShader, fragmentShader} = await createIndexedRenderShaders(device);
    const renderPipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      parameters: {
        depthFormat: 'depth24plus-stencil8',
        stencilCompare: 'equal'
      }
    });
    const colorTexture = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthStencilTexture = device.createTexture({
      width: 1,
      height: 1,
      format: 'depth24plus-stencil8',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthStencilTexture
    });

    const renderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 1],
      clearStencil: 0
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setParameters({stencilReference: 1});
    renderPass.draw({vertexCount: 3});
    renderPass.setParameters({stencilReference: 0});
    renderPass.draw({vertexCount: 3});
    renderPass.end();
    device.submit();

    expect(
      await readFirstTexturePixel(device, colorTexture),
      `${device.type} applies stencilReference zero and draws without a vertex array`
    ).toEqual([255, 0, 0, 255]);

    framebuffer.destroy();
    depthStencilTexture.destroy();
    colorTexture.destroy();
    renderPipeline.destroy();
    for (const shader of new Set([vertexShader, fragmentShader])) {
      shader.destroy();
    }
  }
});

it('Device render passes use portable indexed draw offsets', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const {vertexShader, fragmentShader} = await createIndexedRenderShaders(device);
    const renderPipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm']
    });
    const texture = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [texture]});
    const vertexArray = device.createVertexArray({
      shaderLayout: EMPTY_SHADER_LAYOUT,
      bufferLayout: []
    });
    const indexBuffer = device.createBuffer({
      data: new Uint16Array([3, 4, 5, 0, 1, 2]),
      usage: Buffer.INDEX | Buffer.COPY_DST
    });
    vertexArray.setIndexBuffer(indexBuffer);

    const indexedRenderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 1]
    });
    indexedRenderPass.setPipeline(renderPipeline);
    indexedRenderPass.setVertexArray(vertexArray);
    indexedRenderPass.draw({indexCount: 3, firstIndex: 3});
    indexedRenderPass.end();
    device.submit();

    expect(
      await readFirstTexturePixel(device, texture),
      `${device.type} firstIndex selects the expected indexed triangle`
    ).toEqual([255, 0, 0, 255]);

    const zeroIndexRenderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 1]
    });
    zeroIndexRenderPass.setPipeline(renderPipeline);
    zeroIndexRenderPass.setVertexArray(vertexArray);
    zeroIndexRenderPass.draw({vertexCount: 3, indexCount: 0});
    zeroIndexRenderPass.end();
    device.submit();

    expect(
      await readFirstTexturePixel(device, texture),
      `${device.type} indexCount zero does not fall back to a non-indexed draw`
    ).toEqual([0, 0, 0, 255]);

    const zeroInstanceRenderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 1]
    });
    zeroInstanceRenderPass.setPipeline(renderPipeline);
    zeroInstanceRenderPass.setVertexArray(vertexArray);
    zeroInstanceRenderPass.draw({vertexCount: 3, instanceCount: 0, isInstanced: true});
    zeroInstanceRenderPass.end();
    device.submit();

    expect(
      await readFirstTexturePixel(device, texture),
      `${device.type} instanceCount zero does not draw an implicit instance`
    ).toEqual([0, 0, 0, 255]);

    indexBuffer.destroy();
    vertexArray.destroy();
    framebuffer.destroy();
    texture.destroy();
    renderPipeline.destroy();
    for (const shader of new Set([vertexShader, fragmentShader])) {
      shader.destroy();
    }
  }
});
