// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

/** Deterministic graph families compared against their actual browser GPU execution. */
export type LuGraphBenchmarkDatasetKind =
  | 'sparse'
  | 'dense'
  | 'scale-free'
  | 'disconnected'
  | 'high-degree';

/** Explicit workload and repetition controls for an opt-in graph benchmark. */
export type LuGraphBenchmarkOptions = {
  kind: LuGraphBenchmarkDatasetKind;
  vertexCount: number;
  seed?: number;
  warmupIterations?: number;
  measuredIterations?: number;
  pageRankIterations?: number;
  forceIterations?: number;
  maxDepth?: number;
  theta?: number;
  gridSize?: readonly [number, number];
};

/** Source edge batches, including the deliberately preserved empty middle partition. */
export type LuGraphBenchmarkDataset = {
  kind: LuGraphBenchmarkDatasetKind;
  vertexCount: number;
  edgeCount: number;
  sourceChunks: Uint32Array[];
  targetChunks: Uint32Array[];
  /** Positive float32 edge costs aligned with every original source partition. */
  weightChunks: Float32Array[];
  positions: Float32Array;
};

/** Actual CPU and WebGPU algorithm implementations compared by the live benchmark. */
export type LuGraphBenchmarkAlgorithm =
  | 'topology'
  | 'breadth-first-search'
  | 'single-source-shortest-path'
  | 'connected-components'
  | 'label-propagation'
  | 'local-clustering-coefficient'
  | 'page-rank'
  | 'exact-layout'
  | 'spatial-layout';

/** Non-interpolated nearest-rank summary of real observed durations. */
export type LuGraphBenchmarkDistribution = {
  minimum: number;
  median: number;
  percentile95: number;
  maximum: number;
};

/** Correctness-gated timings and physical allocations for one real GPU algorithm. */
export type LuGraphBenchmarkPathReport = {
  algorithm: LuGraphBenchmarkAlgorithm;
  /** Compiled algorithm-iteration budget; this does not imply early stopping or convergence. */
  iterations?: number;
  /** Actual final GPU fixed-point status when the implementation publishes one. */
  converged?: boolean;
  /** Actual final GPU L1 residual when the implementation publishes that metric. */
  residual?: number;
  cpuTimeMilliseconds: LuGraphBenchmarkDistribution;
  cpuEncodeTimeMilliseconds: LuGraphBenchmarkDistribution;
  synchronizedTimeMilliseconds: LuGraphBenchmarkDistribution;
  gpuTimeMilliseconds?: LuGraphBenchmarkDistribution;
  maxAbsoluteError: number;
  importedBufferBytes: number;
  transientBufferBytes: number;
};

/** Browser/device-specific results; no result is populated without executing its workload. */
export type LuGraphBenchmarkReport = {
  datasetKind: LuGraphBenchmarkDatasetKind;
  vertexCount: number;
  edgeCount: number;
  warmupIterations: number;
  measuredIterations: number;
  timestampQueries: boolean;
  uploadTimeMilliseconds: number;
  compilationTimeMilliseconds: number;
  readbackTimeMilliseconds: number;
  spatialIndexBuildTimeMilliseconds: LuGraphBenchmarkDistribution;
  indexMemoryBytes: number;
  approximationMaxAbsoluteError: number;
  paths: LuGraphBenchmarkPathReport[];
};

/** @internal Exact CPU outputs used to reject incomplete or incorrect GPU measurements. */
export type LuGraphBenchmarkReference = {
  forwardOffsets: Uint32Array;
  forwardNeighbors: Uint32Array;
  forwardWeights: Float32Array;
  reverseOffsets: Uint32Array;
  reverseNeighbors: Uint32Array;
  reverseWeights: Float32Array;
  distances: Uint32Array;
  predecessors: Uint32Array;
  weightedDistances: Float32Array;
  weightedPredecessors: Uint32Array;
  components: Uint32Array;
  communities: Uint32Array;
  communityConverged: boolean;
  clusteringCoefficients: Float32Array;
  triangleCounts: Uint32Array;
  pageRank: Float32Array;
  exactPositions: Float32Array;
  exactVelocities: Float32Array;
  spatialPositions: Float32Array;
  spatialVelocities: Float32Array;
};

/** @internal Shared validated source rows, independently evaluated references, and CPU timings. */
export type LuGraphBenchmarkContext = {
  options: Required<LuGraphBenchmarkOptions>;
  dataset: LuGraphBenchmarkDataset;
  reference: LuGraphBenchmarkReference;
  cpuTimeMilliseconds: Record<LuGraphBenchmarkAlgorithm, LuGraphBenchmarkDistribution>;
};

