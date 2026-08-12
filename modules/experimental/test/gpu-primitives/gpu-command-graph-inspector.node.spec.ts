// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type {CommandEncoder} from '@luma.gl/core';
import {
  GPUCommandGraphInspector,
  type GPUCommandGraphCapabilities,
  type GPUCommandGraphEncodingStats,
  type GPUCommandGraphInspectorEncoding,
  type GPUCommandGraphInspectorGraph,
  type GPUCommandGraphInspectorObservableGraph,
  type GPUCommandGraphStats,
  type GPUCommandGraphTimingReport
} from '@luma.gl/experimental';

type ObservationParameters = {
  cpuTimeMilliseconds: number;
  gpuTimeMilliseconds: number;
};

const COMMAND_ENCODER = {} as CommandEncoder;

const GRAPH_STATS: GPUCommandGraphStats = {
  nodeOrder: ['prepare', 'render'],
  importedBufferCount: 1,
  importedBufferBytes: 64,
  logicalBufferCount: 2,
  logicalBufferBytes: 192,
  logicalTransientBufferCount: 1,
  physicalTransientBufferCount: 1,
  logicalTransientBytes: 128,
  physicalTransientBytes: 128,
  reusedTransientBytes: 0,
  reusePercentage: 0,
  importedTextureCount: 0,
  importedTextureBytes: 0,
  logicalTextureCount: 1,
  logicalTextureBytes: 256,
  logicalTransientTextureCount: 1,
  physicalTransientTextureCount: 1,
  logicalTransientTextureBytes: 256,
  physicalTransientTextureBytes: 256,
  reusedTransientTextureBytes: 0,
  textureReusePercentage: 0,
  logicalResourceBytes: 448,
  physicalTransientResourceBytes: 384
};

const GRAPH_CAPABILITIES: GPUCommandGraphCapabilities = {
  timestampQueries: true,
  subgroups: true,
  subgroupId: true,
  subgroupMinSize: 4,
  subgroupMaxSize: 128,
  softwareAdapter: false,
  maxBufferByteLength: 1_000_000,
  maxStorageBufferBindingByteLength: 500_000,
  maxComputeInvocationsPerWorkgroup: 256,
  maxComputeWorkgroupsPerDimension: 65_535
};

test('GPUCommandGraphInspector summarizes bounded CPU and GPU samples', async testCase => {
  const inspector = new GPUCommandGraphInspector({
    maxSamples: 2,
    getNodeGroup: node => (node.id === 'render' ? 'drawing' : 'query')
  });
  inspector.registerGraph(makeGraph('spatial'));

  const samples = [
    makeEncoding(10, 2, 3, 100, 20, 30),
    makeEncoding(20, 4, 6, 200, 40, 60),
    makeEncoding(30, 6, 9, 300, 60, 90)
  ];
  for (const encoding of samples) {
    inspector.recordEncoding('spatial', encoding);
    await inspector.recordGPUTimings('spatial', encoding);
  }

  const snapshot = inspector.getSnapshot();
  const graph = snapshot.graphs[0];
  testCase.equal(graph.encodingCount, 3, 'counts every synchronous encoding');
  testCase.deepEqual(
    graph.totals.cpu,
    {sampleCount: 2, latestMilliseconds: 30, p50Milliseconds: 20, p95Milliseconds: 30},
    'bounds and summarizes whole-graph CPU samples'
  );
  testCase.deepEqual(
    graph.totals.gpu,
    {sampleCount: 2, latestMilliseconds: 300, p50Milliseconds: 200, p95Milliseconds: 300},
    'bounds and summarizes whole-graph GPU samples'
  );
  testCase.deepEqual(
    graph.nodes.map(node => [node.id, node.type, node.group]),
    [
      ['prepare', 'compute', 'query'],
      ['render', 'render', 'drawing']
    ],
    'preserves compiled node order and semantic groups'
  );
  testCase.deepEqual(
    graph.nodes[0].cpu,
    {sampleCount: 2, latestMilliseconds: 6, p50Milliseconds: 4, p95Milliseconds: 6},
    'summarizes per-node CPU samples'
  );
  testCase.deepEqual(
    graph.nodes[1].gpu,
    {sampleCount: 2, latestMilliseconds: 90, p50Milliseconds: 60, p95Milliseconds: 90},
    'summarizes per-node GPU samples'
  );
  testCase.end();
});

