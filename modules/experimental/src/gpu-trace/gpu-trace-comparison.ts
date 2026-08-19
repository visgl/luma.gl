// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-core/gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-core/graph-data-view-utils';

const COMPARISON_WORKGROUP_SIZE = 256;
const MAXIMUM_FLOAT32 = 3.402823e38;
const INVALID_INDEX = 0xffffffff;

/** Bit flags written to `summary[3]` by {@link GPUTraceComparison}. */
export const GPU_TRACE_COMPARISON_INVALID_CURRENT = 1;
export const GPU_TRACE_COMPARISON_INVALID_BASELINE = 2;
export const GPU_TRACE_COMPARISON_NUMERIC_OVERFLOW = 4;

/** Aligned aggregate columns for one trace or saved peer cohort. */
export type GPUTraceComparisonSummary = {
  /** Span count per dense operation or application-defined peer group. */
  counts: GraphDataView<'uint32'>;
  /** Mean span duration per group. */
  durationMeans: GraphDataView<'float32'>;
  /** Error probability in the inclusive range zero to one per group. */
  errorRates: GraphDataView<'float32'>;
};

/** Caller-owned group columns produced by one trace comparison. */
export type GPUTraceComparisonOutput = {
  /** Signed current-minus-baseline count per group. */
  countDeltas: GraphDataView<'float32'>;
  /** Signed current-minus-baseline mean duration per group. */
  durationDeltas: GraphDataView<'float32'>;
  /** Current mean duration divided by the guarded baseline mean. */
  durationRatios: GraphDataView<'float32'>;
  /** Signed current-minus-baseline error probability per group. */
  errorRateDeltas: GraphDataView<'float32'>;
  /** Explicit weighted regression score per group. */
  scores: GraphDataView<'float32'>;
  /** One when the score reaches the threshold and zero otherwise. */
  regressionMask: GraphDataView<'uint32'>;
  /** Regression count, maximum-score bits, stable group index, and validation flags. */
  summary: GraphDataView<'uint32'>;
};

/** Properties for aligned baseline/current trace comparison. */
export type GPUTraceComparisonProps = {
  id?: string;
  /** Current trace summaries, normally produced by GPU trace aggregation. */
  current: GPUTraceComparisonSummary;
  /** Saved trace or peer-cohort summaries aligned to the same dense group dictionary. */
  baseline: GPUTraceComparisonSummary;
  output: GPUTraceComparisonOutput;
  /** Contribution from positive mean-duration ratio regression. Defaults to one. */
  durationWeight?: number;
  /** Contribution from positive error-rate regression. Defaults to one. */
  errorWeight?: number;
  /** Contribution from absolute normalized volume change. Defaults to zero. */
  countWeight?: number;
  /** Score at which a group enters `regressionMask`. Defaults to `0.25`. */
  threshold?: number;
  /** Baseline-duration floor used for ratio stability. Defaults to `0.001`. */
  minimumBaselineDuration?: number;
};

/** Static work information for one trace comparison contributor. */
export type GPUTraceComparisonStats = {
  groupCount: number;
};

/**
 * Compares aligned current and baseline trace aggregates entirely on the GPU.
 *
 * The contributor intentionally operates on compact group summaries rather than canonical spans.
 * A renderer or filter can map the resulting delta, score, or mask columns through the same dense
 * operation dictionary without allocating another per-span output set for very large traces.
 */
export class GPUTraceComparison implements GPUCommandGraphContributor {
  readonly id: string;
  readonly props: GPUTraceComparisonProps;
  readonly stats: Readonly<GPUTraceComparisonStats>;

  constructor(props: GPUTraceComparisonProps) {
    this.id = props.id ?? 'gpu-trace-comparison';
    this.props = props;
    this.stats = Object.freeze(validateComparison(this.id, props));
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (getComparisonViews(this.props).some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    addSummaryClearPass(graph, this);
    if (this.stats.groupCount === 0) return;
    addDurationComparisonPass(graph, this);
    addScorePass(graph, this);
    addSummaryPass(graph, this);
    addMaximumIndexPass(graph, this);
  }
}

function addSummaryClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  comparison: GPUTraceComparison
): void {
  const {summary} = comparison.props.output;
  const source = /* wgsl */ `
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(summary)}u;
@group(0) @binding(0) var<storage, read_write> summary: array<u32>;
@compute @workgroup_size(1)
fn main() {
  summary[SUMMARY_OFFSET] = 0u;
  summary[SUMMARY_OFFSET + 1u] = 0u;
  summary[SUMMARY_OFFSET + 2u] = ${INVALID_INDEX}u;
  summary[SUMMARY_OFFSET + 3u] = 0u;
}`;
  addComparisonComputePass(graph, {
    id: `${comparison.id}-clear-summary`,
    source,
    bindings: {summary},
    resources: [{buffer: summary, usage: 'storage-write'}],
    dispatch: {x: 1, y: 1, z: 1}
  });
}

function addDurationComparisonPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  comparison: GPUTraceComparison
): void {
  const {props, stats, id} = comparison;
  const {current, baseline, output} = props;
  const dispatch = getComparisonDispatch(graph, `${id}-compare-durations`, stats.groupCount);
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${stats.groupCount}u;
const CURRENT_COUNT_OFFSET: u32 = ${getViewElementOffset(current.counts)}u;
const CURRENT_DURATION_OFFSET: u32 = ${getViewElementOffset(current.durationMeans)}u;
const BASELINE_COUNT_OFFSET: u32 = ${getViewElementOffset(baseline.counts)}u;
const BASELINE_DURATION_OFFSET: u32 = ${getViewElementOffset(baseline.durationMeans)}u;
const COUNT_DELTA_OFFSET: u32 = ${getViewElementOffset(output.countDeltas)}u;
const DURATION_DELTA_OFFSET: u32 = ${getViewElementOffset(output.durationDeltas)}u;
const DURATION_RATIO_OFFSET: u32 = ${getViewElementOffset(output.durationRatios)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(output.regressionMask)}u;
const MINIMUM_BASELINE_DURATION: f32 = ${formatWGSLFloat(props.minimumBaselineDuration ?? 0.001)};
@group(0) @binding(0) var<storage, read> currentCounts: array<u32>;
@group(0) @binding(1) var<storage, read> currentDurationMeans: array<f32>;
@group(0) @binding(2) var<storage, read> baselineCounts: array<u32>;
@group(0) @binding(3) var<storage, read> baselineDurationMeans: array<f32>;
@group(0) @binding(4) var<storage, read_write> countDeltas: array<f32>;
@group(0) @binding(5) var<storage, read_write> durationDeltas: array<f32>;
@group(0) @binding(6) var<storage, read_write> durationRatios: array<f32>;
@group(0) @binding(7) var<storage, read_write> regressionMask: array<u32>;
@compute @workgroup_size(${COMPARISON_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, COMPARISON_WORKGROUP_SIZE)}
  if (index >= GROUP_COUNT) { return; }
  let currentCount = currentCounts[CURRENT_COUNT_OFFSET + index];
  let currentDuration = currentDurationMeans[CURRENT_DURATION_OFFSET + index];
  let baselineCount = baselineCounts[BASELINE_COUNT_OFFSET + index];
  let baselineDuration = baselineDurationMeans[BASELINE_DURATION_OFFSET + index];
  var validationFlags = 0u;
  if (!(currentDuration >= 0.0 && currentDuration <= ${formatWGSLFloat(MAXIMUM_FLOAT32)})) {
    validationFlags = validationFlags | ${GPU_TRACE_COMPARISON_INVALID_CURRENT}u;
  }
  if (!(baselineDuration >= 0.0 && baselineDuration <= ${formatWGSLFloat(MAXIMUM_FLOAT32)})) {
    validationFlags = validationFlags | ${GPU_TRACE_COMPARISON_INVALID_BASELINE}u;
  }

  var countDelta = 0.0;
  var durationDelta = 0.0;
  var durationRatio = 0.0;
  if (validationFlags == 0u) {
    countDelta = f32(currentCount) - f32(baselineCount);
    durationDelta = currentDuration - baselineDuration;
    durationRatio = currentDuration / max(baselineDuration, MINIMUM_BASELINE_DURATION);
  }

  countDeltas[COUNT_DELTA_OFFSET + index] = countDelta;
  durationDeltas[DURATION_DELTA_OFFSET + index] = durationDelta;
  durationRatios[DURATION_RATIO_OFFSET + index] = durationRatio;
  regressionMask[MASK_OFFSET + index] = validationFlags << 16u;
}`;
  addComparisonComputePass(graph, {
    id: `${id}-compare-durations`,
    source,
    bindings: {
      currentCounts: current.counts,
      currentDurationMeans: current.durationMeans,
      baselineCounts: baseline.counts,
      baselineDurationMeans: baseline.durationMeans,
      countDeltas: output.countDeltas,
      durationDeltas: output.durationDeltas,
      durationRatios: output.durationRatios,
      regressionMask: output.regressionMask
    },
    resources: [
      {buffer: current.counts, usage: 'storage-read'},
      {buffer: current.durationMeans, usage: 'storage-read'},
      {buffer: baseline.counts, usage: 'storage-read'},
      {buffer: baseline.durationMeans, usage: 'storage-read'},
      {buffer: output.countDeltas, usage: 'storage-write'},
      {buffer: output.durationDeltas, usage: 'storage-write'},
      {buffer: output.durationRatios, usage: 'storage-write'},
      {buffer: output.regressionMask, usage: 'storage-write'}
    ],
    dispatch
  });
}

function addScorePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  comparison: GPUTraceComparison
): void {
  const {props, stats, id} = comparison;
  const {current, baseline, output} = props;
  const dispatch = getComparisonDispatch(graph, `${id}-score`, stats.groupCount);
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${stats.groupCount}u;
const CURRENT_ERROR_OFFSET: u32 = ${getViewElementOffset(current.errorRates)}u;
const BASELINE_ERROR_OFFSET: u32 = ${getViewElementOffset(baseline.errorRates)}u;
const BASELINE_COUNT_OFFSET: u32 = ${getViewElementOffset(baseline.counts)}u;
const COUNT_DELTA_OFFSET: u32 = ${getViewElementOffset(output.countDeltas)}u;
const DURATION_RATIO_OFFSET: u32 = ${getViewElementOffset(output.durationRatios)}u;
const ERROR_DELTA_OFFSET: u32 = ${getViewElementOffset(output.errorRateDeltas)}u;
const SCORE_OFFSET: u32 = ${getViewElementOffset(output.scores)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(output.regressionMask)}u;
const DURATION_WEIGHT: f32 = ${formatWGSLFloat(props.durationWeight ?? 1)};
const ERROR_WEIGHT: f32 = ${formatWGSLFloat(props.errorWeight ?? 1)};
const COUNT_WEIGHT: f32 = ${formatWGSLFloat(props.countWeight ?? 0)};
const THRESHOLD: f32 = ${formatWGSLFloat(props.threshold ?? 0.25)};
@group(0) @binding(0) var<storage, read> currentErrorRates: array<f32>;
@group(0) @binding(1) var<storage, read> baselineErrorRates: array<f32>;
@group(0) @binding(2) var<storage, read> baselineCounts: array<u32>;
@group(0) @binding(3) var<storage, read> countDeltas: array<f32>;
@group(0) @binding(4) var<storage, read> durationRatios: array<f32>;
@group(0) @binding(5) var<storage, read_write> errorRateDeltas: array<f32>;
@group(0) @binding(6) var<storage, read_write> scores: array<f32>;
@group(0) @binding(7) var<storage, read_write> regressionMask: array<u32>;
@compute @workgroup_size(${COMPARISON_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, COMPARISON_WORKGROUP_SIZE)}
  if (index >= GROUP_COUNT) { return; }
  let currentError = currentErrorRates[CURRENT_ERROR_OFFSET + index];
  let baselineError = baselineErrorRates[BASELINE_ERROR_OFFSET + index];
  var validationFlags = regressionMask[MASK_OFFSET + index] >> 16u;
  if (!(currentError >= 0.0 && currentError <= 1.0)) {
    validationFlags = validationFlags | ${GPU_TRACE_COMPARISON_INVALID_CURRENT}u;
  }
  if (!(baselineError >= 0.0 && baselineError <= 1.0)) {
    validationFlags = validationFlags | ${GPU_TRACE_COMPARISON_INVALID_BASELINE}u;
  }

  var errorDelta = 0.0;
  var score = 0.0;
  if (validationFlags == 0u) {
    errorDelta = currentError - baselineError;
    let durationRegression = max(durationRatios[DURATION_RATIO_OFFSET + index] - 1.0, 0.0);
    let errorRegression = max(errorDelta, 0.0);
    let normalizedCountDelta = abs(countDeltas[COUNT_DELTA_OFFSET + index]) /
      max(f32(baselineCounts[BASELINE_COUNT_OFFSET + index]), 1.0);
    score = DURATION_WEIGHT * durationRegression +
      ERROR_WEIGHT * errorRegression + COUNT_WEIGHT * normalizedCountDelta;
    if (!(score <= ${formatWGSLFloat(MAXIMUM_FLOAT32)})) {
      score = ${formatWGSLFloat(MAXIMUM_FLOAT32)};
      validationFlags = validationFlags | ${GPU_TRACE_COMPARISON_NUMERIC_OVERFLOW}u;
    }
  }

  errorRateDeltas[ERROR_DELTA_OFFSET + index] = errorDelta;
  scores[SCORE_OFFSET + index] = score;
  regressionMask[MASK_OFFSET + index] =
    select(0u, 1u, validationFlags == 0u && score >= THRESHOLD) | (validationFlags << 16u);
}`;
  addComparisonComputePass(graph, {
    id: `${id}-score`,
    source,
    bindings: {
      currentErrorRates: current.errorRates,
      baselineErrorRates: baseline.errorRates,
      baselineCounts: baseline.counts,
      countDeltas: output.countDeltas,
      durationRatios: output.durationRatios,
      errorRateDeltas: output.errorRateDeltas,
      scores: output.scores,
      regressionMask: output.regressionMask
    },
    resources: [
      {buffer: current.errorRates, usage: 'storage-read'},
      {buffer: baseline.errorRates, usage: 'storage-read'},
      {buffer: baseline.counts, usage: 'storage-read'},
      {buffer: output.countDeltas, usage: 'storage-read'},
      {buffer: output.durationRatios, usage: 'storage-read'},
      {buffer: output.errorRateDeltas, usage: 'storage-write'},
      {buffer: output.scores, usage: 'storage-write'},
      {buffer: output.regressionMask, usage: 'storage-read-write'}
    ],
    dispatch
  });
}

function addSummaryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  comparison: GPUTraceComparison
): void {
  const {output} = comparison.props;
  const dispatch = getComparisonDispatch(
    graph,
    `${comparison.id}-summarize`,
    comparison.stats.groupCount
  );
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${comparison.stats.groupCount}u;
const SCORE_OFFSET: u32 = ${getViewElementOffset(output.scores)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(output.regressionMask)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> scores: array<f32>;
@group(0) @binding(1) var<storage, read_write> regressionMask: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(${COMPARISON_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, COMPARISON_WORKGROUP_SIZE)}
  if (index >= GROUP_COUNT) { return; }
  let encodedMask = atomicLoad(&regressionMask[MASK_OFFSET + index]);
  let regression = encodedMask & 1u;
  let validationFlags = encodedMask >> 16u;
  atomicStore(&regressionMask[MASK_OFFSET + index], regression);
  if (regression != 0u) { atomicAdd(&summary[SUMMARY_OFFSET], 1u); }
  atomicMax(&summary[SUMMARY_OFFSET + 1u], bitcast<u32>(scores[SCORE_OFFSET + index]));
  if (validationFlags != 0u) { atomicOr(&summary[SUMMARY_OFFSET + 3u], validationFlags); }
}`;
  addComparisonComputePass(graph, {
    id: `${comparison.id}-summarize`,
    source,
    bindings: {
      scores: output.scores,
      regressionMask: output.regressionMask,
      summary: output.summary
    },
    resources: [
      {buffer: output.scores, usage: 'storage-read'},
      {buffer: output.regressionMask, usage: 'storage-read-write'},
      {buffer: output.summary, usage: 'storage-read-write'}
    ],
    dispatch
  });
}

function addMaximumIndexPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  comparison: GPUTraceComparison
): void {
  const {output} = comparison.props;
  const dispatch = getComparisonDispatch(
    graph,
    `${comparison.id}-select-maximum`,
    comparison.stats.groupCount
  );
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${comparison.stats.groupCount}u;
const SCORE_OFFSET: u32 = ${getViewElementOffset(output.scores)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> scores: array<f32>;
@group(0) @binding(1) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(${COMPARISON_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, COMPARISON_WORKGROUP_SIZE)}
  if (index < GROUP_COUNT &&
      bitcast<u32>(scores[SCORE_OFFSET + index]) == atomicLoad(&summary[SUMMARY_OFFSET + 1u])) {
    atomicMin(&summary[SUMMARY_OFFSET + 2u], index);
  }
}`;
  addComparisonComputePass(graph, {
    id: `${comparison.id}-select-maximum`,
    source,
    bindings: {scores: output.scores, summary: output.summary},
    resources: [
      {buffer: output.scores, usage: 'storage-read'},
      {buffer: output.summary, usage: 'storage-read-write'}
    ],
    dispatch
  });
}