type LuGraphBenchmarkAdjacency = Pick<
  LuGraphBenchmarkReference,
  | 'forwardOffsets'
  | 'forwardNeighbors'
  | 'forwardWeights'
  | 'reverseOffsets'
  | 'reverseNeighbors'
  | 'reverseWeights'
>;

type LuGraphBenchmarkSearch = Pick<LuGraphBenchmarkReference, 'distances' | 'predecessors'>;

type LuGraphBenchmarkShortestPath = Pick<
  LuGraphBenchmarkReference,
  'weightedDistances' | 'weightedPredecessors'
>;

type LuGraphBenchmarkCommunities = Pick<
  LuGraphBenchmarkReference,
  'communities' | 'communityConverged'
>;

type LuGraphBenchmarkClustering = Pick<
  LuGraphBenchmarkReference,
  'clusteringCoefficients' | 'triangleCounts'
>;

type LuGraphBenchmarkLayout = {positions: Float32Array; velocities: Float32Array};

type MeasuredLuGraphBenchmarkValue<Value> = {
  value: Value;
  timeMilliseconds: LuGraphBenchmarkDistribution;
};

const UINT32_MAXIMUM = 0xffffffff;
const MAXIMUM_VERTEX_COUNT = 0xfffffffe;
const MAXIMUM_SHORTEST_PATH_ITERATIONS = 1024;
const MINIMUM_REPULSION_DISTANCE_SQUARED = 0.0001;
const PAGE_RANK_DAMPING = 0.85;
/** @internal Fixed, honestly reported synchronous majority-vote workload. */
export const LU_GRAPH_BENCHMARK_LABEL_ITERATIONS = 8;
const DATASET_KINDS: readonly LuGraphBenchmarkDatasetKind[] = [
  'sparse',
  'dense',
  'scale-free',
  'disconnected',
  'high-degree'
];

/** @internal Shared exact/approximate physics avoid comparing unrelated implementations. */
export const LU_GRAPH_BENCHMARK_FORCE_PROPS = {
  repulsion: 0.01,
  attraction: 0.05,
  gravity: 0.01,
  damping: 0.9,
  maxVelocity: 0.05,
  timeStep: 1
} as const;

/** @internal Explicit indexing domain shared by CPU cell assignment and real GPUGridIndex. */
export const LU_GRAPH_BENCHMARK_BOUNDS = [-2, -2, 2, 2] as const;

/**
 * Creates reproducible directed workloads without flattening the explicit source partitions.
 *
 * The returned arrays belong to the caller; repeated invocations never share mutable storage.
 * The middle source and target chunks stay empty so measured topology construction exercises
 * the same ordered batch contract as streamed graph ingestion.
 */
