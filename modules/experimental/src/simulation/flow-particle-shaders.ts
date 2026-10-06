// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const FLOW_PARTICLE_WGSL = /* wgsl */ `struct FlowUniforms {
  bounds: vec4<f32>,
  parameters: vec4<f32>,
  epoch: vec4<f32>,
};
@group(0) @binding(0) var<uniform> flowUniforms: FlowUniforms;
@group(0) @binding(1) var particleTexture: texture_2d<f32>;
@group(0) @binding(2) var velocityTexture: texture_2d<f32>;

fn hashNumber(input: u32) -> f32 {
  var value = input;
  value = (value ^ (value >> 16u)) * 2246822519u;
  value = (value ^ (value >> 13u)) * 3266489917u;
  return f32((value ^ (value >> 16u)) >> 8u) / 16777216.0;
}
fn outsideBounds(position: vec2<f32>) -> bool {
  return any(position < vec2<f32>(0.0)) || any(position > vec2<f32>(1.0));
}
fn sampleVelocity(position: vec2<f32>) -> vec3<f32> {
  if (outsideBounds(position)) { return vec3<f32>(0.0); }
  let dimensions = vec2<i32>(textureDimensions(velocityTexture));
  let gridPosition = position * vec2<f32>(dimensions - vec2<i32>(1));
  let lower = vec2<i32>(floor(gridPosition));
  let upper = min(lower + vec2<i32>(1), dimensions - vec2<i32>(1));
  let fraction = fract(gridPosition);
  let lowerLeft = textureLoad(velocityTexture, lower, 0);
  let lowerRight = textureLoad(velocityTexture, vec2<i32>(upper.x, lower.y), 0);
  let upperLeft = textureLoad(velocityTexture, vec2<i32>(lower.x, upper.y), 0);
  let upperRight = textureLoad(velocityTexture, upper, 0);
  // Conservative mask: do not interpolate across a missing-data cell.
  if (min(min(lowerLeft.z, lowerRight.z), min(upperLeft.z, upperRight.z)) < 0.5) {
    return vec3<f32>(0.0);
  }
  let velocity = mix(mix(lowerLeft.xy, lowerRight.xy, fraction.x),
    mix(upperLeft.xy, upperRight.xy, fraction.x), fraction.y);
  var unitsPerSecond = velocity;
  if (flowUniforms.epoch.w > 0.5) {
    let latitude = flowUniforms.bounds.y + flowUniforms.bounds.w * position.y;
    unitsPerSecond = velocity / (111195.08 * vec2<f32>(cos(radians(latitude)), 1.0));
  }
  return vec3<f32>(unitsPerSecond / flowUniforms.bounds.zw, 1.0);
}
fn spawnParticle(identifier: u32, iteration: u32, generation: f32) -> vec4<f32> {
  let seed = identifier * 747796405u + u32(flowUniforms.epoch.z) +
    u32(flowUniforms.epoch.y) * 2891336453u + iteration * 277803737u;
  let position = vec2<f32>(hashNumber(seed), hashNumber(seed + 1013904223u));
  let valid = sampleVelocity(position).z > 0.5;
  return vec4<f32>(position, select(-1.0, select(0.0, hashNumber(seed + 12345u) * flowUniforms.parameters.z, generation == 0.0), valid), (generation + 1.0) % 65536.0);
}
@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let position = vec2<f32>(f32((index << 1u) & 2u), f32(index & 2u));
  return vec4<f32>(position * 2.0 - 1.0, 0.0, 1.0);
}
@fragment
fn fragmentMain(@builtin(position) fragmentPosition: vec4<f32>) -> @location(0) vec4<f32> {
  let coordinates = vec2<i32>(fragmentPosition.xy);
  let identifier = u32(coordinates.y) * u32(flowUniforms.epoch.x) + u32(coordinates.x);
  if (identifier >= u32(flowUniforms.parameters.x)) { return vec4<f32>(0.0, 0.0, -1.0, 0.0); }
  var particle = textureLoad(particleTexture, coordinates, 0);
  for (var iteration = 0u; iteration < 8u; iteration++) {
    if (iteration >= u32(flowUniforms.parameters.w)) { break; }
    let firstVelocity = sampleVelocity(particle.xy);
    let midpoint = particle.xy + firstVelocity.xy * flowUniforms.parameters.y * 0.5;
    let midpointVelocity = sampleVelocity(midpoint);
    let destination = particle.xy + midpointVelocity.xy * flowUniforms.parameters.y;
    if (particle.z < 0.0 || particle.z + flowUniforms.parameters.y >= flowUniforms.parameters.z ||
        firstVelocity.z < 0.5 || midpointVelocity.z < 0.5 || sampleVelocity(destination).z < 0.5) {
      particle = spawnParticle(identifier, iteration, particle.w);
    } else {
      particle = vec4<f32>(destination, particle.z + flowUniforms.parameters.y, particle.w);
    }
  }
  return particle;
}
`;

export const FLOW_PARTICLE_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform flowUniforms {
  vec4 bounds;
  vec4 parameters;
  vec4 epoch;
} flow;
uniform highp sampler2D particleTexture;
uniform highp sampler2D velocityTexture;
out vec4 fragmentColor;

float hashNumber(uint inputValue) {
  uint value = inputValue;
  value = (value ^ (value >> 16u)) * 2246822519u;
  value = (value ^ (value >> 13u)) * 3266489917u;
  return float((value ^ (value >> 16u)) >> 8u) / 16777216.0;
}
bool outsideBounds(vec2 position) {
  return any(lessThan(position, vec2(0.0))) || any(greaterThan(position, vec2(1.0)));
}
vec3 sampleVelocity(vec2 position) {
  if (outsideBounds(position)) { return vec3(0.0); }
  ivec2 dimensions = textureSize(velocityTexture, 0);
  vec2 gridPosition = position * vec2(dimensions - ivec2(1));
  ivec2 lower = ivec2(floor(gridPosition));
  ivec2 upper = min(lower + ivec2(1), dimensions - ivec2(1));
  vec2 fraction = fract(gridPosition);
  vec4 lowerLeft = texelFetch(velocityTexture, lower, 0);
  vec4 lowerRight = texelFetch(velocityTexture, ivec2(upper.x, lower.y), 0);
  vec4 upperLeft = texelFetch(velocityTexture, ivec2(lower.x, upper.y), 0);
  vec4 upperRight = texelFetch(velocityTexture, upper, 0);
  if (min(min(lowerLeft.z, lowerRight.z), min(upperLeft.z, upperRight.z)) < 0.5) {
    return vec3(0.0);
  }
  vec2 velocity = mix(mix(lowerLeft.xy, lowerRight.xy, fraction.x),
    mix(upperLeft.xy, upperRight.xy, fraction.x), fraction.y);
  vec2 unitsPerSecond = velocity;
  if (flow.epoch.w > 0.5) {
    float latitude = flow.bounds.y + flow.bounds.w * position.y;
    unitsPerSecond = velocity / (111195.08 * vec2(cos(radians(latitude)), 1.0));
  }
  return vec3(unitsPerSecond / flow.bounds.zw, 1.0);
}
vec4 spawnParticle(uint identifier, uint iteration, float generation) {
  uint seed = identifier * 747796405u + uint(flow.epoch.z) +
    uint(flow.epoch.y) * 2891336453u + iteration * 277803737u;
  vec2 position = vec2(hashNumber(seed), hashNumber(seed + 1013904223u));
  bool valid = sampleVelocity(position).z > 0.5;
  return vec4(position, valid ? (generation == 0.0 ? hashNumber(seed + 12345u) * flow.parameters.z : 0.0) : -1.0, mod(generation + 1.0, 65536.0));
}
void main() {
  ivec2 coordinates = ivec2(gl_FragCoord.xy);
  uint identifier = uint(coordinates.y) * uint(flow.epoch.x) + uint(coordinates.x);
  if (identifier >= uint(flow.parameters.x)) { fragmentColor = vec4(0.0, 0.0, -1.0, 0.0); return; }
  vec4 particle = texelFetch(particleTexture, coordinates, 0);
  for (uint iteration = 0u; iteration < 8u; iteration++) {
    if (iteration >= uint(flow.parameters.w)) { break; }
    vec3 firstVelocity = sampleVelocity(particle.xy);
    vec2 midpoint = particle.xy + firstVelocity.xy * flow.parameters.y * 0.5;
    vec3 midpointVelocity = sampleVelocity(midpoint);
    vec2 destination = particle.xy + midpointVelocity.xy * flow.parameters.y;
    if (particle.z < 0.0 || particle.z + flow.parameters.y >= flow.parameters.z ||
        firstVelocity.z < 0.5 || midpointVelocity.z < 0.5 || sampleVelocity(destination).z < 0.5) {
      particle = spawnParticle(identifier, iteration, particle.w);
    } else {
      particle = vec4(destination, particle.z + flow.parameters.y, particle.w);
    }
  }
  fragmentColor = particle;
}
`;

export const FLOW_PARTICLE_VERTEX = /* glsl */ `#version 300 es
void main() {
  vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`;
