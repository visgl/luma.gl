// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphPageRank,
  LuGraphTopology,
  type LuGraphAdjacency
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addLuGraphPageRankToGraphWithDispatchLimit,
  getLuGraphPageRankDispatchLayout
} from '../../src/lugraph/lu-graph-page-rank-internals';

const SCORE_TOLERANCE = 2e-5;
const NORMALIZATION_TOLERANCE = 5e-5;
const RESIDUAL_TOLERANCE = 8e-5;

type ScalarFormat = 'uint32' | 'float32';

type PageRankScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  weightChunks?: number[][];
  directed?: boolean;
  damping?: number;
  iterations?: number;
  residual?: boolean;
  capacity?: number;
  reverseCapacity?: number;
  maximumWorkgroups?: number;
  byteOffset?: number;
};

type ExpectedPageRank = {
  scores: number[];
  residual: number;
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
  failed: boolean;
};

type PageRankExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: LuGraph;
  topology: LuGraphTopology;
  pageRank: LuGraphPageRank;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const pageRankScenarios: PageRankScenario[] = [
  {
    name: 'empty directed graphs publish zero final residual and no rank rows',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    capacity: 0,
    reverseCapacity: 0,
    iterations: 2
  },
  {
    name: 'empty undirected graphs support omitted residual output',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    capacity: 0,
    directed: false,
    residual: false,
    iterations: 2
  },
  {
    name: 'one isolated dangling vertex retains all normalized rank mass',
    vertexCount: 1,
    sourceChunks: [[]],
    targetChunks: [[]],
    capacity: 0,
    reverseCapacity: 0,
    iterations: 3
  },
  {
    name: 'all dangling vertices uniformly redistribute probability without residual',
    vertexCount: 5,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    capacity: 0,
    reverseCapacity: 0,
    iterations: 5
  },
  {
    name: 'a directed dangling chain matches normalized reverse-pull PageRank',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [3]],
    damping: 0.85,
    iterations: 8
  },
  {
    name: 'directed cycles retain symmetric uniform stationary rank',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2, 3]],
    targetChunks: [[1, 2], [], [3, 0]],
    iterations: 6
  },
  {
    name: 'incoming-star importance confirms reverse adjacency pull direction',
    vertexCount: 5,
    sourceChunks: [[1, 2], [], [3, 4]],
    targetChunks: [[0, 0], [], [0, 0]],
    damping: 0.9,
    iterations: 10
  },
  {
    name: 'disconnected groups and isolated nodes preserve normalized global probability',
    vertexCount: 7,
    sourceChunks: [[0, 1], [], [3, 4]],
    targetChunks: [[1, 0], [], [4, 5]],
    iterations: 7
  },
  {
    name: 'duplicate edges and self-loops contribute through their exact outgoing degree',
    vertexCount: 4,
    sourceChunks: [[0, 0, 0], [], [1, 2]],
    targetChunks: [[1, 1, 2], [], [1, 0]],
    iterations: 8
  },
  {
    name: 'zero damping immediately produces uniform ranks and zero final residual',
    vertexCount: 5,
    sourceChunks: [[0, 1, 3]],
    targetChunks: [[1, 2, 4]],
    damping: 0,
    iterations: 3
  },
  {
    name: 'unit damping redistributes dangling mass without division by zero',
    vertexCount: 4,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    damping: 1,
    iterations: 6
  },
  {
    name: 'one iteration reports the exact final normalized L1 delta from uniform scores',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 1, 1]],
    damping: 0.85,
    iterations: 1
  },
  {
    name: 'optional final residual can be omitted without changing normalized scores',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    residual: false,
    iterations: 5
  },
  {
    name: 'float32 edge attributes are preserved but links are intentionally unweighted',
    vertexCount: 5,
    sourceChunks: [[0, 0], [], [2, 3]],
    targetChunks: [[1, 2], [], [1, 4]],
    weightChunks: [[0.5, 20], [], [4, 8]],
    iterations: 7
  },
  {
    name: 'undirected graphs reuse symmetric forward CSR without reverse adjacency',
    vertexCount: 5,
    sourceChunks: [[0, 0], [], [2, 3]],
    targetChunks: [[1, 2], [], [3, 4]],
    directed: false,
    iterations: 8
  },
  {
    name: 'invalid endpoints become excluded links and newly dangling vertices',
    vertexCount: 5,
    sourceChunks: [[0, 9], [], [2, 3, 4]],
    targetChunks: [[1, 2], [], [8, 4, 4]],
    iterations: 7
  },
  {
    name: 'forward CSR overflow fails closed with zero scores and zero residual',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    capacity: 0,
    iterations: 3
  },
  {
    name: 'reverse CSR overflow also fails closed with zero scores and residual',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    reverseCapacity: 1,
    iterations: 3
  },
  {
    name: 'undirected forward overflow fails closed without requiring a reverse status',
    vertexCount: 4,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    directed: false,
    capacity: 2,
    iterations: 3
  },
  {
    name: 'non-256-aligned CSR, score, and residual views preserve float32 binding offsets',
    vertexCount: 5,
    sourceChunks: [[0, 1, 3]],
    targetChunks: [[1, 2, 4]],
    iterations: 4,
    byteOffset: 4
  },
  {
    name: 'bounded 3D pull and hierarchical dangling reductions process 1025 vertices',
    vertexCount: 1025,
    sourceChunks: [
      Array.from({length: 600}, (_, vertexIndex) => vertexIndex),
      [],
      Array.from({length: 424}, (_, vertexIndex) => vertexIndex + 600)
    ],
    targetChunks: [
      Array.from({length: 600}, (_, vertexIndex) => vertexIndex + 1),
      [],
      Array.from({length: 424}, (_, vertexIndex) => vertexIndex + 601)
    ],
    iterations: 2,
    maximumWorkgroups: 2
  }
];