export function makeLuGraphBenchmarkDataset(
  options: Pick<LuGraphBenchmarkOptions, 'kind' | 'vertexCount' | 'seed'>
): LuGraphBenchmarkDataset {
  const {kind, vertexCount} = options;
  const seed = options.seed ?? 0;
  if (!DATASET_KINDS.includes(kind)) {
    throw new Error('luGraph benchmark dataset kind is unsupported');
  }
  validateInteger('vertexCount', vertexCount, 1, MAXIMUM_VERTEX_COUNT);
  validateInteger('seed', seed, 0, UINT32_MAXIMUM);

  const sources: number[] = [];
  const targets: number[] = [];
  let randomState = seed;
  const nextRandom = (): number => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };
  const addEdge = (source: number, target: number): void => {
    sources.push(source);
    targets.push(target);
  };

  switch (kind) {
    case 'sparse': {
      if (vertexCount > 1) {
        for (let vertex = 0; vertex < vertexCount; vertex++) {
          addEdge(vertex, (vertex + 1) % vertexCount);
          if (vertex % 7 === 0 && vertexCount > 3) {
            addEdge(vertex, (vertex + 3) % vertexCount);
          }
        }
      }
      break;
    }

    case 'dense': {
      if (vertexCount * (vertexCount - 1) > UINT32_MAXIMUM) {
        throw new Error('luGraph benchmark dense edgeCount exceeds uint32 capacity');
      }
      for (let source = 0; source < vertexCount; source++) {
        for (let target = 0; target < vertexCount; target++) {
          if (source !== target) addEdge(source, target);
        }
      }
      break;
    }

    case 'scale-free': {
      if (vertexCount > 1) {
        addEdge(0, 1);
        const preferentialVertices = [0, 1];
        for (let vertex = 2; vertex < vertexCount; vertex++) {
          const attachments = Math.min(2, vertex);
          const selected = new Set<number>();
          while (selected.size < attachments) {
            selected.add(
              preferentialVertices[Math.floor(nextRandom() * preferentialVertices.length)]
            );
          }
          for (const target of selected) {
            addEdge(target, vertex);
            preferentialVertices.push(vertex, target);
          }
        }
      }
      break;
    }

    case 'disconnected': {
      // Reserve the final vertex as an observable isolated weak component.
      const connectedVertices = Math.max(0, vertexCount - 1);
      const componentCount = Math.min(3, connectedVertices);
      for (let component = 0; component < componentCount; component++) {
        const first = Math.floor((component * connectedVertices) / componentCount);
        const last = Math.floor(((component + 1) * connectedVertices) / componentCount);
        for (let vertex = first; vertex + 1 < last; vertex++) {
          addEdge(vertex, vertex + 1);
          if ((vertex - first) % 4 === 0 && vertex + 2 < last) {
            addEdge(vertex, vertex + 2);
          }
        }
      }
      break;
    }

    case 'high-degree': {
      for (let vertex = 1; vertex < vertexCount; vertex++) {
        addEdge(0, vertex);
        if (vertex % 3 === 0) addEdge(vertex, 0);
      }
      break;
    }
  }

  const positions = new Float32Array(vertexCount * 2);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    const radius = 0.15 + 0.8 * Math.sqrt((vertex + 0.5) / vertexCount);
    const angle = vertex * goldenAngle + nextRandom() * 0.2;
    positions[vertex * 2] = radius * Math.cos(angle);
    positions[vertex * 2 + 1] = radius * Math.sin(angle);
  }

  const split = Math.ceil(sources.length / 2);
  const weights = Float32Array.from(sources, (source, edgeIndex) =>
    Math.fround(
      0.25 +
        (((Math.imul(source, 31) + Math.imul(targets[edgeIndex], 17) + edgeIndex + seed) >>> 0) %
          16) *
          0.25
    )
  );
  return {
    kind,
    vertexCount,
    edgeCount: sources.length,
    sourceChunks: [
      Uint32Array.from(sources.slice(0, split)),
      new Uint32Array(0),
      Uint32Array.from(sources.slice(split))
    ],
    targetChunks: [
      Uint32Array.from(targets.slice(0, split)),
      new Uint32Array(0),
      Uint32Array.from(targets.slice(split))
    ],
    weightChunks: [weights.slice(0, split), new Float32Array(0), weights.slice(split)],
    positions
  };
}

/** @internal Generates every reference independently before any GPU timing is reported. */
export function prepareLuGraphBenchmark(options: LuGraphBenchmarkOptions): LuGraphBenchmarkContext {
  const normalizedOptions = normalizeLuGraphBenchmarkOptions(options);
  const dataset = makeLuGraphBenchmarkDataset(normalizedOptions);
  const adjacency = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    buildLuGraphBenchmarkAdjacency(dataset)
  );
  const search = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    evaluateLuGraphBenchmarkBreadthFirstSearch(adjacency.value, normalizedOptions.maxDepth)
  );
  const shortestPath = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    evaluateLuGraphBenchmarkShortestPath(adjacency.value)
  );
  const components = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    evaluateLuGraphBenchmarkConnectedComponents(dataset)
  );
  const communities = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    evaluateLuGraphBenchmarkLabelPropagation(adjacency.value, LU_GRAPH_BENCHMARK_LABEL_ITERATIONS)
  );
  const clustering = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    evaluateLuGraphBenchmarkLocalClustering(adjacency.value)
  );
  const pageRank = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    evaluateLuGraphBenchmarkPageRank(adjacency.value, normalizedOptions.pageRankIterations)
  );
  const exactLayout = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    evaluateLuGraphBenchmarkForceLayout(dataset, adjacency.value, normalizedOptions, false)
  );
  const spatialLayout = measureLuGraphBenchmarkValue(normalizedOptions, () =>
    evaluateLuGraphBenchmarkForceLayout(dataset, adjacency.value, normalizedOptions, true)
  );

  return {
    options: normalizedOptions,
    dataset,
    reference: {
      ...adjacency.value,
      ...search.value,
      ...shortestPath.value,
      components: components.value,
      ...communities.value,
      ...clustering.value,
      pageRank: pageRank.value,
      exactPositions: exactLayout.value.positions,
      exactVelocities: exactLayout.value.velocities,
      spatialPositions: spatialLayout.value.positions,
      spatialVelocities: spatialLayout.value.velocities
    },
    cpuTimeMilliseconds: {
      topology: adjacency.timeMilliseconds,
      'breadth-first-search': search.timeMilliseconds,
      'single-source-shortest-path': shortestPath.timeMilliseconds,
      'connected-components': components.timeMilliseconds,
      'label-propagation': communities.timeMilliseconds,
      'local-clustering-coefficient': clustering.timeMilliseconds,
      'page-rank': pageRank.timeMilliseconds,
      'exact-layout': exactLayout.timeMilliseconds,
      'spatial-layout': spatialLayout.timeMilliseconds
    }
  };
}

