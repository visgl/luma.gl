// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {scanWGSLInterface, WGSLShaderAssembler, type PlatformInfo} from '@luma.gl/shadertools';

const PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

it('scanWGSLInterface#scans selected entry point and resource bindings', () => {
  const source = /* wgsl */ `\
alias Scalar = f32;
alias Position = vec3<Scalar>;

struct FrameUniforms {
  scale: f32,
};

@binding(2) @group(1) var<uniform> frame: FrameUniforms;
@group(0) @binding(0) var<storage, read> inputData: array<array<Position, 2>, 4>;
@binding(1) @group(0) var<storage, read_write> outputData: array<Position>;
@group(0) @binding(2) var depthTexture: texture_depth_2d;
@binding(3) @group(0) var depthTextureSampler: sampler;
@group(0) @binding(4) var shadowSampler: sampler_comparison;
@group(0) @binding(5) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(6) var videoFrame: texture_external;

@vertex
fn firstVertex(@location(7) unused: vec4f) -> @builtin(position) vec4f {
  return unused;
}

@vertex
fn selectedVertex(
  @interpolate(flat) @location(2) featureId: u32,
  @location(0) position: Position,
  @builtin(instance_index) instanceIndex: u32
) -> @builtin(position) vec4f {
  return vec4f(position * frame.scale, 1.0);
}
`;

  expect(
    scanWGSLInterface(source, {vertexEntryPoint: 'selectedVertex'}),
    'selected entry point, aliases, nested generic storage, and bindings are scanned'
  ).toEqual({
    attributes: [
      {name: 'position', location: 0, type: 'vec3<f32>'},
      {name: 'featureId', location: 2, type: 'u32'}
    ],
    bindings: [
      {name: 'inputData', group: 0, location: 0, type: 'read-only-storage'},
      {name: 'outputData', group: 0, location: 1, type: 'storage'},
      {
        name: 'depthTexture',
        group: 0,
        location: 2,
        type: 'texture',
        viewDimension: '2d',
        sampleType: 'depth',
        multisampled: false
      },
      {
        name: 'depthTextureSampler',
        group: 0,
        location: 3,
        type: 'sampler',
        samplerType: 'non-filtering'
      },
      {
        name: 'shadowSampler',
        group: 0,
        location: 4,
        type: 'sampler',
        samplerType: 'comparison'
      },
      {
        name: 'outputTexture',
        group: 0,
        location: 5,
        type: 'storage',
        format: 'rgba8unorm',
        access: 'write-only',
        viewDimension: '2d'
      },
      {name: 'videoFrame', group: 0, location: 6, type: 'external-texture'},
      {name: 'frame', group: 1, location: 2, type: 'uniform'}
    ]
  });
  void 0;
});

it('scanWGSLInterface#scans aliased struct vertex inputs and ignores comments', () => {
  const source = /* wgsl */ `\
alias Scalar = f32;
alias Coordinates = vec2<Scalar>;
alias VertexInputAlias = VertexInput;

struct VertexInput {
  @builtin(vertex_index) vertexIndex: u32,
  @interpolate(flat) @location(3) category: u32,
  @location(1) coordinates: Coordinates,
  // @location(9) hidden: vec4f,
};

/* @group(0) @binding(8) var<uniform> hiddenBinding: Hidden; */
@group(0) @binding(0) var<storage, read> positions: array<array<vec4f, 2>, 4>;

@vertex
fn vertexMain(input: VertexInputAlias) -> @builtin(position) vec4f {
  return vec4f(input.coordinates, 0.0, 1.0);
}
`;

  expect(
    scanWGSLInterface(source),
    'struct members are scanned and commented declarations are ignored'
  ).toEqual({
    attributes: [
      {name: 'coordinates', location: 1, type: 'vec2<f32>'},
      {name: 'category', location: 3, type: 'u32'}
    ],
    bindings: [{name: 'positions', group: 0, location: 0, type: 'read-only-storage'}]
  });
  void 0;
});

it('scanWGSLInterface#requires an entry point selection for multiple vertices', () => {
  const source = /* wgsl */ `\
@vertex
fn first(@location(0) firstPosition: vec2f) -> @builtin(position) vec4f {
  return vec4f(firstPosition, 0.0, 1.0);
}

@vertex
fn second(@location(1) secondPosition: vec3f) -> @builtin(position) vec4f {
  return vec4f(secondPosition, 1.0);
}
`;

  expect(scanWGSLInterface(source), 'multiple vertex entry points are ambiguous').toBe(null);
  expect(
    scanWGSLInterface(source, {vertexEntryPoint: 'second'}),
    'the selected vertex entry point controls the scanned attributes'
  ).toEqual({
    attributes: [{name: 'secondPosition', location: 1, type: 'vec3<f32>'}],
    bindings: []
  });
  expect(
    scanWGSLInterface(source, {vertexEntryPoint: 'missing'}),
    'an unknown selected entry point requires an explicit layout'
  ).toBe(null);
  void 0;
});

