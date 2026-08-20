// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphForceLayout,
  GPUGraphTopology,
  type GPUGraphAdjacency
} from '@luma.gl/experimental/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addGPUGraphForceLayoutToGraphWithDispatchLimit,
  getGPUGraphForceLayoutDispatchLayout
} from '../../src/gpu-graph/gpu-graph-force-layout-internals';

const PHYSICS_TOLERANCE = 1e-4;
const MINIMUM_SQUARED_DISTANCE = 0.0001;

type ScalarFormat = 'uint32' | 'float32';

type ForceLayoutScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  positions: number[];
  velocities?: number[];
  pinned?: number[];
  reset?: number;
  seed?: number;
  directed?: boolean;
  weightChunks?: number[][];
  iterationsPerFrame?: number;
  repulsion?: number;
  attraction?: number;
  gravity?: number;
  damping?: number;
  maxVelocity?: number;
  timeStep?: number;
  capacity?: number;
  reverseCapacity?: number;
  maximumWorkgroups?: number;
  byteOffset?: number;
  assertNoScratch?: boolean;
};

type ExpectedForceLayout = {
  positions: number[];
  velocities: number[];
  reset?: number;
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
  failed: boolean;
};

type LayoutExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: GPUGraph;
  topology: GPUGraphTopology;
  layout: GPUGraphForceLayout;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const layoutScenarios: ForceLayoutScenario[] = [
  {
    name: 'empty undirected layouts do not require reverse adjacency or nonempty vertex passes',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    positions: [],
    directed: false,
    iterationsPerFrame: 1
  },
  {
    name: 'empty directed layouts consume and clear an optional deterministic reset scalar',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    positions: [],
    reset: 1,
    iterationsPerFrame: 1
  },
  {
    name: 'an isolated vertex combines gravity, prior velocity, damping, and timestep',
    vertexCount: 1,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [2, -4],
    velocities: [0.5, 0.25],
    gravity: 0.2,
    damping: 0.8,
    timeStep: 0.5,
    maxVelocity: 10,
    iterationsPerFrame: 2
  },
  {
    name: 'exact all-pairs repulsion moves disconnected vertices in opposite directions',
    vertexCount: 2,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [-1, 0, 1, 0],
    gravity: 0,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1
  },
  {
    name: 'coincident vertices remain finite under softened exact repulsion',
    vertexCount: 3,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [0, 0, 0, 0, 1, 0],
    gravity: 0,
    maxVelocity: 10,
    iterationsPerFrame: 1
  },
  {
    name: 'directed forward and reverse CSR produce symmetric endpoint spring attraction',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    positions: [-2, 0, 2, 0],
    repulsion: 0,
    gravity: 0,
    attraction: 0.25,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1,
    assertNoScratch: true
  },
  {
    name: 'undirected attraction consumes symmetric forward adjacency only once',
    vertexCount: 3,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    positions: [-2, 0, 0, 1, 2, 0],
    directed: false,
    repulsion: 0,
    attraction: 0.2,
    gravity: 0,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 2
  },
  {
    name: 'duplicate edges strengthen springs while self-loops contribute no displacement',
    vertexCount: 3,
    sourceChunks: [[0, 0], [], [1, 2]],
    targetChunks: [[1, 1], [], [1, 0]],
    positions: [-1, 0, 1, 0, 0, 2],
    repulsion: 0,
    gravity: 0,
    attraction: 0.2,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1
  },
  {
    name: 'existing weighted topology is explicitly treated as unweighted spring adjacency',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [3]],
    weightChunks: [[0.001, 100], [], [42]],
    positions: [0, 0, 1, 0, 1, 1, -1, 0],
    gravity: 0.03,
    maxVelocity: 5,
    iterationsPerFrame: 2
  },
  {
    name: 'invalid source endpoints are excluded while original source chunk boundaries survive',
    vertexCount: 5,
    sourceChunks: [[0, 8], [], [2, 3, 4]],
    targetChunks: [[1, 2], [], [9, 4, 4]],
    positions: [-2, 0, -1, 1, 0, 0, 1, -1, 2, 0],
    iterationsPerFrame: 2
  },
  {
    name: 'pinned vertices retain their exact positions and publish zero velocity',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    positions: [-2, 1, -1, 0, 1, 0, 3, -1],
    velocities: [1, 2, 0.5, -1, 0, 0, -3, 4],
    pinned: [1, 0, 0, 9],
    gravity: 0.1,
    maxVelocity: 10,
    iterationsPerFrame: 3
  },
  {
    name: 'Euclidean velocity clipping bounds per-step displacement without changing direction',
    vertexCount: 2,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [0, 0, 0.01, 0],
    repulsion: 100,
    gravity: 0,
    damping: 1,
    maxVelocity: 0.125,
    timeStep: 0.5,
    iterationsPerFrame: 1
  },
  {
    name: 'zero damping clears existing velocities and prevents all displacement',
    vertexCount: 3,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    positions: [-1, 0, 0, 1, 1, 0],
    velocities: [4, -5, 1, 2, -3, 7],
    damping: 0,
    iterationsPerFrame: 2
  },
  {
    name: 'a GPU reset deterministically initializes coordinates from the exact uint32 seed',
    vertexCount: 5,
    sourceChunks: [[0, 2]],
    targetChunks: [[1, 3]],
    positions: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    velocities: [3, 3, 2, 2, 1, 1, 4, 4, 5, 5],
    reset: 1,
    seed: 123456789,
    iterationsPerFrame: 2
  },
  {
    name: 'deterministic reset preserves pinned coordinates and zeroes pinned velocities',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [3]],
    positions: [9, -3, 2, 4, -8, 1, 7, 6],
    pinned: [1, 0, 2, 0],
    reset: 17,
    seed: 42,
    iterationsPerFrame: 2
  },
  {
    name: 'a cleared GPU reset scalar preserves caller-seeded warm-start coordinates',
    vertexCount: 3,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    positions: [2, 0, -1, 1, 0, -2],
    velocities: [0.5, 0, 0, -0.5, 0.25, 0.25],
    reset: 0,
    seed: 99,
    iterationsPerFrame: 1
  },
  {
    name: 'forward CSR overflow preserves render positions and clears simulation velocities',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    positions: [-2, 1, 0, 0, 1, -1, 3, 2],
    velocities: [1, 2, 3, 4, 5, 6, 7, 8],
    capacity: 1,
    iterationsPerFrame: 2
  },
  {
    name: 'reverse overflow also preserves positions, suppresses reset, and clears its scalar',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    positions: [-2, 1, 0, 0, 1, -1, 3, 2],
    velocities: [1, 2, 3, 4, 5, 6, 7, 8],
    reset: 1,
    seed: 7,
    reverseCapacity: 1,
    iterationsPerFrame: 2
  },
  {
    name: 'undirected forward overflow leaves vertex render attributes untouched',
    vertexCount: 3,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    positions: [-1, 0, 0, 1, 1, 0],
    directed: false,
    capacity: 2,
    iterationsPerFrame: 1
  },
  {
    name: 'packed float32x2 storage and render views support four-byte non-256-aligned offsets',
    vertexCount: 4,
    sourceChunks: [[0, 2]],
    targetChunks: [[1, 3]],
    positions: [-2, 0, -1, 1, 1, -1, 2, 0],
    velocities: [0.25, 0, 0, -0.25, 0.1, 0.2, 0, 0],
    pinned: [0, 1, 0, 0],
    reset: 0,
    byteOffset: 4,
    iterationsPerFrame: 2
  },
  {
    name: 'bounded 3D tiled exact repulsion and incident springs process 1025 vertices',
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
    positions: Array.from({length: 2050}, (_, coordinateIndex) =>
      coordinateIndex % 2 === 0 ? Math.floor(coordinateIndex / 2) / 1024 : 0
    ),
    repulsion: 0.001,
    gravity: 0,
    maxVelocity: 0.5,
    iterationsPerFrame: 1,
    maximumWorkgroups: 2
  }
];