/** @internal Uses the browser's monotonic timer without preventing portable Node execution. */
export function getLuGraphBenchmarkTime(): number {
  return globalThis.performance?.now() ?? Date.now();
}

/** @internal Preserves observed nearest-rank durations without interpolation or synthetic data. */
export function summarizeLuGraphBenchmarkSamples(
  samples: readonly number[]
): LuGraphBenchmarkDistribution {
  if (samples.length === 0 || samples.some(sample => !Number.isFinite(sample) || sample < 0)) {
    throw new Error('luGraph benchmark samples must contain finite non-negative durations');
  }
  const sortedSamples = [...samples].sort((left, right) => left - right);
  return {
    minimum: sortedSamples[0],
    median: sortedSamples[Math.ceil(sortedSamples.length * 0.5) - 1],
    percentile95: sortedSamples[Math.ceil(sortedSamples.length * 0.95) - 1],
    maximum: sortedSamples[sortedSamples.length - 1]
  };
}

function normalizeLuGraphBenchmarkOptions(
  options: LuGraphBenchmarkOptions
): Required<LuGraphBenchmarkOptions> {
  const normalizedOptions = {
    kind: options.kind,
    vertexCount: options.vertexCount,
    seed: options.seed ?? 0,
    warmupIterations: options.warmupIterations ?? 1,
    measuredIterations: options.measuredIterations ?? 3,
    pageRankIterations: options.pageRankIterations ?? 20,
    forceIterations: options.forceIterations ?? 1,
    maxDepth: options.maxDepth ?? 8,
    theta: options.theta ?? 0.6,
    gridSize: options.gridSize ?? [8, 8]
  } satisfies Required<LuGraphBenchmarkOptions>;

  validateInteger('warmupIterations', normalizedOptions.warmupIterations, 0, UINT32_MAXIMUM);
  validateInteger('measuredIterations', normalizedOptions.measuredIterations, 1, UINT32_MAXIMUM);
  validateInteger('pageRankIterations', normalizedOptions.pageRankIterations, 1, 1024);
  validateInteger('forceIterations', normalizedOptions.forceIterations, 1, 1024);
  validateInteger('maxDepth', normalizedOptions.maxDepth, 0, 1024);
  if (!Number.isFinite(normalizedOptions.theta) || normalizedOptions.theta < 0) {
    throw new Error('luGraph benchmark theta must be finite and non-negative');
  }
  if (!Array.isArray(normalizedOptions.gridSize) || normalizedOptions.gridSize.length !== 2) {
    throw new Error('luGraph benchmark gridSize must contain two positive dimensions');
  }
  validateInteger('gridSize width', normalizedOptions.gridSize[0], 1, MAXIMUM_VERTEX_COUNT);
  validateInteger('gridSize height', normalizedOptions.gridSize[1], 1, MAXIMUM_VERTEX_COUNT);
  if (normalizedOptions.gridSize[0] * normalizedOptions.gridSize[1] > MAXIMUM_VERTEX_COUNT) {
    throw new Error('luGraph benchmark gridSize cell count exceeds uint32 capacity');
  }
  return normalizedOptions;
}

function validateInteger(name: string, value: number, minimum: number, maximum: number): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`luGraph benchmark ${name} must be an integer in the supported range`);
  }
}

function measureLuGraphBenchmarkValue<Value>(
  options: Required<LuGraphBenchmarkOptions>,
  evaluate: () => Value
): MeasuredLuGraphBenchmarkValue<Value> {
  for (let iteration = 0; iteration < options.warmupIterations; iteration++) {
    evaluate();
  }
  let value: Value | undefined;
  const samples: number[] = [];
  for (let iteration = 0; iteration < options.measuredIterations; iteration++) {
    const startTime = getLuGraphBenchmarkTime();
    value = evaluate();
    samples.push(getLuGraphBenchmarkTime() - startTime);
  }
  return {value: value!, timeMilliseconds: summarizeLuGraphBenchmarkSamples(samples)};
}

