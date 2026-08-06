// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DENSITY_TIME_PER_PIXEL,
  TRACE_DEPENDENCY_BATCH_CAPACITY,
  TRACE_DEPENDENCY_DESTINATION_PROCESS_SHIFT,
  TRACE_DEPENDENCY_PROCESS_MASK,
  TRACE_DEPENDENCY_SOURCE_PROCESS_SHIFT,
  TRACE_ERROR_SPAN_FLAG,
  TRACE_FILTER_ERRORS_ONLY,
  TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
  TRACE_FILTER_HIDE_RUNTIME_SPANS,
  TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
  TRACE_LANE_COUNT,
  TRACE_LANES_PER_THREAD,
  TRACE_OVERLAPPING_CHILD_FLAG,
  TRACE_PROCESS_COUNT,
  TRACE_RUNTIME_SPAN_FLAG,
  TRACE_SIMILAR_DURATION_PARENT_FLAG,
  TRACE_THREADS_PER_PROCESS
} from './trace-data';

const TRACE_WORKGROUP_SIZE = 256;
export const TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE = 64;

const TRACE_SHADER_DECLARATIONS = /* wgsl */ `
struct TraceSpan {
  start: f32,
  duration: f32,
  lane: u32,
  group: u32,
  processIndex: u32,
  threadIndex: u32,
  sourceIndex: u32,
  // Immutable classifications assigned when the source span is ingested.
  flags: u32,
};

struct TraceDependency {
  sourceIndex: u32,
  destinationIndex: u32,
  family: u32,
  flags: u32,
};

struct ViewUniforms {
  timeMin: f32,
  timeMax: f32,
  laneMin: f32,
  laneMax: f32,
  enabledMask: u32,
  statusMask: u32,
  // Enabled filtering policy applied to the immutable source classifications.
  activeFilterMask: u32,
  dependencyMask: u32,
  minimumDuration: f32,
  viewportWidth: f32,
  viewportHeight: f32,
  selectedSpanIndex: u32,
  focusMode: u32,
  activityScale: f32,
  pickTime: f32,
  pickLane: f32,
  visibilityGeneration: u32,
  dependencyEndpointOffset: u32,
};

const LANES_PER_THREAD: u32 = ${TRACE_LANES_PER_THREAD}u;
const THREADS_PER_PROCESS: u32 = ${TRACE_THREADS_PER_PROCESS}u;
const DENSITY_TIME_PER_PIXEL: f32 = ${TRACE_DENSITY_TIME_PER_PIXEL};

fn isDensityMode() -> bool {
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  return timeRange / max(viewUniforms.viewportWidth, 1.0) >= DENSITY_TIME_PER_PIXEL;
}

fn getGroupColor(group: u32) -> vec3<f32> {
  let colors = array<vec3<f32>, 3>(
    vec3<f32>(0.30, 0.78, 1.00),
    vec3<f32>(0.74, 0.46, 1.00),
    vec3<f32>(1.00, 0.63, 0.22)
  );
  return colors[min(group, 2u)];
}

fn getCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0)
  );
  return corners[vertexIndex];
}`;

