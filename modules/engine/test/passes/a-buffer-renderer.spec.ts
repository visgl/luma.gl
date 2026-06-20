// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Model, aBufferPlugin} from '@luma.gl/engine';
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
