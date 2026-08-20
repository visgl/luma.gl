// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUGraph,
  GPUGraphForceLayout,
  GPUGraphSpatialForceLayout,
  GPUGraphTopology,
  type GPUGraphAdjacency
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addGPUGraphSpatialForceLayoutToGraphWithDispatchLimit,
  getGPUGraphSpatialForceLayoutDispatchLayout
} from '../../src/gpu-graph/gpu-graph-spatial-force-layout-internals';

const SPATIAL_TOLERANCE = 2e-4;
const MINIMUM_SQUARED_DISTANCE = 0.0001;

type ScalarFormat = 'uint32' | 'float32';

type SpatialScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  positions: number[];
  velocities?: number[];
  pinned?: number[];
  reset?: number;
  seed?: number;
  gridSize?: readonly [number, number];
  bounds?: readonly [number, number, number, number];
  theta?: number;
  nearCellRadius?: number;
  vertexCapacity?: number;
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
  differsFromExact?: boolean;
};

type GridReference = {
  cells: number[][];
  offsets: number[];
  centers: number[];
  acceptedCount: number;
  overflow: boolean;
};

type ExpectedSpatialLayout = {
  positions: number[];
  velocities: number[];
  grid: GridReference;
  reset?: number;
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
  failed: boolean;
};

type SpatialExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: GPUGraph;
  topology: GPUGraphTopology;
  layout: GPUGraphForceLayout;
  spatial: GPUGraphSpatialForceLayout;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const spatialScenarios: SpatialScenario[] = [
  {
    name: 'empty graphs initialize all caller-owned cells and consume deterministic reset',
    vertexCount: 0,
    sourceChunks: [],
    targetChunks: [],
    positions: [],
    directed: false,
    reset: 1,
    gridSize: [3, 2],
    vertexCapacity: 0,
    iterationsPerFrame: 1
  },
  {
    name: 'an isolated indexed vertex retains exact gravity and progressive velocity semantics',
    vertexCount: 1,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [1, -1],
    velocities: [0.5, 0.25],
    gravity: 0.2,
    damping: 0.8,
    timeStep: 0.5,
    maxVelocity: 10,
    iterationsPerFrame: 2
  },
  {
    name: 'theta zero exactly matches all-pairs repulsion across distant cells',
    vertexCount: 5,
    sourceChunks: [[0, 1], [], [3]],
    targetChunks: [[1, 2], [], [4]],
    positions: [-1.8, -0.4, -1.1, 0.6, 0.1, -0.8, 1.1, 0.5, 1.3, 0.4],
    gridSize: [8, 3],
    theta: 0,
    repulsion: 0.4,
    gravity: 0,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1
  },
  {
    name: 'own and adjacent cells remain exact even with an aggressive far-field opening angle',
    vertexCount: 3,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [-1.8, 0, -1.55, 0.15, -1.3, -0.1],
    gridSize: [8, 2],
    nearCellRadius: 1,
    theta: 100,
    gravity: 0,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1
  },
  {
    name: 'distant multi-vertex cells use population-weighted centroid repulsion',
    vertexCount: 4,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [-1.8, 0, 1.1, 0.12, 1.3, 0.2, -1.65, 0.3],
    gridSize: [8, 2],
    nearCellRadius: 0,
    theta: 1,
    repulsion: 0.25,
    gravity: 0,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1,
    differsFromExact: true
  },
  {
    name: 'small opening angles fall back to exact far-cell vertex iteration',
    vertexCount: 3,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [-1.8, 0, 1.1, 0.12, 1.3, 0.2],
    gridSize: [8, 2],
    nearCellRadius: 0,
    theta: 0.01,
    gravity: 0,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1
  },
  {
    name: 'expanded Chebyshev near radius explicitly disables approximation across the grid',
    vertexCount: 4,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [-1.7, -0.8, -0.3, 0.5, 1.1, -0.2, 1.3, 0.1],
    gridSize: [8, 3],
    nearCellRadius: 32,
    theta: 100,
    iterationsPerFrame: 1
  },
  {
    name: 'empty cells retain zero centroids and preserve exact exclusive offsets',
    vertexCount: 3,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [-1.8, -1.8, 0, 0, 1.8, 1.8],
    gridSize: [4, 4],
    theta: 0,
    repulsion: 0,
    gravity: 0,
    iterationsPerFrame: 1
  },
  {
    name: 'inclusive maximum bounds place coordinates in the final row-major cell',
    vertexCount: 3,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [-2, -2, 0, 0, 2, 2],
    gridSize: [3, 3],
    theta: 0,
    repulsion: 0,
    gravity: 0,
    iterationsPerFrame: 1
  },
  {
    name: 'directed forward and reverse edges retain symmetric exact spring attraction',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    positions: [-1, 0, 1, 0],
    repulsion: 0,
    gravity: 0,
    attraction: 0.25,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1
  },
  {
    name: 'undirected forward adjacency remains symmetric without reverse grid attraction',
    vertexCount: 3,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    positions: [-1, 0, 0, 0.5, 1, 0],
    directed: false,
    repulsion: 0,
    attraction: 0.2,
    gravity: 0,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 2
  },
  {
    name: 'duplicate edges strengthen springs while self loops contribute zero displacement',
    vertexCount: 3,
    sourceChunks: [[0, 0], [], [1, 2]],
    targetChunks: [[1, 1], [], [1, 0]],
    positions: [-1, 0, 1, 0, 0, 1],
    repulsion: 0,
    gravity: 0,
    attraction: 0.2,
    damping: 1,
    maxVelocity: 10,
    iterationsPerFrame: 1
  },
  {
    name: 'existing edge weights remain intentionally unweighted under spatial acceleration',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [3]],
    weightChunks: [[0.001, 100], [], [42]],
    positions: [-1, 0, 0, 0.5, 0.8, -0.25, 1.2, 0.5],
    theta: 0,
    repulsion: 0.03,
    maxVelocity: 2,
    iterationsPerFrame: 2
  },
  {
    name: 'invalid original edge identifiers remain excluded without dropping valid grid vertices',
    vertexCount: 5,
    sourceChunks: [[0, 8], [], [2, 3, 4]],
    targetChunks: [[1, 2], [], [9, 4, 4]],
    positions: [-1.5, 0, -0.7, 0.5, 0, 0, 0.7, -0.5, 1.5, 0],
    theta: 0,
    maxVelocity: 0.1,
    iterationsPerFrame: 2
  },
  {
    name: 'pinned vertices preserve positions and publish zero progressive velocities',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    positions: [-1.5, 0.5, -0.4, 0, 0.4, 0, 1.5, -0.5],
    velocities: [1, 2, 0.5, -1, 0, 0, -3, 4],
    pinned: [1, 0, 0, 9],
    maxVelocity: 0.1,
    iterationsPerFrame: 2
  },
  {
    name: 'deterministic reset initializes before rebuilding the spatial grid and preserves pins',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [3]],
    positions: [1.5, -1.5, 1.3, 1.2, -1.1, 0.5, 0.9, -1.3],
    velocities: [1, 1, 2, 2, 3, 3, 4, 4],
    pinned: [1, 0, 0, 0],
    reset: 1,
    seed: 123456789,
    theta: 0,
    maxVelocity: 0.05,
    iterationsPerFrame: 2
  },
  {
    name: 'successive iterations rebuild the index after vertices cross cell boundaries',
    vertexCount: 2,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [-0.9, 0, 0.9, 0],
    gridSize: [4, 1],
    bounds: [-1, -1, 1, 1],
    repulsion: 0,
    gravity: 1,
    damping: 1,
    timeStep: 0.6,
    maxVelocity: 10,
    iterationsPerFrame: 2
  },
  {
    name: 'coincident indexed vertices remain finite through exact softened near-field forces',
    vertexCount: 3,
    sourceChunks: [[]],
    targetChunks: [[]],
    positions: [0, 0, 0, 0, 1, 0],
    theta: 0,
    gravity: 0,
    maxVelocity: 0.5,
    iterationsPerFrame: 1
  },
  {
    name: 'zero-capacity vertex IDs publish explicit overflow and leave render positions unchanged',
    vertexCount: 3,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    positions: [-1, 0, 0, 0, 1, 0],
    velocities: [1, 2, 3, 4, 5, 6],
    vertexCapacity: 0,
    iterationsPerFrame: 1
  },
  {
    name: 'partial spatial capacity fails closed while reporting the full indexed vertex count',
    vertexCount: 4,
    sourceChunks: [[0, 1]],
    targetChunks: [[1, 2]],
    positions: [-1, 0, -0.5, 0, 0.5, 0, 1, 0],
    velocities: [1, 1, 2, 2, 3, 3, 4, 4],
    vertexCapacity: 2,
    iterationsPerFrame: 2
  },
  {
    name: 'out-of-domain vertices fail closed even when capacity does not overflow',
    vertexCount: 3,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    positions: [0, 0, 3, 0, -1, 1],
    velocities: [1, 2, 3, 4, 5, 6],
    iterationsPerFrame: 1
  },
  {
    name: 'forward topology overflow preserves coordinates regardless of a complete grid index',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    positions: [-1.5, 0, -0.5, 0, 0.5, 0, 1.5, 0],
    velocities: [1, 1, 2, 2, 3, 3, 4, 4],
    capacity: 1,
    iterationsPerFrame: 1
  },
  {
    name: 'reverse topology overflow suppresses deterministic reset and clears its request',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    positions: [-1.5, 0, -0.5, 0, 0.5, 0, 1.5, 0],
    velocities: [1, 1, 2, 2, 3, 3, 4, 4],
    reset: 1,
    reverseCapacity: 1,
    iterationsPerFrame: 1
  },
  {
    name: 'packed index centers, offsets, controls, and positions support four-byte view offsets',
    vertexCount: 4,
    sourceChunks: [[0, 2]],
    targetChunks: [[1, 3]],
    positions: [-1.5, 0, -0.5, 0.5, 0.5, -0.5, 1.5, 0],
    pinned: [0, 1, 0, 0],
    reset: 0,
    theta: 0,
    maxVelocity: 0.1,
    byteOffset: 4,
    iterationsPerFrame: 1
  },
  {
    name: 'bounded 3D indexing and centroid passes process 1025 vertices and 1025 cells',
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
      coordinateIndex % 2 === 0 ? (Math.floor(coordinateIndex / 2) + 0.5) / 1025 : 0
    ),
    gridSize: [1025, 1],
    bounds: [0, -1, 1, 1],
    theta: 0.6,
    repulsion: 0.00001,
    gravity: 0,
    maxVelocity: 0.05,
    iterationsPerFrame: 1,
    maximumWorkgroups: 2
  }
];

