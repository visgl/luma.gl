// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {WGSLShaderAssembler, type PlatformInfo, type ShaderModule} from '@luma.gl/shadertools';
import {skin} from '../../../src/modules/engine/skin/skin';
import {ibl} from '../../../src/modules/lighting/ibl/ibl';
import {lighting} from '../../../src/modules/lighting/lights/lighting';
import {dirlight} from '../../../src/modules/lighting/no-material/dirlight';
import {pbrProjection} from '../../../src/modules/lighting/pbr-material/pbr-projection';
import {fp32} from '../../../src/modules/math/fp32/fp32';
import {fp64arithmetic} from '../../../src/modules/math/fp64/fp64';

const PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const FP64_INTEGER_MARKER = 'fn fp64_two_sum_integer_bits';
const FP64_HYBRID_MARKER = 'let crossTerms = prevent_fp64_optimization';
const FP64_CLASSIC_MARKER = 'let splitValue = prevent_fp64_optimization';
const FP64_PREDICATE_MARKERS = ['fn twoSum', 'fn twoSub', 'fn mul_fp64', 'fn sub_fp64'] as const;
const FP64_GENERIC_VALUE_MARKERS = [
  'fn fp64_add_raw_f32_bits',
  'fn normalize_fp64',
  'fn is_nan_fp64',
  'fn is_finite_fp64',
  'fn sign_fp64',
  'fn compare_fp64'
] as const;
const FP64_RAW_MARKERS = ['fn fp64_decode_bits', 'fn sub_fp64u32_to_fp64'] as const;
const FP64_DISTANCE_MARKERS = [
  'fn fp64_scale_fp64_integer',
  'fn div_fp64',
  'fn sqrt_fp64'
] as const;

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

it('assembleWGSLShader#selects precise fp32 tan implementation', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assemble = (gpu: string, defines?: Record<string, boolean>) =>
    shaderAssembler.assembleWGSLShader({
      platformInfo: {...PLATFORM_INFO, gpu},
      source: APP_WGSL,
      modules: [fp32],
      defines
    }).source;

  const appleSource = assemble('apple');
  expect(
    Boolean(appleSource.includes('fn tan_taylor_fp32')),
    'Apple WebGPU selects Taylor tan'
  ).toBe(true);
  expect(Boolean(appleSource.includes('return tan(a);')), 'Apple WebGPU omits native tan').toBe(
    false
  );

  const defaultSource = assemble('test-gpu');
  expect(
    Boolean(defaultSource.includes('fn tan_taylor_fp32')),
    'unknown WebGPU adapters select Taylor tan'
  ).toBe(true);

  const nvidiaSource = assemble('nvidia');
  expect(
    Boolean(nvidiaSource.includes('fn tan_taylor_fp32')),
    'NVIDIA WebGPU omits Taylor tan'
  ).toBe(false);
  expect(Boolean(nvidiaSource.includes('return tan(a);')), 'NVIDIA WebGPU selects native tan').toBe(
    true
  );

  const forcedSource = assemble('nvidia', {LUMA_FP32_TAN_PRECISION_WORKAROUND: true});
  expect(Boolean(forcedSource.includes('fn tan_taylor_fp32')), 'callers can force Taylor tan').toBe(
    true
  );

  const disabledSource = assemble('apple', {LUMA_FP32_TAN_PRECISION_WORKAROUND: false});
  expect(Boolean(disabledSource.includes('return tan(a);')), 'callers can disable Taylor tan').toBe(
    true
  );
  expect(
    Boolean(disabledSource.includes('fn tan_taylor_fp32')),
    'false override removes Taylor tan'
  ).toBe(false);

  void 0;
});

it('assembleWGSLShader#selects optimizer-independent fp64 arithmetic', () => {
  const shaderAssembler = new WGSLShaderAssembler();

  const appleSource = shaderAssembler.assembleWGSLShader({
    platformInfo: {...PLATFORM_INFO, gpu: 'apple'},
    source: APP_WGSL,
    modules: [fp64arithmetic]
  }).source;
  expect(
    Boolean(appleSource.includes(FP64_INTEGER_MARKER)),
    'Apple WebGPU selects integer arithmetic'
  ).toBe(true);
  expect(
    Boolean(appleSource.includes(FP64_CLASSIC_MARKER)),
    'Apple WebGPU omits classic arithmetic'
  ).toBe(false);

  const defaultSource = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [fp64arithmetic]
  }).source;
  expect(
    Boolean(defaultSource.includes(FP64_CLASSIC_MARKER)),
    'other WebGPU adapters retain classic arithmetic'
  ).toBe(true);
  expect(
    Boolean(defaultSource.includes(FP64_INTEGER_MARKER)),
    'integer arithmetic is not enabled globally'
  ).toBe(false);

  const forcedSource = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [fp64arithmetic],
    defines: {LUMA_FP64_INTEGER_ARITHMETIC: true}
  }).source;
  expect(
    Boolean(forcedSource.includes(FP64_INTEGER_MARKER)),
    'callers can force integer arithmetic'
  ).toBe(true);

  const disabledSource = shaderAssembler.assembleWGSLShader({
    platformInfo: {...PLATFORM_INFO, gpu: 'apple'},
    source: APP_WGSL,
    modules: [fp64arithmetic],
    defines: {LUMA_FP64_INTEGER_ARITHMETIC: false}
  }).source;
  expect(
    Boolean(disabledSource.includes(FP64_CLASSIC_MARKER)),
    'callers can disable the Apple default'
  ).toBe(true);
  expect(
    Boolean(disabledSource.includes(FP64_INTEGER_MARKER)),
    'false override removes integer arithmetic'
  ).toBe(false);

  const hybridSource = shaderAssembler.assembleWGSLShader({
    platformInfo: {...PLATFORM_INFO, gpu: 'apple'},
    source: APP_WGSL,
    modules: [fp64arithmetic],
    defines: {
      LUMA_FP64_HYBRID_ARITHMETIC: true,
      LUMA_FP64_INTEGER_ARITHMETIC: false
    }
  }).source;
  expect(
    Boolean(hybridSource.includes(FP64_INTEGER_MARKER)),
    'hybrid mode retains integer primitives'
  ).toBe(true);
  expect(
    Boolean(hybridSource.includes(FP64_HYBRID_MARKER)),
    'callers can select hybrid arithmetic'
  ).toBe(true);
  expect(
    Boolean(hybridSource.includes(FP64_CLASSIC_MARKER)),
    'hybrid mode omits classic arithmetic'
  ).toBe(false);

  void 0;
});

