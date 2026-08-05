// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandEncoder} from '@luma.gl/core';
import type {GPUCommandGraphEncoding} from './gpu-command-graph';
import type {
  GPUCommandGraphCapabilities,
  GPUCommandGraphEncodeOptions,
  GPUCommandGraphEncodingStats,
  GPUCommandGraphNodeType,
  GPUCommandGraphStats,
  GPUCommandGraphTimingReport
} from './gpu-command-graph-types';

/** Minimal compiled-graph surface consumed by {@link GPUCommandGraphInspector}. */
export type GPUCommandGraphInspectorGraph = {
  /** Stable identifier used to associate encodings with this graph. */
  readonly id: string;
  /** Scheduling and transient-allocation statistics captured at compilation. */
  readonly stats: GPUCommandGraphStats;
  /** Device capabilities relevant to graph execution. */
  readonly capabilities: GPUCommandGraphCapabilities;
};

/** Minimal encoding surface consumed by {@link GPUCommandGraphInspector}. */
export type GPUCommandGraphInspectorEncoding = Pick<
  GPUCommandGraphEncoding,
  'stats' | 'readTimings'
>;

/** Minimal executable graph surface supported by {@link GPUCommandGraphInspector.observeGraph}. */
export type GPUCommandGraphInspectorObservableGraph<
  Parameters = void,
  Encoding extends GPUCommandGraphInspectorEncoding = GPUCommandGraphEncoding
> = GPUCommandGraphInspectorGraph & {
  /** Records the graph into a caller-owned command encoder. */
  readonly encode: (
    commandEncoder: CommandEncoder,
    options: GPUCommandGraphEncodeOptions<Parameters>
  ) => Encoding;
};

/**
 * Non-owning observation handle for one executable command graph.
 *
 * Route graph encodings through {@link GPUCommandGraphInspectorObservation.encode} to collect CPU
 * measurements without repeating graph IDs. GPU timestamp readback remains an explicit,
 * post-submission operation through {@link GPUCommandGraphInspectorObservation.recordGPUTimings}.
 * Caller-read scalar counters can be published through
 * {@link GPUCommandGraphInspectorObservation.recordCounters}.
 */
export type GPUCommandGraphInspectorObservation<
  Parameters = void,
  Encoding extends GPUCommandGraphInspectorEncoding = GPUCommandGraphEncoding
> = {
  /** Graph whose encodings are observed. */
  readonly graph: GPUCommandGraphInspectorObservableGraph<Parameters, Encoding>;
  /** Encodes the graph and records its immediately available CPU measurements. */
  readonly encode: (
    commandEncoder: CommandEncoder,
    options: GPUCommandGraphEncodeOptions<Parameters>
  ) => Encoding;
  /** Reads GPU timings once for an encoding produced by this handle, after caller submission. */
  readonly recordGPUTimings: (encoding: Encoding) => Promise<void>;
  /** Records one sample for each named, caller-read scalar counter. */
  readonly recordCounters: (counters: Readonly<Record<string, number>>) => void;
  /** Stops observing this graph without destroying or otherwise mutating it. */
  readonly detach: () => void;
};

/** Stable identity supplied to a semantic node-group callback. */
export type GPUCommandGraphInspectorNodeIdentity = {
  /** Graph containing the node. */
  readonly graphId: string;
  /** Stable graph node identifier. */
  readonly id: string;
  /** Node execution category. */
  readonly type: GPUCommandGraphNodeType;
};

/** Configuration for a reusable command-graph inspector. */
export type GPUCommandGraphInspectorProps = {
  /** Maximum samples retained for each duration or scalar counter. Defaults to `120`. */
  maxSamples?: number;
  /** Optional application-specific group assigned when a node is first observed. */
  getNodeGroup?: (node: GPUCommandGraphInspectorNodeIdentity) => string | undefined;
};

