// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const WGSL_RENDER_SHADER = `
struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
}
fn makeColor(color: vec3<f32>) -> vec4<f32> {
  return vec4<f32>(color * 1.0, 1.0);
}
@vertex fn vertexMain(@location(0) position: vec2<f32>, @location(1) color: vec3<f32>) -> Varyings {
  var result: Varyings;
  result.position = vec4<f32>(position, 0.25, 1.0);
  result.color = color;
  return result;
}
@fragment fn fragmentMain(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  let result = makeColor(color);
  return result;
}
`;

export const WGSL_CONSTANT_SHADER = WGSL_RENDER_SHADER.replace(
  'let result = makeColor(color);\n  return result;',
  'return vec4f(1 / 2, 16777217 - 16777216, (2147483647 + 1) - 2147483647, 1.0);'
);

export const WGSL_DIVISION_SHADER = WGSL_RENDER_SHADER.replace(
  'let result = makeColor(color);\n  return result;',
  'var value = vec3f(1.0, 2.0, 4.0); value /= 2.0; let reciprocal = 2.0 / value; let large: f32 = 1e21 + 0.0; return vec4f(reciprocal * 0.1, large / 1e21);'
);