test('GPUCommandGraphInspector summarizes bounded scalar counters', testCase => {
  const inspector = new GPUCommandGraphInspector({maxSamples: 2});
  inspector.registerGraph(makeGraph('counters'));
  inspector.recordCounters('counters', {candidates: 30, intersectedCells: 3});
  inspector.recordCounters('counters', {candidates: 10, intersectedCells: 1});
  inspector.recordCounters('counters', {candidates: 20, intersectedCells: 2});

  testCase.deepEqual(
    inspector.getSnapshot().graphs[0].counters,
    [
      {
        id: 'candidates',
        sampleCount: 2,
        latestValue: 20,
        p50Value: 10,
        p95Value: 20
      },
      {
        id: 'intersectedCells',
        sampleCount: 2,
        latestValue: 2,
        p50Value: 1,
        p95Value: 2
      }
    ],
    'retains bounded samples and preserves first-observed counter order'
  );
  testCase.throws(
    () => inspector.recordCounters('counters', {valid: 1, invalid: Number.NaN}),
    /finite, non-negative value/,
    'rejects invalid counter batches'
  );
  testCase.equal(
    inspector.getSnapshot().graphs[0].counters.length,
    2,
    'validates the complete batch before recording any sample'
  );
  testCase.end();
});

test('GPUCommandGraphInspector returns immutable snapshots and copied graph metadata', testCase => {
  const stats = {...GRAPH_STATS, nodeOrder: [...GRAPH_STATS.nodeOrder]};
  const capabilities = {...GRAPH_CAPABILITIES};
  const graph: GPUCommandGraphInspectorGraph = {id: 'immutable', stats, capabilities};
  const inspector = new GPUCommandGraphInspector();
  inspector.registerGraph(graph);
  inspector.recordEncoding('immutable', makeEncoding(1, 0.25, 0.5));
  inspector.recordCounters('immutable', {candidates: 12});

  stats.nodeOrder[0] = 'changed';
  capabilities.timestampQueries = false;
  const snapshot = inspector.getSnapshot();
  const graphSnapshot = snapshot.graphs[0];
  testCase.deepEqual(graphSnapshot.stats.nodeOrder, ['prepare', 'render'], 'copies node order');
  testCase.equal(graphSnapshot.capabilities.timestampQueries, true, 'copies adapter capabilities');
  testCase.ok(Object.isFrozen(snapshot), 'freezes the root snapshot');
  testCase.ok(Object.isFrozen(snapshot.graphs), 'freezes the graph list');
  testCase.ok(Object.isFrozen(graphSnapshot), 'freezes each graph');
  testCase.ok(Object.isFrozen(graphSnapshot.stats), 'freezes compile statistics');
  testCase.ok(Object.isFrozen(graphSnapshot.stats.nodeOrder), 'freezes compiled node order');
  testCase.ok(Object.isFrozen(graphSnapshot.totals), 'freezes graph totals');
  testCase.ok(Object.isFrozen(graphSnapshot.totals.cpu), 'freezes duration summaries');
  testCase.ok(Object.isFrozen(graphSnapshot.counters), 'freezes the counter list');
  testCase.ok(Object.isFrozen(graphSnapshot.counters[0]), 'freezes each counter summary');
  testCase.ok(Object.isFrozen(graphSnapshot.nodes), 'freezes the node list');
  testCase.ok(Object.isFrozen(graphSnapshot.nodes[0]), 'freezes each node summary');
  testCase.end();
});

test('GPUCommandGraphInspector observes encode and post-submit timing lifecycles', async testCase => {
  const inspector = new GPUCommandGraphInspector();
  const graph = makeObservableGraph('observed');
  const observation = inspector.observeGraph(graph);
  const encoding = observation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 8, gpuTimeMilliseconds: 80}
  });
  await observation.recordGPUTimings(encoding);

  const graphSnapshot = inspector.getSnapshot().graphs[0];
  testCase.equal(observation.graph, graph, 'exposes the observed graph without wrapping ownership');
  testCase.ok(Object.isFrozen(observation), 'returns an immutable observation handle');
  testCase.equal(graphSnapshot.encodingCount, 1, 'records CPU stats while delegating encode');
  testCase.equal(graphSnapshot.totals.cpu.latestMilliseconds, 8, 'records delegated CPU time');
  testCase.equal(
    graphSnapshot.totals.gpu.latestMilliseconds,
    80,
    'records explicit post-submit GPU time without a repeated graph id'
  );

  observation.detach();
  observation.detach();
  observation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 16, gpuTimeMilliseconds: 160}
  });
  testCase.deepEqual(
    inspector.getSnapshot().graphs,
    [],
    'detach is idempotent and stops observation without disabling graph encoding'
  );
  testCase.end();
});