/** Immutable bounded-sample summary for one CPU or GPU duration. */
export type GPUCommandGraphInspectorDurationSnapshot = {
  /** Number of retained duration samples. */
  readonly sampleCount: number;
  /** Most recently recorded duration. */
  readonly latestMilliseconds?: number;
  /** Nearest-rank 50th percentile across retained samples. */
  readonly p50Milliseconds?: number;
  /** Nearest-rank 95th percentile across retained samples. */
  readonly p95Milliseconds?: number;
};

/** Immutable bounded-sample summary for one named scalar counter. */
export type GPUCommandGraphInspectorCounterSnapshot = {
  /** Stable application-defined counter identifier. */
  readonly id: string;
  /** Number of retained samples. */
  readonly sampleCount: number;
  /** Most recently recorded value. */
  readonly latestValue: number;
  /** Nearest-rank 50th percentile across retained samples. */
  readonly p50Value: number;
  /** Nearest-rank 95th percentile across retained samples. */
  readonly p95Value: number;
};

/** Immutable timing summary for one scheduled graph node. */
export type GPUCommandGraphInspectorNodeSnapshot = {
  /** Stable graph node identifier. */
  readonly id: string;
  /** Node execution category. */
  readonly type: GPUCommandGraphNodeType;
  /** Optional application-specific semantic group. */
  readonly group?: string;
  /** Synchronous CPU encoding durations. */
  readonly cpu: GPUCommandGraphInspectorDurationSnapshot;
  /** Explicitly read GPU execution durations. */
  readonly gpu: GPUCommandGraphInspectorDurationSnapshot;
};

/** Immutable copy of graph compilation statistics. */
export type GPUCommandGraphInspectorStatsSnapshot = Readonly<
  Omit<GPUCommandGraphStats, 'nodeOrder'>
> & {
  /** Stable topological node order used for encoding. */
  readonly nodeOrder: readonly string[];
};

/** Immutable inspection state for one registered compiled graph. */
export type GPUCommandGraphInspectorGraphSnapshot = {
  /** Registered graph identifier. */
  readonly id: string;
  /** Compilation and transient-allocation statistics. */
  readonly stats: GPUCommandGraphInspectorStatsSnapshot;
  /** Graph-relevant device capabilities and limits. */
  readonly capabilities: Readonly<GPUCommandGraphCapabilities>;
  /** Number of synchronously recorded graph encodings. */
  readonly encodingCount: number;
  /** Number of GPU timing readbacks that rejected for this registration. */
  readonly timingReadFailureCount: number;
  /** Whole-graph CPU and GPU duration summaries. */
  readonly totals: {
    readonly cpu: GPUCommandGraphInspectorDurationSnapshot;
    readonly gpu: GPUCommandGraphInspectorDurationSnapshot;
  };
  /** Application-defined scalar counters in first-observed order. */
  readonly counters: readonly GPUCommandGraphInspectorCounterSnapshot[];
  /** Per-node duration summaries in compiled schedule order. */
  readonly nodes: readonly GPUCommandGraphInspectorNodeSnapshot[];
};

/** Immutable snapshot of every currently registered graph. */
export type GPUCommandGraphInspectorSnapshot = {
  /** Registered graphs in registration order. */
  readonly graphs: readonly GPUCommandGraphInspectorGraphSnapshot[];
};

type NodeInspectionState = {
  id: string;
  type: GPUCommandGraphNodeType;
  group?: string;
  cpuSamples: number[];
  gpuSamples: number[];
};

type GraphInspectionState = {
  id: string;
  stats: GPUCommandGraphInspectorStatsSnapshot;
  capabilities: Readonly<GPUCommandGraphCapabilities>;
  encodingCount: number;
  timingReadFailureCount: number;
  cpuSamples: number[];
  gpuSamples: number[];
  counters: Map<string, number[]>;
  nodes: Map<string, NodeInspectionState>;
};

const DEFAULT_MAX_SAMPLES = 120;

