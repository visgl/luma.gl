// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {
  GPUGraphAlgorithmsData,
  GPUGraphAlgorithmsSingleSourceShortestPath,
  GPUGraphAlgorithmsTopology,
  type GPUGraphAlgorithmsAdjacency,
  type GPUGraphAlgorithmsSingleSourceShortestPathDirection
} from '@luma.gl/graph/gpu-graph-algorithms';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it, vi} from 'vitest';

const UNREACHABLE_PREDECESSOR = 0xffffffff;

type EdgeList = {
  vertexCount: number;
  sources: number[];
  targets: number[];
  weights?: number[];
  directed?: boolean;
};

type RunFixture = {
  device: Device;
  graph: EdgeList;
  buffers: Buffer[];
  topology: GPUGraphAlgorithmsTopology;
  distances: GPUVector<'float32'>;
  predecessors: GPUVector<'uint32'>;
  converged: GPUVector<'uint32'>;
  destroy: () => void;
};

it('GPUGraphAlgorithmsSingleSourceShortestPath run() converges past 1,024 rounds on a long path', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const vertexCount = 1500;
  const graph = makePath(vertexCount);
  const fixture = createRunFixture(device, graph);
  const search = new GPUGraphAlgorithmsSingleSourceShortestPath({
    topology: fixture.topology,
    sourceVertex: 0,
    distances: fixture.distances,
    predecessors: fixture.predecessors,
    converged: fixture.converged
  });
  try {
    expect(search.maxIterations, 'the default budget covers every simple path').toBe(
      vertexCount - 1
    );
    const result = await search.run({iterationsPerSubmit: 256});
    expect(result.converged, 'a 1,499-hop path converges').toBe(true);
    expect(result.iterations, 'the simple-path bound ends the run after V - 1 rounds').toBe(
      vertexCount - 1
    );
    await expectDijkstraParity(fixture, [0]);
    expect((await readVector(fixture.converged))[0]).toBe(1);
  } finally {
    search.destroy();
    fixture.destroy();
  }
});

it('GPUGraphAlgorithmsSingleSourceShortestPath run() resumes from distances after an exhausted budget', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const graph = makePath(40);
  const fixture = createRunFixture(device, graph);
  const search = new GPUGraphAlgorithmsSingleSourceShortestPath({
    topology: fixture.topology,
    sourceVertex: 0,
    distances: fixture.distances,
    predecessors: fixture.predecessors,
    maxIterations: 10
  });
  try {
    const result = await search.run({iterationsPerSubmit: 4});
    expect(result.converged, 'ten rounds cannot reach the end of a 39-hop path').toBe(false);
    expect(result.iterations, 'the run stops at the round budget, not at a batch edge').toBe(10);
    const distances = await readVector(fixture.distances);
    expect(distances[10], 'ten rounds reach vertex 10').toBe(10);
    expect(distances[11], 'vertex 11 stays unreachable after ten rounds').toBe(Infinity);
  } finally {
    search.destroy();
    fixture.destroy();
  }
});

it('GPUGraphAlgorithmsSingleSourceShortestPath run() stops as soon as no distance changes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const side = 20;
  const graph = makeGrid(side, 7);
  const fixture = createRunFixture(device, graph);
  const search = new GPUGraphAlgorithmsSingleSourceShortestPath({
    topology: fixture.topology,
    sourceVertex: 0,
    distances: fixture.distances,
    predecessors: fixture.predecessors
  });
  const submit = vi.spyOn(device, 'submit');
  try {
    const result = await search.run({iterationsPerSubmit: 8});
    const expectedRounds = countBellmanFordRounds(graph, [0]);
    expect(expectedRounds, 'the fixture needs more than one batch').toBeGreaterThan(8);
    expect(expectedRounds, 'the fixture converges far below the V - 1 budget').toBeLessThan(
      search.maxIterations / 4
    );
    expect(result.converged).toBe(true);
    expect(result.iterations, 'the GPU stops in the first round without a change').toBe(
      expectedRounds
    );
    expect(result.submissions, 'one submission per started batch').toBe(
      Math.ceil(expectedRounds / 8)
    );
    expect(
      submit.mock.calls.length,
      'the run submits a bounded number of command buffers, not one per round'
    ).toBeLessThanOrEqual(3 * result.submissions);
    await expectDijkstraParity(fixture, [0]);
  } finally {
    submit.mockRestore();
    search.destroy();
    fixture.destroy();
  }
});

