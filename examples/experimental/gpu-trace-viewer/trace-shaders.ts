// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DENSITY_BLEND_END_TIME_PER_PIXEL,
  TRACE_DENSITY_BLEND_START_TIME_PER_PIXEL,
  TRACE_DEPENDENCY_BATCH_CAPACITY,
  TRACE_DEPENDENCY_DESTINATION_PROCESS_SHIFT,
  TRACE_DEPENDENCY_PROCESS_MASK,
  TRACE_DEPENDENCY_SOURCE_PROCESS_SHIFT,
  TRACE_ERROR_SPAN_FLAG,
  TRACE_EXACT_SPAN_MINIMUM_PIXEL_WIDTH,
  TRACE_FILTER_ERRORS_ONLY,
  TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
  TRACE_FILTER_HIDE_RUNTIME_SPANS,
  TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
  TRACE_GROUPS,
  TRACE_LABEL_DICTIONARY,
  TRACE_LABEL_GLYPH_CAPACITY,
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

export type TraceSpanChunkShaderProps = {
  chunkIndex?: number;
  firstSpanIndex: number;
  spanCount: number;
  firstBatchIndex: number;
  batchCount: number;
};

function getSpanChunkDeclarations(props: TraceSpanChunkShaderProps): string {
  return `const CHUNK_INDEX: u32 = ${props.chunkIndex ?? 0}u;
const CHUNK_FIRST_SPAN_INDEX: u32 = ${props.firstSpanIndex}u;
const CHUNK_SPAN_COUNT: u32 = ${props.spanCount}u;
const CHUNK_FIRST_BATCH_INDEX: u32 = ${props.firstBatchIndex}u;
const CHUNK_BATCH_COUNT: u32 = ${props.batchCount}u;`;
}

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
  lodFadeEnabled: u32,
  labelsEnabled: u32,
  densityPattern: u32,
  densityBinOrigin: f32,
  densityBinDuration: f32,
};

const LANES_PER_THREAD: u32 = ${TRACE_LANES_PER_THREAD}u;
const THREADS_PER_PROCESS: u32 = ${TRACE_THREADS_PER_PROCESS}u;
const DENSITY_BLEND_START_TIME_PER_PIXEL: f32 = ${TRACE_DENSITY_BLEND_START_TIME_PER_PIXEL};
const DENSITY_BLEND_END_TIME_PER_PIXEL: f32 = ${TRACE_DENSITY_BLEND_END_TIME_PER_PIXEL};
const EXACT_SPAN_MINIMUM_PIXEL_WIDTH: f32 = ${TRACE_EXACT_SPAN_MINIMUM_PIXEL_WIDTH};
const VISIBILITY_GUARD_PIXEL_WIDTH: f32 = 8.0;

fn getVisibilityTimePadding() -> f32 {
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  return VISIBILITY_GUARD_PIXEL_WIDTH * timeRange /
    max(viewUniforms.viewportWidth, 1.0);
}

fn getSpanPixelWidth(duration: f32) -> f32 {
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  return duration / timeRange * max(viewUniforms.viewportWidth, 1.0);
}

fn isSpanWideEnoughForExactRendering(duration: f32) -> bool {
  return getSpanPixelWidth(duration) >= EXACT_SPAN_MINIMUM_PIXEL_WIDTH;
}

fn getMinimumExactSpanDuration() -> f32 {
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  return EXACT_SPAN_MINIMUM_PIXEL_WIDTH * timeRange /
    max(viewUniforms.viewportWidth, 1.0);
}

fn getContinuousDensityBlend() -> f32 {
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  let timePerPixel = timeRange / max(viewUniforms.viewportWidth, 1.0);
  let linearBlend = clamp(
    (timePerPixel - DENSITY_BLEND_START_TIME_PER_PIXEL) /
      (DENSITY_BLEND_END_TIME_PER_PIXEL - DENSITY_BLEND_START_TIME_PER_PIXEL),
    0.0,
    1.0
  );
  return linearBlend * linearBlend * (3.0 - 2.0 * linearBlend);
}

fn getDensityBlend() -> f32 {
  let continuousBlend = getContinuousDensityBlend();
  if (viewUniforms.lodFadeEnabled != 0u) {
    return continuousBlend;
  }
  return select(0.0, 1.0, continuousBlend >= 0.5);
}

fn isDensityMode() -> bool {
  return getDensityBlend() >= 0.5;
}

fn isExactModeActive() -> bool {
  return getDensityBlend() < 1.0;
}

fn isDensityModeActive() -> bool {
  return getDensityBlend() > 0.0;
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

/** Clears the indirect glyph count before candidate spans append fitted labels. */
export function getTraceLabelClearShader(labelDrawCommandIndex: number): string {
  return /* wgsl */ `
const LABEL_INSTANCE_COUNT_WORD: u32 = ${labelDrawCommandIndex * 4 + 1}u;
@group(0) @binding(0) var<storage, read_write> drawCommands: array<atomic<u32>>;
@compute @workgroup_size(1)
fn main() {
  atomicStore(&drawCommands[LABEL_INSTANCE_COUNT_WORD], 0u);
}`;
}

/** Appends only exact-LOD labels whose complete dictionary string fits inside its span. */
export function getCandidateLabelShader(
  props: TraceSpanChunkShaderProps,
  labelDrawCommandIndex: number
): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
${getSpanChunkDeclarations(props)}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
  maximumDuration: f32,
};
struct DictionaryMetric {
  glyphCount: u32,
  advancePixels: f32,
};
struct TraceLabelGlyph {
  start: f32,
  duration: f32,
  lane: u32,
  threadIndex: u32,
  dictionaryIndex: u32,
  glyphOffset: u32,
};
struct DictionaryTextStyle {
  color: vec4<f32>,
  glyphScale: f32,
  sdfThreshold: f32,
  sdfSmoothing: f32,
  renderMode: u32,
  lineHeightPixels: f32,
};
const LABEL_INSTANCE_COUNT_WORD: u32 = ${labelDrawCommandIndex * 4 + 1}u;
const LABEL_GLYPH_CAPACITY: u32 = ${TRACE_LABEL_GLYPH_CAPACITY}u;
@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<storage, read> spanBatches: array<TraceSpanBatch>;
@group(0) @binding(2) var<storage, read> candidateBatchIds: array<u32>;
@group(0) @binding(3) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(4) var<storage, read> visibilityFlags: array<u32>;
@group(0) @binding(5) var<storage, read> dictionaryMetrics: array<DictionaryMetric>;
@group(0) @binding(6) var<storage, read_write> labelGlyphs: array<TraceLabelGlyph>;
@group(0) @binding(7) var<storage, read_write> drawCommands: array<atomic<u32>>;
@group(0) @binding(8) var<uniform> textDictionaryStyle: DictionaryTextStyle;

