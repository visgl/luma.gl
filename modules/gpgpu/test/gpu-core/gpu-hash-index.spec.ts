import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUHashIndex,
  GPUHashIndexQuery,
  GPU_HASH_INDEX_EMPTY_KEY
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPUHashIndex builds and queries deterministic first-row values', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runHashIndex(
    device,
    Uint32Array.from([7, 3, 7, GPU_HASH_INDEX_EMPTY_KEY, 19, 11]),
    Uint32Array.from([70, 30, 71, 999, 190, 110]),
    Uint32Array.from([7, 3, 19, 11, 4, GPU_HASH_INDEX_EMPTY_KEY]),
    8
  );

  expect(result.values, 'lookups return the lowest-source-row value').toEqual([
    70,
    30,
    190,
    110,
    GPU_HASH_INDEX_EMPTY_KEY,
    GPU_HASH_INDEX_EMPTY_KEY
  ]);
  expect(result.found, 'lookups publish an explicit found mask').toEqual([1, 1, 1, 1, 0, 0]);
  expect(
    result.buildStatistics.slice(0, 4),
    'build distinguishes unique, duplicate, overflow, and invalid rows'
  ).toEqual([4, 1, 0, 1]);
  expect(result.queryStatistics.slice(0, 2), 'query counts found and missing keys').toEqual([4, 2]);
  expect(
    Boolean(result.probes.every(probeCount => probeCount <= 8)),
    'every lookup obeys the probe bound'
  ).toBe(true);
  expect(
    result.tableKeys.filter(key => key !== GPU_HASH_INDEX_EMPTY_KEY).length,
    'one table slot is occupied per distinct valid key'
  ).toBe(4);
});

it('GPUHashIndex reports fixed-capacity overflow and generated row IDs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const keys = Uint32Array.from([1, 2, 3, 4, 5, 6]);
  const result = await runHashIndex(device, keys, undefined, keys, 4, {firstValue: 100});

  expect(
    result.buildStatistics.slice(0, 4),
    'a full table reports the exact overflow row count'
  ).toEqual([4, 0, 2, 0]);
  expect(result.queryStatistics[0], 'exactly the retained keys are found').toBe(4);
  expect(result.queryStatistics[1], 'overflowed keys are reported missing').toBe(2);
  for (let row = 0; row < keys.length; row++) {
    if (result.found[row]) {
      expect(result.values[row], `retained key ${keys[row]} maps to its generated row ID`).toBe(
        100 + row
      );
    }
  }
});

it('GPUHashIndex validates capacity, probe bounds, and aliasing', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const graph = new GPUCommandGraph(device);
  const input = createBuffer(device, Uint32Array.from([1, 2]), Buffer.STORAGE | Buffer.COPY_DST);
  const table = createBuffer(device, new Uint32Array(8), Buffer.STORAGE | Buffer.COPY_SRC);
  const statistics = createBuffer(device, new Uint32Array(6), Buffer.STORAGE | Buffer.COPY_SRC);
  const keys = importView(graph, 'keys', input, 2);
  const tableKeys = importView(graph, 'table-keys', table, 4);
  const overlappingTableValues = graph.createDataView(tableKeys.buffer, {
    format: 'uint32',
    length: 4,
    byteOffset: 4
  });
  const statisticsView = importView(graph, 'statistics', statistics, 6);

  expect(
    () =>
      new GPUHashIndex({
        keys,
        tableKeys,
        tableValues: overlappingTableValues,
        statistics: statisticsView
      }),
    'table outputs cannot alias'
  ).toThrow(/output views must not overlap/);
  expect(
    () =>
      new GPUHashIndex({
        keys,
        tableKeys: graph.createDataView(tableKeys.buffer, {format: 'uint32', length: 3}),
        tableValues: graph.createDataView(tableKeys.buffer, {
          format: 'uint32',
          length: 3,
          byteOffset: 12
        }),
        statistics: statisticsView
      }),
    'capacity must be a power of two'
  ).toThrow(/positive power of two/);
  expect(
    () =>
      new GPUHashIndex({
        keys,
        tableKeys,
        tableValues: tableKeys,
        statistics: statisticsView,
        maxProbeCount: 5
      }),
    'probe work cannot exceed capacity'
  ).toThrow(/one through capacity/);

  input.destroy();
  table.destroy();
  statistics.destroy();
});