test('GPUGraphForceLayout plans bounded three-dimensional exact repulsion dispatch', tapeTest => {
  tapeTest.deepEqual(getGPUGraphForceLayoutDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphForceLayoutDispatchLayout(512, 2), {x: 2, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphForceLayoutDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getGPUGraphForceLayoutDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(() => getGPUGraphForceLayoutDispatchLayout(2049, 2), /3D dispatch limit/);
  tapeTest.end();
});

for (const scenario of layoutScenarios) {
  test(`GPUGraphForceLayout exact GPU physics: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedForceLayout(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileLayout(fixture, scenario.maximumWorkgroups);
      executeLayout(fixture);
      await assertForceLayout(tapeTest, fixture, scenario, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'exact GPU layout preserves caller-owned source chunks and empty record batches'
      );
      if (scenario.assertNoScratch) {
        tapeTest.equal(
          fixture.compiled?.stats.logicalTransientBufferCount,
          6,
          'exact force and integration passes allocate no scratch beyond forward/reverse CSR'
        );
      }
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('GPUGraphForceLayout progressively warm-starts and repeats deterministic seeded reset', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const initial: ForceLayoutScenario = {
    name: 'progressive deterministic layout',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [3]],
    positions: [9, 8, 7, 6, 5, 4, 3, 2],
    velocities: [1, 1, 2, 2, 3, 3, 4, 4],
    reset: 1,
    seed: 456,
    iterationsPerFrame: 2
  };
  const expectedInitial = calculateExpectedForceLayout(initial);
  const fixture = createExecutionFixture(device, initial, expectedInitial);
  const submitSpy = vi.spyOn(device, 'submit');
  const sourceReadbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compileLayout(fixture);
    tapeTest.equal(submitSpy.mock.calls.length, 0, 'force layout construction never submits work');
    tapeTest.ok(
      sourceReadbackSpies.every(spy => spy.mock.calls.length === 0),
      'exact layout never reads graph or render data back to the CPU'
    );
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();

    executeLayout(fixture);
    await assertForceLayout(tapeTest, fixture, initial, expectedInitial);

    const warmStart = {
      ...initial,
      positions: expectedInitial.positions,
      velocities: expectedInitial.velocities,
      reset: 0
    };
    executeLayout(fixture);
    await assertForceLayout(tapeTest, fixture, warmStart, calculateExpectedForceLayout(warmStart));

    const resetBuffer = fixture.layout.reset!.data[0].buffer as Buffer;
    resetBuffer.write(Uint32Array.from([1]));
    executeLayout(fixture);
    await assertForceLayout(tapeTest, fixture, initial, expectedInitial);
    tapeTest.equal(
      fixture.layout.positions.data[0].buffer.usage & Buffer.VERTEX,
      Buffer.VERTEX,
      'the exact caller-owned layout buffer remains directly usable as a render vertex attribute'
    );
  } finally {
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Evaluates exact all-pairs repulsion and undirected incident-edge attraction on the CPU. */
function calculateExpectedForceLayout(scenario: ForceLayoutScenario): ExpectedForceLayout {
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
      if (scenario.directed === false && source !== target) outgoing[target].push(source);
    }
  }

  const forwardCount = outgoing.reduce((count, neighbors) => count + neighbors.length, 0);
  const reverseCount = scenario.directed === false ? 0 : validEdgeCount;
  const forwardOverflow = forwardCount > (scenario.capacity ?? forwardCount);
  const reverseOverflow =
    scenario.directed !== false && reverseCount > (scenario.reverseCapacity ?? reverseCount);
  const failed = forwardOverflow || reverseOverflow;
  const positions = Array.from(scenario.positions);
  let velocities = Array.from(scenario.velocities ?? new Array(scenario.vertexCount * 2).fill(0));
  const pinned = scenario.pinned ?? [];

  if (failed) {
    velocities.fill(0);
  } else {
    if (scenario.reset) {
      for (let vertexIndex = 0; vertexIndex < scenario.vertexCount; vertexIndex++) {
        if (!pinned[vertexIndex]) {
          positions[vertexIndex * 2] = getSeededCoordinate(scenario.seed ?? 0, vertexIndex * 2);
          positions[vertexIndex * 2 + 1] = getSeededCoordinate(
            scenario.seed ?? 0,
            vertexIndex * 2 + 1
          );
        }
      }
      velocities.fill(0);
    }

    const repulsion = scenario.repulsion ?? 1;
    const attraction = scenario.attraction ?? 0.1;
    const gravity = scenario.gravity ?? 0.01;
    const damping = scenario.damping ?? 0.9;
    const maxVelocity = scenario.maxVelocity ?? 1;
    const timeStep = scenario.timeStep ?? 1;

    for (let iteration = 0; iteration < (scenario.iterationsPerFrame ?? 4); iteration++) {
      const nextVelocities = Array.from(velocities);
      for (let vertexIndex = 0; vertexIndex < scenario.vertexCount; vertexIndex++) {
        const positionX = positions[vertexIndex * 2];
        const positionY = positions[vertexIndex * 2 + 1];
        let forceX = -gravity * positionX;
        let forceY = -gravity * positionY;

        for (let neighborIndex = 0; neighborIndex < scenario.vertexCount; neighborIndex++) {
          if (neighborIndex === vertexIndex) continue;
          const distanceX = positionX - positions[neighborIndex * 2];
          const distanceY = positionY - positions[neighborIndex * 2 + 1];
          const squaredDistance = Math.max(
            distanceX * distanceX + distanceY * distanceY,
            MINIMUM_SQUARED_DISTANCE
          );
          forceX += (repulsion * distanceX) / squaredDistance;
          forceY += (repulsion * distanceY) / squaredDistance;
        }

        const neighbors =
          scenario.directed === false
            ? outgoing[vertexIndex]
            : [...outgoing[vertexIndex], ...incoming[vertexIndex]];
        for (const neighborIndex of neighbors) {
          forceX += attraction * (positions[neighborIndex * 2] - positionX);
          forceY += attraction * (positions[neighborIndex * 2 + 1] - positionY);
        }

        let velocityX = (velocities[vertexIndex * 2] + forceX * timeStep) * damping;
        let velocityY = (velocities[vertexIndex * 2 + 1] + forceY * timeStep) * damping;
        const speed = Math.hypot(velocityX, velocityY);
        if (speed > maxVelocity) {
          velocityX *= maxVelocity / speed;
          velocityY *= maxVelocity / speed;
        }
        nextVelocities[vertexIndex * 2] = pinned[vertexIndex] ? 0 : velocityX;
        nextVelocities[vertexIndex * 2 + 1] = pinned[vertexIndex] ? 0 : velocityY;
      }

      velocities = nextVelocities;
      for (let vertexIndex = 0; vertexIndex < scenario.vertexCount; vertexIndex++) {
        if (!pinned[vertexIndex]) {
          positions[vertexIndex * 2] += velocities[vertexIndex * 2] * timeStep;
          positions[vertexIndex * 2 + 1] += velocities[vertexIndex * 2 + 1] * timeStep;
        }
      }
    }
  }

  return {
    positions,
    velocities,
    ...(scenario.reset !== undefined ? {reset: 0} : {}),
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow,
    failed
  };
}

/** Mirrors the shader's avalanche hash without JavaScript signed-integer multiplication. */
function getSeededCoordinate(seed: number, coordinateIndex: number): number {
  let hashed = (seed ^ coordinateIndex) >>> 0;
  hashed ^= hashed >>> 16;
  hashed = Math.imul(hashed, 0x7feb352d) >>> 0;
  hashed ^= hashed >>> 15;
  hashed = Math.imul(hashed, 0x846ca68b) >>> 0;
  hashed ^= hashed >>> 16;
  return (2 * (hashed & 0x00ffffff)) / 16777216 - 1;
}

function createExecutionFixture(
  device: Device,
  scenario: ForceLayoutScenario,
  expected: ExpectedForceLayout
): LayoutExecutionFixture {
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
  const invalidEdgeCount = createScalarVector(
    device,
    buffers,
    vectors,
    'invalid-edges',
    'uint32',
    1
  );
  const topology = new GPUGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const positions = createCoordinateVector(
    device,
    buffers,
    vectors,
    'render-positions',
    scenario.positions,
    scenario.byteOffset,
    true
  );
  const velocities = createCoordinateVector(
    device,
    buffers,
    vectors,
    'layout-velocities',
    scenario.velocities ?? new Array(scenario.vertexCount * 2).fill(0),
    scenario.byteOffset
  );
  const pinned = scenario.pinned
    ? createScalarVector(
        device,
        buffers,
        vectors,
        'pinned-vertices',
        'uint32',
        scenario.vertexCount,
        {
          values: scenario.pinned,
          byteOffset: scenario.byteOffset
        }
      )
    : undefined;
  const reset =
    scenario.reset !== undefined
      ? createScalarVector(device, buffers, vectors, 'layout-reset', 'uint32', 1, {
          values: [scenario.reset],
          byteOffset: scenario.byteOffset
        })
      : undefined;
  const layout = new GPUGraphForceLayout({
    topology,
    positions,
    velocities,
    pinned,
    reset,
    seed: scenario.seed,
    iterationsPerFrame: scenario.iterationsPerFrame,
    repulsion: scenario.repulsion,
    attraction: scenario.attraction,
    gravity: scenario.gravity,
    damping: scenario.damping,
    maxVelocity: scenario.maxVelocity,
    timeStep: scenario.timeStep
  });

  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    layout,
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
    offsets: createScalarVector(
      device,
      buffers,
      vectors,
      `${name}-offsets`,
      'uint32',
      vertexCount + 1,
      {
        byteOffset
      }
    ),
    neighbors: createScalarVector(
      device,
      buffers,
      vectors,
      `${name}-neighbors`,
      'uint32',
      capacity
    ),
    edgeIds: createScalarVector(device, buffers, vectors, `${name}-edge-ids`, 'uint32', capacity),
    edgeWeights: weighted
      ? createScalarVector(device, buffers, vectors, `${name}-weights`, 'float32', capacity)
      : undefined,
    count: createScalarVector(device, buffers, vectors, `${name}-count`, 'uint32', 1),
    overflow: createScalarVector(device, buffers, vectors, `${name}-overflow`, 'uint32', 1)
  };
}

function createScalarVector<Format extends ScalarFormat>(
  device: Device,
  buffers: Buffer[],
  vectors: GPUVector[],
  name: string,
  format: Format,
  length: number,
  options: {values?: number[]; byteOffset?: number} = {}
): GPUVector<Format> {
  const byteOffset = options.byteOffset ?? 0;
  const buffer = device.createBuffer({
    id: name,
    byteLength: byteOffset + Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  if (options.values?.length) {
    buffer.write(
      format === 'float32' ? Float32Array.from(options.values) : Uint32Array.from(options.values),
      byteOffset
    );
  }
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

function createCoordinateVector(
  device: Device,
  buffers: Buffer[],
  vectors: GPUVector[],
  name: string,
  values: number[],
  byteOffset = 0,
  renderable = false
): GPUVector<'float32x2'> {
  const buffer = device.createBuffer({
    id: name,
    byteLength: byteOffset + Math.max(values.length, 2) * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST | (renderable ? Buffer.VERTEX : 0)
  });
  if (values.length) buffer.write(Float32Array.from(values), byteOffset);
  buffers.push(buffer);
  const vector = new GPUVector<'float32x2'>({
    type: 'buffer',
    name,
    format: 'float32x2',
    buffer,
    length: values.length / 2,
    byteOffset,
    ownsBuffer: false
  });
  vectors.push(vector);
  return vector;
}

function compileLayout(fixture: LayoutExecutionFixture, maximumWorkgroups?: number): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.layout.addToGraph(fixture.commandGraph);
  } else {
    addGPUGraphForceLayoutToGraphWithDispatchLimit(
      fixture.layout,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeLayout(fixture: LayoutExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({id: 'gpu-graph-force-layout-test'});
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertForceLayout(
  tapeTest: Test,
  fixture: LayoutExecutionFixture,
  scenario: ForceLayoutScenario,
  expected: ExpectedForceLayout
): Promise<void> {
  const [positions, velocities, reset, invalidEdgeCount, forwardOverflow, reverseOverflow] =
    await Promise.all([
      readCoordinateVector(fixture.layout.positions),
      readCoordinateVector(fixture.layout.velocities),
      fixture.layout.reset ? readUint32Vector(fixture.layout.reset) : Promise.resolve(undefined),
      readUint32Vector(fixture.topology.invalidEdgeCount),
      readUint32Vector(fixture.topology.forward.overflow),
      fixture.topology.reverse
        ? readUint32Vector(fixture.topology.reverse.overflow)
        : Promise.resolve(undefined)
    ]);

  tapeTest.equal(
    positions.length,
    scenario.vertexCount * 2,
    'two render coordinates remain per vertex'
  );
  assertCloseCoordinates(
    tapeTest,
    positions,
    expected.positions,
    'GPU positions match exact CPU force physics'
  );
  assertCloseCoordinates(
    tapeTest,
    velocities,
    expected.velocities,
    'GPU velocities match damped CPU force and clipping'
  );
  tapeTest.ok(
    positions.every(Number.isFinite) && velocities.every(Number.isFinite),
    'all softened coordinates and velocities remain finite'
  );
  tapeTest.equal(
    invalidEdgeCount[0],
    expected.invalidEdgeCount,
    'invalid graph endpoints are excluded'
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
  if (reset)
    tapeTest.equal(reset[0], 0, 'GPU consumes and clears deterministic initialization control');

  for (const [vertexIndex, pinned] of (scenario.pinned ?? []).entries()) {
    if (pinned) {
      tapeTest.equal(
        positions[vertexIndex * 2],
        scenario.positions[vertexIndex * 2],
        'pinned x coordinate never moves'
      );
      tapeTest.equal(
        positions[vertexIndex * 2 + 1],
        scenario.positions[vertexIndex * 2 + 1],
        'pinned y coordinate never moves'
      );
      tapeTest.equal(velocities[vertexIndex * 2], 0, 'pinned horizontal velocity is cleared');
      tapeTest.equal(velocities[vertexIndex * 2 + 1], 0, 'pinned vertical velocity is cleared');
    }
  }

  if (expected.failed) {
    tapeTest.deepEqual(
      positions,
      Array.from(new Float32Array(scenario.positions)),
      'CSR overflow preserves all render positions'
    );
    tapeTest.ok(
      velocities.every(velocity => velocity === 0),
      'CSR overflow clears every simulation velocity'
    );
  }
}

function assertCloseCoordinates(
  tapeTest: Test,
  actual: number[],
  expected: number[],
  message: string
): void {
  const largestError = actual.reduce(
    (largest, value, coordinateIndex) =>
      Math.max(largest, Math.abs(value - expected[coordinateIndex])),
    0
  );
  tapeTest.ok(
    largestError <= PHYSICS_TOLERANCE,
    `${message} within ${PHYSICS_TOLERANCE}: ${largestError}`
  );
}

async function readUint32Vector(vector: GPUVector<'uint32'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 4);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

async function readCoordinateVector(vector: GPUVector<'float32x2'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 8);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, vector.length * 2));
}

function destroyExecutionFixture(tapeTest: Test, fixture: LayoutExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'destroying borrowed force-layout vectors preserves every caller-owned physical allocation'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
