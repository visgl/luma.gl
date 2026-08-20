// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView,
  GraphVectorView
} from '../gpu-core/gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-core/graph-data-view-utils';

const ANOMALY_WORKGROUP_SIZE = 256;
const DEFAULT_MAXIMUM_ROWS_PER_PASS = 0xffffffff;
const MAXIMUM_FLOAT32 = 3.402823e38;

/** Bit flags written to `summary[3]` by {@link GPUTraceAnomalyScoring}. */
export const GPU_TRACE_ANOMALY_INVALID_GROUP = 1;
export const GPU_TRACE_ANOMALY_INVALID_DURATION = 2;
export const GPU_TRACE_ANOMALY_INVALID_BASELINE = 4;
export const GPU_TRACE_ANOMALY_NUMERIC_OVERFLOW = 8;

/** One packed canonical column or ordered chunks preserving canonical row order. */
export type GPUTraceAnomalyColumn<T extends 'uint32' | 'float32'> =
  | GraphDataView<T>
  | GraphVectorView<T>;

/** Caller-owned outputs from trace anomaly scoring. */
export type GPUTraceAnomalyScoringOutput = {
  /** Nonnegative policy score per span; invalid rows receive zero. */
  scores: GraphDataView<'float32'>;
  /** One when the score reaches the configured threshold and zero otherwise. */
  anomalyMask: GraphDataView<'uint32'>;
  /** Anomaly count, maximum-score bits, stable maximum index, and validation flags. */
  summary: GraphDataView<'uint32'>;
};

/** Properties for explicit, replaceable peer-baseline anomaly scoring. */
export type GPUTraceAnomalyScoringProps = {
  id?: string;
  /** Dense peer-group index per canonical span. */
  groupIndices: GPUTraceAnomalyColumn<'uint32'>;
  /** Nonnegative finite duration per canonical span. */
  durations: GPUTraceAnomalyColumn<'float32'>;
  /** Zero for success and nonzero for an error per canonical span. */
  errorMask: GPUTraceAnomalyColumn<'uint32'>;
  /** Baseline duration mean per dense peer group. */
  baselineDurationMeans: GraphDataView<'float32'>;
  /** Baseline duration standard deviation per dense peer group. */
  baselineDurationStandardDeviations: GraphDataView<'float32'>;
  /** Baseline error probability in the inclusive range zero to one per dense peer group. */
  baselineErrorRates: GraphDataView<'float32'>;
  output: GPUTraceAnomalyScoringOutput;
  /** Contribution from duration z-score. Defaults to one. */
  durationWeight?: number;
  /** Contribution from absolute error-rate delta. Defaults to one. */
  errorWeight?: number;
  /** Score at which a span enters `anomalyMask`. Defaults to three. */
  threshold?: number;
  /** Standard-deviation floor used for stable peer groups. Defaults to 0.001. */
  minimumStandardDeviation?: number;
  /** Score slow spans only or deviations in either direction. Defaults to `slow`. */
  durationMode?: 'slow' | 'two-sided';
  /** Optional row partition size for finer resumable scheduling. Defaults to one uint32 range. */
  maximumRowsPerPass?: number;
};

/** Static work information for one anomaly-scoring contributor. */
export type GPUTraceAnomalyScoringStats = {
  spanCount: number;
  groupCount: number;
  chunkCount: number;
};

/**
 * Scores canonical trace spans against caller-owned peer baselines.
 *
 * The policy is deliberately explicit: a duration z-score and error-rate delta are independently
 * weighted, then compared with a caller-provided threshold. Baselines may come from another trace,
 * a saved deployment cohort, or GPU aggregations over the current selection. Per-span scores and
 * masks stay GPU-resident; only the four-word summary needs readback for a compact UI result.
 */
export class GPUTraceAnomalyScoring implements GPUCommandGraphContributor {
  readonly id: string;
  readonly props: GPUTraceAnomalyScoringProps;
  readonly stats: Readonly<GPUTraceAnomalyScoringStats>;

