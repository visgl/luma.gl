// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const LIGHTSTORM_RENDER_SHADER = /* wgsl */ `
struct LightstormInstance {
  positionRadius: vec4<f32>,
  halfExtentsSeed: vec4<f32>,
  colorAndKind: vec4<f32>,
};

struct LightstormUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
  scene: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> instances: array<LightstormInstance>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<uniform> uniforms: LightstormUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) worldPosition: vec3<f32>,
  @location(2) localPosition: vec3<f32>,
  @location(3) baseColor: vec3<f32>,
  @location(4) seedAndKind: vec2<f32>,
  @location(5) viewDepth: f32,
  @location(6) @interpolate(flat) sourceIndex: u32,
};

@vertex fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let instance = instances[sourceIndex];
  let localPosition = inputs.positions * instance.halfExtentsSeed.xyz;
  let worldPosition = localPosition + instance.positionRadius.xyz;
  let viewPosition = uniforms.viewMatrix * vec4<f32>(worldPosition, 1.0);
  var output: VertexOutput;
  output.position = uniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  output.normal = inputs.normals;
  output.worldPosition = worldPosition;
  output.localPosition = localPosition;
  output.baseColor = instance.colorAndKind.rgb;
  output.seedAndKind = vec2<f32>(instance.halfExtentsSeed.w, instance.colorAndKind.w);
  output.viewDepth = -viewPosition.z;
  output.sourceIndex = sourceIndex;
  return output;
}

fn hashWindow(value: vec2<f32>) -> f32 {
  return fract(sin(dot(value, vec2<f32>(127.1, 311.7))) * 43758.5453);
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let normal = normalize(input.normal);
  let seed = input.seedAndKind.x;
  let isTransit = input.seedAndKind.y > 0.5;
  let time = uniforms.scene.x;
  let lightDirection = normalize(vec3<f32>(0.36, 0.82, 0.44));
  let diffuse = max(dot(normal, lightDirection), 0.0);
  let rim = pow(1.0 - abs(normal.z), 3.0);
  var color = input.baseColor * (0.22 + diffuse * 0.72 + rim * 0.08);

  let radialDistance = length(input.worldPosition.xz);
  let travelingWave = pow(
    0.5 + 0.5 * cos(radialDistance * 0.035 - time * 2.5 + seed * 6.28318),
    10.0
  );
  let skyPulse = pow(max(sin(time * 0.73 - 0.9), 0.0), 24.0);
  let lightstormEnabled = uniforms.options.w > 0.5;

  if (isTransit) {
    let laneCoordinate = min(abs(input.localPosition.x), abs(input.localPosition.z));
    let laneLine = 1.0 - smoothstep(0.025, 0.16, laneCoordinate);
    let transitEnergy = 0.55 + laneLine * 1.8 + travelingWave * 4.5;
    color = input.baseColor * select(1.2, transitEnergy, lightstormEnabled);
  } else if (abs(normal.y) < 0.5) {
    var facadePosition = vec2<f32>(input.worldPosition.x, input.worldPosition.y);
    if (abs(normal.x) > 0.5) {
      facadePosition = vec2<f32>(input.worldPosition.z, input.worldPosition.y);
    }
    let facadeCoordinate = facadePosition * vec2<f32>(0.74, 0.24);
    let windowCell = floor(facadeCoordinate);
    let windowCoordinate = fract(facadeCoordinate);
    let windowShape =
      step(0.16, windowCoordinate.x) *
      step(windowCoordinate.x, 0.78) *
      step(0.2, windowCoordinate.y) *
      step(windowCoordinate.y, 0.72);
    let occupied = step(0.3, hashWindow(windowCell + vec2<f32>(seed * 73.0, seed * 19.0)));
    let windowMask = windowShape * occupied;
    let warmWindow = mix(vec3<f32>(0.28, 0.72, 1.35), vec3<f32>(1.35, 0.48, 0.2), seed);
    let windowEnergy = select(0.42, 0.55 + travelingWave * 5.2, lightstormEnabled);
    color += warmWindow * windowMask * windowEnergy;
  } else {
    let roofBeacon = pow(max(0.0, 1.0 - length(input.localPosition.xz) * 0.65), 8.0);
    color += vec3<f32>(0.3, 0.75, 1.5) * roofBeacon * (0.35 + travelingWave * 2.0);
  }

  let highlighted =
    uniforms.options.y > 0.5 && input.sourceIndex == u32(uniforms.options.y - 1.0);
  color = select(color, vec3<f32>(3.5, 1.35, 0.12), highlighted);

  let fogAmount = 1.0 - exp(-max(input.viewDepth, 0.0) * 0.00165);
  let fogColor = vec3<f32>(0.008, 0.018, 0.055) + vec3<f32>(0.2, 0.34, 0.72) * skyPulse;
  color = mix(color, fogColor, clamp(fogAmount, 0.0, 0.96));
  color += vec3<f32>(0.12, 0.2, 0.48) * skyPulse * (1.0 - fogAmount * 0.5);
  color *= uniforms.scene.y;

  if (uniforms.scene.z < 0.5) {
    color = color / (color + vec3<f32>(1.0));
  }
  return vec4<f32>(color, 1.0);
}`;

export const LIGHTSTORM_PICKING_SHADER = /* wgsl */ `
struct LightstormInstance {
  positionRadius: vec4<f32>,
  halfExtentsSeed: vec4<f32>,
  colorAndKind: vec4<f32>,
};