test('LuGraphPageRank plans bounded three-dimensional pull and reduction dispatch', tapeTest => {
  tapeTest.deepEqual(getLuGraphPageRankDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getLuGraphPageRankDispatchLayout(512, 2), {x: 2, y: 1, z: 1});
  tapeTest.deepEqual(getLuGraphPageRankDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getLuGraphPageRankDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(() => getLuGraphPageRankDispatchLayout(2049, 2), /3D dispatch limit/);
  tapeTest.end();
});

for (const scenario of pageRankScenarios) {
  test(`LuGraphPageRank GPU analytics: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedPageRank(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compilePageRank(fixture, scenario.maximumWorkgroups);
      executePageRank(fixture);
      await assertPageRank(tapeTest, fixture, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'rank evaluation preserves caller-owned source chunks and empty edge batches'
      );
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('LuGraphPageRank reinitializes normalized scores after source updates without hidden GPU work', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const original: PageRankScenario = {
    name: 'repeated PageRank encoding',
    vertexCount: 6,
    sourceChunks: [[0, 1], [], [2, 4]],
    targetChunks: [[1, 2], [], [3, 5]],
    damping: 0.85,
    iterations: 6
  };
  const fixture = createExecutionFixture(device, original, calculateExpectedPageRank(original));
  const submitSpy = vi.spyOn(device, 'submit');
  const sourceReadbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compilePageRank(fixture);
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'topology and rank construction never submit work'
    );
    tapeTest.ok(
      sourceReadbackSpies.every(spy => spy.mock.calls.length === 0),
      'PageRank never reads source edge columns back to the CPU'
    );
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();

    executePageRank(fixture);
    await assertPageRank(tapeTest, fixture, calculateExpectedPageRank(original));

    const sourceBuffer = fixture.graph.sourceVertices.data[0].buffer as Buffer;
    sourceBuffer.write(Uint32Array.from([9, 1]));
    const updated = {...original, sourceChunks: [[9, 1], [], [2, 4]]};
    executePageRank(fixture);
    await assertPageRank(tapeTest, fixture, calculateExpectedPageRank(updated));
    tapeTest.equal(
      fixture.graph.sourceVertices.data[0].buffer,
      sourceBuffer,
      'repeated ranking preserves exact source chunk and physical buffer identity'
    );
  } finally {
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Computes unweighted PageRank with exact dangling redistribution and per-step normalization. */
function calculateExpectedPageRank(scenario: PageRankScenario): ExpectedPageRank {
  const outgoing = Array.from({length: scenario.vertexCount}, () => [] as number[]);
  const incoming = Array.from({length: scenario.vertexCount}, () => [] as number[]);
  let invalidEdgeCount = 0;
  let validEdgeCount = 0;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][rowIndex];
      if (source >= scenario.vertexCount || target >= scenario.vertexCount) {
        invalidEdgeCount++;
        continue;
      }
      validEdgeCount++;
      outgoing[source].push(target);
      incoming[target].push(source);
      if (scenario.directed === false && source !== target) {
        outgoing[target].push(source);
        incoming[source].push(target);
      }
    }
  }

  const forwardCount = outgoing.reduce((count, neighbors) => count + neighbors.length, 0);
  const reverseCount = scenario.directed === false ? 0 : validEdgeCount;
  const forwardOverflow = forwardCount > (scenario.capacity ?? forwardCount);
  const reverseOverflow =
    scenario.directed !== false && reverseCount > (scenario.reverseCapacity ?? reverseCount);
  const failed = forwardOverflow || reverseOverflow;
  let scores = new Array<number>(scenario.vertexCount).fill(0);
  let residual = 0;

  if (!failed && scenario.vertexCount > 0) {
    scores.fill(1 / scenario.vertexCount);
    const damping = scenario.damping ?? 0.85;
    const iterations = scenario.iterations ?? 40;
    for (let iteration = 0; iteration < iterations; iteration++) {
      const danglingMass = scores.reduce(
        (sum, score, vertexIndex) => sum + (outgoing[vertexIndex].length === 0 ? score : 0),
        0
      );
      const next = incoming.map(neighbors => {
        const contribution = neighbors.reduce(
          (sum, neighbor) => sum + scores[neighbor] / outgoing[neighbor].length,
          0
        );
        return (
          (1 - damping) / scenario.vertexCount +
          damping * (contribution + danglingMass / scenario.vertexCount)
        );
      });
      const mass = next.reduce((sum, score) => sum + score, 0);
      const normalized = next.map(score => (mass > 0 ? score / mass : 0));
      residual = normalized.reduce(
        (difference, score, vertexIndex) => difference + Math.abs(score - scores[vertexIndex]),
        0
      );
      scores = normalized;
    }
  }

  return {
    scores,
    residual,
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow,
    failed
  };
}

function createExecutionFixture(
  device: Device,
  scenario: PageRankScenario,
  expected: ExpectedPageRank
): PageRankExecutionFixture {
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
  const directed = scenario.directed ?? true;
  const graph = new LuGraph({
    vertexCount: scenario.vertexCount,
    sourceVertices,
    targetVertices,
    edgeWeights,
    directed
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
  const reverse = directed
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
    'page-rank-scores',
    'float32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const residual =
    scenario.residual === false
      ? undefined
      : createOutputVector(
          device,
          buffers,
          vectors,
          'page-rank-residual',
          'float32',
          1,
          scenario.byteOffset
        );
  const pageRank = new LuGraphPageRank({
    topology,
    output,
    damping: scenario.damping,
    iterations: scenario.iterations,
    residual
  });

  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    pageRank,
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

function compilePageRank(fixture: PageRankExecutionFixture, maximumWorkgroups?: number): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.pageRank.addToGraph(fixture.commandGraph);
  } else {
    addLuGraphPageRankToGraphWithDispatchLimit(
      fixture.pageRank,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executePageRank(fixture: PageRankExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({id: 'lu-graph-page-rank-test'});
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertPageRank(
  tapeTest: Test,
  fixture: PageRankExecutionFixture,
  expected: ExpectedPageRank
): Promise<void> {
  const [scores, residual, invalidEdgeCount, forwardOverflow, reverseOverflow] = await Promise.all([
    readFloat32Vector(fixture.pageRank.output),
    fixture.pageRank.residual
      ? readFloat32Vector(fixture.pageRank.residual)
      : Promise.resolve(undefined),
    readUint32Vector(fixture.topology.invalidEdgeCount),
    readUint32Vector(fixture.topology.forward.overflow),
    fixture.topology.reverse
      ? readUint32Vector(fixture.topology.reverse.overflow)
      : Promise.resolve(undefined)
  ]);

  tapeTest.equal(
    scores.length,
    expected.scores.length,
    'one float32 score is published per vertex'
  );
  const largestScoreError = scores.reduce(
    (largest, score, vertexIndex) =>
      Math.max(largest, Math.abs(score - expected.scores[vertexIndex])),
    0
  );
  tapeTest.ok(
    largestScoreError <= SCORE_TOLERANCE,
    `float32 reverse-pull ranks match the CPU oracle within ${SCORE_TOLERANCE}`
  );
  if (!expected.failed && scores.length > 0) {
    tapeTest.ok(
      scores.every(score => Number.isFinite(score) && score >= 0),
      'every score is finite and nonnegative'
    );
    const rankMass = scores.reduce((sum, score) => sum + score, 0);
    tapeTest.ok(
      Math.abs(rankMass - 1) <= NORMALIZATION_TOLERANCE,
      'dangling redistribution and float32 normalization preserve unit rank mass'
    );
  }
  if (residual) {
    tapeTest.ok(
      Math.abs(residual[0] - expected.residual) <= RESIDUAL_TOLERANCE,
      'optional residual equals the final normalized L1 PageRank delta'
    );
  }
  tapeTest.equal(
    invalidEdgeCount[0],
    expected.invalidEdgeCount,
    'invalid graph edges are excluded'
  );
  tapeTest.equal(
    forwardOverflow[0],
    Number(expected.forwardOverflow),
    'forward capacity remains explicit'
  );
  if (reverseOverflow) {
    tapeTest.equal(
      reverseOverflow[0],
      Number(expected.reverseOverflow),
      'reverse capacity remains explicit'
    );
  }
  if (expected.failed) {
    tapeTest.ok(
      scores.every(score => score === 0),
      'required CSR overflow fails closed with zero scores'
    );
    if (residual) tapeTest.equal(residual[0], 0, 'failed topology publishes a zero final residual');
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

async function readFloat32Vector(vector: GPUVector<'float32'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const data = vector.data[0];
  const bytes = await (data.buffer as Buffer).readAsync(
    data.byteOffset,
    vector.length * Float32Array.BYTES_PER_ELEMENT
  );
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

function destroyExecutionFixture(tapeTest: Test, fixture: PageRankExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'graph-owned PageRank reduction scratch never destroys caller-owned physical buffers'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
