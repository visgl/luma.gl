// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const PARQUET_CONSTELLATION_SHADER = /* wgsl */ `
struct ConstellationUniforms {
  time: f32,
  aspect: f32,
  pointScale: f32,
  brightness: f32,
  horizontalOffset: f32,
  padding0: f32,
  padding1: f32,
  padding2: f32,
};

@group(0) @binding(0) var<storage, read> positionX: array<f32>;
@group(0) @binding(1) var<storage, read> positionY: array<f32>;
@group(0) @binding(2) var<storage, read> radii: array<f32>;
@group(0) @binding(3) var<storage, read> temperatures: array<f32>;
@group(0) @binding(4) var<storage, read> sequences: array<u32>;
@group(0) @binding(5) var<uniform> uniforms: ConstellationUniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) localPosition: vec2<f32>,
  @location(1) color: vec3<f32>,
  @location(2) alpha: f32,
};

fn getCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );
  return corners[vertexIndex];
}

fn getStarColor(temperature: f32, armIndex: u32) -> vec3<f32> {
  let cool = vec3<f32>(0.18, 0.48, 1.0);
  let warm = vec3<f32>(1.0, 0.42, 0.12);
  let whiteHot = vec3<f32>(0.82, 0.94, 1.0);
  let thermal = mix(cool, warm, smoothstep(0.18, 0.78, temperature));
  let hot = mix(thermal, whiteHot, smoothstep(0.76, 1.0, temperature));
  let armTint = 0.93 + 0.07 * cos(f32(armIndex) * 1.7 + vec3<f32>(0.0, 2.0, 4.0));
  return hot * armTint;
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let corner = getCorner(vertexIndex);
  let sourcePosition = vec2<f32>(positionX[instanceIndex], positionY[instanceIndex]);
  let distance = length(sourcePosition);
  let angle = uniforms.time * (0.025 + (1.0 - distance) * 0.09);
  let rotation = mat2x2<f32>(cos(angle), sin(angle), -sin(angle), cos(angle));
  let center = rotation * sourcePosition;
  let pulse = 0.88 + 0.12 * sin(uniforms.time * 1.7 + f32(sequences[instanceIndex] % 97u));
  let pointRadius = radii[instanceIndex] * uniforms.pointScale * pulse;
  let screenCorner = corner * pointRadius * vec2<f32>(1.0 / max(uniforms.aspect, 0.001), 1.0);
  var output: VertexOutput;
  output.position = vec4<f32>(center.x / max(uniforms.aspect, 0.001), center.y, 0.0, 1.0) +
    vec4<f32>(screenCorner.x + uniforms.horizontalOffset, screenCorner.y, 0.0, 0.0);
  output.localPosition = corner;
  output.color = getStarColor(temperatures[instanceIndex], sequences[instanceIndex] % 5u);
  output.alpha = (0.34 + temperatures[instanceIndex] * 0.66) * uniforms.brightness;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let radialDistance = length(input.localPosition);
  if (radialDistance > 1.0) {
    discard;
  }
  let core = exp(-radialDistance * radialDistance * 9.0);
  let halo = pow(max(0.0, 1.0 - radialDistance), 2.5) * 0.32;
  let alpha = (core + halo) * input.alpha;
  return vec4<f32>(input.color * alpha, alpha);
}`;