it('assembleWGSLShader#specializes integer fp64 predicate sources', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assemble = (defines: Record<string, boolean>) =>
    shaderAssembler.assembleWGSLShader({
      platformInfo: PLATFORM_INFO,
      source: APP_WGSL,
      modules: [fp64arithmetic],
      defines
    }).source;

  const fullSource = assemble({LUMA_FP64_INTEGER_ARITHMETIC: true});
  const predicateRawSource = assemble({
    LUMA_FP64_INTEGER_ARITHMETIC: true,
    LUMA_FP64_PREDICATE_ONLY: true
  });
  const predicateF32Source = assemble({
    LUMA_FP64_INTEGER_ARITHMETIC: true,
    LUMA_FP64_PREDICATE_ONLY: true,
    LUMA_FP64_F32_INPUT_ONLY: true
  });

  for (const marker of [
    ...FP64_PREDICATE_MARKERS,
    ...FP64_GENERIC_VALUE_MARKERS,
    ...FP64_RAW_MARKERS,
    ...FP64_DISTANCE_MARKERS
  ]) {
    expect(Boolean(fullSource.includes(marker)), `full source retains ${marker}`).toBe(true);
  }
  for (const marker of FP64_PREDICATE_MARKERS) {
    expect(
      Boolean(predicateF32Source.includes(marker)),
      `f32 predicate source retains ${marker}`
    ).toBe(true);
    expect(
      Boolean(predicateRawSource.includes(marker)),
      `raw predicate source retains ${marker}`
    ).toBe(true);
  }
  for (const marker of [...FP64_RAW_MARKERS, ...FP64_DISTANCE_MARKERS]) {
    expect(
      Boolean(predicateF32Source.includes(marker)),
      `f32 predicate source omits ${marker}`
    ).toBe(false);
  }
  for (const marker of FP64_RAW_MARKERS) {
    expect(
      Boolean(predicateRawSource.includes(marker)),
      `raw predicate source retains ${marker}`
    ).toBe(true);
  }
  for (const marker of FP64_DISTANCE_MARKERS) {
    expect(
      Boolean(predicateRawSource.includes(marker)),
      `raw predicate source omits ${marker}`
    ).toBe(false);
  }
  for (const marker of FP64_GENERIC_VALUE_MARKERS) {
    expect(
      Boolean(predicateF32Source.includes(marker)),
      `f32 predicate source omits ${marker}`
    ).toBe(false);
    expect(
      Boolean(predicateRawSource.includes(marker)),
      `raw predicate source omits ${marker}`
    ).toBe(false);
  }
  expect(
    Boolean(predicateRawSource.length < fullSource.length * 0.8),
    'raw predicate source stays at least 20% smaller than full fp64'
  ).toBe(true);
  expect(
    Boolean(predicateF32Source.length < fullSource.length * 0.5),
    'f32 predicate source stays at least 50% smaller than full fp64'
  ).toBe(true);

  void 0;
});

const APP_GROUP_0_AUTO_WGSL = /* wgsl */ `\
struct AppAutoUniforms {
  value: f32
};

@group(0) @binding(auto) var<uniform> appAuto: AppAutoUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appAuto.value, 0.0, 0.0, 1.0);
}
`;

const APP_VERTEX_STORAGE_LIMIT_WGSL = /* wgsl */ `\
struct AppAutoUniforms {
  value: f32
};

@group(0) @binding(auto) var<uniform> appAuto: AppAutoUniforms;

#if LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
@group(0) @binding(auto) var<storage, read> vertexStorage: array<f32>;
#endif

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appAuto.value, 0.0, 0.0, 1.0);
}
`;

const APP_MULTILINE_GROUP_0_AUTO_WGSL = /* wgsl */ `\
struct AppAutoUniforms {
  value: f32
};

@group(0) @binding(auto)
var<uniform> appAuto: AppAutoUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appAuto.value, 0.0, 0.0, 1.0);
}
`;

