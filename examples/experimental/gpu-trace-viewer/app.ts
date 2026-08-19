// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ColumnPanel, type Panel} from '@deck.gl-community/panels';
import {type Binding, Buffer, type Device, type RenderBundle} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Computation, Model} from '@luma.gl/engine';
import {
  type CompiledGPUCommandGraph,
  DispatchCommandBuffer,
  DrawCommandBuffer,
  FlatController,
  type FlatControllerPick,
  GPUChunkedIndexedScatter,
  GPUCommandGraph,
  GPUCommandGraphAutotuner,
  GPUCommandGraphExecutionBudgetController,
  GPUHistogram,
  type GPUCommandGraphEncoding,
  type GPUCommandGraphExecutionBudget,
  type GPUCommandGraphExecutionPlan,
  type GPUCommandGraphExecution,
  GPUCommandGraphInspector,
  type GPUCommandGraphInspectorObservation,
  GPUHierarchyLayout,
  GPUIndexPickingTarget,
  GPUIndexedRangeCompaction,
  GPUPartitionedIndexedRangeCompaction,
  GPUReadbackRing,
  type GPUReadbackTicket,
  GPUVisibilityWorkflow,
  INDEX_PICKING_READBACK_BYTE_LENGTH,
  type GraphBufferHandle,
  type GraphBufferUse,
  type GraphDataView,
  GraphVectorView,
  type RectangleSelection,
  RectangleSelectController,
  decodeGPUIndexPickInfo,
  getGPUCommandGraphAdapterIdentity
} from '@luma.gl/experimental';
import {
  GPUTraceAggregation,
  GPUTraceAnomalyScoring,
  GPUTraceComparison,
  GPUTraceCriticalPath,
  GPUTraceLaneIndexBuilder,
  GPUTracePixelMipmap,
  GPUTraceTemporalIndex,
  GPUTraceTemporalIndexBuilder,
  GPUTraceTimeBuckets
} from '@luma.gl/experimental/gpu-trace';
import {buildSdfFontAtlas} from '@luma.gl/text';
import {DictionaryTextRenderer} from '@luma.gl/text/experimental';
import {
  FillPattern,
  type FillPatternType,
  fillPatternShaderPlugin
} from '../../fill-pattern-shader-plugin';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {
  getTraceAllocationStats,
  getTraceCapacityContract,
  getTraceDatasetPreflight,
  makeTraceCertificationReport,
  getTraceOverviewFrameTimingSummary,
  getTraceScanTimingSummary,
  getTraceWorkloadCounters,
  TRACE_BENCHMARK_SCENARIOS,
  TRACE_CERTIFICATION_DURATION_MILLISECONDS,
  TRACE_CERTIFICATION_SCENARIO_DURATION_MILLISECONDS,
  type TraceAllocationStats,
  type TraceBenchmarkScenarioId,
  type TraceCertificationFrameSample,
  type TraceCertificationReport
} from './trace-benchmark';
import {
  getTraceCapacityOptions,
  getTraceDependencyCapacityOptions,
  getTraceDependencyDisplayBudget,
  getTraceFocusFrontierCapacity,
  getTraceOverviewRenderer,
  getTraceTemporalIndexLevel,
  isTraceDependencyBundlingEnabled,
  getTraceDensityBinParameters,
  makeTraceAdjacencyChunks,
  makeTraceDependencyChunks,
  makeTraceDependencyChunkBatchIndex,
  makeTraceSpanChunks,
  releaseTraceDatasetStorage,
  TRACE_ADJACENCY_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_COLLAPSED_STATE,
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DEPENDENCY_BATCH_CAPACITY,
  TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH,
  TRACE_DEPENDENCY_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_DEPENDENCY_DISPLAY_BUDGET,
  TRACE_DEPENDENCY_DISPLAY_BUDGET_OPTIONS,
  TRACE_DEPENDENCY_FRAME_BATCH_BUDGET,
  TRACE_DISPLAY_LANE_CAPACITY,
  TRACE_DURATION,
  TRACE_EXPANDED_STATE,
  TRACE_FILTER_ERRORS_ONLY,
  TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
  TRACE_FILTER_HIDE_RUNTIME_SPANS,
  TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
  TRACE_GROUPS,
  TRACE_INVALID_SPAN_INDEX,
  TRACE_LABEL_DICTIONARY,
  TRACE_LABEL_FONT_SIZE,
  TRACE_LABEL_GLYPH_CAPACITY,
  TRACE_LABEL_GLYPH_RECORD_WORD_LENGTH,
  TRACE_LANE_COUNT,
  TRACE_LANES_PER_THREAD,
  TRACE_PROCESS_COUNT,
  TRACE_PROCESS_GAP_LANE_COUNT,
  TRACE_SPAN_BATCH_CAPACITY,
  TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
  TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_SPAN_RECORD_WORD_LENGTH,
  TRACE_STATUS_COUNT,
  TRACE_THREAD_COUNT,
  TRACE_THREAD_GAP_LANE_COUNT,
  TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH,
  TRACE_THREADS_PER_PROCESS,
  type TraceDatasetData,
  type TraceDependencyRouting,
  type TraceGroupName,
  type TraceOverviewMode,
  type TraceOverviewRenderer,
  type TraceTemporalIndexLevelData
} from './trace-data';
import type {TraceDatasetWorkerResponse} from './trace-data-worker';
import {
  getCandidateDensityShader,
  getCandidateDependencySpanVisibilityShader,
  getCandidateDependencyVisibilityShader,
  getCandidateLabelShader,
  getCandidatePassDispatchShader,
  getCandidatePickShader,
  getCandidateRepresentativeSelectionShader,
  getCandidateVisibilityShader,
  getDensityClearShader,
  getDependencyBatchVisibilityShader,
  getDependencyPickResolveShader,
  getDependencyPickShader,
  getDependencyDispatchBudgetShader,
  getDependencyDisplayBudgetClearShader,
  getDependencyDisplayBudgetShader,
  getDependencyEndpointResolveShader,
  getDependencyIntersectionVisibilityShader,
  getFocusFrontierClearShader,
  getFocusFrontierDispatchShader,
  getFocusFrontierExpansionShader,
  getFocusFrontierSeedShader,
  getFocusOverflowClearShader,
  getFocusReachabilityClearShader,
  getPickClearShader,
  getPickResolveShader,
  getRepresentativeBestClearShader,
  getRepresentativeDurationNominationShader,
  getRepresentativeIdNominationShader,
  getRepresentativeVisibilityPublishShader,
  getTraceMinimapRenderShader,
  getSpanVisibilityClearShader,
  getTraceDrawCommandsShader,
  getTraceLabelClearShader,
  TRACE_DENSITY_RENDER_SHADER,
  TRACE_DEPENDENCY_PICKING_RENDER_SHADER,
  TRACE_DEPENDENCY_RENDER_SHADER,
  TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE,
  TRACE_LABEL_RENDER_SHADER,
  TRACE_PICKING_RENDER_SHADER,
  TRACE_RENDER_SHADER
} from './trace-shaders';
import {
  getTraceAdvancedInteractionControlsHtml,
  getTraceDatasetControlsHtml,
  getTraceHierarchyControlsHtml,
  getTraceRenderingControlsHtml
} from './trace-controls';
import {
  getTraceAggregationFilterSignature,
  getTraceAnalysisWindow,
  type TraceAnalysisScope
} from './trace-analytics-state';
import {
  getAggregationWindowSelectionShader,
  getAnomalyErrorMaskShader,
  getViewportAggregationClearShader,
  getViewportAggregationFinalizeShader,
  getViewportAggregationShader,
  TRACE_ANALYTICS_OUTPUT,
  TRACE_DURATION_HISTOGRAM_BIN_COUNT,
  TRACE_DURATION_HISTOGRAM_EDGES,
  TRACE_TIME_BUCKET_COUNT
} from './trace-analytics-shaders';
import {
  clamp,
  formatAnomalyValidation,
  formatBytes,
  formatCount,
  formatCriticalPathValidation,
  formatDurationRange,
  formatSI,
  formatTraceDuration,
  getDensityPatternLabel,
  getMaximumValueIndex,
  loadTraceAutotuningProfile,
  makeMetricCard,
  setBit,
  setMaskFlag,
  storeTraceAutotuningProfile
} from './trace-format';
import {getTraceDashboardHtml} from './trace-dashboard';
import {
  getTraceViewerURLPreset,
  shouldRenderTraceFrame,
  TraceGenerationState,
  updateTraceViewerURLPreset
} from './trace-viewer-state';

export const title = 'GPU Hierarchical Trace Viewer';
export const description =
  'GPU-resident hierarchical traces with live filtering, interval analytics, adaptive density LOD, dependency traversal, picking, and indirect rendering.';

const DEFAULT_CAPACITY = 4_000_000;
const DEFAULT_DEPENDENCY_CAPACITY = 4_000_000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const CRITICAL_PATH_EXECUTION_SENTINEL = 0x80000000;
const TRACE_PICK_RESULT_WORD_LENGTH = 15;
const TRACE_WORKGROUP_SIZE = 256;
const TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT = Math.ceil(
  TRACE_SPAN_BATCH_CAPACITY / TRACE_WORKGROUP_SIZE
);
const VIEW_UNIFORM_BYTE_LENGTH = 128;
const TRACE_REPRESENTATIVE_MAXIMUM_PIXEL_COUNT = 2048;
const TRACE_REPRESENTATIVE_COUNT = TRACE_LANE_COUNT * TRACE_REPRESENTATIVE_MAXIMUM_PIXEL_COUNT;
const TRACE_OVERVIEW_TIMING_SAMPLE_CAPACITY = 60;
const TRACE_MINIMAP_HEIGHT = 88;
const TRACE_MINIMAP_INSET = 8;
const MAXIMUM_FOCUS_DEPTH = 4;
const INVALID_SPAN_INDEX = TRACE_INVALID_SPAN_INDEX;
const STATUS_NAMES = ['ok', 'waiting', 'active', 'error'] as const;
const TRACE_GRAPH_ID = 'gpu-hierarchical-trace-command-graph';
const TRACE_GROUP_COLORS = ['#4dc7ff', '#bd75ff', '#ffa138'] as const;
const TRACE_STATUS_COLORS = ['#65b5d1', '#8f82c9', '#c49a5a', '#d46f74'] as const;
const TRACE_UPLOAD_SLICE_BYTE_LENGTH = 8 * 1024 * 1024;
const TRACE_UPLOAD_YIELD_BYTE_LENGTH = 16 * 1024 * 1024;
const TRACE_ANALYSIS_PARTITION_ROW_COUNT = 256 * 1024;
const TRACE_ANALYSIS_FRAME_INVOCATION_BUDGET = TRACE_ANALYSIS_PARTITION_ROW_COUNT;
const TRACE_ANALYSIS_EXECUTION_BUDGET: GPUCommandGraphExecutionBudget = Object.freeze({
  maximumInvocationCount: TRACE_ANALYSIS_FRAME_INVOCATION_BUDGET,
  maximumCommandCount: 64,
  maximumReadByteLength: 256 * 1024 * 1024,
  maximumWriteByteLength: 128 * 1024 * 1024
});
const TRACE_INSPECTOR_COUNTER_LABELS = {
  spans: 'Spans',
  dependencies: 'Dependencies',
  'candidate-span-batches': 'Candidate span batches',
  'candidate-span-percent': 'Candidate span %',
  'candidate-dependency-batches': 'Candidate dependency batches',
  'candidate-dependency-percent': 'Candidate dependency %',
  'visible-spans': 'Visible spans',
  'visible-span-percent': 'Visible span %',
  'visible-dependencies': 'Visible dependencies',
  'candidate-span-upper-bound': 'Candidate span rows ≤',
  'candidate-dependency-upper-bound': 'Candidate dependency rows ≤',
  'actual-output-rows': 'Actual visible outputs',
  'maximum-shader-invocations': 'Shader invocations ≤',
  'persistent-bytes': 'Persistent bytes',
  'largest-buffer-bytes': 'Largest buffer bytes',
  'collapsed-processes': 'Collapsed processes',
  'density-mode': 'Density mode',
  'overview-renderer': 'Overview renderer',
  'overview-pixel-columns': 'Overview pixel columns',
  'overview-output-upper-bound': 'Overview output rows ≤',
  'representative-search-cells': 'Representative search cells',
  'filter-active': 'Filter active',
  'focus-active': 'Focus active',
  'pick-active': 'Pick active'
} as const;

type TraceViewParameters = {
  timeMin: number;
  timeMax: number;
  laneMin: number;
  laneMax: number;
};

type TracePickingMode = 'raster' | 'compute';

type TraceRasterPickingParameters = {
  pixel: readonly [number, number];
};

type TraceGroupResources = {
  name: TraceGroupName;
  count: number;
  firstSpanIndex: number;
};

type TraceSpanChunkResources = {
  buffer: Buffer;
  uniforms: Buffer;
  visibility: Buffer;
  visibleIds: Buffer;
  aggregationSelection: Buffer;
  representativeSelection: Buffer;
  representativeRowOrder: Buffer;
  representativeLaneOffsets: Buffer;
  representativeIds: Buffer;
  representativeValidationErrors: Buffer;
  chunkIndex: number;
  firstSpanIndex: number;
  spanCount: number;
  firstBatchIndex: number;
  batchCount: number;
};

type TraceAnalysisPartition = {
  chunkIndex: number;
  firstRow: number;
  rowCount: number;
};

type TraceSpanDrawResources = {
  commandIndex: number;
  groupIndex: number;
  chunkIndex: number;
  firstBatchIndex: number;
  batchCount: number;
};

type TraceDependencyChunkResources = {
  buffer: Buffer;
  uniforms: Buffer;
  batchIndex: Buffer;
  candidateBatchIds: Buffer;
  results: Buffer;
  endpointPositions: Buffer;
  visibleIds: Buffer;
  candidateDispatchCommands: DispatchCommandBuffer;
  chunkIndex: number;
  firstDependencyIndex: number;
  dependencyCount: number;
  firstBatchIndex: number;
  batchCount: number;
  drawCommandIndex: number;
  frameBatchBudget: number;
  visibleCapacity: number;
};

type TraceAdjacencyChunkResources = {
  topology: Buffer;
  neighbors: Buffer;
  chunkIndex: number;
  firstNodeIndex: number;
  nodeCount: number;
  firstNeighborIndex: number;
  neighborCount: number;
};

type PickPosition = {
  time: number;
  lane: number;
  requestIdentifier: number;
  intent: 'hover' | 'select';
  clientX: number;
  clientY: number;
};

type TraceGraphResources = {
  compiled: CompiledGPUCommandGraph<TraceViewParameters>;
  pickingCompiled: CompiledGPUCommandGraph<TraceRasterPickingParameters>;
  pickingReadbackIdentifier: string;
  pickingWidth: number;
  pickingHeight: number;
  aggregationCompiled: CompiledGPUCommandGraph<void> | null;
  viewportAggregationCompiled: CompiledGPUCommandGraph<void> | null;
  drawCommands: DrawCommandBuffer;
  candidateDispatchCommands: DispatchCommandBuffer;
  densityCandidateDispatchCommands: DispatchCommandBuffer;
  pickCandidateDispatchCommands: DispatchCommandBuffer;
  candidateDependencyBatchCounts: Buffer;
  readbackRing: GPUReadbackRing;
  pickingReadbackRing: GPUReadbackRing;
  renderBundle: RenderBundle;
  minimapModel: Model;
  groups: TraceGroupResources[];
  spanChunks: TraceSpanChunkResources[];
  spanDraws: TraceSpanDrawResources[];
  dependencyChunks: TraceDependencyChunkResources[];
  densityDrawCommandIndex: number;
  labelDrawCommandIndex: number;
  spanBatchIndex: Buffer;
  candidateBatchIds: Buffer;
  candidateChunkOffsets: Buffer;
  parentSpans: Buffer;
  outgoingAdjacencyChunks: TraceAdjacencyChunkResources[];
  incomingAdjacencyChunks: TraceAdjacencyChunkResources[];
  processStates: Buffer;
  threadStates: Buffer;
  threadHeights: Buffer;
  threadOffsets: Buffer;
  selectedSeeds: Buffer;
  selectedSeedCount: Buffer;
  focusTraversalState: Buffer;
  focusOverflowCount: Buffer;
  reachedSpans: Buffer;
  dependencySpanVisibility: Buffer;
  zeroAnomalyMask: Buffer;
  anomalyMasks: Buffer[] | null;
  densityBins: Buffer;
  labelGlyphs: Buffer;
  pickResult: Buffer;
  aggregationWindow: Buffer;
  aggregationResults: Buffer;
  aggregationTemporalQuery: Buffer;
  aggregationCandidateBatchIds: Buffer;
  aggregationCandidateDispatchCommands: DispatchCommandBuffer;
  temporalIndex: Buffer;
  temporalIndexDirtyPartitions: Buffer;
  temporalIndexValidationErrors: Buffer;
  temporalIndexLevels: TraceTemporalIndexLevelData[];
  temporalIndexPartitionBatchCount: number;
  temporalIndexPartitionCount: number;
  temporalQuery: Buffer;
  representativeQuery: Buffer;
  representativeBestDurations: Buffer;
  representativeBestIds: Buffer;
  spanCount: number;
  spanBatchCount: number;
  dependencyBatchCount: number;
  dependencyCount: number;
  focusFrontierCapacity: number;
};

type TraceDatasetLoadPhase =
  | 'generating'
  | 'uploading'
  | 'compiling'
  | 'warming'
  | 'ready'
  | 'error';

type TraceStagedUpload = {
  buffer: Buffer;
  data: Uint32Array;
};

type TraceCertificationSavedState = {
  view: TraceViewParameters;
  enabledMask: number;
  statusMask: number;
  activeFilterMask: number;
  minimumDuration: number;
  dependencyMask: number;
  dependencyDisplayBudget: number;
  dependencyRouting: TraceDependencyRouting;
  selectedSpanIndex: number;
  selectedDependencyIndex: number;
  focusOnly: boolean;
  autoScroll: boolean;
  lodFadeEnabled: boolean;
  overviewMode: TraceOverviewMode;
  minimapEnabled: boolean;
  labelsEnabled: boolean;
  densityPattern: FillPatternType;
  pickingMode: TracePickingMode;
  processStates: Uint32Array;
  threadStates: Uint32Array;
};

type TraceCertificationRun = {
  startedAt: number;
  scenarioIndex: number;
  lastPublishedSecond: number;
  samples: TraceCertificationFrameSample[];
  pickResponseMilliseconds: number[];
  queueStallCount: number;
  deferredPickFrameCountAtStart: number;
  savedState: TraceCertificationSavedState;
};

function getTraceResourceBuffers(resources: TraceGraphResources): Array<{byteLength: number}> {
  return [
    resources.drawCommands.buffer,
    resources.candidateDispatchCommands.buffer,
    resources.densityCandidateDispatchCommands.buffer,
    resources.pickCandidateDispatchCommands.buffer,
    resources.aggregationCandidateDispatchCommands.buffer,
    resources.candidateDependencyBatchCounts,
    ...resources.spanChunks.flatMap(chunk => [
      chunk.buffer,
      chunk.uniforms,
      chunk.visibility,
      chunk.visibleIds,
      chunk.aggregationSelection,
      chunk.representativeSelection,
      chunk.representativeRowOrder,
      chunk.representativeLaneOffsets,
      chunk.representativeIds,
      chunk.representativeValidationErrors
    ]),
    ...resources.dependencyChunks.flatMap(chunk => [
      chunk.buffer,
      chunk.uniforms,
      chunk.batchIndex,
      chunk.candidateBatchIds,
      chunk.results,
      chunk.endpointPositions,
      chunk.visibleIds,
      chunk.candidateDispatchCommands.buffer
    ]),
    resources.spanBatchIndex,
    resources.candidateBatchIds,
    resources.candidateChunkOffsets,
    resources.parentSpans,
    ...resources.outgoingAdjacencyChunks.flatMap(chunk => [chunk.topology, chunk.neighbors]),
    ...resources.incomingAdjacencyChunks.flatMap(chunk => [chunk.topology, chunk.neighbors]),
    resources.processStates,
    resources.threadStates,
    resources.threadHeights,
    resources.threadOffsets,
    resources.selectedSeeds,
    resources.selectedSeedCount,
    resources.focusTraversalState,
    resources.focusOverflowCount,
    resources.reachedSpans,
    resources.dependencySpanVisibility,
    resources.zeroAnomalyMask,
    ...(resources.anomalyMasks ?? []),
    resources.densityBins,
    resources.labelGlyphs,
    resources.pickResult,
    resources.aggregationWindow,
    resources.aggregationResults,
    resources.aggregationTemporalQuery,
    resources.aggregationCandidateBatchIds,
    resources.temporalIndex,
    resources.temporalQuery,
    resources.temporalIndexDirtyPartitions,
    resources.temporalIndexValidationErrors,
    resources.representativeQuery,
    resources.representativeBestDurations,
    resources.representativeBestIds,
    ...Array.from({length: resources.readbackRing.slotCount}, () => ({
      byteLength: resources.readbackRing.byteLength
    })),
    ...Array.from({length: resources.pickingReadbackRing.slotCount}, () => ({
      byteLength: resources.pickingReadbackRing.byteLength
    }))
  ];
}

type TraceComputePassBinding = {
  name: string;
  buffer: GraphBufferHandle;
  type: 'storage' | 'uniform';
  usage: 'storage-read' | 'storage-write' | 'storage-read-write' | 'uniform';
};