fn reserveGlyphs(glyphCount: u32) -> u32 {
  loop {
    let current = atomicLoad(&drawCommands[LABEL_INSTANCE_COUNT_WORD]);
    if (current + glyphCount > LABEL_GLYPH_CAPACITY) {
      return 0xffffffffu;
    }
    let result = atomicCompareExchangeWeak(
      &drawCommands[LABEL_INSTANCE_COUNT_WORD],
      current,
      current + glyphCount
    );
    if (result.exchanged) {
      return current;
    }
  }
}

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  if (viewUniforms.labelsEnabled == 0u) {
    return;
  }
  let batchIndex = candidateBatchIds[workgroupId.y];
  if (
    batchIndex < CHUNK_FIRST_BATCH_INDEX ||
    batchIndex >= CHUNK_FIRST_BATCH_INDEX + CHUNK_BATCH_COUNT
  ) {
    return;
  }
  let batch = spanBatches[batchIndex];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) {
    return;
  }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let chunkIndex = sourceIndex - CHUNK_FIRST_SPAN_INDEX;
  let visibilityMask = 1u << (chunkIndex & 31u);
  if ((visibilityFlags[chunkIndex >> 5u] & visibilityMask) == 0u) {
    return;
  }
  let span = spans[chunkIndex];
  let dictionaryIndex = min(span.group * 4u + (span.flags & 3u), ${TRACE_LABEL_DICTIONARY.length - 1}u);
  let metric = dictionaryMetrics[dictionaryIndex];
  let spanPixelWidth = getSpanPixelWidth(span.duration);
  let lanePixelHeight =
    max(viewUniforms.viewportHeight, 1.0) /
    max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0);
  let horizontalPadding = textDictionaryStyle.lineHeightPixels * (2.0 / 7.0);
  if (
    metric.glyphCount == 0u ||
    spanPixelWidth < metric.advancePixels + horizontalPadding * 2.0 ||
    lanePixelHeight < textDictionaryStyle.lineHeightPixels + 2.0
  ) {
    return;
  }
  let firstGlyph = reserveGlyphs(metric.glyphCount);
  if (firstGlyph == 0xffffffffu) {
    return;
  }
  for (var glyphOffset = 0u; glyphOffset < metric.glyphCount; glyphOffset++) {
    labelGlyphs[firstGlyph + glyphOffset] = TraceLabelGlyph(
      span.start,
      span.duration,
      span.lane,
      span.threadIndex,
      dictionaryIndex,
      glyphOffset
    );
  }
}`;
}

/** Dictionary-backed span labels reading only GPU-selected fitted glyph occurrences. */
export const TRACE_LABEL_RENDER_SHADER = /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
struct TraceLabelGlyph {
  start: f32,
  duration: f32,
  lane: u32,
  threadIndex: u32,
  dictionaryIndex: u32,
  glyphOffset: u32,
};
struct DictionaryTextStyle {
  color: vec4<f32>,
  glyphScale: f32,
  sdfThreshold: f32,
  sdfSmoothing: f32,
  renderMode: u32,
  lineHeightPixels: f32,
};
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) textureCoordinate: vec2<f32>,
  @interpolate(flat) @location(1) atlasPage: u32,
  @location(2) color: vec4<f32>,
  @location(3) glyphPixelOffset: vec2<f32>,
  @interpolate(flat) @location(4) clipRect: vec4<f32>,
};
@group(0) @binding(0) var<storage, read> labelGlyphs: array<TraceLabelGlyph>;
@group(0) @binding(1) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(2) var<storage, read> threadStates: array<u32>;
@group(0) @binding(3) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(4) var<storage, read> textDictionaryGlyphRanges: array<vec2<u32>>;
@group(0) @binding(5) var<storage, read> textDictionaryGlyphRecords: array<vec2<u32>>;
@group(0) @binding(6) var<storage, read> textGlyphFrames: array<vec4<f32>>;
@group(0) @binding(7) var<uniform> textDictionaryStyle: DictionaryTextStyle;
@group(0) @binding(8) var fontAtlasTexture: texture_2d_array<f32>;
@group(0) @binding(9) var fontAtlasTextureSampler: sampler;

fn unpackLowInt16(word: u32) -> i32 {
  return i32(word << 16u) >> 16;
}

fn unpackHighInt16(word: u32) -> i32 {
  return i32(word) >> 16;
}

fn isGlyphVertexClipped(glyphPixelOffset: vec2<f32>, clipRect: vec4<f32>) -> bool {
  return glyphPixelOffset.x < clipRect.x ||
    glyphPixelOffset.x > clipRect.x + clipRect.z ||
    glyphPixelOffset.y < clipRect.y ||
    glyphPixelOffset.y > clipRect.y + clipRect.w;
}

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let occurrence = labelGlyphs[instanceIndex];
  let dictionaryRange = textDictionaryGlyphRanges[occurrence.dictionaryIndex];
  let glyphRecord = textDictionaryGlyphRecords[dictionaryRange.x + occurrence.glyphOffset];
  let glyphId = glyphRecord.y & 0xffffu;
  let glyphFrame = textGlyphFrames[glyphId];
  let corner = getCorner(vertexIndex);
  let glyphOffset = vec2<f32>(
    f32(unpackLowInt16(glyphRecord.x)),
    f32(unpackHighInt16(glyphRecord.x))
  );
  let glyphPixelOffset =
    vec2<f32>(
      textDictionaryStyle.lineHeightPixels * (2.0 / 7.0),
      -textDictionaryStyle.lineHeightPixels * 0.5
    ) +
    (glyphOffset + corner * glyphFrame.zw) * textDictionaryStyle.glyphScale;
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  let spanPixelWidth = getSpanPixelWidth(occurrence.duration);
  let lanePixelHeight =
    max(viewUniforms.viewportHeight, 1.0) /
    max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0);
  let clipRect = vec4<f32>(0.0, -lanePixelHeight * 0.5, spanPixelWidth, lanePixelHeight);
  let localLane = select(
    0u,
    occurrence.lane % LANES_PER_THREAD,
    threadStates[occurrence.threadIndex] != 0u
  );
  let lane = f32(threadOffsets[occurrence.threadIndex] + localLane);
  let x =
    (occurrence.start - viewUniforms.timeMin) / timeRange * 2.0 - 1.0 +
    glyphPixelOffset.x * 2.0 / max(viewUniforms.viewportWidth, 1.0);
  let y =
    1.0 - (lane + 0.5 - viewUniforms.laneMin) /
      max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0) * 2.0 -
    glyphPixelOffset.y * 2.0 / max(viewUniforms.viewportHeight, 1.0);
  var output: VertexOutput;
  output.position = vec4<f32>(x, y, 0.0, 1.0);
  output.textureCoordinate =
    (glyphFrame.xy + corner * glyphFrame.zw) /
    vec2<f32>(textureDimensions(fontAtlasTexture));
  output.atlasPage = glyphRecord.y >> 16u;
  output.color = vec4<f32>(
    textDictionaryStyle.color.rgb,
    textDictionaryStyle.color.a * select(
      1.0 - getDensityBlend(),
      1.0,
      isSpanWideEnoughForExactRendering(occurrence.duration)
    )
  );
  output.glyphPixelOffset = glyphPixelOffset;
  output.clipRect = clipRect;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  if (isGlyphVertexClipped(input.glyphPixelOffset, input.clipRect)) {
    discard;
  }
  let sampledAlpha = textureSample(
    fontAtlasTexture,
    fontAtlasTextureSampler,
    input.textureCoordinate,
    i32(input.atlasPage)
  ).a;
  let glyphAlpha = select(
    sampledAlpha,
    smoothstep(
      textDictionaryStyle.sdfThreshold - textDictionaryStyle.sdfSmoothing,
      textDictionaryStyle.sdfThreshold + textDictionaryStyle.sdfSmoothing,
      sampledAlpha
    ),
    textDictionaryStyle.renderMode != 0u
  );
  if (glyphAlpha <= 0.01 || input.color.a <= 0.01) {
    discard;
  }
  return vec4<f32>(input.color.rgb, input.color.a * glyphAlpha);
}`;

