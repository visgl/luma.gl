// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUPartitionedIndexedRangeCompaction,
  GraphVectorView
} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

describe('GPUPartitionedIndexedRangeCompaction graph construction', () => {
  test('preserves source partitions through local range compaction', () => {
    const fixture = createCompactionFixture();
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');
    const createTransientBuffer = vi.spyOn(fixture.graph, 'createTransientBuffer');

    try {
      const result = fixture.compaction.addToGraph(fixture.graph);
      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
        'visible-clear-range-counts',
        'visible-partition-0-range-count',
        'visible-partition-0-range-scan-level-0-scan',
        'visible-partition-0-scatter',
        'visible-partition-1-range-count',
        'visible-partition-1-range-scan-level-0-scan',
        'visible-partition-1-scatter',
        'visible-publish-counts'
      ]);
      expect(result.rangeCounts.length).toBe(4);
      expect(result.rangeOffsets.length).toBe(4);
      expect(result.partitionCounts.length).toBe(2);
      expect(
        createTransientBuffer.mock.calls.some(([descriptor]) =>
          descriptor.id?.includes('local-offsets')
        )
      ).toBe(false);
    } finally {
      addComputePass.mockRestore();
      createTransientBuffer.mockRestore();
      fixture.device.destroy();
    }
  });

  test('accepts one packed visibility bit per source row', () => {
    const fixture = createCompactionFixture('bitset');
    try {
      const result = fixture.compaction.addToGraph(fixture.graph);
      expect(fixture.compaction.flags.data.map(chunk => chunk.length)).toEqual([1, 1]);
      expect(result.partitionCounts.length).toBe(2);
    } finally {
      fixture.device.destroy();
    }
  });

  test('requires matching bounded chunks and complete range partitions', () => {
    const fixture = createCompactionFixture();
    const props = {
      flags: fixture.compaction.flags,
      ranges: fixture.compaction.ranges,
      rangeCount: fixture.compaction.rangeCount,
      rangeLayout: fixture.compaction.rangeLayout,
      partitionRangeEnds: fixture.compaction.partitionRangeEnds,
      activeRangeIds: fixture.compaction.activeRangeIds,
      activeRangeDispatch: fixture.compaction.activeRangeDispatch,
      maximumRangeLength: fixture.compaction.maximumRangeLength,
      output: fixture.compaction.output,
      count: fixture.compaction.count
    };

    try {
      expect(
        () =>
          new GPUPartitionedIndexedRangeCompaction({
            ...props,
            partitionRangeEnds: [2]
          })
      ).toThrow(/one end per vector chunk/i);
      expect(
        () =>
          new GPUPartitionedIndexedRangeCompaction({
            ...props,
            partitionRangeEnds: [2, 3]
          })
      ).toThrow(/terminate at rangeCount/i);
      expect(
        () =>
          new GPUPartitionedIndexedRangeCompaction({
            ...props,
            output: createVector(fixture.graph, 'mismatched-output', [5, 6])
          })
      ).toThrow(/same chunk topology/i);
      expect(
        () =>
          new GPUPartitionedIndexedRangeCompaction({
            ...props,
            flagEncoding: 'bitset',
            flags: createVector(fixture.graph, 'short-bitset-flags', [1, 1]),
            output: createVector(fixture.graph, 'long-bitset-output', [33, 5])
          })
      ).toThrow(/one bit per output row/i);
    } finally {
      fixture.device.destroy();
    }
  });
});

function createCompactionFixture(flagEncoding: 'uint32' | 'bitset' = 'uint32'): {
  device: NullDevice;
  graph: GPUCommandGraph;
  compaction: GPUPartitionedIndexedRangeCompaction;
} {
  const device = new NullDevice({id: 'partitioned-range-compaction-node-device'});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device, 'limits', {
    value: {...device.limits, maxComputeWorkgroupsPerDimension: 65_535}
  });
  const graph = new GPUCommandGraph(device, {id: 'partitioned-range-compaction-node-graph'});
  const compaction = new GPUPartitionedIndexedRangeCompaction({
    id: 'visible',
    flags: createVector(graph, 'flags', flagEncoding === 'bitset' ? [1, 1] : [6, 5]),
    flagEncoding,
    ranges: createView(graph, 'ranges', 8),
    rangeCount: 4,
    rangeLayout: {wordStride: 2, firstIndexWordOffset: 0, countWordOffset: 1},
    partitionRangeEnds: [2, 4],
    activeRangeIds: createView(graph, 'active-range-ids', 4),
    activeRangeDispatch: graph.createTransientBuffer({
      id: 'active-range-dispatch',
      byteLength: 3 * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.INDIRECT
    }),
    maximumRangeLength: 4,
    output: createVector(graph, 'output', [6, 5]),
    count: createView(graph, 'count', 1)
  });
  return {device, graph, compaction};
}

function createVector(
  graph: GPUCommandGraph,
  id: string,
  chunkLengths: readonly number[]
): GraphVectorView<'uint32'> {
  const data = chunkLengths.map((length, chunkIndex) =>
    createView(graph, `${id}-${chunkIndex}`, length)
  );
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length: chunkLengths.reduce((sum, length) => sum + length, 0),
    valueLength: chunkLengths.reduce((sum, length) => sum + length, 0),
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data
  });
}

function createView(graph: GPUCommandGraph, id: string, length: number) {
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format: 'uint32', length});
}
