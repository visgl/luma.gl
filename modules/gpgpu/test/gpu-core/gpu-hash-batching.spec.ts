// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUHashIndex,
  GPUHashIndexQuery,
  GPUHashJoin,
  GPU_HASH_INDEX_EMPTY_KEY,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {BATCH_PARTITIONS, BatchConformanceFixture} from './batch-conformance-utils';

const emptyKey = GPU_HASH_INDEX_EMPTY_KEY;

for (const partition of BATCH_PARTITIONS) {
  for (const capacity of [0, 3, 8]) {
    for (const explicitRows of [false, true]) {
      test(`hash family: ${partition.name}, capacity ${capacity}, explicit rows ${explicitRows}`, async () => {
        const device = await getWebGPUTestDevice('core');
        if (!device) return;
        const fixture = new BatchConformanceFixture(device);
        const atomic = 'atomic' in partition && partition.atomic;
        const keys = fixture.column(
          'keys',
          'uint32',
          [7, 3, 7, emptyKey, 19, 11],
          partition.input,
          {atomic}
        );
        const values = fixture.column(
          'values',
          'uint32',
          [70, 30, 71, 999, 190, 110],
          partition.paired
        );
        const queries = fixture.column(
          'queries',
          'uint32',
          [7, 999, 3, 7, emptyKey, 19],
          partition.paired
        );
        const leftRows = fixture.column(
          'left-rows',
          'uint32',
          [60, 50, 40, 30, 20, 10],
          partition.input,
          {atomic}
        );
        const result = fixture.column('result', 'uint32', Array(6).fill(77), partition.input, {
          atomic
        });
        const queryFound = fixture.column(
          'query-found',
          'uint32',
          Array(6).fill(77),
          partition.paired
        );
        const queryProbes = fixture.column(
          'query-probes',
          'uint32',
          Array(6).fill(77),
          partition.input,
          {atomic}
        );
        const found = fixture.column('found', 'uint32', Array(6).fill(77), partition.input, {
          atomic
        });
        const probes = fixture.column('probes', 'uint32', Array(6).fill(77), partition.paired);
        const outputLeftRows = fixture.column('output-left', 'uint32', Array(capacity).fill(77), [
          0,
          Math.min(1, capacity),
          0,
          Math.max(0, capacity - 1),
          0
        ]);
        const outputRightRows = fixture.column('output-right', 'uint32', Array(capacity).fill(77), [
          Math.min(2, capacity),
          Math.max(0, capacity - 2)
        ]);
        const buildStatistics = fixture.output('build-statistics', 'uint32', 6);
        const queryStatistics = fixture.output('query-statistics', 'uint32', 4);
        const statistics = fixture.output('statistics', 'uint32', 4);
        const count = fixture.output('count', 'uint32', 1);
        const overflow = fixture.output('overflow', 'uint32', 1);
        const index = new GPUHashIndex({
          keys,
          ...(explicitRows ? {values} : {firstValue: 400}),
          tableKeys: fixture.output('table-keys', 'uint32', 8),
          tableValues: fixture.output('table-values', 'uint32', 8),
          statistics: buildStatistics
        });
        fixture.graph.add([
          index,
          new GPUHashIndexQuery({
            index,
            keys: queries,
            values: result,
            found: queryFound,
            probes: queryProbes,
            statistics: queryStatistics
          }),
          new GPUHashJoin({
            index,
            keys: queries,
            ...(explicitRows ? {leftRows} : {firstLeftRow: 1000}),
            outputLeftRows,
            outputRightRows,
            count,
            overflow,
            statistics,
            found,
            probes
          })
        ]);
        const executable = fixture.graph.compile();
        try {
          for (const [iteration, [sourceKeys, queryKeys]] of [
            [
              [7, 3, 7, emptyKey, 19, 11],
              [7, 999, 3, 7, emptyKey, 19]
            ],
            [
              [19, 3, 19, emptyKey, 7, 11],
              [7, 19, 999, 3, emptyKey, 7]
            ],
            [Array(6).fill(emptyKey), [7, 19, 999, 3, emptyKey, 7]]
          ].entries()) {
            writeValues(fixture, keys, sourceKeys);
            writeValues(fixture, queries, queryKeys);
            writeValues(fixture, outputLeftRows, Array(capacity).fill(77));
            writeValues(fixture, outputRightRows, Array(capacity).fill(77));
            const encoder = device.createCommandEncoder();
            executable.encode(encoder, {parameters: undefined});
            device.submit(encoder.finish());
            const mapping = new Map<number, number>();
            sourceKeys.forEach((key, row) => {
              if (key !== emptyKey && !mapping.has(key))
                mapping.set(key, explicitRows ? [70, 30, 71, 999, 190, 110][row] : 400 + row);
            });
            const expectedFound = queryKeys.map(key => Number(mapping.has(key)));
            const matchingRows = queryKeys.flatMap((key, row) => (mapping.has(key) ? [row] : []));
            expect(await fixture.read(result)).toEqual(
              queryKeys.map(key => mapping.get(key) ?? emptyKey)
            );
            expect(await fixture.read(queryFound)).toEqual(expectedFound);
            expect(await fixture.read(found)).toEqual(expectedFound);
            expect(await fixture.read(probes)).toEqual(await fixture.read(queryProbes));
            const expectedLeft = matchingRows
              .slice(0, capacity)
              .map(row => (explicitRows ? [60, 50, 40, 30, 20, 10][row] : 1000 + row));
            const expectedRight = matchingRows
              .slice(0, capacity)
              .map(row => mapping.get(queryKeys[row])!);
            expect(await fixture.read(outputLeftRows)).toEqual([
              ...expectedLeft,
              ...Array(capacity - expectedLeft.length).fill(77)
            ]);
            expect(await fixture.read(outputRightRows)).toEqual([
              ...expectedRight,
              ...Array(capacity - expectedRight.length).fill(77)
            ]);
            expect(await fixture.read(count)).toEqual([matchingRows.length]);
            expect(await fixture.read(overflow)).toEqual([Number(matchingRows.length > capacity)]);
            expect((await fixture.read(buildStatistics)).slice(0, 4)).toEqual(
              iteration === 2 ? [0, 0, 0, 6] : [4, 1, 0, 1]
            );
            const diagnostics = await fixture.read(statistics);
            const probeCounts = await fixture.read(probes);
            expect(diagnostics).toEqual([
              matchingRows.length,
              6 - matchingRows.length,
              probeCounts.reduce((total, value) => total + value, 0),
              Math.max(...probeCounts)
            ]);
            expect(await fixture.read(queryStatistics)).toEqual(diagnostics);
            expect(await fixture.read(keys)).toEqual(sourceKeys);
            expect(await fixture.read(values)).toEqual([70, 30, 71, 999, 190, 110]);
          }
        } finally {
          executable.destroy();
          fixture.destroy();
        }
      });
    }
  }
}