const TRACE_VISIBILITY_FILTER_DECLARATIONS = /* wgsl */ `
const RUNTIME_SPAN_FLAG: u32 = ${TRACE_RUNTIME_SPAN_FLAG}u;
const ERROR_SPAN_FLAG: u32 = ${TRACE_ERROR_SPAN_FLAG}u;
const OVERLAPPING_CHILD_FLAG: u32 = ${TRACE_OVERLAPPING_CHILD_FLAG}u;
const SIMILAR_DURATION_PARENT_FLAG: u32 = ${TRACE_SIMILAR_DURATION_PARENT_FLAG}u;

fn isSpanSourceVisible(span: TraceSpan, lane: f32) -> bool {
  let end = span.start + span.duration;
  let timePadding = getVisibilityTimePadding();
  let timeVisible = end >= viewUniforms.timeMin - timePadding &&
    span.start <= viewUniforms.timeMax + timePadding;
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
struct SpanChunkUniforms {
  firstSpanIndex: u32,
  spanCount: u32,
  firstBatchIndex: u32,
  batchCount: u32,
};
@group(0) @binding(6) var<uniform> spanChunk: SpanChunkUniforms;

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
  let span = spans[sourceIndex - spanChunk.firstSpanIndex];
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
  let isReached =
    (reachedSpans[sourceIndex >> 5u] & (1u << (sourceIndex & 31u))) != 0u;
  let hasSelection = viewUniforms.selectedSpanIndex != 0xffffffffu;
  let focusEnabled = viewUniforms.focusMode != 0u && hasSelection;
  let focusOpacity = select(1.0, select(0.22, 1.0, isReached), focusEnabled);
  let baseColor = getGroupColor(span.group) * pulse;
  // Long spans remain recognizable first; sub-pixel spans emerge only as they become readable.
  let spanPixelWidth = getSpanPixelWidth(span.duration);
  let spanReadability = smoothstep(0.6, 1.4, spanPixelWidth);
  let readabilityOpacity = select(
    1.0,
    spanReadability,
    viewUniforms.lodFadeEnabled != 0u
  );
  let exactOpacity = select(
    (1.0 - getDensityBlend()) * readabilityOpacity,
    1.0,
    isSpanWideEnoughForExactRendering(span.duration)
  );
  let minimumClipWidth = 3.0 / max(viewUniforms.viewportWidth, 1.0);
  var output: VertexOutput;
  output.position = vec4<f32>(
    mix(startX, max(endX, startX + minimumClipWidth), corner.x),
    laneY - corner.y * laneHeight * 0.78,
    0.0,
    1.0
  );
  output.color = vec4<f32>(
    select(baseColor, vec3<f32>(1.0, 0.94, 0.47), isSelected),
    select(0.9, 1.0, isSelected) * focusOpacity * exactOpacity
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
@group(0) @binding(2) var<storage, read> dependencyEndpointPositions: array<vec2<f32>>;
@group(0) @binding(3) var<uniform> viewUniforms: ViewUniforms;

struct DependencyVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> DependencyVertexOutput {
  let dependency = dependencies[visibleDependencyIds[instanceIndex]];
  let dependencyIndex = visibleDependencyIds[instanceIndex];
  let endpointResultIndex = dependencyIndex * 2u + select(0u, 1u, vertexIndex == 1u);
  let endpointPosition = dependencyEndpointPositions[endpointResultIndex];
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  let laneRange = max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0);
  let crossProcess = dependency.family != 0u;
  // Keep edges out of the density-to-span handoff until their endpoints are clearly legible.
  let dependencyOpacity = smoothstep(0.68, 0.92, 1.0 - getDensityBlend());
  var output: DependencyVertexOutput;
  output.position = vec4<f32>(
    ((endpointPosition.x - viewUniforms.timeMin) / timeRange) * 2.0 - 1.0,
    1.0 - ((endpointPosition.y - viewUniforms.laneMin) / laneRange) * 2.0,
    0.0,
    1.0
  );
  output.color = select(
    vec4<f32>(0.62, 0.79, 0.96, 0.68),
    vec4<f32>(0.95, 0.73, 0.42, 0.88),
    crossProcess
  ) * vec4<f32>(1.0, 1.0, 1.0, dependencyOpacity);
  return output;
}

@fragment fn fragmentMain(input: DependencyVertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}`;

