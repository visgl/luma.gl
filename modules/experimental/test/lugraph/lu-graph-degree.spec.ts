// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphDegree,
  LuGraphTopology,
  type LuGraphAdjacency,
  type LuGraphDegreeDirection
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addLuGraphDegreeToGraphWithDispatchLimit,
  getLuGraphDegreeDispatchLayout
} from '../../src/lugraph/lu-graph-degree-internals';

type ScalarFormat = 'uint32' | 'float32';

type DegreeScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  weightChunks?: number[][];
  directed?: boolean;
  reverse?: boolean;
  direction?: LuGraphDegreeDirection;
  capacity?: number;
  reverseCapacity?: number;
  maximumWorkgroups?: number;
  offsetByteOffset?: number;
  outputByteOffset?: number;
};

type ExpectedDegrees = {
  values: number[];
  invalidEdgeCount: number;
  selectedAdjacencyCount: number;
};

type DegreeExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: LuGraph;
  topology: LuGraphTopology;
  degree: LuGraphDegree;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const degreeScenarios: DegreeScenario[] = [
  {
    name: 'empty graphs retain a caller-owned zero-length degree vector',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    capacity: 0
  },
  {
    name: 'isolated vertices and empty source chunks publish zero degrees',
    vertexCount: 7,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    capacity: 0
  },
  {
    name: 'directed outgoing degree counts all original source rows',
    vertexCount: 6,
    sourceChunks: [[0, 0], [], [2, 4, 4]],
    targetChunks: [[1, 2], [], [1, 0, 5]]
  },
  {
    name: 'directed incoming degree consumes exact reverse CSR offsets',
    vertexCount: 6,
    sourceChunks: [[0, 0], [], [2, 4, 4]],
    targetChunks: [[1, 2], [], [1, 0, 5]],
    reverse: true,
    direction: 'incoming'
  },
  {
    name: 'undirected outgoing degree symmetrizes edges and counts self-loops once',
    vertexCount: 5,
    sourceChunks: [[0, 1], [], [1, 3]],
    targetChunks: [[1, 2], [], [1, 3]],
    weightChunks: [[0.5, 2], [], [4, 8]],
    directed: false
  },
  {
    name: 'undirected incoming degree reuses symmetric forward adjacency',
    vertexCount: 5,
    sourceChunks: [[0, 1], [], [1, 3]],
    targetChunks: [[1, 2], [], [1, 3]],
    directed: false,
    direction: 'incoming'
  },
  {
    name: 'invalid source and target references never contribute to incoming degree',
    vertexCount: 4,
    sourceChunks: [[0, 9], [], [2, 3, 0]],
    targetChunks: [[1, 2], [], [8, 3, 7]],
    reverse: true,
    direction: 'incoming'
  },
  {
    name: 'duplicate edges and high-degree hubs retain every edge occurrence',
    vertexCount: 4,
    sourceChunks: [[0, 0, 0, 0, 2]],
    targetChunks: [[1, 1, 0, 3, 2]]
  },
  {
    name: 'zero neighbor capacity still publishes exact untruncated outgoing degree',
    vertexCount: 4,
    sourceChunks: [[0, 0, 1, 2]],
    targetChunks: [[1, 2, 3, 3]],
    capacity: 0
  },
  {
    name: 'partial reverse capacity still publishes exact untruncated incoming degree',
    vertexCount: 4,
    sourceChunks: [[0, 0, 1, 2]],
    targetChunks: [[1, 2, 3, 3]],
    capacity: 1,
    reverseCapacity: 1,
    reverse: true,
    direction: 'incoming'
  },
  {
    name: 'non-256-aligned offsets and degree ranges use correct storage binding offsets',
    vertexCount: 4,
    sourceChunks: [[0, 1, 1]],
    targetChunks: [[1, 2, 3]],
    offsetByteOffset: 4,
    outputByteOffset: 4
  },
  {
    name: 'bounded three-dimensional dispatch evaluates the last of 1025 vertices',
    vertexCount: 1025,
    sourceChunks: [[0, 512, 1024]],
    targetChunks: [[1, 513, 0]],
    maximumWorkgroups: 2
  }
];

