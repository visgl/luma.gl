// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const GRAPH_TRAVERSAL_WORKGROUP_SIZE = 256;

/** Direction in which a compressed sparse graph is traversed. */
export type GPUGraphTraversalDirection = 'outgoing' | 'incoming' | 'both';

/** Properties for bounded, GPU-resident breadth-first graph traversal. */
export type GPUGraphTraversalProps = {
  /** Prefix for graph nodes and graph-owned frontier buffers. */
  id?: string;
  /** Forward CSR offsets; contains one more entry than the number of nodes. */
  offsets: GraphDataView<'uint32'>;
  /** Forward CSR destinations using stable node indices. */
  neighbors: GraphDataView<'uint32'>;
  /** Reverse CSR offsets used for incoming or bidirectional traversal. */
  reverseOffsets?: GraphDataView<'uint32'>;
  /** Reverse CSR destinations used for incoming or bidirectional traversal. */
  reverseNeighbors?: GraphDataView<'uint32'>;
  /** Caller-owned stable starting node indices. */
  seeds: GraphDataView<'uint32'>;
  /** Optional GPU-resident number of active seed rows. */
  seedCount?: GraphDataView<'uint32'>;
  /** Caller-owned, node-aligned zero/one reachability mask. */
  output: GraphDataView<'uint32'>;
  /** Maximum number of compiled graph hops. Defaults to one. */
  maxDepth?: number;
  /** Optional dynamic hop count, clamped by the compiled maximum. */
  activeDepth?: GraphDataView<'uint32'>;
  /** Edge direction. Defaults to outgoing. */
  direction?: GPUGraphTraversalDirection;
};

type TraversalPassProps = {
  id: string;
  source: string;
  resources: GraphBufferUse[];
  bindings: Record<string, GraphDataView<'uint32'>>;
  dispatchCount: number;
};

/**
 * Performs cycle-safe, duplicate-free, bounded breadth-first graph traversal on the GPU.
 *
 * Adjacency uses compressed sparse rows. Only the caller-owned reached mask is published; the
 * ping-pong frontiers are graph-owned transients. Active seeds and depth can change between graph
 * encodings without introducing a readback or command-graph recompilation.
 */
export class GPUGraphTraversal {
  /** Prefix for graph nodes and frontier storage. */
  readonly id: string;
  /** Forward CSR offsets. */
  readonly offsets: GraphDataView<'uint32'>;
  /** Forward CSR destinations. */
  readonly neighbors: GraphDataView<'uint32'>;
  /** Optional reverse CSR offsets. */
  readonly reverseOffsets?: GraphDataView<'uint32'>;
  /** Optional reverse CSR destinations. */
  readonly reverseNeighbors?: GraphDataView<'uint32'>;
  /** Stable starting node indices. */
  readonly seeds: GraphDataView<'uint32'>;
  /** Optional active seed count. */
  readonly seedCount?: GraphDataView<'uint32'>;
  /** Caller-owned reachability mask. */
  readonly output: GraphDataView<'uint32'>;
  /** Number of compiled breadth-first expansion stages. */
  readonly maxDepth: number;
  /** Optional dynamically selected number of active expansion stages. */
  readonly activeDepth?: GraphDataView<'uint32'>;
  /** Forward, reverse, or combined adjacency selection. */
  readonly direction: GPUGraphTraversalDirection;