test('GPUCommandGraphInspector observations isolate same-id replacement lifecycles', async testCase => {
  const inspector = new GPUCommandGraphInspector();
  const oldObservation = inspector.observeGraph(makeObservableGraph('replaceable'));
  const oldEncoding = oldObservation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 3, gpuTimeMilliseconds: 30}
  });
  const currentObservation = inspector.observeGraph(makeObservableGraph('replaceable'));

  oldObservation.detach();
  await oldObservation.recordGPUTimings(oldEncoding);
  oldObservation.recordCounters({candidates: 99});
  oldObservation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 5, gpuTimeMilliseconds: 50}
  });
  currentObservation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 7, gpuTimeMilliseconds: 70}
  });
  currentObservation.recordCounters({candidates: 7});

  const graph = inspector.getSnapshot().graphs[0];
  testCase.equal(graph.encodingCount, 1, 'an old handle cannot record into its replacement');
  testCase.equal(graph.totals.cpu.latestMilliseconds, 7, 'keeps only the current observation');
  testCase.equal(
    graph.totals.gpu.sampleCount,
    0,
    'an old handle cannot attach pending timings to its replacement'
  );
  testCase.equal(
    graph.counters[0].latestValue,
    7,
    'an old handle cannot publish delayed counters into its replacement'
  );
  currentObservation.detach();
  currentObservation.recordCounters({candidates: 70});
  testCase.deepEqual(
    inspector.getSnapshot().graphs,
    [],
    'the current handle owns its registration'
  );
  testCase.end();
});

test('GPUCommandGraphInspector observations reject foreign encodings', async testCase => {
  const inspector = new GPUCommandGraphInspector();
  const firstObservation = inspector.observeGraph(makeObservableGraph('first'));
  const secondObservation = inspector.observeGraph(makeObservableGraph('second'));
  const firstEncoding = firstObservation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 4, gpuTimeMilliseconds: 40}
  });

  await secondObservation.recordGPUTimings(firstEncoding);
  testCase.deepEqual(
    inspector.getSnapshot().graphs.map(graph => graph.totals.gpu.sampleCount),
    [0, 0],
    "does not attribute another observation's timing report to the current graph"
  );
  await firstObservation.recordGPUTimings(firstEncoding);
  testCase.equal(
    inspector.getSnapshot().graphs[0].totals.gpu.latestMilliseconds,
    40,
    'the originating observation can read its own encoding'
  );
  firstObservation.detach();
  secondObservation.detach();
  testCase.end();
});

test('GPUCommandGraphInspector observations coalesce repeated timing reads', async testCase => {
  const inspector = new GPUCommandGraphInspector();
  let timingReadCount = 0;
  let resolveTiming: ((report: GPUCommandGraphTimingReport) => void) | undefined;
  const encoding = makeEncoding(6, 1, 2, undefined, undefined, undefined, () => {
    timingReadCount++;
    return new Promise(resolve => {
      resolveTiming = resolve;
    });
  });
  const graph: GPUCommandGraphInspectorObservableGraph<
    ObservationParameters,
    GPUCommandGraphInspectorEncoding
  > = {
    ...makeGraph('coalesced'),
    encode: () => encoding
  };
  const observation = inspector.observeGraph(graph);
  observation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 6, gpuTimeMilliseconds: 60}
  });

  const firstRead = observation.recordGPUTimings(encoding);
  const secondRead = observation.recordGPUTimings(encoding);
  testCase.equal(timingReadCount, 1, 'starts only one timing read for concurrent calls');
  resolveTiming?.(makeTimingReport(6, 60, 10, 20));
  await Promise.all([firstRead, secondRead]);
  await observation.recordGPUTimings(encoding);

  const graphSnapshot = inspector.getSnapshot().graphs[0];
  testCase.equal(timingReadCount, 1, 'reuses the completed timing read');
  testCase.equal(graphSnapshot.totals.gpu.sampleCount, 1, 'records one GPU sample per encoding');
  observation.detach();
  testCase.end();
});