test('LuGraphDegree plans bounded three-dimensional direct dispatch', tapeTest => {
  tapeTest.deepEqual(getLuGraphDegreeDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getLuGraphDegreeDispatchLayout(512, 2), {x: 2, y: 1, z: 1});
  tapeTest.deepEqual(getLuGraphDegreeDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getLuGraphDegreeDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(() => getLuGraphDegreeDispatchLayout(2049, 2), /3D dispatch limit/);
  tapeTest.end();
});

for (const scenario of degreeScenarios) {
  test(`LuGraphDegree GPU metrics: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedDegrees(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileMetrics(fixture, scenario.maximumWorkgroups);
      executeMetrics(fixture);
      await assertDegrees(tapeTest, fixture, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'degree evaluation preserves original source chunks and empty batches'
      );
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('LuGraphDegree recomputes incoming degrees after source updates without hidden execution', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const original: DegreeScenario = {
    name: 'repeated incoming evaluation',
    vertexCount: 6,
    sourceChunks: [[0, 1], [], [2, 3, 4]],
    targetChunks: [[1, 2], [], [3, 4, 5]],
    reverse: true,
    direction: 'incoming',
    capacity: 3,
    reverseCapacity: 3
  };
  const fixture = createExecutionFixture(device, original, calculateExpectedDegrees(original));
  const submitSpy = vi.spyOn(device, 'submit');
  const sourceReadbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compileMetrics(fixture);
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'construction and compilation never submit work'
    );
    tapeTest.ok(
      sourceReadbackSpies.every(spy => spy.mock.calls.length === 0),
      'topology and degree construction never read source buffers back'
    );
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();

    executeMetrics(fixture);
    await assertDegrees(tapeTest, fixture, calculateExpectedDegrees(original));

    const sourceBuffer = fixture.graph.sourceVertices.data[0].buffer as Buffer;
    sourceBuffer.write(Uint32Array.from([9, 9]));
    const updated = {...original, sourceChunks: [[9, 9], [], [2, 3, 4]]};
    executeMetrics(fixture);
    await assertDegrees(tapeTest, fixture, calculateExpectedDegrees(updated));
    tapeTest.equal(
      fixture.graph.sourceVertices.data[0].buffer,
      sourceBuffer,
      'source updates preserve caller-owned source buffer identity'
    );
  } finally {
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Counts original valid graph edges rather than relying on bounded neighbor storage. */
function calculateExpectedDegrees(scenario: DegreeScenario): ExpectedDegrees {
  const values = new Array<number>(scenario.vertexCount).fill(0);
  let invalidEdgeCount = 0;
  let selectedAdjacencyCount = 0;
  const incoming = scenario.direction === 'incoming' && scenario.directed !== false;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][rowIndex];
      if (source >= scenario.vertexCount || target >= scenario.vertexCount) {
        invalidEdgeCount++;
        continue;
      }

      if (scenario.directed === false) {
        values[source]++;
        selectedAdjacencyCount++;
        if (source !== target) {
          values[target]++;
          selectedAdjacencyCount++;
        }
      } else {
        values[incoming ? target : source]++;
        selectedAdjacencyCount++;
      }
    }
  }

  return {values, invalidEdgeCount, selectedAdjacencyCount};
}

function createExecutionFixture(
  device: Device,
  scenario: DegreeScenario,
  expected: ExpectedDegrees
): DegreeExecutionFixture {
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
  const edgeWeights = scenario.weightChunks
    ? createSourceVector(
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
  const capacity = scenario.capacity ?? expected.selectedAdjacencyCount;
  const forward = createOutputAdjacency(
    device,
    buffers,
    vectors,
    'forward',
    scenario.vertexCount,
    capacity,
    Boolean(edgeWeights),
    scenario.offsetByteOffset
  );
  const reverse = scenario.reverse
    ? createOutputAdjacency(
        device,
        buffers,
        vectors,
        'reverse',
        scenario.vertexCount,
        scenario.reverseCapacity ?? expected.selectedAdjacencyCount,
        Boolean(edgeWeights),
        scenario.offsetByteOffset
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
    'vertex-degree',
    'uint32',
    scenario.vertexCount,
    scenario.outputByteOffset
  );
  const degree = new LuGraphDegree({topology, output, direction: scenario.direction});
  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    degree,
    commandGraph: new GPUCommandGraph(device)
  };
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
  offsetByteOffset = 0
): LuGraphAdjacency {
  return {
    offsets: createOutputVector(
      device,
      buffers,
      vectors,
      `${name}-offsets`,
      'uint32',
      vertexCount + 1,
      offsetByteOffset
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

function compileMetrics(fixture: DegreeExecutionFixture, maximumWorkgroups?: number): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.degree.addToGraph(fixture.commandGraph);
  } else {
    addLuGraphDegreeToGraphWithDispatchLimit(
      fixture.degree,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeMetrics(fixture: DegreeExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({id: 'lu-graph-degree-test'});
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertDegrees(
  tapeTest: Test,
  fixture: DegreeExecutionFixture,
  expected: ExpectedDegrees
): Promise<void> {
  const selectedAdjacency =
    fixture.degree.direction === 'incoming' && fixture.graph.directed
      ? fixture.topology.reverse!
      : fixture.topology.forward;
  const [values, invalidEdgeCount, adjacencyCount, overflow] = await Promise.all([
    readUint32Vector(fixture.degree.output),
    readUint32Vector(fixture.topology.invalidEdgeCount),
    readUint32Vector(selectedAdjacency.count),
    readUint32Vector(selectedAdjacency.overflow)
  ]);
  tapeTest.deepEqual(
    values,
    expected.values,
    'vertex degrees match the complete CPU edge reference'
  );
  tapeTest.equal(
    invalidEdgeCount[0],
    expected.invalidEdgeCount,
    'invalid graph endpoints are excluded'
  );
  tapeTest.equal(
    adjacencyCount[0],
    expected.selectedAdjacencyCount,
    'CSR records the exact edge count'
  );
  tapeTest.equal(
    overflow[0],
    Number(expected.selectedAdjacencyCount > selectedAdjacency.neighbors.length),
    'degree remains exact even when selected neighbor storage overflows'
  );
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

function destroyExecutionFixture(tapeTest: Test, fixture: DegreeExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'destroying graph-owned scratch and borrowed vectors preserves all caller-owned buffers'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