it('GPUGraphAlgorithmsSingleSourceShortestPath gates every relaxation round on the GPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const graph = makeGrid(6, 3);
  const fixture = createRunFixture(device, graph);
  const search = new GPUGraphAlgorithmsSingleSourceShortestPath({
    id: 'gated',
    topology: fixture.topology,
    sourceVertex: 0,
    distances: fixture.distances,
    predecessors: fixture.predecessors,
    converged: fixture.converged
  });
  const commandGraph = new GPUCommandGraph(device);
  search.addToGraph(commandGraph);
  const compiled = commandGraph.compile();
  try {
    const roundNodes = compiled.preflight.nodes.filter(node =>
      /^gated-iteration-\d+-(snapshot|relax|reset|predecessors)/.test(node.id)
    );
    expect(roundNodes.length, 'one gated node per round pass').toBe(4 * search.maxIterations);
    expect(
      roundNodes.every(
        node => node.condition?.source === 'gpu' && node.condition.mode === 'indirect'
      ),
      'converged rounds dispatch zero workgroups through a GPU-written indirect command'
    ).toBe(true);

    const encoder = device.createCommandEncoder({id: 'gated-sssp'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect((await readVector(fixture.converged))[0]).toBe(1);
    await expectDijkstraParity(fixture, [0]);
  } finally {
    compiled.destroy();
    search.destroy();
    fixture.destroy();
  }
});

it('GPUGraphAlgorithmsSingleSourceShortestPath reuses compiled work for a new seed', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const graph = makeRandomGraph({vertexCount: 300, edgeCount: 900, seed: 21, parallel: true});
  const fixture = createRunFixture(device, graph);
  const seeds = createSeedVector(device, fixture, [5]);
  const search = new GPUGraphAlgorithmsSingleSourceShortestPath({
    topology: fixture.topology,
    seeds,
    distances: fixture.distances,
    predecessors: fixture.predecessors
  });
  try {
    expect((await search.run()).converged).toBe(true);
    await expectDijkstraParity(fixture, [5]);

    const createShader = vi.spyOn(device, 'createShader');
    const createComputePipeline = vi.spyOn(device, 'createComputePipeline');
    const compile = vi.spyOn(GPUCommandGraph.prototype, 'compile');
    try {
      seeds.data[0].buffer.write(Uint32Array.of(211));
      expect((await search.run()).converged).toBe(true);
      expect(createShader.mock.calls.length, 'a new seed compiles no shader').toBe(0);
      expect(createComputePipeline.mock.calls.length, 'a new seed creates no pipeline').toBe(0);
      expect(compile.mock.calls.length, 'a new seed compiles no command graph').toBe(0);
    } finally {
      createShader.mockRestore();
      createComputePipeline.mockRestore();
      compile.mockRestore();
    }
    await expectDijkstraParity(fixture, [211]);
  } finally {
    search.destroy();
    fixture.destroy();
  }
});

