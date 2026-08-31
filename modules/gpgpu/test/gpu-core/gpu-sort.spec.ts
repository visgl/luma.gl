// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUBatchSort,
  GPUCommandGraph,
  GraphVectorView,
  GPUSort,
  type GPUSortAlgorithm,
  type GPUSortDirection
} from '@luma.gl/gpgpu/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it, vi} from 'vitest';
import {addGPUSortToGraphWithDispatchLimit} from '../../src/gpu-core/gpu-sort';

it('GPUSort bitonic stably sorts paired uint32 values in both directions', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const keys = Uint32Array.from([9, 4, 6, 2, 4, 1, 7, 0xffffffff, 1]);
  const values = Uint32Array.from(keys, (_, index) => 100 + index);
  for (const direction of ['ascending', 'descending'] as const) {
    const result = await runSort(device, keys, values, 'bitonic', direction);
    const expected = getStableSortedPairs(keys, values, direction);
    expect(result.keys, `${direction} bitonic keys match`).toEqual(expected.keys);
    expect(result.values, `${direction} bitonic values remain stable`).toEqual(expected.values);
    expect(result.resolvedAlgorithm, 'forced bitonic is reported').toBe('bitonic');
    expect(
      result.nodeOrder,
      'one workgroup executes the complete stable bitonic network in a single pass'
    ).toEqual(['sort-bitonic-local']);
  }
});

it('GPUSort fuses irregular workgroup-local networks on CORE WebGPU devices', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
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

        expect(result.keys, `${length}-row ${direction} local keys match`).toEqual(expected.keys);
        expect(result.values, `${length}-row ${direction} local sort is stable`).toEqual(
          expected.values
        );
        expect(result.nodeOrder, 'one workgroup uses exactly one pass').toEqual([
          'sort-bitonic-local'
        ]);
        expect(
          Boolean(source.includes(`@workgroup_size(${paddedLength})`)),
          `${length}-row workgroups contain only their ${paddedLength} padded lanes`
        ).toBe(true);
        expect(
          Boolean(source.includes(`var<workgroup> cachedKeys: array<u32, ${paddedLength}>`)),
          'each source key is cached in workgroup storage'
        ).toBe(true);
        expect(
          (source.match(/keys\[KEYS_OFFSET \+ localInvocationIndex\]/g) ?? []).length,
          'the complete sorting network reads each source key from global storage only once'
        ).toBe(1);
      }
    }
  } finally {
    dispatchSpy.mockRestore();
  }
});

it('GPUSort radix stably sorts paired uint32 values in both directions', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
    expect(result.keys, `${direction} radix keys match`).toEqual(expected.keys);
    expect(result.values, `${direction} radix values remain stable`).toEqual(expected.values);
    expect(result.resolvedAlgorithm, 'forced radix is reported').toBe('radix');
    expect(
      Boolean(result.logicalTransientCount > result.physicalTransientCount),
      'radix scratch is reused'
    ).toBe(true);
  }
});

it('GPUSort four-bit radix preserves cross-workgroup stability on CORE WebGPU', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
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
    expect(result.keys, `${direction} four-bit radix keys match`).toEqual(expected.keys);
    expect(result.values, `${direction} equal keys retain global input order`).toEqual(
      expected.values
    );
    expect(result.resolvedAlgorithm, 'multi-workgroup inputs choose four-bit radix').toBe('radix');
    expect(result.nodeOrder.length, 'eight digits each require histogram, scan, and scatter').toBe(
      24
    );
  }
});

it('GPUSort radix scans digit histograms across multiple workgroups on CORE WebGPU', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
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

    expect(result.keys, `${direction} multi-workgroup histogram keys match`).toEqual(expected.keys);
    expect(
      result.values,
      `${direction} equal keys retain stable order across histogram scan carries`
    ).toEqual(expected.values);
    expect(
      Boolean(result.nodeOrder.includes('sort-radix-digit-0-scan-level-0-add-offsets')),
      'digit histograms larger than one scan workgroup propagate scanned block offsets'
    ).toBe(true);
    expect(result.nodeOrder.length, 'eight digits use five graph nodes each').toBe(40);
  }
});

