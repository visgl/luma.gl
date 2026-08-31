// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  Buffer,
  type Device,
  type Framebuffer,
  Texture,
  type TextureFormatColor
} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {
  WBOITRenderer,
  createWBOITResolveShaderPassPipeline,
  getWBOITSupport,
  wboit,
  wboitPlugin,
  wboitResolve
} from '@luma.gl/experimental';
import {getTestDevice, getTestDevices} from '@luma.gl/test-utils';

it('wboit module exposes portable capture helpers', () => {
  expect(wboitPlugin.name, 'plugin has stable name').toBe('wboit');
  expect(wboitPlugin.modules, 'plugin installs the portable shader module').toEqual([wboit]);
  expect(wboit.source || '', 'WGSL helper is present').toMatch(/wboit_captureStraightColor/);
  expect(wboit.fs || '', 'GLSL helper is present').toMatch(/wboit_captureStraightColor/);
  expect(wboit.getUniforms?.({pass: 'accumulation'}), 'selects accumulation').toEqual({
    capturePass: 1
  });
  expect(wboit.getUniforms?.({pass: 'revealage'}), 'selects revealage').toEqual({capturePass: 2});
  expect(wboit.getUniforms?.({}), 'defaults to inactive').toEqual({capturePass: 0});
});

it('WBOIT resolve is packaged as a ShaderPassPipeline', () => {
  const pipeline = createWBOITResolveShaderPassPipeline();
  expect(pipeline.steps.length, 'resolve pipeline has one fullscreen step').toBe(1);
  expect(pipeline.steps[0].shaderPass, 'pipeline uses the exported resolve pass').toBe(
    wboitResolve
  );
  expect(pipeline.steps[0].inputs, 'resolve composites over the previous color').toEqual({
    sourceTexture: 'previous'
  });
});

it('getWBOITSupport reports backend and rgba16float requirements', async () => {
  const nullDevice = await getTestDevice('null');
  if (nullDevice) {
    const support = getWBOITSupport(nullDevice);
    expect(support.supported, 'null device is rejected').toBe(false);
    expect(support.reason || '', 'reason identifies supported backends').toMatch(
      /WebGPU or WebGL2/
    );
  }

  for (const device of await getTestDevices()) {
    const capabilities = device.getTextureFormatCapabilities('rgba16float');
    expect(
      getWBOITSupport(device).supported,
      `${device.type} support follows rgba16float capabilities`
    ).toBe(capabilities.render && capabilities.blend);
  }
});

it('WBOITRenderer is order independent and rejects fragments behind opaque depth', async () => {
  const devices = await getTestDevices();
  let testedDeviceCount = 0;

  for (const device of devices) {
    if (!getWBOITSupport(device).supported) {
      continue;
    }

    testedDeviceCount += 1;
    const {framebuffer, colorTexture} = createFramebuffer(device, 1, 1);
    const renderer = new WBOITRenderer(device);
    const forwardColor = await renderTransparency(device, renderer, framebuffer, false);
    const reverseColor = await renderTransparency(device, renderer, framebuffer, true);
    const occludedColor = await renderOpaqueOcclusion(device, renderer, framebuffer);

    expect(reverseColor, `${device.type} result is independent of draw order`).toEqual(
      forwardColor
    );
    expect(
      Boolean(forwardColor[3] > 0),
      `${device.type} composite contains translucent alpha`
    ).toBe(true);
    expect(
      Boolean(occludedColor[1] > 245 && occludedColor[0] < 10 && occludedColor[2] < 10),
      `${device.type} opaque depth rejects hidden translucent fragments`
    ).toBe(true);

    renderer.resize({width: 2, height: 2});
    renderer.resize({width: 1, height: 1});
    renderer.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
  }

  expect(Boolean(testedDeviceCount > 0), 'at least one WBOIT backend was tested').toBe(true);
});

it('WBOITRenderer preserves the configured rgba16float resolve format', async () => {
  let testedDeviceCount = 0;

  for (const device of await getTestDevices()) {
    const capabilities = device.getTextureFormatCapabilities('rgba16float');
    if (!getWBOITSupport(device).supported || !capabilities.filter) {
      continue;
    }

    testedDeviceCount += 1;
    const {framebuffer, colorTexture} = createFramebuffer(device, 1, 1, 'rgba16float');
    const renderer = new WBOITRenderer(device, {colorFormat: 'rgba16float'});
    const opaquePass = device.beginRenderPass({
      framebuffer,
      clearColor: [2, 0.5, 0.25, 1],
      clearDepth: 1
    });
    opaquePass.end();

    const outputTexture = renderer.render({
      sourceTexture: colorTexture,
      drawOpaqueDepth: () => {},
      prepareTranslucent: () => {},
      drawTranslucent: () => {}
    });
    device.submit();

    expect(
      outputTexture.format,
      `${device.type} resolved output retains the requested HDR format`
    ).toBe('rgba16float');

    renderer.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
  }

  expect(Boolean(testedDeviceCount > 0), 'at least one HDR-capable WBOIT backend was tested').toBe(
    true
  );
});

