// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuDataFrame,
  column,
  parameter,
  type LuDataFrameQueryParameters
} from '@luma.gl/experimental/ludf';
import {GPUData, GPURecordBatch, GPUTable, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

const MISSING_JOIN_ROW = 0xffffffff;

type LuJoinLeftSchema = {key: 'uint32'; fare: 'float32'};
type LuJoinRightSchema = {lookupKey: 'uint32'; weight: 'float32'};

type LuJoinFixture = {
  left: LuDataFrame<LuJoinLeftSchema>;
  right: LuDataFrame<LuJoinRightSchema>;
  leftBuffers: Buffer[];
  rightBuffers: Buffer[];
};

type LuJoinFixtureOptions = {
  duplicateRight?: boolean;
  invalidRight?: boolean;
  noRightBatches?: boolean;
};

test('LuDataFrame inner joins preserve mismatched nullable batches, stable row identities, and both source leases', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuJoinFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');
  const query = fixture.left.innerJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'});

  testContext.equal(createBufferSpy.mock.calls.length, 0, 'join planning allocates no GPU buffers');
  testContext.equal(submitSpy.mock.calls.length, 0, 'join planning submits no GPU work');

  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-mismatched-batch-inner-join'
  });
  const compiled = query.compile(graph);

  try {
    testContext.deepEqual(
      compiled.table.batches.map(batch => batch.numRows),
      [3, 0, 5],
      'joined output retains the original left record batches'
    );
    testContext.deepEqual(
      compiled.rightTable.batches.map(batch => batch.numRows),
      [2, 0, 3],
      'the retained right side preserves its independent source topology'
    );

    fixture.left.destroy();
    fixture.right.destroy();
    testContext.ok(
      [...fixture.leftBuffers, ...fixture.rightBuffers].every(buffer => !buffer.destroyed),
      'compiled joins retain both owned source leases'
    );

    const commandEncoder = device.createCommandEncoder({id: 'ludf-inner-join-encode'});
    compiled.encode(commandEncoder);
    testContext.equal(
      submitSpy.mock.calls.length,
      0,
      'encoding leaves submission application-owned'
    );
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readLuJoinChunks(compiled.requiredCounts),
      [[2], [0], [3]],
      'required matches are counted independently per left batch'
    );
    testContext.deepEqual(
      await readLuJoinChunks(compiled.selectedCounts),
      [[2], [0], [3]],
      'published counts remain coherent with inherited stable row indices'
    );
    testContext.deepEqual(await readLuJoinChunks(compiled.overflows), [[0], [0], [0]]);
    testContext.deepEqual(
      await readLuJoinPublishedRows(compiled.rowIndices, compiled.selectedCounts),
      [[100, 102], [], [800, 802, 803]],
      'left source identifiers retain discontinuous sourceInfo offsets and stable match order'
    );
    testContext.deepEqual(
      await readLuJoinPublishedRows(compiled.rightRowIndices, compiled.selectedCounts),
      [[501, 500], [], [900, 901, 500]],
      'right identities resolve across multiple batches without concatenating or repacking'
    );
    testContext.deepEqual(
      (await readLuJoinChunks(compiled.indexStatistics))[0].slice(0, 4),
      [4, 0, 0, 0],
      'ordinary nullable right rows are skipped without becoming reserved-key violations'
    );
    testContext.deepEqual(await readLuJoinChunks(compiled.contractViolation), [[0]]);

    compiled.destroy();
    testContext.ok(
      [...fixture.leftBuffers, ...fixture.rightBuffers].every(buffer => buffer.destroyed),
      'both owned sources are destroyed only after the compiled join is released'
    );
  } finally {
    compiled.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  testContext.end();
});

test('LuDataFrame bounded lookups keep source-aligned matches, nullable keys, and missing markers on the GPU', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuJoinFixture(device);
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-source-aligned-lookup'
  });
  const compiled = fixture.left
    .lookup(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-lookup-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readLuJoinChunks(compiled.matchMask),
      [[1, 0, 1], [], [1, 0, 1, 1, 0]],
      'missing and explicitly null left keys never report a match'
    );
    testContext.deepEqual(
      await readLuJoinChunks(compiled.rightRowIndices),
      [[501, MISSING_JOIN_ROW, 500], [], [900, MISSING_JOIN_ROW, 901, 500, MISSING_JOIN_ROW]],
      'bounded lookups retain source-aligned stable right identities and explicit missing markers'
    );
    testContext.deepEqual(
      compiled.probeCounts.data.map(chunk => chunk.length),
      [3, 0, 5],
      'probe counts preserve the original left chunk topology'
    );
    testContext.deepEqual(
      compiled.lookupStatistics.data.map(chunk => chunk.length),
      [4, 4, 4],
      'lookup diagnostics retain one four-word statistics block per left batch'
    );
    testContext.deepEqual(await readLuJoinChunks(compiled.contractViolation), [[0]]);
  } finally {
    compiled.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  testContext.end();
});

