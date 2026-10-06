// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {transpileSlang, transpileSlangWGSL, SlangTranspileError} from '@luma.gl/slang';
import {EVERYDAY_SHADER} from './everyday-fixtures';

it.each([
  'wgsl',
  'glsl'
] as const)('slang#supports everyday control flow and inferred locals for %s', target => {
  expect(transpileSlang(EVERYDAY_SHADER, {target}).stage).toBe('compute');
});
it.each([
  'switch(1.0) { case 0: break; }',
  'switch(1) { case 1: break; case 1u: break; }',
  'switch(1u) { case 0xFFFFFFFFu + 1u: break; case 0: break; }',
  'switch(1u) { case -1 / 2u: break; case 2147483647u: break; }',
  'switch(1) { case 0: int value = 1; case 1: value = 2; break; }',
  'switch(1) { default: break; default: break; }',
  'var value = 1; switch(1) { case value: break; }',
  'var value;',
  'let value = 2147483648;',
  'let value = 4294967296u;',
  'let value = 1; switch(1) { case value: break; }',
  'let value : float;',
  'let value = 1; value += 1;',
  'let value = float2(1); value.x = 0;',
  'let value = {1,2};',
  'float2 value = int3(1) + float2(1);',
  'var value = float2(1) << 1;',
  'var value = float2x2(float2(1), float3(2));',
  'break;',
  'switch(1) { case 0: continue; }'
])('slang#diagnoses unsupported or invalid everyday source: %s', statement => {
  const source = `[shader("fragment")] float4 main() : SV_Target {\n${statement}\nreturn float4(1);\n}`;
  for (const target of ['wgsl', 'glsl'] as const) {
    try {
      transpileSlang(source, {target, sourceName: 'everyday.slang'});
      throw new Error('Expected a diagnostic');
    } catch (error) {
      expect(error).toBeInstanceOf(SlangTranspileError);
      expect((error as SlangTranspileError).diagnostics[0]).toMatchObject({
        sourceName: 'everyday.slang',
        line: 2
      });
    }
  }
});
it('slang#checks complete return paths through switches and mandatory do bodies', () => {
  const compile = (body: string) =>
    transpileSlang(`[shader("fragment")] float4 main() : SV_Target { ${body} }`, {target: 'wgsl'});
  expect(() =>
    compile('switch(1) { case 0: return float4(0); default: return float4(1); }')
  ).not.toThrow();
  expect(() => compile('do { return float4(1); } while(false);')).not.toThrow();
  expect(() => compile('switch(1) { case 0: return float4(0); }')).toThrow(/every path/);
  expect(() => compile('switch(1) { default: break; return float4(1); }')).toThrow(/every path/);
});
it('slang#switch lowering emits each fallthrough body once and keeps source mappings', () => {
  const source =
    '[shader("fragment")] float4 main() : SV_Target {\nvar value = 0;\nswitch(1) {\ncase 0: value += 101;\ncase 1: value += 102;\ndefault: value += 103;\n}\nreturn float4(value);\n}';
  const result = transpileSlangWGSL(source, {sourceName: 'switch.slang'});
  expect(result.code.match(/101/g)).toHaveLength(1);
  expect(result.code.match(/102/g)).toHaveLength(1);
  expect(result.code.match(/103/g)).toHaveLength(1);
  expect(result.sourceMap.some(mapping => mapping.line === 5)).toBe(true);
});
it.each([
  'do { GroupMemoryBarrierWithGroupSync(); } while(false);',
  'switch(1) { default: GroupMemoryBarrierWithGroupSync(); }'
])('slang#checks barrier convergence in new control flow: %s', body => {
  expect(() =>
    transpileSlang(`[shader("compute")] [numthreads(1,1,1)] void main() { ${body} }`, {
      target: 'wgsl'
    })
  ).toThrow(/unconditional/);
});
