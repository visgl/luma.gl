// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  GPUCommandGraphInspector,
  type GPUCommandGraphCapabilities,
  type GPUCommandGraphEncodingStats,
  type GPUCommandGraphInspectorEncoding,
  type GPUCommandGraphInspectorGraph,
  type GPUCommandGraphStats,
  type GPUCommandGraphTimingReport
} from '@luma.gl/experimental';

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

test('GPUCommandGraphInspector returns immutable snapshots and copied graph metadata', testCase => {
  const stats = {...GRAPH_STATS, nodeOrder: [...GRAPH_STATS.nodeOrder]};
  const capabilities = {...GRAPH_CAPABILITIES};
  const graph: GPUCommandGraphInspectorGraph = {id: 'immutable', stats, capabilities};
  const inspector = new GPUCommandGraphInspector();
  inspector.registerGraph(graph);
  inspector.recordEncoding('immutable', makeEncoding(1, 0.25, 0.5));

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
  testCase.ok(Object.isFrozen(graphSnapshot.nodes), 'freezes the node list');
  testCase.ok(Object.isFrozen(graphSnapshot.nodes[0]), 'freezes each node summary');
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
