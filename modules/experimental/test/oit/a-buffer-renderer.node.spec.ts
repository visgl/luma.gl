// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {
  ABufferRenderer,
  aBuffer,
  aBufferPlugin,
  createABufferResolveCompositeShaderPass,
  getABufferSlicePlan,
  getABufferSupport
} from '@luma.gl/experimental';
import {getTestDevices, getWebGPUTestDevice} from '@luma.gl/test-utils';

it('aBuffer plugin exposes the WGSL module only', () => {
  expect(aBufferPlugin.name, 'plugin has stable name').toBe('aBuffer');
  expect(aBufferPlugin.wgsl?.modules, 'plugin adds A-buffer WGSL module').toEqual([aBuffer]);
  expect(aBufferPlugin.glsl, 'plugin does not advertise GLSL support').toBe(undefined);
  expect(aBuffer.source, 'zero-initialized head pointers represent empty pixels').toMatch(
    /A_BUFFER_EMPTY_FRAGMENT_POINTER: u32 = 0u/
  );
  expect(aBuffer.source, 'stored fragment pointers are one-based').toMatch(
    /let fragmentPointer = fragmentIndex \+ 1u/
  );
  expect(aBuffer.source, 'capture explicitly tests opaque depth before storing fragments').toMatch(
    /textureLoad\(opaqueDepthTexture, fragmentCoordinates, 0\)/
  );
  expect(
    aBuffer.source,
    'capture preserves HDR red and green channels in packed half floats'
  ).toMatch(/pack2x16float\(packedColor\.rg\)/);
  expect(
    aBuffer.source,
    'capture preserves HDR blue and alpha channels in packed half floats'
  ).toMatch(/pack2x16float\(packedColor\.ba\)/);
  expect(
    Boolean(/pack4x8unorm/.test(aBuffer.source)),
    'capture does not clamp HDR color to RGBA8'
  ).toBe(false);
  void 0;
});

it('A-buffer resolve is packaged as a CompositeShaderPass', () => {
  const pipeline = createABufferResolveCompositeShaderPass({maxFragmentsPerPixel: 8});
  expect(pipeline.steps.length, 'resolve pipeline has one fullscreen step').toBe(1);
  expect(pipeline.steps[0].shaderPass.name, 'pipeline uses the resolve pass').toBe(
    'aBufferResolve'
  );
  expect(pipeline.steps[0].inputs, 'resolve composites over the previous color').toEqual({
    sourceTexture: 'previous'
  });
  expect(
    pipeline.steps[0].shaderPass.source,
    'resolve restores HDR red and green channels'
  ).toMatch(/unpack2x16float\(capturedFragment\.colorRedGreen\)/);
  expect(
    pipeline.steps[0].shaderPass.source,
    'resolve restores HDR blue and alpha channels'
  ).toMatch(/unpack2x16float\(capturedFragment\.colorBlueAlpha\)/);
  expect(
    () => createABufferResolveCompositeShaderPass({maxFragmentsPerPixel: 0}),
    'invalid fragment limits are rejected'
  ).toThrow(/at least 1/);
  void 0;
});

it('getABufferSlicePlan fits fragments inside storage limits', () => {
  const slicePlan = getABufferSlicePlan({
    width: 100,
    height: 50,
    averageFragmentsPerPixel: 4,
    maxStorageBufferBindingSize: 24_000,
    maxBufferSize: 24_000
  });

  expect(slicePlan, 'slice plan budgets fragment storage and scanline slices').toEqual({
    width: 100,
    height: 50,
    sliceHeight: 3,
    sliceCount: 17,
    maxSlicePixelCount: 300,
    fragmentCapacity: 1200,
    headPointerByteLength: 1208,
    fragmentByteLength: 19_200
  });
  void 0;
});

it('getABufferSlicePlan rejects impossible scanlines', () => {
  expect(
    () =>
      getABufferSlicePlan({
        width: 100,
        height: 50,
        averageFragmentsPerPixel: 4,
        maxStorageBufferBindingSize: 1000,
        maxBufferSize: 1000
      }),
    'one scanline must fit inside the storage budget'
  ).toThrow(/cannot fit one scanline/);
  void 0;
});

