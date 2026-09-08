import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, GPUSegmentedLayout} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPUSegmentedLayout materializes generic value and segment offsets', async () => {
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
      byteLength: length * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    buffers.push(buffer);
    const handle = graph.importBuffer(
      {id, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    return {buffer, view: graph.createDataView(handle, {format: 'uint32', length})};
  };
  const valueOffsets = importOutput('value-offsets', 6);
  const elementOffsets = importOutput('element-offsets', 6);
  const segmentIndices = importOutput('segment-indices', 6);
  const segmentOffsets = importOutput('segment-offsets', 7);
  const valueCount = importOutput('value-count', 1);
  const elementCount = importOutput('element-count', 1);
  const segmentCount = importOutput('segment-count', 1);
  new GPUSegmentedLayout({
    valueFlags: importValues('value-flags', Uint32Array.from([1, 0, 1, 1, 0, 1])),
    elementFlags: importValues('element-flags', Uint32Array.from([1, 1, 1, 0, 1, 1])),
    segmentStartFlags: importValues('segment-start-flags', Uint32Array.from([0, 0, 1, 0, 1, 0])),
    valueOffsets: valueOffsets.view,
    elementOffsets: elementOffsets.view,
    segmentIndices: segmentIndices.view,
    segmentOffsets: segmentOffsets.view,
    valueCount: valueCount.view,
    elementCount: elementCount.view,
    segmentCount: segmentCount.view
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-segmented-layout-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const read = async (buffer: Buffer, length: number) => {
      const result = await buffer.readAsync();
      return Array.from(new Uint32Array(result.buffer, result.byteOffset, length));
    };
    expect(await read(valueOffsets.buffer, 6)).toEqual([0, 1, 1, 2, 3, 3]);
    expect(await read(elementOffsets.buffer, 6)).toEqual([0, 1, 2, 3, 3, 4]);
    expect(await read(segmentIndices.buffer, 6)).toEqual([0, 0, 1, 1, 2, 2]);
    expect((await read(segmentOffsets.buffer, 7)).slice(0, 4)).toEqual([0, 2, 3, 5]);
    expect(await read(valueCount.buffer, 1)).toEqual([4]);
    expect(await read(elementCount.buffer, 1)).toEqual([5]);
    expect(await read(segmentCount.buffer, 1)).toEqual([3]);
  } finally {
    compiled.destroy();
    for (const buffer of buffers) {
      buffer.destroy();
    }
  }
});

it('GPUSegmentedLayout clears counts and the first offset for an empty sequence', async () => {
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
    {id: 'empty', byteLength: emptyBuffer.byteLength, usage: emptyBuffer.usage},
    emptyBuffer
  );
  const emptyView = graph.createDataView(emptyHandle, {format: 'uint32', length: 0});
  const outputViews = outputBuffers.map((buffer, index) => {
    const handle = graph.importBuffer(
      {id: `empty-output-${index}`, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    return graph.createDataView(handle, {format: 'uint32', length: 1});
  });
  new GPUSegmentedLayout({
    valueFlags: emptyView,
    elementFlags: emptyView,
    segmentStartFlags: emptyView,
    valueOffsets: emptyView,
    elementOffsets: emptyView,
    segmentIndices: emptyView,
    segmentOffsets: outputViews[0],
    valueCount: outputViews[1],
    elementCount: outputViews[2],
    segmentCount: outputViews[3]
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-segmented-layout-empty-test'});
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
