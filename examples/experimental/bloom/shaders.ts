// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';

export type SceneUniforms = {
  time: number;
  aspect: number;
};

export const sceneShaderModule = {
  name: 'scene',
  uniformTypes: {
    time: 'f32',
    aspect: 'f32'
  }
} as const satisfies ShaderModule<SceneUniforms>;

export const SCENE_WGSL = /* wgsl */ `\
struct SceneUniforms {
  time: f32,
  aspect: f32,
};

@group(0) @binding(auto) var<uniform> sceneUniforms: SceneUniforms;

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn rotate(position: vec2f, angle: f32) -> vec2f {
  let cosine = cos(angle);
  let sine = sin(angle);
  return vec2f(
    position.x * cosine - position.y * sine,
    position.x * sine + position.y * cosine
  );
}

fn hash(position: vec2f) -> f32 {
  return fract(sin(dot(position, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn makeStar(position: vec2f) -> f32 {
  let starPosition = position * vec2f(32.0, 24.0);
  let starCell = floor(starPosition);
  let starOffset = fract(starPosition) - vec2f(0.5);
  let starValue = hash(starCell);
  let starRadius = mix(0.018, 0.055, hash(starCell + vec2f(19.0, 7.0)));
  let star = 1.0 - smoothstep(starRadius * 0.2, starRadius, length(starOffset));
  return select(0.0, star * mix(0.32, 1.5, starValue), starValue > 0.94);
}

fn makeEmitter(
  position: vec2f,
  center: vec2f,
  radius: f32,
  color: vec3f,
  radiance: f32
) -> vec3f {
  let distance = length(position - center);
  let core = exp(-distance * distance / max(radius * radius, 0.00001));
  let halo = exp(-distance * distance / max(radius * radius * 18.0, 0.00001));
  return color * (core * radiance + halo * radiance * 0.11);
}

fn makeRing(position: vec2f, center: vec2f, radius: f32, width: f32) -> f32 {
  let distance = abs(length(position - center) - radius);
  return exp(-distance / max(width, 0.00001));
}

fn makeRibbon(position: vec2f, phase: f32, slope: f32) -> f32 {
  let wave = sin(position.x * 4.8 + phase) * 0.12 + sin(position.x * 11.5 - phase * 0.7) * 0.028;
  let distance = abs(position.y - wave - slope * position.x);
  return exp(-distance * 95.0);
}

fn makeSceneColor(position: vec2f) -> vec3f {
  let time = sceneUniforms.time;
  let warpedPosition = rotate(position, sin(time * 0.19) * 0.08);
  let vignette = saturate(1.0 - dot(warpedPosition, warpedPosition) * 0.34);
  let star = makeStar(warpedPosition + vec2f(time * 0.012, 0.0));
  let background = mix(
    vec3f(0.006, 0.008, 0.018),
    vec3f(0.026, 0.038, 0.092),
    saturate(position.y * 0.5 + 0.5)
  );
  var color = background * (0.58 + vignette * 0.42) + vec3f(star);

  let emitterA = vec2f(sin(time * 0.72) * 0.62, cos(time * 0.53) * 0.24);
  let emitterB = vec2f(cos(time * 0.47 + 1.2) * 0.78, sin(time * 0.64) * 0.34);
  let emitterC = vec2f(sin(time * 0.31 + 2.4) * 0.32, cos(time * 0.88 + 0.7) * 0.48);

  color += makeEmitter(warpedPosition, emitterA, 0.045, vec3f(0.22, 0.84, 1.0), 13.0);
  color += makeEmitter(warpedPosition, emitterB, 0.055, vec3f(1.0, 0.36, 0.12), 10.5);
  color += makeEmitter(warpedPosition, emitterC, 0.038, vec3f(0.95, 0.92, 0.72), 16.0);

  let orbitalCenter = vec2f(0.0, 0.04);
  let coolRing = makeRing(warpedPosition, orbitalCenter, 0.42 + sin(time * 0.44) * 0.025, 0.016);
  let warmRing = makeRing(warpedPosition, orbitalCenter, 0.72 + cos(time * 0.36) * 0.035, 0.022);
  color += vec3f(0.12, 0.76, 1.0) * coolRing * 4.0;
  color += vec3f(1.0, 0.44, 0.12) * warmRing * 3.4;

  let ribbonPosition = rotate(warpedPosition, -0.26);
  let coolRibbon = makeRibbon(ribbonPosition, time * 1.4, -0.06);
  let warmRibbon = makeRibbon(rotate(warpedPosition, 0.34), -time * 1.1, 0.08);
  color += vec3f(0.18, 0.72, 1.0) * coolRibbon * 2.8;
  color += vec3f(1.0, 0.32, 0.08) * warmRibbon * 2.2;

  let floorCoordinate = position.y + 0.78;
  let gridFade = exp(-abs(floorCoordinate) * 7.0);
  let gridLine = exp(-abs(fract((position.x + time * 0.05) * 8.0) - 0.5) * 42.0);
  color += vec3f(0.08, 0.22, 0.42) * gridFade * (0.12 + gridLine * 0.52);

  return color;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let position = vec2f(inputs.position.x * sceneUniforms.aspect, inputs.position.y);
  return vec4f(makeSceneColor(position), 1.0);
}
`;

