// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import {
  addGPUSegmentedBVHToGraphWithDispatchLimit,
  GPUSegmentedBVH,
  type GPUBVHSegment,
  type GPUSegmentedBVHProps
} from '../../src/gpu-primitives/gpu-segmented-bvh';

describe('GPUSegmentedBVH', () => {
  test('groups mixed packed hierarchies into at most eight CORE-compatible graph nodes', () => {
    const fixture = createSegmentedBVHFixture(
      makeSegments([1, 1, 2, 4, 8, 16, 32, 64, 128], [0, 1, 2, 3, 5, 9, 17, 33, 65])
    );
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');
    const createTransientBuffer = vi.spyOn(fixture.graph, 'createTransientBuffer');

    try {
      fixture.hierarchy.addToGraph(fixture.graph);

      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual(
        [1, 2, 4, 8, 16, 32, 64, 128].map(
          leafCapacity => `segmented-bvh-fused-refit-${leafCapacity}`
        )
      );
      expect(addComputePass.mock.calls.every(([pass]) => pass.resources?.length === 8)).toBe(true);
      expect(createTransientBuffer).not.toHaveBeenCalled();
      expect(fixture.hierarchy.dimension).toBe(3);
      expect(fixture.hierarchy.topology).toBe('complete-binary');
      expect(fixture.hierarchy.updatePolicy).toBe('refit');
    } finally {
      addComputePass.mockRestore();
      createTransientBuffer.mockRestore();
      fixture.device.destroy();
    }
  });

  test('batches 100 independently allocated hierarchy domains in one graph node', () => {
    const fixture = createSegmentedBVHFixture(makeSegments(Array.from({length: 100}, () => 4)));
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      fixture.hierarchy.addToGraph(fixture.graph);
      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
        'segmented-bvh-fused-refit-4'
      ]);
      expect(fixture.hierarchy.segments).toHaveLength(100);
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('rejects unrepresentable 3D hierarchy dispatches before recording graph work', () => {
    const fixture = createSegmentedBVHFixture(makeSegments(Array.from({length: 9}, () => 1)));
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      expect(() =>
        addGPUSegmentedBVHToGraphWithDispatchLimit(fixture.hierarchy, fixture.graph, 2)
      ).toThrow(/exceeding the 3D dispatch limit/i);
      expect(addComputePass).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('does not check dispatch limits or allocate nodes when no hierarchy is requested', () => {
    const fixture = createSegmentedBVHFixture([]);
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      addGPUSegmentedBVHToGraphWithDispatchLimit(fixture.hierarchy, fixture.graph, 0);
      expect(addComputePass).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('snapshots caller-owned segment descriptors', () => {
    const segment = makeSegments([4])[0];
    const fixture = createSegmentedBVHFixture([segment]);

    try {
      segment.sourceOffset = 17;
      segment.sourceCount = 1;
      segment.leafCapacity = 2;
      expect(fixture.hierarchy.segments[0]).toEqual({
        sourceOffset: 1,
        sourceCount: 4,
        nodeOffset: 2,
        leafOffset: 3,
        metadataOffset: 1,
        leafCapacity: 4
      });
    } finally {
      fixture.device.destroy();
    }
  });

  test('rejects invalid capacities, offsets, parent boundaries, and overlapping output domains', () => {
    const fixture = createSegmentedBVHFixture(makeSegments([4, 4]));
    const originalProps = getFixtureProps(fixture);

    try {
      for (const leafCapacity of [0, 3, 129, 256, Number.NaN, 1.5]) {
        expect(
          () =>
            new GPUSegmentedBVH({
              ...originalProps,
              segments: [{...originalProps.segments[0], leafCapacity}]
            })
        ).toThrow(/positive power of two/i);
      }

      for (const field of [
        'sourceOffset',
        'sourceCount',
        'nodeOffset',
        'leafOffset',
        'metadataOffset'
      ] as const) {
        for (const value of [-1, 1.5, 0x100000000]) {
          expect(
            () =>
              new GPUSegmentedBVH({
                ...originalProps,
                segments: [{...originalProps.segments[0], [field]: value}]
              })
          ).toThrow(/non-negative uint32/i);
        }
      }

      for (const [field, capacity] of [
        ['sourceOffset', originalProps.minima.length],
        ['nodeOffset', originalProps.nodeMinima.length],
        ['leafOffset', originalProps.leafIds.length],
        ['metadataOffset', originalProps.counts.length]
      ] as const) {
        expect(
          () =>
            new GPUSegmentedBVH({
              ...originalProps,
              segments: [{...originalProps.segments[0], [field]: capacity}]
            })
        ).toThrow(/exceed the parent view/i);
      }

      for (const field of ['nodeOffset', 'leafOffset', 'metadataOffset'] as const) {
        expect(
          () =>
            new GPUSegmentedBVH({
              ...originalProps,
              segments: [
                originalProps.segments[0],
                {...originalProps.segments[1], [field]: originalProps.segments[0][field]}
              ]
            })
        ).toThrow(new RegExp(`${field} ranges must not overlap`, 'i'));
      }

      expect(
        () => new GPUSegmentedBVH({...originalProps, nodeMinima: originalProps.minima})
      ).toThrow(/node views|separate buffers/i);
      expect(
        () => new GPUSegmentedBVH({...originalProps, overflows: originalProps.counts})
      ).toThrow(/separate buffers/i);
    } finally {
      fixture.device.destroy();
    }
  });

  test('rejects workgroup widths and shared memory unsupported by the target device', () => {
    const invocationLimited = createSegmentedBVHFixture(
      makeSegments([64]),
      {
        maxComputeInvocationsPerWorkgroup: 32
      },
      false
    );
    const storageLimited = createSegmentedBVHFixture(
      makeSegments([32]),
      {
        maxComputeWorkgroupStorageSize: 1024
      },
      false
    );

    try {
      expect(() => new GPUSegmentedBVH(invocationLimited.props)).toThrow(/single-workgroup limits/);
      expect(() => new GPUSegmentedBVH(storageLimited.props)).toThrow(/single-workgroup limits/);
    } finally {
      invocationLimited.device.destroy();
      storageLimited.device.destroy();
    }
  });

  test('rejects views owned by a different graph before recording work', () => {
    const fixture = createSegmentedBVHFixture(makeSegments([2]));
    const otherGraph = new GPUCommandGraph(fixture.device, {id: 'different-segmented-bvh-graph'});
    const addComputePass = vi.spyOn(otherGraph, 'addComputePass');

    try {
      expect(() => fixture.hierarchy.addToGraph(otherGraph)).toThrow(/belong to the target graph/);
      expect(addComputePass).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });
});

type SegmentedBVHFixture = {
  device: NullDevice;
  graph: GPUCommandGraph;
  hierarchy: GPUSegmentedBVH;
  props: GPUSegmentedBVHProps;
};

function createSegmentedBVHFixture(
  segments: GPUBVHSegment[],
  limitOverrides: Record<string, number> = {},
  createHierarchy = true
): SegmentedBVHFixture {
  const device = new NullDevice({id: 'segmented-bvh-node-device'});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.assign(device.limits, {
    maxComputeInvocationsPerWorkgroup: 256,
    maxComputeWorkgroupSizeX: 256,
    maxComputeWorkgroupStorageSize: 16_384,
    maxComputeWorkgroupsPerDimension: 65_535,
    ...limitOverrides
  });
  const graph = new GPUCommandGraph(device, {id: 'segmented-bvh-node-graph'});
  const sourceLength = Math.max(
    1,
    ...segments.map(segment => segment.sourceOffset + segment.sourceCount)
  );
  const nodeLength = Math.max(
    1,
    ...segments.map(segment => segment.nodeOffset + segment.leafCapacity * 2 - 1)
  );
  const leafLength = Math.max(
    1,
    ...segments.map(segment => segment.leafOffset + segment.leafCapacity)
  );
  const metadataLength = Math.max(1, ...segments.map(segment => segment.metadataOffset + 1));

  const props: GPUSegmentedBVHProps = {
    id: 'segmented-bvh',
    minima: createView(graph, 'minima', 'float32x3', sourceLength),
    maxima: createView(graph, 'maxima', 'float32x3', sourceLength),
    nodeMinima: createView(graph, 'node-minima', 'float32x3', nodeLength),
    nodeMaxima: createView(graph, 'node-maxima', 'float32x3', nodeLength),
    nodeChildren: createView(graph, 'node-children', 'uint32x2', nodeLength),
    leafIds: createView(graph, 'leaf-ids', 'uint32', leafLength),
    counts: createView(graph, 'counts', 'uint32', metadataLength),
    overflows: createView(graph, 'overflows', 'uint32', metadataLength),
    segments
  };
  return {
    device,
    graph,
    hierarchy: createHierarchy ? new GPUSegmentedBVH(props) : (undefined as never),
    props
  };
}

function createView<T extends 'float32x3' | 'uint32x2' | 'uint32'>(
  graph: GPUCommandGraph,
  identifier: string,
  format: T,
  length: number
): GraphDataView<T> {
  const byteStride = format === 'float32x3' ? 12 : format === 'uint32x2' ? 8 : 4;
  const buffer = graph.createTransientBuffer({
    id: identifier,
    byteLength: Math.max(length, 1) * byteStride,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format, length});
}

function makeSegments(
  leafCapacities: readonly number[],
  sourceCounts: readonly number[] = leafCapacities
): GPUBVHSegment[] {
  let sourceOffset = 1;
  let nodeOffset = 2;
  let leafOffset = 3;
  let metadataOffset = 1;
  return leafCapacities.map((leafCapacity, segmentIndex) => {
    const sourceCount = sourceCounts[segmentIndex];
    const segment = {
      sourceOffset,
      sourceCount,
      nodeOffset,
      leafOffset,
      metadataOffset,
      leafCapacity
    };
    sourceOffset += sourceCount + 1;
    nodeOffset += leafCapacity * 2;
    leafOffset += leafCapacity + 1;
    metadataOffset += 2;
    return segment;
  });
}

function getFixtureProps(fixture: SegmentedBVHFixture): GPUSegmentedBVHProps {
  return {
    id: fixture.hierarchy.id,
    minima: fixture.hierarchy.minima,
    maxima: fixture.hierarchy.maxima,
    nodeMinima: fixture.hierarchy.nodeMinima,
    nodeMaxima: fixture.hierarchy.nodeMaxima,
    nodeChildren: fixture.hierarchy.nodeChildren,
    leafIds: fixture.hierarchy.leafIds,
    counts: fixture.hierarchy.counts,
    overflows: fixture.hierarchy.overflows,
    segments: fixture.hierarchy.segments
  };
}
