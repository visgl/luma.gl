// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GLSLShaderAssembler, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {createSlangTranspiler} from '../../../examples/tutorials/slang-shaders/slang-transpiler';
import {
  mapSlangDiagnostic,
  SlangTranspileError,
  transpileSlang,
  transpileSlangWGSL
} from '@luma.gl/slang';
import {MODULE_OPTIONS, MODULE_RENDER, MODULE_COMPUTE, NATIVE_RESOURCES} from './modules-fixtures';

const MAIN = '[shader("fragment")] float4 main() : SV_Target0 { return float4(1); }';
for (const target of ['wgsl', 'glsl'] as const) {
  describe(`slang#${target} registry and native contracts`, () => {
    it('resolves transitive diamond imports once and exposes stable typed names', () => {
      const result = transpileSlang(MODULE_RENDER, {
        ...MODULE_OPTIONS,
        target,
        entryPoint: 'fragmentMain'
      });
      expect(result.code.match(/(?:fn|float) _slang_function_getScale\(/g)).toHaveLength(1);
      expect(result.code).toContain('applyNativePublic(');
      expect(result.code).toContain('shadePublic(');
      expect(result.code).toContain('settings.scale');
      expect(result.exports?.applyNative).toMatchObject({
        shaderName: 'applyNativePublic',
        type: 'Payload'
      });
      expect(
        result.exports?.updateNative.parameters?.map(parameter => parameter.direction)
      ).toEqual(['inout', 'out']);
      expect(result.reflection.bindings[0]).toMatchObject({
        name: 'settings',
        shaderName: 'settings',
        binding: 0,
        visibility: 2
      });
      expect(result.code.startsWith(target === 'glsl' ? '#version 300 es' : 'struct')).toBe(true);
    });
    it('maps imported Slang and native implementation lines to their source units', () => {
      const result = transpileSlang(MODULE_RENDER, {
        ...MODULE_OPTIONS,
        target,
        entryPoint: 'fragmentMain',
        sourceName: 'application.slang'
      });
      const nativeLine =
        result.code.split('\n').findIndex(line => line.includes('return Payload(shadePublic')) + 1;
      expect(mapSlangDiagnostic(result.sourceMap, nativeLine, 'target error')).toMatchObject({
        sourceName: `bridge.${target}`,
        line: 2
      });
      expect(result.sourceMap.some(entry => entry.sourceName === 'shared')).toBe(true);
      expect(result.sourceMap.some(entry => entry.sourceName === 'application.slang')).toBe(true);
      expect(result.code).not.toContain('@slang-source');
    });
    it('preserves native-only resource retention and reflection', () => {
      const result = transpileSlang(
        'import resources; [shader("compute")] [numthreads(1,1,1)] void main() { writeNative(); }',
        {...NATIVE_RESOURCES, target, omitUnusedResources: true}
      );
      expect(
        result.reflection.bindings.map(binding => [binding.shaderName, binding.visibility])
      ).toEqual([
        ['settings', 4],
        ['values', 4]
      ]);
      expect(result.code).toContain(target === 'wgsl' ? 'values[0]' : 'values.data[0]');
    });
    it('preserves public texture declarations and application-managed ES bindings', () => {
      const options = {
        target,
        modules: {
          texture: {
            declarations: 'Texture2D<float4> colorTexture : register(t3); float4 sampleNative();',
            wgsl: 'fn sampleNative() -> vec4<f32> { return textureLoad(colorTexture, vec2<i32>(0), 0); }',
            glsl: 'vec4 sampleNative() { return texelFetch(colorTexture, ivec2(0), 0); }'
          }
        }
      } as const;
      const result = transpileSlang(
        'import texture; [shader("fragment")] float4 main() : SV_Target { return sampleNative(); }',
        options
      );
      expect(result.reflection.bindings[0]).toMatchObject({
        shaderName: 'colorTexture',
        binding: 3,
        visibility: 2
      });
      if (target === 'glsl') {
        expect(result.code).toContain('uniform sampler2D colorTexture;');
        expect(result.code).not.toContain('layout(binding');
        expect(
          transpileSlang('import texture; ' + MAIN, {...options, glslVersion: '450'}).code
        ).toContain('layout(binding = 3) uniform sampler2D colorTexture;');
      }
    });
    it.each([
      ['import absent;', {}, 'Missing registry module absent'],
      ['import "file.slang";', {}, 'file imports are unsupported'],
      [
        'import first;',
        {first: 'import second;', second: 'import first;'},
        'Import cycle: first -> second -> first'
      ],
      ['import first;', {first: 'import absent;'}, 'Missing registry module absent'],
      ['import native;', {native: {declarations: 'float helper();'}}, 'has no'],
      [
        'import first; import second;',
        {first: 'float helper() { return 1; }', second: 'float helper() { return 2; }'},
        'Duplicate'
      ],
      [
        'import native;',
        {native: {declarations: 'float helper() { return 1; }', wgsl: '', glsl: ''}},
        'function prototypes'
      ],
      [
        'import native;',
        {
          native: {declarations: 'float helper();', imports: 'float unknown();', wgsl: '', glsl: ''}
        },
        'explicitly exported'
      ]
    ])('rejects invalid imports: %s', (source, modules, message) => {
      expect(() => transpileSlang(source + MAIN, {target, modules})).toThrow(message);
    });
    it('checks calls against native Slang declarations', () => {
      expect(() =>
        transpileSlang(
          'import bridge; float shade(float value) { return value; } [shader("fragment")] float4 main() : SV_Target { return float4(applyNative(1)); }',
          {...MODULE_OPTIONS, target}
        )
      ).toThrow();
      expect(() =>
        transpileSlang(MODULE_RENDER, {
          ...MODULE_OPTIONS,
          target,
          entryPoint: 'fragmentMain',
          modules: {
            ...MODULE_OPTIONS.modules,
            bridge: {...MODULE_OPTIONS.modules.bridge, imports: 'float2 shadePublic(float value);'}
          }
        })
      ).toThrow('incompatible Slang signature');
    });
    it('reports imported semantic failures at the original unit and line', () => {
      try {
        transpileSlang(
          'import broken; [shader("fragment")] float4 main() : SV_Target { return float4(helper()); }',
          {target, modules: {broken: '// imported\nfloat helper() { return missing; }'}}
        );
        throw new Error('Expected error');
      } catch (error) {
        expect(error).toBeInstanceOf(SlangTranspileError);
        expect((error as SlangTranspileError).diagnostics[0]).toMatchObject({
          sourceName: 'broken',
          line: 2
        });
      }
    });
    it('rejects invalid exports and opaque contracts with private types', () => {
      expect(() => transpileSlang(MAIN, {target, exports: {missing: 'publicName'}})).toThrow(
        'Unknown Slang export'
      );
      expect(() =>
        transpileSlang(
          'struct Private { float value; }; Private helper(Private value) { return value; } ' +
            MAIN,
          {target, exports: {helper: 'publicHelper'}}
        )
      ).toThrow('exported type Private');
      expect(() =>
        transpileSlang(
          'float helper(float value) { return value; } float2 helper(float2 value) { return value; } ' +
            MAIN,
          {target, exports: {helper: 'publicHelper'}}
        )
      ).toThrow('overload');
      expect(() => transpileSlang(MAIN, {target, exports: {main: '_slang_name'}})).toThrow(
        'Public shader names'
      );
      expect(() =>
        transpileSlang('float helper() { return 1; } ' + MAIN, {
          target,
          exports: {helper: 'same', main: 'same'}
        })
      ).toThrow('Duplicate public shader name');
    });
    it('detects declared native callback cycles', () => {
      expect(() =>
        transpileSlang('import native; float helper() { return nativeHelper(); } ' + MAIN, {
          target,
          exports: {helper: 'publicHelper'},
          modules: {
            native: {
              declarations: 'float nativeHelper();',
              imports: 'float publicHelper();',
              wgsl: '',
              glsl: ''
            }
          }
        })
      ).toThrow('Recursive');
    });
    it('supports dotted names and ignores unimported registry entries', () => {
      const result = transpileSlang('import math.scale; ' + MAIN, {
        target,
        modules: {'math.scale': 'float helper() { return 1; }', unused: 'invalid syntax!'}
      });
      expect(result.code).not.toContain('invalid');
    });
  });
}
it('slang#WGSL program deduplicates shared native implementations across render entry points', () => {
  const result = transpileSlangWGSL(MODULE_RENDER, MODULE_OPTIONS);
  expect(result.code.match(/fn applyNativePublic\(/g)).toHaveLength(1);
  expect(result.code.match(/fn shadePublic\(/g)).toHaveLength(1);
  expect(Object.keys(result.entryPoints)).toEqual(['vertexMain', 'fragmentMain']);
  expect(result.exports?.shade.shaderName).toBe('shadePublic');
});
it('slang#imported compute helpers preserve explicit/default entry names', () => {
  for (const entryPoint of [undefined, 'main']) {
    const result = transpileSlang(MODULE_COMPUTE, {...MODULE_OPTIONS, target: 'wgsl', entryPoint});
    expect(result.entryPoint).toBe('_slang_entry_main');
  }
});

it.each([
  'glsl',
  'wgsl'
] as const)('slang#application registration resolves imports in reusable ShaderModule code on %s', target => {
  const assembler = target === 'wgsl' ? new WGSLShaderAssembler() : new GLSLShaderAssembler();
  assembler.addShaderTranspiler(
    createSlangTranspiler({modules: {library: 'float getValue() { return 0.5; }'}})
  );
  const source =
    '[shader("vertex")] float4 vertexMain() : SV_Position { return float4(0,0,0,1); } [shader("fragment")] float4 fragmentMain() : SV_Target { return float4(moduleValue()); }';
  const props = {
    platformInfo: {
      type: target === 'wgsl' ? 'webgpu' : 'webgl',
      gpu: 'test',
      shaderLanguage: target,
      shaderLanguageVersion: 300,
      features: new Set<string>()
    },
    sourceLanguage: 'slang',
    source,
    vs: source,
    fs: source,
    vertexEntryPoint: 'vertexMain',
    fragmentEntryPoint: 'fragmentMain',
    modules: [
      {
        name: 'reusable',
        sourceLanguage: 'slang',
        source: 'import library; float moduleValue() { return getValue(); }'
      }
    ]
  } as const;
  const code =
    assembler instanceof WGSLShaderAssembler
      ? assembler.assembleWGSLShader(props).source
      : assembler.assembleGLSLShaderPair(props).fs;
  expect(code).toContain('_slang_function_getValue');
});
it('slang#bounded registry resolution rejects depth and ignores inherited properties', () => {
  const modules: Record<string, string> = {};
  for (let index = 0; index < 130; index++)
    modules['module' + index] = 'import module' + (index + 1) + ';';
  expect(() => transpileSlang('import module0; ' + MAIN, {target: 'wgsl', modules})).toThrow(
    'depth exceeds'
  );
  expect(() =>
    transpileSlang('import inherited; ' + MAIN, {
      target: 'wgsl',
      modules: Object.create({inherited: ''})
    })
  ).toThrow('Missing registry');
  for (const source of [
    'import',
    'import broken',
    'import broken.',
    'void helper() { import broken; }'
  ]) {
    expect(() => transpileSlang(source, {target: 'wgsl'})).toThrow(SlangTranspileError);
  }
});