export const SCENE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform sceneUniforms {
  float time;
  float aspect;
} scene;

in vec2 position;
out vec4 fragColor;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

vec2 rotatePosition(vec2 positionValue, float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  return vec2(
    positionValue.x * cosine - positionValue.y * sine,
    positionValue.x * sine + positionValue.y * cosine
  );
}

float hash(vec2 positionValue) {
  return fract(sin(dot(positionValue, vec2(127.1, 311.7))) * 43758.5453123);
}

float makeStar(vec2 positionValue) {
  vec2 starPosition = positionValue * vec2(32.0, 24.0);
  vec2 starCell = floor(starPosition);
  vec2 starOffset = fract(starPosition) - vec2(0.5);
  float starValue = hash(starCell);
  float starRadius = mix(0.018, 0.055, hash(starCell + vec2(19.0, 7.0)));
  float star = 1.0 - smoothstep(starRadius * 0.2, starRadius, length(starOffset));
  return starValue > 0.94 ? star * mix(0.32, 1.5, starValue) : 0.0;
}

vec3 makeEmitter(
  vec2 positionValue,
  vec2 center,
  float radius,
  vec3 color,
  float radiance
) {
  float distance = length(positionValue - center);
  float core = exp(-distance * distance / max(radius * radius, 0.00001));
  float halo = exp(-distance * distance / max(radius * radius * 18.0, 0.00001));
  return color * (core * radiance + halo * radiance * 0.11);
}

float makeRing(vec2 positionValue, vec2 center, float radius, float width) {
  float distance = abs(length(positionValue - center) - radius);
  return exp(-distance / max(width, 0.00001));
}

float makeRibbon(vec2 positionValue, float phase, float slope) {
  float wave = sin(positionValue.x * 4.8 + phase) * 0.12 +
    sin(positionValue.x * 11.5 - phase * 0.7) * 0.028;
  float distance = abs(positionValue.y - wave - slope * positionValue.x);
  return exp(-distance * 95.0);
}

vec3 makeSceneColor(vec2 positionValue) {
  float time = scene.time;
  vec2 warpedPosition = rotatePosition(positionValue, sin(time * 0.19) * 0.08);
  float vignette = saturate(1.0 - dot(warpedPosition, warpedPosition) * 0.34);
  float star = makeStar(warpedPosition + vec2(time * 0.012, 0.0));
  vec3 background = mix(
    vec3(0.006, 0.008, 0.018),
    vec3(0.026, 0.038, 0.092),
    saturate(positionValue.y * 0.5 + 0.5)
  );
  vec3 color = background * (0.58 + vignette * 0.42) + vec3(star);

  vec2 emitterA = vec2(sin(time * 0.72) * 0.62, cos(time * 0.53) * 0.24);
  vec2 emitterB = vec2(cos(time * 0.47 + 1.2) * 0.78, sin(time * 0.64) * 0.34);
  vec2 emitterC = vec2(sin(time * 0.31 + 2.4) * 0.32, cos(time * 0.88 + 0.7) * 0.48);

  color += makeEmitter(warpedPosition, emitterA, 0.045, vec3(0.22, 0.84, 1.0), 13.0);
  color += makeEmitter(warpedPosition, emitterB, 0.055, vec3(1.0, 0.36, 0.12), 10.5);
  color += makeEmitter(warpedPosition, emitterC, 0.038, vec3(0.95, 0.92, 0.72), 16.0);

  vec2 orbitalCenter = vec2(0.0, 0.04);
  float coolRing = makeRing(warpedPosition, orbitalCenter, 0.42 + sin(time * 0.44) * 0.025, 0.016);
  float warmRing = makeRing(warpedPosition, orbitalCenter, 0.72 + cos(time * 0.36) * 0.035, 0.022);
  color += vec3(0.12, 0.76, 1.0) * coolRing * 4.0;
  color += vec3(1.0, 0.44, 0.12) * warmRing * 3.4;

  vec2 ribbonPosition = rotatePosition(warpedPosition, -0.26);
  float coolRibbon = makeRibbon(ribbonPosition, time * 1.4, -0.06);
  float warmRibbon = makeRibbon(rotatePosition(warpedPosition, 0.34), -time * 1.1, 0.08);
  color += vec3(0.18, 0.72, 1.0) * coolRibbon * 2.8;
  color += vec3(1.0, 0.32, 0.08) * warmRibbon * 2.2;

  float floorCoordinate = positionValue.y + 0.78;
  float gridFade = exp(-abs(floorCoordinate) * 7.0);
  float gridLine = exp(-abs(fract((positionValue.x + time * 0.05) * 8.0) - 0.5) * 42.0);
  color += vec3(0.08, 0.22, 0.42) * gridFade * (0.12 + gridLine * 0.52);

  return color;
}

void main(void) {
  vec2 scenePosition = vec2(position.x * scene.aspect, position.y);
  fragColor = vec4(makeSceneColor(scenePosition), 1.0);
}
`;