/** Renders GPU-aggregated density bins for the current visible lane layout. */
export const TRACE_DENSITY_RENDER_SHADER = /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}

const DENSITY_BIN_COUNT: u32 = ${TRACE_DENSITY_BIN_COUNT}u;
const DENSITY_GROUP_COUNT: u32 = ${TRACE_GROUPS.length}u;
@group(0) @binding(0) var<storage, read> densityBins: array<u32>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;

struct DensityVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @interpolate(flat) @location(1) patternOffset: f32,
};

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> DensityVertexOutput {
  let lane = instanceIndex / DENSITY_BIN_COUNT;
  let binIndex = instanceIndex % DENSITY_BIN_COUNT;
  let densityValueOffset = instanceIndex * DENSITY_GROUP_COUNT;
  var count = 0u;
  var weightedColor = vec3<f32>(0.0);
  for (var groupIndex = 0u; groupIndex < DENSITY_GROUP_COUNT; groupIndex++) {
    let groupCount = densityBins[densityValueOffset + groupIndex];
    count += groupCount;
    weightedColor += getGroupColor(groupIndex) * f32(groupCount);
  }
  let corner = getCorner(vertexIndex);
  let laneRange = max(viewUniforms.laneMax - viewUniforms.laneMin, 1.0);
  let laneHeight = 2.0 / laneRange;
  let timeRange = max(viewUniforms.timeMax - viewUniforms.timeMin, 0.0001);
  let binStart = viewUniforms.densityBinOrigin +
    f32(binIndex) * viewUniforms.densityBinDuration;
  let binEnd = binStart + viewUniforms.densityBinDuration;
  let startX = ((binStart - viewUniforms.timeMin) / timeRange) * 2.0 - 1.0;
  let endX = ((binEnd - viewUniforms.timeMin) / timeRange) * 2.0 - 1.0;
  let intensity = clamp(log2(f32(count) + 1.0) * viewUniforms.activityScale, 0.0, 1.0);
  let visible = count > 0u && f32(lane) >= viewUniforms.laneMin &&
    f32(lane) < viewUniforms.laneMax;
  let densityBlend = getDensityBlend();
  let densityOpacity = select(1.0, densityBlend, isDensityModeActive());
  var output: DensityVertexOutput;
  output.position = vec4<f32>(
    mix(startX, endX, corner.x),
    1.0 - ((f32(lane) - viewUniforms.laneMin) / laneRange) * 2.0 -
      corner.y * laneHeight * 0.72,
    0.0,
    1.0
  );
  let groupColor = weightedColor / max(f32(count), 1.0);
  // Keep the density LOD at the same perceived brightness as exact span geometry.
  let densityColor = groupColor * (0.92 + intensity * 0.08);
  output.color = vec4<f32>(
    densityColor,
    select(0.0, (0.86 + 0.04 * intensity) * densityOpacity, visible)
  );
  output.patternOffset = f32((lane * 3u) % 10u);
  return output;
}

