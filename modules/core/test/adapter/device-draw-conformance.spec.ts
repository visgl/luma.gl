// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, type Device, type Shader} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/test-utils';

const DEVICE_TYPES = ['webgl', 'webgpu'] as const;
const EMPTY_SHADER_LAYOUT = {attributes: [], bindings: []};

const GLSL_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() {
  fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
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
