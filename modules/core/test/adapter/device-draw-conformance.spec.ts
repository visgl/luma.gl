// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, type Device, type RenderPassParameters, type Shader} from '@luma.gl/core';
import type {WebGLDevice} from '@luma.gl/core/webgl';
import {getTestDevices} from '@luma.gl/core/test-utils';

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

/** Reads the first `width` RGBA8 pixels of the first texture row. */
async function readTexturePixels(
  device: Device,
  texture: Texture,
  width: number = 1
): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width, height: 1});
  const readBuffer = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height: 1}, readBuffer);
    const data = await readBuffer.readAsync();
    return Array.from(data.slice(0, width * 4));
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
      await readTexturePixels(device, colorTexture),
      `${device.type} applies stencilReference zero and draws without a vertex array`
    ).toEqual([255, 0, 0, 255]);

    if (device.type === 'webgl') {
      const {gl} = device as WebGLDevice;
      const previousFrontMask = gl.getParameter(gl.STENCIL_WRITEMASK);
      const previousBackMask = gl.getParameter(gl.STENCIL_BACK_WRITEMASK);
      try {
        gl.stencilMask(0);
        const clearPass = device.beginRenderPass({
          framebuffer,
          clearColor: [0, 0, 0, 1],
          clearStencil: 0x80
        });
        try {
          expect(gl.getParameter(gl.STENCIL_WRITEMASK)).toBe(0);
          expect(gl.getParameter(gl.STENCIL_BACK_WRITEMASK)).toBe(0);
          clearPass.setPipeline(renderPipeline);
          clearPass.setParameters({stencilReference: 0x80});
          clearPass.draw({vertexCount: 3});
        } finally {
          clearPass.end();
        }
        device.submit();
        expect(await readTexturePixels(device, colorTexture)).toEqual([255, 0, 0, 255]);
      } finally {
        gl.stencilMaskSeparate(gl.FRONT, previousFrontMask);
        gl.stencilMaskSeparate(gl.BACK, previousBackMask);
      }
    }

    framebuffer.destroy();
    depthStencilTexture.destroy();
    colorTexture.destroy();
    renderPipeline.destroy();
    for (const shader of new Set([vertexShader, fragmentShader])) {
      shader.destroy();
    }
  }
});

