// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphSingleSourceShortestPath,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphSingleSourceShortestPathDirection
} from '@luma.gl/experimental/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addGPUGraphSingleSourceShortestPathToGraphWithDispatchLimit,
  getGPUGraphSingleSourceShortestPathDispatchLayout
} from '../../src/gpu-graph/gpu-graph-single-source-shortest-path-internals';

const UNREACHABLE_PREDECESSOR = 0xffffffff;

type ScalarFormat = 'uint32' | 'float32';

type ShortestPathScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  weightChunks?: number[][];
  sourceVertex?: number;
  directed?: boolean;
  reverse?: boolean;
  direction?: GPUGraphSingleSourceShortestPathDirection;
  maxIterations?: number;
  capacity?: number;
  reverseCapacity?: number;
  byteOffset?: number;
  maximumWorkgroups?: number;
};

type WeightedNeighbor = {vertex: number; weight: number};

type ExpectedShortestPath = {
  distances: number[];
  predecessors: number[];
  converged: boolean;
  invalidWeightCount: number;
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
};

type ShortestPathExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: GPUGraph;
  topology: GPUGraphTopology;
  search: GPUGraphSingleSourceShortestPath;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const shortestPathScenarios: ShortestPathScenario[] = [
  {
    name: 'empty graphs preserve empty results and report a trivially converged search',
    vertexCount: 0,
    sourceChunks: [[], []],
    targetChunks: [[], []]
  },
  {
    name: 'isolated vertices remain positive infinity with sentinel predecessors',
    vertexCount: 4,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    sourceVertex: 2
  },
  {
    name: 'weighted cheaper two-hop routes replace expensive direct edges',
    vertexCount: 5,
    sourceChunks: [[0, 0], [], [2, 1]],
    targetChunks: [[1, 2], [], [1, 3]],
    weightChunks: [[9, 1], [], [2, 4]]
  },
  {
    name: 'float32 decimal accumulation follows GPU precision rather than JavaScript doubles',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[0.1, 0.2, 0.3]]
  },
  {
    name: 'parallel duplicate edges retain the cheapest source-aligned CSR weight',
    vertexCount: 3,
    sourceChunks: [[0, 0, 1]],
    targetChunks: [[1, 1, 2]],
    weightChunks: [[8, 1.5, 2]]
  },
  {
    name: 'same-hop equal-cost diamonds choose the numerically lowest stable parent',
    vertexCount: 5,
    sourceChunks: [[0, 3], [], [0, 1]],
    targetChunks: [[3, 4], [], [1, 4]],
    weightChunks: [[2, 2], [], [2, 2]]
  },
  {
    name: 'zero-weight cycles preserve source sentinel and acyclic first-discovery parents',
    vertexCount: 4,
    sourceChunks: [[0, 3, 1, 2]],
    targetChunks: [[3, 1, 2, 1]],
    weightChunks: [[0, 0, 0, 0]]
  },
  {
    name: 'negative zero is a valid zero-weight edge',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    weightChunks: [[-0]]
  },
  {
    name: 'graphs without explicit weight columns use unit-cost edges',
    vertexCount: 5,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]]
  },
  {
    name: 'zero compiled iterations publish the source only without claiming convergence',
    vertexCount: 3,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    weightChunks: [[1, 1]],
    maxIterations: 0
  },
  {
    name: 'bounded weighted routes expose partial distances and a non-converged GPU status',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[1, 1, 1]],
    maxIterations: 1
  },
  {
    name: 'incoming directed routes use transposed CSR and its aligned edge weights',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[1, 2, 4]],
    sourceVertex: 3,
    reverse: true,
    direction: 'incoming'
  },
  {
    name: 'bidirectional directed routes combine outgoing and incoming weighted neighbors',
    vertexCount: 5,
    sourceChunks: [[0, 2, 2, 4]],
    targetChunks: [[1, 1, 3, 3]],
    weightChunks: [[1, 2, 4, 8]],
    sourceVertex: 1,
    reverse: true,
    direction: 'both'
  },
  {
    name: 'undirected graphs reuse mirrored forward adjacency for incoming traversal',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[1, 2, 4]],
    sourceVertex: 3,
    directed: false,
    direction: 'incoming'
  },
  {
    name: 'invalid endpoints and their invalid weights are excluded before path validation',
    vertexCount: 3,
    sourceChunks: [[0, 9], [], [1]],
    targetChunks: [[1, 2], [], [2]],
    weightChunks: [[2, -5], [], [3]]
  },
  {
    name: 'negative valid-endpoint weights fail closed and count each source edge once',
    vertexCount: 3,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    weightChunks: [[1, -2]],
    reverse: true,
    direction: 'both'
  },
  {
    name: 'NaN and positive and negative infinity fail closed with exact invalid counts',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2, 0]],
    targetChunks: [[1, 2], [], [3, 3]],
    weightChunks: [[Number.NaN, Number.POSITIVE_INFINITY], [], [Number.NEGATIVE_INFINITY, 1]]
  },
  {
    name: 'outgoing CSR overflow leaves all distances unreachable and status unconverged',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[1, 2, 3]],
    capacity: 1
  },
  {
    name: 'incoming traversal fails closed on required reverse adjacency overflow',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[1, 2, 3]],
    sourceVertex: 3,
    reverse: true,
    reverseCapacity: 0,
    direction: 'incoming'
  },
  {
    name: 'outgoing traversal ignores overflow in unused reverse adjacency',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[1, 2, 3]],
    reverse: true,
    reverseCapacity: 0
  },
  {
    name: 'bidirectional traversal fails closed when either selected direction overflows',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[1, 2, 3]],
    reverse: true,
    reverseCapacity: 1,
    direction: 'both'
  },
  {
    name: 'non-256-aligned CSR, output, and status views preserve their logical offsets',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    weightChunks: [[1, 2, 3]],
    byteOffset: 4
  },
  {
    name: 'bounded three-dimensional dispatch reaches the final weighted source vertex',
    vertexCount: 1025,
    sourceChunks: [[1024]],
    targetChunks: [[512]],
    weightChunks: [[2.5]],
    sourceVertex: 1024,
    maxIterations: 1,
    maximumWorkgroups: 2
  }
];

