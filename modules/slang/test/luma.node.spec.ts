// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {ShaderLayout} from '@luma.gl/core';
import {packSlangUniforms, transpileSlang, transpileSlangWGSL} from '@luma.gl/slang';
import {
  getSlangBindingNames,
  getSlangShaderLayout,
  getSlangShaderRequirements,
  getSlangUniformBufferLayouts
} from '@luma.gl/slang/luma';
import {RENDER_SHADER, UNIFORM_SHADER, UNIFORM_VALUES} from './fixtures';

it('slang#reflects reachable resource usage per stage and excludes unused resources', () => {
  const result = transpileSlangWGSL(RENDER_SHADER, {locations: {POSITION: 7}});
  expect(
    result.entryPoints.vertexMain.reflection.bindings.map(binding => binding.visibility)
  ).toEqual([0, 0, 0]);
  expect(
    result.entryPoints.fragmentMain.reflection.bindings.map(binding => binding.visibility)
  ).toEqual([2, 2, 2]);
  const layout: ShaderLayout = getSlangShaderLayout(result);
  expect(layout.attributes).toEqual([{name: '_slang_in_0', location: 7, type: 'vec3<f32>'}]);
  expect(layout.bindings).toMatchObject([
    {name: '_slang_material', type: 'uniform', visibility: 2, minBindingSize: 16},
    {
      name: '_slang_colorTexture',
      type: 'texture',
      visibility: 2,
      sampleType: 'float',
      viewDimension: '2d'
    },
    {name: '_slang_colorSampler', type: 'sampler', visibility: 2, samplerType: 'filtering'}
  ]);
});

it('slang#merges visibility through shared helpers, cbuffer fields, overloads, and shadowing', () => {
  const result = transpileSlangWGSL(`
    cbuffer Settings { float amount; }; uniform float unused;
    float value(float input) { return amount * input; }
    float2 value(float2 input) { return unused * input; }
    [shader("vertex")] float4 vertexMain() : SV_Position { return float4(value(1.0)); }
    [shader("fragment")] float4 fragmentMain() : SV_Target { float unused = 1; return float4(value(unused)); }
  `);
  const bindings = getSlangShaderLayout(result).bindings;
  expect(bindings).toHaveLength(1);
  expect(bindings[0]).toMatchObject({visibility: 3, type: 'uniform'});
  expect(result.entryPoints.fragmentMain.reflection.bindings[1].visibility).toBe(0);
});

it('slang#maps GLSL blocks and combined textures while preserving ES 300', () => {
  const result = ['vertexMain', 'fragmentMain'].map(entryPoint =>
    transpileSlang(RENDER_SHADER, {target: 'glsl', entryPoint})
  );
  expect(getSlangShaderLayout(result).bindings).toMatchObject([
    {name: '_slang_buffer_material', type: 'uniform', visibility: 2},
    {name: '_slang_colorTexture', type: 'texture', visibility: 2}
  ]);
  expect(getSlangBindingNames(result)).toEqual({
    material: '_slang_buffer_material',
    colorTexture: '_slang_colorTexture'
  });
  expect(getSlangShaderRequirements(result).glslVersion).toBe('300 es');
  expect(result.every(stage => stage.code.startsWith('#version 300 es'))).toBe(true);
});

it('slang#retains plain GLSL uniforms outside the uniform-buffer helpers', () => {
  const result = transpileSlang(
    'uniform float amount; [shader("fragment")] float4 main() : SV_Target { return float4(amount); }',
    {target: 'glsl'}
  );
  expect(getSlangShaderLayout(result).bindings).toEqual([]);
  expect(getSlangUniformBufferLayouts(result)).toEqual({});
  expect(getSlangBindingNames(result)).toEqual({amount: '_slang_amount'});
});

it('slang#allocates and packs nested uniforms from reflected layouts', () => {
  const result = transpileSlang(UNIFORM_SHADER, {target: 'wgsl'});
  const uniform = Object.values(getSlangUniformBufferLayouts(result))[0];
  const bytes = packSlangUniforms(uniform.layout, UNIFORM_VALUES);
  expect(bytes.byteLength).toBe(uniform.byteLength);
  expect(getSlangShaderLayout(result).bindings[0]).toMatchObject({
    type: 'uniform',
    minBindingSize: bytes.byteLength,
    visibility: 4
  });
  expect(getSlangShaderRequirements(result)).toMatchObject({
    compute: true,
    storageBuffers: true,
    storageTextures: [],
    wgslLanguageFeatures: []
  });
});

it('slang#reflects comparison samplers and application-owned nonfiltering overrides', () => {
  const depth = transpileSlang(
    'Texture2D<float> image; SamplerComparisonState comparison; [shader("fragment")] float4 main() : SV_Target { return float4(image.SampleCmp(comparison,float2(0.5),0.5)); }',
    {target: 'wgsl'}
  );
  expect(getSlangShaderLayout(depth).bindings).toMatchObject([
    {sampleType: 'depth'},
    {samplerType: 'comparison'}
  ]);
  const result = transpileSlangWGSL(RENDER_SHADER);
  const layout = getSlangShaderLayout(result, {
    textureSampleTypes: {colorTexture: 'unfilterable-float'},
    samplerTypes: {colorSampler: 'non-filtering'}
  });
  expect(layout.bindings.slice(1)).toMatchObject([
    {sampleType: 'unfilterable-float'},
    {samplerType: 'non-filtering'}
  ]);
});

