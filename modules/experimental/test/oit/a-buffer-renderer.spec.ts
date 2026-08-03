// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, Texture} from '@luma.gl/core';
import {Model, ShaderInputs, ShaderPassRenderer} from '@luma.gl/engine';
import {
  ABufferRenderer,
  aBuffer,
  aBufferPlugin,
  createABufferResolveShaderPassPipeline
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const SHADER_STAGE_FRAGMENT = 0x2;

const A_BUFFER_MODEL_SHADER = /* wgsl */ `\
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}

@fragment
fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  return aBuffer_captureStraightColor(vec4<f32>(1.0, 0.0, 0.0, 0.5), position);
}
`;

test('aBufferPlugin applies fragment-only storage visibility to WebGPU models', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const model = new Model(device, {
    id: 'a-buffer-plugin-visibility',
    source: A_BUFFER_MODEL_SHADER,
    plugins: [aBufferPlugin],
    vertexCount: 3
  });

  for (const bindingName of ['headPointers', 'fragments', 'opaqueDepthTexture']) {
    const modelBinding = model.props.shaderLayout?.bindings.find(
      binding => binding.name === bindingName
    );
    const pipelineBinding = model.pipeline.shaderLayout.bindings.find(
      binding => binding.name === bindingName
    );

    t.equal(
      modelBinding?.visibility,
      SHADER_STAGE_FRAGMENT,
      `${bindingName} is fragment-only in the assembled model layout`
    );
    t.equal(
      pipelineBinding?.visibility,
      SHADER_STAGE_FRAGMENT,
      `${bindingName} remains fragment-only in the pipeline layout`
    );
  }

  model.destroy();
  t.end();
});

test('A-buffer resolve ShaderPassPipeline compiles on WebGPU', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [createABufferResolveShaderPassPipeline({maxFragmentsPerPixel: 12})]
  });
  t.equal(
    renderer.passRenderers[0].passDefinition.name,
    'aBufferResolveShaderPassPipeline',
    'resolve pipeline creates a WebGPU fullscreen model'
  );
  renderer.destroy();
  t.end();
});

test('ABufferRenderer preserves HDR translucent fragments in rgba16float outputs', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  if (!capabilities.render || !capabilities.filter) {
    t.comment('Renderable, filterable rgba16float textures are not available');
    t.end();
    return;
  }

  const sourceTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba16float',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  const opaqueDepthTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'depth24plus',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: [sourceTexture],
    depthStencilAttachment: opaqueDepthTexture
  });
  const shaderInputs = new ShaderInputs({aBuffer});
  const model = new Model(device, {
    id: 'a-buffer-hdr-fragment-capture',
    source: A_BUFFER_MODEL_SHADER.replace(
      'vec4<f32>(1.0, 0.0, 0.0, 0.5)',
      'vec4<f32>(4.0, 0.4, 0.0, 0.5)'
    ),
    plugins: [aBufferPlugin],
    shaderInputs,
    vertexCount: 3
  });
  const opaquePass = device.beginRenderPass({
    framebuffer,
    clearColor: [0.25, 0.25, 0, 1],
    clearDepth: 1
  });
  opaquePass.end();
  const renderer = new ABufferRenderer(device, {colorFormat: 'rgba16float'});
  const outputTexture = renderer.render({
    sourceTexture,
    opaqueDepthTexture: opaqueDepthTexture.view,
    prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
      shaderInputs.setProps({aBuffer: shaderModuleProps});
      model.setParameters(captureParameters);
      model.predraw(commandEncoder);
    },
    drawTranslucent: renderPass => model.draw(renderPass)
  });
  device.submit();
  const outputColor = await readHalfFloatColor(outputTexture);

  t.equal(outputTexture.format, 'rgba16float', 'resolved output retains the requested HDR format');
  t.ok(outputColor[0] > 2, 'translucent HDR red survives capture and resolve without clipping');
  t.ok(
    outputColor[1] > 0.3 && outputColor[1] < 0.4,
    'lower-intensity translucent channels retain their original proportions'
  );
  t.deepEqual(
    renderer.props,
    {
      averageFragmentsPerPixel: 4,
      maxFragmentsPerPixel: 12,
      maxBufferByteLength: Number.MAX_SAFE_INTEGER
    },
    'optional output format does not alter existing resolved capture properties'
  );

  model.destroy();
  shaderInputs.destroy();
  renderer.destroy();
  framebuffer.destroy();
  sourceTexture.destroy();
  opaqueDepthTexture.destroy();
  t.end();
});

async function readHalfFloatColor(texture: Texture): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });

  try {
    texture.readBuffer({width: 1, height: 1}, buffer);
    const result = await buffer.readAsync(0, layout.byteLength);
    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
    return Array.from({length: 4}, (_, channelIndex) =>
      decodeHalfFloat(view.getUint16(channelIndex * 2, true))
    );
  } finally {
    buffer.destroy();
  }
}

function decodeHalfFloat(value: number): number {
  const sign = value & 0x8000 ? -1 : 1;
  const exponent = (value >> 10) & 0x1f;
  const fraction = value & 0x03ff;

  if (exponent === 0) {
    return sign * 2 ** -14 * (fraction / 1024);
  }
  if (exponent === 0x1f) {
    return fraction === 0 ? sign * Number.POSITIVE_INFINITY : Number.NaN;
  }
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}