@fragment fn fragmentMain(input: DensityVertexOutput) -> @location(0) vec4<f32> {
  let patternColor = pluginApplyFillPattern(
    vec4<f32>(input.color.rgb, 1.0),
    f32(viewUniforms.densityPattern),
    input.position.xy + vec2<f32>(input.patternOffset, 0.0),
    vec2<f32>(2.0, 8.0)
  );
  // Use thin, low-contrast marks instead of alpha gaps so the pattern cannot be mistaken for
  // thick boundaries between spans. The default diagonal pattern remains brightness-neutral.
  let patternBrightness = select(
    1.0,
    mix(1.06, 0.80, patternColor.a),
    viewUniforms.densityPattern != 0u
  );
  return vec4<f32>(
    clamp(input.color.rgb * patternBrightness, vec3<f32>(0.0), vec3<f32>(1.0)),
    input.color.a
  );
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
  maximumDuration: f32,
};
const BATCH_COUNT: u32 = ${batchCount}u;
@group(0) @binding(0) var<storage, read> spanBatches: array<TraceSpanBatch>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(2) var<storage, read_write> candidateFlags: array<u32>;
@group(0) @binding(3) var<storage, read_write> exactCandidateFlags: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let batchIndex = globalId.x;
  if (batchIndex >= BATCH_COUNT) {
    return;
  }
  let batch = spanBatches[batchIndex];
  let timePadding = getVisibilityTimePadding();
  let timeVisible = batch.timeMax >= viewUniforms.timeMin - timePadding &&
    batch.timeMin <= viewUniforms.timeMax + timePadding;
  let groupVisible = (viewUniforms.enabledMask & (1u << batch.groupIndex)) != 0u;
  let candidateVisible = timeVisible && groupVisible;
  let exactCandidateVisible = candidateVisible &&
    (isExactModeActive() || batch.maximumDuration >= getMinimumExactSpanDuration());
  candidateFlags[batchIndex] = select(0u, 1u, candidateVisible);
  exactCandidateFlags[batchIndex] = select(0u, 1u, exactCandidateVisible);
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
  let timePadding = getVisibilityTimePadding();
  let timeVisible = batch.timeMin <= viewUniforms.timeMax + timePadding &&
    batch.timeMax >= viewUniforms.timeMin - timePadding;
  let familyVisible = (batch.familyMask & viewUniforms.dependencyMask) != 0u;
  candidateFlags[batchIndex] = select(
    0u,
    1u,
    timeVisible && familyVisible && isExactModeActive()
  );
}`;
}

/** Seeds a bit-packed compact focus frontier and its first indirect dispatch. */
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
    atomicOr(&reachedSpans[seed >> 5u], 1u << (seed & 31u));
    frontier[0] = seed;
    count = 1u;
  }
  frontierCount[0] = count;
  dispatchCommand[0] = select(
    0u,
    (count + WORKGROUP_SIZE - 1u) / WORKGROUP_SIZE,
    focusTraversalState[0] > 0u
  );
  dispatchCommand[1] = 1u;
  dispatchCommand[2] = 1u;
}`;
}

