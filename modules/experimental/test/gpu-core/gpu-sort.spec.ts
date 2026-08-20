// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
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
import {vi} from 'vitest';
import {addGPUSortToGraphWithDispatchLimit} from '../../src/gpu-core/gpu-sort';

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
    t.deepEqual(
      result.nodeOrder,
      ['sort-bitonic-local'],
      'one workgroup executes the complete stable bitonic network in a single pass'
    );
  }
  t.end();
});

test('GPUSort fuses irregular workgroup-local networks on CORE WebGPU devices', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const dispatchSpy = vi.spyOn(Computation.prototype, 'dispatch');
  try {
    for (const length of [2, 3, 4, 5, 9, 17, 33, 65, 255, 256]) {
      const keys = Uint32Array.from({length}, (_, index) =>
        index % 13 === 0 ? 0xffffffff : (length - index) % 17
      );
      const values = Uint32Array.from({length}, (_, index) => 700 + index);
      for (const direction of ['ascending', 'descending'] as const) {
        const result = await runSort(device, keys, values, 'auto', direction);
        const expected = getStableSortedPairs(keys, values, direction);
        const paddedLength = 2 ** Math.ceil(Math.log2(length));
        const source = dispatchSpy.mock.instances.at(-1)?.source ?? '';

        t.deepEqual(result.keys, expected.keys, `${length}-row ${direction} local keys match`);
        t.deepEqual(
          result.values,
          expected.values,
          `${length}-row ${direction} local sort is stable`
        );
        t.deepEqual(
          result.nodeOrder,
          ['sort-bitonic-local'],
          'one workgroup uses exactly one pass'
        );
        t.ok(
          source.includes(`@workgroup_size(${paddedLength})`),
          `${length}-row workgroups contain only their ${paddedLength} padded lanes`
        );
        t.ok(
          source.includes(`var<workgroup> cachedKeys: array<u32, ${paddedLength}>`),
          'each source key is cached in workgroup storage'
        );
        t.equal(
          (source.match(/keys\[KEYS_OFFSET \+ localInvocationIndex\]/g) ?? []).length,
          1,
          'the complete sorting network reads each source key from global storage only once'
        );
      }
    }
  } finally {
    dispatchSpy.mockRestore();
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

test('GPUSort four-bit radix preserves cross-workgroup stability on CORE WebGPU', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const keys = Uint32Array.from({length: 769}, (_, index) => {
    if (index % 31 === 0) return 0xffffffff;
    if (index % 7 === 0) return 0;
    return Math.imul(index % 19, 0x1010101) >>> 0;
  });
  const values = Uint32Array.from({length: keys.length}, (_, index) => index);
  for (const direction of ['ascending', 'descending'] as const) {
    const result = await runSort(device, keys, values, 'auto', direction);
    const expected = getStableSortedPairs(keys, values, direction);
    t.deepEqual(result.keys, expected.keys, `${direction} four-bit radix keys match`);
    t.deepEqual(
      result.values,
      expected.values,
      `${direction} equal keys retain global input order`
    );
    t.equal(result.resolvedAlgorithm, 'radix', 'multi-workgroup inputs choose four-bit radix');
    t.equal(result.nodeOrder.length, 24, 'eight digits each require histogram, scan, and scatter');
  }

  t.end();
});

test('GPUSort radix scans digit histograms across multiple workgroups on CORE WebGPU', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const keys = Uint32Array.from({length: 8_193}, (_, index) => {
    if (index % 37 === 0) return 0xffffffff;
    if (index % 11 === 0) return 0;
    return (Math.imul(index, 2_654_435_761) >>> 0) & 0xffff;
  });
  const values = Uint32Array.from({length: keys.length}, (_, index) => index);
  for (const direction of ['ascending', 'descending'] as const) {
    const result = await runSort(device, keys, values, 'auto', direction);
    const expected = getStableSortedPairs(keys, values, direction);

    t.deepEqual(result.keys, expected.keys, `${direction} multi-workgroup histogram keys match`);
    t.deepEqual(
      result.values,
      expected.values,
      `${direction} equal keys retain stable order across histogram scan carries`
    );
    t.ok(
      result.nodeOrder.includes('sort-radix-digit-0-scan-level-0-add-offsets'),
      'digit histograms larger than one scan workgroup propagate scanned block offsets'
    );
    t.equal(result.nodeOrder.length, 40, 'eight digits use five graph nodes each');
  }

  t.end();
});

