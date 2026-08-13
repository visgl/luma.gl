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
  type GPUCommandGraphEncoding,
  GPUCommandGraphInspector,
  type GPUCommandGraphInspectorObservation,
  GPUHierarchyLayout,
  GPUIndexedRangeCompaction,
  GPUPartitionedIndexedRangeCompaction,
  GPUReadbackRing,
  type GPUReadbackTicket,
  GPUVisibilityWorkflow,
  type GraphBufferHandle,
  type GraphBufferUse,
  type GraphDataView,
  GraphVectorView
} from '@luma.gl/experimental';
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
  getTraceScanTimingSummary,
  getTraceWorkloadCounters,
  type TraceAllocationStats
} from './trace-benchmark';
import {
  getTraceCapacityOptions,
  getTraceDependencyCapacityOptions,
  getTraceFocusFrontierCapacity,
  getTraceDensityBinParameters,
  isTraceDensityMode,
  makeTraceSpanChunks,
  TRACE_COLLAPSED_STATE,
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DEPENDENCY_BATCH_CAPACITY,
  TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH,
  TRACE_DURATION,
  TRACE_DURATION_FILTER_MAXIMUM,
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
  TRACE_SPAN_BATCH_CAPACITY,
  TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
  TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_SPAN_RECORD_WORD_LENGTH,
  TRACE_STATUS_COUNT,
  TRACE_THREAD_COUNT,
  TRACE_THREADS_PER_PROCESS,
  type TraceDatasetData,
  type TraceGroupName
} from './trace-data';
import type {TraceDatasetWorkerResponse} from './trace-data-worker';
import {
  getBatchVisibilityShader,
  getCandidateDensityShader,
  getCandidateDependencySpanVisibilityShader,
  getCandidateDependencyVisibilityShader,
  getCandidateLabelShader,
  getCandidatePassDispatchShader,
  getCandidatePickShader,
  getCandidateVisibilityShader,
  getDensityClearShader,
  getDependencyBatchVisibilityShader,
  getDependencyEndpointResolveShader,
  getFocusFrontierClearShader,
  getFocusFrontierDispatchShader,
  getFocusFrontierExpansionShader,
  getFocusFrontierSeedShader,
  getFocusReachabilityClearShader,
  getPickClearShader,
  getPickResolveShader,
  getSpanVisibilityClearShader,
  getTraceDrawCommandsShader,
  getTraceLabelClearShader,
  TRACE_DENSITY_RENDER_SHADER,
  TRACE_DEPENDENCY_RENDER_SHADER,
  TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE,
  TRACE_LABEL_RENDER_SHADER,
  TRACE_RENDER_SHADER
} from './trace-shaders';
import {getTracePanelStyleMarkup} from './trace-panel';

export const title = 'GPU Hierarchical Trace Viewer';
export const description =
  'GPU-resident hierarchical traces with live filtering, adaptive density LOD, dependency traversal, picking, and indirect rendering.';

const DEFAULT_CAPACITY = 4_000_000;
const DEFAULT_DEPENDENCY_CAPACITY = 4_000_000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const TRACE_PICK_RESULT_WORD_LENGTH = TRACE_SPAN_RECORD_WORD_LENGTH + 1;
const TRACE_WORKGROUP_SIZE = 256;
const TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT = Math.ceil(
  TRACE_SPAN_BATCH_CAPACITY / TRACE_WORKGROUP_SIZE
);
const VIEW_UNIFORM_BYTE_LENGTH = 96;
const MAXIMUM_FOCUS_DEPTH = 4;
const INVALID_SPAN_INDEX = TRACE_INVALID_SPAN_INDEX;
const STATUS_NAMES = ['ok', 'waiting', 'active', 'error'] as const;
const TRACE_GRAPH_ID = 'gpu-hierarchical-trace-command-graph';
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
  'persistent-bytes': 'Persistent bytes',
  'largest-buffer-bytes': 'Largest buffer bytes',
  'collapsed-processes': 'Collapsed processes',
  'density-mode': 'Density mode',
  'filter-active': 'Filter active',
  'focus-active': 'Focus active',
  'pick-active': 'Pick active'
} as const;

const DENSITY_PATTERN_OPTIONS: Array<{label: string; value: FillPatternType}> = [
  {label: 'Diagonal dashes', value: FillPattern.hash45},
  {label: 'Reverse diagonal dashes', value: FillPattern.hash135},
  {label: 'Vertical dashes', value: FillPattern.hash90},
  {label: 'Horizontal dashes', value: FillPattern.hash0},
  {label: 'Grid', value: FillPattern.checker0},
  {label: 'Diamond grid', value: FillPattern.checker45},
  {label: 'Dots', value: FillPattern.dotgrid},
  {label: 'Diagonal dots', value: FillPattern.dotgrid45},
  {label: 'Solid', value: FillPattern.none}
];

type TraceViewParameters = {
  timeMin: number;
  timeMax: number;
  laneMin: number;
  laneMax: number;
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
  chunkIndex: number;
  firstSpanIndex: number;
  spanCount: number;
  firstBatchIndex: number;
  batchCount: number;
};

type TraceSpanDrawResources = {
  commandIndex: number;
  groupIndex: number;
  chunkIndex: number;
  firstBatchIndex: number;
  batchCount: number;
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
  drawCommands: DrawCommandBuffer;
  candidateDispatchCommands: DispatchCommandBuffer;
  exactCandidateDispatchCommands: DispatchCommandBuffer;
  densityCandidateDispatchCommands: DispatchCommandBuffer;
  pickCandidateDispatchCommands: DispatchCommandBuffer;
  candidateDependencyDispatchCommands: DispatchCommandBuffer;
  readbackRing: GPUReadbackRing;
  renderBundle: RenderBundle;
  groups: TraceGroupResources[];
  spanChunks: TraceSpanChunkResources[];
  spanDraws: TraceSpanDrawResources[];
  dependencyDrawCommandIndex: number;
  densityDrawCommandIndex: number;
  labelDrawCommandIndex: number;
  spanBatchIndex: Buffer;
  candidateBatchIds: Buffer;
  candidateChunkOffsets: Buffer;
  exactCandidateBatchIds: Buffer;
  dependencies: Buffer;
  dependencyBatchIndex: Buffer;
  candidateDependencyBatchIds: Buffer;
  parentSpans: Buffer;
  outgoingTopology: Buffer;
  outgoingNeighbors: Buffer;
  incomingTopology: Buffer;
  incomingNeighbors: Buffer;
  processStates: Buffer;
  threadStates: Buffer;
  threadHeights: Buffer;
  threadOffsets: Buffer;
  selectedSeeds: Buffer;
  selectedSeedCount: Buffer;
  focusTraversalState: Buffer;
  reachedSpans: Buffer;
  dependencyResults: Buffer;
  dependencyEndpointPositions: Buffer;
  dependencySpanVisibility: Buffer;
  visibleDependencyIds: Buffer;
  densityBins: Buffer;
  labelGlyphs: Buffer;
  pickResult: Buffer;
  spanCount: number;
  spanBatchCount: number;
  dependencyBatchCount: number;
  dependencyCount: number;
  focusFrontierCapacity: number;
};

function getTraceResourceBuffers(resources: TraceGraphResources): Array<{byteLength: number}> {
  return [
    resources.drawCommands.buffer,
    resources.candidateDispatchCommands.buffer,
    resources.exactCandidateDispatchCommands.buffer,
    resources.densityCandidateDispatchCommands.buffer,
    resources.pickCandidateDispatchCommands.buffer,
    resources.candidateDependencyDispatchCommands.buffer,
    ...resources.spanChunks.flatMap(chunk => [
      chunk.buffer,
      chunk.uniforms,
      chunk.visibility,
      chunk.visibleIds
    ]),
    resources.spanBatchIndex,
    resources.candidateBatchIds,
    resources.candidateChunkOffsets,
    resources.exactCandidateBatchIds,
    resources.dependencies,
    resources.dependencyBatchIndex,
    resources.candidateDependencyBatchIds,
    resources.parentSpans,
    resources.outgoingTopology,
    resources.outgoingNeighbors,
    resources.incomingTopology,
    resources.incomingNeighbors,
    resources.processStates,
    resources.threadStates,
    resources.threadHeights,
    resources.threadOffsets,
    resources.selectedSeeds,
    resources.selectedSeedCount,
    resources.focusTraversalState,
    resources.reachedSpans,
    resources.dependencyResults,
    resources.dependencyEndpointPositions,
    resources.dependencySpanVisibility,
    resources.visibleDependencyIds,
    resources.densityBins,
    resources.labelGlyphs,
    resources.pickResult,
    ...Array.from({length: resources.readbackRing.slotCount}, () => ({
      byteLength: resources.readbackRing.byteLength
    }))
  ];
}

