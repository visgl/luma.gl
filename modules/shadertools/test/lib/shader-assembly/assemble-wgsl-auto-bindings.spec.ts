// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {ShaderAssembler, type PlatformInfo, type ShaderModule} from '@luma.gl/shadertools';
import {getShaderLayoutFromWGSL} from '@luma.gl/webgpu';
import {skin} from '../../../src/modules/engine/skin/skin';
import {ibl} from '../../../src/modules/lighting/ibl/ibl';
import {lighting} from '../../../src/modules/lighting/lights/lighting';
import {dirlight} from '../../../src/modules/lighting/no-material/dirlight';
import {pbrProjection} from '../../../src/modules/lighting/pbr-material/pbr-projection';

const PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const APP_WGSL = /* wgsl */ `\
struct AppFrameUniforms {
  scale: f32
};

@group(0) @binding(0) var<uniform> appFrame: AppFrameUniforms;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let x = f32(vertexIndex) * appFrame.scale;
  return vec4<f32>(x, 0.0, 0.0, 1.0);
}
`;

const GROUP_2_AUTO_MODULE: ShaderModule = {
  name: 'group2AutoModule',
  bindingLayout: [
    {name: 'group2First', group: 2},
    {name: 'group2Second', group: 2}
  ],
  source: /* wgsl */ `\
struct Group2FirstUniforms {
  value: f32
};

struct Group2SecondUniforms {
  value: f32
};

@group(2) @binding(auto) var<uniform> group2First: Group2FirstUniforms;
@group(2) @binding(auto) var<uniform> group2Second: Group2SecondUniforms;
`
};

const GROUP_0_DEPENDENCY_A: ShaderModule = {
  name: 'group0DependencyA',
  bindingLayout: [{name: 'group0DependencyA', group: 0}],
  source: /* wgsl */ `\
struct Group0DependencyAUniforms {
  value: f32
};

@group(0) @binding(auto) var<uniform> group0DependencyA: Group0DependencyAUniforms;
`
};

const GROUP_0_DEPENDENCY_B: ShaderModule = {
  name: 'group0DependencyB',
  bindingLayout: [{name: 'group0DependencyB', group: 0}],
  dependencies: [GROUP_0_DEPENDENCY_A],
  source: /* wgsl */ `\
struct Group0DependencyBUniforms {
  value: f32
};

@group(0) @binding(auto) var<uniform> group0DependencyB: Group0DependencyBUniforms;
`
};

const INVALID_GROUP_0_MODULE: ShaderModule = {
  name: 'invalidGroup0Module',
  bindingLayout: [{name: 'invalidGroup0Binding', group: 0}],
  source: /* wgsl */ `\
struct InvalidGroup0Uniforms {
  value: f32
};

@group(0) @binding(0) var<uniform> invalidGroup0Binding: InvalidGroup0Uniforms;
`
};

const DUPLICATE_GROUP_2_MODULE_A: ShaderModule = {
  name: 'duplicateGroup2ModuleA',
  bindingLayout: [{name: 'duplicateGroup2A', group: 2}],
  source: /* wgsl */ `\
struct DuplicateGroup2AUniforms {
  value: f32
};

@group(2) @binding(0) var<uniform> duplicateGroup2A: DuplicateGroup2AUniforms;
`
};

const DUPLICATE_GROUP_2_MODULE_B: ShaderModule = {
  name: 'duplicateGroup2ModuleB',
  bindingLayout: [{name: 'duplicateGroup2B', group: 2}],
  source: /* wgsl */ `\
struct DuplicateGroup2BUniforms {
  value: f32
};

@group(2) @binding(0) var<uniform> duplicateGroup2B: DuplicateGroup2BUniforms;
`
};

const BINDING_FIRST_AUTO_MODULE: ShaderModule = {
  name: 'bindingFirstAutoModule',
  bindingLayout: [{name: 'bindingFirstAuto', group: 2}],
  source: /* wgsl */ `\
struct BindingFirstAutoUniforms {
  value: f32
};

@binding(auto) @group(2) var<uniform> bindingFirstAuto: BindingFirstAutoUniforms;
`
};