test('GPUSort radix processes only the requested significant key bits', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const keys = Uint32Array.from([32_767, 12, 0, 4_096, 12, 255, 1]);
  const values = Uint32Array.from(keys, (_, index) => index);
  for (const keyBits of [15, 16]) {
    const result = await runSort(device, keys, values, 'radix', 'ascending', keyBits);
    const expected = getStableSortedPairs(keys, values, 'ascending');
    t.deepEqual(result.keys, expected.keys, `${keyBits}-bit radix sorts every key`);
    t.deepEqual(result.values, expected.values, `${keyBits}-bit radix remains stable`);
    t.equal(
      result.nodeOrder.filter(identifier => identifier.endsWith('-histogram')).length,
      Math.ceil(keyBits / 4),
      `${keyBits}-bit radix emits only the required four-bit histogram passes`
    );
    t.notOk(result.nodeOrder.includes('sort-radix-final-copy'), 'final digits write directly');
  }

  t.end();
});

test('GPUSort radix ignores insignificant bits and stably handles partial final digits', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const keys = Uint32Array.from([
    0xfffffff0, 1, 0xfffffff1, 0, 7, 0x80000007, 0xffffffff, 15, 0x1000000f
  ]);
  const values = Uint32Array.from(keys, (_, index) => 200 + index);
  for (const keyBits of [1, 3, 5, 15, 31]) {
    const keyMask = 2 ** keyBits - 1;
    for (const direction of ['ascending', 'descending'] as const) {
      const result = await runSort(device, keys, values, 'radix', direction, keyBits);
      const expected = Array.from(keys, (key, index) => ({key, value: values[index], index})).sort(
        (left, right) => {
          const leftSignificantKey = left.key & keyMask;
          const rightSignificantKey = right.key & keyMask;
          const comparison =
            direction === 'ascending'
              ? leftSignificantKey - rightSignificantKey
              : rightSignificantKey - leftSignificantKey;
          return comparison || left.index - right.index;
        }
      );
      t.deepEqual(
        result.keys,
        expected.map(pair => pair.key),
        `${keyBits}-bit ${direction} radix ignores insignificant high bits`
      );
      t.deepEqual(
        result.values,
        expected.map(pair => pair.value),
        `${keyBits}-bit ${direction} radix preserves equal-significant-key order`
      );
      t.equal(
        result.nodeOrder.filter(identifier => identifier.endsWith('-histogram')).length,
        Math.ceil(keyBits / 4),
        'only significant four-bit digits contribute graph work'
      );
    }
  }

  t.end();
});

