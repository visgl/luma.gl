// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Draws generic scene bounds and stable application IDs without domain-specific scene fields. */
export const SCENE_GRAPH_RENDER_SHADER = /* wgsl */ `
struct SceneView {
  bounds: vec4<f32>,
  options: vec4<u32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) corner: vec2<f32>,
};

@group(0) @binding(0) var<storage, read> records: array<vec4<u32>>;
@group(0) @binding(1) var<uniform> view: SceneView;

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) sceneIndex: u32
) -> VertexOutput {
  let corners = array<vec2<f32>, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0)
  );
  let colors = array<vec3<f32>, 3>(
    vec3f(0.20, 0.74, 0.96), vec3f(0.73, 0.45, 1.0), vec3f(1.0, 0.63, 0.26)
  );
  let base = sceneIndex * 8u;
  let header = records[base];
  let minimum = bitcast<vec4<f32>>(records[base + 2u]);
  let maximum = bitcast<vec4<f32>>(records[base + 3u]);
  let corner = corners[vertexIndex];
  let position = mix(minimum.xy, maximum.xy, corner);
  let span = max(view.bounds.zw - view.bounds.xy, vec2f(0.001));
  var output: VertexOutput;
  output.position = vec4f((position - view.bounds.xy) / span * 2.0 - 1.0, 0.0, 1.0);
  output.color = select(colors[min(header.z, 2u)], vec3f(1.0, 0.95, 0.57), header.x == view.options.x);
  output.corner = corner;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let edge = min(min(input.corner.x, 1.0 - input.corner.x),
                 min(input.corner.y, 1.0 - input.corner.y));
  return vec4f(input.color * mix(0.58, 1.0, smoothstep(0.0, 0.16, edge)), 0.95);
}`;

/** Produces one source-aligned visibility flag from active bounds and renderer-owned groups. */
export function getSceneGraphVisibilityShader(capacity: number): string {
  return /* wgsl */ `
struct SceneView { bounds: vec4<f32>, options: vec4<u32> };
@group(0) @binding(0) var<storage, read> records: array<vec4<u32>>;
@group(0) @binding(1) var<uniform> view: SceneView;
@group(0) @binding(2) var<storage, read_write> visibility: array<u32>;

@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) globalId: vec3u) {
  let sceneIndex = globalId.x;
  if (sceneIndex >= ${capacity}u) { return; }
  let base = sceneIndex * 8u;
  let header = records[base];
  let minimum = bitcast<vec4<f32>>(records[base + 2u]);
  let maximum = bitcast<vec4<f32>>(records[base + 3u]);
  let intersects = all(maximum.xy >= view.bounds.xy) && all(minimum.xy <= view.bounds.zw);
  let groupVisible = header.z < 32u && (view.options.y & (1u << header.z)) != 0u;
  visibility[sceneIndex] = select(0u, 1u, (header.y & 1u) != 0u && intersects && groupVisible);
}`;
}

/** Picks only currently visible scene rows and preserves deterministic stable source ordering. */
export function getSceneGraphPickingShader(capacity: number): string {
  return /* wgsl */ `
struct PickRequest { point: vec2<f32>, enabled: u32, padding: u32 };
@group(0) @binding(0) var<storage, read> records: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read> visibility: array<u32>;
@group(0) @binding(2) var<storage, read> request: PickRequest;
@group(0) @binding(3) var<storage, read_write> result: atomic<u32>;

@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) globalId: vec3u) {
  let sceneIndex = globalId.x;
  if (sceneIndex >= ${capacity}u || request.enabled == 0u || visibility[sceneIndex] == 0u) {
    return;
  }
  let base = sceneIndex * 8u;
  let minimum = bitcast<vec4<f32>>(records[base + 2u]);
  let maximum = bitcast<vec4<f32>>(records[base + 3u]);
  if (all(request.point >= minimum.xy) && all(request.point <= maximum.xy)) {
    atomicMin(&result, sceneIndex);
  }
}`;
}
