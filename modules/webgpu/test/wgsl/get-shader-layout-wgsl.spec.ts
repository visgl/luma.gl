import {expect, test} from 'vitest';
import { ShaderLayout } from '@luma.gl/core';
import { getShaderLayoutFromWGSL } from '@luma.gl/webgpu';
const SHADER = /* WGSL */`\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn main(
  @location(0) position : vec4<f32>,
  @location(1) uv : vec2<f32>,
  @location(2) offset: f32,
) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix * position;
  output.fragUV = uv;
  output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
  return output;
}

@fragment
fn main(
  @location(0) fragUV: vec2<f32>,
  @location(1) fragPosition: vec4<f32>
) -> @location(0) vec4<f32> {
  return fragPosition;
}
`;
const TEST_CASES: {
  title?: string;
  wgsl: string;
  shaderLayout: ShaderLayout;
}[] = [{
  wgsl: SHADER,
  shaderLayout: {
    attributes: [{
      name: 'position',
      location: 0,
      type: 'vec4<f32>'
    }, {
      name: 'uv',
      location: 1,
      type: 'vec2<f32>'
    }, {
      name: 'offset',
      location: 2,
      type: 'f32'
    }],
    bindings: [{
      type: 'uniform',
      name: 'uniforms',
      group: 0,
      location: 0,
      // @ts-expect-error
      members: [{
        name: 'modelViewProjectionMatrix',
        type: 'mat4x4<f32>'
      }]
    }]
  }
}];

// ...existing code...

const TEXTURE_SHADER = /* WGSL */`\
@group(0) @binding(1) var myTexture: texture_2d<f32>;
@group(0) @binding(2) var mySampler: sampler;
@group(0) @binding(3) var myDepthTexture: texture_depth_2d;
@group(0) @binding(4) var myMultisampledTexture: texture_multisampled_2d<f32>;

@fragment
fn main(
  @location(0) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
  // Dummy usage
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}
`;
TEST_CASES.push({
  title: 'texture bindings',
  wgsl: TEXTURE_SHADER,
  shaderLayout: {
    attributes: [],
    bindings: [{
      type: 'texture',
      name: 'myTexture',
      group: 0,
      location: 1,
      viewDimension: '2d',
      sampleType: 'float',
      multisampled: false
    }, {
      type: 'texture',
      name: 'myDepthTexture',
      group: 0,
      location: 3,
      viewDimension: '2d',
      sampleType: 'depth',
      multisampled: false
    }, {
      type: 'texture',
      name: 'myMultisampledTexture',
      group: 0,
      location: 4,
      viewDimension: '2d',
      sampleType: 'float',
      multisampled: true
    }, {
      type: 'sampler',
      name: 'mySampler',
      group: 0,
      location: 2
    }]
  }
});
const STORAGE_SHADER = /* WGSL */`\
@group(0) @binding(0) var<storage, read_write> writableData: array<i32>;
@group(0) @binding(1) var<storage, read> readableData: array<i32>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  writableData[index] = writableData[index] + readableData[index];
}
`;
TEST_CASES.push({
  title: 'storage bindings',
  wgsl: STORAGE_SHADER,
  shaderLayout: {
    attributes: [],
    bindings: [{
      type: 'storage',
      name: 'writableData',
      group: 0,
      location: 0
    }, {
      type: 'read-only-storage',
      name: 'readableData',
      group: 0,
      location: 1
    }]
  }
});
const MULTI_GROUP_SHADER = /* WGSL */`\
struct SceneUniforms {
  exposure: f32,
};

struct MaterialUniforms {
  baseColor: vec4<f32>,
};

@group(2) @binding(0) var<uniform> scene: SceneUniforms;
@group(3) @binding(0) var<uniform> material: MaterialUniforms;
@group(3) @binding(1) var materialTexture: texture_2d<f32>;
@group(3) @binding(2) var materialSampler: sampler;

@fragment
fn main() -> @location(0) vec4<f32> {
  return material.baseColor * scene.exposure;
}
`;
TEST_CASES.push({
  title: 'multi-group bindings',
  wgsl: MULTI_GROUP_SHADER,
  shaderLayout: {
    attributes: [],
    bindings: [{
      type: 'uniform',
      name: 'scene',
      group: 2,
      location: 0,
      // @ts-expect-error
      members: [{
        name: 'exposure',
        type: 'f32'
      }]
    }, {
      type: 'uniform',
      name: 'material',
      group: 3,
      location: 0,
      // @ts-expect-error
      members: [{
        name: 'baseColor',
        type: 'vec4<f32>'
      }]
    }, {
      type: 'texture',
      name: 'materialTexture',
      group: 3,
      location: 1,
      viewDimension: '2d',
      sampleType: 'float',
      multisampled: false
    }, {
      type: 'sampler',
      name: 'materialSampler',
      group: 3,
      location: 2
    }]
  }
});
test('WebGPU#getShaderLayoutFromWGSL', () => {
  for (const tc of TEST_CASES) {
    const shaderLayout = getShaderLayoutFromWGSL(tc.wgsl);
    expect(shaderLayout, `correct ShaderLayout parsed ${tc.title || ''}`).toEqual(tc.shaderLayout);
    // console.error(JSON.stringify(shaderLayout, null, 2));
  }
});