type TraceComputePassBinding = {
  name: string;
  buffer: GraphBufferHandle;
  type: 'storage' | 'uniform';
  usage: 'storage-read' | 'storage-write' | 'uniform';
};

export default class GPUTraceViewerAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly model: Model;
  readonly dependencyModel: Model;
  readonly densityModel: Model;
  readonly labelRenderer: DictionaryTextRenderer;
  readonly viewUniformBuffer: Buffer;
  readonly panels: ExamplePanelManager;
  readonly graphInspector = new GPUCommandGraphInspector({maxSamples: 90});
  readonly capacityOptions: number[];
  readonly dependencyCapacityOptions: number[];
  private readonly spanChunkByteLength: number;

  private resources: TraceGraphResources | null = null;
  private graphObservation: GPUCommandGraphInspectorObservation<TraceViewParameters> | null = null;
  private readonly gpuTimingReadbackTimers = new Set<ReturnType<typeof setTimeout>>();
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
  /** Enabled filtering policy; immutable source classifications remain in each span record. */
  private activeFilterMask = 0;
  private minimumDuration = 0;
  private selectedSpanIndex = INVALID_SPAN_INDEX;
  private focusOnly = false;
  private focusDepth = 2;
  private processStates = new Uint32Array(TRACE_PROCESS_COUNT).fill(TRACE_EXPANDED_STATE);
  private threadStates = new Uint32Array(TRACE_THREAD_COUNT).fill(TRACE_EXPANDED_STATE);
  private autoScroll = true;
  private lodFadeEnabled = false;
  private labelsEnabled = true;
  private densityPattern: FillPatternType = FillPattern.hash45;
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
  private droppedTelemetrySampleCount = 0;
  private deferredPickFrameCount = 0;
  private frameIndex = 0;
  private viewportWidth = 1;
  private flatController: FlatController | null = null;
  private pickTooltipElement: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private frameStatsElement: HTMLElement | null = null;
  private inspectorPanel: GPUCommandGraphInspectorPanel | null = null;
  private capacityElement: HTMLElement | null = null;
  private selectionElement: HTMLElement | null = null;
  private datasetStatusElement: HTMLElement | null = null;
  private datasetPreflightElement: HTMLElement | null = null;
  private datasetPreflightMessageElement: HTMLElement | null = null;
  private datasetWorker: Worker | null = null;
  private pendingDatasetRequest: {spanCapacity: number; dependencyCapacity: number} | null = null;
  private datasetRequestId = 0;
  private datasetStatus = 'Preparing source data…';
  private gpuFrameInFlight = false;
  private gpuFrameTimeMilliseconds = 0;
  private lastRenderSignature = '';
  private finalized = false;

  constructor({
    device,
    traceCapacity = DEFAULT_CAPACITY,
    dependencyCapacity = DEFAULT_DEPENDENCY_CAPACITY,
    spanChunkByteLength = TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH
  }: AnimationProps & {
    traceCapacity?: number;
    dependencyCapacity?: number;
    spanChunkByteLength?: number;
  }) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('GPU Hierarchical Trace Viewer requires WebGPU');
    }
    this.device = device;
    void device.lost.then(({message}) => {
      this.setDatasetStatus(`WebGPU device lost${message ? `: ${message}` : ''}`);
    });
    if (!Number.isSafeInteger(spanChunkByteLength) || spanChunkByteLength < 1) {
      throw new RangeError('Trace span chunk byte length must be a positive safe integer');
    }
    this.spanChunkByteLength = spanChunkByteLength;
    this.capacityOptions = getTraceCapacityOptions(
      device.limits.maxStorageBufferBindingSize,
      device.limits.maxBufferSize
    );
    this.dependencyCapacityOptions = getTraceDependencyCapacityOptions(
      device.limits.maxStorageBufferBindingSize,
      device.limits.maxBufferSize
    );
    this.viewUniformBuffer = device.createBuffer({
      id: 'gpu-trace-view-uniforms',
      byteLength: VIEW_UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = this.createSpanModel();
    this.dependencyModel = this.createDependencyModel();
    this.densityModel = this.createDensityModel();
    this.labelRenderer = this.createLabelRenderer();
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.rebuild(traceCapacity, dependencyCapacity);
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.flatController = new FlatController(canvas, {
        getView: () => ({
          xMin: this.view.timeMin,
          xMax: this.view.timeMax,
          yMin: this.view.laneMin,
          yMax: this.view.laneMax
        }),
        getBounds: () => ({xMin: 0, xMax: this.traceDuration, yMin: 0, yMax: TRACE_LANE_COUNT}),
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

  override onRender({device, time, width, height}: AnimationProps): void {
    const resources = this.resources;
    if (!resources) {
      return;
    }
    this.viewportWidth = width;
    if (this.autoScroll) {
      const windowSize = this.view.timeMax - this.view.timeMin;
      if (windowSize >= this.traceDuration) {
        this.setViewTimeRange(0, this.traceDuration);
      } else {
        const timeMin = (time * 0.025) % Math.max(this.traceDuration - windowSize, 1);
        this.setViewTimeRange(timeMin, timeMin + windowSize);
      }
    }
    const renderSignature = this.getRenderSignature(width, height);
    if (this.gpuFrameInFlight || renderSignature === this.lastRenderSignature) {
      return;
    }
    const pick = this.pendingPick;
    const visibilityGeneration = (this.frameIndex % 0xfffffffe) + 1;
    resources.focusTraversalState.write(Uint32Array.of(this.focusDepth));
    this.writeViewUniforms(width, height, pick, visibilityGeneration, resources.dependencyCount);
    const encoding = this.graphObservation?.encode(device.commandEncoder, {
      parameters: this.view
    });
    if (!encoding) {
      return;
    }
    this.lastRenderSignature = renderSignature;
    this.gpuFrameInFlight = true;
    const gpuFrameStartTime = performance.now();
    queueMicrotask(() => {
      const queue = (
        device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
      ).handle?.queue;
      const submittedWork = queue?.onSubmittedWorkDone?.();
      if (!submittedWork) {
        this.gpuFrameInFlight = false;
        return;
      }
      void submittedWork
        .catch(() => undefined)
        .finally(() => {
          if (!this.finalized) {
            this.gpuFrameTimeMilliseconds = performance.now() - gpuFrameStartTime;
            this.gpuFrameInFlight = false;
            this.updateInspector();
          }
        });
    });
    this.encodeTimeMilliseconds = encoding.stats.cpuEncodeTimeMilliseconds;
    this.frameIndex++;
    if (
      (this.frameIndex === 1 || this.frameIndex % 60 === 0) &&
      encoding.canReadGPUTimings &&
      this.graphObservation
    ) {
      this.scheduleGPUTimingReadback(this.graphObservation, encoding);
    }
    if (pick) {
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
          resources.candidateDependencyDispatchCommands.buffer,
          {sourceOffset: UINT32_BYTE_LENGTH, byteLength: UINT32_BYTE_LENGTH}
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
    }
    if (this.frameIndex === 1 || this.frameIndex % 10 === 0) {
      this.updateInspector();
    }
  }

  override onFinalize(): void {
    this.finalized = true;
    this.datasetRequestId++;
    this.datasetWorker?.terminate();
    this.datasetWorker = null;
    this.flatController?.destroy();
    this.flatController = null;
    this.pickTooltipElement?.remove();
    this.pickTooltipElement = null;
    this.panels.finalize();
    this.destroyResources();
    this.model.destroy();
    this.dependencyModel.destroy();
    this.densityModel.destroy();
    this.labelRenderer.destroy();
    this.viewUniformBuffer.destroy();
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
          {name: 'spanChunk', type: 'uniform', group: 0, location: 6}
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
      vertexCount: 2,
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
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 3}
        ]
      },
      parameters: makeTraceBlendParameters()
    });
  }

  private createDensityModel(): Model {
    return new Model(this.device, {
      id: 'gpu-trace-density-model',
      source: TRACE_DENSITY_RENDER_SHADER,
      plugins: [fillPatternShaderPlugin],
      topology: 'triangle-list',
      vertexCount: 6,
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
    this.selectedSpanIndex = INVALID_SPAN_INDEX;
    const requestId = ++this.datasetRequestId;
    this.datasetWorker?.terminate();
    const worker = new Worker(new URL('./trace-data-worker.ts', import.meta.url), {type: 'module'});
    this.datasetWorker = worker;
    this.setDatasetStatus(`Generating ${formatCount(spanCapacity)} spans off the main thread…`);
    worker.onmessage = (event: MessageEvent<TraceDatasetWorkerResponse>): void => {
      const response = event.data;
      if (response.requestId !== this.datasetRequestId || worker !== this.datasetWorker) {
        return;
      }
      worker.terminate();
      this.datasetWorker = null;
      if ('error' in response) {
        this.setDatasetStatus(`Generation failed: ${response.error}`);
        return;
      }
      this.setDatasetStatus('Uploading source chunks and compiling the GPU graph…');
      requestAnimationFrame(() => {
        if (requestId === this.datasetRequestId) {
          try {
            this.installDataset(response.dataset, started);
          } catch (error) {
            this.setDatasetStatus(
              `GPU build failed: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      });
    };
    worker.onerror = event => {
      if (requestId === this.datasetRequestId) {
        worker.terminate();
        this.datasetWorker = null;
        this.setDatasetStatus(`Generation failed: ${event.message}`);
      }
    };
    worker.postMessage({requestId, spanCapacity, dependencyCapacity});
  }

  private requestRebuild(spanCapacity: number, dependencyCapacity: number): void {
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

  private installDataset(dataset: TraceDatasetData, started: number): void {
    this.destroyResources();
    this.traceDuration = dataset.duration;
    this.setViewTimeRange(this.view.timeMin, this.view.timeMax);
    const resources = this.createResources(dataset);
    resources.renderBundle = this.createRenderBundle(resources);
    resources.compiled = this.createGraph(resources, dataset);
    this.graphObservation = this.graphInspector.observeGraph(resources.compiled);
    this.allocationStats = getTraceAllocationStats([
      this.viewUniformBuffer,
      this.labelRenderer.dictionaryMetrics,
      this.labelRenderer.dictionaryGlyphRanges,
      this.labelRenderer.dictionaryGlyphRecords,
      this.labelRenderer.glyphFrames,
      this.labelRenderer.styleUniforms,
      ...getTraceResourceBuffers(resources)
    ]);
    this.resources = resources;
    this.compileCount++;
    this.compileTimeMilliseconds = performance.now() - started;
    this.sampledVisibleCounts = TRACE_GROUPS.map(() => 0);
    this.sampledDependencyCount = 0;
    this.sampledLabelGlyphCount = 0;
    this.sampledCandidateBatchCount = 0;
    this.sampledCandidateDependencyBatchCount = 0;
    this.recordWorkloadCounters();
    this.setDatasetStatus(
      `Ready · ${formatCount(dataset.spanCount)} spans and ${formatCount(dataset.dependencyCount)} generated edges`
    );
    this.updateInspector();
  }

  private setDatasetStatus(status: string): void {
    this.datasetStatus = status;
    if (this.datasetStatusElement) {
      this.datasetStatusElement.textContent = status;
    }
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
    const dependencyMaskByteLength = Math.max(dataset.dependencyCount, 1) * UINT32_BYTE_LENGTH;
    const densityBinCount = TRACE_LANE_COUNT * TRACE_DENSITY_BIN_COUNT;
    const densityValueCount = densityBinCount * TRACE_GROUPS.length;
    const outgoingTopologyChunkLengths = getTopologyChunkLengths(dataset.outgoing.nodes.length);
    const incomingTopologyChunkLengths = getTopologyChunkLengths(dataset.incoming.nodes.length);
    const outgoingTopology = makeSparseTopologyRows(
      dataset.outgoing.nodes,
      makePartitionedOffsets(dataset.outgoing.offsets, outgoingTopologyChunkLengths)
    );
    const incomingTopology = makeSparseTopologyRows(
      dataset.incoming.nodes,
      makePartitionedOffsets(dataset.incoming.offsets, incomingTopologyChunkLengths)
    );
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
    const dependencyDrawCommandIndex = spanDraws.length;
    const densityDrawCommandIndex = dependencyDrawCommandIndex + 1;
    const labelDrawCommandIndex = densityDrawCommandIndex + 1;
    const drawCommands = new DrawCommandBuffer(this.device, {
      id: 'gpu-trace-draw-commands',
      type: 'draw',
      commands: [
        ...spanDraws.map(() => ({vertexCount: 6, instanceCount: 0})),
        {vertexCount: 2, instanceCount: 0},
        {vertexCount: 6, instanceCount: densityBinCount},
        {vertexCount: 6, instanceCount: 0}
      ]
    });
    const candidateDispatchCommands = new DispatchCommandBuffer(this.device, {
      id: 'gpu-trace-candidate-dispatch-commands',
      commands: [{x: TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT, y: 0, z: 1}]
    });
    const exactCandidateDispatchCommands = new DispatchCommandBuffer(this.device, {
      id: 'gpu-trace-exact-candidate-dispatch-commands',
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
    const candidateDependencyDispatchCommands = new DispatchCommandBuffer(this.device, {
      id: 'gpu-trace-candidate-dependency-dispatch-commands',
      commands: [{x: 1, y: 0, z: 1}]
    });
    const readbackRing = new GPUReadbackRing(this.device, {
      id: 'gpu-trace-readback',
      byteLength: drawCommands.buffer.byteLength,
      slotCount: 4
    });
    return {
      compiled: undefined!,
      renderBundle: undefined!,
      drawCommands,
      candidateDispatchCommands,
      exactCandidateDispatchCommands,
      densityCandidateDispatchCommands,
      pickCandidateDispatchCommands,
      candidateDependencyDispatchCommands,
      readbackRing,
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
          chunkIndex: chunk.chunkIndex,
          firstSpanIndex: chunk.firstSpanIndex,
          spanCount: chunk.spanCount,
          firstBatchIndex: chunk.firstBatchIndex,
          batchCount: chunk.batchCount
        };
      }),
      spanDraws,
      dependencyDrawCommandIndex,
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
      exactCandidateBatchIds: this.createStorageBuffer(
        'gpu-trace-exact-candidate-batch-ids',
        dataset.spanBatches.length * UINT32_BYTE_LENGTH
      ),
      dependencies: this.createDataBuffer('gpu-trace-dependencies', dataset.dependencies),
      dependencyBatchIndex: this.createDataBuffer(
        'gpu-trace-dependency-batch-index',
        dataset.dependencyBatchIndex
      ),
      candidateDependencyBatchIds: this.createStorageBuffer(
        'gpu-trace-candidate-dependency-batch-ids',
        dataset.dependencyBatches.length * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      parentSpans: this.createDataBuffer('gpu-trace-parent-spans', dataset.parentSpans),
      outgoingTopology: this.createDataBuffer('gpu-trace-outgoing-topology', outgoingTopology),
      outgoingNeighbors: this.createDataBuffer(
        'gpu-trace-outgoing-neighbors',
        dataset.outgoing.neighbors
      ),
      incomingTopology: this.createDataBuffer('gpu-trace-incoming-topology', incomingTopology),
      incomingNeighbors: this.createDataBuffer(
        'gpu-trace-incoming-neighbors',
        dataset.incoming.neighbors
      ),
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
      reachedSpans: this.createStorageBuffer(
        'gpu-trace-reached-spans',
        focusMaskWordCount * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      dependencyResults: this.createStorageBuffer(
        'gpu-trace-dependency-results',
        Math.max(dataset.dependencyCount * 3, 1) * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      dependencyEndpointPositions: this.createStorageBuffer(
        'gpu-trace-dependency-endpoint-positions',
        Math.max(dataset.dependencyCount * 4, 1) * UINT32_BYTE_LENGTH
      ),
      dependencySpanVisibility: this.createStorageBuffer(
        'gpu-trace-dependency-span-visibility',
        dataset.dependencyCount > 0 ? spanMaskByteLength : UINT32_BYTE_LENGTH,
        Buffer.COPY_DST
      ),
      visibleDependencyIds: this.createStorageBuffer(
        'gpu-trace-visible-dependencies',
        dependencyMaskByteLength,
        Buffer.COPY_SRC
      ),
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
      spanCount: dataset.spanCount,
      spanBatchCount: dataset.spanBatches.length,
      dependencyBatchCount: dataset.dependencyBatches.length,
      dependencyCount: dataset.dependencyCount,
      focusFrontierCapacity
    };
  }

  private createDataBuffer(id: string, data: Uint32Array, additionalUsage = 0): Buffer {
    return this.device.createBuffer({
      id,
      data: data.length > 0 ? data : new Uint32Array(1),
      usage: Buffer.STORAGE | Buffer.COPY_DST | additionalUsage
    });
  }

  private createStorageBuffer(id: string, byteLength: number, additionalUsage = 0): Buffer {
    return this.device.createBuffer({
      id,
      byteLength: Math.max(byteLength, UINT32_BYTE_LENGTH),
      usage: Buffer.STORAGE | additionalUsage
    });
  }

  /** Compiles the complete immutable hierarchy, focus, visibility, density, and edge graph. */
  private createGraph(
    resources: TraceGraphResources,
    dataset: TraceDatasetData
  ): CompiledGPUCommandGraph<TraceViewParameters> {
    const graph = new GPUCommandGraph<TraceViewParameters>(this.device, {
      id: TRACE_GRAPH_ID
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
        uniforms: importTraceBuffer(
          graph,
          `span-chunk-uniforms-${chunk.chunkIndex}`,
          chunk.uniforms
        )
      })),
      spanBatchIndex: importTraceBuffer(graph, 'span-batch-index', resources.spanBatchIndex),
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
      exactCandidateBatchIds: importTraceBuffer(
        graph,
        'exact-candidate-batch-ids',
        resources.exactCandidateBatchIds
      ),
      candidateDispatchCommands: importTraceBuffer(
        graph,
        'candidate-dispatch-commands',
        resources.candidateDispatchCommands.buffer
      ),
      exactCandidateDispatchCommands: importTraceBuffer(
        graph,
        'exact-candidate-dispatch-commands',
        resources.exactCandidateDispatchCommands.buffer
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
      dependencies: importTraceBuffer(graph, 'dependencies', resources.dependencies),
      dependencyBatchIndex: importTraceBuffer(
        graph,
        'dependency-batch-index',
        resources.dependencyBatchIndex
      ),
      candidateDependencyBatchIds: importTraceBuffer(
        graph,
        'candidate-dependency-batch-ids',
        resources.candidateDependencyBatchIds
      ),
      candidateDependencyDispatchCommands: importTraceBuffer(
        graph,
        'candidate-dependency-dispatch-commands',
        resources.candidateDependencyDispatchCommands.buffer
      ),
      parentSpans: importTraceBuffer(graph, 'parent-spans', resources.parentSpans),
      outgoingTopology: importTraceBuffer(graph, 'outgoing-topology', resources.outgoingTopology),
      outgoingNeighbors: importTraceBuffer(
        graph,
        'outgoing-neighbors',
        resources.outgoingNeighbors
      ),
      incomingTopology: importTraceBuffer(graph, 'incoming-topology', resources.incomingTopology),
      incomingNeighbors: importTraceBuffer(
        graph,
        'incoming-neighbors',
        resources.incomingNeighbors
      ),
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
      reachedSpans: importTraceBuffer(graph, 'reached-spans', resources.reachedSpans),
      dependencyResults: importTraceBuffer(
        graph,
        'dependency-results',
        resources.dependencyResults
      ),
      dependencyEndpointPositions: importTraceBuffer(
        graph,
        'dependency-endpoint-positions',
        resources.dependencyEndpointPositions
      ),
      dependencySpanVisibility: importTraceBuffer(
        graph,
        'dependency-span-visibility',
        resources.dependencySpanVisibility
      ),
      visibleDependencyIds: importTraceBuffer(
        graph,
        'visible-dependency-ids',
        resources.visibleDependencyIds
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
    const outgoingTopologyChunkLengths = getTopologyChunkLengths(dataset.outgoing.nodes.length);
    const incomingTopologyChunkLengths = getTopologyChunkLengths(dataset.incoming.nodes.length);
    const outgoingNeighborChunkLengths = getNeighborChunkLengths(
      dataset.outgoing.offsets,
      outgoingTopologyChunkLengths
    );
    const incomingNeighborChunkLengths = getNeighborChunkLengths(
      dataset.incoming.offsets,
      incomingTopologyChunkLengths
    );

    const candidateBatchFlags = graph.createTransientBuffer({
      id: 'trace-candidate-batch-flags',
      byteLength: Math.max(resources.spanBatchCount, 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    const exactCandidateBatchFlags = graph.createTransientBuffer({
      id: 'trace-exact-candidate-batch-flags',
      byteLength: Math.max(resources.spanBatchCount, 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    addTraceComputePass(graph, {
      id: 'trace-batch-visibility',
      source: getBatchVisibilityShader(resources.spanBatchCount),
      bindings: [
        storageRead('spanBatches', handles.spanBatchIndex),
        uniformBinding('viewUniforms', handles.uniforms),
        storageWrite('candidateFlags', candidateBatchFlags),
        storageWrite('exactCandidateFlags', exactCandidateBatchFlags)
      ],
      length: resources.spanBatchCount
    });
    new GPUVisibilityWorkflow({
      id: 'trace-candidate-batches',
      predicates: [
        {
          kind: ['time-range', 'bounds'],
          mask: graph.createDataView(candidateBatchFlags, {
            format: 'uint32',
            length: resources.spanBatchCount
          })
        }
      ],
      output: graph.createDataView(handles.candidateBatchIds, {
        format: 'uint32',
        length: resources.spanBatchCount
      }),
      count: graph.createDataView(handles.candidateDispatchCommands, {
        format: 'uint32',
        length: 1,
        byteOffset: UINT32_BYTE_LENGTH
      })
    }).addToGraph(graph);
    new GPUVisibilityWorkflow({
      id: 'trace-exact-candidate-batches',
      predicates: [
        {
          kind: ['time-range', 'bounds'],
          mask: graph.createDataView(exactCandidateBatchFlags, {
            format: 'uint32',
            length: resources.spanBatchCount
          })
        }
      ],
      output: graph.createDataView(handles.exactCandidateBatchIds, {
        format: 'uint32',
        length: resources.spanBatchCount
      }),
      count: graph.createDataView(handles.exactCandidateDispatchCommands, {
        format: 'uint32',
        length: 1,
        byteOffset: UINT32_BYTE_LENGTH
      })
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
        storageWrite('candidateChunkOffsets', handles.candidateChunkOffsets)
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
      expandedChildHeight: TRACE_LANES_PER_THREAD,
      collapsedChildHeight: 1,
      collapsedParentHeight: 1
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
          topology: handles.outgoingTopology,
          neighbors: handles.outgoingNeighbors,
          nodeChunkLengths: outgoingTopologyChunkLengths,
          neighborChunkLengths: outgoingNeighborChunkLengths
        },
        {
          name: 'incoming',
          topology: handles.incomingTopology,
          neighbors: handles.incomingNeighbors,
          nodeChunkLengths: incomingTopologyChunkLengths,
          neighborChunkLengths: incomingNeighborChunkLengths
        }
      ]) {
        let nodeWordBase = 0;
        let offsetWordBase = direction.nodeChunkLengths.reduce(
          (total, nodeCount) => total + nodeCount,
          0
        );
        let neighborWordBase = 0;
        for (const [partitionIndex, sourceNodeCount] of direction.nodeChunkLengths.entries()) {
          const neighborCount = direction.neighborChunkLengths[partitionIndex];
          addTraceIndirectComputePass(graph, {
            id: `trace-focus-frontier-${depth}-${direction.name}-${partitionIndex}`,
            source: getFocusFrontierExpansionShader({
              spanCount: resources.spanCount,
              frontierCapacity: resources.focusFrontierCapacity,
              nodeWordBase,
              sourceNodeCount,
              offsetWordBase,
              neighborWordBase,
              neighborCount,
              depth
            }),
            bindings: [
              storageRead('topology', direction.topology),
              storageRead('neighbors', direction.neighbors),
              storageRead('frontier', focusFrontiers[currentFrontierIndex]),
              storageRead('frontierCount', focusFrontierCounts[currentFrontierIndex]),
              storageWrite('nextFrontier', focusFrontiers[nextFrontierIndex]),
              storageWrite('nextFrontierCount', focusFrontierCounts[nextFrontierIndex]),
              storageWrite('reachedSpans', handles.reachedSpans),
              storageRead('focusTraversalState', handles.focusTraversalState)
            ],
            dispatchBuffer: focusDispatchCommands[currentFrontierIndex],
            maximumInvocationCount:
              Math.ceil(resources.focusFrontierCapacity / TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE) *
              TRACE_FOCUS_FRONTIER_WORKGROUP_SIZE
          });
          nodeWordBase += sourceNodeCount;
          offsetWordBase += sourceNodeCount + 1;
          neighborWordBase += neighborCount;
        }
      }
      addTraceComputePass(graph, {
        id: `trace-focus-frontier-${depth}-publish`,
        source: getFocusFrontierDispatchShader(),
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
      addTraceIndirectComputePass(graph, {
        id: `trace-candidate-span-visibility-${chunk.chunkIndex}`,
        source: getCandidateVisibilityShader(chunk),
        bindings: [
          storageRead('spans', chunk.spans),
          storageRead('spanBatches', handles.spanBatchIndex),
          storageRead('candidateBatchIds', handles.exactCandidateBatchIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageRead('processStates', handles.processStates),
          storageRead('threadOffsets', handles.threadOffsets),
          storageRead('threadStates', handles.threadStates),
          storageRead('reachedSpans', handles.reachedSpans),
          storageWrite('visibilityFlags', chunk.visibility)
        ],
        dispatchBuffer: handles.exactCandidateDispatchCommands,
        maximumInvocationCount: resources.spanBatchCount * TRACE_SPAN_BATCH_CAPACITY
      });
      if (resources.dependencyCount > 0) {
        addTraceIndirectComputePass(graph, {
          id: `trace-publish-dependency-span-visibility-${chunk.chunkIndex}`,
          source: getCandidateDependencySpanVisibilityShader(chunk),
          bindings: [
            storageRead('visibilityFlags', chunk.visibility),
            storageRead('spanBatches', handles.spanBatchIndex),
            storageRead('candidateBatchIds', handles.exactCandidateBatchIds),
            uniformBinding('viewUniforms', handles.uniforms),
            storageWrite('dependencySpanVisibility', handles.dependencySpanVisibility)
          ],
          dispatchBuffer: handles.exactCandidateDispatchCommands,
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
          storageRead('candidateBatchIds', handles.exactCandidateBatchIds),
          uniformBinding('viewUniforms', handles.uniforms),
          storageRead('visibilityFlags', chunk.visibility),
          storageRead('dictionaryMetrics', handles.labelDictionaryMetrics),
          storageWrite('labelGlyphs', handles.labelGlyphs),
          storageWrite('drawCommands', handles.drawCommands),
          uniformBinding('textDictionaryStyle', handles.labelStyleUniforms)
        ],
        dispatchBuffer: handles.exactCandidateDispatchCommands,
        maximumInvocationCount: resources.spanBatchCount * TRACE_SPAN_BATCH_CAPACITY
      });
    }
    addTraceComputePass(graph, {
      id: 'trace-clear-density',
      source: getDensityClearShader(),
      bindings: [storageWrite('densityBins', handles.densityBins)],
      length: TRACE_LANE_COUNT * TRACE_DENSITY_BIN_COUNT * TRACE_GROUPS.length,
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
      activeRangeIds: graph.createDataView(handles.exactCandidateBatchIds, {
        format: 'uint32',
        length: resources.spanBatchCount
      }),
      activeRangeDispatch: handles.exactCandidateDispatchCommands,
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
      {buffer: handles.dependencies, usage: 'storage-read'},
      {buffer: handles.reachedSpans, usage: 'storage-read'},
      {buffer: handles.dependencyEndpointPositions, usage: 'storage-read'},
      {buffer: handles.densityBins, usage: 'storage-read'},
      {buffer: handles.labelGlyphs, usage: 'storage-read'},
      {buffer: handles.threadOffsets, usage: 'storage-read'},
      {buffer: handles.threadStates, usage: 'storage-read'},
      {buffer: handles.labelDictionaryGlyphRanges, usage: 'storage-read'},
      {buffer: handles.labelDictionaryGlyphRecords, usage: 'storage-read'},
      {buffer: handles.labelGlyphFrames, usage: 'storage-read'},
      {buffer: handles.labelStyleUniforms, usage: 'uniform'},
      {buffer: handles.uniforms, usage: 'uniform'},
      {buffer: handles.drawCommands, usage: 'indirect'}
    ];

    if (resources.dependencyCount > 0) {
      const endpointRoutingProps = {
        dependencyCount: resources.dependencyCount,
        spanChunks: resources.spanChunks
      };
      const visibleDependencyCountWordOffset =
        resources.drawCommands.getInstanceCountByteOffset(resources.dependencyDrawCommandIndex) /
        UINT32_BYTE_LENGTH;
      const dependencyEndpointJobs = graph.createTransientBuffer({
        id: 'trace-dependency-endpoint-jobs',
        byteLength: resources.dependencyCount * 2 * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      const candidateDependencyBatchFlags = graph.createTransientBuffer({
        id: 'trace-candidate-dependency-batch-flags',
        byteLength: resources.dependencyBatchCount * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      addTraceComputePass(graph, {
        id: 'trace-dependency-batch-visibility',
        source: getDependencyBatchVisibilityShader(resources.dependencyBatchCount),
        bindings: [
          storageRead('dependencyBatches', handles.dependencyBatchIndex),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('candidateFlags', candidateDependencyBatchFlags)
        ],
        length: resources.dependencyBatchCount
      });
      new GPUVisibilityWorkflow({
        id: 'trace-candidate-dependency-batches',
        predicates: [
          {
            kind: ['time-range', 'selection'],
            mask: graph.createDataView(candidateDependencyBatchFlags, {
              format: 'uint32',
              length: resources.dependencyBatchCount
            })
          }
        ],
        output: graph.createDataView(handles.candidateDependencyBatchIds, {
          format: 'uint32',
          length: resources.dependencyBatchCount
        }),
        count: graph.createDataView(handles.candidateDependencyDispatchCommands, {
          format: 'uint32',
          length: 1,
          byteOffset: UINT32_BYTE_LENGTH
        })
      }).addToGraph(graph);
      addTraceIndirectComputePass(graph, {
        id: 'trace-candidate-dependency-visibility',
        source: getCandidateDependencyVisibilityShader(endpointRoutingProps),
        bindings: [
          storageRead('dependencies', handles.dependencies),
          storageRead('dependencyBatches', handles.dependencyBatchIndex),
          storageRead('candidateBatchIds', handles.candidateDependencyBatchIds),
          storageRead('spanVisibility', handles.dependencySpanVisibility),
          storageRead('processStates', handles.processStates),
          storageRead('parentSpans', handles.parentSpans),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('dependencyResults', handles.dependencyResults)
        ],
        dispatchBuffer: handles.candidateDependencyDispatchCommands,
        maximumInvocationCount: resources.dependencyBatchCount * TRACE_WORKGROUP_SIZE
      });
      const visibleDependencyIds = graph.createDataView(handles.visibleDependencyIds, {
        format: 'uint32',
        length: resources.dependencyCount
      });
      const visibleDependencyCount = graph.createDataView(handles.drawCommands, {
        format: 'uint32',
        length: 1,
        byteOffset: visibleDependencyCountWordOffset * UINT32_BYTE_LENGTH
      });
      new GPUIndexedRangeCompaction({
        id: 'trace-visible-dependencies',
        flags: graph.createDataView(handles.dependencyResults, {
          format: 'uint32',
          length: resources.dependencyCount
        }),
        ranges: graph.createDataView(handles.dependencyBatchIndex, {
          format: 'uint32',
          length: resources.dependencyBatchCount * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH
        }),
        rangeCount: resources.dependencyBatchCount,
        rangeLayout: {wordStride: 6, firstIndexWordOffset: 0, countWordOffset: 1},
        activeRangeIds: graph.createDataView(handles.candidateDependencyBatchIds, {
          format: 'uint32',
          length: resources.dependencyBatchCount
        }),
        activeRangeDispatch: handles.candidateDependencyDispatchCommands,
        maximumRangeLength: TRACE_DEPENDENCY_BATCH_CAPACITY,
        output: visibleDependencyIds,
        count: visibleDependencyCount
      }).addToGraph(graph);
      const endpointScatter = new GPUChunkedIndexedScatter({
        id: 'trace-dependency-endpoints',
        sourceIds: visibleDependencyIds,
        sourceCount: visibleDependencyCount,
        routes: graph.createDataView(handles.dependencyResults, {
          format: 'uint32',
          length: resources.dependencyCount * 2,
          byteOffset: resources.dependencyCount * UINT32_BYTE_LENGTH
        }),
        routeLayout: {wordStride: 2, firstRouteWordOffset: 0, routeCount: 2},
        chunkEnds: resources.spanChunks.map(chunk => chunk.firstSpanIndex + chunk.spanCount),
        output: graph.createDataView(dependencyEndpointJobs, {
          format: 'uint32',
          length: resources.dependencyCount * 2
        })
      }).addToGraph(graph);
      for (const chunk of handles.spanChunks) {
        addTraceIndirectComputePass(graph, {
          id: `trace-resolve-routed-dependency-endpoints-${chunk.chunkIndex}`,
          source: getDependencyEndpointResolveShader(endpointRoutingProps, chunk.chunkIndex),
          bindings: [
            storageRead('spans', chunk.spans),
            storageRead('endpointJobs', dependencyEndpointJobs),
            storageRead('endpointChunkState', endpointScatter.chunkCounts.buffer),
            storageRead('dependencyResults', handles.dependencyResults),
            storageRead('processStates', handles.processStates),
            storageRead('threadStates', handles.threadStates),
            storageRead('threadOffsets', handles.threadOffsets),
            storageWrite('dependencyEndpointPositions', handles.dependencyEndpointPositions)
          ],
          dispatchBuffer: endpointScatter.dispatchCommands.buffer,
          dispatchByteOffset: chunk.chunkIndex * 3 * UINT32_BYTE_LENGTH,
          maximumInvocationCount: resources.dependencyCount * 2
        });
      }
    }
    renderResources.push({buffer: handles.visibleDependencyIds, usage: 'storage-read'});

    graph.addRenderPass({
      id: 'render-hierarchical-trace',
      workload: {
        operation: 'TraceRender',
        commandCount: resources.spanDraws.length + (resources.dependencyCount > 0 ? 1 : 0) + 2,
        maximumInvocationCount:
          resources.spanCount * 6 +
          resources.dependencyCount * 2 +
          TRACE_LANE_COUNT * TRACE_DENSITY_BIN_COUNT * 6 +
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
        encode: ({renderPass}) => {
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
        }
      })
    });
    return graph.compile();
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
        spanChunk: chunk.uniforms
      });
      resources.drawCommands.draw(encoder, draw.commandIndex);
    }

    if (resources.dependencyCount > 0) {
      encoder.setPipeline(this.dependencyModel.pipeline);
      encoder.setVertexArray(this.dependencyModel.vertexArray);
      encoder.setBindings({
        dependencies: resources.dependencies,
        visibleDependencyIds: resources.visibleDependencyIds,
        dependencyEndpointPositions: resources.dependencyEndpointPositions,
        viewUniforms: this.viewUniformBuffer
      });
      resources.drawCommands.draw(encoder, resources.dependencyDrawCommandIndex);
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
    visibilityGeneration: number,
    dependencyEndpointOffset: number
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
    unsigned[7] = this.dependencyMask;
    floats[8] = this.minimumDuration;
    floats[9] = width;
    floats[10] = height;
    unsigned[11] = this.selectedSpanIndex;
    unsigned[12] = this.focusOnly ? 1 : 0;
    floats[13] = 0.16;
    floats[14] = pick?.time ?? -1;
    floats[15] = pick?.lane ?? -1;
    unsigned[16] = visibilityGeneration;
    unsigned[17] = dependencyEndpointOffset;
    unsigned[18] = this.lodFadeEnabled ? 1 : 0;
    unsigned[19] = this.labelsEnabled ? 1 : 0;
    unsigned[20] = this.densityPattern;
    const densityBins = getTraceDensityBinParameters(this.view.timeMin, this.view.timeMax);
    floats[21] = densityBins.origin;
    floats[22] = densityBins.duration;
    this.viewUniformBuffer.write(data);
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
      this.sampledDependencyCount = values[resources.dependencyDrawCommandIndex * 4 + 1] ?? 0;
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
      this.sampledCandidateDependencyBatchCount = new Uint32Array(
        bytes.buffer,
        bytes.byteOffset,
        1
      )[0];
      this.recordWorkloadCounters();
      this.updateInspector();
    } catch {
      // Device loss and cancellation release the ring slot without affecting rendering.
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
      const pickedSpanIndex = resultWords[0];
      if (pickedSpanIndex !== INVALID_SPAN_INDEX) {
        if (pick.intent === 'select') {
          this.setSelectedSpan(pickedSpanIndex);
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
    tooltip.innerHTML = `<strong>${span.label}</strong><span>#${formatCount(span.sourceIndex)} · ${span.group} · ${span.status}</span><span>${span.start.toFixed(2)} ms + ${span.duration.toFixed(2)} ms</span><span>Process ${span.processIndex} · Thread ${span.threadIndex % TRACE_THREADS_PER_PROCESS}</span>`;
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
    this.selectedSpanIndex = spanIndex;
    resources.selectedSeeds.write(Uint32Array.from([spanIndex]));
    resources.selectedSeedCount.write(Uint32Array.from([1]));
    this.updateInspector();
  }

  private clearSelectedSpan(): void {
    this.selectedSpanIndex = INVALID_SPAN_INDEX;
    this.resources?.selectedSeedCount.write(Uint32Array.from([0]));
    this.updateInspector();
  }

  private destroyResources(): void {
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
    resources.compiled.destroy();
    resources.renderBundle.destroy();
    resources.drawCommands.destroy();
    resources.candidateDispatchCommands.destroy();
    resources.exactCandidateDispatchCommands.destroy();
    resources.densityCandidateDispatchCommands.destroy();
    resources.pickCandidateDispatchCommands.destroy();
    resources.candidateDependencyDispatchCommands.destroy();
    resources.readbackRing.destroy();
    for (const buffer of [
      ...resources.spanChunks.flatMap(chunk => [
        chunk.buffer,
        chunk.uniforms,
        chunk.visibility,
        chunk.visibleIds
      ]),
      resources.spanBatchIndex,
      resources.candidateBatchIds,
      resources.candidateChunkOffsets,
      resources.exactCandidateBatchIds,
      resources.dependencies,
      resources.dependencyBatchIndex,
      resources.candidateDependencyBatchIds,
      resources.parentSpans,
      resources.outgoingTopology,
      resources.outgoingNeighbors,
      resources.incomingTopology,
      resources.incomingNeighbors,
      resources.processStates,
      resources.threadStates,
      resources.threadHeights,
      resources.threadOffsets,
      resources.selectedSeeds,
      resources.selectedSeedCount,
      resources.focusTraversalState,
      resources.reachedSpans,
      resources.dependencyResults,
      resources.dependencyEndpointPositions,
      resources.dependencySpanVisibility,
      resources.visibleDependencyIds,
      resources.densityBins,
      resources.labelGlyphs,
      resources.pickResult
    ]) {
      buffer.destroy();
    }
    this.resources = null;
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'gpu-trace-viewer-panel',
      title: 'GPU Trace Manipulation',
      panels: [
        makeHtmlCustomPanel({
          id: 'gpu-trace-dashboard',
          title: '',
          html: `<section data-trace-dashboard>
            ${getTracePanelStyleMarkup()}
            <div class="trace-hero">
              <span class="trace-eyebrow">GPU-resident execution</span>
              <strong>One compiled graph, live trace policies</strong>
              <p>Hierarchy layout, batch culling, dependency focus, stable compaction, picking, adaptive density, and indirect draws stay on the GPU.</p>
            </div>
            <div class="trace-frame-metric-grid" data-frame-stats></div>
            <nav class="trace-tabs" role="tablist" aria-label="Trace viewer controls">
              <button type="button" role="tab" aria-selected="true" data-trace-tab="overview">Overview</button>
              <button type="button" role="tab" aria-selected="false" data-trace-tab="filters">Filters</button>
              <button type="button" role="tab" aria-selected="false" data-trace-tab="hierarchy">Hierarchy</button>
              <button type="button" role="tab" aria-selected="false" data-trace-tab="graph">GPUGraph</button>
            </nav>
            <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="overview">
              <div class="trace-metric-grid" data-capacity></div>
              <div class="trace-selection" data-selection></div>
              <section class="trace-section">
                <div class="trace-section-header"><span class="trace-section-title">Live workload</span><span class="trace-section-note">sampled GPU output</span></div>
                <div data-stats></div>
              </section>
            </div>
            <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="filters" hidden>
              ${this.getControlsHtml()}
            </div>
            <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="hierarchy" hidden>
              ${this.getHierarchyHtml()}
            </div>
            <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="graph" hidden>
              <section class="trace-section">
                <div class="trace-section-header"><span class="trace-section-title">Command graph</span><span class="trace-section-note">CPU / GPU p50 and p95</span></div>
                <div data-command-graph-inspector></div>
              </section>
            </div>
          </section>`,
          onRender: root => {
            this.frameStatsElement = root.querySelector('[data-frame-stats]');
            this.capacityElement = root.querySelector('[data-capacity]');
            this.selectionElement = root.querySelector('[data-selection]');
            this.statsElement = root.querySelector('[data-stats]');
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
            this.updateInspector();
            return () => {
              removeTabs();
              removeControls();
              removeHierarchy();
              this.frameStatsElement = null;
              this.capacityElement = null;
              this.selectionElement = null;
              this.statsElement = null;
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
        '[data-trace-tab]'
      );
      if (!button) {
        return;
      }
      const selectedTab = button.dataset.traceTab;
      for (const tab of root.querySelectorAll<HTMLButtonElement>('[data-trace-tab]')) {
        tab.setAttribute('aria-selected', String(tab === button));
      }
      for (const panel of root.querySelectorAll<HTMLElement>('[data-trace-tab-panel]')) {
        panel.hidden = panel.dataset.traceTabPanel !== selectedTab;
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }

  private getControlsHtml(): string {
    const groupControls = TRACE_GROUPS.map(
      (name, index) =>
        `<label><input type="checkbox" data-group="${index}" checked> ${name}</label>`
    ).join('');
    const statusControls = STATUS_NAMES.map(
      (name, index) =>
        `<label><input type="checkbox" data-status="${index}" checked> ${name}</label>`
    ).join('');
    return `<section data-trace-dashboard>
      ${getTracePanelStyleMarkup()}
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Dataset</span><span class="trace-section-note">rebuilds GPU resources</span></div>
        <div class="trace-control-grid">
          <label>Spans <select data-span-capacity>${this.capacityOptions
            .map(
              value =>
                `<option value="${value}"${value === this.spanCapacity ? ' selected' : ''}>${formatCount(value)}</option>`
            )
            .join('')}</select></label>
          <label>Dependencies <select data-dependency-capacity>${this.dependencyCapacityOptions
            .map(
              value =>
                `<option value="${value}"${value === this.dependencyCapacity ? ' selected' : ''}>${formatCount(value)}</option>`
            )
            .join('')}</select></label>
        </div>
        <div class="trace-context-line"><span>Independent capacities</span><span>bounded GPU chunks</span><span>stable source IDs</span></div>
        <div class="trace-context-line" data-dataset-status>${this.datasetStatus}</div>
        <div class="trace-preflight" data-dataset-preflight hidden>
          <span data-dataset-preflight-message></span>
          <div class="trace-actions"><button type="button" data-confirm-dataset>Continue</button><button type="button" data-cancel-dataset>Cancel</button></div>
        </div>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Span policy</span><span class="trace-section-note">composed on GPU</span></div>
        <div class="trace-check-grid">${groupControls}</div>
        <div class="trace-check-grid" style="margin-top:5px">${statusControls}</div>
        <div class="trace-control-stack" style="margin-top:7px">
          <label>Minimum duration <span data-duration-value>0.00 ms</span><input type="range" min="0" max="${TRACE_DURATION_FILTER_MAXIMUM}" step="0.01" value="0" data-duration></label>
        </div>
        <div class="trace-check-grid" style="margin-top:6px">
          <label><input type="checkbox" data-hide-runtime> Hide runtime spans</label>
          <label><input type="checkbox" data-errors-only> Errors only</label>
          <label><input type="checkbox" data-hide-overlapping> Hide short overlaps</label>
          <label><input type="checkbox" data-hide-similar-parents> Collapse parent chains</label>
        </div>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Dependency focus</span><span class="trace-section-note">bounded CSR traversal</span></div>
        <div class="trace-check-grid">
          <label><input type="checkbox" data-same-dependencies checked> Same-process edges</label>
          <label><input type="checkbox" data-cross-dependencies checked> Cross-process edges</label>
          <label><input type="checkbox" data-focus-only> Focused subgraph only</label>
        </div>
        <div class="trace-control-stack" style="margin-top:6px">
          <label>Focus depth <span data-focus-depth-value>${this.focusDepth}</span><input type="range" min="0" max="${MAXIMUM_FOCUS_DEPTH}" step="1" value="${this.focusDepth}" data-focus-depth></label>
        </div>
        <div class="trace-control-grid" style="margin-top:7px">
          <label>Source span <input type="number" min="0" value="0" data-source-span></label>
          <div class="trace-actions" style="align-items:end"><button type="button" data-select-span>Focus</button><button type="button" data-clear-selection>Clear</button></div>
        </div>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Timeline</span><span class="trace-section-note">hover to inspect · click to focus · drag to pan · wheel to zoom</span></div>
        <div class="trace-check-row"><label><input type="checkbox" data-auto-scroll${this.autoScroll ? ' checked' : ''}> Auto-scroll</label><label><input type="checkbox" data-lod-fade${this.lodFadeEnabled ? ' checked' : ''}> Smooth LOD fade</label><label><input type="checkbox" data-labels${this.labelsEnabled ? ' checked' : ''}> Span labels</label></div>
        <div class="trace-control-stack" style="margin-top:7px">
          <label>Density pattern <select data-density-pattern>${DENSITY_PATTERN_OPTIONS.map(
            option =>
              `<option value="${option.value}"${option.value === this.densityPattern ? ' selected' : ''}>${option.label}</option>`
          ).join('')}</select></label>
        </div>
        <div class="trace-actions" style="margin-top:6px"><button type="button" data-reset>Reset detail</button><button type="button" data-fit-trace>Fit trace</button></div>
      </section>
    </section>`;
  }

  private getHierarchyHtml(): string {
    const processes = Array.from({length: TRACE_PROCESS_COUNT}, (_, processIndex) => {
      const expanded = this.processStates[processIndex] !== TRACE_COLLAPSED_STATE;
      const threads = Array.from({length: TRACE_THREADS_PER_PROCESS}, (_, localThreadIndex) => {
        const threadIndex = processIndex * TRACE_THREADS_PER_PROCESS + localThreadIndex;
        const threadExpanded = this.threadStates[threadIndex] !== TRACE_COLLAPSED_STATE;
        return `<label style="font-size:11px"><input type="checkbox" data-thread="${threadIndex}"${threadExpanded ? ' checked' : ''}> T${localThreadIndex}</label>`;
      }).join('');
      return `<div class="trace-hierarchy-row">
        <label><input type="checkbox" data-process="${processIndex}"${expanded ? ' checked' : ''}> Process ${String(processIndex).padStart(2, '0')}</label>
        <div class="trace-hierarchy-threads">${threads}</div>
      </div>`;
    }).join('');
    return `<section data-trace-dashboard>
      ${getTracePanelStyleMarkup()}
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Hierarchy layout</span><span class="trace-section-note">process → thread → lane</span></div>
        <div class="trace-actions"><button type="button" data-expand-all>Expand all</button><button type="button" data-collapse-all>Collapse all</button></div>
        <div style="max-height:270px;overflow:auto;margin-top:5px">${processes}</div>
      </section>
    </section>`;
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
      } else if (target.matches('[data-density-pattern]')) {
        this.densityPattern = Number(target.value) as FillPatternType;
      }
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
          laneMax: TRACE_LANE_COUNT
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
        ${makeMetricCard('Shader invocations', `≤ ${formatCount(preflight.maximumInvocationCount)}`, `${invocationNodeCount}/${preflight.nodes.length} bounded nodes · fragment excluded`)}
        ${makeMetricCard('Draw calls', formatCount(drawCallCount), 'per graph frame')}
        ${makeMetricCard('Compute dispatches', formatCount(computeDispatchCount), 'per graph frame')}`;
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
        ${makeMetricCard('Device contract', capacityContract.fitsChunkedDeviceLimits ? 'Fits' : 'Exceeds', formatBytes(this.device.limits.maxStorageBufferBindingSize))}`;
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
      const densityMode = isTraceDensityMode(
        this.view.timeMin,
        this.view.timeMax,
        this.viewportWidth
      );
      const collapsedProcessCount = this.processStates.filter(
        state => state === TRACE_COLLAPSED_STATE
      ).length;
      this.statsElement.innerHTML = `<div class="trace-metric-grid">
        ${makeMetricCard('Exact spans', formatCount(visible), 'sampled visible')}
        ${makeMetricCard('Label glyphs', formatCount(this.sampledLabelGlyphCount), this.labelsEnabled ? 'fitted and GPU-culled' : 'disabled')}
        ${makeMetricCard('Visible edges', formatCount(this.sampledDependencyCount), 'sampled dependencies')}
        ${makeMetricCard('Span batches', `${formatCount(this.sampledCandidateBatchCount)}/${formatCount(resources.spanBatchCount)}`, 'candidate / total')}
        ${makeMetricCard('Edge batches', `${formatCount(this.sampledCandidateDependencyBatchCount)}/${formatCount(resources.dependencyBatchCount)}`, 'candidate / total')}
        ${makeMetricCard('CPU encode', `${this.encodeTimeMilliseconds.toFixed(2)} ms`, 'compiled graph')}
        ${makeMetricCard('Trace LOD', densityMode ? 'Hybrid density' : 'Exact', `${densityMode ? `${getDensityPatternLabel(this.densityPattern)} + wide spans` : 'individual spans'} · ${this.lodFadeEnabled ? 'smooth fade' : 'hard switch'}`)}
        ${makeMetricCard('Layout lanes', formatCount(this.getVisibleLaneCount()), `${formatCount(collapsedProcessCount)} collapsed processes`)}
        ${makeMetricCard('Transient reuse', `${stats.reusePercentage.toFixed(0)}%`, `${stats.physicalTransientBufferCount}/${stats.logicalTransientBufferCount} allocations`)}
      </div>
      <div class="trace-detail-grid">
        <span>Readback slots</span><strong>${resources.readbackRing.availableSlotCount}/${resources.readbackRing.slotCount}</strong>
        <span>Dropped telemetry</span><strong>${formatCount(this.droppedTelemetrySampleCount)}</strong>
        <span>Deferred pick frames</span><strong>${formatCount(this.deferredPickFrameCount)}</strong>
        <span>Adapter / timestamp queries</span><strong>${resources.compiled.capabilities.softwareAdapter ? 'software' : 'hardware'} · ${resources.compiled.capabilities.timestampQueries ? 'available' : 'unavailable'}</strong>
        <span>Prefix scans</span><strong>${resources.compiled.capabilities.subgroups && resources.compiled.capabilities.subgroupId ? 'subgroup accelerated' : 'portable workgroup'}</strong>
        <span>Scan GPU p50 / p95</span><strong>${scanTiming ? `${scanTiming.p50Milliseconds.toFixed(3)} / ${scanTiming.p95Milliseconds.toFixed(3)} ms · ${scanTiming.sampleCount} samples` : 'collecting'}</strong>
        <span>Logical / owned resources</span><strong>${formatBytes(stats.logicalResourceBytes)} / ${formatBytes(stats.physicalTransientResourceBytes)}</strong>
        <span>Logical / physical scratch</span><strong>${formatBytes(stats.logicalTransientBytes)} / ${formatBytes(stats.physicalTransientBytes)}</strong>
        <span>Storage binding / max buffer</span><strong>${formatBytes(this.device.limits.maxStorageBufferBindingSize)} / ${formatBytes(this.device.limits.maxBufferSize)}</strong>
      </div>`;
    }
    this.inspectorPanel?.update(this.graphInspector.getSnapshot(), resources.compiled.id);
  }

  private recordWorkloadCounters(pickActive = this.pendingPick !== null): void {
    const resources = this.resources;
    const observation = this.graphObservation;
    if (!resources || !observation) {
      return;
    }
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
        densityMode: isTraceDensityMode(this.view.timeMin, this.view.timeMax, this.viewportWidth),
        filterActive:
          this.activeFilterMask !== 0 ||
          this.minimumDuration > 0 ||
          this.enabledMask !== 0b111 ||
          this.statusMask !== (1 << TRACE_STATUS_COUNT) - 1,
        focusActive: this.focusOnly && this.selectedSpanIndex !== INVALID_SPAN_INDEX,
        pickActive,
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
      void observation.recordGPUTimings(encoding).then(() => {
        if (this.graphObservation === observation) {
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
        laneCount++;
        continue;
      }
      for (
        let localThreadIndex = 0;
        localThreadIndex < TRACE_THREADS_PER_PROCESS;
        localThreadIndex++
      ) {
        const threadIndex = processIndex * TRACE_THREADS_PER_PROCESS + localThreadIndex;
        laneCount +=
          this.threadStates[threadIndex] === TRACE_EXPANDED_STATE ? TRACE_LANES_PER_THREAD : 1;
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
  }

  private readonly clearHoveredPick = (): void => {
    this.latestHoverPickRequestIdentifier = ++this.latestPickRequestIdentifier;
    if (this.pendingPick?.intent === 'hover') {
      this.pendingPick = null;
    }
    this.hidePickTooltip();
  };

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
      this.minimumDuration,
      this.selectedSpanIndex,
      this.focusOnly ? 1 : 0,
      this.focusDepth,
      this.lodFadeEnabled ? 1 : 0,
      this.labelsEnabled ? 1 : 0,
      this.densityPattern,
      this.pendingPick?.requestIdentifier ?? -1,
      ...this.processStates,
      ...this.threadStates
    ].join(':');
  }
}

/** Splits sparse adjacency rows into two stable global-ID partitions. */
function getTopologyChunkLengths(length: number): number[] {
  if (length < 2) {
    return [length];
  }
  const firstLength = Math.floor(length / 2);
  return [firstLength, length - firstLength];
}

/** Returns the edge allocation length owned by each consecutive node partition. */
function getNeighborChunkLengths(
  offsets: Uint32Array,
  nodeChunkLengths: readonly number[]
): number[] {
  let nodeBase = 0;
  return nodeChunkLengths.map(nodeCount => {
    const neighborCount = offsets[nodeBase + nodeCount] - offsets[nodeBase];
    nodeBase += nodeCount;
    return neighborCount;
  });
}

/** Rewrites global CSR offsets as consecutive partition-local offset arrays. */
function makePartitionedOffsets(
  offsets: Uint32Array,
  nodeChunkLengths: readonly number[]
): Uint32Array {
  const partitionedOffsets: number[] = [];
  let nodeBase = 0;
  for (const nodeCount of nodeChunkLengths) {
    const neighborBase = offsets[nodeBase];
    for (let localNodeIndex = 0; localNodeIndex <= nodeCount; localNodeIndex++) {
      partitionedOffsets.push(offsets[nodeBase + localNodeIndex] - neighborBase);
    }
    nodeBase += nodeCount;
  }
  return Uint32Array.from(partitionedOffsets);
}

/** Packs sparse owner IDs and partition-local CSR offsets into one portable shader binding. */
function makeSparseTopologyRows(nodes: Uint32Array, offsets: Uint32Array): Uint32Array {
  const topology = new Uint32Array(nodes.length + offsets.length);
  topology.set(nodes);
  topology.set(offsets, nodes.length);
  return topology;
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
          total + (binding.usage === 'storage-read' ? binding.buffer.byteLength : 0),
        0
      ),
      writeByteLength: props.bindings.reduce(
        (total, binding) =>
          total + (binding.usage === 'storage-write' ? binding.buffer.byteLength : 0),
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
    workload: {
      operation: 'TraceComputeIndirect',
      commandCount: 1,
      maximumInvocationCount: props.maximumInvocationCount,
      readByteLength: props.bindings.reduce(
        (total, binding) =>
          total + (binding.usage === 'storage-read' ? binding.buffer.byteLength : 0),
        0
      ),
      writeByteLength: props.bindings.reduce(
        (total, binding) =>
          total + (binding.usage === 'storage-write' ? binding.buffer.byteLength : 0),
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
          computation.dispatchIndirect(
            computePass,
            getBuffer(props.dispatchBuffer),
            props.dispatchByteOffset
          );
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

function setBit(mask: number, bitIndex: number, enabled: boolean): number {
  return enabled ? mask | (1 << bitIndex) : mask & ~(1 << bitIndex);
}

function setMaskFlag(mask: number, flag: number, enabled: boolean): number {
  return enabled ? mask | flag : mask & ~flag;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function makeMetricCard(label: string, value: string, detail: string): string {
  return `<article class="trace-metric-card">
    <span class="trace-metric-label">${label}</span>
    <strong class="trace-metric-value">${value}</strong>
    <span class="trace-metric-detail">${detail}</span>
  </article>`;
}

function getDensityPatternLabel(pattern: FillPatternType): string {
  return DENSITY_PATTERN_OPTIONS.find(option => option.value === pattern)?.label ?? 'Solid';
}

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatBytes(value: number): string {
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MiB`
    : `${(value / 1024).toFixed(1)} KiB`;
}

function formatTraceDuration(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)} s`
    : `${value.toFixed(1)} ms`;
}
