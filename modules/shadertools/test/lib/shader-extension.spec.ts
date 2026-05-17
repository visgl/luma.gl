// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  mergeShaderExtensionModules,
  resolveShaderExtensions,
  ShaderAssembler,
  type PlatformInfo,
  type ShaderModule
} from '@luma.gl/shadertools';

const SHARED_MODULE: ShaderModule = {name: 'shared-extension-module'};
const WGSL_MODULE: ShaderModule = {name: 'wgsl-extension-module'};
const EXPLICIT_MODULE: ShaderModule = {name: 'explicit-module'};
const DUPLICATE_EXTENSION_MODULE: ShaderModule = {name: 'explicit-module'};

const WGSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const WGSL_SOURCE = /* wgsl */ `\
@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  return color;
}
`;

test('ShaderExtension#resolve shared and backend contributions', t => {
  const resolved = resolveShaderExtensions(
    [
      {
        name: 'backend-aware-extension',
        modules: [SHARED_MODULE],
        defines: {
          COMMON: true,
          OVERRIDDEN: false
        },
        injections: [{target: 'fs:#decl', injection: 'fn sharedExtension() {}'}],
        wgsl: {
          modules: [WGSL_MODULE],
          defines: {
            OVERRIDDEN: true,
            WGSL_ONLY: true
          },
          injections: [
            {
              target: 'fs:#decl',
              injection: 'fn wgslExtension() {}',
              order: 10
            }
          ]
        }
      }
    ],
    'wgsl'
  );

  t.deepEqual(
    resolved.modules.map(module => module.name),
    ['shared-extension-module', 'wgsl-extension-module'],
    'shared and WGSL modules are combined'
  );
  t.deepEqual(
    resolved.defines,
    {COMMON: true, OVERRIDDEN: true, WGSL_ONLY: true},
    'backend define overrides shared extension define'
  );
  t.deepEqual(
    resolved.injections['fs:#decl'].map(injection => injection.injection),
    ['fn sharedExtension() {}', 'fn wgslExtension() {}'],
    'shared and backend injections retain order'
  );
  t.equal(resolved.injections['fs:#decl'][1].order, 10, 'explicit order is preserved');
  t.end();
});

test('ShaderExtension#rejects raw replacement targets', t => {
  t.throws(
    () =>
      resolveShaderExtensions(
        [
          {
            name: 'invalid-target',
            injections: [{target: 'fragmentColor = vec4(1.0);' as any, injection: 'ignored'}]
          }
        ],
        'glsl'
      ),
    /must be a named shader anchor or hook/,
    'raw replacement targets are rejected'
  );
  t.end();
});

test('ShaderExtension#explicit modules win duplicate names', t => {
  const modules = mergeShaderExtensionModules(
    [EXPLICIT_MODULE],
    [DUPLICATE_EXTENSION_MODULE, SHARED_MODULE]
  );

  t.equal(modules.length, 2, 'duplicate extension module is skipped');
  t.equal(modules[0], EXPLICIT_MODULE, 'explicit module instance is preserved');
  t.equal(modules[1], SHARED_MODULE, 'new extension module is appended');
  t.end();
});

test('ShaderExtension#WGSL main injections land in stage bodies', t => {
  const shaderAssembler = new ShaderAssembler();
  const resolved = resolveShaderExtensions(
    [
      {
        name: 'wgsl-main-injections',
        wgsl: {
          injections: [
            {target: 'vs:#main-start', injection: 'let extensionVertexStart = 1u;'},
            {target: 'fs:#main-end', injection: 'let extensionFragmentEnd = 2u;'}
          ]
        }
      }
    ],
    'wgsl'
  );

  const assembled = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_SOURCE,
    extensionInjections: resolved.injections
  });

  t.ok(
    assembled.source.includes('let extensionVertexStart = 1u;'),
    'vertex-stage start injection is emitted'
  );
  t.ok(
    assembled.source.includes('let extensionFragmentEnd = 2u;'),
    'fragment-stage end injection is emitted'
  );
  t.ok(
    assembled.source.indexOf('let extensionFragmentEnd = 2u;') < assembled.source.lastIndexOf('}'),
    'fragment-stage end injection lands before the stage closing brace'
  );
  t.end();
});

test('ShaderExtension#WGSL fragment declarations enter unified shader source', t => {
  const shaderAssembler = new ShaderAssembler();
  const resolved = resolveShaderExtensions(
    [
      {
        name: 'wgsl-fragment-declaration',
        wgsl: {
          injections: [
            {
              target: 'fs:#decl',
              injection: 'fn extensionGetColor() -> vec4<f32> { return vec4<f32>(1.0); }'
            }
          ]
        }
      }
    ],
    'wgsl'
  );

  const assembled = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_SOURCE.replace(
      'var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);',
      'var color = extensionGetColor();'
    ),
    extensionInjections: resolved.injections
  });

  t.ok(
    assembled.source.includes('fn extensionGetColor() -> vec4<f32>'),
    'fragment declaration injection is emitted into unified WGSL source'
  );
  t.end();
});
