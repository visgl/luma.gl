// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {transpileSlang, transpileSlangWGSL, SlangTranspileError} from '@luma.gl/slang';
import {WgslReflect} from 'wgsl_reflect';
import {COMPUTE_SHADER, MATRIX_SHADER, MATH_SHADER, RENDER_SHADER} from './fixtures';

for (const target of ['glsl', 'wgsl'] as const) {
  describe(`slang#${target}`, () => {
    it('lowers structs, entry points, resources, helper calls, and interpolation', () => {
      const vertex = transpileSlang(RENDER_SHADER, {target, entryPoint: 'vertexMain'});
      const fragment = transpileSlang(RENDER_SHADER, {target, entryPoint: 'fragmentMain'});
      expect(vertex.stage).toBe('vertex');
      expect(fragment.stage).toBe('fragment');
      expect(vertex.reflection.inputs.map(input => input.semantic)).toEqual([
        'POSITION',
        'SV_VertexID'
      ]);
      expect(
        vertex.reflection.outputs.find(output => output.semantic === 'TEXCOORD0')?.location
      ).toBe(fragment.reflection.inputs.find(input => input.semantic === 'TEXCOORD0')?.location);
      expect(fragment.reflection.bindings.map(binding => binding.kind)).toEqual(
        target === 'wgsl' ? ['uniform', 'texture', 'sampler'] : ['uniform', 'texture']
      );
      expect(fragment.code).not.toContain('vertexMain');
      expect(vertex.code).not.toContain('textureSample');
      expect(fragment.code).not.toContain(': SV_');
      if (target === 'wgsl') {
        const reflected = new WgslReflect(fragment.code);
        expect(reflected.entry.fragment.map(entry => entry.name)).toContain(fragment.entryPoint);
        expect(fragment.code).toContain('@interpolate(flat)');
        expect(fragment.code).toContain('textureSample(');
      } else {
        expect(fragment.code).toContain('#version 300 es');
        expect(fragment.code).toContain('flat in uint');
        expect(fragment.code).toContain('texture(');
        expect(vertex.code).toContain('gl_VertexID');
      }
    });
    it('emits compute shaders with storage and loops', () => {
      const result = transpileSlang(COMPUTE_SHADER, {target});
      expect(result.reflection.workgroupSize).toEqual([4, 1, 1]);
      expect(result.reflection.bindings[0].access).toBe('read_write');
      expect(result.code).toContain('continue;');
      expect(result.code).toContain('_slang_index += 1');
      if (target === 'wgsl') {
        expect(new WgslReflect(result.code).entry.compute[0].name).toBe(result.entryPoint);
      } else {
        expect(result.code).toContain('layout(std430, binding = 0)');
      }
    });
    it('preserves rectangular matrix dimensions and row-major constructor values', () => {
      const result = transpileSlang(MATRIX_SHADER, {target});
      expect(result.code).toContain(target === 'wgsl' ? 'mat2x3<f32>' : 'mat2x3');
      expect(result.code).toContain('_slang_transform');
    });
    it('handles mutable parameters, cbuffer aliases, arrays and scopes', () => {
      const source = `
        cbuffer Settings : register(b3, space2) { float scale; };
        static const float bias = 1;
        float adjust(float value) { value += bias; return value * scale; }
        [shader("fragment")]
        float4 main() : SV_Target { float values[2]; values[0] = adjust(1); { float value = 2; values[1] = value; } return float4(values[0], values[1], 0, 1); }
      `;
      const result = transpileSlang(source, {target});
      expect(result.reflection.bindings[0]).toMatchObject({group: 2, binding: 3, name: 'Settings'});
      expect(result.code).toContain('_slang_Settings._slang_scale');
      expect(result.code).toContain('_slang_value +=');
      if (target === 'wgsl') {
        expect(result.code).toContain('var _slang_value: f32 = _slang_parameter_value;');
      }
    });
    it('reports source locations on unsupported syntax', () => {
      try {
        transpileSlang('// comment\nimport lighting;', {target, stage: 'fragment'});
        throw new Error('Expected a diagnostic');
      } catch (error) {
        expect(error).toBeInstanceOf(SlangTranspileError);
        expect((error as SlangTranspileError).diagnostics[0]).toMatchObject({
          line: 2,
          sourceName: 'shader.slang'
        });
      }
    });
    it('does not rewrite identifiers that contain type names', () => {
      const result = transpileSlang(
        '[shader("fragment")] float4 main() : SV_Target0 { float float4Value = 1; return float4(float4Value); }',
        {target}
      );
      expect(result.code).toContain('_slang_float4Value');
    });
    it('rejects stage mismatch, missing semantics, recursion, duplicate bindings, and immutable writes', () => {
      const invalidSources = [
        '[shader("vertex")] float4 main() : SV_Target { return float4(1); }',
        '[shader("fragment")] float4 main(float input) : SV_Target { return float4(input); }',
        'float recurse(float value) { return recurse(value); } [shader("fragment")] float4 main() : SV_Target { return float4(recurse(1)); }',
        '[vk::binding(0,0)] float first; [vk::binding(0,0)] float second; [shader("fragment")] float4 main() : SV_Target { return float4(first + second); }',
        '[shader("fragment")] float4 main() : SV_Target { const float value = 1; value = 2; return float4(value); }',
        '[shader("fragment")] float4 main() : SV_Target { return float4(unknown); }',
        '[shader("compute")] void main() {}',
        '[shader("fragment")] float4 main() : SV_Target { break; return float4(1); }'
      ];
      for (const source of invalidSources) {
        expect(() => transpileSlang(source, {target})).toThrow(SlangTranspileError);
      }
      expect(() => transpileSlang(RENDER_SHADER, {target})).toThrow(/Multiple shader entry points/);
      expect(() =>
        transpileSlang(RENDER_SHADER, {target, entryPoint: 'vertexMain', stage: 'fragment'})
      ).toThrow(/conflicts/);
    });
  });
}

