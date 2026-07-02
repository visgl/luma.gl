// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const CULLING_RENDER_SHADER = /* wgsl */ `
struct CullingInstance {
  positionRadius: vec4<f32>,
  color: vec4<f32>,
};

struct CullingUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> instances: array<CullingInstance>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<uniform> uniforms: CullingUniforms;

struct VertexInputs {
  @location(0) positions: vec4<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) color: vec4<f32>,
};

@vertex fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let instance = instances[sourceIndex];
  let worldPosition = inputs.positions.xyz * instance.positionRadius.w * 1.35 +
    instance.positionRadius.xyz;
  var output: VertexOutput;
  output.position = uniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  output.normal = inputs.normals;
  let highlighted = uniforms.options.y > 0.5 && sourceIndex == u32(uniforms.options.y - 1.0);
  output.color = select(instance.color, vec4<f32>(1.0, 0.85, 0.15, 1.0), highlighted);
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let lightDirection = normalize(vec3<f32>(0.42, 0.82, 0.36));
  let diffuse = max(dot(normalize(input.normal), lightDirection), 0.18);
  return vec4<f32>(input.color.rgb * diffuse, input.color.a);
}`;

export const CULLING_PICKING_SHADER = /* wgsl */ `
struct CullingInstance {
  positionRadius: vec4<f32>,
  color: vec4<f32>,
};

struct CullingUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> instances: array<CullingInstance>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<uniform> uniforms: CullingUniforms;

struct VertexInputs {
  @location(0) positions: vec4<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) sourceIndex: u32,
};

struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @location(1) indices: vec2<i32>,
};

@vertex fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let instance = instances[sourceIndex];
  let worldPosition = inputs.positions.xyz * instance.positionRadius.w * 1.35 +
    instance.positionRadius.xyz;
  var output: VertexOutput;
  output.position = uniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  output.sourceIndex = sourceIndex;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> FragmentOutput {
  var output: FragmentOutput;
  output.color = vec4<f32>(0.0);
  output.indices = vec2<i32>(i32(input.sourceIndex), 0);
  return output;
}`;

export function getFrustumCullingShader(instanceCount: number): string {
  return /* wgsl */ `
struct CullingInstance {
  positionRadius: vec4<f32>,
  color: vec4<f32>,
};

struct CullingUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
};

const INSTANCE_COUNT: u32 = ${instanceCount}u;

@group(0) @binding(0) var<storage, read> instances: array<CullingInstance>;
@group(0) @binding(1) var<uniform> uniforms: CullingUniforms;
@group(0) @binding(2) var<storage, read_write> flags: array<u32>;
@group(0) @binding(3) var<storage, read_write> sourceIds: array<u32>;

fn isVisible(positionRadius: vec4<f32>) -> bool {
  if (uniforms.options.x < 0.5) {
    return true;
  }
  let viewPosition = uniforms.viewMatrix * vec4<f32>(positionRadius.xyz, 1.0);
  let radius = positionRadius.w * 1.35;
  let depth = -viewPosition.z;
  let tanHalfFov = uniforms.frustum.x;
  let aspect = uniforms.frustum.y;
  let near = uniforms.frustum.z;
  let far = uniforms.frustum.w;
  if (depth + radius < near || depth - radius > far) {
    return false;
  }
  let halfHeight = max(depth, 0.0) * tanHalfFov;
  let halfWidth = halfHeight * aspect;
  return abs(viewPosition.x) <= halfWidth + radius &&
    abs(viewPosition.y) <= halfHeight + radius;
}

@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= INSTANCE_COUNT) {
    return;
  }
  flags[index] = select(0u, 1u, isVisible(instances[index].positionRadius));
  sourceIds[index] = index;
}`;
}
