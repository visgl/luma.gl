// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const VECTOR_FIELD_SHADER = /* wgsl */ `
struct FieldUniforms {
  viewport: vec4f,
  state: vec4f,
};

@group(0) @binding(0) var<storage, read> scalarField: array<f32>;
@group(0) @binding(1) var<storage, read> vectorField: array<vec2f>;
@group(0) @binding(2) var<storage, read> gradientField: array<vec2f>;
@group(0) @binding(3) var<storage, read> laplacianField: array<f32>;
@group(0) @binding(4) var<storage, read> divergenceField: array<f32>;
@group(0) @binding(5) var<storage, read> curlField: array<f32>;
@group(0) @binding(6) var<uniform> uniforms: FieldUniforms;

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) clipPosition: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> FragmentInputs {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: FragmentInputs;
  output.clipPosition = positions[vertexIndex];
  output.position = vec4f(output.clipPosition, 0.0, 1.0);
  return output;
}

fn fieldIndex(coordinate: vec2u) -> u32 {
  let resolution = u32(uniforms.viewport.z);
  return coordinate.y * resolution + coordinate.x;
}

fn fieldCoordinates(uv: vec2f) -> vec3f {
  let resolution = u32(uniforms.viewport.z);
  let samplePosition = clamp(uv, vec2f(0.0), vec2f(1.0)) * f32(resolution - 1u);
  return vec3f(floor(samplePosition), fract(samplePosition.x));
}

fn sampleScalarBuffer(uv: vec2f, bufferId: u32) -> f32 {
  let resolution = u32(uniforms.viewport.z);
  let samplePosition = clamp(uv, vec2f(0.0), vec2f(1.0)) * f32(resolution - 1u);
  let base = vec2u(floor(samplePosition));
  let next = min(base + vec2u(1u), vec2u(resolution - 1u));
  let blend = fract(samplePosition);
  var a = 0.0; var b = 0.0; var c = 0.0; var d = 0.0;
  let i00 = fieldIndex(base);
  let i10 = fieldIndex(vec2u(next.x, base.y));
  let i01 = fieldIndex(vec2u(base.x, next.y));
  let i11 = fieldIndex(next);
  if (bufferId == 0u) { a = scalarField[i00]; b = scalarField[i10]; c = scalarField[i01]; d = scalarField[i11]; }
  if (bufferId == 1u) { a = laplacianField[i00]; b = laplacianField[i10]; c = laplacianField[i01]; d = laplacianField[i11]; }
  if (bufferId == 2u) { a = divergenceField[i00]; b = divergenceField[i10]; c = divergenceField[i01]; d = divergenceField[i11]; }
  if (bufferId == 3u) { a = curlField[i00]; b = curlField[i10]; c = curlField[i01]; d = curlField[i11]; }
  return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
}

fn sampleVectorBuffer(uv: vec2f, bufferId: u32) -> vec2f {
  let resolution = u32(uniforms.viewport.z);
  let samplePosition = clamp(uv, vec2f(0.0), vec2f(1.0)) * f32(resolution - 1u);
  let base = vec2u(floor(samplePosition));
  let next = min(base + vec2u(1u), vec2u(resolution - 1u));
  let blend = fract(samplePosition);
  let i00 = fieldIndex(base);
  let i10 = fieldIndex(vec2u(next.x, base.y));
  let i01 = fieldIndex(vec2u(base.x, next.y));
  let i11 = fieldIndex(next);
  var a: vec2f; var b: vec2f; var c: vec2f; var d: vec2f;
  if (bufferId == 0u) {
    a = vectorField[i00]; b = vectorField[i10]; c = vectorField[i01]; d = vectorField[i11];
  } else {
    a = gradientField[i00]; b = gradientField[i10]; c = gradientField[i01]; d = gradientField[i11];
  }
  return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
}

fn signedColor(value: f32, scale: f32) -> vec3f {
  let amount = 1.0 - exp(-abs(value) * scale);
  let negative = vec3f(0.12, 0.44, 1.0);
  let positive = vec3f(1.0, 0.25, 0.13);
  return mix(vec3f(0.035, 0.045, 0.075), select(negative, positive, value >= 0.0), amount);
}

fn scalarColor(value: f32) -> vec3f {
  let t = 0.5 + 0.5 * tanh(value * 1.8);
  let low = vec3f(0.055, 0.12, 0.32);
  let middle = vec3f(0.05, 0.68, 0.7);
  let high = vec3f(1.0, 0.73, 0.21);
  return select(mix(low, middle, t * 2.0), mix(middle, high, t * 2.0 - 1.0), t > 0.5);
}

fn segmentDistance(point: vec2f, a: vec2f, b: vec2f) -> f32 {
  let ab = b - a;
  let projection = clamp(dot(point - a, ab) / max(dot(ab, ab), 0.00001), 0.0, 1.0);
  return length(point - (a + ab * projection));
}

fn arrowGlyph(uv: vec2f, vector: vec2f) -> f32 {
  let cells = 15.0;
  let local = fract(uv * cells) - 0.5;
  let speed = length(vector);
  if (speed < 0.0001) { return 0.0; }
  let direction = vector / speed;
  let normal = vec2f(-direction.y, direction.x);
  let point = vec2f(dot(local, direction), dot(local, normal));
  let lengthScale = 0.28 + 0.12 * min(speed, 1.5);
  let shaft = segmentDistance(point, vec2f(-lengthScale, 0.0), vec2f(lengthScale * 0.62, 0.0));
  let headA = segmentDistance(point, vec2f(lengthScale, 0.0), vec2f(lengthScale * 0.46, 0.17));
  let headB = segmentDistance(point, vec2f(lengthScale, 0.0), vec2f(lengthScale * 0.46, -0.17));
  return 1.0 - smoothstep(0.026, 0.055, min(shaft, min(headA, headB)));
}

