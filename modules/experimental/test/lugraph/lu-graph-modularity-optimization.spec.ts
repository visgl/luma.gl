// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphLabelPropagation,
  LuGraphModularity,
  LuGraphModularityOptimization,
  LuGraphTopology,
  type LuGraphAdjacency
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {
  addLuGraphModularityOptimizationToGraphWithDispatchLimit,
  getLuGraphModularityOptimizationDispatchLayout
} from '../../src/lugraph/lu-graph-modularity-optimization-internals';

const INVALID_COMMUNITY = 0xffffffff;
const SCORE_TOLERANCE = 2e-5;

type ScalarFormat = 'uint32' | 'float32';

type OptimizationScenario = {
  name: string;
  vertexCount: number;
  sourceChunks: number[][];
  targetChunks: number[][];
  weightChunks?: number[][];
  directed?: boolean;
  initialCommunities?: number[];
  resolution?: number;
  iterations?: number;
  minimumGain?: number;
  convergence?: boolean;
  validity?: boolean;
  capacity?: number;
  reverseCapacity?: number;
  byteOffset?: number;
  maximumWorkgroups?: number;
  expectedLabels?: number[];
  expectedScore?: number;
  expectedConvergence?: boolean;
  expectedValidity?: boolean;
};

type AcceptedEdge = {source: number; target: number; weight: number};

type ExpectedOptimization = {
  labels: number[];
  score: number;
  initialScore: number;
  valid: boolean;
  converged: boolean;
  invalidEdgeCount: number;
  forwardCount: number;
  reverseCount: number;
  forwardOverflow: boolean;
  reverseOverflow: boolean;
};

type OptimizationExecutionFixture = {
  device: Device;
  buffers: Buffer[];
  vectors: GPUVector[];
  graph: LuGraph;
  topology: LuGraphTopology;
  optimization: LuGraphModularityOptimization;
  commandGraph: GPUCommandGraph;
  compiled?: ReturnType<GPUCommandGraph['compile']>;
};