const GROUP_2_REGISTRY_A: ShaderModule = {
  name: 'group2RegistryA',
  bindingLayout: [{name: 'group2RegistryA', group: 2}],
  source: /* wgsl */ `\
struct Group2RegistryAUniforms {
  value: f32
};

@group(2) @binding(auto) var<uniform> group2RegistryA: Group2RegistryAUniforms;
`
};

const GROUP_2_REGISTRY_B: ShaderModule = {
  name: 'group2RegistryB',
  bindingLayout: [{name: 'group2RegistryB', group: 2}],
  source: /* wgsl */ `\
struct Group2RegistryBUniforms {
  value: f32
};

@group(2) @binding(auto) var<uniform> group2RegistryB: Group2RegistryBUniforms;
`
};

test('assembleWGSLShader#relocates stock group 0 auto bindings', t => {
  const shaderAssembler = new ShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [pbrProjection, skin]
  });
  const assembledSource = assembledShader.source;

  t.ok(
    assembledSource.includes('@group(0) @binding(100) var<uniform> pbrProjection'),
    'pbrProjection relocated to group 0 binding 100'
  );
  t.ok(
    assembledSource.includes('// pbrProjection.pbrProjection -> @group(0) @binding(100)'),
    'assembled WGSL includes relocation summary for pbrProjection'
  );
  t.ok(
    assembledSource.includes('@group(0) @binding(101) var<uniform> skin'),
    'skin relocated to group 0 binding 101'
  );
  t.ok(
    assembledSource.includes('// skin.skin -> @group(0) @binding(101)'),
    'assembled WGSL includes relocation summary for skin'
  );

  const shaderLayout = getShaderLayoutFromWGSL(assembledSource);
  t.equal(
    shaderLayout.bindings.find(binding => binding.name === 'appFrame')?.location,
    0,
    'app binding kept at location 0'
  );
  t.equal(
    shaderLayout.bindings.find(binding => binding.name === 'pbrProjection')?.location,
    100,
    'pbrProjection reflected at relocated location'
  );
  t.equal(
    shaderLayout.bindings.find(binding => binding.name === 'skin')?.location,
    101,
    'skin reflected at relocated location'
  );
  t.deepEqual(
    assembledShader.bindingAssignments,
    [
      {moduleName: 'pbrProjection', name: 'pbrProjection', group: 0, location: 100},
      {moduleName: 'skin', name: 'skin', group: 0, location: 101}
    ],
    'binding assignments are returned for relocated module bindings'
  );
  t.deepEqual(
    assembledShader.bindingTable.map(row => ({
      name: row.name,
      group: row.group,
      binding: row.binding,
      kind: row.kind,
      owner: row.owner,
      moduleName: row.moduleName
    })),
    [
      {
        name: 'appFrame',
        group: 0,
        binding: 0,
        kind: 'uniform',
        owner: 'application',
        moduleName: undefined
      },
      {
        name: 'pbrProjection',
        group: 0,
        binding: 100,
        kind: 'uniform',
        owner: 'module',
        moduleName: 'pbrProjection'
      },
      {
        name: 'skin',
        group: 0,
        binding: 101,
        kind: 'uniform',
        owner: 'module',
        moduleName: 'skin'
      }
    ],
    'binding table includes both application and relocated module bindings'
  );

  t.end();
});

test('assembleWGSLShader#allocates multiple auto bindings in one module', t => {
  const shaderAssembler = new ShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [GROUP_2_AUTO_MODULE]
  });
  const assembledSource = assembledShader.source;

  t.ok(
    assembledSource.includes('@group(2) @binding(0) var<uniform> group2First'),
    'first group 2 auto binding assigned location 0'
  );
  t.ok(
    assembledSource.includes('@group(2) @binding(1) var<uniform> group2Second'),
    'second group 2 auto binding assigned location 1'
  );
  t.deepEqual(
    assembledShader.bindingTable
      .filter(row => row.group === 2)
      .map(row => ({name: row.name, binding: row.binding, owner: row.owner})),
    [
      {name: 'group2First', binding: 0, owner: 'module'},
      {name: 'group2Second', binding: 1, owner: 'module'}
    ],
    'binding table captures deterministic module allocation order'
  );

  t.end();
});

