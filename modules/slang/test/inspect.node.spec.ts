// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {WGSL_EXAMPLES} from '../../../examples/tutorials/slang-shaders/wgsl-examples';
import {parseWGSL} from '../src/wgsl-parser';
import {createWGSLInspection} from '../src/wgsl-inspect';
import {expect, it} from 'vitest';
import {inspectWGSL, inspectGLSL, ShaderInspectionError} from '../src/inspect';
import {scanWGSLInterface} from '../../core/src/wgsl';

it('inspectWGSL#returns module declarations, logical column types and original source locations', () => {
  const source = `/* declarations */
 struct Settings { matrix:mat2x3f, values:array<f32,2>, }
 @group(1) @binding(2) var<uniform> settings:Settings;
 const COUNT=2;
 @vertex fn vertexMain(@location(0) position:vec3f)->@builtin(position) vec4f {return vec4f(position,1.0);}
 @fragment fn fragmentMain()->@location(0) vec4f {return vec4f(1.0);}`;
  const result = inspectWGSL(source, {sourceName: 'module.wgsl'});
  expect(result.structures[0].members[0].type).toEqual({
    kind: 'matrix',
    scalar: 'f32',
    columns: 2,
    rows: 3
  });
  expect(result.globals[0]).toMatchObject({
    name: 'settings',
    addressSpace: 'uniform',
    binding: {group: 1, binding: 2},
    type: {kind: 'struct', name: 'Settings'}
  });
  expect(result.entryPoints.map(entry => entry.stage)).toEqual(['vertex', 'fragment']);
  expect(result.functions[0].parameters[0].interface?.location).toBe(0);
  expect(result.globals[0].location).toMatchObject({line: 3, sourceName: 'module.wgsl'});
  expect(source.slice(result.globals[0].location.offset)).toMatch(/^settings/);
  expect(() => JSON.stringify(result)).not.toThrow();
  // Introspection does not apply GLSL std140 compatibility restrictions to the source.
  expect(result.structures[0].members[1].type).toEqual({
    kind: 'array',
    element: {kind: 'scalar', scalar: 'f32'},
    length: 2
  });
});

it('inspectWGSL#agrees with the existing scanner on their shared pipeline subset', () => {
  const source = `struct Settings { tint:vec4f, }
 @group(0) @binding(0) var<uniform> settings:Settings;
 @group(0) @binding(1) var image:texture_2d<f32>;
 @group(0) @binding(2) var filtering:sampler;
 @vertex fn vertexMain(@location(3) position:vec2f)->@builtin(position) vec4f {return vec4f(position,0.0,1.0);}`;
  const inspected = inspectWGSL(source);
  const scanned = scanWGSLInterface(source)!;
  expect(scanned).not.toBeNull();
  expect(scanned.attributes).toEqual(
    expect.arrayContaining([expect.objectContaining({name: 'position', location: 3})])
  );
  expect(inspected.entryPoints[0].parameters[0].interface?.location).toBe(3);
  expect(inspected.globals.map(value => value.binding)).toEqual([
    {group: 0, binding: 0},
    {group: 0, binding: 1},
    {group: 0, binding: 2}
  ]);
  expect(scanned.bindings).toHaveLength(3);
});

it('inspectWGSL#keeps inferred values and symbolic array counts explicit', () => {
  const result = inspectWGSL(
    'const COUNT=2; alias Values=array<f32,COUNT>; var<private> values:Values;'
  );
  expect(result.globals[0].type).toEqual({kind: 'inferred'});
  expect(result.globals[1].type).toMatchObject({kind: 'array', lengthExpression: 'COUNT'});
});