it('slang#reports storage formats, access, and WGSL language requirements', () => {
  const source =
    '[format("rgba8")] RWTexture2D<float4> image; [shader("compute")] [numthreads(1,1,1)] void main() { image[int2(0)] = float4(1); }';
  const result = transpileSlang(source, {target: 'wgsl'});
  expect(getSlangShaderLayout(result).bindings[0]).toMatchObject({
    type: 'storage',
    format: 'rgba8unorm',
    access: 'read-write',
    visibility: 4
  });
  expect(getSlangShaderRequirements(result)).toMatchObject({
    compute: true,
    storageTextures: [{name: 'image', format: 'rgba8unorm', access: 'read_write'}],
    deviceFeatures: ['texture-formats-tier2'],
    unsupportedStorageTextures: [],
    wgslLanguageFeatures: ['readonly_and_readwrite_storage_textures']
  });
  expect(
    getSlangShaderRequirements(transpileSlang(source, {target: 'glsl', glslVersion: '450'}))
  ).toMatchObject({glslVersion: '450', wgslLanguageFeatures: []});
});

it('slang#checks declared WGSL storage texture requirements even if no binding is active', () => {
  const result = transpileSlang(
    '[format("r32f")] RWTexture2D<float> unused; [shader("fragment")] float4 main() : SV_Target { return float4(1); }',
    {target: 'wgsl'}
  );
  expect(getSlangShaderLayout(result).bindings).toEqual([]);
  expect(getSlangShaderRequirements(result).wgslLanguageFeatures).toEqual([
    'readonly_and_readwrite_storage_textures'
  ]);
});

it('slang#rejects incompatible shader targets and resource slots without mutating reflection', () => {
  const result = transpileSlangWGSL(RENDER_SHADER);
  const original = JSON.stringify(result);
  getSlangShaderLayout(result);
  expect(JSON.stringify(result)).toBe(original);
  expect(() =>
    getSlangShaderLayout([
      transpileSlang(
        'uniform float amount; [shader("vertex")] float4 main() : SV_Position { return float4(amount); }',
        {target: 'wgsl'}
      ),
      transpileSlang(RENDER_SHADER, {target: 'wgsl', entryPoint: 'fragmentMain'})
    ])
  ).toThrow('Incompatible shared resource');
  expect(() =>
    getSlangShaderLayout([
      transpileSlang(RENDER_SHADER, {target: 'wgsl', entryPoint: 'vertexMain'}),
      transpileSlang(RENDER_SHADER, {target: 'glsl', entryPoint: 'fragmentMain'})
    ])
  ).toThrow('Incompatible shader targets');
});

it('slang#reflects read-only storage buffers and preserves nonzero WebGPU groups', () => {
  const result = transpileSlang(
    '[vk::binding(3,2)] StructuredBuffer<float4> values; [shader("vertex")] float4 main(uint index : SV_VertexID) : SV_Position { return values[index]; }',
    {target: 'wgsl'}
  );
  expect(getSlangShaderLayout(result).bindings).toEqual([
    {
      name: '_slang_values',
      group: 2,
      location: 3,
      visibility: 1,
      type: 'read-only-storage',
      minBindingSize: 16
    }
  ]);
});

it('slang#requires a pipeline selection for programs with multiple vertex entries', () => {
  const source =
    '[shader("vertex")] float4 first() : SV_Position { return float4(0); } [shader("vertex")] float4 second() : SV_Position { return float4(1); }';
  expect(() => getSlangShaderLayout(transpileSlangWGSL(source))).toThrow('Select one entry point');
  expect(
    getSlangShaderLayout(transpileSlangWGSL(source, {entryPoints: ['first']})).attributes
  ).toEqual([]);
});
it('slang#ignores inactive slot conflicts when combining separately compiled stages', () => {
  const vertex = transpileSlang(
    'uniform float unused; [shader("vertex")] float4 main() : SV_Position { return float4(0); }',
    {target: 'wgsl'}
  );
  const fragment = transpileSlang(
    'uniform float4 tint; [shader("fragment")] float4 main() : SV_Target { return tint; }',
    {target: 'wgsl'}
  );
  expect(getSlangShaderLayout([vertex, fragment]).bindings).toMatchObject([
    {name: '_slang_tint', visibility: 2}
  ]);
});

it.each([
  'r32f',
  'rgba8_snorm',
  'rgba32f',
  'rgba16f',
  'rgba8'
])('slang#reports optional device features for read-write %s storage textures', format => {
  const scalar = format === 'r32f';
  const result = transpileSlang(
    `[format("${format}")] RWTexture2D<${scalar ? 'float' : 'float4'}> image; [shader("compute")] [numthreads(1,1,1)] void main() { image[int2(0)] = ${scalar ? '1.0' : 'float4(1)'}; }`,
    {target: 'wgsl'}
  );
  const requirements = getSlangShaderRequirements(result);
  expect(requirements.deviceFeatures).toEqual(
    ['r32f', 'rgba8_snorm'].includes(format) ? [] : ['texture-formats-tier2']
  );
  expect(requirements.unsupportedStorageTextures).toEqual(
    format === 'rgba8_snorm' ? ['image'] : []
  );
});
