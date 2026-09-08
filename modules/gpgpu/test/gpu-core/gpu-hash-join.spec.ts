import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUHashIndex,
  GPUHashJoin,
  GPU_HASH_INDEX_EMPTY_KEY
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPUHashJoin stably publishes sparse row pairs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runHashJoin(device, {
    rightKeys: Uint32Array.from([90, 20, 70, 40]),
    rightRows: Uint32Array.from([900, 200, 700, 400]),
    leftKeys: Uint32Array.from([70, 1, 20, 70, GPU_HASH_INDEX_EMPTY_KEY, 40]),
    firstLeftRow: 100,
    outputCapacity: 6
  });

  expect(result.leftRows.slice(0, 4), 'matching left rows retain source order').toEqual([
    100, 102, 103, 105
  ]);
  expect(result.rightRows.slice(0, 4), 'right rows align with stable left rows').toEqual([
    700, 200, 700, 400
  ]);
  expect(result.count, 'count reports all inner-join matches').toBe(4);
  expect(result.overflow, 'sufficient output capacity does not overflow').toBe(0);
  expect(result.found, 'optional found mask exposes aligned left-join semantics').toEqual([
    1, 0, 1, 1, 0, 1
  ]);
  expect(result.statistics.slice(0, 2), 'lookup statistics report found and missing rows').toEqual([
    4, 2
  ]);
});

it('GPUHashJoin preserves explicit left IDs and reports required capacity', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runHashJoin(device, {
    rightKeys: Uint32Array.from([90, 20, 70, 40]),
    rightRows: Uint32Array.from([900, 200, 700, 400]),
    leftKeys: Uint32Array.from([70, 1, 20, 70, 40]),
    leftRows: Uint32Array.from([500, 501, 502, 503, 504]),
    outputCapacity: 2
  });

  expect(result.leftRows, 'bounded publication retains the stable matching prefix').toEqual([
    500, 502
  ]);
  expect(result.rightRows, 'truncated right rows remain pair-aligned').toEqual([700, 200]);
  expect(result.count, 'count reports required rather than stored capacity').toBe(4);
  expect(result.overflow, 'truncation is explicit').toBe(1);
});

it('GPUHashJoin clears empty results and validates output ownership', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const empty = await runHashJoin(device, {
    rightKeys: Uint32Array.from([1]),
    rightRows: Uint32Array.from([10]),
    leftKeys: new Uint32Array(0),
    outputCapacity: 1
  });
  expect(empty.count, 'empty input writes a zero required count').toBe(0);
  expect(empty.overflow, 'empty input clears overflow').toBe(0);
  expect(empty.statistics, 'empty lookup clears query statistics').toEqual([0, 0, 0, 0]);

  const sourceOverflow = await runHashJoin(device, {
    rightKeys: Uint32Array.from([1, 2, 3]),
    rightRows: Uint32Array.from([10, 20, 30]),
    leftKeys: new Uint32Array(0),
    tableCapacity: 2,
    outputCapacity: 1
  });
  expect(sourceOverflow.overflow, 'an incomplete source index propagates overflow').toBe(1);

  const graph = new GPUCommandGraph(device);
  const tableKeysBuffer = createOutputBuffer(device, 4);
  const tableValuesBuffer = createOutputBuffer(device, 4);
  const keysBuffer = createInputBuffer(device, Uint32Array.from([1, 2]));
  const sharedOutputBuffer = createOutputBuffer(device, 4);
  const scalarBuffer = createOutputBuffer(device, 6);
  const index = {
    tableKeys: importView(graph, 'table-keys', tableKeysBuffer, 4),
    tableValues: importView(graph, 'table-values', tableValuesBuffer, 4),
    maxProbeCount: 4
  };
  const sharedOutput = importView(graph, 'shared-output', sharedOutputBuffer, 2);
  const scalarHandle = graph.importBuffer(
    {id: 'scalars', byteLength: scalarBuffer.byteLength, usage: scalarBuffer.usage},
    scalarBuffer
  );
  expect(
    () =>
      new GPUHashJoin({
        index,
        keys: importView(graph, 'keys', keysBuffer, 2),
        outputLeftRows: sharedOutput,
        outputRightRows: sharedOutput,
        count: graph.createDataView(scalarHandle, {format: 'uint32', length: 1}),
        overflow: graph.createDataView(scalarHandle, {
          format: 'uint32',
          length: 1,
          byteOffset: 4
        }),
        statistics: graph.createDataView(scalarHandle, {
          format: 'uint32',
          length: 4,
          byteOffset: 8
        })
      }),
    'join outputs cannot alias'
  ).toThrow(/output views must not overlap/);

  tableKeysBuffer.destroy();
  tableValuesBuffer.destroy();
  keysBuffer.destroy();
  sharedOutputBuffer.destroy();
  scalarBuffer.destroy();
});

