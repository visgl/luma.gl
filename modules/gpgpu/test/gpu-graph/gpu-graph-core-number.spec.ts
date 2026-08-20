// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUGraph,
  GPUGraphCoreNumber,
  GPUGraphTopology,
  type GPUGraphAdjacency
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addGPUGraphCoreNumberToGraphWithDispatchLimit,
  getGPUGraphCoreNumberDispatchLayout
} from '../../src/gpu-graph/gpu-graph-core-number-internals';

const INVALID_CORE_NUMBER = 0xffffffff;

type ScalarFormat = 'uint32' | 'float32';

type CoreNumberScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  weightChunks?: number[][];
  directed?: boolean;
  iterations?: number;
  convergence?: boolean;
  degeneracy?: boolean;
  capacity?: number;
  reverseCapacity?: number;
  byteOffset?: number;
  maximumWorkgroups?: number;
  expectedCoreNumbers?: number[];
};

type ExpectedCoreNumbers = {
  output: number[];
  exactCoreNumbers: number[];
  converged: boolean;
  degeneracy: number;
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
};

type CoreNumberExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: GPUGraph;
  topology: GPUGraphTopology;
  operation: GPUGraphCoreNumber;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const coreNumberScenarios: CoreNumberScenario[] = [
  {
    name: 'empty directed graph publishes an empty exact core and zero graph degeneracy',
    vertexCount: 0,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    expectedCoreNumbers: []
  },
  {
    name: 'empty graphs do not require optional convergence or degeneracy outputs',
    vertexCount: 0,
    sourceChunks: [[]],
    targetChunks: [[]],
    convergence: false,
    degeneracy: false,
    expectedCoreNumbers: []
  },
  {
    name: 'isolated vertices have exact core number and degeneracy zero',
    vertexCount: 5,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    expectedCoreNumbers: [0, 0, 0, 0, 0]
  },
  {
    name: 'undirected edge endpoints both belong to the one-core',
    vertexCount: 3,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    directed: false,
    expectedCoreNumbers: [1, 1, 0]
  },
  {
    name: 'high-degree star hubs collapse to the same one-core as their leaves',
    vertexCount: 7,
    sourceChunks: [[0, 0, 0], [], [0, 0, 0]],
    targetChunks: [[1, 2, 3], [], [4, 5, 6]],
    directed: false,
    expectedCoreNumbers: [1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'cycles have exact core number two at every vertex',
    vertexCount: 5,
    sourceChunks: [[0, 1], [], [2, 3, 4]],
    targetChunks: [[1, 2], [], [3, 4, 0]],
    directed: false,
    expectedCoreNumbers: [2, 2, 2, 2, 2]
  },
  {
    name: 'a four-clique has core number and graph degeneracy three',
    vertexCount: 4,
    sourceChunks: [[0, 0, 0], [], [1, 1, 2]],
    targetChunks: [[1, 2, 3], [], [2, 3, 3]],
    directed: false,
    expectedCoreNumbers: [3, 3, 3, 3]
  },
  {
    name: 'pendant leaves peel away while a dense clique keeps its three-core',
    vertexCount: 7,
    sourceChunks: [[0, 0, 0, 1], [], [1, 2, 0, 1, 4]],
    targetChunks: [[1, 2, 3, 2], [], [3, 3, 4, 5, 6]],
    directed: false,
    expectedCoreNumbers: [3, 3, 3, 3, 1, 1, 1]
  },
  {
    name: 'disconnected cycles, paths, and isolated vertices publish distinct exact shells',
    vertexCount: 8,
    sourceChunks: [[0, 1, 2], [], [3, 4, 5]],
    targetChunks: [[1, 2, 0], [], [4, 5, 6]],
    directed: false,
    expectedCoreNumbers: [2, 2, 2, 1, 1, 1, 1, 0]
  },
  {
    name: 'directed inputs use distinct weak neighbors rather than directed in-plus-out degree',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [0]],
    expectedCoreNumbers: [2, 2, 2, 0]
  },
  {
    name: 'reciprocal edges, repeated source rows, and self-loops preserve simple-graph cores',
    vertexCount: 4,
    sourceChunks: [[0, 1, 0, 1], [], [0, 2, 2, 3, 3]],
    targetChunks: [[1, 0, 1, 2], [], [2, 0, 2, 3, 3]],
    expectedCoreNumbers: [2, 2, 2, 0]
  },
  {
    name: 'weighted source and CSR columns are preserved but do not affect coreness',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 0]],
    weightChunks: [[100, 0, 0.25]],
    expectedCoreNumbers: [2, 2, 2, 0]
  },
  {
    name: 'invalid endpoints remain excluded from exact weak-simple neighborhoods',
    vertexCount: 4,
    sourceChunks: [[0, 9], [], [1, 2]],
    targetChunks: [[1, 2], [], [2, 0]],
    expectedCoreNumbers: [2, 2, 2, 0]
  },
  {
    name: 'zero refinement rounds publish distinct-degree upper bounds without false convergence',
    vertexCount: 5,
    sourceChunks: [[0, 0, 0, 0]],
    targetChunks: [[1, 2, 3, 4]],
    iterations: 0,
    expectedCoreNumbers: [1, 1, 1, 1, 1]
  },
  {
    name: 'one synchronized round can leave path-center core bounds above their final values',
    vertexCount: 7,
    sourceChunks: [[0, 1, 2], [], [3, 4, 5]],
    targetChunks: [[1, 2, 3], [], [4, 5, 6]],
    directed: false,
    iterations: 1,
    expectedCoreNumbers: [1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'self-loop-only zero-round graphs report conservative nonconvergence despite zero cores',
    vertexCount: 2,
    sourceChunks: [[0, 1]],
    targetChunks: [[0, 1]],
    iterations: 0,
    expectedCoreNumbers: [0, 0]
  },
  {
    name: 'optional caller-visible convergence status may be omitted',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 0]],
    convergence: false,
    expectedCoreNumbers: [2, 2, 2, 0]
  },
  {
    name: 'optional caller-visible degeneracy output may be omitted',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 0]],
    degeneracy: false,
    expectedCoreNumbers: [2, 2, 2, 0]
  },
  {
    name: 'forward directed overflow fails closed for every core and graph degeneracy',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    capacity: 1
  },
  {
    name: 'reverse directed overflow fails closed instead of publishing partial weak neighborhoods',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    reverseCapacity: 1
  },
  {
    name: 'undirected symmetrized CSR overflow publishes explicit invalid-core sentinels',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    directed: false,
    capacity: 2
  },
  {
    name: 'caller-owned four-byte CSR, output, status, and reduction slices remain aligned',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 0]],
    byteOffset: 4,
    expectedCoreNumbers: [2, 2, 2, 0]
  },
  {
    name: 'bounded three-dimensional dispatch reaches the final source and isolated vertices',
    vertexCount: 1025,
    sourceChunks: [[1024]],
    targetChunks: [[512]],
    iterations: 1,
    maximumWorkgroups: 2
  }
];