function buildLuGraphBenchmarkAdjacency(
  dataset: LuGraphBenchmarkDataset
): LuGraphBenchmarkAdjacency {
  const forwardOffsets = new Uint32Array(dataset.vertexCount + 1);
  const reverseOffsets = new Uint32Array(dataset.vertexCount + 1);
  forEachBenchmarkEdge(dataset, (source, target) => {
    forwardOffsets[source + 1]++;
    reverseOffsets[target + 1]++;
  });
  for (let vertex = 0; vertex < dataset.vertexCount; vertex++) {
    forwardOffsets[vertex + 1] += forwardOffsets[vertex];
    reverseOffsets[vertex + 1] += reverseOffsets[vertex];
  }
  const forwardNeighbors = new Uint32Array(dataset.edgeCount);
  const forwardWeights = new Float32Array(dataset.edgeCount);
  const reverseNeighbors = new Uint32Array(dataset.edgeCount);
  const reverseWeights = new Float32Array(dataset.edgeCount);
  const forwardCursors = forwardOffsets.slice(0, -1);
  const reverseCursors = reverseOffsets.slice(0, -1);
  forEachBenchmarkEdge(dataset, (source, target, weight) => {
    const forwardSlot = forwardCursors[source]++;
    const reverseSlot = reverseCursors[target]++;
    forwardNeighbors[forwardSlot] = target;
    forwardWeights[forwardSlot] = weight;
    reverseNeighbors[reverseSlot] = source;
    reverseWeights[reverseSlot] = weight;
  });
  return {
    forwardOffsets,
    forwardNeighbors,
    forwardWeights,
    reverseOffsets,
    reverseNeighbors,
    reverseWeights
  };
}

function evaluateLuGraphBenchmarkBreadthFirstSearch(
  adjacency: LuGraphBenchmarkAdjacency,
  maxDepth: number
): LuGraphBenchmarkSearch {
  const vertexCount = adjacency.forwardOffsets.length - 1;
  const distances = new Uint32Array(vertexCount).fill(UINT32_MAXIMUM);
  const predecessors = new Uint32Array(vertexCount).fill(UINT32_MAXIMUM);
  distances[0] = 0;
  const frontier = new Uint32Array(vertexCount);
  let first = 0;
  let last = 1;
  while (first < last) {
    const source = frontier[first++];
    const distance = distances[source];
    if (distance >= maxDepth) continue;
    for (
      let slot = adjacency.forwardOffsets[source];
      slot < adjacency.forwardOffsets[source + 1];
      slot++
    ) {
      const target = adjacency.forwardNeighbors[slot];
      if (distances[target] === UINT32_MAXIMUM) {
        distances[target] = distance + 1;
        predecessors[target] = source;
        frontier[last++] = target;
      } else if (distances[target] === distance + 1) {
        predecessors[target] = Math.min(predecessors[target], source);
      }
    }
  }
  return {distances, predecessors};
}

/** @internal Independently evaluates exactly the bounded GPU relaxation workload. */
export function evaluateLuGraphBenchmarkShortestPath(
  adjacency: LuGraphBenchmarkAdjacency
): LuGraphBenchmarkShortestPath {
  const vertexCount = adjacency.forwardOffsets.length - 1;
  const weightedDistances = new Float32Array(vertexCount).fill(Number.POSITIVE_INFINITY);
  const weightedPredecessors = new Uint32Array(vertexCount).fill(UINT32_MAXIMUM);
  weightedDistances[0] = 0;

  const maximumIterations = Math.min(
    Math.max(vertexCount - 1, 0),
    MAXIMUM_SHORTEST_PATH_ITERATIONS
  );
  for (let iteration = 0; iteration < maximumIterations; iteration++) {
    const previousDistances = weightedDistances.slice();
    let changed = false;

    for (let source = 0; source < vertexCount; source++) {
      const sourceDistance = previousDistances[source];
      if (!Number.isFinite(sourceDistance)) continue;

      for (
        let slot = adjacency.forwardOffsets[source];
        slot < adjacency.forwardOffsets[source + 1];
        slot++
      ) {
        const target = adjacency.forwardNeighbors[slot];
        const distance = Math.fround(sourceDistance + adjacency.forwardWeights[slot]);
        if (distance < weightedDistances[target]) {
          weightedDistances[target] = distance;
          weightedPredecessors[target] = source;
          changed = true;
        } else if (
          distance === weightedDistances[target] &&
          distance < previousDistances[target] &&
          source < weightedPredecessors[target]
        ) {
          weightedPredecessors[target] = source;
        }
      }
    }

    if (!changed) break;
  }

  return {weightedDistances, weightedPredecessors};
}

