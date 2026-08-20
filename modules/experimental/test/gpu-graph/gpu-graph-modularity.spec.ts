// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphLabelPropagation,
  GPUGraphModularity,
  GPUGraphTopology,
  type GPUGraphAdjacency
} from '@luma.gl/experimental/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {addGPUGraphModularityToGraphWithDispatchLimit} from '../../src/gpu-graph/gpu-graph-modularity-internals';

type ScalarFormat = 'uint32' | 'float32';

type ModularityScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  weightChunks?: number[][];
  communities: number[];
  directed?: boolean;
  resolution?: number;
  contributions?: boolean;
  validity?: boolean;
  byteOffset?: number;
  maximumWorkgroups?: number;
  expectedScore?: number;
  expectedContributions?: number[];
  expectedValid?: boolean;
};

type ExpectedModularity = {
  score: number;
  contributions: number[];
  valid: boolean;
};

type ModularityExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: GPUGraph;
  modularity: GPUGraphModularity;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const modularityScenarios: ModularityScenario[] = [
  {
    name: 'empty directed graph fails closed with zero score and empty contributions',
    vertexCount: 0,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    communities: [],
    expectedScore: 0,
    expectedValid: false
  },
  {
    name: 'nonempty edgeless graph has undefined modularity and publishes invalid zero',
    vertexCount: 4,
    sourceChunks: [[], [], []],
    targetChunks: [[], [], []],
    communities: [0, 0, 2, 2],
    expectedScore: 0,
    expectedValid: false
  },
  {
    name: 'two disconnected directed communities have exact one-half modularity',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    communities: [0, 0, 2, 2],
    expectedScore: 0.5,
    expectedContributions: [0.25, 0, 0.25, 0]
  },
  {
    name: 'two disconnected undirected communities have exact one-half modularity',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    communities: [0, 0, 2, 2],
    directed: false,
    expectedScore: 0.5,
    expectedContributions: [0.25, 0, 0.25, 0]
  },
  {
    name: 'placing every vertex in one directed community gives zero modularity',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [3]],
    communities: [0, 0, 0, 0],
    expectedScore: 0,
    expectedContributions: [0, 0, 0, 0]
  },
  {
    name: 'undirected singleton communities expose negative half modularity for one edge',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    communities: [0, 1],
    directed: false,
    expectedScore: -0.5,
    expectedContributions: [-0.25, -0.25]
  },
  {
    name: 'reciprocal cross-community directed edges remain two independent source rows',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[1], [], [0]],
    communities: [0, 1],
    expectedScore: -0.5,
    expectedContributions: [-0.25, -0.25]
  },
  {
    name: 'weighted directed partitions use original positive float32 edge costs',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    weightChunks: [[3], [], [1]],
    communities: [0, 0, 2, 2],
    expectedScore: 0.375,
    expectedContributions: [0.1875, 0, 0.1875, 0]
  },
  {
    name: 'weighted undirected partitions normalize total endpoint volume by twice edge weight',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    weightChunks: [[3], [], [1]],
    communities: [0, 0, 2, 2],
    directed: false,
    expectedScore: 0.375,
    expectedContributions: [0.1875, 0, 0.1875, 0]
  },
  {
    name: 'resolution zero preserves internal-edge fraction without a null-model penalty',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    communities: [0, 0, 2, 2],
    resolution: 0,
    expectedScore: 1,
    expectedContributions: [0.5, 0, 0.5, 0]
  },
  {
    name: 'resolution two doubles the null-model penalty deterministically',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    communities: [0, 0, 2, 2],
    resolution: 2,
    expectedScore: 0
  },
  {
    name: 'undirected self-loops contribute twice to degree but only once to internal edge weight',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[0], [], [3]],
    weightChunks: [[2], [], [2]],
    communities: [0, 1, 2, 2],
    directed: false,
    expectedScore: 0.5,
    expectedContributions: [0.25, 0, 0.25, 0]
  },
  {
    name: 'directed self-loops contribute once to outgoing, incoming, and internal weight',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[0], [], [3]],
    communities: [0, 1, 2, 2],
    expectedScore: 0.5
  },
  {
    name: 'parallel source edges preserve multigraph multiplicity instead of deduplicating',
    vertexCount: 4,
    sourceChunks: [[0, 0], [], [2]],
    targetChunks: [[1, 1], [], [3]],
    communities: [0, 0, 2, 2],
    expectedScore: 4 / 9,
    expectedContributions: [2 / 9, 0, 2 / 9, 0]
  },
  {
    name: 'invalid endpoints are ignored even when their unused source weights are negative',
    vertexCount: 4,
    sourceChunks: [[0, 9], [], [2]],
    targetChunks: [[1, 1], [], [3]],
    weightChunks: [[1, -5], [], [1]],
    communities: [0, 0, 2, 2],
    expectedScore: 0.5,
    expectedValid: true
  },
  {
    name: 'negative valid-endpoint source weight invalidates every modularity output',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    weightChunks: [[1], [], [-1]],
    communities: [0, 0, 2, 2],
    expectedScore: 0,
    expectedContributions: [0, 0, 0, 0],
    expectedValid: false
  },
  {
    name: 'NaN valid-endpoint source weight fails closed without poisoning group reductions',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    weightChunks: [[1], [], [Number.NaN]],
    communities: [0, 0, 2, 2],
    expectedValid: false
  },
  {
    name: 'positive infinite edge weights fail closed with explicit invalid status',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    weightChunks: [[Number.POSITIVE_INFINITY]],
    communities: [0, 0],
    expectedValid: false
  },
  {
    name: 'negative infinite edge weights fail closed with explicit invalid status',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    weightChunks: [[Number.NEGATIVE_INFINITY]],
    communities: [0, 0],
    expectedValid: false
  },
  {
    name: 'all-zero accepted weights define no modularity even when each weight is finite',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    weightChunks: [[0], [], [0]],
    communities: [0, 0, 2, 2],
    expectedValid: false
  },
  {
    name: 'an invalid isolated vertex community poisons the entire partition',
    vertexCount: 4,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    communities: [0, 0, 2, 9],
    expectedValid: false
  },
  {
    name: 'the unsigned invalid-community sentinel fails closed',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    communities: [0, 0xffffffff],
    expectedValid: false
  },
  {
    name: 'float32 group-volume accumulation overflow fails closed',
    vertexCount: 2,
    sourceChunks: [[0], [], [0]],
    targetChunks: [[1], [], [1]],
    weightChunks: [[3.4028234663852886e38], [], [3.4028234663852886e38]],
    communities: [0, 0],
    expectedValid: false
  },
  {
    name: 'optional contribution and validity buffers can be omitted independently',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    communities: [0, 0, 2, 2],
    contributions: false,
    validity: false,
    expectedScore: 0.5
  },
  {
    name: 'non-256-byte-aligned labels and scalar outputs preserve exact view offsets',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    communities: [0, 0, 2, 2],
    byteOffset: 4,
    expectedScore: 0.5
  },
  {
    name: 'bounded three-dimensional dispatch validates and clears the final of 1025 communities',
    vertexCount: 1025,
    sourceChunks: [[0], [], [1024]],
    targetChunks: [[1], [], [1023]],
    communities: Array.from({length: 1025}, (_value, index) => (index < 2 ? 0 : 1023)),
    maximumWorkgroups: 2,
    expectedScore: 0.5
  }
];

