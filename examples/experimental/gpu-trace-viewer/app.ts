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
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {
  getTraceAllocationStats,
  getTraceCapacityContract,
  getTraceWorkloadCounters,
  type TraceAllocationStats
} from './trace-benchmark';
import {
  getTraceCapacityOptions,
  getTraceDependencyCapacityOptions,
  isTraceDensityMode,
  makeTraceDataset,
  makeTraceSpanChunks,
  TRACE_COLLAPSED_STATE,
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DEPENDENCY_BATCH_CAPACITY,
  TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH,
  TRACE_DURATION,
  TRACE_EXPANDED_STATE,
  TRACE_FILTER_ERRORS_ONLY,
  TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
  TRACE_FILTER_HIDE_RUNTIME_SPANS,
  TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
  TRACE_GROUPS,
  TRACE_INVALID_SPAN_INDEX,
  TRACE_LANE_COUNT,
  TRACE_LANES_PER_THREAD,
  TRACE_PROCESS_COUNT,
  TRACE_SPAN_BATCH_CAPACITY,
  TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_STATUS_COUNT,
  TRACE_THREAD_COUNT,
  TRACE_THREADS_PER_PROCESS,
  type TraceDatasetData,
  type TraceGroupName
} from './trace-data';
import {
  getBatchVisibilityShader,
  getCandidateDensityShader,
  getCandidateDependencyVisibilityShader,
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
  getTraceDrawCommandsShader,
  TRACE_DENSITY_RENDER_SHADER,
  TRACE_DEPENDENCY_RENDER_SHADER,
  TRACE_RENDER_SHADER
} from './trace-shaders';

export const title = 'GPU Hierarchical Trace Viewer';
export const description =
  'GPU-resident hierarchical traces with live filtering, adaptive density LOD, dependency traversal, picking, and indirect rendering.';

