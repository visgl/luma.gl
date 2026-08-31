// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

const UNSUPPORTED_RENDER_SOURCE = /* WGSL */ `
@group(0) @binding(0) var textures: binding_array<texture_2d<f32>>;

@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`;

it('RenderPipeline can infer an empty shader layout for builtin-only WGSL shaders', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const shader = webgpuDevice.createShader({source: BUILTIN_ONLY_RENDER_SOURCE});
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    topology: 'triangle-list'
  });

  expect(renderPipeline.shaderLayout.attributes, 'builtin-only WGSL infers no attributes').toEqual(
    []
  );
  expect(renderPipeline.shaderLayout.bindings, 'builtin-only WGSL infers no bindings').toEqual([]);

  renderPipeline.destroy();
  shader.destroy();
  void 0;
});

it('RenderPipeline requires a layout when lightweight WGSL scanning is unsafe', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const shader = webgpuDevice.createShader({source: UNSUPPORTED_RENDER_SOURCE});
  expect(
    () => webgpuDevice.createRenderPipeline({vs: shader, fs: shader}),
    'raw render pipeline rejects WGSL that cannot be scanned safely'
  ).toThrow(/assertion failed/);

  shader.destroy();
  void 0;
});

it('RenderPipeline bind-group cache only invalidates when binding identities change', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const shader = webgpuDevice.createShader({source: RENDER_SOURCE});
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader
  });

  expect(
    renderPipeline.shaderLayout.bindings,
    'raw render pipeline uses the lightweight WGSL scanner'
  ).toEqual([{name: 'colorUniforms', type: 'uniform', group: 3, location: 0}]);

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
  expect(
    secondBindGroup,
    'render bind group is reused when binding object identities are unchanged'
  ).toBe(firstBindGroup);

  renderPipeline.setBindings({colorUniforms: secondBuffer});
  const thirdBindGroup = bindGroupFactory.getBindGroups(
    renderPipeline as any,
    (renderPipeline as any)._getBindingsByGroupWebGPU(),
    (renderPipeline as any)._getBindGroupCacheKeysWebGPU()
  )[3];
  expect(
    thirdBindGroup,
    'render bind group is rebuilt when a binding object identity changes'
  ).not.toBe(firstBindGroup);

  renderPipeline.setBindings({colorUniforms: secondBuffer});
  const fourthBindGroup = bindGroupFactory.getBindGroups(
    renderPipeline as any,
    (renderPipeline as any)._getBindingsByGroupWebGPU(),
    (renderPipeline as any)._getBindGroupCacheKeysWebGPU()
  )[3];
  expect(
    fourthBindGroup,
    'render bind group is reused again after the rebuilt group is cached'
  ).toBe(thirdBindGroup);

  secondBuffer.destroy();
  firstBuffer.destroy();
  renderPipeline.destroy();
  shader.destroy();
  void 0;
});

it('RenderPass owns pipeline, bindings, vertex array, and draw state', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
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
  const uniformBuffer = webgpuDevice.createBuffer({
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const vertexArray = webgpuDevice.createVertexArray({
    shaderLayout: renderPipeline.shaderLayout,
    bufferLayout: renderPipeline.bufferLayout
  });
  const framebuffer = webgpuDevice
    .getDefaultCanvasContext()
    .getCurrentFramebuffer({depthStencilFormat: false});
  const renderPass = webgpuDevice.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});

  expect(
    () => renderPass.setBindings({colorUniforms: uniformBuffer}),
    'bindings require an active render pipeline'
  ).toThrow(/setPipeline.*must be called before setBindings/);

  renderPass.setPipeline(renderPipeline);
  renderPass.setBindings({3: {colorUniforms: uniformBuffer}});
  renderPass.setVertexArray(vertexArray);
  expect(renderPass.draw({vertexCount: 3}), 'render pass issues the draw').toBe(true);

  renderPass.end();
  webgpuDevice.submit();
  vertexArray.destroy();
  uniformBuffer.destroy();
  renderPipeline.destroy();
  shader.destroy();
  void 0;
});

it('RenderPipeline creates a depth attachment descriptor when an explicit WebGPU depth format is supplied', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
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

  expect(
    renderPipeline.descriptor?.depthStencil?.format,
    'explicit depth attachment formats are preserved even when depth writes are disabled'
  ).toBe('depth24plus');
  expect(
    renderPipeline.descriptor?.depthStencil?.depthWriteEnabled,
    'explicit depth attachment formats default depthWriteEnabled to false'
  ).toBe(false);
  expect(
    renderPipeline.descriptor?.depthStencil?.depthCompare,
    'explicit depth attachment formats default depthCompare'
  ).toBe('less-equal');

  renderPipeline.destroy();
  shader.destroy();
  void 0;
});

it('WebGPU RenderPipeline skips draw when marked errored', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const shader = webgpuDevice.createShader({source: BUILTIN_ONLY_RENDER_SOURCE});
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    shaderLayout: {
      attributes: [],
      bindings: []
    }
  });

  renderPipeline.linkStatus = 'error';
  expect(Boolean(renderPipeline.isErrored), 'render pipeline reports errored state').toBe(true);

  const vertexArray = webgpuDevice.createVertexArray({
    shaderLayout: renderPipeline.shaderLayout,
    bufferLayout: renderPipeline.bufferLayout
  });
  const framebuffer = webgpuDevice
    .getDefaultCanvasContext()
    .getCurrentFramebuffer({depthStencilFormat: false});
  const renderPass = webgpuDevice.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});

  expect(
    renderPipeline.draw({renderPass, vertexArray, vertexCount: 3}),
    'errored render pipeline draw is skipped'
  ).toBe(false);

  renderPass.end();
  renderPass.destroy();
  vertexArray.destroy();
  renderPipeline.destroy();
  shader.destroy();
  void 0;
});
