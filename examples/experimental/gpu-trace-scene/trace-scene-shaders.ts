// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {TRACE_ERROR_SPAN_FLAG, TRACE_LANES_PER_THREAD} from '../gpu-trace-viewer/trace-data';

/** Draws directly from generic scene bounds while retaining canonical trace ownership metadata. */
export const TRACE_SCENE_RENDER_SHADER = /* wgsl */ `
struct TraceView {
  limits: vec4<f32>,
  selection: vec4<u32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) coordinates: vec2<f32>,
};

@group(0) @binding(0) var<storage, read> sceneRecords: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read> spans: array<vec4<u32>>;
@group(0) @binding(2) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(3) var<uniform> view: TraceView;

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) sourceIndex: u32
) -> VertexOutput {
  let corners = array<vec2<f32>, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0)
  );
  let colors = array<vec3<f32>, 3>(
    vec3f(0.22, 0.72, 1.0), vec3f(0.76, 0.43, 1.0), vec3f(1.0, 0.62, 0.21)
  );
  let corner = corners[vertexIndex];
  let recordBase = sourceIndex * 8u;
  let boundsMinimum = bitcast<vec4<f32>>(sceneRecords[recordBase + 2u]);
  let boundsMaximum = bitcast<vec4<f32>>(sceneRecords[recordBase + 3u]);
  let ownership = spans[sourceIndex * 2u + 1u];
  let originalLane = u32(boundsMinimum.y);
  let effectiveLane = f32(threadOffsets[ownership.y] + originalLane % ${TRACE_LANES_PER_THREAD}u);
  let timestamp = mix(boundsMinimum.x, boundsMaximum.x, corner.x);
  let lane = effectiveLane + 0.12 + corner.y * 0.76;
  let timeRange = max(view.limits.y - view.limits.x, 0.001);
  let laneRange = max(view.limits.w - view.limits.z, 1.0);
  let groupId = sceneRecords[recordBase].z;
  let selected = ownership.z == view.selection.x;
  let hasError = (ownership.w & ${TRACE_ERROR_SPAN_FLAG}u) != 0u;

  var output: VertexOutput;
  output.position = vec4f(
    (timestamp - view.limits.x) / timeRange * 2.0 - 1.0,
    1.0 - (lane - view.limits.z) / laneRange * 2.0,
    0.0,
    1.0
  );
  output.color = select(colors[min(groupId, 2u)], vec3f(1.0, 0.31, 0.37), hasError);
  output.color = select(output.color, vec3f(1.0, 0.96, 0.62), selected);
  output.coordinates = corner;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let edge = min(min(input.coordinates.x, 1.0 - input.coordinates.x),
                 min(input.coordinates.y, 1.0 - input.coordinates.y));
  let brightness = mix(0.68, 1.0, smoothstep(0.0, 0.12, edge));
  return vec4f(input.color * brightness, 0.92);
}`;
