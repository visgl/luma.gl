// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type ShaderLayout} from '@luma.gl/core';
import {type ShaderModule} from '@luma.gl/shadertools';
import {DAY_COUNT, DAY_MILLISECONDS, SCHEDULE_SPAN_MILLISECONDS} from './arrow-time-columns-data';

type TimeColumnsUniforms = {
  currentTimestamp: number;
};

const BOARD_LEFT = -0.8;
const BOARD_WIDTH = 1.58;
const BOARD_TOP = 0.48;
const LANE_GAP = 0.48;
const LANE_HEIGHT = 0.32;
const BAR_HEIGHT = 0.21;
const CURSOR_WIDTH = 0.02;
const CURSOR_HEIGHT = DAY_COUNT * LANE_GAP + LANE_HEIGHT;

export const timeColumns: ShaderModule<TimeColumnsUniforms> = {
  name: 'timeColumns',
  uniformTypes: {
    currentTimestamp: 'f32'
  }
};

export const EVENT_ATTRIBUTE_SHADER_LAYOUT = {
  attributes: [
    {name: 'eventDates', location: 0, type: 'f32', stepMode: 'instance'},
    {name: 'eventTimes', location: 1, type: 'f32', stepMode: 'instance'},
    {name: 'eventStarts', location: 2, type: 'f32', stepMode: 'instance'},
    {name: 'eventDurations', location: 3, type: 'f32', stepMode: 'instance'},
    {name: 'eventColors', location: 4, type: 'vec4<u32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const EVENT_STORAGE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'eventDates', type: 'read-only-storage', group: 1, location: 0},
    {name: 'eventTimes', type: 'read-only-storage', group: 1, location: 1},
    {name: 'eventStarts', type: 'read-only-storage', group: 1, location: 2},
    {name: 'eventDurations', type: 'read-only-storage', group: 1, location: 3},
    {name: 'eventColors', type: 'read-only-storage', group: 1, location: 4}
  ]
} satisfies ShaderLayout;

export const BOARD_SHADER_LAYOUT = {
  attributes: [],
  bindings: []
} satisfies ShaderLayout;

export const CURSOR_SHADER_LAYOUT = {
  attributes: [],
  bindings: []
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

export const EVENT_ATTRIBUTE_WGSL_SHADER = /* wgsl */ `\
struct TimeColumnsUniforms {
  currentTimestamp : f32,
};

@group(0) @binding(auto) var<uniform> timeColumns : TimeColumnsUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) eventDates : f32,
  @location(1) eventTimes : f32,
  @location(2) eventStarts : f32,
  @location(3) eventDurations : f32,
  @location(4) eventColors : vec4<u32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

fn unpackEventColor(eventColor : vec4<u32>) -> vec4<f32> {
  return vec4<f32>(eventColor) / 255.0;
}

fn getEventColor(
  eventColor : vec4<f32>,
  eventStart : f32,
  eventDuration : f32
) -> vec4<f32> {
  let eventEnd = eventStart + eventDuration;
  var color = vec4<f32>(eventColor.rgb * 0.44, 0.62);
  if (timeColumns.currentTimestamp > eventEnd) {
    color = vec4<f32>(eventColor.rgb * 0.22, 0.28);
  }
  if (
    timeColumns.currentTimestamp >= eventStart &&
    timeColumns.currentTimestamp <= eventEnd
  ) {
    color = vec4<f32>(min(eventColor.rgb * 1.2 + vec3<f32>(0.1), vec3<f32>(1.0)), 1.0);
  }
  return color;
}

fn getEventPosition(
  eventDate : f32,
  eventTime : f32,
  eventDuration : f32,
  corner : vec2<f32>
) -> vec2<f32> {
  let barWidth = max(eventDuration / ${SCHEDULE_SPAN_MILLISECONDS}.0 * ${BOARD_WIDTH}, 0.035);
  let eventCenterX =
    ${BOARD_LEFT} + eventTime / ${SCHEDULE_SPAN_MILLISECONDS}.0 * ${BOARD_WIDTH} + barWidth * 0.5;
  let eventCenterY = ${BOARD_TOP} - eventDate * ${LANE_GAP};
  return vec2<f32>(
    eventCenterX + corner.x * barWidth * 0.5,
    eventCenterY + corner.y * ${BAR_HEIGHT} * 0.5
  );
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let eventColor = unpackEventColor(inputs.eventColors);
  let eventPosition = getEventPosition(
    inputs.eventDates,
    inputs.eventTimes,
    inputs.eventDurations,
    corner
  );

  outputs.Position = vec4<f32>(eventPosition, 0.0, 1.0);
  outputs.color = getEventColor(eventColor, inputs.eventStarts, inputs.eventDurations);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;

export const EVENT_STORAGE_WGSL_SHADER = /* wgsl */ `\
struct TimeColumnsUniforms {
  currentTimestamp : f32,
};

@group(0) @binding(auto) var<uniform> timeColumns : TimeColumnsUniforms;
@group(1) @binding(0) var<storage, read> eventDates : array<f32>;
@group(1) @binding(1) var<storage, read> eventTimes : array<f32>;
@group(1) @binding(2) var<storage, read> eventStarts : array<f32>;
@group(1) @binding(3) var<storage, read> eventDurations : array<f32>;
@group(1) @binding(4) var<storage, read> eventColors : array<u32>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

fn getEventColor(
  eventColor : vec4<f32>,
  eventStart : f32,
  eventDuration : f32
) -> vec4<f32> {
  let eventEnd = eventStart + eventDuration;
  var color = vec4<f32>(eventColor.rgb * 0.44, 0.62);
  if (timeColumns.currentTimestamp > eventEnd) {
    color = vec4<f32>(eventColor.rgb * 0.22, 0.28);
  }
  if (
    timeColumns.currentTimestamp >= eventStart &&
    timeColumns.currentTimestamp <= eventEnd
  ) {
    color = vec4<f32>(min(eventColor.rgb * 1.2 + vec3<f32>(0.1), vec3<f32>(1.0)), 1.0);
  }
  return color;
}

fn getEventPosition(
  eventDate : f32,
  eventTime : f32,
  eventDuration : f32,
  corner : vec2<f32>
) -> vec2<f32> {
  let barWidth = max(eventDuration / ${SCHEDULE_SPAN_MILLISECONDS}.0 * ${BOARD_WIDTH}, 0.035);
  let eventCenterX =
    ${BOARD_LEFT} + eventTime / ${SCHEDULE_SPAN_MILLISECONDS}.0 * ${BOARD_WIDTH} + barWidth * 0.5;
  let eventCenterY = ${BOARD_TOP} - eventDate * ${LANE_GAP};
  return vec2<f32>(
    eventCenterX + corner.x * barWidth * 0.5,
    eventCenterY + corner.y * ${BAR_HEIGHT} * 0.5
  );
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let eventIndex = inputs.instanceIndex;
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let eventDate = eventDates[eventIndex];
  let eventTime = eventTimes[eventIndex];
  let eventStart = eventStarts[eventIndex];
  let eventDuration = eventDurations[eventIndex];
  let eventColor = unpack4x8unorm(eventColors[eventIndex]);
  let eventPosition = getEventPosition(eventDate, eventTime, eventDuration, corner);

  outputs.Position = vec4<f32>(eventPosition, 0.0, 1.0);
  outputs.color = getEventColor(eventColor, eventStart, eventDuration);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;

export const EVENT_VERTEX_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in float eventDates;
in float eventTimes;
in float eventStarts;
in float eventDurations;
in uvec4 eventColors;

uniform timeColumnsUniforms {
  float currentTimestamp;
} timeColumns;

out vec4 vColor;

vec2 getQuadCorner(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 1) { return vec2(1.0, -1.0); }
  if (vertexIndex == 2) { return vec2(1.0, 1.0); }
  if (vertexIndex == 3) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  return vec2(-1.0, 1.0);
}

vec4 unpackEventColor(uvec4 eventColor) {
  return vec4(eventColor) / 255.0;
}

vec4 getEventColor(vec4 eventColor, float eventStart, float eventDuration) {
  float eventEnd = eventStart + eventDuration;
  vec4 color = vec4(eventColor.rgb * 0.44, 0.62);
  if (timeColumns.currentTimestamp > eventEnd) {
    color = vec4(eventColor.rgb * 0.22, 0.28);
  }
  if (
    timeColumns.currentTimestamp >= eventStart &&
    timeColumns.currentTimestamp <= eventEnd
  ) {
    color = vec4(min(eventColor.rgb * 1.2 + vec3(0.1), vec3(1.0)), 1.0);
  }
  return color;
}

vec2 getEventPosition(float eventDate, float eventTime, float eventDuration, vec2 corner) {
  float barWidth = max(eventDuration / ${SCHEDULE_SPAN_MILLISECONDS}.0 * ${BOARD_WIDTH}, 0.035);
  float eventCenterX =
    ${BOARD_LEFT} + eventTime / ${SCHEDULE_SPAN_MILLISECONDS}.0 * ${BOARD_WIDTH} + barWidth * 0.5;
  float eventCenterY = ${BOARD_TOP} - eventDate * ${LANE_GAP};
  return vec2(
    eventCenterX + corner.x * barWidth * 0.5,
    eventCenterY + corner.y * ${BAR_HEIGHT} * 0.5
  );
}

void main() {
  vec2 corner = getQuadCorner(gl_VertexID % 6);
  vec4 eventColor = unpackEventColor(eventColors);
  vec2 eventPosition = getEventPosition(eventDates, eventTimes, eventDurations, corner);

  gl_Position = vec4(eventPosition, 0.0, 1.0);
  vColor = getEventColor(eventColor, eventStarts, eventDurations);
}
`;

export const EVENT_FRAGMENT_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = vColor;
}
`;

export const BOARD_WGSL_SHADER = /* wgsl */ `\
struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let laneIndex = f32(inputs.instanceIndex);
  let laneCenterY = ${BOARD_TOP} - laneIndex * ${LANE_GAP};
  let laneCenterX = ${BOARD_LEFT} + ${BOARD_WIDTH} * 0.5;
  let position = vec2<f32>(
    laneCenterX + corner.x * ${BOARD_WIDTH} * 0.5,
    laneCenterY + corner.y * ${LANE_HEIGHT} * 0.5
  );
  let lanePhase = f32(inputs.instanceIndex % 2u);

  outputs.Position = vec4<f32>(position, 0.0, 1.0);
  outputs.color = vec4<f32>(0.08 + lanePhase * 0.025, 0.12 + lanePhase * 0.02, 0.2, 0.9);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;

export const BOARD_VERTEX_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

out vec4 vColor;

vec2 getQuadCorner(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 1) { return vec2(1.0, -1.0); }
  if (vertexIndex == 2) { return vec2(1.0, 1.0); }
  if (vertexIndex == 3) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  return vec2(-1.0, 1.0);
}

void main() {
  vec2 corner = getQuadCorner(gl_VertexID % 6);
  float laneIndex = float(gl_InstanceID);
  float laneCenterY = ${BOARD_TOP} - laneIndex * ${LANE_GAP};
  float laneCenterX = ${BOARD_LEFT} + ${BOARD_WIDTH} * 0.5;
  vec2 position = vec2(
    laneCenterX + corner.x * ${BOARD_WIDTH} * 0.5,
    laneCenterY + corner.y * ${LANE_HEIGHT} * 0.5
  );
  float lanePhase = float(gl_InstanceID % 2);

  gl_Position = vec4(position, 0.0, 1.0);
  vColor = vec4(0.08 + lanePhase * 0.025, 0.12 + lanePhase * 0.02, 0.2, 0.9);
}
`;

export const CURSOR_WGSL_SHADER = /* wgsl */ `\
struct TimeColumnsUniforms {
  currentTimestamp : f32,
};

@group(0) @binding(auto) var<uniform> timeColumns : TimeColumnsUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let currentDay = floor(timeColumns.currentTimestamp / ${DAY_MILLISECONDS}.0);
  let currentTime = timeColumns.currentTimestamp - currentDay * ${DAY_MILLISECONDS}.0;
  let cursorCenterX = ${BOARD_LEFT} + currentTime / ${SCHEDULE_SPAN_MILLISECONDS}.0 * ${BOARD_WIDTH};
  let cursorCenterY = ${BOARD_TOP} - currentDay * ${LANE_GAP};
  let position = vec2<f32>(
    cursorCenterX + corner.x * ${CURSOR_WIDTH} * 0.5,
    cursorCenterY + corner.y * ${CURSOR_HEIGHT} * 0.5
  );

  outputs.Position = vec4<f32>(position, 0.0, 1.0);
  outputs.color = vec4<f32>(0.98, 0.99, 1.0, 0.94);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;

export const CURSOR_VERTEX_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform timeColumnsUniforms {
  float currentTimestamp;
} timeColumns;

out vec4 vColor;

vec2 getQuadCorner(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 1) { return vec2(1.0, -1.0); }
  if (vertexIndex == 2) { return vec2(1.0, 1.0); }
  if (vertexIndex == 3) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  return vec2(-1.0, 1.0);
}

void main() {
  vec2 corner = getQuadCorner(gl_VertexID % 6);
  float currentDay = floor(timeColumns.currentTimestamp / ${DAY_MILLISECONDS}.0);
  float currentTime = timeColumns.currentTimestamp - currentDay * ${DAY_MILLISECONDS}.0;
  float cursorCenterX = ${BOARD_LEFT} + currentTime / ${SCHEDULE_SPAN_MILLISECONDS}.0 * ${BOARD_WIDTH};
  float cursorCenterY = ${BOARD_TOP} - currentDay * ${LANE_GAP};
  vec2 position = vec2(
    cursorCenterX + corner.x * ${CURSOR_WIDTH} * 0.5,
    cursorCenterY + corner.y * ${CURSOR_HEIGHT} * 0.5
  );

  gl_Position = vec4(position, 0.0, 1.0);
  vColor = vec4(0.98, 0.99, 1.0, 0.94);
}
`;
