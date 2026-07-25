// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device, type RenderBundle} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Computation, Model} from '@luma.gl/engine';
import {
  DrawCommandBuffer,
  GPUAncestorProjection,
  GPUCommandGraph,
  GPUCompaction,
  GPUGraphTraversal,
  GPUHierarchyLayout,
  GPUMask,
  type CompiledGPUCommandGraph,
  type GraphBufferHandle,
  type GraphBufferUse
} from '@luma.gl/experimental';
import {ColumnPanel, type Panel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  makeTraceDataset,
  TRACE_ACTIVITY_BIN_COUNT,
  TRACE_COLLAPSED_STATE,
  TRACE_DURATION,
  TRACE_EXPANDED_STATE,
  TRACE_GROUPS,
  TRACE_INVALID_SPAN_INDEX,
  TRACE_LANE_COUNT,
  TRACE_LANES_PER_THREAD,
  TRACE_PROCESS_COUNT,
  TRACE_STATUS_COUNT,
  TRACE_THREAD_COUNT,
  TRACE_THREADS_PER_PROCESS,
  type TraceDatasetData,
  type TraceGroupName
} from './trace-data';
import {
  getActivityAccumulationShader,
  getActivityClearShader,
  getDependencyVisibilityShader,
  getFocusMaskShader,
  getPickClearShader,
  getVisibilityShader,
  TRACE_ACTIVITY_RENDER_SHADER,
  TRACE_DEPENDENCY_RENDER_SHADER,
  TRACE_RENDER_SHADER
} from './trace-shaders';

export const title = 'GPU Hierarchical Trace Viewer';
export const description =
  'GPU-resident hierarchical traces with live filtering, process and thread collapse, dependency traversal, picking, and indirect rendering.';

const CAPACITY_OPTIONS = [250_000, 1_000_000, 4_000_000] as const;
const DEFAULT_CAPACITY = 250_000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const TRACE_WORKGROUP_SIZE = 256;
const VIEW_UNIFORM_BYTE_LENGTH = 64;
const MAXIMUM_FOCUS_DEPTH = 4;
const INVALID_SPAN_INDEX = TRACE_INVALID_SPAN_INDEX;
const STATUS_NAMES = ['ok', 'waiting', 'active', 'error'] as const;

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
  visibleIds: Buffer;
};

type PickPosition = {
  time: number;
  lane: number;
};

