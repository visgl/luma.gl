import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUParquetLevelLayout} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPUParquetLevelLayout materializes validity, rows, and list offsets', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const graph = new GPUCommandGraph(device);
  const buffers: Buffer[] = [];
  const importValues = (id: string, values: Uint32Array) => {
    const buffer = device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST});
    buffers.push(buffer);
    const handle = graph.importBuffer(
      {id, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    return graph.createDataView(handle, {format: 'uint32', length: values.length});
  };
  const importOutput = (id: string, length: number) => {
    const buffer = device.createBuffer({
      byteLength: length * 4,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    buffers.push(buffer);
    const handle = graph.importBuffer(
      {id, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    return {buffer, view: graph.createDataView(handle, {format: 'uint32', length})};
  };
  const validity = importOutput('validity', 5);
  const valueOffsets = importOutput('value-offsets', 5);
  const elementFlags = importOutput('element-flags', 5);
  const elementOffsets = importOutput('element-offsets', 5);
  const rowStartFlags = importOutput('row-start-flags', 5);
  const rowIndices = importOutput('row-indices', 5);
  const listOffsets = importOutput('list-offsets', 6);
  const nonNullValueCount = importOutput('non-null-count', 1);
  const elementCount = importOutput('element-count', 1);
  const rowCount = importOutput('row-count', 1);
  new GPUParquetLevelLayout({
    definitionLevels: importValues('definition-levels', Uint32Array.from([2, 2, 1, 2, 1])),
    repetitionLevels: importValues('repetition-levels', Uint32Array.from([0, 1, 0, 0, 1])),
    validity: validity.view,
    valueOffsets: valueOffsets.view,
    elementFlags: elementFlags.view,
    elementOffsets: elementOffsets.view,
    rowStartFlags: rowStartFlags.view,
    rowIndices: rowIndices.view,
    listOffsets: listOffsets.view,
    nonNullValueCount: nonNullValueCount.view,
    elementCount: elementCount.view,
    rowCount: rowCount.view,
    maxDefinitionLevel: 2,
    elementDefinitionLevel: 1,
    rowStartRepetitionLevel: 0
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-level-layout-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const read = async (buffer: Buffer, length: number) => {
      const result = await buffer.readAsync();
      return Array.from(new Uint32Array(result.buffer, result.byteOffset, length));
    };
    expect(await read(validity.buffer, 5)).toEqual([1, 1, 0, 1, 0]);
    expect(await read(valueOffsets.buffer, 5)).toEqual([0, 1, 2, 2, 3]);
    expect(await read(elementFlags.buffer, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(await read(elementOffsets.buffer, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(await read(rowStartFlags.buffer, 5)).toEqual([0, 0, 1, 1, 0]);
    expect(await read(rowIndices.buffer, 5)).toEqual([0, 0, 1, 2, 2]);
    expect((await read(listOffsets.buffer, 6)).slice(0, 4)).toEqual([0, 2, 3, 5]);
    expect(await read(nonNullValueCount.buffer, 1)).toEqual([3]);
    expect(await read(elementCount.buffer, 1)).toEqual([5]);
    expect(await read(rowCount.buffer, 1)).toEqual([3]);
  } finally {
    compiled.destroy();
    for (const buffer of buffers) {
      buffer.destroy();
    }
  }
});

it('GPUParquetLevelLayout clears counts for an empty level stream', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const graph = new GPUCommandGraph(device);
  const emptyBuffer = device.createBuffer({byteLength: 4, usage: Buffer.STORAGE});
  const staleValue = Uint32Array.from([0xffffffff]);
  const outputBuffers = Array.from({length: 4}, () =>
    device.createBuffer({
      data: staleValue,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    })
  );
  const emptyHandle = graph.importBuffer(
    {id: 'empty', byteLength: 4, usage: emptyBuffer.usage},
    emptyBuffer
  );
  const emptyView = graph.createDataView(emptyHandle, {format: 'uint32', length: 0});
  const outputViews = outputBuffers.map((buffer, index) => {
    const handle = graph.importBuffer(
      {id: `empty-output-${index}`, byteLength: 4, usage: buffer.usage},
      buffer
    );
    return graph.createDataView(handle, {format: 'uint32', length: 1});
  });
  new GPUParquetLevelLayout({
    definitionLevels: emptyView,
    repetitionLevels: emptyView,
    validity: emptyView,
    valueOffsets: emptyView,
    elementFlags: emptyView,
    elementOffsets: emptyView,
    rowStartFlags: emptyView,
    rowIndices: emptyView,
    listOffsets: outputViews[0],
    nonNullValueCount: outputViews[1],
    elementCount: outputViews[2],
    rowCount: outputViews[3],
    maxDefinitionLevel: 0,
    elementDefinitionLevel: 0,
    rowStartRepetitionLevel: 0
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-empty-level-layout-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    for (const buffer of outputBuffers) {
      const result = await buffer.readAsync();
      expect(new Uint32Array(result.buffer, result.byteOffset, 1)[0]).toBe(0);
    }
  } finally {
    compiled.destroy();
    emptyBuffer.destroy();
    for (const buffer of outputBuffers) {
      buffer.destroy();
    }
  }
});
