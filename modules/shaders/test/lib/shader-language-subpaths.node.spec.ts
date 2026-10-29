// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {expect, it} from 'vitest';
import {
  ShaderAssembler,
  GLSLShaderAssembler as RootGLSLShaderAssembler,
  WGSLShaderAssembler as RootWGSLShaderAssembler,
  type PlatformInfo
} from '@luma.gl/shaders';
import {GLSLShaderAssembler} from '@luma.gl/shaders/glsl';
import {WGSLShaderAssembler, scanWGSLInterface} from '@luma.gl/shaders/wgsl';

it('shares assembler constructors and the abstract contract across root and language entries', () => {
  expect(GLSLShaderAssembler).toBe(RootGLSLShaderAssembler);
  expect(WGSLShaderAssembler).toBe(RootWGSLShaderAssembler);
  expect(new GLSLShaderAssembler()).toBeInstanceOf(ShaderAssembler);
  expect(new WGSLShaderAssembler()).toBeInstanceOf(ShaderAssembler);
  expect(ShaderAssembler.getDefaultShaderAssembler('glsl')).toBeInstanceOf(GLSLShaderAssembler);
  expect(ShaderAssembler.getDefaultShaderAssembler('wgsl')).toBeInstanceOf(WGSLShaderAssembler);
});

it('assembles native sources through the language entries and preserves the WGSL scanner', () => {
  const platformInfo: PlatformInfo = {
    type: 'webgl',
    gpu: 'test',
    shaderLanguage: 'glsl',
    shaderLanguageVersion: 300,
    features: new Set()
  };
  const glslShader = new GLSLShaderAssembler().assembleGLSLShaderPair({
    platformInfo,
    vs: '#version 300 es\nvoid main() {gl_Position = vec4(0.0);}',
    fs: '#version 300 es\nprecision highp float; out vec4 color; void main() {color = vec4(1.0);}'
  });
  expect(glslShader.vs).toContain('gl_Position = vec4(0.0)');
  expect(glslShader.fs).toContain('color = vec4(1.0)');
  const wgslShader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: {...platformInfo, type: 'webgpu', shaderLanguage: 'wgsl'},
    source: '@compute @workgroup_size(1) fn computeMain() {}',
    computeEntryPoint: 'computeMain'
  });
  expect(wgslShader.source).toContain('fn computeMain()');
  expect(wgslShader.entryPoints.compute).toBe('computeMain');
  expect(scanWGSLInterface(wgslShader.source)).toEqual(wgslShader.shaderLayout);
});

for (const language of ['glsl', 'wgsl']) {
  it(`${language} entry excludes the other assembler backend, even alongside root shader modules`, async () => {
    const assemblerClassName = language === 'glsl' ? 'GLSLShaderAssembler' : 'WGSLShaderAssembler';
    const result = await build({
      stdin: {
        contents: `import {${assemblerClassName}} from '@luma.gl/shaders/${language}'; import {fp32} from '@luma.gl/shaders'; export {${assemblerClassName}, fp32};`,
        resolveDir: process.cwd()
      },
      bundle: true,
      write: false,
      metafile: true,
      format: 'esm',
      platform: 'browser',
      logLevel: 'silent'
    });
    const retained = Object.values(result.metafile.outputs).flatMap(output =>
      Object.entries(output.inputs)
        .filter(([, information]) => information.bytesInOutput > 0)
        .map(([filename]) => filename)
    );
    const opposite =
      language === 'glsl'
        ? /modules\/shaders\/src\/lib\/(?:wgsl-shader-assembler|shader-assembly\/(?:assemble-wgsl-shaders|wgsl-interface-scan|wgsl-binding-scan))\.ts$/
        : /modules\/shaders\/src\/lib\/(?:glsl-shader-assembler|shader-assembly\/assemble-glsl-shaders|shader-transpiler\/transpile-glsl-shader)\.ts$/;
    expect(retained.filter(filename => opposite.test(filename))).toEqual([]);
    expect(retained.some(filename => /lib\/shader-assembler\.ts$/.test(filename))).toBe(false);
  });
}