const TRACE_VISIBILITY_FILTER_DECLARATIONS = /* wgsl */ `
const RUNTIME_SPAN_FLAG: u32 = ${TRACE_RUNTIME_SPAN_FLAG}u;
const ERROR_SPAN_FLAG: u32 = ${TRACE_ERROR_SPAN_FLAG}u;
const OVERLAPPING_CHILD_FLAG: u32 = ${TRACE_OVERLAPPING_CHILD_FLAG}u;
const SIMILAR_DURATION_PARENT_FLAG: u32 = ${TRACE_SIMILAR_DURATION_PARENT_FLAG}u;

fn isSpanSourceVisible(span: TraceSpan, lane: f32) -> bool {
  let end = span.start + span.duration;
  let timeVisible = end >= viewUniforms.timeMin && span.start <= viewUniforms.timeMax;
  let laneVisible = lane >= viewUniforms.laneMin && lane < viewUniforms.laneMax;
  let groupVisible = (viewUniforms.enabledMask & (1u << span.group)) != 0u;
  let statusVisible = (viewUniforms.statusMask & (1u << (span.flags & 3u))) != 0u;
  let runtimeVisible =
    (viewUniforms.activeFilterMask & ${TRACE_FILTER_HIDE_RUNTIME_SPANS}u) == 0u ||
    (span.flags & RUNTIME_SPAN_FLAG) == 0u;
  let errorVisible =
    (viewUniforms.activeFilterMask & ${TRACE_FILTER_ERRORS_ONLY}u) == 0u ||
    (span.flags & ERROR_SPAN_FLAG) != 0u;
  let overlappingChildVisible =
    (viewUniforms.activeFilterMask & ${TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN}u) == 0u ||
    (span.flags & OVERLAPPING_CHILD_FLAG) == 0u;
  let similarParentVisible =
    (viewUniforms.activeFilterMask & ${TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS}u) == 0u ||
    (span.flags & SIMILAR_DURATION_PARENT_FLAG) == 0u;
  let durationVisible = span.duration >= viewUniforms.minimumDuration;
  return timeVisible && laneVisible && groupVisible && statusVisible && runtimeVisible &&
    errorVisible && overlappingChildVisible && similarParentVisible && durationVisible;
}`;

/** Indirect span renderer reading GPU-generated stable source IDs and thread layout. */
export const TRACE_RENDER_SHADER = /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}

@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(3) var<storage, read> threadStates: array<u32>;
@group(0) @binding(4) var<storage, read> reachedSpans: array<u32>;
@group(0) @binding(5) var<uniform> viewUniforms: ViewUniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) @interpolate(flat) lane: u32,
};

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let span = spans[sourceIndex];
  let corner = getCorner(vertexIndex);
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  let laneRange = max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0);
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  let lane = threadOffsets[span.threadIndex] + localLane;
  let startX = ((span.start - viewUniforms.timeMin) / timeRange) * 2.0 - 1.0;
  let endX = ((span.start + span.duration - viewUniforms.timeMin) / timeRange) * 2.0 - 1.0;
  let laneHeight = 2.0 / laneRange;
  let laneY = 1.0 - ((f32(lane) - viewUniforms.laneMin) / laneRange) * 2.0;
  let pulse = 0.84 + 0.16 * sin(span.start * 0.13 + f32(lane) * 0.31);
  let isSelected = sourceIndex == viewUniforms.selectedSpanIndex;
  let isReached = reachedSpans[sourceIndex] == viewUniforms.visibilityGeneration;
  let hasSelection = viewUniforms.selectedSpanIndex != 0xffffffffu;
  let focusOpacity = select(1.0, select(0.22, 1.0, isReached), hasSelection);
  let baseColor = getGroupColor(span.group) * pulse;
  var output: VertexOutput;
  output.position = vec4<f32>(
    mix(startX, max(endX, startX + 0.00025), corner.x),
    laneY - corner.y * laneHeight * 0.78,
    0.0,
    1.0
  );
  output.color = vec4<f32>(
    select(baseColor, vec3<f32>(1.0, 0.94, 0.47), isSelected),
    select(0.9, 1.0, isSelected) * focusOpacity
  );
  output.lane = lane;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let stripe = select(0.94, 1.0, (input.lane & 1u) == 0u);
  return vec4<f32>(input.color.rgb * stripe, input.color.a);
}`;

/** Indirect line renderer preserving original cross-process dependency endpoints. */
export const TRACE_DEPENDENCY_RENDER_SHADER = /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}

@group(0) @binding(0) var<storage, read> dependencies: array<TraceDependency>;
@group(0) @binding(1) var<storage, read> visibleDependencyIds: array<u32>;
@group(0) @binding(2) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(3) var<storage, read> processStates: array<u32>;
@group(0) @binding(4) var<storage, read> threadStates: array<u32>;
@group(0) @binding(5) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(6) var<storage, read> dependencyResults: array<u32>;
@group(0) @binding(7) var<uniform> viewUniforms: ViewUniforms;

struct DependencyVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

fn getEndpointLane(span: TraceSpan) -> u32 {
  if (processStates[span.processIndex] == 0u) {
    return threadOffsets[span.processIndex * THREADS_PER_PROCESS];
  }
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  return threadOffsets[span.threadIndex] + localLane;
}

fn getResolvedEndpoint(endpointResultIndex: u32) -> TraceSpan {
  return spans[dependencyResults[viewUniforms.dependencyEndpointOffset + endpointResultIndex]];
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> DependencyVertexOutput {
  let dependency = dependencies[visibleDependencyIds[instanceIndex]];
  let dependencyIndex = visibleDependencyIds[instanceIndex];
  let endpointResultIndex = dependencyIndex * 2u + select(0u, 1u, vertexIndex == 1u);
  let span = getResolvedEndpoint(endpointResultIndex);
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  let laneRange = max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0);
  let endpointTime = select(span.start + span.duration, span.start, vertexIndex == 1u);
  let endpointLane = f32(getEndpointLane(span)) + 0.4;
  let crossProcess = dependency.family != 0u;
  var output: DependencyVertexOutput;
  output.position = vec4<f32>(
    ((endpointTime - viewUniforms.timeMin) / timeRange) * 2.0 - 1.0,
    1.0 - ((endpointLane - viewUniforms.laneMin) / laneRange) * 2.0,
    0.0,
    1.0
  );
  output.color = select(
    vec4<f32>(0.54, 0.73, 0.95, 0.48),
    vec4<f32>(1.00, 0.77, 0.35, 0.76),
    crossProcess
  );
  return output;
}

@fragment fn fragmentMain(input: DependencyVertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}`;