export default class GPUTraceViewerAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true, debugGPUTime: true};

  readonly device: Device;
  readonly model: Model;
  readonly dependencyModel: Model;
  readonly pickingModel: Model;
  readonly dependencyPickingModel: Model;
  readonly densityModel: Model;
  readonly labelRenderer: DictionaryTextRenderer;
  readonly viewUniformBuffer: Buffer;
  readonly panels: ExamplePanelManager;
  readonly graphInspector = new GPUCommandGraphInspector({maxSamples: 90});
  private readonly graphAutotuner: GPUCommandGraphAutotuner;
  readonly capacityOptions: number[];
  readonly dependencyCapacityOptions: number[];
  private readonly spanChunkByteLength: number;
  private readonly dependencyChunkByteLength: number;
  private readonly adjacencyChunkByteLength: number;

  private resources: TraceGraphResources | null = null;
  private graphObservation: GPUCommandGraphInspectorObservation<TraceViewParameters> | null = null;
  private readonly gpuTimingReadbackTimers = new Set<ReturnType<typeof setTimeout>>();
  private graphGPUTimingSampleCount = 0;
  private allocationStats: TraceAllocationStats = {
    bufferCount: 0,
    persistentByteLength: 0,
    largestBufferByteLength: 0
  };
  private spanCapacity = DEFAULT_CAPACITY;
  private dependencyCapacity = DEFAULT_DEPENDENCY_CAPACITY;
  private traceDuration = TRACE_DURATION;
  private enabledMask = 0b111;
  private statusMask = (1 << TRACE_STATUS_COUNT) - 1;
  private dependencyMask = 0b11;
  private dependencyDisplayBudget = TRACE_DEPENDENCY_DISPLAY_BUDGET;
  private dependencyRouting: TraceDependencyRouting = 'auto';
  private effectiveDependencyDisplayBudget = TRACE_DEPENDENCY_DISPLAY_BUDGET;
  /** Enabled filtering policy; immutable source classifications remain in each span record. */
  private activeFilterMask = 0;
  private minimumDuration = 0;
  private selectedSpanIndex = INVALID_SPAN_INDEX;
  private selectedDependencyIndex = INVALID_SPAN_INDEX;
  private hoveredSpanIndex = INVALID_SPAN_INDEX;
  private hoveredDependencyIndex = INVALID_SPAN_INDEX;
  private pickingMode: TracePickingMode = 'raster';
  private focusOnly = false;
  private focusDepth = 2;
  private processStates = new Uint32Array(TRACE_PROCESS_COUNT).fill(TRACE_EXPANDED_STATE);
  private threadStates = new Uint32Array(TRACE_THREAD_COUNT).fill(TRACE_EXPANDED_STATE);
  private autoScroll = false;
  private lodFadeEnabled = false;
  private overviewMode: TraceOverviewMode = 'auto';
  private minimapEnabled = true;
  private labelsEnabled = true;
  private densityPattern: FillPatternType = FillPattern.hash45;
  private anomalyOverlayEnabled = false;
  private view: TraceViewParameters = {timeMin: 0, timeMax: 150, laneMin: 0, laneMax: 72};
  private pendingPick: PickPosition | null = null;
  private latestPickRequestIdentifier = 0;
  private latestHoverPickRequestIdentifier = 0;
  private latestSelectionPickRequestIdentifier = 0;
  private encodeTimeMilliseconds = 0;
  private compileCount = 0;
  private compileTimeMilliseconds = 0;
  private sampledVisibleCounts = [0, 0, 0];
  private sampledDependencyCount = 0;
  private sampledLabelGlyphCount = 0;
  private sampledCandidateBatchCount = 0;
  private sampledCandidateDependencyBatchCount = 0;
  private sampledFocusOverflowCount = 0;
  private droppedTelemetrySampleCount = 0;
  private deferredPickFrameCount = 0;
  private frameIndex = 0;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private canvas: HTMLCanvasElement | null = null;
  private flatController: FlatController | null = null;
  private rectangleSelectController: RectangleSelectController | null = null;
  private rectangleSelectionElement: HTMLElement | null = null;
  private dashboardElement: HTMLElement | null = null;
  private pickTooltipElement: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private overviewComparisonElement: HTMLElement | null = null;
  private plannerBudgetElement: HTMLElement | null = null;
  private frameStatsElement: HTMLElement | null = null;
  private inspectorPanel: GPUCommandGraphInspectorPanel | null = null;
  private capacityElement: HTMLElement | null = null;
  private selectionElement: HTMLElement | null = null;
  private aggregationElement: HTMLElement | null = null;
  private operationAggregationElement: HTMLElement | null = null;
  private statusAggregationElement: HTMLElement | null = null;
  private aggregationSummaryElement: HTMLElement | null = null;
  private durationHistogramElement: HTMLElement | null = null;
  private utilizationElement: HTMLElement | null = null;
  private analysisWindowElement: HTMLElement | null = null;
  private datasetStatusElement: HTMLElement | null = null;
  private datasetLoadBannerElement: HTMLElement | null = null;
  private datasetLoadMessageElement: HTMLElement | null = null;
  private graphDiagnosticElement: HTMLElement | null = null;
  private certificationElement: HTMLElement | null = null;
  private causalAnalysisElement: HTMLElement | null = null;
  private anomalyAnalysisElement: HTMLElement | null = null;
  private datasetPreflightElement: HTMLElement | null = null;
  private datasetPreflightMessageElement: HTMLElement | null = null;
  private datasetWorker: Worker | null = null;
  private pendingDatasetRequest: {spanCapacity: number; dependencyCapacity: number} | null = null;
  private groupAggregationCounts = TRACE_GROUPS.map(() => 0);
  private groupAggregationDurationSums = TRACE_GROUPS.map(() => 0);
  private groupAggregationDurationMeans = TRACE_GROUPS.map(() => 0);
  private operationAggregationCounts = TRACE_LABEL_DICTIONARY.map(() => 0);
  private statusAggregationCounts = STATUS_NAMES.map(() => 0);
  private processAggregationCounts = Array.from({length: TRACE_PROCESS_COUNT}, () => 0);
  private threadAggregationCounts = Array.from({length: TRACE_THREAD_COUNT}, () => 0);
  private durationHistogramCounts = Array.from(
    {length: TRACE_DURATION_HISTOGRAM_BIN_COUNT},
    () => 0
  );
  private timeBucketCounts = Array.from({length: TRACE_TIME_BUCKET_COUNT}, () => 0);
  private timeBucketDurations = Array.from({length: TRACE_TIME_BUCKET_COUNT}, () => 0);
  private timeBucketConcurrency = Array.from({length: TRACE_TIME_BUCKET_COUNT}, () => 0);
  private timeBucketUtilization = Array.from({length: TRACE_TIME_BUCKET_COUNT}, () => 0);
  private timeBucketIdleLaneTime = Array.from({length: TRACE_TIME_BUCKET_COUNT}, () => 0);
  private analysisScope: TraceAnalysisScope = 'viewport';
  private measuredTimeMinimum = 0;
  private measuredTimeMaximum = 150;
  private aggregationTimeMinimum = 0;
  private aggregationTimeMaximum = TRACE_DURATION;
  private aggregationFilterSignature = '';
  private pendingAggregationWindow: readonly [number, number] | null = null;
  private pendingAggregationFilterSignature = '';
  private aggregationUpdateTimer: ReturnType<typeof setTimeout> | null = null;
  private aggregationFrameHandle: number | null = null;
  private aggregationExecution: GPUCommandGraphExecution<void> | null = null;
  private readonly indexExecutionBudgetController = new GPUCommandGraphExecutionBudgetController({
    initialBudget: TRACE_ANALYSIS_EXECUTION_BUDGET,
    latencyPriority: 'background'
  });
  private readonly aggregationExecutionBudgetController =
    new GPUCommandGraphExecutionBudgetController({
      initialBudget: TRACE_ANALYSIS_EXECUTION_BUDGET,
      latencyPriority: 'background'
    });
  private readonly causalExecutionBudgetController = new GPUCommandGraphExecutionBudgetController({
    initialBudget: TRACE_ANALYSIS_EXECUTION_BUDGET,
    latencyPriority: 'interactive'
  });
  private readonly anomalyExecutionBudgetController = new GPUCommandGraphExecutionBudgetController({
    initialBudget: TRACE_ANALYSIS_EXECUTION_BUDGET,
    latencyPriority: 'interactive'
  });
  private aggregationProgress = 0;
  private aggregationStepIndex = 0;
  private aggregationStepCount = 0;
  private aggregationOversizedStepCount = 0;
  private aggregationPublication = 'none';
  private aggregationGeneration = 0;
  private causalAnalysisGeneration = 0;
  private anomalyAnalysisGeneration = 0;
  private regressionGroupMask = 0;
  private causalAnalysisStatus =
    'Ready to analyze canonical parent chains without rebuilding span objects on the CPU.';
  private anomalyAnalysisStatus =
    'Ready to score every span against an explicit peer baseline without CPU row materialization.';
  private aggregationInFlight = false;
  private readonly datasetGeneration = new TraceGenerationState();
  private datasetStatus = 'Preparing source data…';
  private datasetLoadPhase: TraceDatasetLoadPhase = 'generating';
  private readyDatasetStatus = '';
  private gpuFrameInFlight = false;
  private firstGpuFramePending = false;
  private initialDependencyWarmup = false;
  private dependencyWarmupTimer: ReturnType<typeof setTimeout> | null = null;
  private stagedResourceUploads: TraceStagedUpload[] | null = null;
  private gpuFrameTimeMilliseconds = 0;
  private readonly overviewFrameTimeSamples: Record<TraceOverviewRenderer, number[]> = {
    exact: [],
    density: [],
    representative: []
  };
  private overviewMeasurementSignature = '';
  private lastRenderSignature = '';
  private certificationRun: TraceCertificationRun | null = null;
  private lastCertificationReport: TraceCertificationReport | null = null;
  private readonly certificationPickStartedAt = new Map<number, number>();
  private deviceLost = false;
  private finalized = false;

  constructor({
    device,
    traceCapacity,
    dependencyCapacity,
    spanChunkByteLength = TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH,
    dependencyChunkByteLength = TRACE_DEPENDENCY_CHUNK_TARGET_BYTE_LENGTH,
    adjacencyChunkByteLength = TRACE_ADJACENCY_CHUNK_TARGET_BYTE_LENGTH
  }: AnimationProps & {
    traceCapacity?: number;
    dependencyCapacity?: number;
    spanChunkByteLength?: number;
    dependencyChunkByteLength?: number;
    adjacencyChunkByteLength?: number;
  }) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('GPU Hierarchical Trace Viewer requires WebGPU');
    }
    this.device = device;
    const adapter = getGPUCommandGraphAdapterIdentity(device);
    this.graphAutotuner = new GPUCommandGraphAutotuner({
      adapter,
      profile: loadTraceAutotuningProfile(adapter.key)
    });
    void device.lost.then(({message}) => {
      this.deviceLost = true;
      if (this.certificationRun) {
        this.finishTraceCertification(performance.now());
      }
      this.setDatasetStatus(`WebGPU device lost${message ? `: ${message}` : ''}`, 'error');
    });
    if (!Number.isSafeInteger(spanChunkByteLength) || spanChunkByteLength < 1) {
      throw new RangeError('Trace span chunk byte length must be a positive safe integer');
    }
    if (!Number.isSafeInteger(dependencyChunkByteLength) || dependencyChunkByteLength < 1) {
      throw new RangeError('Trace dependency chunk byte length must be a positive safe integer');
    }
    if (!Number.isSafeInteger(adjacencyChunkByteLength) || adjacencyChunkByteLength < 1) {
      throw new RangeError('Trace adjacency chunk byte length must be a positive safe integer');
    }
    this.spanChunkByteLength = spanChunkByteLength;
    this.dependencyChunkByteLength = dependencyChunkByteLength;
    this.adjacencyChunkByteLength = adjacencyChunkByteLength;
    this.capacityOptions = getTraceCapacityOptions(
      device.limits.maxStorageBufferBindingSize,
      device.limits.maxBufferSize
    );
    this.dependencyCapacityOptions = getTraceDependencyCapacityOptions(
      device.limits.maxStorageBufferBindingSize,
      device.limits.maxBufferSize
    );
    const urlPreset = getTraceViewerURLPreset(
      typeof location === 'undefined' ? '' : location.search,
      this.capacityOptions,
      this.dependencyCapacityOptions
    );
    traceCapacity ??= urlPreset.spanCapacity ?? DEFAULT_CAPACITY;
    dependencyCapacity ??= urlPreset.dependencyCapacity ?? DEFAULT_DEPENDENCY_CAPACITY;
    this.viewUniformBuffer = device.createBuffer({
      id: 'gpu-trace-view-uniforms',
      byteLength: VIEW_UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = this.createSpanModel();
    this.dependencyModel = this.createDependencyModel();
    this.pickingModel = this.createSpanPickingModel();
    this.dependencyPickingModel = this.createDependencyPickingModel();
    this.densityModel = this.createDensityModel();
    this.labelRenderer = this.createLabelRenderer();
    this.rebuild(traceCapacity, dependencyCapacity);
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.addEventListener('pointerdown', this.handleMinimapPointerDown, true);
      canvas.addEventListener('pointermove', this.handleMinimapPointerMove, true);
      canvas.addEventListener('pointerup', this.handleMinimapPointerRelease, true);
      canvas.addEventListener('click', this.handleMinimapPointerRelease, true);
      this.rectangleSelectionElement = document.createElement('div');
      this.rectangleSelectionElement.setAttribute('aria-hidden', 'true');
      Object.assign(this.rectangleSelectionElement.style, {
        position: 'fixed',
        zIndex: '20',
        pointerEvents: 'none',
        border: '1px solid rgb(107 181 218 / 90%)',
        background: 'rgb(74 145 181 / 18%)',
        boxShadow: '0 0 0 1px rgb(7 15 25 / 55%) inset'
      });
      this.rectangleSelectionElement.hidden = true;
      document.body.append(this.rectangleSelectionElement);
      this.rectangleSelectController = new RectangleSelectController(canvas, {
        getView: () => ({
          xMin: this.view.timeMin,
          xMax: this.view.timeMax,
          yMin: this.view.laneMin,
          yMax: this.view.laneMax
        }),
        onInteractionStart: () => {
          this.autoScroll = false;
          this.clearHoveredPick();
        },
        onSelectionChange: selection => this.renderRectangleSelection(selection),
        onSelect: selection => this.applyRectangleAnalysisSelection(selection)
      });
      // Install ordinary pan/pick handling after the capture-phase selector. This ordering is
      // important on the event target itself: an activated Shift-drag must be stopped before
      // the normal controller can begin a pan gesture.
      this.flatController = new FlatController(canvas, {
        getView: () => ({
          xMin: this.view.timeMin,
          xMax: this.view.timeMax,
          yMin: this.view.laneMin,
          yMax: this.view.laneMax
        }),
        getBounds: () => ({
          xMin: 0,
          xMax: this.traceDuration,
          yMin: 0,
          yMax: this.getVisibleLaneCount()
        }),
        onViewChange: view => {
          this.setViewTimeRange(view.xMin, view.xMax);
          this.view.laneMin = view.yMin;
          this.view.laneMax = view.yMax;
        },
        onPick: pick => this.requestPick(pick),
        onPointerLeave: this.clearHoveredPick,
        onInteractionStart: () => {
          this.autoScroll = false;
          this.clearHoveredPick();
        }
      });
      this.pickTooltipElement = document.createElement('div');
      this.pickTooltipElement.id = 'trace-pick-tooltip';
      this.pickTooltipElement.hidden = true;
      document.body.append(this.pickTooltipElement);
    }
  }

  override onRender({device, time, width, height}: AnimationProps): boolean {
    const resources = this.resources;
    if (!resources) {
      return false;
    }
    this.viewportWidth = width;
    this.viewportHeight = height;
    if (this.certificationRun) {
      this.updateTraceCertification(performance.now());
    }
    if (this.autoScroll) {
      const windowSize = this.view.timeMax - this.view.timeMin;
      if (windowSize >= this.traceDuration) {
        this.setViewTimeRange(0, this.traceDuration);
      } else {
        const timeMin = (time * 0.025) % Math.max(this.traceDuration - windowSize, 1);
        this.setViewTimeRange(timeMin, timeMin + windowSize);
      }
    }
    if (this.analysisScope === 'viewport') {
      this.requestAggregationForCurrentScope();
    }
    const renderSignature = this.getRenderSignature(width, height);
    if (
      !shouldRenderTraceFrame({
        gpuFrameInFlight: this.gpuFrameInFlight,
        renderSignature,
        lastRenderSignature: this.lastRenderSignature
      })
    ) {
      return false;
    }
    const [pickingWidth, pickingHeight] = device.getDefaultCanvasContext().getDevicePixelSize();
    if (
      resources.pickingWidth !== Math.max(pickingWidth, 1) ||
      resources.pickingHeight !== Math.max(pickingHeight, 1)
    ) {
      this.resizePickingGraph(resources, pickingWidth, pickingHeight);
    }
    const pick = this.pendingPick;
    const visibilityGeneration = (this.frameIndex % 0xfffffffe) + 1;
    resources.focusTraversalState.write(Uint32Array.of(this.focusDepth));
    this.writeViewUniforms(
      width,
      height,
      this.pickingMode === 'compute' ? pick : null,
      visibilityGeneration
    );
    const encoding = this.graphObservation?.encode(device.commandEncoder, {
      parameters: this.view
    });
    if (!encoding) {
      return false;
    }
    this.prepareOverviewMeasurement(width, height);
    const overviewRenderer = this.getOverviewRenderer(width);
    const certificationScenarioId = this.certificationRun
      ? TRACE_BENCHMARK_SCENARIOS[this.certificationRun.scenarioIndex]?.id
      : undefined;
    const certificationEncodeTimeMilliseconds = encoding.stats.cpuEncodeTimeMilliseconds;
    this.lastRenderSignature = renderSignature;
    this.gpuFrameInFlight = true;
    const gpuFrameStartTime = performance.now();
    queueMicrotask(() => {
      const queue = (
        device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
      ).handle?.queue;
      const submittedWork = queue?.onSubmittedWorkDone?.();
      if (!submittedWork) {
        this.gpuFrameTimeMilliseconds = performance.now() - gpuFrameStartTime;
        this.recordOverviewFrameTime(overviewRenderer, this.gpuFrameTimeMilliseconds);
        this.recordTraceCertificationFrame(
          certificationScenarioId,
          overviewRenderer,
          this.gpuFrameTimeMilliseconds,
          certificationEncodeTimeMilliseconds
        );
        this.gpuFrameInFlight = false;
        this.completeFirstGpuFrame();
        return;
      }
      void submittedWork
        .catch(error => {
          if (this.firstGpuFramePending) {
            this.setDatasetStatus(
              `First GPU frame failed: ${error instanceof Error ? error.message : String(error)}`,
              'error'
            );
            this.firstGpuFramePending = false;
          }
        })
        .finally(() => {
          if (!this.finalized) {
            this.gpuFrameTimeMilliseconds = performance.now() - gpuFrameStartTime;
            this.recordOverviewFrameTime(overviewRenderer, this.gpuFrameTimeMilliseconds);
            this.recordTraceCertificationFrame(
              certificationScenarioId,
              overviewRenderer,
              this.gpuFrameTimeMilliseconds,
              certificationEncodeTimeMilliseconds
            );
            this.gpuFrameInFlight = false;
            this.completeFirstGpuFrame();
            this.updateInspector();
          }
        });
    });
    this.encodeTimeMilliseconds = encoding.stats.cpuEncodeTimeMilliseconds;
    this.frameIndex++;
    if (
      (this.graphGPUTimingSampleCount === 0 || this.frameIndex % 60 === 0) &&
      encoding.canReadGPUTimings &&
      this.graphObservation
    ) {
      this.graphGPUTimingSampleCount++;
      this.scheduleGPUTimingReadback(this.graphObservation, encoding);
    }
    if (pick && this.pickingMode === 'compute') {
      this.recordWorkloadCounters(true);
      const readbackTicket = resources.readbackRing.tryAcquire();
      if (readbackTicket) {
        this.pendingPick = null;
        readbackTicket.copyFrom(device.commandEncoder, resources.pickResult, {
          byteLength: TRACE_PICK_RESULT_WORD_LENGTH * UINT32_BYTE_LENGTH
        });
        queueMicrotask(() => {
          void this.samplePickedSpan(resources, readbackTicket, pick);
        });
      } else {
        this.deferredPickFrameCount++;
      }
    } else if (pick) {
      this.recordWorkloadCounters(true);
      const readbackTicket = resources.pickingReadbackRing.tryAcquire();
      if (readbackTicket) {
        this.pendingPick = null;
        resources.pickingCompiled.encode(device.commandEncoder, {
          parameters: {pixel: this.getRasterPickingPixel(pick, resources)},
          buffers: {[resources.pickingReadbackIdentifier]: readbackTicket.buffer}
        });
        readbackTicket.markEncoded({byteLength: 8});
        queueMicrotask(() => {
          void this.sampleRasterPick(resources, readbackTicket, pick);
        });
      } else {
        this.deferredPickFrameCount++;
      }
    }
    if (this.frameIndex === 1 || this.frameIndex % 60 === 0) {
      const readbackTicket = resources.readbackRing.tryAcquire();
      if (readbackTicket) {
        readbackTicket.copyFrom(device.commandEncoder, resources.drawCommands.buffer);
        queueMicrotask(() => {
          void this.sampleVisibleCounts(resources, readbackTicket);
        });
      } else {
        this.droppedTelemetrySampleCount++;
      }
      this.recordWorkloadCounters(Boolean(pick));
      const dependencyCandidateReadbackTicket = resources.readbackRing.tryAcquire();
      if (dependencyCandidateReadbackTicket) {
        dependencyCandidateReadbackTicket.copyFrom(
          device.commandEncoder,
          resources.candidateDependencyBatchCounts,
          {
            byteLength: Math.max(resources.dependencyChunks.length, 1) * UINT32_BYTE_LENGTH
          }
        );
        queueMicrotask(() => {
          void this.sampleCandidateDependencyBatchCount(
            resources,
            dependencyCandidateReadbackTicket
          );
        });
      } else {
        this.droppedTelemetrySampleCount++;
      }
      const candidateReadbackTicket = resources.readbackRing.tryAcquire();
      if (candidateReadbackTicket) {
        candidateReadbackTicket.copyFrom(
          device.commandEncoder,
          resources.candidateDispatchCommands.buffer,
          {sourceOffset: UINT32_BYTE_LENGTH, byteLength: UINT32_BYTE_LENGTH}
        );
        queueMicrotask(() => {
          void this.sampleCandidateBatchCount(resources, candidateReadbackTicket);
        });
      } else {
        this.droppedTelemetrySampleCount++;
      }
      const focusOverflowReadbackTicket = resources.readbackRing.tryAcquire();
      if (focusOverflowReadbackTicket) {
        focusOverflowReadbackTicket.copyFrom(device.commandEncoder, resources.focusOverflowCount, {
          byteLength: UINT32_BYTE_LENGTH
        });
        queueMicrotask(() => {
          void this.sampleFocusOverflowCount(resources, focusOverflowReadbackTicket);
        });
      } else {
        this.droppedTelemetrySampleCount++;
      }
    }
    if (this.frameIndex === 1 || this.frameIndex % 10 === 0) {
      this.updateInspector();
    }
    return true;
  }

  override onFinalize(): void {
    this.finalized = true;
    this.datasetGeneration.finalize();
    this.datasetWorker?.terminate();
    this.datasetWorker = null;
    if (this.dependencyWarmupTimer) {
      clearTimeout(this.dependencyWarmupTimer);
      this.dependencyWarmupTimer = null;
    }
    this.flatController?.destroy();
    this.flatController = null;
    this.canvas?.removeEventListener('pointerdown', this.handleMinimapPointerDown, true);
    this.canvas?.removeEventListener('pointermove', this.handleMinimapPointerMove, true);
    this.canvas?.removeEventListener('pointerup', this.handleMinimapPointerRelease, true);
    this.canvas?.removeEventListener('click', this.handleMinimapPointerRelease, true);
    this.canvas = null;
    this.rectangleSelectController?.destroy();
    this.rectangleSelectController = null;
    this.rectangleSelectionElement?.remove();
    this.rectangleSelectionElement = null;
    this.pickTooltipElement?.remove();
    this.pickTooltipElement = null;
    this.panels.finalize();
    this.destroyResources();
    this.model.destroy();
    this.dependencyModel.destroy();
    this.pickingModel.destroy();
    this.dependencyPickingModel.destroy();
    this.densityModel.destroy();
    this.labelRenderer.destroy();
    this.viewUniformBuffer.destroy();
  }

  private completeFirstGpuFrame(): void {
    if (!this.firstGpuFramePending || this.datasetLoadPhase === 'error') return;
    this.firstGpuFramePending = false;
    this.setDatasetStatus(this.readyDatasetStatus, 'ready');
    if (this.analysisScope === 'viewport') {
      this.requestAggregationForCurrentScope(0);
    }
    const requestId = this.datasetGeneration.current;
    this.dependencyWarmupTimer = setTimeout(() => {
      this.dependencyWarmupTimer = null;
      if (!this.datasetGeneration.isCurrent(requestId)) return;
      this.initialDependencyWarmup = false;
      this.lastRenderSignature = '';
      this.updateInspector();
    }, 120);
  }

  private createSpanModel(): Model {
    return new Model(this.device, {
      id: 'gpu-trace-span-model',
      source: TRACE_RENDER_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'spans', type: 'read-only-storage', group: 0, location: 0},
          {name: 'visibleIds', type: 'read-only-storage', group: 0, location: 1},
          {name: 'threadOffsets', type: 'read-only-storage', group: 0, location: 2},
          {name: 'threadStates', type: 'read-only-storage', group: 0, location: 3},
          {name: 'reachedSpans', type: 'read-only-storage', group: 0, location: 4},
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 5},
          {name: 'spanChunk', type: 'uniform', group: 0, location: 6},
          {name: 'anomalyMask', type: 'read-only-storage', group: 0, location: 7}
        ]
      },
      parameters: makeTraceBlendParameters()
    });
  }

  private createDependencyModel(): Model {
    return new Model(this.device, {
      id: 'gpu-trace-dependency-model',
      source: TRACE_DEPENDENCY_RENDER_SHADER,
      topology: 'line-list',
      vertexCount: 6,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'dependencies', type: 'read-only-storage', group: 0, location: 0},
          {name: 'visibleDependencyIds', type: 'read-only-storage', group: 0, location: 1},
          {
            name: 'dependencyEndpointPositions',
            type: 'read-only-storage',
            group: 0,
            location: 2
          },
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 3},
          {name: 'dependencyChunk', type: 'uniform', group: 0, location: 4}
        ]
      },
      parameters: makeTraceBlendParameters()
    });
  }

  private createSpanPickingModel(): Model {
    return new Model(this.device, {
      id: 'gpu-trace-span-picking-model',
      source: TRACE_PICKING_RENDER_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'spans', type: 'read-only-storage', group: 0, location: 0},
          {name: 'visibleIds', type: 'read-only-storage', group: 0, location: 1},
          {name: 'threadOffsets', type: 'read-only-storage', group: 0, location: 2},
          {name: 'threadStates', type: 'read-only-storage', group: 0, location: 3},
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 4},
          {name: 'spanChunk', type: 'uniform', group: 0, location: 5}
        ]
      },
      parameters: {depthCompare: 'less-equal', depthWriteEnabled: true}
    });
  }

  private createDependencyPickingModel(): Model {
    return new Model(this.device, {
      id: 'gpu-trace-dependency-picking-model',
      source: TRACE_DEPENDENCY_PICKING_RENDER_SHADER,
      topology: 'line-list',
      vertexCount: 6,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'visibleDependencyIds', type: 'read-only-storage', group: 0, location: 0},
          {
            name: 'dependencyEndpointPositions',
            type: 'read-only-storage',
            group: 0,
            location: 1
          },
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 2},
          {name: 'dependencyChunk', type: 'uniform', group: 0, location: 3}
        ]
      },
      parameters: {depthCompare: 'less-equal', depthWriteEnabled: true}
    });
  }

  private createDensityModel(): Model {
    return new Model(this.device, {
      id: 'gpu-trace-density-model',
      source: TRACE_DENSITY_RENDER_SHADER,
      plugins: [fillPatternShaderPlugin],
      topology: 'triangle-list',
      vertexCount: 3,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'densityBins', type: 'read-only-storage', group: 0, location: 0},
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 1}
        ]
      },
      parameters: makeTraceBlendParameters()
    });
  }

  private createMinimapModel(
    firstNodeIndex: number,
    nodeCount: number,
    traceDuration: number
  ): Model {
    return new Model(this.device, {
      id: 'gpu-trace-minimap-model',
      source: getTraceMinimapRenderShader(firstNodeIndex, nodeCount, traceDuration),
      topology: 'triangle-list',
      vertexCount: 6,
      instanceCount: nodeCount + 4,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'temporalIndex', type: 'read-only-storage', group: 0, location: 0},
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 1}
        ]
      },
      parameters: {...makeTraceBlendParameters(), depthCompare: 'always', depthWriteEnabled: false}
    });
  }

  private createLabelRenderer(): DictionaryTextRenderer {
    const fontAtlas = buildSdfFontAtlas({
      characterSet: [...new Set(TRACE_LABEL_DICTIONARY.join(''))],
      fontFamily: 'Monaco, Menlo, monospace',
      fontWeight: 600,
      fontSize: 48,
      buffer: 5,
      radius: 10,
      smoothing: 0.08
    });
    return new DictionaryTextRenderer(this.device, {
      id: 'gpu-trace-dictionary-labels',
      dictionary: TRACE_LABEL_DICTIONARY,
      fontAtlas,
      fontSize: TRACE_LABEL_FONT_SIZE,
      color: [0.94, 0.96, 1, 0.92],
      modelProps: {
        source: TRACE_LABEL_RENDER_SHADER,
        topology: 'triangle-list',
        colorAttachmentFormats: [this.device.preferredColorFormat],
        depthStencilAttachmentFormat: 'depth24plus',
        shaderLayout: {
          attributes: [],
          bindings: [
            {name: 'labelGlyphs', type: 'read-only-storage', group: 0, location: 0},
            {name: 'threadOffsets', type: 'read-only-storage', group: 0, location: 1},
            {name: 'threadStates', type: 'read-only-storage', group: 0, location: 2},
            {name: 'viewUniforms', type: 'uniform', group: 0, location: 3},
            {
              name: 'textDictionaryGlyphRanges',
              type: 'read-only-storage',
              group: 0,
              location: 4
            },
            {
              name: 'textDictionaryGlyphRecords',
              type: 'read-only-storage',
              group: 0,
              location: 5
            },
            {name: 'textGlyphFrames', type: 'read-only-storage', group: 0, location: 6},
            {name: 'textDictionaryStyle', type: 'uniform', group: 0, location: 7},
            {
              name: 'fontAtlasTexture',
              type: 'texture',
              viewDimension: '2d-array',
              group: 0,
              location: 8
            }
          ]
        },
        parameters: makeTraceBlendParameters()
      }
    });
  }

  private rebuild(spanCapacity: number, dependencyCapacity: number): void {
    this.pendingDatasetRequest = null;
    this.setDatasetPreflight(null);
    const started = performance.now();
    this.spanCapacity = spanCapacity;
    this.dependencyCapacity = dependencyCapacity;
    if (typeof location !== 'undefined' && typeof history !== 'undefined') {
      updateTraceViewerURLPreset(location, history, {spanCapacity, dependencyCapacity});
    }
    this.selectedSpanIndex = INVALID_SPAN_INDEX;
    this.selectedDependencyIndex = INVALID_SPAN_INDEX;
    this.hoveredSpanIndex = INVALID_SPAN_INDEX;
    this.hoveredDependencyIndex = INVALID_SPAN_INDEX;
    this.regressionGroupMask = 0;
    this.anomalyOverlayEnabled = false;
    const anomalyOverlayInput =
      this.dashboardElement?.querySelector<HTMLInputElement>('[data-anomaly-overlay]');
    if (anomalyOverlayInput) {
      anomalyOverlayInput.checked = false;
      anomalyOverlayInput.disabled = true;
    }
    const requestId = this.datasetGeneration.begin();
    this.datasetWorker?.terminate();
    const worker = new Worker(new URL('./trace-data-worker.ts', import.meta.url), {type: 'module'});
    this.datasetWorker = worker;
    this.firstGpuFramePending = false;
    this.initialDependencyWarmup = false;
    if (this.dependencyWarmupTimer) {
      clearTimeout(this.dependencyWarmupTimer);
      this.dependencyWarmupTimer = null;
    }
    this.setDatasetStatus(
      `Generating ${formatCount(spanCapacity)} spans off the main thread…`,
      'generating'
    );
    worker.onmessage = (event: MessageEvent<TraceDatasetWorkerResponse>): void => {
      const response = event.data;
      if (!this.datasetGeneration.isCurrent(response.requestId) || worker !== this.datasetWorker) {
        return;
      }
      if ('progress' in response) {
        const progressMessages = {
          spans: 'Generated spans · building dependency topology…',
          dependencies: 'Generated dependencies · indexing temporal batches…',
          indexes: 'Indexed batches · building forward and reverse CSR…',
          adjacency: 'Built CSR adjacency · transferring source arrays…',
          complete: 'Source generation complete · transferring to the main thread…'
        } as const;
        this.setDatasetStatus(progressMessages[response.progress], 'generating');
        return;
      }
      worker.terminate();
      this.datasetWorker = null;
      if ('error' in response) {
        this.setDatasetStatus(`Generation failed: ${response.error}`, 'error');
        return;
      }
      this.setDatasetStatus('Allocating and uploading GPU source chunks…', 'uploading');
      requestAnimationFrame(() => {
        if (this.datasetGeneration.isCurrent(requestId)) {
          void this.installDataset(response.dataset, started, requestId).catch(error => {
            if (this.datasetGeneration.isCurrent(requestId)) {
              this.setDatasetStatus(
                `GPU build failed: ${error instanceof Error ? error.message : String(error)}`,
                'error'
              );
            }
          });
        }
      });
    };
    worker.onerror = event => {
      if (this.datasetGeneration.isCurrent(requestId)) {
        worker.terminate();
        this.datasetWorker = null;
        this.setDatasetStatus(`Generation failed: ${event.message}`, 'error');
      }
    };
    worker.postMessage({requestId, spanCapacity, dependencyCapacity});
  }

  private requestRebuild(spanCapacity: number, dependencyCapacity: number): void {
    if (this.certificationRun) {
      this.cancelTraceCertification();
    }
    const preflight = getTraceDatasetPreflight(spanCapacity, dependencyCapacity);
    if (!preflight.requiresConfirmation) {
      this.rebuild(spanCapacity, dependencyCapacity);
      return;
    }
    this.pendingDatasetRequest = {spanCapacity, dependencyCapacity};
    this.setDatasetPreflight(
      `${formatCount(preflight.spanCount)} spans produce about ${formatBytes(preflight.estimatedSourceByteLength)} of source topology and at least ${formatCount(preflight.minimumScanInvocationCount)} full-data shader invocations. This valid workload may make the GPU queue unresponsive.`
    );
  }

  private setDatasetPreflight(message: string | null): void {
    if (this.datasetPreflightElement) {
      this.datasetPreflightElement.hidden = message === null;
    }
    if (this.datasetPreflightMessageElement) {
      this.datasetPreflightMessageElement.textContent = message ?? '';
    }
  }

  private async installDataset(
    dataset: TraceDatasetData,
    started: number,
    requestId: number
  ): Promise<void> {
    this.destroyResources();
    this.traceDuration = dataset.duration;
    this.setViewTimeRange(this.view.timeMin, this.view.timeMax);
    await waitForAnimationFrame();
    if (!this.datasetGeneration.isCurrent(requestId)) return;

    let resources: TraceGraphResources | null = null;
    try {
      this.stagedResourceUploads = [];
      resources = this.createResources(dataset);
      const uploads = this.stagedResourceUploads;
      this.stagedResourceUploads = null;
      await this.uploadResourceData(uploads, requestId, resources);
      releaseTraceDatasetStorage(dataset);
      if (!this.datasetGeneration.isCurrent(requestId)) return;
      this.setDatasetStatus('Building GPU lane/time search indexes…', 'compiling');
      const indexGraph = this.createRepresentativeIndexGraph(resources);
      const indexed = await executeGPUCommandGraphInFrames({
        device: this.device,
        compiled: indexGraph,
        budget: TRACE_ANALYSIS_EXECUTION_BUDGET,
        budgetController: this.indexExecutionBudgetController,
        isCurrent: () => this.datasetGeneration.isCurrent(requestId),
        onPlan: plan =>
          this.setDatasetStatus(
            `Planned ${formatCount(plan.stepCount)} bounded index submissions${plan.oversizedStepCount > 0 ? ` · ${formatCount(plan.oversizedStepCount)} oversized` : ''}…`,
            'compiling'
          ),
        onProgress: (progress, stepIndex, stepCount) =>
          this.setDatasetStatus(
            `Building GPU lane/time search indexes · step ${formatCount(stepIndex)}/${formatCount(stepCount)} · ${Math.round(progress * 100)}%`,
            'compiling'
          )
      });
      indexGraph.destroy();
      if (!indexed) {
        this.destroyResourceSet(resources);
        return;
      }
      this.setDatasetStatus('GPU upload complete · compiling the render graph…', 'compiling');
      await waitForAnimationFrame();
      if (!this.datasetGeneration.isCurrent(requestId)) {
        this.destroyResourceSet(resources);
        return;
      }
      const compileStarted = performance.now();
      resources.renderBundle = this.createRenderBundle(resources);
      resources.compiled = this.createGraph(resources, dataset);
      const picking = this.createPickingGraph(resources);
      resources.pickingCompiled = picking.compiled;
      resources.pickingReadbackIdentifier = picking.readbackIdentifier;
      this.compileTimeMilliseconds = performance.now() - compileStarted;
    } catch (error) {
      this.stagedResourceUploads = null;
      if (resources) this.destroyResourceSet(resources);
      throw error;
    }
    this.graphObservation = this.graphInspector.observeGraph(resources.compiled);
    this.graphGPUTimingSampleCount = 0;
    this.updateAllocationStats(resources);
    this.resources = resources;
    this.setCausalAnalysisStatus(
      'Ready to analyze canonical parent chains without rebuilding span objects on the CPU.'
    );
    this.measuredTimeMinimum = clamp(this.measuredTimeMinimum, 0, this.traceDuration);
    this.measuredTimeMaximum = clamp(
      Math.max(this.measuredTimeMaximum, this.measuredTimeMinimum + 0.5),
      0.5,
      this.traceDuration
    );
    this.compileCount++;
    this.sampledVisibleCounts = TRACE_GROUPS.map(() => 0);
    this.sampledDependencyCount = 0;
    this.sampledLabelGlyphCount = 0;
    this.sampledCandidateBatchCount = 0;
    this.sampledCandidateDependencyBatchCount = 0;
    this.sampledFocusOverflowCount = 0;
    this.overviewFrameTimeSamples.exact.length = 0;
    this.overviewFrameTimeSamples.density.length = 0;
    this.overviewFrameTimeSamples.representative.length = 0;
    this.overviewMeasurementSignature = '';
    this.groupAggregationCounts = TRACE_GROUPS.map(() => 0);
    this.groupAggregationDurationSums = TRACE_GROUPS.map(() => 0);
    this.groupAggregationDurationMeans = TRACE_GROUPS.map(() => 0);
    this.operationAggregationCounts = TRACE_LABEL_DICTIONARY.map(() => 0);
    this.statusAggregationCounts = STATUS_NAMES.map(() => 0);
    this.durationHistogramCounts.fill(0);
    this.timeBucketCounts.fill(0);
    this.timeBucketDurations.fill(0);
    this.timeBucketConcurrency.fill(0);
    this.timeBucketUtilization.fill(0);
    this.timeBucketIdleLaneTime.fill(0);
    this.recordWorkloadCounters();
    this.readyDatasetStatus = `Ready in ${((performance.now() - started) / 1000).toFixed(1)} s · ${formatCount(dataset.spanCount)} spans and ${formatCount(dataset.dependencyCount)} generated edges`;
    this.firstGpuFramePending = true;
    this.initialDependencyWarmup = true;
    this.setDatasetStatus(
      'Warming the first GPU frame · spans first, dependencies next…',
      'warming'
    );
    this.updateInspector();
  }

  private setDatasetStatus(status: string, phase = this.datasetLoadPhase): void {
    this.datasetStatus = status;
    this.datasetLoadPhase = phase;
    if (this.datasetStatusElement) {
      this.datasetStatusElement.textContent = status;
    }
    if (this.datasetLoadMessageElement) {
      this.datasetLoadMessageElement.textContent = status;
    }
    if (this.datasetLoadBannerElement) {
      this.datasetLoadBannerElement.dataset.phase = phase;
      this.datasetLoadBannerElement.hidden = phase === 'ready';
    }
    if (this.graphDiagnosticElement) {
      const isError = /failed|device lost|invalid/i.test(status);
      this.graphDiagnosticElement.hidden = !isError;
      this.graphDiagnosticElement.textContent = isError
        ? `Graph validation stopped submission · ${status}`
        : '';
    }
    this.updateTraceCertificationPanel();
  }

  /** Uploads each canonical source or mutable interaction allocation exactly once. */
  private createResources(dataset: TraceDatasetData): TraceGraphResources {
    const groups = dataset.groups.map(group => ({
      name: group.name,
      count: group.count,
      firstSpanIndex: group.firstSpanIndex
    }));
    const spanMaskByteLength = Math.max(dataset.spanCount, 1) * UINT32_BYTE_LENGTH;
    const focusMaskWordCount = Math.max(Math.ceil(dataset.spanCount / 32), 1);
    const focusFrontierCapacity = getTraceFocusFrontierCapacity(
      dataset.spanCount,
      dataset.dependencyCount
    );
    const densityBinCount = TRACE_DISPLAY_LANE_CAPACITY * TRACE_DENSITY_BIN_COUNT;
    const densityValueCount = densityBinCount * TRACE_GROUPS.length;
    const maximumDirectSpanByteLength = Math.min(
      this.device.limits.maxStorageBufferBindingSize,
      this.device.limits.maxBufferSize
    );
    const maximumSpanChunkByteLength = Math.min(
      maximumDirectSpanByteLength,
      this.spanChunkByteLength
    );
    const spanChunkData = makeTraceSpanChunks(
      dataset.spans,
      dataset.spanBatches,
      maximumSpanChunkByteLength
    );
    const maximumDependencyChunkByteLength = Math.min(
      maximumDirectSpanByteLength,
      this.dependencyChunkByteLength
    );
    const dependencyChunkData = makeTraceDependencyChunks(
      dataset.dependencies,
      dataset.dependencyBatches,
      maximumDependencyChunkByteLength
    );
    const maximumAdjacencyChunkByteLength = Math.min(
      maximumDirectSpanByteLength,
      this.adjacencyChunkByteLength
    );
    const outgoingAdjacencyChunkData = makeTraceAdjacencyChunks(
      dataset.outgoing,
      maximumAdjacencyChunkByteLength
    );
    const incomingAdjacencyChunkData = makeTraceAdjacencyChunks(
      dataset.incoming,
      maximumAdjacencyChunkByteLength
    );
    const spanDraws: TraceSpanDrawResources[] = spanChunkData.flatMap(chunk =>
      groups.flatMap((_, groupIndex) => {
        const chunkBatches = dataset.spanBatches
          .slice(chunk.firstBatchIndex, chunk.firstBatchIndex + chunk.batchCount)
          .filter(batch => batch.groupIndex === groupIndex);
        return chunkBatches.length > 0
          ? [
              {
                commandIndex: 0,
                groupIndex,
                chunkIndex: chunk.chunkIndex,
                firstBatchIndex: chunkBatches[0].batchIndex,
                batchCount: chunkBatches.length
              }
            ]
          : [];
      })
    );
    spanDraws.forEach((draw, commandIndex) => {
      draw.commandIndex = commandIndex;
    });
    const densityDrawCommandIndex = spanDraws.length + dependencyChunkData.length;
    const labelDrawCommandIndex = densityDrawCommandIndex + 1;
    const drawCommands = new DrawCommandBuffer(this.device, {
      id: 'gpu-trace-draw-commands',
      type: 'draw',
      commands: [
        ...spanDraws.map(() => ({vertexCount: 6, instanceCount: 0})),
        ...dependencyChunkData.map(() => ({vertexCount: 6, instanceCount: 0})),
        // Density is sampled by one full-screen triangle; bins remain GPU-resident lookup cells.
        {vertexCount: 3, instanceCount: 1},
        {vertexCount: 6, instanceCount: 0}
      ]
    });
    const candidateDispatchCommands = new DispatchCommandBuffer(this.device, {
      id: 'gpu-trace-candidate-dispatch-commands',
      commands: [{x: TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT, y: 0, z: 1}]
    });
    const aggregationCandidateDispatchCommands = new DispatchCommandBuffer(this.device, {
      id: 'gpu-trace-aggregation-candidate-dispatch-commands',
      commands: [{x: TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT, y: 0, z: 1}]
    });
    const densityCandidateDispatchCommands = new DispatchCommandBuffer(this.device, {
      id: 'gpu-trace-density-candidate-dispatch-commands',
      commands: spanChunkData.map(() => ({x: TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT, y: 0, z: 1}))
    });
    const pickCandidateDispatchCommands = new DispatchCommandBuffer(this.device, {
      id: 'gpu-trace-pick-candidate-dispatch-commands',
      commands: spanChunkData.map(() => ({x: TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT, y: 0, z: 1}))
    });
    const readbackRing = new GPUReadbackRing(this.device, {
      id: 'gpu-trace-readback',
      byteLength: drawCommands.buffer.byteLength,
      slotCount: 5
    });
    const pickingReadbackRing = new GPUReadbackRing(this.device, {
      id: 'gpu-trace-index-picking-readback',
      byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
      slotCount: 3
    });
    const [pickingWidth, pickingHeight] = this.device
      .getDefaultCanvasContext()
      .getDevicePixelSize();
    const minimapLevel = dataset.temporalIndex.levels.at(-1) ?? {
      firstNodeIndex: 0,
      nodeCount: 0
    };
    return {
      compiled: undefined!,
      pickingCompiled: undefined!,
      pickingReadbackIdentifier: '',
      pickingWidth: Math.max(pickingWidth, 1),
      pickingHeight: Math.max(pickingHeight, 1),
      aggregationCompiled: null,
      viewportAggregationCompiled: null,
      renderBundle: undefined!,
      minimapModel: this.createMinimapModel(
        minimapLevel.firstNodeIndex,
        minimapLevel.nodeCount,
        dataset.duration
      ),
      drawCommands,
      candidateDispatchCommands,
      aggregationCandidateDispatchCommands,
      densityCandidateDispatchCommands,
      pickCandidateDispatchCommands,
      candidateDependencyBatchCounts: this.createStorageBuffer(
        'gpu-trace-candidate-dependency-batch-counts',
        dependencyChunkData.length * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      readbackRing,
      pickingReadbackRing,
      groups,
      spanChunks: spanChunkData.map(chunk => {
        const buffer = this.createDataBuffer(`gpu-trace-spans-${chunk.chunkIndex}`, chunk.data);
        const uniforms = this.createDataBuffer(
          `gpu-trace-span-chunk-uniforms-${chunk.chunkIndex}`,
          Uint32Array.of(
            chunk.firstSpanIndex,
            chunk.spanCount,
            chunk.firstBatchIndex,
            chunk.batchCount
          ),
          Buffer.UNIFORM
        );
        return {
          buffer,
          uniforms,
          visibility: this.createStorageBuffer(
            `gpu-trace-span-visibility-${chunk.chunkIndex}`,
            Math.ceil(chunk.spanCount / 32) * UINT32_BYTE_LENGTH,
            Buffer.COPY_SRC
          ),
          visibleIds: this.createStorageBuffer(
            `gpu-trace-visible-span-ids-${chunk.chunkIndex}`,
            chunk.spanCount * UINT32_BYTE_LENGTH,
            Buffer.COPY_SRC
          ),
          aggregationSelection: this.createStorageBuffer(
            `gpu-trace-aggregation-selection-${chunk.chunkIndex}`,
            chunk.spanCount * UINT32_BYTE_LENGTH
          ),
          representativeSelection: this.createStorageBuffer(
            `gpu-trace-representative-selection-${chunk.chunkIndex}`,
            Math.ceil(chunk.spanCount / 32) * UINT32_BYTE_LENGTH
          ),
          representativeRowOrder: this.createStorageBuffer(
            `gpu-trace-representative-row-order-${chunk.chunkIndex}`,
            chunk.spanCount * UINT32_BYTE_LENGTH
          ),
          representativeLaneOffsets: this.createStorageBuffer(
            `gpu-trace-representative-lane-offsets-${chunk.chunkIndex}`,
            (TRACE_LANE_COUNT + 1) * UINT32_BYTE_LENGTH
          ),
          representativeIds: this.createStorageBuffer(
            `gpu-trace-representative-ids-${chunk.chunkIndex}`,
            TRACE_REPRESENTATIVE_COUNT * UINT32_BYTE_LENGTH
          ),
          representativeValidationErrors: this.createStorageBuffer(
            `gpu-trace-representative-validation-errors-${chunk.chunkIndex}`,
            UINT32_BYTE_LENGTH,
            Buffer.COPY_SRC
          ),
          chunkIndex: chunk.chunkIndex,
          firstSpanIndex: chunk.firstSpanIndex,
          spanCount: chunk.spanCount,
          firstBatchIndex: chunk.firstBatchIndex,
          batchCount: chunk.batchCount
        };
      }),
      spanDraws,
      dependencyChunks: dependencyChunkData.map(chunk => {
        const frameBatchBudget = getPartitionedBudget(
          TRACE_DEPENDENCY_FRAME_BATCH_BUDGET,
          chunk.chunkIndex,
          dependencyChunkData.length
        );
        const visibleCapacity = getPartitionedBudget(
          TRACE_DEPENDENCY_DISPLAY_BUDGET_OPTIONS.at(-1)!,
          chunk.chunkIndex,
          dependencyChunkData.length
        );
        return {
          buffer: this.createDataBuffer(`gpu-trace-dependencies-${chunk.chunkIndex}`, chunk.data),
          uniforms: this.createDataBuffer(
            `gpu-trace-dependency-chunk-uniforms-${chunk.chunkIndex}`,
            Uint32Array.of(chunk.firstDependencyIndex),
            Buffer.UNIFORM
          ),
          batchIndex: this.createDataBuffer(
            `gpu-trace-dependency-batch-index-${chunk.chunkIndex}`,
            makeTraceDependencyChunkBatchIndex(dataset.dependencyBatchIndex, chunk)
          ),
          candidateBatchIds: this.createStorageBuffer(
            `gpu-trace-candidate-dependency-batch-ids-${chunk.chunkIndex}`,
            chunk.batchCount * UINT32_BYTE_LENGTH
          ),
          results: this.createStorageBuffer(
            `gpu-trace-dependency-results-${chunk.chunkIndex}`,
            chunk.dependencyCount * 3 * UINT32_BYTE_LENGTH,
            Buffer.COPY_SRC
          ),
          endpointPositions: this.createStorageBuffer(
            `gpu-trace-dependency-endpoint-positions-${chunk.chunkIndex}`,
            chunk.dependencyCount * 4 * UINT32_BYTE_LENGTH
          ),
          visibleIds: this.createStorageBuffer(
            `gpu-trace-visible-dependencies-${chunk.chunkIndex}`,
            visibleCapacity * UINT32_BYTE_LENGTH,
            Buffer.COPY_SRC
          ),
          candidateDispatchCommands: new DispatchCommandBuffer(this.device, {
            id: `gpu-trace-candidate-dependency-dispatch-commands-${chunk.chunkIndex}`,
            commands: [{x: 1, y: 0, z: 1}]
          }),
          chunkIndex: chunk.chunkIndex,
          firstDependencyIndex: chunk.firstDependencyIndex,
          dependencyCount: chunk.dependencyCount,
          firstBatchIndex: chunk.firstBatchIndex,
          batchCount: chunk.batchCount,
          drawCommandIndex: spanDraws.length + chunk.chunkIndex,
          frameBatchBudget,
          visibleCapacity
        };
      }),
      densityDrawCommandIndex,
      labelDrawCommandIndex,
      spanBatchIndex: this.createDataBuffer('gpu-trace-span-batch-index', dataset.spanBatchIndex),
      candidateBatchIds: this.createStorageBuffer(
        'gpu-trace-candidate-batch-ids',
        dataset.spanBatches.length * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      candidateChunkOffsets: this.createStorageBuffer(
        'gpu-trace-candidate-chunk-offsets',
        spanChunkData.length * UINT32_BYTE_LENGTH
      ),
      parentSpans: this.createDataBuffer('gpu-trace-parent-spans', dataset.parentSpans),
      outgoingAdjacencyChunks: outgoingAdjacencyChunkData.map(chunk => ({
        topology: this.createDataBuffer(
          `gpu-trace-outgoing-topology-${chunk.chunkIndex}`,
          chunk.topology
        ),
        neighbors: this.createDataBuffer(
          `gpu-trace-outgoing-neighbors-${chunk.chunkIndex}`,
          chunk.neighbors
        ),
        chunkIndex: chunk.chunkIndex,
        firstNodeIndex: chunk.firstNodeIndex,
        nodeCount: chunk.nodeCount,
        firstNeighborIndex: chunk.firstNeighborIndex,
        neighborCount: chunk.neighborCount
      })),
      incomingAdjacencyChunks: incomingAdjacencyChunkData.map(chunk => ({
        topology: this.createDataBuffer(
          `gpu-trace-incoming-topology-${chunk.chunkIndex}`,
          chunk.topology
        ),
        neighbors: this.createDataBuffer(
          `gpu-trace-incoming-neighbors-${chunk.chunkIndex}`,
          chunk.neighbors
        ),
        chunkIndex: chunk.chunkIndex,
        firstNodeIndex: chunk.firstNodeIndex,
        nodeCount: chunk.nodeCount,
        firstNeighborIndex: chunk.firstNeighborIndex,
        neighborCount: chunk.neighborCount
      })),
      processStates: this.createDataBuffer('gpu-trace-process-states', this.processStates),
      threadStates: this.createDataBuffer('gpu-trace-thread-states', this.threadStates),
      threadHeights: this.createStorageBuffer(
        'gpu-trace-thread-heights',
        TRACE_THREAD_COUNT * UINT32_BYTE_LENGTH
      ),
      threadOffsets: this.createStorageBuffer(
        'gpu-trace-thread-offsets',
        TRACE_THREAD_COUNT * UINT32_BYTE_LENGTH
      ),
      selectedSeeds: this.createDataBuffer('gpu-trace-selected-seeds', new Uint32Array(1)),
      selectedSeedCount: this.createDataBuffer('gpu-trace-selected-seed-count', new Uint32Array(1)),
      focusTraversalState: this.createDataBuffer(
        'gpu-trace-focus-traversal-state',
        Uint32Array.of(this.focusDepth)
      ),
      focusOverflowCount: this.createStorageBuffer(
        'gpu-trace-focus-overflow-count',
        UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      reachedSpans: this.createStorageBuffer(
        'gpu-trace-reached-spans',
        focusMaskWordCount * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      dependencySpanVisibility: this.createStorageBuffer(
        'gpu-trace-dependency-span-visibility',
        dataset.dependencyCount > 0 ? spanMaskByteLength : UINT32_BYTE_LENGTH,
        Buffer.COPY_DST
      ),
      zeroAnomalyMask: this.createDataBuffer('gpu-trace-zero-anomaly-mask', new Uint32Array(1)),
      anomalyMasks: null,
      densityBins: this.createStorageBuffer(
        'gpu-trace-density-bins',
        densityValueCount * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      labelGlyphs: this.createStorageBuffer(
        'gpu-trace-label-glyphs',
        TRACE_LABEL_GLYPH_CAPACITY * TRACE_LABEL_GLYPH_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      pickResult: this.createStorageBuffer(
        'gpu-trace-picked-span',
        TRACE_PICK_RESULT_WORD_LENGTH * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      aggregationWindow: this.device.createBuffer({
        id: 'gpu-trace-aggregation-window',
        byteLength: 6 * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      aggregationResults: this.createStorageBuffer(
        'gpu-trace-aggregation-results',
        TRACE_ANALYTICS_OUTPUT.byteLength,
        Buffer.COPY_SRC
      ),
      aggregationTemporalQuery: this.device.createBuffer({
        id: 'gpu-trace-aggregation-temporal-query',
        byteLength: 7 * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      aggregationCandidateBatchIds: this.createStorageBuffer(
        'gpu-trace-aggregation-candidate-batch-ids',
        dataset.spanBatches.length * UINT32_BYTE_LENGTH
      ),
      temporalIndex: this.createDataBuffer('gpu-trace-temporal-index', dataset.temporalIndex.data),
      temporalIndexDirtyPartitions: this.createDataBuffer(
        'gpu-trace-temporal-index-dirty-partitions',
        new Uint32Array(dataset.temporalIndex.partitionCount).fill(1)
      ),
      temporalIndexValidationErrors: this.createStorageBuffer(
        'gpu-trace-temporal-index-validation-errors',
        UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      temporalIndexLevels: dataset.temporalIndex.levels,
      temporalIndexPartitionBatchCount: dataset.temporalIndex.partitionBatchCount,
      temporalIndexPartitionCount: dataset.temporalIndex.partitionCount,
      temporalQuery: this.device.createBuffer({
        id: 'gpu-trace-temporal-query',
        byteLength: 7 * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      representativeQuery: this.device.createBuffer({
        id: 'gpu-trace-representative-query',
        byteLength: 3 * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      representativeBestDurations: this.createStorageBuffer(
        'gpu-trace-representative-best-durations',
        TRACE_REPRESENTATIVE_COUNT * UINT32_BYTE_LENGTH
      ),
      representativeBestIds: this.createStorageBuffer(
        'gpu-trace-representative-best-ids',
        TRACE_REPRESENTATIVE_COUNT * UINT32_BYTE_LENGTH
      ),
      spanCount: dataset.spanCount,
      spanBatchCount: dataset.spanBatches.length,
      dependencyBatchCount: dataset.dependencyBatches.length,
      dependencyCount: dataset.dependencyCount,
      focusFrontierCapacity
    };
  }

  private createDataBuffer(id: string, data: Uint32Array, additionalUsage = 0): Buffer {
    const uploadData = data.length > 0 ? data : new Uint32Array(1);
    if (this.stagedResourceUploads) {
      const buffer = this.device.createBuffer({
        id,
        byteLength: uploadData.byteLength,
        usage: Buffer.STORAGE | Buffer.COPY_DST | additionalUsage
      });
      this.stagedResourceUploads.push({buffer, data: uploadData});
      return buffer;
    }
    return this.device.createBuffer({
      id,
      data: uploadData,
      usage: Buffer.STORAGE | Buffer.COPY_DST | additionalUsage
    });
  }

  private async uploadResourceData(
    uploads: TraceStagedUpload[],
    requestId: number,
    resources: TraceGraphResources
  ): Promise<void> {
    const totalByteLength = uploads.reduce((sum, upload) => sum + upload.data.byteLength, 0);
    let uploadedByteLength = 0;
    let byteLengthSinceYield = 0;
    for (let uploadIndex = 0; uploadIndex < uploads.length; uploadIndex++) {
      const upload = uploads[uploadIndex];
      const uploadBytes = new Uint8Array(
        upload.data.buffer,
        upload.data.byteOffset,
        upload.data.byteLength
      );
      for (
        let sourceByteOffset = 0;
        sourceByteOffset < uploadBytes.byteLength;
        sourceByteOffset += TRACE_UPLOAD_SLICE_BYTE_LENGTH
      ) {
        const sourceByteEnd = Math.min(
          sourceByteOffset + TRACE_UPLOAD_SLICE_BYTE_LENGTH,
          uploadBytes.byteLength
        );
        const slice = uploadBytes.subarray(sourceByteOffset, sourceByteEnd);
        upload.buffer.write(slice, sourceByteOffset);
        uploadedByteLength += slice.byteLength;
        byteLengthSinceYield += slice.byteLength;
        const isFinalSlice =
          uploadIndex + 1 === uploads.length && sourceByteEnd === uploadBytes.byteLength;
        if (byteLengthSinceYield < TRACE_UPLOAD_YIELD_BYTE_LENGTH && !isFinalSlice) continue;
        const percent = Math.round((uploadedByteLength / Math.max(totalByteLength, 1)) * 100);
        this.setDatasetStatus(
          `Uploading GPU source chunks · ${percent}% of ${formatBytes(totalByteLength)}…`,
          'uploading'
        );
        byteLengthSinceYield = 0;
        await waitForAnimationFrame();
        if (!this.datasetGeneration.isCurrent(requestId)) {
          this.destroyResourceSet(resources);
          return;
        }
      }
      // Remove this staging view as soon as its queue writes have copied the source bytes.
      upload.data = new Uint32Array(0);
    }
  }

  /** Compiles dataset-wide GPU aggregations once, independently of viewport interaction work. */
  private createAggregationGraph(resources: TraceGraphResources): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {
      id: 'gpu-trace-dataset-aggregation',
      autotuner: this.graphAutotuner
    });
    const spanHandles = resources.spanChunks.map(chunk =>
      importTraceBuffer(graph, `aggregation-spans-${chunk.chunkIndex}`, chunk.buffer)
    );
    const analysisPartitions: TraceAnalysisPartition[] = resources.spanChunks.flatMap(chunk => {
      const partitions: TraceAnalysisPartition[] = [];
      for (
        let firstRow = 0;
        firstRow < chunk.spanCount;
        firstRow += TRACE_ANALYSIS_PARTITION_ROW_COUNT
      ) {
        partitions.push({
          chunkIndex: chunk.chunkIndex,
          firstRow,
          rowCount: Math.min(TRACE_ANALYSIS_PARTITION_ROW_COUNT, chunk.spanCount - firstRow)
        });
      }
      return partitions;
    });
    const aggregationWindowHandle = importTraceBuffer(
      graph,
      'aggregation-window',
      resources.aggregationWindow
    );
    const aggregationSelectionHandles = resources.spanChunks.map(chunk =>
      importTraceBuffer(
        graph,
        `aggregation-selection-${chunk.chunkIndex}`,
        chunk.aggregationSelection
      )
    );
    const aggregationStatusHandles = resources.spanChunks.map(chunk =>
      graph.createTransientBuffer({
        id: `aggregation-status-${chunk.chunkIndex}`,
        byteLength: chunk.spanCount * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      })
    );
    const aggregationOperationHandles = resources.spanChunks.map(chunk =>
      graph.createTransientBuffer({
        id: `aggregation-operation-${chunk.chunkIndex}`,
        byteLength: chunk.spanCount * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      })
    );
    analysisPartitions.forEach((partition, partitionIndex) => {
      addTraceComputePass(graph, {
        id: `trace-aggregation-window-selection-${partitionIndex}`,
        source: getAggregationWindowSelectionShader(partition.firstRow, partition.rowCount),
        bindings: [
          {
            name: 'spans',
            buffer: spanHandles[partition.chunkIndex],
            type: 'storage',
            usage: 'storage-read'
          },
          {
            name: 'aggregationControls',
            buffer: aggregationWindowHandle,
            type: 'storage',
            usage: 'storage-read'
          },
          {
            name: 'selectionMask',
            buffer: aggregationSelectionHandles[partition.chunkIndex],
            type: 'storage',
            usage: 'storage-write'
          },
          {
            name: 'statusIds',
            buffer: aggregationStatusHandles[partition.chunkIndex],
            type: 'storage',
            usage: 'storage-write'
          },
          {
            name: 'operationIds',
            buffer: aggregationOperationHandles[partition.chunkIndex],
            type: 'storage',
            usage: 'storage-write'
          }
        ],
        length: partition.rowCount
      });
    });
    const source = {
      startTimes: makeTraceAnalysisColumnVector(
        graph,
        'aggregation-start-times',
        spanHandles,
        analysisPartitions,
        'float32',
        0
      ),
      durations: makeTraceAnalysisColumnVector(
        graph,
        'aggregation-durations',
        spanHandles,
        analysisPartitions,
        'float32',
        1
      ),
      lanes: makeTraceAnalysisColumnVector(
        graph,
        'aggregation-lanes',
        spanHandles,
        analysisPartitions,
        'uint32',
        2
      ),
      groupIds: makeTraceAnalysisColumnVector(
        graph,
        'aggregation-groups',
        spanHandles,
        analysisPartitions,
        'uint32',
        3
      ),
      processIds: makeTraceAnalysisColumnVector(
        graph,
        'aggregation-processes',
        spanHandles,
        analysisPartitions,
        'uint32',
        4
      ),
      threadIds: makeTraceAnalysisColumnVector(
        graph,
        'aggregation-threads',
        spanHandles,
        analysisPartitions,
        'uint32',
        5
      ),
      classifications: makeTraceAnalysisColumnVector(
        graph,
        'aggregation-classifications',
        spanHandles,
        analysisPartitions,
        'uint32',
        7
      )
    };
    const selection = makeTraceGraphVector(
      'aggregation-selection',
      analysisPartitions.map(partition =>
        graph.createDataView(aggregationSelectionHandles[partition.chunkIndex], {
          format: 'uint32',
          length: partition.rowCount,
          byteOffset: partition.firstRow * UINT32_BYTE_LENGTH
        })
      )
    );
    const aggregationWindow = graph.createDataView(aggregationWindowHandle, {
      format: 'float32',
      length: 2
    });
    const resultHandle = importTraceBuffer(
      graph,
      'aggregation-results',
      resources.aggregationResults
    );
    const statuses = makeTraceGraphVector(
      'aggregation-statuses',
      analysisPartitions.map(partition =>
        graph.createDataView(aggregationStatusHandles[partition.chunkIndex], {
          format: 'uint32',
          length: partition.rowCount,
          byteOffset: partition.firstRow * UINT32_BYTE_LENGTH
        })
      )
    );
    const operations = makeTraceGraphVector(
      'aggregation-operations',
      analysisPartitions.map(partition =>
        graph.createDataView(aggregationOperationHandles[partition.chunkIndex], {
          format: 'uint32',
          length: partition.rowCount,
          byteOffset: partition.firstRow * UINT32_BYTE_LENGTH
        })
      )
    );
    new GPUTraceAggregation({
      id: 'trace-group-counts',
      trace: source,
      dimension: 'group',
      metric: 'count',
      selection,
      output: TRACE_ANALYTICS_OUTPUT.createUint32View(graph, resultHandle, 'group-counts')
    }).addToGraph(graph);
    new GPUTraceAggregation({
      id: 'trace-group-duration-sums',
      trace: source,
      dimension: 'group',
      metric: 'duration-sum',
      selection,
      output: TRACE_ANALYTICS_OUTPUT.createFloat32View(graph, resultHandle, 'group-duration-sums')
    }).addToGraph(graph);
    new GPUTraceAggregation({
      id: 'trace-group-duration-means',
      trace: source,
      dimension: 'group',
      metric: 'duration-mean',
      selection,
      output: TRACE_ANALYTICS_OUTPUT.createFloat32View(graph, resultHandle, 'group-duration-means')
    }).addToGraph(graph);
    new GPUTraceAggregation({
      id: 'trace-operation-counts',
      trace: source,
      dimension: operations,
      metric: 'count',
      selection,
      output: TRACE_ANALYTICS_OUTPUT.createUint32View(graph, resultHandle, 'operation-counts')
    }).addToGraph(graph);
    new GPUTraceAggregation({
      id: 'trace-status-counts',
      trace: source,
      dimension: statuses,
      metric: 'count',
      selection,
      output: TRACE_ANALYTICS_OUTPUT.createUint32View(graph, resultHandle, 'status-counts')
    }).addToGraph(graph);
    new GPUTraceAggregation({
      id: 'trace-process-counts',
      trace: source,
      dimension: 'process',
      metric: 'count',
      selection,
      output: TRACE_ANALYTICS_OUTPUT.createUint32View(graph, resultHandle, 'process-counts')
    }).addToGraph(graph);
    new GPUTraceAggregation({
      id: 'trace-thread-counts',
      trace: source,
      dimension: 'thread',
      metric: 'count',
      selection,
      output: TRACE_ANALYTICS_OUTPUT.createUint32View(graph, resultHandle, 'thread-counts')
    }).addToGraph(graph);
    addTraceAnalyticsPublicationBoundary(graph, {
      id: 'trace-summary-ready',
      result: resultHandle,
      publicationId: 'summary',
      completeness: 'partial'
    });
    new GPUHistogram({
      id: 'trace-duration-histogram',
      input: source.durations,
      mask: selection,
      edges: TRACE_DURATION_HISTOGRAM_EDGES,
      output: TRACE_ANALYTICS_OUTPUT.createUint32View(graph, resultHandle, 'duration-histogram')
    }).addToGraph(graph);
    addTraceAnalyticsPublicationBoundary(graph, {
      id: 'trace-histogram-ready',
      result: resultHandle,
      publicationId: 'histogram',
      completeness: 'partial'
    });
    new GPUTraceTimeBuckets({
      id: 'trace-time-profile',
      trace: source,
      domain: aggregationWindow,
      selection,
      countOutput: TRACE_ANALYTICS_OUTPUT.createUint32View(
        graph,
        resultHandle,
        'time-bucket-counts'
      ),
      durationOutput: TRACE_ANALYTICS_OUTPUT.createFloat32View(
        graph,
        resultHandle,
        'time-bucket-durations'
      ),
      occupancy: {
        laneCount: TRACE_LANE_COUNT,
        averageConcurrencyOutput: TRACE_ANALYTICS_OUTPUT.createFloat32View(
          graph,
          resultHandle,
          'time-bucket-concurrency'
        ),
        laneUtilizationOutput: TRACE_ANALYTICS_OUTPUT.createFloat32View(
          graph,
          resultHandle,
          'time-bucket-utilization'
        ),
        idleLaneTimeOutput: TRACE_ANALYTICS_OUTPUT.createFloat32View(
          graph,
          resultHandle,
          'time-bucket-idle-lane-time'
        )
      }
    }).addToGraph(graph);
    addTraceAnalyticsPublicationBoundary(graph, {
      id: 'trace-analytics-ready',
      result: resultHandle,
      publicationId: 'complete',
      completeness: 'complete'
    });
    return graph.compile();
  }

  /** Compiles a fused analytical path that visits only temporal-index candidates in the viewport. */
  private createViewportAggregationGraph(
    resources: TraceGraphResources
  ): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {
      id: 'gpu-trace-viewport-aggregation',
      autotuner: this.graphAutotuner
    });
    const spanBatchIndexHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-span-batches',
      resources.spanBatchIndex
    );
    const candidateBatchIdsHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-candidate-batches',
      resources.aggregationCandidateBatchIds
    );
    const candidateDispatchHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-candidate-dispatch',
      resources.aggregationCandidateDispatchCommands.buffer
    );
    const temporalIndexHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-temporal-index',
      resources.temporalIndex
    );
    const temporalIndexDirtyPartitionsHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-temporal-index-dirty-partitions',
      resources.temporalIndexDirtyPartitions
    );
    const temporalIndexValidationErrorsHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-temporal-index-validation-errors',
      resources.temporalIndexValidationErrors
    );
    const temporalQueryHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-temporal-query',
      resources.aggregationTemporalQuery
    );
    const aggregationWindowHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-window',
      resources.aggregationWindow
    );
    const resultHandle = importTraceBuffer(
      graph,
      'viewport-aggregation-results',
      resources.aggregationResults
    );
    const spanBatchByteStride = TRACE_SPAN_BATCH_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
    const spanBatchColumn = <T extends 'float32' | 'uint32'>(format: T, wordOffset: number) =>
      graph.createDataView(spanBatchIndexHandle, {
        format,
        length: resources.spanBatchCount,
        byteOffset: wordOffset * UINT32_BYTE_LENGTH,
        byteStride: spanBatchByteStride
      });
    const temporalIndexByteStride = TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
    const temporalIndexNodeCount = resources.temporalIndexLevels.reduce(
      (sum, level) => sum + level.nodeCount,
      0
    );
    new GPUTraceTemporalIndexBuilder({
      id: 'trace-viewport-analytics-temporal-index-builder',
      batches: graph.createDataView(spanBatchIndexHandle, {
        format: 'uint32',
        length: resources.spanBatchCount * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH
      }),
      batchCount: resources.spanBatchCount,
      batchLayout: {
        recordWordLength: TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
        minimumTimeWordOffset: 2,
        maximumTimeWordOffset: 3,
        maximumDurationWordOffset: 8,
        groupWordOffset: 6,
        minimumLaneWordOffset: 4,
        maximumLaneWordOffset: 5
      },
      hierarchy: graph.createDataView(temporalIndexHandle, {
        format: 'uint32',
        length: temporalIndexNodeCount * TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH
      }),
      hierarchyLayout: {
        recordWordLength: TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH,
        minimumTimeWordOffset: 0,
        maximumTimeWordOffset: 1,
        maximumDurationWordOffset: 2,
        groupWordOffset: 3,
        firstBatchWordOffset: 4,
        batchCountWordOffset: 5,
        minimumLaneWordOffset: 6,
        maximumLaneWordOffset: 7
      },
      levels: resources.temporalIndexLevels,
      partitionBatchCount: resources.temporalIndexPartitionBatchCount,
      dirtyPartitions: graph.createDataView(temporalIndexDirtyPartitionsHandle, {
        format: 'uint32',
        length: resources.temporalIndexPartitionCount
      }),
      validationErrors: graph.createDataView(temporalIndexValidationErrorsHandle, {
        format: 'uint32',
        length: 1
      })
    }).addToGraph(graph);
    const temporalIndexColumn = <T extends 'float32' | 'uint32'>(format: T, wordOffset: number) =>
      graph.createDataView(temporalIndexHandle, {
        format,
        length: temporalIndexNodeCount,
        byteOffset: wordOffset * UINT32_BYTE_LENGTH,
        byteStride: temporalIndexByteStride
      });
    new GPUTraceTemporalIndex({
      id: 'trace-viewport-analytics-temporal-index',
      batches: {
        minimumTimes: spanBatchColumn('float32', 2),
        maximumTimes: spanBatchColumn('float32', 3),
        groupIds: spanBatchColumn('uint32', 6),
        minimumLanes: spanBatchColumn('uint32', 4),
        maximumLanes: spanBatchColumn('uint32', 5)
      },
      hierarchy: {
        minimumTimes: temporalIndexColumn('float32', 0),
        maximumTimes: temporalIndexColumn('float32', 1),
        groupIds: temporalIndexColumn('uint32', 3),
        firstBatchIndices: temporalIndexColumn('uint32', 4),
        batchCounts: temporalIndexColumn('uint32', 5),
        minimumLanes: temporalIndexColumn('uint32', 6),
        maximumLanes: temporalIndexColumn('uint32', 7),
        levels: resources.temporalIndexLevels
      },
      query: {
        timeWindow: graph.createDataView(temporalQueryHandle, {format: 'float32', length: 3}),
        enabledGroups: graph.createDataView(temporalQueryHandle, {
          format: 'uint32',
          length: 1,
          byteOffset: 3 * UINT32_BYTE_LENGTH
        }),
        laneWindow: graph.createDataView(temporalQueryHandle, {
          format: 'uint32',
          length: 2,
          byteOffset: 4 * UINT32_BYTE_LENGTH
        }),
        level: graph.createDataView(temporalQueryHandle, {
          format: 'uint32',
          length: 1,
          byteOffset: 6 * UINT32_BYTE_LENGTH
        })
      },
      output: {
        candidates: graph.createDataView(candidateBatchIdsHandle, {
          format: 'uint32',
          length: resources.spanBatchCount
        }),
        candidateCount: graph.createDataView(candidateDispatchHandle, {
          format: 'uint32',
          length: 1,
          byteOffset: UINT32_BYTE_LENGTH
        })
      }
    }).addToGraph(graph);
    addTraceComputePass(graph, {
      id: 'trace-viewport-analytics-clear',
      source: getViewportAggregationClearShader(),
      bindings: [storageWrite('results', resultHandle)],
      length: TRACE_ANALYTICS_OUTPUT.wordLength
    });
    for (const chunk of resources.spanChunks) {
      const spansHandle = importTraceBuffer(
        graph,
        `viewport-aggregation-spans-${chunk.chunkIndex}`,
        chunk.buffer
      );
      addTraceIndirectComputePass(graph, {
        id: `trace-viewport-analytics-chunk-${chunk.chunkIndex}`,
        source: getViewportAggregationShader(chunk),
        bindings: [
          storageRead('spans', spansHandle),
          storageRead('spanBatches', spanBatchIndexHandle),
          storageRead('candidateBatchIds', candidateBatchIdsHandle),
          storageRead('aggregationControls', aggregationWindowHandle),
          storageReadWrite('results', resultHandle)
        ],
        dispatchBuffer: candidateDispatchHandle,
        maximumInvocationCount: resources.spanBatchCount * TRACE_SPAN_BATCH_CAPACITY
      });
    }
    addTraceComputePass(graph, {
      id: 'trace-viewport-analytics-finalize',
      source: getViewportAggregationFinalizeShader(),
      bindings: [
        storageRead('aggregationControls', aggregationWindowHandle),
        storageReadWrite('results', resultHandle)
      ],
      length: Math.max(TRACE_GROUPS.length, TRACE_TIME_BUCKET_COUNT)
    });
    addTraceAnalyticsPublicationBoundary(graph, {
      id: 'trace-viewport-analytics-ready',
      result: resultHandle,
      publicationId: 'complete',
      completeness: 'complete'
    });
    return graph.compile();
  }

  private requestAggregationForCurrentScope(delayMilliseconds = 250): void {
    // The shared temporal hierarchy is first published by the initial interaction frame.
    if (this.analysisScope === 'viewport' && this.firstGpuFramePending) return;
    const window = getTraceAnalysisWindow({
      scope: this.analysisScope,
      traceDuration: this.traceDuration,
      viewport: [this.view.timeMin, this.view.timeMax],
      measured: [this.measuredTimeMinimum, this.measuredTimeMaximum]
    });
    const minimum = clamp(Math.min(window[0], window[1]), 0, this.traceDuration - 0.5);
    const maximum = clamp(Math.max(window[0], window[1]), minimum + 0.5, this.traceDuration);
    const filterSignature = getTraceAggregationFilterSignature({
      scope: this.analysisScope,
      enabledMask: this.enabledMask,
      statusMask: this.statusMask,
      activeFilterMask: this.activeFilterMask,
      minimumDuration: this.minimumDuration
    });
    if (
      minimum === this.aggregationTimeMinimum &&
      maximum === this.aggregationTimeMaximum &&
      filterSignature === this.aggregationFilterSignature &&
      (this.aggregationInFlight || this.durationHistogramCounts.some(count => count > 0))
    ) {
      this.pendingAggregationWindow = null;
      if (this.aggregationUpdateTimer) {
        clearTimeout(this.aggregationUpdateTimer);
        this.aggregationUpdateTimer = null;
      }
      return;
    }
    if (
      this.pendingAggregationWindow?.[0] === minimum &&
      this.pendingAggregationWindow[1] === maximum &&
      this.pendingAggregationFilterSignature === filterSignature
    ) {
      return;
    }
    this.pendingAggregationWindow = [minimum, maximum];
    this.pendingAggregationFilterSignature = filterSignature;
    if (this.aggregationUpdateTimer) clearTimeout(this.aggregationUpdateTimer);
    this.aggregationUpdateTimer = setTimeout(() => {
      this.aggregationUpdateTimer = null;
      this.runPendingAggregation();
    }, delayMilliseconds);
  }

  private runPendingAggregation(): void {
    if (this.aggregationInFlight || !this.pendingAggregationWindow || !this.resources) return;
    const resources = this.resources;
    const useViewportCandidates = this.analysisScope === 'viewport';
    if (useViewportCandidates && !resources.viewportAggregationCompiled) {
      if (this.analysisWindowElement) {
        this.analysisWindowElement.textContent =
          'Compiling the candidate-driven GPU analytics graph on first use…';
      }
      resources.viewportAggregationCompiled = this.createViewportAggregationGraph(resources);
    } else if (!useViewportCandidates && !resources.aggregationCompiled) {
      if (this.analysisWindowElement) {
        this.analysisWindowElement.textContent = 'Compiling the GPU analytics graph on first use…';
      }
      resources.aggregationCompiled = this.createAggregationGraph(resources);
    }
    const aggregationCompiled = useViewportCandidates
      ? resources.viewportAggregationCompiled!
      : resources.aggregationCompiled!;
    const window = this.pendingAggregationWindow;
    const filterSignature = this.pendingAggregationFilterSignature;
    this.pendingAggregationWindow = null;
    this.pendingAggregationFilterSignature = '';
    this.aggregationTimeMinimum = window[0];
    this.aggregationTimeMaximum = window[1];
    this.aggregationFilterSignature = filterSignature;
    const aggregationControls = new ArrayBuffer(6 * UINT32_BYTE_LENGTH);
    const aggregationControlFloats = new Float32Array(aggregationControls);
    const aggregationControlUnsigned = new Uint32Array(aggregationControls);
    aggregationControlFloats[0] = window[0];
    aggregationControlFloats[1] = window[1];
    aggregationControlUnsigned[2] = this.enabledMask;
    aggregationControlUnsigned[3] = this.statusMask;
    aggregationControlUnsigned[4] = this.activeFilterMask;
    aggregationControlFloats[5] = this.minimumDuration;
    resources.aggregationWindow.write(aggregationControls);
    if (useViewportCandidates) {
      const temporalQuery = new ArrayBuffer(7 * UINT32_BYTE_LENGTH);
      const temporalQueryFloats = new Float32Array(temporalQuery);
      const temporalQueryUnsigned = new Uint32Array(temporalQuery);
      temporalQueryFloats[0] = window[0];
      temporalQueryFloats[1] = window[1];
      temporalQueryFloats[2] = this.minimumDuration;
      temporalQueryUnsigned[3] = this.enabledMask;
      temporalQueryUnsigned[4] = 0;
      temporalQueryUnsigned[5] = TRACE_LANE_COUNT;
      temporalQueryUnsigned[6] = getTraceTemporalIndexLevel(
        resources.temporalIndexLevels,
        (window[1] - window[0]) / Math.max(this.viewportWidth, 1)
      );
      resources.aggregationTemporalQuery.write(temporalQuery);
    }
    const generation = ++this.aggregationGeneration;
    this.aggregationInFlight = true;
    this.aggregationProgress = 0;
    this.aggregationStepIndex = 0;
    this.aggregationStepCount = 0;
    this.aggregationOversizedStepCount = 0;
    this.aggregationPublication = 'none';
    this.updateInspector();
    if (this.analysisScope === 'trace' && resources.spanCount >= 1_000_000) {
      this.aggregationExecution = aggregationCompiled.createExecution(
        this.aggregationExecutionBudgetController.budget,
        {
          latencyPriority: this.aggregationExecutionBudgetController.latencyPriority,
          publicationPolicy: 'progressive'
        }
      );
      this.aggregationStepCount = this.aggregationExecution.plan.stepCount;
      this.aggregationOversizedStepCount = this.aggregationExecution.plan.oversizedStepCount;
      this.runAggregationExecutionStep(resources, generation);
      return;
    }
    const encoder = this.device.createCommandEncoder();
    aggregationCompiled.encode(encoder, {parameters: undefined});
    this.device.submit(encoder.finish());
    this.finishAggregation(resources, generation);
  }

  private runAggregationExecutionStep(resources: TraceGraphResources, generation: number): void {
    if (
      this.resources !== resources ||
      generation !== this.aggregationGeneration ||
      !this.aggregationExecution
    ) {
      return;
    }
    if (this.pendingAggregationWindow) {
      this.aggregationExecution = null;
      this.aggregationInFlight = false;
      this.aggregationProgress = 0;
      this.aggregationStepIndex = 0;
      this.aggregationStepCount = 0;
      this.aggregationOversizedStepCount = 0;
      this.aggregationPublication = 'none';
      this.runPendingAggregation();
      return;
    }
    const encoder = this.device.createCommandEncoder();
    const step = this.aggregationExecution.encodeNext(encoder, {parameters: undefined});
    const executionBudget = this.aggregationExecution.budget;
    const stepStartTime = performance.now();
    this.device.submit(encoder.finish());
    this.aggregationProgress = step.progress;
    this.aggregationStepIndex = step.stepIndex + 1;
    this.updateInspector();
    const queue = (
      this.device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
    ).handle?.queue;
    const submittedWork = queue?.onSubmittedWorkDone?.();
    void Promise.resolve(submittedWork)
      .then(async () => {
        if (submittedWork) {
          this.aggregationExecutionBudgetController.observeStep(
            step,
            performance.now() - stepStartTime,
            executionBudget
          );
        }
        if (this.resources !== resources || generation !== this.aggregationGeneration) return;
        const publication = step.publications.at(-1);
        if (publication) {
          this.aggregationPublication = publication.id;
          if (!step.completed) {
            await this.sampleAggregationResults(resources, generation, publication.id);
            if (this.resources !== resources || generation !== this.aggregationGeneration) return;
          }
        }
        if (step.completed) {
          this.aggregationExecution = null;
          this.aggregationFrameHandle = null;
          this.finishAggregation(resources, generation);
          return;
        }
        this.aggregationFrameHandle = requestAnimationFrame(() => {
          this.aggregationFrameHandle = null;
          this.runAggregationExecutionStep(resources, generation);
        });
      })
      .catch(error => {
        if (this.resources !== resources || generation !== this.aggregationGeneration) return;
        this.aggregationExecution = null;
        this.aggregationInFlight = false;
        this.aggregationProgress = 0;
        this.updateInspector();
        if (this.analysisWindowElement) {
          this.analysisWindowElement.textContent = `GPU analytics queue failed: ${error instanceof Error ? error.message : String(error)}`;
        }
      });
  }

  private finishAggregation(resources: TraceGraphResources, generation: number): void {
    void this.sampleAggregationResults(resources, generation).finally(() => {
      if (generation !== this.aggregationGeneration) return;
      this.aggregationInFlight = false;
      this.aggregationProgress = 1;
      this.aggregationStepIndex = this.aggregationStepCount;
      this.updateInspector();
      if (this.pendingAggregationWindow) this.runPendingAggregation();
    });
  }

  private async sampleAggregationResults(
    resources: TraceGraphResources,
    generation: number,
    publication = 'complete'
  ): Promise<void> {
    try {
      const bytes = await resources.aggregationResults.readAsync();
      if (this.resources !== resources || generation !== this.aggregationGeneration) return;
      this.groupAggregationCounts = Array.from(
        TRACE_ANALYTICS_OUTPUT.decodeUint32(bytes, 'group-counts')
      );
      this.groupAggregationDurationSums = Array.from(
        TRACE_ANALYTICS_OUTPUT.decodeFloat32(bytes, 'group-duration-sums')
      );
      this.groupAggregationDurationMeans = Array.from(
        TRACE_ANALYTICS_OUTPUT.decodeFloat32(bytes, 'group-duration-means')
      );
      this.operationAggregationCounts = Array.from(
        TRACE_ANALYTICS_OUTPUT.decodeUint32(bytes, 'operation-counts')
      );
      this.statusAggregationCounts = Array.from(
        TRACE_ANALYTICS_OUTPUT.decodeUint32(bytes, 'status-counts')
      );
      this.processAggregationCounts = Array.from(
        TRACE_ANALYTICS_OUTPUT.decodeUint32(bytes, 'process-counts')
      );
      this.threadAggregationCounts = Array.from(
        TRACE_ANALYTICS_OUTPUT.decodeUint32(bytes, 'thread-counts')
      );
      if (publication === 'histogram' || publication === 'complete') {
        this.durationHistogramCounts = Array.from(
          TRACE_ANALYTICS_OUTPUT.decodeUint32(bytes, 'duration-histogram')
        );
      }
      if (publication === 'complete') {
        this.timeBucketCounts = Array.from(
          TRACE_ANALYTICS_OUTPUT.decodeUint32(bytes, 'time-bucket-counts')
        );
        this.timeBucketDurations = Array.from(
          TRACE_ANALYTICS_OUTPUT.decodeFloat32(bytes, 'time-bucket-durations')
        );
        this.timeBucketConcurrency = Array.from(
          TRACE_ANALYTICS_OUTPUT.decodeFloat32(bytes, 'time-bucket-concurrency')
        );
        this.timeBucketUtilization = Array.from(
          TRACE_ANALYTICS_OUTPUT.decodeFloat32(bytes, 'time-bucket-utilization')
        );
        this.timeBucketIdleLaneTime = Array.from(
          TRACE_ANALYTICS_OUTPUT.decodeFloat32(bytes, 'time-bucket-idle-lane-time')
        );
      }
      this.updateInspector();
    } catch {
      // Dataset replacement or device loss can invalidate an intentionally asynchronous sample.
    }
  }

  private createStorageBuffer(id: string, byteLength: number, additionalUsage = 0): Buffer {
    return this.device.createBuffer({
      id,
      byteLength: Math.max(byteLength, UINT32_BYTE_LENGTH),
      usage: Buffer.STORAGE | additionalUsage
    });
  }

  private updateAllocationStats(resources: TraceGraphResources): void {
    this.allocationStats = getTraceAllocationStats([
      this.viewUniformBuffer,
      this.labelRenderer.dictionaryMetrics,
      this.labelRenderer.dictionaryGlyphRanges,
      this.labelRenderer.dictionaryGlyphRecords,
      this.labelRenderer.glyphFrames,
      this.labelRenderer.styleUniforms,
      ...getTraceResourceBuffers(resources)
    ]);
  }

  /** Compiles the complete immutable hierarchy, focus, visibility, density, and edge graph. */
  /** Builds compact per-chunk `(lane, start)` row orders once, without copying source columns. */
  private createRepresentativeIndexGraph(
    resources: TraceGraphResources
  ): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {
      id: 'gpu-trace-representative-index-graph',
      autotuner: this.graphAutotuner
    });
    const spanByteStride = TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
    for (const chunk of resources.spanChunks) {
      const spans = importTraceBuffer(
        graph,
        `representative-index-spans-${chunk.chunkIndex}`,
        chunk.buffer
      );
      const rowOrder = importTraceBuffer(
        graph,
        `representative-row-order-${chunk.chunkIndex}`,
        chunk.representativeRowOrder
      );
      const laneOffsets = importTraceBuffer(
        graph,
        `representative-lane-offsets-${chunk.chunkIndex}`,
        chunk.representativeLaneOffsets
      );
      const validationErrors = importTraceBuffer(
        graph,
        `representative-index-errors-${chunk.chunkIndex}`,
        chunk.representativeValidationErrors
      );
      const sourceColumn = <T extends 'float32' | 'uint32'>(format: T, wordOffset: number) =>
        graph.createDataView(spans, {
          format,
          length: chunk.spanCount,
          byteOffset: wordOffset * UINT32_BYTE_LENGTH,
          byteStride: spanByteStride
        });
      new GPUTraceLaneIndexBuilder({
        id: `trace-lane-index-${chunk.chunkIndex}`,
        source: {
          startTimes: sourceColumn('float32', 0),
          durations: sourceColumn('float32', 1),
          laneIds: sourceColumn('uint32', 2)
        },
        laneCount: TRACE_LANE_COUNT,
        output: {
          spanIds: graph.createDataView(rowOrder, {
            format: 'uint32',
            length: chunk.spanCount
          }),
          laneOffsets: graph.createDataView(laneOffsets, {
            format: 'uint32',
            length: TRACE_LANE_COUNT + 1
          }),
          validationErrors: graph.createDataView(validationErrors, {
            format: 'uint32',
            length: 1
          })
        }
      }).addToGraph(graph);
    }
    return graph.compile();
  }

  private createGraph(
    resources: TraceGraphResources,
    dataset: TraceDatasetData
  ): CompiledGPUCommandGraph<TraceViewParameters> {
    const graph = new GPUCommandGraph<TraceViewParameters>(this.device, {
      id: TRACE_GRAPH_ID,
      autotuner: this.graphAutotuner
    });
    const handles = {
      uniforms: importTraceBuffer(graph, 'view-uniforms', this.viewUniformBuffer),
      spanChunks: resources.spanChunks.map(chunk => ({
        ...chunk,
        spans: importTraceBuffer(graph, `spans-${chunk.chunkIndex}`, chunk.buffer),
        visibility: importTraceBuffer(
          graph,
          `span-visibility-${chunk.chunkIndex}`,
          chunk.visibility
        ),
        visibleIds: importTraceBuffer(
          graph,
          `visible-span-ids-${chunk.chunkIndex}`,
          chunk.visibleIds
        ),
        representativeSelection: importTraceBuffer(
          graph,
          `representative-selection-${chunk.chunkIndex}`,
          chunk.representativeSelection
        ),
        representativeRowOrder: importTraceBuffer(
          graph,
          `representative-row-order-${chunk.chunkIndex}`,
          chunk.representativeRowOrder
        ),
        representativeLaneOffsets: importTraceBuffer(
          graph,
          `representative-lane-offsets-${chunk.chunkIndex}`,
          chunk.representativeLaneOffsets
        ),
        representativeIds: importTraceBuffer(
          graph,
          `representative-ids-${chunk.chunkIndex}`,
          chunk.representativeIds
        ),
        representativeValidationErrors: importTraceBuffer(
          graph,
          `representative-errors-${chunk.chunkIndex}`,
          chunk.representativeValidationErrors
        ),
        uniforms: importTraceBuffer(
          graph,
          `span-chunk-uniforms-${chunk.chunkIndex}`,
          chunk.uniforms
        )
      })),
      spanBatchIndex: importTraceBuffer(graph, 'span-batch-index', resources.spanBatchIndex),
      temporalIndex: importTraceBuffer(graph, 'temporal-index', resources.temporalIndex),
      temporalIndexDirtyPartitions: importTraceBuffer(
        graph,
        'temporal-index-dirty-partitions',
        resources.temporalIndexDirtyPartitions
      ),
      temporalIndexValidationErrors: importTraceBuffer(
        graph,
        'temporal-index-validation-errors',
        resources.temporalIndexValidationErrors
      ),
      temporalQuery: importTraceBuffer(graph, 'temporal-query', resources.temporalQuery),
      representativeQuery: importTraceBuffer(
        graph,
        'representative-query',
        resources.representativeQuery
      ),
      representativeBestDurations: importTraceBuffer(
        graph,
        'representative-best-durations',
        resources.representativeBestDurations
      ),
      representativeBestIds: importTraceBuffer(
        graph,
        'representative-best-ids',
        resources.representativeBestIds
      ),
      candidateBatchIds: importTraceBuffer(
        graph,
        'candidate-batch-ids',
        resources.candidateBatchIds
      ),
      candidateChunkOffsets: importTraceBuffer(
        graph,
        'candidate-chunk-offsets',
        resources.candidateChunkOffsets
      ),
      candidateDispatchCommands: importTraceBuffer(
        graph,
        'candidate-dispatch-commands',
        resources.candidateDispatchCommands.buffer
      ),
      densityCandidateDispatchCommands: importTraceBuffer(
        graph,
        'density-candidate-dispatch-commands',
        resources.densityCandidateDispatchCommands.buffer
      ),
      pickCandidateDispatchCommands: importTraceBuffer(
        graph,
        'pick-candidate-dispatch-commands',
        resources.pickCandidateDispatchCommands.buffer
      ),
      dependencyChunks: resources.dependencyChunks.map(chunk => ({
        ...chunk,
        dependencies: importTraceBuffer(graph, `dependencies-${chunk.chunkIndex}`, chunk.buffer),
        uniforms: importTraceBuffer(
          graph,
          `dependency-chunk-uniforms-${chunk.chunkIndex}`,
          chunk.uniforms
        ),
        batchIndex: importTraceBuffer(
          graph,
          `dependency-batch-index-${chunk.chunkIndex}`,
          chunk.batchIndex
        ),
        candidateBatchIds: importTraceBuffer(
          graph,
          `candidate-dependency-batch-ids-${chunk.chunkIndex}`,
          chunk.candidateBatchIds
        ),
        results: importTraceBuffer(graph, `dependency-results-${chunk.chunkIndex}`, chunk.results),
        endpointPositions: importTraceBuffer(
          graph,
          `dependency-endpoint-positions-${chunk.chunkIndex}`,
          chunk.endpointPositions
        ),
        visibleIds: importTraceBuffer(
          graph,
          `visible-dependency-ids-${chunk.chunkIndex}`,
          chunk.visibleIds
        ),
        candidateDispatchCommands: importTraceBuffer(
          graph,
          `candidate-dependency-dispatch-commands-${chunk.chunkIndex}`,
          chunk.candidateDispatchCommands.buffer
        )
      })),
      candidateDependencyBatchCounts: importTraceBuffer(
        graph,
        'candidate-dependency-batch-counts',
        resources.candidateDependencyBatchCounts
      ),
      parentSpans: importTraceBuffer(graph, 'parent-spans', resources.parentSpans),
      outgoingAdjacencyChunks: resources.outgoingAdjacencyChunks.map(chunk => ({
        ...chunk,
        topology: importTraceBuffer(graph, `outgoing-topology-${chunk.chunkIndex}`, chunk.topology),
        neighbors: importTraceBuffer(
          graph,
          `outgoing-neighbors-${chunk.chunkIndex}`,
          chunk.neighbors
        )
      })),
      incomingAdjacencyChunks: resources.incomingAdjacencyChunks.map(chunk => ({
        ...chunk,
        topology: importTraceBuffer(graph, `incoming-topology-${chunk.chunkIndex}`, chunk.topology),
        neighbors: importTraceBuffer(
          graph,
          `incoming-neighbors-${chunk.chunkIndex}`,
          chunk.neighbors
        )
      })),
      processStates: importTraceBuffer(graph, 'process-states', resources.processStates),
      threadStates: importTraceBuffer(graph, 'thread-states', resources.threadStates),
      threadHeights: importTraceBuffer(graph, 'thread-heights', resources.threadHeights),
      threadOffsets: importTraceBuffer(graph, 'thread-offsets', resources.threadOffsets),
      selectedSeeds: importTraceBuffer(graph, 'selected-seeds', resources.selectedSeeds),
      selectedSeedCount: importTraceBuffer(
        graph,
        'selected-seed-count',
        resources.selectedSeedCount
      ),
      focusTraversalState: importTraceBuffer(
        graph,
        'focus-traversal-state',
        resources.focusTraversalState
      ),
      focusOverflowCount: importTraceBuffer(
        graph,
        'focus-overflow-count',
        resources.focusOverflowCount
      ),
      reachedSpans: importTraceBuffer(graph, 'reached-spans', resources.reachedSpans),
      dependencySpanVisibility: importTraceBuffer(
        graph,
        'dependency-span-visibility',
        resources.dependencySpanVisibility
      ),
      densityBins: importTraceBuffer(graph, 'density-bins', resources.densityBins),
      labelGlyphs: importTraceBuffer(graph, 'label-glyphs', resources.labelGlyphs),
      labelDictionaryMetrics: importTraceBuffer(
        graph,
        'label-dictionary-metrics',
        this.labelRenderer.dictionaryMetrics
      ),
      labelDictionaryGlyphRanges: importTraceBuffer(
        graph,
        'label-dictionary-glyph-ranges',
        this.labelRenderer.dictionaryGlyphRanges
      ),
      labelDictionaryGlyphRecords: importTraceBuffer(
        graph,
        'label-dictionary-glyph-records',
        this.labelRenderer.dictionaryGlyphRecords
      ),
      labelGlyphFrames: importTraceBuffer(
        graph,
        'label-glyph-frames',
        this.labelRenderer.glyphFrames
      ),
      labelStyleUniforms: importTraceBuffer(
        graph,
        'label-style-uniforms',
        this.labelRenderer.styleUniforms
      ),
      pickResult: importTraceBuffer(graph, 'pick-result', resources.pickResult),
      drawCommands: importTraceBuffer(graph, 'draw-commands', resources.drawCommands.buffer)
    };
    const spanVisibility = makeTraceGraphVector(
      'trace-span-visibility',
      handles.spanChunks.map(chunk =>
        graph.createDataView(chunk.visibility, {
          format: 'uint32',
          length: Math.ceil(chunk.spanCount / 32)
        })
      )
    );
    const visibleSpanIds = makeTraceGraphVector(
      'trace-visible-span-ids',
      handles.spanChunks.map(chunk =>
        graph.createDataView(chunk.visibleIds, {format: 'uint32', length: chunk.spanCount})
      )
    );
    const processChunkLengths = [1, TRACE_PROCESS_COUNT - 1];
    const threadChunkLengths = [
      TRACE_THREADS_PER_PROCESS + 1,
      TRACE_THREAD_COUNT - TRACE_THREADS_PER_PROCESS - 1
    ];
    const spanBatchByteStride = TRACE_SPAN_BATCH_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
    const spanBatchColumn = <T extends 'float32' | 'uint32'>(format: T, wordOffset: number) =>
      graph.createDataView(handles.spanBatchIndex, {
        format,
        length: resources.spanBatchCount,
        byteOffset: wordOffset * UINT32_BYTE_LENGTH,
        byteStride: spanBatchByteStride
      });
    const temporalIndexByteStride = TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
    const temporalIndexNodeCount = resources.temporalIndexLevels.reduce(
      (sum, level) => sum + level.nodeCount,
      0
    );
    new GPUTraceTemporalIndexBuilder({
      id: 'trace-temporal-index-builder',
      batches: graph.createDataView(handles.spanBatchIndex, {
        format: 'uint32',
        length: resources.spanBatchCount * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH
      }),
      batchCount: resources.spanBatchCount,
      batchLayout: {
        recordWordLength: TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
        minimumTimeWordOffset: 2,
        maximumTimeWordOffset: 3,
        maximumDurationWordOffset: 8,
        groupWordOffset: 6,
        minimumLaneWordOffset: 4,
        maximumLaneWordOffset: 5
      },
      hierarchy: graph.createDataView(handles.temporalIndex, {
        format: 'uint32',
        length: temporalIndexNodeCount * TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH
      }),
      hierarchyLayout: {
        recordWordLength: TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH,
        minimumTimeWordOffset: 0,
        maximumTimeWordOffset: 1,
        maximumDurationWordOffset: 2,
        groupWordOffset: 3,
        firstBatchWordOffset: 4,
        batchCountWordOffset: 5,
        minimumLaneWordOffset: 6,
        maximumLaneWordOffset: 7
      },
      levels: resources.temporalIndexLevels,
      partitionBatchCount: resources.temporalIndexPartitionBatchCount,
      dirtyPartitions: graph.createDataView(handles.temporalIndexDirtyPartitions, {
        format: 'uint32',
        length: resources.temporalIndexPartitionCount
      }),
      validationErrors: graph.createDataView(handles.temporalIndexValidationErrors, {
        format: 'uint32',
        length: 1
      })
    }).addToGraph(graph);
    const temporalIndexColumn = <T extends 'float32' | 'uint32'>(format: T, wordOffset: number) =>
      graph.createDataView(handles.temporalIndex, {
        format,
        length: temporalIndexNodeCount,
        byteOffset: wordOffset * UINT32_BYTE_LENGTH,
        byteStride: temporalIndexByteStride
      });
    new GPUTraceTemporalIndex({
      id: 'trace-temporal-index',
      batches: {
        minimumTimes: spanBatchColumn('float32', 2),
        maximumTimes: spanBatchColumn('float32', 3),
        groupIds: spanBatchColumn('uint32', 6),
        minimumLanes: spanBatchColumn('uint32', 4),
        maximumLanes: spanBatchColumn('uint32', 5)
      },
      hierarchy: {
        minimumTimes: temporalIndexColumn('float32', 0),
        maximumTimes: temporalIndexColumn('float32', 1),
        groupIds: temporalIndexColumn('uint32', 3),
        firstBatchIndices: temporalIndexColumn('uint32', 4),
        batchCounts: temporalIndexColumn('uint32', 5),
        minimumLanes: temporalIndexColumn('uint32', 6),
        maximumLanes: temporalIndexColumn('uint32', 7),
        levels: resources.temporalIndexLevels
      },
      query: {
        timeWindow: graph.createDataView(handles.temporalQuery, {
          format: 'float32',
          length: 3
        }),
        enabledGroups: graph.createDataView(handles.temporalQuery, {
          format: 'uint32',
          length: 1,
          byteOffset: 3 * UINT32_BYTE_LENGTH
        }),
        laneWindow: graph.createDataView(handles.temporalQuery, {
          format: 'uint32',
          length: 2,
          byteOffset: 4 * UINT32_BYTE_LENGTH
        }),
        level: graph.createDataView(handles.temporalQuery, {
          format: 'uint32',
          length: 1,
          byteOffset: 6 * UINT32_BYTE_LENGTH
        })
      },
      output: {
        candidates: graph.createDataView(handles.candidateBatchIds, {
          format: 'uint32',
          length: resources.spanBatchCount
        }),
        candidateCount: graph.createDataView(handles.candidateDispatchCommands, {
          format: 'uint32',
          length: 1,
          byteOffset: UINT32_BYTE_LENGTH
        })
      }
    }).addToGraph(graph);
    addTraceComputePass(graph, {
      id: 'trace-candidate-pass-dispatch',
      source: getCandidatePassDispatchShader(resources.spanChunks),
      bindings: [
        storageRead('candidateDispatchCommand', handles.candidateDispatchCommands),
        uniformBinding('viewUniforms', handles.uniforms),
        storageWrite('densityDispatchCommand', handles.densityCandidateDispatchCommands),
        storageWrite('pickDispatchCommand', handles.pickCandidateDispatchCommands),
        storageRead('processStates', handles.processStates),
        storageRead('candidateBatchIds', handles.candidateBatchIds),
        storageWrite('candidateChunkOffsets', handles.candidateChunkOffsets),
        storageRead('threadStates', handles.threadStates)
      ],
      length: resources.spanChunks.length,
      workgroupSize: 1
    });

    new GPUHierarchyLayout({
      id: 'trace-process-thread-layout',
      parentStates: makeUint32GraphVector(
        graph,
        'process-state-partitions',
        'process states',
        handles.processStates,
        processChunkLengths
      ),
      childStates: makeUint32GraphVector(
        graph,
        'thread-state-partitions',
        'thread states',
        handles.threadStates,
        threadChunkLengths
      ),
      heights: makeUint32GraphVector(
        graph,
        'thread-height-partitions',
        'thread heights',
        handles.threadHeights,
        threadChunkLengths
      ),
      offsets: makeUint32GraphVector(
        graph,
        'thread-offset-partitions',
        'thread offsets',
        handles.threadOffsets,
        threadChunkLengths
      ),
      childrenPerParent: TRACE_THREADS_PER_PROCESS,
      expandedChildHeight: TRACE_LANES_PER_THREAD + TRACE_THREAD_GAP_LANE_COUNT,
      collapsedChildHeight: 1 + TRACE_THREAD_GAP_LANE_COUNT,
      collapsedParentHeight: 1 + TRACE_THREAD_GAP_LANE_COUNT
    }).addToGraph(graph);

    const focusFrontiers = [0, 1].map(index =>
      graph.createTransientBuffer({
        id: `trace-focus-frontier-${index}`,
        byteLength: resources.focusFrontierCapacity * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      })
    );
    const focusFrontierCounts = [0, 1].map(index =>
      graph.createTransientBuffer({
        id: `trace-focus-frontier-count-${index}`,
        byteLength: UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      })
    );
    const focusDispatchCommands = [0, 1].map(index =>
      graph.createTransientBuffer({
        id: `trace-focus-dispatch-${index}`,
        byteLength: 3 * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE | Buffer.INDIRECT
      })
    );
    const focusMaskWordCount = Math.max(Math.ceil(resources.spanCount / 32), 1);
    addTraceComputePass(graph, {
      id: 'trace-focus-reachability-clear',
      source: getFocusReachabilityClearShader(focusMaskWordCount),
      bindings: [storageWrite('reachedSpans', handles.reachedSpans)],
      length: focusMaskWordCount,
      workgroupSize: TRACE_WORKGROUP_SIZE
    });
    addTraceComputePass(graph, {
      id: 'trace-focus-overflow-clear',
      source: getFocusOverflowClearShader(),
      bindings: [storageWrite('overflowCount', handles.focusOverflowCount)],
      length: 1,
      workgroupSize: 1
    });
    addTraceComputePass(graph, {
      id: 'trace-focus-frontier-seed',
      source: getFocusFrontierSeedShader(resources.spanCount),
      bindings: [
        storageRead('selectedSeeds', handles.selectedSeeds),
        storageRead('activeSeedCount', handles.selectedSeedCount),
        storageRead('focusTraversalState', handles.focusTraversalState),
        storageWrite('reachedSpans', handles.reachedSpans),
        storageWrite('frontier', focusFrontiers[0]),
        storageWrite('frontierCount', focusFrontierCounts[0]),
        storageWrite('dispatchCommand', focusDispatchCommands[0])
      ],
      length: 1,
      workgroupSize: 1
    });
    let currentFrontierIndex = 0;
    for (let depth = 0; depth < MAXIMUM_FOCUS_DEPTH; depth++) {
      const nextFrontierIndex = 1 - currentFrontierIndex;
      addTraceComputePass(graph, {
        id: `trace-focus-frontier-${depth}-clear`,
        source: getFocusFrontierClearShader(),
        bindings: [
          storageWrite('frontierCount', focusFrontierCounts[nextFrontierIndex]),
          storageWrite('dispatchCommand', focusDispatchCommands[nextFrontierIndex])
        ],
        length: 1,
        workgroupSize: 1
      });
      for (const direction of [
        {
          name: 'outgoing',
          chunks: handles.outgoingAdjacencyChunks
        },
        {
          name: 'incoming',
          chunks: handles.incomingAdjacencyChunks
        }
      ]) {
        for (const chunk of direction.chunks) {
          addTraceIndirectComputePass(graph, {
            id: `trace-focus-frontier-${depth}-${direction.name}-${chunk.chunkIndex}`,
            source: getFocusFrontierExpansionShader({
              spanCount: resources.spanCount,
              frontierCapacity: resources.focusFrontierCapacity,
              nodeWordBase: 0,
              sourceNodeCount: chunk.nodeCount,
              offsetWordBase: chunk.nodeCount,
              neighborWordBase: 0,
              neighborCount: chunk.neighborCount,
              depth
            }),
            bindings: [
              storageRead('topology', chunk.topology),
              storageRead('neighbors', chunk.neighbors),
              storageRead('frontier', focusFrontiers[currentFrontierIndex]),
              storageRead('frontierCount', focusFrontierCounts[currentFrontierIndex]),
              storageWrite('nextFrontier', focusFrontiers[nextFrontierIndex]),
              storageWrite('nextFrontierCount', focusFrontierCounts[nextFrontierIndex]),
              storageWrite('reachedSpans', handles.reachedSpans),
              storageRead('focusTraversalState', handles.focusTraversalState),
              storageWrite('overflowCount', handles.focusOverflowCount)
            ],
            dispatchBuffer: focusDispatchCommands[currentFrontierIndex],
            maximumInvocationCount:
              Math.ceil(resources.focusFrontierCapacity / TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE) *
              TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE
          });
        }
      }
      addTraceComputePass(graph, {
        id: `trace-focus-frontier-${depth}-publish`,
        source: getFocusFrontierDispatchShader(resources.focusFrontierCapacity),
        bindings: [
          storageRead('frontierCount', focusFrontierCounts[nextFrontierIndex]),
          storageWrite('dispatchCommand', focusDispatchCommands[nextFrontierIndex])
        ],
        length: 1,
        workgroupSize: 1
      });
      currentFrontierIndex = nextFrontierIndex;
    }

    addTraceComputePass(graph, {
      id: 'trace-clear-pick',
      source: getPickClearShader(),
      bindings: [storageWrite('pickResult', handles.pickResult)],
      length: 1,
      workgroupSize: 1
    });
    for (const chunk of handles.spanChunks) {
      addTraceComputePass(graph, {
        id: `trace-clear-span-visibility-${chunk.chunkIndex}`,
        source: getSpanVisibilityClearShader(chunk.spanCount),
        bindings: [storageWrite('visibilityFlags', chunk.visibility)],
        length: Math.max(Math.ceil(chunk.spanCount / 32), 1)
      });
      addTraceComputePass(graph, {
        id: `trace-clear-representative-selection-${chunk.chunkIndex}`,
        source: getSpanVisibilityClearShader(chunk.spanCount),
        bindings: [storageWrite('visibilityFlags', chunk.representativeSelection)],
        length: Math.max(Math.ceil(chunk.spanCount / 32), 1)
      });
      addTraceIndirectComputePass(graph, {
        id: `trace-candidate-span-visibility-${chunk.chunkIndex}`,
        source: getCandidateVisibilityShader(chunk),
        bindings: [
          storageRead('spans', chunk.spans),
          storageRead('spanBatches', handles.spanBatchIndex),
          storageRead('candidateBatchIds', handles.candidateBatchIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageRead('processStates', handles.processStates),
          storageRead('threadOffsets', handles.threadOffsets),
          storageRead('threadStates', handles.threadStates),
          storageRead('reachedSpans', handles.reachedSpans),
          storageWrite('visibilityFlags', chunk.visibility)
        ],
        dispatchBuffer: handles.candidateDispatchCommands,
        maximumInvocationCount: resources.spanBatchCount * TRACE_SPAN_BATCH_CAPACITY
      });
      addTraceIndirectComputePass(graph, {
        id: `trace-candidate-representative-selection-${chunk.chunkIndex}`,
        source: getCandidateRepresentativeSelectionShader(chunk),
        bindings: [
          storageRead('spans', chunk.spans),
          storageRead('spanBatches', handles.spanBatchIndex),
          storageRead('candidateBatchIds', handles.candidateBatchIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageRead('processStates', handles.processStates),
          storageRead('threadOffsets', handles.threadOffsets),
          storageRead('threadStates', handles.threadStates),
          storageRead('reachedSpans', handles.reachedSpans),
          storageWrite('selectionFlags', chunk.representativeSelection)
        ],
        dispatchBuffer: handles.candidateDispatchCommands,
        maximumInvocationCount: resources.spanBatchCount * TRACE_SPAN_BATCH_CAPACITY
      });
    }
    const representativeQuery = {
      domain: graph.createDataView(handles.representativeQuery, {
        format: 'float32',
        length: 2
      }),
      pixelCount: graph.createDataView(handles.representativeQuery, {
        format: 'uint32',
        length: 1,
        byteOffset: 2 * UINT32_BYTE_LENGTH
      })
    };
    const spanByteStride = TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
    for (const chunk of handles.spanChunks) {
      const sourceColumn = <T extends 'float32' | 'uint32'>(format: T, wordOffset: number) =>
        graph.createDataView(chunk.spans, {
          format,
          length: chunk.spanCount,
          byteOffset: wordOffset * UINT32_BYTE_LENGTH,
          byteStride: spanByteStride
        });
      new GPUTracePixelMipmap({
        id: `trace-pixel-representatives-${chunk.chunkIndex}`,
        index: {
          startTimes: sourceColumn('float32', 0),
          durations: sourceColumn('float32', 1),
          spanIds: sourceColumn('uint32', 6),
          rowOrder: graph.createDataView(chunk.representativeRowOrder, {
            format: 'uint32',
            length: chunk.spanCount
          }),
          laneOffsets: graph.createDataView(chunk.representativeLaneOffsets, {
            format: 'uint32',
            length: TRACE_LANE_COUNT + 1
          })
        },
        query: representativeQuery,
        maximumPixelCount: TRACE_REPRESENTATIVE_MAXIMUM_PIXEL_COUNT,
        selectionMask: graph.createDataView(chunk.representativeSelection, {
          format: 'uint32',
          length: Math.ceil(chunk.spanCount / 32)
        }),
        output: graph.createDataView(chunk.representativeIds, {
          format: 'uint32',
          length: TRACE_REPRESENTATIVE_COUNT
        }),
        validationErrors: graph.createDataView(chunk.representativeValidationErrors, {
          format: 'uint32',
          length: 1
        })
      }).addToGraph(graph);
    }
    addTraceComputePass(graph, {
      id: 'trace-clear-representative-best',
      source: getRepresentativeBestClearShader(TRACE_REPRESENTATIVE_COUNT),
      bindings: [
        storageWrite('bestDurations', handles.representativeBestDurations),
        storageWrite('bestIds', handles.representativeBestIds)
      ],
      length: TRACE_REPRESENTATIVE_COUNT
    });
    for (const chunk of handles.spanChunks) {
      addTraceComputePass(graph, {
        id: `trace-nominate-representative-duration-${chunk.chunkIndex}`,
        source: getRepresentativeDurationNominationShader(chunk, TRACE_REPRESENTATIVE_COUNT),
        bindings: [
          storageRead('spans', chunk.spans),
          storageRead('representatives', chunk.representativeIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('bestDurations', handles.representativeBestDurations)
        ],
        length: TRACE_REPRESENTATIVE_COUNT
      });
    }
    for (const chunk of handles.spanChunks) {
      addTraceComputePass(graph, {
        id: `trace-nominate-representative-id-${chunk.chunkIndex}`,
        source: getRepresentativeIdNominationShader(chunk, TRACE_REPRESENTATIVE_COUNT),
        bindings: [
          storageRead('spans', chunk.spans),
          storageRead('representatives', chunk.representativeIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageRead('bestDurations', handles.representativeBestDurations),
          storageWrite('bestIds', handles.representativeBestIds)
        ],
        length: TRACE_REPRESENTATIVE_COUNT
      });
    }
    for (const chunk of handles.spanChunks) {
      addTraceComputePass(graph, {
        id: `trace-publish-representative-visibility-${chunk.chunkIndex}`,
        source: getRepresentativeVisibilityPublishShader(chunk, TRACE_REPRESENTATIVE_COUNT),
        bindings: [
          storageRead('representatives', chunk.representativeIds),
          storageRead('bestIds', handles.representativeBestIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('visibilityFlags', chunk.visibility)
        ],
        length: TRACE_REPRESENTATIVE_COUNT
      });
    }
    if (resources.dependencyCount > 0) {
      for (const chunk of handles.spanChunks) {
        addTraceIndirectComputePass(graph, {
          id: `trace-publish-dependency-span-visibility-${chunk.chunkIndex}`,
          source: getCandidateDependencySpanVisibilityShader(chunk),
          bindings: [
            storageRead('visibilityFlags', chunk.visibility),
            storageRead('spanBatches', handles.spanBatchIndex),
            storageRead('candidateBatchIds', handles.candidateBatchIds),
            uniformBinding('viewUniforms', handles.uniforms),
            storageWrite('dependencySpanVisibility', handles.dependencySpanVisibility)
          ],
          dispatchBuffer: handles.candidateDispatchCommands,
          maximumInvocationCount: resources.spanBatchCount * TRACE_SPAN_BATCH_CAPACITY
        });
      }
    }
    addTraceComputePass(graph, {
      id: 'trace-clear-span-labels',
      source: getTraceLabelClearShader(resources.labelDrawCommandIndex),
      bindings: [storageWrite('drawCommands', handles.drawCommands)],
      length: 1,
      workgroupSize: 1
    });
    for (const chunk of handles.spanChunks) {
      addTraceIndirectComputePass(graph, {
        id: `trace-candidate-span-labels-${chunk.chunkIndex}`,
        source: getCandidateLabelShader(chunk, resources.labelDrawCommandIndex),
        bindings: [
          storageRead('spans', chunk.spans),
          storageRead('spanBatches', handles.spanBatchIndex),
          storageRead('candidateBatchIds', handles.candidateBatchIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageRead('visibilityFlags', chunk.visibility),
          storageRead('dictionaryMetrics', handles.labelDictionaryMetrics),
          storageWrite('labelGlyphs', handles.labelGlyphs),
          storageWrite('drawCommands', handles.drawCommands),
          uniformBinding('textDictionaryStyle', handles.labelStyleUniforms)
        ],
        dispatchBuffer: handles.candidateDispatchCommands,
        maximumInvocationCount: resources.spanBatchCount * TRACE_SPAN_BATCH_CAPACITY
      });
    }
    addTraceComputePass(graph, {
      id: 'trace-clear-density',
      source: getDensityClearShader(),
      bindings: [storageWrite('densityBins', handles.densityBins)],
      length: TRACE_DISPLAY_LANE_CAPACITY * TRACE_DENSITY_BIN_COUNT * TRACE_GROUPS.length,
      workgroupSize: TRACE_WORKGROUP_SIZE
    });
    for (const chunk of handles.spanChunks) {
      addTraceIndirectComputePass(graph, {
        id: `trace-candidate-density-${chunk.chunkIndex}`,
        source: getCandidateDensityShader(chunk),
        bindings: [
          storageRead('spans', chunk.spans),
          storageRead('spanBatches', handles.spanBatchIndex),
          storageRead('candidateBatchIds', handles.candidateBatchIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageRead('processStates', handles.processStates),
          storageRead('threadOffsets', handles.threadOffsets),
          storageRead('threadStates', handles.threadStates),
          storageRead('reachedSpans', handles.reachedSpans),
          storageWrite('densityBins', handles.densityBins),
          storageRead('candidateChunkOffsets', handles.candidateChunkOffsets)
        ],
        dispatchBuffer: handles.densityCandidateDispatchCommands,
        dispatchByteOffset: chunk.chunkIndex * 3 * UINT32_BYTE_LENGTH,
        maximumInvocationCount: chunk.batchCount * TRACE_SPAN_BATCH_CAPACITY
      });
      addTraceIndirectComputePass(graph, {
        id: `trace-candidate-pick-${chunk.chunkIndex}`,
        source: getCandidatePickShader(chunk),
        bindings: [
          storageRead('spans', chunk.spans),
          storageRead('spanBatches', handles.spanBatchIndex),
          storageRead('candidateBatchIds', handles.candidateBatchIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageRead('processStates', handles.processStates),
          storageRead('threadOffsets', handles.threadOffsets),
          storageRead('threadStates', handles.threadStates),
          storageWrite('pickResult', handles.pickResult),
          storageRead('candidateChunkOffsets', handles.candidateChunkOffsets)
        ],
        dispatchBuffer: handles.pickCandidateDispatchCommands,
        dispatchByteOffset: chunk.chunkIndex * 3 * UINT32_BYTE_LENGTH,
        maximumInvocationCount: chunk.batchCount * TRACE_SPAN_BATCH_CAPACITY
      });
    }
    for (const chunk of handles.spanChunks) {
      addTraceComputePass(graph, {
        id: `trace-resolve-pick-${chunk.chunkIndex}`,
        source: getPickResolveShader(chunk),
        bindings: [
          storageRead('spans', chunk.spans),
          storageWrite('pickResult', handles.pickResult)
        ],
        length: 1,
        workgroupSize: 1
      });
    }
    const visibleSpanCountBuffer = graph.createTransientBuffer({
      id: 'trace-visible-span-count',
      byteLength: UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    const rangeCompaction = new GPUPartitionedIndexedRangeCompaction({
      id: 'trace-visible-spans',
      flags: spanVisibility,
      flagEncoding: 'bitset',
      ranges: graph.createDataView(handles.spanBatchIndex, {
        format: 'uint32',
        length: resources.spanBatchCount * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH
      }),
      rangeCount: resources.spanBatchCount,
      rangeLayout: {
        wordStride: TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
        firstIndexWordOffset: 0,
        countWordOffset: 1
      },
      partitionRangeEnds: resources.spanChunks.map(
        chunk => chunk.firstBatchIndex + chunk.batchCount
      ),
      activeRangeIds: graph.createDataView(handles.candidateBatchIds, {
        format: 'uint32',
        length: resources.spanBatchCount
      }),
      activeRangeDispatch: handles.candidateDispatchCommands,
      maximumRangeLength: TRACE_SPAN_BATCH_CAPACITY,
      output: visibleSpanIds,
      count: graph.createDataView(visibleSpanCountBuffer, {format: 'uint32', length: 1})
    }).addToGraph(graph);
    addTraceComputePass(graph, {
      id: 'trace-publish-span-draw-commands',
      source: getTraceDrawCommandsShader(resources.spanDraws),
      bindings: [
        storageRead('rangeCounts', rangeCompaction.rangeCounts.buffer),
        storageRead('rangeOffsets', rangeCompaction.rangeOffsets.buffer),
        storageWrite('drawCommands', handles.drawCommands)
      ],
      length: resources.spanDraws.length
    });
    const renderResources: GraphBufferUse[] = [
      ...handles.spanChunks.flatMap(chunk => [
        {buffer: chunk.spans, usage: 'storage-read'} as const,
        {buffer: chunk.uniforms, usage: 'uniform'} as const
      ]),
      ...handles.spanChunks.map(chunk => ({
        buffer: chunk.visibleIds,
        usage: 'storage-read' as const
      })),
      ...handles.dependencyChunks.flatMap(chunk => [
        {buffer: chunk.dependencies, usage: 'storage-read'} as const,
        {buffer: chunk.uniforms, usage: 'uniform'} as const,
        {buffer: chunk.endpointPositions, usage: 'storage-read'} as const,
        {buffer: chunk.visibleIds, usage: 'storage-read'} as const
      ]),
      {buffer: handles.reachedSpans, usage: 'storage-read'},
      {buffer: handles.densityBins, usage: 'storage-read'},
      {buffer: handles.labelGlyphs, usage: 'storage-read'},
      {buffer: handles.threadOffsets, usage: 'storage-read'},
      {buffer: handles.threadStates, usage: 'storage-read'},
      {buffer: handles.labelDictionaryGlyphRanges, usage: 'storage-read'},
      {buffer: handles.labelDictionaryGlyphRecords, usage: 'storage-read'},
      {buffer: handles.labelGlyphFrames, usage: 'storage-read'},
      {buffer: handles.labelStyleUniforms, usage: 'uniform'},
      {buffer: handles.temporalIndex, usage: 'storage-read'},
      {buffer: handles.uniforms, usage: 'uniform'},
      {buffer: handles.drawCommands, usage: 'indirect'}
    ];

    for (const dependencyChunk of handles.dependencyChunks) {
      const endpointRoutingProps = {
        dependencyCount: dependencyChunk.dependencyCount,
        spanChunks: resources.spanChunks
      };
      const visibleDependencyCountWordOffset =
        resources.drawCommands.getInstanceCountByteOffset(dependencyChunk.drawCommandIndex) /
        UINT32_BYTE_LENGTH;
      const dependencyEndpointJobs = graph.createTransientBuffer({
        id: `trace-dependency-endpoint-jobs-${dependencyChunk.chunkIndex}`,
        byteLength: dependencyChunk.dependencyCount * 2 * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      const candidateDependencyBatchFlags = graph.createTransientBuffer({
        id: `trace-candidate-dependency-batch-flags-${dependencyChunk.chunkIndex}`,
        byteLength: dependencyChunk.batchCount * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      const candidateDependencyBatchCount = graph.createTransientBuffer({
        id: `trace-candidate-dependency-batch-count-${dependencyChunk.chunkIndex}`,
        byteLength: UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      addTraceComputePass(graph, {
        id: `trace-dependency-batch-visibility-${dependencyChunk.chunkIndex}`,
        source: getDependencyBatchVisibilityShader(dependencyChunk.batchCount),
        bindings: [
          storageRead('dependencyBatches', dependencyChunk.batchIndex),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('candidateFlags', candidateDependencyBatchFlags)
        ],
        length: dependencyChunk.batchCount
      });
      new GPUVisibilityWorkflow({
        id: `trace-candidate-dependency-batches-${dependencyChunk.chunkIndex}`,
        predicates: [
          {
            kind: ['time-range', 'selection'],
            mask: graph.createDataView(candidateDependencyBatchFlags, {
              format: 'uint32',
              length: dependencyChunk.batchCount
            })
          }
        ],
        output: graph.createDataView(dependencyChunk.candidateBatchIds, {
          format: 'uint32',
          length: dependencyChunk.batchCount
        }),
        count: graph.createDataView(candidateDependencyBatchCount, {
          format: 'uint32',
          length: 1
        })
      }).addToGraph(graph);
      addTraceComputePass(graph, {
        id: `trace-budget-candidate-dependency-batches-${dependencyChunk.chunkIndex}`,
        source: getDependencyDispatchBudgetShader(
          dependencyChunk.frameBatchBudget,
          dependencyChunk.chunkIndex
        ),
        bindings: [
          storageRead('candidateCount', candidateDependencyBatchCount),
          storageWrite('admittedCounts', handles.candidateDependencyBatchCounts),
          storageWrite('dispatchCommand', dependencyChunk.candidateDispatchCommands)
        ],
        length: 1
      });
      addTraceIndirectComputePass(graph, {
        id: `trace-candidate-dependency-visibility-${dependencyChunk.chunkIndex}`,
        source: getCandidateDependencyVisibilityShader(endpointRoutingProps),
        bindings: [
          storageRead('dependencies', dependencyChunk.dependencies),
          storageRead('dependencyBatches', dependencyChunk.batchIndex),
          storageRead('candidateBatchIds', dependencyChunk.candidateBatchIds),
          storageRead('spanVisibility', handles.dependencySpanVisibility),
          storageRead('processStates', handles.processStates),
          storageRead('parentSpans', handles.parentSpans),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('dependencyResults', dependencyChunk.results)
        ],
        dispatchBuffer: dependencyChunk.candidateDispatchCommands,
        maximumInvocationCount: dependencyChunk.frameBatchBudget * TRACE_DEPENDENCY_BATCH_CAPACITY
      });
      const candidateDependencyIds = graph.createDataView(
        graph.createTransientBuffer({
          id: `trace-candidate-dependency-ids-${dependencyChunk.chunkIndex}`,
          byteLength: dependencyChunk.dependencyCount * UINT32_BYTE_LENGTH,
          usage: Buffer.STORAGE
        }),
        {format: 'uint32', length: dependencyChunk.dependencyCount}
      );
      const candidateDependencyCount = graph.createDataView(
        graph.createTransientBuffer({
          id: `trace-candidate-dependency-count-${dependencyChunk.chunkIndex}`,
          byteLength: UINT32_BYTE_LENGTH,
          usage: Buffer.STORAGE
        }),
        {format: 'uint32', length: 1}
      );
      new GPUIndexedRangeCompaction({
        id: `trace-candidate-dependencies-${dependencyChunk.chunkIndex}`,
        flags: graph.createDataView(dependencyChunk.results, {
          format: 'uint32',
          length: dependencyChunk.dependencyCount
        }),
        ranges: graph.createDataView(dependencyChunk.batchIndex, {
          format: 'uint32',
          length: dependencyChunk.batchCount * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH
        }),
        rangeCount: dependencyChunk.batchCount,
        rangeLayout: {wordStride: 6, firstIndexWordOffset: 0, countWordOffset: 1},
        activeRangeIds: graph.createDataView(dependencyChunk.candidateBatchIds, {
          format: 'uint32',
          length: dependencyChunk.batchCount
        }),
        activeRangeDispatch: dependencyChunk.candidateDispatchCommands,
        maximumRangeLength: TRACE_DEPENDENCY_BATCH_CAPACITY,
        output: candidateDependencyIds,
        count: candidateDependencyCount
      }).addToGraph(graph);
      const visibleDependencyIds = graph.createDataView(dependencyChunk.visibleIds, {
        format: 'uint32',
        length: dependencyChunk.visibleCapacity
      });
      const intersectingDependencyIds = graph.createDataView(
        graph.createTransientBuffer({
          id: `trace-intersecting-dependency-ids-${dependencyChunk.chunkIndex}`,
          byteLength: dependencyChunk.dependencyCount * UINT32_BYTE_LENGTH,
          usage: Buffer.STORAGE
        }),
        {format: 'uint32', length: dependencyChunk.dependencyCount}
      );
      const intersectingDependencyCount = graph.createDataView(
        graph.createTransientBuffer({
          id: `trace-intersecting-dependency-count-${dependencyChunk.chunkIndex}`,
          byteLength: UINT32_BYTE_LENGTH,
          usage: Buffer.STORAGE
        }),
        {format: 'uint32', length: 1}
      );
      const endpointScatter = new GPUChunkedIndexedScatter({
        id: `trace-dependency-endpoints-${dependencyChunk.chunkIndex}`,
        sourceIds: candidateDependencyIds,
        sourceCount: candidateDependencyCount,
        routes: graph.createDataView(dependencyChunk.results, {
          format: 'uint32',
          length: dependencyChunk.dependencyCount * 2,
          byteOffset: dependencyChunk.dependencyCount * UINT32_BYTE_LENGTH
        }),
        routeLayout: {wordStride: 2, firstRouteWordOffset: 0, routeCount: 2},
        chunkEnds: resources.spanChunks.map(chunk => chunk.firstSpanIndex + chunk.spanCount),
        output: graph.createDataView(dependencyEndpointJobs, {
          format: 'uint32',
          length: dependencyChunk.dependencyCount * 2
        })
      }).addToGraph(graph);
      for (const spanChunk of handles.spanChunks) {
        addTraceIndirectComputePass(graph, {
          id: `trace-resolve-routed-dependency-endpoints-${dependencyChunk.chunkIndex}-${spanChunk.chunkIndex}`,
          source: getDependencyEndpointResolveShader(endpointRoutingProps, spanChunk.chunkIndex),
          bindings: [
            storageRead('spans', spanChunk.spans),
            storageRead('endpointJobs', dependencyEndpointJobs),
            storageRead('endpointChunkState', endpointScatter.chunkCounts.buffer),
            storageRead('dependencyResults', dependencyChunk.results),
            storageRead('processStates', handles.processStates),
            storageRead('threadStates', handles.threadStates),
            storageRead('threadOffsets', handles.threadOffsets),
            storageWrite('dependencyEndpointPositions', dependencyChunk.endpointPositions)
          ],
          dispatchBuffer: endpointScatter.dispatchCommands.buffer,
          dispatchByteOffset: spanChunk.chunkIndex * 3 * UINT32_BYTE_LENGTH,
          maximumInvocationCount:
            dependencyChunk.frameBatchBudget * TRACE_DEPENDENCY_BATCH_CAPACITY * 2
        });
      }
      const maximumCandidateDependencyCount = Math.min(
        dependencyChunk.dependencyCount,
        dependencyChunk.frameBatchBudget * TRACE_DEPENDENCY_BATCH_CAPACITY
      );
      addTraceComputePass(graph, {
        id: `trace-intersect-dependencies-${dependencyChunk.chunkIndex}`,
        source: getDependencyIntersectionVisibilityShader(maximumCandidateDependencyCount),
        bindings: [
          storageRead('candidateIds', candidateDependencyIds.buffer),
          storageRead('candidateCount', candidateDependencyCount.buffer),
          storageRead('endpointPositions', dependencyChunk.endpointPositions),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('dependencyResults', dependencyChunk.results)
        ],
        length: maximumCandidateDependencyCount
      });
      new GPUIndexedRangeCompaction({
        id: `trace-intersecting-dependencies-${dependencyChunk.chunkIndex}`,
        flags: graph.createDataView(dependencyChunk.results, {
          format: 'uint32',
          length: dependencyChunk.dependencyCount
        }),
        ranges: graph.createDataView(dependencyChunk.batchIndex, {
          format: 'uint32',
          length: dependencyChunk.batchCount * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH
        }),
        rangeCount: dependencyChunk.batchCount,
        rangeLayout: {wordStride: 6, firstIndexWordOffset: 0, countWordOffset: 1},
        activeRangeIds: graph.createDataView(dependencyChunk.candidateBatchIds, {
          format: 'uint32',
          length: dependencyChunk.batchCount
        }),
        activeRangeDispatch: dependencyChunk.candidateDispatchCommands,
        maximumRangeLength: TRACE_DEPENDENCY_BATCH_CAPACITY,
        output: intersectingDependencyIds,
        count: intersectingDependencyCount
      }).addToGraph(graph);
      addTraceComputePass(graph, {
        id: `trace-clear-visible-dependency-budget-${dependencyChunk.chunkIndex}`,
        source: getDependencyDisplayBudgetClearShader(visibleDependencyCountWordOffset),
        bindings: [storageWrite('drawCommands', handles.drawCommands)],
        length: 1
      });
      addTraceComputePass(graph, {
        id: `trace-budget-visible-dependencies-${dependencyChunk.chunkIndex}`,
        source: getDependencyDisplayBudgetShader(
          maximumCandidateDependencyCount,
          dependencyChunk.chunkIndex,
          resources.dependencyChunks.length,
          visibleDependencyCountWordOffset
        ),
        bindings: [
          storageRead('intersectingIds', intersectingDependencyIds.buffer),
          storageRead('intersectingCount', intersectingDependencyCount.buffer),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('visibleIds', visibleDependencyIds.buffer),
          storageWrite('drawCommands', handles.drawCommands)
        ],
        length: Math.max(maximumCandidateDependencyCount, 1)
      });
    }

    for (const chunk of handles.dependencyChunks) {
      addTraceComputePass(graph, {
        id: `trace-pick-dependency-${chunk.chunkIndex}`,
        source: getDependencyPickShader(
          chunk.visibleCapacity,
          chunk.firstDependencyIndex,
          chunk.drawCommandIndex * 4 + 1
        ),
        bindings: [
          storageRead('visibleDependencyIds', chunk.visibleIds),
          storageRead('dependencyEndpointPositions', chunk.endpointPositions),
          storageRead('drawCommands', handles.drawCommands),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('pickResult', handles.pickResult)
        ],
        length: chunk.visibleCapacity
      });
    }
    for (const chunk of handles.dependencyChunks) {
      addTraceComputePass(graph, {
        id: `trace-resolve-dependency-pick-${chunk.chunkIndex}`,
        source: getDependencyPickResolveShader(chunk.firstDependencyIndex),
        bindings: [
          storageRead('dependencies', chunk.dependencies),
          storageWrite('pickResult', handles.pickResult)
        ],
        length: 1,
        workgroupSize: 1
      });
    }

    graph.addRenderPass({
      id: 'render-hierarchical-trace',
      workload: {
        operation: 'TraceRender',
        commandCount: resources.spanDraws.length + resources.dependencyChunks.length + 3,
        maximumInvocationCount:
          resources.spanCount * 6 +
          resources.dependencyCount * 6 +
          3 +
          TRACE_LABEL_GLYPH_CAPACITY * 6
      },
      resources: renderResources,
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'gpu-hierarchical-trace-render-pass',
          clearColor: [0.012, 0.018, 0.035, 1],
          clearDepth: false,
          clearStencil: false
        }),
        encode: ({renderPass, getBuffer}) => {
          renderPass.executeBundles([resources.renderBundle]);
          const atlasTexture = this.labelRenderer.resources.atlasTexture;
          if (atlasTexture.isReady) {
            renderPass.setPipeline(this.labelRenderer.model.pipeline);
            renderPass.setVertexArray(this.labelRenderer.model.vertexArray);
            renderPass.setBindings({
              labelGlyphs: resources.labelGlyphs,
              threadOffsets: resources.threadOffsets,
              threadStates: resources.threadStates,
              viewUniforms: this.viewUniformBuffer,
              textDictionaryGlyphRanges: this.labelRenderer.dictionaryGlyphRanges,
              textDictionaryGlyphRecords: this.labelRenderer.dictionaryGlyphRecords,
              textGlyphFrames: this.labelRenderer.glyphFrames,
              textDictionaryStyle: this.labelRenderer.styleUniforms,
              fontAtlasTexture: atlasTexture.texture
            });
            resources.drawCommands.draw(renderPass, resources.labelDrawCommandIndex);
          }
          const renderTargetWidth = resources.pickingWidth;
          const renderTargetHeight = resources.pickingHeight;
          const minimapPixelScale =
            renderTargetHeight / Math.max(this.canvas?.clientHeight ?? renderTargetHeight, 1);
          const minimapInset = TRACE_MINIMAP_INSET * minimapPixelScale;
          const minimapWidth = Math.max(renderTargetWidth - minimapInset * 2, 1);
          const minimapHeight = Math.min(
            TRACE_MINIMAP_HEIGHT * minimapPixelScale,
            Math.max(renderTargetHeight - minimapInset * 2, 0)
          );
          if (this.minimapEnabled && minimapHeight > 0) {
            const minimapY = renderTargetHeight - minimapHeight - minimapInset;
            renderPass.setParameters({
              viewport: [minimapInset, minimapY, minimapWidth, minimapHeight, 0, 1],
              scissorRect: [minimapInset, minimapY, minimapWidth, minimapHeight]
            });
            resources.minimapModel.setBindings({
              temporalIndex: getBuffer(handles.temporalIndex),
              viewUniforms: this.viewUniformBuffer
            });
            resources.minimapModel.draw(renderPass);
          }
        }
      })
    });
    return graph.compile();
  }

  /** Renders visible exact spans and dependencies into one canonical integer picking target. */
  private createPickingGraph(resources: TraceGraphResources): {
    compiled: CompiledGPUCommandGraph<TraceRasterPickingParameters>;
    readbackIdentifier: string;
  } {
    const graph = new GPUCommandGraph<TraceRasterPickingParameters>(this.device, {
      id: 'gpu-trace-raster-picking-graph',
      autotuner: this.graphAutotuner
    });
    const uniforms = importTraceBuffer(graph, 'picking-view-uniforms', this.viewUniformBuffer);
    const threadOffsets = importTraceBuffer(
      graph,
      'picking-thread-offsets',
      resources.threadOffsets
    );
    const threadStates = importTraceBuffer(graph, 'picking-thread-states', resources.threadStates);
    const drawCommands = importTraceBuffer(
      graph,
      'picking-draw-commands',
      resources.drawCommands.buffer
    );
    const spanChunks = resources.spanChunks.map(chunk => ({
      ...chunk,
      spans: importTraceBuffer(graph, `picking-spans-${chunk.chunkIndex}`, chunk.buffer),
      visibleIds: importTraceBuffer(
        graph,
        `picking-visible-spans-${chunk.chunkIndex}`,
        chunk.visibleIds
      ),
      uniforms: importTraceBuffer(
        graph,
        `picking-span-uniforms-${chunk.chunkIndex}`,
        chunk.uniforms
      )
    }));
    const dependencyChunks = resources.dependencyChunks.map(chunk => ({
      ...chunk,
      visibleIds: importTraceBuffer(
        graph,
        `picking-visible-dependencies-${chunk.chunkIndex}`,
        chunk.visibleIds
      ),
      endpointPositions: importTraceBuffer(
        graph,
        `picking-dependency-endpoints-${chunk.chunkIndex}`,
        chunk.endpointPositions
      ),
      uniforms: importTraceBuffer(
        graph,
        `picking-dependency-uniforms-${chunk.chunkIndex}`,
        chunk.uniforms
      )
    }));
    const target = new GPUIndexPickingTarget(graph, {
      id: 'gpu-trace-index-picking',
      width: resources.pickingWidth,
      height: resources.pickingHeight
    });
    graph.addRenderPass({
      id: 'render-trace-index-picking',
      attachments: target.attachments,
      resources: [
        {buffer: uniforms, usage: 'uniform'},
        {buffer: threadOffsets, usage: 'storage-read'},
        {buffer: threadStates, usage: 'storage-read'},
        {buffer: drawCommands, usage: 'indirect'},
        ...spanChunks.flatMap(chunk => [
          {buffer: chunk.spans, usage: 'storage-read' as const},
          {buffer: chunk.visibleIds, usage: 'storage-read' as const},
          {buffer: chunk.uniforms, usage: 'uniform' as const}
        ]),
        ...dependencyChunks.flatMap(chunk => [
          {buffer: chunk.visibleIds, usage: 'storage-read' as const},
          {buffer: chunk.endpointPositions, usage: 'storage-read' as const},
          {buffer: chunk.uniforms, usage: 'uniform' as const}
        ])
      ],
      compile: () => ({
        getRenderPassProps: () => target.renderPassProps,
        encode: ({renderPass, getBuffer}) => {
          renderPass.setPipeline(this.pickingModel.pipeline);
          renderPass.setVertexArray(this.pickingModel.vertexArray);
          for (const draw of resources.spanDraws) {
            const chunk = spanChunks[draw.chunkIndex];
            renderPass.setBindings({
              spans: getBuffer(chunk.spans),
              visibleIds: getBuffer(chunk.visibleIds),
              threadOffsets: getBuffer(threadOffsets),
              threadStates: getBuffer(threadStates),
              viewUniforms: getBuffer(uniforms),
              spanChunk: getBuffer(chunk.uniforms)
            });
            resources.drawCommands.draw(renderPass, draw.commandIndex);
          }
          renderPass.setPipeline(this.dependencyPickingModel.pipeline);
          renderPass.setVertexArray(this.dependencyPickingModel.vertexArray);
          for (const chunk of dependencyChunks) {
            renderPass.setBindings({
              visibleDependencyIds: getBuffer(chunk.visibleIds),
              dependencyEndpointPositions: getBuffer(chunk.endpointPositions),
              viewUniforms: getBuffer(uniforms),
              dependencyChunk: getBuffer(chunk.uniforms)
            });
            resources.drawCommands.draw(renderPass, chunk.drawCommandIndex);
          }
        }
      })
    });
    target.addReadbackPass({
      after: 'render-trace-index-picking',
      getPixel: parameters => parameters.pixel
    });
    return {compiled: graph.compile(), readbackIdentifier: target.readback.id};
  }

  /** Records the fixed exact-span, dependency, and adaptive-density draw topology. */
  private createRenderBundle(resources: TraceGraphResources): RenderBundle {
    const encoder = this.device.createRenderBundleEncoder({
      id: 'gpu-hierarchical-trace-render-bundle',
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    for (const draw of resources.spanDraws) {
      const chunk = resources.spanChunks[draw.chunkIndex];
      encoder.setBindings({
        spans: chunk.buffer,
        visibleIds: chunk.visibleIds,
        threadOffsets: resources.threadOffsets,
        threadStates: resources.threadStates,
        reachedSpans: resources.reachedSpans,
        viewUniforms: this.viewUniformBuffer,
        spanChunk: chunk.uniforms,
        anomalyMask: resources.anomalyMasks?.[chunk.chunkIndex] ?? resources.zeroAnomalyMask
      });
      resources.drawCommands.draw(encoder, draw.commandIndex);
    }

    if (resources.dependencyChunks.length > 0) {
      encoder.setPipeline(this.dependencyModel.pipeline);
      encoder.setVertexArray(this.dependencyModel.vertexArray);
      for (const chunk of resources.dependencyChunks) {
        encoder.setBindings({
          dependencies: chunk.buffer,
          visibleDependencyIds: chunk.visibleIds,
          dependencyEndpointPositions: chunk.endpointPositions,
          viewUniforms: this.viewUniformBuffer,
          dependencyChunk: chunk.uniforms
        });
        resources.drawCommands.draw(encoder, chunk.drawCommandIndex);
      }
    }

    encoder.setPipeline(this.densityModel.pipeline);
    encoder.setVertexArray(this.densityModel.vertexArray);
    encoder.setBindings({
      densityBins: resources.densityBins,
      viewUniforms: this.viewUniformBuffer
    });
    resources.drawCommands.draw(encoder, resources.densityDrawCommandIndex);

    return encoder.finish();
  }

  private writeViewUniforms(
    width: number,
    height: number,
    pick: PickPosition | null,
    visibilityGeneration: number
  ): void {
    const data = new ArrayBuffer(VIEW_UNIFORM_BYTE_LENGTH);
    const floats = new Float32Array(data);
    const unsigned = new Uint32Array(data);
    floats[0] = this.view.timeMin;
    floats[1] = this.view.timeMax;
    floats[2] = this.view.laneMin;
    floats[3] = this.view.laneMax;
    unsigned[4] = this.enabledMask;
    unsigned[5] = this.statusMask;
    unsigned[6] = this.activeFilterMask;
    unsigned[7] = this.initialDependencyWarmup ? 0 : this.dependencyMask;
    floats[8] = this.minimumDuration;
    floats[9] = width;
    floats[10] = height;
    unsigned[11] = this.selectedSpanIndex;
    unsigned[12] = this.focusOnly ? 1 : 0;
    floats[13] = 0.16;
    floats[14] = pick?.time ?? -1;
    floats[15] = pick?.lane ?? -1;
    unsigned[16] = visibilityGeneration;
    unsigned[17] = this.selectedDependencyIndex;
    unsigned[18] = this.lodFadeEnabled ? 1 : 0;
    unsigned[19] = this.labelsEnabled ? 1 : 0;
    unsigned[20] = this.densityPattern;
    const densityBins = getTraceDensityBinParameters(this.view.timeMin, this.view.timeMax);
    floats[21] = densityBins.origin;
    floats[22] = densityBins.duration;
    this.effectiveDependencyDisplayBudget = getTraceDependencyDisplayBudget(
      this.dependencyDisplayBudget,
      this.view.timeMin,
      this.view.timeMax,
      this.traceDuration
    );
    unsigned[23] = this.effectiveDependencyDisplayBudget;
    unsigned[24] = this.hoveredSpanIndex;
    unsigned[25] = this.hoveredDependencyIndex;
    unsigned[26] = this.regressionGroupMask;
    floats[27] = this.regressionGroupMask === 0 ? 0 : 0.42;
    unsigned[28] =
      this.overviewMode === 'density' ? 1 : this.overviewMode === 'representative' ? 2 : 0;
    unsigned[29] = isTraceDependencyBundlingEnabled(
      this.view.timeMin,
      this.view.timeMax,
      width,
      this.dependencyRouting
    )
      ? 1
      : 0;
    unsigned[30] = this.anomalyOverlayEnabled ? 1 : 0;
    this.viewUniformBuffer.write(data);

    const temporalQueryData = new ArrayBuffer(7 * UINT32_BYTE_LENGTH);
    const temporalQueryFloats = new Float32Array(temporalQueryData);
    const temporalQueryUnsigned = new Uint32Array(temporalQueryData);
    const timeRange = Math.max(this.view.timeMax - this.view.timeMin, 0.0001);
    temporalQueryFloats[0] = this.view.timeMin;
    temporalQueryFloats[1] = this.view.timeMax;
    temporalQueryFloats[2] = (8 * timeRange) / Math.max(width, 1);
    temporalQueryUnsigned[3] = this.enabledMask;
    temporalQueryUnsigned[4] = Math.max(Math.floor(this.view.laneMin), 0);
    temporalQueryUnsigned[5] = Math.max(Math.ceil(this.view.laneMax), temporalQueryUnsigned[4] + 1);
    temporalQueryUnsigned[6] = getTraceTemporalIndexLevel(
      this.resources?.temporalIndexLevels ?? [],
      timeRange / Math.max(width, 1)
    );
    this.resources?.temporalQuery.write(temporalQueryData);
    const representativePixelCount = Math.min(
      Math.max(Math.ceil(width), 1),
      TRACE_REPRESENTATIVE_MAXIMUM_PIXEL_COUNT
    );
    const representativeQuery = new ArrayBuffer(3 * UINT32_BYTE_LENGTH);
    const representativeQueryFloats = new Float32Array(representativeQuery);
    const representativeQueryUnsigned = new Uint32Array(representativeQuery);
    representativeQueryFloats[0] = this.view.timeMin;
    representativeQueryFloats[1] = timeRange / representativePixelCount;
    representativeQueryUnsigned[2] = representativePixelCount;
    this.resources?.representativeQuery.write(representativeQuery);
  }

  private isRepresentativeOverviewActive(width: number): boolean {
    return this.getOverviewRenderer(width) === 'representative';
  }

  private getOverviewRenderer(width: number): TraceOverviewRenderer {
    return getTraceOverviewRenderer(
      this.view.timeMin,
      this.view.timeMax,
      width,
      this.overviewMode,
      this.lodFadeEnabled
    );
  }

  private prepareOverviewMeasurement(width: number, height: number): void {
    const signature = [
      this.compileCount,
      width,
      height,
      this.view.timeMax - this.view.timeMin,
      this.view.laneMin,
      this.view.laneMax,
      this.enabledMask,
      this.statusMask,
      this.activeFilterMask,
      this.dependencyMask,
      this.dependencyDisplayBudget,
      this.minimumDuration,
      this.selectedSpanIndex,
      this.selectedDependencyIndex,
      this.focusOnly ? 1 : 0,
      this.focusDepth,
      this.lodFadeEnabled ? 1 : 0,
      this.labelsEnabled ? 1 : 0,
      this.densityPattern,
      this.regressionGroupMask,
      this.anomalyOverlayEnabled ? 1 : 0,
      this.initialDependencyWarmup ? 1 : 0,
      ...this.processStates,
      ...this.threadStates
    ].join(':');
    if (signature === this.overviewMeasurementSignature) {
      return;
    }
    this.overviewMeasurementSignature = signature;
    this.overviewFrameTimeSamples.exact.length = 0;
    this.overviewFrameTimeSamples.density.length = 0;
    this.overviewFrameTimeSamples.representative.length = 0;
  }

  private recordOverviewFrameTime(
    renderer: TraceOverviewRenderer,
    durationMilliseconds: number
  ): void {
    const samples = this.overviewFrameTimeSamples[renderer];
    samples.push(durationMilliseconds);
    if (samples.length > TRACE_OVERVIEW_TIMING_SAMPLE_CAPACITY) {
      samples.shift();
    }
  }

  private async sampleVisibleCounts(
    resources: TraceGraphResources,
    readbackTicket: GPUReadbackTicket
  ): Promise<void> {
    try {
      const bytes = await readbackTicket.read();
      if (resources !== this.resources) {
        return;
      }
      const values = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      this.sampledVisibleCounts = resources.groups.map((_, groupIndex) =>
        resources.spanDraws
          .filter(draw => draw.groupIndex === groupIndex)
          .reduce((count, draw) => count + (values[draw.commandIndex * 4 + 1] ?? 0), 0)
      );
      this.sampledDependencyCount = resources.dependencyChunks.reduce(
        (count, chunk) => count + (values[chunk.drawCommandIndex * 4 + 1] ?? 0),
        0
      );
      this.sampledLabelGlyphCount = values[resources.labelDrawCommandIndex * 4 + 1] ?? 0;
      this.recordWorkloadCounters();
      this.updateInspector();
    } catch {
      // Device loss and cancellation release the ring slot without affecting rendering.
    }
  }

  private async sampleCandidateBatchCount(
    resources: TraceGraphResources,
    readbackTicket: GPUReadbackTicket
  ): Promise<void> {
    try {
      const bytes = await readbackTicket.read();
      if (resources !== this.resources) {
        return;
      }
      this.sampledCandidateBatchCount = new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
      this.recordWorkloadCounters();
      this.updateInspector();
    } catch {
      // Device loss and cancellation release the ring slot without affecting rendering.
    }
  }

  private async sampleCandidateDependencyBatchCount(
    resources: TraceGraphResources,
    readbackTicket: GPUReadbackTicket
  ): Promise<void> {
    try {
      const bytes = await readbackTicket.read();
      if (resources !== this.resources) {
        return;
      }
      const counts = new Uint32Array(
        bytes.buffer,
        bytes.byteOffset,
        resources.dependencyChunks.length
      );
      this.sampledCandidateDependencyBatchCount = counts.reduce((sum, count) => sum + count, 0);
      this.recordWorkloadCounters();
      this.updateInspector();
    } catch {
      // Device loss and cancellation release the ring slot without affecting rendering.
    }
  }

  private async sampleFocusOverflowCount(
    resources: TraceGraphResources,
    readbackTicket: GPUReadbackTicket
  ): Promise<void> {
    try {
      const bytes = await readbackTicket.read();
      if (resources !== this.resources) {
        return;
      }
      this.sampledFocusOverflowCount = new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
      this.updateInspector();
    } catch {
      // Device loss and cancellation release the ring slot without affecting rendering.
    }
  }

  private resizePickingGraph(resources: TraceGraphResources, width: number, height: number): void {
    resources.pickingCompiled.destroy();
    resources.pickingWidth = Math.max(width, 1);
    resources.pickingHeight = Math.max(height, 1);
    const picking = this.createPickingGraph(resources);
    resources.pickingCompiled = picking.compiled;
    resources.pickingReadbackIdentifier = picking.readbackIdentifier;
  }

  private getRasterPickingPixel(
    pick: PickPosition,
    resources: TraceGraphResources
  ): readonly [number, number] {
    const horizontalFraction =
      (pick.time - this.view.timeMin) / Math.max(this.view.timeMax - this.view.timeMin, 0.0001);
    const verticalFraction =
      (pick.lane - this.view.laneMin) / Math.max(this.view.laneMax - this.view.laneMin, 1);
    return [
      clamp(Math.floor(horizontalFraction * resources.pickingWidth), 0, resources.pickingWidth - 1),
      clamp(Math.floor(verticalFraction * resources.pickingHeight), 0, resources.pickingHeight - 1)
    ];
  }

  /** Applies the canonical object/type pair produced by the shared integer picking target. */
  private async sampleRasterPick(
    resources: TraceGraphResources,
    readbackTicket: GPUReadbackTicket,
    pick: PickPosition
  ): Promise<void> {
    try {
      const picked = decodeGPUIndexPickInfo(await readbackTicket.read());
      this.recordTraceCertificationPickResponse(pick);
      const latestRequestIdentifier =
        pick.intent === 'select'
          ? this.latestSelectionPickRequestIdentifier
          : this.latestHoverPickRequestIdentifier;
      if (resources !== this.resources || pick.requestIdentifier !== latestRequestIdentifier) {
        return;
      }
      if (picked.objectIndex === null) {
        if (pick.intent === 'hover') {
          this.hoveredSpanIndex = INVALID_SPAN_INDEX;
          this.hoveredDependencyIndex = INVALID_SPAN_INDEX;
          this.lastRenderSignature = '';
          this.hidePickTooltip();
        }
        return;
      }
      if (picked.batchIndex === 1) {
        if (pick.intent === 'select') {
          this.setSelectedDependency(picked.objectIndex);
        } else {
          this.hoveredSpanIndex = INVALID_SPAN_INDEX;
          this.hoveredDependencyIndex = picked.objectIndex;
          this.lastRenderSignature = '';
        }
        this.showRasterPickTooltip(
          pick.clientX,
          pick.clientY,
          `Dependency #${formatCount(picked.objectIndex)}`,
          'Framebuffer ID · pixel-exact edge'
        );
      } else {
        if (pick.intent === 'select') {
          this.setSelectedSpan(picked.objectIndex);
        } else {
          this.hoveredSpanIndex = picked.objectIndex;
          this.hoveredDependencyIndex = INVALID_SPAN_INDEX;
          this.lastRenderSignature = '';
        }
        this.showRasterPickTooltip(
          pick.clientX,
          pick.clientY,
          `Span #${formatCount(picked.objectIndex)}`,
          'Framebuffer ID · canonical source row'
        );
      }
    } catch {
      // Device loss and cancellation release the ring slot without changing the selection.
    }
  }

  /** Reads the winning source row after the GPU resolves the pick into one compact buffer. */
  private async samplePickedSpan(
    resources: TraceGraphResources,
    readbackTicket: GPUReadbackTicket,
    pick: PickPosition
  ): Promise<void> {
    try {
      const bytes = await readbackTicket.read();
      this.recordTraceCertificationPickResponse(pick);
      const latestRequestIdentifier =
        pick.intent === 'select'
          ? this.latestSelectionPickRequestIdentifier
          : this.latestHoverPickRequestIdentifier;
      if (resources !== this.resources || pick.requestIdentifier !== latestRequestIdentifier) {
        return;
      }
      const resultWords = new Uint32Array(
        bytes.buffer,
        bytes.byteOffset,
        TRACE_PICK_RESULT_WORD_LENGTH
      );
      const pickedDependencyRank = resultWords[9];
      if (pickedDependencyRank !== INVALID_SPAN_INDEX) {
        const dependencyIndex = resultWords[10];
        if (pick.intent === 'select') {
          this.setSelectedDependency(dependencyIndex);
        } else {
          this.hoveredSpanIndex = INVALID_SPAN_INDEX;
          this.hoveredDependencyIndex = dependencyIndex;
          this.lastRenderSignature = '';
        }
        this.showDependencyTooltip(pick.clientX, pick.clientY, {
          dependencyIndex,
          sourceIndex: resultWords[11],
          destinationIndex: resultWords[12],
          family: resultWords[13]
        });
        return;
      }
      const pickedSpanIndex = resultWords[0];
      if (pickedSpanIndex !== INVALID_SPAN_INDEX) {
        if (pick.intent === 'select') {
          this.setSelectedSpan(pickedSpanIndex);
        } else {
          this.hoveredSpanIndex = pickedSpanIndex;
          this.hoveredDependencyIndex = INVALID_SPAN_INDEX;
          this.lastRenderSignature = '';
        }
        const recordByteOffset = bytes.byteOffset + UINT32_BYTE_LENGTH;
        const words = new Uint32Array(
          bytes.buffer,
          recordByteOffset,
          TRACE_SPAN_RECORD_WORD_LENGTH
        );
        const floats = new Float32Array(
          bytes.buffer,
          recordByteOffset,
          TRACE_SPAN_RECORD_WORD_LENGTH
        );
        const groupIndex = words[3];
        const statusIndex = words[7] & (TRACE_STATUS_COUNT - 1);
        const dictionaryIndex = Math.min(
          groupIndex * TRACE_STATUS_COUNT + statusIndex,
          TRACE_LABEL_DICTIONARY.length - 1
        );
        this.showPickTooltip(pick.clientX, pick.clientY, {
          sourceIndex: words[6],
          label: TRACE_LABEL_DICTIONARY[dictionaryIndex],
          group: TRACE_GROUPS[groupIndex] ?? 'unknown',
          status: STATUS_NAMES[statusIndex] ?? 'unknown',
          start: floats[0],
          duration: floats[1],
          processIndex: words[4],
          threadIndex: words[5]
        });
      } else if (pick.intent === 'hover') {
        this.hoveredSpanIndex = INVALID_SPAN_INDEX;
        this.hoveredDependencyIndex = INVALID_SPAN_INDEX;
        this.lastRenderSignature = '';
        this.hidePickTooltip();
      }
    } catch {
      // Device loss and cancellation release the ring slot without changing the selection.
    }
  }

  private showPickTooltip(
    clientX: number,
    clientY: number,
    span: {
      sourceIndex: number;
      label: string;
      group: string;
      status: string;
      start: number;
      duration: number;
      processIndex: number;
      threadIndex: number;
    }
  ): void {
    const tooltip = this.pickTooltipElement;
    if (!tooltip) {
      return;
    }
    const localThreadIndex = span.threadIndex % TRACE_THREADS_PER_PROCESS;
    tooltip.innerHTML = `<strong>${span.label}</strong><span>#${formatCount(span.sourceIndex)} · ${span.group} · ${span.status}</span><span>${span.start.toFixed(2)} ms + ${span.duration.toFixed(2)} ms</span><span>Process ID ${span.processIndex} · Thread ID ${span.threadIndex} (T${localThreadIndex})</span>`;
    tooltip.style.left = `${Math.min(clientX + 14, window.innerWidth - 230)}px`;
    tooltip.style.top = `${Math.min(clientY + 14, window.innerHeight - 104)}px`;
    tooltip.hidden = false;
  }

  private showRasterPickTooltip(
    clientX: number,
    clientY: number,
    title: string,
    detail: string
  ): void {
    const tooltip = this.pickTooltipElement;
    if (!tooltip) return;
    tooltip.innerHTML = `<strong>${title}</strong><span>${detail}</span><span>Use analytical picking for a wider hit target and full metadata.</span>`;
    tooltip.style.left = `${Math.min(clientX + 14, window.innerWidth - 230)}px`;
    tooltip.style.top = `${Math.min(clientY + 14, window.innerHeight - 82)}px`;
    tooltip.hidden = false;
  }

  private showDependencyTooltip(
    clientX: number,
    clientY: number,
    dependency: {
      dependencyIndex: number;
      sourceIndex: number;
      destinationIndex: number;
      family: number;
    }
  ): void {
    const tooltip = this.pickTooltipElement;
    if (!tooltip) {
      return;
    }
    const family = dependency.family === 0 ? 'Same-process dependency' : 'Cross-process dependency';
    tooltip.innerHTML = `<strong>${family}</strong><span>Edge #${formatCount(dependency.dependencyIndex)}</span><span>Span #${formatCount(dependency.sourceIndex)} → #${formatCount(dependency.destinationIndex)}</span><span>Click to highlight this relationship</span>`;
    tooltip.style.left = `${Math.min(clientX + 14, window.innerWidth - 230)}px`;
    tooltip.style.top = `${Math.min(clientY + 14, window.innerHeight - 104)}px`;
    tooltip.hidden = false;
  }

  private hidePickTooltip(): void {
    if (this.pickTooltipElement) {
      this.pickTooltipElement.hidden = true;
    }
  }

  private setSelectedSpan(spanIndex: number): void {
    const resources = this.resources;
    if (!resources || !Number.isSafeInteger(spanIndex) || spanIndex >= resources.spanCount) {
      return;
    }
    this.selectedDependencyIndex = INVALID_SPAN_INDEX;
    this.selectedSpanIndex = spanIndex;
    resources.selectedSeeds.write(Uint32Array.from([spanIndex]));
    resources.selectedSeedCount.write(Uint32Array.from([1]));
    this.updateInspector();
  }

  private setSelectedDependency(dependencyIndex: number): void {
    const resources = this.resources;
    if (
      !resources ||
      !Number.isSafeInteger(dependencyIndex) ||
      dependencyIndex >= resources.dependencyCount
    ) {
      return;
    }
    this.selectedDependencyIndex = dependencyIndex;
    this.lastRenderSignature = '';
    this.updateInspector();
  }

  private clearSelectedSpan(): void {
    this.selectedSpanIndex = INVALID_SPAN_INDEX;
    this.selectedDependencyIndex = INVALID_SPAN_INDEX;
    this.resources?.selectedSeedCount.write(Uint32Array.from([0]));
    this.lastRenderSignature = '';
    this.updateInspector();
  }

  private destroyResources(): void {
    this.causalAnalysisGeneration++;
    this.anomalyAnalysisGeneration++;
    if (this.aggregationUpdateTimer) {
      clearTimeout(this.aggregationUpdateTimer);
      this.aggregationUpdateTimer = null;
    }
    if (this.aggregationFrameHandle !== null) {
      cancelAnimationFrame(this.aggregationFrameHandle);
      this.aggregationFrameHandle = null;
    }
    this.aggregationExecution = null;
    this.aggregationInFlight = false;
    this.aggregationProgress = 0;
    this.aggregationPublication = 'none';
    this.pendingAggregationWindow = null;
    this.aggregationGeneration++;
    for (const timer of this.gpuTimingReadbackTimers) {
      clearTimeout(timer);
    }
    this.gpuTimingReadbackTimers.clear();
    const resources = this.resources;
    if (!resources) {
      return;
    }
    this.graphObservation?.detach();
    this.graphObservation = null;
    this.destroyResourceSet(resources);
    this.resources = null;
  }

  private destroyResourceSet(resources: TraceGraphResources): void {
    resources.compiled?.destroy();
    resources.pickingCompiled?.destroy();
    resources.aggregationCompiled?.destroy();
    resources.viewportAggregationCompiled?.destroy();
    resources.renderBundle?.destroy();
    resources.minimapModel.destroy();
    resources.drawCommands.destroy();
    resources.candidateDispatchCommands.destroy();
    resources.densityCandidateDispatchCommands.destroy();
    resources.pickCandidateDispatchCommands.destroy();
    resources.aggregationCandidateDispatchCommands.destroy();
    for (const chunk of resources.dependencyChunks) {
      chunk.candidateDispatchCommands.destroy();
    }
    resources.readbackRing.destroy();
    resources.pickingReadbackRing.destroy();
    for (const buffer of [
      ...resources.spanChunks.flatMap(chunk => [
        chunk.buffer,
        chunk.uniforms,
        chunk.visibility,
        chunk.visibleIds,
        chunk.aggregationSelection,
        chunk.representativeSelection,
        chunk.representativeRowOrder,
        chunk.representativeLaneOffsets,
        chunk.representativeIds,
        chunk.representativeValidationErrors
      ]),
      ...resources.dependencyChunks.flatMap(chunk => [
        chunk.buffer,
        chunk.uniforms,
        chunk.batchIndex,
        chunk.candidateBatchIds,
        chunk.results,
        chunk.endpointPositions,
        chunk.visibleIds
      ]),
      resources.candidateDependencyBatchCounts,
      resources.spanBatchIndex,
      resources.candidateBatchIds,
      resources.candidateChunkOffsets,
      resources.parentSpans,
      ...resources.outgoingAdjacencyChunks.flatMap(chunk => [chunk.topology, chunk.neighbors]),
      ...resources.incomingAdjacencyChunks.flatMap(chunk => [chunk.topology, chunk.neighbors]),
      resources.processStates,
      resources.threadStates,
      resources.threadHeights,
      resources.threadOffsets,
      resources.selectedSeeds,
      resources.selectedSeedCount,
      resources.focusTraversalState,
      resources.focusOverflowCount,
      resources.reachedSpans,
      resources.dependencySpanVisibility,
      resources.zeroAnomalyMask,
      ...(resources.anomalyMasks ?? []),
      resources.densityBins,
      resources.labelGlyphs,
      resources.pickResult,
      resources.aggregationWindow,
      resources.aggregationResults,
      resources.aggregationTemporalQuery,
      resources.aggregationCandidateBatchIds,
      resources.temporalIndex,
      resources.temporalIndexDirtyPartitions,
      resources.temporalIndexValidationErrors,
      resources.temporalQuery,
      resources.representativeQuery,
      resources.representativeBestDurations,
      resources.representativeBestIds
    ]) {
      buffer.destroy();
    }
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'gpu-trace-viewer-panel',
      title: 'GPU Trace Manipulation',
      panels: [
        makeHtmlCustomPanel({
          id: 'gpu-trace-dashboard',
          title: '',
          html: getTraceDashboardHtml({
            datasetLoadPhase: this.datasetLoadPhase,
            datasetStatus: this.datasetStatus,
            measuredTimeMinimum: this.measuredTimeMinimum,
            measuredTimeMaximum: this.measuredTimeMaximum,
            causalAnalysisStatus: this.causalAnalysisStatus,
            anomalyAnalysisStatus: this.anomalyAnalysisStatus,
            certificationStatus: this.getTraceCertificationStatusText(),
            renderingControls: this.getRenderingControlsHtml(),
            filterControls: this.getControlsHtml(),
            hierarchyControls: this.getHierarchyHtml(),
            interactionControls: this.getAdvancedInteractionControlsHtml()
          }),
          onRender: root => {
            this.dashboardElement = root;
            this.frameStatsElement = root.querySelector('[data-frame-stats]');
            this.capacityElement = root.querySelector('[data-capacity]');
            this.selectionElement = root.querySelector('[data-selection]');
            this.aggregationElement = root.querySelector('[data-aggregations]');
            this.operationAggregationElement = root.querySelector('[data-operation-aggregations]');
            this.statusAggregationElement = root.querySelector('[data-status-aggregations]');
            this.aggregationSummaryElement = root.querySelector('[data-aggregation-summary]');
            this.durationHistogramElement = root.querySelector('[data-duration-histogram]');
            this.utilizationElement = root.querySelector('[data-utilization]');
            this.analysisWindowElement = root.querySelector('[data-analysis-window]');
            this.statsElement = root.querySelector('[data-stats]');
            this.overviewComparisonElement = root.querySelector('[data-overview-comparison]');
            this.plannerBudgetElement = root.querySelector('[data-planner-budgets]');
            this.graphDiagnosticElement = root.querySelector('[data-graph-diagnostic]');
            this.certificationElement = root.querySelector('[data-trace-certification]');
            this.causalAnalysisElement = root.querySelector('[data-causal-analysis]');
            this.anomalyAnalysisElement = root.querySelector('[data-anomaly-analysis]');
            this.datasetLoadBannerElement = root.querySelector('[data-dataset-load-banner]');
            this.datasetLoadMessageElement = root.querySelector('[data-dataset-load-message]');
            this.inspectorPanel = new GPUCommandGraphInspectorPanel(
              root.querySelector<HTMLElement>('[data-command-graph-inspector]')!,
              {
                graphLabels: {[TRACE_GRAPH_ID]: 'Trace interaction + LOD + draw'},
                counterLabels: TRACE_INSPECTOR_COUNTER_LABELS
              }
            );
            const removeTabs = this.bindPanelTabs(root);
            const removeControls = this.bindPanelControls(root);
            const removeHierarchy = this.bindHierarchyControls(root);
            const removeAnalysis = this.bindAnalysisControls(root);
            const removeCausal = this.bindCausalControls(root);
            const removeCertification = this.bindTraceCertificationControls(root);
            this.updateInspector();
            this.updateTraceCertificationPanel();
            return () => {
              removeTabs();
              removeControls();
              removeHierarchy();
              removeAnalysis();
              removeCausal();
              removeCertification();
              this.frameStatsElement = null;
              this.capacityElement = null;
              this.selectionElement = null;
              this.aggregationElement = null;
              this.operationAggregationElement = null;
              this.statusAggregationElement = null;
              this.aggregationSummaryElement = null;
              this.durationHistogramElement = null;
              this.utilizationElement = null;
              this.analysisWindowElement = null;
              this.statsElement = null;
              this.overviewComparisonElement = null;
              this.plannerBudgetElement = null;
              this.graphDiagnosticElement = null;
              this.certificationElement = null;
              this.causalAnalysisElement = null;
              this.anomalyAnalysisElement = null;
              this.datasetLoadBannerElement = null;
              this.datasetLoadMessageElement = null;
              this.dashboardElement = null;
              this.inspectorPanel?.destroy();
              this.inspectorPanel = null;
            };
          }
        })
      ]
    });
  }

  private bindPanelTabs(root: HTMLElement): () => void {
    const onClick = (event: Event): void => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
        '[data-trace-tab], [data-open-analysis]'
      );
      if (!button) {
        return;
      }
      const selectedTab = button.matches('[data-open-analysis]')
        ? 'analysis'
        : button.dataset.traceTab;
      const selectedButton = root.querySelector<HTMLButtonElement>(
        `[data-trace-tab="${selectedTab}"]`
      );
      for (const tab of root.querySelectorAll<HTMLButtonElement>('[data-trace-tab]')) {
        tab.setAttribute('aria-selected', String(tab === selectedButton));
      }
      for (const panel of root.querySelectorAll<HTMLElement>('[data-trace-tab-panel]')) {
        panel.hidden = panel.dataset.traceTabPanel !== selectedTab;
      }
      if (selectedTab === 'analysis') {
        this.requestAggregationForCurrentScope(0);
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }

  private bindTraceCertificationControls(root: HTMLElement): () => void {
    const onClick = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-run-trace-certification]')) {
        this.startTraceCertification();
      } else if (target?.closest('[data-cancel-trace-certification]')) {
        this.cancelTraceCertification();
      } else if (target?.closest('[data-download-trace-certification]')) {
        this.downloadTraceCertificationReport();
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }

  private startTraceCertification(): void {
    if (
      !this.resources ||
      this.datasetLoadPhase !== 'ready' ||
      this.spanCapacity !== 25_000_000 ||
      this.dependencyCapacity !== 25_000_000
    ) {
      this.updateTraceCertificationPanel();
      return;
    }
    if (this.certificationRun) {
      return;
    }
    this.lastCertificationReport = null;
    this.certificationRun = {
      startedAt: performance.now(),
      scenarioIndex: 0,
      lastPublishedSecond: -1,
      samples: [],
      pickResponseMilliseconds: [],
      queueStallCount: 0,
      deferredPickFrameCountAtStart: this.deferredPickFrameCount,
      savedState: {
        view: {...this.view},
        enabledMask: this.enabledMask,
        statusMask: this.statusMask,
        activeFilterMask: this.activeFilterMask,
        minimumDuration: this.minimumDuration,
        dependencyMask: this.dependencyMask,
        dependencyDisplayBudget: this.dependencyDisplayBudget,
        dependencyRouting: this.dependencyRouting,
        selectedSpanIndex: this.selectedSpanIndex,
        selectedDependencyIndex: this.selectedDependencyIndex,
        focusOnly: this.focusOnly,
        autoScroll: this.autoScroll,
        lodFadeEnabled: this.lodFadeEnabled,
        overviewMode: this.overviewMode,
        minimapEnabled: this.minimapEnabled,
        labelsEnabled: this.labelsEnabled,
        densityPattern: this.densityPattern,
        pickingMode: this.pickingMode,
        processStates: this.processStates.slice(),
        threadStates: this.threadStates.slice()
      }
    };
    this.autoScroll = false;
    this.applyTraceCertificationScenario(TRACE_BENCHMARK_SCENARIOS[0]);
    this.lastRenderSignature = '';
    this.updateTraceCertificationPanel();
  }

  private updateTraceCertification(now: number): void {
    const run = this.certificationRun;
    if (!run) return;
    const elapsed = now - run.startedAt;
    if (elapsed >= TRACE_CERTIFICATION_DURATION_MILLISECONDS) {
      this.finishTraceCertification(now);
      return;
    }
    const scenarioIndex = Math.min(
      Math.floor(elapsed / TRACE_CERTIFICATION_SCENARIO_DURATION_MILLISECONDS),
      TRACE_BENCHMARK_SCENARIOS.length - 1
    );
    if (scenarioIndex !== run.scenarioIndex) {
      run.scenarioIndex = scenarioIndex;
      this.applyTraceCertificationScenario(TRACE_BENCHMARK_SCENARIOS[scenarioIndex]);
    }
    const scenario = TRACE_BENCHMARK_SCENARIOS[scenarioIndex];
    const localProgress =
      (elapsed % TRACE_CERTIFICATION_SCENARIO_DURATION_MILLISECONDS) /
      TRACE_CERTIFICATION_SCENARIO_DURATION_MILLISECONDS;
    const overviewScenario = scenario.id === 'density' || scenario.id === 'representative';
    const windowDuration = overviewScenario
      ? this.traceDuration * 0.82
      : Math.max(0.5, this.traceDuration * 0.025);
    const travel = Math.max(this.traceDuration - windowDuration, 0);
    const pingPongProgress = localProgress < 0.5 ? localProgress * 2 : (1 - localProgress) * 2;
    this.setViewTimeRange(travel * pingPongProgress, travel * pingPongProgress + windowDuration);
    this.view.laneMin = 0;
    this.view.laneMax = this.getVisibleLaneCount();
    if (scenario.picking && !this.pendingPick) {
      this.requestPick({
        x: (this.view.timeMin + this.view.timeMax) / 2,
        y: (this.view.laneMin + this.view.laneMax) / 2,
        clientX: this.viewportWidth / 2,
        clientY: this.viewportHeight / 2,
        intent: 'hover'
      });
    }
    const elapsedSecond = Math.floor(elapsed / 1000);
    if (elapsedSecond !== run.lastPublishedSecond) {
      run.lastPublishedSecond = elapsedSecond;
      this.updateTraceCertificationPanel();
    }
  }

  private applyTraceCertificationScenario(
    scenario: (typeof TRACE_BENCHMARK_SCENARIOS)[number]
  ): void {
    const resources = this.resources;
    if (!resources) return;
    this.enabledMask = 0b111;
    this.statusMask = (1 << TRACE_STATUS_COUNT) - 1;
    this.activeFilterMask = scenario.filtered ? TRACE_FILTER_ERRORS_ONLY : 0;
    this.minimumDuration = 0;
    this.dependencyMask = 0b11;
    this.dependencyDisplayBudget = TRACE_DEPENDENCY_DISPLAY_BUDGET;
    this.dependencyRouting = 'auto';
    this.lodFadeEnabled = false;
    this.overviewMode = scenario.overviewMode;
    this.minimapEnabled = true;
    this.labelsEnabled = true;
    this.densityPattern = FillPattern.hash45;
    this.pickingMode = 'raster';
    this.focusOnly = scenario.focused;
    this.processStates.fill(scenario.collapsed ? TRACE_COLLAPSED_STATE : TRACE_EXPANDED_STATE);
    this.threadStates.fill(TRACE_EXPANDED_STATE);
    resources.processStates.write(this.processStates);
    resources.threadStates.write(this.threadStates);
    if (scenario.focused) {
      this.setSelectedSpan(Math.floor(resources.spanCount / 2));
    } else {
      this.clearSelectedSpan();
    }
    this.clearHoveredPick();
    this.lastRenderSignature = '';
  }

  private recordTraceCertificationFrame(
    scenarioId: TraceBenchmarkScenarioId | undefined,
    renderer: TraceOverviewRenderer,
    frameTimeMilliseconds: number,
    encodeTimeMilliseconds: number
  ): void {
    const run = this.certificationRun;
    if (!run || !scenarioId) return;
    if (frameTimeMilliseconds >= 1000) {
      run.queueStallCount++;
    }
    run.samples.push({
      scenarioId,
      renderer,
      frameTimeMilliseconds,
      encodeTimeMilliseconds,
      candidateSpanBatchCount: this.sampledCandidateBatchCount,
      candidateDependencyBatchCount: this.sampledCandidateDependencyBatchCount,
      visibleSpanCount: this.sampledVisibleCounts.reduce((sum, count) => sum + count, 0),
      visibleDependencyCount: this.sampledDependencyCount
    });
  }

  private recordTraceCertificationPickResponse(pick: PickPosition): void {
    const startedAt = this.certificationPickStartedAt.get(pick.requestIdentifier);
    this.certificationPickStartedAt.delete(pick.requestIdentifier);
    if (startedAt === undefined || !this.certificationRun) return;
    this.certificationRun.pickResponseMilliseconds.push(performance.now() - startedAt);
  }

  private finishTraceCertification(now: number): void {
    const run = this.certificationRun;
    if (!run) return;
    this.certificationRun = null;
    this.certificationPickStartedAt.clear();
    const adapter = this.graphAutotuner.exportProfile().adapter;
    this.lastCertificationReport = makeTraceCertificationReport({
      createdAt: new Date().toISOString(),
      adapterKey: adapter.key,
      spanCount: this.spanCapacity,
      dependencyCount: this.dependencyCapacity,
      canvasWidth: Math.round(this.viewportWidth),
      canvasHeight: Math.round(this.viewportHeight),
      durationMilliseconds: now - run.startedAt,
      persistentByteLength: this.allocationStats.persistentByteLength,
      largestBufferByteLength: this.allocationStats.largestBufferByteLength,
      maxStorageBufferBindingSize: this.device.limits.maxStorageBufferBindingSize,
      maxBufferSize: this.device.limits.maxBufferSize,
      deviceLost: this.deviceLost,
      queueStallCount: run.queueStallCount,
      deferredPickFrameCount: this.deferredPickFrameCount - run.deferredPickFrameCountAtStart,
      samples: run.samples,
      pickResponseMilliseconds: run.pickResponseMilliseconds
    });
    this.restoreTraceCertificationState(run.savedState);
    this.updateTraceCertificationPanel();
  }

  private cancelTraceCertification(): void {
    const run = this.certificationRun;
    if (!run) return;
    this.certificationRun = null;
    this.certificationPickStartedAt.clear();
    this.restoreTraceCertificationState(run.savedState);
    this.updateTraceCertificationPanel('Reference validation cancelled; no report was published.');
  }

  private restoreTraceCertificationState(savedState: TraceCertificationSavedState): void {
    this.view = {...savedState.view};
    this.enabledMask = savedState.enabledMask;
    this.statusMask = savedState.statusMask;
    this.activeFilterMask = savedState.activeFilterMask;
    this.minimumDuration = savedState.minimumDuration;
    this.dependencyMask = savedState.dependencyMask;
    this.dependencyDisplayBudget = savedState.dependencyDisplayBudget;
    this.dependencyRouting = savedState.dependencyRouting;
    this.focusOnly = savedState.focusOnly;
    this.autoScroll = savedState.autoScroll;
    this.lodFadeEnabled = savedState.lodFadeEnabled;
    this.overviewMode = savedState.overviewMode;
    this.minimapEnabled = savedState.minimapEnabled;
    this.labelsEnabled = savedState.labelsEnabled;
    this.densityPattern = savedState.densityPattern;
    this.pickingMode = savedState.pickingMode;
    this.processStates.set(savedState.processStates);
    this.threadStates.set(savedState.threadStates);
    this.resources?.processStates.write(this.processStates);
    this.resources?.threadStates.write(this.threadStates);
    if (savedState.selectedSpanIndex !== INVALID_SPAN_INDEX) {
      this.setSelectedSpan(savedState.selectedSpanIndex);
    } else {
      this.clearSelectedSpan();
      if (savedState.selectedDependencyIndex !== INVALID_SPAN_INDEX) {
        this.setSelectedDependency(savedState.selectedDependencyIndex);
      }
    }
    this.clearHoveredPick();
    this.lastRenderSignature = '';
  }

  private getTraceCertificationStatusText(): string {
    const run = this.certificationRun;
    if (run) {
      const scenario = TRACE_BENCHMARK_SCENARIOS[run.scenarioIndex];
      const elapsed = performance.now() - run.startedAt;
      return `Running ${scenario.id} · ${(elapsed / 1000).toFixed(1)} / ${(TRACE_CERTIFICATION_DURATION_MILLISECONDS / 1000).toFixed(0)} s · ${formatCount(run.samples.length)} completed GPU frames`;
    }
    const report = this.lastCertificationReport;
    if (report) {
      const timing = report.scenarios
        .filter(scenario => scenario.sampleCount > 0)
        .map(scenario => scenario.frameP95Milliseconds);
      const maximumP95 = timing.length > 0 ? Math.max(...timing) : 0;
      const summary = `${report.status.toUpperCase()} · ${formatCount(report.spanCount)} spans + ${formatCount(report.dependencyCount)} dependencies · worst frame p95 ${maximumP95.toFixed(1)} ms · pick p95 ${report.pickP95Milliseconds?.toFixed(1) ?? '—'} ms`;
      return report.failures.length > 0 ? `${summary} · ${report.failures.join(' · ')}` : summary;
    }
    if (this.spanCapacity !== 25_000_000 || this.dependencyCapacity !== 25_000_000) {
      return `Load 25M spans and 25M dependencies to enable reference validation. Current dataset: ${formatCount(this.spanCapacity)} + ${formatCount(this.dependencyCapacity)}.`;
    }
    return 'Ready. The runner exercises seven stable interaction scenarios and records a portable result artifact.';
  }

  private updateTraceCertificationPanel(override?: string): void {
    if (this.certificationElement) {
      this.certificationElement.textContent = override ?? this.getTraceCertificationStatusText();
    }
    const root = this.dashboardElement;
    const runButton = root?.querySelector<HTMLButtonElement>('[data-run-trace-certification]');
    const cancelButton = root?.querySelector<HTMLButtonElement>(
      '[data-cancel-trace-certification]'
    );
    const downloadButton = root?.querySelector<HTMLButtonElement>(
      '[data-download-trace-certification]'
    );
    if (runButton) {
      runButton.disabled =
        Boolean(this.certificationRun) ||
        this.datasetLoadPhase !== 'ready' ||
        this.spanCapacity !== 25_000_000 ||
        this.dependencyCapacity !== 25_000_000;
    }
    if (cancelButton) cancelButton.hidden = !this.certificationRun;
    if (downloadButton) downloadButton.hidden = this.lastCertificationReport === null;
  }

  private downloadTraceCertificationReport(): void {
    const report = this.lastCertificationReport;
    if (!report) return;
    const url = URL.createObjectURL(
      new Blob([`${JSON.stringify(report, null, 2)}\n`], {type: 'application/json'})
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `gpu-trace-25m-reference-validation-${report.status}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private renderRectangleSelection(selection: RectangleSelection | null): void {
    const element = this.rectangleSelectionElement;
    if (!element) return;
    element.hidden = selection === null;
    if (!selection) return;
    element.style.left = `${selection.clientLeft}px`;
    element.style.top = `${selection.clientTop}px`;
    element.style.width = `${selection.clientWidth}px`;
    element.style.height = `${selection.clientHeight}px`;
  }

  private applyRectangleAnalysisSelection(selection: RectangleSelection): void {
    const minimum = clamp(selection.xMin, 0, Math.max(this.traceDuration - 0.5, 0));
    const maximum = clamp(selection.xMax, minimum + 0.5, this.traceDuration);
    this.measuredTimeMinimum = minimum;
    this.measuredTimeMaximum = maximum;
    const root = this.dashboardElement;
    if (root) {
      const minimumInput = root.querySelector<HTMLInputElement>('[data-analysis-start]');
      const maximumInput = root.querySelector<HTMLInputElement>('[data-analysis-end]');
      if (minimumInput) minimumInput.value = minimum.toFixed(2);
      if (maximumInput) maximumInput.value = maximum.toFixed(2);
      root.querySelector<HTMLButtonElement>('[data-trace-tab="analysis"]')?.click();
    }
    this.setAnalysisScope('interval', root);
  }

  private setAnalysisScope(scope: TraceAnalysisScope, root = this.dashboardElement): void {
    this.analysisScope = scope;
    const scopeInput = root?.querySelector<HTMLSelectElement>('[data-analysis-scope]');
    if (scopeInput) scopeInput.value = scope;
    for (const scopeButton of root?.querySelectorAll<HTMLButtonElement>(
      '[data-analysis-scope-option]'
    ) ?? []) {
      scopeButton.setAttribute(
        'aria-pressed',
        String(scopeButton.dataset.analysisScopeOption === scope)
      );
    }
    if (scope === 'viewport') {
      this.autoScroll = false;
      const autoScrollInput = root?.querySelector<HTMLInputElement>('[data-auto-scroll]');
      if (autoScrollInput) autoScrollInput.checked = false;
    }
    this.requestAggregationForCurrentScope(0);
    this.updateInspector();
  }

  private bindAnalysisControls(root: HTMLElement): () => void {
    const setScope = (scope: TraceAnalysisScope): void => {
      this.setAnalysisScope(scope, root);
      const fullTraceButton = root.querySelector<HTMLButtonElement>(
        '[data-analysis-scope-option="trace"]'
      );
      if (fullTraceButton) fullTraceButton.dataset.confirmed = 'false';
    };
    const needsFullTraceConfirmation = (
      scope: TraceAnalysisScope,
      button: HTMLButtonElement | null
    ): boolean => {
      const spanCount = this.resources?.spanCount ?? 0;
      if (scope !== 'trace' || spanCount < 1_000_000 || button?.dataset.confirmed === 'true') {
        return false;
      }
      if (button) button.dataset.confirmed = 'true';
      if (this.analysisWindowElement) {
        const fullScanInvocations = spanCount * 7;
        this.analysisWindowElement.textContent = `Full-trace preflight: about ${formatCount(fullScanInvocations)} row invocations plus histogram/time-bucket atomics. GPUGraph will budget the work across frames. ${button ? 'Click Full trace again to run it.' : 'Use the Full trace button to confirm.'}`;
      }
      return true;
    };
    const onChange = (event: Event): void => {
      const target = event.target;
      if (target instanceof HTMLSelectElement && target.matches('[data-analysis-scope]')) {
        const requestedScope = target.value as TraceAnalysisScope;
        const fullTraceButton = root.querySelector<HTMLButtonElement>(
          '[data-analysis-scope-option="trace"]'
        );
        if (needsFullTraceConfirmation(requestedScope, null)) {
          target.value = this.analysisScope;
          if (fullTraceButton) fullTraceButton.dataset.confirmed = 'false';
          return;
        }
        setScope(requestedScope);
        return;
      }
      if (!(target instanceof HTMLInputElement)) return;
      if (target.matches('[data-analysis-start]')) {
        this.measuredTimeMinimum = Number(target.value);
      } else if (target.matches('[data-analysis-end]')) {
        this.measuredTimeMaximum = Number(target.value);
      } else {
        return;
      }
      if (this.analysisScope === 'interval') this.requestAggregationForCurrentScope();
    };
    const onClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const scopeButton = target.closest<HTMLButtonElement>('[data-analysis-scope-option]');
      if (scopeButton) {
        const requestedScope = scopeButton.dataset.analysisScopeOption as TraceAnalysisScope;
        if (needsFullTraceConfirmation(requestedScope, scopeButton)) return;
        setScope(requestedScope);
        return;
      }

      const captureButton = target.closest<HTMLButtonElement>('[data-capture-analysis-interval]');
      if (captureButton) {
        this.measuredTimeMinimum = this.view.timeMin;
        this.measuredTimeMaximum = this.view.timeMax;
        const minimumInput = root.querySelector<HTMLInputElement>('[data-analysis-start]');
        const maximumInput = root.querySelector<HTMLInputElement>('[data-analysis-end]');
        const scopeInput = root.querySelector<HTMLSelectElement>('[data-analysis-scope]');
        if (minimumInput) minimumInput.value = this.measuredTimeMinimum.toFixed(2);
        if (maximumInput) maximumInput.value = this.measuredTimeMaximum.toFixed(2);
        if (scopeInput) scopeInput.value = 'interval';
        setScope('interval');
        return;
      }

      const durationButton = target.closest<HTMLButtonElement>('[data-analysis-duration]');
      if (durationButton) {
        this.minimumDuration = Number(durationButton.dataset.analysisDuration);
        const durationInput = root.querySelector<HTMLInputElement>('[data-duration]');
        if (durationInput) {
          durationInput.max = String(Math.max(Number(durationInput.max), this.minimumDuration));
          durationInput.value = String(this.minimumDuration);
        }
        const durationLabel = root.querySelector('[data-duration-value]');
        if (durationLabel) {
          durationLabel.textContent = `${this.minimumDuration.toFixed(2)} ms`;
        }
        this.requestAggregationForCurrentScope();
        this.updateInspector();
        return;
      }

      const timeButton = target.closest<HTMLButtonElement>('[data-analysis-time]');
      if (timeButton) {
        const bucketIndex = Number(timeButton.dataset.analysisTime);
        const bucketDuration =
          (this.aggregationTimeMaximum - this.aggregationTimeMinimum) / TRACE_TIME_BUCKET_COUNT;
        const bucketMinimum = this.aggregationTimeMinimum + bucketIndex * bucketDuration;
        this.autoScroll = false;
        const autoScrollInput = root.querySelector<HTMLInputElement>('[data-auto-scroll]');
        if (autoScrollInput) autoScrollInput.checked = false;
        this.setViewTimeRange(bucketMinimum, bucketMinimum + bucketDuration);
        this.updateInspector();
      }
    };
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('change', onChange);
      root.removeEventListener('click', onClick);
    };
  }

  private bindCausalControls(root: HTMLElement): () => void {
    const onClick = (event: Event): void => {
      const anomalyButton = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
        '[data-run-anomaly-scoring]'
      );
      if (anomalyButton) {
        void this.runAnomalyScoring();
        return;
      }
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
        '[data-run-critical-path]'
      );
      if (!button) return;
      const spanCount = this.resources?.spanCount ?? 0;
      if (spanCount > 10_000_000 && button.dataset.confirmed !== 'true') {
        const pointerJumpPassCount = Math.ceil(Math.log2(spanCount)) + 1;
        const estimatedWorkingBytes = spanCount * 56;
        button.dataset.confirmed = 'true';
        button.textContent = 'Run large analysis anyway';
        this.setCausalAnalysisStatus(
          `Preflight: ${formatCount(spanCount)} spans require ${formatCount(pointerJumpPassCount)} pointer-jump passes and about ${formatBytes(estimatedWorkingBytes)} of temporary and output storage. Click again to run.`
        );
        return;
      }
      button.dataset.confirmed = 'false';
      button.textContent = 'Run GPU critical-path analysis';
      void this.runCriticalPathAnalysis();
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }

  private async runCriticalPathAnalysis(): Promise<void> {
    const resources = this.resources;
    if (!resources || resources.spanCount === 0) return;
    const generation = ++this.causalAnalysisGeneration;
    const pointerJumpPassCount = Math.ceil(Math.log2(resources.spanCount)) + 1;
    this.setCausalAnalysisStatus(
      `Preparing ${formatCount(pointerJumpPassCount)} logarithmic GPU passes over ${formatCount(resources.spanCount)} canonical spans…`
    );
    await waitForAnimationFrame();
    if (resources !== this.resources || generation !== this.causalAnalysisGeneration) return;

    const outputBuffers = {
      pathDurations: this.createStorageBuffer(
        'gpu-trace-critical-path-durations',
        resources.spanCount * UINT32_BYTE_LENGTH
      ),
      slackDurations: this.createStorageBuffer(
        'gpu-trace-critical-path-slack',
        resources.spanCount * UINT32_BYTE_LENGTH
      ),
      criticalPredecessors: this.createStorageBuffer(
        'gpu-trace-critical-path-predecessors',
        resources.spanCount * UINT32_BYTE_LENGTH
      ),
      rootIndices: this.createStorageBuffer(
        'gpu-trace-critical-path-roots',
        resources.spanCount * UINT32_BYTE_LENGTH
      ),
      hopCounts: this.createStorageBuffer(
        'gpu-trace-critical-path-hops',
        resources.spanCount * UINT32_BYTE_LENGTH
      ),
      criticalMask: this.createStorageBuffer(
        'gpu-trace-critical-path-mask',
        resources.spanCount * UINT32_BYTE_LENGTH
      ),
      summary: this.createStorageBuffer(
        'gpu-trace-critical-path-summary',
        4 * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC | Buffer.COPY_DST
      )
    };
    let compiled: CompiledGPUCommandGraph<void> | null = null;
    try {
      outputBuffers.summary.write(
        Uint32Array.from([0, TRACE_INVALID_SPAN_INDEX, 0, CRITICAL_PATH_EXECUTION_SENTINEL])
      );
      const graph = new GPUCommandGraph<void>(this.device, {
        id: 'gpu-trace-critical-path-command-graph',
        autotuner: this.graphAutotuner
      });
      const parentHandle = importTraceBuffer(graph, 'critical-parent-spans', resources.parentSpans);
      const spanHandles = resources.spanChunks.map(chunk =>
        importTraceBuffer(graph, `critical-spans-${chunk.chunkIndex}`, chunk.buffer)
      );
      const outputHandles = Object.fromEntries(
        Object.entries(outputBuffers).map(([name, buffer]) => [
          name,
          importTraceBuffer(graph, `critical-${name}`, buffer)
        ])
      ) as Record<keyof typeof outputBuffers, GraphBufferHandle>;
      new GPUTraceCriticalPath({
        parentIndices: graph.createDataView(parentHandle, {
          format: 'uint32',
          length: resources.spanCount
        }),
        durations: makeTraceColumnVector(
          graph,
          'critical-span-durations',
          spanHandles,
          resources.spanChunks,
          'float32',
          1
        ),
        output: {
          pathDurations: graph.createDataView(outputHandles.pathDurations, {
            format: 'float32',
            length: resources.spanCount
          }),
          slackDurations: graph.createDataView(outputHandles.slackDurations, {
            format: 'float32',
            length: resources.spanCount
          }),
          criticalPredecessors: graph.createDataView(outputHandles.criticalPredecessors, {
            format: 'uint32',
            length: resources.spanCount
          }),
          rootIndices: graph.createDataView(outputHandles.rootIndices, {
            format: 'uint32',
            length: resources.spanCount
          }),
          hopCounts: graph.createDataView(outputHandles.hopCounts, {
            format: 'uint32',
            length: resources.spanCount
          }),
          criticalMask: graph.createDataView(outputHandles.criticalMask, {
            format: 'uint32',
            length: resources.spanCount
          }),
          summary: graph.createDataView(outputHandles.summary, {format: 'uint32', length: 4})
        }
      }).addToGraph(graph);
      compiled = graph.compile();
      if (resources !== this.resources || generation !== this.causalAnalysisGeneration) return;
      const completed = await executeGPUCommandGraphInFrames({
        device: this.device,
        compiled,
        budget: TRACE_ANALYSIS_EXECUTION_BUDGET,
        budgetController: this.causalExecutionBudgetController,
        isCurrent: () =>
          resources === this.resources && generation === this.causalAnalysisGeneration,
        onPlan: plan =>
          this.setCausalAnalysisStatus(
            `Planned ${formatCount(plan.stepCount)} bounded submissions${plan.oversizedStepCount > 0 ? ` · ${formatCount(plan.oversizedStepCount)} indivisible steps exceed a budget` : ''}.`
          ),
        onProgress: (progress, stepIndex, stepCount) =>
          this.setCausalAnalysisStatus(
            `Running pointer jumping and endpoint selection · step ${formatCount(stepIndex)}/${formatCount(stepCount)} · ${Math.round(progress * 100)}%`
          )
      });
      if (!completed) return;
      const bytes = await outputBuffers.summary.readAsync();
      if (resources !== this.resources || generation !== this.causalAnalysisGeneration) return;
      const summaryWords = new Uint32Array(bytes.buffer, bytes.byteOffset, 4);
      if (summaryWords[3] & CRITICAL_PATH_EXECUTION_SENTINEL) {
        throw new Error('the GPU command graph did not complete');
      }
      const maximumDuration = new Float32Array(Uint32Array.from([summaryWords[0]]).buffer)[0];
      const validation = formatCriticalPathValidation(summaryWords[3]);
      this.setCausalAnalysisStatus(
        `Longest parent path ${formatTraceDuration(maximumDuration)} · endpoint #${formatCount(summaryWords[1])} · ${formatCount(summaryWords[2])} hops · ${validation}. Compact summary read back; per-span outputs stayed GPU-resident for the analysis.`
      );
    } catch (error) {
      if (generation === this.causalAnalysisGeneration) {
        this.setCausalAnalysisStatus(
          `Critical-path graph failed validation: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } finally {
      compiled?.destroy();
      for (const buffer of Object.values(outputBuffers)) buffer.destroy();
    }
  }

  private setCausalAnalysisStatus(status: string): void {
    this.causalAnalysisStatus = status;
    if (this.causalAnalysisElement) this.causalAnalysisElement.textContent = status;
  }

  private async runAnomalyScoring(): Promise<void> {
    const resources = this.resources;
    if (!resources || resources.spanCount === 0) return;
    const generation = ++this.anomalyAnalysisGeneration;
    this.setAnomalyAnalysisStatus(
      `Preparing peer baselines and scoring ${formatCount(resources.spanCount)} spans…`
    );
    await waitForAnimationFrame();
    if (resources !== this.resources || generation !== this.anomalyAnalysisGeneration) return;

    const totalProfiledSpans = this.groupAggregationCounts.reduce((sum, count) => sum + count, 0);
    const errorStatusIndex = STATUS_NAMES.indexOf('error');
    const observedErrorRate =
      totalProfiledSpans > 0
        ? this.statusAggregationCounts[errorStatusIndex] / totalProfiledSpans
        : 0.02;
    const currentCounts = Uint32Array.from(this.groupAggregationCounts);
    const currentMeans = Float32Array.from(this.groupAggregationDurationMeans, mean =>
      Math.max(mean, 0.25)
    );
    const currentErrorRates = Float32Array.from([0.75, 1.4, 1.1], factor =>
      Math.min(observedErrorRate * factor, 1)
    );
    const durationRegressionFactors = [1.35, 0.92, 1.18];
    const volumeRegressionFactors = [1.08, 0.94, 1.22];
    const baselineMeans = Float32Array.from(
      currentMeans,
      (mean, groupIndex) => mean / durationRegressionFactors[groupIndex]
    );
    const baselineStandardDeviations = Float32Array.from(baselineMeans, mean =>
      Math.max(mean * 0.3, 0.25)
    );
    const baselineErrorRates = Float32Array.from(currentErrorRates, (rate, groupIndex) =>
      Math.max(rate - [0.01, 0.04, 0.015][groupIndex], 0)
    );
    const baselineCounts = Uint32Array.from(currentCounts, (count, groupIndex) =>
      Math.max(Math.round(count / volumeRegressionFactors[groupIndex]), 1)
    );
    const outputBuffers = {
      scores: this.createStorageBuffer(
        'gpu-trace-anomaly-scores',
        resources.spanCount * UINT32_BYTE_LENGTH
      ),
      anomalyMask: this.createStorageBuffer(
        'gpu-trace-anomaly-mask',
        resources.spanCount * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      summary: this.createStorageBuffer(
        'gpu-trace-anomaly-summary',
        4 * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC | Buffer.COPY_DST
      ),
      comparisonCountDeltas: this.createStorageBuffer(
        'gpu-trace-comparison-count-deltas',
        TRACE_GROUPS.length * UINT32_BYTE_LENGTH
      ),
      comparisonDurationDeltas: this.createStorageBuffer(
        'gpu-trace-comparison-duration-deltas',
        TRACE_GROUPS.length * UINT32_BYTE_LENGTH
      ),
      comparisonDurationRatios: this.createStorageBuffer(
        'gpu-trace-comparison-duration-ratios',
        TRACE_GROUPS.length * UINT32_BYTE_LENGTH
      ),
      comparisonErrorDeltas: this.createStorageBuffer(
        'gpu-trace-comparison-error-deltas',
        TRACE_GROUPS.length * UINT32_BYTE_LENGTH
      ),
      comparisonScores: this.createStorageBuffer(
        'gpu-trace-comparison-scores',
        TRACE_GROUPS.length * UINT32_BYTE_LENGTH
      ),
      comparisonMask: this.createStorageBuffer(
        'gpu-trace-comparison-mask',
        TRACE_GROUPS.length * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      comparisonSummary: this.createStorageBuffer(
        'gpu-trace-comparison-summary',
        4 * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC | Buffer.COPY_DST
      ),
      currentCounts: this.device.createBuffer({
        id: 'gpu-trace-comparison-current-counts',
        data: currentCounts,
        usage: Buffer.STORAGE
      }),
      currentMeans: this.device.createBuffer({
        id: 'gpu-trace-comparison-current-means',
        data: currentMeans,
        usage: Buffer.STORAGE
      }),
      currentErrorRates: this.device.createBuffer({
        id: 'gpu-trace-comparison-current-error-rates',
        data: currentErrorRates,
        usage: Buffer.STORAGE
      }),
      baselineCounts: this.device.createBuffer({
        id: 'gpu-trace-comparison-baseline-counts',
        data: baselineCounts,
        usage: Buffer.STORAGE
      }),
      baselineMeans: this.device.createBuffer({
        id: 'gpu-trace-anomaly-baseline-means',
        data: baselineMeans,
        usage: Buffer.STORAGE
      }),
      baselineStandardDeviations: this.device.createBuffer({
        id: 'gpu-trace-anomaly-baseline-deviations',
        data: baselineStandardDeviations,
        usage: Buffer.STORAGE
      }),
      baselineErrorRates: this.device.createBuffer({
        id: 'gpu-trace-anomaly-baseline-error-rates',
        data: baselineErrorRates,
        usage: Buffer.STORAGE
      })
    };
    let compiled: CompiledGPUCommandGraph<void> | null = null;
    try {
      outputBuffers.summary.write(
        Uint32Array.from([0, 0, TRACE_INVALID_SPAN_INDEX, CRITICAL_PATH_EXECUTION_SENTINEL])
      );
      outputBuffers.comparisonSummary.write(
        Uint32Array.from([0, 0, TRACE_INVALID_SPAN_INDEX, CRITICAL_PATH_EXECUTION_SENTINEL])
      );
      const graph = new GPUCommandGraph<void>(this.device, {
        id: 'gpu-trace-anomaly-command-graph',
        autotuner: this.graphAutotuner
      });
      const spanHandles = resources.spanChunks.map(chunk =>
        importTraceBuffer(graph, `anomaly-spans-${chunk.chunkIndex}`, chunk.buffer)
      );
      const errorMaskHandles = resources.spanChunks.map(chunk =>
        graph.createTransientBuffer({
          id: `anomaly-errors-${chunk.chunkIndex}`,
          byteLength: chunk.spanCount * UINT32_BYTE_LENGTH,
          usage: Buffer.STORAGE
        })
      );
      resources.spanChunks.forEach((chunk, chunkIndex) => {
        addTraceComputePass(graph, {
          id: `trace-anomaly-error-mask-${chunkIndex}`,
          source: getAnomalyErrorMaskShader(chunk.spanCount, errorStatusIndex),
          bindings: [
            {
              name: 'spans',
              buffer: spanHandles[chunkIndex],
              type: 'storage',
              usage: 'storage-read'
            },
            {
              name: 'errorMask',
              buffer: errorMaskHandles[chunkIndex],
              type: 'storage',
              usage: 'storage-write'
            }
          ],
          length: chunk.spanCount
        });
      });
      const importedBuffers = Object.fromEntries(
        Object.entries(outputBuffers).map(([name, buffer]) => [
          name,
          importTraceBuffer(graph, `anomaly-${name}`, buffer)
        ])
      ) as Record<keyof typeof outputBuffers, GraphBufferHandle>;
      const comparisonView = <T extends 'uint32' | 'float32'>(
        name: keyof typeof outputBuffers,
        format: T,
        length: number = TRACE_GROUPS.length
      ): GraphDataView<T> =>
        graph.createDataView(importedBuffers[name], {
          format,
          length
        }) as GraphDataView<T>;
      new GPUTraceComparison({
        id: 'trace-baseline-comparison',
        current: {
          counts: comparisonView('currentCounts', 'uint32'),
          durationMeans: comparisonView('currentMeans', 'float32'),
          errorRates: comparisonView('currentErrorRates', 'float32')
        },
        baseline: {
          counts: comparisonView('baselineCounts', 'uint32'),
          durationMeans: comparisonView('baselineMeans', 'float32'),
          errorRates: comparisonView('baselineErrorRates', 'float32')
        },
        durationWeight: 1,
        errorWeight: 2,
        threshold: 0.25,
        output: {
          countDeltas: comparisonView('comparisonCountDeltas', 'float32'),
          durationDeltas: comparisonView('comparisonDurationDeltas', 'float32'),
          durationRatios: comparisonView('comparisonDurationRatios', 'float32'),
          errorRateDeltas: comparisonView('comparisonErrorDeltas', 'float32'),
          scores: comparisonView('comparisonScores', 'float32'),
          regressionMask: comparisonView('comparisonMask', 'uint32'),
          summary: comparisonView('comparisonSummary', 'uint32', 4)
        }
      }).addToGraph(graph);
      new GPUTraceAnomalyScoring({
        groupIndices: makeTraceColumnVector(
          graph,
          'anomaly-group-indices',
          spanHandles,
          resources.spanChunks,
          'uint32',
          3
        ),
        durations: makeTraceColumnVector(
          graph,
          'anomaly-durations',
          spanHandles,
          resources.spanChunks,
          'float32',
          1
        ),
        errorMask: makeTraceGraphVector(
          'anomaly-error-mask',
          errorMaskHandles.map((handle, chunkIndex) =>
            graph.createDataView(handle, {
              format: 'uint32',
              length: resources.spanChunks[chunkIndex].spanCount
            })
          )
        ),
        baselineDurationMeans: graph.createDataView(importedBuffers.baselineMeans, {
          format: 'float32',
          length: TRACE_GROUPS.length
        }),
        baselineDurationStandardDeviations: graph.createDataView(
          importedBuffers.baselineStandardDeviations,
          {format: 'float32', length: TRACE_GROUPS.length}
        ),
        baselineErrorRates: graph.createDataView(importedBuffers.baselineErrorRates, {
          format: 'float32',
          length: TRACE_GROUPS.length
        }),
        threshold: 3,
        errorWeight: 1.5,
        output: {
          scores: graph.createDataView(importedBuffers.scores, {
            format: 'float32',
            length: resources.spanCount
          }),
          anomalyMask: graph.createDataView(importedBuffers.anomalyMask, {
            format: 'uint32',
            length: resources.spanCount
          }),
          summary: graph.createDataView(importedBuffers.summary, {format: 'uint32', length: 4})
        }
      }).addToGraph(graph);
      compiled = graph.compile();
      if (resources !== this.resources || generation !== this.anomalyAnalysisGeneration) return;
      const completed = await executeGPUCommandGraphInFrames({
        device: this.device,
        compiled,
        budget: TRACE_ANALYSIS_EXECUTION_BUDGET,
        budgetController: this.anomalyExecutionBudgetController,
        isCurrent: () =>
          resources === this.resources && generation === this.anomalyAnalysisGeneration,
        onPlan: plan =>
          this.setAnomalyAnalysisStatus(
            `Planned ${formatCount(plan.stepCount)} bounded submissions${plan.oversizedStepCount > 0 ? ` · ${formatCount(plan.oversizedStepCount)} indivisible steps exceed a budget` : ''}.`
          ),
        onProgress: (progress, stepIndex, stepCount) =>
          this.setAnomalyAnalysisStatus(
            `Scoring peer deviations · step ${formatCount(stepIndex)}/${formatCount(stepCount)} · ${Math.round(progress * 100)}%`
          )
      });
      if (!completed) return;
      const [bytes, comparisonBytes, comparisonMaskBytes] = await Promise.all([
        outputBuffers.summary.readAsync(),
        outputBuffers.comparisonSummary.readAsync(),
        outputBuffers.comparisonMask.readAsync()
      ]);
      if (resources !== this.resources || generation !== this.anomalyAnalysisGeneration) return;
      const summaryWords = new Uint32Array(bytes.buffer, bytes.byteOffset, 4);
      const comparisonWords = new Uint32Array(
        comparisonBytes.buffer,
        comparisonBytes.byteOffset,
        4
      );
      if (summaryWords[3] & CRITICAL_PATH_EXECUTION_SENTINEL) {
        throw new Error('the GPU command graph did not complete');
      }
      if (comparisonWords[3] & CRITICAL_PATH_EXECUTION_SENTINEL) {
        throw new Error('the GPU comparison graph did not complete');
      }
      const masksPublished = await this.publishAnomalyMasks(resources, outputBuffers.anomalyMask);
      if (
        !masksPublished ||
        resources !== this.resources ||
        generation !== this.anomalyAnalysisGeneration
      ) {
        return;
      }
      const maximumScore = new Float32Array(Uint32Array.from([summaryWords[1]]).buffer)[0];
      const maximumGroupScore = new Float32Array(Uint32Array.from([comparisonWords[1]]).buffer)[0];
      const maximumGroupName = TRACE_GROUPS[comparisonWords[2]] ?? 'none';
      const comparisonMask = new Uint32Array(
        comparisonMaskBytes.buffer,
        comparisonMaskBytes.byteOffset,
        TRACE_GROUPS.length
      );
      this.regressionGroupMask = comparisonMask.reduce(
        (mask, value, groupIndex) => mask | (Number(value !== 0) << groupIndex),
        0
      );
      this.lastRenderSignature = '';
      this.setAnomalyAnalysisStatus(
        `${formatCount(comparisonWords[0])}/${TRACE_GROUPS.length} operation groups regressed and are highlighted · strongest ${maximumGroupName} (${maximumGroupScore.toFixed(2)}) · ${formatCount(summaryWords[0])} spans scored ≥ 3 · maximum ${maximumScore.toFixed(2)} at span #${formatCount(summaryWords[2])} · ${formatAnomalyValidation(summaryWords[3])}. The chunked per-span mask stays on the GPU; only compact summaries crossed to JavaScript.`
      );
    } catch (error) {
      if (generation === this.anomalyAnalysisGeneration) {
        this.setAnomalyAnalysisStatus(
          `Anomaly graph failed validation: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } finally {
      compiled?.destroy();
      for (const buffer of Object.values(outputBuffers)) buffer.destroy();
    }
  }

  private setAnomalyAnalysisStatus(status: string): void {
    this.anomalyAnalysisStatus = status;
    if (this.anomalyAnalysisElement) this.anomalyAnalysisElement.textContent = status;
  }

  private async publishAnomalyMasks(
    resources: TraceGraphResources,
    sourceMask: Buffer
  ): Promise<boolean> {
    if (resources !== this.resources) return false;
    const createdMasks = resources.anomalyMasks === null;
    if (createdMasks) {
      resources.anomalyMasks = resources.spanChunks.map(chunk =>
        this.createStorageBuffer(
          `gpu-trace-render-anomaly-mask-${chunk.chunkIndex}`,
          chunk.spanCount * UINT32_BYTE_LENGTH,
          Buffer.COPY_DST
        )
      );
    }
    const anomalyMasks = resources.anomalyMasks;
    if (!anomalyMasks) return false;
    const commandEncoder = this.device.createCommandEncoder();
    for (const chunk of resources.spanChunks) {
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: sourceMask,
        sourceOffset: chunk.firstSpanIndex * UINT32_BYTE_LENGTH,
        destinationBuffer: anomalyMasks[chunk.chunkIndex],
        size: chunk.spanCount * UINT32_BYTE_LENGTH
      });
    }
    this.device.submit(commandEncoder.finish());
    const queue = (
      this.device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
    ).handle?.queue;
    await queue?.onSubmittedWorkDone?.();
    if (resources !== this.resources) return false;
    if (createdMasks) {
      resources.renderBundle.destroy();
      resources.renderBundle = this.createRenderBundle(resources);
      this.updateAllocationStats(resources);
    }
    this.anomalyOverlayEnabled = true;
    const anomalyOverlayInput =
      this.dashboardElement?.querySelector<HTMLInputElement>('[data-anomaly-overlay]');
    if (anomalyOverlayInput) {
      anomalyOverlayInput.checked = true;
      anomalyOverlayInput.disabled = false;
    }
    return true;
  }

  private getRenderingControlsHtml(): string {
    return getTraceRenderingControlsHtml({
      overviewMode: this.overviewMode,
      dependencyRouting: this.dependencyRouting,
      dependencyDisplayBudget: this.dependencyDisplayBudget,
      dependencyDisplayBudgetOptions: TRACE_DEPENDENCY_DISPLAY_BUDGET_OPTIONS,
      densityPattern: this.densityPattern,
      autoScroll: this.autoScroll,
      labelsEnabled: this.labelsEnabled,
      minimapEnabled: this.minimapEnabled,
      lodFadeEnabled: this.lodFadeEnabled,
      anomalyOverlayEnabled: this.anomalyOverlayEnabled,
      anomalyOverlayAvailable: Boolean(this.resources?.anomalyMasks)
    });
  }

  private getAdvancedInteractionControlsHtml(): string {
    return getTraceAdvancedInteractionControlsHtml(this.pickingMode);
  }

  private getControlsHtml(): string {
    return getTraceDatasetControlsHtml({
      capacityOptions: this.capacityOptions,
      dependencyCapacityOptions: this.dependencyCapacityOptions,
      spanCapacity: this.spanCapacity,
      dependencyCapacity: this.dependencyCapacity,
      datasetStatus: this.datasetStatus,
      focusDepth: this.focusDepth,
      maximumFocusDepth: MAXIMUM_FOCUS_DEPTH,
      statusNames: STATUS_NAMES
    });
  }

  private getHierarchyHtml(): string {
    return getTraceHierarchyControlsHtml({
      processStates: this.processStates,
      threadStates: this.threadStates
    });
  }

  private bindPanelControls(root: HTMLElement): () => void {
    this.datasetStatusElement = root.querySelector('[data-dataset-status]');
    this.datasetPreflightElement = root.querySelector('[data-dataset-preflight]');
    this.datasetPreflightMessageElement = root.querySelector('[data-dataset-preflight-message]');
    this.setDatasetStatus(this.datasetStatus);
    this.setDatasetPreflight(null);
    const onChange = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
        return;
      }
      if (target instanceof HTMLSelectElement && event.type !== 'change') {
        return;
      }
      if (target.matches('[data-span-capacity]')) {
        this.requestRebuild(Number(target.value), this.dependencyCapacity);
        const dependencyCapacity = root.querySelector<HTMLSelectElement>(
          '[data-dependency-capacity]'
        );
        if (dependencyCapacity) {
          dependencyCapacity.value = String(this.dependencyCapacity);
        }
      } else if (target.matches('[data-dependency-capacity]')) {
        this.requestRebuild(this.spanCapacity, Number(target.value));
      } else if (target instanceof HTMLInputElement && target.dataset.group !== undefined) {
        const group = Number(target.dataset.group);
        this.enabledMask = setBit(this.enabledMask, group, target.checked);
      } else if (target instanceof HTMLInputElement && target.dataset.status !== undefined) {
        this.statusMask = setBit(this.statusMask, Number(target.dataset.status), target.checked);
      } else if (target.matches('[data-duration]')) {
        this.minimumDuration = Number(target.value);
        const label = root.querySelector('[data-duration-value]');
        if (label) {
          label.textContent = `${this.minimumDuration.toFixed(2)} ms`;
        }
      } else if (target instanceof HTMLInputElement && target.matches('[data-hide-runtime]')) {
        this.activeFilterMask = setMaskFlag(
          this.activeFilterMask,
          TRACE_FILTER_HIDE_RUNTIME_SPANS,
          target.checked
        );
      } else if (target instanceof HTMLInputElement && target.matches('[data-errors-only]')) {
        this.activeFilterMask = setMaskFlag(
          this.activeFilterMask,
          TRACE_FILTER_ERRORS_ONLY,
          target.checked
        );
      } else if (target instanceof HTMLInputElement && target.matches('[data-hide-overlapping]')) {
        this.activeFilterMask = setMaskFlag(
          this.activeFilterMask,
          TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
          target.checked
        );
      } else if (
        target instanceof HTMLInputElement &&
        target.matches('[data-hide-similar-parents]')
      ) {
        this.activeFilterMask = setMaskFlag(
          this.activeFilterMask,
          TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
          target.checked
        );
      } else if (target instanceof HTMLInputElement && target.matches('[data-same-dependencies]')) {
        this.dependencyMask = setBit(this.dependencyMask, 0, target.checked);
      } else if (
        target instanceof HTMLInputElement &&
        target.matches('[data-cross-dependencies]')
      ) {
        this.dependencyMask = setBit(this.dependencyMask, 1, target.checked);
      } else if (target.matches('[data-dependency-display-budget]')) {
        this.dependencyDisplayBudget = Number(target.value);
      } else if (target.matches('[data-focus-depth]')) {
        this.focusDepth = Number(target.value);
        this.resources?.focusTraversalState.write(Uint32Array.of(this.focusDepth));
        const label = root.querySelector('[data-focus-depth-value]');
        if (label) {
          label.textContent = String(this.focusDepth);
        }
      } else if (target instanceof HTMLInputElement && target.matches('[data-focus-only]')) {
        this.focusOnly = target.checked;
      } else if (target instanceof HTMLInputElement && target.matches('[data-auto-scroll]')) {
        this.autoScroll = target.checked;
      } else if (target instanceof HTMLInputElement && target.matches('[data-lod-fade]')) {
        this.lodFadeEnabled = target.checked;
      } else if (target instanceof HTMLInputElement && target.matches('[data-labels]')) {
        this.labelsEnabled = target.checked;
      } else if (target.matches('[data-overview-mode]')) {
        this.overviewMode = target.value as TraceOverviewMode;
      } else if (target.matches('[data-dependency-routing]')) {
        this.dependencyRouting = target.value as TraceDependencyRouting;
      } else if (target instanceof HTMLInputElement && target.matches('[data-minimap]')) {
        this.minimapEnabled = target.checked;
      } else if (target instanceof HTMLInputElement && target.matches('[data-anomaly-overlay]')) {
        this.anomalyOverlayEnabled = target.checked;
      } else if (target.matches('[data-picking-mode]')) {
        this.pickingMode = target.value as TracePickingMode;
        this.clearHoveredPick();
      } else if (target.matches('[data-density-pattern]')) {
        this.densityPattern = Number(target.value) as FillPatternType;
      }
      this.requestAggregationForCurrentScope();
      this.updateInspector();
    };
    const onClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest('[data-select-span]')) {
        const input = root.querySelector<HTMLInputElement>('[data-source-span]');
        this.setSelectedSpan(Number(input?.value ?? 0));
      } else if (target.closest('[data-clear-selection]')) {
        this.clearSelectedSpan();
      } else if (target.closest('[data-reset]')) {
        this.view = {
          timeMin: 0,
          timeMax: Math.min(150, this.traceDuration),
          laneMin: 0,
          laneMax: 72
        };
        this.autoScroll = false;
        const autoScroll = root.querySelector<HTMLInputElement>('[data-auto-scroll]');
        if (autoScroll) {
          autoScroll.checked = false;
        }
      } else if (target.closest('[data-fit-trace]')) {
        this.view = {
          timeMin: 0,
          timeMax: this.traceDuration,
          laneMin: 0,
          laneMax: this.getVisibleLaneCount()
        };
        this.autoScroll = false;
        const autoScroll = root.querySelector<HTMLInputElement>('[data-auto-scroll]');
        if (autoScroll) {
          autoScroll.checked = false;
        }
      } else if (target.closest('[data-confirm-dataset]')) {
        const pendingDatasetRequest = this.pendingDatasetRequest;
        if (pendingDatasetRequest) {
          this.rebuild(
            pendingDatasetRequest.spanCapacity,
            pendingDatasetRequest.dependencyCapacity
          );
        }
      } else if (target.closest('[data-cancel-dataset]')) {
        this.pendingDatasetRequest = null;
        this.setDatasetPreflight(null);
        const spanCapacity = root.querySelector<HTMLSelectElement>('[data-span-capacity]');
        const dependencyCapacity = root.querySelector<HTMLSelectElement>(
          '[data-dependency-capacity]'
        );
        if (spanCapacity) {
          spanCapacity.value = String(this.spanCapacity);
        }
        if (dependencyCapacity) {
          dependencyCapacity.value = String(this.dependencyCapacity);
        }
      }
    };
    root.addEventListener('change', onChange);
    root.addEventListener('input', onChange);
    root.addEventListener('click', onClick);
    return () => {
      this.datasetStatusElement = null;
      this.datasetPreflightElement = null;
      this.datasetPreflightMessageElement = null;
      root.removeEventListener('change', onChange);
      root.removeEventListener('input', onChange);
      root.removeEventListener('click', onClick);
    };
  }

  private bindHierarchyControls(root: HTMLElement): () => void {
    const onChange = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      if (target.dataset.process !== undefined) {
        const processIndex = Number(target.dataset.process);
        this.processStates[processIndex] = target.checked
          ? TRACE_EXPANDED_STATE
          : TRACE_COLLAPSED_STATE;
        this.resources?.processStates.write(
          Uint32Array.from([this.processStates[processIndex]]),
          processIndex * UINT32_BYTE_LENGTH
        );
      } else if (target.dataset.thread !== undefined) {
        const threadIndex = Number(target.dataset.thread);
        this.threadStates[threadIndex] = target.checked
          ? TRACE_EXPANDED_STATE
          : TRACE_COLLAPSED_STATE;
        this.resources?.threadStates.write(
          Uint32Array.from([this.threadStates[threadIndex]]),
          threadIndex * UINT32_BYTE_LENGTH
        );
      }
      this.updateInspector();
    };
    const onClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const expand = target.closest('[data-expand-all]');
      const collapse = target.closest('[data-collapse-all]');
      if (!expand && !collapse) {
        return;
      }
      const state = expand ? TRACE_EXPANDED_STATE : TRACE_COLLAPSED_STATE;
      this.processStates.fill(state);
      this.resources?.processStates.write(this.processStates);
      for (const input of root.querySelectorAll<HTMLInputElement>('[data-process]')) {
        input.checked = Boolean(expand);
      }
      this.updateInspector();
    };
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('change', onChange);
      root.removeEventListener('click', onClick);
    };
  }

  private updateInspector(): void {
    const resources = this.resources;
    const stats = resources?.compiled.stats;
    if (!stats || !resources) {
      return;
    }
    if (this.frameStatsElement) {
      const preflight = resources.compiled.preflight;
      const computeDispatchCount = preflight.nodes
        .filter(node => node.type === 'compute')
        .reduce((total, node) => total + node.commandCount, 0);
      const drawCallCount = preflight.nodes
        .filter(node => node.type === 'render')
        .reduce((total, node) => total + node.commandCount, 0);
      const invocationNodeCount = preflight.nodes.filter(
        node => node.maximumInvocationCount > 0
      ).length;
      const framesPerSecond = this.gpuFrameTimeMilliseconds
        ? 1000 / this.gpuFrameTimeMilliseconds
        : 0;
      this.frameStatsElement.innerHTML = `
        ${makeMetricCard('GPU FPS', framesPerSecond ? framesPerSecond.toFixed(framesPerSecond >= 10 ? 0 : 1) : '—', this.gpuFrameInFlight ? 'frame in flight' : `${this.gpuFrameTimeMilliseconds.toFixed(1)} ms paced frame`)}
        ${makeMetricCard('Shader invocations', `≤ ${formatSI(preflight.maximumInvocationCount)}`, `${invocationNodeCount}/${preflight.nodes.length} bounded nodes · fragment excluded`, `≤ ${formatCount(preflight.maximumInvocationCount)}`)}
        ${makeMetricCard('Draw calls', formatCount(drawCallCount), 'per graph frame')}
        ${makeMetricCard('Compute dispatches', formatCount(computeDispatchCount), `${formatCount(preflight.conditionalNodeCount)} GPU-conditioned · per graph frame`)}`;
    }
    if (this.capacityElement) {
      const capacityContract = getTraceCapacityContract(
        this.spanCapacity,
        this.dependencyCapacity,
        this.device.limits
      );
      this.capacityElement.innerHTML = `
        ${makeMetricCard('Trace spans', formatCount(this.spanCapacity), formatTraceDuration(this.traceDuration))}
        ${makeMetricCard('Dependencies', formatCount(resources.dependencyCount), `${formatCount(this.dependencyCapacity)} capacity`)}
        ${makeMetricCard('Persistent GPU', formatBytes(this.allocationStats.persistentByteLength), `${formatCount(this.allocationStats.bufferCount)} buffers`)}
        ${makeMetricCard('Graph compile', `#${this.compileCount}`, `${this.compileTimeMilliseconds.toFixed(1)} ms`)}
        ${makeMetricCard('Span chunks', formatCount(resources.spanChunks.length), `largest ${formatBytes(this.allocationStats.largestBufferByteLength)}`)}
        ${makeMetricCard('Dependency chunks', formatCount(resources.dependencyChunks.length), `${formatCount(TRACE_DEPENDENCY_FRAME_BATCH_BUDGET)} batch frame budget`)}
        ${makeMetricCard('Adjacency chunks', formatCount(resources.outgoingAdjacencyChunks.length + resources.incomingAdjacencyChunks.length), 'outgoing + incoming CSR')}
        ${makeMetricCard('Focus frontier', formatCount(resources.focusFrontierCapacity), 'bounded rows with overflow reporting')}
        ${makeMetricCard('Device contract', capacityContract.fitsChunkedDeviceLimits ? 'Fits' : 'Exceeds', formatBytes(this.device.limits.maxStorageBufferBindingSize))}`;
    }
    if (this.aggregationElement) {
      const totalCount = this.groupAggregationCounts.reduce((sum, count) => sum + count, 0);
      this.aggregationElement.innerHTML = TRACE_GROUPS.map((group, groupIndex) => {
        const count = this.groupAggregationCounts[groupIndex];
        const share = totalCount > 0 ? count / totalCount : 0;
        return `<article class="trace-group-row" style="--trace-group-color:${TRACE_GROUP_COLORS[groupIndex]}">
          <div class="trace-group-heading"><span><i></i>${group}</span><strong>${formatCount(count)}</strong></div>
          <div class="trace-group-track"><span style="width:${(share * 100).toFixed(2)}%"></span></div>
          <div class="trace-group-details"><span>${(share * 100).toFixed(1)}% of selected spans</span><span>${formatTraceDuration(this.groupAggregationDurationSums[groupIndex])} total</span><span>${formatTraceDuration(this.groupAggregationDurationMeans[groupIndex])} mean</span></div>
        </article>`;
      }).join('');
    }
    if (this.statusAggregationElement) {
      const totalCount = this.statusAggregationCounts.reduce((sum, count) => sum + count, 0);
      this.statusAggregationElement.innerHTML = STATUS_NAMES.map((status, statusIndex) => {
        const count = this.statusAggregationCounts[statusIndex];
        const share = totalCount > 0 ? count / totalCount : 0;
        return `<article class="trace-status-card" style="--trace-status-color:${TRACE_STATUS_COLORS[statusIndex]}">
          <span><i></i>${status}</span>
          <strong>${formatCount(count)}</strong>
          <small>${(share * 100).toFixed(1)}%</small>
        </article>`;
      }).join('');
    }
    if (this.operationAggregationElement) {
      const totalCount = this.operationAggregationCounts.reduce((sum, count) => sum + count, 0);
      this.operationAggregationElement.innerHTML = TRACE_LABEL_DICTIONARY.map(
        (operation, operationIndex) => {
          const count = this.operationAggregationCounts[operationIndex];
          const share = totalCount > 0 ? count / totalCount : 0;
          const groupIndex = Math.floor(operationIndex / TRACE_STATUS_COUNT);
          return `<article class="trace-status-card" style="--trace-status-color:${TRACE_GROUP_COLORS[groupIndex]}">
            <span title="${operation}"><i></i>${operation}</span>
            <strong>${formatCount(count)}</strong>
            <small>${(share * 100).toFixed(1)}%</small>
          </article>`;
        }
      ).join('');
    }
    if (this.aggregationSummaryElement) {
      const totalCount = this.groupAggregationCounts.reduce((sum, count) => sum + count, 0);
      const totalDuration = this.groupAggregationDurationSums.reduce(
        (sum, duration) => sum + duration,
        0
      );
      const totalOccupiedLaneTime = this.timeBucketDurations.reduce(
        (sum, duration) => sum + duration,
        0
      );
      const totalIdleLaneTime = this.timeBucketIdleLaneTime.reduce(
        (sum, duration) => sum + duration,
        0
      );
      const errorCount = this.statusAggregationCounts[STATUS_NAMES.indexOf('error')];
      const errorRate = totalCount > 0 ? errorCount / totalCount : 0;
      const busiestProcessIndex = getMaximumValueIndex(this.processAggregationCounts);
      const busiestThreadIndex = getMaximumValueIndex(this.threadAggregationCounts);
      const busiestOperationIndex = getMaximumValueIndex(this.operationAggregationCounts);
      const busiestThreadProcessIndex = Math.floor(busiestThreadIndex / TRACE_THREADS_PER_PROCESS);
      const busiestLocalThreadIndex = busiestThreadIndex % TRACE_THREADS_PER_PROCESS;
      this.aggregationSummaryElement.innerHTML = `
        ${makeMetricCard('Matched spans', formatCount(totalCount), 'GPU interval mask')}
        ${makeMetricCard('Span duration', formatTraceDuration(totalDuration), 'full duration of intersecting spans')}
        ${makeMetricCard('Active lane-time', formatTraceDuration(totalOccupiedLaneTime), 'clipped to analysis interval')}
        ${makeMetricCard('Idle lane-time', formatTraceDuration(totalIdleLaneTime), `${formatCount(TRACE_LANE_COUNT)} lane capacity`)}
        ${makeMetricCard('Error rate', `${(errorRate * 100).toFixed(2)}%`, `${formatCount(errorCount)} error spans`)}
        ${makeMetricCard('Busiest process', `P${String(busiestProcessIndex).padStart(2, '0')}`, `${formatCount(this.processAggregationCounts[busiestProcessIndex])} filtered spans`)}
        ${makeMetricCard('Busiest thread', `P${String(busiestThreadProcessIndex).padStart(2, '0')} · T${busiestLocalThreadIndex}`, `${formatCount(this.threadAggregationCounts[busiestThreadIndex])} filtered spans`)}
        ${makeMetricCard('Top operation', TRACE_LABEL_DICTIONARY[busiestOperationIndex], `${formatCount(this.operationAggregationCounts[busiestOperationIndex])} filtered spans`)}
        ${makeMetricCard('Chart buckets', formatCount(TRACE_DURATION_HISTOGRAM_BIN_COUNT + TRACE_TIME_BUCKET_COUNT), 'duration + trace time')}
        ${makeMetricCard('CPU readback', formatBytes(TRACE_ANALYTICS_OUTPUT.byteLength), 'all analytical results')}`;
    }
    if (this.durationHistogramElement) {
      const maximumCount = Math.max(...this.durationHistogramCounts, 1);
      this.durationHistogramElement.innerHTML = this.durationHistogramCounts
        .map((count, bucketIndex) => {
          const minimum = TRACE_DURATION_HISTOGRAM_EDGES[bucketIndex];
          const maximum = TRACE_DURATION_HISTOGRAM_EDGES[bucketIndex + 1];
          const selected = this.minimumDuration >= minimum && this.minimumDuration < maximum;
          return `<button type="button" class="trace-analysis-row" data-analysis-duration="${minimum}" aria-pressed="${selected}" title="Show spans at least ${minimum} ms long">
            <span class="trace-analysis-label">${formatDurationRange(minimum, maximum)}</span>
            <span class="trace-analysis-track"><span style="width:${((count / maximumCount) * 100).toFixed(2)}%"></span></span>
            <strong>${formatCount(count)}</strong>
          </button>`;
        })
        .join('');
    }
    if (this.analysisWindowElement) {
      const scopeLabel =
        this.analysisScope === 'trace'
          ? 'entire trace'
          : this.analysisScope === 'viewport'
            ? 'visible viewport · temporal candidates'
            : 'measured interval';
      const updateLabel = this.aggregationExecution
        ? ` · background priority · planned step ${this.aggregationStepIndex}/${this.aggregationStepCount} · ${Math.round(this.aggregationProgress * 100)}%${this.aggregationPublication === 'none' ? '' : ` · ${this.aggregationPublication} published`}${this.aggregationOversizedStepCount > 0 ? ` · ${this.aggregationOversizedStepCount} oversized` : ''}`
        : this.aggregationInFlight || this.pendingAggregationWindow
          ? ' · updating…'
          : '';
      this.analysisWindowElement.textContent = `${scopeLabel} · ${formatTraceDuration(this.aggregationTimeMinimum)}–${formatTraceDuration(this.aggregationTimeMaximum)}${updateLabel}`;
    }
    if (this.utilizationElement) {
      const bucketDuration =
        (this.aggregationTimeMaximum - this.aggregationTimeMinimum) / TRACE_TIME_BUCKET_COUNT;
      this.utilizationElement.innerHTML = this.timeBucketDurations
        .map((duration, bucketIndex) => {
          const averageConcurrency = this.timeBucketConcurrency[bucketIndex];
          const utilization = this.timeBucketUtilization[bucketIndex];
          const idleLaneTime = this.timeBucketIdleLaneTime[bucketIndex];
          const timeMinimum = this.aggregationTimeMinimum + bucketIndex * bucketDuration;
          const timeMaximum = timeMinimum + bucketDuration;
          return `<button type="button" data-analysis-time="${bucketIndex}" title="${formatTraceDuration(timeMinimum)}–${formatTraceDuration(timeMaximum)} · ${(utilization * 100).toFixed(1)}% lane utilization · ${averageConcurrency.toFixed(1)} average concurrency · ${formatTraceDuration(duration)} active lane-time · ${formatTraceDuration(idleLaneTime)} idle lane-time · ${formatCount(this.timeBucketCounts[bucketIndex])} intersecting spans" aria-label="Zoom to trace-time bucket ${bucketIndex + 1}">
            <span style="height:${Math.max(utilization * 100, 2).toFixed(2)}%"></span>
          </button>`;
        })
        .join('');
    }
    if (this.selectionElement) {
      this.selectionElement.textContent =
        this.selectedSpanIndex === INVALID_SPAN_INDEX
          ? 'No span selected; click a span or enter its source ID.'
          : `Selected source span ${formatCount(this.selectedSpanIndex)} · ${this.focusDepth} dependency hops`;
    }
    if (this.statsElement) {
      const visible = this.sampledVisibleCounts.reduce((sum, count) => sum + count, 0);
      const scanTiming = getTraceScanTimingSummary(
        this.graphInspector.getSnapshot(),
        resources.compiled.id
      );
      const overviewRenderer = this.getOverviewRenderer(this.viewportWidth);
      const overviewTiming = getTraceOverviewFrameTimingSummary(
        this.overviewFrameTimeSamples[overviewRenderer]
      );
      const dependencyBundlingEnabled = isTraceDependencyBundlingEnabled(
        this.view.timeMin,
        this.view.timeMax,
        this.viewportWidth,
        this.dependencyRouting
      );
      const overviewPixelCount = Math.min(
        Math.max(Math.ceil(this.viewportWidth), 1),
        TRACE_REPRESENTATIVE_MAXIMUM_PIXEL_COUNT
      );
      const overviewOutputCount =
        overviewRenderer === 'representative'
          ? TRACE_LANE_COUNT * overviewPixelCount
          : overviewRenderer === 'density'
            ? TRACE_DISPLAY_LANE_CAPACITY * TRACE_DENSITY_BIN_COUNT
            : visible;
      const collapsedProcessCount = this.processStates.filter(
        state => state === TRACE_COLLAPSED_STATE
      ).length;
      if (this.overviewComparisonElement) {
        const formatTiming = (renderer: TraceOverviewRenderer): string => {
          const timing = getTraceOverviewFrameTimingSummary(
            this.overviewFrameTimeSamples[renderer]
          );
          return timing
            ? `${timing.p50Milliseconds.toFixed(1)} / ${timing.p95Milliseconds.toFixed(1)} ms · ${timing.sampleCount} samples`
            : 'collecting requested frames';
        };
        this.overviewComparisonElement.innerHTML = `<div class="trace-detail-grid" style="margin-top:8px">
          <span>Effective renderer</span><strong>${overviewRenderer === 'representative' ? 'Representative spans' : overviewRenderer === 'density' ? 'Density aggregation' : 'Exact spans'}</strong>
          <span>Exact p50 / p95</span><strong>${formatTiming('exact')}</strong>
          <span>Representative p50 / p95</span><strong>${formatTiming('representative')}</strong>
          <span>Density p50 / p95</span><strong>${formatTiming('density')}</strong>
        </div>`;
      }
      this.statsElement.innerHTML = `<div class="trace-metric-grid">
        ${makeMetricCard('Exact spans', formatCount(visible), 'sampled visible')}
        ${makeMetricCard('Overview output', `${overviewRenderer === 'representative' ? '≤ ' : ''}${formatSI(overviewOutputCount)}`, overviewRenderer === 'representative' ? `${formatCount(overviewPixelCount)} px × ${formatCount(TRACE_LANE_COUNT)} lanes` : overviewRenderer === 'density' ? `${formatCount(TRACE_DENSITY_BIN_COUNT)} bins × ${formatCount(TRACE_DISPLAY_LANE_CAPACITY)} lanes` : 'sampled exact rectangles', `${overviewRenderer === 'representative' ? '≤ ' : ''}${formatCount(overviewOutputCount)}`)}
        ${makeMetricCard('Overview frame', overviewTiming ? `${overviewTiming.p50Milliseconds.toFixed(1)} / ${overviewTiming.p95Milliseconds.toFixed(1)} ms` : 'Collecting', `${overviewRenderer} p50 / p95 · ${overviewTiming?.sampleCount ?? 0} samples`)}
        ${makeMetricCard('Label glyphs', formatCount(this.sampledLabelGlyphCount), this.labelsEnabled ? 'fitted and GPU-culled' : 'disabled')}
        ${makeMetricCard('Visible edges', formatCount(this.sampledDependencyCount), `${dependencyBundlingEnabled ? 'bundled corridors' : 'exact lines'} · ${formatSI(this.effectiveDependencyDisplayBudget)} / ${formatSI(this.dependencyDisplayBudget)} zoom · max`)}
        ${makeMetricCard('Span batches', `${formatCount(this.sampledCandidateBatchCount)}/${formatCount(resources.spanBatchCount)}`, 'candidate / total')}
        ${makeMetricCard('Edge batches', `${formatCount(this.sampledCandidateDependencyBatchCount)}/${formatCount(resources.dependencyBatchCount)}`, `admitted / total · ${formatCount(TRACE_DEPENDENCY_FRAME_BATCH_BUDGET)} budget`)}
        ${makeMetricCard('CPU encode', `${this.encodeTimeMilliseconds.toFixed(2)} ms`, 'compiled graph')}
        ${makeMetricCard('Picking', this.pickingMode === 'raster' ? 'Framebuffer ID' : 'Analytical', this.pickingMode === 'raster' ? 'pixel exact · shared span + edge target' : '6 px edge tolerance · full metadata')}
        ${makeMetricCard('Trace LOD', overviewRenderer === 'representative' ? 'Representative spans' : overviewRenderer === 'density' ? 'Density aggregation' : 'Exact', `${overviewRenderer === 'representative' ? 'galloping search · longest per lane/pixel' : overviewRenderer === 'density' ? `${getDensityPatternLabel(this.densityPattern)} + wide spans` : 'individual spans'} · ${this.lodFadeEnabled ? 'smooth fade' : 'hard switch'}`)}
        ${makeMetricCard('Layout lanes', formatCount(this.getVisibleLaneCount()), `${formatCount(collapsedProcessCount)} collapsed processes`)}
        ${makeMetricCard('Focus traversal', this.sampledFocusOverflowCount > 0 ? 'Incomplete' : 'Exact', this.sampledFocusOverflowCount > 0 ? `${formatCount(this.sampledFocusOverflowCount)} rows exceeded frontier` : `${formatCount(resources.focusFrontierCapacity)} row frontier`)}
        ${makeMetricCard('Transient reuse', `${stats.reusePercentage.toFixed(0)}%`, `${stats.physicalTransientBufferCount}/${stats.logicalTransientBufferCount} allocations`)}
      </div>
      <div class="trace-detail-grid">
        <span>Readback slots</span><strong>${resources.readbackRing.availableSlotCount}/${resources.readbackRing.slotCount}</strong>
        <span>Dropped telemetry</span><strong>${formatCount(this.droppedTelemetrySampleCount)}</strong>
        <span>Deferred pick frames</span><strong>${formatCount(this.deferredPickFrameCount)}</strong>
        <span>Adapter / timestamp queries</span><strong>${resources.compiled.capabilities.softwareAdapter ? 'software' : 'hardware'} · ${resources.compiled.capabilities.timestampQueries ? 'available' : 'unavailable'}</strong>
        <span>Prefix scans</span><strong>${[...new Set(resources.compiled.preflight.nodes.filter(node => node.operation === 'GPUScan' && node.variant).map(node => node.variant))].join(' + ') || 'portable'} · adapter-selected</strong>
        <span>Scan GPU p50 / p95</span><strong>${scanTiming ? `${scanTiming.p50Milliseconds.toFixed(3)} / ${scanTiming.p95Milliseconds.toFixed(3)} ms · ${scanTiming.sampleCount} samples` : 'collecting'}</strong>
        <span>Overview frame samples</span><strong>exact ${this.overviewFrameTimeSamples.exact.length} · density ${this.overviewFrameTimeSamples.density.length} · representatives ${this.overviewFrameTimeSamples.representative.length}</strong>
        <span>Logical / owned resources</span><strong>${formatBytes(stats.logicalResourceBytes)} / ${formatBytes(stats.physicalTransientResourceBytes)}</strong>
        <span>Logical / physical scratch</span><strong>${formatBytes(stats.logicalTransientBytes)} / ${formatBytes(stats.physicalTransientBytes)}</strong>
        <span>Storage binding / max buffer</span><strong>${formatBytes(this.device.limits.maxStorageBufferBindingSize)} / ${formatBytes(this.device.limits.maxBufferSize)}</strong>
      </div>`;
    }
    if (this.plannerBudgetElement) {
      const makeBudgetValue = (controller: GPUCommandGraphExecutionBudgetController): string =>
        `${controller.latencyPriority} · ≤ ${formatSI(controller.budget.maximumInvocationCount)} invocations · ${controller.targetStepMilliseconds} ms target · ${controller.sampleCount} samples`;
      const autotuningProfile = this.graphAutotuner.exportProfile();
      const calibrationSampleCount = autotuningProfile.calibrations.reduce(
        (sum, calibration) => sum + calibration.sampleCount,
        0
      );
      this.plannerBudgetElement.innerHTML = `
        <span>Adapter kernel calibration</span><strong>${formatCount(autotuningProfile.calibrations.length)} buckets · ${formatCount(calibrationSampleCount)} GPU samples</strong>
        <span>Index construction</span><strong>${makeBudgetValue(this.indexExecutionBudgetController)}</strong>
        <span>Full-trace analytics</span><strong>${makeBudgetValue(this.aggregationExecutionBudgetController)}</strong>
        <span>Critical path</span><strong>${makeBudgetValue(this.causalExecutionBudgetController)}</strong>
        <span>Comparison + anomalies</span><strong>${makeBudgetValue(this.anomalyExecutionBudgetController)}</strong>`;
    }
    this.inspectorPanel?.update(this.graphInspector.getSnapshot(), resources.compiled.id);
  }

  private recordWorkloadCounters(pickActive = this.pendingPick !== null): void {
    const resources = this.resources;
    const observation = this.graphObservation;
    if (!resources || !observation) {
      return;
    }
    const overviewRenderer = this.getOverviewRenderer(this.viewportWidth);
    const overviewPixelCount = Math.min(
      Math.max(Math.ceil(this.viewportWidth), 1),
      TRACE_REPRESENTATIVE_MAXIMUM_PIXEL_COUNT
    );
    observation.recordCounters(
      getTraceWorkloadCounters({
        spanCount: resources.spanCount,
        dependencyCount: resources.dependencyCount,
        spanBatchCount: resources.spanBatchCount,
        candidateSpanBatchCount: this.sampledCandidateBatchCount,
        dependencyBatchCount: resources.dependencyBatchCount,
        candidateDependencyBatchCount: this.sampledCandidateDependencyBatchCount,
        visibleSpanCount: this.sampledVisibleCounts.reduce((sum, count) => sum + count, 0),
        visibleDependencyCount: this.sampledDependencyCount,
        collapsedProcessCount: this.processStates.filter(state => state === TRACE_COLLAPSED_STATE)
          .length,
        densityMode: overviewRenderer === 'density',
        overviewRenderer,
        overviewLaneCount: TRACE_LANE_COUNT,
        overviewPixelCount,
        overviewSpanChunkCount: resources.spanChunks.length,
        filterActive:
          this.activeFilterMask !== 0 ||
          this.minimumDuration > 0 ||
          this.enabledMask !== 0b111 ||
          this.statusMask !== (1 << TRACE_STATUS_COUNT) - 1,
        focusActive: this.focusOnly && this.selectedSpanIndex !== INVALID_SPAN_INDEX,
        pickActive,
        maximumInvocationCount: resources.compiled.preflight.maximumInvocationCount,
        allocation: this.allocationStats
      })
    );
  }

  private scheduleGPUTimingReadback(
    observation: GPUCommandGraphInspectorObservation<TraceViewParameters>,
    encoding: GPUCommandGraphEncoding
  ): void {
    const timer = setTimeout(() => {
      this.gpuTimingReadbackTimers.delete(timer);
      if (this.graphObservation !== observation) {
        return;
      }
      void observation.recordGPUTimings(encoding).then(timingReport => {
        if (this.graphObservation === observation) {
          if (
            timingReport &&
            observation.graph.preflight &&
            this.graphAutotuner.observeTimingReport(timingReport, observation.graph.preflight) > 0
          ) {
            storeTraceAutotuningProfile(this.graphAutotuner.exportProfile());
          }
          this.updateInspector();
        }
      });
    }, 0);
    this.gpuTimingReadbackTimers.add(timer);
  }

  private getVisibleLaneCount(): number {
    let laneCount = 0;
    for (let processIndex = 0; processIndex < TRACE_PROCESS_COUNT; processIndex++) {
      if (this.processStates[processIndex] === TRACE_COLLAPSED_STATE) {
        laneCount += 1 + TRACE_THREAD_GAP_LANE_COUNT;
        if (processIndex + 1 < TRACE_PROCESS_COUNT) {
          laneCount += TRACE_PROCESS_GAP_LANE_COUNT;
        }
        continue;
      }
      for (
        let localThreadIndex = 0;
        localThreadIndex < TRACE_THREADS_PER_PROCESS;
        localThreadIndex++
      ) {
        const threadIndex = processIndex * TRACE_THREADS_PER_PROCESS + localThreadIndex;
        laneCount +=
          (this.threadStates[threadIndex] === TRACE_EXPANDED_STATE ? TRACE_LANES_PER_THREAD : 1) +
          TRACE_THREAD_GAP_LANE_COUNT;
      }
      if (processIndex + 1 < TRACE_PROCESS_COUNT) {
        laneCount += TRACE_PROCESS_GAP_LANE_COUNT;
      }
    }
    return laneCount;
  }

  private requestPick(pick: FlatControllerPick): void {
    if (pick.intent === 'hover' && this.pendingPick?.intent === 'select') {
      return;
    }
    const requestIdentifier = ++this.latestPickRequestIdentifier;
    if (pick.intent === 'select') {
      this.latestSelectionPickRequestIdentifier = requestIdentifier;
    } else {
      this.latestHoverPickRequestIdentifier = requestIdentifier;
    }
    this.pendingPick = {
      time: pick.x,
      lane: pick.y,
      requestIdentifier,
      intent: pick.intent,
      clientX: pick.clientX,
      clientY: pick.clientY
    };
    if (
      this.certificationRun &&
      TRACE_BENCHMARK_SCENARIOS[this.certificationRun.scenarioIndex]?.id === 'exact-picking'
    ) {
      this.certificationPickStartedAt.set(requestIdentifier, performance.now());
    }
  }

  private readonly clearHoveredPick = (): void => {
    this.latestHoverPickRequestIdentifier = ++this.latestPickRequestIdentifier;
    if (this.pendingPick?.intent === 'hover') {
      this.pendingPick = null;
    }
    this.hoveredSpanIndex = INVALID_SPAN_INDEX;
    this.hoveredDependencyIndex = INVALID_SPAN_INDEX;
    this.lastRenderSignature = '';
    this.hidePickTooltip();
  };

  private readonly handleMinimapPointerDown = (event: PointerEvent): void => {
    const canvas = this.canvas;
    if (!canvas || event.button !== 0 || !this.isPointInMinimap(event.clientX, event.clientY)) {
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    event.preventDefault();
    event.stopImmediatePropagation();
    this.autoScroll = false;
    const horizontalRatio = clamp(
      (event.clientX - bounds.left - TRACE_MINIMAP_INSET) /
        Math.max(bounds.width - TRACE_MINIMAP_INSET * 2, 1),
      0,
      1
    );
    const visibleDuration = this.view.timeMax - this.view.timeMin;
    const centerTime = horizontalRatio * this.traceDuration;
    this.setViewTimeRange(centerTime - visibleDuration / 2, centerTime + visibleDuration / 2);
    this.clearHoveredPick();
    this.lastRenderSignature = '';
  };

  private readonly handleMinimapPointerMove = (event: PointerEvent): void => {
    if (!this.isPointInMinimap(event.clientX, event.clientY)) {
      return;
    }
    event.stopImmediatePropagation();
    this.clearHoveredPick();
  };

  private readonly handleMinimapPointerRelease = (event: PointerEvent | MouseEvent): void => {
    if (!this.isPointInMinimap(event.clientX, event.clientY)) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private isPointInMinimap(clientX: number, clientY: number): boolean {
    const canvas = this.canvas;
    if (!canvas || !this.minimapEnabled) {
      return false;
    }
    const bounds = canvas.getBoundingClientRect();
    const minimapHeight = Math.min(
      TRACE_MINIMAP_HEIGHT,
      Math.max(bounds.height - TRACE_MINIMAP_INSET * 2, 0)
    );
    const minimapTop = bounds.bottom - minimapHeight - TRACE_MINIMAP_INSET;
    return (
      clientY >= minimapTop &&
      clientY <= bounds.bottom - TRACE_MINIMAP_INSET &&
      clientX >= bounds.left + TRACE_MINIMAP_INSET &&
      clientX <= bounds.right - TRACE_MINIMAP_INSET
    );
  }

  private setViewTimeRange(timeMin: number, timeMax: number): void {
    const range = clamp(timeMax - timeMin, 0.5, this.traceDuration);
    const maximumTimeMin = Math.max(0, this.traceDuration - range);
    this.view.timeMin = clamp(timeMin, 0, maximumTimeMin);
    this.view.timeMax = this.view.timeMin + range;
  }

  /** Identifies every input that can change the GPU graph result between animation ticks. */
  private getRenderSignature(width: number, height: number): string {
    return [
      this.compileCount,
      width,
      height,
      this.view.timeMin,
      this.view.timeMax,
      this.view.laneMin,
      this.view.laneMax,
      this.enabledMask,
      this.statusMask,
      this.activeFilterMask,
      this.dependencyMask,
      this.dependencyDisplayBudget,
      this.minimumDuration,
      this.selectedSpanIndex,
      this.selectedDependencyIndex,
      this.hoveredSpanIndex,
      this.hoveredDependencyIndex,
      this.focusOnly ? 1 : 0,
      this.focusDepth,
      this.lodFadeEnabled ? 1 : 0,
      this.overviewMode,
      this.dependencyRouting,
      this.minimapEnabled ? 1 : 0,
      this.labelsEnabled ? 1 : 0,
      this.densityPattern,
      this.regressionGroupMask,
      this.anomalyOverlayEnabled ? 1 : 0,
      this.initialDependencyWarmup ? 1 : 0,
      this.pendingPick?.requestIdentifier ?? -1,
      ...this.processStates,
      ...this.threadStates
    ].join(':');
  }
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

/** Declares a no-command coherence point that progressive executions may safely publish. */
function addTraceAnalyticsPublicationBoundary(
  graph: GPUCommandGraph<void>,
  props: {
    id: string;
    result: GraphBufferHandle;
    publicationId: string;
    completeness: 'partial' | 'complete';
  }
): void {
  graph.addCopyPass({
    id: props.id,
    resources: [{buffer: props.result, usage: 'storage-read'}],
    publication: {id: props.publicationId, completeness: props.completeness},
    compile: () => ({encode: () => {}})
  });
}

/** Advances a workload-annotated graph without filling the GPU queue with the entire analysis. */
async function executeGPUCommandGraphInFrames(props: {
  device: Device;
  compiled: CompiledGPUCommandGraph<void>;
  budget: GPUCommandGraphExecutionBudget;
  budgetController?: GPUCommandGraphExecutionBudgetController;
  isCurrent: () => boolean;
  onPlan?: (plan: GPUCommandGraphExecutionPlan) => void;
  onProgress: (progress: number, stepIndex: number, stepCount: number) => void;
}): Promise<boolean> {
  const executionBudget = props.budgetController?.budget ?? props.budget;
  const execution = props.compiled.createExecution(executionBudget, {
    latencyPriority: props.budgetController?.latencyPriority ?? 'normal'
  });
  props.onPlan?.(execution.plan);
  const queue = (
    props.device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
  ).handle?.queue;
  while (!execution.completed) {
    if (!props.isCurrent()) return false;
    const encoder = props.device.createCommandEncoder();
    const step = execution.encodeNext(encoder, {parameters: undefined});
    const stepStartTime = performance.now();
    props.device.submit(encoder.finish());
    props.onProgress(step.progress, step.stepIndex + 1, execution.plan.stepCount);
    const submittedWork = queue?.onSubmittedWorkDone?.();
    let queueDurationMilliseconds = 0;
    const measuredSubmittedWork = submittedWork?.then(() => {
      queueDurationMilliseconds = performance.now() - stepStartTime;
    });
    await Promise.all([
      step.completed ? undefined : waitForAnimationFrame(),
      measuredSubmittedWork
    ]);
    if (submittedWork) {
      props.budgetController?.observeStep(step, queueDurationMilliseconds, executionBudget);
    }
  }
  return props.isCurrent();
}

/** Divides a strict global frame budget across stable source partitions. */
function getPartitionedBudget(
  totalBudget: number,
  partitionIndex: number,
  partitionCount: number
): number {
  const baseBudget = Math.floor(totalBudget / partitionCount);
  return baseBudget + Number(partitionIndex < totalBudget % partitionCount);
}

/** Adapts consecutive subranges of one caller-owned allocation as a chunk-preserving vector. */
function makeUint32GraphVector<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  name: string,
  buffer: GraphBufferHandle,
  chunkLengths: readonly number[]
): GraphVectorView<'uint32'> {
  let byteOffset = 0;
  const data = chunkLengths.map(length => {
    const chunk = graph.createDataView(buffer, {
      format: 'uint32',
      length,
      byteOffset
    });
    byteOffset += length * UINT32_BYTE_LENGTH;
    return chunk;
  });
  const length = chunkLengths.reduce((sum, chunkLength) => sum + chunkLength, 0);
  return new GraphVectorView({
    id,
    name,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride: UINT32_BYTE_LENGTH,
    rowByteLength: UINT32_BYTE_LENGTH,
    data
  });
}

/** Preserves independently allocated chunks as one logical uint32 graph vector. */
function makeTraceGraphVector(
  id: string,
  data: readonly GraphDataView<'uint32'>[]
): GraphVectorView<'uint32'> {
  const length = data.reduce((sum, chunk) => sum + chunk.length, 0);
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride: UINT32_BYTE_LENGTH,
    rowByteLength: UINT32_BYTE_LENGTH,
    data
  });
}

/** Preserves interleaved canonical span fields as one ordered graph vector. */
function makeTraceColumnVector<T extends 'uint32' | 'float32', Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  handles: readonly GraphBufferHandle[],
  chunks: readonly TraceSpanChunkResources[],
  format: T,
  wordOffset: number
): GraphVectorView<T> {
  const byteStride = TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
  const data = handles.map((handle, chunkIndex) =>
    graph.createDataView(handle, {
      format,
      length: chunks[chunkIndex].spanCount,
      byteOffset: wordOffset * UINT32_BYTE_LENGTH,
      byteStride
    })
  );
  const length = data.reduce((sum, chunk) => sum + chunk.length, 0);
  return new GraphVectorView({
    id,
    name: id,
    format,
    length,
    valueLength: length,
    stride: TRACE_SPAN_RECORD_WORD_LENGTH,
    byteStride,
    rowByteLength: UINT32_BYTE_LENGTH,
    data
  });
}

/** Splits canonical span columns into bounded graph nodes without repacking source buffers. */
function makeTraceAnalysisColumnVector<T extends 'uint32' | 'float32', Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  handles: readonly GraphBufferHandle[],
  partitions: readonly TraceAnalysisPartition[],
  format: T,
  wordOffset: number
): GraphVectorView<T> {
  const byteStride = TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
  const data = partitions.map(partition =>
    graph.createDataView(handles[partition.chunkIndex], {
      format,
      length: partition.rowCount,
      byteOffset:
        (partition.firstRow * TRACE_SPAN_RECORD_WORD_LENGTH + wordOffset) * UINT32_BYTE_LENGTH,
      byteStride
    })
  );
  const length = data.reduce((sum, partition) => sum + partition.length, 0);
  return new GraphVectorView({
    id,
    name: id,
    format,
    length,
    valueLength: length,
    stride: TRACE_SPAN_RECORD_WORD_LENGTH,
    byteStride,
    rowByteLength: UINT32_BYTE_LENGTH,
    data
  });
}

/** Preserves caller-owned imports and the original GPU command-graph ownership contract. */
function importTraceBuffer<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  buffer: Buffer
): GraphBufferHandle {
  return graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer);
}

function storageRead(name: string, buffer: GraphBufferHandle): TraceComputePassBinding {
  return {name, buffer, type: 'storage', usage: 'storage-read'};
}

function storageWrite(name: string, buffer: GraphBufferHandle): TraceComputePassBinding {
  return {name, buffer, type: 'storage', usage: 'storage-write'};
}

function storageReadWrite(name: string, buffer: GraphBufferHandle): TraceComputePassBinding {
  return {name, buffer, type: 'storage', usage: 'storage-read-write'};
}

function uniformBinding(name: string, buffer: GraphBufferHandle): TraceComputePassBinding {
  return {name, buffer, type: 'uniform', usage: 'uniform'};
}

/** Adds an explicit graph-owned application kernel without submitting or reading back work. */
function addTraceComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    bindings: readonly TraceComputePassBinding[];
    length: number;
    workgroupSize?: number;
  }
): void {
  if (props.length === 0) {
    return;
  }
  graph.addComputePass({
    id: props.id,
    workload: {
      operation: 'TraceCompute',
      commandCount: 1,
      maximumWorkgroupCount: Math.ceil(
        props.length / (props.workgroupSize ?? TRACE_WORKGROUP_SIZE)
      ),
      maximumInvocationCount:
        Math.ceil(props.length / (props.workgroupSize ?? TRACE_WORKGROUP_SIZE)) *
        (props.workgroupSize ?? TRACE_WORKGROUP_SIZE),
      readByteLength: props.bindings.reduce(
        (total, binding) =>
          total +
          (binding.usage === 'storage-read' || binding.usage === 'storage-read-write'
            ? binding.buffer.byteLength
            : 0),
        0
      ),
      writeByteLength: props.bindings.reduce(
        (total, binding) =>
          total +
          (binding.usage === 'storage-write' || binding.usage === 'storage-read-write'
            ? binding.buffer.byteLength
            : 0),
        0
      )
    },
    resources: props.bindings.map(binding => ({buffer: binding.buffer, usage: binding.usage})),
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: props.bindings.map((binding, location) =>
            binding.type === 'uniform'
              ? {name: binding.name, type: 'uniform' as const, group: 0, location}
              : {name: binding.name, type: 'storage' as const, group: 0, location}
          )
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const binding of props.bindings) {
            bindings[binding.name] = getBuffer(binding.buffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(
            computePass,
            Math.ceil(props.length / (props.workgroupSize ?? TRACE_WORKGROUP_SIZE))
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Adds a candidate-driven kernel whose workgroup counts are published by an earlier GPU pass. */
function addTraceIndirectComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    bindings: readonly TraceComputePassBinding[];
    dispatchBuffer: GraphBufferHandle;
    dispatchByteOffset?: number;
    maximumInvocationCount?: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    condition: {
      id: `${props.id}-has-work`,
      source: 'gpu',
      mode: 'indirect',
      buffer: props.dispatchBuffer,
      byteOffset: props.dispatchByteOffset
    },
    workload: {
      operation: 'TraceComputeIndirect',
      commandCount: 1,
      maximumInvocationCount: props.maximumInvocationCount,
      readByteLength: props.bindings.reduce(
        (total, binding) =>
          total +
          (binding.usage === 'storage-read' || binding.usage === 'storage-read-write'
            ? binding.buffer.byteLength
            : 0),
        0
      ),
      writeByteLength: props.bindings.reduce(
        (total, binding) =>
          total +
          (binding.usage === 'storage-write' || binding.usage === 'storage-read-write'
            ? binding.buffer.byteLength
            : 0),
        0
      )
    },
    resources: [
      ...props.bindings.map(binding => ({buffer: binding.buffer, usage: binding.usage})),
      {buffer: props.dispatchBuffer, usage: 'indirect' as const}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: props.bindings.map((binding, location) =>
            binding.type === 'uniform'
              ? {name: binding.name, type: 'uniform' as const, group: 0, location}
              : {name: binding.name, type: 'storage' as const, group: 0, location}
          )
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const binding of props.bindings) {
            bindings[binding.name] = getBuffer(binding.buffer);
          }
          computation.setBindings(bindings);
          // The graph redirects this direct dispatch to the GPU-written indirect command above.
          computation.dispatch(computePass, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function makeTraceBlendParameters() {
  return {
    blend: true,
    blendColorOperation: 'add' as const,
    blendColorSrcFactor: 'src-alpha' as const,
    blendColorDstFactor: 'one-minus-src-alpha' as const,
    blendAlphaOperation: 'add' as const,
    blendAlphaSrcFactor: 'one' as const,
    blendAlphaDstFactor: 'one-minus-src-alpha' as const
  };
}
