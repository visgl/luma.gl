// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const VECTOR_FIELD_SHADER = /* wgsl */ `
struct FieldUniforms {
  inverseViewProjection: mat4x4f,
  cameraAndTime: vec4f,
  viewport: vec4f,
  state: vec4f,
};

@group(0) @binding(0) var<storage, read> scalarField: array<f32>;
@group(0) @binding(1) var<storage, read> vectorField: array<vec4f>;
@group(0) @binding(2) var<storage, read> gradientField: array<vec4f>;
@group(0) @binding(3) var<storage, read> laplacianField: array<f32>;
@group(0) @binding(4) var<storage, read> divergenceField: array<f32>;
@group(0) @binding(5) var<storage, read> curlField: array<vec4f>;
@group(0) @binding(6) var<uniform> uniforms: FieldUniforms;

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) clipPosition: vec2f,
};

struct VolumeSample { color: vec3f, density: f32 };

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> FragmentInputs {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: FragmentInputs;
  output.clipPosition = positions[vertexIndex];
  output.position = vec4f(output.clipPosition, 0.0, 1.0);
  return output;
}

fn fieldIndex(coordinate: vec3u) -> u32 {
  let resolution = u32(uniforms.viewport.z);
  return (coordinate.z * resolution + coordinate.y) * resolution + coordinate.x;
}

fn sampleScalarBuffer(position: vec3f, bufferId: u32) -> f32 {
  let resolution = u32(uniforms.viewport.z);
  let samplePosition = clamp(position * 0.5 + 0.5, vec3f(0.0), vec3f(1.0)) * f32(resolution - 1u);
  let base = vec3u(floor(samplePosition));
  let next = min(base + vec3u(1u), vec3u(resolution - 1u));
  let blend = fract(samplePosition);
  var corners: array<f32, 8>;
  let coordinates = array<vec3u, 8>(
    base, vec3u(next.x, base.y, base.z), vec3u(base.x, next.y, base.z), vec3u(next.x, next.y, base.z),
    vec3u(base.x, base.y, next.z), vec3u(next.x, base.y, next.z), vec3u(base.x, next.y, next.z), next);
  for (var corner = 0u; corner < 8u; corner++) {
    let index = fieldIndex(coordinates[corner]);
    if (bufferId == 0u) { corners[corner] = scalarField[index]; }
    if (bufferId == 1u) { corners[corner] = laplacianField[index]; }
    if (bufferId == 2u) { corners[corner] = divergenceField[index]; }
  }
  let z0 = mix(mix(corners[0], corners[1], blend.x), mix(corners[2], corners[3], blend.x), blend.y);
  let z1 = mix(mix(corners[4], corners[5], blend.x), mix(corners[6], corners[7], blend.x), blend.y);
  return mix(z0, z1, blend.z);
}

fn sampleVectorBuffer(position: vec3f, bufferId: u32) -> vec3f {
  let resolution = u32(uniforms.viewport.z);
  let samplePosition = clamp(position * 0.5 + 0.5, vec3f(0.0), vec3f(1.0)) * f32(resolution - 1u);
  let base = vec3u(floor(samplePosition));
  let next = min(base + vec3u(1u), vec3u(resolution - 1u));
  let blend = fract(samplePosition);
  var corners: array<vec3f, 8>;
  let coordinates = array<vec3u, 8>(
    base, vec3u(next.x, base.y, base.z), vec3u(base.x, next.y, base.z), vec3u(next.x, next.y, base.z),
    vec3u(base.x, base.y, next.z), vec3u(next.x, base.y, next.z), vec3u(base.x, next.y, next.z), next);
  for (var corner = 0u; corner < 8u; corner++) {
    let index = fieldIndex(coordinates[corner]);
    if (bufferId == 0u) { corners[corner] = vectorField[index].xyz; }
    if (bufferId == 1u) { corners[corner] = gradientField[index].xyz; }
    if (bufferId == 2u) { corners[corner] = curlField[index].xyz; }
  }
  let z0 = mix(mix(corners[0], corners[1], blend.x), mix(corners[2], corners[3], blend.x), blend.y);
  let z1 = mix(mix(corners[4], corners[5], blend.x), mix(corners[6], corners[7], blend.x), blend.y);
  return mix(z0, z1, blend.z);
}

fn signedColor(value: f32) -> vec3f {
  let amount = 1.0 - exp(-abs(value) * 0.65);
  return mix(vec3f(0.03, 0.055, 0.1), select(vec3f(0.08, 0.38, 1.0), vec3f(1.0, 0.2, 0.08), value >= 0.0), amount);
}

fn directionColor(vector: vec3f) -> vec3f {
  let direction = normalize(vector + vec3f(0.00001));
  return 0.18 + 0.82 * (direction * 0.5 + 0.5);
}