it('slang#lowers WGSL conditionals and uniform arrays while preserving WebGL limits', () => {
  const conditional = transpileSlang(
    '[shader("fragment")] float4 main() : SV_Target { return float4(true ? 1.0 : 0.0); }',
    {target: 'wgsl'}
  );
  expect(conditional.code).toContain('if (true)');
  const arrays = transpileSlang(
    'uniform float values[2]; [shader("fragment")] float4 main() : SV_Target { return float4(values[0]); }',
    {target: 'wgsl'}
  );
  expect(arrays.reflection.bindings[0].layout).toMatchObject({size: 32, arrayStride: 16});
  expect(() => transpileSlang(COMPUTE_SHADER, {target: 'glsl', glslVersion: '300 es'})).toThrow(
    /require GLSL 450/
  );
});

it('slang#reserves explicit bindings before automatically assigning resources', () => {
  const result = transpileSlang(
    'float implicit; [vk::binding(0,0)] float explicit; [shader("fragment")] float4 main() : SV_Target { return float4(implicit + explicit); }',
    {target: 'wgsl'}
  );
  expect(result.reflection.bindings.map(binding => binding.binding)).toEqual([1, 0]);
});
it('slang#GLSL reflection describes actual blocks and combined samplers', () => {
  const result = transpileSlang(RENDER_SHADER, {target: 'glsl', entryPoint: 'fragmentMain'});
  expect(result.reflection.bindings.find(binding => binding.name === 'colorTexture')?.sampler).toBe(
    'colorSampler'
  );
  expect(result.reflection.bindings.find(binding => binding.name === 'material')?.blockName).toBe(
    '_slang_buffer_material'
  );
  expect(result.reflection.bindings.some(binding => binding.kind === 'sampler')).toBe(false);
});
it('slang#keeps hexadecimal digits while normalizing float suffixes', () => {
  const result = transpileSlang(
    '[shader("fragment")] float4 main() : SV_Target { return float4(float(0xFF), 1f, 0, 1); }',
    {target: 'wgsl'}
  );
  expect(result.code).toContain('0xFF');
  expect(result.code).toContain('1.0');
});

it('slang#broadcasts scalar intrinsic arguments to vector shape', () => {
  for (const target of ['wgsl', 'glsl'] as const) {
    const result = transpileSlang(MATH_SHADER, {target});
    expect(result.code).toContain('step(');
    expect(result.code).toContain('smoothstep(');
    expect(result.code).toContain('mix(');
  }
});

