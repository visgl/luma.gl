// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Texture} from '@luma.gl/core';
import {Model, ShaderPassRenderer} from '@luma.gl/engine';
import {
  ABufferRenderer,
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

test('ABufferRenderer preserves the configured rgba16float resolve format', async t => {
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
  const renderer = new ABufferRenderer(device, {colorFormat: 'rgba16float'});
  const outputTexture = renderer.render({
    sourceTexture,
    opaqueDepthTexture: opaqueDepthTexture.view,
    prepareTranslucent: () => {},
    drawTranslucent: () => {}
  });
  device.submit();

  t.equal(outputTexture.format, 'rgba16float', 'resolved output retains the requested HDR format');
  t.deepEqual(
    renderer.props,
    {
      averageFragmentsPerPixel: 4,
      maxFragmentsPerPixel: 12,
      maxBufferByteLength: Number.MAX_SAFE_INTEGER
    },
    'optional output format does not alter existing resolved capture properties'
  );

  renderer.destroy();
  sourceTexture.destroy();
  opaqueDepthTexture.destroy();
  t.end();
});
