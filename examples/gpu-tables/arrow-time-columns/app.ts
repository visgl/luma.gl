// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ArrowModel,
  makeArrowFixedSizeListVector,
  makeArrowGPUVector,
  prepareArrowTemporalGPUVectors,
  type PreparedArrowTemporalGPUVector
} from '@luma.gl/arrow';
import {type Device, type ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model, ShaderInputs} from '@luma.gl/engine';
import {GPUTable, type GPUVector} from '@luma.gl/tables';
import {type ShaderModule} from '@luma.gl/shadertools';
import * as arrow from 'apache-arrow';

export const title = 'Time: Date/Time/Timestamp/Duration';
export const description =
  'Scalar Arrow temporal columns normalized to relative Float32 GPU rows for attribute-backed and storage-backed schedule rendering.';

const RENDER_MODE_SELECTOR_ID = 'arrow-time-columns-render-mode';
const PREPARATION_PATH_ID = 'arrow-time-columns-preparation-path';
const CURRENT_TIMESTAMP_ID = 'arrow-time-columns-current-timestamp';
const DATE_ORIGIN_ID = 'arrow-time-columns-date-origin';
const TIME_ORIGIN_ID = 'arrow-time-columns-time-origin';
const TIMESTAMP_ORIGIN_ID = 'arrow-time-columns-timestamp-origin';
const DURATION_ORIGIN_ID = 'arrow-time-columns-duration-origin';

const DAY_COUNT = 3;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const HOUR_MILLISECONDS = 60 * 60 * 1000;
const MINUTE_MILLISECONDS = 60 * 1000;
const SCHEDULE_START_TIME_MILLISECONDS = 8 * HOUR_MILLISECONDS;
const SCHEDULE_SPAN_MILLISECONDS = 8 * HOUR_MILLISECONDS;
const SCHEDULE_SWEEP_MILLISECONDS = DAY_COUNT * SCHEDULE_SPAN_MILLISECONDS;
const CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND = 3 * HOUR_MILLISECONDS;
const SOURCE_DATE_ORIGIN_MILLISECONDS = Date.UTC(2026, 4, 22);
const SOURCE_DATE_ORIGIN_DAYS = SOURCE_DATE_ORIGIN_MILLISECONDS / DAY_MILLISECONDS;
const SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS = Date.UTC(2026, 4, 22, 8);
const EVENT_COUNT = 12;

const BOARD_LEFT = -0.8;
const BOARD_WIDTH = 1.58;
const BOARD_TOP = 0.48;
const LANE_GAP = 0.48;
const LANE_HEIGHT = 0.32;
const BAR_HEIGHT = 0.21;
const CURSOR_WIDTH = 0.02;
const CURSOR_HEIGHT = DAY_COUNT * LANE_GAP + LANE_HEIGHT;

type TimeColumnsRenderMode = 'attributes' | 'storage';
type TemporalColumnName = 'eventDates' | 'eventTimes' | 'eventStarts' | 'eventDurations';
type TemporalSourceVectors = {
  eventDates: arrow.Vector<arrow.DateDay>;
  eventTimes: arrow.Vector<arrow.TimeMillisecond>;
  eventStarts: arrow.Vector<arrow.TimestampMillisecond>;
  eventDurations: arrow.Vector<arrow.DurationMillisecond>;
};
type PreparedTemporalColumns = Record<TemporalColumnName, PreparedArrowTemporalGPUVector>;
type TimeColumnsTableInput = {
  table: GPUTable;
  temporalColumns: PreparedTemporalColumns;
  timestampOriginMilliseconds: number;
  destroy: () => void;
};
type ActiveTimeColumnsModel = ArrowModel | Model;
type EventSpec = {
  dayIndex: number;
  startMinute: number;
  durationMinute: number;
  color: [number, number, number, number];
};
type TimeColumnsUniforms = {
  currentTimestamp: number;
};

