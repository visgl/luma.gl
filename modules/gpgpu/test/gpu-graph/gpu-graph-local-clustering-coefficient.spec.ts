// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUGraph,
  GPUGraphLocalClusteringCoefficient,
  GPUGraphTopology,
  type GPUGraphAdjacency
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {addGPUGraphLocalClusteringCoefficientToGraphWithDispatchLimit} from '../../src/gpu-graph/gpu-graph-local-clustering-coefficient-internals';

const INVALID_TRIANGLE_COUNT = 0xffffffff;

type ScalarFormat = 'uint32' | 'float32';

type ClusteringScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  weightChunks?: number[][];
  directed?: boolean;
  capacity?: number;
  reverseCapacity?: number;
  triangles?: boolean;
  byteOffset?: number;
  maximumWorkgroups?: number;
  expectedCoefficients?: number[];
  expectedTriangles?: number[];
};

type ExpectedClustering = {
  coefficients: number[];
  triangles: number[];
  forwardCount: number;
  reverseCount: number;
  invalidEdgeCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
};

type ClusteringExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: GPUGraph;
  topology: GPUGraphTopology;
  clustering: GPUGraphLocalClusteringCoefficient;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const clusteringScenarios: ClusteringScenario[] = [
  {
    name: 'empty directed graph preserves empty coefficient and triangle buffers',
    vertexCount: 0,
    sourceChunks: [[], []],
    targetChunks: [[], []]
  },
  {
    name: 'isolated vertices and degree-one neighborhoods have zero clustering',
    vertexCount: 6,
    sourceChunks: [[2], [], [4]],
    targetChunks: [[1], [], [5]],
    expectedCoefficients: [0, 0, 0, 0, 0, 0]
  },
  {
    name: 'undirected triangle publishes three unit coefficients and one incident triangle each',
    vertexCount: 4,
    sourceChunks: [[2, 0], [], [1]],
    targetChunks: [[0, 1], [], [2]],
    directed: false,
    expectedCoefficients: [1, 1, 1, 0],
    expectedTriangles: [1, 1, 1, 0]
  },
  {
    name: 'undirected square diagonal has two-thirds hub clustering and exact incident counts',
    vertexCount: 4,
    sourceChunks: [[3, 0], [], [0, 2, 1]],
    targetChunks: [[0, 1], [], [2, 3, 2]],
    directed: false,
    expectedCoefficients: [2 / 3, 1, 2 / 3, 1],
    expectedTriangles: [2, 1, 2, 1]
  },
  {
    name: 'directed cycle counts one directed closure rather than one undirected neighbor link',
    vertexCount: 4,
    sourceChunks: [[2, 0], [], [1]],
    targetChunks: [[0, 1], [], [2]],
    expectedCoefficients: [0.5, 0.5, 0.5, 0],
    expectedTriangles: [1, 1, 1, 0]
  },
  {
    name: 'reciprocated directed neighbor edges contribute two distinct Graphalytics closures',
    vertexCount: 3,
    sourceChunks: [[0, 2], [], [0, 1]],
    targetChunks: [[1, 1], [], [2, 2]],
    expectedCoefficients: [1, 0.5, 0.5],
    expectedTriangles: [2, 1, 1]
  },
  {
    name: 'official directed Graphalytics validation graph reproduces published coefficients',
    vertexCount: 10,
    sourceChunks: [[0, 0, 1, 1, 1, 2], [], [2, 2, 2, 4, 4, 4, 5, 5, 6, 7, 8]],
    targetChunks: [[2, 4, 3, 4, 9, 0], [], [4, 7, 9, 2, 3, 7, 2, 3, 3, 0, 3]],
    expectedCoefficients: [2 / 3, 1 / 6, 0.15, 0.05, 0.25, 0, 0, 5 / 6, 0, 0],
    expectedTriangles: [4, 1, 3, 1, 5, 0, 0, 5, 0, 0]
  },
  {
    name: 'duplicate and reciprocated CSR neighbors collapse into one distinct weak neighbor',
    vertexCount: 4,
    sourceChunks: [[0, 0, 0], [], [1, 1, 2, 2, 1]],
    targetChunks: [[1, 1, 2], [], [2, 2, 1, 1, 0]],
    expectedCoefficients: [1, 0.5, 1, 0],
    expectedTriangles: [2, 1, 2, 0]
  },
  {
    name: 'self loops and duplicate edges neither create neighbors nor inflate triangle counts',
    vertexCount: 4,
    sourceChunks: [[0, 0, 1], [], [1, 2, 2, 0, 1]],
    targetChunks: [[0, 1, 1], [], [2, 0, 2, 1, 2]],
    expectedCoefficients: [0.5, 0.5, 0.5, 0],
    expectedTriangles: [1, 1, 1, 0]
  },
  {
    name: 'invalid source endpoints cannot create phantom closures or neighbors',
    vertexCount: 4,
    sourceChunks: [[0, 9], [], [1, 2, 7]],
    targetChunks: [[1, 2], [], [2, 0, 8]],
    expectedCoefficients: [0.5, 0.5, 0.5, 0],
    expectedTriangles: [1, 1, 1, 0]
  },
  {
    name: 'weighted graph chunks retain source boundaries while unweighted clustering ignores weights',
    vertexCount: 4,
    sourceChunks: [[2, 0], [], [1]],
    targetChunks: [[0, 1], [], [2]],
    weightChunks: [[0.5, 3], [], [9]],
    directed: false,
    expectedCoefficients: [1, 1, 1, 0]
  },
  {
    name: 'optional triangle count may be omitted without changing exact coefficients',
    vertexCount: 3,
    sourceChunks: [[2, 0], [], [1]],
    targetChunks: [[0, 1], [], [2]],
    triangles: false,
    expectedCoefficients: [0.5, 0.5, 0.5]
  },
  {
    name: 'zero forward capacity fails closed across every coefficient and triangle count',
    vertexCount: 4,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    capacity: 0
  },
  {
    name: 'partially truncated forward adjacency never publishes misleading local clusters',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 0]],
    capacity: 2
  },
  {
    name: 'required reverse-adjacency overflow fails closed even when forward CSR is complete',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 0]],
    reverseCapacity: 0
  },
  {
    name: 'non-256-aligned CSR and coefficient and triangle storage views remain exact',
    vertexCount: 4,
    sourceChunks: [[2, 0], [], [1]],
    targetChunks: [[0, 1], [], [2]],
    byteOffset: 4,
    expectedCoefficients: [0.5, 0.5, 0.5, 0]
  },
  {
    name: 'bounded three-dimensional clustering dispatch reaches the last of 1025 vertices',
    vertexCount: 1025,
    sourceChunks: [[1024, 0, 1]],
    targetChunks: [[0, 1, 1024]],
    maximumWorkgroups: 2
  }
];