it('getABufferSupport reports WebGPU-only support', async () => {
  const devices = await getTestDevices();

  for (const device of devices) {
    const support = getABufferSupport(device);
    if (device.type === 'webgpu') {
      expect(support.supported, 'WebGPU device supports A-buffer setup').toBe(true);
    } else {
      expect(support.supported, `${device.type} device is rejected`).toBe(false);
      expect(support.reason || '', 'unsupported reason mentions WebGPU').toMatch(/WebGPU/);
    }
  }
});

it('ABufferRenderer composites instanced translucent fragments independent of instance order', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const {framebuffer, colorTexture, depthTexture} = createFramebuffer(device, 1, 1);
  const renderer = new ABufferRenderer(device);
  const forwardColor = await renderInstancedTransparency(device, renderer, framebuffer, false);
  const reverseColor = await renderInstancedTransparency(device, renderer, framebuffer, true);

  expect(reverseColor, 'reversing instance order preserves the OIT result').toEqual(forwardColor);
  expect(forwardColor, 'premultiplied red over blue composites').toEqual([128, 0, 64, 191]);

  renderer.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  depthTexture.destroy();
  void 0;
});

it('ABufferRenderer composites bounded-memory slices', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const {framebuffer, colorTexture, depthTexture} = createFramebuffer(device, 2, 2);
  const renderer = new ABufferRenderer(device, {
    averageFragmentsPerPixel: 1,
    maxFragmentsPerPixel: 2,
    maxBufferByteLength: 32
  });
  const referenceRenderer = new ABufferRenderer(device, {
    averageFragmentsPerPixel: 1,
    maxFragmentsPerPixel: 2
  });
  const pixels = await renderInstancedTransparency(device, renderer, framebuffer, false, true);
  const referencePixels = await renderInstancedTransparency(
    device,
    referenceRenderer,
    framebuffer,
    false,
    true
  );

  expect(
    pixels,
    'bounded horizontal slices match a single-slice resolve for row-varying colors'
  ).toEqual(referencePixels);
  expect(pixels.slice(0, 4), 'test data distinguishes output rows').not.toEqual(
    pixels.slice(8, 12)
  );

  renderer.destroy();
  referenceRenderer.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  depthTexture.destroy();
  void 0;
});

it('ABufferRenderer rejects translucent fragments behind opaque depth', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const {framebuffer, colorTexture, depthTexture} = createFramebuffer(device, 1, 1);
  const renderer = new ABufferRenderer(device);
  const pixel = await renderOpaqueOcclusion(device, renderer, framebuffer);

  expect(pixel, 'opaque surface occludes translucent storage writes').toEqual([0, 255, 0, 255]);

  renderer.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  depthTexture.destroy();
  void 0;
});

async function renderInstancedTransparency(
  device: Device,
  renderer: ABufferRenderer,
  framebuffer: Framebuffer,
  reverseOrder: boolean,
  varyByRow = false
): Promise<number[]> {
  const shaderInputs = new ShaderInputs({aBuffer});
  const model = new Model(device, {
    source: getInstancedTransparencyShader(reverseOrder, varyByRow),
    plugins: [aBufferPlugin],
    shaderInputs,
    vertexCount: 3,
    instanceCount: 2
  });

  const basePass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0], clearDepth: 1});
  basePass.end();
  const outputTexture = renderer.render({
    sourceTexture: framebuffer.colorAttachments[0].texture,
    opaqueDepthTexture: framebuffer.depthStencilAttachment!,
    prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
      shaderInputs.setProps({aBuffer: shaderModuleProps});
      model.setParameters(captureParameters);
      model.predraw(commandEncoder);
    },
    drawTranslucent: renderPass => {
      model.draw(renderPass);
    }
  });
  device.submit();

  const pixels = await readPixels(outputTexture, framebuffer.width, framebuffer.height);
  model.destroy();
  shaderInputs.destroy();
  return Array.from(pixels);
}