const EVENT_SPECS: EventSpec[] = [
  {dayIndex: 0, startMinute: 0, durationMinute: 72, color: [52, 211, 153, 255]},
  {dayIndex: 0, startMinute: 105, durationMinute: 58, color: [56, 189, 248, 255]},
  {dayIndex: 0, startMinute: 210, durationMinute: 92, color: [251, 191, 36, 255]},
  {dayIndex: 0, startMinute: 340, durationMinute: 64, color: [244, 114, 182, 255]},
  {dayIndex: 1, startMinute: 20, durationMinute: 80, color: [129, 140, 248, 255]},
  {dayIndex: 1, startMinute: 140, durationMinute: 46, color: [45, 212, 191, 255]},
  {dayIndex: 1, startMinute: 230, durationMinute: 110, color: [251, 146, 60, 255]},
  {dayIndex: 1, startMinute: 375, durationMinute: 44, color: [248, 113, 113, 255]},
  {dayIndex: 2, startMinute: 35, durationMinute: 55, color: [96, 165, 250, 255]},
  {dayIndex: 2, startMinute: 125, durationMinute: 88, color: [167, 139, 250, 255]},
  {dayIndex: 2, startMinute: 255, durationMinute: 72, color: [74, 222, 128, 255]},
  {dayIndex: 2, startMinute: 365, durationMinute: 82, color: [250, 204, 21, 255]}
];

const timeColumns: ShaderModule<TimeColumnsUniforms> = {
  name: 'timeColumns',
  uniformTypes: {
    currentTimestamp: 'f32'
  }
};