test('assembleWGSLShader#supports binding-first module auto declarations', t => {
  const shaderAssembler = new ShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [BINDING_FIRST_AUTO_MODULE]
  });

  t.ok(
    assembledShader.source.includes('@binding(0) @group(2) var<uniform> bindingFirstAuto'),
    'binding-first module declaration remains supported'
  );
  t.equal(
    assembledShader.bindingTable.find(row => row.name === 'bindingFirstAuto')?.binding,
    0,
    'binding table reflects binding-first relocation result'
  );

  t.end();
});

test('assembleWGSLShader#relocates stock group 2 auto bindings in deterministic order', t => {
  const shaderAssembler = new ShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    defines: {USE_IBL: true},
    modules: [lighting, dirlight, ibl]
  });
  const assembledSource = assembledShader.source;

  t.ok(
    assembledSource.includes('@group(2) @binding(0) var<uniform> lighting'),
    'lighting allocated first in group 2'
  );
  t.ok(
    assembledSource.includes('@group(2) @binding(16) var<uniform> dirlight'),
    'dirlight allocated at its hinted group 2 slot'
  );
  t.ok(
    assembledSource.includes('@group(2) @binding(32) var pbr_diffuseEnvSampler'),
    'ibl diffuse texture allocated at its hinted group 2 slot'
  );
  t.ok(
    assembledSource.includes('@group(2) @binding(37) var pbr_brdfLUTSampler'),
    'ibl bindings remain contiguous within the hinted range'
  );
  t.ok(
    assembledSource.includes('// lighting.lighting -> @group(2) @binding(0)'),
    'assembled WGSL includes relocation summary for lighting'
  );
  t.ok(
    assembledSource.includes('// dirlight.dirlight -> @group(2) @binding(16)'),
    'assembled WGSL includes relocation summary for dirlight'
  );
  t.ok(
    assembledSource.includes('// ibl.pbr_diffuseEnvSampler -> @group(2) @binding(32)'),
    'assembled WGSL includes relocation summary for ibl'
  );

  const shaderLayout = getShaderLayoutFromWGSL(assembledSource);
  t.equal(
    shaderLayout.bindings.find(binding => binding.name === 'lighting')?.location,
    0,
    'lighting reflected at location 0'
  );
  t.equal(
    shaderLayout.bindings.find(binding => binding.name === 'dirlight')?.location,
    16,
    'dirlight reflected at location 16'
  );
  t.equal(
    shaderLayout.bindings.find(binding => binding.name === 'pbr_diffuseEnvSampler')?.location,
    32,
    'ibl diffuse texture reflected at relocated location'
  );
  t.equal(
    shaderLayout.bindings.find(binding => binding.name === 'pbr_brdfLUTSampler')?.location,
    37,
    'ibl sampler reflected at relocated location'
  );
  t.deepEqual(
    assembledShader.bindingTable
      .filter(row => row.group === 2)
      .map(row => ({
        name: row.name,
        binding: row.binding,
        owner: row.owner,
        moduleName: row.moduleName
      })),
    [
      {name: 'lighting', binding: 0, owner: 'module', moduleName: 'lighting'},
      {name: 'dirlight', binding: 16, owner: 'module', moduleName: 'dirlight'},
      {name: 'pbr_diffuseEnvSampler', binding: 32, owner: 'module', moduleName: 'ibl'},
      {name: 'pbr_diffuseEnvSamplerSampler', binding: 33, owner: 'module', moduleName: 'ibl'},
      {name: 'pbr_specularEnvSampler', binding: 34, owner: 'module', moduleName: 'ibl'},
      {name: 'pbr_specularEnvSamplerSampler', binding: 35, owner: 'module', moduleName: 'ibl'},
      {name: 'pbr_brdfLUT', binding: 36, owner: 'module', moduleName: 'ibl'},
      {name: 'pbr_brdfLUTSampler', binding: 37, owner: 'module', moduleName: 'ibl'}
    ],
    'binding table reports stable stock group 2 layout'
  );

  t.end();
});

