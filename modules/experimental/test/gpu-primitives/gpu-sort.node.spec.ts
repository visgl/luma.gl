// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUBatchSort,
  GPUCommandGraph,
  GraphVectorView,
  GPUSort,
  type GPUSortAlgorithm
} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../../src/gpu-primitives/gpu-dispatch-utils';
import {addGPUSortToGraphWithDispatchLimit} from '../../src/gpu-primitives/gpu-sort';

const WORKGROUP_SIZE = 256;

describe('bounded GPU sort dispatch', () => {
  test('preserves one-dimensional boundaries and safely uses all three dimensions', () => {
    const maximum = 65_535;
    const oneDimensionalCapacity = maximum * WORKGROUP_SIZE;

    expect(
      getBoundedDispatchLayout('GPUSort', oneDimensionalCapacity, WORKGROUP_SIZE, maximum)
    ).toEqual({x: maximum, y: 1, z: 1});
    expect(
      getBoundedDispatchLayout('GPUSort', oneDimensionalCapacity + 1, WORKGROUP_SIZE, maximum)
    ).toEqual({x: maximum, y: 2, z: 1});
    expect(getBoundedDispatchLayout('GPUSort', 4 * WORKGROUP_SIZE + 1, WORKGROUP_SIZE, 2)).toEqual({
      x: 2,
      y: 2,
      z: 2
    });
    expect(() =>
      getBoundedDispatchLayout('GPUSort', 8 * WORKGROUP_SIZE + 1, WORKGROUP_SIZE, 2)
    ).toThrow(/exceeding the 3D dispatch limit/i);
    expect(getBoundedDispatchLayout('GPUSort', 0x80000000, WORKGROUP_SIZE, maximum)).toEqual({
      x: maximum,
      y: 129,
      z: 1
    });

    const source = getBoundedInvocationIndexSource({x: 2, y: 2, z: 2}, WORKGROUP_SIZE);
    expect(source).toContain('workgroupId.z * 2u + workgroupId.y');
    expect(source).toContain('* 2u + workgroupId.x');
    expect(source.indexOf('workgroupIndex >= 16777216u')).toBeLessThan(
      source.indexOf('workgroupIndex * 256u + localInvocationIndex')
    );
  });

  test('propagates one synthetic limit through every bitonic and radix scan stage', () => {
    for (const algorithm of ['bitonic', 'radix'] as const) {
      const fixture = createSortGraphFixture(4 * WORKGROUP_SIZE + 1, algorithm);
      const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');
      const createBuffer = vi.spyOn(fixture.device, 'createBuffer');

      try {
        addGPUSortToGraphWithDispatchLimit(fixture.sort, fixture.graph, 2);

        const identifiers = addComputePass.mock.calls.map(([pass]) => pass.id);
        if (algorithm === 'bitonic') {
          expect(identifiers).toContain('node-sort-bitonic-initialize');
          expect(identifiers).toContain('node-sort-bitonic-2048-1');
          expect(identifiers).toContain('node-sort-bitonic-gather');
        } else {
          expect(identifiers).toContain('node-sort-radix-bit-0-classify');
          expect(identifiers).toContain('node-sort-radix-bit-0-scan-level-0-scan');
          expect(identifiers).toContain('node-sort-radix-bit-0-scan-level-0-add-offsets');
          expect(identifiers).toContain('node-sort-radix-bit-0-scatter');
          expect(identifiers).toContain('node-sort-radix-bit-31-classify');
          expect(identifiers).toContain('node-sort-radix-bit-31-scatter');
        }
        expect(createBuffer).not.toHaveBeenCalled();
      } finally {
        addComputePass.mockRestore();
        createBuffer.mockRestore();
        fixture.device.destroy();
      }
    }
  });

  test('rejects padded bitonic overflow before mutating the command graph', () => {
    const fixture = createSortGraphFixture(4_097, 'bitonic');
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');
    const createTransientBuffer = vi.spyOn(fixture.graph, 'createTransientBuffer');

    try {
      expect(() => addGPUSortToGraphWithDispatchLimit(fixture.sort, fixture.graph, 3)).toThrow(
        /GPUSort bitonic.*exceeding the 3D dispatch limit/i
      );
      expect(addComputePass).not.toHaveBeenCalled();
      expect(createTransientBuffer).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      createTransientBuffer.mockRestore();
      fixture.device.destroy();
    }
  });

  test('rejects radix ranges beyond the complete bounded three-dimensional capacity', () => {
    const fixture = createSortGraphFixture(8 * WORKGROUP_SIZE + 1, 'radix');
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      expect(() => addGPUSortToGraphWithDispatchLimit(fixture.sort, fixture.graph, 2)).toThrow(
        /GPUSort.*exceeding the 3D dispatch limit/i
      );
      expect(addComputePass).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('preserves empty and single-row fast paths without consulting dispatch limits', () => {
    for (const length of [0, 1]) {
      const fixture = createSortGraphFixture(length, 'auto');
      const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

      try {
        addGPUSortToGraphWithDispatchLimit(fixture.sort, fixture.graph, 0);
        expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual(
          length === 0 ? [] : ['node-sort-copy-pair']
        );
      } finally {
        addComputePass.mockRestore();
        fixture.device.destroy();
      }
    }
  });

  test('propagates the real device limit through independent batch sort chunks', () => {
    const device = new NullDevice({id: 'bounded-batch-sort-node-device'});
    Object.defineProperty(device, 'type', {value: 'webgpu'});
    device.limits.maxComputeWorkgroupsPerDimension = 2;
    const graph = new GPUCommandGraph(device, {id: 'bounded-batch-sort-node-graph'});
    const lengths = [1_025, 0, 513];
    const sort = new GPUBatchSort({
      id: 'bounded-batch-sort',
      keys: createSortVector(graph, 'keys', lengths),
      values: createSortVector(graph, 'values', lengths),
      outputKeys: createSortVector(graph, 'output-keys', lengths),
      outputValues: createSortVector(graph, 'output-values', lengths)
    });
    const addComputePass = vi.spyOn(graph, 'addComputePass');

    try {
      sort.addToGraph(graph);

      const identifiers = addComputePass.mock.calls.map(([pass]) => pass.id);
      expect(identifiers).toContain('bounded-batch-sort-chunk-0-bitonic-initialize');
      expect(identifiers).toContain('bounded-batch-sort-chunk-0-bitonic-2048-1');
      expect(identifiers).toContain('bounded-batch-sort-chunk-0-bitonic-gather');
      expect(identifiers).toContain('bounded-batch-sort-chunk-2-bitonic-initialize');
      expect(identifiers).toContain('bounded-batch-sort-chunk-2-bitonic-1024-1');
      expect(identifiers).toContain('bounded-batch-sort-chunk-2-bitonic-gather');
      expect(identifiers.some(identifier => identifier?.includes('chunk-1'))).toBe(false);
    } finally {
      addComputePass.mockRestore();
      device.destroy();
    }
  });
});

function createSortGraphFixture(
  length: number,
  algorithm: GPUSortAlgorithm
): {device: NullDevice; graph: GPUCommandGraph; sort: GPUSort} {
  const device = new NullDevice({id: 'bounded-sort-node-device'});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device, {id: 'bounded-sort-node-graph'});
  const sort = new GPUSort({
    id: 'node-sort',
    keys: createSortView(graph, 'keys', length),
    values: createSortView(graph, 'values', length),
    outputKeys: createSortView(graph, 'output-keys', length),
    outputValues: createSortView(graph, 'output-values', length),
    algorithm
  });
  return {device, graph, sort};
}

function createSortView(graph: GPUCommandGraph, id: string, length: number) {
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format: 'uint32', length});
}

function createSortVector(
  graph: GPUCommandGraph,
  id: string,
  lengths: readonly number[]
): GraphVectorView<'uint32'> {
  const length = lengths.reduce((total, chunkLength) => total + chunkLength, 0);
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data: lengths.map((chunkLength, chunkIndex) =>
      createSortView(graph, `${id}-chunk-${chunkIndex}`, chunkLength)
    )
  });
}