const APP_MULTIPLE_AUTO_WGSL = /* wgsl */ `\
struct AppFirstUniforms {
  value: f32
};

struct AppSecondUniforms {
  value: f32
};

@group(2) @binding(auto) var<uniform> appFirst: AppFirstUniforms;
@group(2) @binding(auto) var<uniform> appSecond: AppSecondUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appFirst.value + appSecond.value, 0.0, 0.0, 1.0);
}
`;

const APP_EXPLICIT_AND_AUTO_WGSL = /* wgsl */ `\
struct AppExplicitUniforms {
  value: f32
};

struct AppAutoUniforms {
  value: f32
};

@group(2) @binding(3) var<uniform> appExplicit: AppExplicitUniforms;
@group(2) @binding(auto) var<uniform> appAuto: AppAutoUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appExplicit.value + appAuto.value, 0.0, 0.0, 1.0);
}
`;

const APP_MULTILINE_EXPLICIT_AND_AUTO_WGSL = /* wgsl */ `\
struct AppExplicitUniforms {
  value: f32
};

struct AppAutoUniforms {
  value: f32
};

@group(2) @binding(0)
var<uniform> appExplicit: AppExplicitUniforms;

@group(2) @binding(auto)
var<uniform> appAuto: AppAutoUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appExplicit.value + appAuto.value, 0.0, 0.0, 1.0);
}
`;

const APP_GROUP_0_AUTO_WITH_MODULE_WGSL = /* wgsl */ `\
struct AppAutoUniforms {
  value: f32
};

@group(0) @binding(auto) var<uniform> appAuto: AppAutoUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appAuto.value, 0.0, 0.0, 1.0);
}
`;

const APP_GROUP_2_AUTO_WITH_MODULE_WGSL = /* wgsl */ `\
struct AppGroup2Uniforms {
  value: f32
};

@group(2) @binding(auto) var<uniform> appGroup2: AppGroup2Uniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appGroup2.value, 0.0, 0.0, 1.0);
}
`;

const UNSUPPORTED_APP_AUTO_WGSL = /* wgsl */ `\
struct AppUnsupportedUniforms {
  value: f32
};

@group(0) @binding(auto)
@size(16)
var<uniform> appUnsupported: AppUnsupportedUniforms;

@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
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

const CONDITIONAL_DEPTH_MODULE: ShaderModule = {
  name: 'conditionalDepthModule',
  source: /* wgsl */ `\
#if USE_DEPTH_SAMPLER
@group(0) @binding(auto) var conditionalDepth: texture_depth_2d;
@group(0) @binding(auto) var conditionalDepthSampler: sampler;
#else
@group(0) @binding(auto) var conditionalDepth: texture_2d<f32>;
#endif
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

const PERMUTED_GROUP_3_TEXTURE_MODULE: ShaderModule = {
  name: 'permutedGroup3TextureModule',
  bindingLayout: [
    {name: 'permutedMaterial', group: 3},
    {name: 'pbr_baseColorSampler', group: 3},
    {name: 'pbr_baseColorSamplerSampler', group: 3},
    {name: 'pbr_transmissionSampler', group: 3},
    {name: 'pbr_transmissionSamplerSampler', group: 3}
  ],
  source: /* wgsl */ `\
struct PermutedMaterialUniforms {
  value: f32
};

@group(3) @binding(0) var<uniform> permutedMaterial: PermutedMaterialUniforms;

#if HAS_BASECOLORMAP
@group(3) @binding(auto) var pbr_baseColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_baseColorSamplerSampler: sampler;
#endif

#if HAS_TRANSMISSIONMAP
@group(3) @binding(auto) var pbr_transmissionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_transmissionSamplerSampler: sampler;
#endif
`
};

const GROUP_3_EXPLICIT_REGISTRY_MODULE: ShaderModule = {
  name: 'group3ExplicitRegistryModule',
  bindingLayout: [{name: 'group3ExplicitRegistryBinding', group: 3}],
  source: /* wgsl */ `\
struct Group3ExplicitRegistryUniforms {
  value: f32
};

@group(3) @binding(1) var<uniform> group3ExplicitRegistryBinding: Group3ExplicitRegistryUniforms;
`
};

const MULTILINE_EXPLICIT_MODULE: ShaderModule = {
  name: 'multilineExplicitModule',
  bindingLayout: [{name: 'multilineExplicit', group: 2}],
  source: /* wgsl */ `\
struct MultilineExplicitUniforms {
  value: f32
};

@group(2) @binding(0)
var<uniform> multilineExplicit: MultilineExplicitUniforms;
`
};

const MULTILINE_AUTO_MODULE: ShaderModule = {
  name: 'multilineAutoModule',
  bindingLayout: [{name: 'multilineAuto', group: 2}],
  source: /* wgsl */ `\
struct MultilineAutoUniforms {
  value: f32
};

@group(2) @binding(auto)
var<uniform> multilineAuto: MultilineAutoUniforms;
`
};

const COMMENTED_PRIVATE_STATE_MODULE: ShaderModule = {
  name: 'commentedPrivateStateModule',
  source: /* wgsl */ `\
struct Geometry {
  position: vec4<f32>
};

// @group(0) @binding(1)
var<private> geometry: Geometry;
`
};

