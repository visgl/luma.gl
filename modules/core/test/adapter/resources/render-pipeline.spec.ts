// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const RENDER_SOURCE = /* WGSL */ `
struct ColorUniforms {
  color: vec4<f32>
};

@group(0) @binding(0) var<uniform> colorUniforms: ColorUniforms;

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5)
  );
  let position = positions[vertexIndex];
  return vec4<f32>(position, 0.0, 1.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return colorUniforms.color;
}
`;

test('RenderPipeline bind-group cache only invalidates when binding identities change', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const shader = webgpuDevice.createShader({source: RENDER_SOURCE});
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'colorUniforms', type: 'uniform', group: 0, location: 0}]
    }
  });

  const firstBuffer = webgpuDevice.createBuffer({
    id: 'first-uniform-buffer',
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const secondBuffer = webgpuDevice.createBuffer({
    id: 'second-uniform-buffer',
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });

  renderPipeline.setBindings({colorUniforms: firstBuffer});
  const firstBindGroup = (renderPipeline as any)._getBindGroup();

  renderPipeline.setBindings({colorUniforms: firstBuffer});
  const secondBindGroup = (renderPipeline as any)._getBindGroup();
  t.equal(
    secondBindGroup,
    firstBindGroup,
    'render bind group is reused when binding object identities are unchanged'
  );

  renderPipeline.setBindings({colorUniforms: secondBuffer});
  t.equal((renderPipeline as any)._bindGroup, null, 'render bind group cache is cleared on change');
  const thirdBindGroup = (renderPipeline as any)._getBindGroup();
  t.notEqual(
    thirdBindGroup,
    firstBindGroup,
    'render bind group is rebuilt when a binding object identity changes'
  );

  renderPipeline.setBindings({colorUniforms: secondBuffer});
  const fourthBindGroup = (renderPipeline as any)._getBindGroup();
  t.equal(
    fourthBindGroup,
    thirdBindGroup,
    'render bind group is reused again after the rebuilt group is cached'
  );

  secondBuffer.destroy();
  firstBuffer.destroy();
  renderPipeline.destroy();
  shader.destroy();
  t.end();
});
