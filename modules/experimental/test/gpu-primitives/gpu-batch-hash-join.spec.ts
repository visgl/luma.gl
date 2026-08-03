// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUBatchHashJoin,
  GPUCommandGraph,
  GPUHashIndex,
  GraphVectorView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUBatchHashJoin preserves uneven and empty batch boundaries', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runBatchJoin(device, {
    keyChunks: [Uint32Array.from([70, 1]), new Uint32Array(0), Uint32Array.from([20, 70, 40])],
    outputCapacities: [2, 0, 2],
    firstLeftRow: 100
  });

  t.deepEqual(result.counts, [1, 0, 3], 'each batch reports its own required match count');
  t.deepEqual(result.overflows, [0, 0, 1], 'only the truncated batch overflows');
  t.deepEqual(
    result.leftRows,
    [[100, 0], [], [102, 103]],
    'global IDs advance across preserved chunks'
  );
  t.deepEqual(
    result.rightRows,
    [[700, 0], [], [200, 700]],
    'pairs cannot spill between batch capacities'
  );
  t.deepEqual(
    result.found,
    [[1, 0], [], [1, 1, 1]],
    'aligned match masks preserve source topology'
  );
  t.deepEqual(
    result.statistics.map(block => block.slice(0, 2)),
    [
      [1, 1],
      [0, 0],
      [3, 0]
    ],
    'query statistics stay batch-addressable'
  );
  t.end();
});

test('GPUBatchHashJoin preserves explicit IDs and propagates source overflow per batch', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runBatchJoin(device, {
    rightKeys: Uint32Array.from([20, 40, 70]),
    rightRows: Uint32Array.from([200, 400, 700]),
    tableCapacity: 2,
    keyChunks: [Uint32Array.from([20]), Uint32Array.from([40, 70])],
    leftRowChunks: [Uint32Array.from([900]), Uint32Array.from([800, 700])],
    outputCapacities: [1, 2]
  });

  t.deepEqual(result.overflows, [1, 1], 'an incomplete shared index marks every batch incomplete');
  for (let batchIndex = 0; batchIndex < result.leftRows.length; batchIndex++) {
    for (
      let outputIndex = 0;
      outputIndex < Math.min(result.counts[batchIndex], result.leftRows[batchIndex].length);
      outputIndex++
    ) {
      t.ok(
        [900, 800, 700].includes(result.leftRows[batchIndex][outputIndex]),
        'retained matches use explicit left IDs'
      );
    }
  }
  t.end();
});

test('GPUBatchHashJoin validates partition and output topology', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device);
  const keys = makeVector(graph, device, 'keys', [Uint32Array.from([1]), Uint32Array.from([2])]);
  const oneChunkOutput = makeOutputVector(graph, device, 'one-output', [2]);
  const twoChunkOutput = makeOutputVector(graph, device, 'two-output', [1, 1]);
  const tableKeys = createOutputBuffer(device, 4);
  const tableValues = createOutputBuffer(device, 4);
  const counts = createOutputBuffer(device, 2);
  const overflows = createOutputBuffer(device, 2);
  const statistics = createOutputBuffer(device, 8);
  const index = {
    tableKeys: importView(graph, 'table-keys', tableKeys, 4),
    tableValues: importView(graph, 'table-values', tableValues, 4),
    maxProbeCount: 4
  };

  t.throws(
    () =>
      new GPUBatchHashJoin({
        index,
        keys: keys.vector,
        outputLeftRows: oneChunkOutput.vector,
        outputRightRows: oneChunkOutput.vector,
        counts: importView(graph, 'counts', counts, 2),
        overflows: importView(graph, 'overflows', overflows, 2),
        statistics: importView(graph, 'statistics', statistics, 8)
      }),
    /one capacity chunk per input batch/,
    'every input batch requires an output partition'
  );
  t.throws(
    () =>
      new GPUBatchHashJoin({
        index,
        keys: keys.vector,
        outputLeftRows: twoChunkOutput.vector,
        outputRightRows: twoChunkOutput.vector,
        counts: importView(graph, 'counts-alias', counts, 2),
        overflows: importView(graph, 'overflows-alias', overflows, 2),
        statistics: importView(graph, 'statistics-alias', statistics, 8)
      }),
    /output views must not overlap/,
    'pair outputs cannot alias'
  );

  destroyBuffers([
    ...keys.buffers,
    ...oneChunkOutput.buffers,
    ...twoChunkOutput.buffers,
    tableKeys,
    tableValues,
    counts,
    overflows,
    statistics
  ]);
  t.end();
});

type BatchJoinProps = {
  rightKeys?: Uint32Array;
  rightRows?: Uint32Array;
  tableCapacity?: number;
  keyChunks: Uint32Array[];
  leftRowChunks?: Uint32Array[];
  firstLeftRow?: number;
  outputCapacities: number[];
};

