// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUSort,
  type GPUSortAlgorithm,
  type GPUSortDirection
} from '@luma.gl/experimental';
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
  const keys = graph.createBufferView(keysHandle, {format: 'uint32', length: 4});
  const values = graph.createBufferView(valuesHandle, {format: 'uint32', length: 4});
  const outputKeys = graph.createBufferView(outputKeysHandle, {format: 'uint32', length: 4});
  const outputValues = graph.createBufferView(outputValuesHandle, {format: 'uint32', length: 4});

  t.throws(
    () =>
      new GPUSort({
        keys,
        values: graph.createBufferView(valuesHandle, {format: 'uint32', length: 3}),
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
  const unaligned = graph.createBufferView(outputKeysHandle, {
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

function importView(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createBufferView(handle, {format: 'uint32', length});
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
    return graph.createBufferView(handle, {format: 'uint32', length});
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
