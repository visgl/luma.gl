// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type ShaderLayout} from '@luma.gl/core';
import {type ShaderModule} from '@luma.gl/shadertools';
import {TAU} from './arrow-temporal-starfield-data';

type TemporalStarfieldUniforms = {
  currentTimestamp: number;
};

export const temporalStarfield: ShaderModule<TemporalStarfieldUniforms> = {
  name: 'temporalStarfield',
  uniformTypes: {
    currentTimestamp: 'f32'
  }
};

export const STAR_ATTRIBUTE_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'eventStarts', location: 1, type: 'f32', stepMode: 'instance'},
    {name: 'eventDurations', location: 2, type: 'f32', stepMode: 'instance'},
    {name: 'pulsePeriods', location: 3, type: 'f32', stepMode: 'instance'},
    {name: 'starSizes', location: 4, type: 'f32', stepMode: 'instance'},
    {name: 'eventColors', location: 5, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const STAR_STORAGE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'positions', type: 'read-only-storage', group: 1, location: 0},
    {name: 'eventStarts', type: 'read-only-storage', group: 1, location: 1},
    {name: 'eventDurations', type: 'read-only-storage', group: 1, location: 2},
    {name: 'pulsePeriods', type: 'read-only-storage', group: 1, location: 3},
    {name: 'starSizes', type: 'read-only-storage', group: 1, location: 4},
    {name: 'eventColors', type: 'read-only-storage', group: 1, location: 5}
  ]
} satisfies ShaderLayout;

export const RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

export const STAR_ATTRIBUTE_WGSL_SHADER = /* wgsl */ `\
struct TemporalStarfieldUniforms {
  currentTimestamp : f32,
};

@group(0) @binding(auto) var<uniform> temporalStarfield : TemporalStarfieldUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions : vec2<f32>,
  @location(1) eventStarts : f32,
  @location(2) eventDurations : f32,
  @location(3) pulsePeriods : f32,
  @location(4) starSizes : f32,
  @location(5) eventColors : vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) localPosition : vec2<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

fn getStarVisibility(currentTimestamp : f32, eventStart : f32, eventDuration : f32) -> f32 {
  let eventElapsed = currentTimestamp - eventStart;
  if (eventElapsed < 0.0) {
    return 0.0;
  }

  let eventRemaining = eventStart + eventDuration - currentTimestamp;
  if (eventRemaining < 0.0) {
    return 0.025;
  }

  let fadeIn = smoothstep(0.0, 4200.0, eventElapsed);
  let fadeOut = smoothstep(0.0, 5600.0, eventRemaining);
  return max(fadeIn * fadeOut, 0.055);
}

fn getStarPulse(currentTimestamp : f32, eventStart : f32, pulsePeriod : f32) -> f32 {
  let pulsePhase = fract(max(currentTimestamp - eventStart, 0.0) / max(pulsePeriod, 1.0));
  let pulse = 0.5 + 0.5 * sin(pulsePhase * ${TAU} - 1.5707963267948966);
  return mix(0.35, 1.0, pulse);
}

fn getStarPosition(position : vec2<f32>, currentTimestamp : f32) -> vec2<f32> {
  let drift = vec2<f32>(
    sin(currentTimestamp * 0.00009 + position.y * 8.0),
    cos(currentTimestamp * 0.000075 + position.x * 7.0)
  ) * 0.006;
  return position + drift;
}

fn getStarColor(eventColor : vec4<f32>, visibility : f32, pulse : f32) -> vec4<f32> {
  let brightness = mix(0.78, 1.14, pulse);
  let tint = mix(vec3<f32>(0.94, 0.96, 1.0), eventColor.rgb, 0.82);
  let color = min(tint * brightness + vec3<f32>(pulse * 0.02), vec3<f32>(1.0));
  let alpha = visibility * mix(0.68, 0.92, pulse);
  return vec4<f32>(color, alpha);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let eventColor = inputs.eventColors;
  let visibility = getStarVisibility(
    temporalStarfield.currentTimestamp,
    inputs.eventStarts,
    inputs.eventDurations
  );
  let pulse = getStarPulse(
    temporalStarfield.currentTimestamp,
    inputs.eventStarts,
    inputs.pulsePeriods
  );
  let starSize = inputs.starSizes * max(visibility, 0.0) * mix(0.72, 2.4, pulse);
  let starPosition = getStarPosition(inputs.positions, temporalStarfield.currentTimestamp);

  outputs.Position = vec4<f32>(starPosition + corner * starSize, 0.0, 1.0);
  outputs.color = getStarColor(eventColor, visibility, pulse);
  outputs.localPosition = corner;
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let radius = length(inputs.localPosition);
  if (radius > 1.0) {
    discard;
  }

  let glow = 1.0 - smoothstep(0.18, 1.0, radius);
  let core = 1.0 - smoothstep(0.0, 0.44, radius);
  let alpha = inputs.color.a * (glow * 0.62 + core * 0.38);
  return vec4<f32>(inputs.color.rgb * (0.74 + core * 0.34), alpha);
}
`;