it('Device render pipelines with a depth-stencil attachment format apply stencil parameters', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const {vertexShader, fragmentShader} = await createIndexedRenderShaders(device);
    const stencilWritePipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      parameters: {
        colorMask: 0,
        stencilReadMask: 0xff,
        stencilWriteMask: 0xff,
        stencilFront: {passOp: 'replace'},
        stencilBack: {passOp: 'replace'}
      }
    });
    const stencilTestPipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus-stencil8',
      parameters: {
        stencilWriteMask: 0,
        stencilCompare: 'equal',
        stencilPassOperation: 'keep'
      }
    });
    // One row, so the expected pixels don't depend on the framebuffer y origin
    const colorTexture = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthStencilTexture = device.createTexture({
      width: 2,
      height: 1,
      format: 'depth24plus-stencil8',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 2,
      height: 1,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthStencilTexture
    });

    // WebGL scissors clears and WebGPU doesn't, so clear in a separate pass
    device
      .beginRenderPass({framebuffer, clearColor: [0, 0, 1, 1], clearDepth: 0, clearStencil: 0})
      .end();
    // Write the high stencil bit into the right pixel only
    const writePass = device.beginRenderPass({
      framebuffer,
      clearColor: false,
      clearDepth: false,
      clearStencil: false,
      parameters: {scissorRect: [1, 0, 1, 1]}
    });
    writePass.setPipeline(stencilWritePipeline);
    writePass.setParameters({stencilReference: 0x80});
    writePass.draw({vertexCount: 3});
    writePass.end();
    device.submit();
    expect(
      await readTexturePixels(device, colorTexture, 2),
      `${device.type} stencil population preserves both color pixels`
    ).toEqual([0, 0, 255, 255, 0, 0, 255, 255]);

    // The full-screen triangle covers both pixels; the stencil test keeps only the right one
    const testPass = device.beginRenderPass({
      framebuffer,
      clearColor: false,
      clearDepth: false,
      clearStencil: false,
      stencilReadOnly: true
    });
    testPass.setPipeline(stencilTestPipeline);
    testPass.setParameters({stencilReference: 0x80});
    testPass.draw({vertexCount: 3});
    testPass.end();
    device.submit();

    expect(
      await readTexturePixels(device, colorTexture, 2),
      `${device.type} stencil test masks the left pixel`
    ).toEqual([0, 0, 255, 255, 255, 0, 0, 255]);

    device
      .beginRenderPass({
        framebuffer,
        clearColor: false,
        clearDepth: false,
        clearStencil: false,
        stencilStoreOp: 'discard'
      })
      .end();

    const depthTestPipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus-stencil8',
      parameters: {depthCompare: 'less'}
    });
    const depthTestPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 1, 1],
      clearDepth: false,
      clearStencil: 0
    });
    depthTestPass.setPipeline(depthTestPipeline);
    depthTestPass.draw({vertexCount: 3});
    depthTestPass.end();
    device.submit();
    expect(
      await readTexturePixels(device, colorTexture, 2),
      `${device.type} discarding and clearing stencil preserves depth`
    ).toEqual([0, 0, 255, 255, 0, 0, 255, 255]);
    depthTestPipeline.destroy();

    // The draw scissor covers only the right pixel, but the stencil clear covers the whole target.
    device
      .beginRenderPass({
        framebuffer,
        clearColor: false,
        clearDepth: false,
        clearStencil: 0x82,
        parameters: {scissorRect: [1, 0, 1, 1]}
      })
      .end();
    const clearTestPass = device.beginRenderPass({
      framebuffer,
      clearColor: false,
      clearDepth: false,
      clearStencil: false
    });
    clearTestPass.setPipeline(stencilTestPipeline);
    clearTestPass.setParameters({stencilReference: 0x82});
    clearTestPass.draw({vertexCount: 3});
    clearTestPass.end();
    device.submit();
    expect(
      await readTexturePixels(device, colorTexture, 2),
      `${device.type} stencil clear ignores the draw scissor`
    ).toEqual([255, 0, 0, 255, 255, 0, 0, 255]);

    // Count an outer triangle and an oppositely wound contour over the right pixel.
    const windingSource =
      device.type === 'webgpu' ? WGSL_INDEXED_RENDER_SOURCE : GLSL_INDEXED_VERTEX_SOURCE;
    const vector = device.type === 'webgpu' ? 'vec2<f32>' : 'vec2';
    const windingShader = device.createShader({
      ...(device.type === 'webgl' ? {stage: 'vertex' as const} : {}),
      source: windingSource.replace(
        /vec2(?:<f32>)?\(2\.0, 2\.0\)(?:,\s*vec2(?:<f32>)?\(2\.0, 2\.0\)){2}/,
        `${vector}(0.0, -2.0), ${vector}(0.0, 2.0), ${vector}(2.0, -2.0)`
      )
    });
    await windingShader.asyncCompilationStatus;
    const windingPipeline = device.createRenderPipeline({
      vs: windingShader,
      fs: device.type === 'webgpu' ? windingShader : fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus-stencil8',
      parameters: {
        colorMask: 0,
        stencilFront: {passOp: 'increment-wrap'},
        stencilBack: {passOp: 'decrement-wrap'}
      }
    });
    const coverPipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus-stencil8',
      parameters: {stencilCompare: 'not-equal', stencilWriteMask: 0}
    });
    const windingPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 1, 1],
      clearStencil: 0
    });
    windingPass.setPipeline(windingPipeline);
    windingPass.draw({vertexCount: 6});
    windingPass.setPipeline(coverPipeline);
    windingPass.setParameters({stencilReference: 0});
    windingPass.draw({vertexCount: 3});
    windingPass.end();
    device.submit();
    expect(
      await readTexturePixels(device, colorTexture, 2),
      `${device.type} opposite stencil winding cancels on the right`
    ).toEqual([255, 0, 0, 255, 0, 0, 255, 255]);
    windingPipeline.destroy();
    coverPipeline.destroy();
    windingShader.destroy();

    framebuffer.destroy();
    depthStencilTexture.destroy();
    colorTexture.destroy();
    stencilWritePipeline.destroy();
    stencilTestPipeline.destroy();
    for (const shader of new Set([vertexShader, fragmentShader])) {
      shader.destroy();
    }
  }
});

