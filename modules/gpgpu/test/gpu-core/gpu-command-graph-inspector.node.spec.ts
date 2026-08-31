import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
} from '@luma.gl/gpgpu/gpu-core';

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

it('GPUCommandGraphInspector summarizes bounded CPU and GPU samples', async () => {
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
  expect(graph.encodingCount, 'counts every synchronous encoding').toBe(3);
  expect(graph.totals.cpu, 'bounds and summarizes whole-graph CPU samples').toEqual({
    sampleCount: 2,
    latestMilliseconds: 30,
    p50Milliseconds: 20,
    p95Milliseconds: 30
  });
  expect(graph.totals.gpu, 'bounds and summarizes whole-graph GPU samples').toEqual({
    sampleCount: 2,
    latestMilliseconds: 300,
    p50Milliseconds: 200,
    p95Milliseconds: 300
  });
  expect(
    graph.nodes.map(node => [node.id, node.type, node.group]),
    'preserves compiled node order and semantic groups'
  ).toEqual([
    ['prepare', 'compute', 'query'],
    ['render', 'render', 'drawing']
  ]);
  expect(graph.nodes[0].cpu, 'summarizes per-node CPU samples').toEqual({
    sampleCount: 2,
    latestMilliseconds: 6,
    p50Milliseconds: 4,
    p95Milliseconds: 6
  });
  expect(graph.nodes[1].gpu, 'summarizes per-node GPU samples').toEqual({
    sampleCount: 2,
    latestMilliseconds: 90,
    p50Milliseconds: 60,
    p95Milliseconds: 90
  });
});

it('GPUCommandGraphInspector summarizes bounded scalar counters', () => {
  const inspector = new GPUCommandGraphInspector({maxSamples: 2});
  inspector.registerGraph(makeGraph('counters'));
  inspector.recordCounters('counters', {candidates: 30, intersectedCells: 3});
  inspector.recordCounters('counters', {candidates: 10, intersectedCells: 1});
  inspector.recordCounters('counters', {candidates: 20, intersectedCells: 2});

  expect(
    inspector.getSnapshot().graphs[0].counters,
    'retains bounded samples and preserves first-observed counter order'
  ).toEqual([
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
  ]);
  expect(
    () => inspector.recordCounters('counters', {valid: 1, invalid: Number.NaN}),
    'rejects invalid counter batches'
  ).toThrow(/finite, non-negative value/);
  expect(
    inspector.getSnapshot().graphs[0].counters.length,
    'validates the complete batch before recording any sample'
  ).toBe(2);
});

it('GPUCommandGraphInspector returns immutable snapshots and copied graph metadata', () => {
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
  expect(graphSnapshot.stats.nodeOrder, 'copies node order').toEqual(['prepare', 'render']);
  expect(graphSnapshot.capabilities.timestampQueries, 'copies adapter capabilities').toBe(true);
  expect(Boolean(Object.isFrozen(snapshot)), 'freezes the root snapshot').toBe(true);
  expect(Boolean(Object.isFrozen(snapshot.graphs)), 'freezes the graph list').toBe(true);
  expect(Boolean(Object.isFrozen(graphSnapshot)), 'freezes each graph').toBe(true);
  expect(Boolean(Object.isFrozen(graphSnapshot.stats)), 'freezes compile statistics').toBe(true);
  expect(
    Boolean(Object.isFrozen(graphSnapshot.stats.nodeOrder)),
    'freezes compiled node order'
  ).toBe(true);
  expect(Boolean(Object.isFrozen(graphSnapshot.totals)), 'freezes graph totals').toBe(true);
  expect(Boolean(Object.isFrozen(graphSnapshot.totals.cpu)), 'freezes duration summaries').toBe(
    true
  );
  expect(Boolean(Object.isFrozen(graphSnapshot.counters)), 'freezes the counter list').toBe(true);
  expect(Boolean(Object.isFrozen(graphSnapshot.counters[0])), 'freezes each counter summary').toBe(
    true
  );
  expect(Boolean(Object.isFrozen(graphSnapshot.nodes)), 'freezes the node list').toBe(true);
  expect(Boolean(Object.isFrozen(graphSnapshot.nodes[0])), 'freezes each node summary').toBe(true);
});

