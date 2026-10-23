// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import {type Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from './gpu-command-graph';
import {
  type GPUBoundedDispatchLayout,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from './gpu-dispatch-utils';
import {
  createTransientView,
  createTransientVectorView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const GRAPH_TRAVERSAL_WORKGROUP_SIZE = 256;
const MAXIMUM_GRAPH_TRAVERSAL_DEPTH = 1024;

/** Direction in which a compressed sparse graph is traversed. */
export type GPUGraphTraversalDirection = 'outgoing' | 'incoming' | 'both';

/** Packed traversal data stored in one allocation or ordered partitions. */
export type GPUGraphTraversalData = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Properties for bounded, GPU-resident breadth-first graph traversal. */
export type GPUGraphTraversalProps = {
  /** Prefix for graph nodes and graph-owned frontier buffers. */
  id?: string;
  /** Forward CSR offsets; packed globally or one local nodeCount + 1 chunk per partition. */
  offsets: GPUGraphTraversalData;
  /** Forward CSR destinations using stable global node indices. */
  neighbors: GPUGraphTraversalData;
  /** Reverse CSR offsets, using the same partition contract as forward offsets. */
  reverseOffsets?: GPUGraphTraversalData;
  /** Reverse CSR destinations using stable global node indices. */
  reverseNeighbors?: GPUGraphTraversalData;
  /** Caller-owned stable starting node indices. */
  seeds: GPUGraphTraversalData;
  /** Optional GPU-resident number of active seed rows. */
  seedCount?: GraphDataView<'uint32'>;
  /** Caller-owned, node-aligned zero/one reachability mask. */
  output: GPUGraphTraversalData;
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
  dispatchLayout: GPUBoundedDispatchLayout;
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
  readonly offsets: GPUGraphTraversalData;
  /** Forward CSR destinations. */
  readonly neighbors: GPUGraphTraversalData;
  /** Optional reverse CSR offsets. */
  readonly reverseOffsets?: GPUGraphTraversalData;
  /** Optional reverse CSR destinations. */
  readonly reverseNeighbors?: GPUGraphTraversalData;
  /** Stable starting node indices. */
  readonly seeds: GPUGraphTraversalData;
  /** Optional active seed count. */
  readonly seedCount?: GraphDataView<'uint32'>;
  /** Caller-owned reachability mask. */
  readonly output: GPUGraphTraversalData;
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

    const namedData = getNamedTraversalData(this);
    for (const [name, data] of namedData) {
      validateTraversalData(data, `${this.id} ${name}`);
    }
    if (!Number.isSafeInteger(this.maxDepth) || this.maxDepth < 0) {
      throw new Error(`${this.id} maxDepth must be a nonnegative safe integer`);
    }
    if (this.maxDepth > MAXIMUM_GRAPH_TRAVERSAL_DEPTH) {
      throw new Error(`${this.id} maxDepth must be at most ${MAXIMUM_GRAPH_TRAVERSAL_DEPTH}`);
    }
    validateAdjacencyTopology(this.id, this.offsets, this.neighbors, this.output, 'forward');
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
    if (this.reverseOffsets && this.reverseNeighbors) {
      validateAdjacencyTopology(
        this.id,
        this.reverseOffsets,
        this.reverseNeighbors,
        this.output,
        'reverse'
      );
    }
    const outputBuffers = new Set(getTraversalChunks(this.output).map(view => view.buffer));
    if (
      namedData.some(
        ([name, data]) =>
          name !== 'output' && getTraversalChunks(data).some(view => outputBuffers.has(view.buffer))
      )
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
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    nodes.push(
      ...getGPUGraphTraversalCommandNodesWithDispatchLimit(
        this,
        graph,
        graph.device.limits.maxComputeWorkgroupsPerDimension
      )
    );

    return nodes;
  }
}

/** Adds traversal using an explicit per-dimension dispatch limit. @internal */
export function getGPUGraphTraversalCommandNodesWithDispatchLimit<Parameters>(
  traversal: GPUGraphTraversal,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  for (const [, data] of getNamedTraversalData(traversal)) {
    for (const view of getTraversalChunks(data)) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${traversal.id} views must belong to the target graph`);
      }
    }
  }
  if (traversal.output.length === 0) {
    return nodes;
  }

  if (traversal.output instanceof GraphVectorView) {
    nodes.push(
      ...addPartitionedTraversalToGraph(traversal, graph, maxComputeWorkgroupsPerDimension)
    );
    return nodes;
  }
  nodes.push(...addPackedTraversalToGraph(traversal, graph, maxComputeWorkgroupsPerDimension));

  return nodes;
}

/** Adds the original one-allocation traversal path. */
function addPackedTraversalToGraph<Parameters>(
  traversal: GPUGraphTraversal,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const output = traversal.output as GraphDataView<'uint32'>;
  const offsets = traversal.offsets as GraphDataView<'uint32'>;
  const neighbors = traversal.neighbors as GraphDataView<'uint32'>;
  const reverseOffsets = traversal.reverseOffsets as GraphDataView<'uint32'> | undefined;
  const reverseNeighbors = traversal.reverseNeighbors as GraphDataView<'uint32'> | undefined;
  let currentFrontier = createTransientView(
    graph,
    `${traversal.id}-frontier-current`,
    'uint32',
    output.length
  );
  let nextFrontier = createTransientView(
    graph,
    `${traversal.id}-frontier-next`,
    'uint32',
    output.length
  );
  nodes.push(
    ...addInitializationPass(
      graph,
      traversal.id,
      output,
      currentFrontier,
      maxComputeWorkgroupsPerDimension
    )
  );
  if (traversal.seeds.length > 0) {
    for (const seedChunk of getTraversalChunkRanges(traversal.seeds)) {
      if (seedChunk.view.length > 0) {
        nodes.push(
          ...addSeedPass(
            graph,
            {
              id:
                traversal.seeds instanceof GraphVectorView
                  ? `${traversal.id}-seed-${seedChunk.index}`
                  : `${traversal.id}-seed`,
              seeds: seedChunk.view,
              seedBase: seedChunk.base,
              seedCount: traversal.seedCount,
              targetBase: 0,
              frontier: currentFrontier,
              output
            },
            maxComputeWorkgroupsPerDimension
          )
        );
      }
    }
  }

  for (let depth = 0; depth < traversal.maxDepth; depth++) {
    nodes.push(
      ...addClearFrontierPass(
        graph,
        `${traversal.id}-depth-${depth}-clear`,
        nextFrontier,
        maxComputeWorkgroupsPerDimension
      )
    );
    if (traversal.direction !== 'incoming') {
      nodes.push(
        ...addExpansionPass(
          graph,
          {
            id: `${traversal.id}-depth-${depth}-outgoing`,
            offsets,
            neighbors,
            frontier: currentFrontier,
            nextFrontier,
            output,
            targetBase: 0,
            activeDepth: traversal.activeDepth,
            depth
          },
          maxComputeWorkgroupsPerDimension
        )
      );
    }
    if (traversal.direction !== 'outgoing') {
      nodes.push(
        ...addExpansionPass(
          graph,
          {
            id: `${traversal.id}-depth-${depth}-incoming`,
            offsets: reverseOffsets!,
            neighbors: reverseNeighbors!,
            frontier: currentFrontier,
            nextFrontier,
            output,
            targetBase: 0,
            activeDepth: traversal.activeDepth,
            depth
          },
          maxComputeWorkgroupsPerDimension
        )
      );
    }
    [currentFrontier, nextFrontier] = [nextFrontier, currentFrontier];
  }

  return nodes;
}

/** Adds partition-preserving traversal over local CSR rows and global stable neighbor IDs. */
function addPartitionedTraversalToGraph<Parameters>(
  traversal: GPUGraphTraversal,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const output = traversal.output as GraphVectorView<'uint32'>;
  const offsets = traversal.offsets as GraphVectorView<'uint32'>;
  const neighbors = traversal.neighbors as GraphVectorView<'uint32'>;
  const reverseOffsets = traversal.reverseOffsets as GraphVectorView<'uint32'> | undefined;
  const reverseNeighbors = traversal.reverseNeighbors as GraphVectorView<'uint32'> | undefined;
  let currentFrontier = createTransientVectorView(
    graph,
    `${traversal.id}-frontier-current`,
    output
  );
  let nextFrontier = createTransientVectorView(graph, `${traversal.id}-frontier-next`, output);
  const outputRanges = getTraversalChunkRanges(output);
  const seedRanges = getTraversalChunkRanges(traversal.seeds);

  for (const outputRange of outputRanges) {
    if (outputRange.view.length > 0) {
      nodes.push(
        ...addInitializationPass(
          graph,
          `${traversal.id}-partition-${outputRange.index}`,
          outputRange.view,
          currentFrontier.data[outputRange.index],
          maxComputeWorkgroupsPerDimension
        )
      );
    }
  }
  for (const seedRange of seedRanges) {
    if (seedRange.view.length === 0) {
      continue;
    }
    for (const targetRange of outputRanges) {
      if (targetRange.view.length > 0) {
        nodes.push(
          ...addSeedPass(
            graph,
            {
              id: `${traversal.id}-seed-${seedRange.index}-target-${targetRange.index}`,
              seeds: seedRange.view,
              seedBase: seedRange.base,
              seedCount: traversal.seedCount,
              targetBase: targetRange.base,
              frontier: currentFrontier.data[targetRange.index],
              output: targetRange.view
            },
            maxComputeWorkgroupsPerDimension
          )
        );
      }
    }
  }

  for (let depth = 0; depth < traversal.maxDepth; depth++) {
    for (const targetRange of outputRanges) {
      if (targetRange.view.length > 0) {
        nodes.push(
          ...addClearFrontierPass(
            graph,
            `${traversal.id}-depth-${depth}-clear-${targetRange.index}`,
            nextFrontier.data[targetRange.index],
            maxComputeWorkgroupsPerDimension
          )
        );
      }
    }
    if (traversal.direction !== 'incoming') {
      nodes.push(
        ...addPartitionedExpansionPasses(
          graph,
          {
            id: `${traversal.id}-depth-${depth}-outgoing`,
            offsets,
            neighbors,
            currentFrontier,
            nextFrontier,
            output,
            activeDepth: traversal.activeDepth,
            depth
          },
          maxComputeWorkgroupsPerDimension
        )
      );
    }
    if (traversal.direction !== 'outgoing') {
      nodes.push(
        ...addPartitionedExpansionPasses(
          graph,
          {
            id: `${traversal.id}-depth-${depth}-incoming`,
            offsets: reverseOffsets!,
            neighbors: reverseNeighbors!,
            currentFrontier,
            nextFrontier,
            output,
            activeDepth: traversal.activeDepth,
            depth
          },
          maxComputeWorkgroupsPerDimension
        )
      );
    }
    [currentFrontier, nextFrontier] = [nextFrontier, currentFrontier];
  }

  return nodes;
}

/** Returns caller-owned graph views in stable validation order. */
function getNamedTraversalData(
  traversal: GPUGraphTraversal
): Array<[string, GPUGraphTraversalData]> {
  const data: Array<[string, GPUGraphTraversalData]> = [
    ['offsets', traversal.offsets],
    ['neighbors', traversal.neighbors]
  ];
  if (traversal.reverseOffsets) {
    data.push(['reverseOffsets', traversal.reverseOffsets]);
  }
  if (traversal.reverseNeighbors) {
    data.push(['reverseNeighbors', traversal.reverseNeighbors]);
  }
  data.push(['seeds', traversal.seeds]);
  if (traversal.seedCount) {
    data.push(['seedCount', traversal.seedCount]);
  }
  if (traversal.activeDepth) {
    data.push(['activeDepth', traversal.activeDepth]);
  }
  data.push(['output', traversal.output]);
  return data;
}

/** Clears the previous reached mask and creates the empty first frontier. */
function addInitializationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'uint32'>,
  frontier: GraphDataView<'uint32'>,
  maxComputeWorkgroupsPerDimension: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const dispatchLayout = getGPUGraphTraversalDispatchLayout(
    output.length,
    maxComputeWorkgroupsPerDimension
  );
  const invocationIndex = getGPUGraphTraversalInvocationIndexSource(dispatchLayout);
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
const FRONTIER_OFFSET: u32 = ${getViewElementOffset(frontier)}u;
@group(0) @binding(0) var<storage, read_write> reached: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> frontier: array<atomic<u32>>;

@compute @workgroup_size(${GRAPH_TRAVERSAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${invocationIndex}
  if (index < NODE_COUNT) {
    atomicStore(&reached[OUTPUT_OFFSET + index], 0u);
    atomicStore(&frontier[FRONTIER_OFFSET + index], 0u);
  }
}`;
  nodes.push(
    ...addTraversalPass(graph, {
      id: `${id}-initialize`,
      source,
      resources: [
        {buffer: output, usage: 'storage-write'},
        {buffer: frontier, usage: 'storage-write'}
      ],
      bindings: {reached: output, frontier},
      dispatchLayout
    })
  );

  return nodes;
}

/** Marks valid seed nodes in both the first frontier and the reached mask. */
function addSeedPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    seeds: GraphDataView<'uint32'>;
    seedBase: number;
    seedCount?: GraphDataView<'uint32'>;
    targetBase: number;
    frontier: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
  },
  maxComputeWorkgroupsPerDimension: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const dispatchLayout = getGPUGraphTraversalDispatchLayout(
    props.seeds.length,
    maxComputeWorkgroupsPerDimension
  );
  const invocationIndex = getGPUGraphTraversalInvocationIndexSource(dispatchLayout);
  const countDeclaration = props.seedCount
    ? `const SEED_COUNT_OFFSET: u32 = ${getViewElementOffset(props.seedCount)}u;
@group(0) @binding(3) var<storage, read> activeSeedCount: array<u32>;`
    : '';
  const effectiveCount = props.seedCount
    ? 'activeSeedCount[SEED_COUNT_OFFSET]'
    : `${props.seedBase + props.seeds.length}u`;
  const source = /* wgsl */ `
const SEED_CAPACITY: u32 = ${props.seeds.length}u;
const SEED_BASE: u32 = ${props.seedBase}u;
const TARGET_BASE: u32 = ${props.targetBase}u;
const TARGET_COUNT: u32 = ${props.output.length}u;
const SEEDS_OFFSET: u32 = ${getViewElementOffset(props.seeds)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const FRONTIER_OFFSET: u32 = ${getViewElementOffset(props.frontier)}u;
@group(0) @binding(0) var<storage, read> seeds: array<u32>;
@group(0) @binding(1) var<storage, read_write> reached: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> frontier: array<atomic<u32>>;
${countDeclaration}

@compute @workgroup_size(${GRAPH_TRAVERSAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${invocationIndex}
  let seedIndex = index;
  if (seedIndex >= SEED_CAPACITY || SEED_BASE + seedIndex >= ${effectiveCount}) {
    return;
  }
  let nodeIndex = seeds[SEEDS_OFFSET + seedIndex];
  if (nodeIndex >= TARGET_BASE && nodeIndex - TARGET_BASE < TARGET_COUNT) {
    let targetIndex = nodeIndex - TARGET_BASE;
    atomicStore(&reached[OUTPUT_OFFSET + targetIndex], 1u);
    atomicStore(&frontier[FRONTIER_OFFSET + targetIndex], 1u);
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
  nodes.push(
    ...addTraversalPass(graph, {
      id: props.id,
      source,
      resources,
      bindings,
      dispatchLayout
    })
  );

  return nodes;
}

/** Clears a frontier before its next parallel breadth-first expansion. */
function addClearFrontierPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  frontier: GraphDataView<'uint32'>,
  maxComputeWorkgroupsPerDimension: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const dispatchLayout = getGPUGraphTraversalDispatchLayout(
    frontier.length,
    maxComputeWorkgroupsPerDimension
  );
  const invocationIndex = getGPUGraphTraversalInvocationIndexSource(dispatchLayout);
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${frontier.length}u;
const FRONTIER_OFFSET: u32 = ${getViewElementOffset(frontier)}u;
@group(0) @binding(0) var<storage, read_write> frontier: array<atomic<u32>>;

@compute @workgroup_size(${GRAPH_TRAVERSAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${invocationIndex}
  if (index < NODE_COUNT) {
    atomicStore(&frontier[FRONTIER_OFFSET + index], 0u);
  }
}`;
  nodes.push(
    ...addTraversalPass(graph, {
      id,
      source,
      resources: [{buffer: frontier, usage: 'storage-write'}],
      bindings: {frontier},
      dispatchLayout
    })
  );

  return nodes;
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
    targetBase: number;
    activeDepth?: GraphDataView<'uint32'>;
    depth: number;
  },
  maxComputeWorkgroupsPerDimension: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const dispatchLayout = getGPUGraphTraversalDispatchLayout(
    props.frontier.length,
    maxComputeWorkgroupsPerDimension
  );
  const invocationIndex = getGPUGraphTraversalInvocationIndexSource(dispatchLayout);
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
const SOURCE_COUNT: u32 = ${props.frontier.length}u;
const TARGET_COUNT: u32 = ${props.output.length}u;
const TARGET_BASE: u32 = ${props.targetBase}u;
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
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${invocationIndex}
  let nodeIndex = index;
  if (nodeIndex >= SOURCE_COUNT || frontier[FRONTIER_OFFSET + nodeIndex] == 0u) {
    return;
  }
  ${activeDepthGuard}
  let firstNeighbor = min(offsets[OFFSETS_OFFSET + nodeIndex], NEIGHBOR_COUNT);
  let lastNeighbor = min(offsets[OFFSETS_OFFSET + nodeIndex + 1u], NEIGHBOR_COUNT);
  for (var neighborIndex = firstNeighbor; neighborIndex < lastNeighbor; neighborIndex++) {
    let neighbor = neighbors[NEIGHBORS_OFFSET + neighborIndex];
    if (neighbor >= TARGET_BASE && neighbor - TARGET_BASE < TARGET_COUNT) {
      let targetIndex = neighbor - TARGET_BASE;
      if (atomicExchange(&reached[OUTPUT_OFFSET + targetIndex], 1u) == 0u) {
        atomicStore(&nextFrontier[NEXT_FRONTIER_OFFSET + targetIndex], 1u);
      }
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
  nodes.push(
    ...addTraversalPass(graph, {
      id: props.id,
      source,
      resources,
      bindings,
      dispatchLayout
    })
  );

  return nodes;
}

/** Adds every source-to-target partition pair required for arbitrary cross-partition edges. */
function addPartitionedExpansionPasses<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    offsets: GraphVectorView<'uint32'>;
    neighbors: GraphVectorView<'uint32'>;
    currentFrontier: GraphVectorView<'uint32'>;
    nextFrontier: GraphVectorView<'uint32'>;
    output: GraphVectorView<'uint32'>;
    activeDepth?: GraphDataView<'uint32'>;
    depth: number;
  },
  maxComputeWorkgroupsPerDimension: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const sourceRanges = getTraversalChunkRanges(props.output);
  for (const sourceRange of sourceRanges) {
    if (sourceRange.view.length === 0) {
      continue;
    }
    for (const targetRange of sourceRanges) {
      if (targetRange.view.length === 0) {
        continue;
      }
      nodes.push(
        ...addExpansionPass(
          graph,
          {
            id: `${props.id}-source-${sourceRange.index}-target-${targetRange.index}`,
            offsets: props.offsets.data[sourceRange.index],
            neighbors: props.neighbors.data[sourceRange.index],
            frontier: props.currentFrontier.data[sourceRange.index],
            nextFrontier: props.nextFrontier.data[targetRange.index],
            output: targetRange.view,
            targetBase: targetRange.base,
            activeDepth: props.activeDepth,
            depth: props.depth
          },
          maxComputeWorkgroupsPerDimension
        )
      );
    }
  }

  return nodes;
}

