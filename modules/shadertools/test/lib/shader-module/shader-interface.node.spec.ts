// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {
  getShaderModuleDependencies,
  GLSLShaderAssembler,
  WGSLShaderAssembler,
  type PlatformInfo,
  type ShaderModule
} from '@luma.gl/shadertools';

function makeProvider(name: string): ShaderModule {
  return {
    name,
    implements: 'projection',
    vs: 'float project_position(float position) { return position; }',
    fs: 'float project_position(float position) { return position; }',
    source: 'fn project_position(position: f32) -> f32 { return position; }'
  };
}

const platformInfo: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const vertexSource = '#version 300 es\nvoid main() { gl_Position = vec4(project_position(1.0)); }';
const fragmentSource =
  '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() { color = vec4(project_position(1.0)); }';
const wgslSource =
  '@vertex fn vertexMain() -> @builtin(position) vec4<f32> { return vec4<f32>(project_position(1.0)); }';

describe('exclusive named shader interfaces', () => {
  it('rejects competing providers in either order', () => {
    const project32 = makeProvider('project32');
    const project64 = makeProvider('project64');
    expect(() => getShaderModuleDependencies([project32, project64])).toThrow(
      'shadertools: assertion failed.'
    );
    expect(() => getShaderModuleDependencies([project64, project32])).toThrow(
      'shadertools: assertion failed.'
    );
    expect(project32.instance).toBeUndefined();
    expect(project64.instance).toBeUndefined();
    const unrelated: ShaderModule = {name: 'unrelated'};
    expect(() => getShaderModuleDependencies([project32, unrelated, project64])).toThrow(
      'shadertools: assertion failed.'
    );
  });

  it('deduplicates a shared provider and preserves dependency order', () => {
    const provider = makeProvider('project32');
    const firstConsumer: ShaderModule = {name: 'first', dependencies: [provider]};
    const secondConsumer: ShaderModule = {name: 'second', dependencies: [provider]};
    expect(getShaderModuleDependencies([firstConsumer, secondConsumer, provider])).toEqual([
      provider,
      firstConsumer,
      secondConsumer
    ]);
  });

  it('rejects conflicts across transitive concrete dependencies', () => {
    const project32 = makeProvider('project32');
    const project64 = makeProvider('project64');
    const consumer: ShaderModule = {name: 'consumer', dependencies: [project32]};
    const root: ShaderModule = {name: 'root', dependencies: [consumer]};
    expect(() => getShaderModuleDependencies([root, project64])).toThrow(
      'shadertools: assertion failed.'
    );
    expect(() => getShaderModuleDependencies([project64, root])).toThrow(
      'shadertools: assertion failed.'
    );
    expect(root.dependencies).toEqual([consumer]);
    expect(consumer.dependencies).toEqual([project32]);
  });

  it('allows different interfaces and modules without interface metadata', () => {
    const projection = makeProvider('projection');
    const lighting: ShaderModule = {name: 'lighting', implements: 'lighting'};
    const ordinary: ShaderModule = {name: 'ordinary'};
    expect(getShaderModuleDependencies([projection, lighting, ordinary])).toEqual([
      projection,
      lighting,
      ordinary
    ]);
  });

  for (const language of ['glsl', 'wgsl'] as const) {
    it(
      language + ' checks defaults and dependencies and allows explicit provider selection',
      () => {
        const project32 = makeProvider('project32');
        const project64 = makeProvider('project64');
        const consumer: ShaderModule = {name: 'consumer', dependencies: [project64]};
        const assembler =
          language === 'glsl' ? new GLSLShaderAssembler() : new WGSLShaderAssembler();
        function assemble(modules: ShaderModule[]): string {
          if (assembler instanceof GLSLShaderAssembler) {
            return assembler.assembleGLSLShaderPair({
              platformInfo,
              modules,
              vs: vertexSource,
              fs: fragmentSource
            }).vs;
          }
          return assembler.assembleWGSLShader({
            platformInfo: {...platformInfo, type: 'webgpu', shaderLanguage: 'wgsl'},
            modules,
            source: wgslSource
          }).source;
        }
        assembler.addDefaultModule(project32);
        expect(() => assemble([consumer])).toThrow('shadertools: assertion failed.');
        expect(() => assemble([project64])).toThrow('shadertools: assertion failed.');
        expect(assemble([project32, project32])).toContain('project_position');
        assembler.removeDefaultModule(project32);
        expect(assemble([consumer])).toContain('project_position');
      }
    );
  }
});