it('resolves partial geometry coverage with four-sample color and depth', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const {vertexShader, fragmentShader} = await createIndexedRenderShaders(device);
    const source =
      device.type === 'webgpu' ? WGSL_INDEXED_RENDER_SOURCE : GLSL_INDEXED_VERTEX_SOURCE;
    // End the triangle a quarter of the way into the right pixel.
    const edgeShader = device.createShader({
      ...(device.type === 'webgl' ? {stage: 'vertex' as const} : {}),
      source: source.replace('3.0, -1.0', '0.25, -1.0').replace('-1.0, 3.0', '0.25, 3.0')
    });
    await edgeShader.asyncCompilationStatus;
    const colorTexture = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: 2,
      height: 1,
      samples: 4,
      colorAttachments: [colorTexture],
      depthStencilAttachment: 'depth24plus'
    });
    const pipeline = device.createRenderPipeline({
      vs: edgeShader,
      fs: device.type === 'webgpu' ? edgeShader : fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {sampleCount: 4, depthCompare: 'less', depthWriteEnabled: true}
    });
    if (device.type === 'webgl') expect(framebuffer.depthStencilAttachment).toBeNull();
    try {
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1], clearDepth: 1});
      pass.setPipeline(pipeline);
      pass.draw({vertexCount: 3});
      pass.end();
      device.submit();
      const pixels = await readTexturePixels(device, colorTexture, 2);
      expect(pixels[4], `${device.type} resolves partially covered red samples`).toBeGreaterThan(0);
      expect(pixels[4]).toBeLessThan(255);
    } finally {
      pipeline.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      for (const shader of new Set([vertexShader, fragmentShader, edgeShader])) shader.destroy();
    }
  }
});

it('resolves four-sample color gated by a multisampled stencil attachment', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const {vertexShader, fragmentShader} = await createIndexedRenderShaders(device);
    const stencilWritePipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      parameters: {
        sampleCount: 4,
        colorMask: 0,
        stencilReadMask: 0xff,
        stencilWriteMask: 0xff,
        stencilFront: {passOp: 'replace'},
        stencilBack: {passOp: 'replace'}
      }
    });
    const stencilTestPipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus-stencil8',
      parameters: {
        sampleCount: 4,
        stencilWriteMask: 0,
        stencilCompare: 'equal',
        stencilPassOperation: 'keep'
      }
    });
    // One row, so the expected pixels don't depend on the framebuffer y origin
    const colorTexture = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: 2,
      height: 1,
      colorAttachments: [colorTexture],
      depthStencilAttachment: 'depth24plus-stencil8',
      samples: 4
    });

    // WebGL scissors clears and WebGPU doesn't, so clear in a separate pass
    device
      .beginRenderPass({framebuffer, clearColor: [0, 0, 1, 1], clearDepth: 0, clearStencil: 0})
      .end();
    // Write the high stencil bit into the right pixel only
    const writePass = device.beginRenderPass({
      framebuffer,
      clearColor: false,
      clearDepth: false,
      clearStencil: false,
      parameters: {scissorRect: [1, 0, 1, 1]}
    });
    writePass.setPipeline(stencilWritePipeline);
    writePass.setParameters({stencilReference: 0x80});
    writePass.draw({vertexCount: 3});
    writePass.end();
    device.submit();
    expect(
      await readTexturePixels(device, colorTexture, 2),
      `${device.type} stencil population preserves both color pixels`
    ).toEqual([0, 0, 255, 255, 0, 0, 255, 255]);

    // The full-screen triangle covers both pixels; the stencil test keeps only the right one
    const testPass = device.beginRenderPass({
      framebuffer,
      clearColor: false,
      clearDepth: false,
      clearStencil: false,
      stencilReadOnly: true
    });
    testPass.setPipeline(stencilTestPipeline);
    testPass.setParameters({stencilReference: 0x80});
    testPass.draw({vertexCount: 3});
    testPass.end();
    device.submit();

    expect(
      await readTexturePixels(device, colorTexture, 2),
      `${device.type} stencil test masks the left pixel`
    ).toEqual([0, 0, 255, 255, 255, 0, 0, 255]);
    framebuffer.destroy();
    colorTexture.destroy();
    stencilWritePipeline.destroy();
    stencilTestPipeline.destroy();
    for (const shader of new Set([vertexShader, fragmentShader])) shader.destroy();
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
      await readTexturePixels(device, texture),
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
      await readTexturePixels(device, texture),
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
      await readTexturePixels(device, texture),
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

