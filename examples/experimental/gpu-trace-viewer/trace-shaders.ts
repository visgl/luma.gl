// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DENSITY_TIME_PER_PIXEL,
  TRACE_ERROR_SPAN_FLAG,
  TRACE_FILTER_ERRORS_ONLY,
  TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
  TRACE_FILTER_HIDE_RUNTIME_SPANS,
  TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
  TRACE_LANES_PER_THREAD,
  TRACE_OVERLAPPING_CHILD_FLAG,
  TRACE_RUNTIME_SPAN_FLAG,
  TRACE_SIMILAR_DURATION_PARENT_FLAG,
  TRACE_THREADS_PER_PROCESS
} from './trace-data';

const TRACE_WORKGROUP_SIZE = 256;

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
  let isReached = reachedSpans[sourceIndex] != 0u;
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
@group(0) @binding(6) var<storage, read> visibleAncestors: array<u32>;
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

fn getResolvedEndpoint(sourceIndex: u32) -> TraceSpan {
  let sourceSpan = spans[sourceIndex];
  if (processStates[sourceSpan.processIndex] == 0u) {
    return sourceSpan;
  }
  let visibleAncestor = visibleAncestors[sourceIndex];
  return spans[select(sourceIndex, visibleAncestor, visibleAncestor != 0xffffffffu)];
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> DependencyVertexOutput {
  let dependency = dependencies[visibleDependencyIds[instanceIndex]];
  let spanIndex = select(dependency.sourceIndex, dependency.destinationIndex, vertexIndex == 1u);
  let span = getResolvedEndpoint(spanIndex);
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

/** Turns a selected dependency-reachability mask into an optional all-span focus predicate. */
export function getFocusMaskShader(spanCount: number): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
const SPAN_COUNT: u32 = ${spanCount}u;
@group(0) @binding(0) var<storage, read> reachedSpans: array<u32>;
@group(0) @binding(1) var<storage, read> activeSeedCount: array<u32>;
@group(0) @binding(2) var<storage, read_write> focusMask: array<u32>;
@group(0) @binding(3) var<uniform> viewUniforms: ViewUniforms;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= SPAN_COUNT) {
    return;
  }
  let focusEnabled = viewUniforms.focusMode != 0u && activeSeedCount[0] != 0u;
  focusMask[index] = select(1u, select(0u, 1u, reachedSpans[index] != 0u), focusEnabled);
}`;
}

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

/** Tests view, process, thread, status, duration, and source filters for one stable draw group. */
export function getVisibilityShader(
  spanCount: number,
  groupIndex: number,
  firstSpanIndex = 0
): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
const SPAN_COUNT: u32 = ${spanCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const GROUP_BIT: u32 = ${1 << groupIndex}u;
const RUNTIME_SPAN_FLAG: u32 = ${TRACE_RUNTIME_SPAN_FLAG}u;
const ERROR_SPAN_FLAG: u32 = ${TRACE_ERROR_SPAN_FLAG}u;
const OVERLAPPING_CHILD_FLAG: u32 = ${TRACE_OVERLAPPING_CHILD_FLAG}u;
const SIMILAR_DURATION_PARENT_FLAG: u32 = ${TRACE_SIMILAR_DURATION_PARENT_FLAG}u;
@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(2) var<storage, read> processStates: array<u32>;
@group(0) @binding(3) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(4) var<storage, read> threadStates: array<u32>;
@group(0) @binding(5) var<storage, read_write> visibilityFlags: array<u32>;
@group(0) @binding(6) var<storage, read_write> pickResult: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read_write> densityKeys: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let groupRowIndex = globalId.x;
  if (groupRowIndex >= SPAN_COUNT) {
    return;
  }
  let sourceIndex = FIRST_SPAN_INDEX + groupRowIndex;
  let span = spans[sourceIndex];
  let end = span.start + span.duration;
  let processExpanded = processStates[span.processIndex] != 0u;
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  let expandedLane = threadOffsets[span.threadIndex] + localLane;
  let collapsedLane = threadOffsets[span.processIndex * THREADS_PER_PROCESS];
  let lane = f32(select(collapsedLane, expandedLane, processExpanded));
  let timeVisible = end >= viewUniforms.timeMin && span.start <= viewUniforms.timeMax;
  let laneVisible = lane >= viewUniforms.laneMin && lane < viewUniforms.laneMax;
  let groupVisible = (viewUniforms.enabledMask & GROUP_BIT) != 0u;
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
  let sourceVisible = timeVisible && laneVisible && groupVisible &&
    statusVisible && runtimeVisible && errorVisible && overlappingChildVisible &&
    similarParentVisible && durationVisible;
  let densityMode = isDensityMode();
  let exactVisible = sourceVisible && processExpanded && !densityMode;
  visibilityFlags[sourceIndex] = select(0u, 1u, exactVisible);
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  let fraction = clamp((span.start - viewUniforms.timeMin) / timeRange, 0.0, 0.999999);
  let bin = min(u32(fraction * f32(${TRACE_DENSITY_BIN_COUNT}u)), ${TRACE_DENSITY_BIN_COUNT - 1}u);
  let densityKey = u32(lane) * ${TRACE_DENSITY_BIN_COUNT}u + bin;
  let densityVisible = sourceVisible && (densityMode || !processExpanded);
  densityKeys[sourceIndex] = select(0xffffffffu, densityKey, densityVisible);
  let pickRequested = viewUniforms.pickLane >= 0.0;
  let timePicked = viewUniforms.pickTime >= span.start &&
    viewUniforms.pickTime <= span.start + span.duration;
  let lanePicked = viewUniforms.pickLane >= lane && viewUniforms.pickLane < lane + 1.0;
  if (sourceVisible && pickRequested && timePicked && lanePicked) {
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

/** Filters canonical dependency rows against visible or collapsed endpoint ownership. */
export function getDependencyVisibilityShader(dependencyCount: number): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
const DEPENDENCY_COUNT: u32 = ${dependencyCount}u;
@group(0) @binding(0) var<storage, read> dependencies: array<TraceDependency>;
@group(0) @binding(1) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(2) var<storage, read> spanVisibility: array<u32>;
@group(0) @binding(3) var<storage, read> processStates: array<u32>;
@group(0) @binding(4) var<storage, read> visibleAncestors: array<u32>;
@group(0) @binding(5) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(6) var<storage, read_write> dependencyFlags: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= DEPENDENCY_COUNT) {
    return;
  }
  let dependency = dependencies[index];
  let source = spans[dependency.sourceIndex];
  let destination = spans[dependency.destinationIndex];
  let projectedSource = visibleAncestors[dependency.sourceIndex];
  let projectedDestination = visibleAncestors[dependency.destinationIndex];
  let sourceCollapsed = processStates[source.processIndex] == 0u;
  let destinationCollapsed = processStates[destination.processIndex] == 0u;
  let familyVisible = (viewUniforms.dependencyMask & (1u << dependency.family)) != 0u;
  let sourceVisible =
    spanVisibility[dependency.sourceIndex] != 0u || sourceCollapsed ||
    projectedSource != 0xffffffffu;
  let destinationVisible =
    spanVisibility[dependency.destinationIndex] != 0u ||
    destinationCollapsed || projectedDestination != 0xffffffffu;
  let effectiveSource = select(projectedSource, dependency.sourceIndex, sourceCollapsed);
  let effectiveDestination = select(
    projectedDestination,
    dependency.destinationIndex,
    destinationCollapsed
  );
  let distinctEndpoints = effectiveSource != effectiveDestination;
  dependencyFlags[index] = select(
    0u,
    1u,
    familyVisible && sourceVisible && destinationVisible && distinctEndpoints && !isDensityMode()
  );
}`;
}
