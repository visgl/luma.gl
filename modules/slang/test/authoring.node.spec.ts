// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  transpileSlang,
  transpileSlangWGSL,
  packSlangUniforms,
  mapSlangDiagnostic,
  SlangTranspileError
} from '@luma.gl/slang';
import {WgslReflect} from 'wgsl_reflect';
import reference from './reference.json';
import {LANGUAGE_SHADER, OUTPUT_RENDER_SHADER, UNIFORM_SHADER, UNIFORM_VALUES} from './fixtures';

it.each([
  'wgsl',
  'glsl'
] as const)('slang#lowers overloads, initializer lists, and output parameters for %s', target => {
  const result = transpileSlang(LANGUAGE_SHADER, {target});
  expect(result.code).toContain('_slang_function_adjust__overload_0');
  expect(result.code).toContain('_slang_function_adjust__overload_1');
  expect(result.code).not.toContain('@slang-source');
  expect(result.sourceMap).toHaveLength(result.code.split('\n').length);
  if (target === 'wgsl') {
    expect(new WgslReflect(result.code).entry.compute[0].name).toBe(result.entryPoint);
    expect(result.code).toContain('ptr<function, f32>');
    expect(result.code).toContain('continuing');
  } else expect(result.code).toContain('inout float');
});
it('slang#reflects and packs nested uniforms with arrays, bools, and two-component matrix columns', () => {
  const result = transpileSlang(UNIFORM_SHADER, {target: 'wgsl'});
  const layout = result.reflection.bindings[0].layout!;
  expect(layout.size).toBe(144);
  expect(layout.members!.map(member => [member.name, member.offset])).toEqual([
    ['bias', 0],
    ['inner', 16],
    ['weights', 32],
    ['transform', 80],
    ['flags', 112]
  ]);
  const bytes = packSlangUniforms(layout, UNIFORM_VALUES);
  const view = new DataView(bytes.buffer);
  expect(view.getFloat32(64, true)).toBe(7);
  expect(view.getFloat32(96, true)).toBe(3);
  expect(view.getUint32(112, true)).toBe(1);
  expect(view.getUint32(128, true)).toBe(0);
  const reflected = new WgslReflect(result.code).uniforms[0];
  expect(reflected.size).toBe(layout.size);
  expect(reflected.members?.map(member => member.offset)).toEqual(
    layout.members!.map(member => member.offset)
  );
  expect(() => packSlangUniforms(layout, {...UNIFORM_VALUES, weights: [1]})).toThrow(
    /array length/
  );
});
it.each([
  'float value = true + 1;',
  'float2 value = float2(1) + float3(1);',
  'bool value = 1 && true;',
  'float value = sin();',
  'float value = mul(float2x3(1,2,3,4,5,6), float2(1));',
  'float2 value = float2(1); value.xx = float2(2);',
  'float values[2]; float value = values[0.5];'
])('slang#reports an original source diagnostic for %s', statement => {
  const source = `// Material\n[shader("fragment")] float4 main() : SV_Target {\n${statement}\nreturn float4(1);\n}`;
  try {
    transpileSlang(source, {target: 'wgsl', sourceName: 'material.slang'});
    throw new Error('Expected source diagnostic');
  } catch (error) {
    expect(error).toBeInstanceOf(SlangTranspileError);
    expect((error as SlangTranspileError).diagnostics[0]).toMatchObject({
      sourceName: 'material.slang',
      line: 3
    });
  }
});
it('slang#rejects ambiguous overloads and missing return paths', () => {
  expect(() =>
    transpileSlang(
      'float choose(float2 value) { return value.x; } float choose(float3 value) { return value.x; } [shader("fragment")] float4 main() : SV_Target { return float4(choose(1)); }',
      {target: 'wgsl'}
    )
  ).toThrow(/Ambiguous overload/);
  expect(() =>
    transpileSlang(
      '[shader("fragment")] float4 main() : SV_Target { if (true) { return float4(1); } }',
      {target: 'wgsl'}
    )
  ).toThrow(/every path/);
});
it('slang#maps target compiler diagnostics back to source statements, including unified programs', () => {
  const source =
    '// Source\n[shader("fragment")] float4 main() : SV_Target {\n  float value = 2.0;\n  return float4(value);\n}';
  for (const result of [
    transpileSlang(source, {target: 'wgsl', sourceName: 'mapped.slang'}),
    transpileSlangWGSL(source, {sourceName: 'mapped.slang'})
  ]) {
    const generatedLine =
      result.code.split('\n').findIndex(line => line.includes('return vec4<f32>')) + 1;
    expect(mapSlangDiagnostic(result.sourceMap, generatedLine, 'target error')).toMatchObject({
      sourceName: 'mapped.slang',
      line: 4,
      message: 'target error'
    });
    expect(mapSlangDiagnostic(result.sourceMap, 0, 'target error')).toBeUndefined();
  }
});
it.each([
  ['TextureCube<float4>', 'float3', 'Sample', 'SamplerState', 'texture_cube<f32>', 'samplerCube'],
  [
    'Texture2DArray<float4>',
    'float3',
    'SampleLevel',
    'SamplerState',
    'texture_2d_array<f32>',
    'sampler2DArray'
  ],
  ['Texture3D<float2>', 'float3', 'SampleLevel', 'SamplerState', 'texture_3d<f32>', 'sampler3D'],
  [
    'Texture2D<float>',
    'float2',
    'SampleCmp',
    'SamplerComparisonState',
    'texture_depth_2d',
    'sampler2DShadow'
  ]
])('slang#reflects and lowers %s %s sampling', (type, coordinates, method, sampler, wgslType, glslType) => {
  const extra = method === 'Sample' ? '' : ', 0.0';
  const source = `${type} image; ${sampler} imageSampler; [shader("fragment")] float4 main(${coordinates} coordinates : TEXCOORD0) : SV_Target { return float4(image.${method}(imageSampler, coordinates${extra})${type.includes('float2>') ? ', 0.0, 1.0' : ''}); }`;
  for (const target of ['wgsl', 'glsl'] as const) {
    const result = transpileSlang(source, {target});
    expect(result.code).toContain(target === 'wgsl' ? wgslType : glslType);
    expect(result.reflection.bindings[0].texture).toBeDefined();
  }
});
it('slang#supports integer texture loads and explicit storage formats, with WebGL diagnostics', () => {
  const source =
    '[format("rgba8")] WTexture2D<float4> outputImage; [shader("compute")] [numthreads(1,1,1)] void main() { outputImage[int2(0,0)] = float4(1,0,0,1); }';
  const result = transpileSlang(source, {target: 'wgsl'});
  expect(result.code).toContain('texture_storage_2d<rgba8unorm, write>');
  expect(result.code).toContain('textureStore(');
  expect(result.reflection.bindings[0]).toMatchObject({
    access: 'write',
    texture: {format: 'rgba8unorm'}
  });
  expect(transpileSlang(source, {target: 'glsl'}).code).toContain('layout(rgba8, binding = 0)');
  expect(() =>
    transpileSlang(
      source
        .replace(
          '[shader("compute")] [numthreads(1,1,1)] void main()',
          '[shader("fragment")] float4 main() : SV_Target'
        )
        .replace('float4(1,0,0,1); }', 'float4(1,0,0,1); return float4(1); }'),
      {target: 'glsl'}
    )
  ).toThrow(/Storage textures require GLSL 450/);
  const loaded = transpileSlang(
    'Texture2D<uint> image; [shader("fragment")] float4 main() : SV_Target { return float4(float(image.Load(int3(0,0,0)))); }',
    {target: 'wgsl'}
  );
  expect(loaded.code).toContain('texture_2d<u32>');
});