  constructor(props: GPUGraphTraversalProps) {
    this.id = props.id ?? 'gpu-graph-traversal';
    this.offsets = props.offsets;
    this.neighbors = props.neighbors;
    this.reverseOffsets = props.reverseOffsets;
    this.reverseNeighbors = props.reverseNeighbors;
    this.seeds = props.seeds;
    this.seedCount = props.seedCount;
    this.output = props.output;
    this.maxDepth = props.maxDepth ?? 1;
    this.activeDepth = props.activeDepth;
    this.direction = props.direction ?? 'outgoing';

    const namedViews = this.getNamedViews();
    for (const [name, view] of namedViews) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (!Number.isSafeInteger(this.maxDepth) || this.maxDepth < 0) {
      throw new Error(`${this.id} maxDepth must be a nonnegative safe integer`);
    }
    if (this.offsets.length !== this.output.length + 1) {
      throw new Error(`${this.id} offsets must contain one more row than the output`);
    }
    if (this.seedCount && this.seedCount.length !== 1) {
      throw new Error(`${this.id} seedCount must contain exactly one row`);
    }
    if (this.activeDepth && this.activeDepth.length !== 1) {
      throw new Error(`${this.id} activeDepth must contain exactly one row`);
    }
    if ((this.reverseOffsets === undefined) !== (this.reverseNeighbors === undefined)) {
      throw new Error(`${this.id} reverse offsets and neighbors must be provided together`);
    }
    if (this.direction !== 'outgoing' && !this.reverseOffsets) {
      throw new Error(`${this.id} ${this.direction} traversal requires reverse adjacency`);
    }
    if (this.reverseOffsets && this.reverseOffsets.length !== this.output.length + 1) {
      throw new Error(`${this.id} reverse offsets must contain one more row than the output`);
    }
    if (
      namedViews.some(([name, view]) => name !== 'output' && view.buffer === this.output.buffer)
    ) {
      throw new Error(`${this.id} output must use a separate buffer from traversal inputs`);
    }
  }

  /**
   * Adds initialization, seed publication, and bounded frontier-expansion passes.
   *
   * Invalid seed and neighbor indices are ignored. Atomic exchange prevents cycles and duplicate
   * edges from rediscovering a previously reached node.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const [, view] of this.getNamedViews()) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.output.length === 0) {
      return;
    }

    let currentFrontier = createTransientView(
      graph,
      `${this.id}-frontier-current`,
      'uint32',
      this.output.length
    );
    let nextFrontier = createTransientView(
      graph,
      `${this.id}-frontier-next`,
      'uint32',
      this.output.length
    );
    addInitializationPass(graph, this.id, this.output, currentFrontier);
    if (this.seeds.length > 0) {
      addSeedPass(graph, {
        id: `${this.id}-seed`,
        seeds: this.seeds,
        seedCount: this.seedCount,
        frontier: currentFrontier,
        output: this.output
      });
    }

    for (let depth = 0; depth < this.maxDepth; depth++) {
      addClearFrontierPass(graph, `${this.id}-depth-${depth}-clear`, nextFrontier);
      if (this.direction !== 'incoming') {
        addExpansionPass(graph, {
          id: `${this.id}-depth-${depth}-outgoing`,
          offsets: this.offsets,
          neighbors: this.neighbors,
          frontier: currentFrontier,
          nextFrontier,
          output: this.output,
          activeDepth: this.activeDepth,
          depth
        });
      }
      if (this.direction !== 'outgoing') {
        addExpansionPass(graph, {
          id: `${this.id}-depth-${depth}-incoming`,
          offsets: this.reverseOffsets!,
          neighbors: this.reverseNeighbors!,
          frontier: currentFrontier,
          nextFrontier,
          output: this.output,
          activeDepth: this.activeDepth,
          depth
        });
      }
      [currentFrontier, nextFrontier] = [nextFrontier, currentFrontier];
    }
  }

  /** Returns caller-owned graph views in stable validation order. */
  private getNamedViews(): Array<[string, GraphDataView<'uint32'>]> {
    const views: Array<[string, GraphDataView<'uint32'>]> = [
      ['offsets', this.offsets],
      ['neighbors', this.neighbors]
    ];
    if (this.reverseOffsets) {
      views.push(['reverseOffsets', this.reverseOffsets]);
    }
    if (this.reverseNeighbors) {
      views.push(['reverseNeighbors', this.reverseNeighbors]);
    }
    views.push(['seeds', this.seeds]);
    if (this.seedCount) {
      views.push(['seedCount', this.seedCount]);
    }
    if (this.activeDepth) {
      views.push(['activeDepth', this.activeDepth]);
    }
    views.push(['output', this.output]);
    return views;
  }
}

