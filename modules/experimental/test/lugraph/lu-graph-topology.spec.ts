// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {LuGraph, LuGraphTopology, type LuGraphAdjacency} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {addLuGraphTopologyToGraphWithDispatchLimit} from '../../src/lugraph/lu-graph-topology-internals';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type TopologyScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  edgeIdChunks?: number[][];
  edgeWeightChunks?: number[][];
  directed?: boolean;
  reverse?: boolean;
  capacity?: number;
  reverseCapacity?: number;
  maximumWorkgroups?: number;
};

type AdjacencyRecord = {
  neighbor: number;
  edgeId: number;
  edgeWeight?: number;
};

type ExpectedAdjacency = {
  rows: AdjacencyRecord[][];
  offsets: number[];
  count: number;
};

type ExpectedTopology = {
  forward: ExpectedAdjacency;
  reverse?: ExpectedAdjacency;
  invalidEdgeCount: number;
};

type ReadAdjacency = {
  offsets: number[];
  neighbors: number[];
  edgeIds: number[];
  edgeWeights?: number[];
  count: number;
  overflow: number;
};

type ExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: LuGraph;
  topology: LuGraphTopology;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const topologyScenarios: TopologyScenario[] = [
  {
    name: 'empty graphs publish one zero offset without adjacency capacity',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    capacity: 0
  },
  {
    name: 'isolated vertices and empty source batches retain all zero offsets',
    vertexCount: 7,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    capacity: 0
  },
  {
    name: 'directed edges preserve forward neighbors and generated stable edge IDs',
    vertexCount: 6,
    sourceChunks: [[0, 2, 2, 4]],
    targetChunks: [[1, 4, 3, 0]]
  },
  {
    name: 'optional reverse adjacency preserves incoming neighbors and source identities',
    vertexCount: 6,
    sourceChunks: [[0, 2, 2, 4]],
    targetChunks: [[1, 4, 3, 0]],
    reverse: true
  },
  {
    name: 'undirected adjacency symmetrizes edges but emits each self-loop only once',
    vertexCount: 5,
    sourceChunks: [[0, 1, 1, 3]],
    targetChunks: [[1, 2, 1, 3]],
    directed: false
  },
  {
    name: 'weighted undirected edges preserve mirrored stable IDs, self-loops, and bounded slots',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2, 3]],
    targetChunks: [[1, 1], [], [3, 0]],
    edgeIdChunks: [[10, 20], [], [30, 40]],
    edgeWeightChunks: [[0.5, 2], [], [4, 8]],
    directed: false,
    capacity: 6
  },
  {
    name: 'duplicate edges and high-degree hubs retain every distinct source edge ID',
    vertexCount: 5,
    sourceChunks: [[0, 0, 0, 0, 2, 2]],
    targetChunks: [[1, 1, 2, 3, 3, 3]]
  },
  {
    name: 'invalid endpoints are counted once across weighted forward and reverse adjacency',
    vertexCount: 4,
    sourceChunks: [[0, 9], [], [2, 3, 0]],
    targetChunks: [[1, 2], [], [8, 3, 7]],
    edgeIdChunks: [[10, 42], [], [99, 101, 102]],
    edgeWeightChunks: [[0.5, 2], [], [1, 4, 8]],
    reverse: true
  },
  {
    name: 'source batches, explicit stable IDs, and float32 weights remain aligned',
    vertexCount: 9,
    sourceChunks: [[0, 2], [], [2, 3, 6]],
    targetChunks: [[1, 4], [], [3, 5, 7]],
    edgeIdChunks: [[10, 42], [], [99, 101, 102]],
    edgeWeightChunks: [[0.5, 2], [], [1, 4, 8]]
  },
  {
    name: 'zero capacity reports overflow while publishing exact untruncated offsets',
    vertexCount: 3,
    sourceChunks: [[0, 1, 1]],
    targetChunks: [[1, 0, 2]],
    capacity: 0
  },
  {
    name: 'partial hub capacity bounds atomic scatter without corrupting edge identity',
    vertexCount: 4,
    sourceChunks: [[0, 0, 0, 0, 2]],
    targetChunks: [[1, 1, 2, 3, 3]],
    edgeIdChunks: [[20, 30, 40, 50, 60]],
    edgeWeightChunks: [[0.5, 1, 2, 4, 8]],
    capacity: 2
  },
  {
    name: 'exact capacity stores every valid edge without setting overflow',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    capacity: 3
  },
  {
    name: 'bounded three-dimensional dispatch initializes, scans, and scatters 1025 rows',
    vertexCount: 1025,
    sourceChunks: [Array.from({length: 1025}, (_, vertexIndex) => vertexIndex)],
    targetChunks: [Array.from({length: 1025}, (_, vertexIndex) => (vertexIndex + 1) % 1025)],
    maximumWorkgroups: 2
  }
];