/** Renders GPU-aggregated density bins for the current visible lane layout. */
export const TRACE_DENSITY_RENDER_SHADER = /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}

const DENSITY_BIN_COUNT: u32 = ${TRACE_DENSITY_BIN_COUNT}u;
@group(0) @binding(0) var<storage, read> densityBins: array<u32>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;

struct DensityVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> DensityVertexOutput {
  let lane = instanceIndex / DENSITY_BIN_COUNT;
  let binIndex = instanceIndex % DENSITY_BIN_COUNT;
  let count = densityBins[instanceIndex];
  let corner = getCorner(vertexIndex);
  let laneRange = max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0);
  let laneHeight = 2.0 / laneRange;
  let startX = (f32(binIndex) / f32(DENSITY_BIN_COUNT)) * 2.0 - 1.0;
  let endX = (f32(binIndex + 1u) / f32(DENSITY_BIN_COUNT)) * 2.0 - 1.0;
  let intensity = clamp(log2(f32(count) + 1.0) * viewUniforms.activityScale, 0.12, 1.0);
  let visible = count > 0u && f32(lane) >= viewUniforms.laneMin &&
    f32(lane) < viewUniforms.laneMax;
  var output: DensityVertexOutput;
  output.position = vec4<f32>(
    mix(startX, endX, corner.x),
    1.0 - ((f32(lane) - viewUniforms.laneMin) / laneRange) * 2.0 -
      corner.y * laneHeight * 0.78 * intensity,
    0.0,
    1.0
  );
  output.color = vec4<f32>(
    mix(vec3<f32>(0.15, 0.49, 0.74), vec3<f32>(1.0, 0.76, 0.31), intensity),
    select(0.0, 0.94, visible)
  );
  return output;
}

@fragment fn fragmentMain(input: DensityVertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}`;

/** Coarsely rejects immutable span batches that cannot contribute to the active view. */
export function getBatchVisibilityShader(batchCount: number): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
};
const BATCH_COUNT: u32 = ${batchCount}u;
@group(0) @binding(0) var<storage, read> spanBatches: array<TraceSpanBatch>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(2) var<storage, read_write> candidateFlags: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let batchIndex = globalId.x;
  if (batchIndex >= BATCH_COUNT) {
    return;
  }
  let batch = spanBatches[batchIndex];
  let timeVisible = batch.timeMax >= viewUniforms.timeMin &&
    batch.timeMin <= viewUniforms.timeMax;
  let groupVisible = (viewUniforms.enabledMask & (1u << batch.groupIndex)) != 0u;
  candidateFlags[batchIndex] = select(0u, 1u, timeVisible && groupVisible);
}`;
}