const EVENT_ATTRIBUTE_SHADER_LAYOUT = {
  attributes: [
    {name: 'eventDates', location: 0, type: 'f32', stepMode: 'instance'},
    {name: 'eventTimes', location: 1, type: 'f32', stepMode: 'instance'},
    {name: 'eventStarts', location: 2, type: 'f32', stepMode: 'instance'},
    {name: 'eventDurations', location: 3, type: 'f32', stepMode: 'instance'},
    {name: 'eventColors', location: 4, type: 'vec4<u32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const EVENT_STORAGE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'eventDates', type: 'read-only-storage', group: 1, location: 0},
    {name: 'eventTimes', type: 'read-only-storage', group: 1, location: 1},
    {name: 'eventStarts', type: 'read-only-storage', group: 1, location: 2},
    {name: 'eventDurations', type: 'read-only-storage', group: 1, location: 3},
    {name: 'eventColors', type: 'read-only-storage', group: 1, location: 4}
  ]
} satisfies ShaderLayout;

const BOARD_SHADER_LAYOUT = {
  attributes: [],
  bindings: []
} satisfies ShaderLayout;

const CURSOR_SHADER_LAYOUT = {
  attributes: [],
  bindings: []
} satisfies ShaderLayout;

const RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

const EVENT_ATTRIBUTE_WGSL_SHADER = /* wgsl */ `\
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

const EVENT_STORAGE_WGSL_SHADER = /* wgsl */ `\
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

const EVENT_VERTEX_GLSL_SHADER = /* glsl */ `\
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

const EVENT_FRAGMENT_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = vColor;
}
`;

const BOARD_WGSL_SHADER = /* wgsl */ `\
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

const BOARD_VERTEX_GLSL_SHADER = /* glsl */ `\
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

const CURSOR_WGSL_SHADER = /* wgsl */ `\
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

const CURSOR_VERTEX_GLSL_SHADER = /* glsl */ `\
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

export default class ArrowTimeColumnsAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>Prepares Arrow <code>Date</code>, <code>Time</code>, <code>Timestamp</code>, and <code>Duration</code> columns as relative <code>Float32</code> GPU rows.</p>
<div style="display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 0.7rem; align-items: center;">
  <label for="${RENDER_MODE_SELECTOR_ID}">Render</label>
  <select id="${RENDER_MODE_SELECTOR_ID}">
    <option value="attributes">Attributes</option>
    <option value="storage">Storage</option>
  </select>
  <span>Prepare</span>
  <strong id="${PREPARATION_PATH_ID}"></strong>
  <span>Current</span>
  <strong id="${CURRENT_TIMESTAMP_ID}"></strong>
</div>
<div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0.35rem 0.7rem; margin-top: 0.65rem; font-size: 0.78rem;">
  <strong>Column</strong>
  <strong>Prepared / origin</strong>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventDates: DateDay</code>
  <span><code>Float32 day</code><br><span id="${DATE_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventTimes: TimeMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${TIME_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventStarts: TimestampMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${TIMESTAMP_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventDurations: DurationMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${DURATION_ORIGIN_ID}"></span></span>
</div>
`;

  readonly device: Device;
  readonly shaderInputs = new ShaderInputs<{timeColumns: typeof timeColumns.props}>({
    timeColumns
  });
  activeRenderMode: TimeColumnsRenderMode;
  timeColumnsTableInput: TimeColumnsTableInput | null = null;
  boardModel: Model | null = null;
  eventModel: ActiveTimeColumnsModel | null = null;
  cursorModel: Model | null = null;
  renderModeSelector: HTMLSelectElement | null = null;
  preparationPathLabel: HTMLElement | null = null;
  currentTimestampLabel: HTMLElement | null = null;
  dateOriginLabel: HTMLElement | null = null;
  timeOriginLabel: HTMLElement | null = null;
  timestampOriginLabel: HTMLElement | null = null;
  durationOriginLabel: HTMLElement | null = null;
  currentScheduleMilliseconds = 0;
  lastRenderSeconds: number | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.activeRenderMode = this.device.type === 'webgpu' ? 'storage' : 'attributes';
  }

  override async onInitialize(): Promise<void> {
    this.timeColumnsTableInput = await makeTimeColumnsTableInput(this.device);
    this.boardModel = this.createBoardModel();
    this.eventModel = this.createEventModel(this.timeColumnsTableInput, this.activeRenderMode);
    this.cursorModel = this.createCursorModel();
    this.initializeControls();
    this.initializeLabels();
    this.updateLabels();
  }

  override onRender({device, time}: AnimationProps): void {
    if (!this.boardModel || !this.eventModel || !this.cursorModel || !this.timeColumnsTableInput) {
      return;
    }

    const seconds = time / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    this.currentScheduleMilliseconds =
      (this.currentScheduleMilliseconds +
        elapsedSeconds * CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND) %
      SCHEDULE_SWEEP_MILLISECONDS;
    const currentTimestamp = getCurrentTimestampMilliseconds(this.currentScheduleMilliseconds);

    this.shaderInputs.setProps({
      timeColumns: {
        currentTimestamp
      }
    });
    this.updateCurrentTimestampLabel(currentTimestamp);

    const renderPass = device.beginRenderPass({
      clearColor: [0.025, 0.04, 0.075, 1]
    });
    this.boardModel.draw(renderPass);
    this.eventModel.draw(renderPass);
    this.cursorModel.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.renderModeSelector?.removeEventListener('change', this.handleRenderModeSelection);
    this.cursorModel?.destroy();
    this.eventModel?.destroy();
    this.boardModel?.destroy();
    this.timeColumnsTableInput?.destroy();
  }

  createBoardModel(): Model {
    return new Model(this.device, {
      id: 'arrow-time-columns-board',
      source: BOARD_WGSL_SHADER,
      vs: BOARD_VERTEX_GLSL_SHADER,
      fs: EVENT_FRAGMENT_GLSL_SHADER,
      shaderLayout: BOARD_SHADER_LAYOUT,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: DAY_COUNT,
      parameters: RENDER_PARAMETERS
    });
  }

  createEventModel(
    timeColumnsTableInput: TimeColumnsTableInput,
    renderMode: TimeColumnsRenderMode
  ): ActiveTimeColumnsModel {
    if (renderMode === 'storage') {
      if (this.device.type !== 'webgpu') {
        throw new Error('Time column storage rendering requires WebGPU');
      }
      return new Model(this.device, {
        id: 'arrow-time-columns-events-storage',
        source: EVENT_STORAGE_WGSL_SHADER,
        shaderLayout: EVENT_STORAGE_SHADER_LAYOUT,
        shaderInputs: this.shaderInputs,
        bindings: getTimeColumnsStorageBindings(timeColumnsTableInput.table),
        topology: 'triangle-list',
        isInstanced: true,
        vertexCount: 6,
        instanceCount: EVENT_COUNT,
        parameters: RENDER_PARAMETERS
      });
    }

    return new ArrowModel(this.device, {
      id: 'arrow-time-columns-events-attributes',
      arrowGPUTable: timeColumnsTableInput.table,
      arrowCount: 'instance',
      source: EVENT_ATTRIBUTE_WGSL_SHADER,
      vs: EVENT_VERTEX_GLSL_SHADER,
      fs: EVENT_FRAGMENT_GLSL_SHADER,
      shaderLayout: EVENT_ATTRIBUTE_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      topology: 'triangle-list',
      vertexCount: 6,
      parameters: RENDER_PARAMETERS
    });
  }

  createCursorModel(): Model {
    return new Model(this.device, {
      id: 'arrow-time-columns-cursor',
      source: CURSOR_WGSL_SHADER,
      vs: CURSOR_VERTEX_GLSL_SHADER,
      fs: EVENT_FRAGMENT_GLSL_SHADER,
      shaderLayout: CURSOR_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      topology: 'triangle-list',
      vertexCount: 6,
      parameters: RENDER_PARAMETERS
    });
  }

  initializeControls(): void {
    this.renderModeSelector = document.getElementById(
      RENDER_MODE_SELECTOR_ID
    ) as HTMLSelectElement | null;
    if (!this.renderModeSelector) {
      return;
    }

    this.renderModeSelector.value = this.activeRenderMode;
    const supportsStorage = this.device.type === 'webgpu';
    this.renderModeSelector.disabled = !supportsStorage;
    const storageOption = this.renderModeSelector.querySelector(
      'option[value="storage"]'
    ) as HTMLOptionElement | null;
    if (storageOption) {
      storageOption.disabled = !supportsStorage;
    }
    this.renderModeSelector.addEventListener('change', this.handleRenderModeSelection);
  }

  initializeLabels(): void {
    this.preparationPathLabel = document.getElementById(PREPARATION_PATH_ID);
    this.currentTimestampLabel = document.getElementById(CURRENT_TIMESTAMP_ID);
    this.dateOriginLabel = document.getElementById(DATE_ORIGIN_ID);
    this.timeOriginLabel = document.getElementById(TIME_ORIGIN_ID);
    this.timestampOriginLabel = document.getElementById(TIMESTAMP_ORIGIN_ID);
    this.durationOriginLabel = document.getElementById(DURATION_ORIGIN_ID);
  }

  updateLabels(): void {
    if (!this.timeColumnsTableInput) {
      return;
    }

    const {temporalColumns} = this.timeColumnsTableInput;
    setTextContent(
      this.preparationPathLabel,
      this.device.type === 'webgpu' ? 'WebGPU compute' : 'CPU fallback'
    );
    setTextContent(
      this.dateOriginLabel,
      formatDateDayOrigin(temporalColumns.eventDates.temporalInfo.origin)
    );
    setTextContent(
      this.timeOriginLabel,
      formatTimeOriginMilliseconds(temporalColumns.eventTimes.temporalInfo.origin)
    );
    setTextContent(
      this.timestampOriginLabel,
      formatTimestampOriginMilliseconds(temporalColumns.eventStarts.temporalInfo.origin)
    );
    setTextContent(
      this.durationOriginLabel,
      formatDurationOriginMilliseconds(temporalColumns.eventDurations.temporalInfo.origin)
    );
    this.updateCurrentTimestampLabel(
      getCurrentTimestampMilliseconds(this.currentScheduleMilliseconds)
    );
  }

  updateCurrentTimestampLabel(currentTimestamp: number): void {
    if (!this.timeColumnsTableInput) {
      return;
    }
    setTextContent(
      this.currentTimestampLabel,
      formatAbsoluteTimestampMilliseconds(
        this.timeColumnsTableInput.timestampOriginMilliseconds + currentTimestamp
      )
    );
  }

  handleRenderModeSelection = (): void => {
    if (!this.renderModeSelector || !this.timeColumnsTableInput) {
      return;
    }

    const requestedRenderMode = this.renderModeSelector.value as TimeColumnsRenderMode;
    const nextRenderMode =
      requestedRenderMode === 'storage' && this.device.type !== 'webgpu'
        ? 'attributes'
        : requestedRenderMode;
    this.renderModeSelector.value = nextRenderMode;
    if (nextRenderMode === this.activeRenderMode) {
      return;
    }

    const nextEventModel = this.createEventModel(this.timeColumnsTableInput, nextRenderMode);
    this.eventModel?.destroy();
    this.eventModel = nextEventModel;
    this.activeRenderMode = nextRenderMode;
  };
}

async function makeTimeColumnsTableInput(device: Device): Promise<TimeColumnsTableInput> {
  const temporalSourceVectors = makeTemporalSourceVectors();
  const temporalColumns = (await prepareArrowTemporalGPUVectors(device, temporalSourceVectors, {
    columns: {
      eventDates: {id: 'arrow-time-columns-event-dates'},
      eventTimes: {id: 'arrow-time-columns-event-times'},
      eventStarts: {id: 'arrow-time-columns-event-starts'},
      eventDurations: {id: 'arrow-time-columns-event-durations'}
    }
  })) as unknown as PreparedTemporalColumns;

  try {
    const eventColors = makeArrowGPUVector(
      device,
      makeArrowFixedSizeListVector(new arrow.Uint8(), 4, makeEventColorValues()),
      {name: 'eventColors', id: 'arrow-time-columns-event-colors'}
    );
    const table = new GPUTable({
      vectors: {
        eventDates: getPreparedScalarTemporalVector(temporalColumns.eventDates),
        eventTimes: getPreparedScalarTemporalVector(temporalColumns.eventTimes),
        eventStarts: getPreparedScalarTemporalVector(temporalColumns.eventStarts),
        eventDurations: getPreparedScalarTemporalVector(temporalColumns.eventDurations),
        eventColors
      }
    });
    const timestampOriginMilliseconds = Number(temporalColumns.eventStarts.temporalInfo.origin);

    return {
      table,
      temporalColumns,
      timestampOriginMilliseconds,
      destroy: () => table.destroy()
    };
  } catch (error) {
    for (const temporalColumn of Object.values(temporalColumns)) {
      temporalColumn.destroy();
    }
    throw error;
  }
}

function makeTemporalSourceVectors(): TemporalSourceVectors {
  const eventDates = new Int32Array(EVENT_COUNT);
  const eventTimes = new Int32Array(EVENT_COUNT);
  const eventStarts = new BigInt64Array(EVENT_COUNT);
  const eventDurations = new BigInt64Array(EVENT_COUNT);

  for (const [eventIndex, eventSpec] of EVENT_SPECS.entries()) {
    const eventStartOffsetMilliseconds = eventSpec.startMinute * MINUTE_MILLISECONDS;
    const eventDurationMilliseconds = eventSpec.durationMinute * MINUTE_MILLISECONDS;
    eventDates[eventIndex] = SOURCE_DATE_ORIGIN_DAYS + eventSpec.dayIndex;
    eventTimes[eventIndex] = SCHEDULE_START_TIME_MILLISECONDS + eventStartOffsetMilliseconds;
    eventStarts[eventIndex] = BigInt(
      SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS +
        eventSpec.dayIndex * DAY_MILLISECONDS +
        eventStartOffsetMilliseconds
    );
    eventDurations[eventIndex] = BigInt(eventDurationMilliseconds);
  }

  return {
    eventDates: makeTemporalVector(new arrow.DateDay(), eventDates),
    eventTimes: makeTemporalVector(new arrow.TimeMillisecond(), eventTimes),
    eventStarts: makeTemporalVector(new arrow.TimestampMillisecond(), eventStarts),
    eventDurations: makeTemporalVector(new arrow.DurationMillisecond(), eventDurations)
  };
}

function makeTemporalVector<T extends arrow.Date_ | arrow.Time | arrow.Timestamp | arrow.Duration>(
  type: T,
  values: Int32Array | BigInt64Array
): arrow.Vector<T> {
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<T>;
  return new arrow.Vector([data]);
}

function makeEventColorValues(): Uint8Array {
  const eventColors = new Uint8Array(EVENT_COUNT * 4);
  for (const [eventIndex, eventSpec] of EVENT_SPECS.entries()) {
    eventColors.set(eventSpec.color, eventIndex * 4);
  }
  return eventColors;
}

function getPreparedScalarTemporalVector(
  preparedTemporalColumn: PreparedArrowTemporalGPUVector
): GPUVector<arrow.Float32> {
  if (!(preparedTemporalColumn.temporal.type instanceof arrow.Float32)) {
    throw new Error('Time columns example requires scalar prepared Float32 temporal rows');
  }
  return preparedTemporalColumn.temporal as GPUVector<arrow.Float32>;
}

function getTimeColumnsStorageBindings(
  timeColumnsTable: GPUTable
): Record<string, GPUVector['buffer']> {
  return {
    eventDates: getRequiredTableVector(timeColumnsTable, 'eventDates').buffer,
    eventTimes: getRequiredTableVector(timeColumnsTable, 'eventTimes').buffer,
    eventStarts: getRequiredTableVector(timeColumnsTable, 'eventStarts').buffer,
    eventDurations: getRequiredTableVector(timeColumnsTable, 'eventDurations').buffer,
    eventColors: getRequiredTableVector(timeColumnsTable, 'eventColors').buffer
  };
}

function getRequiredTableVector(timeColumnsTable: GPUTable, columnName: string): GPUVector {
  const gpuVector = timeColumnsTable.gpuVectors[columnName];
  if (!gpuVector) {
    throw new Error(`Time columns table is missing ${columnName}`);
  }
  return gpuVector;
}

function getCurrentTimestampMilliseconds(currentScheduleMilliseconds: number): number {
  const currentDay = Math.floor(currentScheduleMilliseconds / SCHEDULE_SPAN_MILLISECONDS);
  const currentTime = currentScheduleMilliseconds - currentDay * SCHEDULE_SPAN_MILLISECONDS;
  return currentDay * DAY_MILLISECONDS + currentTime;
}

function formatDateDayOrigin(origin: number | bigint): string {
  return `${formatUtcDateMilliseconds(Number(origin) * DAY_MILLISECONDS)} (day ${origin})`;
}

function formatTimeOriginMilliseconds(origin: number | bigint): string {
  return `${formatTimeOfDayMilliseconds(Number(origin))} (${origin} ms)`;
}

function formatTimestampOriginMilliseconds(origin: number | bigint): string {
  return `${formatAbsoluteTimestampMilliseconds(Number(origin))} (${origin} ms)`;
}

function formatDurationOriginMilliseconds(origin: number | bigint): string {
  return `${origin} ms`;
}

function formatUtcDateMilliseconds(timestampMilliseconds: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(timestampMilliseconds);
}

function formatAbsoluteTimestampMilliseconds(timestampMilliseconds: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  }).format(timestampMilliseconds);
}

function formatTimeOfDayMilliseconds(timeMilliseconds: number): string {
  const hour = Math.floor(timeMilliseconds / HOUR_MILLISECONDS);
  const minute = Math.floor((timeMilliseconds % HOUR_MILLISECONDS) / MINUTE_MILLISECONDS);
  return `${padTwoDigits(hour)}:${padTwoDigits(minute)} UTC`;
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}

function setTextContent(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}
