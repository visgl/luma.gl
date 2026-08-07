// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type {GPUCommandGraph, GraphDataView} from '../../src/gpu-primitives/gpu-command-graph';
import {GPUBVH, type GPUBVHStrategy} from '../../src/gpu-primitives/gpu-bvh';

type RecordedGraphNode = {
  id: string;
  resources: readonly {usage: string}[];
};

type MockGraph = GPUCommandGraph & {
  recordedNodes: RecordedGraphNode[];
};

test('GPUBVH automatically fuses portable small hierarchies into one graph node', testCase => {
  const graph = makeGraph();
  const hierarchy = makeHierarchy(graph, {dimension: 3, leafCapacity: 128, sourceCount: 87});
  hierarchy.addToGraph(graph);

  testCase.equal(hierarchy.strategy, 'auto');
  testCase.equal(hierarchy.resolvedStrategy, 'fused');
  testCase.deepEqual(
    graph.recordedNodes.map(node => node.id),
    ['test-bvh-fused-refit'],
    'all eight parent levels are synchronized within one graph node'
  );
  testCase.equal(
    graph.recordedNodes[0].resources.length,
    8,
    'generated source IDs preserve the default CORE storage-buffer limit'
  );
  testCase.end();
});

test('GPUBVH preserves explicit source IDs in the fused graph contributor', testCase => {
  const graph = makeGraph();
  const hierarchy = makeHierarchy(graph, {
    dimension: 2,
    leafCapacity: 8,
    sourceCount: 5,
    sourceIds: true
  });
  hierarchy.addToGraph(graph);

  testCase.equal(hierarchy.resolvedStrategy, 'fused');
  testCase.deepEqual(
    graph.recordedNodes.map(node => node.id),
    ['test-bvh-fused-refit', 'test-bvh-remap-source-ids'],
    'stable source IDs are remapped after the complete fused hierarchy is published'
  );
  testCase.equal(
    graph.recordedNodes[0].resources.length,
    8,
    'explicit IDs do not exceed the default CORE storage-buffer limit'
  );
  testCase.equal(
    graph.recordedNodes[1].resources.length,
    2,
    'identity remapping needs two buffers'
  );
  testCase.equal(
    graph.recordedNodes[1].resources[0].usage,
    'storage-read',
    'stable source IDs are never overwritten'
  );
  testCase.equal(
    graph.recordedNodes[1].resources[1].usage,
    'storage-read-write',
    'remapping waits for published leaf identities and preserves empty leaf slots'
  );
  testCase.end();
});

test('GPUBVH remaps explicit source IDs after per-level hierarchy publication', testCase => {
  const graph = makeGraph();
  const hierarchy = makeHierarchy(graph, {
    dimension: 3,
    leafCapacity: 4,
    sourceCount: 7,
    sourceIds: true,
    strategy: 'level'
  });
  hierarchy.addToGraph(graph);

  testCase.equal(hierarchy.resolvedStrategy, 'level');
  testCase.deepEqual(
    graph.recordedNodes.map(node => node.id),
    [
      'test-bvh-load-leaves',
      'test-bvh-refit-depth-1',
      'test-bvh-refit-depth-0',
      'test-bvh-remap-source-ids'
    ]
  );
  testCase.equal(
    Math.max(...graph.recordedNodes.map(node => node.resources.length)),
    8,
    'every level and source-ID remapping pass remains within CORE storage-buffer limits'
  );
  testCase.end();
});

test('GPUBVH fuses empty and singleton hierarchies without requiring a parent level', testCase => {
  const graph = makeGraph();
  const hierarchy = makeHierarchy(graph, {dimension: 2, leafCapacity: 1, sourceCount: 0});
  hierarchy.addToGraph(graph);

  testCase.equal(hierarchy.resolvedStrategy, 'fused');
  testCase.equal(hierarchy.internalNodeCount, 0);
  testCase.equal(hierarchy.levelCount, 1);
  testCase.deepEqual(
    graph.recordedNodes.map(node => node.id),
    ['test-bvh-fused-refit']
  );
  testCase.end();
});