/** Clears the previous reached mask and creates the empty first frontier. */
function addInitializationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'uint32'>,
  frontier: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
const FRONTIER_OFFSET: u32 = ${getViewElementOffset(frontier)}u;
@group(0) @binding(0) var<storage, read_write> reached: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> frontier: array<atomic<u32>>;

@compute @workgroup_size(${GRAPH_TRAVERSAL_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index < NODE_COUNT) {
    atomicStore(&reached[OUTPUT_OFFSET + index], 0u);
    atomicStore(&frontier[FRONTIER_OFFSET + index], 0u);
  }
}`;
  addTraversalPass(graph, {
    id: `${id}-initialize`,
    source,
    resources: [
      {buffer: output, usage: 'storage-write'},
      {buffer: frontier, usage: 'storage-write'}
    ],
    bindings: {reached: output, frontier},
    dispatchCount: Math.ceil(output.length / GRAPH_TRAVERSAL_WORKGROUP_SIZE)
  });
}

/** Marks valid seed nodes in both the first frontier and the reached mask. */
function addSeedPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    seeds: GraphDataView<'uint32'>;
    seedCount?: GraphDataView<'uint32'>;
    frontier: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
  }
): void {
  const countDeclaration = props.seedCount
    ? `const SEED_COUNT_OFFSET: u32 = ${getViewElementOffset(props.seedCount)}u;
@group(0) @binding(3) var<storage, read> activeSeedCount: array<u32>;`
    : '';
  const effectiveCount = props.seedCount
    ? 'min(activeSeedCount[SEED_COUNT_OFFSET], SEED_CAPACITY)'
    : 'SEED_CAPACITY';
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${props.output.length}u;
const SEED_CAPACITY: u32 = ${props.seeds.length}u;
const SEEDS_OFFSET: u32 = ${getViewElementOffset(props.seeds)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const FRONTIER_OFFSET: u32 = ${getViewElementOffset(props.frontier)}u;
@group(0) @binding(0) var<storage, read> seeds: array<u32>;
@group(0) @binding(1) var<storage, read_write> reached: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> frontier: array<atomic<u32>>;
${countDeclaration}

@compute @workgroup_size(${GRAPH_TRAVERSAL_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let seedIndex = globalId.x;
  if (seedIndex >= ${effectiveCount}) {
    return;
  }
  let nodeIndex = seeds[SEEDS_OFFSET + seedIndex];
  if (nodeIndex < NODE_COUNT) {
    atomicStore(&reached[OUTPUT_OFFSET + nodeIndex], 1u);
    atomicStore(&frontier[FRONTIER_OFFSET + nodeIndex], 1u);
  }
}`;
  const bindings: Record<string, GraphDataView<'uint32'>> = {
    seeds: props.seeds,
    reached: props.output,
    frontier: props.frontier
  };
  const resources: GraphBufferUse[] = [
    {buffer: props.seeds, usage: 'storage-read'},
    {buffer: props.output, usage: 'storage-write'},
    {buffer: props.frontier, usage: 'storage-write'}
  ];
  if (props.seedCount) {
    bindings['activeSeedCount'] = props.seedCount;
    resources.push({buffer: props.seedCount, usage: 'storage-read'});
  }
  addTraversalPass(graph, {
    id: props.id,
    source,
    resources,
    bindings,
    dispatchCount: Math.ceil(props.seeds.length / GRAPH_TRAVERSAL_WORKGROUP_SIZE)
  });
}

/** Clears a frontier before its next parallel breadth-first expansion. */
function addClearFrontierPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  frontier: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${frontier.length}u;
const FRONTIER_OFFSET: u32 = ${getViewElementOffset(frontier)}u;
@group(0) @binding(0) var<storage, read_write> frontier: array<atomic<u32>>;