/** Validates atomic adjacency or one local CSR allocation per output partition. */
function validateAdjacencyTopology(
  id: string,
  offsets: GPUGraphTraversalData,
  neighbors: GPUGraphTraversalData,
  output: GPUGraphTraversalData,
  direction: 'forward' | 'reverse'
): void {
  const partitioned = output instanceof GraphVectorView;
  if (
    offsets instanceof GraphVectorView !== partitioned ||
    neighbors instanceof GraphVectorView !== partitioned
  ) {
    throw new Error(`${id} ${direction} adjacency must use the same partition kind as output`);
  }
  if (!partitioned) {
    if (offsets.length !== output.length + 1) {
      const prefix = direction === 'reverse' ? 'reverse ' : '';
      throw new Error(`${id} ${prefix}offsets must contain one more row than the output`);
    }
    return;
  }
  const offsetVector = offsets as GraphVectorView<'uint32'>;
  const neighborVector = neighbors as GraphVectorView<'uint32'>;
  const outputVector = output as GraphVectorView<'uint32'>;
  if (
    offsetVector.data.length !== outputVector.data.length ||
    neighborVector.data.length !== outputVector.data.length
  ) {
    throw new Error(`${id} ${direction} adjacency must contain one CSR chunk per output chunk`);
  }
  for (const [chunkIndex, outputChunk] of outputVector.data.entries()) {
    if (offsetVector.data[chunkIndex].length !== outputChunk.length + 1) {
      throw new Error(
        `${id} ${direction} offsets chunk ${chunkIndex} must contain one more row than its output chunk`
      );
    }
  }
}