function validateComparison(id: string, props: GPUTraceComparisonProps): GPUTraceComparisonStats {
  const inputViews = [...getSummaryViews(props.current), ...getSummaryViews(props.baseline)];
  validateSummary(props.current, `${id} current`);
  validateSummary(props.baseline, `${id} baseline`);
  const groupCount = props.current.counts.length;
  if (props.baseline.counts.length !== groupCount) {
    throw new Error(`${id} current and baseline summaries must have identical group counts`);
  }

  const outputViews = getOutputViews(props.output);
  const floatOutputViews = [
    props.output.countDeltas,
    props.output.durationDeltas,
    props.output.durationRatios,
    props.output.errorRateDeltas,
    props.output.scores
  ];
  for (const view of floatOutputViews) {
    validatePackedView(view, ['float32'], `${id} output`);
    if (view.length !== groupCount) {
      throw new Error(`${id} per-group outputs must match the summary group count`);
    }
  }
  validatePackedUint32View(props.output.regressionMask, `${id} regressionMask`);
  if (props.output.regressionMask.length !== groupCount) {
    throw new Error(`${id} per-group outputs must match the summary group count`);
  }
  validatePackedUint32View(props.output.summary, `${id} summary`);
  if (props.output.summary.length !== 4) {
    throw new Error(`${id} summary must contain exactly four uint32 words`);
  }

  validateFiniteNonnegative(props.durationWeight ?? 1, `${id} durationWeight`);
  validateFiniteNonnegative(props.errorWeight ?? 1, `${id} errorWeight`);
  validateFiniteNonnegative(props.countWeight ?? 0, `${id} countWeight`);
  validateFiniteNonnegative(props.threshold ?? 0.25, `${id} threshold`);
  validateFinitePositive(props.minimumBaselineDuration ?? 0.001, `${id} minimumBaselineDuration`);

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
  return {groupCount};
}