test('GPUSort bounds bitonic and radix stages across all three dispatch dimensions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const rowCount = 1_025;
  const keys = Uint32Array.from({length: rowCount}, (_, index) =>
    index % 23 === 0 ? 7 : (Math.imul(index, 1_664_525) + 1_013_904_223) >>> 0
  );
  const values = Uint32Array.from({length: rowCount}, (_, index) => 2_000 + index);

  for (const [algorithm, direction] of [
    ['bitonic', 'ascending'],
    ['radix', 'descending']
  ] as const) {
    const dispatchSpy = vi.spyOn(Computation.prototype, 'dispatch');

    try {
      const result = await runSort(device, keys, values, algorithm, direction, undefined, 2);
      const expected = getStableSortedPairs(keys, values, direction);
      t.deepEqual(result.keys, expected.keys, `${algorithm} sorts every multidimensional key`);
      t.deepEqual(
        result.values,
        expected.values,
        `${algorithm} preserves duplicate-key payload order across workgroups`
      );

      const dispatches = dispatchSpy.mock.instances.map((computation, index) => ({
        id: (computation as Computation).id,
        dimensions: dispatchSpy.mock.calls[index].slice(1)
      }));
      const expectedPasses =
        algorithm === 'bitonic'
          ? [
              ['sort-bitonic-initialize', [2, 2, 2]],
              ['sort-bitonic-2048-1', [2, 2, 2]],
              ['sort-bitonic-gather', [2, 2, 2]]
            ]
          : [
              ['sort-radix-digit-0-histogram', [2, 2, 2]],
              ['sort-radix-digit-0-scan-level-0-scan', [1, 1, 1]],
              ['sort-radix-digit-0-scatter', [2, 2, 2]],
              ['sort-radix-digit-28-histogram', [2, 2, 2]],
              ['sort-radix-digit-28-scatter', [2, 2, 2]]
            ];

      for (const [identifier, expectedDimensions] of expectedPasses) {
        t.deepEqual(
          dispatches.find(dispatch => dispatch.id === identifier)?.dimensions,
          expectedDimensions,
          `${identifier} respects the synthetic per-dimension dispatch limit`
        );
      }
    } finally {
      dispatchSpy.mockRestore();
    }
  }

  const limitedKeys = Uint32Array.from(keys, key => key & 0x7fff);
  const dispatchSpy = vi.spyOn(Computation.prototype, 'dispatch');
  try {
    const result = await runSort(device, limitedKeys, values, 'radix', 'ascending', 15, 2);
    const expected = getStableSortedPairs(limitedKeys, values, 'ascending');
    t.deepEqual(result.keys, expected.keys, 'odd-width multidimensional radix keys match');
    t.deepEqual(result.values, expected.values, 'odd-width multidimensional radix remains stable');

    const finalScatterDispatchIndex = dispatchSpy.mock.instances.findIndex(
      computation => (computation as Computation).id === 'sort-radix-digit-12-scatter'
    );
    t.deepEqual(
      dispatchSpy.mock.calls[finalScatterDispatchIndex]?.slice(1),
      [2, 2, 2],
      'partial final radix digits respect the synthetic per-dimension dispatch limit'
    );
  } finally {
    dispatchSpy.mockRestore();
  }

  t.end();
});