it('GPUSort radix processes only the requested significant key bits', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const keys = Uint32Array.from([32_767, 12, 0, 4_096, 12, 255, 1]);
  const values = Uint32Array.from(keys, (_, index) => index);
  for (const keyBits of [15, 16]) {
    const result = await runSort(device, keys, values, 'radix', 'ascending', keyBits);
    const expected = getStableSortedPairs(keys, values, 'ascending');
    expect(result.keys, `${keyBits}-bit radix sorts every key`).toEqual(expected.keys);
    expect(result.values, `${keyBits}-bit radix remains stable`).toEqual(expected.values);
    expect(
      result.nodeOrder.filter(identifier => identifier.endsWith('-histogram')).length,
      `${keyBits}-bit radix emits only the required four-bit histogram passes`
    ).toBe(Math.ceil(keyBits / 4));
    expect(
      Boolean(result.nodeOrder.includes('sort-radix-final-copy')),
      'final digits write directly'
    ).toBe(false);
  }
});

it('GPUSort radix ignores insignificant bits and stably handles partial final digits', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
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
      expect(
        result.keys,
        `${keyBits}-bit ${direction} radix ignores insignificant high bits`
      ).toEqual(expected.map(pair => pair.key));
      expect(
        result.values,
        `${keyBits}-bit ${direction} radix preserves equal-significant-key order`
      ).toEqual(expected.map(pair => pair.value));
      expect(
        result.nodeOrder.filter(identifier => identifier.endsWith('-histogram')).length,
        'only significant four-bit digits contribute graph work'
      ).toBe(Math.ceil(keyBits / 4));
    }
  }
});

it('GPUSort bounds bitonic and radix stages across all three dispatch dimensions', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
      expect(result.keys, `${algorithm} sorts every multidimensional key`).toEqual(expected.keys);
      expect(
        result.values,
        `${algorithm} preserves duplicate-key payload order across workgroups`
      ).toEqual(expected.values);

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
        expect(
          dispatches.find(dispatch => dispatch.id === identifier)?.dimensions,
          `${identifier} respects the synthetic per-dimension dispatch limit`
        ).toEqual(expectedDimensions);
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
    expect(result.keys, 'odd-width multidimensional radix keys match').toEqual(expected.keys);
    expect(result.values, 'odd-width multidimensional radix remains stable').toEqual(
      expected.values
    );

    const finalScatterDispatchIndex = dispatchSpy.mock.instances.findIndex(
      computation => (computation as Computation).id === 'sort-radix-digit-12-scatter'
    );
    expect(
      dispatchSpy.mock.calls[finalScatterDispatchIndex]?.slice(1),
      'partial final radix digits respect the synthetic per-dimension dispatch limit'
    ).toEqual([2, 2, 2]);
  } finally {
    dispatchSpy.mockRestore();
  }
});

it('GPUSort honors offset storage views for local bitonic and multi-workgroup radix', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
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
      expect(
        words.slice(0, output.paddingLength),
        `${algorithm} preserves ${label} prefix padding`
      ).toEqual(Array.from({length: output.paddingLength}, () => paddingValue));
      expect(
        words.slice(output.paddingLength, output.paddingLength + length),
        `${algorithm} sorts ${label} through its offset view`
      ).toEqual(expectedValues);
      expect(words.at(-1), `${algorithm} preserves ${label} suffix padding`).toBe(paddingValue);
    }

    compiled.destroy();
    for (const {buffer} of [inputKeys, inputValues, outputKeys, outputValues]) {
      buffer.destroy();
    }
  }
});

it('GPUSort handles empty and single-row inputs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const empty = await runSort(device, new Uint32Array(0), new Uint32Array(0), 'auto', 'ascending');
  expect(empty.keys, 'empty sort has no keys').toEqual([]);
  expect(empty.values, 'empty sort has no values').toEqual([]);
  expect(empty.nodeOrder, 'empty sort records no graph nodes').toEqual([]);

  const single = await runSort(
    device,
    Uint32Array.from([42]),
    Uint32Array.from([99]),
    'auto',
    'descending'
  );
  expect(single.keys, 'single key is copied').toEqual([42]);
  expect(single.values, 'single value is copied').toEqual([99]);
  expect(single.nodeOrder, 'single row uses one copy pass').toEqual(['sort-copy-pair']);
});