/** Clears the compact focus-reachability bitset before the next traversal. */
export function getFocusReachabilityClearShader(wordCount: number): string {
  return /* wgsl */ `
const WORD_COUNT: u32 = ${wordCount}u;
@group(0) @binding(0) var<storage, read_write> reachedSpans: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < WORD_COUNT) {
    reachedSpans[globalId.x] = 0u;
  }
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

/** Expands one CSR partition from a compact frontier into a bit-packed next frontier. */
export function getFocusFrontierExpansionShader(options: {
  spanCount: number;
  frontierCapacity: number;
  nodeWordBase: number;
  sourceNodeCount: number;
  offsetWordBase: number;
  neighborWordBase: number;
  neighborCount: number;
  depth: number;
}): string {
  return /* wgsl */ `
const SPAN_COUNT: u32 = ${options.spanCount}u;
const FRONTIER_CAPACITY: u32 = ${options.frontierCapacity}u;
const NODE_WORD_BASE: u32 = ${options.nodeWordBase}u;
const SOURCE_NODE_COUNT: u32 = ${options.sourceNodeCount}u;
const OFFSET_WORD_BASE: u32 = ${options.offsetWordBase}u;
const NEIGHBOR_WORD_BASE: u32 = ${options.neighborWordBase}u;
const NEIGHBOR_COUNT: u32 = ${options.neighborCount}u;
const DEPTH: u32 = ${options.depth}u;
@group(0) @binding(0) var<storage, read> topology: array<u32>;
@group(0) @binding(1) var<storage, read> neighbors: array<u32>;
@group(0) @binding(2) var<storage, read> frontier: array<u32>;
@group(0) @binding(3) var<storage, read> frontierCount: array<u32>;
@group(0) @binding(4) var<storage, read_write> nextFrontier: array<u32>;
@group(0) @binding(5) var<storage, read_write> nextFrontierCount: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> reachedSpans: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read> focusTraversalState: array<u32>;

fn findSparseRow(sourceIndex: u32) -> u32 {
  var low = 0u;
  var high = SOURCE_NODE_COUNT;
  while (low < high) {
    let middle = low + (high - low) / 2u;
    let node = topology[NODE_WORD_BASE + middle];
    if (node < sourceIndex) {
      low = middle + 1u;
    } else {
      high = middle;
    }
  }
  if (low < SOURCE_NODE_COUNT && topology[NODE_WORD_BASE + low] == sourceIndex) {
    return low;
  }
  return 0xffffffffu;
}

@compute @workgroup_size(${TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let frontierIndex = globalId.x;
  if (frontierIndex >= frontierCount[0] || DEPTH >= focusTraversalState[0]) {
    return;
  }
  let sourceIndex = frontier[frontierIndex];
  let localSourceIndex = findSparseRow(sourceIndex);
  if (localSourceIndex == 0xffffffffu) {
    return;
  }
  let firstNeighbor = min(topology[OFFSET_WORD_BASE + localSourceIndex], NEIGHBOR_COUNT);
  let lastNeighbor = min(topology[OFFSET_WORD_BASE + localSourceIndex + 1u], NEIGHBOR_COUNT);
  for (var neighborIndex = firstNeighbor; neighborIndex < lastNeighbor; neighborIndex++) {
    let neighbor = neighbors[NEIGHBOR_WORD_BASE + neighborIndex];
    let reachedMask = 1u << (neighbor & 31u);
    if (neighbor < SPAN_COUNT &&
      (atomicOr(&reachedSpans[neighbor >> 5u], reachedMask) & reachedMask) == 0u) {
      let nextIndex = atomicAdd(&nextFrontierCount[0], 1u);
      if (nextIndex < FRONTIER_CAPACITY) {
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
export function getCandidatePassDispatchShader(
  chunks: readonly {firstBatchIndex: number; batchCount: number}[] = [
    {firstBatchIndex: 0, batchCount: 1}
  ]
): string {
  const firstBatchIndices = chunks.map(chunk => `${chunk.firstBatchIndex}u`).join(', ');
  const lastBatchIndices = chunks
    .map(chunk => `${chunk.firstBatchIndex + chunk.batchCount}u`)
    .join(', ');
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
const PROCESS_COUNT: u32 = ${TRACE_PROCESS_COUNT}u;
const CHUNK_COUNT: u32 = ${chunks.length}u;
const FIRST_BATCH_INDICES = array<u32, ${chunks.length}>(${firstBatchIndices});
const LAST_BATCH_INDICES = array<u32, ${chunks.length}>(${lastBatchIndices});
@group(0) @binding(0) var<storage, read> candidateDispatchCommand: array<u32>;
@group(0) @binding(1) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(2) var<storage, read_write> densityDispatchCommand: array<u32>;
@group(0) @binding(3) var<storage, read_write> pickDispatchCommand: array<u32>;
@group(0) @binding(4) var<storage, read> processStates: array<u32>;
@group(0) @binding(5) var<storage, read> candidateBatchIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> candidateChunkOffsets: array<u32>;

fn lowerBoundCandidate(targetBatchIndex: u32, candidateBatchCount: u32) -> u32 {
  var low = 0u;
  var high = candidateBatchCount;
  while (low < high) {
    let middle = low + (high - low) / 2u;
    if (candidateBatchIds[middle] < targetBatchIndex) {
      low = middle + 1u;
    } else {
      high = middle;
    }
  }
  return low;
}

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let chunkIndex = globalId.x;
  if (chunkIndex >= CHUNK_COUNT) {
    return;
  }
  let candidateWorkgroupCount = candidateDispatchCommand[0];
  let candidateBatchCount = candidateDispatchCommand[1];
  let densityModeActive = isDensityModeActive();
  let pickActive = viewUniforms.pickLane >= 0.0;
  var hasCollapsedProcess = false;
  for (var processIndex = 0u; processIndex < PROCESS_COUNT; processIndex++) {
    hasCollapsedProcess = hasCollapsedProcess || processStates[processIndex] == 0u;
  }
  let densityActive = densityModeActive || hasCollapsedProcess;
  let firstCandidateIndex = lowerBoundCandidate(
    FIRST_BATCH_INDICES[chunkIndex],
    candidateBatchCount
  );
  let lastCandidateIndex = lowerBoundCandidate(
    LAST_BATCH_INDICES[chunkIndex],
    candidateBatchCount
  );
  let chunkCandidateCount = lastCandidateIndex - firstCandidateIndex;
  let commandOffset = chunkIndex * 3u;
  candidateChunkOffsets[chunkIndex] = firstCandidateIndex;

  densityDispatchCommand[commandOffset] = candidateWorkgroupCount;
  densityDispatchCommand[commandOffset + 1u] = select(0u, chunkCandidateCount, densityActive);
  densityDispatchCommand[commandOffset + 2u] = 1u;
  pickDispatchCommand[commandOffset] = candidateWorkgroupCount;
  pickDispatchCommand[commandOffset + 1u] = select(0u, chunkCandidateCount, pickActive);
  pickDispatchCommand[commandOffset + 2u] = 1u;
}`;
}

/** Clears the fixed-size density target without touching source-aligned span storage. */
export function getDensityClearShader(): string {
  return /* wgsl */ `
const DENSITY_BIN_COUNT: u32 = ${TRACE_LANE_COUNT * TRACE_DENSITY_BIN_COUNT * TRACE_GROUPS.length}u;
@group(0) @binding(0) var<storage, read_write> densityBins: array<u32>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < DENSITY_BIN_COUNT) {
    densityBins[globalId.x] = 0u;
  }
}`;
}

/** Clears exact visibility before sparse candidate batches publish retained spans. */
export function getSpanVisibilityClearShader(spanCount: number): string {
  return /* wgsl */ `
const VISIBILITY_WORD_COUNT: u32 = ${Math.max(Math.ceil(spanCount / 32), 1)}u;
@group(0) @binding(0) var<storage, read_write> visibilityFlags: array<u32>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < VISIBILITY_WORD_COUNT) {
    visibilityFlags[globalId.x] = 0u;
  }
}`;
}

/** Classifies and aggregates focused candidate density without span-sized intermediate keys. */
export function getCandidateDensityShader(props: TraceSpanChunkShaderProps): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
${getSpanChunkDeclarations(props)}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
  maximumDuration: f32,
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
@group(0) @binding(9) var<storage, read> candidateChunkOffsets: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let candidateIndex = candidateChunkOffsets[CHUNK_INDEX] + workgroupId.y;
  let batchIndex = candidateBatchIds[candidateIndex];
  if (
    batchIndex < CHUNK_FIRST_BATCH_INDEX ||
    batchIndex >= CHUNK_FIRST_BATCH_INDEX + CHUNK_BATCH_COUNT
  ) {
    return;
  }
  let batch = spanBatches[batchIndex];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) {
    return;
  }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let span = spans[sourceIndex - CHUNK_FIRST_SPAN_INDEX];
  let processExpanded = processStates[span.processIndex] != 0u;
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  let expandedLane = threadOffsets[span.threadIndex] + localLane;
  let collapsedLane = threadOffsets[span.processIndex * THREADS_PER_PROCESS];
  let lane = f32(select(collapsedLane, expandedLane, processExpanded));
  let sourceVisible = isSpanSourceVisible(span, lane);
  let focusEnabled =
    viewUniforms.focusMode != 0u && viewUniforms.selectedSpanIndex != 0xffffffffu;
  let focusVisible = !focusEnabled ||
    (reachedSpans[sourceIndex >> 5u] & (1u << (sourceIndex & 31u))) != 0u;
  let retainedExactSpan =
    processExpanded && isSpanWideEnoughForExactRendering(span.duration);
  let densityVisible =
    sourceVisible && (isDensityModeActive() || !processExpanded) && !retainedExactSpan;
  if (densityVisible && focusVisible) {
    let maximumBin = f32(${TRACE_DENSITY_BIN_COUNT - 1}u);
    let firstBin = u32(clamp(
      floor((span.start - viewUniforms.densityBinOrigin) /
        viewUniforms.densityBinDuration),
      0.0,
      maximumBin
    ));
    let lastBin = u32(clamp(
      floor((span.start + span.duration - viewUniforms.densityBinOrigin) /
        viewUniforms.densityBinDuration),
      0.0,
      maximumBin
    ));
    // Preserve temporal coverage: a long span contributes to every density bin it crosses.
    for (var bin = firstBin; bin <= lastBin; bin++) {
      let densityKey =
        (u32(lane) * ${TRACE_DENSITY_BIN_COUNT}u + bin) * ${TRACE_GROUPS.length}u + span.group;
      atomicAdd(&densityBins[densityKey], 1u);
    }
  }
}`;
}

/** Publishes stable visible-ID slices into the per-group, per-chunk indirect draw commands. */
export function getTraceDrawCommandsShader(
  drawBatchRanges: readonly {firstBatchIndex: number; batchCount: number}[]
): string {
  const firstBatchIndices = drawBatchRanges.map(range => `${range.firstBatchIndex}u`).join(', ');
  const lastBatchIndices = drawBatchRanges
    .map(range => `${range.firstBatchIndex + range.batchCount - 1}u`)
    .join(', ');
  return /* wgsl */ `
const DRAW_COUNT: u32 = ${drawBatchRanges.length}u;
const FIRST_BATCH_INDICES = array<u32, ${drawBatchRanges.length}>(${firstBatchIndices});
const LAST_BATCH_INDICES = array<u32, ${drawBatchRanges.length}>(${lastBatchIndices});
@group(0) @binding(0) var<storage, read> rangeCounts: array<u32>;
@group(0) @binding(1) var<storage, read> rangeOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> drawCommands: array<u32>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let drawIndex = globalId.x;
  if (drawIndex >= DRAW_COUNT) {
    return;
  }
  let firstBatchIndex = FIRST_BATCH_INDICES[drawIndex];
  let lastBatchIndex = LAST_BATCH_INDICES[drawIndex];
  let firstInstance = rangeOffsets[firstBatchIndex];
  let endInstance = rangeOffsets[lastBatchIndex] + rangeCounts[lastBatchIndex];
  let commandOffset = drawIndex * 4u;
  drawCommands[commandOffset + 1u] = endInstance - firstInstance;
  drawCommands[commandOffset + 3u] = firstInstance;
}`;
}

/** Publishes focused exact visibility as one atomic bit per candidate span. */
export function getCandidateVisibilityShader(props: TraceSpanChunkShaderProps): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
${getSpanChunkDeclarations(props)}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
  maximumDuration: f32,
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
@group(0) @binding(8) var<storage, read_write> visibilityFlags: array<atomic<u32>>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let batchIndex = candidateBatchIds[workgroupId.y];
  if (
    batchIndex < CHUNK_FIRST_BATCH_INDEX ||
    batchIndex >= CHUNK_FIRST_BATCH_INDEX + CHUNK_BATCH_COUNT
  ) {
    return;
  }
  let batch = spanBatches[batchIndex];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) {
    return;
  }
  if (isDensityModeActive() && batch.maximumDuration < getMinimumExactSpanDuration()) {
    return;
  }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let span = spans[sourceIndex - CHUNK_FIRST_SPAN_INDEX];
  let processExpanded = processStates[span.processIndex] != 0u;
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  let expandedLane = threadOffsets[span.threadIndex] + localLane;
  let collapsedLane = threadOffsets[span.processIndex * THREADS_PER_PROCESS];
  let lane = f32(select(collapsedLane, expandedLane, processExpanded));
  let sourceVisible = isSpanSourceVisible(span, lane);
  let exactVisible = sourceVisible && processExpanded &&
    (isExactModeActive() || isSpanWideEnoughForExactRendering(span.duration));
  let focusEnabled =
    viewUniforms.focusMode != 0u && viewUniforms.selectedSpanIndex != 0xffffffffu;
  let focusVisible = !focusEnabled ||
    (reachedSpans[sourceIndex >> 5u] & (1u << (sourceIndex & 31u))) != 0u;
  let chunkIndex = sourceIndex - CHUNK_FIRST_SPAN_INDEX;
  let visibilityMask = 1u << (chunkIndex & 31u);
  if (exactVisible && focusVisible) {
    atomicOr(&visibilityFlags[chunkIndex >> 5u], visibilityMask);
  }
}`;
}

/** Expands candidate visibility bits for generation-tagged dependency endpoint resolution. */
export function getCandidateDependencySpanVisibilityShader(
  props: TraceSpanChunkShaderProps
): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
${getSpanChunkDeclarations(props)}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
  maximumDuration: f32,
};
@group(0) @binding(0) var<storage, read> visibilityFlags: array<u32>;
@group(0) @binding(1) var<storage, read> spanBatches: array<TraceSpanBatch>;
@group(0) @binding(2) var<storage, read> candidateBatchIds: array<u32>;
@group(0) @binding(3) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(4) var<storage, read_write> dependencySpanVisibility: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let batchIndex = candidateBatchIds[workgroupId.y];
  if (
    batchIndex < CHUNK_FIRST_BATCH_INDEX ||
    batchIndex >= CHUNK_FIRST_BATCH_INDEX + CHUNK_BATCH_COUNT
  ) {
    return;
  }
  let batch = spanBatches[batchIndex];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) {
    return;
  }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let chunkIndex = sourceIndex - CHUNK_FIRST_SPAN_INDEX;
  let isVisible =
    (visibilityFlags[chunkIndex >> 5u] & (1u << (chunkIndex & 31u))) != 0u;
  dependencySpanVisibility[sourceIndex] = select(
    0u,
    viewUniforms.visibilityGeneration,
    isVisible
  );
}`;
}