it('GPUGraphAlgorithmsSingleSourceShortestPath shares shader modules between source vertices', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const graph = makeRandomGraph({vertexCount: 200, edgeCount: 500, seed: 4, parallel: false});
  const fixture = createRunFixture(device, graph);
  const runSource = async (sourceVertex: number) => {
    const search = new GPUGraphAlgorithmsSingleSourceShortestPath({
      id: 'per-source',
      topology: fixture.topology,
      sourceVertex,
      distances: fixture.distances,
      predecessors: fixture.predecessors,
      maxIterations: 16
    });
    const commandGraph = new GPUCommandGraph(device);
    search.addToGraph(commandGraph);
    const compiled = commandGraph.compile();
    const encoder = device.createCommandEncoder({id: 'per-source-sssp'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    await readVector(fixture.distances);
    compiled.destroy();
  };
  try {
    await runSource(3);
    const createShader = vi.spyOn(device, 'createShader');
    const createComputePipeline = vi.spyOn(device, 'createComputePipeline');
    try {
      await runSource(150);
      expect(createShader.mock.calls.length, 'the source vertex is not a shader constant').toBe(0);
      expect(createComputePipeline.mock.calls.length, 'every pipeline comes from the cache').toBe(
        0
      );
    } finally {
      createShader.mockRestore();
      createComputePipeline.mockRestore();
    }
  } finally {
    fixture.destroy();
  }
});

const parityGraphs: {
  name: string;
  graph: EdgeList;
  seeds: number[];
  seedPrefix?: number[];
  direction?: GPUGraphAlgorithmsSingleSourceShortestPathDirection;
}[] = [
  {
    name: 'parallel edges and disconnected parts',
    graph: makeRandomGraph({vertexCount: 500, edgeCount: 1400, seed: 3, parallel: true, parts: 3}),
    seeds: [7]
  },
  {
    name: 'a weighted grid with decimal weights',
    graph: makeGrid(30, 11),
    seeds: [449]
  },
  {
    name: 'a directed graph followed in both directions',
    graph: {
      ...makeRandomGraph({vertexCount: 400, edgeCount: 1000, seed: 9, parallel: true}),
      directed: true
    },
    seeds: [0],
    direction: 'both'
  },
  {
    name: 'several seeds at distance zero',
    graph: makeRandomGraph({vertexCount: 600, edgeCount: 1500, seed: 17, parallel: true, parts: 2}),
    seeds: [2, 300, 2, 599]
  },
  {
    name: 'an out-of-range seed is ignored',
    graph: makeRandomGraph({vertexCount: 100, edgeCount: 300, seed: 5, parallel: false}),
    seeds: [1000, 42]
  },
  {
    name: 'seeds that start at a byte offset',
    graph: makeRandomGraph({vertexCount: 300, edgeCount: 800, seed: 8, parallel: true, parts: 2}),
    seeds: [20, 170],
    seedPrefix: [5, 250]
  }
];

for (const {name, graph, seeds, seedPrefix, direction} of parityGraphs) {
  it(`GPUGraphAlgorithmsSingleSourceShortestPath run() equals float32 Dijkstra: ${name}`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;

    const fixture = createRunFixture(device, graph, {reverse: graph.directed === true});
    const search = new GPUGraphAlgorithmsSingleSourceShortestPath({
      topology: fixture.topology,
      seeds: createSeedVector(device, fixture, seeds, seedPrefix),
      distances: fixture.distances,
      predecessors: fixture.predecessors,
      converged: fixture.converged,
      direction
    });
    try {
      const result = await search.run({iterationsPerSubmit: 16});
      expect(result.converged).toBe(true);
      expect((await readVector(fixture.converged))[0]).toBe(1);
      await expectDijkstraParity(fixture, seeds, direction);
    } finally {
      search.destroy();
      fixture.destroy();
    }
  });
}

