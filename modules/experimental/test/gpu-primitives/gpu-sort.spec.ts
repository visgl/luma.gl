// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUBatchSort,
  GPUCommandGraph,
  GraphVectorView,
  GPUSort,
  type GPUSortAlgorithm,
  type GPUSortDirection
} from '@luma.gl/experimental';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUSort bitonic stably sorts paired uint32 values in both directions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const keys = Uint32Array.from([9, 4, 6, 2, 4, 1, 7, 0xffffffff, 1]);
  const values = Uint32Array.from(keys, (_, index) => 100 + index);
  for (const direction of ['ascending', 'descending'] as const) {
    const result = await runSort(device, keys, values, 'bitonic', direction);
    const expected = getStableSortedPairs(keys, values, direction);
    t.deepEqual(result.keys, expected.keys, `${direction} bitonic keys match`);
    t.deepEqual(result.values, expected.values, `${direction} bitonic values remain stable`);
    t.equal(result.resolvedAlgorithm, 'bitonic', 'forced bitonic is reported');
    t.ok(
      result.nodeOrder.some(id => id.includes('bitonic-gather')),
      'bitonic graph contains final gather'
    );
  }
  t.end();
});

test('GPUSort radix stably sorts paired uint32 values in both directions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  let randomState = 0x1234abcd;
  const keys = Uint32Array.from({length: 513}, (_, index) => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return index % 17 === 0 ? 7 : randomState % 127;
  });
  const values = Uint32Array.from(keys, (_, index) => index);
  for (const direction of ['ascending', 'descending'] as const) {
    const result = await runSort(device, keys, values, 'radix', direction);
    const expected = getStableSortedPairs(keys, values, direction);
    t.deepEqual(result.keys, expected.keys, `${direction} radix keys match`);
    t.deepEqual(result.values, expected.values, `${direction} radix values remain stable`);
    t.equal(result.resolvedAlgorithm, 'radix', 'forced radix is reported');
    t.ok(result.logicalTransientCount > result.physicalTransientCount, 'radix scratch is reused');
  }
  t.end();
});

test('GPUSort handles empty and single-row inputs', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const empty = await runSort(device, new Uint32Array(0), new Uint32Array(0), 'auto', 'ascending');
  t.deepEqual(empty.keys, [], 'empty sort has no keys');
  t.deepEqual(empty.values, [], 'empty sort has no values');
  t.deepEqual(empty.nodeOrder, [], 'empty sort records no graph nodes');

  const single = await runSort(
    device,
    Uint32Array.from([42]),
    Uint32Array.from([99]),
    'auto',
    'descending'
  );
  t.deepEqual(single.keys, [42], 'single key is copied');
  t.deepEqual(single.values, [99], 'single value is copied');
  t.deepEqual(single.nodeOrder, ['sort-copy-pair'], 'single row uses one copy pass');
  t.end();
});

test('GPUBatchSort stably sorts each vector chunk without changing boundaries', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const keyChunks = [
    Uint32Array.from([3, 1, 3]),
    new Uint32Array(0),
    Uint32Array.from([9]),
    Uint32Array.from([2, 1, 2, 0])
  ];
  const valueChunks = [
    Uint32Array.from([10, 11, 12]),
    new Uint32Array(0),
    Uint32Array.from([20]),
    Uint32Array.from([30, 31, 32, 33])
  ];

  for (const direction of ['ascending', 'descending'] as const) {
    const result = await runBatchSort(device, keyChunks, valueChunks, 'auto', direction);
    const expected = keyChunks.map((keys, chunkIndex) =>
      getStableSortedPairs(keys, valueChunks[chunkIndex], direction)
    );
    t.deepEqual(
      result.keyChunks,
      expected.map(chunk => chunk.keys),
      `${direction} keys remain in their source chunks`
    );
    t.deepEqual(
      result.valueChunks,
      expected.map(chunk => chunk.values),
      `${direction} payloads remain stable within each chunk`
    );
    t.deepEqual(
      result.resolvedAlgorithms,
      ['bitonic', 'bitonic', 'bitonic', 'bitonic'],
      'auto selection is reported in chunk order'
    );
    t.ok(
      result.nodeOrder.some(id => id === 'batch-sort-chunk-2-copy-pair'),
      'single-row chunks retain the copy fast path'
    );
    t.notOk(
      result.nodeOrder.some(id => id.startsWith('batch-sort-chunk-1-')),
      'empty chunks add no graph nodes'
    );
  }
  t.end();
});