const DEFAULT_CAPACITY = 250_000;
const DEFAULT_DEPENDENCY_CAPACITY = 250_000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const TRACE_WORKGROUP_SIZE = 256;
const TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT = Math.ceil(
  TRACE_SPAN_BATCH_CAPACITY / TRACE_WORKGROUP_SIZE
);
const VIEW_UNIFORM_BYTE_LENGTH = 80;
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
  spanBatchIndex: Buffer;
  candidateBatchIds: Buffer;
  dependencies: Buffer;
  dependencyBatchIndex: Buffer;
  candidateDependencyBatchIds: Buffer;
  parentSpans: Buffer;
  outgoingOffsets: Buffer;
  outgoingNeighbors: Buffer;
  incomingOffsets: Buffer;
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
  pickResult: Buffer;
  spanCount: number;
  spanBatchCount: number;
  dependencyBatchCount: number;
  dependencyCount: number;
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
    resources.dependencies,
    resources.dependencyBatchIndex,
    resources.candidateDependencyBatchIds,
    resources.parentSpans,
    resources.outgoingOffsets,
    resources.outgoingNeighbors,
    resources.incomingOffsets,
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
  private view: TraceViewParameters = {timeMin: 0, timeMax: 150, laneMin: 0, laneMax: 72};
  private dragging = false;
  private pointerMoved = false;
  private lastPointer: [number, number] = [0, 0];
  private pendingPick: PickPosition | null = null;
  private latestPickRequestIdentifier = 0;
  private encodeTimeMilliseconds = 0;
  private compileCount = 0;
  private compileTimeMilliseconds = 0;
  private sampledVisibleCounts = [0, 0, 0];
  private sampledDependencyCount = 0;
  private sampledCandidateBatchCount = 0;
  private sampledCandidateDependencyBatchCount = 0;
  private droppedTelemetrySampleCount = 0;
  private deferredPickFrameCount = 0;
  private frameIndex = 0;
  private viewportWidth = 1;
  private canvas: HTMLCanvasElement | null = null;
  private statsElement: HTMLElement | null = null;
  private inspectorPanel: GPUCommandGraphInspectorPanel | null = null;
  private capacityElement: HTMLElement | null = null;
  private selectionElement: HTMLElement | null = null;

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
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.rebuild(traceCapacity, dependencyCapacity);
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.style.cursor = 'grab';
      canvas.addEventListener('pointerdown', this.handlePointerDown);
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerup', this.handlePointerUp);
      canvas.addEventListener('pointercancel', this.handlePointerCancel);
      canvas.addEventListener('wheel', this.handleWheel, {passive: false});
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
      this.view.timeMin = (time * 0.025) % Math.max(TRACE_DURATION - windowSize, 1);
      this.view.timeMax = this.view.timeMin + windowSize;
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
          byteLength: UINT32_BYTE_LENGTH
        });
        queueMicrotask(() => {
          void this.samplePickedSpan(resources, readbackTicket, pick.requestIdentifier);
        });
      } else {
        this.deferredPickFrameCount++;
      }
    }
    if (this.frameIndex % 60 === 0) {
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
    if (this.frameIndex % 10 === 0) {
      this.updateInspector();
    }
  }

  override onFinalize(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
      this.canvas.removeEventListener('wheel', this.handleWheel);
    }
    this.panels.finalize();
    this.destroyResources();
    this.model.destroy();
    this.dependencyModel.destroy();
    this.densityModel.destroy();
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

  private rebuild(spanCapacity: number, dependencyCapacity: number): void {
    const started = performance.now();
    this.destroyResources();
    this.spanCapacity = spanCapacity;
    this.dependencyCapacity = dependencyCapacity;
    this.selectedSpanIndex = INVALID_SPAN_INDEX;
    const dataset = makeTraceDataset(spanCapacity, this.dependencyCapacity);
    const resources = this.createResources(dataset);
    resources.renderBundle = this.createRenderBundle(resources);
    resources.compiled = this.createGraph(resources, dataset);
    this.graphObservation = this.graphInspector.observeGraph(resources.compiled);
    this.allocationStats = getTraceAllocationStats([
      this.viewUniformBuffer,
      ...getTraceResourceBuffers(resources)
    ]);
    this.resources = resources;
    this.compileCount++;
    this.compileTimeMilliseconds = performance.now() - started;
    this.sampledVisibleCounts = TRACE_GROUPS.map(() => 0);
    this.sampledDependencyCount = 0;
    this.sampledCandidateBatchCount = 0;
    this.sampledCandidateDependencyBatchCount = 0;
    this.recordWorkloadCounters();
    this.updateInspector();
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
    const dependencyMaskByteLength = Math.max(dataset.dependencyCount, 1) * UINT32_BYTE_LENGTH;
    const densityBinCount = TRACE_LANE_COUNT * TRACE_DENSITY_BIN_COUNT;
    const topologyChunkLengths = getTopologyChunkLengths(dataset.spanCount);
    const outgoingOffsets = makePartitionedOffsets(dataset.outgoing.offsets, topologyChunkLengths);
    const incomingOffsets = makePartitionedOffsets(dataset.incoming.offsets, topologyChunkLengths);
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
    const drawCommands = new DrawCommandBuffer(this.device, {
      id: 'gpu-trace-draw-commands',
      type: 'draw',
      commands: [
        ...spanDraws.map(() => ({vertexCount: 6, instanceCount: 0})),
        {vertexCount: 2, instanceCount: 0},
        {vertexCount: 6, instanceCount: densityBinCount}
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
      commands: [{x: TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT, y: 0, z: 1}]
    });
    const pickCandidateDispatchCommands = new DispatchCommandBuffer(this.device, {
      id: 'gpu-trace-pick-candidate-dispatch-commands',
      commands: [{x: TRACE_CANDIDATE_BATCH_WORKGROUP_COUNT, y: 0, z: 1}]
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
            chunk.spanCount * UINT32_BYTE_LENGTH,
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
      spanBatchIndex: this.createDataBuffer('gpu-trace-span-batch-index', dataset.spanBatchIndex),
      candidateBatchIds: this.createStorageBuffer(
        'gpu-trace-candidate-batch-ids',
        dataset.spanBatches.length * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
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
      outgoingOffsets: this.createDataBuffer('gpu-trace-outgoing-offsets', outgoingOffsets),
      outgoingNeighbors: this.createDataBuffer(
        'gpu-trace-outgoing-neighbors',
        dataset.outgoing.neighbors
      ),
      incomingOffsets: this.createDataBuffer('gpu-trace-incoming-offsets', incomingOffsets),
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
        densityBinCount * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      pickResult: this.createStorageBuffer(
        'gpu-trace-picked-span',
        UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      spanCount: dataset.spanCount,
      spanBatchCount: dataset.spanBatches.length,
      dependencyBatchCount: dataset.dependencyBatches.length,
      dependencyCount: dataset.dependencyCount
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
      outgoingOffsets: importTraceBuffer(graph, 'outgoing-offsets', resources.outgoingOffsets),
      outgoingNeighbors: importTraceBuffer(
        graph,
        'outgoing-neighbors',
        resources.outgoingNeighbors
      ),
      incomingOffsets: importTraceBuffer(graph, 'incoming-offsets', resources.incomingOffsets),
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
      pickResult: importTraceBuffer(graph, 'pick-result', resources.pickResult),
      drawCommands: importTraceBuffer(graph, 'draw-commands', resources.drawCommands.buffer)
    };
    const spanVisibility = makeTraceGraphVector(
      'trace-span-visibility',
      handles.spanChunks.map(chunk =>
        graph.createDataView(chunk.visibility, {format: 'uint32', length: chunk.spanCount})
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
    const topologyChunkLengths = getTopologyChunkLengths(resources.spanCount);
    const outgoingNeighborChunkLengths = getNeighborChunkLengths(
      dataset.outgoing.offsets,
      topologyChunkLengths
    );
    const incomingNeighborChunkLengths = getNeighborChunkLengths(
      dataset.incoming.offsets,
      topologyChunkLengths
    );

    const candidateBatchFlags = graph.createTransientBuffer({
      id: 'trace-candidate-batch-flags',
      byteLength: Math.max(resources.spanBatchCount, 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    addTraceComputePass(graph, {
      id: 'trace-batch-visibility',
      source: getBatchVisibilityShader(resources.spanBatchCount),
      bindings: [
        storageRead('spanBatches', handles.spanBatchIndex),
        uniformBinding('viewUniforms', handles.uniforms),
        storageWrite('candidateFlags', candidateBatchFlags)
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
    addTraceComputePass(graph, {
      id: 'trace-candidate-pass-dispatch',
      source: getCandidatePassDispatchShader(),
      bindings: [
        storageRead('candidateDispatchCommand', handles.candidateDispatchCommands),
        uniformBinding('viewUniforms', handles.uniforms),
        storageWrite('exactDispatchCommand', handles.exactCandidateDispatchCommands),
        storageWrite('densityDispatchCommand', handles.densityCandidateDispatchCommands),
        storageWrite('pickDispatchCommand', handles.pickCandidateDispatchCommands),
        storageRead('processStates', handles.processStates)
      ],
      length: 1,
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
        byteLength: Math.max(resources.spanCount, 1) * UINT32_BYTE_LENGTH,
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
      let sourceNodeBase = 0;
      let offsetWordBase = 0;
      let outgoingNeighborWordBase = 0;
      let incomingNeighborWordBase = 0;
      for (const [partitionIndex, sourceNodeCount] of topologyChunkLengths.entries()) {
        for (const direction of [
          {
            name: 'outgoing',
            offsets: handles.outgoingOffsets,
            neighbors: handles.outgoingNeighbors,
            neighborWordBase: outgoingNeighborWordBase,
            neighborCount: outgoingNeighborChunkLengths[partitionIndex]
          },
          {
            name: 'incoming',
            offsets: handles.incomingOffsets,
            neighbors: handles.incomingNeighbors,
            neighborWordBase: incomingNeighborWordBase,
            neighborCount: incomingNeighborChunkLengths[partitionIndex]
          }
        ]) {
          addTraceIndirectComputePass(graph, {
            id: `trace-focus-frontier-${depth}-${direction.name}-${partitionIndex}`,
            source: getFocusFrontierExpansionShader({
              spanCount: resources.spanCount,
              sourceNodeBase,
              sourceNodeCount,
              offsetWordBase,
              neighborWordBase: direction.neighborWordBase,
              neighborCount: direction.neighborCount,
              depth
            }),
            bindings: [
              storageRead('offsets', direction.offsets),
              storageRead('neighbors', direction.neighbors),
              storageRead('frontier', focusFrontiers[currentFrontierIndex]),
              storageRead('frontierCount', focusFrontierCounts[currentFrontierIndex]),
              storageWrite('nextFrontier', focusFrontiers[nextFrontierIndex]),
              storageWrite('nextFrontierCount', focusFrontierCounts[nextFrontierIndex]),
              storageWrite('reachedSpans', handles.reachedSpans),
              storageRead('focusTraversalState', handles.focusTraversalState)
            ],
            dispatchBuffer: focusDispatchCommands[currentFrontierIndex]
          });
        }
        sourceNodeBase += sourceNodeCount;
        offsetWordBase += sourceNodeCount + 1;
        outgoingNeighborWordBase += outgoingNeighborChunkLengths[partitionIndex];
        incomingNeighborWordBase += incomingNeighborChunkLengths[partitionIndex];
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
        dispatchBuffer: handles.exactCandidateDispatchCommands
      });
      if (resources.dependencyCount > 0) {
        graph.addCopyPass({
          id: `trace-copy-dependency-span-visibility-${chunk.chunkIndex}`,
          resources: [
            {buffer: chunk.visibility, usage: 'copy-source'},
            {buffer: handles.dependencySpanVisibility, usage: 'copy-destination'}
          ],
          compile: () => ({
            encode: ({commandEncoder, getBuffer}) => {
              commandEncoder.copyBufferToBuffer({
                sourceBuffer: getBuffer(chunk.visibility),
                destinationBuffer: getBuffer(handles.dependencySpanVisibility),
                destinationOffset: chunk.firstSpanIndex * UINT32_BYTE_LENGTH,
                size: chunk.spanCount * UINT32_BYTE_LENGTH
              });
            }
          })
        });
      }
    }
    addTraceComputePass(graph, {
      id: 'trace-clear-density',
      source: getDensityClearShader(),
      bindings: [storageWrite('densityBins', handles.densityBins)],
      length: TRACE_LANE_COUNT * TRACE_DENSITY_BIN_COUNT,
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
          storageWrite('densityBins', handles.densityBins)
        ],
        dispatchBuffer: handles.densityCandidateDispatchCommands
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
          storageWrite('pickResult', handles.pickResult)
        ],
        dispatchBuffer: handles.pickCandidateDispatchCommands
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
      ranges: graph.createDataView(handles.spanBatchIndex, {
        format: 'uint32',
        length: resources.spanBatchCount * 8
      }),
      rangeCount: resources.spanBatchCount,
      rangeLayout: {wordStride: 8, firstIndexWordOffset: 0, countWordOffset: 1},
      partitionRangeEnds: resources.spanChunks.map(
        chunk => chunk.firstBatchIndex + chunk.batchCount
      ),
      activeRangeIds: graph.createDataView(handles.candidateBatchIds, {
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
        dispatchBuffer: handles.candidateDependencyDispatchCommands
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
          dispatchByteOffset: chunk.chunkIndex * 3 * UINT32_BYTE_LENGTH
        });
      }
    }
    renderResources.push({buffer: handles.visibleDependencyIds, usage: 'storage-read'});

    graph.addRenderPass({
      id: 'render-hierarchical-trace',
      resources: renderResources,
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'gpu-hierarchical-trace-render-pass',
          clearColor: [0.012, 0.018, 0.035, 1],
          clearDepth: false,
          clearStencil: false
        }),
        encode: ({renderPass}) => renderPass.executeBundles([resources.renderBundle])
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

  /** Reads a single explicitly requested GPU-picked source row after the frame is submitted. */
  private async samplePickedSpan(
    resources: TraceGraphResources,
    readbackTicket: GPUReadbackTicket,
    requestIdentifier: number
  ): Promise<void> {
    try {
      const bytes = await readbackTicket.read();
      if (resources !== this.resources || requestIdentifier !== this.latestPickRequestIdentifier) {
        return;
      }
      const pickedSpanIndex = new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
      if (pickedSpanIndex !== INVALID_SPAN_INDEX) {
        this.setSelectedSpan(pickedSpanIndex);
      }
    } catch {
      // Device loss and cancellation release the ring slot without changing the selection.
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
      resources.dependencies,
      resources.dependencyBatchIndex,
      resources.candidateDependencyBatchIds,
      resources.parentSpans,
      resources.outgoingOffsets,
      resources.outgoingNeighbors,
      resources.incomingOffsets,
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
          id: 'gpu-trace-overview',
          title: '',
          html: '<p style="margin:0;line-height:1.5">A fixed WebGPU command graph owns hierarchical layout, composed filters, dependency traversal, picking, adaptive exact-or-density rendering, and indirect draws.</p>'
        }),
        makeHtmlCustomPanel({
          id: 'gpu-trace-controls',
          title: 'Trace controls',
          html: this.getControlsHtml(),
          onRender: root => this.bindPanelControls(root)
        }),
        makeHtmlCustomPanel({
          id: 'gpu-trace-processes',
          title: 'Processes and threads',
          html: this.getHierarchyHtml(),
          onRender: root => this.bindHierarchyControls(root)
        }),
        makeHtmlCustomPanel({
          id: 'gpu-trace-stats',
          title: 'Live GPU graph',
          html: '<div data-capacity></div><div data-selection style="margin-top:8px"></div><div data-stats></div><div data-command-graph-inspector style="margin-top:10px"></div>',
          onRender: root => {
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
            this.updateInspector();
            return () => {
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

  private getControlsHtml(): string {
    const groupControls = TRACE_GROUPS.map(
      (name, index) =>
        `<label><input type="checkbox" data-group="${index}" checked> ${name}</label>`
    ).join('');
    const statusControls = STATUS_NAMES.map(
      (name, index) =>
        `<label><input type="checkbox" data-status="${index}" checked> ${name}</label>`
    ).join('');
    return `<div style="display:grid;gap:10px">
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
      <small>Span and dependency capacity are independent; endpoint positions resolve across bounded GPU chunks.</small>
      <fieldset style="display:grid;gap:4px"><legend>Span groups</legend>${groupControls}</fieldset>
      <fieldset style="display:grid;gap:4px"><legend>Status</legend>${statusControls}</fieldset>
      <label>Minimum duration <input type="range" min="0" max="20" step="0.25" value="0" data-duration> <span data-duration-value>0.00 ms</span></label>
      <label><input type="checkbox" data-hide-runtime> Hide runtime spans</label>
      <label><input type="checkbox" data-errors-only> Errors only</label>
      <label><input type="checkbox" data-hide-overlapping> Hide short overlapping children</label>
      <label><input type="checkbox" data-hide-similar-parents> Collapse similar parent chains</label>
      <fieldset style="display:grid;gap:4px"><legend>Dependencies</legend>
        <label><input type="checkbox" data-same-dependencies checked> Same-process edges</label>
        <label><input type="checkbox" data-cross-dependencies checked> Cross-process edges</label>
        <label>Focus depth <input type="range" min="0" max="${MAXIMUM_FOCUS_DEPTH}" step="1" value="${this.focusDepth}" data-focus-depth> <span data-focus-depth-value>${this.focusDepth}</span></label>
        <label><input type="checkbox" data-focus-only> Show focused subgraph only</label>
      </fieldset>
      <label>Source span <input type="number" min="0" value="0" data-source-span style="width:100px"></label>
      <div style="display:flex;gap:6px"><button type="button" data-select-span>Focus span</button><button type="button" data-clear-selection>Clear selection</button></div>
      <label><input type="checkbox" data-auto-scroll${this.autoScroll ? ' checked' : ''}> Auto-scroll</label>
      <button type="button" data-reset>Reset view</button>
      <small>Click a span to pick it on the GPU. Drag to pan; use the wheel to zoom.</small>
    </div>`;
  }

  private getHierarchyHtml(): string {
    const processes = Array.from({length: TRACE_PROCESS_COUNT}, (_, processIndex) => {
      const expanded = this.processStates[processIndex] !== TRACE_COLLAPSED_STATE;
      const threads = Array.from({length: TRACE_THREADS_PER_PROCESS}, (_, localThreadIndex) => {
        const threadIndex = processIndex * TRACE_THREADS_PER_PROCESS + localThreadIndex;
        const threadExpanded = this.threadStates[threadIndex] !== TRACE_COLLAPSED_STATE;
        return `<label style="font-size:11px"><input type="checkbox" data-thread="${threadIndex}"${threadExpanded ? ' checked' : ''}> T${localThreadIndex}</label>`;
      }).join('');
      return `<div style="display:grid;gap:3px;padding:5px 0;border-bottom:1px solid color-mix(in srgb,currentColor 12%,transparent)">
        <label><input type="checkbox" data-process="${processIndex}"${expanded ? ' checked' : ''}> Process ${String(processIndex).padStart(2, '0')}</label>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding-left:16px">${threads}</div>
      </div>`;
    }).join('');
    return `<div style="display:grid;gap:6px">
      <div style="display:flex;gap:6px"><button type="button" data-expand-all>Expand all</button><button type="button" data-collapse-all>Collapse all</button></div>
      <div style="max-height:270px;overflow:auto">${processes}</div>
    </div>`;
  }

  private bindPanelControls(root: HTMLElement): () => void {
    const onChange = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
        return;
      }
      if (target instanceof HTMLSelectElement && event.type !== 'change') {
        return;
      }
      if (target.matches('[data-span-capacity]')) {
        this.rebuild(Number(target.value), this.dependencyCapacity);
        const dependencyCapacity = root.querySelector<HTMLSelectElement>(
          '[data-dependency-capacity]'
        );
        if (dependencyCapacity) {
          dependencyCapacity.value = String(this.dependencyCapacity);
        }
      } else if (target.matches('[data-dependency-capacity]')) {
        this.rebuild(this.spanCapacity, Number(target.value));
        target.value = String(this.dependencyCapacity);
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
        this.view = {timeMin: 0, timeMax: 150, laneMin: 0, laneMax: 72};
        this.autoScroll = false;
        const autoScroll = root.querySelector<HTMLInputElement>('[data-auto-scroll]');
        if (autoScroll) {
          autoScroll.checked = false;
        }
      }
    };
    root.addEventListener('change', onChange);
    root.addEventListener('input', onChange);
    root.addEventListener('click', onClick);
    return () => {
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
    if (this.capacityElement) {
      const capacityContract = getTraceCapacityContract(
        this.spanCapacity,
        this.dependencyCapacity,
        this.device.limits
      );
      this.capacityElement.innerHTML = `<strong>${formatCount(this.spanCapacity)}</strong> spans · <strong>${formatCount(resources.spanBatchCount)}</strong> batches · <strong>${formatCount(resources.dependencyCount)}/${formatCount(this.dependencyCapacity)}</strong> dependencies · graph compile #${this.compileCount} (${this.compileTimeMilliseconds.toFixed(1)} ms)<br><small>${resources.spanChunks.length} span chunk${resources.spanChunks.length === 1 ? '' : 's'} · ${formatBytes(this.allocationStats.persistentByteLength)} persistent in ${formatCount(this.allocationStats.bufferCount)} buffers · largest ${formatBytes(this.allocationStats.largestBufferByteLength)} · chunked contract ${capacityContract.fitsChunkedDeviceLimits ? 'fits device' : 'exceeds device'}</small>`;
    }
    if (this.selectionElement) {
      this.selectionElement.textContent =
        this.selectedSpanIndex === INVALID_SPAN_INDEX
          ? 'No span selected; click a span or enter its source ID.'
          : `Selected source span ${formatCount(this.selectedSpanIndex)} · ${this.focusDepth} dependency hops`;
    }
    if (this.statsElement) {
      const visible = this.sampledVisibleCounts.reduce((sum, count) => sum + count, 0);
      this.statsElement.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto;gap:4px 12px;margin-top:8px">
        <span>Sampled exact spans</span><strong>${formatCount(visible)}</strong>
        <span>Sampled visible edges</span><strong>${formatCount(this.sampledDependencyCount)}</strong>
        <span>Candidate span batches</span><strong>${formatCount(this.sampledCandidateBatchCount)}/${formatCount(resources.spanBatchCount)}</strong>
        <span>Candidate dependency batches</span><strong>${formatCount(this.sampledCandidateDependencyBatchCount)}/${formatCount(resources.dependencyBatchCount)}</strong>
        <span>Visible layout lanes</span><strong>${formatCount(this.getVisibleLaneCount())}</strong>
        <span>Collapsed processes</span><strong>${formatCount(this.processStates.filter(state => state === TRACE_COLLAPSED_STATE).length)}</strong>
        <span>CPU graph encode</span><strong>${this.encodeTimeMilliseconds.toFixed(2)} ms</strong>
        <span>Trace LOD</span><strong>${isTraceDensityMode(this.view.timeMin, this.view.timeMax, this.viewportWidth) ? 'density bins' : 'exact spans'}</strong>
        <span>Readback slots</span><strong>${resources.readbackRing.availableSlotCount}/${resources.readbackRing.slotCount}</strong>
        <span>Dropped telemetry samples</span><strong>${formatCount(this.droppedTelemetrySampleCount)}</strong>
        <span>Deferred pick frames</span><strong>${formatCount(this.deferredPickFrameCount)}</strong>
        <span>Adapter</span><strong>${resources.compiled.capabilities.softwareAdapter ? 'software' : 'hardware'}</strong>
        <span>Maximum storage binding</span><strong>${formatBytes(this.device.limits.maxStorageBufferBindingSize)}</strong>
        <span>Maximum buffer</span><strong>${formatBytes(this.device.limits.maxBufferSize)}</strong>
        <span>Timestamp queries</span><strong>${resources.compiled.capabilities.timestampQueries ? 'available' : 'unavailable'}</strong>
        <span>Logical resources</span><strong>${formatBytes(stats.logicalResourceBytes)}</strong>
        <span>Owned transients</span><strong>${formatBytes(stats.physicalTransientResourceBytes)}</strong>
        <span>Logical scratch</span><strong>${formatBytes(stats.logicalTransientBytes)}</strong>
        <span>Physical scratch</span><strong>${formatBytes(stats.physicalTransientBytes)}</strong>
        <span>Transient reuse</span><strong>${stats.reusePercentage.toFixed(0)}%</strong>
        <span>Physical allocations</span><strong>${stats.physicalTransientBufferCount}/${stats.logicalTransientBufferCount}</strong>
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

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.dragging = true;
    this.pointerMoved = false;
    this.autoScroll = false;
    this.lastPointer = [event.clientX, event.clientY];
    this.canvas?.setPointerCapture(event.pointerId);
    if (this.canvas) {
      this.canvas.style.cursor = 'grabbing';
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging || !this.canvas) {
      return;
    }
    const [lastX, lastY] = this.lastPointer;
    const horizontalMovement = event.clientX - lastX;
    const verticalMovement = event.clientY - lastY;
    if (Math.abs(horizontalMovement) + Math.abs(verticalMovement) > 2) {
      this.pointerMoved = true;
    }
    const rectangle = this.canvas.getBoundingClientRect();
    const timeRange = this.view.timeMax - this.view.timeMin;
    const laneRange = this.view.laneMax - this.view.laneMin;
    this.view.timeMin -= (horizontalMovement / rectangle.width) * timeRange;
    this.view.timeMax -= (horizontalMovement / rectangle.width) * timeRange;
    const maximumLaneStart = Math.max(0, TRACE_LANE_COUNT - laneRange);
    this.view.laneMin = clamp(
      this.view.laneMin + (verticalMovement / rectangle.height) * laneRange,
      0,
      maximumLaneStart
    );
    this.view.laneMax = this.view.laneMin + laneRange;
    this.lastPointer = [event.clientX, event.clientY];
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.canvas && !this.pointerMoved) {
      const rectangle = this.canvas.getBoundingClientRect();
      const horizontalFraction = clamp((event.clientX - rectangle.left) / rectangle.width, 0, 1);
      const verticalFraction = clamp((event.clientY - rectangle.top) / rectangle.height, 0, 1);
      this.latestPickRequestIdentifier++;
      this.pendingPick = {
        time: this.view.timeMin + horizontalFraction * (this.view.timeMax - this.view.timeMin),
        lane: this.view.laneMin + verticalFraction * (this.view.laneMax - this.view.laneMin),
        requestIdentifier: this.latestPickRequestIdentifier
      };
    }
    this.finishPointerInteraction(event);
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    this.finishPointerInteraction(event);
  };

  private finishPointerInteraction(event: PointerEvent): void {
    this.dragging = false;
    if (this.canvas?.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    if (this.canvas) {
      this.canvas.style.cursor = 'grab';
    }
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    if (!this.canvas) {
      return;
    }
    event.preventDefault();
    this.autoScroll = false;
    const rectangle = this.canvas.getBoundingClientRect();
    const fraction = clamp((event.clientX - rectangle.left) / rectangle.width, 0, 1);
    const previousRange = this.view.timeMax - this.view.timeMin;
    const nextRange = clamp(
      previousRange * Math.exp(event.deltaY * 0.0015),
      0.5,
      TRACE_DURATION * 1.5
    );
    const anchor = this.view.timeMin + previousRange * fraction;
    this.view.timeMin = anchor - nextRange * fraction;
    this.view.timeMax = this.view.timeMin + nextRange;
  };
}

/** Splits source-aligned topology into two stable global-ID partitions. */
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
  }
): void {
  graph.addComputePass({
    id: props.id,
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

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatBytes(value: number): string {
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MiB`
    : `${(value / 1024).toFixed(1)} KiB`;
}
