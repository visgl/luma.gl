// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {transpileWGSL, WGSLTranspileError} from '../src/wgsl';
import {WGSL_RENDER_SHADER} from './wgsl-fixtures';
import {parseWGSL} from '../src/wgsl-parser';
import {analyzeWGSL} from '../src/wgsl-analysis';

it('wgsl#compiles selected stages and preserves interface metadata and source provenance', () => {
  const vertex = transpileWGSL(WGSL_RENDER_SHADER, {
    entryPoint: 'vertexMain',
    sourceName: 'triangle.wgsl'
  });
  const fragment = transpileWGSL(WGSL_RENDER_SHADER, {entryPoint: 'fragmentMain'});
  expect(vertex.stage).toBe('vertex');
  expect(vertex.entryPoint).toBe('main');
  expect(vertex.reflection.inputs.map(input => input.location)).toEqual([0, 1]);
  expect(vertex.reflection.outputs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({builtin: 'position'}),
      expect.objectContaining({location: 0})
    ])
  );
  expect(vertex.code).toContain('gl_Position.y = -gl_Position.y;');
  expect(vertex.code).toContain('gl_Position.z = 2.0 * gl_Position.z - gl_Position.w;');
  expect(
    vertex.sourceMap.some(entry => entry.sourceName === 'triangle.wgsl' && entry.line > 1)
  ).toBe(true);
  expect(fragment.code).toContain('_slang_function_makeColor');
});

it('wgsl#materializes literals, infers locals, zero initializes aggregates and resolves calls', () => {
  const source =
    'struct Value { value: vec2f, } fn twice(value: f32) -> f32 { return value * 2; } @fragment fn main() -> @location(0) vec4f { var result: Value; result.value.x = twice(1); let number: u32 = 2; var value = 1.0; value += 2; return vec4f(result.value, f32(number), value); }';
  const result = transpileWGSL(source);
  expect(result.code).toContain('vec2(0.0)');
  expect(result.code).toContain('2u');
  const program = parseWGSL(source, 'typed.wgsl');
  analyzeWGSL(program, 'typed.wgsl');
  const helper = program.declarations.find(
    declaration => declaration.kind === 'function' && declaration.name === 'twice'
  );
  expect(
    helper?.kind === 'function' &&
      helper.body.kind === 'block' &&
      helper.body.statements[0].kind === 'return' &&
      helper.body.statements[0].expression?.resolvedType
  ).toEqual({kind: 'scalar', scalar: 'f32'});
});

it('wgsl#accepts nested comments and signed integer minimum', () => {
  expect(
    transpileWGSL(
      '/* outer /* nested */ comment */ @fragment fn main() -> @location(0) vec4f { let value: i32 = -2147483648; return vec4f(f32(value)); }'
    ).code
  ).toContain('(-2147483647 - 1)');
});

