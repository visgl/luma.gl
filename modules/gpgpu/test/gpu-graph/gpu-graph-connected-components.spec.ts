// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUGraph,
  GPUGraphConnectedComponents,
  GPUGraphTopology,
  type GPUGraphAdjacency
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addGPUGraphConnectedComponentsToGraphWithDispatchLimit,
  getGPUGraphConnectedComponentsDispatchLayout
} from '../../src/gpu-graph/gpu-graph-connected-components-internals';

const INVALID_COMPONENT = 0xffffffff;

type ScalarFormat = 'uint32' | 'float32';

type ComponentsScenario = {
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
  incomplete?: boolean;
  allowPartialLabels?: boolean;
  maximumWorkgroups?: number;
  byteOffset?: number;
  assertNoScratch?: boolean;
};

type ExpectedComponents = {
  labels: number[];
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
};

type ComponentsExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: GPUGraph;
  topology: GPUGraphTopology;
  components: GPUGraphConnectedComponents;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const componentsScenarios: ComponentsScenario[] = [
  {
    name: 'empty graphs publish a converged status and preserve zero-length label ownership',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    capacity: 0
  },
  {
    name: 'empty graphs without convergence status do not require component work',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    capacity: 0,
    status: false
  },
  {
    name: 'isolated vertices retain their own stable component identifiers',
    vertexCount: 7,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    capacity: 0,
    iterations: 1
  },
  {
    name: 'directed edges form weak components without requiring reverse CSR adjacency',
    vertexCount: 6,
    sourceChunks: [[3, 2], [], [1]],
    targetChunks: [[2, 1], [], [0]],
    iterations: 6,
    assertNoScratch: true
  },
  {
    name: 'disconnected directed components select their lowest stable vertex identifier',
    vertexCount: 8,
    sourceChunks: [[4, 3], [], [6]],
    targetChunks: [[1, 2], [], [5]],
    iterations: 4
  },
  {
    name: 'cycles, duplicate edges, diamonds, and self-loops converge deterministically',
    vertexCount: 8,
    sourceChunks: [[4, 3, 3], [], [1, 2, 2, 6]],
    targetChunks: [[3, 2, 2], [], [2, 4, 2, 6]],
    iterations: 8
  },
  {
    name: 'weighted undirected chunks preserve minimum IDs while ignoring edge weights',
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
    name: 'reverse adjacency overflow is irrelevant to forward-only weak connectivity',
    vertexCount: 5,
    sourceChunks: [[0, 1, 3]],
    targetChunks: [[1, 2, 4]],
    reverse: true,
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
    name: 'partial forward adjacency also fails closed without exposing partial components',
    vertexCount: 5,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    capacity: 2,
    iterations: 4
  },
  {
    name: 'a final changed iteration conservatively reports incomplete even if labels are canonical',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    iterations: 1,
    incomplete: true
  },
  {
    name: 'a bounded long-chain iteration exposes only valid monotone partial component labels',
    vertexCount: 12,
    sourceChunks: [[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]],
    targetChunks: [[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]],
    iterations: 1,
    incomplete: true,
    allowPartialLabels: true
  },
  {
    name: 'a no-change final iteration proves convergence after component hooking',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    iterations: 2
  },
  {
    name: 'non-256-aligned CSR offsets, component labels, and convergence status stay correct',
    vertexCount: 5,
    sourceChunks: [[3, 1]],
    targetChunks: [[2, 0]],
    iterations: 4,
    byteOffset: 4
  },
  {
    name: 'bounded three-dimensional hooking reaches the final of 1025 vertices',
    vertexCount: 1025,
    sourceChunks: [[1024]],
    targetChunks: [[0]],
    iterations: 2,
    maximumWorkgroups: 2
  }
];