const optimizationScenarios: OptimizationScenario[] = [
  {
    name: 'empty directed graphs are converged but have undefined invalid modularity',
    vertexCount: 0,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    iterations: 1,
    expectedLabels: [],
    expectedScore: 0,
    expectedConvergence: true,
    expectedValidity: false
  },
  {
    name: 'empty graphs allow both caller-visible status outputs to be omitted',
    vertexCount: 0,
    sourceChunks: [[]],
    targetChunks: [[]],
    iterations: 0,
    convergence: false,
    validity: false,
    expectedLabels: []
  },
  {
    name: 'nonempty edgeless graphs fail closed because modularity has zero total weight',
    vertexCount: 4,
    sourceChunks: [[], []],
    targetChunks: [[], []],
    iterations: 1,
    expectedLabels: [INVALID_COMMUNITY, INVALID_COMMUNITY, INVALID_COMMUNITY, INVALID_COMMUNITY],
    expectedConvergence: false,
    expectedValidity: false
  },
  {
    name: 'all-zero accepted edge weights have no defined modularity objective',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    weightChunks: [[0], [], [0]],
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'one undirected move selects the lowest tied vertex and publishes exact score zero',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    directed: false,
    iterations: 1,
    expectedLabels: [1, 1],
    expectedScore: 0,
    expectedConvergence: false
  },
  {
    name: 'a subsequent no-improvement round truthfully proves local convergence',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    directed: false,
    iterations: 2,
    expectedLabels: [1, 1],
    expectedScore: 0,
    expectedConvergence: true
  },
  {
    name: 'zero rounds preserve exact singleton labels and their negative initial quality',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    directed: false,
    iterations: 0,
    expectedLabels: [0, 1],
    expectedScore: -0.5,
    expectedConvergence: false
  },
  {
    name: 'zero rounds preserve caller-supplied community assignments and exact quality',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    initialCommunities: [0, 0, 2, 2],
    directed: false,
    iterations: 0,
    expectedLabels: [0, 0, 2, 2],
    expectedScore: 0.5,
    expectedConvergence: false
  },
  {
    name: 'directed warm-start communities can split into a genuinely empty singleton label',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[0], [], [1]],
    initialCommunities: [0, 0],
    iterations: 1,
    expectedLabels: [1, 0],
    expectedScore: 0.5,
    expectedConvergence: false
  },
  {
    name: 'directed singleton splits converge only after another complete no-improvement round',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[0], [], [1]],
    initialCommunities: [0, 0],
    iterations: 2,
    expectedLabels: [1, 0],
    expectedScore: 0.5,
    expectedConvergence: true
  },
  {
    name: 'undirected warm-start communities can split self-loops into an empty singleton label',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[0], [], [1]],
    initialCommunities: [0, 0],
    directed: false,
    iterations: 1,
    expectedLabels: [1, 0],
    expectedScore: 0.5,
    expectedConvergence: false
  },
  {
    name: 'undirected singleton splits publish truthful convergence after the following round',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[0], [], [1]],
    initialCommunities: [0, 0],
    directed: false,
    iterations: 2,
    expectedLabels: [1, 0],
    expectedScore: 0.5,
    expectedConvergence: true
  },
  {
    name: 'singleton vacancy selection includes labels occupied solely by isolated vertices',
    vertexCount: 3,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[0], [], [1]],
    initialCommunities: [2, 2, 0],
    iterations: 2,
    expectedLabels: [1, 2, 0],
    expectedScore: 0.5,
    expectedConvergence: true
  },
  {
    name: 'singleton creation chooses the lowest genuinely absent stable community identifier',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[0], [], [1]],
    initialCommunities: [1, 1],
    directed: false,
    iterations: 1,
    expectedLabels: [0, 1],
    expectedScore: 0.5,
    expectedConvergence: false
  },
  {
    name: 'weighted singleton splitting preserves original source-edge modularity contributions',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[0], [], [1]],
    weightChunks: [[3], [], [1]],
    initialCommunities: [0, 0],
    directed: false,
    iterations: 2,
    expectedLabels: [1, 0],
    expectedScore: 0.375,
    expectedConvergence: true
  },
  {
    name: 'strict minimumGain rejects a singleton split whose quality gain equals its threshold',
    vertexCount: 2,
    sourceChunks: [[0], [], [1]],
    targetChunks: [[0], [], [1]],
    initialCommunities: [0, 0],
    minimumGain: 0.5,
    iterations: 1,
    expectedLabels: [0, 0],
    expectedScore: 0,
    expectedConvergence: true
  },
  {
    name: 'disconnected directed edges optimize into independent stable communities',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    iterations: 3,
    expectedLabels: [1, 1, 3, 3],
    expectedScore: 0.5,
    expectedConvergence: true
  },
  {
    name: 'disconnected undirected edges improve exact modularity without merging components',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    directed: false,
    iterations: 3,
    expectedLabels: [1, 1, 3, 3],
    expectedScore: 0.5,
    expectedConvergence: true
  },
  {
    name: 'dense bridged communities gain quality without claiming multilevel Louvain',
    vertexCount: 8,
    sourceChunks: [[0, 0, 0, 1, 1, 2], [], [4, 4, 4, 5, 5, 6, 3]],
    targetChunks: [[1, 2, 3, 2, 3, 3], [], [5, 6, 7, 6, 7, 7, 4]],
    directed: false,
    iterations: 8
  },
  {
    name: 'weighted directed transitions select the globally strongest modularity improvement',
    vertexCount: 5,
    sourceChunks: [[0, 0], [], [3]],
    targetChunks: [[1, 2], [], [4]],
    weightChunks: [[1, 5], [], [2]],
    iterations: 3
  },
  {
    name: 'weighted undirected transitions preserve original positive edge strengths',
    vertexCount: 5,
    sourceChunks: [[0, 0], [], [3]],
    targetChunks: [[1, 2], [], [4]],
    weightChunks: [[1, 5], [], [2]],
    directed: false,
    iterations: 3
  },
  {
    name: 'resolution zero retains exact internal-edge fraction as the optimized objective',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    directed: false,
    resolution: 0,
    iterations: 3,
    expectedScore: 1
  },
  {
    name: 'a larger modularity resolution changes admissible null-model improvements',
    vertexCount: 5,
    sourceChunks: [[0, 1], [], [2, 3]],
    targetChunks: [[1, 2], [], [3, 4]],
    directed: false,
    resolution: 2,
    iterations: 4
  },
  {
    name: 'strict minimumGain rejects a move whose improvement equals the threshold',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    directed: false,
    minimumGain: 0.375,
    iterations: 1,
    expectedLabels: [0, 1, 2, 3],
    expectedScore: -0.25,
    expectedConvergence: true
  },
  {
    name: 'a slightly smaller strict minimumGain admits the same deterministic improvement',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    directed: false,
    minimumGain: 0.374,
    iterations: 1,
    expectedLabels: [1, 1, 2, 3],
    expectedConvergence: false
  },
  {
    name: 'equally improving neighbor communities resolve to the lowest candidate label',
    vertexCount: 5,
    sourceChunks: [[0, 0], [], [3]],
    targetChunks: [[1, 2], [], [4]],
    directed: false,
    iterations: 1
  },
  {
    name: 'undirected self-loops contribute twice to degree but never create a self move',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[0], [], [3]],
    weightChunks: [[2], [], [2]],
    directed: false,
    iterations: 3,
    expectedScore: 0.5
  },
  {
    name: 'directed self-loops preserve their original single internal-edge contribution',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[0], [], [3]],
    weightChunks: [[2], [], [2]],
    iterations: 3,
    expectedScore: 0.5
  },
  {
    name: 'parallel source rows remain independent weighted modularity contributions',
    vertexCount: 4,
    sourceChunks: [[0, 0], [], [2]],
    targetChunks: [[1, 1], [], [3]],
    weightChunks: [[1, 2], [], [1]],
    directed: false,
    iterations: 3,
    expectedScore: 0.375
  },
  {
    name: 'reciprocal directed rows remain separate original edges and weak candidates',
    vertexCount: 4,
    sourceChunks: [[0, 1], [], [2, 3]],
    targetChunks: [[1, 0], [], [3, 2]],
    iterations: 3,
    expectedScore: 0.5
  },
  {
    name: 'out-of-range endpoints and their negative source weights are ignored',
    vertexCount: 4,
    sourceChunks: [[0, 9], [], [2]],
    targetChunks: [[1, 1], [], [3]],
    weightChunks: [[1, -5], [], [1]],
    iterations: 3,
    expectedScore: 0.5,
    expectedValidity: true
  },
  {
    name: 'negative accepted edge weights invalidate every output rather than publishing moves',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    weightChunks: [[1], [], [-1]],
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'NaN accepted edge weights fail closed before proposal selection',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    weightChunks: [[1], [], [Number.NaN]],
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'positive infinite accepted edge weights fail closed before reductions',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    weightChunks: [[Number.POSITIVE_INFINITY]],
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'negative infinite accepted edge weights fail closed before reductions',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    weightChunks: [[Number.NEGATIVE_INFINITY]],
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'float32 community-volume accumulation overflow fails closed',
    vertexCount: 2,
    sourceChunks: [[0], [], [0]],
    targetChunks: [[1], [], [1]],
    weightChunks: [[3.4028234663852886e38], [], [3.4028234663852886e38]],
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'out-of-range warm-start labels on isolated vertices invalidate the entire partition',
    vertexCount: 4,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    initialCommunities: [0, 0, 2, 9],
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'unsigned invalid-community sentinel warm starts fail closed',
    vertexCount: 2,
    sourceChunks: [[0]],
    targetChunks: [[1]],
    initialCommunities: [0, INVALID_COMMUNITY],
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'forward CSR overflow publishes invalid labels and zero modularity',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    capacity: 1,
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'reverse CSR overflow publishes invalid labels and zero modularity',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    reverseCapacity: 1,
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'undirected symmetrized adjacency overflow never optimizes truncated neighbors',
    vertexCount: 4,
    sourceChunks: [[0, 1, 2]],
    targetChunks: [[1, 2, 3]],
    directed: false,
    capacity: 2,
    iterations: 1,
    expectedValidity: false
  },
  {
    name: 'optional convergence and validity buffers may be omitted independently',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    iterations: 3,
    convergence: false,
    validity: false,
    expectedScore: 0.5
  },
  {
    name: 'four-byte sliced CSR, warm labels, outputs, and scalar statuses preserve view offsets',
    vertexCount: 4,
    sourceChunks: [[0], [], [2]],
    targetChunks: [[1], [], [3]],
    initialCommunities: [0, 0, 2, 2],
    byteOffset: 4,
    iterations: 2,
    expectedScore: 0.5,
    expectedConvergence: true
  },
  {
    name: 'bounded three-dimensional dispatch reaches final source and candidate vertices',
    vertexCount: 1025,
    sourceChunks: [[0], [], [1024]],
    targetChunks: [[1], [], [1023]],
    iterations: 1,
    maximumWorkgroups: 2
  }
];