const COMMENTED_REAL_BINDING_MODULE: ShaderModule = {
  name: 'commentedRealBindingModule',
  bindingLayout: [{name: 'commentedRealBinding', group: 2}],
  source: /* wgsl */ `\
struct CommentedRealBindingUniforms {
  value: f32
};

// @group(0) @binding(1)
@group(2) @binding(auto) var<uniform> commentedRealBinding: CommentedRealBindingUniforms;
`
};

const BLOCK_COMMENTED_PRIVATE_STATE_MODULE: ShaderModule = {
  name: 'blockCommentedPrivateStateModule',
  source: /* wgsl */ `\
struct Geometry {
  position: vec4<f32>
};

/* @group(0) @binding(1) */
var<private> geometry: Geometry;
`
};

const COMMENTED_BINDING_TABLE_MODULE: ShaderModule = {
  name: 'commentedBindingTableModule',
  bindingLayout: [{name: 'visibleBinding', group: 2}],
  source: /* wgsl */ `\
struct VisibleBindingUniforms {
  value: f32
};

// @group(2) @binding(7) var<uniform> hiddenBinding: VisibleBindingUniforms;
@group(2) @binding(auto) var<uniform> visibleBinding: VisibleBindingUniforms;
`
};

const UNSUPPORTED_MODULE_AUTO_BINDING: ShaderModule = {
  name: 'unsupportedModuleAutoBinding',
  bindingLayout: [{name: 'supportedModuleBinding', group: 2}],
  source: /* wgsl */ `\
struct UnsupportedAutoBindingUniforms {
  value: f32
};

@group(2) @binding(auto) var<uniform> supportedModuleBinding: UnsupportedAutoBindingUniforms;
@group(2) @binding(auto)
@size(16)
var<uniform> unsupportedModuleBinding: UnsupportedAutoBindingUniforms;
`
};

it('assembleWGSLShader#relocates stock group 0 auto bindings', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [pbrProjection, skin]
  });
  const assembledSource = assembledShader.source;

  expect(
    Boolean(assembledSource.includes('@group(0) @binding(100) var<uniform> pbrProjection')),
    'pbrProjection relocated to group 0 binding 100'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('// pbrProjection.pbrProjection -> @group(0) @binding(100)')),
    'assembled WGSL includes relocation summary for pbrProjection'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('@group(0) @binding(101) var<uniform> skin')),
    'skin relocated to group 0 binding 101'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('// skin.skin -> @group(0) @binding(101)')),
    'assembled WGSL includes relocation summary for skin'
  ).toBe(true);

  const shaderLayout = assembledShader.shaderLayout;
  if (!shaderLayout) {
    expect(false, 'assembled shader has a scanned layout').toBe(true);
    void 0;
    return;
  }
  expect(
    shaderLayout.bindings.find(binding => binding.name === 'appFrame')?.location,
    'app binding kept at location 0'
  ).toBe(0);
  expect(
    shaderLayout.bindings.find(binding => binding.name === 'pbrProjection')?.location,
    'pbrProjection reflected at relocated location'
  ).toBe(100);
  expect(
    shaderLayout.bindings.find(binding => binding.name === 'skin')?.location,
    'skin reflected at relocated location'
  ).toBe(101);
  expect(
    assembledShader.bindingAssignments,
    'binding assignments are returned for relocated module bindings'
  ).toEqual([
    {moduleName: 'pbrProjection', name: 'pbrProjection', group: 0, location: 100},
    {moduleName: 'skin', name: 'skin', group: 0, location: 101}
  ]);
  expect(
    assembledShader.bindingTable.map(row => ({
      name: row.name,
      group: row.group,
      binding: row.binding,
      kind: row.kind,
      owner: row.owner,
      moduleName: row.moduleName
    })),
    'binding table includes both application and relocated module bindings'
  ).toEqual([
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
  ]);

  void 0;
});

it('assembleWGSLShader#allocates multiple auto bindings in one module', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [GROUP_2_AUTO_MODULE]
  });
  const assembledSource = assembledShader.source;

  expect(
    Boolean(assembledSource.includes('@group(2) @binding(0) var<uniform> group2First')),
    'first group 2 auto binding assigned location 0'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('@group(2) @binding(1) var<uniform> group2Second')),
    'second group 2 auto binding assigned location 1'
  ).toBe(true);
  expect(
    assembledShader.bindingTable
      .filter(row => row.group === 2)
      .map(row => ({name: row.name, binding: row.binding, owner: row.owner})),
    'binding table captures deterministic module allocation order'
  ).toEqual([
    {name: 'group2First', binding: 0, owner: 'module'},
    {name: 'group2Second', binding: 1, owner: 'module'}
  ]);

  void 0;
});

it('assembleWGSLShader#relocates application group 0 auto bindings from 0', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_GROUP_0_AUTO_WGSL,
    modules: []
  });

  expect(
    Boolean(assembledShader.source.includes('@group(0) @binding(0) var<uniform> appAuto')),
    'application group 0 auto binding assigned location 0'
  ).toBe(true);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'appAuto')?.binding,
    'binding table reflects relocated application group 0 binding'
  ).toBe(0);

  void 0;
});