function evaluateLuGraphBenchmarkConnectedComponents(
  dataset: LuGraphBenchmarkDataset
): Uint32Array {
  const parents = Uint32Array.from({length: dataset.vertexCount}, (_, vertex) => vertex);
  const findRoot = (vertex: number): number => {
    let root = vertex;
    while (parents[root] !== root) root = parents[root];
    while (parents[vertex] !== vertex) {
      const next = parents[vertex];
      parents[vertex] = root;
      vertex = next;
    }
    return root;
  };
  forEachBenchmarkEdge(dataset, (source, target) => {
    const firstRoot = findRoot(source);
    const secondRoot = findRoot(target);
    if (firstRoot < secondRoot) parents[secondRoot] = firstRoot;
    else if (secondRoot < firstRoot) parents[firstRoot] = secondRoot;
  });
  return Uint32Array.from(parents, (_, vertex) => findRoot(vertex));
}

/** Independently reproduces duplicate-sensitive, synchronous weak-neighbor community voting. */
function evaluateLuGraphBenchmarkLabelPropagation(
  adjacency: LuGraphBenchmarkAdjacency,
  iterations: number
): LuGraphBenchmarkCommunities {
  const vertexCount = adjacency.forwardOffsets.length - 1;
  let communities = Uint32Array.from({length: vertexCount}, (_, vertex) => vertex);
  let communityConverged = vertexCount === 0;

  for (let iteration = 0; iteration < iterations; iteration++) {
    const next = new Uint32Array(vertexCount);
    communityConverged = true;
    for (let vertex = 0; vertex < vertexCount; vertex++) {
      const votes = new Map<number, number>([[communities[vertex], 1]]);
      for (const [offsets, neighbors] of [
        [adjacency.forwardOffsets, adjacency.forwardNeighbors],
        [adjacency.reverseOffsets, adjacency.reverseNeighbors]
      ] as const) {
        for (let slot = offsets[vertex]; slot < offsets[vertex + 1]; slot++) {
          const neighbor = neighbors[slot];
          if (neighbor === vertex) continue;
          const label = communities[neighbor];
          votes.set(label, (votes.get(label) ?? 0) + 1);
        }
      }

      let selectedLabel = communities[vertex];
      let selectedVotes = votes.get(selectedLabel)!;
      for (const [label, count] of votes) {
        if (count > selectedVotes || (count === selectedVotes && label < selectedLabel)) {
          selectedLabel = label;
          selectedVotes = count;
        }
      }
      next[vertex] = selectedLabel;
      if (selectedLabel !== communities[vertex]) communityConverged = false;
    }
    communities = next;
  }

  return {communities, communityConverged};
}

/** Evaluates Graphalytics directed closure using unique weak neighbors and actual directed links. */
function evaluateLuGraphBenchmarkLocalClustering(
  adjacency: LuGraphBenchmarkAdjacency
): LuGraphBenchmarkClustering {
  const vertexCount = adjacency.forwardOffsets.length - 1;
  const clusteringCoefficients = new Float32Array(vertexCount);
  const triangleCounts = new Uint32Array(vertexCount);

  for (let vertex = 0; vertex < vertexCount; vertex++) {
    const neighbors = new Set<number>();
    for (const [offsets, adjacent] of [
      [adjacency.forwardOffsets, adjacency.forwardNeighbors],
      [adjacency.reverseOffsets, adjacency.reverseNeighbors]
    ] as const) {
      for (let slot = offsets[vertex]; slot < offsets[vertex + 1]; slot++) {
        if (adjacent[slot] !== vertex) neighbors.add(adjacent[slot]);
      }
    }
    if (neighbors.size < 2) continue;

    let closures = 0;
    for (const source of neighbors) {
      const uniqueTargets = new Set<number>();
      for (
        let slot = adjacency.forwardOffsets[source];
        slot < adjacency.forwardOffsets[source + 1];
        slot++
      ) {
        const target = adjacency.forwardNeighbors[slot];
        if (target !== source && neighbors.has(target)) uniqueTargets.add(target);
      }
      closures += uniqueTargets.size;
    }

    triangleCounts[vertex] = closures;
    clusteringCoefficients[vertex] = Math.fround(
      closures / (neighbors.size * (neighbors.size - 1))
    );
  }

  return {clusteringCoefficients, triangleCounts};
}