/** Conservatively selects dependency batches whose endpoint envelopes intersect the viewport. */
export function getDependencyBatchVisibilityShader(batchCount: number): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
struct DependencyBatch {
  firstIndex: u32,
  count: u32,
  timeMin: f32,
  timeMax: f32,
  familyMask: u32,
  batchIndex: u32,
};
const BATCH_COUNT: u32 = ${batchCount}u;
@group(0) @binding(0) var<storage, read> dependencyBatches: array<DependencyBatch>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(2) var<storage, read_write> candidateFlags: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let batchIndex = globalId.x;
  if (batchIndex >= BATCH_COUNT) {
    return;
  }
  let batch = dependencyBatches[batchIndex];
  let timeVisible = batch.timeMin <= viewUniforms.timeMax &&
    batch.timeMax >= viewUniforms.timeMin;
  let familyVisible = (batch.familyMask & viewUniforms.dependencyMask) != 0u;
  candidateFlags[batchIndex] = select(
    0u,
    1u,
    timeVisible && familyVisible && !isDensityMode()
  );
}`;
}

/** Seeds a generation-tagged compact focus frontier and its first indirect dispatch. */
export function getFocusFrontierSeedShader(spanCount: number): string {
  return /* wgsl */ `
const SPAN_COUNT: u32 = ${spanCount}u;
const WORKGROUP_SIZE: u32 = ${TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE}u;
@group(0) @binding(0) var<storage, read> selectedSeeds: array<u32>;
@group(0) @binding(1) var<storage, read> activeSeedCount: array<u32>;
@group(0) @binding(2) var<storage, read> focusTraversalState: array<u32>;
@group(0) @binding(3) var<storage, read_write> reachedSpans: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> frontier: array<u32>;
@group(0) @binding(5) var<storage, read_write> frontierCount: array<u32>;
@group(0) @binding(6) var<storage, read_write> dispatchCommand: array<u32>;

@compute @workgroup_size(1)
fn main() {
  var count = 0u;
  let seed = selectedSeeds[0];
  if (activeSeedCount[0] != 0u && seed < SPAN_COUNT) {
    atomicStore(&reachedSpans[seed], focusTraversalState[1]);
    frontier[0] = seed;
    count = 1u;
  }
  frontierCount[0] = count;
  dispatchCommand[0] = (count + WORKGROUP_SIZE - 1u) / WORKGROUP_SIZE;
  dispatchCommand[1] = 1u;
  dispatchCommand[2] = 1u;
}`;
}

/** Clears one compact frontier count and disables its indirect dispatch. */
export function getFocusFrontierClearShader(): string {
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> frontierCount: array<u32>;
@group(0) @binding(1) var<storage, read_write> dispatchCommand: array<u32>;

@compute @workgroup_size(1)
fn main() {
  frontierCount[0] = 0u;
  dispatchCommand[0] = 0u;
  dispatchCommand[1] = 1u;
  dispatchCommand[2] = 1u;
}`;
}