for (const scenario of clusteringScenarios) {
  test(`GPUGraphLocalClusteringCoefficient GPU: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedClustering(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileClustering(fixture, scenario.maximumWorkgroups);
      executeClustering(fixture);
      await assertClustering(tapeTest, fixture, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'clustering preserves every original source chunk and its physical allocation'
      );
      if (scenario.expectedCoefficients) {
        for (const [vertexIndex, coefficient] of scenario.expectedCoefficients.entries()) {
          tapeTest.ok(
            Math.abs(expected.coefficients[vertexIndex] - coefficient) < 1e-7,
            `independent CPU oracle matches the explicit Graphalytics coefficient at vertex ${vertexIndex}`
          );
        }
      }
      if (scenario.expectedTriangles) {
        tapeTest.deepEqual(
          expected.triangles,
          scenario.expectedTriangles,
          'independent oracle matches explicit directed closures or undirected incident triangles'
        );
      }
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('GPUGraphLocalClusteringCoefficient rebuilds exact triangles after source updates', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const original: ClusteringScenario = {
    name: 'repeat exact triangle clustering',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [0]]
  };
  const fixture = createExecutionFixture(device, original, calculateExpectedClustering(original));
  const submitSpy = vi.spyOn(device, 'submit');
  const readbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compileClustering(fixture);
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'construction and compilation never submit work'
    );
    tapeTest.ok(
      readbackSpies.every(spy => spy.mock.calls.length === 0),
      'exact local clustering never reads graph source buffers back'
    );
    submitSpy.mockRestore();
    for (const readbackSpy of readbackSpies) readbackSpy.mockRestore();

    executeClustering(fixture);
    await assertClustering(tapeTest, fixture, calculateExpectedClustering(original));

    const sourceBuffer = fixture.graph.sourceVertices.data[0].buffer as Buffer;
    sourceBuffer.write(Uint32Array.from([3, 1]));
    const updated = {...original, sourceChunks: [[3, 1], [], [2]]};
    executeClustering(fixture);
    await assertClustering(tapeTest, fixture, calculateExpectedClustering(updated));
    tapeTest.equal(sourceBuffer, fixture.graph.sourceVertices.data[0].buffer);
  } finally {
    submitSpy.mockRestore();
    for (const readbackSpy of readbackSpies) readbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Independently applies the official weak-neighbor, directed-edge Graphalytics definition. */
function calculateExpectedClustering(scenario: ClusteringScenario): ExpectedClustering {
  const directed = scenario.directed !== false;
  const weakNeighbors: Set<number>[] = Array.from({length: scenario.vertexCount}, () => new Set());
  const directedEdges = new Set<string>();
  let validEdgeCount = 0;
  let forwardCount = 0;
  let invalidEdgeCount = 0;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][rowIndex];
      if (source >= scenario.vertexCount || target >= scenario.vertexCount) {
        invalidEdgeCount++;
        continue;
      }
      validEdgeCount++;
      forwardCount += !directed && source !== target ? 2 : 1;
      if (source === target) continue;
      weakNeighbors[source].add(target);
      weakNeighbors[target].add(source);
      directedEdges.add(`${source}:${target}`);
      if (!directed) directedEdges.add(`${target}:${source}`);
    }
  }

  const reverseCount = directed ? validEdgeCount : 0;
  const forwardOverflow = forwardCount > (scenario.capacity ?? forwardCount);
  const reverseOverflow = directed && reverseCount > (scenario.reverseCapacity ?? reverseCount);
  const failed = forwardOverflow || reverseOverflow;
  const coefficients: number[] = [];
  const triangles: number[] = [];

  for (const neighbors of weakNeighbors) {
    if (failed) {
      coefficients.push(0);
      triangles.push(INVALID_TRIANGLE_COUNT);
      continue;
    }

    let closures = 0;
    for (const firstNeighbor of neighbors) {
      for (const secondNeighbor of neighbors) {
        if (
          firstNeighbor !== secondNeighbor &&
          directedEdges.has(`${firstNeighbor}:${secondNeighbor}`)
        ) {
          closures++;
        }
      }
    }
    const degree = neighbors.size;
    coefficients.push(degree < 2 ? 0 : closures / (degree * (degree - 1)));
    triangles.push(directed ? closures : closures / 2);
  }

  return {
    coefficients,
    triangles,
    forwardCount,
    reverseCount,
    invalidEdgeCount,
    forwardOverflow,
    reverseOverflow
  };
}

function createExecutionFixture(
  device: Device,
  scenario: ClusteringScenario,
  expected: ExpectedClustering
): ClusteringExecutionFixture {
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
    ? createInputVector(device, buffers, vectors, 'weights', 'float32', scenario.weightChunks)
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
  const reverse =
    scenario.directed !== false
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
  const output = createOutputVector(
    device,
    buffers,
    vectors,
    'local-clustering',
    'float32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const triangles =
    scenario.triangles === false
      ? undefined
      : createOutputVector(
          device,
          buffers,
          vectors,
          'triangle-counts',
          'uint32',
          scenario.vertexCount,
          scenario.byteOffset
        );
  const clustering = new GPUGraphLocalClusteringCoefficient({topology, output, triangles});

  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    clustering,
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

function compileClustering(fixture: ClusteringExecutionFixture, maximumWorkgroups?: number): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.clustering.addToGraph(fixture.commandGraph);
  } else {
    addGPUGraphLocalClusteringCoefficientToGraphWithDispatchLimit(
      fixture.clustering,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeClustering(fixture: ClusteringExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({
    id: 'gpu-graph-local-clustering-test'
  });
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertClustering(
  tapeTest: Test,
  fixture: ClusteringExecutionFixture,
  expected: ExpectedClustering
): Promise<void> {
  const [coefficients, triangles, invalidEdgeCount, forwardOverflow, reverseOverflow] =
    await Promise.all([
      readFloat32Vector(fixture.clustering.output),
      fixture.clustering.triangles
        ? readUint32Vector(fixture.clustering.triangles)
        : Promise.resolve(undefined),
      readUint32Vector(fixture.topology.invalidEdgeCount),
      readUint32Vector(fixture.topology.forward.overflow),
      fixture.topology.reverse
        ? readUint32Vector(fixture.topology.reverse.overflow)
        : Promise.resolve(undefined)
    ]);

  tapeTest.equal(coefficients.length, expected.coefficients.length);
  for (const [vertexIndex, coefficient] of coefficients.entries()) {
    tapeTest.ok(
      Math.abs(coefficient - expected.coefficients[vertexIndex]) < 1e-6,
      `vertex ${vertexIndex} coefficient matches the independent Graphalytics directed-edge oracle`
    );
  }
  if (triangles) {
    tapeTest.deepEqual(
      triangles,
      expected.triangles,
      'unsigned counts distinguish directed closures from undirected incident triangles'
    );
  }
  tapeTest.equal(invalidEdgeCount[0], expected.invalidEdgeCount);
  tapeTest.equal(forwardOverflow[0], Number(expected.forwardOverflow));
  if (reverseOverflow) tapeTest.equal(reverseOverflow[0], Number(expected.reverseOverflow));
  if (expected.forwardOverflow || expected.reverseOverflow) {
    tapeTest.ok(coefficients.every(coefficient => coefficient === 0));
    if (triangles) tapeTest.ok(triangles.every(count => count === INVALID_TRIANGLE_COUNT));
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

function destroyExecutionFixture(tapeTest: Test, fixture: ClusteringExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'compiled clustering graphs and borrowed vectors never destroy caller-owned buffers'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