test('GPUBatchSort resolves algorithms per chunk and validates vector topology', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'batch-sort-validation'});
  const keys = makeGraphVector(graph, 'keys', [65_536, 65_537]);
  const values = makeGraphVector(graph, 'values', [65_536, 65_537]);
  const outputKeys = makeGraphVector(graph, 'output-keys', [65_536, 65_537]);
  const outputValues = makeGraphVector(graph, 'output-values', [65_536, 65_537]);
  const sort = new GPUBatchSort({keys, values, outputKeys, outputValues});
  t.deepEqual(
    sort.resolvedAlgorithms,
    ['bitonic', 'radix'],
    'auto chooses independently from each chunk length'
  );

  t.throws(
    () =>
      new GPUBatchSort({
        keys,
        values: makeGraphVector(graph, 'short-values', [65_536, 65_536]),
        outputKeys,
        outputValues
      }),
    /same chunk topology/,
    'aligned inputs must preserve every chunk length'
  );
  t.throws(
    () => new GPUBatchSort({keys, values, outputKeys: keys, outputValues}),
    /separate buffers/,
    'outputs cannot alias any input chunk'
  );
  const sharedOutputBuffer = graph.createTransientBuffer({
    id: 'shared-output-keys',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const makeSharedOutputKeys = (secondByteOffset: number) =>
    new GraphVectorView({
      id: `shared-output-keys-${secondByteOffset}`,
      name: 'shared output keys',
      format: 'uint32',
      length: 4,
      valueLength: 4,
      stride: 1,
      byteStride: 4,
      rowByteLength: 4,
      data: [
        graph.createDataView(sharedOutputBuffer, {format: 'uint32', length: 2}),
        graph.createDataView(sharedOutputBuffer, {
          format: 'uint32',
          length: 2,
          byteOffset: secondByteOffset
        })
      ]
    });
  const twoChunkKeys = makeGraphVector(graph, 'two-chunk-keys', [2, 2]);
  const twoChunkValues = makeGraphVector(graph, 'two-chunk-values', [2, 2]);
  const twoChunkOutputValues = makeGraphVector(graph, 'two-chunk-output-values', [2, 2]);
  t.throws(
    () =>
      new GPUBatchSort({
        keys: twoChunkKeys,
        values: twoChunkValues,
        outputKeys: makeSharedOutputKeys(4),
        outputValues: twoChunkOutputValues
      }),
    /output keys chunks must not overlap/,
    'writable chunks cannot overlap within one output vector'
  );
  t.doesNotThrow(
    () =>
      new GPUBatchSort({
        keys: twoChunkKeys,
        values: twoChunkValues,
        outputKeys: makeSharedOutputKeys(8),
        outputValues: twoChunkOutputValues
      }),
    'disjoint output chunks may share one logical buffer'
  );
  t.throws(
    () =>
      new GPUBatchSort({
        keys: makeGraphVector(graph, 'empty-keys', []),
        values: makeGraphVector(graph, 'empty-values', []),
        outputKeys: makeGraphVector(graph, 'empty-output-keys', []),
        outputValues: makeGraphVector(graph, 'empty-output-values', []),
        algorithm: 'merge' as never
      }),
    /algorithm must be/,
    'empty vector sorts still validate options'
  );
  t.end();
});

test('GPUSort auto selection switches above 65,536 rows', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  t.equal(makeUncompiledSort(device, 65_536).resolvedAlgorithm, 'bitonic', 'threshold is bitonic');
  t.equal(
    makeUncompiledSort(device, 65_537).resolvedAlgorithm,
    'radix',
    'above threshold is radix'
  );
  t.equal(
    makeUncompiledSort(device, 3, 'radix').resolvedAlgorithm,
    'radix',
    'explicit override wins'
  );
  t.end();
});