/** Expands one CSR partition from a compact frontier into a generation-tagged next frontier. */
export function getFocusFrontierExpansionShader(options: {
  spanCount: number;
  sourceNodeBase: number;
  sourceNodeCount: number;
  offsetWordBase: number;
  neighborWordBase: number;
  neighborCount: number;
  depth: number;
}): string {
  return /* wgsl */ `
const SPAN_COUNT: u32 = ${options.spanCount}u;
const SOURCE_NODE_BASE: u32 = ${options.sourceNodeBase}u;
const SOURCE_NODE_COUNT: u32 = ${options.sourceNodeCount}u;
const OFFSET_WORD_BASE: u32 = ${options.offsetWordBase}u;
const NEIGHBOR_WORD_BASE: u32 = ${options.neighborWordBase}u;
const NEIGHBOR_COUNT: u32 = ${options.neighborCount}u;
const DEPTH: u32 = ${options.depth}u;
@group(0) @binding(0) var<storage, read> offsets: array<u32>;
@group(0) @binding(1) var<storage, read> neighbors: array<u32>;
@group(0) @binding(2) var<storage, read> frontier: array<u32>;
@group(0) @binding(3) var<storage, read> frontierCount: array<u32>;
@group(0) @binding(4) var<storage, read_write> nextFrontier: array<u32>;
@group(0) @binding(5) var<storage, read_write> nextFrontierCount: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> reachedSpans: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read> focusTraversalState: array<u32>;

@compute @workgroup_size(${TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let frontierIndex = globalId.x;
  if (frontierIndex >= frontierCount[0] || DEPTH >= focusTraversalState[0]) {
    return;
  }
  let sourceIndex = frontier[frontierIndex];
  if (sourceIndex < SOURCE_NODE_BASE || sourceIndex - SOURCE_NODE_BASE >= SOURCE_NODE_COUNT) {
    return;
  }
  let localSourceIndex = sourceIndex - SOURCE_NODE_BASE;
  let firstNeighbor = min(offsets[OFFSET_WORD_BASE + localSourceIndex], NEIGHBOR_COUNT);
  let lastNeighbor = min(offsets[OFFSET_WORD_BASE + localSourceIndex + 1u], NEIGHBOR_COUNT);
  for (var neighborIndex = firstNeighbor; neighborIndex < lastNeighbor; neighborIndex++) {
    let neighbor = neighbors[NEIGHBOR_WORD_BASE + neighborIndex];
    if (neighbor < SPAN_COUNT &&
      atomicExchange(&reachedSpans[neighbor], focusTraversalState[1]) !=
        focusTraversalState[1]) {
      let nextIndex = atomicAdd(&nextFrontierCount[0], 1u);
      if (nextIndex < SPAN_COUNT) {
        nextFrontier[nextIndex] = neighbor;
      }
    }
  }
}`;
}

/** Publishes a compact frontier count as the next indirect dispatch. */
export function getFocusFrontierDispatchShader(): string {
  return /* wgsl */ `
const WORKGROUP_SIZE: u32 = ${TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE}u;
@group(0) @binding(0) var<storage, read> frontierCount: array<u32>;
@group(0) @binding(1) var<storage, read_write> dispatchCommand: array<u32>;

@compute @workgroup_size(1)
fn main() {
  dispatchCommand[0] = (frontierCount[0] + WORKGROUP_SIZE - 1u) / WORKGROUP_SIZE;
}`;
}

/** Routes candidate work to only the passes needed by the active LOD and interaction mode. */
export function getCandidatePassDispatchShader(): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
const PROCESS_COUNT: u32 = ${TRACE_PROCESS_COUNT}u;
@group(0) @binding(0) var<storage, read> candidateDispatchCommand: array<u32>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(2) var<storage, read_write> exactDispatchCommand: array<u32>;
@group(0) @binding(3) var<storage, read_write> densityDispatchCommand: array<u32>;
@group(0) @binding(4) var<storage, read_write> pickDispatchCommand: array<u32>;
@group(0) @binding(5) var<storage, read> processStates: array<u32>;

@compute @workgroup_size(1)
fn main() {
  let candidateWorkgroupCount = candidateDispatchCommand[0];
  let candidateBatchCount = candidateDispatchCommand[1];
  let densityMode = isDensityMode();
  let pickActive = viewUniforms.pickLane >= 0.0;
  var hasCollapsedProcess = false;
  for (var processIndex = 0u; processIndex < PROCESS_COUNT; processIndex++) {
    hasCollapsedProcess = hasCollapsedProcess || processStates[processIndex] == 0u;
  }
  let densityActive = densityMode || hasCollapsedProcess;

  exactDispatchCommand[0] = candidateWorkgroupCount;
  exactDispatchCommand[1] = select(candidateBatchCount, 0u, densityMode);
  exactDispatchCommand[2] = 1u;
  densityDispatchCommand[0] = candidateWorkgroupCount;
  densityDispatchCommand[1] = select(0u, candidateBatchCount, densityActive);
  densityDispatchCommand[2] = 1u;
  pickDispatchCommand[0] = candidateWorkgroupCount;
  pickDispatchCommand[1] = select(0u, candidateBatchCount, pickActive);
  pickDispatchCommand[2] = 1u;
}`;
}

/** Clears the fixed-size density target without touching source-aligned span storage. */
export function getDensityClearShader(): string {
  return /* wgsl */ `