it('slang#unified WGSL retains render entries and deduplicates shared declarations', () => {
  const result = transpileSlangWGSL(RENDER_SHADER);
  const reflection = new WgslReflect(result.code);
  expect(reflection.entry.vertex.map(entry => entry.name)).toEqual([
    result.entryPoints.vertexMain.entryPoint
  ]);
  expect(reflection.entry.fragment.map(entry => entry.name)).toEqual([
    result.entryPoints.fragmentMain.entryPoint
  ]);
  expect(result.code.match(/fn _slang_function_shade\(/g)).toHaveLength(1);
  expect(result.code.match(/var<uniform>/g)).toHaveLength(1);
  const selected = transpileSlangWGSL(RENDER_SHADER, {entryPoints: ['fragmentMain']});
  expect(new WgslReflect(selected.code).entry.vertex).toHaveLength(0);
  expect(() => transpileSlangWGSL(RENDER_SHADER, {entryPoints: []})).toThrow(SlangTranspileError);
  expect(() =>
    transpileSlangWGSL(RENDER_SHADER, {entryPoints: ['fragmentMain', 'fragmentMain']})
  ).toThrow(SlangTranspileError);
});

it.each([
  ['ConstantBuffer', 'ConstantBuffer<Outer> settings;', 'settings.inner.x + settings.value'],
  ['cbuffer', 'cbuffer Settings { Inner inner; float value; };', 'inner.x + value'],
  ['uniform', 'uniform Outer settings;', 'settings.inner.x + settings.value']
])('slang#legalizes nested WGSL %s uniform members', (_kind, declaration, expression) => {
  const source = `struct Inner { float x; };
struct Outer { Inner inner; float value; };
${declaration}
[shader("fragment")] float4 main() : SV_Target { return float4(${expression}); }`;
  const result = transpileSlang(source, {target: 'wgsl', sourceName: 'nested.slang'});
  expect(result.reflection.bindings[0].layout?.members?.[0]).toMatchObject({
    name: 'inner',
    size: 16,
    alignment: 16
  });
  expect(new WgslReflect(result.code).uniforms[0].size).toBe(32);
  expect(() => transpileSlang(source, {target: 'glsl'})).not.toThrow();
});

it('slang#preserves nested WGSL local and storage structures', () => {
  const result = transpileSlang(
    `
    struct Inner { float x; };
    struct Outer { Inner inner; float value; };
    RWStructuredBuffer<Outer> values;
    [shader("compute")] [numthreads(1,1,1)] void main() {
      Outer result;
      result.inner.x = 1;
      result.value = 2;
      values[0] = result;
    }
  `,
    {target: 'wgsl'}
  );
  expect(result.code).toContain('var<storage, read_write>');
  expect(result.code).toContain('_slang_result._slang_inner._slang_x =');
  expect(new WgslReflect(result.code).entry.compute[0].name).toBe(result.entryPoint);
});

it.each([
  '300 es',
  '450'
] as const)('slang#GLSL %s texture declarations match their binding convention', glslVersion => {
  const source = `
    Texture2D<float4> firstImplicit;
    [vk::binding(0,0)] Texture2D<float4> attributeTexture;
    Texture2D<float4> registerTexture : register(t3);
    Texture2D<float4> secondImplicit;
    SamplerState textureSampler;
    [shader("fragment")] float4 main(float2 coordinates : TEXCOORD0) : SV_Target {
      return firstImplicit.Sample(textureSampler, coordinates)
        + attributeTexture.Sample(textureSampler, coordinates)
        + registerTexture.Sample(textureSampler, coordinates)
        + secondImplicit.Sample(textureSampler, coordinates);
    }
  `;
  const result = transpileSlang(source, {target: 'glsl', glslVersion});
  expect(result.code).toContain(`#version ${glslVersion}`);
  const textures = result.reflection.bindings.filter(binding => binding.kind === 'texture');
  expect(textures.map(binding => binding.binding)).toEqual([1, 0, 3, 2]);
  for (const texture of textures) {
    const declaration = `uniform sampler2D ${texture.shaderName};`;
    expect(texture.sampler).toBe('textureSampler');
    if (glslVersion === '450') {
      expect(result.code).toContain(`layout(binding = ${texture.binding}) ${declaration}`);
    } else {
      expect(result.code.split('\n')).toContain(declaration);
      expect(result.code).not.toContain('layout(binding');
    }
  }
  expect(result.reflection.bindings.some(binding => binding.kind === 'sampler')).toBe(false);
  expect(transpileSlang(source, {target: 'glsl'}).code).toBe(
    transpileSlang(source, {target: 'glsl', glslVersion: '300 es'}).code
  );
});