test('GPUGraphCoreNumber plans bounded three-dimensional graph dispatch', tapeTest => {
  tapeTest.deepEqual(getGPUGraphCoreNumberDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphCoreNumberDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getGPUGraphCoreNumberDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(() => getGPUGraphCoreNumberDispatchLayout(2049, 2), /3D dispatch limit/);
  tapeTest.end();
});

for (const scenario of coreNumberScenarios) {
  test(`GPUGraphCoreNumber GPU decomposition: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedCoreNumbers(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileCoreNumber(fixture, scenario.maximumWorkgroups);
      executeCoreNumber(fixture);
      await assertCoreNumbers(tapeTest, fixture, expected, scenario);
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }
    tapeTest.end();
  });
}

test('GPUGraphCoreNumber rereads caller-owned edge columns on each graph encoding', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const initial: CoreNumberScenario = {
    name: 'triangle',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 0]]
  };
  const expectedInitial = calculateExpectedCoreNumbers(initial);
  const fixture = createExecutionFixture(device, initial, expectedInitial);
  try {
    compileCoreNumber(fixture);
    executeCoreNumber(fixture);
    await assertCoreNumbers(tapeTest, fixture, expectedInitial, initial);

    const updated: CoreNumberScenario = {
      ...initial,
      name: 'path',
      targetChunks: [[1, 2, 3]]
    };
    (fixture.graph.targetVertices.data[0].buffer as Buffer).write(Uint32Array.from([1, 2, 3]));
    executeCoreNumber(fixture);
    await assertCoreNumbers(tapeTest, fixture, calculateExpectedCoreNumbers(updated), updated);
  } finally {
    destroyExecutionFixture(tapeTest, fixture);
  }
  tapeTest.end();
});

test('GPUGraphCoreNumber schedules GPU work without submission or source readback', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const scenario: CoreNumberScenario = {
    name: 'command ownership',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 0]]
  };
  const expected = calculateExpectedCoreNumbers(scenario);
  const fixture = createExecutionFixture(device, scenario, expected);
  const submit = vi.spyOn(device, 'submit');
  const sourceBuffers = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ];
  const readbacks = sourceBuffers.map(chunk => vi.spyOn(chunk.buffer as Buffer, 'readAsync'));
  try {
    compileCoreNumber(fixture);
    tapeTest.equal(submit.mock.calls.length, 0, 'construction and compilation never submit work');
    executeCoreNumber(fixture);
    await assertCoreNumbers(tapeTest, fixture, expected, scenario);
    tapeTest.ok(
      readbacks.every(readback => readback.mock.calls.length === 0),
      'source and adjacency data remain resident on the caller-owned device'
    );
  } finally {
    submit.mockRestore();
    for (const readback of readbacks) readback.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }
  tapeTest.end();
});

/** Independently builds simple weak neighborhoods and compares bounded H-index to exact peeling. */
function calculateExpectedCoreNumbers(scenario: CoreNumberScenario): ExpectedCoreNumbers {
  const weakNeighbors = Array.from({length: scenario.vertexCount}, () => new Set<number>());
  let invalidEdgeCount = 0;
  let forwardCount = 0;
  let reverseCount = 0;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [edgeIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][edgeIndex];
      if (source >= scenario.vertexCount || target >= scenario.vertexCount) {
        invalidEdgeCount++;
        continue;
      }
      forwardCount++;
      if (scenario.directed === false) {
        if (source !== target) forwardCount++;
      } else {
        reverseCount++;
      }
      if (source !== target) {
        weakNeighbors[source].add(target);
        weakNeighbors[target].add(source);
      }
    }
  }

  const exactCoreNumbers = calculateExactPeeling(weakNeighbors);
  const forwardOverflow = forwardCount > (scenario.capacity ?? forwardCount);
  const reverseOverflow =
    scenario.directed !== false && reverseCount > (scenario.reverseCapacity ?? reverseCount);
  const invalid = forwardOverflow || reverseOverflow;
  let output = invalid
    ? new Array<number>(scenario.vertexCount).fill(INVALID_CORE_NUMBER)
    : weakNeighbors.map(neighbors => neighbors.size);
  const edgeCount = scenario.sourceChunks.reduce((total, chunk) => total + chunk.length, 0);
  let converged = !invalid && (scenario.vertexCount === 0 || edgeCount === 0);
  const iterations = scenario.iterations ?? 32;

  for (let iteration = 0; iteration < iterations && scenario.vertexCount > 0; iteration++) {
    if (invalid) {
      converged = false;
      continue;
    }
    if (converged) continue;

    const next = output.map((previous, vertex) => {
      for (let candidate = previous; candidate >= 1; candidate--) {
        let support = 0;
        for (const neighbor of weakNeighbors[vertex]) {
          if (output[neighbor] >= candidate) support++;
        }
        if (support >= candidate) return candidate;
      }
      return 0;
    });
    converged = next.every((value, vertex) => value === output[vertex]);
    output = next;
  }

  return {
    output,
    exactCoreNumbers,
    converged,
    degeneracy: output.length === 0 ? 0 : Math.max(...output),
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow
  };
}

/** Peels an independent mutable simple graph to obtain exact reference coreness. */
function calculateExactPeeling(neighborhoods: readonly ReadonlySet<number>[]): number[] {
  const remaining = new Set(neighborhoods.map((_, vertex) => vertex));
  const degrees = neighborhoods.map(neighbors => neighbors.size);
  const result = new Array<number>(neighborhoods.length).fill(0);
  let threshold = 0;

  while (remaining.size > 0) {
    const vertex = [...remaining].find(candidate => degrees[candidate] <= threshold);
    if (vertex === undefined) {
      threshold++;
      continue;
    }
    remaining.delete(vertex);
    result[vertex] = threshold;
    for (const neighbor of neighborhoods[vertex]) {
      if (remaining.has(neighbor)) degrees[neighbor]--;
    }
  }
  return result;
}

function createExecutionFixture(
  device: Device,
  scenario: CoreNumberScenario,
  expected: ExpectedCoreNumbers
): CoreNumberExecutionFixture {
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
  const directed = scenario.directed ?? true;
  const graph = new GPUGraph({
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
  const topology = new GPUGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const output = createOutputVector(
    device,
    buffers,
    vectors,
    'core-numbers',
    'uint32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const converged =
    scenario.convergence === false
      ? undefined
      : createOutputVector(device, buffers, vectors, 'converged', 'uint32', 1, scenario.byteOffset);
  const degeneracy =
    scenario.degeneracy === false
      ? undefined
      : createOutputVector(
          device,
          buffers,
          vectors,
          'degeneracy',
          'uint32',
          1,
          scenario.byteOffset
        );
  const operation = new GPUGraphCoreNumber({
    topology,
    output,
    iterations: scenario.iterations,
    converged,
    degeneracy
  });
  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    operation,
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
            `${name}-weights`,
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

function compileCoreNumber(fixture: CoreNumberExecutionFixture, maximumWorkgroups?: number): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.operation.addToGraph(fixture.commandGraph);
  } else {
    addGPUGraphCoreNumberToGraphWithDispatchLimit(
      fixture.operation,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeCoreNumber(fixture: CoreNumberExecutionFixture): void {
  const encoder = fixture.device.createCommandEncoder({id: 'gpu-graph-core-number-test'});
  fixture.compiled!.encode(encoder, {parameters: undefined});
  fixture.device.submit(encoder.finish());
}

async function assertCoreNumbers(
  tapeTest: Test,
  fixture: CoreNumberExecutionFixture,
  expected: ExpectedCoreNumbers,
  scenario: CoreNumberScenario
): Promise<void> {
  const [output, invalidEdges, forwardOverflow] = await Promise.all([
    readUint32Vector(fixture.operation.output),
    readUint32Vector(fixture.topology.invalidEdgeCount),
    readUint32Vector(fixture.topology.forward.overflow)
  ]);
  tapeTest.deepEqual(
    output,
    expected.output,
    'bounded GPU core numbers match synchronous H-indices'
  );
  tapeTest.equal(
    invalidEdges[0],
    expected.invalidEdgeCount,
    'invalid source endpoints are excluded'
  );
  tapeTest.equal(
    forwardOverflow[0],
    Number(expected.forwardOverflow),
    'forward overflow stays explicit'
  );
  if (scenario.expectedCoreNumbers) {
    tapeTest.deepEqual(
      expected.exactCoreNumbers,
      scenario.expectedCoreNumbers,
      'independent simple-graph peeling produces the documented exact shell numbers'
    );
  }
  if (!expected.forwardOverflow && !expected.reverseOverflow) {
    tapeTest.ok(
      output.every((value, vertex) => value >= expected.exactCoreNumbers[vertex]),
      'bounded, unconverged output remains a valid upper bound on exact core numbers'
    );
    if (expected.converged) {
      tapeTest.deepEqual(
        output,
        expected.exactCoreNumbers,
        'converged H-indices equal exact peeling'
      );
    }
  }
  if (fixture.operation.converged) {
    const converged = await readUint32Vector(fixture.operation.converged);
    tapeTest.equal(converged[0], Number(expected.converged), 'fixed-point convergence is truthful');
  }
  if (fixture.operation.degeneracy) {
    const degeneracy = await readUint32Vector(fixture.operation.degeneracy);
    tapeTest.equal(
      degeneracy[0],
      expected.degeneracy,
      'GPU max reduction reports graph degeneracy'
    );
  }
  if (fixture.topology.reverse) {
    const reverseOverflow = await readUint32Vector(fixture.topology.reverse.overflow);
    tapeTest.equal(
      reverseOverflow[0],
      Number(expected.reverseOverflow),
      'reverse overflow stays explicit'
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

function destroyExecutionFixture(tapeTest: Test, fixture: CoreNumberExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'destroying graph-owned scratch never destroys caller-owned source or output buffers'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
