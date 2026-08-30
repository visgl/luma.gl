// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUGallopingSearch,
  GPUCommandGraph,
  GPU_GALLOPING_SEARCH_UNSORTED_QUERIES,
  type GPUGallopingSearchFormat,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const BUFFER_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

test('GPUGallopingSearch matches segmented lower bounds and recovers from unsorted queries', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'galloping-search-test'});
  const values = makeView(device, graph, 'values', 'float32', [1, 2, 2, 5, 10, 100, 3, 3, 8, 20]);
  const queries = makeView(device, graph, 'queries', 'float32', [0, 2, 3, 100, 101, 4, 3, 10]);
  const segments = makeView(device, graph, 'segments', 'uint32', [0, 6, 0, 5, 6, 4, 5, 3]);
  const output = makeView(
    device,
    graph,
    'output',
    'uint32',
    new Array(queries.view.length).fill(0xffffffff)
  );
  const validationErrors = makeView(device, graph, 'errors', 'uint32', [0xffffffff]);
  const search = new GPUGallopingSearch({
    values: values.view,
    queries: queries.view,
    segments: segments.view,
    maximumQueryCount: 5,
    queriesPerTile: 4,
    output: output.view,
    validationErrors: validationErrors.view
  });
  t.deepEqual(search.stats, {
    orderedValueCount: 10,
    indirect: false,
    segmentCount: 2,
    maximumQueryCount: 5,
    queriesPerTile: 4,
    maximumSearchCount: 4
  });
  search.addToGraph(graph);
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  t.deepEqual(await readUint32(output.buffer), [0, 1, 3, 5, 6, 8, 6, 9]);
  t.equal(
    (await readUint32(validationErrors.buffer))[0],
    GPU_GALLOPING_SEARCH_UNSORTED_QUERIES,
    'decreasing queries are reported while falling back to a correct lower bound'
  );

  compiled.destroy();
  for (const resource of [values, queries, segments, output, validationErrors]) {
    resource.buffer.destroy();
  }
  t.end();
});

test('GPUGallopingSearch follows a sorted index over strided canonical values', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'indexed-galloping-search-test'});
  const sourceData = Float32Array.from([50, -1, 10, -1, 30, -1, 20, -1, 40, -1]);
  const sourceBuffer = device.createBuffer({data: sourceData, usage: BUFFER_USAGE});
  const sourceHandle = graph.importBuffer(
    {id: 'indexed-values', byteLength: sourceBuffer.byteLength, usage: sourceBuffer.usage},
    sourceBuffer
  );
  const values = graph.createDataView(sourceHandle, {
    format: 'float32',
    length: 5,
    byteStride: 2 * Float32Array.BYTES_PER_ELEMENT
  });
  const valueOrder = makeView(device, graph, 'value-order', 'uint32', [1, 3, 2, 4, 0]);
  const queries = makeView(device, graph, 'indexed-queries', 'float32', [5, 20, 25, 50, 60]);
  const segments = makeView(device, graph, 'indexed-segments', 'uint32', [0, 5, 0, 5]);
  const output = makeView(device, graph, 'indexed-output', 'uint32', new Array(5).fill(0xffffffff));
  const validationErrors = makeView(device, graph, 'indexed-errors', 'uint32', [0xffffffff]);
  const search = new GPUGallopingSearch({
    values,
    valueOrder: valueOrder.view,
    queries: queries.view,
    segments: segments.view,
    maximumQueryCount: 5,
    output: output.view,
    validationErrors: validationErrors.view
  });
  t.deepEqual(search.stats, {
    orderedValueCount: 5,
    indirect: true,
    segmentCount: 1,
    maximumQueryCount: 5,
    queriesPerTile: 32,
    maximumSearchCount: 1
  });
  search.addToGraph(graph);
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  t.deepEqual(await readUint32(output.buffer), [0, 1, 2, 4, 5]);
  t.deepEqual(await readUint32(validationErrors.buffer), [0]);

  compiled.destroy();
  sourceBuffer.destroy();
  for (const resource of [valueOrder, queries, segments, output, validationErrors]) {
    resource.buffer.destroy();
  }
  t.end();
});

test('GPUGallopingSearch supports uint32 values, empty segments, and offset views', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'galloping-search-uint32-test'});
  const values = makeView(device, graph, 'values', 'uint32', [99, 1, 4, 4, 9, 12, 99], 1, 5);
  const queries = makeView(device, graph, 'queries', 'uint32', [99, 0, 4, 5, 20, 99], 1, 4);
  const segments = makeView(device, graph, 'segments', 'uint32', [0, 5, 0, 4, 5, 0, 4, 0]);
  const output = makeView(device, graph, 'output', 'uint32', [99, 99, 99, 99, 99, 99], 1, 4);
  const validationErrors = makeView(device, graph, 'errors', 'uint32', [0]);
  new GPUGallopingSearch({
    values: values.view,
    queries: queries.view,
    segments: segments.view,
    maximumQueryCount: 4,
    output: output.view,
    validationErrors: validationErrors.view
  }).addToGraph(graph);
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  t.deepEqual(await readUint32(output.buffer), [99, 0, 1, 3, 5, 99]);
  t.deepEqual(await readUint32(validationErrors.buffer), [0]);

  compiled.destroy();
  for (const resource of [values, queries, segments, output, validationErrors]) {
    resource.buffer.destroy();
  }
  t.end();
});

function makeView<Format extends GPUGallopingSearchFormat | 'uint32'>(
  device: Device,
  graph: GPUCommandGraph,
  id: string,
  format: Format,
  data: readonly number[],
  rowOffset = 0,
  rowLength = data.length
): {buffer: Buffer; view: GraphDataView<Format>} {
  const typedData = format === 'float32' ? Float32Array.from(data) : Uint32Array.from(data);
  const buffer = device.createBuffer({data: typedData, usage: BUFFER_USAGE});
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {
    buffer,
    view: graph.createDataView(handle, {
      format,
      length: rowLength,
      byteOffset: rowOffset * Uint32Array.BYTES_PER_ELEMENT
    })
  };
}

async function readUint32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}