it('scanWGSLInterface#binding-only scans ignore unrelated vertex ambiguity', () => {
  const source = /* wgsl */ `\
@group(0) @binding(0) var<storage, read_write> values: array<u32>;

@vertex
fn firstVertex(@location(0) firstPosition: vec2f) -> @builtin(position) vec4f {
  return vec4f(firstPosition, 0.0, 1.0);
}

@vertex
fn secondVertex(@location(1) secondPosition: vec3f) -> @builtin(position) vec4f {
  return vec4f(secondPosition, 1.0);
}

@compute @workgroup_size(1)
fn computeMain() {
  values[0] = 1;
}
`;

  expect(
    scanWGSLInterface(source),
    'render interface scanning still requires a selected vertex entry point'
  ).toBe(null);
  expect(
    scanWGSLInterface(source, {scanVertexAttributes: false}),
    'compute interface scanning returns bindings without selecting an unrelated vertex entry point'
  ).toEqual({
    attributes: [],
    bindings: [{name: 'values', group: 0, location: 0, type: 'storage'}]
  });
  void 0;
});

it('scanWGSLInterface#falls back for unsupported or malformed interfaces', () => {
  expect(
    scanWGSLInterface(
      `\
@group(0) @binding(0) var textures: binding_array<texture_2d<f32>>;
@compute @workgroup_size(1) fn computeMain() {}
`,
      {scanVertexAttributes: false}
    ),
    'unsupported binding arrays require an explicit layout in binding-only mode'
  ).toBe(null);
  expect(
    scanWGSLInterface(`\
alias PositionA = PositionB;
alias PositionB = PositionA;
@vertex fn vertexMain(@location(0) position: PositionA) -> @builtin(position) vec4f {
  return vec4f(0.0);
}
`),
    'recursive type aliases require an explicit layout'
  ).toBe(null);
  expect(
    scanWGSLInterface(`\
struct BrokenInput {
  @location(0) position: vec3f,
@vertex fn vertexMain(input: BrokenInput) -> @builtin(position) vec4f {
  return vec4f(input.position, 1.0);
}
`),
    'unbalanced delimiters require an explicit layout'
  ).toBe(null);
  void 0;
});

it('WGSLShaderAssembler#assembleWGSLShader returns the scanned interface', () => {
  const source = /* wgsl */ `\
struct FrameUniforms {
  scale: f32,
};

@group(0) @binding(0) var<uniform> frame: FrameUniforms;

@vertex
fn selectedVertex(@location(1) position: vec3f) -> @builtin(position) vec4f {
  return vec4f(position * frame.scale, 1.0);
}
`;
  const assembledShader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source,
    vertexEntryPoint: 'selectedVertex'
  });

  expect(
    assembledShader.shaderLayout,
    'assembly returns a layout for its final preprocessed WGSL source'
  ).toEqual({
    attributes: [{name: 'position', location: 1, type: 'vec3<f32>'}],
    bindings: [{name: 'frame', group: 0, location: 0, type: 'uniform'}]
  });
  void 0;
});

it('WGSLShaderAssembler#binding-only interface ignores unrelated vertex ambiguity', () => {
  const source = /* wgsl */ `\
@group(0) @binding(0) var<storage, read_write> values: array<u32>;

@vertex
fn firstVertex(@location(0) firstPosition: vec2f) -> @builtin(position) vec4f {
  return vec4f(firstPosition, 0.0, 1.0);
}

@vertex
fn secondVertex(@location(1) secondPosition: vec3f) -> @builtin(position) vec4f {
  return vec4f(secondPosition, 1.0);
}

@compute @workgroup_size(1)
fn computeMain() {
  values[0] = 1;
}
`;
  const assembledShader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source,
    scanVertexAttributes: false
  });

  expect(
    assembledShader.shaderLayout,
    'assembly returns compute bindings without selecting a vertex entry point'
  ).toEqual({
    attributes: [],
    bindings: [{name: 'values', group: 0, location: 0, type: 'storage'}]
  });
  void 0;
});
