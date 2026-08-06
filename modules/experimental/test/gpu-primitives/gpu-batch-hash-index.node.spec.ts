// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUBatchHashIndex,
  GPUCommandGraph,
  GraphVectorView,
  type GPUBatchHashIndexProps,
  type GraphDataView
} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

describe('GPUBatchHashIndex planning', () => {
  test('preserves source batches, empty chunks, offsets, and allocation-free graph planning', () => {
    const fixture = createGraphFixture();
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      const index = new GPUBatchHashIndex({
        ...createIndexProps(fixture.graph, [2, 0, 3]),
        validity: createVector(fixture.graph, 'validity', [2, 0, 3]),
        firstValues: [40, 100, 500]
      });
      expect(index.firstValues).toEqual([40, 100, 500]);
      expect(Object.isFrozen(index.firstValues)).toBe(true);
      expect(index.stats).toEqual({
        capacity: 8,
        maxProbeCount: 8,
        tableByteLength: 64,
        statisticsByteLength: 24,
        outputByteLength: 88,
        batchCount: 3,
        inputLength: 5
      });
      expect(index.updatePolicy).toBe('rebuild');
      expect(createBuffer).not.toHaveBeenCalled();

      index.addToGraph(fixture.graph);

      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
        'node-batch-index-initialize',
        'node-batch-index-batch-0-build',
        'node-batch-index-batch-0-finalize',
        'node-batch-index-batch-2-build',
        'node-batch-index-batch-2-finalize'
      ]);
      expect(createBuffer).not.toHaveBeenCalled();
    } finally {
      createBuffer.mockRestore();
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('generates contiguous batch offsets and accepts explicit aligned payload vectors', () => {
    const fixture = createGraphFixture();

    try {
      const props = createIndexProps(fixture.graph, [2, 0, 3]);
      const values = createVector(fixture.graph, 'values', [2, 0, 3]);
      const index = new GPUBatchHashIndex({...props, values});

      expect(index.values).toBe(values);
      expect(index.firstValues).toEqual([0, 2, 2]);
      expect(() => new GPUBatchHashIndex({...props, values, firstValues: [0, 2, 2]})).toThrow(
        /values and firstValues are mutually exclusive/
      );
    } finally {
      fixture.device.destroy();
    }
  });

  test('rejects mismatched ordered topology and unsupported scalar layouts', () => {
    const fixture = createGraphFixture();

    try {
      const props = createIndexProps(fixture.graph, [2, 0, 3]);
      expect(
        () =>
          new GPUBatchHashIndex({
            ...props,
            values: createVector(fixture.graph, 'mismatched-values', [1, 0, 4])
          })
      ).toThrow(/same chunk topology/);
      expect(
        () =>
          new GPUBatchHashIndex({
            ...props,
            validity: createVector(fixture.graph, 'mismatched-validity', [2, 3])
          })
      ).toThrow(/same chunk topology/);
      expect(
        () =>
          new GPUBatchHashIndex({
            ...props,
            keys: createVector(fixture.graph, 'incorrect-length', [2, 0, 3], {length: 4})
          })
      ).toThrow(/length must equal its ordered source chunks/);
      expect(
        () =>
          new GPUBatchHashIndex({
            ...props,
            keys: createVector(fixture.graph, 'strided-keys', [2, 0, 3], {byteStride: 8})
          })
      ).toThrow(/packed, uint32-aligned uint32/);
    } finally {
      fixture.device.destroy();
    }
  });

  test('rejects ambiguous offsets, uint32 source identities, and cumulative probe overflow', () => {
    const fixture = createGraphFixture();

    try {
      const props = createIndexProps(fixture.graph, [2, 0, 3]);
      expect(() => new GPUBatchHashIndex({...props, firstValues: [0, 2]})).toThrow(
        /one value per source chunk/
      );
      expect(() => new GPUBatchHashIndex({...props, firstValues: [0xffffffff, 2, 2]})).toThrow(
        /generated values must fit in uint32/
      );
      expect(() => new GPUBatchHashIndex({...props, firstValues: [-1, 2, 2]})).toThrow(
        /generated values must fit in uint32/
      );
      expect(() => new GPUBatchHashIndex({...props, maxProbeCount: 9})).toThrow(
        /one through capacity/
      );

      const oversizedKeys = createVector(fixture.graph, 'oversized-keys', [0x40000000, 0x40000000]);
      expect(
        () => new GPUBatchHashIndex({...props, keys: oversizedKeys, maxProbeCount: 2})
      ).toThrow(/aggregate probe count must fit in uint32/);
    } finally {
      fixture.device.destroy();
    }
  });

  test('rejects shared output ranges and source/output aliases', () => {
    const fixture = createGraphFixture();

    try {
      const props = createIndexProps(fixture.graph, [2, 0, 3]);
      expect(() => new GPUBatchHashIndex({...props, tableValues: props.tableKeys})).toThrow(
        /output views must not overlap/
      );
      expect(
        () =>
          new GPUBatchHashIndex({
            ...props,
            statistics: fixture.graph.createDataView(props.keys.data[0].buffer, {
              format: 'uint32',
              length: 2
            })
          })
      ).toThrow(/statistics must contain six uint32 rows/);

      const sourceAlias = fixture.graph.createDataView(props.tableKeys.buffer, {
        format: 'uint32',
        length: 2
      });
      const aliasedKeys = createVector(fixture.graph, 'alias-keys', [2, 0, 3], {
        firstChunk: sourceAlias
      });
      expect(() => new GPUBatchHashIndex({...props, keys: aliasedKeys})).toThrow(
        /input and output views must not overlap/
      );
    } finally {
      fixture.device.destroy();
    }
  });

  test('clears empty topologies exactly once without importing empty input bindings', () => {
    for (const lengths of [[], [0, 0]] as readonly number[][]) {
      const fixture = createGraphFixture();
      const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');
      const createBuffer = vi.spyOn(fixture.device, 'createBuffer');

      try {
        new GPUBatchHashIndex(createIndexProps(fixture.graph, lengths)).addToGraph(fixture.graph);
        expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
          'node-batch-index-initialize'
        ]);
        expect(createBuffer).not.toHaveBeenCalled();
      } finally {
        addComputePass.mockRestore();
        createBuffer.mockRestore();
        fixture.device.destroy();
      }
    }
  });

  test('rejects views owned by a different command graph before adding compute passes', () => {
    const fixture = createGraphFixture();
    const other = createGraphFixture();
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      const props = createIndexProps(fixture.graph, [2, 0, 3]);
      const index = new GPUBatchHashIndex({
        ...props,
        validity: createVector(other.graph, 'external-validity', [2, 0, 3])
      });
      expect(() => index.addToGraph(fixture.graph)).toThrow(
        /views must belong to the target graph/
      );
      expect(addComputePass).not.toHaveBeenCalled();
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
      other.device.destroy();
    }
  });
});

