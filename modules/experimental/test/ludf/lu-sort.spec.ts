// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuDataFrame,
  column,
  literal,
  parameter,
  type CompiledLuDataFrameGlobalSort,
  type LuDataFrameQueryParameters
} from '@luma.gl/experimental/ludf';
import {GPUData, GPURecordBatch, GPUTable, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

type LuSortSourceSchema = {
  score: 'float32';
  signed: 'sint32';
  category: 'uint32';
};

type LuSortFixture = {
  frame: LuDataFrame<LuSortSourceSchema>;
  sourceBuffers: Buffer[];
};

test('LuDataFrame stably sorts nullable floating-point batches without materializing source rows', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuSortFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');
  const query = fixture.frame.sortBy('score');

  testContext.equal(
    createBufferSpy.mock.calls.length,
    0,
    'immutable sort planning allocates no GPU buffers'
  );
  testContext.equal(
    submitSpy.mock.calls.length,
    0,
    'immutable sort planning submits no GPU commands'
  );

  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-floating-point-stable-sort'
  });
  const compiled = query.compile(graph);

  try {
    testContext.equal(
      compiled.sortColumn,
      'score',
      'compiled sorting exposes its selected source column'
    );
    testContext.equal(compiled.direction, 'ascending', 'sortBy defaults to ascending order');
    testContext.equal(compiled.nulls, 'last', 'null placement defaults to the final selected rows');
    testContext.equal(compiled.nans, 'last', 'NaNs default to the end of the non-null values');
    testContext.deepEqual(
      compiled.table.batches.map(batch => batch.numRows),
      [6, 0, 7],
      'sorting retains source record batches and does not fabricate a materialized table'
    );
    testContext.deepEqual(
      compiled.dictionaries.category,
      {values: ['economy', 'standard', 'premium'], ordered: false},
      'sorting keeps adapter-owned categorical dictionary metadata'
    );

    fixture.frame.destroy();
    testContext.ok(
      fixture.sourceBuffers.every(buffer => !buffer.destroyed),
      'compiled sorts retain their owned source lease'
    );

    const commandEncoder = device.createCommandEncoder({id: 'ludf-float-sort-encode'});
    compiled.encode(commandEncoder);
    testContext.equal(
      submitSpy.mock.calls.length,
      0,
      'sorting only records caller-owned graph commands'
    );
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readLuSortedSourceRows(compiled.rowIndices, compiled.selectedCounts),
      [[43, 40, 41, 44, 42, 45], [], [52, 47, 50, 51, 46, 48, 49]],
      'stable per-batch float sorting handles infinities, signed zeros, NaNs, nulls, and duplicate keys'
    );
    testContext.deepEqual(
      await readLuSortChunks(compiled.selectedCounts),
      [[6], [0], [7]],
      'sorting retains each source batch independently, including explicit empty batches'
    );
    testContext.deepEqual(
      await readLuSortChunks(compiled.selectionMask),
      [[1, 1, 1, 1, 1, 1], [], [1, 1, 1, 1, 1, 1, 1]],
      'plain sorting includes explicit null and NaN rows while retaining source-row selection masks'
    );

    compiled.destroy();
    testContext.ok(
      fixture.sourceBuffers.every(buffer => buffer.destroyed),
      'owned source buffers release after the compiled sorting lease is destroyed'
    );
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  testContext.end();
});