type TraceGraphResources = {
  compiled: CompiledGPUCommandGraph<TraceViewParameters>;
  drawCommands: DrawCommandBuffer;
  renderBundle: RenderBundle;
  groups: TraceGroupResources[];
  spans: Buffer;
  dependencies: Buffer;
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
  traversalDepth: Buffer;
  reachedSpans: Buffer;
  visibleAncestors: Buffer;
  focusMask: Buffer;
  baseVisibility: Buffer;
  spanVisibility: Buffer;
  visibleDependencyIds: Buffer;
  activityBins: Buffer;
  pickResult: Buffer;
  spanCount: number;
  dependencyCount: number;
};

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
  readonly activityModel: Model;
  readonly viewUniformBuffer: Buffer;
  readonly panels: ExamplePanelManager;

  private resources: TraceGraphResources | null = null;
  private capacity = DEFAULT_CAPACITY;
  private enabledMask = 0b111;
  private statusMask = (1 << TRACE_STATUS_COUNT) - 1;
  private dependencyMask = 0b11;
  private filterFlags = 0;
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
  private pickReadPending = false;
  private encodeTimeMilliseconds = 0;
  private compileCount = 0;
  private compileTimeMilliseconds = 0;
  private sampledVisibleCounts = [0, 0, 0];
  private sampledDependencyCount = 0;
  private countReadPending = false;
  private frameIndex = 0;
  private canvas: HTMLCanvasElement | null = null;
  private statsElement: HTMLElement | null = null;
  private nodesElement: HTMLElement | null = null;
  private capacityElement: HTMLElement | null = null;
  private selectionElement: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('GPU Hierarchical Trace Viewer requires WebGPU');
    }
    this.device = device;
    this.viewUniformBuffer = device.createBuffer({
      id: 'gpu-trace-view-uniforms',
      byteLength: VIEW_UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = this.createSpanModel();
    this.dependencyModel = this.createDependencyModel();
    this.activityModel = this.createActivityModel();
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.rebuild(DEFAULT_CAPACITY);
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
    if (this.autoScroll) {
      const windowSize = this.view.timeMax - this.view.timeMin;
      this.view.timeMin = (time * 0.025) % Math.max(TRACE_DURATION - windowSize, 1);
      this.view.timeMax = this.view.timeMin + windowSize;
    }
    const pick = this.pendingPick;
    this.writeViewUniforms(width, height, pick);
    const encodeStart = performance.now();
    resources.compiled.encode(device.commandEncoder, {parameters: this.view});
    this.encodeTimeMilliseconds = performance.now() - encodeStart;
    this.frameIndex++;
    if (pick && !this.pickReadPending) {
      this.pendingPick = null;
      this.pickReadPending = true;
      queueMicrotask(() => {
        void this.samplePickedSpan(resources);
      });
    }
    if (this.frameIndex % 60 === 0) {
      void this.sampleVisibleCounts();
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
    this.activityModel.destroy();
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
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 5}
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
          {name: 'spans', type: 'read-only-storage', group: 0, location: 2},
          {name: 'processStates', type: 'read-only-storage', group: 0, location: 3},
          {name: 'threadStates', type: 'read-only-storage', group: 0, location: 4},
          {name: 'threadOffsets', type: 'read-only-storage', group: 0, location: 5},
          {name: 'visibleAncestors', type: 'read-only-storage', group: 0, location: 6},
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 7}
        ]
      },
      parameters: makeTraceBlendParameters()
    });
  }

  private createActivityModel(): Model {
    return new Model(this.device, {
      id: 'gpu-trace-collapsed-activity-model',
      source: TRACE_ACTIVITY_RENDER_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'activityBins', type: 'read-only-storage', group: 0, location: 0},
          {name: 'processStates', type: 'read-only-storage', group: 0, location: 1},
          {name: 'threadOffsets', type: 'read-only-storage', group: 0, location: 2},
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 3}
        ]
      },
      parameters: makeTraceBlendParameters()
    });
  }

  private rebuild(capacity: number): void {
    const started = performance.now();
    this.destroyResources();
    this.capacity = capacity;
    this.selectedSpanIndex = INVALID_SPAN_INDEX;
    const dataset = makeTraceDataset(capacity);
    const resources = this.createResources(dataset);
    resources.renderBundle = this.createRenderBundle(resources);
    resources.compiled = this.createGraph(resources, dataset);
    this.resources = resources;
    this.compileCount++;
    this.compileTimeMilliseconds = performance.now() - started;
    this.sampledVisibleCounts = TRACE_GROUPS.map(() => 0);
    this.sampledDependencyCount = 0;
    this.updateInspector();
  }

  /** Uploads each canonical source or mutable interaction allocation exactly once. */
  private createResources(dataset: TraceDatasetData): TraceGraphResources {
    const groups = dataset.groups.map(group => ({
      name: group.name,
      count: group.count,
      firstSpanIndex: group.firstSpanIndex,
      visibleIds: this.device.createBuffer({
        id: `gpu-trace-${group.name}-visible-ids`,
        byteLength: Math.max(group.count, 1) * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE | Buffer.COPY_SRC
      })
    }));
    const spanMaskByteLength = Math.max(dataset.spanCount, 1) * UINT32_BYTE_LENGTH;
    const dependencyMaskByteLength = Math.max(dataset.dependencyCount, 1) * UINT32_BYTE_LENGTH;
    const activityBinCount = TRACE_PROCESS_COUNT * TRACE_ACTIVITY_BIN_COUNT;
    const drawCommands = new DrawCommandBuffer(this.device, {
      id: 'gpu-trace-draw-commands',
      type: 'draw',
      commands: [
        ...groups.map(() => ({vertexCount: 6, instanceCount: 0})),
        {vertexCount: 2, instanceCount: 0},
        {vertexCount: 6, instanceCount: activityBinCount}
      ]
    });
    return {
      compiled: undefined!,
      renderBundle: undefined!,
      drawCommands,
      groups,
      spans: this.createDataBuffer('gpu-trace-spans', dataset.spans),
      dependencies: this.createDataBuffer('gpu-trace-dependencies', dataset.dependencies),
      parentSpans: this.createDataBuffer('gpu-trace-parent-spans', dataset.parentSpans),
      outgoingOffsets: this.createDataBuffer(
        'gpu-trace-outgoing-offsets',
        dataset.outgoing.offsets
      ),
      outgoingNeighbors: this.createDataBuffer(
        'gpu-trace-outgoing-neighbors',
        dataset.outgoing.neighbors
      ),
      incomingOffsets: this.createDataBuffer(
        'gpu-trace-incoming-offsets',
        dataset.incoming.offsets
      ),
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
      traversalDepth: this.createDataBuffer(
        'gpu-trace-focus-depth',
        Uint32Array.from([this.focusDepth])
      ),
      reachedSpans: this.createStorageBuffer(
        'gpu-trace-reached-spans',
        spanMaskByteLength,
        Buffer.COPY_SRC
      ),
      visibleAncestors: this.createStorageBuffer(
        'gpu-trace-visible-ancestors',
        spanMaskByteLength,
        Buffer.COPY_SRC
      ),
      focusMask: this.createStorageBuffer('gpu-trace-focus-mask', spanMaskByteLength),
      baseVisibility: this.createStorageBuffer('gpu-trace-base-visibility', spanMaskByteLength),
      spanVisibility: this.createStorageBuffer('gpu-trace-span-visibility', spanMaskByteLength),
      visibleDependencyIds: this.createStorageBuffer(
        'gpu-trace-visible-dependencies',
        dependencyMaskByteLength
      ),
      activityBins: this.createStorageBuffer(
        'gpu-trace-activity-bins',
        activityBinCount * UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      pickResult: this.createStorageBuffer(
        'gpu-trace-picked-span',
        UINT32_BYTE_LENGTH,
        Buffer.COPY_SRC
      ),
      spanCount: dataset.spanCount,
      dependencyCount: dataset.dependencyCount
    };
  }

  private createDataBuffer(id: string, data: Uint32Array): Buffer {
    return this.device.createBuffer({
      id,
      data: data.length > 0 ? data : new Uint32Array(1),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
  }

  private createStorageBuffer(id: string, byteLength: number, additionalUsage = 0): Buffer {
    return this.device.createBuffer({
      id,
      byteLength: Math.max(byteLength, UINT32_BYTE_LENGTH),
      usage: Buffer.STORAGE | additionalUsage
    });
  }

  /** Compiles the complete immutable hierarchy, focus, visibility, edge, and activity graph. */
  private createGraph(
    resources: TraceGraphResources,
    dataset: TraceDatasetData
  ): CompiledGPUCommandGraph<TraceViewParameters> {
    const graph = new GPUCommandGraph<TraceViewParameters>(this.device, {
      id: 'gpu-hierarchical-trace-command-graph'
    });
    const handles = {
      uniforms: importTraceBuffer(graph, 'view-uniforms', this.viewUniformBuffer),
      spans: importTraceBuffer(graph, 'spans', resources.spans),
      dependencies: importTraceBuffer(graph, 'dependencies', resources.dependencies),
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
      traversalDepth: importTraceBuffer(graph, 'traversal-depth', resources.traversalDepth),
      reachedSpans: importTraceBuffer(graph, 'reached-spans', resources.reachedSpans),
      visibleAncestors: importTraceBuffer(graph, 'visible-ancestors', resources.visibleAncestors),
      focusMask: importTraceBuffer(graph, 'focus-mask', resources.focusMask),
      baseVisibility: importTraceBuffer(graph, 'base-visibility', resources.baseVisibility),
      spanVisibility: importTraceBuffer(graph, 'span-visibility', resources.spanVisibility),
      visibleDependencyIds: importTraceBuffer(
        graph,
        'visible-dependency-ids',
        resources.visibleDependencyIds
      ),
      activityBins: importTraceBuffer(graph, 'activity-bins', resources.activityBins),
      pickResult: importTraceBuffer(graph, 'pick-result', resources.pickResult),
      drawCommands: importTraceBuffer(graph, 'draw-commands', resources.drawCommands.buffer)
    };

    new GPUHierarchyLayout({
      id: 'trace-process-thread-layout',
      parentStates: graph.createDataView(handles.processStates, {
        format: 'uint32',
        length: TRACE_PROCESS_COUNT
      }),
      childStates: graph.createDataView(handles.threadStates, {
        format: 'uint32',
        length: TRACE_THREAD_COUNT
      }),
      heights: graph.createDataView(handles.threadHeights, {
        format: 'uint32',
        length: TRACE_THREAD_COUNT
      }),
      offsets: graph.createDataView(handles.threadOffsets, {
        format: 'uint32',
        length: TRACE_THREAD_COUNT
      }),
      childrenPerParent: TRACE_THREADS_PER_PROCESS,
      expandedChildHeight: TRACE_LANES_PER_THREAD,
      collapsedChildHeight: 1,
      collapsedParentHeight: 1
    }).addToGraph(graph);

    new GPUGraphTraversal({
      id: 'trace-selected-dependencies',
      offsets: graph.createDataView(handles.outgoingOffsets, {
        format: 'uint32',
        length: dataset.outgoing.offsets.length
      }),
      neighbors: graph.createDataView(handles.outgoingNeighbors, {
        format: 'uint32',
        length: dataset.outgoing.neighbors.length
      }),
      reverseOffsets: graph.createDataView(handles.incomingOffsets, {
        format: 'uint32',
        length: dataset.incoming.offsets.length
      }),
      reverseNeighbors: graph.createDataView(handles.incomingNeighbors, {
        format: 'uint32',
        length: dataset.incoming.neighbors.length
      }),
      seeds: graph.createDataView(handles.selectedSeeds, {format: 'uint32', length: 1}),
      seedCount: graph.createDataView(handles.selectedSeedCount, {format: 'uint32', length: 1}),
      activeDepth: graph.createDataView(handles.traversalDepth, {format: 'uint32', length: 1}),
      output: graph.createDataView(handles.reachedSpans, {
        format: 'uint32',
        length: resources.spanCount
      }),
      direction: 'both',
      maxDepth: MAXIMUM_FOCUS_DEPTH
    }).addToGraph(graph);

    addTraceComputePass(graph, {
      id: 'trace-focus-mask',
      source: getFocusMaskShader(resources.spanCount),
      bindings: [
        storageRead('reachedSpans', handles.reachedSpans),
        storageRead('activeSeedCount', handles.selectedSeedCount),
        storageWrite('focusMask', handles.focusMask),
        uniformBinding('viewUniforms', handles.uniforms)
      ],
      length: resources.spanCount
    });
    addTraceComputePass(graph, {
      id: 'trace-clear-pick',
      source: getPickClearShader(),
      bindings: [storageWrite('pickResult', handles.pickResult)],
      length: 1,
      workgroupSize: 1
    });
    addTraceComputePass(graph, {
      id: 'trace-clear-activity',
      source: getActivityClearShader(TRACE_PROCESS_COUNT * TRACE_ACTIVITY_BIN_COUNT),
      bindings: [storageWrite('activityBins', handles.activityBins)],
      length: TRACE_PROCESS_COUNT * TRACE_ACTIVITY_BIN_COUNT
    });
    addTraceComputePass(graph, {
      id: 'trace-accumulate-activity',
      source: getActivityAccumulationShader(resources.spanCount),
      bindings: [
        storageRead('spans', handles.spans),
        storageRead('processStates', handles.processStates),
        uniformBinding('viewUniforms', handles.uniforms),
        storageWrite('activityBins', handles.activityBins)
      ],
      length: resources.spanCount
    });

    const renderResources: GraphBufferUse[] = [
      {buffer: handles.spans, usage: 'storage-read'},
      {buffer: handles.dependencies, usage: 'storage-read'},
      {buffer: handles.processStates, usage: 'storage-read'},
      {buffer: handles.threadStates, usage: 'storage-read'},
      {buffer: handles.threadOffsets, usage: 'storage-read'},
      {buffer: handles.reachedSpans, usage: 'storage-read'},
      {buffer: handles.visibleAncestors, usage: 'storage-read'},
      {buffer: handles.activityBins, usage: 'storage-read'},
      {buffer: handles.uniforms, usage: 'uniform'},
      {buffer: handles.drawCommands, usage: 'indirect'}
    ];

    for (const [groupIndex, group] of resources.groups.entries()) {
      const visibleIds = importTraceBuffer(graph, `${group.name}-visible-ids`, group.visibleIds);
      renderResources.push({buffer: visibleIds, usage: 'storage-read'});
      const sourceIdsBuffer = graph.createTransientBuffer({
        id: `${group.name}-source-ids`,
        byteLength: Math.max(group.count, 1) * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      if (group.count > 0) {
        addTraceComputePass(graph, {
          id: `${group.name}-base-visibility`,
          source: getVisibilityShader(group.count, groupIndex, group.firstSpanIndex),
          bindings: [
            storageRead('spans', handles.spans),
            uniformBinding('viewUniforms', handles.uniforms),
            storageRead('processStates', handles.processStates),
            storageRead('threadOffsets', handles.threadOffsets),
            storageRead('threadStates', handles.threadStates),
            storageWrite('visibilityFlags', handles.baseVisibility),
            storageWrite('sourceIds', sourceIdsBuffer),
            storageWrite('pickResult', handles.pickResult)
          ],
          length: group.count
        });
      }
      const byteOffset = group.firstSpanIndex * UINT32_BYTE_LENGTH;
      const baseMask = graph.createDataView(handles.baseVisibility, {
        format: 'uint32',
        length: group.count,
        byteOffset
      });
      const focusMask = graph.createDataView(handles.focusMask, {
        format: 'uint32',
        length: group.count,
        byteOffset
      });
      const finalMask = graph.createDataView(handles.spanVisibility, {
        format: 'uint32',
        length: group.count,
        byteOffset
      });
      new GPUMask({
        id: `${group.name}-compose-visibility`,
        inputs: [baseMask, focusMask],
        output: finalMask
      }).addToGraph(graph);
      new GPUCompaction({
        id: `${group.name}-compaction`,
        input: graph.createDataView(sourceIdsBuffer, {format: 'uint32', length: group.count}),
        flags: finalMask,
        output: graph.createDataView(visibleIds, {format: 'uint32', length: group.count}),
        count: graph.createDataView(handles.drawCommands, {
          format: 'uint32',
          length: 1,
          byteOffset: resources.drawCommands.getInstanceCountByteOffset(groupIndex)
        })
      }).addToGraph(graph);
    }

    new GPUAncestorProjection({
      id: 'trace-visible-ancestor-projection',
      parents: graph.createDataView(handles.parentSpans, {
        format: 'uint32',
        length: resources.spanCount
      }),
      visibility: graph.createDataView(handles.spanVisibility, {
        format: 'uint32',
        length: resources.spanCount
      }),
      output: graph.createDataView(handles.visibleAncestors, {
        format: 'uint32',
        length: resources.spanCount
      })
    }).addToGraph(graph);

    const dependencyFlags = graph.createTransientBuffer({
      id: 'trace-dependency-flags',
      byteLength: Math.max(resources.dependencyCount, 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    const dependencySourceIds = graph.createTransientBuffer({
      id: 'trace-dependency-source-ids',
      byteLength: Math.max(resources.dependencyCount, 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    if (resources.dependencyCount > 0) {
      addTraceComputePass(graph, {
        id: 'trace-dependency-visibility',
        source: getDependencyVisibilityShader(resources.dependencyCount),
        bindings: [
          storageRead('dependencies', handles.dependencies),
          storageRead('spans', handles.spans),
          storageRead('spanVisibility', handles.spanVisibility),
          storageRead('processStates', handles.processStates),
          storageRead('visibleAncestors', handles.visibleAncestors),
          uniformBinding('viewUniforms', handles.uniforms),
          storageWrite('dependencyFlags', dependencyFlags),
          storageWrite('dependencyIds', dependencySourceIds)
        ],
        length: resources.dependencyCount
      });
    }
    new GPUCompaction({
      id: 'trace-dependency-compaction',
      input: graph.createDataView(dependencySourceIds, {
        format: 'uint32',
        length: resources.dependencyCount
      }),
      flags: graph.createDataView(dependencyFlags, {
        format: 'uint32',
        length: resources.dependencyCount
      }),
      output: graph.createDataView(handles.visibleDependencyIds, {
        format: 'uint32',
        length: resources.dependencyCount
      }),
      count: graph.createDataView(handles.drawCommands, {
        format: 'uint32',
        length: 1,
        byteOffset: resources.drawCommands.getInstanceCountByteOffset(resources.groups.length)
      })
    }).addToGraph(graph);
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

  /** Records the fixed span, dependency, and collapsed-activity indirect draw topology. */
  private createRenderBundle(resources: TraceGraphResources): RenderBundle {
    const encoder = this.device.createRenderBundleEncoder({
      id: 'gpu-hierarchical-trace-render-bundle',
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    for (const [groupIndex, group] of resources.groups.entries()) {
      encoder.setBindings({
        spans: resources.spans,
        visibleIds: group.visibleIds,
        threadOffsets: resources.threadOffsets,
        threadStates: resources.threadStates,
        reachedSpans: resources.reachedSpans,
        viewUniforms: this.viewUniformBuffer
      });
      resources.drawCommands.draw(encoder, groupIndex);
    }

    encoder.setPipeline(this.dependencyModel.pipeline);
    encoder.setVertexArray(this.dependencyModel.vertexArray);
    encoder.setBindings({
      dependencies: resources.dependencies,
      visibleDependencyIds: resources.visibleDependencyIds,
      spans: resources.spans,
      processStates: resources.processStates,
      threadStates: resources.threadStates,
      threadOffsets: resources.threadOffsets,
      visibleAncestors: resources.visibleAncestors,
      viewUniforms: this.viewUniformBuffer
    });
    resources.drawCommands.draw(encoder, resources.groups.length);

    encoder.setPipeline(this.activityModel.pipeline);
    encoder.setVertexArray(this.activityModel.vertexArray);
    encoder.setBindings({
      activityBins: resources.activityBins,
      processStates: resources.processStates,
      threadOffsets: resources.threadOffsets,
      viewUniforms: this.viewUniformBuffer
    });
    resources.drawCommands.draw(encoder, resources.groups.length + 1);
    return encoder.finish();
  }

  private writeViewUniforms(width: number, height: number, pick: PickPosition | null): void {
    const data = new ArrayBuffer(VIEW_UNIFORM_BYTE_LENGTH);
    const floats = new Float32Array(data);
    const unsigned = new Uint32Array(data);
    floats[0] = this.view.timeMin;
    floats[1] = this.view.timeMax;
    floats[2] = this.view.laneMin;
    floats[3] = this.view.laneMax;
    unsigned[4] = this.enabledMask;
    unsigned[5] = this.statusMask;
    unsigned[6] = this.filterFlags;
    unsigned[7] = this.dependencyMask;
    floats[8] = this.minimumDuration;
    floats[9] = width;
    floats[10] = height;
    unsigned[11] = this.selectedSpanIndex;
    unsigned[12] = this.focusOnly ? 1 : 0;
    floats[13] = 0.16;
    floats[14] = pick?.time ?? -1;
    floats[15] = pick?.lane ?? -1;
    this.viewUniformBuffer.write(data);
  }

  private async sampleVisibleCounts(): Promise<void> {
    const resources = this.resources;
    if (!resources || this.countReadPending) {
      return;
    }
    this.countReadPending = true;
    try {
      const bytes = await resources.drawCommands.buffer.readAsync();
      if (resources !== this.resources) {
        return;
      }
      const values = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      this.sampledVisibleCounts = resources.groups.map(
        (_, groupIndex) => values[groupIndex * 4 + 1] ?? 0
      );
      this.sampledDependencyCount = values[resources.groups.length * 4 + 1] ?? 0;
      this.updateInspector();
    } finally {
      this.countReadPending = false;
    }
  }

  /** Reads a single explicitly requested GPU-picked source row after the frame is submitted. */
  private async samplePickedSpan(resources: TraceGraphResources): Promise<void> {
    try {
      const bytes = await resources.pickResult.readAsync();
      if (resources !== this.resources) {
        return;
      }
      const pickedSpanIndex = new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
      if (pickedSpanIndex !== INVALID_SPAN_INDEX) {
        this.setSelectedSpan(pickedSpanIndex);
      }
    } finally {
      this.pickReadPending = false;
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
    const resources = this.resources;
    if (!resources) {
      return;
    }
    resources.compiled.destroy();
    resources.renderBundle.destroy();
    resources.drawCommands.destroy();
    for (const group of resources.groups) {
      group.visibleIds.destroy();
    }
    for (const buffer of [
      resources.spans,
      resources.dependencies,
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
      resources.traversalDepth,
      resources.reachedSpans,
      resources.visibleAncestors,
      resources.focusMask,
      resources.baseVisibility,
      resources.spanVisibility,
      resources.visibleDependencyIds,
      resources.activityBins,
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
          html: '<p style="margin:0;line-height:1.5">A fixed WebGPU command graph owns hierarchical layout, composed filters, dependency traversal, picking, collapsed activity, and indirect span and edge rendering.</p>'
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
          html: '<div data-capacity></div><div data-selection style="margin-top:8px"></div><div data-stats></div><div data-nodes style="margin-top:10px;font:11px/1.45 ui-monospace,monospace;max-height:220px;overflow:auto"></div>',
          onRender: root => {
            this.capacityElement = root.querySelector('[data-capacity]');
            this.selectionElement = root.querySelector('[data-selection]');
            this.statsElement = root.querySelector('[data-stats]');
            this.nodesElement = root.querySelector('[data-nodes]');
            this.updateInspector();
            return () => {
              this.capacityElement = null;
              this.selectionElement = null;
              this.statsElement = null;
              this.nodesElement = null;
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
      <label>Capacity <select data-capacity-select>${CAPACITY_OPTIONS.map(
        value =>
          `<option value="${value}"${value === this.capacity ? ' selected' : ''}>${formatCount(value)}</option>`
      ).join('')}</select></label>
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
      <label><input type="checkbox" data-auto-scroll checked> Auto-scroll</label>
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
      if (target.matches('[data-capacity-select]')) {
        this.rebuild(Number(target.value));
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
        this.filterFlags = setBit(this.filterFlags, 0, target.checked);
      } else if (target instanceof HTMLInputElement && target.matches('[data-errors-only]')) {
        this.filterFlags = setBit(this.filterFlags, 1, target.checked);
      } else if (target instanceof HTMLInputElement && target.matches('[data-hide-overlapping]')) {
        this.filterFlags = setBit(this.filterFlags, 2, target.checked);
      } else if (
        target instanceof HTMLInputElement &&
        target.matches('[data-hide-similar-parents]')
      ) {
        this.filterFlags = setBit(this.filterFlags, 3, target.checked);
      } else if (target instanceof HTMLInputElement && target.matches('[data-same-dependencies]')) {
        this.dependencyMask = setBit(this.dependencyMask, 0, target.checked);
      } else if (
        target instanceof HTMLInputElement &&
        target.matches('[data-cross-dependencies]')
      ) {
        this.dependencyMask = setBit(this.dependencyMask, 1, target.checked);
      } else if (target.matches('[data-focus-depth]')) {
        this.focusDepth = Number(target.value);
        this.resources?.traversalDepth.write(Uint32Array.from([this.focusDepth]));
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
      this.capacityElement.innerHTML = `<strong>${formatCount(this.capacity)}</strong> spans · <strong>${formatCount(resources.dependencyCount)}</strong> dependencies · graph compile #${this.compileCount} (${this.compileTimeMilliseconds.toFixed(1)} ms)`;
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
        <span>Sampled visible spans</span><strong>${formatCount(visible)}</strong>
        <span>Sampled visible edges</span><strong>${formatCount(this.sampledDependencyCount)}</strong>
        <span>Visible layout lanes</span><strong>${formatCount(this.getVisibleLaneCount())}</strong>
        <span>Collapsed processes</span><strong>${formatCount(this.processStates.filter(state => state === TRACE_COLLAPSED_STATE).length)}</strong>
        <span>CPU graph encode</span><strong>${this.encodeTimeMilliseconds.toFixed(2)} ms</strong>
        <span>Logical scratch</span><strong>${formatBytes(stats.logicalTransientBytes)}</strong>
        <span>Physical scratch</span><strong>${formatBytes(stats.physicalTransientBytes)}</strong>
        <span>Transient reuse</span><strong>${stats.reusePercentage.toFixed(0)}%</strong>
        <span>Physical allocations</span><strong>${stats.physicalTransientBufferCount}/${stats.logicalTransientBufferCount}</strong>
      </div>`;
    }
    if (this.nodesElement) {
      this.nodesElement.innerHTML = stats.nodeOrder
        .map(
          (node, index) =>
            `<div><span style="opacity:.55">${String(index + 1).padStart(2, '0')}</span> ${node}</div>`
        )
        .join('');
    }
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
      this.pendingPick = {
        time: this.view.timeMin + horizontalFraction * (this.view.timeMax - this.view.timeMin),
        lane: this.view.laneMin + verticalFraction * (this.view.laneMax - this.view.laneMin)
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