fn streamlineTexture(uv: vec2f) -> f32 {
  var position = uv;
  var phase = 0.0;
  for (var step = 0u; step < 11u; step++) {
    let velocity = sampleVectorBuffer(position, 0u);
    position -= velocity * 0.012;
    phase += length(velocity) * 0.19;
  }
  let bands = sin((position.x * 41.0 + position.y * 27.0 + phase - uniforms.state.x * 2.2) * 3.14159);
  return pow(max(bands, 0.0), 8.0);
}

fn panelBorder(localUV: vec2f) -> f32 {
  let edge = min(min(localUV.x, 1.0 - localUV.x), min(localUV.y, 1.0 - localUV.y));
  return 1.0 - smoothstep(0.0, 0.006, edge);
}

@fragment fn fragmentMain(input: FragmentInputs) -> @location(0) vec4f {
  let screenUV = input.position.xy / uniforms.viewport.xy;
  let panelCoordinate = vec2u(min(u32(screenUV.x * 2.0), 1u), min(u32(screenUV.y * 2.0), 1u));
  let panel = panelCoordinate.y * 2u + panelCoordinate.x;
  let localUV = fract(screenUV * 2.0);
  let fieldUV = vec2f(localUV.x, 1.0 - localUV.y);
  let world = fieldUV * 2.0 - 1.0;
  let scalarMode = uniforms.viewport.w > 0.5;
  var color = vec3f(0.02, 0.03, 0.055);
  var arrows = 0.0;

  if (scalarMode) {
    let scalar = sampleScalarBuffer(fieldUV, 0u);
    let gradient = sampleVectorBuffer(fieldUV, 1u);
    let laplacian = sampleScalarBuffer(fieldUV, 1u);
    if (panel == 0u) {
      color = scalarColor(scalar);
      color += vec3f(0.16) * pow(1.0 - abs(fract(scalar * 9.0) * 2.0 - 1.0), 22.0);
    } else if (panel == 1u) {
      color = mix(vec3f(0.025, 0.04, 0.08), vec3f(0.12, 0.88, 0.72), 1.0 - exp(-length(gradient) * 0.55));
      arrows = arrowGlyph(fieldUV, gradient);
    } else if (panel == 2u) {
      color = signedColor(laplacian, 0.18);
    } else {
      color = scalarColor(scalar) * 0.5;
      let contour = pow(1.0 - abs(fract(scalar * 12.0) * 2.0 - 1.0), 30.0);
      color += vec3f(0.8, 0.95, 1.0) * contour * 0.7;
      arrows = arrowGlyph(fieldUV, gradient);
    }
  } else {
    let vector = sampleVectorBuffer(fieldUV, 0u);
    let divergence = sampleScalarBuffer(fieldUV, 2u);
    let curl = sampleScalarBuffer(fieldUV, 3u);
    if (panel == 0u) {
      color = mix(vec3f(0.02, 0.035, 0.075), vec3f(0.06, 0.62, 0.82), 1.0 - exp(-length(vector) * 0.8));
      color += vec3f(0.28, 0.85, 1.0) * streamlineTexture(fieldUV) * 0.42;
      arrows = arrowGlyph(fieldUV, vector);
    } else if (panel == 1u) {
      color = signedColor(divergence, 0.75);
      arrows = arrowGlyph(fieldUV, vector) * 0.24;
    } else if (panel == 2u) {
      color = signedColor(curl, 0.42);
      let rings = pow(1.0 - abs(fract(length(world) * 7.0 - uniforms.state.x * 0.35) * 2.0 - 1.0), 20.0);
      color += select(vec3f(0.1, 0.35, 1.0), vec3f(1.0, 0.52, 0.08), curl >= 0.0) * rings * min(abs(curl) * 0.08, 0.32);
    } else {
      color = mix(signedColor(divergence, 0.75), signedColor(curl, 0.42), 0.5);
      color += vec3f(0.12, 0.65, 0.95) * streamlineTexture(fieldUV) * 0.32;
      arrows = arrowGlyph(fieldUV, vector) * 0.65;
    }
  }

  color = mix(color, vec3f(0.92, 0.98, 1.0), arrows * 0.8);
  if (uniforms.state.w > 0.5) {
    let probeUV = uniforms.state.yz * 0.5 + 0.5;
    let probeDistance = min(abs(fieldUV.x - probeUV.x), abs(fieldUV.y - probeUV.y));
    let cross = (1.0 - smoothstep(0.002, 0.006, probeDistance)) *
      (1.0 - smoothstep(0.035, 0.052, max(abs(fieldUV.x - probeUV.x), abs(fieldUV.y - probeUV.y))));
    color = mix(color, vec3f(1.0, 0.92, 0.42), cross);
  }
  color = mix(color, vec3f(0.24, 0.38, 0.55), panelBorder(localUV) * 0.6);
  let vignette = 1.0 - 0.16 * dot(world, world);
  return vec4f(color * vignette, 1.0);
}`;
