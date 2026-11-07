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