fn fieldSample(position: vec3f, panel: u32, scalarMode: bool) -> VolumeSample {
  let grid = pow(max(0.0, 0.5 + 0.5 * sin((position.x + position.y * 1.3 + position.z * 0.7) * 18.0 - uniforms.cameraAndTime.w * 1.5)), 10.0);
  if (scalarMode) {
    let scalar = sampleScalarBuffer(position, 0u);
    let gradient = sampleVectorBuffer(position, 1u);
    let laplacian = sampleScalarBuffer(position, 1u);
    if (panel == 0u) { return VolumeSample(mix(vec3f(0.04, 0.22, 0.5), vec3f(1.0, 0.7, 0.16), clamp(scalar, 0.0, 1.0)), abs(scalar) * 2.1); }
    if (panel == 1u) { return VolumeSample(directionColor(gradient), length(gradient) * 0.23 * (0.45 + grid)); }
    if (panel == 2u) { return VolumeSample(signedColor(laplacian), (1.0 - exp(-abs(laplacian) * 0.12)) * 1.25); }
    return VolumeSample(mix(signedColor(laplacian), directionColor(gradient), 0.46), (abs(scalar) * 0.75 + length(gradient) * 0.08) * (0.7 + grid));
  }
  let vector = sampleVectorBuffer(position, 0u);
  let divergence = sampleScalarBuffer(position, 2u);
  let curl = sampleVectorBuffer(position, 2u);
  if (panel == 0u) { return VolumeSample(directionColor(vector), length(vector) * 0.32 * (0.38 + grid)); }
  if (panel == 1u) { return VolumeSample(signedColor(divergence), (0.12 + 0.88 * grid) * (1.0 - exp(-abs(divergence) * 0.35))); }
  if (panel == 2u) { return VolumeSample(directionColor(curl), length(curl) * 0.18 * (0.45 + grid)); }
  return VolumeSample(mix(signedColor(divergence), directionColor(curl), 0.55), (length(curl) * 0.1 + abs(divergence) * 0.14 + length(vector) * 0.08) * (0.45 + grid));
}

fn unproject(uv: vec2f, depth: f32) -> vec3f {
  let world = uniforms.inverseViewProjection * vec4f(uv * 2.0 - 1.0, depth, 1.0);
  return world.xyz / world.w;
}

fn intersectBox(origin: vec3f, direction: vec3f) -> vec2f {
  let safeDirection = select(vec3f(0.000001), direction, abs(direction) > vec3f(0.000001));
  let first = (-vec3f(1.0) - origin) / safeDirection;
  let second = (vec3f(1.0) - origin) / safeDirection;
  let nearPlane = min(first, second);
  let farPlane = max(first, second);
  return vec2f(max(max(nearPlane.x, nearPlane.y), nearPlane.z), min(min(farPlane.x, farPlane.y), farPlane.z));
}

fn hash(point: vec2f) -> f32 { return fract(sin(dot(point, vec2f(12.9898, 78.233))) * 43758.5453); }

@fragment fn fragmentMain(input: FragmentInputs) -> @location(0) vec4f {
  let screenUV = input.position.xy / uniforms.viewport.xy;
  let panelCoordinate = vec2u(min(u32(screenUV.x * 2.0), 1u), min(u32(screenUV.y * 2.0), 1u));
  let panel = panelCoordinate.y * 2u + panelCoordinate.x;
  let localUV = fract(screenUV * 2.0);
  let cameraUV = vec2f(localUV.x, 1.0 - localUV.y);
  let nearWorld = unproject(cameraUV, 0.0);
  let farWorld = unproject(cameraUV, 1.0);
  let rayOrigin = uniforms.cameraAndTime.xyz;
  let rayDirection = normalize(farWorld - nearWorld);
  let hit = intersectBox(rayOrigin, rayDirection);
  var color = vec3f(0.004, 0.009, 0.022) + vec3f(0.012, 0.02, 0.04) * (1.0 - cameraUV.y);
  if (hit.y > max(hit.x, 0.0)) {
    let start = max(hit.x, 0.0);
    let stepLength = (hit.y - start) / uniforms.state.x;
    var transmittance = 1.0;
    var distance = start + hash(input.position.xy) * stepLength;
    for (var step = 0u; step < 72u; step++) {
      let position = rayOrigin + rayDirection * distance;
      let sample = fieldSample(position, panel, uniforms.viewport.w > 0.5);
      let alpha = 1.0 - exp(-sample.density * stepLength * 2.2);
      color += transmittance * alpha * sample.color * 1.35;
      transmittance *= 1.0 - alpha;
      if (transmittance < 0.015) { break; }
      distance += stepLength;
    }
    let entry = rayOrigin + rayDirection * start;
    let edgeCount = dot(vec3f(abs(abs(entry) - 1.0) < vec3f(0.018)), vec3f(1.0));
    color += vec3f(0.1, 0.65, 0.9) * select(0.0, 0.65, edgeCount >= 2.0);
  }
  let edge = min(min(localUV.x, 1.0 - localUV.x), min(localUV.y, 1.0 - localUV.y));
  color = mix(color, vec3f(0.16, 0.34, 0.5), (1.0 - smoothstep(0.0, 0.004, edge)) * 0.65);
  return vec4f(color, 1.0);
}`;