type JoinFixtureProps = {
  rightKeys: Uint32Array;
  rightRows: Uint32Array;
  leftKeys: Uint32Array;
  leftRows?: Uint32Array;
  firstLeftRow?: number;
  outputCapacity: number;
  tableCapacity?: number;
};

async function runHashJoin(device: Device, props: JoinFixtureProps) {
  const graph = new GPUCommandGraph(device);
  const buffers = {
    rightKeys: createInputBuffer(device, props.rightKeys),
    rightRows: createInputBuffer(device, props.rightRows),
    leftKeys: createInputBuffer(device, props.leftKeys),
    leftRows: props.leftRows ? createInputBuffer(device, props.leftRows) : undefined,
    tableKeys: createOutputBuffer(device, props.tableCapacity ?? 8),
    tableValues: createOutputBuffer(device, props.tableCapacity ?? 8),
    buildStatistics: createOutputBuffer(device, 6),
    outputLeftRows: createOutputBuffer(device, props.outputCapacity),
    outputRightRows: createOutputBuffer(device, props.outputCapacity),
    count: createOutputBuffer(device, 1),
    overflow: createOutputBuffer(device, 1),
    statistics: createOutputBuffer(device, 4),
    found: createOutputBuffer(device, props.leftKeys.length),
    probes: createOutputBuffer(device, props.leftKeys.length)
  };
  const index = new GPUHashIndex({
    keys: importView(graph, 'right-keys', buffers.rightKeys, props.rightKeys.length),
    values: importView(graph, 'right-rows', buffers.rightRows, props.rightRows.length),
    tableKeys: importView(graph, 'table-keys', buffers.tableKeys, props.tableCapacity ?? 8),
    tableValues: importView(graph, 'table-values', buffers.tableValues, props.tableCapacity ?? 8),
    statistics: importView(graph, 'build-statistics', buffers.buildStatistics, 6)
  });
  index.addToGraph(graph);
  new GPUHashJoin({
    index,
    keys: importView(graph, 'left-keys', buffers.leftKeys, props.leftKeys.length),
    ...(buffers.leftRows
      ? {leftRows: importView(graph, 'left-rows', buffers.leftRows, props.leftRows!.length)}
      : {firstLeftRow: props.firstLeftRow}),
    outputLeftRows: importView(
      graph,
      'output-left-rows',
      buffers.outputLeftRows,
      props.outputCapacity
    ),
    outputRightRows: importView(
      graph,
      'output-right-rows',
      buffers.outputRightRows,
      props.outputCapacity
    ),
    count: importView(graph, 'count', buffers.count, 1),
    overflow: importView(graph, 'overflow', buffers.overflow, 1),
    statistics: importView(graph, 'statistics', buffers.statistics, 4),
    found: importView(graph, 'found', buffers.found, props.leftKeys.length),
    probes: importView(graph, 'probes', buffers.probes, props.leftKeys.length)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'hash-join-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = {
    leftRows: await readUint32(buffers.outputLeftRows, props.outputCapacity),
    rightRows: await readUint32(buffers.outputRightRows, props.outputCapacity),
    count: (await readUint32(buffers.count, 1))[0],
    overflow: (await readUint32(buffers.overflow, 1))[0],
    statistics: await readUint32(buffers.statistics, 4),
    found: await readUint32(buffers.found, props.leftKeys.length)
  };
  compiled.destroy();
  for (const buffer of Object.values(buffers)) buffer?.destroy();
  return result;
}

function createInputBuffer(device: Device, values: Uint32Array): Buffer {
  return device.createBuffer({
    data: values.length ? values : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
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

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
