// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Four floating-point framing words followed by four unsigned interaction words. */
export const GRAPH_EXPLORER_VIEW_BYTE_LENGTH = 32;

/** Unsigned no-selection and unreachable-distance sentinel shared with GPU graph traversal. */
export const GRAPH_EXPLORER_INVALID_VERTEX = 0xffffffff;

// Framing: center x, center y, zoom, viewport aspect ratio.
// Interaction: selected vertex, maximum traversal depth, vertex count, packed visual-mode flags.
const GRAPH_EXPLORER_VIEW_SOURCE = /* wgsl */ `
struct GraphExplorerView {
  framing: vec4<f32>,
  interaction: vec4<u32>,
};`;

/**
 * Draws one actual caller-owned source/target edge batch without packing graph source chunks.
 *
 * Bindings: positions=0, sourceVertices=1, targetVertices=2, distances=3, view=4.
 * Use a line-list model with two vertices and one instance for every row in this source batch.
 */
export const GRAPH_EXPLORER_EDGE_SHADER = /* wgsl */ `
${GRAPH_EXPLORER_VIEW_SOURCE}

@group(0) @binding(0) var<storage, read> positions: array<f32>;
@group(0) @binding(1) var<storage, read> sourceVertices: array<u32>;
@group(0) @binding(2) var<storage, read> targetVertices: array<u32>;
@group(0) @binding(3) var<storage, read> distances: array<u32>;
@group(0) @binding(4) var<uniform> view: GraphExplorerView;

struct EdgeVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex fn vertexMain(
  @builtin(vertex_index) endpointIndex: u32,
  @builtin(instance_index) edgeIndex: u32
) -> EdgeVertexOutput {
  let sourceVertex = sourceVertices[edgeIndex];
  let targetVertex = targetVertices[edgeIndex];
  let vertex = select(sourceVertex, targetVertex, endpointIndex == 1u);
  let position = vec2<f32>(positions[vertex * 2u], positions[vertex * 2u + 1u]);
  let centered = (position - view.framing.xy) * view.framing.z;
  let projected = vec2<f32>(centered.x / max(view.framing.w, 0.001), centered.y);
  let hasSelection = view.interaction.x != ${GRAPH_EXPLORER_INVALID_VERTEX}u;
  let connected =
    distances[sourceVertex] != ${GRAPH_EXPLORER_INVALID_VERTEX}u &&
    distances[targetVertex] != ${GRAPH_EXPLORER_INVALID_VERTEX}u;

  var output: EdgeVertexOutput;
  output.position = vec4<f32>(projected, 0.35, 1.0);
  let edgeDensity = clamp(256.0 / max(f32(view.interaction.z), 1.0), 0.14, 1.0);
  output.color = select(
    vec4<f32>(0.30, 0.47, 0.70, select(0.20 * edgeDensity, 0.055, hasSelection)),
    vec4<f32>(0.39, 0.87, 1.0, 0.76),
    hasSelection && connected
  );
  return output;
}

@fragment fn fragmentMain(input: EdgeVertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}`;

/**
 * Draws source-aligned circular nodes from the original float32x2 instance vertex buffer.
 *
 * Attribute: nodePosition at location zero, stepMode instance.
 * Bindings: importance=0, components=1, communities=2, degrees=3, distances=4, mask=5, view=6.
 */