test('GPUSort validates layouts, lengths, graph ownership, and output buffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'sort-validation'});
  const keysHandle = graph.createTransientBuffer({
    id: 'keys',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const valuesHandle = graph.createTransientBuffer({
    id: 'values',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const outputKeysHandle = graph.createTransientBuffer({
    id: 'output-keys',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const outputValuesHandle = graph.createTransientBuffer({
    id: 'output-values',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const keys = graph.createDataView(keysHandle, {format: 'uint32', length: 4});
  const values = graph.createDataView(valuesHandle, {format: 'uint32', length: 4});
  const outputKeys = graph.createDataView(outputKeysHandle, {format: 'uint32', length: 4});
  const outputValues = graph.createDataView(outputValuesHandle, {format: 'uint32', length: 4});

  t.throws(
    () =>
      new GPUSort({
        keys,
        values: graph.createDataView(valuesHandle, {format: 'uint32', length: 3}),
        outputKeys,
        outputValues
      }),
    /lengths must match/,
    'length mismatch is rejected'
  );
  t.throws(
    () => new GPUSort({keys, values, outputKeys: keys, outputValues}),
    /separate buffers/,
    'input/output alias is rejected'
  );
  const unaligned = graph.createDataView(outputKeysHandle, {
    format: 'uint32',
    length: 1,
    byteOffset: 2
  });
  t.throws(
    () => new GPUSort({keys: unaligned, values, outputKeys, outputValues}),
    /uint32-aligned/,
    'unaligned keys are rejected'
  );

  const otherGraph = new GPUCommandGraph(device, {id: 'other-sort-graph'});
  const sort = new GPUSort({keys, values, outputKeys, outputValues});
  t.throws(() => sort.addToGraph(otherGraph), /target graph/, 'foreign graph is rejected');
  t.end();
});

type SortResult = {
  keys: number[];
  values: number[];
  resolvedAlgorithm: 'bitonic' | 'radix';
  nodeOrder: string[];
  logicalTransientCount: number;
  physicalTransientCount: number;
};

async function runSort(
  device: Device,
  keys: Uint32Array,
  values: Uint32Array,
  algorithm: GPUSortAlgorithm,
  direction: GPUSortDirection
): Promise<SortResult> {
  const byteLength = Math.max(keys.length, 1) * Uint32Array.BYTES_PER_ELEMENT;
  const keysBuffer = device.createBuffer({
    id: 'sort-keys',
    data: keys.length > 0 ? keys : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const valuesBuffer = device.createBuffer({
    id: 'sort-values',
    data: values.length > 0 ? values : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputKeysBuffer = device.createBuffer({
    id: 'sort-output-keys',
    byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const outputValuesBuffer = device.createBuffer({
    id: 'sort-output-values',
    byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'sort-test'});
  const keyView = importView(graph, 'keys', keysBuffer, keys.length);
  const valueView = importView(graph, 'values', valuesBuffer, values.length);
  const outputKeyView = importView(graph, 'output-keys', outputKeysBuffer, keys.length);
  const outputValueView = importView(graph, 'output-values', outputValuesBuffer, values.length);
  const sort = new GPUSort({
    id: 'sort',
    keys: keyView,
    values: valueView,
    outputKeys: outputKeyView,
    outputValues: outputValueView,
    algorithm,
    direction
  });
  sort.addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'sort-test-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const [keyBytes, valueBytes] = await Promise.all([
    outputKeysBuffer.readAsync(),
    outputValuesBuffer.readAsync()
  ]);
  const result: SortResult = {
    keys: Array.from(new Uint32Array(keyBytes.buffer, keyBytes.byteOffset, keys.length)),
    values: Array.from(new Uint32Array(valueBytes.buffer, valueBytes.byteOffset, values.length)),
    resolvedAlgorithm: sort.resolvedAlgorithm,
    nodeOrder: compiled.stats.nodeOrder,
    logicalTransientCount: compiled.stats.logicalTransientBufferCount,
    physicalTransientCount: compiled.stats.physicalTransientBufferCount
  };
  compiled.destroy();
  tAssertImportedBuffersAlive([keysBuffer, valuesBuffer, outputKeysBuffer, outputValuesBuffer]);
  keysBuffer.destroy();
  valuesBuffer.destroy();
  outputKeysBuffer.destroy();
  outputValuesBuffer.destroy();
  return result;
}

type BatchSortResult = {
  keyChunks: number[][];
  valueChunks: number[][];
  resolvedAlgorithms: readonly ('bitonic' | 'radix')[];
  nodeOrder: string[];
};

async function runBatchSort(
  device: Device,
  keyChunks: Uint32Array[],
  valueChunks: Uint32Array[],
  algorithm: GPUSortAlgorithm,
  direction: GPUSortDirection
): Promise<BatchSortResult> {
  const keys = makeGPUVector(device, 'batch-keys', keyChunks, false);
  const values = makeGPUVector(device, 'batch-values', valueChunks, false);
  const outputKeys = makeGPUVector(device, 'batch-output-keys', keyChunks, true);
  const outputValues = makeGPUVector(device, 'batch-output-values', valueChunks, true);
  const graph = new GPUCommandGraph(device, {id: 'batch-sort-test'});
  const sort = new GPUBatchSort({
    id: 'batch-sort',
    keys: graph.importGPUVector('keys', keys),
    values: graph.importGPUVector('values', values),
    outputKeys: graph.importGPUVector('output-keys', outputKeys),
    outputValues: graph.importGPUVector('output-values', outputValues),
    algorithm,
    direction
  });
  sort.addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'batch-sort-test-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const [sortedKeyChunks, sortedValueChunks] = await Promise.all([
    readGPUVector(outputKeys),
    readGPUVector(outputValues)
  ]);
  const result = {
    keyChunks: sortedKeyChunks,
    valueChunks: sortedValueChunks,
    resolvedAlgorithms: sort.resolvedAlgorithms,
    nodeOrder: compiled.stats.nodeOrder
  };
  compiled.destroy();
  for (const vector of [keys, values, outputKeys, outputValues]) vector.destroy();
  return result;
}

function makeGPUVector(
  device: Device,
  name: string,
  chunks: Uint32Array[],
  output: boolean
): GPUVector<'uint32'> {
  return new GPUVector({
    type: 'data',
    name,
    format: 'uint32',
    data: chunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: device.createBuffer({
            id: `${name}-${chunkIndex}`,
            ...(output
              ? {byteLength: Math.max(chunk.length, 1) * Uint32Array.BYTES_PER_ELEMENT}
              : {data: chunk.length > 0 ? chunk : new Uint32Array(1)}),
            usage: Buffer.STORAGE | (output ? Buffer.COPY_SRC : Buffer.COPY_DST)
          }),
          format: 'uint32',
          length: chunk.length,
          ownsBuffer: true
        })
    ),
    ownsData: true
  });
}

async function readGPUVector(vector: GPUVector<'uint32'>): Promise<number[][]> {
  return Promise.all(
    vector.data.map(async chunk => {
      if (chunk.length === 0) return [];
      const bytes = await chunk.buffer.readAsync(
        chunk.byteOffset,
        chunk.length * Uint32Array.BYTES_PER_ELEMENT
      );
      return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, chunk.length));
    })
  );
}

function makeGraphVector(
  graph: GPUCommandGraph,
  id: string,
  chunkLengths: number[]
): GraphVectorView<'uint32'> {
  const data = chunkLengths.map((length, chunkIndex) => {
    const buffer = graph.createTransientBuffer({
      id: `${id}-${chunkIndex}`,
      byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    return graph.createDataView(buffer, {format: 'uint32', length});
  });
  const length = chunkLengths.reduce((sum, chunkLength) => sum + chunkLength, 0);
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

function importView(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

function makeUncompiledSort(
  device: Device,
  length: number,
  algorithm: GPUSortAlgorithm = 'auto'
): GPUSort {
  const graph = new GPUCommandGraph(device, {id: `selection-${length}-${algorithm}`});
  const byteLength = Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT;
  const createView = (id: string) => {
    const handle = graph.createTransientBuffer({id, byteLength, usage: Buffer.STORAGE});
    return graph.createDataView(handle, {format: 'uint32', length});
  };
  return new GPUSort({
    keys: createView('keys'),
    values: createView('values'),
    outputKeys: createView('output-keys'),
    outputValues: createView('output-values'),
    algorithm
  });
}

function getStableSortedPairs(
  keys: Uint32Array,
  values: Uint32Array,
  direction: GPUSortDirection
): {keys: number[]; values: number[]} {
  const pairs = Array.from(keys, (key, index) => ({key, value: values[index], index}));
  pairs.sort((left, right) => {
    const keyOrder = direction === 'ascending' ? left.key - right.key : right.key - left.key;
    return keyOrder || left.index - right.index;
  });
  return {keys: pairs.map(pair => pair.key), values: pairs.map(pair => pair.value)};
}

function tAssertImportedBuffersAlive(buffers: Buffer[]): void {
  if (buffers.some(buffer => buffer.destroyed)) {
    throw new Error('GPUSort destroyed a caller-owned imported buffer');
  }
}