it('assembleWGSLShader#relocates multiline application group 0 auto bindings', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_MULTILINE_GROUP_0_AUTO_WGSL,
    modules: []
  });

  expect(
    Boolean(assembledShader.source.includes('@group(0) @binding(0)\nvar<uniform> appAuto')),
    'multiline application auto binding preserves formatting and assigns location 0'
  ).toBe(true);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'appAuto')?.binding,
    'binding table reflects relocated multiline application binding'
  ).toBe(0);

  void 0;
});

it('assembleWGSLShader#allocates multiple application auto bindings in declaration order', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_MULTIPLE_AUTO_WGSL,
    modules: []
  });

  expect(
    Boolean(assembledShader.source.includes('@group(2) @binding(0) var<uniform> appFirst')),
    'first application auto binding assigned location 0'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('@group(2) @binding(1) var<uniform> appSecond')),
    'second application auto binding assigned location 1'
  ).toBe(true);

  void 0;
});

it('assembleWGSLShader#application auto bindings skip occupied slots', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_EXPLICIT_AND_AUTO_WGSL,
    modules: []
  });

  expect(
    Boolean(assembledShader.source.includes('@group(2) @binding(3) var<uniform> appExplicit')),
    'explicit application binding kept at location 3'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('@group(2) @binding(0) var<uniform> appAuto')),
    'application auto binding uses the first free slot'
  ).toBe(true);

  void 0;
});

it('assembleWGSLShader#multiline explicit application bindings reserve occupied slots', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_MULTILINE_EXPLICIT_AND_AUTO_WGSL,
    modules: []
  });

  expect(
    Boolean(assembledShader.source.includes('@group(2) @binding(0)\nvar<uniform> appExplicit')),
    'multiline explicit application binding is preserved'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('@group(2) @binding(1)\nvar<uniform> appAuto')),
    'application auto binding allocates around multiline explicit reservation'
  ).toBe(true);

  void 0;
});

it('assembleWGSLShader#supports binding-first module auto declarations', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [BINDING_FIRST_AUTO_MODULE]
  });

  expect(
    Boolean(assembledShader.source.includes('@binding(0) @group(2) var<uniform> bindingFirstAuto')),
    'binding-first module declaration remains supported'
  ).toBe(true);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'bindingFirstAuto')?.binding,
    'binding table reflects binding-first relocation result'
  ).toBe(0);

  void 0;
});

it('assembleWGSLShader#multiline module bindings are discovered for reservation and relocation', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [MULTILINE_EXPLICIT_MODULE, MULTILINE_AUTO_MODULE]
  });

  expect(
    Boolean(
      assembledShader.source.includes('@group(2) @binding(0)\nvar<uniform> multilineExplicit')
    ),
    'multiline explicit module binding is preserved'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('@group(2) @binding(1)\nvar<uniform> multilineAuto')),
    'multiline module auto binding allocates around explicit reservation'
  ).toBe(true);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'multilineAuto')?.binding,
    'binding table reflects relocated multiline module auto binding'
  ).toBe(1);

  void 0;
});

it('assembleWGSLShader#ignores line-comment binding annotations before private state', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [COMMENTED_PRIVATE_STATE_MODULE]
  });

  expect(
    assembledShader.bindingAssignments,
    'no module binding assignments are produced for commented private state'
  ).toEqual([]);
  expect(
    Boolean(assembledShader.bindingTable.find(row => row.name === 'geometry')),
    'binding table omits private state that only follows a commented annotation'
  ).toBe(false);

  void 0;
});

it('assembleWGSLShader#ignores commented binding annotations above real bindings', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [COMMENTED_REAL_BINDING_MODULE]
  });

  expect(
    Boolean(
      assembledShader.source.includes('@group(2) @binding(0) var<uniform> commentedRealBinding')
    ),
    'real binding keeps its actual declaration and auto-allocation'
  ).toBe(true);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'commentedRealBinding')?.binding,
    'binding table reflects the real binding instead of the commented annotation'
  ).toBe(0);

  void 0;
});

it('assembleWGSLShader#ignores block-comment binding annotations before private state', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [BLOCK_COMMENTED_PRIVATE_STATE_MODULE]
  });

  expect(
    assembledShader.bindingAssignments,
    'block-commented binding annotations do not create module bindings'
  ).toEqual([]);
  expect(
    Boolean(assembledShader.bindingTable.find(row => row.name === 'geometry')),
    'binding table omits private state following a block-commented annotation'
  ).toBe(false);

  void 0;
});

it('assembleWGSLShader#binding table excludes commented declarations', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [COMMENTED_BINDING_TABLE_MODULE]
  });

  expect(
    assembledShader.bindingTable.find(row => row.name === 'visibleBinding')?.binding,
    'visible binding is still discovered'
  ).toBe(0);
  expect(
    Boolean(assembledShader.bindingTable.find(row => row.name === 'hiddenBinding')),
    'binding table excludes commented-out declarations'
  ).toBe(false);

  void 0;
});

