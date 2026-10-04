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
      expect(result.code).toContain('_slang_transform)');
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

it('slang#rejects unsupported WGSL semantics rather than eagerly evaluating conditional branches', () => {
  expect(() =>
    transpileSlang(
      '[shader("fragment")] float4 main() : SV_Target { return float4(true ? 1.0 : 0.0); }',
      {target: 'wgsl'}
    )
  ).toThrow(/control-flow lowering/);
});
it('slang#rejects unsupported uniform packing and WebGL storage', () => {
  expect(() =>
    transpileSlang(
      'uniform float values[2]; [shader("fragment")] float4 main() : SV_Target { return float4(values[0]); }',
      {target: 'wgsl'}
    )
  ).toThrow(/layout legalization/);
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