export const GRAPH_EXPLORER_NODE_SHADER = /* wgsl */ `
${GRAPH_EXPLORER_VIEW_SOURCE}

@group(0) @binding(0) var<storage, read> importance: array<f32>;
@group(0) @binding(1) var<storage, read> components: array<u32>;
@group(0) @binding(2) var<storage, read> communities: array<u32>;
@group(0) @binding(3) var<storage, read> degrees: array<u32>;
@group(0) @binding(4) var<storage, read> distances: array<u32>;
@group(0) @binding(5) var<storage, read> selectionMask: array<u32>;
@group(0) @binding(6) var<uniform> view: GraphExplorerView;

struct NodeVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) coordinates: vec2<f32>,
};

@vertex fn vertexMain(
  @location(0) nodePosition: vec2<f32>,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) sourceIndex: u32
) -> NodeVertexOutput {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  let palette = array<vec3<f32>, 7>(
    vec3<f32>(0.34, 0.84, 1.0),
    vec3<f32>(1.0, 0.71, 0.37),
    vec3<f32>(0.76, 0.50, 1.0),
    vec3<f32>(0.36, 0.90, 0.66),
    vec3<f32>(1.0, 0.45, 0.65),
    vec3<f32>(0.91, 0.92, 0.52),
    vec3<f32>(0.39, 0.61, 1.0)
  );
  let population = max(f32(view.interaction.z), 1.0);
  let densityScale = clamp(sqrt(128.0 / population), 0.24, 1.0);
  let sizeMode = (view.interaction.w >> 4u) & 3u;
  let importanceScale = clamp(sqrt(max(importance[sourceIndex] * population, 0.0)), 0.7, 2.5);
  let degreeScale = clamp(sqrt(max(f32(degrees[sourceIndex]), 1.0)) * 0.55, 0.7, 2.5);
  let metricScale = select(importanceScale, degreeScale, sizeMode == 1u);
  let radius = clamp(0.018 * densityScale * select(metricScale, 1.0, sizeMode == 2u),
    0.003, 0.040);
  let pointMode = (view.interaction.w & 64u) != 0u;
  let corner = select(corners[vertexIndex], vec2<f32>(0.0), pointMode);
  let centered = (nodePosition - view.framing.xy) * view.framing.z;
  let aspect = max(view.framing.w, 0.001);
  let projected = vec2<f32>(centered.x / aspect, centered.y) +
    vec2<f32>(corner.x / aspect, corner.y) * radius +
    select(vec2<f32>(0.0), vec2<f32>(0.0001, -0.0001), pointMode);
  let hasSelection = view.interaction.x != ${GRAPH_EXPLORER_INVALID_VERTEX}u;
  let reachable = selectionMask[sourceIndex] != 0u &&
    distances[sourceIndex] != ${GRAPH_EXPLORER_INVALID_VERTEX}u;
  let selected = sourceIndex == view.interaction.x;
  let colorMode = (view.interaction.w >> 1u) & 7u;
  let communitySpan = max(view.interaction.z / 4u, 1u);
  let communityLabel = select(
    communities[sourceIndex],
    min(communities[sourceIndex] / communitySpan, 3u),
    pointMode && view.interaction.z >= 16384u
  );
  var color = palette[communityLabel % 7u];
  if (colorMode == 1u) {
    color = palette[components[sourceIndex] % 7u];
  } else if (colorMode == 2u) {
    color = mix(vec3<f32>(0.24, 0.48, 0.94), vec3<f32>(1.0, 0.45, 0.24),
      clamp(f32(degrees[sourceIndex]) / 12.0, 0.0, 1.0));
  } else if (colorMode == 3u) {
    color = mix(vec3<f32>(0.34, 0.26, 0.82), vec3<f32>(1.0, 0.82, 0.35),
      clamp(importance[sourceIndex] * population / 3.0, 0.0, 1.0));
  } else if (colorMode == 4u) {
    color = select(
      vec3<f32>(0.26, 0.31, 0.43),
      mix(vec3<f32>(1.0, 0.82, 0.35), vec3<f32>(0.29, 0.76, 1.0),
        clamp(f32(distances[sourceIndex]) / 6.0, 0.0, 1.0)),
      distances[sourceIndex] != ${GRAPH_EXPLORER_INVALID_VERTEX}u
    );
  }
  color = select(color, color * select(0.24, 0.78, pointMode), hasSelection && !reachable);
  color = select(color, vec3<f32>(1.0, 0.96, 0.66), selected);

  var output: NodeVertexOutput;
  output.position = vec4<f32>(projected, 0.1, 1.0);
  output.color = vec4<f32>(color, select(0.92, 1.0, selected));
  output.coordinates = corner;
  return output;
}

@fragment fn fragmentMain(input: NodeVertexOutput) -> @location(0) vec4<f32> {
  let distanceFromCenter = length(input.coordinates);
  if (distanceFromCenter > 1.0) { discard; }
  let edge = 1.0 - smoothstep(0.70, 1.0, distanceFromCenter);
  return vec4<f32>(input.color.rgb * (0.72 + edge * 0.28), input.color.a * edge);
}`;

/**
 * Emits GPUIndexPickingTarget-compatible object IDs from the same true instance vertex buffer.
 *
 * Attribute: nodePosition at location zero, stepMode instance.
 * Bindings: importance=0, degrees=1, view=2. Fragment targets: rgba8unorm and rg32sint.
 */
export const GRAPH_EXPLORER_PICKING_SHADER = /* wgsl */ `
${GRAPH_EXPLORER_VIEW_SOURCE}

@group(0) @binding(0) var<storage, read> importance: array<f32>;
@group(0) @binding(1) var<storage, read> degrees: array<u32>;
@group(0) @binding(2) var<uniform> view: GraphExplorerView;

struct PickingVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) coordinates: vec2<f32>,
  @location(1) @interpolate(flat) sourceIndex: u32,
};

struct PickingFragmentOutput {
  @location(0) color: vec4<f32>,
  @location(1) indices: vec2<i32>,
};

@vertex fn vertexMain(
  @location(0) nodePosition: vec2<f32>,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) sourceIndex: u32
) -> PickingVertexOutput {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  let pointMode = (view.interaction.w & 64u) != 0u;
  let corner = select(corners[vertexIndex], vec2<f32>(0.0), pointMode);
  let population = max(f32(view.interaction.z), 1.0);
  let densityScale = clamp(sqrt(128.0 / population), 0.24, 1.0);
  let sizeMode = (view.interaction.w >> 4u) & 3u;
  let importanceScale = clamp(sqrt(max(importance[sourceIndex] * population, 0.0)), 0.7, 2.5);
  let degreeScale = clamp(sqrt(max(f32(degrees[sourceIndex]), 1.0)) * 0.55, 0.7, 2.5);
  let metricScale = select(importanceScale, degreeScale, sizeMode == 1u);
  let radius = clamp(0.018 * densityScale * select(metricScale, 1.0, sizeMode == 2u),
    0.003, 0.040);
  let centered = (nodePosition - view.framing.xy) * view.framing.z;
  let aspect = max(view.framing.w, 0.001);
  let projected = vec2<f32>(centered.x / aspect, centered.y) +
    vec2<f32>(corner.x / aspect, corner.y) * radius +
    select(vec2<f32>(0.0), vec2<f32>(0.0001, -0.0001), pointMode);

  var output: PickingVertexOutput;
  output.position = vec4<f32>(projected, 0.1, 1.0);
  output.coordinates = corner;
  output.sourceIndex = sourceIndex;
  return output;
}

@fragment fn fragmentMain(input: PickingVertexOutput) -> PickingFragmentOutput {
  if (length(input.coordinates) > 1.0) { discard; }
  var output: PickingFragmentOutput;
  output.color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  output.indices = vec2<i32>(i32(input.sourceIndex), 0);
  return output;
}`;