it('assembleWGSLShader#relocates stock group 2 auto bindings in deterministic order', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    defines: {USE_IBL: true},
    modules: [lighting, dirlight, ibl]
  });
  const assembledSource = assembledShader.source;

  expect(
    Boolean(assembledSource.includes('@group(2) @binding(0) var<uniform> lighting')),
    'lighting allocated first in group 2'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('@group(2) @binding(16) var<uniform> dirlight')),
    'dirlight allocated at its hinted group 2 slot'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('@group(2) @binding(32) var pbr_diffuseEnvSampler')),
    'ibl diffuse texture allocated at its hinted group 2 slot'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('@group(2) @binding(37) var pbr_brdfLUTSampler')),
    'ibl bindings remain contiguous within the hinted range'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('// lighting.lighting -> @group(2) @binding(0)')),
    'assembled WGSL includes relocation summary for lighting'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('// dirlight.dirlight -> @group(2) @binding(16)')),
    'assembled WGSL includes relocation summary for dirlight'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('// ibl.pbr_diffuseEnvSampler -> @group(2) @binding(32)')),
    'assembled WGSL includes relocation summary for ibl'
  ).toBe(true);

  const shaderLayout = assembledShader.shaderLayout;
  if (!shaderLayout) {
    expect(false, 'assembled shader has a scanned layout').toBe(true);
    void 0;
    return;
  }
  expect(
    shaderLayout.bindings.find(binding => binding.name === 'lighting')?.location,
    'lighting reflected at location 0'
  ).toBe(0);
  expect(
    shaderLayout.bindings.find(binding => binding.name === 'dirlight')?.location,
    'dirlight reflected at location 16'
  ).toBe(16);
  expect(
    shaderLayout.bindings.find(binding => binding.name === 'pbr_diffuseEnvSampler')?.location,
    'ibl diffuse texture reflected at relocated location'
  ).toBe(32);
  expect(
    shaderLayout.bindings.find(binding => binding.name === 'pbr_brdfLUTSampler')?.location,
    'ibl sampler reflected at relocated location'
  ).toBe(37);
  expect(
    assembledShader.bindingTable
      .filter(row => row.group === 2)
      .map(row => ({
        name: row.name,
        binding: row.binding,
        owner: row.owner,
        moduleName: row.moduleName
      })),
    'binding table reports stable stock group 2 layout'
  ).toEqual([
    {name: 'lighting', binding: 0, owner: 'module', moduleName: 'lighting'},
    {name: 'dirlight', binding: 16, owner: 'module', moduleName: 'dirlight'},
    {name: 'pbr_diffuseEnvSampler', binding: 32, owner: 'module', moduleName: 'ibl'},
    {name: 'pbr_diffuseEnvSamplerSampler', binding: 33, owner: 'module', moduleName: 'ibl'},
    {name: 'pbr_specularEnvSampler', binding: 34, owner: 'module', moduleName: 'ibl'},
    {name: 'pbr_specularEnvSamplerSampler', binding: 35, owner: 'module', moduleName: 'ibl'},
    {name: 'pbr_brdfLUT', binding: 36, owner: 'module', moduleName: 'ibl'},
    {name: 'pbr_brdfLUTSampler', binding: 37, owner: 'module', moduleName: 'ibl'}
  ]);

  void 0;
});

it('assembleWGSLShader#allocates group 0 auto bindings in dependency order', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledSource = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [GROUP_0_DEPENDENCY_B]
  }).source;

  expect(
    Boolean(assembledSource.includes('@group(0) @binding(100) var<uniform> group0DependencyA')),
    'dependency module allocated first'
  ).toBe(true);
  expect(
    Boolean(assembledSource.includes('@group(0) @binding(101) var<uniform> group0DependencyB')),
    'dependent module allocated second'
  ).toBe(true);

  void 0;
});

it('assembleWGSLShader#application group 0 auto bindings reserve low slots before modules', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_GROUP_0_AUTO_WITH_MODULE_WGSL,
    modules: [pbrProjection, skin]
  });

  expect(
    assembledShader.bindingTable.find(row => row.name === 'appAuto')?.binding,
    'application binding uses location 0'
  ).toBe(0);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'pbrProjection')?.binding,
    'module binding still starts at reserved group 0 module range'
  ).toBe(100);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'skin')?.binding,
    'subsequent module binding remains in reserved group 0 module range'
  ).toBe(101);

  void 0;
});

it('assembleWGSLShader#preprocesses platform limit conditionals before auto binding relocation', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: {
      ...PLATFORM_INFO,
      limits: {maxStorageBuffersInVertexStage: 0}
    },
    source: APP_VERTEX_STORAGE_LIMIT_WGSL
  });

  expect(
    Boolean(assembledShader.source.includes('vertexStorage')),
    'inactive vertex storage binding is stripped from assembled source'
  ).toBe(false);
  expect(
    assembledShader.bindingTable.map(row => row.name),
    'inactive vertex storage binding is not assigned a binding slot'
  ).toEqual(['appAuto']);

  const storageShader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: {
      ...PLATFORM_INFO,
      limits: {maxStorageBuffersInVertexStage: 1}
    },
    source: APP_VERTEX_STORAGE_LIMIT_WGSL
  });
  expect(
    Boolean(storageShader.source.includes('vertexStorage')),
    'active vertex storage binding remains in assembled source'
  ).toBe(true);
  expect(
    storageShader.bindingTable.map(row => row.name),
    'active vertex storage binding is assigned after the app uniform'
  ).toEqual(['appAuto', 'vertexStorage']);

  void 0;
});

