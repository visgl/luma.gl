// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUGraph,
  GPUGraphBreadthFirstSearch,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphBreadthFirstSearchDirection
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addGPUGraphBreadthFirstSearchToGraphWithDispatchLimit,
  getGPUGraphBreadthFirstSearchDispatchLayout
} from '../../src/gpu-graph/gpu-graph-breadth-first-search-internals';

const UNREACHABLE_VERTEX = 0xffffffff;

type ScalarFormat = 'uint32' | 'float32';

type SearchScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  seedChunks: number[][];
  weightChunks?: number[][];
  directed?: boolean;
  reverse?: boolean;
  direction?: GPUGraphBreadthFirstSearchDirection;
  maxDepth?: number;
  activeSeedCount?: number;
  activeDepth?: number;
  mask?: boolean;
  capacity?: number;
  reverseCapacity?: number;
  maximumWorkgroups?: number;
  byteOffset?: number;
  assertNoScratch?: boolean;
};

type ExpectedSearch = {
  distances: number[];
  predecessors: number[];
  mask: number[];
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
  requiredOverflow: boolean;
};

type SearchExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: GPUGraph;
  topology: GPUGraphTopology;
  search: GPUGraphBreadthFirstSearch;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const searchScenarios: SearchScenario[] = [
  {
    name: 'empty graphs preserve zero-length caller-owned shortest-path outputs',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    seedChunks: [],
    capacity: 0
  },
  {
    name: 'isolated vertices retain unreachable sentinels around a valid root',
    vertexCount: 6,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    seedChunks: [[2], []],
    capacity: 0,
    maxDepth: 3
  },
  {
    name: 'directed chains publish exact hop distances, predecessors, and source-aligned masks',
    vertexCount: 6,
    sourceChunks: [[0, 1], [], [2, 3]],
    targetChunks: [[1, 2], [], [3, 4]],
    seedChunks: [[0]],
    maxDepth: 4,
    assertNoScratch: true
  },
  {
    name: 'diamond ties select the lowest predecessor despite shuffled duplicate CSR edges',
    vertexCount: 5,
    sourceChunks: [[0, 0], [], [2, 1, 1]],
    targetChunks: [[2, 1], [], [3, 3, 3]],
    seedChunks: [[0]],
    maxDepth: 3
  },
  {
    name: 'multiple chunked seeds retain roots and deterministic shared-descendant ties',
    vertexCount: 6,
    sourceChunks: [[4, 1], [], [3, 0]],
    targetChunks: [[3, 3], [], [2, 2]],
    seedChunks: [[4, 1], [], [99, 4]],
    maxDepth: 3
  },
  {
    name: 'cycles, duplicate edges, self-loops, and disconnected vertices remain stable',
    vertexCount: 7,
    sourceChunks: [[0, 1, 1], [], [2, 2, 3]],
    targetChunks: [[1, 2, 2], [], [0, 2, 4]],
    seedChunks: [[0]],
    maxDepth: 6,
    mask: false
  },
  {
    name: 'incoming traversal follows reversed directed CSR and stable predecessor IDs',
    vertexCount: 6,
    sourceChunks: [[0, 1], [], [1, 4]],
    targetChunks: [[2, 2], [], [3, 3]],
    seedChunks: [[3]],
    reverse: true,
    direction: 'incoming',
    maxDepth: 3
  },
  {
    name: 'bidirectional traversal merges incoming and outgoing deterministic predecessor ties',
    vertexCount: 6,
    sourceChunks: [[0, 3], [], [2, 4]],
    targetChunks: [[2, 0], [], [4, 1]],
    seedChunks: [[0]],
    reverse: true,
    direction: 'both',
    maxDepth: 3,
    activeDepth: 3
  },
  {
    name: 'weighted undirected incoming traversal reuses symmetrized forward adjacency',
    vertexCount: 5,
    sourceChunks: [[0, 2], [], [2, 3]],
    targetChunks: [[1, 1], [], [3, 3]],
    weightChunks: [[0.5, 2], [], [4, 8]],
    seedChunks: [[3]],
    directed: false,
    direction: 'incoming',
    maxDepth: 4
  },
  {
    name: 'undirected bidirectional traversal evaluates forward adjacency only once',
    vertexCount: 5,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    seedChunks: [[2]],
    directed: false,
    direction: 'both',
    maxDepth: 2
  },
  {
    name: 'zero maximum depth publishes roots without following graph edges',
    vertexCount: 4,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    seedChunks: [[0, 3]],
    maxDepth: 0
  },
  {
    name: 'bounded traversal leaves vertices beyond the maximum hop unreachable',
    vertexCount: 5,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    seedChunks: [[0]],
    maxDepth: 1
  },
  {
    name: 'dynamic seed count selects only the leading global rows across seed chunks',
    vertexCount: 6,
    sourceChunks: [[0, 4, 5]],
    targetChunks: [[1, 3, 2]],
    seedChunks: [[0, 4], [], [5]],
    activeSeedCount: 1,
    maxDepth: 2,
    activeDepth: 1
  },
  {
    name: 'zero dynamic seed count resets every distance, predecessor, and mask',
    vertexCount: 4,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    seedChunks: [[0, 2]],
    activeSeedCount: 0,
    maxDepth: 3,
    activeDepth: 2
  },
  {
    name: 'dynamic hop counts larger than compiled maximum are safely clamped',
    vertexCount: 5,
    sourceChunks: [[0, 1, 2, 3]],
    targetChunks: [[1, 2, 3, 4]],
    seedChunks: [[0]],
    maxDepth: 2,
    activeDepth: 99
  },
  {
    name: 'invalid graph endpoints and invalid seed IDs are ignored without losing valid paths',
    vertexCount: 5,
    sourceChunks: [[0, 9], [], [2, 3, 4]],
    targetChunks: [[1, 2], [], [7, 4, 4]],
    seedChunks: [[99, 0], [], [UNREACHABLE_VERTEX, 3]],
    maxDepth: 2
  },
  {
    name: 'outgoing adjacency overflow fails closed, including otherwise valid roots',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    seedChunks: [[0]],
    capacity: 1,
    maxDepth: 3
  },
  {
    name: 'incoming adjacency overflow fails closed without publishing partial paths',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    seedChunks: [[3]],
    reverse: true,
    reverseCapacity: 0,
    direction: 'incoming',
    maxDepth: 3
  },
  {
    name: 'outgoing traversal ignores overflow from unused reverse adjacency',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    seedChunks: [[0]],
    reverse: true,
    reverseCapacity: 0,
    direction: 'outgoing',
    maxDepth: 3
  },
  {
    name: 'incoming traversal ignores overflow from unused forward adjacency',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    seedChunks: [[3]],
    reverse: true,
    capacity: 0,
    direction: 'incoming',
    maxDepth: 3
  },
  {
    name: 'bidirectional traversal fails closed when either required adjacency overflows',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    seedChunks: [[1]],
    reverse: true,
    reverseCapacity: 2,
    direction: 'both',
    maxDepth: 2,
    activeDepth: 2
  },
  {
    name: 'non-256-aligned seed, CSR, output, and dynamic control ranges remain correct',
    vertexCount: 5,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    seedChunks: [[0]],
    activeSeedCount: 1,
    activeDepth: 2,
    maxDepth: 3,
    byteOffset: 4
  },
  {
    name: 'bounded 3D dispatch reaches the final seed and final source vertex of 1025 rows',
    vertexCount: 1025,
    sourceChunks: [[1024]],
    targetChunks: [[512]],
    seedChunks: [Array.from({length: 1025}, (_, seedIndex) => (seedIndex === 1024 ? 1024 : 2000))],
    maxDepth: 1,
    maximumWorkgroups: 2
  }
];

