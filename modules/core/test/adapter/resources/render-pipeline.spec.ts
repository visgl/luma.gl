import {expect, test} from 'vitest';
import { Buffer, _getDefaultBindGroupFactory } from '@luma.gl/core';
import { getWebGPUTestDevice } from '@luma.gl/test-utils';
const RENDER_SOURCE = /* WGSL */`
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
const BUILTIN_ONLY_RENDER_SOURCE = /* WGSL */`
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
test('RenderPipeline can infer an empty shader layout for builtin-only WGSL shaders', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    return;
  }
  const shader = webgpuDevice.createShader({
    source: BUILTIN_ONLY_RENDER_SOURCE
  });
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    topology: 'triangle-list'
  });
  expect(renderPipeline.shaderLayout.attributes, 'builtin-only WGSL infers no attributes').toEqual([]);
  expect(renderPipeline.shaderLayout.bindings, 'builtin-only WGSL infers no bindings').toEqual([]);
  renderPipeline.destroy();
  shader.destroy();
});
test('RenderPipeline bind-group cache only invalidates when binding identities change', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    return;
  }
  const shader = webgpuDevice.createShader({
    source: RENDER_SOURCE
  });
  const renderPipeline = webgpuDevice.createRenderPipeline({
    vs: shader,
    fs: shader,
    shaderLayout: {
      attributes: [],
      bindings: [{
        name: 'colorUniforms',
        type: 'uniform',
        group: 3,
        location: 0
      }]
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
  renderPipeline.setBindings({
    colorUniforms: firstBuffer
  });
  const bindGroupFactory = _getDefaultBindGroupFactory(webgpuDevice);
  const firstBindGroup = bindGroupFactory.getBindGroups(renderPipeline as any, (renderPipeline as any)._getBindingsByGroupWebGPU(), (renderPipeline as any)._getBindGroupCacheKeysWebGPU())[3];
  renderPipeline.setBindings({
    colorUniforms: firstBuffer
  });
  const secondBindGroup = bindGroupFactory.getBindGroups(renderPipeline as any, (renderPipeline as any)._getBindingsByGroupWebGPU(), (renderPipeline as any)._getBindGroupCacheKeysWebGPU())[3];
  expect(secondBindGroup, 'render bind group is reused when binding object identities are unchanged').toBe(firstBindGroup);
  renderPipeline.setBindings({
    colorUniforms: secondBuffer
  });
  const thirdBindGroup = bindGroupFactory.getBindGroups(renderPipeline as any, (renderPipeline as any)._getBindingsByGroupWebGPU(), (renderPipeline as any)._getBindGroupCacheKeysWebGPU())[3];
  expect(thirdBindGroup, 'render bind group is rebuilt when a binding object identity changes').not.toBe(firstBindGroup);
  renderPipeline.setBindings({
    colorUniforms: secondBuffer
  });
  const fourthBindGroup = bindGroupFactory.getBindGroups(renderPipeline as any, (renderPipeline as any)._getBindingsByGroupWebGPU(), (renderPipeline as any)._getBindGroupCacheKeysWebGPU())[3];
  expect(fourthBindGroup, 'render bind group is reused again after the rebuilt group is cached').toBe(thirdBindGroup);
  secondBuffer.destroy();
  firstBuffer.destroy();
  renderPipeline.destroy();
  shader.destroy();
});
