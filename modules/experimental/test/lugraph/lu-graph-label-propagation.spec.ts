// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphLabelPropagation,
  LuGraphTopology,
  type LuGraphAdjacency
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addLuGraphLabelPropagationToGraphWithDispatchLimit,
  getLuGraphLabelPropagationDispatchLayout
} from '../../src/lugraph/lu-graph-label-propagation-internals';

const INVALID_LABEL = 0xffffffff;

type ScalarFormat = 'uint32' | 'float32';

type PropagationScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  weightChunks?: number[][];
  directed?: boolean;
  reverse?: boolean;
  capacity?: number;
  reverseCapacity?: number;
  iterations?: number;
  status?: boolean;
  maximumWorkgroups?: number;
  byteOffset?: number;
  assertSnapshotAllocation?: boolean;
  expectedLabels?: number[];
  expectedConvergence?: boolean;
  proveSingleWeakComponent?: boolean;
};

type ExpectedPropagation = {
  labels: number[];
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
  converged: boolean;
};

type PropagationExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: LuGraph;
  topology: LuGraphTopology;
  propagation: LuGraphLabelPropagation;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const propagationScenarios: PropagationScenario[] = [
  {
    name: 'empty graphs publish a converged status and preserve zero-length label ownership',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    capacity: 0,
    assertSnapshotAllocation: true
  },
  {
    name: 'empty graphs without convergence status allocate no graph-owned snapshot',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    capacity: 0,
    status: false,
    assertSnapshotAllocation: true
  },
  {
    name: 'isolated vertices retain their own stable community identifiers and converge',
    vertexCount: 7,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    capacity: 0,
    iterations: 1,
    expectedLabels: [0, 1, 2, 3, 4, 5, 6],
    expectedConvergence: true
  },
  {
    name: 'directed votes include both original forward and reverse weak neighbors',
    vertexCount: 6,
    sourceChunks: [[3, 2], [], [1]],
    targetChunks: [[2, 1], [], [0]],
    iterations: 6,
    assertSnapshotAllocation: true
  },
  {
    name: 'disconnected directed communities retain independent stable labels',
    vertexCount: 8,
    sourceChunks: [[4, 3], [], [6]],
    targetChunks: [[1, 2], [], [5]],
    iterations: 4
  },
  {
    name: 'duplicate and reciprocal occurrences each influence synchronous majority votes',
    vertexCount: 4,
    sourceChunks: [[1, 1], [], [1, 2, 0]],
    targetChunks: [[2, 2], [], [2, 1, 1]],
    iterations: 1,
    expectedLabels: [0, 2, 1, 3],
    expectedConvergence: false
  },
  {
    name: 'self-loop edges never contribute extra self votes or change tie resolution',
    vertexCount: 3,
    sourceChunks: [[1, 1], [], [1, 1, 0]],
    targetChunks: [[1, 1], [], [1, 0, 1]],
    iterations: 1,
    expectedLabels: [1, 0, 2],
    expectedConvergence: false
  },
  {
    name: 'one self vote and equal neighbor support resolve to the lowest numeric label',
    vertexCount: 3,
    sourceChunks: [[1], [], [1]],
    targetChunks: [[0], [], [2]],
    iterations: 1,
    expectedLabels: [0, 0, 1],
    expectedConvergence: false
  },
  {
    name: 'two dense bridged cliques remain separate communities within one weak component',
    vertexCount: 8,
    sourceChunks: [
      [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3],
      [],
      [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 3]
    ],
    targetChunks: [
      [1, 2, 3, 0, 2, 3, 0, 1, 3, 0, 1, 2],
      [],
      [5, 6, 7, 4, 6, 7, 4, 5, 7, 4, 5, 6, 4]
    ],
    iterations: 3,
    expectedLabels: [0, 0, 0, 0, 4, 4, 4, 4],
    expectedConvergence: true,
    proveSingleWeakComponent: true
  },
  {
    name: 'the same bridged cliques report an unproven fixed point after their changed second round',
    vertexCount: 8,
    sourceChunks: [
      [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3],
      [],
      [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 3]
    ],
    targetChunks: [
      [1, 2, 3, 0, 2, 3, 0, 1, 3, 0, 1, 2],
      [],
      [5, 6, 7, 4, 6, 7, 4, 5, 7, 4, 5, 6, 4]
    ],
    iterations: 2,
    expectedLabels: [0, 0, 0, 0, 4, 4, 4, 4],
    expectedConvergence: false
  },
  {
    name: 'cycles, duplicate edges, diamonds, and self-loops remain deterministic',
    vertexCount: 8,
    sourceChunks: [[4, 3, 3], [], [1, 2, 2, 6]],
    targetChunks: [[3, 2, 2], [], [2, 4, 2, 6]],
    iterations: 8
  },
  {
    name: 'reciprocal majority votes can oscillate without falsely proving convergence',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[1], [], [0]],
    iterations: 2,
    expectedLabels: [0, 1],
    expectedConvergence: false
  },
  {
    name: 'weighted undirected chunks vote symmetrically while ignoring preserved edge weights',
    vertexCount: 7,
    sourceChunks: [[0, 3], [], [3, 5]],
    targetChunks: [[1, 2], [], [4, 5]],
    weightChunks: [[0.5, 2], [], [4, 8]],
    directed: false,
    iterations: 5
  },
  {
    name: 'invalid endpoints are excluded without connecting unrelated isolated vertices',
    vertexCount: 6,
    sourceChunks: [[0, 9], [], [2, 4, 5]],
    targetChunks: [[1, 2], [], [8, 5, 5]],
    iterations: 5
  },
  {
    name: 'optional convergence output can be omitted while labels remain deterministic',
    vertexCount: 5,
    sourceChunks: [[4, 2]],
    targetChunks: [[2, 1]],
    iterations: 5,
    status: false
  },
  {
    name: 'required directed reverse overflow fails closed across all community labels',
    vertexCount: 5,
    sourceChunks: [[0, 1, 3]],
    targetChunks: [[1, 2, 4]],
    reverseCapacity: 0,
    iterations: 5
  },
  {
    name: 'zero forward capacity fails closed with invalid labels and unconverged status',
    vertexCount: 4,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    capacity: 0,
    iterations: 4
  },
  {
    name: 'partial forward adjacency also fails closed without exposing partial communities',
    vertexCount: 5,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    capacity: 2,
    iterations: 4
  },
  {
    name: 'a final changed iteration conservatively reports incomplete despite final labels',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    iterations: 1,
    expectedLabels: [0, 0],
    expectedConvergence: false
  },
  {
    name: 'a bounded synchronous chain publishes deterministic partial community labels',
    vertexCount: 12,
    sourceChunks: [[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]],
    targetChunks: [[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]],
    iterations: 1,
    expectedConvergence: false
  },
  {
    name: 'a no-change final synchronous vote proves community convergence',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    iterations: 2,
    expectedLabels: [0, 0],
    expectedConvergence: true
  },
  {
    name: 'non-256-aligned CSR offsets, community labels, and convergence status stay correct',
    vertexCount: 5,
    sourceChunks: [[3, 1]],
    targetChunks: [[2, 0]],
    iterations: 4,
    byteOffset: 4
  },
  {
    name: 'bounded three-dimensional synchronous voting reaches the final of 1025 vertices',
    vertexCount: 1025,
    sourceChunks: [[1024]],
    targetChunks: [[0]],
    iterations: 2,
    maximumWorkgroups: 2
  }
];