test('assembleWGSLShader#allocates group 0 auto bindings in dependency order', t => {
  const shaderAssembler = new ShaderAssembler();
  const assembledSource = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [GROUP_0_DEPENDENCY_B]
  }).source;

  t.ok(
    assembledSource.includes('@group(0) @binding(100) var<uniform> group0DependencyA'),
    'dependency module allocated first'
  );
  t.ok(
    assembledSource.includes('@group(0) @binding(101) var<uniform> group0DependencyB'),
    'dependent module allocated second'
  );

  t.end();
});

test('assembleWGSLShader#keeps module auto allocations stable within one assembler', t => {
  const shaderAssembler = new ShaderAssembler();

  const firstShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [GROUP_2_REGISTRY_A]
  });
  const secondShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [GROUP_2_REGISTRY_B, GROUP_2_REGISTRY_A]
  });

  t.equal(
    firstShader.bindingTable.find(row => row.name === 'group2RegistryA')?.binding,
    0,
    'first assembly allocates the initial slot'
  );
  t.equal(
    secondShader.bindingTable.find(row => row.name === 'group2RegistryA')?.binding,
    0,
    'same module binding keeps its slot in a later shader assembled by the same assembler'
  );
  t.equal(
    secondShader.bindingTable.find(row => row.name === 'group2RegistryB')?.binding,
    1,
    'new module binding is allocated around the existing registry assignment'
  );

  t.end();
});

test('assembleWGSLShader#rejects application group 0 bindings above reserved range', t => {
  const shaderAssembler = new ShaderAssembler();

  t.throws(
    () =>
      shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: /* wgsl */ `\
struct ReservedUniforms {
  value: f32
};

@group(0) @binding(100) var<uniform> appReserved: ReservedUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}
`,
        modules: []
      }),
    /Application binding "appReserved" in group 0 uses reserved binding 100/,
    'application group 0 binding 100 rejected'
  );

  t.end();
});

test('assembleWGSLShader#rejects explicit module group 0 bindings below reserved range', t => {
  const shaderAssembler = new ShaderAssembler();

  t.throws(
    () =>
      shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: APP_WGSL,
        modules: [INVALID_GROUP_0_MODULE]
      }),
    /Module "invalidGroup0Module" binding "invalidGroup0Binding" in group 0 uses reserved application binding 0/,
    'module explicit group 0 binding below 100 rejected'
  );

  t.end();
});

test('assembleWGSLShader#rejects duplicate explicit module bindings', t => {
  const shaderAssembler = new ShaderAssembler();

  t.throws(
    () =>
      shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: APP_WGSL,
        modules: [DUPLICATE_GROUP_2_MODULE_A, DUPLICATE_GROUP_2_MODULE_B]
      }),
    /Duplicate WGSL binding assignment for module "duplicateGroup2ModuleB" binding "duplicateGroup2B": group 2, binding 0/,
    'duplicate explicit module bindings rejected'
  );

  t.end();
});

test('assembleWGSLShader#rejects unresolved auto bindings in app WGSL', t => {
  const shaderAssembler = new ShaderAssembler();

  t.throws(
    () =>
      shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: /* wgsl */ `\
struct AppAutoUniforms {
  value: f32
};

@group(0) @binding(auto) var<uniform> appAuto: AppAutoUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}
`,
        modules: []
      }),
    /Unresolved @binding\(auto\) remained in assembled WGSL source/,
    'application WGSL cannot use @binding(auto) in v1'
  );

  t.end();
});
