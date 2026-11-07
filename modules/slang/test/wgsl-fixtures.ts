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
  'var value = vec3f(1.0, 2.0, 4.0); value /= 2.0; let reciprocal = 2.0 / value; let large: f32 = 1e21 + 0.0; let bits: u32 = 1 | 2; return vec4f(reciprocal * 0.1, (large / 1e21) * f32(bits) / 3.0);'
);

export const WGSL_ORDER_SHADER = `${WGSL_RENDER_SHADER.split('@fragment')[0]}
var<private> calls:i32;
fn next()->f32 {calls++;return f32(calls) * 0.1;}
fn pair(first:f32, second:f32)->f32 {return first * 2.0 + second;}
@fragment fn fragmentMain(@location(0) color:vec3f)->@location(0) vec4f {
  let chosen=select(next(),next(),false);
  let ordered=pair(next(),next());
  let shortCircuit=false && next()>0.0;
  let matrix=mat2x3f(vec3f(1.0,0.0,0.0),vec3f(0.0,1.0,0.0));
  let result=matrix * vec2f(chosen,ordered);
  return vec4f(result.xy,f32(calls) * 0.1,1.0);
}`;