export const STAR_STORAGE_WGSL_SHADER = /* wgsl */ `\
struct TemporalStarfieldUniforms {
  currentTimestamp : f32,
};

@group(0) @binding(auto) var<uniform> temporalStarfield : TemporalStarfieldUniforms;
@group(1) @binding(0) var<storage, read> positions : array<vec2<f32>>;
@group(1) @binding(1) var<storage, read> eventStarts : array<f32>;
@group(1) @binding(2) var<storage, read> eventDurations : array<f32>;
@group(1) @binding(3) var<storage, read> pulsePeriods : array<f32>;
@group(1) @binding(4) var<storage, read> starSizes : array<f32>;
@group(1) @binding(5) var<storage, read> eventColors : array<u32>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) localPosition : vec2<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

fn getStarVisibility(currentTimestamp : f32, eventStart : f32, eventDuration : f32) -> f32 {
  let eventElapsed = currentTimestamp - eventStart;
  if (eventElapsed < 0.0) {
    return 0.0;
  }

  let eventRemaining = eventStart + eventDuration - currentTimestamp;
  if (eventRemaining < 0.0) {
    return 0.025;
  }

  let fadeIn = smoothstep(0.0, 4200.0, eventElapsed);
  let fadeOut = smoothstep(0.0, 5600.0, eventRemaining);
  return max(fadeIn * fadeOut, 0.055);
}

fn getStarPulse(currentTimestamp : f32, eventStart : f32, pulsePeriod : f32) -> f32 {
  let pulsePhase = fract(max(currentTimestamp - eventStart, 0.0) / max(pulsePeriod, 1.0));
  let pulse = 0.5 + 0.5 * sin(pulsePhase * ${TAU} - 1.5707963267948966);
  return mix(0.35, 1.0, pulse);
}

fn getStarPosition(position : vec2<f32>, currentTimestamp : f32) -> vec2<f32> {
  let drift = vec2<f32>(
    sin(currentTimestamp * 0.00009 + position.y * 8.0),
    cos(currentTimestamp * 0.000075 + position.x * 7.0)
  ) * 0.006;
  return position + drift;
}

fn getStarColor(eventColor : vec4<f32>, visibility : f32, pulse : f32) -> vec4<f32> {
  let brightness = mix(0.78, 1.14, pulse);
  let tint = mix(vec3<f32>(0.94, 0.96, 1.0), eventColor.rgb, 0.82);
  let color = min(tint * brightness + vec3<f32>(pulse * 0.02), vec3<f32>(1.0));
  let alpha = visibility * mix(0.68, 0.92, pulse);
  return vec4<f32>(color, alpha);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let starIndex = inputs.instanceIndex;
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let eventStart = eventStarts[starIndex];
  let eventDuration = eventDurations[starIndex];
  let pulsePeriod = pulsePeriods[starIndex];
  let eventColor = unpack4x8unorm(eventColors[starIndex]);
  let visibility = getStarVisibility(
    temporalStarfield.currentTimestamp,
    eventStart,
    eventDuration
  );
  let pulse = getStarPulse(temporalStarfield.currentTimestamp, eventStart, pulsePeriod);
  let starSize = starSizes[starIndex] * max(visibility, 0.0) * mix(0.72, 2.4, pulse);
  let starPosition = getStarPosition(positions[starIndex], temporalStarfield.currentTimestamp);

  outputs.Position = vec4<f32>(starPosition + corner * starSize, 0.0, 1.0);
  outputs.color = getStarColor(eventColor, visibility, pulse);
  outputs.localPosition = corner;
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let radius = length(inputs.localPosition);
  if (radius > 1.0) {
    discard;
  }

  let glow = 1.0 - smoothstep(0.18, 1.0, radius);
  let core = 1.0 - smoothstep(0.0, 0.44, radius);
  let alpha = inputs.color.a * (glow * 0.62 + core * 0.38);
  return vec4<f32>(inputs.color.rgb * (0.74 + core * 0.34), alpha);
}
`;