test('GPUGraphSpatialForceLayout plans bounded 3D vertex, grid, and centroid dispatch', tapeTest => {
  tapeTest.deepEqual(getGPUGraphSpatialForceLayoutDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphSpatialForceLayoutDispatchLayout(512, 2), {x: 2, y: 1, z: 1});
  tapeTest.deepEqual(getGPUGraphSpatialForceLayoutDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getGPUGraphSpatialForceLayoutDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(() => getGPUGraphSpatialForceLayoutDispatchLayout(2049, 2), /3D dispatch limit/);
  tapeTest.end();
});

for (const scenario of spatialScenarios) {
  test(`GPUGraphSpatialForceLayout GPU spatial physics: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedSpatialLayout(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileSpatialLayout(fixture, scenario.maximumWorkgroups);
      executeSpatialLayout(fixture);
      await assertSpatialLayout(tapeTest, fixture, scenario, expected);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'spatial acceleration preserves caller-owned graph chunks and empty edge batches'
      );
      if (scenario.differsFromExact) {
        const exact = calculateExpectedSpatialLayout({...scenario, theta: 0});
        const actual = await readCoordinateVector(fixture.layout.positions);
        tapeTest.ok(
          actual.some((coordinate, index) => Math.abs(coordinate - exact.positions[index]) > 1e-5),
          'far-cell monopoles are explicitly approximate rather than silently presented as exact'
        );
      }
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('GPUGraphSpatialForceLayout repeatedly rebuilds spatial cells across warm starts and deterministic reset', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const initial: SpatialScenario = {
    name: 'progressive spatial reindexing',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2]],
    targetChunks: [[1, 2], [], [3]],
    positions: [-1.2, 0.8, -0.2, -0.5, 0.4, 0.2, 1.1, -0.8],
    velocities: [0.1, 0, 0, 0.1, -0.1, 0, 0, -0.1],
    gridSize: [5, 3],
    reset: 1,
    seed: 456,
    theta: 0,
    maxVelocity: 0.05,
    iterationsPerFrame: 2
  };
  const expectedInitial = calculateExpectedSpatialLayout(initial);
  const fixture = createExecutionFixture(device, initial, expectedInitial);
  const submitSpy = vi.spyOn(device, 'submit');
  const sourceReadbackSpies = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data
  ].map(chunk => vi.spyOn(chunk.buffer, 'readAsync'));

  try {
    compileSpatialLayout(fixture);
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'spatial layout construction never submits work'
    );
    tapeTest.ok(
      sourceReadbackSpies.every(spy => spy.mock.calls.length === 0),
      'grid rebuilds and approximation never read source edges back to the CPU'
    );
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();

    executeSpatialLayout(fixture);
    await assertSpatialLayout(tapeTest, fixture, initial, expectedInitial);

    const warmStart = {
      ...initial,
      positions: expectedInitial.positions,
      velocities: expectedInitial.velocities,
      reset: 0
    };
    executeSpatialLayout(fixture);
    await assertSpatialLayout(
      tapeTest,
      fixture,
      warmStart,
      calculateExpectedSpatialLayout(warmStart)
    );

    (fixture.layout.reset!.data[0].buffer as Buffer).write(Uint32Array.from([1]));
    executeSpatialLayout(fixture);
    await assertSpatialLayout(tapeTest, fixture, initial, expectedInitial);
  } finally {
    submitSpy.mockRestore();
    for (const sourceReadbackSpy of sourceReadbackSpies) sourceReadbackSpy.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Computes the exact documented flat-grid monopole approximation without GPU-side atomics. */
function calculateExpectedSpatialLayout(scenario: SpatialScenario): ExpectedSpatialLayout {
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
  const topologyFailed = forwardOverflow || reverseOverflow;
  const positions = Array.from(scenario.positions);
  let velocities = Array.from(scenario.velocities ?? new Array(scenario.vertexCount * 2).fill(0));
  const pinned = scenario.pinned ?? [];

  if (scenario.reset && !topologyFailed) {
    for (let vertexIndex = 0; vertexIndex < scenario.vertexCount; vertexIndex++) {
      if (!pinned[vertexIndex]) {
        positions[vertexIndex * 2] = getSeededCoordinate(scenario.seed ?? 0, vertexIndex * 2);
        positions[vertexIndex * 2 + 1] = getSeededCoordinate(
          scenario.seed ?? 0,
          vertexIndex * 2 + 1
        );
      }
    }
  }
  if (scenario.reset) velocities.fill(0);

  let grid = calculateGridReference(scenario, positions);
  let failed = topologyFailed || grid.overflow || grid.acceptedCount !== scenario.vertexCount;
  const iterations = scenario.vertexCount === 0 ? 0 : (scenario.iterationsPerFrame ?? 4);
  for (let iteration = 0; iteration < iterations; iteration++) {
    grid = calculateGridReference(scenario, positions);
    failed = topologyFailed || grid.overflow || grid.acceptedCount !== scenario.vertexCount;
    if (failed) {
      velocities.fill(0);
      continue;
    }

    const nextVelocities = Array.from(velocities);
    for (let vertexIndex = 0; vertexIndex < scenario.vertexCount; vertexIndex++) {
      const [forceX, forceY] = calculateSpatialRepulsion(scenario, grid, positions, vertexIndex);
      const positionX = positions[vertexIndex * 2];
      const positionY = positions[vertexIndex * 2 + 1];
      const timeStep = scenario.timeStep ?? 1;
      let velocityX =
        velocities[vertexIndex * 2] + (forceX - (scenario.gravity ?? 0.01) * positionX) * timeStep;
      let velocityY =
        velocities[vertexIndex * 2 + 1] +
        (forceY - (scenario.gravity ?? 0.01) * positionY) * timeStep;

      const neighbors =
        scenario.directed === false
          ? outgoing[vertexIndex]
          : [...outgoing[vertexIndex], ...incoming[vertexIndex]];
      for (const neighborIndex of neighbors) {
        velocityX +=
          (scenario.attraction ?? 0.1) * (positions[neighborIndex * 2] - positionX) * timeStep;
        velocityY +=
          (scenario.attraction ?? 0.1) * (positions[neighborIndex * 2 + 1] - positionY) * timeStep;
      }
      velocityX *= scenario.damping ?? 0.9;
      velocityY *= scenario.damping ?? 0.9;
      const speed = Math.hypot(velocityX, velocityY);
      const maximumSpeed = scenario.maxVelocity ?? 1;
      if (speed > maximumSpeed) {
        velocityX *= maximumSpeed / speed;
        velocityY *= maximumSpeed / speed;
      }
      nextVelocities[vertexIndex * 2] = pinned[vertexIndex] ? 0 : velocityX;
      nextVelocities[vertexIndex * 2 + 1] = pinned[vertexIndex] ? 0 : velocityY;
    }

    velocities = nextVelocities;
    for (let vertexIndex = 0; vertexIndex < scenario.vertexCount; vertexIndex++) {
      if (!pinned[vertexIndex]) {
        positions[vertexIndex * 2] += velocities[vertexIndex * 2] * (scenario.timeStep ?? 1);
        positions[vertexIndex * 2 + 1] +=
          velocities[vertexIndex * 2 + 1] * (scenario.timeStep ?? 1);
      }
    }
  }

  if (failed) grid.centers.fill(0);

  return {
    positions,
    velocities,
    grid,
    ...(scenario.reset !== undefined ? {reset: 0} : {}),
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow,
    failed
  };
}

/** Replicates inclusive-max GPUGridIndex row-major coordinates and centroid gathering. */
function calculateGridReference(scenario: SpatialScenario, positions: number[]): GridReference {
  const [columns, rows] = scenario.gridSize ?? [3, 2];
  const bounds = scenario.bounds ?? [-2, -2, 2, 2];
  const cells = Array.from({length: columns * rows}, () => [] as number[]);
  for (let vertexIndex = 0; vertexIndex < scenario.vertexCount; vertexIndex++) {
    const horizontal = positions[vertexIndex * 2];
    const vertical = positions[vertexIndex * 2 + 1];
    if (
      !Number.isFinite(horizontal) ||
      !Number.isFinite(vertical) ||
      horizontal < bounds[0] ||
      horizontal > bounds[2] ||
      vertical < bounds[1] ||
      vertical > bounds[3]
    ) {
      continue;
    }
    const column = getGridCoordinate(horizontal, bounds[0], bounds[2], columns);
    const row = getGridCoordinate(vertical, bounds[1], bounds[3], rows);
    cells[row * columns + column].push(vertexIndex);
  }

  const offsets = [0];
  for (const cell of cells) offsets.push(offsets[offsets.length - 1] + cell.length);
  const centers = new Array<number>(cells.length * 2).fill(0);
  const acceptedCount = offsets[offsets.length - 1];
  const overflow = acceptedCount > (scenario.vertexCapacity ?? scenario.vertexCount);
  if (!overflow) {
    for (const [cellIndex, vertices] of cells.entries()) {
      if (vertices.length === 0) continue;
      centers[cellIndex * 2] =
        vertices.reduce((sum, vertex) => sum + positions[vertex * 2], 0) / vertices.length;
      centers[cellIndex * 2 + 1] =
        vertices.reduce((sum, vertex) => sum + positions[vertex * 2 + 1], 0) / vertices.length;
    }
  }
  return {cells, offsets, centers, acceptedCount, overflow};
}

function getGridCoordinate(value: number, minimum: number, maximum: number, size: number): number {
  if (value === minimum) return 0;
  if (value === maximum) return size - 1;
  return Math.min(Math.floor(((value - minimum) / (maximum - minimum)) * size), size - 1);
}

/** Applies exact nearby-cell repulsion and the documented far-cell population monopole. */
function calculateSpatialRepulsion(
  scenario: SpatialScenario,
  grid: GridReference,
  positions: number[],
  vertexIndex: number
): [number, number] {
  const [columns, rows] = scenario.gridSize ?? [3, 2];
  const bounds = scenario.bounds ?? [-2, -2, 2, 2];
  const x = positions[vertexIndex * 2];
  const y = positions[vertexIndex * 2 + 1];
  const sourceColumn = getGridCoordinate(x, bounds[0], bounds[2], columns);
  const sourceRow = getGridCoordinate(y, bounds[1], bounds[3], rows);
  const cellWidth = (bounds[2] - bounds[0]) / columns;
  const cellHeight = (bounds[3] - bounds[1]) / rows;
  const diameterSquared = cellWidth * cellWidth + cellHeight * cellHeight;
  const theta = scenario.theta ?? 0.6;
  const radius = scenario.nearCellRadius ?? 1;
  let forceX = 0;
  let forceY = 0;

  for (const [cellIndex, vertices] of grid.cells.entries()) {
    if (vertices.length === 0) continue;
    const column = cellIndex % columns;
    const row = Math.floor(cellIndex / columns);
    const isNear = Math.max(Math.abs(column - sourceColumn), Math.abs(row - sourceRow)) <= radius;
    const centerX = grid.centers[cellIndex * 2];
    const centerY = grid.centers[cellIndex * 2 + 1];
    const centerDistanceX = x - centerX;
    const centerDistanceY = y - centerY;
    const centerDistanceSquared =
      centerDistanceX * centerDistanceX + centerDistanceY * centerDistanceY;
    const approximate =
      !isNear && theta > 0 && diameterSquared < theta * theta * centerDistanceSquared;

    if (approximate) {
      const denominator = Math.max(centerDistanceSquared, MINIMUM_SQUARED_DISTANCE);
      forceX += ((scenario.repulsion ?? 1) * vertices.length * centerDistanceX) / denominator;
      forceY += ((scenario.repulsion ?? 1) * vertices.length * centerDistanceY) / denominator;
      continue;
    }

    for (const neighbor of vertices) {
      if (neighbor === vertexIndex) continue;
      const distanceX = x - positions[neighbor * 2];
      const distanceY = y - positions[neighbor * 2 + 1];
      const denominator = Math.max(
        distanceX * distanceX + distanceY * distanceY,
        MINIMUM_SQUARED_DISTANCE
      );
      forceX += ((scenario.repulsion ?? 1) * distanceX) / denominator;
      forceY += ((scenario.repulsion ?? 1) * distanceY) / denominator;
    }
  }
  return [forceX, forceY];
}

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
  scenario: SpatialScenario,
  expected: ExpectedSpatialLayout
): SpatialExecutionFixture {
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
  const topology = new GPUGraphTopology({
    graph,
    forward,
    reverse,
    invalidEdgeCount: createScalarVector(device, buffers, vectors, 'invalid-edges', 'uint32', 1)
  });
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
  const gridSize = scenario.gridSize ?? [3, 2];
  const cellCount = gridSize[0] * gridSize[1];
  const spatial = new GPUGraphSpatialForceLayout({
    layout,
    gridSize,
    bounds: scenario.bounds ?? [-2, -2, 2, 2],
    theta: scenario.theta,
    nearCellRadius: scenario.nearCellRadius,
    cellOffsets: createScalarVector(
      device,
      buffers,
      vectors,
      'cell-offsets',
      'uint32',
      cellCount + 1,
      {
        byteOffset: scenario.byteOffset
      }
    ),
    vertexIds: createScalarVector(
      device,
      buffers,
      vectors,
      'vertex-ids',
      'uint32',
      scenario.vertexCapacity ?? scenario.vertexCount,
      {byteOffset: scenario.byteOffset}
    ),
    cellCenters: createCoordinateVector(
      device,
      buffers,
      vectors,
      'cell-centers',
      new Array(cellCount * 2).fill(0),
      scenario.byteOffset
    ),
    count: createScalarVector(device, buffers, vectors, 'indexed-count', 'uint32', 1, {
      byteOffset: scenario.byteOffset
    }),
    overflow: createScalarVector(device, buffers, vectors, 'index-overflow', 'uint32', 1, {
      byteOffset: scenario.byteOffset
    })
  });

  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    layout,
    spatial,
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

function compileSpatialLayout(fixture: SpatialExecutionFixture, maximumWorkgroups?: number): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.spatial.addToGraph(fixture.commandGraph);
  } else {
    addGPUGraphSpatialForceLayoutToGraphWithDispatchLimit(
      fixture.spatial,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeSpatialLayout(fixture: SpatialExecutionFixture): void {
  const commandEncoder = fixture.device.createCommandEncoder({
    id: 'gpu-graph-spatial-force-layout-test'
  });
  fixture.compiled!.encode(commandEncoder, {parameters: undefined});
  fixture.device.submit(commandEncoder.finish());
}

async function assertSpatialLayout(
  tapeTest: Test,
  fixture: SpatialExecutionFixture,
  scenario: SpatialScenario,
  expected: ExpectedSpatialLayout
): Promise<void> {
  const [
    positions,
    velocities,
    offsets,
    vertexIds,
    centers,
    count,
    overflow,
    reset,
    invalid,
    topologyOverflow,
    reverseOverflow
  ] = await Promise.all([
    readCoordinateVector(fixture.layout.positions),
    readCoordinateVector(fixture.layout.velocities),
    readUint32Vector(fixture.spatial.cellOffsets),
    readUint32Vector(fixture.spatial.vertexIds),
    readCoordinateVector(fixture.spatial.cellCenters),
    readUint32Vector(fixture.spatial.count),
    readUint32Vector(fixture.spatial.overflow),
    fixture.layout.reset ? readUint32Vector(fixture.layout.reset) : Promise.resolve(undefined),
    readUint32Vector(fixture.topology.invalidEdgeCount),
    readUint32Vector(fixture.topology.forward.overflow),
    fixture.topology.reverse
      ? readUint32Vector(fixture.topology.reverse.overflow)
      : Promise.resolve(undefined)
  ]);

  assertClose(
    tapeTest,
    positions,
    expected.positions,
    'accelerated GPU coordinates match CPU near/far physics'
  );
  assertClose(
    tapeTest,
    velocities,
    expected.velocities,
    'accelerated GPU velocities preserve exact attraction and damping'
  );
  tapeTest.deepEqual(
    offsets,
    expected.grid.offsets,
    'row-major cell offsets retain all accepted vertices'
  );
  assertClose(
    tapeTest,
    centers,
    expected.grid.centers,
    'nonempty caller-owned cell centers equal true floating centroids'
  );
  tapeTest.equal(
    count[0],
    expected.grid.acceptedCount,
    'spatial index reports full in-domain vertex count'
  );
  tapeTest.equal(
    overflow[0],
    Number(expected.grid.overflow),
    'spatial ID capacity overflow stays explicit'
  );
  tapeTest.equal(invalid[0], expected.invalidEdgeCount, 'invalid source edges remain excluded');
  tapeTest.equal(
    topologyOverflow[0],
    Number(expected.forwardOverflow),
    'forward topology capacity is explicit'
  );
  if (reverseOverflow) {
    tapeTest.equal(
      reverseOverflow[0],
      Number(expected.reverseOverflow),
      'reverse topology capacity is explicit'
    );
  }
  if (reset) tapeTest.equal(reset[0], 0, 'one-shot deterministic reset is consumed on the GPU');

  for (const [cellIndex, expectedVertices] of expected.grid.cells.entries()) {
    const first = offsets[cellIndex];
    const last = Math.min(offsets[cellIndex + 1], vertexIds.length);
    const actual = vertexIds
      .slice(Math.min(first, vertexIds.length), last)
      .sort((left, right) => left - right);
    const expectedStored = expectedVertices
      .slice(0, Math.max(0, last - first))
      .sort((left, right) => left - right);
    tapeTest.deepEqual(
      actual,
      expectedStored,
      'atomic cell placement preserves every stored stable vertex ID'
    );
  }

  if (expected.failed) {
    tapeTest.deepEqual(
      positions,
      Array.from(new Float32Array(scenario.positions)),
      'invalid topology or index preserves render coordinates'
    );
    tapeTest.ok(
      velocities.every(velocity => velocity === 0),
      'invalid topology or index clears progressive velocities'
    );
  }

  for (const [vertexIndex, pinned] of (scenario.pinned ?? []).entries()) {
    if (pinned) {
      tapeTest.equal(
        positions[vertexIndex * 2],
        scenario.positions[vertexIndex * 2],
        'pinned x never moves'
      );
      tapeTest.equal(
        positions[vertexIndex * 2 + 1],
        scenario.positions[vertexIndex * 2 + 1],
        'pinned y never moves'
      );
      tapeTest.equal(velocities[vertexIndex * 2], 0, 'pinned horizontal velocity remains zero');
      tapeTest.equal(velocities[vertexIndex * 2 + 1], 0, 'pinned vertical velocity remains zero');
    }
  }
}

function assertClose(tapeTest: Test, actual: number[], expected: number[], message: string): void {
  const largestError = actual.reduce(
    (largest, value, index) => Math.max(largest, Math.abs(value - expected[index])),
    0
  );
  tapeTest.ok(
    largestError <= SPATIAL_TOLERANCE,
    `${message} within ${SPATIAL_TOLERANCE}: ${largestError}`
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

function destroyExecutionFixture(tapeTest: Test, fixture: SpatialExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'destroying graph-owned grid scratch preserves every caller-owned topology, layout, and index allocation'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