/** Resolves explicit picking inside the same compacted candidate batches as classification. */
export function getCandidatePickShader(props: TraceSpanChunkShaderProps): string {
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
${getSpanChunkDeclarations(props)}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
  maximumDuration: f32,
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
@group(0) @binding(8) var<storage, read> candidateChunkOffsets: array<u32>;

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  if (viewUniforms.pickLane < 0.0) {
    return;
  }
  let candidateIndex = candidateChunkOffsets[CHUNK_INDEX] + workgroupId.y;
  let batchIndex = candidateBatchIds[candidateIndex];
  if (
    batchIndex < CHUNK_FIRST_BATCH_INDEX ||
    batchIndex >= CHUNK_FIRST_BATCH_INDEX + CHUNK_BATCH_COUNT
  ) {
    return;
  }
  let batch = spanBatches[batchIndex];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) {
    return;
  }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let span = spans[sourceIndex - CHUNK_FIRST_SPAN_INDEX];
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

/** Copies the winning source row into the small pick result buffer for one-shot readback. */
export function getPickResolveShader(props: TraceSpanChunkShaderProps): string {
  return /* wgsl */ `
${getSpanChunkDeclarations(props)}
struct TraceSpan {
  start: f32,
  duration: f32,
  lane: u32,
  group: u32,
  processIndex: u32,
  threadIndex: u32,
  sourceIndex: u32,
  flags: u32,
};
@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<storage, read_write> pickResult: array<atomic<u32>>;

@compute @workgroup_size(1)
fn main() {
  let sourceIndex = atomicLoad(&pickResult[0]);
  if (
    sourceIndex < CHUNK_FIRST_SPAN_INDEX ||
    sourceIndex >= CHUNK_FIRST_SPAN_INDEX + CHUNK_SPAN_COUNT
  ) {
    return;
  }
  let span = spans[sourceIndex - CHUNK_FIRST_SPAN_INDEX];
  atomicStore(&pickResult[1], bitcast<u32>(span.start));
  atomicStore(&pickResult[2], bitcast<u32>(span.duration));
  atomicStore(&pickResult[3], span.lane);
  atomicStore(&pickResult[4], span.group);
  atomicStore(&pickResult[5], span.processIndex);
  atomicStore(&pickResult[6], span.threadIndex);
  atomicStore(&pickResult[7], span.sourceIndex);
  atomicStore(&pickResult[8], span.flags);
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

/** Filters dependency rows and counts visible endpoints by span chunk. */
export function getCandidateDependencyVisibilityShader(
  props: TraceDependencyEndpointRoutingShaderProps
): string {
  const spanCount = props.spanChunks.at(-1)?.spanCount || 0;
  const firstSpanIndex = props.spanChunks.at(-1)?.firstSpanIndex || 0;
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
const SPAN_COUNT: u32 = ${firstSpanIndex + spanCount}u;
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
  if (localId.x < batch.count) {
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
    // Retain an edge while either endpoint is visible; rasterization clips the off-screen half.
    let visible = familyVisible && (sourceVisible || destinationVisible) &&
      effectiveSource != effectiveDestination && isExactModeActive();
    dependencyResults[index] = select(0u, 1u, visible);
    let endpointResultOffset = viewUniforms.dependencyEndpointOffset + index * 2u;
    dependencyResults[endpointResultOffset] = effectiveSource;
    dependencyResults[endpointResultOffset + 1u] = effectiveDestination;
  }
}`;
}