  constructor(props: GPUTraceAnomalyScoringProps) {
    this.id = props.id ?? 'gpu-trace-anomaly-scoring';
    this.props = props;
    this.stats = Object.freeze(validateAnomalyScoring(this.id, props));
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = getAnomalyViews(this.props);
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    addSummaryClearPass(graph, this);
    if (this.stats.spanCount === 0) return;

    const groupChunks = getColumnChunks(this.props.groupIndices);
    const durationChunks = getColumnChunks(this.props.durations);
    const errorChunks = getColumnChunks(this.props.errorMask);
    const maximumRowsPerPass = getMaximumRowsPerPass(this.props);
    let firstSpanIndex = 0;
    for (let chunkIndex = 0; chunkIndex < groupChunks.length; chunkIndex++) {
      for (let firstChunkIndex = 0; firstChunkIndex < groupChunks[chunkIndex].length; ) {
        const rowCount = Math.min(
          maximumRowsPerPass,
          groupChunks[chunkIndex].length - firstChunkIndex
        );
        addScoringPass(
          graph,
          this,
          groupChunks[chunkIndex],
          durationChunks[chunkIndex],
          errorChunks[chunkIndex],
          firstSpanIndex + firstChunkIndex,
          firstChunkIndex,
          rowCount,
          chunkIndex
        );
        firstChunkIndex += rowCount;
      }
      firstSpanIndex += groupChunks[chunkIndex].length;
    }
    for (let firstPassSpanIndex = 0; firstPassSpanIndex < this.stats.spanCount; ) {
      const rowCount = Math.min(maximumRowsPerPass, this.stats.spanCount - firstPassSpanIndex);
      addSummaryPass(graph, this, firstPassSpanIndex, rowCount);
      firstPassSpanIndex += rowCount;
    }
    for (let firstPassSpanIndex = 0; firstPassSpanIndex < this.stats.spanCount; ) {
      const rowCount = Math.min(maximumRowsPerPass, this.stats.spanCount - firstPassSpanIndex);
      addMaximumIndexPass(graph, this, firstPassSpanIndex, rowCount);
      firstPassSpanIndex += rowCount;
    }
  }
}

function addSummaryClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  scoring: GPUTraceAnomalyScoring
): void {
  const {summary} = scoring.props.output;
  const source = /* wgsl */ `
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(summary)}u;
@group(0) @binding(0) var<storage, read_write> summary: array<u32>;
@compute @workgroup_size(1)
fn main() {
  summary[SUMMARY_OFFSET] = 0u;
  summary[SUMMARY_OFFSET + 1u] = 0u;
  summary[SUMMARY_OFFSET + 2u] = 0xffffffffu;
  summary[SUMMARY_OFFSET + 3u] = 0u;
}`;
  addAnomalyPass(graph, {
    id: `${scoring.id}-clear-summary`,
    source,
    bindings: {summary},
    resources: [{buffer: summary, usage: 'storage-write'}],
    dispatch: {x: 1, y: 1, z: 1},
    invocationCount: 1
  });
}

function addScoringPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  scoring: GPUTraceAnomalyScoring,
  groupIndices: GraphDataView<'uint32'>,
  durations: GraphDataView<'float32'>,
  errorMask: GraphDataView<'uint32'>,
  firstSpanIndex: number,
  firstChunkIndex: number,
  rowCount: number,
  chunkIndex: number
): void {
  const {props, stats, id} = scoring;
  const {output} = props;
  const dispatch = getAnomalyDispatch(
    graph,
    `${id}-score-${chunkIndex}-${firstChunkIndex}`,
    rowCount
  );
  const source = /* wgsl */ `
const CHUNK_SPAN_COUNT: u32 = ${rowCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const FIRST_CHUNK_INDEX: u32 = ${firstChunkIndex}u;
const GROUP_COUNT: u32 = ${stats.groupCount}u;
const GROUP_OFFSET: u32 = ${getViewElementOffset(groupIndices)}u;
const GROUP_STRIDE: u32 = ${getScalarStride(groupIndices)}u;
const DURATION_OFFSET: u32 = ${getViewElementOffset(durations)}u;
const DURATION_STRIDE: u32 = ${getScalarStride(durations)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(errorMask)}u;
const ERROR_STRIDE: u32 = ${getScalarStride(errorMask)}u;
const MEAN_OFFSET: u32 = ${getViewElementOffset(props.baselineDurationMeans)}u;
const DEVIATION_OFFSET: u32 = ${getViewElementOffset(props.baselineDurationStandardDeviations)}u;
const ERROR_RATE_OFFSET: u32 = ${getViewElementOffset(props.baselineErrorRates)}u;
const SCORE_OFFSET: u32 = ${getViewElementOffset(output.scores)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(output.anomalyMask)}u;
const DURATION_WEIGHT: f32 = ${formatWGSLFloat(props.durationWeight ?? 1)};
const ERROR_WEIGHT: f32 = ${formatWGSLFloat(props.errorWeight ?? 1)};
const THRESHOLD: f32 = ${formatWGSLFloat(props.threshold ?? 3)};
const MINIMUM_STANDARD_DEVIATION: f32 = ${formatWGSLFloat(props.minimumStandardDeviation ?? 0.001)};
@group(0) @binding(0) var<storage, read> groupIndices: array<u32>;
@group(0) @binding(1) var<storage, read> durations: array<f32>;
@group(0) @binding(2) var<storage, read> errorMask: array<u32>;
@group(0) @binding(3) var<storage, read> baselineDurationMeans: array<f32>;
@group(0) @binding(4) var<storage, read> baselineDurationStandardDeviations: array<f32>;
@group(0) @binding(5) var<storage, read> baselineErrorRates: array<f32>;
@group(0) @binding(6) var<storage, read_write> scores: array<f32>;
@group(0) @binding(7) var<storage, read_write> anomalyMask: array<u32>;
@compute @workgroup_size(${ANOMALY_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, ANOMALY_WORKGROUP_SIZE)}
  if (index >= CHUNK_SPAN_COUNT) { return; }
  let spanIndex = FIRST_SPAN_INDEX + index;
  let chunkIndex = FIRST_CHUNK_INDEX + index;
  let groupIndex = groupIndices[GROUP_OFFSET + chunkIndex * GROUP_STRIDE];
  let duration = durations[DURATION_OFFSET + chunkIndex * DURATION_STRIDE];
  var validationFlags = 0u;
  if (groupIndex >= GROUP_COUNT) {
    validationFlags = validationFlags | ${GPU_TRACE_ANOMALY_INVALID_GROUP}u;
  }
  if (!(duration >= 0.0 && duration <= ${formatWGSLFloat(MAXIMUM_FLOAT32)})) {
    validationFlags = validationFlags | ${GPU_TRACE_ANOMALY_INVALID_DURATION}u;
  }

  var score = 0.0;
  if (validationFlags == 0u) {
    let mean = baselineDurationMeans[MEAN_OFFSET + groupIndex];
    let standardDeviation = baselineDurationStandardDeviations[DEVIATION_OFFSET + groupIndex];
    let errorRate = baselineErrorRates[ERROR_RATE_OFFSET + groupIndex];
    if (
      !(mean >= 0.0 && mean <= ${formatWGSLFloat(MAXIMUM_FLOAT32)}) ||
      !(standardDeviation >= 0.0 && standardDeviation <= ${formatWGSLFloat(MAXIMUM_FLOAT32)}) ||
      !(errorRate >= 0.0 && errorRate <= 1.0)
    ) {
      validationFlags = validationFlags | ${GPU_TRACE_ANOMALY_INVALID_BASELINE}u;
    } else {
      let rawDurationScore = (duration - mean) / max(standardDeviation, MINIMUM_STANDARD_DEVIATION);
      let durationScore = ${props.durationMode === 'two-sided' ? 'abs(rawDurationScore)' : 'max(rawDurationScore, 0.0)'};
      let errorValue = select(0.0, 1.0, errorMask[ERROR_OFFSET + chunkIndex * ERROR_STRIDE] != 0u);
      score = DURATION_WEIGHT * durationScore + ERROR_WEIGHT * abs(errorValue - errorRate);
      if (!(score <= ${formatWGSLFloat(MAXIMUM_FLOAT32)})) {
        score = ${formatWGSLFloat(MAXIMUM_FLOAT32)};
        validationFlags = validationFlags | ${GPU_TRACE_ANOMALY_NUMERIC_OVERFLOW}u;
      }
    }
  }

  let anomalous = validationFlags == 0u && score >= THRESHOLD;
  scores[SCORE_OFFSET + spanIndex] = score;
  anomalyMask[MASK_OFFSET + spanIndex] =
    select(0u, 1u, anomalous) | (validationFlags << 16u);
}`;
  addAnomalyPass(graph, {
    id: `${id}-score-${chunkIndex}-${firstChunkIndex}`,
    source,
    bindings: {
      groupIndices,
      durations,
      errorMask,
      baselineDurationMeans: props.baselineDurationMeans,
      baselineDurationStandardDeviations: props.baselineDurationStandardDeviations,
      baselineErrorRates: props.baselineErrorRates,
      scores: output.scores,
      anomalyMask: output.anomalyMask
    },
    resources: [
      {buffer: groupIndices, usage: 'storage-read'},
      {buffer: durations, usage: 'storage-read'},
      {buffer: errorMask, usage: 'storage-read'},
      {buffer: props.baselineDurationMeans, usage: 'storage-read'},
      {buffer: props.baselineDurationStandardDeviations, usage: 'storage-read'},
      {buffer: props.baselineErrorRates, usage: 'storage-read'},
      {buffer: output.scores, usage: 'storage-write'},
      {buffer: output.anomalyMask, usage: 'storage-write'}
    ],
    dispatch,
    invocationCount: rowCount
  });
}

function addSummaryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  scoring: GPUTraceAnomalyScoring,
  firstSpanIndex: number,
  rowCount: number
): void {
  const {props, stats, id} = scoring;
  const {output} = props;
  const dispatch = getAnomalyDispatch(graph, `${id}-summarize-${firstSpanIndex}`, rowCount);
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const ROW_COUNT: u32 = ${rowCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const SCORE_OFFSET: u32 = ${getViewElementOffset(output.scores)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(output.anomalyMask)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> scores: array<f32>;
@group(0) @binding(1) var<storage, read_write> anomalyMask: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(${ANOMALY_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, ANOMALY_WORKGROUP_SIZE)}
  if (index >= ROW_COUNT) { return; }
  let spanIndex = FIRST_SPAN_INDEX + index;
  let encodedMask = atomicLoad(&anomalyMask[MASK_OFFSET + spanIndex]);
  let anomalous = encodedMask & 1u;
  let validationFlags = encodedMask >> 16u;
  atomicStore(&anomalyMask[MASK_OFFSET + spanIndex], anomalous);
  if (anomalous != 0u) {
    atomicAdd(&summary[SUMMARY_OFFSET], 1u);
  }
  atomicMax(&summary[SUMMARY_OFFSET + 1u], bitcast<u32>(scores[SCORE_OFFSET + spanIndex]));
  if (validationFlags != 0u) {
    atomicOr(&summary[SUMMARY_OFFSET + 3u], validationFlags);
  }
}`;
  addAnomalyPass(graph, {
    id: `${id}-summarize-${firstSpanIndex}`,
    source,
    bindings: {
      scores: output.scores,
      anomalyMask: output.anomalyMask,
      summary: output.summary
    },
    resources: [
      {buffer: output.scores, usage: 'storage-read'},
      {buffer: output.anomalyMask, usage: 'storage-read-write'},
      {buffer: output.summary, usage: 'storage-read-write'}
    ],
    dispatch,
    invocationCount: rowCount
  });
}

function addMaximumIndexPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  scoring: GPUTraceAnomalyScoring,
  firstSpanIndex: number,
  rowCount: number
): void {
  const {props, stats, id} = scoring;
  const {output} = props;
  const dispatch = getAnomalyDispatch(graph, `${id}-select-maximum-${firstSpanIndex}`, rowCount);
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const ROW_COUNT: u32 = ${rowCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const SCORE_OFFSET: u32 = ${getViewElementOffset(output.scores)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> scores: array<f32>;
@group(0) @binding(1) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(${ANOMALY_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, ANOMALY_WORKGROUP_SIZE)}
  if (
    index < ROW_COUNT &&
    bitcast<u32>(scores[SCORE_OFFSET + FIRST_SPAN_INDEX + index]) == atomicLoad(&summary[SUMMARY_OFFSET + 1u])
  ) {
    atomicMin(&summary[SUMMARY_OFFSET + 2u], FIRST_SPAN_INDEX + index);
  }
}`;
  addAnomalyPass(graph, {
    id: `${id}-select-maximum-${firstSpanIndex}`,
    source,
    bindings: {scores: output.scores, summary: output.summary},
    resources: [
      {buffer: output.scores, usage: 'storage-read'},
      {buffer: output.summary, usage: 'storage-read-write'}
    ],
    dispatch,
    invocationCount: rowCount
  });
}

function validateAnomalyScoring(
  id: string,
  props: GPUTraceAnomalyScoringProps
): GPUTraceAnomalyScoringStats {
  validateScalarColumn(props.groupIndices, 'uint32', `${id} groupIndices`);
  validateScalarColumn(props.durations, 'float32', `${id} durations`);
  validateScalarColumn(props.errorMask, 'uint32', `${id} errorMask`);
  validateMatchingColumns(props.groupIndices, props.durations, `${id} durations`);
  validateMatchingColumns(props.groupIndices, props.errorMask, `${id} errorMask`);
  validatePackedView(props.baselineDurationMeans, ['float32'], `${id} baselineDurationMeans`);
  validatePackedView(
    props.baselineDurationStandardDeviations,
    ['float32'],
    `${id} baselineDurationStandardDeviations`
  );
  validatePackedView(props.baselineErrorRates, ['float32'], `${id} baselineErrorRates`);
  validatePackedView(props.output.scores, ['float32'], `${id} scores`);
  validatePackedUint32View(props.output.anomalyMask, `${id} anomalyMask`);
  validatePackedUint32View(props.output.summary, `${id} summary`);

  const spanCount = props.groupIndices.length;
  const groupCount = props.baselineDurationMeans.length;
  if (
    props.baselineDurationStandardDeviations.length !== groupCount ||
    props.baselineErrorRates.length !== groupCount
  ) {
    throw new Error(`${id} baseline columns must have identical group counts`);
  }
  if (props.output.scores.length !== spanCount || props.output.anomalyMask.length !== spanCount) {
    throw new Error(`${id} per-span outputs must align with canonical trace rows`);
  }
  if (props.output.summary.length !== 4) {
    throw new Error(`${id} summary must contain exactly four uint32 words`);
  }
  validateFiniteNonnegative(props.durationWeight ?? 1, `${id} durationWeight`);
  validateFiniteNonnegative(props.errorWeight ?? 1, `${id} errorWeight`);
  validateFiniteNonnegative(props.threshold ?? 3, `${id} threshold`);
  validateFinitePositive(props.minimumStandardDeviation ?? 0.001, `${id} minimumStandardDeviation`);
  getMaximumRowsPerPass(props, id);

  const inputViews = getAnomalyInputViews(props);
  const outputViews = [props.output.scores, props.output.anomalyMask, props.output.summary];
  for (const outputView of outputViews) {
    if (inputViews.some(inputView => doGraphDataViewsOverlap(inputView, outputView))) {
      throw new Error(`${id} inputs and outputs must not overlap`);
    }
  }
  for (let firstIndex = 0; firstIndex < outputViews.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < outputViews.length; secondIndex++) {
      if (doGraphDataViewsOverlap(outputViews[firstIndex], outputViews[secondIndex])) {
        throw new Error(`${id} outputs must not overlap`);
      }
    }
  }

  return {
    spanCount,
    groupCount,
    chunkCount: getColumnChunks(props.groupIndices).length
  };
}