test('LuDataFrame left outer joins retain nullable and unmatched left rows with explicit right validity', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuJoinFixture(device);
  const compiled = fixture.left
    .leftJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-left-outer-join'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-left-outer-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.equal(compiled.joinType, 'left');
    testContext.deepEqual(await readLuJoinChunks(compiled.requiredCounts), [[3], [0], [5]]);
    testContext.deepEqual(await readLuJoinChunks(compiled.selectedCounts), [[3], [0], [5]]);
    testContext.deepEqual(
      await readLuJoinPublishedRows(compiled.rowIndices, compiled.selectedCounts),
      [[100, 101, 102], [], [800, 801, 802, 803, 804]],
      'selected unmatched and nullable left keys retain their stable source identities'
    );
    testContext.deepEqual(
      await readLuJoinPublishedRows(compiled.rightRowIndices, compiled.selectedCounts),
      [[501, MISSING_JOIN_ROW, 500], [], [900, MISSING_JOIN_ROW, 901, 500, MISSING_JOIN_ROW]],
      'outer joins publish an explicit missing marker without inventing a right row'
    );
    testContext.deepEqual(
      await readLuJoinPublishedRows(compiled.rightValidity, compiled.selectedCounts),
      [[1, 0, 1], [], [1, 0, 1, 1, 0]],
      'right-side nullability remains explicit and aligned with compacted output pairs'
    );
  } finally {
    compiled.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  testContext.end();
});

test('LuDataFrame semi and anti joins stably partition selected matches and nullable nonmatches', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuJoinFixture(device);
  const semi = fixture.left
    .semiJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-semi-join'}));
  const anti = fixture.left
    .antiJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-anti-join'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-semi-and-anti'});
    semi.encode(commandEncoder);
    anti.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.equal(semi.joinType, 'semi');
    testContext.equal(anti.joinType, 'anti');
    testContext.deepEqual(await readLuJoinChunks(semi.selectedCounts), [[2], [0], [3]]);
    testContext.deepEqual(await readLuJoinPublishedRows(semi.rowIndices, semi.selectedCounts), [
      [100, 102],
      [],
      [800, 802, 803]
    ]);
    testContext.deepEqual(await readLuJoinPublishedRows(semi.rightValidity, semi.selectedCounts), [
      [1, 1],
      [],
      [1, 1, 1]
    ]);
    testContext.deepEqual(await readLuJoinChunks(anti.requiredCounts), [[1], [0], [2]]);
    testContext.deepEqual(
      await readLuJoinPublishedRows(anti.rowIndices, anti.selectedCounts),
      [[101], [], [801, 804]],
      'anti joins include selected nullable left keys as unmatched rows'
    );
    testContext.deepEqual(
      await readLuJoinPublishedRows(anti.rightRowIndices, anti.selectedCounts),
      [[MISSING_JOIN_ROW], [], [MISSING_JOIN_ROW, MISSING_JOIN_ROW]]
    );
    testContext.deepEqual(await readLuJoinPublishedRows(anti.rightValidity, anti.selectedCounts), [
      [0],
      [],
      [0, 0]
    ]);
  } finally {
    semi.destroy();
    anti.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  testContext.end();
});