test('GPUGraphConnectedComponents plans bounded three-dimensional vertex dispatch', tapeTest => {
  tapeTest.deepEqual(getGPUGraphConnectedComponentsDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphConnectedComponentsDispatchLayout(512, 2), {x: 2, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphConnectedComponentsDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getGPUGraphConnectedComponentsDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(() => getGPUGraphConnectedComponentsDispatchLayout(2049, 2), /3D dispatch limit/);
  tapeTest.end();
});

for (const scenario of componentsScenarios) {
  test(`GPUGraphConnectedComponents GPU labeling: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedComponents(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileComponents(fixture, scenario.maximumWorkgroups);
      executeComponents(fixture);
      await assertComponents(tapeTest, fixture, scenario, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'weak-component evaluation preserves every original source chunk'
      );
      if (scenario.assertNoScratch) {
        tapeTest.equal(
          fixture.compiled?.stats.logicalTransientBufferCount,
          3,
          'weak-component hooking allocates no scratch beyond CSR topology construction'
        );
      }
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('GPUGraphConnectedComponents rebuilds weak labels after source updates without hidden execution', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const original: ComponentsScenario = {
    name: 'repeat weak components',
    vertexCount: 6,
    sourceChunks: [[0, 1], [], [3, 4]],
    targetChunks: [[1, 2], [], [4, 5]],
    iterations: 5
  };
  const fixture = createExecutionFixture(device, original, calculateExpectedComponents(original));
  const submitSpy = vi.spyOn(device, 'submit');
  const sourceReadbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compileComponents(fixture);
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'construction and compilation never submit work'
    );
    tapeTest.ok(
      sourceReadbackSpies.every(spy => spy.mock.calls.length === 0),
      'weak connectivity never reads graph source buffers back'
    );
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();

    executeComponents(fixture);
    await assertComponents(tapeTest, fixture, original, calculateExpectedComponents(original));

    const sourceBuffer = fixture.graph.sourceVertices.data[0].buffer as Buffer;
    sourceBuffer.write(Uint32Array.from([9, 1]));
    const updated = {...original, sourceChunks: [[9, 1], [], [3, 4]]};
    executeComponents(fixture);
    await assertComponents(tapeTest, fixture, updated, calculateExpectedComponents(updated));
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

/** Computes weak connected components with minimum stable vertex IDs using CPU union-find. */
function calculateExpectedComponents(scenario: ComponentsScenario): ExpectedComponents {
  const parents = Array.from({length: scenario.vertexCount}, (_, vertexIndex) => vertexIndex);
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
      forwardCount += scenario.directed === false && source !== target ? 2 : 1;
      mergeComponents(parents, source, target);
    }
  }

  const labels = parents.map((_parent, vertexIndex) => findComponentRoot(parents, vertexIndex));
  const forwardOverflow = forwardCount > (scenario.capacity ?? forwardCount);
  const reverseCount = scenario.reverse ? validEdgeCount : 0;
  const reverseOverflow = reverseCount > (scenario.reverseCapacity ?? reverseCount);

  return {
    labels: forwardOverflow ? new Array(scenario.vertexCount).fill(INVALID_COMPONENT) : labels,
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow
  };
}

function findComponentRoot(parents: number[], vertex: number): number {
  let root = vertex;
  while (parents[root] !== root) root = parents[root];
  return root;
}

function mergeComponents(parents: number[], source: number, target: number): void {
  const sourceRoot = findComponentRoot(parents, source);
  const targetRoot = findComponentRoot(parents, target);
  if (sourceRoot !== targetRoot) {
    parents[Math.max(sourceRoot, targetRoot)] = Math.min(sourceRoot, targetRoot);
  }
}

function createExecutionFixture(
  device: Device,
  scenario: ComponentsScenario,
  expected: ExpectedComponents
): ComponentsExecutionFixture {
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
  const output = createOutputVector(
    device,
    buffers,
    vectors,
    'component-identifiers',
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
          'components-converged',
          'uint32',
          1,
          scenario.byteOffset
        );
  const components = new GPUGraphConnectedComponents({
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
    components,
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

function compileComponents(fixture: ComponentsExecutionFixture, maximumWorkgroups?: number): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.components.addToGraph(fixture.commandGraph);
  } else {
    addGPUGraphConnectedComponentsToGraphWithDispatchLimit(
      fixture.components,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeComponents(fixture: ComponentsExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({id: 'gpu-graph-components-test'});
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertComponents(
  tapeTest: Test,
  fixture: ComponentsExecutionFixture,
  scenario: ComponentsScenario,
  expected: ExpectedComponents
): Promise<void> {
  const [labels, convergence, invalidEdgeCount, forwardOverflow, reverseOverflow] =
    await Promise.all([
      readUint32Vector(fixture.components.output),
      fixture.components.converged
        ? readUint32Vector(fixture.components.converged)
        : Promise.resolve(undefined),
      readUint32Vector(fixture.topology.invalidEdgeCount),
      readUint32Vector(fixture.topology.forward.overflow),
      fixture.topology.reverse
        ? readUint32Vector(fixture.topology.reverse.overflow)
        : Promise.resolve(undefined)
    ]);

  if (scenario.allowPartialLabels && !expected.forwardOverflow) {
    tapeTest.ok(
      labels.every(
        (label, vertexIndex) =>
          label <= vertexIndex && expected.labels[label] === expected.labels[vertexIndex]
      ),
      'bounded iterations preserve monotone labels inside each true weak component'
    );
  } else {
    tapeTest.deepEqual(labels, expected.labels, 'component IDs equal each weak component minimum');
  }

  if (convergence) {
    const expectedConvergence = Number(!expected.forwardOverflow && !scenario.incomplete);
    tapeTest.equal(
      convergence[0],
      expectedConvergence,
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
      'unused reverse overflow does not invalidate weak components'
    );
  }
  if (expected.forwardOverflow) {
    tapeTest.ok(
      labels.every(label => label === INVALID_COMPONENT),
      'truncated forward adjacency publishes no misleading partial labels'
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

function destroyExecutionFixture(tapeTest: Test, fixture: ComponentsExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'compiled component graphs and borrowed vectors never destroy caller-owned buffers'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
