// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {DrawCommandBufferView} from '../gpu-primitives/draw-command-buffer';
import {GPUAncestorProjection} from '../gpu-primitives/gpu-ancestor-projection';
import {
  GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {
  GPUGraphTraversal,
  type GPUGraphTraversalDirection
} from '../gpu-primitives/gpu-graph-traversal';
import {GPUHierarchyLayout} from '../gpu-primitives/gpu-hierarchy-layout';
import {GPUSceneDrawGeneration} from '../gpu-primitives/gpu-scene-draw-generation';
import type {GPUTraceSceneView} from './gpu-trace-scene';
import {GPUVisibilityWorkflow} from '../gpu-primitives/gpu-visibility-workflow';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';

const TRACE_INTERACTION_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

type DispatchLayout = {x: number; y: number; z: number};

/** Caller-owned indirect draw outputs composed after trace interaction filtering. */
export type GPUTraceInteractionDraw = {
  commands: DrawCommandBufferView;
  requiredCount: GraphDataView<'uint32'>;
  publishedCount: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
};

/** Fixed topology and mutable GPU-resident interaction state for one trace command graph. */
export type GPUTraceInteractionProps = {
  id?: string;
  /** Canonical trace span, topology, and generic scene views from GPUTraceScene.importToGraph(). */
  trace: GPUTraceSceneView;
  /** Packed float32 [minimumTime, maximumTime, minimumDuration] updated between encodings. */
  timeWindow: GraphDataView<'float32'>;
  /** Packed uint32 [requiredClassificationBits, excludedClassificationBits, focusEnabled]. */
  policy: GraphDataView<'uint32'>;
  /** Zero/nonzero process expansion states. */
  processStates: GraphDataView<'uint32'>;
  /** Zero/nonzero thread expansion states. */
  threadStates: GraphDataView<'uint32'>;
  /** Stable selected canonical span-row indices. */
  selectedSpans: GraphDataView<'uint32'>;
  /** Number of active selection seeds. */
  selectedCount: GraphDataView<'uint32'>;
  /** Mutable dependency hop count, clamped to maxFocusDepth. */
  focusDepth: GraphDataView<'uint32'>;
  /** Caller-owned per-thread effective heights. */
  threadHeights: GraphDataView<'uint32'>;
  /** Caller-owned exclusive scanned thread offsets. */
  threadOffsets: GraphDataView<'uint32'>;
  /** Caller-owned canonical dependency reachability mask. */
  reachedSpans: GraphDataView<'uint32'>;
  /** Caller-owned scene-capacity-aligned final visibility mask. */
  visibleMask: GraphDataView<'uint32'>;
  /** Caller-owned stable compacted canonical source-row IDs. */
  visibleSpans: GraphDataView<'uint32'>;
  /** Caller-owned number of compacted visible spans. */
  visibleCount: GraphDataView<'uint32'>;
  /** Caller-owned nearest visible ancestor for each canonical span. */
  projectedAncestors: GraphDataView<'uint32'>;
  /** Caller-owned fixed-capacity indirect drawing records and diagnostics. */
  draw: GPUTraceInteractionDraw;
  /** Number of consecutive globally numbered threads per process. */
  threadsPerProcess: number;
  /** Number of consecutive original lanes per thread. */
  lanesPerThread: number;
  /** Compiled maximum number of dependency hops. Defaults to two. */
  maxFocusDepth?: number;
  /** Direction used for linked-span focus. Defaults to both incoming and outgoing. */
  focusDirection?: GPUGraphTraversalDirection;
  /** Maximum hidden parent edges followed for dependency endpoint projection. Defaults to 32. */
  maxAncestorDepth?: number;
};

/** CPU-visible topology facts for one compiled trace interaction policy. */
export type GPUTraceInteractionStats = {
  spanCount: number;
  sceneCapacity: number;
  processCount: number;
  threadCount: number;
  threadsPerProcess: number;
  lanesPerThread: number;
  maxFocusDepth: number;
};

/**
 * Composes hierarchy layout, dependency focus, policy filtering, stable visibility, and scene draws.
 *
 * Process/thread states, temporal ranges, classification masks, selected source IDs, and traversal
 * depth remain caller-owned GPU inputs. Updating those buffers and re-encoding the same graph
 * refreshes every output without CPU span filtering, graph recompilation, or hidden submission.
 */
export class GPUTraceInteraction {
  readonly id: string;
  readonly trace: GPUTraceSceneView;
  readonly timeWindow: GraphDataView<'float32'>;
  readonly policy: GraphDataView<'uint32'>;
  readonly processStates: GraphDataView<'uint32'>;
  readonly threadStates: GraphDataView<'uint32'>;
  readonly selectedSpans: GraphDataView<'uint32'>;
  readonly selectedCount: GraphDataView<'uint32'>;
  readonly focusDepth: GraphDataView<'uint32'>;
  readonly threadHeights: GraphDataView<'uint32'>;
  readonly threadOffsets: GraphDataView<'uint32'>;
  readonly reachedSpans: GraphDataView<'uint32'>;
  readonly visibleMask: GraphDataView<'uint32'>;
  readonly visibleSpans: GraphDataView<'uint32'>;
  readonly visibleCount: GraphDataView<'uint32'>;
  readonly projectedAncestors: GraphDataView<'uint32'>;
  readonly draw: GPUTraceInteractionDraw;
  readonly threadsPerProcess: number;
  readonly lanesPerThread: number;
  readonly maxFocusDepth: number;
  readonly focusDirection: GPUGraphTraversalDirection;
  readonly maxAncestorDepth: number;
  readonly stats: Readonly<GPUTraceInteractionStats>;

  constructor(props: GPUTraceInteractionProps) {
    this.id = props.id ?? 'gpu-trace-interaction';
    this.trace = props.trace;
    this.timeWindow = props.timeWindow;
    this.policy = props.policy;
    this.processStates = props.processStates;
    this.threadStates = props.threadStates;
    this.selectedSpans = props.selectedSpans;
    this.selectedCount = props.selectedCount;
    this.focusDepth = props.focusDepth;
    this.threadHeights = props.threadHeights;
    this.threadOffsets = props.threadOffsets;
    this.reachedSpans = props.reachedSpans;
    this.visibleMask = props.visibleMask;
    this.visibleSpans = props.visibleSpans;
    this.visibleCount = props.visibleCount;
    this.projectedAncestors = props.projectedAncestors;
    this.draw = props.draw;
    this.threadsPerProcess = props.threadsPerProcess;
    this.lanesPerThread = props.lanesPerThread;
    this.maxFocusDepth = props.maxFocusDepth ?? 2;
    this.focusDirection = props.focusDirection ?? 'both';
    this.maxAncestorDepth = props.maxAncestorDepth ?? 32;

    validateInteraction(this);
    this.stats = Object.freeze({
      spanCount: this.trace.startTimes.length,
      sceneCapacity: this.trace.scene.capacity,
      processCount: this.processStates.length,
      threadCount: this.threadStates.length,
      threadsPerProcess: this.threadsPerProcess,
      lanesPerThread: this.lanesPerThread,
      maxFocusDepth: this.maxFocusDepth
    });
  }

  /** Adds reusable hierarchy, traversal, policy, compaction, ancestor, and indirect-draw passes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (getInteractionViews(this).some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    new GPUHierarchyLayout({
      id: `${this.id}-hierarchy`,
      parentStates: this.processStates,
      childStates: this.threadStates,
      heights: this.threadHeights,
      offsets: this.threadOffsets,
      childrenPerParent: this.threadsPerProcess,
      expandedChildHeight: this.lanesPerThread,
      collapsedChildHeight: 1,
      collapsedParentHeight: 1
    }).addToGraph(graph);

    new GPUGraphTraversal({
      id: `${this.id}-focus`,
      offsets: this.trace.outgoingOffsets,
      neighbors: this.trace.outgoingNeighbors,
      reverseOffsets: this.trace.incomingOffsets,
      reverseNeighbors: this.trace.incomingNeighbors,
      seeds: this.selectedSpans,
      seedCount: this.selectedCount,
      output: this.reachedSpans,
      maxDepth: this.maxFocusDepth,
      activeDepth: this.focusDepth,
      direction: this.focusDirection
    }).addToGraph(graph);

    addPolicyPass(graph, this);

    new GPUVisibilityWorkflow({
      id: `${this.id}-visibility`,
      predicates: [{kind: ['time-range', 'bounds', 'selection'], mask: this.visibleMask}],
      output: this.visibleSpans,
      outputMask: this.visibleMask,
      count: this.visibleCount
    }).addToGraph(graph);

    if (this.stats.spanCount > 0) {
      new GPUAncestorProjection({
        id: `${this.id}-ancestors`,
        parents: this.trace.parents,
        visibility: this.visibleMask,
        output: this.projectedAncestors,
        maxDepth: this.maxAncestorDepth
      }).addToGraph(graph);
    }

    new GPUSceneDrawGeneration({
      id: `${this.id}-draws`,
      scene: this.trace.scene,
      visibility: this.visibleMask,
      commands: this.draw.commands,
      requiredCount: this.draw.requiredCount,
      publishedCount: this.draw.publishedCount,
      overflow: this.draw.overflow
    }).addToGraph(graph);
  }
}

function addPolicyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  interaction: GPUTraceInteraction
): void {
  const sourceWords = graph.createDataView(interaction.trace.spans, {
    format: 'uint32',
    length: interaction.trace.spans.byteLength / UINT32_BYTE_LENGTH
  });
  const dispatch = getDispatchLayout(
    interaction.trace.scene.capacity,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const DISPATCH_X: u32 = ${dispatch.x * TRACE_INTERACTION_WORKGROUP_SIZE}u;
const DISPATCH_Y: u32 = ${dispatch.y}u;
const SPAN_COUNT: u32 = ${interaction.stats.spanCount}u;
const SCENE_CAPACITY: u32 = ${interaction.trace.scene.capacity}u;
const THREAD_COUNT: u32 = ${interaction.threadStates.length}u;
const THREADS_PER_PROCESS: u32 = ${interaction.threadsPerProcess}u;
const LANES_PER_THREAD: u32 = ${interaction.lanesPerThread}u;
const WINDOW_OFFSET: u32 = ${getViewElementOffset(interaction.timeWindow)}u;
const POLICY_OFFSET: u32 = ${getViewElementOffset(interaction.policy)}u;
const HEIGHTS_OFFSET: u32 = ${getViewElementOffset(interaction.threadHeights)}u;
const REACHED_OFFSET: u32 = ${getViewElementOffset(interaction.reachedSpans)}u;
const SEED_COUNT_OFFSET: u32 = ${getViewElementOffset(interaction.selectedCount)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(interaction.visibleMask)}u;
@group(0) @binding(0) var<storage, read> spans: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read> timeWindow: array<f32>;
@group(0) @binding(2) var<storage, read> policy: array<u32>;
@group(0) @binding(3) var<storage, read> threadHeights: array<u32>;
@group(0) @binding(4) var<storage, read> reachedSpans: array<u32>;
@group(0) @binding(5) var<storage, read> selectedCount: array<u32>;
@group(0) @binding(6) var<storage, read_write> visibleMask: array<u32>;

@compute @workgroup_size(${TRACE_INTERACTION_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x + globalId.y * DISPATCH_X + globalId.z * DISPATCH_X * DISPATCH_Y;
  if (index >= SCENE_CAPACITY) { return; }
  if (index >= SPAN_COUNT) {
    visibleMask[OUTPUT_OFFSET + index] = 0u;
    return;
  }

  let timing = spans[index * 2u];
  let ownership = spans[index * 2u + 1u];
  let start = bitcast<f32>(timing.x);
  let duration = bitcast<f32>(timing.y);
  let lane = timing.z;
  let process = ownership.x;
  let thread = ownership.y;
  let classification = ownership.w;
  let minimumTime = timeWindow[WINDOW_OFFSET];
  let maximumTime = timeWindow[WINDOW_OFFSET + 1u];
  let minimumDuration = timeWindow[WINDOW_OFFSET + 2u];
  let requiredBits = policy[POLICY_OFFSET];
  let excludedBits = policy[POLICY_OFFSET + 1u];
  let focusEnabled = policy[POLICY_OFFSET + 2u] != 0u;

  var visible = 1u;
  if (!(minimumTime <= maximumTime) || start > maximumTime || start + duration < minimumTime) {
    visible = 0u;
  }
  if (duration < minimumDuration || (classification & requiredBits) != requiredBits) {
    visible = 0u;
  }
  if ((classification & excludedBits) != 0u || thread >= THREAD_COUNT) {
    visible = 0u;
  }
  if (thread < THREAD_COUNT) {
    let threadHeight = threadHeights[HEIGHTS_OFFSET + thread];
    if (
      thread / THREADS_PER_PROCESS != process ||
      threadHeight == 0u ||
      (threadHeight == 1u && lane != thread * LANES_PER_THREAD)
    ) {
      visible = 0u;
    }
  }
  if (
    focusEnabled &&
    selectedCount[SEED_COUNT_OFFSET] != 0u &&
    reachedSpans[REACHED_OFFSET + index] == 0u
  ) {
    visible = 0u;
  }
  visibleMask[OUTPUT_OFFSET + index] = visible;
}`;
  const bindings: Record<string, GraphDataView> = {
    spans: sourceWords,
    timeWindow: interaction.timeWindow,
    policy: interaction.policy,
    threadHeights: interaction.threadHeights,
    reachedSpans: interaction.reachedSpans,
    selectedCount: interaction.selectedCount,
    visibleMask: interaction.visibleMask
  };
  const resources: GraphBufferUse[] = [
    {buffer: sourceWords, usage: 'storage-read'},
    {buffer: interaction.timeWindow, usage: 'storage-read'},
    {buffer: interaction.policy, usage: 'storage-read'},
    {buffer: interaction.threadHeights, usage: 'storage-read'},
    {buffer: interaction.reachedSpans, usage: 'storage-read'},
    {buffer: interaction.selectedCount, usage: 'storage-read'},
    {buffer: interaction.visibleMask, usage: 'storage-write'}
  ];

  graph.addComputePass({
    id: `${interaction.id}-policy`,
    resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${interaction.id}-policy`,
        source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
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
          for (const [name, view] of Object.entries(bindings)) {
            resolved[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolved);
          computation.dispatch(computePass, dispatch.x, dispatch.y, dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateInteraction(interaction: GPUTraceInteraction): void {
  validatePackedView(interaction.timeWindow, ['float32'], `${interaction.id} timeWindow`);
  for (const [name, view] of [
    ['policy', interaction.policy],
    ['processStates', interaction.processStates],
    ['threadStates', interaction.threadStates],
    ['selectedSpans', interaction.selectedSpans],
    ['selectedCount', interaction.selectedCount],
    ['focusDepth', interaction.focusDepth],
    ['threadHeights', interaction.threadHeights],
    ['threadOffsets', interaction.threadOffsets],
    ['reachedSpans', interaction.reachedSpans],
    ['visibleMask', interaction.visibleMask],
    ['visibleSpans', interaction.visibleSpans],
    ['visibleCount', interaction.visibleCount],
    ['projectedAncestors', interaction.projectedAncestors]
  ] as const) {
    validatePackedUint32View(view, `${interaction.id} ${name}`);
  }
  if (interaction.timeWindow.length < 3 || interaction.policy.length < 3) {
    throw new Error(`${interaction.id} timeWindow and policy require three scalar values`);
  }
  if (
    interaction.selectedCount.length !== 1 ||
    interaction.focusDepth.length !== 1 ||
    interaction.visibleCount.length !== 1
  ) {
    throw new Error(`${interaction.id} selection, depth, and visible counts require one row`);
  }
  if (
    !Number.isSafeInteger(interaction.threadsPerProcess) ||
    interaction.threadsPerProcess < 1 ||
    !Number.isSafeInteger(interaction.lanesPerThread) ||
    interaction.lanesPerThread < 1 ||
    interaction.threadStates.length !==
      interaction.processStates.length * interaction.threadsPerProcess ||
    interaction.threadHeights.length !== interaction.threadStates.length ||
    interaction.threadOffsets.length !== interaction.threadStates.length
  ) {
    throw new Error(`${interaction.id} process, thread, and lane topology must be consistent`);
  }
  const spanCount = interaction.trace.startTimes.length;
  if (
    interaction.reachedSpans.length !== spanCount ||
    interaction.projectedAncestors.length !== spanCount ||
    interaction.visibleMask.length !== interaction.trace.scene.capacity ||
    interaction.visibleSpans.length < interaction.trace.scene.capacity
  ) {
    throw new Error(`${interaction.id} trace outputs must match source rows and scene capacity`);
  }
  if (!Number.isSafeInteger(interaction.maxFocusDepth) || interaction.maxFocusDepth < 0) {
    throw new Error(`${interaction.id} maxFocusDepth must be a nonnegative safe integer`);
  }
  if (!Number.isSafeInteger(interaction.maxAncestorDepth) || interaction.maxAncestorDepth < 0) {
    throw new Error(`${interaction.id} maxAncestorDepth must be a nonnegative safe integer`);
  }

  const inputs: GraphDataView[] = [
    interaction.timeWindow,
    interaction.policy,
    interaction.processStates,
    interaction.threadStates,
    interaction.selectedSpans,
    interaction.selectedCount,
    interaction.focusDepth,
    interaction.trace.parents,
    interaction.trace.outgoingOffsets,
    interaction.trace.outgoingNeighbors,
    interaction.trace.incomingOffsets,
    interaction.trace.incomingNeighbors,
    interaction.trace.startTimes
  ];
  const outputs = [
    interaction.threadHeights,
    interaction.threadOffsets,
    interaction.reachedSpans,
    interaction.visibleMask,
    interaction.visibleSpans,
    interaction.visibleCount,
    interaction.projectedAncestors
  ];
  for (const [index, output] of outputs.entries()) {
    if (inputs.some(input => doGraphDataViewsOverlap(input, output))) {
      throw new Error(`${interaction.id} interaction outputs cannot overlap source inputs`);
    }
    if (outputs.slice(index + 1).some(other => doGraphDataViewsOverlap(output, other))) {
      throw new Error(`${interaction.id} interaction outputs cannot overlap one another`);
    }
  }
}

function getInteractionViews(interaction: GPUTraceInteraction): GraphDataView[] {
  return [
    interaction.timeWindow,
    interaction.policy,
    interaction.processStates,
    interaction.threadStates,
    interaction.selectedSpans,
    interaction.selectedCount,
    interaction.focusDepth,
    interaction.threadHeights,
    interaction.threadOffsets,
    interaction.reachedSpans,
    interaction.visibleMask,
    interaction.visibleSpans,
    interaction.visibleCount,
    interaction.projectedAncestors,
    interaction.trace.startTimes,
    interaction.trace.parents,
    interaction.trace.outgoingOffsets,
    interaction.trace.outgoingNeighbors,
    interaction.trace.incomingOffsets,
    interaction.trace.incomingNeighbors,
    interaction.draw.commands.words,
    interaction.draw.requiredCount,
    interaction.draw.publishedCount,
    interaction.draw.overflow
  ];
}

function getDispatchLayout(elementCount: number, maximumDimension: number): DispatchLayout {
  const maximum = Math.floor(maximumDimension);
  const workgroupCount = Math.max(1, Math.ceil(elementCount / TRACE_INTERACTION_WORKGROUP_SIZE));
  const x = Math.min(workgroupCount, maximum);
  const y = Math.min(Math.ceil(workgroupCount / x), maximum);
  const z = Math.ceil(workgroupCount / x / y);
  if (z > maximum) throw new Error('GPU trace interaction exceeds the device dispatch limit');
  return {x, y, z};
}