function validateSummary(summary: GPUTraceComparisonSummary, name: string): void {
  validatePackedUint32View(summary.counts, `${name} counts`);
  validatePackedView(summary.durationMeans, ['float32'], `${name} durationMeans`);
  validatePackedView(summary.errorRates, ['float32'], `${name} errorRates`);
  if (
    summary.durationMeans.length !== summary.counts.length ||
    summary.errorRates.length !== summary.counts.length
  ) {
    throw new Error(`${name} columns must have identical group counts`);
  }
}

function getSummaryViews(summary: GPUTraceComparisonSummary): GraphDataView[] {
  return [summary.counts, summary.durationMeans, summary.errorRates];
}

function getOutputViews(output: GPUTraceComparisonOutput): GraphDataView[] {
  return [
    output.countDeltas,
    output.durationDeltas,
    output.durationRatios,
    output.errorRateDeltas,
    output.scores,
    output.regressionMask,
    output.summary
  ];
}

function getComparisonViews(props: GPUTraceComparisonProps): GraphDataView[] {
  return [
    ...getSummaryViews(props.current),
    ...getSummaryViews(props.baseline),
    ...getOutputViews(props.output)
  ];
}

function getComparisonDispatch<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  count: number
): {x: number; y: number; z: number} {
  return getBoundedDispatchLayout(
    id,
    count,
    COMPARISON_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
}

function addComparisonComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    bindings: Record<string, GraphDataView>;
    resources: GraphBufferUse[];
    dispatch: {x: number; y: number; z: number};
  }
): void {
  graph.addComputePass({
    id: props.id,
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

function formatWGSLFloat(value: number): string {
  const formatted = value.toExponential(8).replace('e+', 'e');
  return formatted.includes('.') ? formatted : `${formatted}.0`;
}
