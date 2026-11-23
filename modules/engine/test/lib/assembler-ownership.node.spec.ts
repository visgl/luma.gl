// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {GLSLShaderAssembler, WGSLShaderAssembler, type ShaderAssembler} from '@luma.gl/shaders';
import {NullDevice} from '@luma.gl/core/test-utils';

const RENDER_SOURCE = /* wgsl */ `
@vertex fn vertexMain() -> @builtin(position) vec4<f32> { return vec4<f32>(0.0); }
@fragment fn fragmentMain() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }
`;
const OWNED_MODULE = {
  name: 'ownedAssemblerMarker',
  source: 'const OWNED_ASSEMBLER_MARKER: u32 = 1u;'
};

class AssemblerModel extends Model {
  getShaderAssembler(): ShaderAssembler {
    return this.props.shaderAssembler;
  }
}

it('Model owns its default WGSL assembler and honors explicit sharing', () => {
  const device = makeWebGPUDevice();
  const first = new AssemblerModel(device, {source: RENDER_SOURCE, vertexCount: 1});
  const assembler = first.getShaderAssembler();
  assembler.addDefaultModule(OWNED_MODULE);
  const second = new AssemblerModel(device, {source: RENDER_SOURCE, vertexCount: 1});
  const shared = new AssemblerModel(device, {
    source: RENDER_SOURCE,
    shaderAssembler: assembler,
    vertexCount: 1
  });
  try {
    expect(assembler).toBeInstanceOf(WGSLShaderAssembler);
    expect(second.getShaderAssembler()).not.toBe(assembler);
    expect(second.source).not.toContain('OWNED_ASSEMBLER_MARKER');
    expect(shared.source).toContain('OWNED_ASSEMBLER_MARKER');
  } finally {
    first.destroy();
    second.destroy();
    shared.destroy();
    device.destroy();
  }
});

it('Model owns its default GLSL assembler', () => {
  const device = new NullDevice({});
  const props = {
    vs: '#version 300 es\nvoid main() { gl_Position = vec4(0.0); }',
    fs: '#version 300 es\nprecision highp float; out vec4 color; void main() { color = vec4(1.0); }',
    vertexCount: 1
  };
  const first = new AssemblerModel(device, props);
  const second = new AssemblerModel(device, props);
  try {
    expect(first.getShaderAssembler()).toBeInstanceOf(GLSLShaderAssembler);
    expect(second.getShaderAssembler()).not.toBe(first.getShaderAssembler());
  } finally {
    first.destroy();
    second.destroy();
    device.destroy();
  }
});

function makeWebGPUDevice(): Device {
  const device = new NullDevice({});
  const webgpuDevice = Object.create(device) as Device;
  Object.defineProperties(webgpuDevice, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  return webgpuDevice;
}