const DENSITY_BIN_COUNT: u32 = ${TRACE_LANE_COUNT * TRACE_DENSITY_BIN_COUNT}u;
@group(0) @binding(0) var<storage, read_write> densityBins: array<u32>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < DENSITY_BIN_COUNT) {
    densityBins[globalId.x] = 0u;
  }
}`;
}

/** Classifies and aggregates focused candidate density without span-sized intermediate keys. */
export function getCandidateDensityShader(): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
};
${TRACE_VISIBILITY_FILTER_DECLARATIONS}
@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<storage, read> spanBatches: array<TraceSpanBatch>;
@group(0) @binding(2) var<storage, read> candidateBatchIds: array<u32>;
@group(0) @binding(3) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(4) var<storage, read> processStates: array<u32>;
@group(0) @binding(5) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(6) var<storage, read> threadStates: array<u32>;
@group(0) @binding(7) var<storage, read> reachedSpans: array<u32>;
@group(0) @binding(8) var<storage, read_write> densityBins: array<atomic<u32>>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let batch = spanBatches[candidateBatchIds[workgroupId.y]];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) {
    return;
  }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let span = spans[sourceIndex];
  let processExpanded = processStates[span.processIndex] != 0u;
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  let expandedLane = threadOffsets[span.threadIndex] + localLane;
  let collapsedLane = threadOffsets[span.processIndex * THREADS_PER_PROCESS];
  let lane = f32(select(collapsedLane, expandedLane, processExpanded));
  let sourceVisible = isSpanSourceVisible(span, lane);
  let focusEnabled =
    viewUniforms.focusMode != 0u && viewUniforms.selectedSpanIndex != 0xffffffffu;
  let focusVisible = !focusEnabled ||
    reachedSpans[sourceIndex] == viewUniforms.visibilityGeneration;
  let densityVisible = sourceVisible && (isDensityMode() || !processExpanded);
  if (densityVisible && focusVisible) {
    let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
    let fraction = clamp((span.start - viewUniforms.timeMin) / timeRange, 0.0, 0.999999);
    let bin = min(u32(fraction * f32(${TRACE_DENSITY_BIN_COUNT}u)), ${TRACE_DENSITY_BIN_COUNT - 1}u);
    let densityKey = u32(lane) * ${TRACE_DENSITY_BIN_COUNT}u + bin;
    atomicAdd(&densityBins[densityKey], 1u);
  }
}`;
}

/** Publishes stable global visible-ID slices into the per-group indirect draw commands. */
export function getTraceDrawCommandsShader(
  groupBatchRanges: readonly {firstBatchIndex: number; batchCount: number}[]
): string {
  const firstBatchIndices = groupBatchRanges.map(range => `${range.firstBatchIndex}u`).join(', ');
  const lastBatchIndices = groupBatchRanges
    .map(range => `${range.firstBatchIndex + range.batchCount - 1}u`)
    .join(', ');
  return /* wgsl */ `
const GROUP_COUNT: u32 = ${groupBatchRanges.length}u;
const FIRST_BATCH_INDICES = array<u32, ${groupBatchRanges.length}>(${firstBatchIndices});
const LAST_BATCH_INDICES = array<u32, ${groupBatchRanges.length}>(${lastBatchIndices});
@group(0) @binding(0) var<storage, read> rangeCounts: array<u32>;
@group(0) @binding(1) var<storage, read> rangeOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> drawCommands: array<u32>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let groupIndex = globalId.x;
  if (groupIndex >= GROUP_COUNT) {
    return;
  }
  let firstBatchIndex = FIRST_BATCH_INDICES[groupIndex];
  let lastBatchIndex = LAST_BATCH_INDICES[groupIndex];
  let firstInstance = rangeOffsets[firstBatchIndex];
  let endInstance = rangeOffsets[lastBatchIndex] + rangeCounts[lastBatchIndex];
  let commandOffset = groupIndex * 4u;
  drawCommands[commandOffset + 1u] = endInstance - firstInstance;
  drawCommands[commandOffset + 3u] = firstInstance;
}`;
}

