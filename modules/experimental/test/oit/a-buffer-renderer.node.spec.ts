// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {
  ABufferRenderer,
  aBuffer,
  aBufferPlugin,
  createABufferResolveShaderPassPipeline,
  getABufferSlicePlan,
  getABufferSupport
} from '@luma.gl/experimental';
import {getTestDevices, getWebGPUTestDevice} from '@luma.gl/test-utils';

test('aBuffer plugin exposes the WGSL module only', t => {
  t.equal(aBufferPlugin.name, 'aBuffer', 'plugin has stable name');
  t.deepEqual(aBufferPlugin.wgsl?.modules, [aBuffer], 'plugin adds A-buffer WGSL module');
  t.equal(aBufferPlugin.glsl, undefined, 'plugin does not advertise GLSL support');
  t.match(
    aBuffer.source,
    /A_BUFFER_EMPTY_FRAGMENT_POINTER: u32 = 0u/,
    'zero-initialized head pointers represent empty pixels'
  );
  t.match(
    aBuffer.source,
    /let fragmentPointer = fragmentIndex \+ 1u/,
    'stored fragment pointers are one-based'
  );
  t.match(
    aBuffer.source,
    /textureLoad\(opaqueDepthTexture, fragmentCoordinates, 0\)/,
    'capture explicitly tests opaque depth before storing fragments'
  );
  t.end();
});

test('A-buffer resolve is packaged as a ShaderPassPipeline', t => {
  const pipeline = createABufferResolveShaderPassPipeline({maxFragmentsPerPixel: 8});
  t.equal(pipeline.steps.length, 1, 'resolve pipeline has one fullscreen step');
  t.equal(pipeline.steps[0].shaderPass.name, 'aBufferResolve', 'pipeline uses the resolve pass');
  t.deepEqual(
    pipeline.steps[0].inputs,
    {sourceTexture: 'previous'},
    'resolve composites over the previous color'
  );
  t.throws(
    () => createABufferResolveShaderPassPipeline({maxFragmentsPerPixel: 0}),
    /at least 1/,
    'invalid fragment limits are rejected'
  );
  t.end();
});

test('getABufferSlicePlan fits fragments inside storage limits', t => {
  const slicePlan = getABufferSlicePlan({
    width: 100,
    height: 50,
    averageFragmentsPerPixel: 4,
    maxStorageBufferBindingSize: 24_000,
    maxBufferSize: 24_000
  });

  t.deepEqual(
    slicePlan,
    {
      width: 100,
      height: 50,
      sliceHeight: 5,
      sliceCount: 10,
      maxSlicePixelCount: 500,
      fragmentCapacity: 2000,
      headPointerByteLength: 2008,
      fragmentByteLength: 24_000
    },
    'slice plan budgets fragment storage and scanline slices'
  );
  t.end();
});

test('getABufferSlicePlan rejects impossible scanlines', t => {
  t.throws(
    () =>
      getABufferSlicePlan({
        width: 100,
        height: 50,
        averageFragmentsPerPixel: 4,
        maxStorageBufferBindingSize: 1000,
        maxBufferSize: 1000
      }),
    /cannot fit one scanline/,
    'one scanline must fit inside the storage budget'
  );
  t.end();
});

test('getABufferSupport reports WebGPU-only support', async t => {
  const devices = await getTestDevices();

  for (const device of devices) {
    const support = getABufferSupport(device);
    if (device.type === 'webgpu') {
      t.equal(support.supported, true, 'WebGPU device supports A-buffer setup');
    } else {
      t.equal(support.supported, false, `${device.type} device is rejected`);
      t.match(support.reason || '', /WebGPU/, 'unsupported reason mentions WebGPU');
    }
  }
});

test('ABufferRenderer composites instanced translucent fragments independent of instance order', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const {framebuffer, colorTexture, depthTexture} = createFramebuffer(device, 1, 1);
  const renderer = new ABufferRenderer(device);
  const forwardColor = await renderInstancedTransparency(device, renderer, framebuffer, false);
  const reverseColor = await renderInstancedTransparency(device, renderer, framebuffer, true);

  t.deepEqual(reverseColor, forwardColor, 'reversing instance order preserves the OIT result');
  t.deepEqual(forwardColor, [128, 0, 64, 191], 'premultiplied red over blue composites');

  renderer.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  depthTexture.destroy();
  t.end();
});

test('ABufferRenderer composites bounded-memory slices', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const {framebuffer, colorTexture, depthTexture} = createFramebuffer(device, 2, 2);
  const renderer = new ABufferRenderer(device, {
    averageFragmentsPerPixel: 1,
    maxFragmentsPerPixel: 2,
    maxBufferByteLength: 24
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

  t.deepEqual(
    pixels,
    referencePixels,
    'bounded horizontal slices match a single-slice resolve for row-varying colors'
  );
  t.notDeepEqual(pixels.slice(0, 4), pixels.slice(8, 12), 'test data distinguishes output rows');

  renderer.destroy();
  referenceRenderer.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  depthTexture.destroy();
  t.end();
});

test('ABufferRenderer rejects translucent fragments behind opaque depth', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const {framebuffer, colorTexture, depthTexture} = createFramebuffer(device, 1, 1);
  const renderer = new ABufferRenderer(device);
  const pixel = await renderOpaqueOcclusion(device, renderer, framebuffer);

  t.deepEqual(pixel, [0, 255, 0, 255], 'opaque surface occludes translucent storage writes');

  renderer.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  depthTexture.destroy();
  t.end();
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