/** Asserts bit-equal float32 distances and valid predecessor edges against a CPU Dijkstra. */
async function expectDijkstraParity(
  fixture: RunFixture,
  seeds: number[],
  direction: GPUGraphAlgorithmsSingleSourceShortestPathDirection = 'outgoing'
): Promise<void> {
  const {graph} = fixture;
  const neighbors = getNeighbors(graph, direction);
  const expected = dijkstra(graph.vertexCount, neighbors, seeds);
  const distances = Array.from(await readVector(fixture.distances));
  const predecessors = Array.from(await readVector(fixture.predecessors));
  const reachable = expected.filter(Number.isFinite).length;
  expect(reachable, 'the oracle reaches more than the seeds').toBeGreaterThan(new Set(seeds).size);
  expect(distances, 'float32 distances are bit-equal to float32 Dijkstra').toEqual(expected);

  const seedSet = new Set(seeds.filter(seed => seed < graph.vertexCount));
  const incoming = getIncomingCandidates(graph, direction);
  let errors = 0;
  for (let vertex = 0; vertex < graph.vertexCount; vertex++) {
    const parent = predecessors[vertex];
    if (seedSet.has(vertex) || !Number.isFinite(expected[vertex])) {
      if (parent !== UNREACHABLE_PREDECESSOR) errors++;
      continue;
    }
    const valid = incoming[vertex].some(
      edge =>
        edge.vertex === parent && Math.fround(expected[parent] + edge.weight) === expected[vertex]
    );
    if (!valid) errors++;
  }
  expect(errors, 'every predecessor is a real edge on a shortest route').toBe(0);
}

type Neighbor = {vertex: number; weight: number};

function getNeighbors(
  graph: EdgeList,
  direction: GPUGraphAlgorithmsSingleSourceShortestPathDirection
): Neighbor[][] {
  const neighbors = Array.from({length: graph.vertexCount}, () => [] as Neighbor[]);
  for (let edge = 0; edge < graph.sources.length; edge++) {
    const source = graph.sources[edge];
    const target = graph.targets[edge];
    const weight = Math.fround(graph.weights?.[edge] ?? 1);
    const forward = !graph.directed || direction !== 'incoming';
    const backward = !graph.directed || direction !== 'outgoing';
    if (forward) neighbors[source].push({vertex: target, weight});
    if (backward && (graph.directed || source !== target)) {
      neighbors[target].push({vertex: source, weight});
    }
  }
  return neighbors;
}

/** Returns, for each vertex, the edges that may deliver its distance (reverse of `getNeighbors`). */
function getIncomingCandidates(
  graph: EdgeList,
  direction: GPUGraphAlgorithmsSingleSourceShortestPathDirection
): Neighbor[][] {
  const outgoing = getNeighbors(graph, direction);
  const incoming = Array.from({length: graph.vertexCount}, () => [] as Neighbor[]);
  for (let vertex = 0; vertex < graph.vertexCount; vertex++) {
    for (const edge of outgoing[vertex]) incoming[edge.vertex].push({vertex, weight: edge.weight});
  }
  return incoming;
}

/** Multi-source Dijkstra with float32 sums, matching the GPU rounding. */
function dijkstra(vertexCount: number, neighbors: Neighbor[][], seeds: number[]): number[] {
  const distances = new Array<number>(vertexCount).fill(Infinity);
  const heap: [number, number][] = [];
  const push = (distance: number, vertex: number) => {
    heap.push([distance, vertex]);
    let index = heap.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (heap[parent][0] <= heap[index][0]) break;
      [heap[parent], heap[index]] = [heap[index], heap[parent]];
      index = parent;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let index = 0;
      for (;;) {
        const left = 2 * index + 1;
        const right = left + 1;
        let smallest = index;
        if (left < heap.length && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < heap.length && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === index) break;
        [heap[smallest], heap[index]] = [heap[index], heap[smallest]];
        index = smallest;
      }
    }
    return top;
  };
  for (const seed of seeds) {
    if (seed < vertexCount && distances[seed] !== 0) {
      distances[seed] = 0;
      push(0, seed);
    }
  }
  while (heap.length > 0) {
    const [distance, vertex] = pop();
    if (distance !== distances[vertex]) continue;
    for (const edge of neighbors[vertex]) {
      const candidate = Math.fround(distance + edge.weight);
      if (candidate < distances[edge.vertex]) {
        distances[edge.vertex] = candidate;
        push(candidate, edge.vertex);
      }
    }
  }
  return distances;
}

