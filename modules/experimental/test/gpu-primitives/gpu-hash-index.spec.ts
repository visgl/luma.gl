// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUHashIndex,
  GPUHashIndexQuery,
  GPU_HASH_INDEX_EMPTY_KEY
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUHashIndex builds and queries deterministic first-row values', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runHashIndex(
    device,
    Uint32Array.from([7, 3, 7, GPU_HASH_INDEX_EMPTY_KEY, 19, 11]),
    Uint32Array.from([70, 30, 71, 999, 190, 110]),
    Uint32Array.from([7, 3, 19, 11, 4, GPU_HASH_INDEX_EMPTY_KEY]),
    8
  );

  t.deepEqual(
    result.values,
    [70, 30, 190, 110, GPU_HASH_INDEX_EMPTY_KEY, GPU_HASH_INDEX_EMPTY_KEY],
    'lookups return the lowest-source-row value'
  );
  t.deepEqual(result.found, [1, 1, 1, 1, 0, 0], 'lookups publish an explicit found mask');
  t.deepEqual(
    result.buildStatistics.slice(0, 4),
    [4, 1, 0, 1],
    'build distinguishes unique, duplicate, overflow, and invalid rows'
  );
  t.deepEqual(result.queryStatistics.slice(0, 2), [4, 2], 'query counts found and missing keys');
  t.ok(
    result.probes.every(probeCount => probeCount <= 8),
    'every lookup obeys the probe bound'
  );
  t.equal(
    result.tableKeys.filter(key => key !== GPU_HASH_INDEX_EMPTY_KEY).length,
    4,
    'one table slot is occupied per distinct valid key'
  );
  t.end();
});

test('GPUHashIndex reports fixed-capacity overflow and generated row IDs', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const keys = Uint32Array.from([1, 2, 3, 4, 5, 6]);
  const result = await runHashIndex(device, keys, undefined, keys, 4, {firstValue: 100});

  t.deepEqual(
    result.buildStatistics.slice(0, 4),
    [4, 0, 2, 0],
    'a full table reports the exact overflow row count'
  );
  t.equal(result.queryStatistics[0], 4, 'exactly the retained keys are found');
  t.equal(result.queryStatistics[1], 2, 'overflowed keys are reported missing');
  for (let row = 0; row < keys.length; row++) {
    if (result.found[row]) {
      t.equal(
        result.values[row],
        100 + row,
        `retained key ${keys[row]} maps to its generated row ID`
      );
    }
  }
  t.end();
});

test('GPUHashIndex validates capacity, probe bounds, and aliasing', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
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

  t.throws(
    () =>
      new GPUHashIndex({
        keys,
        tableKeys,
        tableValues: overlappingTableValues,
        statistics: statisticsView
      }),
    /output views must not overlap/,
    'table outputs cannot alias'
  );
  t.throws(
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
    /positive power of two/,
    'capacity must be a power of two'
  );
  t.throws(
    () =>
      new GPUHashIndex({
        keys,
        tableKeys,
        tableValues: tableKeys,
        statistics: statisticsView,
        maxProbeCount: 5
      }),
    /one through capacity/,
    'probe work cannot exceed capacity'
  );

  input.destroy();
  table.destroy();
  statistics.destroy();
  t.end();
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