it('GPUHashIndex accepts empty explicit-value views at the end of their buffers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const graph = new GPUCommandGraph(device);
  const keysBuffer = createBuffer(device, Uint32Array.of(7), Buffer.STORAGE | Buffer.COPY_DST);
  const valuesBuffer = createBuffer(device, Uint32Array.of(70), Buffer.STORAGE | Buffer.COPY_DST);
  const tableKeysBuffer = createOutputBuffer(device, 4);
  const tableValuesBuffer = createOutputBuffer(device, 4);
  const statisticsBuffer = createOutputBuffer(device, 6);
  const keyHandle = graph.importBuffer(
    {id: 'empty-keys', byteLength: keysBuffer.byteLength, usage: keysBuffer.usage},
    keysBuffer
  );
  const valueHandle = graph.importBuffer(
    {id: 'empty-values', byteLength: valuesBuffer.byteLength, usage: valuesBuffer.usage},
    valuesBuffer
  );
  new GPUHashIndex({
    keys: graph.createDataView(keyHandle, {format: 'uint32', length: 0, byteOffset: 4}),
    values: graph.createDataView(valueHandle, {format: 'uint32', length: 0, byteOffset: 4}),
    tableKeys: importView(graph, 'empty-table-keys', tableKeysBuffer, 4),
    tableValues: importView(graph, 'empty-table-values', tableValuesBuffer, 4),
    statistics: importView(graph, 'empty-statistics', statisticsBuffer, 6)
  }).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder();
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const tableBytes = await tableKeysBuffer.readAsync();
  expect(
    Array.from(new Uint32Array(tableBytes.buffer, tableBytes.byteOffset, 4)),
    'an empty rebuild clears every table slot without binding empty source values'
  ).toEqual(Array.from({length: 4}, () => GPU_HASH_INDEX_EMPTY_KEY));

  compiled.destroy();
  for (const buffer of [
    keysBuffer,
    valuesBuffer,
    tableKeysBuffer,
    tableValuesBuffer,
    statisticsBuffer
  ]) {
    buffer.destroy();
  }
});

async function runHashIndex(
  device: Device,
  inputKeys: Uint32Array,
  inputValues: Uint32Array | undefined,
  queryKeys: Uint32Array,
  capacity: number,
  options: {firstValue?: number} = {}
) {
  const graph = new GPUCommandGraph(device);
  const buffers = {
    inputKeys: createBuffer(device, inputKeys, Buffer.STORAGE | Buffer.COPY_DST),
    inputValues: inputValues
      ? createBuffer(device, inputValues, Buffer.STORAGE | Buffer.COPY_DST)
      : undefined,
    queryKeys: createBuffer(device, queryKeys, Buffer.STORAGE | Buffer.COPY_DST),
    tableKeys: createOutputBuffer(device, capacity),
    tableValues: createOutputBuffer(device, capacity),
    buildStatistics: createOutputBuffer(device, 6),
    values: createOutputBuffer(device, queryKeys.length),
    found: createOutputBuffer(device, queryKeys.length),
    probes: createOutputBuffer(device, queryKeys.length),
    queryStatistics: createOutputBuffer(device, 4)
  };
  const index = new GPUHashIndex({
    keys: importView(graph, 'input-keys', buffers.inputKeys, inputKeys.length),
    ...(buffers.inputValues
      ? {values: importView(graph, 'input-values', buffers.inputValues, inputValues!.length)}
      : {firstValue: options.firstValue}),
    tableKeys: importView(graph, 'table-keys', buffers.tableKeys, capacity),
    tableValues: importView(graph, 'table-values', buffers.tableValues, capacity),
    statistics: importView(graph, 'build-statistics', buffers.buildStatistics, 6)
  });
  index.addToGraph(graph);
  new GPUHashIndexQuery({
    index,
    keys: importView(graph, 'query-keys', buffers.queryKeys, queryKeys.length),
    values: importView(graph, 'values', buffers.values, queryKeys.length),
    found: importView(graph, 'found', buffers.found, queryKeys.length),
    probes: importView(graph, 'probes', buffers.probes, queryKeys.length),
    statistics: importView(graph, 'query-statistics', buffers.queryStatistics, 4)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'hash-index-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = {
    tableKeys: await readUint32(buffers.tableKeys, capacity),
    buildStatistics: await readUint32(buffers.buildStatistics, 6),
    values: await readUint32(buffers.values, queryKeys.length),
    found: await readUint32(buffers.found, queryKeys.length),
    probes: await readUint32(buffers.probes, queryKeys.length),
    queryStatistics: await readUint32(buffers.queryStatistics, 4)
  };
  compiled.destroy();
  for (const buffer of Object.values(buffers)) buffer?.destroy();
  return result;
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function createBuffer(device: Device, data: Uint32Array, usage: number): Buffer {
  return device.createBuffer({data: data.length ? data : new Uint32Array(1), usage});
}

function importView(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