function evaluateLuGraphBenchmarkPageRank(
  adjacency: LuGraphBenchmarkAdjacency,
  iterations: number
): Float32Array {
  const vertexCount = adjacency.forwardOffsets.length - 1;
  let scores = new Float32Array(vertexCount).fill(1 / vertexCount);
  for (let iteration = 0; iteration < iterations; iteration++) {
    let danglingMass = 0;
    for (let vertex = 0; vertex < vertexCount; vertex++) {
      if (adjacency.forwardOffsets[vertex + 1] === adjacency.forwardOffsets[vertex]) {
        danglingMass += scores[vertex];
      }
    }
    const next = new Float32Array(vertexCount);
    let total = 0;
    for (let vertex = 0; vertex < vertexCount; vertex++) {
      let incomingMass = 0;
      for (
        let slot = adjacency.reverseOffsets[vertex];
        slot < adjacency.reverseOffsets[vertex + 1];
        slot++
      ) {
        const neighbor = adjacency.reverseNeighbors[slot];
        const degree = adjacency.forwardOffsets[neighbor + 1] - adjacency.forwardOffsets[neighbor];
        if (degree > 0) incomingMass += scores[neighbor] / degree;
      }
      next[vertex] =
        (1 - PAGE_RANK_DAMPING) / vertexCount +
        PAGE_RANK_DAMPING * (incomingMass + danglingMass / vertexCount);
      total += next[vertex];
    }
    for (let vertex = 0; vertex < vertexCount; vertex++) next[vertex] /= total;
    scores = next;
  }
  return scores;
}

function evaluateLuGraphBenchmarkForceLayout(
  dataset: LuGraphBenchmarkDataset,
  adjacency: LuGraphBenchmarkAdjacency,
  options: Required<LuGraphBenchmarkOptions>,
  approximate: boolean
): LuGraphBenchmarkLayout {
  const positions = dataset.positions.slice();
  const velocities = new Float32Array(positions.length);
  const {repulsion, attraction, gravity, damping, maxVelocity, timeStep} =
    LU_GRAPH_BENCHMARK_FORCE_PROPS;

  for (let iteration = 0; iteration < options.forceIterations; iteration++) {
    const cells = approximate ? buildLuGraphBenchmarkCells(positions, options.gridSize) : undefined;
    if (approximate && !cells) {
      velocities.fill(0);
      continue;
    }
    const cellCenters = cells?.map(occupants => {
      let centerX = 0;
      let centerY = 0;
      for (const occupant of occupants) {
        centerX += positions[occupant * 2];
        centerY += positions[occupant * 2 + 1];
      }
      return occupants.length === 0
        ? [0, 0]
        : [Math.fround(centerX / occupants.length), Math.fround(centerY / occupants.length)];
    });
    const intermediate = approximate ? new Float32Array(positions.length) : undefined;

    for (let vertex = 0; vertex < dataset.vertexCount; vertex++) {
      const positionX = positions[vertex * 2];
      const positionY = positions[vertex * 2 + 1];
      let forceX = -gravity * positionX;
      let forceY = -gravity * positionY;

      if (cells) {
        const [gridWidth, gridHeight] = options.gridSize;
        const sourceColumn = getLuGraphBenchmarkCellCoordinate(positionX, gridWidth);
        const sourceRow = getLuGraphBenchmarkCellCoordinate(positionY, gridHeight);
        const cellWidth = 4 / gridWidth;
        const cellHeight = 4 / gridHeight;
        const diameterSquared = cellWidth * cellWidth + cellHeight * cellHeight;

        for (let cell = 0; cell < cells.length; cell++) {
          const occupants = cells[cell];
          if (occupants.length === 0) continue;
          const column = cell % gridWidth;
          const row = Math.floor(cell / gridWidth);
          const isNear = Math.abs(column - sourceColumn) <= 1 && Math.abs(row - sourceRow) <= 1;
          const [centerX, centerY] = cellCenters![cell];
          const differenceX = positionX - centerX;
          const differenceY = positionY - centerY;
          const distanceSquared = differenceX * differenceX + differenceY * differenceY;
          const useMonopole =
            !isNear &&
            options.theta > 0 &&
            diameterSquared < options.theta * options.theta * distanceSquared;
          if (useMonopole) {
            const scale =
              (repulsion * occupants.length) /
              Math.max(distanceSquared, MINIMUM_REPULSION_DISTANCE_SQUARED);
            forceX += differenceX * scale;
            forceY += differenceY * scale;
          } else {
            for (const otherVertex of occupants) {
              if (otherVertex === vertex) continue;
              const differenceToVertexX = positionX - positions[otherVertex * 2];
              const differenceToVertexY = positionY - positions[otherVertex * 2 + 1];
              const scale =
                repulsion /
                Math.max(
                  differenceToVertexX * differenceToVertexX +
                    differenceToVertexY * differenceToVertexY,
                  MINIMUM_REPULSION_DISTANCE_SQUARED
                );
              forceX += differenceToVertexX * scale;
              forceY += differenceToVertexY * scale;
            }
          }
        }
        intermediate![vertex * 2] = velocities[vertex * 2] + forceX * timeStep;
        intermediate![vertex * 2 + 1] = velocities[vertex * 2 + 1] + forceY * timeStep;
        forceX = 0;
        forceY = 0;
      } else {
        for (let otherVertex = 0; otherVertex < dataset.vertexCount; otherVertex++) {
          if (otherVertex === vertex) continue;
          const differenceX = positionX - positions[otherVertex * 2];
          const differenceY = positionY - positions[otherVertex * 2 + 1];
          const scale =
            repulsion /
            Math.max(
              differenceX * differenceX + differenceY * differenceY,
              MINIMUM_REPULSION_DISTANCE_SQUARED
            );
          forceX += differenceX * scale;
          forceY += differenceY * scale;
        }
      }

      for (const offsetsAndNeighbors of [
        [adjacency.forwardOffsets, adjacency.forwardNeighbors],
        [adjacency.reverseOffsets, adjacency.reverseNeighbors]
      ]) {
        const [offsets, neighbors] = offsetsAndNeighbors;
        for (let slot = offsets[vertex]; slot < offsets[vertex + 1]; slot++) {
          const neighbor = neighbors[slot];
          forceX += attraction * (positions[neighbor * 2] - positionX);
          forceY += attraction * (positions[neighbor * 2 + 1] - positionY);
        }
      }
      let velocityX =
        ((intermediate ? intermediate[vertex * 2] : velocities[vertex * 2]) + forceX * timeStep) *
        damping;
      let velocityY =
        ((intermediate ? intermediate[vertex * 2 + 1] : velocities[vertex * 2 + 1]) +
          forceY * timeStep) *
        damping;
      const speed = Math.hypot(velocityX, velocityY);
      if (speed > maxVelocity) {
        velocityX *= maxVelocity / speed;
        velocityY *= maxVelocity / speed;
      }
      velocities[vertex * 2] = velocityX;
      velocities[vertex * 2 + 1] = velocityY;
    }

    for (let vertex = 0; vertex < dataset.vertexCount; vertex++) {
      positions[vertex * 2] += velocities[vertex * 2] * timeStep;
      positions[vertex * 2 + 1] += velocities[vertex * 2 + 1] * timeStep;
    }
  }
  return {positions, velocities};
}