it('Device render passes apply initial viewport and scissorRect parameters', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const {vertexShader, fragmentShader} = await createIndexedRenderShaders(device);
    const renderPipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      shaderLayout: EMPTY_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm']
    });
    // One row, so the expected pixels don't depend on the framebuffer y origin
    const texture = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: 2,
      height: 1,
      colorAttachments: [texture]
    });
    const testCases: Array<{parameters: RenderPassParameters; message: string}> = [
      {parameters: {scissorRect: [1, 0, 1, 1]}, message: 'scissorRect limits the draw'},
      {parameters: {viewport: [1, 0, 1, 1]}, message: 'viewport limits the draw'}
    ];

    for (const {parameters, message} of testCases) {
      // WebGL scissors clears and WebGPU doesn't, so clear in a separate pass
      device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]}).end();
      // The full-screen triangle covers both pixels unless the parameters are applied
      const renderPass = device.beginRenderPass({framebuffer, clearColor: false, parameters});
      renderPass.setPipeline(renderPipeline);
      renderPass.draw({vertexCount: 3});
      renderPass.end();
      device.submit();

      expect(
        await readTexturePixels(device, texture, 2),
        `${device.type} ${message} to the right pixel`
      ).toEqual([0, 0, 0, 255, 255, 0, 0, 255]);
    }

    framebuffer.destroy();
    texture.destroy();
    renderPipeline.destroy();
    for (const shader of new Set([vertexShader, fragmentShader])) {
      shader.destroy();
    }
  }
});

it('loads unsigned stencil values through a stencil-only texture view', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const texture = device.createTexture({
      width: 1,
      height: 1,
      format: 'depth24plus-stencil8',
      usage: Texture.RENDER | Texture.SAMPLE
    });
    if (device.type === 'webgl' && !device.features.has('stencil-texturing-webgl')) {
      expect(() => texture.createView({aspect: 'stencil-only'})).toThrow();
      texture.destroy();
      continue;
    }

    const stencilView = texture.createView({aspect: 'stencil-only'});
    const color = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const source = device.createFramebuffer({depthStencilAttachment: texture});
    const target = device.createFramebuffer({colorAttachments: [color]});
    const {vertexShader, fragmentShader} = await createIndexedRenderShaders(device);
    const sampledFragment = device.createShader(
      device.type === 'webgpu'
        ? {
            source: `
          @group(0) @binding(0) var stencilValues: texture_2d<u32>;
          @fragment fn fragmentMain() -> @location(0) vec4f {
            return vec4f(f32(textureLoad(stencilValues, vec2i(0), 0).r) / 255.0, 0, 0, 1);
          }`
          }
        : {
            stage: 'fragment',
            source: `#version 300 es
          precision highp float;
          uniform highp usampler2D stencilValues;
          out vec4 color;
          void main() { color = vec4(float(texelFetch(stencilValues, ivec2(0), 0).r) / 255.0, 0, 0, 1); }`
          }
    );
    await sampledFragment.asyncCompilationStatus;
    const pipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: sampledFragment,
      colorAttachmentFormats: ['rgba8unorm'],
      shaderLayout: {
        attributes: [],
        bindings: [
          {
            name: 'stencilValues',
            type: 'texture',
            group: 0,
            location: 0,
            sampleType: 'uint',
            viewDimension: '2d'
          }
        ]
      }
    });
    try {
      device.beginRenderPass({framebuffer: source, clearStencil: 128}).end();
      const pass = device.beginRenderPass({framebuffer: target});
      pass.setPipeline(pipeline);
      pass.setBindings({stencilValues: stencilView});
      pass.draw({vertexCount: 3});
      pass.end();
      device.submit();
      expect(await readTexturePixels(device, color)).toEqual([128, 0, 0, 255]);
    } finally {
      pipeline.destroy();
      sampledFragment.destroy();
      for (const shader of new Set([vertexShader, fragmentShader])) shader.destroy();
      target.destroy();
      source.destroy();
      color.destroy();
      stencilView.destroy();
      texture.destroy();
    }
  }
});