it('inspectGLSL#parses declarations into shared logical types and retains interface/resource metadata', () => {
  const source = `#version 300 es
 precision highp float;
 struct Light { vec3 position; float intensity; };
 layout(location=0) in vec3 position;
 layout(location=1) flat out uvec2 identifier;
 layout(std140,binding=2) uniform Settings { mat2x3 transform; vec4 tint; } settings;
 uniform sampler2D image;
 uniform Light lights[2], alternate[3];
 float helper(in float value);
 float helper(in float value) { if(value>0.0) {return value;} return 0.0; }
 void main() {gl_Position=vec4(position,1.0);}`;
  const result = inspectGLSL(source, {stage: 'vertex', sourceName: 'module.vert'});
  expect(result.version).toBe('300 es');
  expect(result.language).toBe('glsl');
  expect(result.globals[0].type).toEqual({kind: 'vector', scalar: 'f32', width: 3});
  expect(result.globals[1].interface).toMatchObject({location: 1, interpolation: 'flat'});
  expect(result.globals[2]).toMatchObject({
    name: 'settings',
    binding: {binding: 2},
    layout: {std140: true, binding: '2'},
    block: {name: 'Settings', instanceName: 'settings'}
  });
  expect(result.globals[2].block?.members[0].type).toEqual({
    kind: 'matrix',
    scalar: 'f32',
    columns: 2,
    rows: 3
  });
  expect(result.globals[3].type).toEqual({kind: 'opaque', name: 'sampler2D'});
  expect(result.globals[4].type).toEqual({
    kind: 'array',
    element: {kind: 'struct', name: 'Light'},
    length: 2
  });
  expect(result.globals[5].type).toMatchObject({kind: 'array', length: 3});
  expect(result.functions.map(value => value.hasBody)).toEqual([false, true, true]);
  expect(result.entryPoints[0]).toMatchObject({
    name: 'main',
    stage: 'vertex',
    returnType: {kind: 'void'}
  });
  expect(source.slice(result.globals[0].location.offset)).toMatch(/^position/);
  expect(() => JSON.stringify(result)).not.toThrow();
});

it('inspectGLSL#handles anonymous block instances, arrays and constant initializers without scanning bodies as globals', () => {
  const result = inspectGLSL(`// #define IGNORED 1
 /* #if also ignored */
 layout(std140) uniform Settings { vec4 tint; };
 const float values[2][3]=float[2][3](float[3](1.,2.,3.),float[3](4.,5.,6.)), other=1.;
 void main() {struct Local {float x;}; float neverAGlobal=0.0;}`);
  expect(result.globals).toHaveLength(3);
  expect(result.globals[0].block).toMatchObject({name: 'Settings'});
  expect(result.globals[0].block?.instanceName).toBeUndefined();
  expect(result.globals[1].type).toMatchObject({
    kind: 'array',
    length: 2,
    element: {kind: 'array', length: 3}
  });
  expect(result.entryPoints[0].stage).toBeUndefined();
});

it.each([
  '#define TYPE vec3\nTYPE value;',
  '#if FEATURE\nvec3 value;\n#endif',
  'uniform Unknown value;',
  'layout(location=VALUE) in vec3 value;',
  'void main() {',
  'uniform vec3 value[COUNT];',
  'uniform vec3 value = vec3(1.0;'
])('inspectGLSL#rejects unsupported or incomplete input: %s', source => {
  expect(() => inspectGLSL(source, {sourceName: 'broken.glsl'})).toThrow(ShaderInspectionError);
  try {
    inspectGLSL(source, {sourceName: 'broken.glsl'});
  } catch (error) {
    expect((error as ShaderInspectionError).diagnostics[0]).toMatchObject({
      sourceName: 'broken.glsl',
      line: expect.any(Number)
    });
  }
});

it('inspectWGSL#reports unsupported language constructs rather than partial metadata', () => {
  expect(() => inspectWGSL('@compute @workgroup_size(1) fn main() {}')).toThrow(
    ShaderInspectionError
  );
});