for (const scenario of topologyScenarios) {
  test(`LuGraphTopology GPU CSR: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = buildExpectedTopology(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileTopology(fixture, scenario.maximumWorkgroups);
      executeTopology(fixture);
      await assertTopology(tapeTest, fixture, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'GPU construction retains every source chunk and empty source batch'
      );
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('LuGraphTopology rebuilds overflow, invalid edges, and weighted reverse CSR on every encoding', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const original: TopologyScenario = {
    name: 'repeated encoding',
    vertexCount: 6,
    sourceChunks: [[0, 1], [], [2, 3, 4]],
    targetChunks: [[1, 2], [], [3, 4, 5]],
    edgeIdChunks: [[10, 20], [], [30, 40, 50]],
    edgeWeightChunks: [[0.5, 1], [], [2, 4, 8]],
    reverse: true,
    capacity: 3,
    reverseCapacity: 3
  };
  const fixture = createExecutionFixture(device, original, buildExpectedTopology(original));

  try {
    compileTopology(fixture);
    executeTopology(fixture);
    await assertTopology(tapeTest, fixture, buildExpectedTopology(original));

    const sourceBuffer = fixture.graph.sourceVertices.data[0].buffer as Buffer;
    sourceBuffer.write(Uint32Array.from([9, 9]));
    const updated: TopologyScenario = {
      ...original,
      sourceChunks: [[9, 9], [], [2, 3, 4]]
    };

    executeTopology(fixture);
    await assertTopology(tapeTest, fixture, buildExpectedTopology(updated));
    tapeTest.equal(
      fixture.graph.sourceVertices.data[0].buffer,
      sourceBuffer,
      'rewriting caller-owned source storage never replaces its preserved source chunk'
    );
  } finally {
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Computes a CPU reference without promising deterministic atomic order within one CSR row. */
function buildExpectedTopology(scenario: TopologyScenario): ExpectedTopology {
  const forwardRows = Array.from({length: scenario.vertexCount}, () => [] as AdjacencyRecord[]);
  const reverseRows = scenario.reverse
    ? Array.from({length: scenario.vertexCount}, () => [] as AdjacencyRecord[])
    : undefined;
  let invalidEdgeCount = 0;
  let sourceEdgeIndex = 0;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][rowIndex];
      const edgeId = scenario.edgeIdChunks?.[chunkIndex][rowIndex] ?? sourceEdgeIndex;
      const edgeWeight = scenario.edgeWeightChunks?.[chunkIndex][rowIndex];
      sourceEdgeIndex++;

      if (source >= scenario.vertexCount || target >= scenario.vertexCount) {
        invalidEdgeCount++;
        continue;
      }

      const forwardRecord = makeAdjacencyRecord(target, edgeId, edgeWeight);
      const reverseRecord = makeAdjacencyRecord(source, edgeId, edgeWeight);
      forwardRows[source].push(forwardRecord);
      if (scenario.directed === false && source !== target) {
        forwardRows[target].push(reverseRecord);
      }
      reverseRows?.[target].push(reverseRecord);
    }
  }

  return {
    forward: finalizeExpectedAdjacency(forwardRows),
    reverse: reverseRows ? finalizeExpectedAdjacency(reverseRows) : undefined,
    invalidEdgeCount
  };
}

function makeAdjacencyRecord(
  neighbor: number,
  edgeId: number,
  edgeWeight?: number
): AdjacencyRecord {
  return edgeWeight === undefined ? {neighbor, edgeId} : {neighbor, edgeId, edgeWeight};
}

function finalizeExpectedAdjacency(rows: AdjacencyRecord[][]): ExpectedAdjacency {
  const offsets = [0];
  for (const row of rows) offsets.push(offsets[offsets.length - 1] + row.length);
  return {rows, offsets, count: offsets[offsets.length - 1]};
}

function createExecutionFixture(
  device: Device,
  scenario: TopologyScenario,
  expected: ExpectedTopology
): ExecutionFixture {
  const buffers: Buffer[] = [];
  const vectors: GPUVector[] = [];
  const sourceVertices = createSourceVector(
    device,
    buffers,
    vectors,
    'source-vertices',
    'uint32',
    scenario.sourceChunks
  );
  const targetVertices = createSourceVector(
    device,
    buffers,
    vectors,
    'target-vertices',
    'uint32',
    scenario.targetChunks
  );
  const edgeIds = scenario.edgeIdChunks
    ? createSourceVector(
        device,
        buffers,
        vectors,
        'source-edge-ids',
        'uint32',
        scenario.edgeIdChunks
      )
    : undefined;
  const edgeWeights = scenario.edgeWeightChunks
    ? createSourceVector(
        device,
        buffers,
        vectors,
        'source-edge-weights',
        'float32',
        scenario.edgeWeightChunks
      )
    : undefined;
  const graph = new LuGraph({
    vertexCount: scenario.vertexCount,
    sourceVertices,
    targetVertices,
    edgeIds,
    edgeWeights,
    directed: scenario.directed
  });
  const forward = createOutputAdjacency(
    device,
    buffers,
    vectors,
    'forward',
    scenario.vertexCount,
    scenario.capacity ?? expected.forward.count,
    Boolean(edgeWeights)
  );
  const reverse = scenario.reverse
    ? createOutputAdjacency(
        device,
        buffers,
        vectors,
        'reverse',
        scenario.vertexCount,
        scenario.reverseCapacity ?? expected.reverse!.count,
        Boolean(edgeWeights)
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

  return {device, buffers, vectors, graph, topology, commandGraph: new GPUCommandGraph(device)};
}

function createSourceVector<Format extends ScalarFormat>(
  device: Device,
  buffers: Buffer[],
  vectors: GPUVector[],
  name: string,
  format: Format,
  chunks: readonly number[][]
): GPUVector<Format> {
  const data = chunks.map((chunk, chunkIndex) => {
    const values: ScalarValues =
      format === 'float32' ? Float32Array.from(chunk) : Uint32Array.from(chunk);
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
  weighted: boolean
): LuGraphAdjacency {
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
    edgeWeights: weighted
      ? createOutputVector(device, buffers, vectors, `${name}-edge-weights`, 'float32', capacity)
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
  length: number
): GPUVector<Format> {
  const buffer = device.createBuffer({
    id: name,
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
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
}

function compileTopology(fixture: ExecutionFixture, maximumWorkgroups?: number): void {
  if (maximumWorkgroups === undefined) {
    fixture.topology.addToGraph(fixture.commandGraph);
  } else {
    addLuGraphTopologyToGraphWithDispatchLimit(
      fixture.topology,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeTopology(fixture: ExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({id: 'lu-graph-topology-test'});
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertTopology(
  tapeTest: Test,
  fixture: ExecutionFixture,
  expected: ExpectedTopology
): Promise<void> {
  await assertAdjacency(tapeTest, 'forward', fixture.topology.forward, expected.forward);
  if (fixture.topology.reverse && expected.reverse) {
    await assertAdjacency(tapeTest, 'reverse', fixture.topology.reverse, expected.reverse);
  }
  const invalidEdgeCount = (await readUint32Vector(fixture.topology.invalidEdgeCount))[0];
  tapeTest.equal(
    invalidEdgeCount,
    expected.invalidEdgeCount,
    'each invalid source edge is counted once'
  );
}

async function assertAdjacency(
  tapeTest: Test,
  name: string,
  adjacency: LuGraphAdjacency,
  expected: ExpectedAdjacency
): Promise<void> {
  const result = await readAdjacency(adjacency);
  const capacity = adjacency.neighbors.length;
  tapeTest.deepEqual(
    result.offsets,
    expected.offsets,
    `${name} offsets remain exact and untruncated`
  );
  tapeTest.equal(result.count, expected.count, `${name} count reports required adjacency capacity`);
  tapeTest.equal(
    result.overflow,
    Number(expected.count > capacity),
    `${name} reports capacity overflow`
  );

  const actualRows = expected.rows.map((_row, vertexIndex) => {
    const start = Math.min(expected.offsets[vertexIndex], capacity);
    const end = Math.min(expected.offsets[vertexIndex + 1], capacity);
    return Array.from({length: end - start}, (_, rowOffset) => {
      const edgeIndex = start + rowOffset;
      return makeAdjacencyRecord(
        result.neighbors[edgeIndex],
        result.edgeIds[edgeIndex],
        result.edgeWeights?.[edgeIndex]
      );
    }).sort(compareAdjacencyRecords);
  });
  const expectedRows = expected.rows.map(row => [...row].sort(compareAdjacencyRecords));

  if (expected.count <= capacity) {
    tapeTest.deepEqual(
      actualRows,
      expectedRows,
      `${name} preserves every neighbor, stable edge ID, and aligned weight`
    );
    return;
  }

  const rowSizesMatch = actualRows.every((row, vertexIndex) => {
    const expectedStart = Math.min(expected.offsets[vertexIndex], capacity);
    const expectedEnd = Math.min(expected.offsets[vertexIndex + 1], capacity);
    return row.length === expectedEnd - expectedStart;
  });
  const recordsBelongToExpectedRows = actualRows.every((row, vertexIndex) => {
    const remaining = [...expectedRows[vertexIndex]];
    return row.every(record => {
      const matchingIndex = remaining.findIndex(
        candidate => compareAdjacencyRecords(candidate, record) === 0
      );
      if (matchingIndex < 0) return false;
      remaining.splice(matchingIndex, 1);
      return true;
    });
  });

  tapeTest.ok(rowSizesMatch, `${name} capacity never writes outside each untruncated CSR row`);
  tapeTest.ok(
    recordsBelongToExpectedRows,
    `${name} truncated rows contain valid neighbor, edge ID, and weight tuples`
  );
}

function compareAdjacencyRecords(left: AdjacencyRecord, right: AdjacencyRecord): number {
  return (
    left.edgeId - right.edgeId ||
    left.neighbor - right.neighbor ||
    (left.edgeWeight ?? 0) - (right.edgeWeight ?? 0)
  );
}

async function readAdjacency(adjacency: LuGraphAdjacency): Promise<ReadAdjacency> {
  const [offsets, neighbors, edgeIds, edgeWeights, count, overflow] = await Promise.all([
    readUint32Vector(adjacency.offsets),
    readUint32Vector(adjacency.neighbors),
    readUint32Vector(adjacency.edgeIds),
    adjacency.edgeWeights ? readFloat32Vector(adjacency.edgeWeights) : Promise.resolve(undefined),
    readUint32Vector(adjacency.count),
    readUint32Vector(adjacency.overflow)
  ]);
  return {offsets, neighbors, edgeIds, edgeWeights, count: count[0], overflow: overflow[0]};
}

async function readUint32Vector(vector: GPUVector<'uint32'>): Promise<number[]> {
  const bytes = await (vector.data[0].buffer as Buffer).readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

async function readFloat32Vector(vector: GPUVector<'float32'>): Promise<number[]> {
  const bytes = await (vector.data[0].buffer as Buffer).readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

function destroyExecutionFixture(tapeTest: Test, fixture: ExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'destroying the compiled graph and borrowed vectors preserves caller-owned buffers'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