/**
 * Collects bounded timing and caller-published scalar-counter histories for compiled graphs.
 *
 * The inspector has no DOM or submission responsibilities. {@link observeGraph} provides a
 * reusable encoding, timing, and counter lifecycle for executable graphs. The lower-level
 * {@link registerGraph}, {@link recordEncoding}, {@link recordGPUTimings}, and
 * {@link recordCounters} methods remain available when an application cannot route activity
 * through an observation handle. Registering a new compiled graph with an existing ID replaces
 * the old registration and resets its measurements.
 */
export class GPUCommandGraphInspector {
  private readonly maxSamples: number;
  private readonly getNodeGroup?: GPUCommandGraphInspectorProps['getNodeGroup'];
  private readonly graphs = new Map<string, GraphInspectionState>();
  private readonly encodingGraphs = new WeakMap<
    GPUCommandGraphInspectorEncoding,
    GraphInspectionState
  >();

  /** Creates an empty inspector with bounded sample histories. */
  constructor(props: GPUCommandGraphInspectorProps = {}) {
    const maxSamples = props.maxSamples ?? DEFAULT_MAX_SAMPLES;
    if (!Number.isSafeInteger(maxSamples) || maxSamples <= 0) {
      throw new Error('GPUCommandGraphInspector maxSamples must be a positive safe integer');
    }
    this.maxSamples = maxSamples;
    this.getNodeGroup = props.getNodeGroup;
  }

  /**
   * Registers a compiled graph and captures its compile-time statistics and capabilities.
   *
   * Re-registering the same ID replaces and resets that graph. Any timing read still pending for
   * the previous registration is discarded when it settles.
   */
  registerGraph(graph: GPUCommandGraphInspectorGraph): void {
    this.graphs.set(graph.id, {
      id: graph.id,
      stats: copyGraphStats(graph.stats),
      capabilities: Object.freeze({...graph.capabilities}),
      encodingCount: 0,
      timingReadFailureCount: 0,
      cpuSamples: [],
      gpuSamples: [],
      counters: new Map(),
      nodes: new Map()
    });
  }

  /**
   * Registers an executable graph and returns a non-owning observation handle.
   *
   * The handle records CPU measurements for every encoding routed through `encode()`. Call its
   * `recordGPUTimings()` only after submitting the command buffer; repeated calls for one encoding
   * coalesce into a single timing sample. Caller-read diagnostics can be passed to
   * `recordCounters()`. Detaching removes this graph's registration only while it is still current,
   * so an older handle cannot remove or publish delayed counters into a same-ID replacement.
   */
  observeGraph<
    Parameters,
    Encoding extends GPUCommandGraphInspectorEncoding = GPUCommandGraphEncoding
  >(
    graph: GPUCommandGraphInspectorObservableGraph<Parameters, Encoding>
  ): GPUCommandGraphInspectorObservation<Parameters, Encoding> {
    this.registerGraph(graph);
    const registration = this.getGraph(graph.id);
    const timingReadPromises = new WeakMap<GPUCommandGraphInspectorEncoding, Promise<void>>();
    let attached = true;
    const isCurrent = (): boolean => attached && this.graphs.get(graph.id) === registration;
    return Object.freeze({
      graph,
      encode: (
        commandEncoder: CommandEncoder,
        options: GPUCommandGraphEncodeOptions<Parameters>
      ): Encoding => {
        const encoding = graph.encode(commandEncoder, options);
        if (isCurrent()) {
          this.recordGraphEncoding(registration, encoding);
        }
        return encoding;
      },
      recordGPUTimings: async (encoding: Encoding): Promise<void> => {
        const existingRead = timingReadPromises.get(encoding);
        if (existingRead) {
          await existingRead;
          return;
        }
        if (isCurrent() && this.encodingGraphs.get(encoding) === registration) {
          const timingRead = this.recordGraphGPUTimings(graph.id, registration, encoding);
          timingReadPromises.set(encoding, timingRead);
          await timingRead;
        }
      },
      recordCounters: (counters: Readonly<Record<string, number>>): void => {
        if (isCurrent()) {
          this.recordGraphCounters(registration, counters);
        }
      },
      detach: (): void => {
        if (!attached) {
          return;
        }
        attached = false;
        if (this.graphs.get(graph.id) === registration) {
          this.graphs.delete(graph.id);
        }
      }
    });
  }