test('LuDataFrame outer and anti joins respect filters, bounded capacity, and invalid-index suppression', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuJoinFixture(device);
  const duplicateFixture = createLuJoinFixture(device, {duplicateRight: true});
  const bounded = fixture.left
    .filter(column('fare').greaterThan(parameter('minimumFare', 10)))
    .leftJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey', capacity: 2})
    .compile(new GPUCommandGraph(device, {id: 'ludf-filtered-bounded-left-join'}));
  const invalidOuter = duplicateFixture.left
    .leftJoin(duplicateFixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-invalid-left-join'}));
  const invalidAnti = duplicateFixture.left
    .antiJoin(duplicateFixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-invalid-anti-join'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-richer-join-contracts'});
    bounded.encode(commandEncoder, {minimumFare: 10});
    invalidOuter.encode(commandEncoder);
    invalidAnti.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(await readLuJoinChunks(bounded.requiredCounts), [[2], [0], [4]]);
    testContext.deepEqual(await readLuJoinChunks(bounded.selectedCounts), [[2], [0], [2]]);
    testContext.deepEqual(await readLuJoinChunks(bounded.overflows), [[0], [0], [1]]);
    testContext.deepEqual(
      await readLuJoinPublishedRows(bounded.rowIndices, bounded.selectedCounts),
      [[100, 102], [], [801, 802]],
      'capacity truncates the stable filtered left prefix independently per source batch'
    );
    testContext.deepEqual(
      await readLuJoinPublishedRows(bounded.rightValidity, bounded.selectedCounts),
      [[1, 1], [], [0, 1]],
      'nullable unmatched rows remain distinguishable after bounded publication'
    );

    for (const compiled of [invalidOuter, invalidAnti]) {
      testContext.deepEqual(await readLuJoinChunks(compiled.contractViolation), [[1]]);
      testContext.deepEqual(
        await readLuJoinChunks(compiled.selectedCounts),
        [[0], [0], [0]],
        'invalid unique-right indexes never turn into fabricated outer or anti matches'
      );
    }
  } finally {
    bounded.destroy();
    invalidOuter.destroy();
    invalidAnti.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
    duplicateFixture.left.destroy();
    duplicateFixture.right.destroy();
  }

  testContext.end();
});

test('LuDataFrame reuses filtered joins across two ordered encodings without reading source rows', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuJoinFixture(device);
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-parameterized-inner-join'
  });
  const compiled = fixture.left
    .filter(column('fare').greaterThan(parameter('minimumFare', 0)))
    .innerJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(graph);
  const firstCounts = compiled.selectedCounts.data.map((_, batchIndex) =>
    device.createBuffer({
      id: `ludf-first-join-count-${batchIndex}`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    })
  );

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-join-two-encodes'});
    compiled.encode(commandEncoder, {minimumFare: 10});
    for (const [batchIndex, count] of compiled.selectedCounts.data.entries()) {
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: getLuJoinBuffer(count),
        destinationBuffer: firstCounts[batchIndex],
        size: Uint32Array.BYTES_PER_ELEMENT
      });
    }
    compiled.encode(commandEncoder, {minimumFare: 35});
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await Promise.all(firstCounts.map(buffer => readLuJoinBuffer(buffer, 1))),
      [[2], [0], [2]],
      'the first encoder-ordered parameter update retains matching filtered rows per batch'
    );
    testContext.deepEqual(
      await readLuJoinChunks(compiled.selectedCounts),
      [[0], [0], [1]],
      'the second update reuses the same index and graph with a stricter source predicate'
    );
    testContext.deepEqual(
      await readLuJoinPublishedRows(compiled.rowIndices, compiled.selectedCounts),
      [[], [], [802]],
      'reused joins publish only the final matching stable left row'
    );
    testContext.deepEqual(
      await readLuJoinPublishedRows(compiled.rightRowIndices, compiled.selectedCounts),
      [[], [], [901]],
      'reused joins retain the corresponding stable right source identity'
    );
  } finally {
    for (const buffer of firstCounts) buffer.destroy();
    compiled.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  testContext.end();
});