function createGraphFixture(): {device: NullDevice; graph: GPUCommandGraph} {
  const device = new NullDevice({id: 'batch-hash-index-node-device'});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  device.limits.maxComputeWorkgroupsPerDimension = 65_535;
  device.limits.maxBufferSize = Number.MAX_SAFE_INTEGER;
  return {device, graph: new GPUCommandGraph(device, {id: 'batch-hash-index-node-graph'})};
}

function createIndexProps(
  graph: GPUCommandGraph,
  chunkLengths: readonly number[]
): GPUBatchHashIndexProps {
  return {
    id: 'node-batch-index',
    keys: createVector(graph, 'keys', chunkLengths),
    tableKeys: createView(graph, 'table-keys', 8),
    tableValues: createView(graph, 'table-values', 8),
    statistics: createView(graph, 'statistics', 6)
  };
}

function createVector(
  graph: GPUCommandGraph,
  id: string,
  chunkLengths: readonly number[],
  options: {length?: number; byteStride?: number; firstChunk?: GraphDataView<'uint32'>} = {}
): GraphVectorView<'uint32'> {
  const sourceLength = chunkLengths.reduce((length, chunkLength) => length + chunkLength, 0);
  const length = options.length ?? sourceLength;
  const byteStride = options.byteStride ?? Uint32Array.BYTES_PER_ELEMENT;
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data: chunkLengths.map((chunkLength, chunkIndex) =>
      chunkIndex === 0 && options.firstChunk
        ? options.firstChunk
        : createView(graph, `${id}-chunk-${chunkIndex}`, chunkLength, byteStride)
    )
  });
}

function createView(
  graph: GPUCommandGraph,
  id: string,
  length: number,
  byteStride = Uint32Array.BYTES_PER_ELEMENT
): GraphDataView<'uint32'> {
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * byteStride,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format: 'uint32', length, byteStride});
}