test('LuGraphModularityOptimization plans bounded three-dimensional graph dispatch', tapeTest => {
  tapeTest.deepEqual(getLuGraphModularityOptimizationDispatchLayout(0, 2), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getLuGraphModularityOptimizationDispatchLayout(513, 2), {x: 2, y: 2, z: 1});
  tapeTest.deepEqual(getLuGraphModularityOptimizationDispatchLayout(1025, 2), {x: 2, y: 2, z: 2});
  tapeTest.throws(
    () => getLuGraphModularityOptimizationDispatchLayout(2049, 2),
    /3D dispatch limit/
  );
  tapeTest.end();
});

for (const scenario of optimizationScenarios) {
  test(`LuGraphModularityOptimization GPU: ${scenario.name}`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const expected = calculateExpectedOptimization(scenario);
    const fixture = createExecutionFixture(device, scenario, expected);
    try {
      compileOptimization(fixture, scenario.maximumWorkgroups);
      executeOptimization(fixture);
      await assertOptimization(tapeTest, fixture, expected, scenario);
      tapeTest.deepEqual(
        fixture.graph.sourceVertices.data.map(chunk => chunk.length),
        scenario.sourceChunks.map(chunk => chunk.length),
        'optimization preserves all original ordered source chunks'
      );
      if (scenario.expectedLabels) {
        tapeTest.deepEqual(
          expected.labels,
          scenario.expectedLabels,
          'independent greedy modularity oracle confirms the documented stable labels'
        );
      }
      if (scenario.expectedScore !== undefined) {
        tapeTest.ok(
          Math.abs(expected.score - scenario.expectedScore) < SCORE_TOLERANCE,
          `independent original-edge modularity oracle confirms documented score ${scenario.expectedScore}`
        );
      }
      if (scenario.expectedConvergence !== undefined) {
        tapeTest.equal(expected.converged, scenario.expectedConvergence);
      }
      if (scenario.expectedValidity !== undefined) {
        tapeTest.equal(expected.valid, scenario.expectedValidity);
      }
    } finally {
      destroyExecutionFixture(tapeTest, fixture);
    }

    tapeTest.end();
  });
}

