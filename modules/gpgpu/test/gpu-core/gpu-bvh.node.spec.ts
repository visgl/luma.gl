import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph, GraphDataView} from '../../src/gpu-core/gpu-command-graph';
import {GPUBVH, type GPUBVHStrategy} from '../../src/gpu-core/gpu-bvh';

type RecordedGraphNode = {
  id: string;
  resources: readonly {usage: string}[];
};

type MockGraph = GPUCommandGraph & {
  recordedNodes: RecordedGraphNode[];
};

it('GPUBVH automatically fuses portable small hierarchies into one graph node', () => {
  const graph = makeGraph();
  const hierarchy = makeHierarchy(graph, {dimension: 3, leafCapacity: 128, sourceCount: 87});
  hierarchy.addToGraph(graph);

  expect(hierarchy.strategy).toBe('auto');
  expect(hierarchy.resolvedStrategy).toBe('fused');
  expect(
    graph.recordedNodes.map(node => node.id),
    'all eight parent levels are synchronized within one graph node'
  ).toEqual(['test-bvh-fused-refit']);
  expect(
    graph.recordedNodes[0].resources.length,
    'generated source IDs preserve the default CORE storage-buffer limit'
  ).toBe(8);
});

it('GPUBVH preserves explicit source IDs in the fused graph contributor', () => {
  const graph = makeGraph();
  const hierarchy = makeHierarchy(graph, {
    dimension: 2,
    leafCapacity: 8,
    sourceCount: 5,
    sourceIds: true
  });
  hierarchy.addToGraph(graph);

  expect(hierarchy.resolvedStrategy).toBe('fused');
  expect(
    graph.recordedNodes.map(node => node.id),
    'stable source IDs are remapped after the complete fused hierarchy is published'
  ).toEqual(['test-bvh-fused-refit', 'test-bvh-remap-source-ids']);
  expect(
    graph.recordedNodes[0].resources.length,
    'explicit IDs do not exceed the default CORE storage-buffer limit'
  ).toBe(8);
  expect(graph.recordedNodes[1].resources.length, 'identity remapping needs two buffers').toBe(2);
  expect(graph.recordedNodes[1].resources[0].usage, 'stable source IDs are never overwritten').toBe(
    'storage-read'
  );
  expect(
    graph.recordedNodes[1].resources[1].usage,
    'remapping waits for published leaf identities and preserves empty leaf slots'
  ).toBe('storage-read-write');
});

it('GPUBVH remaps explicit source IDs after per-level hierarchy publication', () => {
  const graph = makeGraph();
  const hierarchy = makeHierarchy(graph, {
    dimension: 3,
    leafCapacity: 4,
    sourceCount: 7,
    sourceIds: true,
    strategy: 'level'
  });
  hierarchy.addToGraph(graph);

  expect(hierarchy.resolvedStrategy).toBe('level');
  expect(graph.recordedNodes.map(node => node.id)).toEqual([
    'test-bvh-load-leaves',
    'test-bvh-refit-depth-1',
    'test-bvh-refit-depth-0',
    'test-bvh-remap-source-ids'
  ]);
  expect(
    Math.max(...graph.recordedNodes.map(node => node.resources.length)),
    'every level and source-ID remapping pass remains within CORE storage-buffer limits'
  ).toBe(8);
});

it('GPUBVH fuses empty and singleton hierarchies without requiring a parent level', () => {
  const graph = makeGraph();
  const hierarchy = makeHierarchy(graph, {dimension: 2, leafCapacity: 1, sourceCount: 0});
  hierarchy.addToGraph(graph);

  expect(hierarchy.resolvedStrategy).toBe('fused');
  expect(hierarchy.internalNodeCount).toBe(0);
  expect(hierarchy.levelCount).toBe(1);
  expect(graph.recordedNodes.map(node => node.id)).toEqual(['test-bvh-fused-refit']);
});

it('GPUBVH retains forced and automatic multi-pass hierarchy construction', () => {
  const forcedGraph = makeGraph();
  const forcedHierarchy = makeHierarchy(forcedGraph, {
    dimension: 2,
    leafCapacity: 4,
    sourceCount: 3,
    strategy: 'level'
  });
  forcedHierarchy.addToGraph(forcedGraph);

  expect(forcedHierarchy.resolvedStrategy).toBe('level');
  expect(forcedGraph.recordedNodes.map(node => node.id)).toEqual([
    'test-bvh-load-leaves',
    'test-bvh-refit-depth-1',
    'test-bvh-refit-depth-0'
  ]);

  const largeGraph = makeGraph();
  const largeHierarchy = makeHierarchy(largeGraph, {
    dimension: 3,
    leafCapacity: 256,
    sourceCount: 131
  });
  largeHierarchy.addToGraph(largeGraph);

  expect(largeHierarchy.resolvedStrategy).toBe('level');
  expect(largeGraph.recordedNodes.length, 'one leaf load precedes eight tree levels').toBe(9);
});

it('GPUBVH checks workgroup capacity and rejects unsupported forced fusion', () => {
  const restrictedInvocations = makeGraph({maxComputeInvocationsPerWorkgroup: 32});
  const invocationHierarchy = makeHierarchy(restrictedInvocations, {
    dimension: 2,
    leafCapacity: 64,
    sourceCount: 17
  });
  expect(invocationHierarchy.resolvedStrategy).toBe('level');

  const restrictedStorage = makeGraph({maxComputeWorkgroupStorageSize: 1024});
  const storageHierarchy = makeHierarchy(restrictedStorage, {
    dimension: 3,
    leafCapacity: 32,
    sourceCount: 17
  });
  expect(storageHierarchy.resolvedStrategy).toBe('level');
  expect(() =>
    makeHierarchy(restrictedStorage, {
      dimension: 3,
      leafCapacity: 32,
      sourceCount: 17,
      strategy: 'fused'
    })
  ).toThrow(/fused strategy exceeds portable single-workgroup limits/);
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