for (const length of [0, 513]) {
  test(`hash join scratch and global scan: ${length} rows`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const source = Array.from({length}, (_, row) => row % 7);
    const keys = fixture.column('keys', 'uint32', source, length ? [0, 255, 1, 0, 257, 0] : []);
    const queries = fixture.column('queries', 'uint32', source, length ? [1, 0, 256, 256] : [0, 0]);
    const outputLeftRows = fixture.column(
      'left',
      'uint32',
      Array(length).fill(77),
      length ? [128, 0, 385] : [0]
    );
    const outputRightRows = fixture.column('right', 'uint32', Array(length).fill(77), [length], {
      atomic: true
    });
    const count = fixture.output('count', 'uint32', 1);
    const overflow = fixture.output('overflow', 'uint32', 1);
    const statistics = fixture.output('statistics', 'uint32', 4);
    const index = new GPUHashIndex({
      keys,
      firstValue: 100,
      tableKeys: fixture.output('table-keys', 'uint32', 16),
      tableValues: fixture.output('table-values', 'uint32', 16),
      statistics: fixture.output('build-statistics', 'uint32', 6)
    });
    fixture.graph.add([
      index,
      new GPUHashJoin({
        index,
        keys: queries,
        outputLeftRows,
        outputRightRows,
        count,
        overflow,
        statistics
      })
    ]);
    const executable = fixture.graph.compile();
    try {
      for (let iteration = 0; iteration < 2; iteration++) {
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect(await fixture.read(outputLeftRows)).toEqual(Array.from({length}, (_, row) => row));
        expect(await fixture.read(outputRightRows)).toEqual(source.map(key => 100 + key));
        expect(await fixture.read(count)).toEqual([length]);
        expect(await fixture.read(overflow)).toEqual([0]);
        expect((await fixture.read(statistics)).slice(0, 2)).toEqual([length, 0]);
      }
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

function writeValues(
  fixture: BatchConformanceFixture,
  view: GraphDataView<'uint32'> | GraphVectorView<'uint32'>,
  values: number[]
): void {
  let offset = 0;
  for (const chunk of 'data' in view ? view.data : [view]) {
    if (chunk.length)
      fixture.storage
        .get(chunk.buffer)!
        .write(new Uint32Array(values.slice(offset, offset + chunk.length)), chunk.byteOffset);
    offset += chunk.length;
  }
}

for (const queryLength of [0, 6]) {
  test(`hash batching propagates index overflow with ${queryLength} query rows`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const source = [1, 2, 3, 4, 5, 6];
    const keys = fixture.column('keys', 'uint32', source, [1, 0, 2, 3]);
    const queries = fixture.column(
      'queries',
      'uint32',
      source.slice(0, queryLength),
      queryLength ? [3, 1, 2] : [0, 0]
    );
    const outputLeftRows = fixture.column('left', 'uint32', Array(6).fill(77), [2, 0, 4]);
    const outputRightRows = fixture.column('right', 'uint32', Array(6).fill(77), [1, 5]);
    const count = fixture.output('count', 'uint32', 1);
    const overflow = fixture.output('overflow', 'uint32', 1);
    const index = new GPUHashIndex({
      keys,
      firstValue: 100,
      tableKeys: fixture.output('table-keys', 'uint32', 2),
      tableValues: fixture.output('table-values', 'uint32', 2),
      statistics: fixture.output('build-statistics', 'uint32', 6)
    });
    fixture.graph.add([
      index,
      new GPUHashJoin({
        index,
        keys: queries,
        outputLeftRows,
        outputRightRows,
        count,
        overflow,
        statistics: fixture.output('statistics', 'uint32', 4)
      })
    ]);
    const executable = fixture.graph.compile();
    try {
      const encoder = device.createCommandEncoder();
      executable.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      expect((await fixture.read(index.statistics)).slice(0, 4)).toEqual([2, 0, 4, 0]);
      const retainedKeys = await fixture.read(index.tableKeys);
      const matchingRows = source
        .slice(0, queryLength)
        .flatMap((key, row) => (retainedKeys.includes(key) ? [row] : []));
      expect(await fixture.read(outputLeftRows)).toEqual([
        ...matchingRows,
        ...Array(6 - matchingRows.length).fill(77)
      ]);
      expect(await fixture.read(outputRightRows)).toEqual([
        ...matchingRows.map(row => 100 + row),
        ...Array(6 - matchingRows.length).fill(77)
      ]);
      expect(await fixture.read(count)).toEqual([matchingRows.length]);
      expect(await fixture.read(overflow)).toEqual([1]);
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}
