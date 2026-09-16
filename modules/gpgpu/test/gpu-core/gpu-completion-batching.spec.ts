// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUSort,
  GPUGridIndex,
  GPUGridIndexQuery,
  GPUCOOToCSR,
  GPURunLengthEncode,
  GPUSegmentedSort,
  GPUHierarchyLayout,
  GPUAncestorProjection,
  GPUGallopingSearch
} from '@luma.gl/gpgpu/gpu-core';
import {GPUAdaptiveSpMV} from '../../src/gpu-core/gpu-adaptive-spmv';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUProgram,
  GPUProgramCSRMatrix,
  GPUProgramCompiler,
  GPUProgramSpMV,
  GPUProgramScalarLiteral,
  GPUConditionalOperation
} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

for (const strategy of ['scalar-row', 'subgroup-row', 'workgroup-row', 'long-row'] as const) {
  test(`chunked CSR preserves ${strategy} across independently split rows, nonzeros, and vector`, async () => {
    const device = await getWebGPUTestDevice(strategy === 'subgroup-row' ? 'max' : 'core');
    if (
      !device ||
      (strategy === 'subgroup-row' &&
        (!device.features.has('subgroups') || !device.wgslLanguageFeatures.has('subgroup_id')))
    )
      return;
    const fixture = new BatchConformanceFixture(device);
    const rowOffsets = fixture.column('rows', 'uint32', [0, 0, 3, 4, 7], [1, 0, 2, 2]);
    const columnIndices = fixture.column('columns', 'uint32', [4, 0, 2, 1, 3, 0, 99], [2, 0, 5]);
    const values = fixture.column('values', 'float32', [1, 2, 3, 4, 5, 6, 7], [1, 3, 3]);
    const vector = fixture.column('vector', 'float32', [10, 20, 30, 40, 50], [0, 2, 1, 2, 0]);
    const output = fixture.column('output', 'float32', [77, 77, 77, 77], [2, 0, 2]);
    fixture.graph.add(
      new GPUAdaptiveSpMV({rowOffsets, columnIndices, values, vector, output, columns: 5, strategy})
    );
    const executable = fixture.graph.compile();
    try {
      for (let iteration = 0; iteration < 2; iteration++) {
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect(await fixture.read(output)).toEqual([0, 160, 80, 260]);
      }
      expect(await fixture.read(values)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

for (const algorithm of ['bitonic', 'radix', 'auto'] as const)
  for (const direction of ['ascending', 'descending'] as const) {
    test(`global chunk sort: ${algorithm}, ${direction}`, async () => {
      const device = await getWebGPUTestDevice('core');
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const input = [9, 3, 9, 0xffffffff, 0, 3, 7, 3, 1];
      const keys = fixture.column('keys', 'uint32', input, [0, 2, 3, 0, 4]);
      const values = fixture.column(
        'values',
        'uint32',
        input.map((_, index) => index),
        [1, 0, 5, 3]
      );
      const outputKeys = fixture.column(
        'output-keys',
        'uint32',
        input.map(() => 77),
        [3, 0, 6]
      );
      const outputValues = fixture.column(
        'output-values',
        'uint32',
        input.map(() => 77),
        [2, 4, 0, 3]
      );
      fixture.graph.add(
        new GPUSort({keys, values, outputKeys, outputValues, algorithm, direction})
      );
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 2; iteration++) {
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const expected = input
            .map((key, index) => ({key, index}))
            .sort(
              (left, right) =>
                (direction === 'ascending' ? left.key - right.key : right.key - left.key) ||
                left.index - right.index
            );
          expect(await fixture.read(outputKeys)).toEqual(expected.map(item => item.key));
          expect(await fixture.read(outputValues)).toEqual(expected.map(item => item.index));
        }
        expect(await fixture.read(keys)).toEqual(input);
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }

for (const capacity of [0, 3, 7]) {
  test(`chunked grid build/query preserves global IDs with capacity ${capacity}`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const positions = fixture.column(
      'positions',
      'float32x2',
      [0, 0, 1, 0, 0, 1, 1, 1, 0.1, 0.1, 2, 2, 0.9, 0.9],
      [1, 0, 4, 2]
    );
    const sourceIds = fixture.column('source-ids', 'uint32', [6, 5, 4, 3, 2, 1, 0], [0, 3, 4]);
    const cellOffsets = fixture.column(
      'cell-offsets',
      'uint32',
      [77, 77, 77, 77, 77],
      [1, 0, 2, 2]
    );
    const objectIds = fixture.column('object-ids', 'uint32', Array(7).fill(77), [0, 2, 3, 2]);
    const count = fixture.output('index-count', 'uint32', 1);
    const overflow = fixture.output('index-overflow', 'uint32', 1);
    const grid = new GPUGridIndex({
      positions,
      sourceIds,
      cellOffsets,
      objectIds,
      count,
      overflow,
      gridSize: [2, 2],
      bounds: [0, 0, 1, 1]
    });
    const query = fixture.output('query', 'float32', 4);
    fixture.storage.get(query.buffer)!.write(new Float32Array([0, 0, 1, 1]), query.byteOffset);
    const output = fixture.column('candidates', 'uint32', Array(capacity).fill(77), [
      0,
      Math.min(2, capacity),
      capacity - Math.min(2, capacity)
    ]);
    const queryCount = fixture.output('query-count', 'uint32', 1);
    const queryOverflow = fixture.output('query-overflow', 'uint32', 1);
    const outputMask = fixture.column('mask', 'uint32', Array(7).fill(77), [2, 0, 3, 2]);
    fixture.graph.add([
      grid,
      new GPUGridIndexQuery({
        index: grid,
        kind: 'bounds',
        query,
        output,
        count: queryCount,
        overflow: queryOverflow,
        outputMask
      })
    ]);
    const executable = fixture.graph.compile();
    try {
      for (let iteration = 0; iteration < 2; iteration++) {
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect(await fixture.read(cellOffsets)).toEqual([0, 2, 3, 4, 6]);
        expect(await fixture.read(count)).toEqual([6]);
        expect(await fixture.read(overflow)).toEqual([0]);
        expect(await fixture.read(queryCount)).toEqual([6]);
        expect(await fixture.read(queryOverflow)).toEqual([capacity < 6 ? 1 : 0]);
        expect(await fixture.read(outputMask)).toEqual([1, 0, 1, 1, 1, 1, 1]);
        const candidates = (await fixture.read(output)).slice(0, Math.min(capacity, 6));
        expect(new Set(candidates).size).toBe(candidates.length);
        expect(candidates.every(value => [0, 2, 3, 4, 5, 6].includes(value))).toBe(true);
      }
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

for (const input of [[], [4], [4, 4, 4, 4, 4, 4], [4, 4, 4, 2, 2, 9], [0, 1, 2, 3, 4, 5]]) {
  test(`run lengths cross chunk seams: ${input.join(',')}`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const length = input.length;
    const source = fixture.column('input', 'uint32', input, [
      0,
      Math.min(2, length),
      0,
      length - Math.min(2, length)
    ]);
    const values = fixture.column('values', 'uint32', Array(length).fill(77), [
      Math.min(1, length),
      length - Math.min(1, length),
      0
    ]);
    const lengths = fixture.column('lengths', 'uint32', Array(length).fill(77), [0, length]);
    const count = fixture.output('count', 'uint32', 1);
    fixture.graph.add(new GPURunLengthEncode({input: source, values, lengths, count}));
    const expectedValues: number[] = [],
      expectedLengths: number[] = [];
    input.forEach((value, index) => {
      if (!index || value !== input[index - 1]) {
        expectedValues.push(value);
        expectedLengths.push(1);
      } else expectedLengths[expectedLengths.length - 1]++;
    });
    const executable = fixture.graph.compile();
    try {
      for (let iteration = 0; iteration < 2; iteration++) {
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect(await fixture.read(count)).toEqual([expectedValues.length]);
        expect((await fixture.read(values)).slice(0, expectedValues.length)).toEqual(
          expectedValues
        );
        expect((await fixture.read(lengths)).slice(0, expectedLengths.length)).toEqual(
          expectedLengths
        );
      }
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

test('COO conversion and CSR multiplication preserve independent source batches', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const rowIndices = fixture.column('rows', 'uint32', [1, 1, 3, 3], [0, 1, 2, 1]);
  const columnIndices = fixture.column('columns', 'uint32', [0, 2, 1, 2], [3, 0, 1]);
  const values = fixture.column('values', 'float32', [2, 3, 4, 5], [2, 2]);
  const rowOffsets = fixture.column('offsets', 'uint32', Array(5).fill(77), [2, 1, 0, 2]);
  const outputColumnIndices = fixture.column('csr-columns', 'uint32', Array(4).fill(77), [1, 0, 3]);
  const outputValues = fixture.column('csr-values', 'float32', Array(4).fill(77), [3, 1]);
  const vector = fixture.column('vector', 'float32', [10, 20, 30], [1, 2]);
  const output = fixture.column('output', 'float32', Array(4).fill(77), [1, 2, 1]);
  fixture.graph.add([
    new GPUCOOToCSR({
      rowIndices,
      columnIndices,
      values,
      rows: 4,
      rowOffsets,
      outputColumnIndices,
      outputValues
    }),
    new GPUAdaptiveSpMV({
      rowOffsets,
      columnIndices: outputColumnIndices,
      values: outputValues,
      vector,
      output,
      columns: 3
    })
  ]);
  const executable = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    executable.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await fixture.read(rowOffsets)).toEqual([0, 0, 2, 2, 4]);
    expect(await fixture.read(outputColumnIndices)).toEqual([0, 2, 1, 2]);
    expect(await fixture.read(outputValues)).toEqual([2, 3, 4, 5]);
    expect(await fixture.read(output)).toEqual([0, 110, 0, 230]);
  } finally {
    executable.destroy();
    fixture.destroy();
  }
});

test('segmented sort crosses storage chunks and preserves gaps', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const keys = fixture.column('keys', 'uint32', [9, 3, 3, 1, 4, 2], [2, 0, 4]);
  const values = fixture.column('values', 'uint32', [0, 1, 2, 3, 4, 5], [1, 3, 2]);
  const outputKeys = fixture.column('output-keys', 'uint32', Array(8).fill(77), [3, 5]);
  const outputValues = fixture.column('output-values', 'uint32', Array(8).fill(77), [1, 0, 2, 5]);
  fixture.graph.add(
    new GPUSegmentedSort({
      keys,
      values,
      outputKeys,
      outputValues,
      segments: [
        {keysOffset: 0, valuesOffset: 0, outputKeysOffset: 1, outputValuesOffset: 1, length: 4},
        {keysOffset: 4, valuesOffset: 4, outputKeysOffset: 6, outputValuesOffset: 6, length: 2}
      ]
    })
  );
  const executable = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    executable.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await fixture.read(outputKeys)).toEqual([77, 1, 3, 3, 9, 77, 2, 4]);
    expect(await fixture.read(outputValues)).toEqual([77, 3, 1, 2, 0, 77, 5, 4]);
  } finally {
    executable.destroy();
    fixture.destroy();
  }
});

test('hierarchy and ancestor projection follow global IDs across independent chunks', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const parentStates = fixture.column('parent-states', 'uint32', [0, 1, 1], [1, 0, 2]);
  const childStates = fixture.column('child-states', 'uint32', [1, 1, 1, 0, 0, 1], [1, 3, 2]);
  const heights = fixture.column('heights', 'uint32', Array(6).fill(77), [0, 2, 4]);
  const offsets = fixture.column('offsets', 'uint32', Array(6).fill(77), [3, 0, 3]);
  fixture.graph.add(
    new GPUHierarchyLayout({
      parentStates,
      childStates,
      heights,
      offsets,
      childrenPerParent: 2,
      expandedChildHeight: 3
    })
  );
  const parents = fixture.column('parents', 'uint32', [0xffffffff, 0, 1, 2, 5, 4], [2, 0, 4]);
  const visibility = fixture.column('visibility', 'uint32', [1, 0, 0, 0, 0, 0], [1, 3, 2]);
  const output = fixture.column('ancestors', 'uint32', Array(6).fill(77), [1, 4, 1]);
  fixture.graph.add(new GPUAncestorProjection({parents, visibility, output, maxDepth: 2}));
  const executable = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    executable.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await fixture.read(heights)).toEqual([1, 0, 3, 1, 1, 3]);
    expect(await fixture.read(offsets)).toEqual([0, 1, 1, 4, 5, 6]);
    expect(await fixture.read(output)).toEqual([0, 0, 0, 0xffffffff, 0xffffffff, 0xffffffff]);
  } finally {
    executable.destroy();
    fixture.destroy();
  }
});

for (const indirect of [false, true]) {
  test(`segmented chunk search preserves query validation, indirect=${indirect}`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const values = fixture.column(
      'values',
      'float32',
      indirect ? [9, 1, 7, 3, 5] : [1, 3, 5, 7, 9],
      [1, 0, 3, 1],
      {stride: 2}
    );
    const valueOrder = indirect
      ? fixture.column('order', 'uint32', [1, 3, 4, 2, 0], [2, 0, 3])
      : undefined;
    const queries = fixture.column('queries', 'float32', [0, 5, 4, NaN, 8, 10], [1, 0, 3, 2]);
    const segments = fixture.column('segments', 'uint32', [1, 3, 0, 6], [1, 1, 0, 2]);
    const output = fixture.column('output', 'uint32', Array(6).fill(77), [2, 3, 1]);
    const validationErrors = fixture.output('errors', 'uint32', 1);
    fixture.graph.add(
      new GPUGallopingSearch({
        values,
        valueOrder,
        queries,
        segments,
        output,
        validationErrors,
        maximumQueryCount: 6,
        queriesPerTile: 3
      })
    );
    const executable = fixture.graph.compile();
    try {
      for (let iteration = 0; iteration < 2; iteration++) {
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect(await fixture.read(output)).toEqual([1, 2, 2, 77, 77, 77]);
        expect(await fixture.read(validationErrors)).toEqual([12]);
      }
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

for (const enabled of [0, 1]) {
  test(`program CSR lowering preserves chunk bindings under GPU predicate ${enabled}`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const rowOffsets = fixture.column('rows', 'uint32', [0, 2, 3], [1, 0, 2]);
    const columnIndices = fixture.column('columns', 'uint32', [0, 2, 1], [2, 1]);
    const values = fixture.column('values', 'float32', [2, 3, 4], [1, 2]);
    const vector = fixture.column('vector', 'float32', [10, 20, 30], [2, 0, 1]);
    const output = fixture.column('output', 'float32', [77, 77], [1, 1]);
    const bindings = Object.fromEntries(
      Object.entries({rowOffsets, columnIndices, values, vector, output}).map(([name, view]) => [
        name,
        ('data' in view ? view.data : [view]).map(
          chunk =>
            new GPUData({
              buffer: fixture.storage.get(chunk.buffer)!,
              format: chunk.format,
              length: chunk.length,
              byteOffset: chunk.byteOffset
            })
        )
      ])
    );
    const program = new GPUProgram();
    const matrix = new GPUProgramCSRMatrix({
      id: 'matrix',
      rows: 2,
      columns: 3,
      rowOffsets: program.vector('rowOffsets', 'uint32', 3, {external: true}),
      columnIndices: program.vector('columnIndices', 'uint32', 3, {external: true}),
      values: program.vector('values', 'float32', 3, {external: true})
    });
    const input = program.vector('vector', 'float32', 3, {external: true});
    const result = program.vector('output', 'float32', 2, {external: true});
    const active = program.scalar('active', 'uint32');
    program.add([
      new GPUProgramScalarLiteral({output: active, value: enabled}),
      new GPUConditionalOperation({
        predicate: {id: 'active', source: 'gpu', value: active},
        body: [new GPUProgramSpMV({matrix, vector: input, output: result})]
      })
    ]);
    const compilation = new GPUProgramCompiler(device).compile(program, {vectors: bindings});
    expect(compilation.vectors.get('rowOffsets')!.data.map(chunk => chunk.length)).toEqual([
      1, 0, 2
    ]);
    const executable = compilation.graph.compile();
    try {
      for (let iteration = 0; iteration < 2; iteration++) {
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect(await fixture.read(output)).toEqual(enabled ? [110, 80] : [77, 77]);
      }
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

test('global radix merge preserves low-bit ties across multi-workgroup chunks', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const input = Array.from({length: 770}, (_, index) => ((index * 37) % 1024) + 1024 * (index % 3));
  const keys = fixture.column('keys', 'uint32', input, [257, 0, 257, 256]);
  const values = fixture.column(
    'values',
    'uint32',
    input.map((_, index) => index),
    [770]
  );
  const outputKeys = fixture.column('output-keys', 'uint32', Array(770).fill(77), [511, 259]);
  const outputValues = fixture.column(
    'output-values',
    'uint32',
    Array(770).fill(77),
    [1, 400, 369]
  );
  fixture.graph.add(
    new GPUSort({
      keys,
      values,
      outputKeys,
      outputValues,
      algorithm: 'radix',
      direction: 'descending',
      keyBits: 8
    })
  );
  const executable = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    executable.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const expected = input
      .map((key, index) => ({key, index}))
      .sort((left, right) => (right.key & 255) - (left.key & 255) || left.index - right.index);
    expect(await fixture.read(outputKeys)).toEqual(expected.map(item => item.key));
    expect(await fixture.read(outputValues)).toEqual(expected.map(item => item.index));
  } finally {
    executable.destroy();
    fixture.destroy();
  }
});
