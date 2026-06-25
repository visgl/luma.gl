// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const TRACE_RENDER_SHADER = /* wgsl */ `
struct TraceSpan {
  start: f32,
  duration: f32,
  lane: u32,
  group: u32,
};

struct ViewUniforms {
  timeMin: f32,
  timeMax: f32,
  laneMin: f32,
  laneMax: f32,
  enabledMask: u32,
  viewportWidth: f32,
  viewportHeight: f32,
  padding: u32,
};

@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<uniform> viewUniforms: ViewUniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) @interpolate(flat) lane: u32,
};

fn getCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 1.0), vec2<f32>(1.0, 0.0), vec2<f32>(1.0, 1.0)
  );
  return corners[vertexIndex];
}

fn getGroupColor(group: u32) -> vec3<f32> {
  let colors = array<vec3<f32>, 3>(
    vec3<f32>(0.30, 0.78, 1.00),
    vec3<f32>(0.74, 0.46, 1.00),
    vec3<f32>(1.00, 0.63, 0.22)
  );
  return colors[min(group, 2u)];
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let span = spans[sourceIndex];
  let corner = getCorner(vertexIndex);
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  let laneRange = max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0);
  let startX = ((span.start - viewUniforms.timeMin) / timeRange) * 2.0 - 1.0;
  let endX = ((span.start + span.duration - viewUniforms.timeMin) / timeRange) * 2.0 - 1.0;
  let laneHeight = 2.0 / laneRange;
  let laneY = 1.0 - ((f32(span.lane) - viewUniforms.laneMin) / laneRange) * 2.0;
  let x = mix(startX, endX, corner.x);
  let y = laneY - corner.y * laneHeight * 0.78;
  let pulse = 0.82 + 0.18 * sin(span.start * 0.13 + f32(span.lane) * 0.31);
  var output: VertexOutput;
  output.position = vec4<f32>(x, y, 0.0, 1.0);
  output.color = vec4<f32>(getGroupColor(span.group) * pulse, 0.92);
  output.lane = span.lane;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let stripe = select(0.94, 1.0, (input.lane & 1u) == 0u);
  return vec4<f32>(input.color.rgb * stripe, input.color.a);
}`;

export function getVisibilityShader(spanCount: number, groupIndex: number): string {
  return /* wgsl */ `
struct TraceSpan {
  start: f32,
  duration: f32,
  lane: u32,
  group: u32,
};

struct ViewUniforms {
  timeMin: f32,
  timeMax: f32,
  laneMin: f32,
  laneMax: f32,
  enabledMask: u32,
  viewportWidth: f32,
  viewportHeight: f32,
  padding: u32,
};

const SPAN_COUNT: u32 = ${spanCount}u;
const GROUP_BIT: u32 = ${1 << groupIndex}u;
@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(2) var<storage, read_write> flags: array<u32>;
@group(0) @binding(3) var<storage, read_write> sourceIds: array<u32>;

@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= SPAN_COUNT) { return; }
  let span = spans[index];
  let end = span.start + span.duration;
  let timeVisible = end >= viewUniforms.timeMin && span.start <= viewUniforms.timeMax;
  let lane = f32(span.lane);
  let laneVisible = lane >= viewUniforms.laneMin && lane < viewUniforms.laneMax;
  let groupVisible = (viewUniforms.enabledMask & GROUP_BIT) != 0u;
  flags[index] = select(0u, 1u, timeVisible && laneVisible && groupVisible);
  sourceIds[index] = index;
}`;
}