it('GPUBatchSort stably sorts each vector chunk without changing boundaries', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
    expect(result.keyChunks, `${direction} keys remain in their source chunks`).toEqual(
      expected.map(chunk => chunk.keys)
    );
    expect(result.valueChunks, `${direction} payloads remain stable within each chunk`).toEqual(
      expected.map(chunk => chunk.values)
    );
    expect(result.resolvedAlgorithms, 'auto selection is reported in chunk order').toEqual([
      'bitonic',
      'bitonic',
      'bitonic',
      'bitonic'
    ]);
    expect(
      Boolean(result.nodeOrder.some(id => id === 'batch-sort-chunk-2-copy-pair')),
      'single-row chunks retain the copy fast path'
    ).toBe(true);
    expect(
      Boolean(result.nodeOrder.some(id => id.startsWith('batch-sort-chunk-1-'))),
      'empty chunks add no graph nodes'
    ).toBe(false);
  }
});

it('GPUBatchSort resolves algorithms per chunk and validates vector topology', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'batch-sort-validation'});
  const keys = makeGraphVector(graph, 'keys', [256, 257]);
  const values = makeGraphVector(graph, 'values', [256, 257]);
  const outputKeys = makeGraphVector(graph, 'output-keys', [256, 257]);
  const outputValues = makeGraphVector(graph, 'output-values', [256, 257]);
  const sort = new GPUBatchSort({keys, values, outputKeys, outputValues});
  expect(sort.resolvedAlgorithms, 'auto chooses independently from each chunk length').toEqual([
    'bitonic',
    'radix'
  ]);

  expect(
    () =>
      new GPUBatchSort({
        keys,
        values: makeGraphVector(graph, 'short-values', [256, 256]),
        outputKeys,
        outputValues
      }),
    'aligned inputs must preserve every chunk length'
  ).toThrow(/same chunk topology/);
  expect(
    () => new GPUBatchSort({keys, values, outputKeys: keys, outputValues}),
    'outputs cannot alias any input chunk'
  ).toThrow(/separate buffers/);
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
  expect(
    () =>
      new GPUBatchSort({
        keys: twoChunkKeys,
        values: twoChunkValues,
        outputKeys: makeSharedOutputKeys(4),
        outputValues: twoChunkOutputValues
      }),
    'writable chunks cannot overlap within one output vector'
  ).toThrow(/output keys chunks must not overlap/);
  expect(
    () =>
      new GPUBatchSort({
        keys: twoChunkKeys,
        values: twoChunkValues,
        outputKeys: makeSharedOutputKeys(8),
        outputValues: twoChunkOutputValues
      }),
    'disjoint output chunks may share one logical buffer'
  ).not.toThrow();
  expect(
    () =>
      new GPUBatchSort({
        keys: makeGraphVector(graph, 'empty-keys', []),
        values: makeGraphVector(graph, 'empty-values', []),
        outputKeys: makeGraphVector(graph, 'empty-output-keys', []),
        outputValues: makeGraphVector(graph, 'empty-output-values', []),
        algorithm: 'merge' as never
      }),
    'empty vector sorts still validate options'
  ).toThrow(/algorithm must be/);
});

it('GPUSort auto selection switches beyond one 256-row workgroup', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  expect(makeUncompiledSort(device, 256).resolvedAlgorithm, 'one workgroup is bitonic').toBe(
    'bitonic'
  );
  expect(makeUncompiledSort(device, 257).resolvedAlgorithm, 'above threshold is radix').toBe(
    'radix'
  );
  expect(makeUncompiledSort(device, 3, 'radix').resolvedAlgorithm, 'explicit override wins').toBe(
    'radix'
  );
});