function getInstancedTransparencyShader(reverseOrder: boolean, varyByRow: boolean): string {
  return /* wgsl */ `\
struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  let isNear = ${reverseOrder ? 'instanceIndex == 1u' : 'instanceIndex == 0u'};

  var outputs: FragmentInputs;
  outputs.Position = vec4<f32>(positions[vertexIndex], select(0.75, 0.25, isNear), 1.0);
  outputs.color = select(
    vec4<f32>(0.0, 0.0, 0.5, 0.5),
    vec4<f32>(0.5, 0.0, 0.0, 0.5),
    isNear
  );
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  var color = inputs.color;
  if (${varyByRow} && inputs.Position.y > 1.0) {
    color = vec4<f32>(color.b, color.r, color.g, color.a);
  }
  return aBuffer_capturePremultipliedColor(color, inputs.Position);
}
`;
}

async function renderOpaqueOcclusion(
  device: Device,
  renderer: ABufferRenderer,
  framebuffer: Framebuffer
): Promise<number[]> {
  const shaderInputs = new ShaderInputs({aBuffer});
  const opaqueModel = new Model(device, {
    source: getSolidColorShader(0.25, 'vec4<f32>(0.0, 1.0, 0.0, 1.0)'),
    vertexCount: 3,
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'}
  });
  const translucentModel = new Model(device, {
    source: getSolidColorShader(
      0.75,
      'aBuffer_captureStraightColor(vec4<f32>(1.0, 0.0, 0.0, 0.5), position)'
    ),
    plugins: [aBufferPlugin],
    shaderInputs,
    vertexCount: 3
  });

  opaqueModel.predraw(device.commandEncoder);
  const basePass = device.beginRenderPass({
    framebuffer,
    clearColor: [0, 0, 0, 0],
    clearDepth: 1
  });
  opaqueModel.draw(basePass);
  basePass.end();

  const outputTexture = renderer.render({
    sourceTexture: framebuffer.colorAttachments[0].texture,
    opaqueDepthTexture: framebuffer.depthStencilAttachment!,
    prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
      shaderInputs.setProps({aBuffer: shaderModuleProps});
      translucentModel.setParameters(captureParameters);
      translucentModel.predraw(commandEncoder);
    },
    drawTranslucent: renderPass => translucentModel.draw(renderPass)
  });
  device.submit();

  const pixels = await readPixels(outputTexture, 1, 1);
  opaqueModel.destroy();
  translucentModel.destroy();
  shaderInputs.destroy();
  return Array.from(pixels);
}

function getSolidColorShader(depth: number, fragmentExpression: string): string {
  return /* wgsl */ `\
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  return vec4<f32>(positions[vertexIndex], ${depth}, 1.0);
}

@fragment
fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  return ${fragmentExpression};
}
`;
}

function createFramebuffer(
  device: Device,
  width: number,
  height: number
): {framebuffer: Framebuffer; colorTexture: Texture; depthTexture: Texture} {
  const colorTexture = device.createTexture({
    width,
    height,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC
  });
  const depthTexture = device.createTexture({
    width,
    height,
    format: 'depth24plus',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  return {
    framebuffer: device.createFramebuffer({
      width,
      height,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    }),
    colorTexture,
    depthTexture
  };
}

async function readPixels(texture: Texture, width: number, height: number): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, buffer);
    const arrayBufferView = await buffer.readAsync(0, layout.byteLength);
    const source = new Uint8Array(
      arrayBufferView.buffer,
      arrayBufferView.byteOffset,
      arrayBufferView.byteLength
    );
    const pixels: number[] = [];
    for (let row = 0; row < height; row++) {
      pixels.push(
        ...source.subarray(row * layout.bytesPerRow, row * layout.bytesPerRow + width * 4)
      );
    }
    return pixels;
  } finally {
    buffer.destroy();
  }
}