it('assembleWGSLShader#preprocesses module conditionals before auto binding relocation', () => {
  const textureShader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_GROUP_0_AUTO_WGSL,
    modules: [CONDITIONAL_DEPTH_MODULE],
    defines: {USE_DEPTH_SAMPLER: false}
  });
  expect(
    Boolean(textureShader.source.includes('var conditionalDepth: texture_2d<f32>')),
    'inactive depth sampler branch is stripped before relocation'
  ).toBe(true);
  expect(
    Boolean(textureShader.source.includes('texture_depth_2d')),
    'depth texture branch is stripped before relocation'
  ).toBe(false);
  expect(
    textureShader.bindingTable.map(row => row.name),
    'only the active texture binding is assigned'
  ).toEqual(['appAuto', 'conditionalDepth']);

  const depthShader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_GROUP_0_AUTO_WGSL,
    modules: [CONDITIONAL_DEPTH_MODULE],
    defines: {USE_DEPTH_SAMPLER: true}
  });
  expect(
    Boolean(depthShader.source.includes('var conditionalDepth: texture_depth_2d')),
    'active depth texture branch remains in assembled source'
  ).toBe(true);
  expect(
    Boolean(depthShader.source.includes('var conditionalDepthSampler: sampler')),
    'active depth sampler remains in assembled source'
  ).toBe(true);
  expect(
    depthShader.bindingTable.map(row => row.name),
    'active depth bindings are assigned after the app uniform'
  ).toEqual(['appAuto', 'conditionalDepth', 'conditionalDepthSampler']);

  void 0;
});

it('assembleWGSLShader#application auto bindings allocate before modules in non-zero groups', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_GROUP_2_AUTO_WITH_MODULE_WGSL,
    modules: [GROUP_2_AUTO_MODULE]
  });

  expect(
    assembledShader.bindingTable.find(row => row.name === 'appGroup2')?.binding,
    'application binding takes the first slot in group 2'
  ).toBe(0);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'group2First')?.binding,
    'module binding allocates around application-owned slot'
  ).toBe(1);
  expect(
    assembledShader.bindingTable.find(row => row.name === 'group2Second')?.binding,
    'later module binding stays contiguous after application-owned slot'
  ).toBe(2);

  void 0;
});

it('assembleWGSLShader#keeps module auto allocations stable within one assembler', () => {
  const shaderAssembler = new WGSLShaderAssembler();

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

  expect(
    firstShader.bindingTable.find(row => row.name === 'group2RegistryA')?.binding,
    'first assembly allocates the initial slot'
  ).toBe(0);
  expect(
    secondShader.bindingTable.find(row => row.name === 'group2RegistryA')?.binding,
    'same module binding keeps its slot in a later shader assembled by the same assembler'
  ).toBe(0);
  expect(
    secondShader.bindingTable.find(row => row.name === 'group2RegistryB')?.binding,
    'new module binding is allocated around the existing registry assignment'
  ).toBe(1);

  void 0;
});

it('assembleWGSLShader#keeps disjoint texture permutations compatible when combined', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assemblePermutation = (defines: Record<string, boolean>) =>
    shaderAssembler.assembleWGSLShader({
      platformInfo: PLATFORM_INFO,
      source: APP_WGSL,
      modules: [PERMUTED_GROUP_3_TEXTURE_MODULE],
      defines
    });

  const transmissionOnly = assemblePermutation({HAS_TRANSMISSIONMAP: true});
  const baseColorOnly = assemblePermutation({HAS_BASECOLORMAP: true});
  const combined = assemblePermutation({HAS_BASECOLORMAP: true, HAS_TRANSMISSIONMAP: true});

  const getBindingLocation = (
    assembledShader: ReturnType<typeof assemblePermutation>,
    name: string
  ): number | undefined =>
    assembledShader.bindingTable.find(binding => binding.name === name)?.binding;

  expect(getBindingLocation(transmissionOnly, 'pbr_transmissionSampler'), '').toBe(1);
  expect(getBindingLocation(transmissionOnly, 'pbr_transmissionSamplerSampler'), '').toBe(2);
  expect(getBindingLocation(baseColorOnly, 'pbr_baseColorSampler'), '').toBe(3);
  expect(getBindingLocation(baseColorOnly, 'pbr_baseColorSamplerSampler'), '').toBe(4);
  expect(getBindingLocation(combined, 'pbr_transmissionSampler'), '').toBe(1);
  expect(getBindingLocation(combined, 'pbr_transmissionSamplerSampler'), '').toBe(2);
  expect(getBindingLocation(combined, 'pbr_baseColorSampler'), '').toBe(3);
  expect(getBindingLocation(combined, 'pbr_baseColorSamplerSampler'), '').toBe(4);

  void 0;
});

