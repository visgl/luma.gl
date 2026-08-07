// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUPartitionedIndexedRangeCompaction,
  GraphVectorView,
  type GraphDataView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUPartitionedIndexedRangeCompaction keeps visible IDs in bounded chunks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const resources: Buffer[] = [];
  const graph = new GPUCommandGraph(device, {id: 'partitioned-range-compaction-graph'});
  const flags = createImportedVector(graph, device, resources, 'flags', [
    [1, 0, 1, 0, 1, 1],
    [0, 1, 1, 0, 1]
  ]);
  const output = createOutputVector(graph, device, resources, 'output', [6, 5]);
  const ranges = createImportedView(graph, device, resources, 'ranges', [0, 3, 3, 3, 6, 2, 8, 3]);
  const activeRangeIdsResource = createImportedBuffer(
    graph,
    device,
    resources,
    'active-range-ids',
    [0, 1, 2, 3],
    Buffer.STORAGE | Buffer.COPY_DST
  );
  const activeRangeDispatch = createImportedBuffer(
    graph,
    device,
    resources,
    'active-range-dispatch',
    [1, 4, 1],
    Buffer.STORAGE | Buffer.INDIRECT | Buffer.COPY_DST
  );
  const count = createOutputView(graph, device, resources, 'count', 1);
  const compaction = new GPUPartitionedIndexedRangeCompaction({
    id: 'visible',
    flags,
    ranges,
    rangeCount: 4,
    rangeLayout: {wordStride: 2, firstIndexWordOffset: 0, countWordOffset: 1},
    partitionRangeEnds: [2, 4],
    activeRangeIds: activeRangeIdsResource.view,
    activeRangeDispatch: activeRangeDispatch.handle,
    maximumRangeLength: 3,
    output: output.view,
    count: count.view
  });
  compaction.addToGraph(graph);
  const compiled = graph.compile();

  try {
    await encodeAndSubmit(device, compiled, 'partitioned-range-compaction-all');
    t.deepEqual(await readUint32(output.buffers[0], 4), [0, 2, 4, 5], 'first output chunk');
    t.deepEqual(await readUint32(output.buffers[1], 3), [7, 8, 10], 'second output chunk');
    t.deepEqual(await readUint32(count.buffer, 1), [7], 'total selected count');

    activeRangeIdsResource.buffer.write(Uint32Array.from([1, 3, 2, 0]));
    activeRangeDispatch.buffer.write(Uint32Array.from([1, 2, 1]));
    await encodeAndSubmit(device, compiled, 'partitioned-range-compaction-subset');
    t.deepEqual(await readUint32(output.buffers[0], 2), [4, 5], 'first candidate partition');
    t.deepEqual(await readUint32(output.buffers[1], 2), [8, 10], 'second candidate partition');
    t.deepEqual(
      await readUint32(count.buffer, 1),
      [4],
      'GPU candidate changes avoid recompilation'
    );
  } finally {
    compiled.destroy();
    for (const resource of resources) resource.destroy();
  }

  t.end();
});

function createImportedVector(
  graph: GPUCommandGraph,
  device: Device,
  resources: Buffer[],
  id: string,
  chunks: readonly (readonly number[])[]
): GraphVectorView<'uint32'> {
  const data = chunks.map((chunk, chunkIndex) =>
    createImportedView(graph, device, resources, `${id}-${chunkIndex}`, chunk)
  );
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data
  });
}

function createOutputVector(
  graph: GPUCommandGraph,
  device: Device,
  resources: Buffer[],
  id: string,
  chunkLengths: readonly number[]
): {buffers: Buffer[]; view: GraphVectorView<'uint32'>} {
  const outputs = chunkLengths.map((length, chunkIndex) =>
    createOutputView(graph, device, resources, `${id}-${chunkIndex}`, length)
  );
  const length = chunkLengths.reduce((sum, chunkLength) => sum + chunkLength, 0);
  return {
    buffers: outputs.map(output => output.buffer),
    view: new GraphVectorView({
      id,
      name: id,
      format: 'uint32',
      length,
      valueLength: length,
      stride: 1,
      byteStride: Uint32Array.BYTES_PER_ELEMENT,
      rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
      data: outputs.map(output => output.view)
    })
  };
}

function createImportedView(
  graph: GPUCommandGraph,
  device: Device,
  resources: Buffer[],
  id: string,
  values: readonly number[]
): GraphDataView<'uint32'> {
  return createImportedBuffer(graph, device, resources, id, values, Buffer.STORAGE).view;
}

function createImportedBuffer(
  graph: GPUCommandGraph,
  device: Device,
  resources: Buffer[],
  id: string,
  values: readonly number[],
  usage: number
): {buffer: Buffer; handle: GraphDataView<'uint32'>['buffer']; view: GraphDataView<'uint32'>} {
  const buffer = device.createBuffer({data: Uint32Array.from(values), usage});
  resources.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {
    buffer,
    handle,
    view: graph.createDataView(handle, {format: 'uint32', length: values.length})
  };
}

function createOutputView(
  graph: GPUCommandGraph,
  device: Device,
  resources: Buffer[],
  id: string,
  length: number
): {buffer: Buffer; view: GraphDataView<'uint32'>} {
  const buffer = device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  resources.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {buffer, view: graph.createDataView(handle, {format: 'uint32', length})};
}

async function encodeAndSubmit(
  device: Device,
  compiled: ReturnType<GPUCommandGraph<void>['compile']>,
  id: string
): Promise<void> {
  const commandEncoder = device.createCommandEncoder({id});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync(0, Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