export const STAR_VERTEX_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 positions;
in float eventStarts;
in float eventDurations;
in float pulsePeriods;
in float starSizes;
in vec4 eventColors;

uniform temporalStarfieldUniforms {
  float currentTimestamp;
} temporalStarfield;

out vec4 vColor;
out vec2 vLocalPosition;

vec2 getQuadCorner(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 1) { return vec2(1.0, -1.0); }
  if (vertexIndex == 2) { return vec2(1.0, 1.0); }
  if (vertexIndex == 3) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  return vec2(-1.0, 1.0);
}

float getStarVisibility(float currentTimestamp, float eventStart, float eventDuration) {
  float eventElapsed = currentTimestamp - eventStart;
  if (eventElapsed < 0.0) {
    return 0.0;
  }

  float eventRemaining = eventStart + eventDuration - currentTimestamp;
  if (eventRemaining < 0.0) {
    return 0.025;
  }

  float fadeIn = smoothstep(0.0, 4200.0, eventElapsed);
  float fadeOut = smoothstep(0.0, 5600.0, eventRemaining);
  return max(fadeIn * fadeOut, 0.055);
}

float getStarPulse(float currentTimestamp, float eventStart, float pulsePeriod) {
  float pulsePhase = fract(max(currentTimestamp - eventStart, 0.0) / max(pulsePeriod, 1.0));
  float pulse = 0.5 + 0.5 * sin(pulsePhase * ${TAU} - 1.5707963267948966);
  return mix(0.35, 1.0, pulse);
}

vec2 getStarPosition(vec2 position, float currentTimestamp) {
  vec2 drift = vec2(
    sin(currentTimestamp * 0.00009 + position.y * 8.0),
    cos(currentTimestamp * 0.000075 + position.x * 7.0)
  ) * 0.006;
  return position + drift;
}

vec4 getStarColor(vec4 eventColor, float visibility, float pulse) {
  float brightness = mix(0.78, 1.14, pulse);
  vec3 tint = mix(vec3(0.94, 0.96, 1.0), eventColor.rgb, 0.82);
  vec3 color = min(tint * brightness + vec3(pulse * 0.02), vec3(1.0));
  float alpha = visibility * mix(0.68, 0.92, pulse);
  return vec4(color, alpha);
}

void main() {
  vec2 corner = getQuadCorner(gl_VertexID % 6);
  vec4 eventColor = eventColors;
  float visibility = getStarVisibility(
    temporalStarfield.currentTimestamp,
    eventStarts,
    eventDurations
  );
  float pulse = getStarPulse(
    temporalStarfield.currentTimestamp,
    eventStarts,
    pulsePeriods
  );
  float starSize = starSizes * max(visibility, 0.0) * mix(0.72, 2.4, pulse);
  vec2 starPosition = getStarPosition(positions, temporalStarfield.currentTimestamp);

  gl_Position = vec4(starPosition + corner * starSize, 0.0, 1.0);
  vColor = getStarColor(eventColor, visibility, pulse);
  vLocalPosition = corner;
}
`;

export const STAR_FRAGMENT_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
in vec2 vLocalPosition;
out vec4 fragColor;

void main() {
  float radius = length(vLocalPosition);
  if (radius > 1.0) {
    discard;
  }

  float glow = 1.0 - smoothstep(0.18, 1.0, radius);
  float core = 1.0 - smoothstep(0.0, 0.44, radius);
  float alpha = vColor.a * (glow * 0.62 + core * 0.38);
  fragColor = vec4(vColor.rgb * (0.74 + core * 0.34), alpha);
}
`;