function getMaximumRowsPerPass(
  props: GPUTraceAnomalyScoringProps,
  id: string = props.id ?? 'gpu-trace-anomaly-scoring'
): number {
  const maximumRowsPerPass = props.maximumRowsPerPass ?? DEFAULT_MAXIMUM_ROWS_PER_PASS;
  if (!Number.isSafeInteger(maximumRowsPerPass) || maximumRowsPerPass < 1) {
    throw new Error(`${id} maximumRowsPerPass must be a positive safe integer`);
  }
  return maximumRowsPerPass;
}

function validateMatchingColumns(
  first: GPUTraceAnomalyColumn<'uint32'>,
  second: GPUTraceAnomalyColumn<'uint32'> | GPUTraceAnomalyColumn<'float32'>,
  name: string
): void {
  if (first instanceof GraphVectorView !== second instanceof GraphVectorView) {
    throw new Error(`${name} must use the same view kind as groupIndices`);
  }
  if (first instanceof GraphVectorView && second instanceof GraphVectorView) {
    validateMatchingVectorTopology(first, second, name);
  } else if (first.length !== second.length) {
    throw new Error(`${name} length must match groupIndices`);
  }
}

function validateScalarColumn(
  column: GPUTraceAnomalyColumn<'uint32'> | GPUTraceAnomalyColumn<'float32'>,
  format: 'uint32' | 'float32',
  name: string
): void {
  for (const [chunkIndex, view] of getColumnChunks(column).entries()) {
    if (
      view.format !== format ||
      view.rowByteLength !== Uint32Array.BYTES_PER_ELEMENT ||
      view.byteStride < Uint32Array.BYTES_PER_ELEMENT ||
      view.byteStride % Uint32Array.BYTES_PER_ELEMENT !== 0 ||
      view.byteOffset % Uint32Array.BYTES_PER_ELEMENT !== 0
    ) {
      throw new Error(`${name} chunk ${chunkIndex} must be uint32-aligned scalar ${format} data`);
    }
  }
}

function validateFiniteNonnegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > MAXIMUM_FLOAT32) {
    throw new Error(`${name} must be a finite nonnegative float32 value`);
  }
}

function validateFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > MAXIMUM_FLOAT32) {
    throw new Error(`${name} must be a finite positive float32 value`);
  }
}

function getAnomalyDispatch<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  count: number
): {x: number; y: number; z: number} {
  return getBoundedDispatchLayout(
    id,
    count,
    ANOMALY_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
}

function addAnomalyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    bindings: Record<string, GraphDataView>;
    resources: GraphBufferUse[];
    dispatch: {x: number; y: number; z: number};
    invocationCount: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    workload: {
      operation: 'GPUTraceAnomalyScoring',
      commandCount: 1,
      maximumWorkgroupCount: props.dispatch.x * props.dispatch.y * props.dispatch.z,
      maximumInvocationCount: props.invocationCount,
      readByteLength: props.resources.reduce(
        (sum, resource) =>
          sum +
          (resource.usage === 'storage-read' || resource.usage === 'storage-read-write'
            ? getGraphBufferByteLength(resource.buffer)
            : 0),
        0
      ),
      writeByteLength: props.resources.reduce(
        (sum, resource) =>
          sum +
          (resource.usage === 'storage-write' || resource.usage === 'storage-read-write'
            ? getGraphBufferByteLength(resource.buffer)
            : 0),
        0
      )
    },
    resources: props.resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            resolved[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolved);
          computation.dispatch(computePass, props.dispatch.x, props.dispatch.y, props.dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getGraphBufferByteLength(buffer: GraphBufferUse['buffer']): number {
  return 'byteLength' in buffer ? buffer.byteLength : buffer.buffer.byteLength;
}

function getColumnChunks<T extends 'uint32' | 'float32'>(
  column: GPUTraceAnomalyColumn<T>
): readonly GraphDataView<T>[] {
  return column instanceof GraphVectorView ? column.data : [column];
}

function getAnomalyInputViews(props: GPUTraceAnomalyScoringProps): GraphDataView[] {
  return [
    ...getColumnChunks(props.groupIndices),
    ...getColumnChunks(props.durations),
    ...getColumnChunks(props.errorMask),
    props.baselineDurationMeans,
    props.baselineDurationStandardDeviations,
    props.baselineErrorRates
  ];
}

function getAnomalyViews(props: GPUTraceAnomalyScoringProps): GraphDataView[] {
  return [
    ...getAnomalyInputViews(props),
    props.output.scores,
    props.output.anomalyMask,
    props.output.summary
  ];
}

function getScalarStride(view: GraphDataView): number {
  return view.byteStride / Uint32Array.BYTES_PER_ELEMENT;
}

function formatWGSLFloat(value: number): string {
  const formatted = value.toExponential(8).replace('e+', 'e');
  return formatted.includes('.') ? formatted : `${formatted}.0`;
}