/** Publishes focused, generation-tagged exact visibility for candidate spans. */
export function getCandidateVisibilityShader(): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
};
${TRACE_VISIBILITY_FILTER_DECLARATIONS}
@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<storage, read> spanBatches: array<TraceSpanBatch>;
@group(0) @binding(2) var<storage, read> candidateBatchIds: array<u32>;
@group(0) @binding(3) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(4) var<storage, read> processStates: array<u32>;
@group(0) @binding(5) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(6) var<storage, read> threadStates: array<u32>;
@group(0) @binding(7) var<storage, read> reachedSpans: array<u32>;
@group(0) @binding(8) var<storage, read_write> visibilityFlags: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let batch = spanBatches[candidateBatchIds[workgroupId.y]];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) {
    return;
  }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let span = spans[sourceIndex];
  let processExpanded = processStates[span.processIndex] != 0u;
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  let expandedLane = threadOffsets[span.threadIndex] + localLane;
  let collapsedLane = threadOffsets[span.processIndex * THREADS_PER_PROCESS];
  let lane = f32(select(collapsedLane, expandedLane, processExpanded));
  let sourceVisible = isSpanSourceVisible(span, lane);
  let exactVisible = sourceVisible && processExpanded;
  let focusEnabled =
    viewUniforms.focusMode != 0u && viewUniforms.selectedSpanIndex != 0xffffffffu;
  let focusVisible = !focusEnabled ||
    reachedSpans[sourceIndex] == viewUniforms.visibilityGeneration;
  visibilityFlags[sourceIndex] = select(
    0u,
    viewUniforms.visibilityGeneration,
    exactVisible && focusVisible
  );
}`;
}

/** Resolves explicit picking inside the same compacted candidate batches as classification. */
export function getCandidatePickShader(): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
};
${TRACE_VISIBILITY_FILTER_DECLARATIONS}
@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<storage, read> spanBatches: array<TraceSpanBatch>;
@group(0) @binding(2) var<storage, read> candidateBatchIds: array<u32>;
@group(0) @binding(3) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(4) var<storage, read> processStates: array<u32>;
@group(0) @binding(5) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(6) var<storage, read> threadStates: array<u32>;
@group(0) @binding(7) var<storage, read_write> pickResult: array<atomic<u32>>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  if (viewUniforms.pickLane < 0.0) {
    return;
  }
  let batch = spanBatches[candidateBatchIds[workgroupId.y]];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) {
    return;
  }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let span = spans[sourceIndex];
  let processExpanded = processStates[span.processIndex] != 0u;
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  let expandedLane = threadOffsets[span.threadIndex] + localLane;
  let collapsedLane = threadOffsets[span.processIndex * THREADS_PER_PROCESS];
  let lane = f32(select(collapsedLane, expandedLane, processExpanded));
  let end = span.start + span.duration;
  let sourceVisible = isSpanSourceVisible(span, lane);
  let timePicked = viewUniforms.pickTime >= span.start && viewUniforms.pickTime <= end;
  let lanePicked = viewUniforms.pickLane >= lane && viewUniforms.pickLane < lane + 1.0;
  if (sourceVisible && timePicked && lanePicked) {
    atomicMin(&pickResult[0], sourceIndex);
  }
}`;
}