test('LuDataFrame orders nulls, NaNs, signed integers, and full-width unsigned values explicitly', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuSortFixture(device);
  const nullableGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-null-nan-sort'
  });
  const nullable = fixture.frame
    .sortBy('score', {nulls: 'first', nans: 'first'})
    .compile(nullableGraph);
  const descendingGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-descending-sort'
  });
  const descending = fixture.frame
    .sortBy('score', {direction: 'descending'})
    .compile(descendingGraph);
  const signedGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-signed-sort'
  });
  const signed = fixture.frame.sortBy('signed', {algorithm: 'radix'}).compile(signedGraph);
  const unsignedGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-unsigned-sort'
  });
  const unsigned = fixture.frame.sortBy('category').compile(unsignedGraph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-all-sort-formats-encode'});
    nullable.encode(commandEncoder);
    descending.encode(commandEncoder);
    signed.encode(commandEncoder);
    unsigned.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readLuSortedSourceRows(nullable.rowIndices, nullable.selectedCounts),
      [[45, 42, 43, 40, 41, 44], [], [49, 52, 47, 50, 51, 46, 48]],
      'nulls sort outermost while NaNs sort first among remaining non-null values'
    );
    testContext.deepEqual(
      await readLuSortedSourceRows(descending.rowIndices, descending.selectedCounts),
      [[44, 40, 41, 43, 42, 45], [], [46, 48, 50, 51, 47, 52, 49]],
      'descending floating order keeps signed-zero and duplicate source-row ties stable'
    );
    testContext.deepEqual(
      await readLuSortedSourceRows(signed.rowIndices, signed.selectedCounts),
      [[41, 42, 43, 45, 40, 44], [], [48, 46, 50, 47, 52, 51, 49]],
      'signed bit transforms preserve full int32 ordering and stable duplicate ties'
    );
    testContext.deepEqual(
      await readLuSortedSourceRows(unsigned.rowIndices, unsigned.selectedCounts),
      [[41, 44, 42, 43, 40, 45], [], [47, 50, 46, 48, 49, 51, 52]],
      'unsigned sorting supports the full uint32 domain without reserving null sentinels'
    );
  } finally {
    nullable.destroy();
    descending.destroy();
    signed.destroy();
    unsigned.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame publishes filtered per-batch top-K rows and encoder-ordered parameter updates', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuSortFixture(device);
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-filtered-top-k'
  });
  const compiled = fixture.frame
    .filter(column('score').greaterThan(parameter('minimumScore', -1)))
    .topK('score', 2)
    .compile(graph);

  const firstCounts = compiled.selectedCounts.data.map((_, batchIndex) =>
    device.createBuffer({
      id: `ludf-top-k-count-${batchIndex}`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    })
  );
  const firstMasks = compiled.selectionMask.data.map((chunk, batchIndex) =>
    chunk.length > 0
      ? device.createBuffer({
          id: `ludf-top-k-mask-${batchIndex}`,
          byteLength: chunk.length * Uint32Array.BYTES_PER_ELEMENT,
          usage: Buffer.COPY_SRC | Buffer.COPY_DST
        })
      : undefined
  );

  try {
    testContext.equal(compiled.limit, 2, 'compiled top-K exposes its per-batch limit');
    testContext.equal(compiled.direction, 'descending', 'top-K defaults to largest values first');

    const commandEncoder = device.createCommandEncoder({id: 'ludf-top-k-two-encodes'});
    compiled.encode(commandEncoder, {minimumScore: -1});
    for (const [batchIndex, count] of compiled.selectedCounts.data.entries()) {
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: getLuSortBuffer(count),
        destinationBuffer: firstCounts[batchIndex],
        size: Uint32Array.BYTES_PER_ELEMENT
      });
      const maskSnapshot = firstMasks[batchIndex];
      const sourceMask = compiled.selectionMask.data[batchIndex];
      if (maskSnapshot && sourceMask.length > 0) {
        commandEncoder.copyBufferToBuffer({
          sourceBuffer: getLuSortBuffer(sourceMask),
          destinationBuffer: maskSnapshot,
          size: sourceMask.length * Uint32Array.BYTES_PER_ELEMENT
        });
      }
    }
    compiled.encode(commandEncoder, {minimumScore: 2});
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await Promise.all(firstCounts.map(async buffer => (await readLuSortBuffer(buffer, 1))[0])),
      [2, 0, 2],
      'initial top-K clamps each preserved batch count independently'
    );
    testContext.deepEqual(
      await Promise.all(
        firstMasks.map((buffer, batchIndex) =>
          buffer
            ? readLuSortBuffer(buffer, compiled.selectionMask.data[batchIndex].length)
            : Promise.resolve([])
        )
      ),
      [[1, 0, 0, 0, 1, 0], [], [1, 0, 1, 0, 0, 0, 0]],
      'top-K source masks include exactly the selected sorted source rows'
    );
    testContext.deepEqual(
      await readLuSortedSourceRows(compiled.rowIndices, compiled.selectedCounts),
      [[44], [], [46, 48]],
      'the same compiled graph updates ordered IDs after a stricter filter parameter'
    );
    testContext.deepEqual(
      await readLuSortChunks(compiled.selectionMask),
      [[0, 0, 0, 0, 1, 0], [], [1, 0, 1, 0, 0, 0, 0]],
      'second-encode masks remain coherent with sorted IDs and clamped batch counts'
    );
  } finally {
    for (const buffer of firstCounts) buffer.destroy();
    for (const buffer of firstMasks) buffer?.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame supports zero, oversized, and preordered per-batch top-K limits', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuSortFixture(device);
  const emptyGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-zero-top-k'
  });
  const empty = fixture.frame.topK('signed', 0).compile(emptyGraph);
  const oversizedGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-oversized-top-k'
  });
  const oversized = fixture.frame.topK('signed', 100).compile(oversizedGraph);
  const orderedGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-ordered-top-k'
  });
  const ordered = fixture.frame
    .sortBy('signed', {direction: 'ascending'})
    .topK(2)
    .compile(orderedGraph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-top-k-limits-encode'});
    empty.encode(commandEncoder);
    oversized.encode(commandEncoder);
    ordered.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readLuSortChunks(empty.selectedCounts),
      [[0], [0], [0]],
      'a zero top-K limit rejects every row while retaining every batch'
    );
    testContext.deepEqual(
      await readLuSortChunks(empty.selectionMask),
      [[0, 0, 0, 0, 0, 0], [], [0, 0, 0, 0, 0, 0, 0]],
      'a zero top-K limit clears every source-row selection mask'
    );
    testContext.deepEqual(
      await readLuSortChunks(oversized.selectedCounts),
      [[6], [0], [7]],
      'an oversized per-batch limit retains all selected rows without padding'
    );
    testContext.equal(
      ordered.direction,
      'ascending',
      'sorted-plan top-K preserves explicit direction'
    );
    testContext.deepEqual(
      await readLuSortedSourceRows(ordered.rowIndices, ordered.selectedCounts),
      [[41, 42], [], [48, 46]],
      'top-K applied to an existing ascending plan returns the smallest stable rows per batch'
    );
  } finally {
    empty.destroy();
    oversized.destroy();
    ordered.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame sorts nullable derived columns and schema-only source tables', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuSortFixture(device);
  const derivedGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-derived-stable-sort'
  });
  const derived = fixture.frame
    .withColumn('shiftedScore', column('score').add(literal(1)), {format: 'float32'})
    .sortBy('shiftedScore', {nulls: 'first'})
    .compile(derivedGraph);

  const emptyFrame = new LuDataFrame<LuSortSourceSchema>({
    table: new GPUTable<LuSortSourceSchema>({
      schema: {
        fields: [
          {name: 'score', format: 'float32', nullable: true},
          {name: 'signed', format: 'sint32', nullable: false},
          {name: 'category', format: 'uint32', nullable: false}
        ],
        metadata: new Map([['dataset', 'empty-sort']])
      },
      bufferLayout: [
        {name: 'score', format: 'float32', byteStride: 4},
        {name: 'signed', format: 'sint32', byteStride: 4},
        {name: 'category', format: 'uint32', byteStride: 4}
      ]
    }),
    ownership: 'owned'
  });
  const emptyGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-schema-only-sort'
  });
  const empty = emptyFrame.sortBy('score').compile(emptyGraph);
  const emptyGlobal = emptyFrame
    .sortByGlobal('score')
    .compile(
      new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-schema-only-global-sort'})
    );

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-derived-and-empty-sort'});
    derived.encode(commandEncoder);
    empty.encode(commandEncoder);
    emptyGlobal.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readLuSortedSourceRows(derived.rowIndices, derived.selectedCounts),
      [[45, 43, 40, 41, 44, 42], [], [52, 47, 50, 51, 46, 48, 49]],
      'nullable derived keys preserve null-first ordering, NaN-last placement, and stable ties'
    );
    testContext.deepEqual(
      empty.table.batches,
      [],
      'schema-only sorts do not invent source batches'
    );
    testContext.deepEqual(
      empty.selectedCounts.data,
      [],
      'schema-only sorts allocate no batch counts'
    );
    testContext.equal(
      empty.table.schema.metadata.get('dataset'),
      'empty-sort',
      'schema-only sorted projections retain source metadata'
    );
    testContext.deepEqual(await readLuSortChunks(emptyGlobal.globalSelectedCount), [[0]]);
    testContext.equal(emptyGlobal.globalRowIndices.length, 0);
    testContext.deepEqual(emptyGlobal.table.batches, []);
  } finally {
    derived.destroy();
    empty.destroy();
    emptyGlobal.destroy();
    emptyFrame.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame globally sorts stable nullable floating-point keys across preserved batches', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuSortFixture(device, {sourceOffsets: [100, 400, 900]});
  const sorted = fixture.frame
    .sortByGlobal('score')
    .compile(
      new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-global-float-sort'})
    );
  const nullsFirst = fixture.frame
    .sortByGlobal('score', {nulls: 'first', nans: 'first'})
    .compile(
      new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-global-null-nan-sort'})
    );

  try {
    const encoder = device.createCommandEncoder({id: 'ludf-global-float-sort-encode'});
    sorted.encode(encoder);
    nullsFirst.encode(encoder);
    device.submit(encoder.finish());

    testContext.deepEqual(
      await readLuSortChunks(sorted.globalSelectedCount),
      [[13]],
      'global ordering exposes one selected-row count across every preserved batch'
    );
    testContext.deepEqual(
      await readLuSortChunks(sorted.globalRowIndices),
      [[103, 906, 901, 100, 101, 904, 905, 900, 902, 104, 102, 903, 105]],
      'global numeric sorting merges batches stably and preserves discontinuous source identities'
    );
    testContext.deepEqual(
      await readLuSortChunks(nullsFirst.globalRowIndices),
      [[105, 102, 903, 103, 906, 901, 100, 101, 904, 905, 900, 902, 104]],
      'global null placement is absolute while NaNs remain independently ordered and stable'
    );
    testContext.deepEqual(
      sorted.table.batches.map(batch => batch.numRows),
      [6, 0, 7],
      'global permutation never concatenates or reorders original dataframe batches'
    );
    testContext.deepEqual(
      await readLuSortChunks(sorted.selectedCounts),
      [[6], [0], [7]],
      'global full sorting preserves the existing batch-aligned selection counts'
    );
  } finally {
    sorted.destroy();
    nullsFirst.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame applies one globally stable top-K and reconciles source-aligned batch masks', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuSortFixture(device);
  const highest = fixture.frame
    .topKGlobal('score', 4)
    .compile(new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-global-top-k'}));
  const lowest = fixture.frame
    .sortByGlobal('signed')
    .topK(3)
    .compile(new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-global-bottom-k'}));
  const empty = fixture.frame
    .topKGlobal('category', 0)
    .compile(new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-global-zero-k'}));

  try {
    const encoder = device.createCommandEncoder({id: 'ludf-global-top-k-encode'});
    highest.encode(encoder);
    lowest.encode(encoder);
    empty.encode(encoder);
    device.submit(encoder.finish());

    testContext.deepEqual(await readLuSortChunks(highest.globalSelectedCount), [[4]]);
    testContext.deepEqual(
      await readLuSortBuffer(getLuSortBuffer(highest.globalRowIndices.data[0]), 4),
      [44, 46, 48, 40],
      'one descending global bound selects the four largest rows across all batches'
    );
    testContext.deepEqual(
      await readLuSortChunks(highest.selectionMask),
      [[1, 0, 0, 0, 1, 0], [], [1, 0, 1, 0, 0, 0, 0]],
      'global top-K updates every original source-aligned selection mask'
    );
    testContext.deepEqual(await readLuSortChunks(highest.selectedCounts), [[2], [0], [2]]);
    testContext.deepEqual(
      await readLuSortedSourceRows(highest.rowIndices, highest.selectedCounts),
      [[40, 44], [], [46, 48]],
      'inherited batch-local row outputs remain coherent with the global selection'
    );

    testContext.deepEqual(await readLuSortChunks(lowest.globalSelectedCount), [[3]]);
    testContext.deepEqual(
      await readLuSortBuffer(getLuSortBuffer(lowest.globalRowIndices.data[0]), 3),
      [41, 48, 42],
      'sorted-plan limiting preserves ascending full-width signed ordering across batches'
    );
    testContext.deepEqual(await readLuSortChunks(empty.globalSelectedCount), [[0]]);
    testContext.deepEqual(await readLuSortChunks(empty.selectedCounts), [[0], [0], [0]]);
  } finally {
    highest.destroy();
    lowest.destroy();
    empty.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame globally orders filtered derived keys and preserves reusable query parameters', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuSortFixture(device);
  const compiled = fixture.frame
    .filter(column('signed').greaterThan(parameter('minimumSigned', -4)))
    .withColumn('shiftedSigned', column('signed').add(literal(0)), {format: 'sint32'})
    .topKGlobal('shiftedSigned', 2)
    .compile(
      new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-global-parameter'})
    );

  try {
    let encoder = device.createCommandEncoder({id: 'ludf-global-parameter-first'});
    compiled.encode(encoder, {minimumSigned: 6});
    device.submit(encoder.finish());
    testContext.deepEqual(await readLuSortChunks(compiled.globalSelectedCount), [[2]]);
    testContext.deepEqual(
      await readLuSortBuffer(getLuSortBuffer(compiled.globalRowIndices.data[0]), 2),
      [40, 44],
      'global derived top-K retains stable source order among maximum signed-key ties'
    );

    encoder = device.createCommandEncoder({id: 'ludf-global-parameter-second'});
    compiled.encode(encoder, {minimumSigned: 0x7fffffff});
    device.submit(encoder.finish());
    testContext.deepEqual(await readLuSortChunks(compiled.globalSelectedCount), [[0]]);
    testContext.deepEqual(await readLuSortChunks(compiled.selectedCounts), [[0], [0], [0]]);
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame globally orders preserved batches through bounded three-dimensional sorting', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const originalLimits = device.limits;
  Object.defineProperty(device, 'limits', {
    configurable: true,
    value: new Proxy(originalLimits, {
      get(target, property) {
        return property === 'maxComputeWorkgroupsPerDimension'
          ? 2
          : Reflect.get(target, property, target);
      }
    })
  });
  const dispatch = vi.spyOn(Computation.prototype, 'dispatch');
  const sourceBuffers: Buffer[] = [];
  const expected: {score: number; sourceRow: number; ordinal: number}[] = [];
  const lengths = [513, 0, 512];
  const offsets = [1_000, 5_000, 9_000];
  let ordinal = 0;
  const batches = lengths.map((length, batchIndex) => {
    const scores = Float32Array.from({length}, (_, index) => {
      const score = ((ordinal + index) * 37) % 97;
      expected.push({score, sourceRow: offsets[batchIndex] + index, ordinal: ordinal + index});
      return score;
    });
    const batch = new GPURecordBatch<LuSortSourceSchema>({
      gpuData: {
        score: createLuSortData(device, sourceBuffers, scores, 'float32'),
        signed: createLuSortData(device, sourceBuffers, Int32Array.from(scores), 'sint32'),
        category: createLuSortData(device, sourceBuffers, Uint32Array.from(scores), 'uint32')
      },
      fields: [
        {name: 'score', format: 'float32', nullable: false},
        {name: 'signed', format: 'sint32', nullable: false},
        {name: 'category', format: 'uint32', nullable: false}
      ],
      sourceInfo: {
        sourceBatchIndex: batchIndex,
        sourceRowIndexOffset: offsets[batchIndex],
        sourceRowCount: length
      }
    });
    ordinal += length;
    return batch;
  });
  const frame = new LuDataFrame<LuSortSourceSchema>({
    table: new GPUTable({batches}),
    ownership: 'owned'
  });
  let compiled: CompiledLuDataFrameGlobalSort<LuSortSourceSchema> | undefined;

  try {
    compiled = frame
      .topKGlobal('score', 25)
      .compile(
        new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-global-bounded-sort'})
      );
    const encoder = device.createCommandEncoder({id: 'ludf-global-bounded-sort-encode'});
    compiled.encode(encoder);
    device.submit(encoder.finish());

    const expectedRows = expected
      .sort((left, right) => right.score - left.score || left.ordinal - right.ordinal)
      .slice(0, 25)
      .map(row => row.sourceRow);
    testContext.deepEqual(await readLuSortChunks(compiled.globalSelectedCount), [[25]]);
    testContext.deepEqual(
      await readLuSortBuffer(getLuSortBuffer(compiled.globalRowIndices.data[0]), 25),
      expectedRows,
      'stable global top-K merges 1,025 discontiguous source rows without collapsing batches'
    );
    testContext.deepEqual(
      compiled.table.batches.map(batch => batch.numRows),
      lengths
    );
    testContext.ok(
      dispatch.mock.calls.some(
        ([, horizontal, vertical, depth]) => horizontal === 2 && vertical === 2 && depth === 2
      ),
      'the explicit cross-batch permutation uses bounded 2×2×2 GPU sorting'
    );
  } finally {
    compiled?.destroy();
    frame.destroy();
    dispatch.mockRestore();
    Object.defineProperty(device, 'limits', {configurable: true, value: originalLimits});
  }

  testContext.end();
});

function createLuSortFixture(
  device: Device,
  options: {sourceOffsets?: readonly number[]} = {}
): LuSortFixture {
  const sourceBuffers: Buffer[] = [];
  const scores = [
    Float32Array.from([-0, 0, Number.NaN, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 5]),
    new Float32Array(0),
    Float32Array.from([3, -2, 3, Number.NaN, -0, 0, Number.NEGATIVE_INFINITY])
  ];
  const scoreValidity = [
    Uint32Array.from([1, 1, 1, 1, 1, 0]),
    new Uint32Array(0),
    Uint32Array.from([1, 1, 1, 1, 1, 1, 1])
  ];
  const signed = [
    Int32Array.from([0x7fffffff, -0x80000000, -3, 0, 0x7fffffff, 7]),
    new Int32Array(0),
    Int32Array.from([-1, 0, -0x80000000, 0x7fffffff, -1, 8, 7])
  ];
  const categories = [
    Uint32Array.from([0xffffffff, 0, 2, 2, 1, 0xffffffff]),
    new Uint32Array(0),
    Uint32Array.from([1, 0, 1, 2, 0, 2, 0xffffffff])
  ];
  const validityChunks: GPUData<'uint32'>[] = [];
  let sourceRowIndexOffset = 40;

  const batches = scores.map((values, batchIndex) => {
    const batch = new GPURecordBatch<LuSortSourceSchema>({
      gpuData: {
        score: createLuSortData(device, sourceBuffers, values, 'float32'),
        signed: createLuSortData(device, sourceBuffers, signed[batchIndex], 'sint32'),
        category: createLuSortData(device, sourceBuffers, categories[batchIndex], 'uint32')
      },
      fields: [
        {name: 'score', format: 'float32', nullable: true},
        {name: 'signed', format: 'sint32', nullable: false},
        {name: 'category', format: 'uint32', nullable: false}
      ],
      sourceInfo: {
        sourceBatchIndex: batchIndex + 4,
        sourceRowIndexOffset: options.sourceOffsets?.[batchIndex] ?? sourceRowIndexOffset,
        sourceRowCount: values.length
      }
    });
    sourceRowIndexOffset += values.length;
    validityChunks.push(
      createLuSortData(device, sourceBuffers, scoreValidity[batchIndex], 'uint32')
    );
    return batch;
  });

  return {
    frame: new LuDataFrame<LuSortSourceSchema>({
      table: new GPUTable<LuSortSourceSchema>({batches}),
      validity: {
        score: new GPUVector<'uint32'>({
          type: 'data',
          name: 'ludf-sort-score-validity',
          format: 'uint32',
          data: validityChunks,
          ownsData: true
        })
      },
      dictionaries: {
        category: {values: ['economy', 'standard', 'premium'], ordered: false}
      },
      ownership: 'owned'
    }),
    sourceBuffers
  };
}

function createLuSortData<Format extends 'float32' | 'sint32' | 'uint32'>(
  device: Device,
  sourceBuffers: Buffer[],
  values: Float32Array | Int32Array | Uint32Array,
  format: Format
): GPUData<Format> {
  const buffer = device.createBuffer({
    byteLength: Math.max(values.byteLength, Uint32Array.BYTES_PER_ELEMENT),
    usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST,
    ...(values.byteLength > 0 ? {data: values} : {})
  });
  sourceBuffers.push(buffer);
  return new GPUData({buffer, format, length: values.length, ownsBuffer: true});
}

function getLuSortBuffer(data: GPUData): Buffer {
  return data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
}

async function readLuSortBuffer(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) {
    return [];
  }
  const values = await buffer.readAsync(0, length * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(values.buffer, values.byteOffset, length));
}

async function readLuSortChunks(vector: GPUVector<'uint32'>): Promise<number[][]> {
  return Promise.all(
    vector.data.map(chunk => readLuSortBuffer(getLuSortBuffer(chunk), chunk.length))
  );
}

async function readLuSortedSourceRows(
  rowIndices: GPUVector<'uint32'>,
  selectedCounts: GPUVector<'uint32'>
): Promise<number[][]> {
  const counts = await readLuSortChunks(selectedCounts);
  return Promise.all(
    rowIndices.data.map((chunk, batchIndex) =>
      readLuSortBuffer(getLuSortBuffer(chunk), counts[batchIndex][0] ?? 0)
    )
  );
}