test('GPUBVH retains forced and automatic multi-pass hierarchy construction', testCase => {
  const forcedGraph = makeGraph();
  const forcedHierarchy = makeHierarchy(forcedGraph, {
    dimension: 2,
    leafCapacity: 4,
    sourceCount: 3,
    strategy: 'level'
  });
  forcedHierarchy.addToGraph(forcedGraph);

  testCase.equal(forcedHierarchy.resolvedStrategy, 'level');
  testCase.deepEqual(
    forcedGraph.recordedNodes.map(node => node.id),
    ['test-bvh-load-leaves', 'test-bvh-refit-depth-1', 'test-bvh-refit-depth-0']
  );

  const largeGraph = makeGraph();
  const largeHierarchy = makeHierarchy(largeGraph, {
    dimension: 3,
    leafCapacity: 256,
    sourceCount: 131
  });
  largeHierarchy.addToGraph(largeGraph);

  testCase.equal(largeHierarchy.resolvedStrategy, 'level');
  testCase.equal(largeGraph.recordedNodes.length, 9, 'one leaf load precedes eight tree levels');
  testCase.end();
});

test('GPUBVH checks workgroup capacity and rejects unsupported forced fusion', testCase => {
  const restrictedInvocations = makeGraph({maxComputeInvocationsPerWorkgroup: 32});
  const invocationHierarchy = makeHierarchy(restrictedInvocations, {
    dimension: 2,
    leafCapacity: 64,
    sourceCount: 17
  });
  testCase.equal(invocationHierarchy.resolvedStrategy, 'level');

  const restrictedStorage = makeGraph({maxComputeWorkgroupStorageSize: 1024});
  const storageHierarchy = makeHierarchy(restrictedStorage, {
    dimension: 3,
    leafCapacity: 32,
    sourceCount: 17
  });
  testCase.equal(storageHierarchy.resolvedStrategy, 'level');
  testCase.throws(
    () =>
      makeHierarchy(restrictedStorage, {
        dimension: 3,
        leafCapacity: 32,
        sourceCount: 17,
        strategy: 'fused'
      }),
    /fused strategy exceeds portable single-workgroup limits/
  );
  testCase.end();
});

function makeGraph(limitOverrides: Record<string, number> = {}): MockGraph {
  const recordedNodes: RecordedGraphNode[] = [];
  return {
    device: {
      limits: {
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupStorageSize: 16_384,
        maxComputeWorkgroupsPerDimension: 65_535,
        ...limitOverrides
      }
    },
    recordedNodes,
    addComputePass: (node: RecordedGraphNode) => recordedNodes.push(node)
  } as unknown as MockGraph;
}

function makeHierarchy(
  graph: MockGraph,
  props: {
    dimension: 2 | 3;
    leafCapacity: number;
    sourceCount: number;
    sourceIds?: boolean;
    strategy?: GPUBVHStrategy;
  }
): GPUBVH {
  const format = props.dimension === 2 ? 'float32x2' : 'float32x3';
  const nodeCount = props.leafCapacity * 2 - 1;
  return new GPUBVH({
    id: 'test-bvh',
    strategy: props.strategy,
    minima: makeView(graph, format, props.sourceCount),
    maxima: makeView(graph, format, props.sourceCount),
    ...(props.sourceIds ? {sourceIds: makeView(graph, 'uint32', props.sourceCount)} : {}),
    leafCapacity: props.leafCapacity,
    nodeMinima: makeView(graph, format, nodeCount),
    nodeMaxima: makeView(graph, format, nodeCount),
    nodeChildren: makeView(graph, 'uint32x2', nodeCount),
    leafIds: makeView(graph, 'uint32', props.leafCapacity),
    count: makeView(graph, 'uint32', 1),
    overflow: makeView(graph, 'uint32', 1)
  });
}

function makeView<T extends 'float32x2' | 'float32x3' | 'uint32x2' | 'uint32'>(
  graph: MockGraph,
  format: T,
  length: number
): GraphDataView<T> {
  const byteStride = format === 'uint32' ? 4 : format.endsWith('x2') ? 8 : 12;
  return {
    buffer: {graph, byteLength: Math.max(1, length) * byteStride},
    format,
    length,
    byteOffset: 0,
    byteStride,
    rowByteLength: byteStride
  } as GraphDataView<T>;
}