@compute @workgroup_size(${GRAPH_TRAVERSAL_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < NODE_COUNT) {
    atomicStore(&frontier[FRONTIER_OFFSET + globalId.x], 0u);
  }
}`;
  addTraversalPass(graph, {
    id,
    source,
    resources: [{buffer: frontier, usage: 'storage-write'}],
    bindings: {frontier},
    dispatchCount: Math.ceil(frontier.length / GRAPH_TRAVERSAL_WORKGROUP_SIZE)
  });
}

/** Expands one directed CSR frontier and atomically suppresses repeated node discovery. */
function addExpansionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    offsets: GraphDataView<'uint32'>;
    neighbors: GraphDataView<'uint32'>;
    frontier: GraphDataView<'uint32'>;
    nextFrontier: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    activeDepth?: GraphDataView<'uint32'>;
    depth: number;
  }
): void {
  const activeDepthDeclaration = props.activeDepth
    ? `const ACTIVE_DEPTH_OFFSET: u32 = ${getViewElementOffset(props.activeDepth)}u;
@group(0) @binding(5) var<storage, read> activeDepth: array<u32>;`
    : '';
  const activeDepthGuard = props.activeDepth
    ? `if (${props.depth}u >= activeDepth[ACTIVE_DEPTH_OFFSET]) {
    return;
  }`
    : '';
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${props.output.length}u;
const NEIGHBOR_COUNT: u32 = ${props.neighbors.length}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
const NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(props.neighbors)}u;
const FRONTIER_OFFSET: u32 = ${getViewElementOffset(props.frontier)}u;
const NEXT_FRONTIER_OFFSET: u32 = ${getViewElementOffset(props.nextFrontier)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> offsets: array<u32>;
@group(0) @binding(1) var<storage, read> neighbors: array<u32>;
@group(0) @binding(2) var<storage, read> frontier: array<u32>;
@group(0) @binding(3) var<storage, read_write> nextFrontier: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> reached: array<atomic<u32>>;
${activeDepthDeclaration}

@compute @workgroup_size(${GRAPH_TRAVERSAL_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let nodeIndex = globalId.x;
  if (nodeIndex >= NODE_COUNT || frontier[FRONTIER_OFFSET + nodeIndex] == 0u) {
    return;
  }
  ${activeDepthGuard}
  let firstNeighbor = min(offsets[OFFSETS_OFFSET + nodeIndex], NEIGHBOR_COUNT);
  let lastNeighbor = min(offsets[OFFSETS_OFFSET + nodeIndex + 1u], NEIGHBOR_COUNT);
  for (var neighborIndex = firstNeighbor; neighborIndex < lastNeighbor; neighborIndex++) {
    let neighbor = neighbors[NEIGHBORS_OFFSET + neighborIndex];
    if (neighbor < NODE_COUNT &&
      atomicExchange(&reached[OUTPUT_OFFSET + neighbor], 1u) == 0u) {
      atomicStore(&nextFrontier[NEXT_FRONTIER_OFFSET + neighbor], 1u);
    }
  }
}`;
  const bindings: Record<string, GraphDataView<'uint32'>> = {
    offsets: props.offsets,
    neighbors: props.neighbors,
    frontier: props.frontier,
    nextFrontier: props.nextFrontier,
    reached: props.output
  };
  const resources: GraphBufferUse[] = [
    {buffer: props.offsets, usage: 'storage-read'},
    {buffer: props.neighbors, usage: 'storage-read'},
    {buffer: props.frontier, usage: 'storage-read'},
    {buffer: props.nextFrontier, usage: 'storage-write'},
    {buffer: props.output, usage: 'storage-write'}
  ];
  if (props.activeDepth) {
    bindings['activeDepth'] = props.activeDepth;
    resources.push({buffer: props.activeDepth, usage: 'storage-read'});
  }
  addTraversalPass(graph, {
    id: props.id,
    source,
    resources,
    bindings,
    dispatchCount: Math.ceil(props.output.length / GRAPH_TRAVERSAL_WORKGROUP_SIZE)
  });
}

/** Wraps generated WGSL in one graph-owned, lazily bound computation. */
function addTraversalPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: TraversalPassProps
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
          const resolvedBindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            resolvedBindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolvedBindings);
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