test('LuGraphLabelPropagation plans bounded three-dimensional vertex dispatch', tapeTest => {
  tapeTest.deepEqual(getLuGraphLabelPropagationDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getLuGraphLabelPropagationDispatchLayout(512, 2), {x: 2, y: 1, z: 1});
  tapeTest.deepEqual(getLuGraphLabelPropagationDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getLuGraphLabelPropagationDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(() => getLuGraphLabelPropagationDispatchLayout(2049, 2), /3D dispatch limit/);
  tapeTest.end();
});

for (const scenario of propagationScenarios) {
  test(`LuGraphLabelPropagation GPU labeling: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedPropagation(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compilePropagation(fixture, scenario.maximumWorkgroups);
      executePropagation(fixture);
      await assertPropagation(tapeTest, fixture, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'community voting preserves every original source chunk'
      );
      if (scenario.expectedLabels) {
        tapeTest.deepEqual(
          expected.labels,
          scenario.expectedLabels,
          'the independent CPU majority oracle matches the explicit stable-label fixture'
        );
      }
      if (scenario.expectedConvergence !== undefined) {
        tapeTest.equal(
          expected.converged,
          scenario.expectedConvergence,
          'the independent CPU oracle proves convergence only after an unchanged final round'
        );
      }
      if (scenario.proveSingleWeakComponent) {
        tapeTest.equal(
          countWeakComponents(scenario),
          1,
          'both distinct dense community labels belong to one actual weakly connected component'
        );
      }
      if (scenario.assertSnapshotAllocation) {
        const propagationOnlyGraph = new GPUCommandGraph(device);
        fixture.propagation.addToGraph(propagationOnlyGraph);
        const compiledPropagationOnly = propagationOnlyGraph.compile();
        tapeTest.equal(
          compiledPropagationOnly.stats.logicalTransientBufferCount,
          scenario.vertexCount > 0 ? 1 : 0,
          'synchronous propagation owns exactly one snapshot only when vertices exist'
        );
        compiledPropagationOnly.destroy();
      }
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('LuGraphLabelPropagation rebuilds communities after source updates without hidden execution', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const original: PropagationScenario = {
    name: 'repeat deterministic communities',
    vertexCount: 6,
    sourceChunks: [[0, 1], [], [3, 4]],
    targetChunks: [[1, 2], [], [4, 5]],
    iterations: 5
  };
  const fixture = createExecutionFixture(device, original, calculateExpectedPropagation(original));
  const submitSpy = vi.spyOn(device, 'submit');
  const sourceReadbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compilePropagation(fixture);
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'construction and compilation never submit work'
    );
    tapeTest.ok(
      sourceReadbackSpies.every(spy => spy.mock.calls.length === 0),
      'community propagation never reads graph source buffers back'
    );
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();

    executePropagation(fixture);
    await assertPropagation(tapeTest, fixture, calculateExpectedPropagation(original));

    const sourceBuffer = fixture.graph.sourceVertices.data[0].buffer as Buffer;
    sourceBuffer.write(Uint32Array.from([9, 1]));
    const updated = {...original, sourceChunks: [[9, 1], [], [3, 4]]};
    executePropagation(fixture);
    await assertPropagation(tapeTest, fixture, calculateExpectedPropagation(updated));
    tapeTest.equal(
      fixture.graph.sourceVertices.data[0].buffer,
      sourceBuffer,
      'source updates retain exact caller-owned chunk identity'
    );
  } finally {
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Evaluates independent synchronous weak-neighbor majority voting from stable vertex IDs. */
function calculateExpectedPropagation(scenario: PropagationScenario): ExpectedPropagation {
  const directed = scenario.directed !== false;
  const hasReverse = scenario.reverse ?? directed;
  const neighbors: number[][] = Array.from({length: scenario.vertexCount}, () => []);
  let invalidEdgeCount = 0;
  let validEdgeCount = 0;
  let forwardCount = 0;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][rowIndex];
      if (source >= scenario.vertexCount || target >= scenario.vertexCount) {
        invalidEdgeCount++;
        continue;
      }
      validEdgeCount++;
      forwardCount += !directed && source !== target ? 2 : 1;
      if (source !== target) {
        neighbors[source].push(target);
        neighbors[target].push(source);
      }
    }
  }

  const forwardOverflow = forwardCount > (scenario.capacity ?? forwardCount);
  const reverseCount = hasReverse ? validEdgeCount : 0;
  const reverseOverflow = reverseCount > (scenario.reverseCapacity ?? reverseCount);
  const failed = forwardOverflow || (directed && reverseOverflow);
  let labels = Array.from({length: scenario.vertexCount}, (_, vertexIndex) => vertexIndex);
  let converged = scenario.vertexCount === 0;

  if (failed) {
    labels.fill(INVALID_LABEL);
    converged = false;
  } else {
    const iterations = scenario.iterations ?? 32;
    for (let iteration = 0; iteration < iterations; iteration++) {
      const previousLabels = labels;
      labels = previousLabels.map((previousLabel, vertexIndex) => {
        const votes = new Map<number, number>([[previousLabel, 1]]);
        for (const neighbor of neighbors[vertexIndex]) {
          const label = previousLabels[neighbor];
          votes.set(label, (votes.get(label) ?? 0) + 1);
        }

        let winningLabel = previousLabel;
        let winningVotes = votes.get(winningLabel)!;
        for (const [label, voteCount] of votes) {
          if (voteCount > winningVotes || (voteCount === winningVotes && label < winningLabel)) {
            winningLabel = label;
            winningVotes = voteCount;
          }
        }
        return winningLabel;
      });
      converged = labels.every((label, vertexIndex) => label === previousLabels[vertexIndex]);
    }
  }

  return {
    labels,
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow,
    converged
  };
}

/** Separately proves that bridged dense communities are not weak-component identifiers. */
function countWeakComponents(scenario: PropagationScenario): number {
  const parents = Array.from({length: scenario.vertexCount}, (_, vertexIndex) => vertexIndex);
  const findRoot = (vertex: number): number => {
    let root = vertex;
    while (parents[root] !== root) root = parents[root];
    return root;
  };

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][rowIndex];
      if (source >= scenario.vertexCount || target >= scenario.vertexCount) continue;
      const sourceRoot = findRoot(source);
      const targetRoot = findRoot(target);
      if (sourceRoot !== targetRoot)
        parents[Math.max(sourceRoot, targetRoot)] = Math.min(sourceRoot, targetRoot);
    }
  }

  return new Set(parents.map((_parent, vertexIndex) => findRoot(vertexIndex))).size;
}

function createExecutionFixture(
  device: Device,
  scenario: PropagationScenario,
  expected: ExpectedPropagation
): PropagationExecutionFixture {
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
  const graph = new LuGraph({
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
  const reverse =
    (scenario.reverse ?? scenario.directed !== false)
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
  const topology = new LuGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const output = createOutputVector(
    device,
    buffers,
    vectors,
    'community-identifiers',
    'uint32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const converged =
    scenario.status === false
      ? undefined
      : createOutputVector(
          device,
          buffers,
          vectors,
          'communities-converged',
          'uint32',
          1,
          scenario.byteOffset
        );
  const propagation = new LuGraphLabelPropagation({
    topology,
    output,
    iterations: scenario.iterations,
    converged
  });

  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    propagation,
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
      id: `${name}-chunk-${chunkIndex}`,
      data: values.length > 0 ? values : new Uint32Array(1),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
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
): LuGraphAdjacency {
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

function compilePropagation(
  fixture: PropagationExecutionFixture,
  maximumWorkgroups?: number
): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.propagation.addToGraph(fixture.commandGraph);
  } else {
    addLuGraphLabelPropagationToGraphWithDispatchLimit(
      fixture.propagation,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executePropagation(fixture: PropagationExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({id: 'lu-graph-community-test'});
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertPropagation(
  tapeTest: Test,
  fixture: PropagationExecutionFixture,
  expected: ExpectedPropagation
): Promise<void> {
  const [labels, convergence, invalidEdgeCount, forwardOverflow, reverseOverflow] =
    await Promise.all([
      readUint32Vector(fixture.propagation.output),
      fixture.propagation.converged
        ? readUint32Vector(fixture.propagation.converged)
        : Promise.resolve(undefined),
      readUint32Vector(fixture.topology.invalidEdgeCount),
      readUint32Vector(fixture.topology.forward.overflow),
      fixture.topology.reverse
        ? readUint32Vector(fixture.topology.reverse.overflow)
        : Promise.resolve(undefined)
    ]);

  tapeTest.deepEqual(
    labels,
    expected.labels,
    'GPU communities exactly match independent synchronous weak-neighbor majority voting'
  );

  if (convergence) {
    tapeTest.equal(
      convergence[0],
      Number(expected.converged),
      'convergence is proven only when the final iteration makes no changes'
    );
  }
  tapeTest.equal(
    invalidEdgeCount[0],
    expected.invalidEdgeCount,
    'invalid source edges stay excluded'
  );
  tapeTest.equal(
    forwardOverflow[0],
    Number(expected.forwardOverflow),
    'forward adjacency overflow remains explicit'
  );
  if (reverseOverflow) {
    tapeTest.equal(
      reverseOverflow[0],
      Number(expected.reverseOverflow),
      'required reverse adjacency overflow remains explicit'
    );
  }
  if (expected.forwardOverflow || expected.reverseOverflow) {
    tapeTest.ok(
      labels.every(label => label === INVALID_LABEL),
      'truncated required adjacency publishes no misleading partial community labels'
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

function destroyExecutionFixture(tapeTest: Test, fixture: PropagationExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'compiled community graphs and borrowed vectors never destroy caller-owned buffers'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