function buildLuGraphBenchmarkCells(
  positions: Float32Array,
  gridSize: readonly [number, number]
): number[][] | undefined {
  const [gridWidth, gridHeight] = gridSize;
  const cells = Array.from({length: gridWidth * gridHeight}, () => [] as number[]);
  for (let vertex = 0; vertex < positions.length / 2; vertex++) {
    const positionX = positions[vertex * 2];
    const positionY = positions[vertex * 2 + 1];
    if (
      !Number.isFinite(positionX) ||
      !Number.isFinite(positionY) ||
      positionX < -2 ||
      positionX > 2 ||
      positionY < -2 ||
      positionY > 2
    ) {
      return undefined;
    }
    const column = getLuGraphBenchmarkCellCoordinate(positionX, gridWidth);
    const row = getLuGraphBenchmarkCellCoordinate(positionY, gridHeight);
    cells[row * gridWidth + column].push(vertex);
  }
  return cells;
}

function getLuGraphBenchmarkCellCoordinate(position: number, size: number): number {
  if (position === -2) return 0;
  if (position === 2) return size - 1;
  // Matches GPUGridIndex's signed-bounds normalization path without f32 atomics.
  return Math.min(Math.floor(((position / 2 + 1) / 2) * size), size - 1);
}

function forEachBenchmarkEdge(
  dataset: LuGraphBenchmarkDataset,
  visit: (source: number, target: number, weight: number, edgeIndex: number) => void
): void {
  let edgeIndex = 0;
  for (let chunkIndex = 0; chunkIndex < dataset.sourceChunks.length; chunkIndex++) {
    const sources = dataset.sourceChunks[chunkIndex];
    const targets = dataset.targetChunks[chunkIndex];
    const weights = dataset.weightChunks[chunkIndex];
    for (let row = 0; row < sources.length; row++) {
      visit(sources[row], targets[row], weights[row], edgeIndex++);
    }
  }
}