export type TraceDependencyEndpointRoutingShaderProps = {
  dependencyCount: number;
  spanChunks: readonly TraceSpanChunkShaderProps[];
};

/** Resolves the routed endpoint jobs for one bounded source span chunk. */
export function getDependencyEndpointResolveShader(
  props: TraceDependencyEndpointRoutingShaderProps,
  chunkIndex: number
): string {
  const chunk = props.spanChunks[chunkIndex];
  return /* wgsl */ `
${TRACE_SHADER_DECLARATIONS}
${getSpanChunkDeclarations(chunk)}
const DEPENDENCY_COUNT: u32 = ${props.dependencyCount}u;
const CHUNK_COUNT: u32 = ${props.spanChunks.length}u;
const CHUNK_INDEX: u32 = ${chunkIndex}u;
const OFFSET_BASE: u32 = ${props.spanChunks.length}u;
@group(0) @binding(0) var<storage, read> spans: array<TraceSpan>;
@group(0) @binding(1) var<storage, read> endpointJobs: array<u32>;
@group(0) @binding(2) var<storage, read> endpointChunkState: array<u32>;
@group(0) @binding(3) var<storage, read> dependencyResults: array<u32>;
@group(0) @binding(4) var<storage, read> processStates: array<u32>;
@group(0) @binding(5) var<storage, read> threadStates: array<u32>;
@group(0) @binding(6) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(7) var<storage, read_write> dependencyEndpointPositions: array<vec2<f32>>;
@group(0) @binding(8) var<uniform> viewUniforms: ViewUniforms;

fn getEndpointLane(span: TraceSpan) -> u32 {
  if (processStates[span.processIndex] == 0u) {
    return threadOffsets[span.processIndex * THREADS_PER_PROCESS];
  }
  let localLane = select(0u, span.lane % LANES_PER_THREAD, threadStates[span.threadIndex] != 0u);
  return threadOffsets[span.threadIndex] + localLane;
}

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let endpointCount = endpointChunkState[CHUNK_INDEX];
  if (globalId.x >= endpointCount) {
    return;
  }
  let endpointJobIndex = endpointJobs[endpointChunkState[OFFSET_BASE + CHUNK_INDEX] + globalId.x];
  let endpointIndex = endpointJobIndex & 1u;
  let sourceIndex = dependencyResults[DEPENDENCY_COUNT + endpointJobIndex];
  let span = spans[sourceIndex - CHUNK_FIRST_SPAN_INDEX];
  let endpointTime = select(span.start + span.duration, span.start, endpointIndex == 1u);
  dependencyEndpointPositions[endpointJobIndex] = vec2<f32>(
    endpointTime,
    f32(getEndpointLane(span)) + 0.4
  );
}`;
}
