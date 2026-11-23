// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {lowerSlangType} from '../src/slang-types';
import {emitNumericType} from '../src/ir-types';
import {lowerSlangInterface} from '../src/slang-interface';
import {lowerSlangResource} from '../src/resources';
import {transpileSlang} from '../src/index';

it('preserves rectangular Slang matrix representation across both targets', () => {
  const type = lowerSlangType({name: 'float2x3'});
  expect(type).toEqual({kind: 'matrix', scalar: 'f32', columns: 2, rows: 3});
  expect(emitNumericType(type, 'wgsl')).toBe('mat2x3<f32>');
  expect(emitNumericType(type, 'glsl')).toBe('mat2x3');
  expect(lowerSlangType({name: 'array', element: {name: 'float2x3'}, length: 5})).toEqual({
    kind: 'array',
    element: type,
    length: 5
  });
});

it('retains binding groups and distinguishes storage access from handle resources', () => {
  expect(lowerSlangResource({name: 'RWStructuredBuffer'}, {group: 2, binding: 7})).toEqual({
    kind: 'storage',
    addressSpace: 'storage',
    access: 'read_write',
    group: 2,
    binding: 7
  });
  expect(lowerSlangResource({name: 'WTexture2D'}, {group: 1, binding: 3}, 'write')).toMatchObject({
    kind: 'texture',
    addressSpace: 'handle',
    access: 'write'
  });
});

it('normalizes inherited interpolation and preserves explicit interface locations', () => {
  const metadata = lowerSlangInterface(
    {
      kind: 'variable',
      name: 'value',
      type: {name: 'float2'},
      modifiers: ['noperspective', 'centroid'],
      attributes: [],
      semantic: 'TEXCOORD0',
      location: {offset: 0, line: 1, column: 1}
    },
    'fragment',
    'in',
    new Map([['TEXCOORD0', 3]]),
    message => {
      throw new Error(message);
    }
  );
  expect(metadata).toEqual({location: 3, interpolation: 'linear', sampling: 'centroid'});
});

it('emits fragment position and integer vertex builtins through normalized interfaces', () => {
  const fragment = transpileSlang(
    '[shader("fragment")] float4 main(float4 position : SV_Position) : SV_Target { return position; }',
    {target: 'glsl'}
  );
  expect(fragment.code).toContain('gl_FragCoord');
  const vertex = transpileSlang(
    '[shader("vertex")] float4 main(uint vertex : SV_VertexID) : SV_Position { return float4(vertex); }',
    {target: 'glsl'}
  );
  expect(vertex.code).toContain('uint(gl_VertexID)');
});

it('keeps shared target type emission independent of frontend code', async () => {
  const {build} = await import('esbuild');
  const result = await build({
    entryPoints: ['modules/slang/src/ir-types.ts'],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    metafile: true
  });
  expect(Object.keys(result.metafile!.inputs)).toEqual(['modules/slang/src/ir-types.ts']);
});

it.each(['int2x3', 'bool3x3', 'floatx3'])('rejects unsupported matrix value types: %s', name => {
  expect(emitNumericType(lowerSlangType({name}), 'glsl')).toBeUndefined();
});

it.each([
  'glsl',
  'wgsl'
] as const)('keeps named uniform structs containing Texture as uniforms in %s', target => {
  const shader = transpileSlang(
    'struct TextureInfo { float scale; }; uniform TextureInfo settings; [shader("fragment")] float4 main() : SV_Target { return float4(settings.scale); }',
    {target}
  );
  expect(shader.reflection.bindings[0].kind).toBe('uniform');
  expect(shader.code).not.toContain('var<handle>');
  if (target === 'wgsl') expect(shader.code).toContain('var<uniform>');
});