it.each([
  '@compute @workgroup_size(1) fn main() {}',
  '@group(0) @binding(0) var<uniform> value: f32;',
  '@fragment fn main() -> @location(0) vec4f { let value: i32 = 1u; return vec4f(0.0); }',
  '@fragment fn main() -> @location(0) vec4f { let value = 1.0; value = 2.0; return vec4f(value); }',
  '@fragment fn main() -> @location(0) vec4f { let value = 1u + 1i; return vec4f(f32(value)); }',
  '@fragment fn main() -> @location(0) vec4f { let value = 1 / 0; return vec4f(f32(value)); }',
  '@fragment fn main() -> @location(0) vec4f { let value = vec2f(1.0).z; return vec4f(value); }',
  '@fragment fn main() -> @location(0) vec4f { return vec4f(vec2f(1.0), 2.0); }',
  '@fragment fn main() -> @location(0) vec4f { let value = 4294967296u; return vec4f(f32(value)); }',
  '@fragment fn main(@builtin(position) position: vec4f) -> @location(0) vec4f { return position; }',
  'fn helper(value: f32) -> f32 { value = 2.0; return value; } @fragment fn main() -> @location(0) vec4f { return vec4f(helper(1.0)); }',
  'fn helper(value: f32) -> f32 { return helper(value); } @fragment fn main() -> @location(0) vec4f { return vec4f(helper(1.0)); }',
  'struct Recursive { child: Recursive, } @fragment fn main() -> @location(0) vec4f { return vec4f(1.0); }',
  '@fragment fn main() -> @location(0) vec4f { if true { return vec4f(1.0); } return vec4f(0.0); }',
  '@fragment fn main() -> @location(0) vec4f { return mix(vec4f(0.0), vec4f(1.0), 0.5); }',
  '@fragment fn main() -> @location(0) vec4f { let value = 1.0; let converted = i32(value); return vec4f(f32(converted)); }',
  '@location('
])('wgsl#rejects unsupported or invalid input with a source diagnostic: %s', source => {
  expect(() => transpileWGSL(source, {sourceName: 'invalid.wgsl'})).toThrow(WGSLTranspileError);
  try {
    transpileWGSL(source, {sourceName: 'invalid.wgsl'});
  } catch (error) {
    expect((error as WGSLTranspileError).diagnostics[0]).toMatchObject({
      sourceName: 'invalid.wgsl'
    });
  }
});

it('wgsl#evaluates abstract arithmetic before f32 materialization', () => {
  const shader = transpileWGSL(
    '@fragment fn main() -> @location(0) vec4f { let value: f32 = 16777217 - 16777216; return vec4f(value); }'
  );
  expect(shader.code).toContain('= 1.0;');
  expect(shader.code).not.toContain('16777217');
});

it('wgsl#checks comparisons in boolean contexts without coercing numeric operands to bool', () => {
  const shader = transpileWGSL(
    'fn compare(value: f32) -> bool { return value < 2.0; } @fragment fn main() -> @location(0) vec4f { let same: bool = 1 == 1; let compared = compare(1.0); return vec4f(1.0); }'
  );
  expect(shader.code).toContain('< 2.0');
});

it('wgsl#materializes abstract subexpressions against concrete operands and supports vector scaling', () => {
  const shader = transpileWGSL(
    '@fragment fn main() -> @location(0) vec4f { let count: u32 = (1 + 2) + 1u; let scaled = 0.5 * vec3f(-1, 1 + 2, 1); return vec4f(scaled, f32(count)); }'
  );
  expect(shader.code).toContain('3u');
  expect(shader.code).toContain('vec3(0.5) * vec3');
});

it('wgsl#supports scalar/vector division and vector compound division', () => {
  expect(() =>
    transpileWGSL(
      '@fragment fn main() -> @location(0) vec4f { var value = vec3f(1.0); value /= 2.0; let reciprocal = 2.0 / value; return vec4f(reciprocal, 1.0); }'
    )
  ).not.toThrow();
});

it('wgsl#formats folded exponent constants as valid floating literals', () => {
  const result = transpileWGSL(
    '@fragment fn main() -> @location(0) vec4f { let value: f32 = 1e21 + 0.0; return vec4f(value / 1e21); }'
  );
  expect(result.code).toContain('1e+21');
  expect(result.code).not.toContain('1e+21.0');
});

it.each([
  '1 == 1.0',
  '1.0 == 1'
])('wgsl#uses a common abstract type for comparisons: %s', comparison => {
  expect(() =>
    transpileWGSL(
      `fn compare() -> bool { return ${comparison}; } @fragment fn main() -> @location(0) vec4f { return vec4f(1.0); }`
    )
  ).not.toThrow();
});

it('wgsl#compares abstract floats before f32 rounding', () => {
  const result = transpileWGSL(
    'fn compare() -> bool { return 100000000001.0 != 100000000000.0; } @fragment fn main() -> @location(0) vec4f { let compared = compare(); return vec4f(1.0); }'
  );
  expect(result.code).toContain('return true;');
});