it('GPUCommandGraphInspector observes encode and post-submit timing lifecycles', async () => {
  const inspector = new GPUCommandGraphInspector();
  const graph = makeObservableGraph('observed');
  const observation = inspector.observeGraph(graph);
  const encoding = observation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 8, gpuTimeMilliseconds: 80}
  });
  await observation.recordGPUTimings(encoding);

  const graphSnapshot = inspector.getSnapshot().graphs[0];
  expect(observation.graph, 'exposes the observed graph without wrapping ownership').toBe(graph);
  expect(Boolean(Object.isFrozen(observation)), 'returns an immutable observation handle').toBe(
    true
  );
  expect(graphSnapshot.encodingCount, 'records CPU stats while delegating encode').toBe(1);
  expect(graphSnapshot.totals.cpu.latestMilliseconds, 'records delegated CPU time').toBe(8);
  expect(
    graphSnapshot.totals.gpu.latestMilliseconds,
    'records explicit post-submit GPU time without a repeated graph id'
  ).toBe(80);

  observation.detach();
  observation.detach();
  observation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 16, gpuTimeMilliseconds: 160}
  });
  expect(
    inspector.getSnapshot().graphs,
    'detach is idempotent and stops observation without disabling graph encoding'
  ).toEqual([]);
});

it('GPUCommandGraphInspector observations isolate same-id replacement lifecycles', async () => {
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
  expect(graph.encodingCount, 'an old handle cannot record into its replacement').toBe(1);
  expect(graph.totals.cpu.latestMilliseconds, 'keeps only the current observation').toBe(7);
  expect(
    graph.totals.gpu.sampleCount,
    'an old handle cannot attach pending timings to its replacement'
  ).toBe(0);
  expect(
    graph.counters[0].latestValue,
    'an old handle cannot publish delayed counters into its replacement'
  ).toBe(7);
  currentObservation.detach();
  currentObservation.recordCounters({candidates: 70});
  expect(inspector.getSnapshot().graphs, 'the current handle owns its registration').toEqual([]);
});

it('GPUCommandGraphInspector observations reject foreign encodings', async () => {
  const inspector = new GPUCommandGraphInspector();
  const firstObservation = inspector.observeGraph(makeObservableGraph('first'));
  const secondObservation = inspector.observeGraph(makeObservableGraph('second'));
  const firstEncoding = firstObservation.encode(COMMAND_ENCODER, {
    parameters: {cpuTimeMilliseconds: 4, gpuTimeMilliseconds: 40}
  });

  await secondObservation.recordGPUTimings(firstEncoding);
  expect(
    inspector.getSnapshot().graphs.map(graph => graph.totals.gpu.sampleCount),
    "does not attribute another observation's timing report to the current graph"
  ).toEqual([0, 0]);
  await firstObservation.recordGPUTimings(firstEncoding);
  expect(
    inspector.getSnapshot().graphs[0].totals.gpu.latestMilliseconds,
    'the originating observation can read its own encoding'
  ).toBe(40);
  firstObservation.detach();
  secondObservation.detach();
});

it('GPUCommandGraphInspector observations coalesce repeated timing reads', async () => {
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
  expect(timingReadCount, 'starts only one timing read for concurrent calls').toBe(1);
  resolveTiming?.(makeTimingReport(6, 60, 10, 20));
  await Promise.all([firstRead, secondRead]);
  await observation.recordGPUTimings(encoding);

  const graphSnapshot = inspector.getSnapshot().graphs[0];
  expect(timingReadCount, 'reuses the completed timing read').toBe(1);
  expect(graphSnapshot.totals.gpu.sampleCount, 'records one GPU sample per encoding').toBe(1);
  observation.detach();
});

it('GPUCommandGraphInspector resets replacements and isolates asynchronous timing reads', async () => {
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
  expect(graph.encodingCount, 'replacement resets encoding history').toBe(0);
  expect(graph.totals.gpu.sampleCount, 'discards timing from the old registration').toBe(0);
  expect(graph.timingReadFailureCount, 'counts timing read failures without throwing').toBe(1);
  expect(graph.capabilities.timestampQueries, 'publishes metadata from the replacement graph').toBe(
    false
  );
  inspector.clear();
  expect(inspector.getSnapshot().graphs, 'clear removes every registration').toEqual([]);
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
    skippedNodeCount: 0,
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
