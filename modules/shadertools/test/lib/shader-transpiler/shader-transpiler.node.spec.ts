// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {
  GLSLShaderAssembler,
  WGSLShaderAssembler,
  type PlatformInfo,
  type ShaderModule,
  type ShaderTranspiler
} from '@luma.gl/shadertools';
import {WgslReflect} from 'wgsl_reflect';

const glslPlatform: PlatformInfo = {
  type: 'webgl',
  gpu: 'test',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};
const wgslPlatform: PlatformInfo = {...glslPlatform, type: 'webgpu', shaderLanguage: 'wgsl'};
const vertexCode = '#version 300 es\nvoid main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }';
const fragmentCode =
  '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() { color = vec4(1.0); }';
const wgslCode =
  '@vertex fn generatedVertex(@location(2) position: vec3<f32>) -> @builtin(position) vec4<f32> { return vec4<f32>(position, 1.0); }\n@fragment fn generatedFragment() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }';

it('shader transpiler#compiles dependency and application code before both GLSL stages', () => {
  const assembler = new GLSLShaderAssembler();
  const dependency: ShaderModule = {
    name: 'shared',
    sourceLanguage: 'slang',
    source: 'float helper() { return 1; }'
  };
  const module: ShaderModule = {
    name: 'material',
    sourceLanguage: 'slang',
    source: 'float shade() { return helper(); }',
    dependencies: [dependency],
    defaultUniforms: {scale: 2},
    getUniforms: properties => ({scale: properties.scale || 2})
  };
  assembler.addDefaultModule(module);
  const transpile = vi.fn<ShaderTranspiler['transpile']>(props => ({
    code: props.stage === 'vertex' ? vertexCode : fragmentCode
  }));
  assembler.addShaderTranspiler({name: 'application compiler', sourceLanguage: 'slang', transpile});
  const result = assembler.assembleGLSLShaderPair({
    platformInfo: glslPlatform,
    sourceLanguage: 'slang',
    vs: 'vertex source',
    fs: 'fragment source',
    vertexEntryPoint: 'vertexMain',
    fragmentEntryPoint: 'fragmentMain',
    modules: [module, dependency]
  });
  expect(transpile).toHaveBeenCalledTimes(2);
  for (const [index, stage] of ['vertex', 'fragment'].entries()) {
    const request = transpile.mock.calls[index][0];
    expect(request.target).toBe('glsl');
    expect(request.stage).toBe(stage);
    expect(request.source).toBe(`${dependency.source}\n${module.source}\n${stage} source`);
    expect(request.entryPoints).toEqual({
      vertex: 'vertexMain',
      fragment: 'fragmentMain',
      compute: undefined
    });
  }
  expect(result.vs).toContain('gl_Position');
  expect(result.fs).toContain('color =');
  expect(result.vs).not.toContain('float helper');
  expect(result.getUniforms({scale: 3}).scale).toBe(3);
  expect(module.source).toContain('shade');
  expect(module.dependencies).toEqual([dependency]);
});

it('shader transpiler#unified WGSL uses generated names for interface scanning and native module assembly', () => {
  const assembler = new WGSLShaderAssembler();
  const transpile = vi.fn<ShaderTranspiler['transpile']>(() => ({
    code: wgslCode,
    entryPoints: {vertex: 'generatedVertex', fragment: 'generatedFragment'}
  }));
  assembler.addShaderTranspiler({name: 'slang', sourceLanguage: 'slang', transpile});
  const result = assembler.assembleWGSLShader({
    platformInfo: wgslPlatform,
    sourceLanguage: 'slang',
    source: 'render program',
    vertexEntryPoint: 'sourceVertex',
    fragmentEntryPoint: 'sourceFragment',
    modules: [
      {name: 'native', source: 'fn nativeHelper() -> f32 { return 2.0; }'},
      {name: 'foreign', sourceLanguage: 'slang', source: 'foreign helper'}
    ]
  });
  expect(transpile.mock.calls[0][0].source).toBe('foreign helper\nrender program');
  expect(result.entryPoints).toMatchObject({
    vertex: 'generatedVertex',
    fragment: 'generatedFragment'
  });
  expect(result.source).toContain('fn nativeHelper');
  expect(result.source).not.toContain('foreign helper');
  expect(result.shaderLayout?.attributes[0]).toMatchObject({location: 2});
  const reflection = new WgslReflect(result.source);
  expect(reflection.entry.vertex[0].name).toBe('generatedVertex');
  expect(reflection.entry.fragment[0].name).toBe('generatedFragment');
});

it('shader transpiler#registration replacement, removal, and assembler isolation', () => {
  const assembler = new WGSLShaderAssembler();
  const first = vi.fn(() => ({code: wgslCode}));
  const second = vi.fn(() => ({code: wgslCode}));
  const props = {platformInfo: wgslPlatform, sourceLanguage: 'slang', source: 'source'};
  assembler.addShaderTranspiler({name: 'first', sourceLanguage: 'slang', transpile: first});
  assembler.addShaderTranspiler({name: 'second', sourceLanguage: 'slang', transpile: second});
  assembler.assembleWGSLShader(props);
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledOnce();
  expect(() => new WGSLShaderAssembler().assembleWGSLShader(props)).toThrow();
  assembler.removeShaderTranspiler('slang');
  expect(() => assembler.assembleWGSLShader(props)).toThrow();
});

it('shader transpiler#native sources bypass registered compilers and incompatible modules fail', () => {
  const assembler = new WGSLShaderAssembler();
  const transpile = vi.fn(() => ({code: wgslCode}));
  assembler.addShaderTranspiler({name: 'slang', sourceLanguage: 'slang', transpile});
  expect(
    assembler.assembleWGSLShader({platformInfo: wgslPlatform, source: wgslCode}).source
  ).toContain('generatedVertex');
  expect(transpile).not.toHaveBeenCalled();
  expect(() =>
    assembler.assembleWGSLShader({
      platformInfo: wgslPlatform,
      source: wgslCode,
      modules: [{name: 'foreign', sourceLanguage: 'slang', source: 'foreign'}]
    })
  ).toThrow();
  expect(() =>
    assembler.assembleWGSLShader({
      platformInfo: wgslPlatform,
      sourceLanguage: 'slang',
      source: 'foreign',
      modules: [{name: 'other', sourceLanguage: 'other', source: 'other'}]
    })
  ).toThrow();
});

it('shader transpiler#compute requests and compiler diagnostics retain application metadata', () => {
  const assembler = new WGSLShaderAssembler();
  const diagnostic = new Error('source.slang:4:2: unsupported expression');
  const transpile = vi.fn<ShaderTranspiler['transpile']>(() => {
    throw diagnostic;
  });
  assembler.addShaderTranspiler({name: 'slang', sourceLanguage: 'slang', transpile});
  expect(() =>
    assembler.assembleWGSLShader({
      platformInfo: wgslPlatform,
      sourceLanguage: 'slang',
      source: 'compute',
      computeEntryPoint: 'computeMain',
      scanVertexAttributes: false
    })
  ).toThrow(diagnostic);
  expect(transpile.mock.calls[0][0]).toMatchObject({
    stage: 'compute',
    entryPoints: {compute: 'computeMain'},
    target: 'wgsl'
  });
});