it('GPUSort validates layouts, lengths, graph ownership, and output buffers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(
    () =>
      new GPUSort({
        keys,
        values: graph.createDataView(valuesHandle, {format: 'uint32', length: 3}),
        outputKeys,
        outputValues
      }),
    'length mismatch is rejected'
  ).toThrow(/lengths must match/);
  expect(
    () => new GPUSort({keys, values, outputKeys: keys, outputValues}),
    'input/output alias is rejected'
  ).toThrow(/separate buffers/);
  for (const keyBits of [0, 33, 1.5, Number.NaN]) {
    expect(
      () => new GPUSort({keys, values, outputKeys, outputValues, keyBits}),
      `invalid key width ${keyBits} is rejected`
    ).toThrow(/keyBits must be an integer from 1 to 32/);
  }
  const unaligned = graph.createDataView(outputKeysHandle, {
    format: 'uint32',
    length: 1,
    byteOffset: 2
  });
  expect(
    () => new GPUSort({keys: unaligned, values, outputKeys, outputValues}),
    'unaligned keys are rejected'
  ).toThrow(/uint32-aligned/);

  const otherGraph = new GPUCommandGraph(device, {id: 'other-sort-graph'});
  const sort = new GPUSort({keys, values, outputKeys, outputValues});
  expect(() => sort.addToGraph(otherGraph), 'foreign graph is rejected').toThrow(/target graph/);
});

it('GPUSort rejects borrowed physical-buffer aliases before encoding either algorithm', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

    expect(
      () => compiled.encode(rejectedEncoder, {parameters: undefined}),
      `${algorithm} rejects distinct borrowed wrappers resolving to one physical GPUBuffer`
    ).toThrow(/keys.*output-keys.*same physical buffer/i);
    rejectedEncoder.destroy();
    expect(
      await readUint32SortBuffer(keysBuffer, 4),
      `${algorithm} leaves caller-owned input unchanged`
    ).toEqual([4, 1, 3, 2]);

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
    expect(sortedKeys, `${algorithm} accepts a later distinct output override`).toEqual([
      1, 2, 3, 4
    ]);
    expect(sortedValues, `${algorithm} preserves paired payload values`).toEqual([10, 20, 30, 40]);

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
    expect(
      await readUint32SortBuffer(keysBuffer, 4),
      `${algorithm} borrowed-wrapper destruction leaves the physical GPUBuffer intact`
    ).toEqual([4, 1, 3, 2]);
    for (const buffer of [keysBuffer, valuesBuffer, outputKeysBuffer, outputValuesBuffer]) {
      buffer.destroy();
    }
  }
});

it('GPUBatchSort rejects physically aliased output overrides before encoding', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(
    () =>
      compiled.encode(rejectedEncoder, {
        parameters: undefined,
        buffers: {'batch-output-keys': keysBuffer}
      }),
    'rejects an encoding-time output override that aliases an active input chunk'
  ).toThrow(/batch-keys.*batch-output-keys.*same physical buffer/i);
  rejectedEncoder.destroy();
  expect(
    await readUint32SortBuffer(keysBuffer, 3),
    'rejected batch encoding leaves its caller-owned input chunk unchanged'
  ).toEqual([3, 1, 2]);

  const validEncoder = device.createCommandEncoder({id: 'batch-sort-valid-encoding'});
  compiled.encode(validEncoder, {parameters: undefined});
  device.submit(validEncoder.finish());
  const [sortedKeys, sortedValues] = await Promise.all([
    readUint32SortBuffer(outputKeysBuffer, 3),
    readUint32SortBuffer(outputValuesBuffer, 3)
  ]);
  expect(sortedKeys, 'batch graph accepts its original distinct output buffer').toEqual([1, 2, 3]);
  expect(sortedValues, 'batch retry preserves paired chunk payload values').toEqual([10, 20, 30]);

  compiled.destroy();
  const importedBuffers = [keysBuffer, valuesBuffer, outputKeysBuffer, outputValuesBuffer];
  tAssertImportedBuffersAlive(importedBuffers);
  for (const buffer of importedBuffers) buffer.destroy();
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