test('LuGraphModularityOptimization composes label propagation and baseline scoring on GPU', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const scenario: OptimizationScenario = {
    name: 'label propagation baseline then modularity local-moving',
    vertexCount: 6,
    sourceChunks: [[0, 1, 2], [], [3, 4, 5]],
    targetChunks: [[1, 2, 0], [], [4, 5, 3]],
    directed: false,
    initialCommunities: [0, 0, 0, 3, 3, 3],
    iterations: 2,
    expectedScore: 0.5
  };
  const expected = calculateExpectedOptimization(scenario);
  const fixture = createExecutionFixture(device, scenario, expected);
  const seed = fixture.optimization.initialCommunities!;
  const baselineScore = createOutputVector(
    device,
    fixture.buffers,
    fixture.vectors,
    'unoptimized-community-score',
    'float32',
    1
  );
  const propagation = new LuGraphLabelPropagation({
    topology: fixture.topology,
    output: seed,
    iterations: 8
  });
  const baseline = new LuGraphModularity({
    graph: fixture.graph,
    communities: seed,
    output: baselineScore
  });
  const submit = vi.spyOn(device, 'submit');
  const seedReadback = vi.spyOn(seed.data[0].buffer as Buffer, 'readAsync');

  try {
    fixture.topology.addToGraph(fixture.commandGraph);
    propagation.addToGraph(fixture.commandGraph);
    baseline.addToGraph(fixture.commandGraph);
    fixture.optimization.addToGraph(fixture.commandGraph);
    fixture.compiled = fixture.commandGraph.compile();
    tapeTest.equal(submit.mock.calls.length, 0, 'GPU pipeline compilation never submits work');
    tapeTest.equal(
      seedReadback.mock.calls.length,
      0,
      'warm-start community assignments never pass through the CPU'
    );
    submit.mockRestore();

    executeOptimization(fixture);
    await assertOptimization(tapeTest, fixture, expected, scenario);
    const [initialScore] = await readFloat32Vector(baselineScore);
    const [optimizedScore] = await readFloat32Vector(fixture.optimization.modularity);
    tapeTest.ok(
      optimizedScore + SCORE_TOLERANCE >= initialScore,
      'exact GPU-scored local-moving never reduces the label-propagation baseline quality'
    );
    tapeTest.equal(
      seedReadback.mock.calls.length,
      0,
      'modularity optimization consumes live caller-owned label propagation output entirely on GPU'
    );
  } finally {
    submit.mockRestore();
    seedReadback.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

test('LuGraphModularityOptimization rereads live edge columns and warm starts on each encoding', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const initial: OptimizationScenario = {
    name: 'live disconnected communities',
    vertexCount: 4,
    sourceChunks: [[0, 2]],
    targetChunks: [[1, 3]],
    initialCommunities: [0, 1, 2, 3],
    directed: false,
    iterations: 3
  };
  const expectedInitial = calculateExpectedOptimization(initial);
  const fixture = createExecutionFixture(device, initial, expectedInitial);
  const submit = vi.spyOn(device, 'submit');
  const sourceReadbacks = [
    ...fixture.graph.sourceVertices.data,
    ...fixture.graph.targetVertices.data,
    ...fixture.optimization.initialCommunities!.data
  ].map(chunk => vi.spyOn(chunk.buffer as Buffer, 'readAsync'));

  try {
    compileOptimization(fixture);
    tapeTest.equal(submit.mock.calls.length, 0, 'graph construction does not submit commands');
    tapeTest.ok(sourceReadbacks.every(readback => readback.mock.calls.length === 0));
    submit.mockRestore();

    executeOptimization(fixture);
    await assertOptimization(tapeTest, fixture, expectedInitial, initial);

    const updated: OptimizationScenario = {
      ...initial,
      name: 'live path and preclustered warm start',
      targetChunks: [[1, 1]],
      initialCommunities: [0, 0, 2, 3]
    };
    (fixture.graph.targetVertices.data[0].buffer as Buffer).write(Uint32Array.from([1, 1]));
    (fixture.optimization.initialCommunities!.data[0].buffer as Buffer).write(
      Uint32Array.from(updated.initialCommunities!)
    );
    executeOptimization(fixture);
    await assertOptimization(tapeTest, fixture, calculateExpectedOptimization(updated), updated);
    tapeTest.ok(
      sourceReadbacks.every(readback => readback.mock.calls.length === 0),
      'repeated graph encoding consumes live edge and seed buffers without CPU synchronization'
    );
  } finally {
    submit.mockRestore();
    for (const readback of sourceReadbacks) readback.mockRestore();
    destroyExecutionFixture(tapeTest, fixture);
  }

  tapeTest.end();
});

/** Replays deterministic single-vertex modularity moves independently over original source rows. */
function calculateExpectedOptimization(scenario: OptimizationScenario): ExpectedOptimization {
  const edges: AcceptedEdge[] = [];
  let invalidEdgeCount = 0;
  let forwardCount = 0;
  let reverseCount = 0;
  let invalidWeight = false;

  for (const [chunkIndex, sources] of scenario.sourceChunks.entries()) {
    for (const [rowIndex, source] of sources.entries()) {
      const target = scenario.targetChunks[chunkIndex][rowIndex];
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

      const weight = Math.fround(scenario.weightChunks?.[chunkIndex][rowIndex] ?? 1);
      if (!Number.isFinite(weight) || weight < 0) {
        invalidWeight = true;
        continue;
      }
      edges.push({source, target, weight});
    }
  }

  const forwardOverflow = forwardCount > (scenario.capacity ?? forwardCount);
  const reverseOverflow =
    scenario.directed !== false && reverseCount > (scenario.reverseCapacity ?? reverseCount);
  let labels = scenario.initialCommunities
    ? [...scenario.initialCommunities]
    : Array.from({length: scenario.vertexCount}, (_value, vertex) => vertex);
  const invalidSeed = labels.some(label => label >= scenario.vertexCount);
  const initialQuality = calculatePartitionScore(scenario, labels, edges);
  const invalid =
    invalidWeight || forwardOverflow || reverseOverflow || invalidSeed || !initialQuality.valid;

  if (invalid) {
    return {
      labels: new Array<number>(scenario.vertexCount).fill(INVALID_COMMUNITY),
      score: 0,
      initialScore: initialQuality.score,
      valid: false,
      converged: scenario.vertexCount === 0 && !forwardOverflow && !reverseOverflow,
      invalidEdgeCount,
      forwardCount,
      reverseCount,
      forwardOverflow,
      reverseOverflow
    };
  }

  const minimumGain = Math.fround(scenario.minimumGain ?? 0);
  const iterations = scenario.iterations ?? 32;
  let score = initialQuality.score;
  let converged = false;

  for (let iteration = 0; iteration < iterations; iteration++) {
    const occupiedCommunities = new Set(labels);
    let availableCommunity = INVALID_COMMUNITY;
    for (let community = 0; community < scenario.vertexCount; community++) {
      if (!occupiedCommunities.has(community)) {
        availableCommunity = community;
        break;
      }
    }

    let selectedVertex = INVALID_COMMUNITY;
    let selectedCommunity = INVALID_COMMUNITY;
    let selectedGain = minimumGain;

    for (let vertex = 0; vertex < scenario.vertexCount; vertex++) {
      const candidateCommunities = new Set<number>();
      if (availableCommunity !== INVALID_COMMUNITY) {
        candidateCommunities.add(availableCommunity);
      }
      for (const edge of edges) {
        if (edge.source === vertex && edge.target !== vertex) {
          candidateCommunities.add(labels[edge.target]);
        }
        if (edge.target === vertex && edge.source !== vertex) {
          candidateCommunities.add(labels[edge.source]);
        }
      }

      for (const candidate of [...candidateCommunities].sort((first, second) => first - second)) {
        if (candidate === labels[vertex]) continue;
        const nextLabels = [...labels];
        nextLabels[vertex] = candidate;
        const nextQuality = calculatePartitionScore(scenario, nextLabels, edges);
        const gain = Math.fround(nextQuality.score - score);
        if (!nextQuality.valid || gain <= 0 || gain <= minimumGain) continue;

        if (
          selectedVertex === INVALID_COMMUNITY ||
          gain > selectedGain + 1e-7 ||
          (Math.abs(gain - selectedGain) <= 1e-7 &&
            (vertex < selectedVertex ||
              (vertex === selectedVertex && candidate < selectedCommunity)))
        ) {
          selectedVertex = vertex;
          selectedCommunity = candidate;
          selectedGain = gain;
        }
      }
    }

    if (selectedVertex === INVALID_COMMUNITY) {
      converged = true;
      break;
    }
    labels[selectedVertex] = selectedCommunity;
    score = calculatePartitionScore(scenario, labels, edges).score;
  }

  return {
    labels,
    score,
    initialScore: initialQuality.score,
    valid: true,
    converged,
    invalidEdgeCount,
    forwardCount,
    reverseCount,
    forwardOverflow,
    reverseOverflow
  };
}

/** Evaluates directed and undirected Newman modularity from preserved original source batches. */
function calculatePartitionScore(
  scenario: OptimizationScenario,
  labels: readonly number[],
  edges: readonly AcceptedEdge[]
): {score: number; valid: boolean} {
  if (labels.some(label => label >= scenario.vertexCount)) return {score: 0, valid: false};

  const directed = scenario.directed !== false;
  const resolution = Math.fround(scenario.resolution ?? 1);
  const outgoingVolumes = new Float32Array(scenario.vertexCount);
  const incomingVolumes = new Float32Array(scenario.vertexCount);
  const internalWeights = new Float32Array(scenario.vertexCount);

  for (const {source, target, weight} of edges) {
    const sourceCommunity = labels[source];
    const targetCommunity = labels[target];
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

  const totalVolume = Array.from(outgoingVolumes).reduce(
    (total, volume) => Math.fround(total + volume),
    0
  );
  if (!Number.isFinite(totalVolume) || totalVolume <= 0) return {score: 0, valid: false};

  let score = 0;
  for (const [community, outgoing] of outgoingVolumes.entries()) {
    const incoming = directed ? incomingVolumes[community] : outgoing;
    const internalTerm = Math.fround(
      Math.fround(internalWeights[community] / totalVolume) * (directed ? 1 : 2)
    );
    const expectedTerm = Math.fround(
      Math.fround(resolution * Math.fround(outgoing / totalVolume)) *
        Math.fround(incoming / totalVolume)
    );
    const contribution = Math.fround(internalTerm - expectedTerm);
    if (!Number.isFinite(contribution)) return {score: 0, valid: false};
    score = Math.fround(score + contribution);
  }
  return Number.isFinite(score) ? {score, valid: true} : {score: 0, valid: false};
}

function createExecutionFixture(
  device: Device,
  scenario: OptimizationScenario,
  expected: ExpectedOptimization
): OptimizationExecutionFixture {
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
  const initialCommunities = scenario.initialCommunities
    ? createOutputVector(
        device,
        buffers,
        vectors,
        'initial-communities',
        'uint32',
        scenario.vertexCount,
        scenario.byteOffset,
        Uint32Array.from(scenario.initialCommunities)
      )
    : undefined;
  const output = createOutputVector(
    device,
    buffers,
    vectors,
    'optimized-communities',
    'uint32',
    scenario.vertexCount,
    scenario.byteOffset
  );
  const modularity = createOutputVector(
    device,
    buffers,
    vectors,
    'optimized-modularity',
    'float32',
    1,
    scenario.byteOffset
  );
  const converged =
    scenario.convergence === false
      ? undefined
      : createOutputVector(device, buffers, vectors, 'converged', 'uint32', 1, scenario.byteOffset);
  const valid =
    scenario.validity === false
      ? undefined
      : createOutputVector(device, buffers, vectors, 'valid', 'uint32', 1, scenario.byteOffset);
  const optimization = new LuGraphModularityOptimization({
    topology,
    output,
    modularity,
    initialCommunities,
    resolution: scenario.resolution,
    iterations: scenario.iterations,
    minimumGain: scenario.minimumGain,
    converged,
    valid
  });

  return {
    device,
    buffers,
    vectors,
    graph,
    topology,
    optimization,
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
      capacity,
      byteOffset
    ),
    edgeIds: createOutputVector(
      device,
      buffers,
      vectors,
      `${name}-edge-ids`,
      'uint32',
      capacity,
      byteOffset
    ),
    ...(weighted
      ? {
          edgeWeights: createOutputVector(
            device,
            buffers,
            vectors,
            `${name}-weights`,
            'float32',
            capacity,
            byteOffset
          )
        }
      : {}),
    count: createOutputVector(device, buffers, vectors, `${name}-count`, 'uint32', 1, byteOffset),
    overflow: createOutputVector(
      device,
      buffers,
      vectors,
      `${name}-overflow`,
      'uint32',
      1,
      byteOffset
    )
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

function compileOptimization(
  fixture: OptimizationExecutionFixture,
  maximumWorkgroups?: number
): void {
  fixture.topology.addToGraph(fixture.commandGraph);
  if (maximumWorkgroups === undefined) {
    fixture.optimization.addToGraph(fixture.commandGraph);
  } else {
    addLuGraphModularityOptimizationToGraphWithDispatchLimit(
      fixture.optimization,
      fixture.commandGraph,
      maximumWorkgroups
    );
  }
  fixture.compiled = fixture.commandGraph.compile();
}

function executeOptimization(fixture: OptimizationExecutionFixture): void {
  const encoder = fixture.device.createCommandEncoder({
    id: 'lu-graph-modularity-optimization-test'
  });
  fixture.compiled!.encode(encoder, {parameters: undefined});
  fixture.device.submit(encoder.finish());
}

async function assertOptimization(
  tapeTest: Test,
  fixture: OptimizationExecutionFixture,
  expected: ExpectedOptimization,
  scenario: OptimizationScenario
): Promise<void> {
  const [labels, score, invalidEdges, forwardOverflow] = await Promise.all([
    readUint32Vector(fixture.optimization.output),
    readFloat32Vector(fixture.optimization.modularity),
    readUint32Vector(fixture.topology.invalidEdgeCount),
    readUint32Vector(fixture.topology.forward.overflow)
  ]);
  tapeTest.deepEqual(
    labels,
    expected.labels,
    'GPU communities match an independent deterministic globally-best CPU local-moving oracle'
  );
  tapeTest.ok(
    Math.abs(score[0] - expected.score) < SCORE_TOLERANCE,
    `exact GPU modularity ${score[0]} agrees with original-source CPU objective ${expected.score}`
  );
  tapeTest.equal(
    invalidEdges[0],
    expected.invalidEdgeCount,
    'invalid source endpoints are excluded'
  );
  tapeTest.equal(
    forwardOverflow[0],
    Number(expected.forwardOverflow),
    'CSR overflow stays explicit'
  );
  if (expected.valid) {
    tapeTest.ok(
      score[0] + SCORE_TOLERANCE >= expected.initialScore,
      'strictly positive accepted moves never lower the exact initial partition modularity'
    );
  } else {
    tapeTest.equal(score[0], 0, 'undefined modularity never publishes a misleading partial score');
    tapeTest.ok(
      labels.every(label => label === INVALID_COMMUNITY),
      'invalid graph states fail closed for every community label'
    );
  }
  if (fixture.optimization.converged) {
    const converged = await readUint32Vector(fixture.optimization.converged);
    tapeTest.equal(converged[0], Number(expected.converged), 'local convergence is truthful');
  }
  if (fixture.optimization.valid) {
    const validity = await readUint32Vector(fixture.optimization.valid);
    tapeTest.equal(validity[0], Number(expected.valid), 'validity matches the exact scored graph');
  }
  if (fixture.topology.reverse) {
    const reverseOverflow = await readUint32Vector(fixture.topology.reverse.overflow);
    tapeTest.equal(reverseOverflow[0], Number(expected.reverseOverflow));
  }
  if (scenario.expectedLabels) {
    tapeTest.deepEqual(labels, scenario.expectedLabels, 'documented stable tie-break labels match');
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
  const data = vector.data[0];
  const bytes = await (data.buffer as Buffer).readAsync(
    data.byteOffset,
    vector.length * Float32Array.BYTES_PER_ELEMENT
  );
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

function destroyExecutionFixture(tapeTest: Test, fixture: OptimizationExecutionFixture): void {
  fixture.compiled?.destroy();
  for (const vector of fixture.vectors) vector.destroy();
  tapeTest.ok(
    fixture.buffers.every(buffer => !buffer.destroyed),
    'destroying graph scratch never destroys caller-owned source or destination buffers'
  );
  for (const buffer of fixture.buffers) buffer.destroy();
}
