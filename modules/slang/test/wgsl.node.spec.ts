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
  expect(result.code).toContain('0.0');
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
  expect(shader.code).toContain('0.5');
  expect(shader.code).toContain(' * vec3');
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

it('wgsl#diagnostics do not retain cyclic resolved function references', () => {
  const source =
    'fn recurse(value: f32) -> f32 { return recurse(value); } @fragment fn main() -> @location(0) vec4f { let invalid: i32 = recurse(1.0); return vec4f(1.0); }';
  try {
    transpileWGSL(source);
    throw new Error('Expected a source diagnostic');
  } catch (error) {
    expect(error).toBeInstanceOf(WGSLTranspileError);
    expect(() => JSON.stringify((error as WGSLTranspileError).diagnostics)).not.toThrow();
    expect((error as WGSLTranspileError).diagnostics[0]).toMatchObject({
      sourceName: 'shader.wgsl',
      line: 1
    });
  }
});

it.each([
  'let bits: u32 = 1 | 2;',
  'let bits: u32 = produce();',
  'let bits: u32 = accept(1 & 2);',
  'let bits: u32 = u32(1 ^ 2);',
  'let bits: u32 = 2147483648 | 1;'
])('wgsl#preserves unsigned context for abstract bitwise operands: %s', declaration => {
  const source = `fn produce() -> u32 { return 1 | 2; } fn accept(value: u32) -> u32 { return value; } @fragment fn main() -> @location(0) vec4f { ${declaration} return vec4f(f32(bits)); }`;
  expect(() => transpileWGSL(source)).not.toThrow();
});

it('wgsl#keeps ordinary prototype-named structs and functions distinct from scalar types', () => {
  const source =
    'struct toString { value: f32, } fn constructor(value: f32) -> f32 { return value; } @fragment fn main() -> @location(0) vec4f { var record: toString; record.value = constructor(1.0); return vec4f(record.value); }';
  expect(transpileWGSL(source).code).toContain('_slang_type_toString');
});

it('wgsl#supports uniform reflection without changing source buffer bytes', () => {
  const source = `struct Settings { transform: mat4x4f, tint: vec4f, }
  @group(1) @binding(2) var<uniform> settings: Settings;
  @fragment fn main() -> @location(0) vec4f { return settings.transform * settings.tint; }`;
  const result = transpileWGSL(source);
  expect(result.code).toContain('layout(std140)');
  expect(result.reflection.bindings).toEqual(
    expect.arrayContaining([expect.objectContaining({group: 1, binding: 2})])
  );
  expect(result.code).toContain(' * ');
});

it.each([
  'textureSample(image, filtering, vec2f(0.5))',
  'textureSampleLevel(image, filtering, vec2f(0.5), 0.0)',
  'textureSampleGrad(image, filtering, vec2f(0.5), vec2f(0.1), vec2f(0.1))',
  'textureLoad(image, vec2i(0), 0)',
  'vec4f(vec2f(textureDimensions(image)), 0.0, 1.0)'
])('wgsl#lowers 2D textures: %s', expression => {
  const result = transpileWGSL(
    `@group(0) @binding(1) var image: texture_2d<f32>; @group(0) @binding(2) var filtering: sampler; @fragment fn main() -> @location(0) vec4f { return ${expression}; }`
  );
  expect(result.code).toMatch(/texture(?:Lod|Grad|Size)?\(|texelFetch\(/);
});

it('wgsl#supports aliases, named constants, arrays, matrix products and structured control flow', () => {
  const result = transpileWGSL(`const COUNT = 3; alias Values = array<f32, COUNT>;
 @fragment fn main() -> @location(0) vec4f {
   var values=Values(0.1,0.2,0.3); var total=0.0;
   for(var index=0; index<COUNT; index++) {if(index==1) {continue;} total+=values[index];}
   var count=0; while(count<2) {total+=0.1;count++;}
   switch count {case 1: {total=0.0;} default: {total+=0.1;}}
   let matrix=mat2x3f(vec3f(1.0,0.0,0.0),vec3f(0.0,1.0,0.0));
   let color=matrix * vec2f(total);
   return vec4f(clamp(color,vec3f(0.0),vec3f(1.0)),1.0);
 }`);
  expect(result.code).toContain('mat2x3');
  expect(result.code).toContain('while');
  expect(result.code).toContain('switch');
});

it('wgsl#select is eager and bitcast preserves bits', () => {
  const result = transpileWGSL(`var<private> calls:i32; fn next()->f32 {calls++;return f32(calls);}
 @fragment fn main()->@location(0) vec4f {let value=select(next(),next(),false);let bits=bitcast<u32>(value);return vec4f(bitcast<f32>(bits));}`);
  expect(result.code).toContain('floatBitsToUint');
  expect(result.code).toContain('uintBitsToFloat');
  expect(result.code).toContain(' ? ');
});

it.each([
  'struct Settings { value: mat2x2f, } @group(0) @binding(0) var<uniform> settings: Settings;',
  'struct Settings { value: array<f32, 2>, } @group(0) @binding(0) var<uniform> settings: Settings;',
  'struct Settings { value: bool, } @group(0) @binding(0) var<uniform> settings: Settings;',
  '@group(0) @binding(0) var image:texture_2d<f32>; @group(0) @binding(0) var filtering:sampler;',
  'const COUNT=0; alias Values=array<f32,COUNT>; var<private> values:Values;',
  'var<private> invalid:f32=helper(); fn helper()->f32 {return 1.0;}'
])('wgsl#rejects invalid resources and globals: %s', source => {
  expect(() =>
    transpileWGSL(`${source} @fragment fn main()->@location(0) vec4f {return vec4f(0.0);}`)
  ).toThrow(WGSLTranspileError);
});

it.each([
  'sin(1.0)',
  'cos(1.0)',
  'cosh(1.0)',
  'sinh(1.0)',
  'tanh(1.0)',
  'degrees(1.0)',
  'radians(1.0)',
  'round(1.5)',
  'inverseSqrt(1.0)',
  'fract(1.5)',
  'dpdx(1.0)',
  'dpdy(1.0)',
  'fwidth(1.0)',
  'min(1.0,2.0)',
  'clamp(1.0,0.0,1.0)',
  'select(1.0,2.0,true)'
])('wgsl#resolves math builtin %s', expression => {
  expect(() =>
    transpileWGSL(`@fragment fn main()->@location(0) vec4f {return vec4f(${expression});}`)
  ).not.toThrow();
});

it('wgsl#local names shadow abstract module constants', () => {
  const result = transpileWGSL(
    `const VALUE=3; fn identity(VALUE:f32)->f32 {return VALUE;} @fragment fn main()->@location(0) vec4f {const VALUE=VALUE+1;return vec4f(identity(0.25),f32(VALUE),0.0,1.0);}`
  );
  expect(result.code).toContain('return _slang_VALUE;');
});

it('wgsl#reuses aliases with nested generic closing tokens', () => {
  expect(() =>
    transpileWGSL(
      `alias Nested=array<array<f32,2>,2>; @fragment fn main()->@location(0) vec4f {var first:Nested;var second:Nested;return vec4f(first[0][0]+second[1][1]);}`
    )
  ).not.toThrow();
});
