// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {filterShaderPlugin, ShaderAssembler} from '@luma.gl/shadertools';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

test('filterShaderPlugin#WebGL2 model binds, updates, and draws', async t => {
  const device = await getWebGLTestDevice();
  const shaderAssembler = new ShaderAssembler();
  shaderAssembler.addShaderHook('vs:FILTER_POSITION(inout vec4 position)');
  const filterValues = device.createBuffer({
    data: new Float32Array([0.5]),
    usage: Buffer.VERTEX | Buffer.COPY_DST
  });
  const model = new Model(device, {
    id: 'filter-shader-plugin-webgl-test',
    topology: 'point-list',
    vertexCount: 1,
    vs: /* glsl */ `#version 300 es
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  FILTER_POSITION(gl_Position);
  gl_PointSize = 1.0;
}`,
    fs: /* glsl */ `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() { fragmentColor = vec4(1.0); }`,
    shaderAssembler,
    plugins: [filterShaderPlugin],
    attributes: {filterValues},
    bufferLayout: [{name: 'filterValues', format: 'float32'}]
  });

  model.shaderInputs.setProps({filter: {enabled: true, min: 0.25, max: 0.75}});
  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 0]});
  t.ok(model.draw(renderPass), 'WebGL2 model draws through the filter plugin');
  renderPass.end();
  device.submit();

  renderPass.destroy();
  model.destroy();
  filterValues.destroy();
  t.end();
});

test('filterShaderPlugin#WebGPU model binds, updates, and draws', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const shaderAssembler = new ShaderAssembler();
  shaderAssembler.addShaderHook('vs:FILTER_POSITION(position: ptr<function, vec4<f32>>)');
  const filterValues = device.createBuffer({
    data: new Float32Array([0.5]),
    usage: Buffer.VERTEX | Buffer.COPY_DST
  });
  const model = new Model(device, {
    id: 'filter-shader-plugin-webgpu-test',
    topology: 'point-list',
    vertexCount: 1,
    source: /* wgsl */ `
@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  var position = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  FILTER_POSITION(&position);
  return position;
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`,
    shaderAssembler,
    plugins: [filterShaderPlugin],
    attributes: {filterValues},
    bufferLayout: [{name: 'filterValues', format: 'float32'}]
  });

  t.ok(
    model.pipeline.shaderLayout.attributes.some(
      attribute => attribute.name === 'filterValues' && attribute.type === 'f32'
    ),
    'reflected plugin attribute uses its public name'
  );
  model.shaderInputs.setProps({filter: {enabled: true, min: 0.25, max: 0.75}});
  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 0]});
  t.ok(model.draw(renderPass), 'WebGPU model draws through the filter plugin');
  renderPass.end();
  device.submit();

  renderPass.destroy();
  model.destroy();
  filterValues.destroy();
  t.end();
});
