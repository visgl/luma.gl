// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const PATTERN_FILL_GLSL = /* glsl */ `
layout(std140) uniform patternFillUniforms {
  int patternType;
  float spacing;
  float width;
  float angle;
  vec2 offset;
} patternFill;

// Integral of a unit-period pulse. Filtering the integral preserves mean coverage at distance.
float patternFill_integral(float coordinate, float width) {
  return floor(coordinate) * width + min(fract(coordinate), width);
}
float patternFill_stripe(float coordinate, float footprint, float width) {
  float extent = max(footprint, 0.0001);
  float center = fract(coordinate + width * 0.5);
  return clamp((patternFill_integral(center + extent * 0.5, width) -
    patternFill_integral(center - extent * 0.5, width)) / extent, 0.0, 1.0);
}

float patternFill_getCoverage(vec2 coordinates) {
  float cosine = cos(patternFill.angle);
  float sine = sin(patternFill.angle);
  vec2 local = coordinates - patternFill.offset;
  vec2 rotated = vec2(dot(local, vec2(cosine, sine)), dot(local, vec2(-sine, cosine)));
  vec2 phase = rotated / max(patternFill.spacing, 0.0001);
  // Evaluate derivatives before pattern selection so WGSL and GLSL use the same footprint.
  vec2 footprint = fwidth(phase);
  float width = clamp(patternFill.width, 0.0, 1.0);
  float first = patternFill_stripe(phase.x, footprint.x, width);
  float second = patternFill_stripe(phase.y, footprint.y, width);
  vec2 cell = fract(phase + 0.5) - 0.5;
  float radius = width * 0.5;
  float dots = clamp(0.5 + (radius - length(cell)) / max(length(footprint), 0.0001), 0.0, 1.0);
  float dotMean = 3.141592653589793 * radius * radius;
  dots = mix(dots, dotMean, smoothstep(0.35, 1.0, max(footprint.x, footprint.y)));
  if (width <= 0.0) return 0.0;
  if (patternFill.patternType == 2) return dots;
  if (patternFill.patternType == 1) return first + second - first * second;
  return first;
}
`;

export const PATTERN_FILL_WGSL = /* wgsl */ `
struct patternFillUniforms {
  patternType: i32,
  spacing: f32,
  width: f32,
  angle: f32,
  offset: vec2<f32>,
};
@group(3) @binding(auto) var<uniform> patternFill: patternFillUniforms;

fn patternFill_integral(coordinate: f32, width: f32) -> f32 {
  return floor(coordinate) * width + min(fract(coordinate), width);
}
fn patternFill_stripe(coordinate: f32, footprint: f32, width: f32) -> f32 {
  let extent = max(footprint, 0.0001);
  let center = fract(coordinate + width * 0.5);
  return clamp((patternFill_integral(center + extent * 0.5, width) -
    patternFill_integral(center - extent * 0.5, width)) / extent, 0.0, 1.0);
}

fn patternFill_getCoverage(coordinates: vec2<f32>) -> f32 {
  let cosine = cos(patternFill.angle);
  let sine = sin(patternFill.angle);
  let local = coordinates - patternFill.offset;
  let rotated = vec2<f32>(dot(local, vec2<f32>(cosine, sine)), dot(local, vec2<f32>(-sine, cosine)));
  let phase = rotated / max(patternFill.spacing, 0.0001);
  let footprint = fwidth(phase);
  let width = clamp(patternFill.width, 0.0, 1.0);
  let first = patternFill_stripe(phase.x, footprint.x, width);
  let second = patternFill_stripe(phase.y, footprint.y, width);
  let cell = fract(phase + 0.5) - 0.5;
  let radius = width * 0.5;
  var dots = clamp(0.5 + (radius - length(cell)) / max(length(footprint), 0.0001), 0.0, 1.0);
  let dotMean = 3.141592653589793 * radius * radius;
  dots = mix(dots, dotMean, smoothstep(0.35, 1.0, max(footprint.x, footprint.y)));
  if (width <= 0.0) { return 0.0; }
  if (patternFill.patternType == 2) { return dots; }
  if (patternFill.patternType == 1) { return first + second - first * second; }
  return first;
}
`;
