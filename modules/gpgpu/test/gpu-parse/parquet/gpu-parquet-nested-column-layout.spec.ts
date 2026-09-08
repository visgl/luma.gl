import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPUParquetNestedColumnLayout} from '@luma.gl/gpgpu/gpu-parse';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPUParquetNestedColumnLayout preserves page chunks and materializes two depths', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    return;
  }
  const graph = new GPUCommandGraph(device);
  const buffers: Buffer[] = [];
  const importChunks = (id: string, chunks: readonly Uint32Array[]) => {
    const data = chunks.map((values, chunkIndex) => {
      const buffer = device.createBuffer({
        data: values.length > 0 ? values : new Uint32Array(1),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
      buffers.push(buffer);
      const handle = graph.importBuffer(
        {id: `${id}-${chunkIndex}`, byteLength: buffer.byteLength, usage: buffer.usage},
        buffer
      );
      return graph.createDataView(handle, {format: 'uint32', length: values.length});
    });
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
  };
  const definitionLevels = importChunks('definition-levels', [
    Uint32Array.from([3, 3, 2, 3, 1, 3]),
    Uint32Array.from([3, 0, 3, 2]),
    new Uint32Array(0)
  ]);
  const repetitionLevels = importChunks('repetition-levels', [
    Uint32Array.from([0, 2, 1, 0, 0, 1]),
    Uint32Array.from([2, 0, 0, 0]),
    new Uint32Array(0)
  ]);
  const result = new GPUParquetNestedColumnLayout({
    definitionLevels,
    repetitionLevels,
    maxDefinitionLevel: 3,
    depths: [
      {name: 'outer', elementDefinitionLevel: 1, rowStartRepetitionLevel: 0},
      {name: 'inner', elementDefinitionLevel: 2, rowStartRepetitionLevel: 1}
    ]
  }).addToGraph(graph);

  expect(result.validity.data.map(chunk => chunk.length)).toEqual([6, 4, 0]);
  expect(result.depths[0].listOffsets.data.map(chunk => chunk.length)).toEqual([11]);

  const readbacks = new Map<GraphDataView<'uint32'>, Buffer>();
  const addReadback = (id: string, view: GraphDataView<'uint32'>) => {
    const buffer = device.createBuffer({
      byteLength: Math.max(view.length, 1) * 4,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    buffers.push(buffer);
    const handle = graph.importBuffer(
      {id: `${id}-readback`, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    graph.addCopyPass({
      id: `${id}-copy`,
      resources: [
        {buffer: view, usage: 'copy-source'},
        {buffer: handle, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) =>
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(view),
            sourceOffset: view.byteOffset,
            destinationBuffer: getBuffer(handle),
            destinationOffset: 0,
            size: Math.max(view.length, 1) * 4
          })
      })
    });
    readbacks.set(view, buffer);
  };
  for (const [name, vector] of Object.entries({
    validity: result.validity,
    valueOffsets: result.valueOffsets,
    nonNullValueCounts: result.nonNullValueCounts,
    outerListOffsets: result.depths[0].listOffsets,
    outerElementCounts: result.depths[0].elementCounts,
    outerRowCounts: result.depths[0].rowCounts,
    innerListOffsets: result.depths[1].listOffsets,
    innerElementCounts: result.depths[1].elementCounts,
    innerRowCounts: result.depths[1].rowCounts
  })) {
    vector.data.forEach((view, chunkIndex) => addReadback(`${name}-${chunkIndex}`, view));
  }

  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-nested-layout-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const read = async (view: GraphDataView<'uint32'>) => {
      const bytes = await readbacks.get(view)!.readAsync();
      return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, view.length));
    };
    expect(await read(result.validity.data[0])).toEqual([1, 1, 0, 1, 0, 1]);
    expect(await read(result.validity.data[1])).toEqual([1, 0, 1, 0]);
    expect(await read(result.valueOffsets.data[0])).toEqual([0, 1, 2, 2, 3, 3]);
    expect(await read(result.valueOffsets.data[1])).toEqual([4, 5, 5, 6]);
    expect(await read(result.nonNullValueCounts.data[0])).toEqual([6]);
    expect((await read(result.depths[0].listOffsets.data[0])).slice(0, 7)).toEqual([
      0, 3, 4, 7, 7, 8, 9
    ]);
    expect(await read(result.depths[0].elementCounts.data[0])).toEqual([9]);
    expect(await read(result.depths[0].rowCounts.data[0])).toEqual([6]);
    expect((await read(result.depths[1].listOffsets.data[0])).slice(0, 8)).toEqual([
      0, 2, 3, 4, 4, 6, 7, 8
    ]);
    expect(await read(result.depths[1].elementCounts.data[0])).toEqual([8]);
    expect(await read(result.depths[1].rowCounts.data[0])).toEqual([7]);
  } finally {
    compiled.destroy();
    for (const buffer of buffers) {
      buffer.destroy();
    }
  }
});
