// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUBatchHashIndex,
  GPUCommandGraph,
  GPUHashIndexQuery,
  GPU_HASH_INDEX_EMPTY_KEY,
  GraphVectorView,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUBatchHashIndex preserves nullable batches, earliest duplicates, and source offsets', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const result = await runBatchHashIndex(device, {
    keys: [[7, 10], [], [10, GPU_HASH_INDEX_EMPTY_KEY, 20, 30, GPU_HASH_INDEX_EMPTY_KEY]],
    validity: [[1, 1], [], [1, 1, 0, 1, 0]],
    firstValues: [40, 100, 500],
    queryKeys: [7, 10, 20, 30, GPU_HASH_INDEX_EMPTY_KEY, 99],
    capacity: 8,
    encodingCount: 2
  });

  testCase.deepEqual(
    result.values,
    [40, 41, GPU_HASH_INDEX_EMPTY_KEY, 503, GPU_HASH_INDEX_EMPTY_KEY, GPU_HASH_INDEX_EMPTY_KEY],
    'generated values retain discontinuous batch offsets and globally earliest duplicates'
  );
  testCase.deepEqual(result.found, [1, 1, 0, 1, 0, 0], 'nullable keys are excluded from lookups');
  testCase.deepEqual(
    result.buildStatistics.slice(0, 4),
    [3, 1, 0, 1],
    'counts valid duplicates and reserved keys while silently skipping invalid/null rows'
  );
  testCase.equal(
    result.tableKeys.filter(key => key !== GPU_HASH_INDEX_EMPTY_KEY).length,
    3,
    'one shared table slot is retained per distinct valid key'
  );
  testCase.ok(result.buildStatistics[4] >= 4, 'cumulative probes include every non-null valid row');
  testCase.ok(result.buildStatistics[5] <= 8, 'all chunks obey the common probe bound');
  testCase.deepEqual(result.queryStatistics.slice(0, 2), [3, 3], 're-encoding resets diagnostics');
  testCase.end();
});

test('GPUBatchHashIndex resolves explicit payloads across offset chunk views', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const result = await runBatchHashIndex(device, {
    keys: [[5, 8], [], [8, 13, 21]],
    values: [[500, 800], [], [801, 1300, 2100]],
    queryKeys: [5, 8, 13, 21],
    capacity: 8,
    sourceByteOffset: 8
  });

  testCase.deepEqual(
    result.values,
    [500, 800, 1300, 2100],
    'later duplicate chunks cannot overwrite the globally first explicit payload'
  );
  testCase.deepEqual(result.found, [1, 1, 1, 1], 'finds keys originating in distinct GPU buffers');
  testCase.deepEqual(
    result.buildStatistics.slice(0, 4),
    [4, 1, 0, 0],
    'accumulates chunk statistics'
  );
  testCase.end();
});

test('GPUBatchHashIndex accumulates bounded overflow without resetting between chunks', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const result = await runBatchHashIndex(device, {
    keys: [[1, 2], [], [3, 4]],
    firstValues: [10, 99, 30],
    queryKeys: [1, 2, 3, 4],
    capacity: 2
  });

  testCase.deepEqual(
    result.buildStatistics.slice(0, 4),
    [2, 0, 2, 0],
    'later distinct keys report fixed-capacity overflow without clearing earlier rows'
  );
  testCase.deepEqual(result.found, [1, 1, 0, 0], 'only first-batch keys remain available');
  testCase.deepEqual(
    result.values,
    [10, 11, GPU_HASH_INDEX_EMPTY_KEY, GPU_HASH_INDEX_EMPTY_KEY],
    'surviving keys preserve original first-source offsets'
  );
  testCase.end();
});

test('GPUBatchHashIndex clears zero-chunk and empty-chunk index topologies', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  for (const keys of [[], [[], []]] as readonly (readonly number[])[][]) {
    const result = await runBatchHashIndex(device, {keys, queryKeys: [1], capacity: 4});
    testCase.deepEqual(
      result.tableKeys,
      [
        GPU_HASH_INDEX_EMPTY_KEY,
        GPU_HASH_INDEX_EMPTY_KEY,
        GPU_HASH_INDEX_EMPTY_KEY,
        GPU_HASH_INDEX_EMPTY_KEY
      ],
      'empty source topologies initialize every shared table slot'
    );
    testCase.deepEqual(
      result.buildStatistics,
      [0, 0, 0, 0, 0, 0],
      'empty chunks add no statistics'
    );
    testCase.deepEqual(result.found, [0], 'empty tables do not publish matches');
  }
  testCase.end();
});