test('GPUCommandGraphInspector resets replacements and isolates asynchronous timing reads', async testCase => {
  const inspector = new GPUCommandGraphInspector();
  inspector.registerGraph(makeGraph('replaceable'));
  const queuedEncoding = makeEncoding(12, 3, 4, 130, 30, 40);
  inspector.recordEncoding('replaceable', queuedEncoding);

  let resolveTiming: ((report: GPUCommandGraphTimingReport) => void) | undefined;
  const pendingEncoding = makeEncoding(
    12,
    3,
    4,
    undefined,
    undefined,
    undefined,
    () =>
      new Promise(resolve => {
        resolveTiming = resolve;
      })
  );
  const pendingRead = inspector.recordGPUTimings('replaceable', pendingEncoding);
  inspector.registerGraph(makeGraph('replaceable', false));
  await inspector.recordGPUTimings('replaceable', queuedEncoding);
  resolveTiming?.(makeTimingReport(12, 120, 30, 40));
  await pendingRead;

  const failingEncoding = makeEncoding(1, 0.2, 0.3, undefined, undefined, undefined, async () => {
    throw new Error('device lost');
  });
  await inspector.recordGPUTimings('replaceable', failingEncoding);
  const graph = inspector.getSnapshot().graphs[0];
  testCase.equal(graph.encodingCount, 0, 'replacement resets encoding history');
  testCase.equal(graph.totals.gpu.sampleCount, 0, 'discards timing from the old registration');
  testCase.equal(graph.timingReadFailureCount, 1, 'counts timing read failures without throwing');
  testCase.equal(
    graph.capabilities.timestampQueries,
    false,
    'publishes metadata from the replacement graph'
  );
  inspector.clear();
  testCase.deepEqual(inspector.getSnapshot().graphs, [], 'clear removes every registration');
  testCase.end();
});

function makeGraph(id: string, timestampQueries = true): GPUCommandGraphInspectorGraph {
  return {
    id,
    stats: {...GRAPH_STATS, nodeOrder: [...GRAPH_STATS.nodeOrder]},
    capabilities: {...GRAPH_CAPABILITIES, timestampQueries}
  };
}

function makeObservableGraph(
  id: string
): GPUCommandGraphInspectorObservableGraph<
  ObservationParameters,
  GPUCommandGraphInspectorEncoding
> {
  return {
    ...makeGraph(id),
    encode: (_commandEncoder, options) =>
      makeEncoding(
        options.parameters.cpuTimeMilliseconds,
        options.parameters.cpuTimeMilliseconds / 4,
        options.parameters.cpuTimeMilliseconds / 2,
        options.parameters.gpuTimeMilliseconds,
        options.parameters.gpuTimeMilliseconds / 4,
        options.parameters.gpuTimeMilliseconds / 2
      )
  };
}

function makeEncoding(
  cpuTimeMilliseconds: number,
  prepareCPUTimeMilliseconds: number,
  renderCPUTimeMilliseconds: number,
  gpuTimeMilliseconds?: number,
  prepareGPUTimeMilliseconds?: number,
  renderGPUTimeMilliseconds?: number,
  readTimings?: () => Promise<GPUCommandGraphTimingReport>
): GPUCommandGraphInspectorEncoding {
  const stats: GPUCommandGraphEncodingStats = {
    cpuEncodeTimeMilliseconds: cpuTimeMilliseconds,
    nodeCount: 2,
    computePassCount: 1,
    coalescedComputeNodeCount: 0,
    timestampedNodeCount: gpuTimeMilliseconds === undefined ? 0 : 2,
    nodes: [
      {
        id: 'prepare',
        type: 'compute',
        cpuEncodeTimeMilliseconds: prepareCPUTimeMilliseconds,
        hasGPUTimestamps: prepareGPUTimeMilliseconds !== undefined
      },
      {
        id: 'render',
        type: 'render',
        cpuEncodeTimeMilliseconds: renderCPUTimeMilliseconds,
        hasGPUTimestamps: renderGPUTimeMilliseconds !== undefined
      }
    ]
  };
  return {
    stats,
    readTimings:
      readTimings ??
      (async () =>
        makeTimingReport(
          cpuTimeMilliseconds,
          gpuTimeMilliseconds,
          prepareGPUTimeMilliseconds,
          renderGPUTimeMilliseconds
        ))
  };
}

function makeTimingReport(
  cpuTimeMilliseconds: number,
  gpuTimeMilliseconds?: number,
  prepareGPUTimeMilliseconds?: number,
  renderGPUTimeMilliseconds?: number
): GPUCommandGraphTimingReport {
  return {
    cpuEncodeTimeMilliseconds: cpuTimeMilliseconds,
    ...(gpuTimeMilliseconds === undefined ? {} : {gpuTimeMilliseconds}),
    nodes: [
      {
        id: 'prepare',
        type: 'compute',
        cpuEncodeTimeMilliseconds: 0,
        hasGPUTimestamps: prepareGPUTimeMilliseconds !== undefined,
        ...(prepareGPUTimeMilliseconds === undefined
          ? {}
          : {gpuTimeMilliseconds: prepareGPUTimeMilliseconds})
      },
      {
        id: 'render',
        type: 'render',
        cpuEncodeTimeMilliseconds: 0,
        hasGPUTimestamps: renderGPUTimeMilliseconds !== undefined,
        ...(renderGPUTimeMilliseconds === undefined
          ? {}
          : {gpuTimeMilliseconds: renderGPUTimeMilliseconds})
      }
    ]
  };
}