it('inspectWGSL#distinguishes user struct names from compiler resource names', () => {
  for (const name of ['ConstantBuffer', 'Texture2D', 'SamplerState', 'float2']) {
    const result = inspectWGSL(`struct ${name} {value:f32,} var<private> item:${name};`);
    expect(result.globals[0].type).toEqual({kind: 'struct', name});
    expect(result.globals[0].addressSpace).toBe('private');
  }
  const result = inspectWGSL(
    'struct ConstantBuffer {value:vec4f,} @group(0) @binding(0) var<uniform> item:ConstantBuffer;'
  );
  expect(result.globals[0]).toMatchObject({
    type: {kind: 'struct', name: 'ConstantBuffer'},
    addressSpace: 'uniform'
  });
});
it('inspectGLSL#accepts commented version directives, null directives and multisampled array handles', () => {
  const result = inspectGLSL(
    '#version /* profile */ 300 es // trailing comment\n#\nuniform sampler2DMSArray samples;uniform uimage2DMSArray images;'
  );
  expect(result.version).toBe('300 es');
  expect(result.globals.map(value => value.type)).toEqual([
    {kind: 'opaque', name: 'sampler2DMSArray'},
    {kind: 'opaque', name: 'uimage2DMSArray'}
  ]);
  expect(() => inspectGLSL('#123')).toThrow(ShaderInspectionError);
});

it('inspectWGSL#small and full parsers share declaration/type metadata', () => {
  for (const example of WGSL_EXAMPLES) {
    const sourceName = 'shared.wgsl';
    const full = createWGSLInspection(parseWGSL(example.code, sourceName), sourceName);
    expect(inspectWGSL(example.code, {sourceName})).toEqual(full);
  }
});
it('inspectWGSL#skips balanced bodies and initializer expressions without importing the full grammar', () => {
  const result = inspectWGSL(
    `const VALUE=bitcast<u32>(1.0); @fragment fn main()->@location(0) vec4f {var value=0.0;loop {value+=1.0;if(value>2.0){break;}}return vec4f(value);}`
  );
  expect(result.globals[0]).toMatchObject({name: 'VALUE', type: {kind: 'inferred'}});
  expect(result.entryPoints[0]).toMatchObject({name: 'main', stage: 'fragment'});
  expect(() => parseWGSL('fn main(){loop {break;}}', 'full.wgsl')).toThrow(ShaderInspectionError);
});
it.each([
  'fn main(){if(true] {}}',
  'fn main(){let values=array<f32,2>(1.0,2.0);',
  'const VALUE=;'
])('inspectWGSL#small parser rejects unbalanced or empty syntax: %s', source => {
  expect(() => inspectWGSL(source, {sourceName: 'invalid.wgsl'})).toThrow(ShaderInspectionError);
});

it('inspectGLSL#shares array parsing for type and declarator dimensions', () => {
  const result = inspectGLSL(
    '#version 450\nstruct Item {float[2] values[3];};float[2] values;vec4[4] helper(vec4[4] positions){return positions;}'
  );
  expect(result.globals[0].type).toEqual({
    kind: 'array',
    length: 2,
    element: {kind: 'scalar', scalar: 'f32'}
  });
  expect(result.structures[0].members[0].type).toMatchObject({
    kind: 'array',
    length: 3,
    element: {kind: 'array', length: 2}
  });
  expect(result.functions[0].parameters[0].type).toMatchObject({kind: 'array', length: 4});
  expect(result.functions[0].returnType).toMatchObject({kind: 'array', length: 4});
});
it('inspectGLSL#accepts unsigned decimal layout/array literals and keeps local struct names local', () => {
  const result = inspectGLSL('layout(location=0u,binding=1U) uniform vec4 values[2U];');
  expect(result.globals[0]).toMatchObject({
    binding: {binding: 1},
    interface: {location: 0},
    type: {kind: 'array', length: 2}
  });
  expect(() => inspectGLSL('void helper(){struct Local {float value;};} Local invalid;')).toThrow(
    ShaderInspectionError
  );
});

it('inspectGLSL#uses one literal reader for hexadecimal, octal and unsigned dimensions/layouts', () => {
  const result = inspectGLSL('layout(location=010,binding=0x2U) uniform vec4 values[0x3u];');
  expect(result.globals[0]).toMatchObject({
    interface: {location: 8},
    binding: {binding: 2},
    type: {kind: 'array', length: 3}
  });
  expect(() => inspectGLSL('uniform float values[08];')).toThrow(ShaderInspectionError);
});