type BatchHashIndexFixture = {
  keys: readonly (readonly number[])[];
  values?: readonly (readonly number[])[];
  validity?: readonly (readonly number[])[];
  firstValues?: readonly number[];
  queryKeys: readonly number[];
  capacity: number;
  encodingCount?: number;
  sourceByteOffset?: number;
};

async function runBatchHashIndex(device: Device, fixture: BatchHashIndexFixture) {
  const graph = new GPUCommandGraph(device, {id: 'batch-hash-index-browser'});
  const resources: Buffer[] = [];
  const keys = createImportedVector(
    graph,
    device,
    resources,
    'input-keys',
    fixture.keys,
    fixture.sourceByteOffset
  );
  const values = fixture.values
    ? createImportedVector(
        graph,
        device,
        resources,
        'input-values',
        fixture.values,
        fixture.sourceByteOffset
      )
    : undefined;
  const validity = fixture.validity
    ? createImportedVector(
        graph,
        device,
        resources,
        'input-validity',
        fixture.validity,
        fixture.sourceByteOffset
      )
    : undefined;
  const queryKeys = createImportedView(graph, device, resources, 'query-keys', fixture.queryKeys);
  const tableKeys = createOutputView(graph, device, resources, 'table-keys', fixture.capacity);
  const tableValues = createOutputView(graph, device, resources, 'table-values', fixture.capacity);
  const buildStatistics = createOutputView(graph, device, resources, 'build-statistics', 6);
  const outputValues = createOutputView(graph, device, resources, 'query-values', queryKeys.length);
  const found = createOutputView(graph, device, resources, 'query-found', queryKeys.length);
  const probes = createOutputView(graph, device, resources, 'query-probes', queryKeys.length);
  const queryStatistics = createOutputView(graph, device, resources, 'query-statistics', 4);

  const index = new GPUBatchHashIndex({
    id: 'browser-batch-index',
    keys,
    ...(values ? {values} : {}),
    ...(validity ? {validity} : {}),
    ...(fixture.firstValues ? {firstValues: fixture.firstValues} : {}),
    tableKeys: tableKeys.view,
    tableValues: tableValues.view,
    statistics: buildStatistics.view
  });
  index.addToGraph(graph);
  new GPUHashIndexQuery({
    id: 'browser-batch-query',
    index,
    keys: queryKeys,
    values: outputValues.view,
    found: found.view,
    probes: probes.view,
    statistics: queryStatistics.view
  }).addToGraph(graph);

  const compiled = graph.compile();
  try {
    for (let encoding = 0; encoding < (fixture.encodingCount ?? 1); encoding++) {
      const commandEncoder = device.createCommandEncoder({id: `batch-hash-index-${encoding}`});
      compiled.encode(commandEncoder, {parameters: undefined});
      device.submit(commandEncoder.finish());
    }
    return {
      tableKeys: await readUint32(tableKeys.buffer, fixture.capacity),
      buildStatistics: await readUint32(buildStatistics.buffer, 6),
      values: await readUint32(outputValues.buffer, queryKeys.length),
      found: await readUint32(found.buffer, queryKeys.length),
      probes: await readUint32(probes.buffer, queryKeys.length),
      queryStatistics: await readUint32(queryStatistics.buffer, 4)
    };
  } finally {
    compiled.destroy();
    for (const resource of resources) resource.destroy();
  }
}

function createImportedVector(
  graph: GPUCommandGraph,
  device: Device,
  resources: Buffer[],
  id: string,
  chunks: readonly (readonly number[])[],
  byteOffset = 0
): GraphVectorView<'uint32'> {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data: chunks.map((chunk, chunkIndex) =>
      createImportedView(graph, device, resources, `${id}-chunk-${chunkIndex}`, chunk, byteOffset)
    )
  });
}

function createImportedView(
  graph: GPUCommandGraph,
  device: Device,
  resources: Buffer[],
  id: string,
  values: readonly number[],
  byteOffset = 0
): GraphDataView<'uint32'> {
  const prefixLength = byteOffset / Uint32Array.BYTES_PER_ELEMENT;
  const data = new Uint32Array(prefixLength + Math.max(values.length, 1));
  data.set(values, prefixLength);
  const buffer = device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
  resources.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length: values.length, byteOffset});
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

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