test('GPUGraphSingleSourceShortestPath plans bounded three-dimensional GPU work', tapeTest => {
  tapeTest.deepEqual(getGPUGraphSingleSourceShortestPathDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphSingleSourceShortestPathDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getGPUGraphSingleSourceShortestPathDispatchLayout(1025, 2), {
    x: 2,
    y: 2,
    z: 2
  });
  tapeTest.throws(() => getGPUGraphSingleSourceShortestPathDispatchLayout(2049, 2), /3D dispatch/);
  tapeTest.end();
});

for (const scenario of shortestPathScenarios) {
  test(`GPUGraphSingleSourceShortestPath GPU traversal: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedShortestPath(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileShortestPath(fixture, scenario.maximumWorkgroups);
      executeShortestPath(fixture);
      await assertShortestPath(tapeTest, fixture, expected);
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }
    tapeTest.end();
  });
}

test('GPUGraphSingleSourceShortestPath schedules work without submission or source readback', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const scenario: ShortestPathScenario = {
    name: 'command ownership',
    vertexCount: 3,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    weightChunks: [[2, 3]]
  };
  const expected = calculateExpectedShortestPath(scenario);
  const fixture = createExecutionFixture(device, scenario, expected);
  const submit = vi.spyOn(device, 'submit');
  const sourceBuffers = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data,
    ...fixture.graph.edgeWeights!.data
  ];
  const readbacks = sourceBuffers.map(chunk => vi.spyOn(chunk.buffer as Buffer, 'readAsync'));
  try {
    compileShortestPath(fixture);
    tapeTest.equal(
      submit.mock.calls.length,
      0,
      'constructing and compiling never submits GPU work'
    );
    executeShortestPath(fixture);
    await assertShortestPath(tapeTest, fixture, expected);
    tapeTest.ok(
      readbacks.every(readback => readback.mock.calls.length === 0),
      'weighted graph source buffers are never read back by the GPU operation'
    );
  } finally {
    submit.mockRestore();
    for (const readback of readbacks) readback.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }
  tapeTest.end();
});

/** Computes the same synchronized float32 Bellman-Ford rounds as the GPU implementation. */
function calculateExpectedShortestPath(scenario: ShortestPathScenario): ExpectedShortestPath {
  const outgoing = Array.from({length: scenario.vertexCount}, () => [] as WeightedNeighbor[]);
  const incoming = Array.from({length: scenario.vertexCount}, () => [] as WeightedNeighbor[]);
  let invalidEdgeCount = 0;
  let invalidWeightCount = 0;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [edgeIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][edgeIndex];
      if (source >= scenario.vertexCount || target >= scenario.vertexCount) {
        invalidEdgeCount++;
        continue;
      }
      const weight = Math.fround(scenario.weightChunks?.[chunkIndex][edgeIndex] ?? 1);
      if (!Number.isFinite(weight) || weight < 0) invalidWeightCount++;
      outgoing[source].push({vertex: target, weight});
      if (scenario.directed === false) {
        if (source !== target) outgoing[target].push({vertex: source, weight});
      } else {
        incoming[target].push({vertex: source, weight});
      }
    }
  }

  const forwardCount = outgoing.reduce((count, neighbors) => count + neighbors.length, 0);
  const reverseCount = incoming.reduce((count, neighbors) => count + neighbors.length, 0);
  const forwardOverflow = forwardCount > (scenario.capacity ?? forwardCount);
  const reverseOverflow = Boolean(
    scenario.reverse && reverseCount > (scenario.reverseCapacity ?? reverseCount)
  );
  const direction = scenario.direction ?? 'outgoing';
  const requiredOverflow =
    scenario.directed === false || direction === 'outgoing'
      ? forwardOverflow
      : direction === 'incoming'
        ? reverseOverflow
        : forwardOverflow || reverseOverflow;
  const distances = new Array<number>(scenario.vertexCount).fill(Number.POSITIVE_INFINITY);
  const predecessors = new Array<number>(scenario.vertexCount).fill(UNREACHABLE_PREDECESSOR);
  let converged = false;

  if (!requiredOverflow && invalidWeightCount === 0) {
    const sourceVertex = scenario.sourceVertex ?? 0;
    if (scenario.vertexCount > 0) distances[sourceVertex] = 0;
    const edgeCount = scenario.sourceChunks.reduce((count, chunk) => count + chunk.length, 0);
    converged = scenario.vertexCount <= 1 || edgeCount === 0;
    const maximumIterations =
      scenario.maxIterations ?? Math.min(Math.max(scenario.vertexCount - 1, 0), 1024);

    for (let iteration = 0; iteration < maximumIterations && !converged; iteration++) {
      const previous = [...distances];
      for (let vertex = 0; vertex < scenario.vertexCount; vertex++) {
        if (!Number.isFinite(previous[vertex])) continue;
        for (const neighbor of getSelectedNeighbors(scenario, outgoing, incoming, vertex)) {
          const candidate = Math.fround(previous[vertex] + neighbor.weight);
          if (Number.isFinite(candidate) && candidate < distances[neighbor.vertex]) {
            distances[neighbor.vertex] = candidate;
          }
        }
      }

      let changed = false;
      for (let vertex = 0; vertex < scenario.vertexCount; vertex++) {
        if (distances[vertex] < previous[vertex]) {
          changed = true;
          if (vertex !== sourceVertex) predecessors[vertex] = UNREACHABLE_PREDECESSOR;
        }
      }
      for (let vertex = 0; vertex < scenario.vertexCount; vertex++) {
        if (!Number.isFinite(previous[vertex])) continue;
        for (const neighbor of getSelectedNeighbors(scenario, outgoing, incoming, vertex)) {
          const candidate = Math.fround(previous[vertex] + neighbor.weight);
          if (
            neighbor.vertex !== sourceVertex &&
            distances[neighbor.vertex] < previous[neighbor.vertex] &&
            candidate === distances[neighbor.vertex]
          ) {
            predecessors[neighbor.vertex] = Math.min(predecessors[neighbor.vertex], vertex);
          }
        }
      }
      converged = !changed || iteration + 1 >= scenario.vertexCount - 1;
    }
  }

  return {
    distances,
    predecessors,
    converged,
    invalidWeightCount,
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow
  };
}

function getSelectedNeighbors(
  scenario: ShortestPathScenario,
  outgoing: WeightedNeighbor[][],
  incoming: WeightedNeighbor[][],
  vertex: number
): WeightedNeighbor[] {
  if (scenario.directed === false || !scenario.direction || scenario.direction === 'outgoing') {
    return outgoing[vertex];
  }
  return scenario.direction === 'incoming'
    ? incoming[vertex]
    : [...outgoing[vertex], ...incoming[vertex]];
}

function createExecutionFixture(
  device: Device,
  scenario: ShortestPathScenario,
  expected: ExpectedShortestPath
): ShortestPathExecutionFixture {
  const buffers: Buffer[] = [];
  const vectors: GPUVector[] = [];
  const sourceVertices = createInputVector(
    device,
    buffers,
    vectors,
    'source-vertices',
    'uint32',
    scenario.sourceChunks
  );
  const targetVertices = createInputVector(
    device,
    buffers,
    vectors,
    'target-vertices',
    'uint32',
    scenario.targetChunks
  );
  const edgeWeights = scenario.weightChunks
    ? createInputVector(device, buffers, vectors, 'edge-weights', 'float32', scenario.weightChunks)
    : undefined;
  const graph = new GPUGraph({
    vertexCount: scenario.vertexCount,
    sourceVertices,
    targetVertices,
    edgeWeights,
    directed: scenario.directed
  });
  const forward = createOutputAdjacency(
    device,
    buffers,
    vectors,
    'forward',
    scenario.vertexCount,
    scenario.capacity ?? expected.forwardCount,
    Boolean(edgeWeights),
    scenario.byteOffset
  );
  const reverse = scenario.reverse
    ? createOutputAdjacency(
        device,
        buffers,
        vectors,
        'reverse',
        scenario.vertexCount,
        scenario.reverseCapacity ?? expected.reverseCount,
        Boolean(edgeWeights),
        scenario.byteOffset
      )
    : undefined;
  const invalidEdgeCount = createOutputVector(
    device,
    buffers,
    vectors,
    'invalid-edges',
    'uint32',
    1
  );
  const topology = new GPUGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const distances = createOutputVector(
    device,
    buffers,
    vectors,
    'distances',
    'float32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const predecessors = createOutputVector(
    device,
    buffers,
    vectors,
    'predecessors',
    'uint32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const converged = createOutputVector(
    device,
    buffers,
    vectors,
    'converged',
    'uint32',
    1,
    scenario.byteOffset
  );
  const invalidWeightCount = createOutputVector(
    device,
    buffers,
    vectors,
    'invalid-weights',
    'uint32',
    1,
    scenario.byteOffset
  );
  const search = new GPUGraphSingleSourceShortestPath({
    topology,
    sourceVertex: scenario.sourceVertex ?? 0,
    distances,
    predecessors,
    maxIterations: scenario.maxIterations,
    direction: scenario.direction,
    converged,
    invalidWeightCount
  });

  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    search,
    commandGraph: new GPUCommandGraph(device)
  };
}

function createInputVector<Format extends ScalarFormat>(
  device: Device,
  buffers: Buffer[],
  vectors: GPUVector[],
  name: string,
  format: Format,
  chunks: readonly number[][]
): GPUVector<Format> {
  const data = chunks.map((chunk, chunkIndex) => {
    const values = format === 'float32' ? Float32Array.from(chunk) : Uint32Array.from(chunk);
    const buffer = device.createBuffer({
      id: `${name}-${chunkIndex}`,
      byteLength: Math.max(values.length, 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    if (values.length > 0) buffer.write(values);
    buffers.push(buffer);
    return new GPUData<Format>({buffer, format, length: values.length, ownsBuffer: false});
  });
  const vector = new GPUVector<Format>({type: 'data', name, format, data, ownsData: false});
  vectors.push(vector);
  return vector;
}

function createOutputAdjacency(
  device: Device,
  buffers: Buffer[],
  vectors: GPUVector[],
  name: string,
  vertexCount: number,
  capacity: number,
  weighted: boolean,
  byteOffset = 0
): GPUGraphAdjacency {
  return {
    offsets: createOutputVector(
      device,
      buffers,
      vectors,
      `${name}-offsets`,
      'uint32',
      vertexCount + 1,
      byteOffset
    ),
    neighbors: createOutputVector(
      device,
      buffers,
      vectors,
      `${name}-neighbors`,
      'uint32',
      capacity
    ),
    edgeIds: createOutputVector(device, buffers, vectors, `${name}-edge-ids`, 'uint32', capacity),
    ...(weighted
      ? {
          edgeWeights: createOutputVector(
            device,
            buffers,
            vectors,
            `${name}-edge-weights`,
            'float32',
            capacity
          )
        }
      : {}),
    count: createOutputVector(device, buffers, vectors, `${name}-count`, 'uint32', 1),
    overflow: createOutputVector(device, buffers, vectors, `${name}-overflow`, 'uint32', 1)
  };
}

function createOutputVector<Format extends ScalarFormat>(
  device: Device,
  buffers: Buffer[],
  vectors: GPUVector[],
  name: string,
  format: Format,
  length: number,
  byteOffset = 0
): GPUVector<Format> {
  const buffer = device.createBuffer({
    id: name,
    byteLength: byteOffset + Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  buffers.push(buffer);
  const vector = new GPUVector<Format>({
    type: 'buffer',
    name,
    format,
    buffer,
    length,
    byteOffset,
    ownsBuffer: false
  });
  vectors.push(vector);
  return vector;
}

function compileShortestPath(
  fixture: ShortestPathExecutionFixture,
  maximumWorkgroups?: number
): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.search.addToGraph(fixture.commandGraph);
  } else {
    addGPUGraphSingleSourceShortestPathToGraphWithDispatchLimit(
      fixture.search,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeShortestPath(fixture: ShortestPathExecutionFixture): void {
  const encoder = fixture.device.createCommandEncoder({
    id: 'gpu-graph-weighted-shortest-path-test'
  });
  fixture.compiled!.encode(encoder, {parameters: undefined});
  fixture.device.submit(encoder.finish());
}

async function assertShortestPath(
  tapeTest: Test,
  fixture: ShortestPathExecutionFixture,
  expected: ExpectedShortestPath
): Promise<void> {
  const [
    distances,
    predecessors,
    converged,
    invalidWeightCount,
    invalidEdgeCount,
    forwardOverflow
  ] = await Promise.all([
    readScalarVector(fixture.search.distances),
    readScalarVector(fixture.search.predecessors),
    readScalarVector(fixture.search.converged!),
    readScalarVector(fixture.search.invalidWeightCount!),
    readScalarVector(fixture.topology.invalidEdgeCount),
    readScalarVector(fixture.topology.forward.overflow)
  ]);
  tapeTest.deepEqual(
    distances,
    expected.distances,
    'weighted float32 distances match the CPU oracle'
  );
  tapeTest.deepEqual(
    predecessors,
    expected.predecessors,
    'same-hop shortest routes choose the lowest stable predecessor'
  );
  tapeTest.equal(
    converged[0],
    Number(expected.converged),
    'GPU convergence status remains truthful'
  );
  tapeTest.equal(
    invalidWeightCount[0],
    expected.invalidWeightCount,
    'each invalid source-edge weight is counted once'
  );
  tapeTest.equal(
    invalidEdgeCount[0],
    expected.invalidEdgeCount,
    'invalid endpoints remain excluded'
  );
  tapeTest.equal(
    forwardOverflow[0],
    Number(expected.forwardOverflow),
    'forward overflow is explicit'
  );
  if (fixture.topology.reverse) {
    const reverseOverflow = await readScalarVector(fixture.topology.reverse.overflow);
    tapeTest.equal(
      reverseOverflow[0],
      Number(expected.reverseOverflow),
      'reverse overflow remains explicit'
    );
  }
}

async function readScalarVector(
  vector: GPUVector<'uint32'> | GPUVector<'float32'>
): Promise<number[]> {
  if (vector.length === 0) return [];
  const data = vector.data[0];
  const bytes = await (data.buffer as Buffer).readAsync(
    data.byteOffset,
    vector.length * Uint32Array.BYTES_PER_ELEMENT
  );
  return Array.from(
    vector.format === 'float32'
      ? new Float32Array(bytes.buffer, bytes.byteOffset, vector.length)
      : new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length)
  );
}

function destroyExecutionFixture(tapeTest: Test, fixture: ShortestPathExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'destroying the compiled operation preserves every caller-owned GPU buffer'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
