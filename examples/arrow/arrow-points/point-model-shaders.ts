// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';

export type PointViewportUniforms = {
  center: [number, number];
  scale: number;
  aspect: number;
  currentTime: number;
  trailLength: number;
  timeEnabled: number;
};

export const pointViewport: ShaderModule<PointViewportUniforms> = {
  name: 'pointViewport',
  uniformTypes: {
    center: 'vec2<f32>',
    scale: 'f32',
    aspect: 'f32',
    currentTime: 'f32',
    trailLength: 'f32',
    timeEnabled: 'f32'
  }
};

export const POINT_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'eventTimes', location: 1, type: 'f32', stepMode: 'instance'},
    {name: 'radii', location: 2, type: 'f32', stepMode: 'instance'},
    {name: 'colors', location: 3, type: 'vec4<u32>', stepMode: 'instance'},
    {name: 'rowIndices', location: 4, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const WGSL_SHADER = /* wgsl */ `\
struct PointViewportUniforms {
  center : vec2<f32>,
  scale : f32,
  aspect : f32,
  currentTime : f32,
  trailLength : f32,
  timeEnabled : f32,
};

@group(0) @binding(auto) var<uniform> pointViewport : PointViewportUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions : vec2<f32>,
  @location(1) eventTimes : f32,
  @location(2) radii : f32,
  @location(3) colors : vec4<u32>,
  @location(4) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) localPosition : vec2<f32>,
  @interpolate(flat)
  @location(2) objectIndex : i32,
};

struct PickingFragmentOutputs {
  @location(0) fragColor : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

fn getTemporalAlpha(eventTime : f32) -> f32 {
  if (pointViewport.timeEnabled < 0.5) {
    return 1.0;
  }
  let age = pointViewport.currentTime - eventTime;
  if (age < 0.0 || age > pointViewport.trailLength) {
    return 0.0;
  }
  let fadeIn = smoothstep(0.0, 1200.0, age);
  let fadeOut = 1.0 - smoothstep(pointViewport.trailLength * 0.62, pointViewport.trailLength, age);
  return max(fadeIn * fadeOut, 0.08);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let centered = (inputs.positions - pointViewport.center) * pointViewport.scale;
  let radius = inputs.radii * pointViewport.scale;
  let clipCenter = vec2<f32>(centered.x / max(pointViewport.aspect, 0.2), centered.y);
  let clipOffset = vec2<f32>(corner.x / max(pointViewport.aspect, 0.2), corner.y) * radius;
  let temporalAlpha = getTemporalAlpha(inputs.eventTimes);

  var outputs : FragmentInputs;
  outputs.Position = vec4<f32>(clipCenter + clipOffset, 0.0, 1.0);
  outputs.color = vec4<f32>(inputs.colors) / 255.0;
  outputs.color.a = outputs.color.a * temporalAlpha;
  outputs.localPosition = corner;
  outputs.objectIndex = i32(inputs.rowIndices);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  if (length(inputs.localPosition) > 1.0 || inputs.color.a <= 0.005) {
    discard;
  }
  let edgeAlpha = 1.0 - smoothstep(0.82, 1.0, length(inputs.localPosition));
  return picking_filterHighlightColor(vec4<f32>(inputs.color.rgb, inputs.color.a * edgeAlpha), inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  if (length(inputs.localPosition) > 1.0 || inputs.color.a <= 0.005) {
    discard;
  }
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

export const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 positions;
in float eventTimes;
in float radii;
in uvec4 colors;
in uint rowIndices;

uniform pointViewportUniforms {
  vec2 center;
  float scale;
  float aspect;
  float currentTime;
  float trailLength;
  float timeEnabled;
} pointViewport;

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

float getTemporalAlpha(float eventTime) {
  if (pointViewport.timeEnabled < 0.5) {
    return 1.0;
  }
  float age = pointViewport.currentTime - eventTime;
  if (age < 0.0 || age > pointViewport.trailLength) {
    return 0.0;
  }
  float fadeIn = smoothstep(0.0, 1200.0, age);
  float fadeOut = 1.0 - smoothstep(pointViewport.trailLength * 0.62, pointViewport.trailLength, age);
  return max(fadeIn * fadeOut, 0.08);
}

void main(void) {
  vec2 corner = getQuadCorner(gl_VertexID % 6);
  vec2 centered = (positions - pointViewport.center) * pointViewport.scale;
  float radius = radii * pointViewport.scale;
  vec2 clipCenter = vec2(centered.x / max(pointViewport.aspect, 0.2), centered.y);
  vec2 clipOffset = vec2(corner.x / max(pointViewport.aspect, 0.2), corner.y) * radius;
  float temporalAlpha = getTemporalAlpha(eventTimes);

  gl_Position = vec4(clipCenter + clipOffset, 0.0, 1.0);
  vColor = vec4(colors) / 255.0;
  vColor.a *= temporalAlpha;
  vLocalPosition = corner;
  picking_setObjectIndex(int(rowIndices));
}
`;

export const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
in vec2 vLocalPosition;
out vec4 fragColor;

void main(void) {
  float radius = length(vLocalPosition);
  if (radius > 1.0 || vColor.a <= 0.005) {
    discard;
  }
  float edgeAlpha = 1.0 - smoothstep(0.82, 1.0, radius);
  fragColor = picking_filterColor(vec4(vColor.rgb, vColor.a * edgeAlpha));
}
`;

export const PICKING_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec4 vColor;
in vec2 vLocalPosition;
layout(location = 0) out vec4 fragColor;
layout(location = 1) out ivec4 pickingColor;

void main(void) {
  if (length(vLocalPosition) > 1.0 || vColor.a <= 0.005) {
    discard;
  }
  fragColor = vec4(0.0);
  pickingColor = picking_getPickingColor();
}
`;