async function runBatchJoin(device: Device, props: BatchJoinProps) {
  const graph = new GPUCommandGraph(device);
  const rightKeys = props.rightKeys ?? Uint32Array.from([90, 20, 70, 40]);
  const rightRows = props.rightRows ?? Uint32Array.from([900, 200, 700, 400]);
  const tableCapacity = props.tableCapacity ?? 8;
  const rightKeysBuffer = createInputBuffer(device, rightKeys);
  const rightRowsBuffer = createInputBuffer(device, rightRows);
  const tableKeysBuffer = createOutputBuffer(device, tableCapacity);
  const tableValuesBuffer = createOutputBuffer(device, tableCapacity);
  const buildStatisticsBuffer = createOutputBuffer(device, 6);
  const index = new GPUHashIndex({
    keys: importView(graph, 'right-keys', rightKeysBuffer, rightKeys.length),
    values: importView(graph, 'right-rows', rightRowsBuffer, rightRows.length),
    tableKeys: importView(graph, 'table-keys', tableKeysBuffer, tableCapacity),
    tableValues: importView(graph, 'table-values', tableValuesBuffer, tableCapacity),
    statistics: importView(graph, 'build-statistics', buildStatisticsBuffer, 6)
  });
  index.addToGraph(graph);

  const keys = makeVector(graph, device, 'keys', props.keyChunks);
  const leftRows = props.leftRowChunks
    ? makeVector(graph, device, 'left-rows', props.leftRowChunks)
    : undefined;
  const outputLeftRows = makeOutputVector(
    graph,
    device,
    'output-left-rows',
    props.outputCapacities
  );
  const outputRightRows = makeOutputVector(
    graph,
    device,
    'output-right-rows',
    props.outputCapacities
  );
  const found = makeOutputVector(
    graph,
    device,
    'found',
    props.keyChunks.map(chunk => chunk.length)
  );
  const probes = makeOutputVector(
    graph,
    device,
    'probes',
    props.keyChunks.map(chunk => chunk.length)
  );
  const batchCount = props.keyChunks.length;
  const countsBuffer = createOutputBuffer(device, batchCount);
  const overflowsBuffer = createOutputBuffer(device, batchCount);
  const statisticsBuffer = createOutputBuffer(device, batchCount * 4);
  new GPUBatchHashJoin({
    index,
    keys: keys.vector,
    ...(leftRows ? {leftRows: leftRows.vector} : {firstLeftRow: props.firstLeftRow}),
    outputLeftRows: outputLeftRows.vector,
    outputRightRows: outputRightRows.vector,
    counts: importView(graph, 'counts', countsBuffer, batchCount),
    overflows: importView(graph, 'overflows', overflowsBuffer, batchCount),
    statistics: importView(graph, 'statistics', statisticsBuffer, batchCount * 4),
    found: found.vector,
    probes: probes.vector
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'batch-hash-join-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = {
    leftRows: await readVector(outputLeftRows.buffers, props.outputCapacities),
    rightRows: await readVector(outputRightRows.buffers, props.outputCapacities),
    found: await readVector(
      found.buffers,
      props.keyChunks.map(chunk => chunk.length)
    ),
    counts: await readUint32(countsBuffer, batchCount),
    overflows: await readUint32(overflowsBuffer, batchCount),
    statistics: splitEvery(await readUint32(statisticsBuffer, batchCount * 4), 4)
  };
  compiled.destroy();
  destroyBuffers([
    rightKeysBuffer,
    rightRowsBuffer,
    tableKeysBuffer,
    tableValuesBuffer,
    buildStatisticsBuffer,
    ...keys.buffers,
    ...(leftRows?.buffers ?? []),
    ...outputLeftRows.buffers,
    ...outputRightRows.buffers,
    ...found.buffers,
    ...probes.buffers,
    countsBuffer,
    overflowsBuffer,
    statisticsBuffer
  ]);
  return result;
}

function makeVector(graph: GPUCommandGraph, device: Device, id: string, chunks: Uint32Array[]) {
  const buffers = chunks.map(chunk => createInputBuffer(device, chunk));
  const data = chunks.map((chunk, index) =>
    importView(graph, `${id}-${index}`, buffers[index], chunk.length)
  );
  return {vector: makeGraphVector(id, data), buffers};
}

function makeOutputVector(
  graph: GPUCommandGraph,
  device: Device,
  id: string,
  capacities: number[]
) {
  const buffers = capacities.map(capacity => createOutputBuffer(device, capacity));
  const data = capacities.map((capacity, index) =>
    importView(graph, `${id}-${index}`, buffers[index], capacity)
  );
  return {vector: makeGraphVector(id, data), buffers};
}

function makeGraphVector(id: string, data: ReturnType<typeof importView>[]) {
  const length = data.reduce((sum, chunk) => sum + chunk.length, 0);
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride: 4,
    rowByteLength: 4,
    data
  });
}

function createInputBuffer(device: Device, values: Uint32Array): Buffer {
  return device.createBuffer({
    data: values.length ? values : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

async function readVector(buffers: Buffer[], lengths: number[]): Promise<number[][]> {
  return Promise.all(buffers.map((buffer, index) => readUint32(buffer, lengths[index])));
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

function splitEvery(values: number[], width: number): number[][] {
  return Array.from({length: values.length / width}, (_, index) =>
    values.slice(index * width, index * width + width)
  );
}

function destroyBuffers(buffers: Buffer[]): void {
  for (const buffer of buffers) buffer.destroy();
}