  /** Removes every graph and invalidates any timing reads still pending for those registrations. */
  clear(): void {
    this.graphs.clear();
  }

  /** Records immediately available whole-graph and per-node CPU encoding durations. */
  recordEncoding(graphId: string, encoding: GPUCommandGraphInspectorEncoding): void {
    const graph = this.getGraph(graphId);
    this.recordGraphEncoding(graph, encoding);
  }

  /** Records one sample for each named scalar counter on a registered graph. */
  recordCounters(graphId: string, counters: Readonly<Record<string, number>>): void {
    this.recordGraphCounters(this.getGraph(graphId), counters);
  }

  private recordGraphEncoding(
    graph: GraphInspectionState,
    encoding: GPUCommandGraphInspectorEncoding
  ): void {
    this.encodingGraphs.set(encoding, graph);
    const {stats} = encoding;
    graph.encodingCount++;
    this.addSample(graph.cpuSamples, stats.cpuEncodeTimeMilliseconds);
    for (const nodeStats of stats.nodes) {
      const node = this.getNode(graph, nodeStats);
      this.addSample(node.cpuSamples, nodeStats.cpuEncodeTimeMilliseconds);
    }
  }

  private recordGraphCounters(
    graph: GraphInspectionState,
    counters: Readonly<Record<string, number>>
  ): void {
    const entries = Object.entries(counters);
    for (const [id, value] of entries) {
      if (!id || !Number.isFinite(value) || value < 0) {
        throw new Error(
          'GPUCommandGraphInspector counters require an ID and a finite, non-negative value'
        );
      }
    }
    for (const [id, value] of entries) {
      let samples = graph.counters.get(id);
      if (!samples) {
        samples = [];
        graph.counters.set(id, samples);
      }
      this.addSample(samples, value);
    }
  }

  /**
   * Explicitly reads and records whole-graph and per-node GPU durations.
   *
   * Timing read failures are counted rather than rethrown so optional telemetry cannot create an
   * unhandled application failure. A read that belongs to a replaced registration is ignored.
   */
  async recordGPUTimings(
    graphId: string,
    encoding: GPUCommandGraphInspectorEncoding
  ): Promise<void> {
    const recordedGraph = this.encodingGraphs.get(encoding);
    const graph = recordedGraph ?? this.getGraph(graphId);
    await this.recordGraphGPUTimings(graphId, graph, encoding);
  }

  private async recordGraphGPUTimings(
    graphId: string,
    graph: GraphInspectionState,
    encoding: GPUCommandGraphInspectorEncoding
  ): Promise<void> {
    if (this.graphs.get(graphId) !== graph) {
      return;
    }
    let report: GPUCommandGraphTimingReport;
    try {
      report = await encoding.readTimings();
    } catch {
      if (this.graphs.get(graphId) === graph) {
        graph.timingReadFailureCount++;
      }
      return;
    }
    if (this.graphs.get(graphId) !== graph) {
      return;
    }
    if (report.gpuTimeMilliseconds !== undefined) {
      this.addSample(graph.gpuSamples, report.gpuTimeMilliseconds);
    }
    for (const nodeTiming of report.nodes) {
      if (nodeTiming.gpuTimeMilliseconds !== undefined) {
        const node = this.getNode(graph, nodeTiming);
        this.addSample(node.gpuSamples, nodeTiming.gpuTimeMilliseconds);
      }
    }
  }

  /** Returns a deeply immutable point-in-time view of every registered graph. */
  getSnapshot(): GPUCommandGraphInspectorSnapshot {
    const graphs = Array.from(this.graphs.values(), graph => this.getGraphSnapshot(graph));
    return Object.freeze({graphs: Object.freeze(graphs)});
  }