it('slang#matches official Slang nested uniform offsets, sizes, and matrix/array strides', () => {
  const layout = transpileSlang(UNIFORM_SHADER, {target: 'wgsl'}).reflection.bindings[0].layout!;
  const fields = reference.fixtures.uniforms.reflection.parameters[0].type.elementType.fields;
  for (const member of layout.members!) {
    const native = fields.find(field => field.name === member.name)!;
    expect(member.offset).toBe(native.binding.offset);
    expect(member.size).toBe(native.binding.size);
    if (member.arrayStride) expect(member.arrayStride).toBe(native.binding.elementStride);
    if (member.matrixStride)
      expect(member.matrixStride).toBe(native.binding.size / native.type.rowCount!);
  }
});

it('slang#deduplicates shared helpers with expression temporaries and reflects entry-point outputs', () => {
  const result = transpileSlangWGSL(OUTPUT_RENDER_SHADER);
  expect(result.code.match(/fn _slang_function_adjust\(/g)).toHaveLength(1);
  expect(result.entryPoints.vertexMain.reflection.outputs.map(output => output.semantic)).toEqual([
    'SV_Position',
    'TEXCOORD0'
  ]);
  expect(result.entryPoints.fragmentMain.reflection.outputs[0].name).toBe('color');
});
it.each([
  'wgsl',
  'glsl'
] as const)('slang#zero-fills partial aggregates and accepts flat matrix initializers for %s', target => {
  const result = transpileSlang(
    '[shader("fragment")] float4 main() : SV_Target { float values[3] = {1}; float2x2 matrix = {1,2,3,4}; return float4(values[0],values[1],matrix[1].x,1); }',
    {target}
  );
  expect(result.code).toContain('_slang_values');
});

it.each([
  'wgsl',
  'glsl'
] as const)('slang#emits only the selected overload and its dependencies for %s', target => {
  const source =
    'float choose(float value) { return value; } float choose(int value) { return unknown; } [shader("fragment")] float4 main() : SV_Target { return float4(choose(1.0)); }';
  const result = transpileSlang(source, {target});
  expect(result.code).toContain('_slang_function_choose__overload_0');
  expect(result.code).not.toContain('_slang_function_choose__overload_1');
});

it.each([
  'wgsl',
  'glsl'
] as const)('slang#infers comparison textures only from selected overloads and entry points for %s', target => {
  const source = `Texture2D<float> image; SamplerState regularSampler; SamplerComparisonState comparisonSampler;
  float sampleImage(float2 coordinates) { return image.Sample(regularSampler,coordinates); }
  float sampleImage(float3 coordinates) { return image.SampleCmp(comparisonSampler,coordinates.xy,coordinates.z); }
  [shader("fragment")] float4 regularMain() : SV_Target { return float4(sampleImage(float2(0.5))); }
  [shader("fragment")] float4 depthMain() : SV_Target { return float4(sampleImage(float3(0.5))); }`;
  const regular = transpileSlang(source, {target, entryPoint: 'regularMain'});
  expect(regular.reflection.bindings[0].texture?.sampleType).toBe('float');
  expect(regular.code).not.toContain('texture_depth');
  const depth = transpileSlang(source, {target, entryPoint: 'depthMain'});
  expect(depth.reflection.bindings[0].texture?.sampleType).toBe('depth');
  expect(() => transpileSlangWGSL(source)).toThrow(/shared texture/);
});
it.each([
  'wgsl',
  'glsl'
] as const)('slang#rejects mixed comparison and ordinary sampling among reachable functions for %s', target => {
  const source =
    'Texture2D<float> image; SamplerState regularSampler; SamplerComparisonState comparisonSampler; [shader("fragment")] float4 main() : SV_Target { return float4(image.Sample(regularSampler,float2(0.5)) + image.SampleCmp(comparisonSampler,float2(0.5),0.5)); }';
  expect(() => transpileSlang(source, {target})).toThrow(/comparison sampling/);
});
