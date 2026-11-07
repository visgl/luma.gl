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
  var shift=32u;let bits=1u << shift;
  let chosen=select(next(),next(),false);
  let ordered=pair(next(),next());
  let shortCircuit=false && next()>0.0;
  let matrix=mat2x3f(vec3f(1.0,0.0,0.0),vec3f(0.0,1.0,0.0));
  let result=matrix * vec2f(chosen,ordered);
  return vec4f(result.xy,f32(calls) * 0.1,f32(bits));
}`;

export const WGSL_TEXTURE_ORDER_SHADER = `${WGSL_RENDER_SHADER.split('@fragment')[0]}
@group(0) @binding(1) var image:texture_2d<f32>;
@group(0) @binding(2) var filtering:sampler;
var<private> coordinates:vec2f;
fn gradient()->vec2f {coordinates=vec2f(0.75,0.25);return vec2f(0.0);}
@fragment fn fragmentMain(@location(0) color:vec3f)->@location(0) vec4f {
  coordinates=vec2f(0.25);
  return textureSampleGrad(image,filtering,coordinates,gradient(),vec2f(0.0));
}`;

export const WGSL_LANGUAGE_CONSTANT_SHADER = `${WGSL_RENDER_SHADER.split('@fragment')[0]}
const FORWARD=BASE+1;
const BASE:i32=2;
const CASE:u32=1u;
const N=1;
@fragment fn fragmentMain(@location(0) color:vec3f)->@location(0) vec4f {
  var key=1u;var amount=0.0;let values=array<f32,BASE>(0.2,0.4);
  switch key {case CASE:{amount=f32(min(N,2u))*0.25;}default:{amount=0.0;}}
  return vec4f(f32(FORWARD)*0.1,amount,values[0],1.0);
}`;

export const WGSL_INTEGER_SIGN_SHADER = `${WGSL_RENDER_SHADER.split('@fragment')[0]}
@fragment fn fragmentMain(@location(0) color:vec3f)->@location(0) vec4f {
  let signed=sign(vec3i(-1,0,1));
  return vec4f(vec3f(signed)*0.5+vec3f(0.5),f32(sign(1i)));
}`;

export const WGSL_ARRAY_LOGIC_SHADER = `${WGSL_RENDER_SHADER.split('@fragment')[0]}
const COUNT=2;
const ENABLED=true && false;
fn first(values:array<f32,2>)->f32 {return later(values);}
fn later(values:array<f32,COUNT>)->f32 {return values[0];}
@fragment fn fragmentMain(@location(0) color:vec3f)->@location(0) vec4f {
  let original=array<f32,2>(0.2,0.3);var copied=original;copied=original;
  var value=1i;var count=1u;let shifted=value << count;
  return vec4f(first(copied),f32(shifted)*0.1,select(0.3,0.4,ENABLED),1.0);
}`;