  private getGraph(graphId: string): GraphInspectionState {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`GPUCommandGraphInspector graph "${graphId}" is not registered`);
    }
    return graph;
  }

  private getNode(
    graph: GraphInspectionState,
    nodeStats: Pick<GPUCommandGraphEncodingStats['nodes'][number], 'id' | 'type'>
  ): NodeInspectionState {
    const existingNode = graph.nodes.get(nodeStats.id);
    if (existingNode) {
      return existingNode;
    }
    const group = this.getNodeGroup?.({graphId: graph.id, id: nodeStats.id, type: nodeStats.type});
    const node: NodeInspectionState = {
      id: nodeStats.id,
      type: nodeStats.type,
      ...(group === undefined ? {} : {group}),
      cpuSamples: [],
      gpuSamples: []
    };
    graph.nodes.set(node.id, node);
    return node;
  }

  private addSample(samples: number[], value: number): void {
    samples.push(value);
    if (samples.length > this.maxSamples) {
      samples.splice(0, samples.length - this.maxSamples);
    }
  }

  private getGraphSnapshot(graph: GraphInspectionState): GPUCommandGraphInspectorGraphSnapshot {
    const orderedNodes: NodeInspectionState[] = [];
    const includedNodeIds = new Set<string>();
    for (const nodeId of graph.stats.nodeOrder) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        orderedNodes.push(node);
        includedNodeIds.add(nodeId);
      }
    }
    for (const node of graph.nodes.values()) {
      if (!includedNodeIds.has(node.id)) {
        orderedNodes.push(node);
      }
    }
    const nodes = orderedNodes.map(node =>
      Object.freeze({
        id: node.id,
        type: node.type,
        ...(node.group === undefined ? {} : {group: node.group}),
        cpu: summarizeSamples(node.cpuSamples),
        gpu: summarizeSamples(node.gpuSamples)
      })
    );
    const counters = Array.from(graph.counters, ([id, samples]) =>
      summarizeCounterSamples(id, samples)
    );
    return Object.freeze({
      id: graph.id,
      stats: graph.stats,
      capabilities: graph.capabilities,
      encodingCount: graph.encodingCount,
      timingReadFailureCount: graph.timingReadFailureCount,
      totals: Object.freeze({
        cpu: summarizeSamples(graph.cpuSamples),
        gpu: summarizeSamples(graph.gpuSamples)
      }),
      counters: Object.freeze(counters),
      nodes: Object.freeze(nodes)
    });
  }
}

function copyGraphStats(stats: GPUCommandGraphStats): GPUCommandGraphInspectorStatsSnapshot {
  return Object.freeze({...stats, nodeOrder: Object.freeze([...stats.nodeOrder])});
}

function summarizeSamples(samples: readonly number[]): GPUCommandGraphInspectorDurationSnapshot {
  if (samples.length === 0) {
    return Object.freeze({sampleCount: 0});
  }
  const sortedSamples = [...samples].sort((left, right) => left - right);
  return Object.freeze({
    sampleCount: samples.length,
    latestMilliseconds: samples[samples.length - 1],
    p50Milliseconds: getPercentile(sortedSamples, 0.5),
    p95Milliseconds: getPercentile(sortedSamples, 0.95)
  });
}

function summarizeCounterSamples(
  id: string,
  samples: readonly number[]
): GPUCommandGraphInspectorCounterSnapshot {
  const sortedSamples = [...samples].sort((left, right) => left - right);
  return Object.freeze({
    id,
    sampleCount: samples.length,
    latestValue: samples[samples.length - 1],
    p50Value: getPercentile(sortedSamples, 0.5),
    p95Value: getPercentile(sortedSamples, 0.95)
  });
}

function getPercentile(sortedSamples: readonly number[], percentile: number): number {
  return sortedSamples[Math.ceil(percentile * sortedSamples.length) - 1];
}