test('LuDataFrame reports bounded join overflow and suppresses duplicate, reserved-key, and incomplete right indexes', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const boundedFixture = createLuJoinFixture(device);
  const duplicateFixture = createLuJoinFixture(device, {duplicateRight: true});
  const invalidFixture = createLuJoinFixture(device, {invalidRight: true});
  const incompleteFixture = createLuJoinFixture(device);

  const bounded = boundedFixture.left
    .innerJoin(boundedFixture.right, {leftOn: 'key', rightOn: 'lookupKey', capacity: 1})
    .compile(new GPUCommandGraph(device, {id: 'ludf-bounded-join'}));
  const duplicate = duplicateFixture.left
    .innerJoin(duplicateFixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-duplicate-join'}));
  const invalid = invalidFixture.left
    .innerJoin(invalidFixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-invalid-join'}));
  const incomplete = incompleteFixture.left
    .innerJoin(incompleteFixture.right, {
      leftOn: 'key',
      rightOn: 'lookupKey',
      indexCapacity: 2,
      maxProbeCount: 2
    })
    .compile(new GPUCommandGraph(device, {id: 'ludf-incomplete-join'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-join-contracts'});
    bounded.encode(commandEncoder);
    duplicate.encode(commandEncoder);
    invalid.encode(commandEncoder);
    incomplete.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(await readLuJoinChunks(bounded.requiredCounts), [[2], [0], [3]]);
    testContext.deepEqual(await readLuJoinChunks(bounded.selectedCounts), [[1], [0], [1]]);
    testContext.deepEqual(await readLuJoinChunks(bounded.overflows), [[1], [0], [1]]);
    testContext.deepEqual(
      await readLuJoinPublishedRows(bounded.rowIndices, bounded.selectedCounts),
      [[100], [], [800]],
      'bounded batches publish their earliest stable matching left row'
    );
    testContext.deepEqual(
      await readLuJoinPublishedRows(bounded.rightRowIndices, bounded.selectedCounts),
      [[501], [], [900]],
      'bounded partner outputs remain aligned with the published left rows'
    );

    for (const [compiled, statisticIndex, label] of [
      [duplicate, 1, 'duplicate right keys'],
      [invalid, 3, 'reserved valid right keys'],
      [incomplete, 2, 'incomplete right indexes']
    ] as const) {
      testContext.ok(
        (await readLuJoinChunks(compiled.indexStatistics))[0][statisticIndex] > 0,
        `${label} remain visible in GPU-resident index diagnostics`
      );
      testContext.deepEqual(
        await readLuJoinChunks(compiled.contractViolation),
        [[1]],
        `${label} raise an explicit GPU contract violation`
      );
      testContext.deepEqual(
        await readLuJoinChunks(compiled.selectedCounts),
        [[0], [0], [0]],
        `${label} never publish potentially incorrect join matches`
      );
    }
  } finally {
    bounded.destroy();
    duplicate.destroy();
    invalid.destroy();
    incomplete.destroy();
    for (const fixture of [boundedFixture, duplicateFixture, invalidFixture, incompleteFixture]) {
      fixture.left.destroy();
      fixture.right.destroy();
    }
  }

  testContext.end();
});

test('LuDataFrame joins and lookups preserve empty left chunks against a schema-only right source', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuJoinFixture(device, {noRightBatches: true});
  const join = fixture.left
    .innerJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-empty-right-join'}));
  const lookup = fixture.left
    .lookup(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'ludf-empty-right-lookup'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-empty-right-queries'});
    join.encode(commandEncoder);
    lookup.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(join.rightTable.batches, [], 'no right batches are fabricated');
    testContext.deepEqual(await readLuJoinChunks(join.selectedCounts), [[0], [0], [0]]);
    testContext.deepEqual(await readLuJoinChunks(join.requiredCounts), [[0], [0], [0]]);
    testContext.deepEqual(
      await readLuJoinChunks(lookup.matchMask),
      [[0, 0, 0], [], [0, 0, 0, 0, 0]],
      'empty right indexes leave every preserved left row unmatched'
    );
    testContext.deepEqual(
      (await readLuJoinChunks(join.indexStatistics))[0].slice(0, 4),
      [0, 0, 0, 0],
      'empty right sources clear index statistics without reading data back'
    );
  } finally {
    join.destroy();
    lookup.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  testContext.end();
});

function createLuJoinFixture(device: Device, options: LuJoinFixtureOptions = {}): LuJoinFixture {
  const leftBuffers: Buffer[] = [];
  const rightBuffers: Buffer[] = [];
  const leftKeys = [
    Uint32Array.from([70, 1, 20]),
    new Uint32Array(0),
    Uint32Array.from([40, 70, 90, 20, MISSING_JOIN_ROW])
  ];
  const fares = [
    Float32Array.from([30, 2, 12]),
    new Float32Array(0),
    Float32Array.from([6, 40, 50, 11, 99])
  ];
  const leftValidity = [
    Uint32Array.from([1, 1, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 0, 1, 1, 0])
  ];
  const leftOffsets = [100, 400, 800];
  const leftValidityData: GPUData<'uint32'>[] = [];
  const leftBatches = leftKeys.map((keys, batchIndex) => {
    leftValidityData.push(
      createLuJoinData(device, leftBuffers, leftValidity[batchIndex], 'uint32')
    );
    return new GPURecordBatch<LuJoinLeftSchema>({
      gpuData: {
        key: createLuJoinData(device, leftBuffers, keys, 'uint32'),
        fare: createLuJoinData(device, leftBuffers, fares[batchIndex], 'float32')
      },
      fields: [
        {name: 'key', format: 'uint32', nullable: true},
        {name: 'fare', format: 'float32', nullable: false}
      ],
      sourceInfo: {
        sourceBatchIndex: batchIndex,
        sourceRowIndexOffset: leftOffsets[batchIndex],
        sourceRowCount: keys.length
      }
    });
  });

  const rightKeys = options.noRightBatches
    ? []
    : [
        Uint32Array.from([20, 70]),
        new Uint32Array(0),
        Uint32Array.from([options.duplicateRight ? 20 : 40, 90, MISSING_JOIN_ROW])
      ];
  const rightValidity = options.noRightBatches
    ? []
    : [
        Uint32Array.from([1, 1]),
        new Uint32Array(0),
        Uint32Array.from([1, 1, options.invalidRight ? 1 : 0])
      ];
  const rightOffsets = [500, 750, 900];
  const rightValidityData: GPUData<'uint32'>[] = [];
  const rightBatches = rightKeys.map((keys, batchIndex) => {
    rightValidityData.push(
      createLuJoinData(device, rightBuffers, rightValidity[batchIndex], 'uint32')
    );
    return new GPURecordBatch<LuJoinRightSchema>({
      gpuData: {
        lookupKey: createLuJoinData(device, rightBuffers, keys, 'uint32'),
        weight: createLuJoinData(
          device,
          rightBuffers,
          Float32Array.from(keys, (_, index) => batchIndex * 10 + index),
          'float32'
        )
      },
      fields: [
        {name: 'lookupKey', format: 'uint32', nullable: true},
        {name: 'weight', format: 'float32', nullable: false}
      ],
      sourceInfo: {
        sourceBatchIndex: batchIndex + 10,
        sourceRowIndexOffset: rightOffsets[batchIndex],
        sourceRowCount: keys.length
      }
    });
  });

  const rightTable =
    rightBatches.length > 0
      ? new GPUTable<LuJoinRightSchema>({batches: rightBatches})
      : new GPUTable<LuJoinRightSchema>({
          schema: {
            fields: [
              {name: 'lookupKey', format: 'uint32', nullable: true},
              {name: 'weight', format: 'float32', nullable: false}
            ]
          },
          bufferLayout: [
            {name: 'lookupKey', format: 'uint32', byteStride: 4},
            {name: 'weight', format: 'float32', byteStride: 4}
          ]
        });

  return {
    left: new LuDataFrame<LuJoinLeftSchema>({
      table: new GPUTable<LuJoinLeftSchema>({batches: leftBatches}),
      validity: {
        key: new GPUVector<'uint32'>({
          type: 'data',
          name: 'ludf-left-join-validity',
          format: 'uint32',
          data: leftValidityData,
          ownsData: true
        })
      },
      ownership: 'owned'
    }),
    right: new LuDataFrame<LuJoinRightSchema>({
      table: rightTable,
      ...(rightValidityData.length > 0
        ? {
            validity: {
              lookupKey: new GPUVector<'uint32'>({
                type: 'data',
                name: 'ludf-right-join-validity',
                format: 'uint32',
                data: rightValidityData,
                ownsData: true
              })
            }
          }
        : {}),
      ownership: 'owned'
    }),
    leftBuffers,
    rightBuffers
  };
}

function createLuJoinData<Format extends 'float32' | 'uint32'>(
  device: Device,
  sourceBuffers: Buffer[],
  values: Float32Array | Uint32Array,
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

function getLuJoinBuffer(data: GPUData): Buffer {
  return data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
}

async function readLuJoinBuffer(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) return [];
  const bytes = await buffer.readAsync(0, length * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readLuJoinChunks(vector: GPUVector<'uint32'>): Promise<number[][]> {
  return Promise.all(
    vector.data.map(chunk => readLuJoinBuffer(getLuJoinBuffer(chunk), chunk.length))
  );
}

async function readLuJoinPublishedRows(
  rows: GPUVector<'uint32'>,
  counts: GPUVector<'uint32'>
): Promise<number[][]> {
  const publishedCounts = await readLuJoinChunks(counts);
  return Promise.all(
    rows.data.map((chunk, batchIndex) =>
      readLuJoinBuffer(getLuJoinBuffer(chunk), publishedCounts[batchIndex][0] ?? 0)
    )
  );
}