test('GPUSort honors offset storage views for local bitonic and multi-workgroup radix', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const paddingValue = 0xdecafbad;
  for (const [algorithm, length] of [
    ['bitonic', 33],
    ['radix', 513]
  ] as const) {
    const keys = Uint32Array.from({length}, (_, index) => (Math.imul(index, 97) % 29) >>> 0);
    const values = Uint32Array.from({length}, (_, index) => 3_000 + index);
    const graph = new GPUCommandGraph(device, {id: `offset-${algorithm}-graph`});
    const createPaddedView = (id: string, data: Uint32Array, paddingLength: number) => {
      const paddedData = new Uint32Array(paddingLength + length + 1).fill(paddingValue);
      paddedData.set(data, paddingLength);
      const buffer = device.createBuffer({
        id: `offset-${algorithm}-${id}`,
        data: paddedData,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      const handle = graph.importBuffer(
        {id, byteLength: buffer.byteLength, usage: buffer.usage},
        buffer
      );
      return {
        buffer,
        paddingLength,
        view: graph.createDataView(handle, {
          format: 'uint32',
          length,
          byteOffset: paddingLength * Uint32Array.BYTES_PER_ELEMENT
        })
      };
    };
    const inputKeys = createPaddedView('keys', keys, 1);
    const inputValues = createPaddedView('values', values, 2);
    const outputKeys = createPaddedView('output-keys', new Uint32Array(length), 3);
    const outputValues = createPaddedView('output-values', new Uint32Array(length), 4);
    new GPUSort({
      id: `offset-${algorithm}`,
      keys: inputKeys.view,
      values: inputValues.view,
      outputKeys: outputKeys.view,
      outputValues: outputValues.view,
      algorithm,
      direction: 'descending'
    }).addToGraph(graph);

    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: `offset-${algorithm}-encoder`});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());

    const expected = getStableSortedPairs(keys, values, 'descending');
    for (const [output, expectedValues, label] of [
      [outputKeys, expected.keys, 'keys'],
      [outputValues, expected.values, 'values']
    ] as const) {
      const bytes = await output.buffer.readAsync();
      const words = Array.from(
        new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
      );
      t.deepEqual(
        words.slice(0, output.paddingLength),
        Array.from({length: output.paddingLength}, () => paddingValue),
        `${algorithm} preserves ${label} prefix padding`
      );
      t.deepEqual(
        words.slice(output.paddingLength, output.paddingLength + length),
        expectedValues,
        `${algorithm} sorts ${label} through its offset view`
      );
      t.equal(words.at(-1), paddingValue, `${algorithm} preserves ${label} suffix padding`);
    }

    compiled.destroy();
    for (const {buffer} of [inputKeys, inputValues, outputKeys, outputValues]) {
      buffer.destroy();
    }
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
  const keys = makeGraphVector(graph, 'keys', [256, 257]);
  const values = makeGraphVector(graph, 'values', [256, 257]);
  const outputKeys = makeGraphVector(graph, 'output-keys', [256, 257]);
  const outputValues = makeGraphVector(graph, 'output-values', [256, 257]);
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
        values: makeGraphVector(graph, 'short-values', [256, 256]),
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

test('GPUSort auto selection switches beyond one 256-row workgroup', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  t.equal(makeUncompiledSort(device, 256).resolvedAlgorithm, 'bitonic', 'one workgroup is bitonic');
  t.equal(makeUncompiledSort(device, 257).resolvedAlgorithm, 'radix', 'above threshold is radix');
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
  for (const keyBits of [0, 33, 1.5, Number.NaN]) {
    t.throws(
      () => new GPUSort({keys, values, outputKeys, outputValues, keyBits}),
      /keyBits must be an integer from 1 to 32/,
      `invalid key width ${keyBits} is rejected`
    );
  }
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

test('GPUSort rejects borrowed physical-buffer aliases before encoding either algorithm', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  for (const algorithm of ['bitonic', 'radix'] as const) {
    const keysBuffer = makeReadableSortBuffer(device, `${algorithm}-keys`, [4, 1, 3, 2]);
    const borrowedKeysBuffer = device.createBuffer({
      id: `${algorithm}-borrowed-keys`,
      handle: keysBuffer.handle,
      byteLength: keysBuffer.byteLength,
      usage: keysBuffer.usage,
      _isHandleBorrowed: true
    });
    const valuesBuffer = makeReadableSortBuffer(device, `${algorithm}-values`, [40, 10, 30, 20]);
    const outputKeysBuffer = makeReadableSortBuffer(device, `${algorithm}-output-keys`, 4);
    const outputValuesBuffer = makeReadableSortBuffer(device, `${algorithm}-output-values`, 4);
    const graph = new GPUCommandGraph(device, {id: `${algorithm}-physical-alias`});
    const sort = new GPUSort({
      id: `${algorithm}-physical-alias-sort`,
      keys: importView(graph, 'keys', keysBuffer, 4),
      values: importView(graph, 'values', valuesBuffer, 4),
      outputKeys: importView(graph, 'output-keys', borrowedKeysBuffer, 4),
      outputValues: importView(graph, 'output-values', outputValuesBuffer, 4),
      algorithm
    });
    sort.addToGraph(graph);
    const compiled = graph.compile();
    const rejectedEncoder = device.createCommandEncoder({id: `${algorithm}-rejected-alias`});

    t.throws(
      () => compiled.encode(rejectedEncoder, {parameters: undefined}),
      /keys.*output-keys.*same physical buffer/i,
      `${algorithm} rejects distinct borrowed wrappers resolving to one physical GPUBuffer`
    );
    rejectedEncoder.destroy();
    t.deepEqual(
      await readUint32SortBuffer(keysBuffer, 4),
      [4, 1, 3, 2],
      `${algorithm} leaves caller-owned input unchanged`
    );

    const validEncoder = device.createCommandEncoder({id: `${algorithm}-valid-sort`});
    compiled.encode(validEncoder, {
      parameters: undefined,
      buffers: {'output-keys': outputKeysBuffer}
    });
    device.submit(validEncoder.finish());
    const [sortedKeys, sortedValues] = await Promise.all([
      readUint32SortBuffer(outputKeysBuffer, 4),
      readUint32SortBuffer(outputValuesBuffer, 4)
    ]);
    t.deepEqual(sortedKeys, [1, 2, 3, 4], `${algorithm} accepts a later distinct output override`);
    t.deepEqual(sortedValues, [10, 20, 30, 40], `${algorithm} preserves paired payload values`);

    compiled.destroy();
    const importedBuffers = [
      keysBuffer,
      borrowedKeysBuffer,
      valuesBuffer,
      outputKeysBuffer,
      outputValuesBuffer
    ];
    tAssertImportedBuffersAlive(importedBuffers);
    borrowedKeysBuffer.destroy();
    t.deepEqual(
      await readUint32SortBuffer(keysBuffer, 4),
      [4, 1, 3, 2],
      `${algorithm} borrowed-wrapper destruction leaves the physical GPUBuffer intact`
    );
    for (const buffer of [keysBuffer, valuesBuffer, outputKeysBuffer, outputValuesBuffer]) {
      buffer.destroy();
    }
  }

  t.end();
});

test('GPUBatchSort rejects physically aliased output overrides before encoding', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const keysBuffer = makeReadableSortBuffer(device, 'batch-alias-keys', [3, 1, 2]);
  const valuesBuffer = makeReadableSortBuffer(device, 'batch-alias-values', [30, 10, 20]);
  const outputKeysBuffer = makeReadableSortBuffer(device, 'batch-alias-output-keys', 3);
  const outputValuesBuffer = makeReadableSortBuffer(device, 'batch-alias-output-values', 3);
  const graph = new GPUCommandGraph(device, {id: 'batch-sort-physical-alias'});
  const sort = new GPUBatchSort({
    id: 'batch-sort-physical-alias-sort',
    keys: makeImportedGraphVector(graph, 'batch-keys', keysBuffer, 3),
    values: makeImportedGraphVector(graph, 'batch-values', valuesBuffer, 3),
    outputKeys: makeImportedGraphVector(graph, 'batch-output-keys', outputKeysBuffer, 3),
    outputValues: makeImportedGraphVector(graph, 'batch-output-values', outputValuesBuffer, 3)
  });
  sort.addToGraph(graph);
  const compiled = graph.compile();
  const rejectedEncoder = device.createCommandEncoder({id: 'batch-sort-rejected-alias'});

  t.throws(
    () =>
      compiled.encode(rejectedEncoder, {
        parameters: undefined,
        buffers: {'batch-output-keys': keysBuffer}
      }),
    /batch-keys.*batch-output-keys.*same physical buffer/i,
    'rejects an encoding-time output override that aliases an active input chunk'
  );
  rejectedEncoder.destroy();
  t.deepEqual(
    await readUint32SortBuffer(keysBuffer, 3),
    [3, 1, 2],
    'rejected batch encoding leaves its caller-owned input chunk unchanged'
  );

  const validEncoder = device.createCommandEncoder({id: 'batch-sort-valid-encoding'});
  compiled.encode(validEncoder, {parameters: undefined});
  device.submit(validEncoder.finish());
  const [sortedKeys, sortedValues] = await Promise.all([
    readUint32SortBuffer(outputKeysBuffer, 3),
    readUint32SortBuffer(outputValuesBuffer, 3)
  ]);
  t.deepEqual(sortedKeys, [1, 2, 3], 'batch graph accepts its original distinct output buffer');
  t.deepEqual(sortedValues, [10, 20, 30], 'batch retry preserves paired chunk payload values');

  compiled.destroy();
  const importedBuffers = [keysBuffer, valuesBuffer, outputKeysBuffer, outputValuesBuffer];
  tAssertImportedBuffersAlive(importedBuffers);
  for (const buffer of importedBuffers) buffer.destroy();
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
  direction: GPUSortDirection,
  keyBits?: number,
  maxComputeWorkgroupsPerDimension?: number
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
    direction,
    keyBits
  });
  if (maxComputeWorkgroupsPerDimension === undefined) {
    sort.addToGraph(graph);
  } else {
    addGPUSortToGraphWithDispatchLimit(sort, graph, maxComputeWorkgroupsPerDimension);
  }
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

function makeImportedGraphVector(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  length: number
): GraphVectorView<'uint32'> {
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data: [importView(graph, id, buffer, length)]
  });
}

function importView(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

function makeReadableSortBuffer(
  device: Device,
  id: string,
  valuesOrLength: number[] | number
): Buffer {
  return device.createBuffer({
    id,
    ...(typeof valuesOrLength === 'number'
      ? {byteLength: valuesOrLength * Uint32Array.BYTES_PER_ELEMENT}
      : {data: Uint32Array.from(valuesOrLength)}),
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
}

async function readUint32SortBuffer(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
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