/** Counts synchronized Bellman-Ford rounds, including the final round that changes nothing. */
function countBellmanFordRounds(graph: EdgeList, seeds: number[]): number {
  const neighbors = getNeighbors(graph, 'outgoing');
  let distances = new Array<number>(graph.vertexCount).fill(Infinity);
  for (const seed of seeds) distances[seed] = 0;
  for (let round = 1; round <= graph.vertexCount - 1; round++) {
    const next = [...distances];
    let changed = false;
    for (let vertex = 0; vertex < graph.vertexCount; vertex++) {
      if (!Number.isFinite(distances[vertex])) continue;
      for (const edge of neighbors[vertex]) {
        const candidate = Math.fround(distances[vertex] + edge.weight);
        if (candidate < next[edge.vertex]) {
          next[edge.vertex] = candidate;
          changed = true;
        }
      }
    }
    distances = next;
    if (!changed) return round;
  }
  return graph.vertexCount - 1;
}

function makePath(vertexCount: number): EdgeList {
  const sources = Array.from({length: vertexCount - 1}, (_, index) => index);
  return {
    vertexCount,
    sources,
    targets: sources.map(index => index + 1),
    weights: sources.map(() => 1)
  };
}

/** A square grid with seeded decimal weights, so that weighted and hop order differ. */
function makeGrid(side: number, seed: number): EdgeList {
  const random = makeRandom(seed);
  const sources: number[] = [];
  const targets: number[] = [];
  const weights: number[] = [];
  for (let row = 0; row < side; row++) {
    for (let column = 0; column < side; column++) {
      const vertex = row * side + column;
      if (column + 1 < side) {
        sources.push(vertex);
        targets.push(vertex + 1);
        weights.push(0.5 + random() * 10);
      }
      if (row + 1 < side) {
        sources.push(vertex);
        targets.push(vertex + side);
        weights.push(0.5 + random() * 10);
      }
    }
  }
  return {vertexCount: side * side, sources, targets, weights};
}

/** A seeded sparse graph; `parts` splits the vertices into disconnected blocks. */
function makeRandomGraph(props: {
  vertexCount: number;
  edgeCount: number;
  seed: number;
  parallel: boolean;
  parts?: number;
}): EdgeList {
  const random = makeRandom(props.seed);
  const parts = props.parts ?? 1;
  const partSize = Math.floor(props.vertexCount / parts);
  const sources: number[] = [];
  const targets: number[] = [];
  const weights: number[] = [];
  for (let edge = 0; edge < props.edgeCount; edge++) {
    const part = edge % parts;
    const base = part * partSize;
    const source = base + Math.floor(random() * partSize);
    const target = base + Math.floor(random() * partSize);
    const weight = Math.round(random() * 1000) / 7;
    sources.push(source);
    targets.push(target);
    weights.push(weight);
    if (props.parallel && edge % 5 === 0) {
      sources.push(source);
      targets.push(target);
      weights.push(weight * random());
    }
  }
  return {vertexCount: props.vertexCount, sources, targets, weights};
}

function makeRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function createRunFixture(
  device: Device,
  graph: EdgeList,
  options: {reverse?: boolean} = {}
): RunFixture {
  const buffers: Buffer[] = [];
  const vectors: GPUVector[] = [];
  const input = <Format extends 'uint32' | 'float32'>(
    name: string,
    format: Format,
    values: number[]
  ): GPUVector<Format> => {
    const typed = format === 'float32' ? Float32Array.from(values) : Uint32Array.from(values);
    const buffer = device.createBuffer({
      id: name,
      byteLength: Math.max(typed.byteLength, 4),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    if (typed.length > 0) buffer.write(typed);
    buffers.push(buffer);
    const data = new GPUData<Format>({buffer, format, length: typed.length, ownsBuffer: false});
    const vector = new GPUVector<Format>({
      type: 'data',
      name,
      format,
      data: [data],
      ownsData: false
    });
    vectors.push(vector);
    return vector;
  };
  const output = <Format extends 'uint32' | 'float32'>(
    name: string,
    format: Format,
    length: number
  ): GPUVector<Format> => {
    const buffer = device.createBuffer({
      id: name,
      byteLength: Math.max(length, 1) * 4,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    buffers.push(buffer);
    const vector = new GPUVector<Format>({
      type: 'buffer',
      name,
      format,
      buffer,
      length,
      ownsBuffer: false
    });
    vectors.push(vector);
    return vector;
  };
  const adjacency = (name: string, capacity: number): GPUGraphAlgorithmsAdjacency => ({
    offsets: output(`${name}-offsets`, 'uint32', graph.vertexCount + 1),
    neighbors: output(`${name}-neighbors`, 'uint32', capacity),
    edgeIds: output(`${name}-edge-ids`, 'uint32', capacity),
    ...(graph.weights ? {edgeWeights: output(`${name}-edge-weights`, 'float32', capacity)} : {}),
    count: output(`${name}-count`, 'uint32', 1),
    overflow: output(`${name}-overflow`, 'uint32', 1)
  });
  const data = new GPUGraphAlgorithmsData({
    vertexCount: graph.vertexCount,
    sourceVertices: input('sources', 'uint32', graph.sources),
    targetVertices: input('targets', 'uint32', graph.targets),
    edgeWeights: graph.weights ? input('weights', 'float32', graph.weights) : undefined,
    directed: graph.directed === true
  });
  const capacity = graph.sources.length * 2;
  const topology = new GPUGraphAlgorithmsTopology({
    graph: data,
    forward: adjacency('forward', capacity),
    reverse: options.reverse ? adjacency('reverse', capacity) : undefined,
    invalidEdgeCount: output('invalid-edges', 'uint32', 1)
  });
  const topologyGraph = new GPUCommandGraph(device);
  topology.addToGraph(topologyGraph);
  const compiledTopology = topologyGraph.compile();
  const encoder = device.createCommandEncoder({id: 'sssp-run-topology'});
  compiledTopology.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  return {
    device,
    graph,
    buffers,
    topology,
    distances: output('distances', 'float32', graph.vertexCount),
    predecessors: output('predecessors', 'uint32', graph.vertexCount),
    converged: output('converged', 'uint32', 1),
    destroy: () => {
      compiledTopology.destroy();
      for (const vector of vectors) vector.destroy();
      for (const buffer of buffers) buffer.destroy();
    }
  };
}

/** Seeds after an optional prefix of other identifiers, so the view starts at a byte offset. */
function createSeedVector(
  device: Device,
  fixture: RunFixture,
  seeds: number[],
  prefix: number[] = []
): GPUVector<'uint32'> {
  const values = [...prefix, ...seeds];
  const buffer = device.createBuffer({
    id: 'seeds',
    byteLength: Math.max(values.length, 1) * 4,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  buffer.write(Uint32Array.from(values));
  fixture.buffers.push(buffer);
  const data = new GPUData<'uint32'>({
    buffer,
    format: 'uint32',
    length: seeds.length,
    byteOffset: prefix.length * 4,
    ownsBuffer: false
  });
  return new GPUVector<'uint32'>({
    type: 'data',
    name: 'seeds',
    format: 'uint32',
    data: [data],
    ownsData: false
  });
}

async function readVector(
  vector: GPUVector<'uint32'> | GPUVector<'float32'>
): Promise<Float32Array | Uint32Array> {
  const data = vector.data[0];
  const bytes = await (data.buffer as Buffer).readAsync(data.byteOffset, vector.length * 4);
  return vector.format === 'float32'
    ? new Float32Array(bytes.buffer, bytes.byteOffset, vector.length)
    : new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length);
}
