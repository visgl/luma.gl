// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, _getDefaultBindGroupFactory} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const RENDER_SOURCE = /* WGSL */ `
struct ColorUniforms {
  color: vec4<f32>
};

@group(3) @binding(0) var<uniform> colorUniforms: ColorUniforms;

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

const BUILTIN_ONLY_RENDER_SOURCE = /* WGSL */ `
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
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}
`;

test('RenderPipeline can infer an empty shader layout for builtin-only WGSL shaders', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const shader = webgpuDevice.createShader({source: BUILTIN_ONLY_RENDER_SOURCE});
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    topology: 'triangle-list'
  });

  t.deepEqual(renderPipeline.shaderLayout.attributes, [], 'builtin-only WGSL infers no attributes');
  t.deepEqual(renderPipeline.shaderLayout.bindings, [], 'builtin-only WGSL infers no bindings');

  renderPipeline.destroy();
  shader.destroy();
  t.end();
});

const INVALID_RENDER_SOURCE = /* WGSL */ `
@vertex fn wrongVertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5)
  );
  let position = positions[vertexIndex];
  return vec4<f32>(position, 0.0, 1.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
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
      bindings: [{name: 'colorUniforms', type: 'uniform', group: 3, location: 0}]
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
  const bindGroupFactory = _getDefaultBindGroupFactory(webgpuDevice);
  const firstBindGroup = bindGroupFactory.getBindGroups(
    renderPipeline as any,
    (renderPipeline as any)._getBindingsByGroupWebGPU(),
    (renderPipeline as any)._getBindGroupCacheKeysWebGPU()
  )[3];

  renderPipeline.setBindings({colorUniforms: firstBuffer});
  const secondBindGroup = bindGroupFactory.getBindGroups(
    renderPipeline as any,
    (renderPipeline as any)._getBindingsByGroupWebGPU(),
    (renderPipeline as any)._getBindGroupCacheKeysWebGPU()
  )[3];
  t.equal(
    secondBindGroup,
    firstBindGroup,
    'render bind group is reused when binding object identities are unchanged'
  );

  renderPipeline.setBindings({colorUniforms: secondBuffer});
  const thirdBindGroup = bindGroupFactory.getBindGroups(
    renderPipeline as any,
    (renderPipeline as any)._getBindingsByGroupWebGPU(),
    (renderPipeline as any)._getBindGroupCacheKeysWebGPU()
  )[3];
  t.notEqual(
    thirdBindGroup,
    firstBindGroup,
    'render bind group is rebuilt when a binding object identity changes'
  );

  renderPipeline.setBindings({colorUniforms: secondBuffer});
  const fourthBindGroup = bindGroupFactory.getBindGroups(
    renderPipeline as any,
    (renderPipeline as any)._getBindingsByGroupWebGPU(),
    (renderPipeline as any)._getBindGroupCacheKeysWebGPU()
  )[3];
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

test('RenderPipeline creates a depth attachment descriptor when an explicit WebGPU depth format is supplied', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const shader = webgpuDevice.createShader({source: BUILTIN_ONLY_RENDER_SOURCE});
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    topology: 'triangle-list',
    colorAttachmentFormats: ['bgra8unorm'],
    depthStencilAttachmentFormat: 'depth24plus'
  }) as unknown as {descriptor?: GPURenderPipelineDescriptor | null; destroy(): void};

  t.equal(
    renderPipeline.descriptor?.depthStencil?.format,
    'depth24plus',
    'explicit depth attachment formats are preserved even when depth writes are disabled'
  );
  t.equal(
    renderPipeline.descriptor?.depthStencil?.depthWriteEnabled,
    false,
    'explicit depth attachment formats default depthWriteEnabled to false'
  );
  t.equal(
    renderPipeline.descriptor?.depthStencil?.depthCompare,
    'less-equal',
    'explicit depth attachment formats default depthCompare'
  );

  renderPipeline.destroy();
  shader.destroy();
  t.end();
});

test('WebGPU RenderPipeline marks init failures as errored and skips draw', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const shader = webgpuDevice.createShader({source: INVALID_RENDER_SOURCE});
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    shaderLayout: {
      attributes: [],
      bindings: []
    }
  });

  const linkStatus = await waitForLinkStatus(renderPipeline);
  t.equal(linkStatus, 'error', 'render pipeline init failure marks linkStatus as error');
  t.ok(renderPipeline.isErrored, 'render pipeline reports errored state');

  const vertexArray = webgpuDevice.createVertexArray({
    shaderLayout: renderPipeline.shaderLayout,
    bufferLayout: renderPipeline.bufferLayout
  });
  const framebuffer = webgpuDevice
    .getDefaultCanvasContext()
    .getCurrentFramebuffer({depthStencilFormat: false});
  const renderPass = webgpuDevice.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});

  t.equal(
    renderPipeline.draw({renderPass, vertexArray, vertexCount: 3}),
    false,
    'errored render pipeline draw is skipped'
  );

  renderPass.end();
  renderPass.destroy();
  vertexArray.destroy();
  renderPipeline.destroy();
  shader.destroy();
  t.end();
});

async function waitForLinkStatus(renderPipeline: {
  linkStatus: 'pending' | 'success' | 'error';
}): Promise<'pending' | 'success' | 'error'> {
  for (let iteration = 0; iteration < 50 && renderPipeline.linkStatus !== 'error'; iteration++) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  return renderPipeline.linkStatus;
}
