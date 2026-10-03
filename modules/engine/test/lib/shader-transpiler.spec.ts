// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Model, Computation} from '@luma.gl/engine';
import {GLSLShaderAssembler, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

it('shader transpiler#Model creates a WebGPU render pipeline with generated entry-point names', async () => {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const assembler = new WGSLShaderAssembler();
  assembler.addShaderTranspiler({
    name: 'application compiler',
    sourceLanguage: 'custom',
    transpile: () => ({
      code: '@vertex fn compiledVertex() -> @builtin(position) vec4<f32> { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }\n@fragment fn compiledFragment() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }',
      entryPoints: {vertex: 'compiledVertex', fragment: 'compiledFragment'}
    })
  });
  const model = await Model.createAsync(device!, {
    sourceLanguage: 'custom',
    source: 'application source',
    vertexEntryPoint: 'originalVertex',
    fragmentEntryPoint: 'originalFragment',
    shaderAssembler: assembler
  });
  try {
    expect(model.pipeline).toBeDefined();
    expect(model.props.vertexEntryPoint).toBe('compiledVertex');
    expect(model.props.fragmentEntryPoint).toBe('compiledFragment');
    expect(model.source).toContain('fn compiledVertex');
  } finally {
    model.destroy();
  }
});

it('shader transpiler#Computation creates a WebGPU pipeline with the generated compute entry', async () => {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const assembler = new WGSLShaderAssembler();
  assembler.addShaderTranspiler({
    name: 'application compiler',
    sourceLanguage: 'custom',
    transpile: request => {
      expect(request.stage).toBe('compute');
      expect(request.entryPoints.compute).toBe('originalCompute');
      return {
        code: '@compute @workgroup_size(1) fn compiledCompute() {}',
        entryPoints: {compute: 'compiledCompute'}
      };
    }
  });
  const computation = await Computation.createAsync(device!, {
    sourceLanguage: 'custom',
    source: 'application source',
    entryPoint: 'originalCompute',
    shaderAssembler: assembler
  });
  try {
    expect(computation.pipeline).toBeDefined();
    expect(computation.props.entryPoint).toBe('compiledCompute');
  } finally {
    computation.destroy();
  }
});

it('shader transpiler#Model creates a WebGL pipeline from application-transpiled stages', async () => {
  const device = await getWebGLTestDevice();
  const assembler = new GLSLShaderAssembler();
  assembler.addShaderTranspiler({
    name: 'application compiler',
    sourceLanguage: 'custom',
    transpile: request => ({
      code:
        request.stage === 'vertex'
          ? '#version 300 es\nvoid main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }'
          : '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() { color = vec4(1.0); }'
    })
  });
  const model = new Model(device, {
    sourceLanguage: 'custom',
    vs: 'vertex source',
    fs: 'fragment source',
    shaderAssembler: assembler
  });
  try {
    expect(model.pipeline).toBeDefined();
    expect(model.vs).toContain('gl_Position');
    expect(model.fs).toContain('color =');
  } finally {
    model.destroy();
  }
});