/** Resets the explicit click-picking result before the next visibility dispatch. */
export function getPickClearShader(): string {
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> pickResult: array<atomic<u32>>;

@compute @workgroup_size(1)
fn main() {
  atomicStore(&pickResult[0], 0xffffffffu);
}`;
}

/** Filters dependency rows inside GPU-selected candidate batches. */
export function getCandidateDependencyVisibilityShader(spanCount: number): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
struct DependencyBatch {
  firstIndex: u32,
  count: u32,
  timeMin: f32,
  timeMax: f32,
  familyMask: u32,
  batchIndex: u32,
};
const SPAN_COUNT: u32 = ${spanCount}u;
const MAXIMUM_ANCESTOR_DEPTH: u32 = 32u;
@group(0) @binding(0) var<storage, read> dependencies: array<TraceDependency>;
@group(0) @binding(1) var<storage, read> dependencyBatches: array<DependencyBatch>;
@group(0) @binding(2) var<storage, read> candidateBatchIds: array<u32>;
@group(0) @binding(3) var<storage, read> spanVisibility: array<u32>;
@group(0) @binding(4) var<storage, read> processStates: array<u32>;
@group(0) @binding(5) var<storage, read> parentSpans: array<u32>;
@group(0) @binding(6) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(7) var<storage, read_write> dependencyResults: array<u32>;

fn resolveVisibleAncestor(sourceIndex: u32) -> u32 {
  var currentIndex = sourceIndex;
  var depth = 0u;
  loop {
    if (currentIndex >= SPAN_COUNT || depth > MAXIMUM_ANCESTOR_DEPTH) {
      return 0xffffffffu;
    }
    if (spanVisibility[currentIndex] == viewUniforms.visibilityGeneration) {
      return currentIndex;
    }
    currentIndex = parentSpans[currentIndex];
    depth++;
  }
}

@compute @workgroup_size(${TRACE_DEPENDENCY_BATCH_CAPACITY})
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let batch = dependencyBatches[candidateBatchIds[workgroupId.y]];
  if (localId.x >= batch.count) {
    return;
  }
  let index = batch.firstIndex + localId.x;
  let dependency = dependencies[index];
  let projectedSource = resolveVisibleAncestor(dependency.sourceIndex);
  let projectedDestination = resolveVisibleAncestor(dependency.destinationIndex);
  let sourceProcessIndex =
    (dependency.flags >> ${TRACE_DEPENDENCY_SOURCE_PROCESS_SHIFT}u) &
    ${TRACE_DEPENDENCY_PROCESS_MASK}u;
  let destinationProcessIndex =
    (dependency.flags >> ${TRACE_DEPENDENCY_DESTINATION_PROCESS_SHIFT}u) &
    ${TRACE_DEPENDENCY_PROCESS_MASK}u;
  let sourceCollapsed = processStates[sourceProcessIndex] == 0u;
  let destinationCollapsed = processStates[destinationProcessIndex] == 0u;
  let familyVisible = (viewUniforms.dependencyMask & (1u << dependency.family)) != 0u;
  let sourceVisible =
    spanVisibility[dependency.sourceIndex] == viewUniforms.visibilityGeneration || sourceCollapsed ||
    projectedSource != 0xffffffffu;
  let destinationVisible =
    spanVisibility[dependency.destinationIndex] == viewUniforms.visibilityGeneration ||
    destinationCollapsed || projectedDestination != 0xffffffffu;
  let effectiveSource = select(projectedSource, dependency.sourceIndex, sourceCollapsed);
  let effectiveDestination = select(
    projectedDestination,
    dependency.destinationIndex,
    destinationCollapsed
  );
  let distinctEndpoints = effectiveSource != effectiveDestination;
  dependencyResults[index] = select(
    0u,
    1u,
    familyVisible && sourceVisible && destinationVisible && distinctEndpoints && !isDensityMode()
  );
  let endpointResultOffset = viewUniforms.dependencyEndpointOffset + index * 2u;
  dependencyResults[endpointResultOffset] = effectiveSource;
  dependencyResults[endpointResultOffset + 1u] = effectiveDestination;
}`;
}