async function renderTransparency(
  device: Device,
  renderer: WBOITRenderer,
  framebuffer: Framebuffer,
  reverseOrder: boolean
): Promise<number[]> {
  const shaderInputs = new ShaderInputs({wboit});
  const model = new Model(device, {
    id: `wboit-order-${device.type}-${reverseOrder}`,
    source: getTransparencyWGSL(reverseOrder),
    vs: getTransparencyGLSLVertex(reverseOrder),
    fs: getTransparencyGLSLFragment(),
    plugins: [wboitPlugin],
    shaderInputs,
    vertexCount: 3,
    instanceCount: 2,
    parameters: {depthWriteEnabled: false, depthCompare: 'less-equal'}
  });

  const basePass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0], clearDepth: 1});
  basePass.end();
  const outputTexture = renderer.render({
    sourceTexture: framebuffer.colorAttachments[0].texture,
    drawOpaqueDepth: () => {},
    prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
      shaderInputs.setProps({wboit: shaderModuleProps});
      model.setParameters(captureParameters);
      model.predraw(commandEncoder);
    },
    drawTranslucent: renderPass => model.draw(renderPass)
  });
  device.submit();
  const pixels = await readPixels(outputTexture, 1, 1);
  model.destroy();
  shaderInputs.destroy();
  return pixels;
}

async function renderOpaqueOcclusion(
  device: Device,
  renderer: WBOITRenderer,
  framebuffer: Framebuffer
): Promise<number[]> {
  const shaderInputs = new ShaderInputs({wboit});
  const opaqueModel = new Model(device, {
    source: getSolidColorWGSL(0.25, 'vec4<f32>(0.0, 1.0, 0.0, 1.0)'),
    vs: getSolidColorGLSLVertex(0.25),
    fs: getSolidColorGLSLFragment('vec4(0.0, 1.0, 0.0, 1.0)'),
    vertexCount: 3,
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'}
  });
  const translucentModel = new Model(device, {
    source: getSolidColorWGSL(
      0.75,
      'wboit_captureStraightColor(vec4<f32>(1.0, 0.0, 0.0, 0.5), position)'
    ),
    vs: getSolidColorGLSLVertex(0.75),
    fs: getSolidColorGLSLFragment(
      'wboit_captureStraightColor(vec4(1.0, 0.0, 0.0, 0.5), gl_FragCoord)'
    ),
    plugins: [wboitPlugin],
    shaderInputs,
    vertexCount: 3,
    parameters: {depthWriteEnabled: false, depthCompare: 'less-equal'}
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
    prepareOpaqueDepth: commandEncoder => opaqueModel.predraw(commandEncoder),
    drawOpaqueDepth: renderPass => opaqueModel.draw(renderPass),
    prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
      shaderInputs.setProps({wboit: shaderModuleProps});
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
  return pixels;
}

function createFramebuffer(
  device: Device,
  width: number,
  height: number,
  colorFormat: TextureFormatColor = 'rgba8unorm'
): {framebuffer: Framebuffer; colorTexture: Texture} {
  const colorTexture = device.createTexture({
    width,
    height,
    format: colorFormat,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width,
    height,
    colorAttachments: [colorTexture],
    depthStencilAttachment: 'depth24plus'
  });
  return {framebuffer, colorTexture};
}

function getTransparencyWGSL(reverseOrder: boolean): string {
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
    vec4<f32>(0.0, 0.0, 1.0, 0.5),
    vec4<f32>(1.0, 0.0, 0.0, 0.5),
    isNear
  );
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return wboit_captureStraightColor(inputs.color, inputs.Position);
}
`;
}

function getTransparencyGLSLVertex(reverseOrder: boolean): string {
  return /* glsl */ `\
#version 300 es
precision highp float;
out vec4 color;

void main(void) {
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  bool isNear = ${reverseOrder ? 'gl_InstanceID == 1' : 'gl_InstanceID == 0'};
  gl_Position = vec4(positions[gl_VertexID], isNear ? 0.25 : 0.75, 1.0);
  color = isNear ? vec4(1.0, 0.0, 0.0, 0.5) : vec4(0.0, 0.0, 1.0, 0.5);
}
`;
}

function getTransparencyGLSLFragment(): string {
  return /* glsl */ `\
#version 300 es
precision highp float;
in vec4 color;
out vec4 fragColor;

void main(void) {
  fragColor = wboit_captureStraightColor(color, gl_FragCoord);
}
`;
}

function getSolidColorWGSL(depth: number, fragmentExpression: string): string {
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

function getSolidColorGLSLVertex(depth: number): string {
  return /* glsl */ `\
#version 300 es
precision highp float;

void main(void) {
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  gl_Position = vec4(positions[gl_VertexID], ${depth}, 1.0);
}
`;
}

function getSolidColorGLSLFragment(fragmentExpression: string): string {
  return /* glsl */ `\
#version 300 es
precision highp float;
out vec4 fragColor;

void main(void) {
  fragColor = ${fragmentExpression};
}
`;
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