it('assembleWGSLShader#reclaims bindings from inactive runtime-generated modules', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const maximumBindingsPerGroup = 16;
  let highestBindingLocation = 0;

  for (let moduleIndex = 0; moduleIndex < maximumBindingsPerGroup * 4; moduleIndex++) {
    const moduleName = `runtimeGeneratedMaterial${moduleIndex}`;
    const textureName = `runtimeGeneratedTexture${moduleIndex}`;
    const runtimeGeneratedModule: ShaderModule = {
      name: moduleName,
      bindingLayout: [
        {name: textureName, group: 3},
        {name: `${textureName}Sampler`, group: 3}
      ],
      source: /* wgsl */ `\
@group(3) @binding(auto) var ${textureName}: texture_2d<f32>;
@group(3) @binding(auto) var ${textureName}Sampler: sampler;
`
    };
    const assembledShader = shaderAssembler.assembleWGSLShader({
      platformInfo: {
        ...PLATFORM_INFO,
        limits: {maxBindingsPerBindGroup: maximumBindingsPerGroup}
      },
      source: APP_WGSL,
      modules: [PERMUTED_GROUP_3_TEXTURE_MODULE, runtimeGeneratedModule],
      defines: {HAS_TRANSMISSIONMAP: true}
    });
    const textureBindingLocation = assembledShader.bindingTable.find(
      binding => binding.name === textureName
    )?.binding;
    const samplerBindingLocation = assembledShader.bindingTable.find(
      binding => binding.name === `${textureName}Sampler`
    )?.binding;

    highestBindingLocation = Math.max(
      highestBindingLocation,
      textureBindingLocation ?? 0,
      samplerBindingLocation ?? 0
    );
  }

  expect(
    Boolean(highestBindingLocation < maximumBindingsPerGroup),
    'historical runtime-generated modules never consume the available bind-group slots'
  ).toBe(true);
  expect(
    highestBindingLocation,
    'active material bindings stay stable while generated texture/sampler pairs reuse their slots'
  ).toBe(4);

  void 0;
});

it('assembleWGSLShader#scopes inactive reservations to automatic bindings in their group', () => {
  const shaderAssembler = new WGSLShaderAssembler();

  shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [PERMUTED_GROUP_3_TEXTURE_MODULE],
    defines: {HAS_TRANSMISSIONMAP: true}
  });

  const explicitShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [GROUP_3_EXPLICIT_REGISTRY_MODULE]
  });
  const isolatedGroupShader = shaderAssembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: APP_WGSL,
    modules: [GROUP_2_REGISTRY_A]
  });

  expect(
    explicitShader.bindingTable.find(binding => binding.name === 'group3ExplicitRegistryBinding')
      ?.binding,
    'inactive automatic reservations do not invalidate explicit bindings in a different shader'
  ).toBe(1);
  expect(
    isolatedGroupShader.bindingTable.find(binding => binding.name === 'group2RegistryA')?.binding,
    'inactive locations in another binding group do not change automatic allocation'
  ).toBe(0);

  void 0;
});

it('assembleWGSLShader#rejects application group 0 bindings above reserved range', () => {
  const shaderAssembler = new WGSLShaderAssembler();

  expect(
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
    'application group 0 binding 100 rejected'
  ).toThrow(/Application binding "appReserved" in group 0 uses reserved binding 100/);

  void 0;
});

it('assembleWGSLShader#rejects explicit module group 0 bindings below reserved range', () => {
  const shaderAssembler = new WGSLShaderAssembler();

  expect(
    () =>
      shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: APP_WGSL,
        modules: [INVALID_GROUP_0_MODULE]
      }),
    'module explicit group 0 binding below 100 rejected'
  ).toThrow(
    /Module "invalidGroup0Module" binding "invalidGroup0Binding" in group 0 uses reserved application binding 0/
  );

  void 0;
});

it('assembleWGSLShader#rejects duplicate explicit module bindings', () => {
  const shaderAssembler = new WGSLShaderAssembler();

  expect(
    () =>
      shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: APP_WGSL,
        modules: [DUPLICATE_GROUP_2_MODULE_A, DUPLICATE_GROUP_2_MODULE_B]
      }),
    'duplicate explicit module bindings rejected'
  ).toThrow(
    /Duplicate WGSL binding assignment for module "duplicateGroup2ModuleB" binding "duplicateGroup2B": group 2, binding 0/
  );

  void 0;
});

it('assembleWGSLShader#rejects unsupported application auto binding declaration forms', () => {
  const shaderAssembler = new WGSLShaderAssembler();

  expect(
    () =>
      shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: UNSUPPORTED_APP_AUTO_WGSL,
        modules: []
      }),
    'application WGSL unsupported form error is specific'
  ).toThrow(/Unsupported @binding\(auto\) declaration form in application WGSL/);

  void 0;
});

it('assembleWGSLShader#rejects unresolved auto bindings with module and binding names', () => {
  const shaderAssembler = new WGSLShaderAssembler();

  expect(
    () =>
      shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: APP_WGSL,
        modules: [UNSUPPORTED_MODULE_AUTO_BINDING]
      }),
    'module-side unresolved auto binding error identifies the owning module and binding'
  ).toThrow(
    /Unresolved @binding\(auto\) for module "unsupportedModuleAutoBinding" binding "unsupportedModuleBinding" remained in assembled WGSL source/
  );

  void 0;
});