/** Normalizes traversal data into ordered physical chunks. */
function getTraversalChunks(data: GPUGraphTraversalData): readonly GraphDataView<'uint32'>[] {
  return data instanceof GraphVectorView ? data.data : [data];
}

/** Adds stable global row bases to ordered traversal chunks. */
function getTraversalChunkRanges(data: GPUGraphTraversalData): Array<{
  index: number;
  base: number;
  view: GraphDataView<'uint32'>;
}> {
  let base = 0;
  return getTraversalChunks(data).map((view, index) => {
    const range = {index, base, view};
    base += view.length;
    return range;
  });
}

/** Validates every traversal partition as packed unsigned scalar data. */
function validateTraversalData(data: GPUGraphTraversalData, name: string): void {
  for (const [chunkIndex, view] of getTraversalChunks(data).entries()) {
    const chunkName = data instanceof GraphVectorView ? `${name} chunk ${chunkIndex}` : name;
    validatePackedUint32View(view, chunkName);
  }
}

/** Plans a bounded three-dimensional dispatch for one graph-traversal pass. @internal */
export function getGPUGraphTraversalDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUGraphTraversal',
    elementCount,
    GRAPH_TRAVERSAL_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}

/** Returns WGSL mapping a bounded 3D graph-traversal dispatch to one row index. @internal */
export function getGPUGraphTraversalInvocationIndexSource(
  layout: GPUBoundedDispatchLayout
): string {
  return getBoundedInvocationIndexSource(layout, GRAPH_TRAVERSAL_WORKGROUP_SIZE);
}

/** Wraps generated WGSL in one graph-owned, lazily bound computation. */
function addTraversalPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: TraversalPassProps
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id: props.id,
      resources: props.resources,
      compile: ({device}) => {
        const kernel = new Kernel(device, {
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

            kernel.dispatch(computePass, {
              bindings: resolvedBindings,
              x: props.dispatchLayout.x,
              y: props.dispatchLayout.y,
              z: props.dispatchLayout.z
            });
          },
          destroy: () => kernel.destroy()
        };
      }
    })
  );

  return nodes;
}
