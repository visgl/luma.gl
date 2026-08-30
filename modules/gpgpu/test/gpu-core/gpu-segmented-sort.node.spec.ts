// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUSegmentedSort,
  type GPUSegmentedSortProps,
  type GPUSortSegment
} from '@luma.gl/gpgpu/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import {addGPUSegmentedSortToGraphWithDispatchLimit} from '../../src/gpu-core/gpu-segmented-sort';

describe('GPUSegmentedSort', () => {
  test('groups arbitrary independent domains into at most eight CORE-compatible graph nodes', () => {
    const lengths = [0, 1, 2, 3, 5, 9, 17, 33, 65, 129, 255, 256];
    const fixture = createSegmentedSortFixture(makeSegments(lengths));
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');
    const createTransientBuffer = vi.spyOn(fixture.graph, 'createTransientBuffer');

    try {
      fixture.sort.addToGraph(fixture.graph);

      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
        'segmented-sort-bitonic-local-2',
        'segmented-sort-bitonic-local-4',
        'segmented-sort-bitonic-local-8',
        'segmented-sort-bitonic-local-16',
        'segmented-sort-bitonic-local-32',
        'segmented-sort-bitonic-local-64',
        'segmented-sort-bitonic-local-128',
        'segmented-sort-bitonic-local-256'
      ]);
      expect(addComputePass.mock.calls.every(([pass]) => pass.resources?.length === 4)).toBe(true);
      expect(createTransientBuffer).not.toHaveBeenCalled();
      expect(fixture.sort.direction).toBe('ascending');
    } finally {
      addComputePass.mockRestore();
      createTransientBuffer.mockRestore();
      fixture.device.destroy();
    }
  });

  test('batches many equal-width segments in one logical graph node', () => {
    const fixture = createSegmentedSortFixture(makeSegments(Array.from({length: 100}, () => 3)));
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      fixture.sort.addToGraph(fixture.graph);

      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
        'segmented-sort-bitonic-local-4'
      ]);
      expect(fixture.sort.segments).toHaveLength(100);
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('rejects unrepresentable three-dimensional segment dispatches before recording any node', () => {
    const fixture = createSegmentedSortFixture(makeSegments(Array.from({length: 9}, () => 3)));
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      expect(() =>
        addGPUSegmentedSortToGraphWithDispatchLimit(fixture.sort, fixture.graph, 2)
      ).toThrow(/exceeding the 3D dispatch limit/i);
      expect(addComputePass).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('ignores empty domains without checking unnecessary dispatch limits', () => {
    const fixture = createSegmentedSortFixture(makeSegments([0, 0, 0]));
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      addGPUSegmentedSortToGraphWithDispatchLimit(fixture.sort, fixture.graph, 0);
      expect(addComputePass).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('snapshots caller-owned segment metadata', () => {
    const segment = makeSegments([3])[0];
    const fixture = createSegmentedSortFixture([segment]);

    try {
      segment.length = 1;
      segment.keysOffset = 99;
      expect(fixture.sort.segments[0]).toEqual({
        keysOffset: 0,
        valuesOffset: 0,
        outputKeysOffset: 0,
        outputValuesOffset: 0,
        length: 3
      });
    } finally {
      fixture.device.destroy();
    }
  });

  test('rejects invalid directions, lengths, offsets, view boundaries, and overlapping outputs', () => {
    const fixture = createSegmentedSortFixture(makeSegments([3, 3]));
    const originalProps = getFixtureProps(fixture);

    try {
      expect(
        () => new GPUSegmentedSort({...originalProps, direction: 'sideways' as never})
      ).toThrow(/direction must be/);

      for (const length of [-1, 1.5, 257, Number.NaN]) {
        expect(
          () =>
            new GPUSegmentedSort({
              ...originalProps,
              segments: [{...originalProps.segments[0], length}]
            })
        ).toThrow(/length must be/);
      }

      for (const offsetName of [
        'keysOffset',
        'valuesOffset',
        'outputKeysOffset',
        'outputValuesOffset'
      ] as const) {
        expect(
          () =>
            new GPUSegmentedSort({
              ...originalProps,
              segments: [{...originalProps.segments[0], [offsetName]: -1}]
            })
        ).toThrow(/non-negative uint32/);
        expect(
          () =>
            new GPUSegmentedSort({
              ...originalProps,
              segments: [{...originalProps.segments[0], [offsetName]: 0x100000000}]
            })
        ).toThrow(/non-negative uint32/);
        expect(
          () =>
            new GPUSegmentedSort({
              ...originalProps,
              segments: [{...originalProps.segments[0], [offsetName]: originalProps.keys.length}]
            })
        ).toThrow(/exceed the parent view/);
      }

      expect(
        () =>
          new GPUSegmentedSort({
            ...originalProps,
            segments: [
              originalProps.segments[0],
              {...originalProps.segments[1], outputKeysOffset: 1}
            ]
          })
      ).toThrow(/output keys segments must not overlap/);

      expect(
        () =>
          new GPUSegmentedSort({
            ...originalProps,
            segments: [
              originalProps.segments[0],
              {...originalProps.segments[1], outputValuesOffset: 2}
            ]
          })
      ).toThrow(/output values segments must not overlap/);

      expect(
        () => new GPUSegmentedSort({...originalProps, outputKeys: originalProps.keys})
      ).toThrow(/separate buffers/);
    } finally {
      fixture.device.destroy();
    }
  });

  test('rejects views owned by a different target graph before recording work', () => {
    const fixture = createSegmentedSortFixture(makeSegments([3]));
    const otherGraph = new GPUCommandGraph(fixture.device, {id: 'different-segmented-sort-graph'});
    const addComputePass = vi.spyOn(otherGraph, 'addComputePass');

    try {
      expect(() => fixture.sort.addToGraph(otherGraph)).toThrow(/belong to the target graph/);
      expect(addComputePass).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });
});

type SegmentedSortFixture = {
  device: NullDevice;
  graph: GPUCommandGraph;
  sort: GPUSegmentedSort;
};

function createSegmentedSortFixture(segments: GPUSortSegment[]): SegmentedSortFixture {
  const device = new NullDevice({id: 'segmented-sort-node-device'});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  device.limits.maxComputeWorkgroupsPerDimension = 65_535;
  const graph = new GPUCommandGraph(device, {id: 'segmented-sort-node-graph'});
  const length = segments.reduce(
    (maximum, segment) =>
      Math.max(
        maximum,
        segment.keysOffset + segment.length,
        segment.valuesOffset + segment.length,
        segment.outputKeysOffset + segment.length,
        segment.outputValuesOffset + segment.length
      ),
    0
  );
  const createView = (identifier: string) => {
    const buffer = graph.createTransientBuffer({
      id: identifier,
      byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    return graph.createDataView(buffer, {format: 'uint32', length});
  };
  const sort = new GPUSegmentedSort({
    id: 'segmented-sort',
    keys: createView('keys'),
    values: createView('values'),
    outputKeys: createView('output-keys'),
    outputValues: createView('output-values'),
    segments
  });
  return {device, graph, sort};
}

function makeSegments(lengths: readonly number[]): GPUSortSegment[] {
  let offset = 0;
  return lengths.map(length => {
    const segment = {
      keysOffset: offset,
      valuesOffset: offset,
      outputKeysOffset: offset,
      outputValuesOffset: offset,
      length
    };
    offset += length;
    return segment;
  });
}

function getFixtureProps(fixture: SegmentedSortFixture): GPUSegmentedSortProps {
  return {
    id: fixture.sort.id,
    keys: fixture.sort.keys,
    values: fixture.sort.values,
    outputKeys: fixture.sort.outputKeys,
    outputValues: fixture.sort.outputValues,
    segments: fixture.sort.segments,
    direction: fixture.sort.direction
  };
}