for (const scenario of modularityScenarios) {
  test(`GPUGraphModularity GPU: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedModularity(scenario);
    const fixture = createExecutionFixture(device, scenario);
    try {
      compileModularity(fixture, scenario.maximumWorkgroups);
      executeModularity(fixture);
      await assertModularity(tapeTest, fixture, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'modularity consumes every original ordered source chunk without flattening'
      );
      if (scenario.expectedScore !== undefined) {
        tapeTest.ok(
          Math.abs(expected.score - scenario.expectedScore) < 1e-6,
          'independent CPU modularity oracle agrees with the explicit exact partition score'
        );
      }
      if (scenario.expectedContributions) {
        assertApproximateValues(
          tapeTest,
          expected.contributions,
          scenario.expectedContributions,
          'independent CPU oracle confirms explicit stable-community contribution rows'
        );
      }
      if (scenario.expectedValid !== undefined) {
        tapeTest.equal(expected.valid, scenario.expectedValid);
      }
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('GPUGraphModularity scores existing GPU label propagation in the same command graph', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const scenario: ModularityScenario = {
    name: 'GPU label propagation and modularity composition',
    vertexCount: 6,
    sourceChunks: [[0, 1, 2], [], [3, 4, 5]],
    targetChunks: [[1, 2, 0], [], [4, 5, 3]],
    communities: [0, 0, 0, 3, 3, 3],
    directed: false,
    expectedScore: 0.5
  };
  const fixture = createExecutionFixture(device, scenario);
  const adjacency = createOutputAdjacency(
    fixture.device,
    fixture.buffers,
    fixture.vectors,
    'forward',
    scenario.vertexCount,
    fixture.graph.edgeCount * 2
  );
  const invalidEdgeCount = createOutputVector(
    fixture.device,
    fixture.buffers,
    fixture.vectors,
    'invalid-edges',
    'uint32',
    1
  );
  const topology = new GPUGraphTopology({
    graph: fixture.graph,
    forward: adjacency,
    invalidEdgeCount
  });
  const propagation = new GPUGraphLabelPropagation({
    topology,
    output: fixture.modularity.communities,
    iterations: 8
  });
  const communityBuffer = fixture.modularity.communities.data[0].buffer as Buffer;
  const readbackSpy = vi.spyOn(communityBuffer, 'readAsync');
  const submitSpy = vi.spyOn(device, 'submit');

  try {
    topology.addToGraph(fixture.commandGraph);
    propagation.addToGraph(fixture.commandGraph);
    fixture.modularity.addToGraph(fixture.commandGraph);
    fixture.compiled = fixture.commandGraph.compile();
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'composition declares and compiles without submission'
    );
    tapeTest.equal(
      readbackSpy.mock.calls.length,
      0,
      'generated communities are never staged through CPU'
    );
    submitSpy.mockRestore();

    executeModularity(fixture);
    await assertModularity(tapeTest, fixture, calculateExpectedModularity(scenario));
    tapeTest.equal(
      readbackSpy.mock.calls.length,
      0,
      'the exact partition score consumes live label-propagation output entirely on the GPU'
    );
  } finally {
    submitSpy.mockRestore();
    readbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

test('GPUGraphModularity recomputes scores after caller-owned community and source updates', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const original: ModularityScenario = {
    name: 'repeated exact partition scoring',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    communities: [0, 0, 2, 2]
  };
  const fixture = createExecutionFixture(device, original);
  const submitSpy = vi.spyOn(device, 'submit');
  const readbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compileModularity(fixture);
    tapeTest.equal(submitSpy.mock.calls.length, 0);
    tapeTest.ok(readbackSpies.every(spy => spy.mock.calls.length === 0));
    submitSpy.mockRestore();
    for (const readbackSpy of readbackSpies) readbackSpy.mockRestore();

    executeModularity(fixture);
    await assertModularity(tapeTest, fixture, calculateExpectedModularity(original));

    const communityBuffer = fixture.modularity.communities.data[0].buffer as Buffer;
    communityBuffer.write(Uint32Array.from([0, 0, 0, 0]));
    const updated = {...original, communities: [0, 0, 0, 0]};
    executeModularity(fixture);
    await assertModularity(tapeTest, fixture, calculateExpectedModularity(updated));
    tapeTest.equal(fixture.modularity.communities.data[0].buffer, communityBuffer);
  } finally {
    submitSpy.mockRestore();
    for (const readbackSpy of readbackSpies) readbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Evaluates Newman community volumes independently over original graph source partitions. */
function calculateExpectedModularity(scenario: ModularityScenario): ExpectedModularity {
  const directed = scenario.directed !== false;
  const resolution = Math.fround(scenario.resolution ?? 1);
  const outgoingVolumes = new Float32Array(scenario.vertexCount);
  const incomingVolumes = new Float32Array(scenario.vertexCount);
  const internalWeights = new Float32Array(scenario.vertexCount);
  let invalid = scenario.communities.some(community => community >= scenario.vertexCount);

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, sourceVertex] of sources.entries()) {
      const targetVertex = scenario.targetChunks[chunkIndex][rowIndex];
      if (sourceVertex >= scenario.vertexCount || targetVertex >= scenario.vertexCount) continue;

      const weight = Math.fround(scenario.weightChunks?.[chunkIndex][rowIndex] ?? 1);
      if (!Number.isFinite(weight) || weight < 0) {
        invalid = true;
        continue;
      }

      const sourceCommunity = scenario.communities[sourceVertex];
      const targetCommunity = scenario.communities[targetVertex];
      if (sourceCommunity >= scenario.vertexCount || targetCommunity >= scenario.vertexCount) {
        invalid = true;
        continue;
      }

      outgoingVolumes[sourceCommunity] = Math.fround(outgoingVolumes[sourceCommunity] + weight);
      if (directed) {
        incomingVolumes[targetCommunity] = Math.fround(incomingVolumes[targetCommunity] + weight);
      } else {
        outgoingVolumes[targetCommunity] = Math.fround(outgoingVolumes[targetCommunity] + weight);
      }
      if (sourceCommunity === targetCommunity) {
        internalWeights[sourceCommunity] = Math.fround(internalWeights[sourceCommunity] + weight);
      }
    }
  }

  const totalVolume = Array.from(outgoingVolumes).reduce(
    (total, volume) => Math.fround(total + volume),
    0
  );
  if (!Number.isFinite(totalVolume) || totalVolume <= 0) invalid = true;

  if (invalid) {
    return {score: 0, contributions: Array(scenario.vertexCount).fill(0), valid: false};
  }

  const contributions = Array.from(outgoingVolumes, (outgoing, community) => {
    const incoming = directed ? incomingVolumes[community] : outgoing;
    const internalRatio = Math.fround(internalWeights[community] / totalVolume);
    const internalTerm = Math.fround(internalRatio * (directed ? 1 : 2));
    const expectedTerm = Math.fround(
      Math.fround(resolution * Math.fround(outgoing / totalVolume)) *
        Math.fround(incoming / totalVolume)
    );
    return Math.fround(internalTerm - expectedTerm);
  });
  const score = contributions.reduce((total, contribution) => Math.fround(total + contribution), 0);
  if (
    !Number.isFinite(score) ||
    contributions.some(contribution => !Number.isFinite(contribution))
  ) {
    return {score: 0, contributions: Array(scenario.vertexCount).fill(0), valid: false};
  }

  return {score, contributions, valid: true};
}

function createExecutionFixture(
  device: Device,
  scenario: ModularityScenario
): ModularityExecutionFixture {
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
  const communities = createOutputVector(
    device,
    buffers,
    vectors,
    'vertex-communities',
    'uint32',
    scenario.vertexCount,
    scenario.byteOffset,
    Uint32Array.from(scenario.communities)
  );
  const output = createOutputVector(
    device,
    buffers,
    vectors,
    'modularity-score',
    'float32',
    1,
    scenario.byteOffset
  );
  const communityContributions =
    scenario.contributions === false
      ? undefined
      : createOutputVector(
          device,
          buffers,
          vectors,
          'community-contributions',
          'float32',
          scenario.vertexCount,
          scenario.byteOffset
        );
  const valid =
    scenario.validity === false
      ? undefined
      : createOutputVector(
          device,
          buffers,
          vectors,
          'modularity-validity',
          'uint32',
          1,
          scenario.byteOffset
        );
  const modularity = new GPUGraphModularity({
    graph,
    communities,
    output,
    resolution: scenario.resolution,
    communityContributions,
    valid
  });

  return {device, buffers, vectors, graph, modularity, commandGraph: new GPUCommandGraph(device)};
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
  capacity: number
): GPUGraphAdjacency {
  return {
    offsets: createOutputVector(
      device,
      buffers,
      vectors,
      `${name}-offsets`,
      'uint32',
      vertexCount + 1
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
  byteOffset = 0,
  initialValues?: Uint32Array | Float32Array
): GPUVector<Format> {
  const buffer = device.createBuffer({
    id: name,
    byteLength: byteOffset + Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  if (initialValues && initialValues.length > 0) buffer.write(initialValues, byteOffset);
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

function compileModularity(fixture: ModularityExecutionFixture, maximumWorkgroups?: number): void {
  if (maximumWorkgroups === undefined) {
    fixture.modularity.addToGraph(fixture.commandGraph);
  } else {
    addGPUGraphModularityToGraphWithDispatchLimit(
      fixture.modularity,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeModularity(fixture: ModularityExecutionFixture): void {
  const encoder = fixture.device.createCommandEncoder({id: 'gpu-graph-modularity-test'});
  fixture.compiled!.encode(encoder, {parameters: undefined});
  fixture.device.submit(encoder.finish());
}

async function assertModularity(
  tapeTest: Test,
  fixture: ModularityExecutionFixture,
  expected: ExpectedModularity
): Promise<void> {
  const [score, contributions, valid] = await Promise.all([
    readFloat32Vector(fixture.modularity.output),
    fixture.modularity.communityContributions
      ? readFloat32Vector(fixture.modularity.communityContributions)
      : Promise.resolve(undefined),
    fixture.modularity.valid
      ? readUint32Vector(fixture.modularity.valid)
      : Promise.resolve(undefined)
  ]);

  tapeTest.ok(
    Math.abs(score[0] - expected.score) < 2e-5,
    `GPU Newman modularity ${score[0]} matches independent weighted CPU score ${expected.score}`
  );
  if (contributions) {
    assertApproximateValues(
      tapeTest,
      contributions,
      expected.contributions,
      'GPU contributions match stable community identifiers and independent group volumes'
    );
  }
  if (valid)
    tapeTest.equal(valid[0], Number(expected.valid), 'validity reports actual score status');
  if (!expected.valid) {
    tapeTest.equal(score[0], 0, 'invalid partitions never publish misleading partial scores');
    if (contributions) tapeTest.ok(contributions.every(contribution => contribution === 0));
  }
}

function assertApproximateValues(
  tapeTest: Test,
  actual: number[],
  expected: number[],
  message: string
): void {
  tapeTest.equal(actual.length, expected.length);
  for (const [index, value] of actual.entries()) {
    tapeTest.ok(Math.abs(value - expected[index]) < 2e-5, `${message}: row ${index}`);
  }
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

async function readUint32Vector(vector: GPUVector<'uint32'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const data = vector.data[0];
  const bytes = await (data.buffer as Buffer).readAsync(
    data.byteOffset,
    vector.length * Uint32Array.BYTES_PER_ELEMENT
  );
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

function destroyExecutionFixture(tapeTest: Test, fixture: ModularityExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'borrowed source chunks, labels, and outputs retain caller-owned buffer lifetime'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