struct LightstormUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
  scene: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> instances: array<LightstormInstance>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<uniform> uniforms: LightstormUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
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
  let worldPosition =
    inputs.positions * instance.halfExtentsSeed.xyz + instance.positionRadius.xyz;
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

export function getLightstormVisibilityShader(instanceCount: number): string {
  return /* wgsl */ `
struct LightstormInstance {
  positionRadius: vec4<f32>,
  halfExtentsSeed: vec4<f32>,
  colorAndKind: vec4<f32>,
};

struct LightstormUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
  scene: vec4<f32>,
};

const INSTANCE_COUNT: u32 = ${instanceCount}u;

@group(0) @binding(0) var<storage, read> instances: array<LightstormInstance>;
@group(0) @binding(1) var<uniform> uniforms: LightstormUniforms;
@group(0) @binding(2) var<storage, read_write> flags: array<u32>;

fn isVisible(instance: LightstormInstance) -> bool {
  let layerMode = uniforms.options.z;
  let isTransit = instance.colorAndKind.w > 0.5;
  if ((layerMode > 0.5 && layerMode < 1.5 && isTransit) || (layerMode > 1.5 && !isTransit)) {
    return false;
  }
  if (uniforms.options.x < 0.5) {
    return true;
  }
  let viewPosition = uniforms.viewMatrix * vec4<f32>(instance.positionRadius.xyz, 1.0);
  let radius = instance.positionRadius.w;
  let depth = -viewPosition.z;
  let tangentHalfFieldOfView = uniforms.frustum.x;
  let aspect = uniforms.frustum.y;
  let near = uniforms.frustum.z;
  let far = uniforms.frustum.w;
  if (depth + radius < near || depth - radius > far) {
    return false;
  }
  let halfHeight = max(depth, 0.0) * tangentHalfFieldOfView;
  let halfWidth = halfHeight * aspect;
  let horizontalSlope = tangentHalfFieldOfView * aspect;
  let horizontalRadius = radius * sqrt(1.0 + horizontalSlope * horizontalSlope);
  let verticalRadius = radius * sqrt(1.0 + tangentHalfFieldOfView * tangentHalfFieldOfView);
  return abs(viewPosition.x) <= halfWidth + horizontalRadius &&
    abs(viewPosition.y) <= halfHeight + verticalRadius;
}

@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) globalIdentifier: vec3<u32>) {
  let instanceIndex = globalIdentifier.x;
  if (instanceIndex >= INSTANCE_COUNT) {
    return;
  }
  flags[instanceIndex] = select(0u, 1u, isVisible(instances[instanceIndex]));
}`;
}