test('GPUGraphBreadthFirstSearch plans bounded three-dimensional seed and vertex dispatch', tapeTest => {
  tapeTest.deepEqual(getGPUGraphBreadthFirstSearchDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphBreadthFirstSearchDispatchLayout(512, 2), {x: 2, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphBreadthFirstSearchDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getGPUGraphBreadthFirstSearchDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(() => getGPUGraphBreadthFirstSearchDispatchLayout(2049, 2), /3D dispatch limit/);
  tapeTest.end();
});

for (const scenario of searchScenarios) {
  test(`GPUGraphBreadthFirstSearch GPU traversal: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedSearch(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileSearch(fixture, scenario.maximumWorkgroups);
      executeSearch(fixture);
      await assertSearch(tapeTest, fixture, expected);
      tapeTest.deepEqual(
        fixture.search.seeds.data.map(chunk => chunk.length),
        scenario.seedChunks.map(chunk => chunk.length),
        'traversal preserves ordered seed chunks and empty seed batches'
      );
      if (scenario.assertNoScratch) {
        tapeTest.equal(
          fixture.compiled?.stats.logicalTransientBufferCount,
          3,
          'shortest-path traversal adds no frontier or scratch buffers beyond CSR construction'
        );
      }
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('GPUGraphBreadthFirstSearch rereads dynamic seeds, depth, and sources on every encoding', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const original: SearchScenario = {
    name: 'dynamic repeated search',
    vertexCount: 6,
    sourceChunks: [[0, 1], [], [2, 4]],
    targetChunks: [[1, 2], [], [3, 5]],
    seedChunks: [[0, 4], [], [5]],
    reverse: true,
    direction: 'both',
    maxDepth: 3,
    activeSeedCount: 1,
    activeDepth: 1
  };
  const fixture = createExecutionFixture(device, original, calculateExpectedSearch(original));
  const submitSpy = vi.spyOn(device, 'submit');
  const sourceReadbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data,
    ...fixture.search.seeds.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compileSearch(fixture);
    tapeTest.equal(submitSpy.mock.calls.length, 0, 'topology and search construction never submit');
    tapeTest.ok(
      sourceReadbackSpies.every(spy => spy.mock.calls.length === 0),
      'graph construction and compilation never read source or seed buffers'
    );
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();

    executeSearch(fixture);
    await assertSearch(tapeTest, fixture, calculateExpectedSearch(original));

    (fixture.search.seedCount!.data[0].buffer as Buffer).write(Uint32Array.from([2]));
    (fixture.search.activeDepth!.data[0].buffer as Buffer).write(Uint32Array.from([3]));
    const expanded = {...original, activeSeedCount: 2, activeDepth: 3};
    executeSearch(fixture);
    await assertSearch(tapeTest, fixture, calculateExpectedSearch(expanded));

    const sourceBuffer = fixture.graph.sourceVertices.data[0].buffer as Buffer;
    sourceBuffer.write(Uint32Array.from([9, 1]));
    const updated = {...expanded, sourceChunks: [[9, 1], [], [2, 4]]};
    executeSearch(fixture);
    await assertSearch(tapeTest, fixture, calculateExpectedSearch(updated));
    tapeTest.equal(
      fixture.graph.sourceVertices.data[0].buffer,
      sourceBuffer,
      'source updates retain the original caller-owned GPUData chunk'
    );
  } finally {
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Builds complete CPU adjacency before applying deterministic multi-source shortest-hop search. */
function calculateExpectedSearch(scenario: SearchScenario): ExpectedSearch {
  const outgoing = Array.from({length: scenario.vertexCount}, () => [] as number[]);
  const incoming = Array.from({length: scenario.vertexCount}, () => [] as number[]);
  let invalidEdgeCount = 0;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][rowIndex];
      if (source >= scenario.vertexCount || target >= scenario.vertexCount) {
        invalidEdgeCount++;
        continue;
      }
      outgoing[source].push(target);
      if (scenario.directed === false) {
        if (source !== target) outgoing[target].push(source);
      } else {
        incoming[target].push(source);
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
  const distances = new Array<number>(scenario.vertexCount).fill(UNREACHABLE_VERTEX);
  const predecessors = new Array<number>(scenario.vertexCount).fill(UNREACHABLE_VERTEX);

  if (!requiredOverflow) {
    const seeds = scenario.seedChunks.flat();
    const activeSeedCount = Math.min(scenario.activeSeedCount ?? seeds.length, seeds.length);
    for (let seedIndex = 0; seedIndex < activeSeedCount; seedIndex++) {
      const seed = seeds[seedIndex];
      if (seed < scenario.vertexCount) distances[seed] = 0;
    }

    const depth = Math.min(scenario.maxDepth ?? 1, scenario.activeDepth ?? Number.MAX_SAFE_INTEGER);
    for (let hop = 0; hop < depth; hop++) {
      for (let source = 0; source < scenario.vertexCount; source++) {
        if (distances[source] !== hop) continue;
        const neighbors =
          scenario.directed === false || direction === 'outgoing'
            ? outgoing[source]
            : direction === 'incoming'
              ? incoming[source]
              : [...outgoing[source], ...incoming[source]];
        for (const neighbor of neighbors) {
          const nextDistance = hop + 1;
          if (distances[neighbor] > nextDistance) {
            distances[neighbor] = nextDistance;
            predecessors[neighbor] = source;
          } else if (distances[neighbor] === nextDistance) {
            predecessors[neighbor] = Math.min(predecessors[neighbor], source);
          }
        }
      }
    }
  }

  return {
    distances,
    predecessors,
    mask: distances.map(distance => Number(distance !== UNREACHABLE_VERTEX)),
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow,
    requiredOverflow
  };
}

function createExecutionFixture(
  device: Device,
  scenario: SearchScenario,
  expected: ExpectedSearch
): SearchExecutionFixture {
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
    ? createInputVector(
        device,
        buffers,
        vectors,
        'source-weights',
        'float32',
        scenario.weightChunks
      )
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
  const seeds = createInputVector(
    device,
    buffers,
    vectors,
    'search-seeds',
    'uint32',
    scenario.seedChunks,
    scenario.byteOffset
  );
  const distances = createOutputVector(
    device,
    buffers,
    vectors,
    'search-distances',
    'uint32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const predecessors = createOutputVector(
    device,
    buffers,
    vectors,
    'search-predecessors',
    'uint32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const mask =
    scenario.mask === false
      ? undefined
      : createOutputVector(
          device,
          buffers,
          vectors,
          'search-mask',
          'uint32',
          scenario.vertexCount,
          scenario.byteOffset
        );
  const seedCount =
    scenario.activeSeedCount === undefined
      ? undefined
      : createInputVector(
          device,
          buffers,
          vectors,
          'active-seed-count',
          'uint32',
          [[scenario.activeSeedCount]],
          scenario.byteOffset
        );
  const activeDepth =
    scenario.activeDepth === undefined
      ? undefined
      : createInputVector(
          device,
          buffers,
          vectors,
          'active-search-depth',
          'uint32',
          [[scenario.activeDepth]],
          scenario.byteOffset
        );
  const search = new GPUGraphBreadthFirstSearch({
    topology,
    seeds,
    seedCount,
    distances,
    predecessors,
    mask,
    maxDepth: scenario.maxDepth,
    activeDepth,
    direction: scenario.direction
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
  chunks: readonly number[][],
  byteOffset = 0
): GPUVector<Format> {
  const data = chunks.map((chunk, chunkIndex) => {
    const values = format === 'float32' ? Float32Array.from(chunk) : Uint32Array.from(chunk);
    const buffer = device.createBuffer({
      id: `${name}-chunk-${chunkIndex}`,
      byteLength: byteOffset + Math.max(values.length, 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    if (values.length > 0) buffer.write(values, byteOffset);
    buffers.push(buffer);
    return new GPUData<Format>({
      buffer,
      format,
      length: values.length,
      byteOffset,
      ownsBuffer: false
    });
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
    edgeWeights: weighted
      ? createOutputVector(device, buffers, vectors, `${name}-weights`, 'float32', capacity)
      : undefined,
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

function compileSearch(fixture: SearchExecutionFixture, maximumWorkgroups?: number): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.search.addToGraph(fixture.commandGraph);
  } else {
    addGPUGraphBreadthFirstSearchToGraphWithDispatchLimit(
      fixture.search,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeSearch(fixture: SearchExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({id: 'gpu-graph-breadth-first-test'});
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertSearch(
  tapeTest: Test,
  fixture: SearchExecutionFixture,
  expected: ExpectedSearch
): Promise<void> {
  const [distances, predecessors, mask, invalidEdgeCount, forwardOverflow, reverseOverflow] =
    await Promise.all([
      readUint32Vector(fixture.search.distances),
      readUint32Vector(fixture.search.predecessors),
      fixture.search.mask ? readUint32Vector(fixture.search.mask) : Promise.resolve(undefined),
      readUint32Vector(fixture.topology.invalidEdgeCount),
      readUint32Vector(fixture.topology.forward.overflow),
      fixture.topology.reverse
        ? readUint32Vector(fixture.topology.reverse.overflow)
        : Promise.resolve(undefined)
    ]);

  tapeTest.deepEqual(distances, expected.distances, 'shortest-hop distances match the CPU oracle');
  tapeTest.deepEqual(
    predecessors,
    expected.predecessors,
    'equal-length paths choose the deterministic lowest stable predecessor ID'
  );
  if (mask) {
    tapeTest.deepEqual(mask, expected.mask, 'optional reachability masks stay source aligned');
  }
  tapeTest.equal(
    invalidEdgeCount[0],
    expected.invalidEdgeCount,
    'invalid graph edges remain excluded'
  );
  tapeTest.equal(
    forwardOverflow[0],
    Number(expected.forwardOverflow),
    'forward overflow remains explicit'
  );
  if (reverseOverflow) {
    tapeTest.equal(
      reverseOverflow[0],
      Number(expected.reverseOverflow),
      'reverse overflow remains explicit'
    );
  }
  if (expected.requiredOverflow) {
    tapeTest.ok(
      distances.every(distance => distance === UNREACHABLE_VERTEX) &&
        predecessors.every(predecessor => predecessor === UNREACHABLE_VERTEX),
      'required adjacency overflow fails closed without exposing misleading partial paths'
    );
  }
}

async function readUint32Vector(vector: GPUVector<'uint32'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const data = vector.data[0];
  const bytes = await (data.buffer as Buffer).readAsync(
    data.byteOffset,
    vector.length * Uint32Array.BYTES_PER_ELEMENT
  );
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

function destroyExecutionFixture(tapeTest: Test, fixture: SearchExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'destroying a compiled traversal and borrowed vectors preserves every caller-owned buffer'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
