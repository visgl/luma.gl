// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUDataFrame,
  column,
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {vi} from 'vitest';

const MISSING_JOIN_ROW = 0xffffffff;

type GPUJoinLeftSchema = {key: 'uint32'; fare: 'float32'};
type GPUJoinRightSchema = {lookupKey: 'uint32'; weight: 'float32'};

type GPUJoinFixture = {
  left: GPUDataFrame<GPUJoinLeftSchema>;
  right: GPUDataFrame<GPUJoinRightSchema>;
  leftBuffers: Buffer[];
  rightBuffers: Buffer[];
};

type GPUJoinFixtureOptions = {
  duplicateRight?: boolean;
  invalidRight?: boolean;
  noRightBatches?: boolean;
};

it('GPUDataFrame inner joins preserve mismatched nullable batches, stable row identities, and both source leases', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUJoinFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');
  const query = fixture.left.innerJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'});

  expect(createBufferSpy.mock.calls.length, 'join planning allocates no GPU buffers').toBe(0);
  expect(submitSpy.mock.calls.length, 'join planning submits no GPU work').toBe(0);

  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-mismatched-batch-inner-join'
  });
  const compiled = query.compile(graph);

  try {
    expect(
      compiled.table.batches.map(batch => batch.numRows),
      'joined output retains the original left record batches'
    ).toEqual([3, 0, 5]);
    expect(
      compiled.rightTable.batches.map(batch => batch.numRows),
      'the retained right side preserves its independent source topology'
    ).toEqual([2, 0, 3]);

    fixture.left.destroy();
    fixture.right.destroy();
    expect(
      Boolean([...fixture.leftBuffers, ...fixture.rightBuffers].every(buffer => !buffer.destroyed)),
      'compiled joins retain both owned source leases'
    ).toBe(true);

    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-inner-join-encode'});
    compiled.encode(commandEncoder);
    expect(submitSpy.mock.calls.length, 'encoding leaves submission application-owned').toBe(0);
    device.submit(commandEncoder.finish());

    expect(
      await readGPUJoinChunks(compiled.requiredCounts),
      'required matches are counted independently per left batch'
    ).toEqual([[2], [0], [3]]);
    expect(
      await readGPUJoinChunks(compiled.selectedCounts),
      'published counts remain coherent with inherited stable row indices'
    ).toEqual([[2], [0], [3]]);
    expect(await readGPUJoinChunks(compiled.overflows), '').toEqual([[0], [0], [0]]);
    expect(
      await readGPUJoinPublishedRows(compiled.rowIndices, compiled.selectedCounts),
      'left source identifiers retain discontinuous sourceInfo offsets and stable match order'
    ).toEqual([[100, 102], [], [800, 802, 803]]);
    expect(
      await readGPUJoinPublishedRows(compiled.rightRowIndices, compiled.selectedCounts),
      'right identities resolve across multiple batches without concatenating or repacking'
    ).toEqual([[501, 500], [], [900, 901, 500]]);
    expect(
      (await readGPUJoinChunks(compiled.indexStatistics))[0].slice(0, 4),
      'ordinary nullable right rows are skipped without becoming reserved-key violations'
    ).toEqual([4, 0, 0, 0]);
    expect(await readGPUJoinChunks(compiled.contractViolation), '').toEqual([[0]]);

    compiled.destroy();
    expect(
      Boolean([...fixture.leftBuffers, ...fixture.rightBuffers].every(buffer => buffer.destroyed)),
      'both owned sources are destroyed only after the compiled join is released'
    ).toBe(true);
  } finally {
    compiled.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  void 0;
});

it('GPUDataFrame bounded lookups keep source-aligned matches, nullable keys, and missing markers on the GPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUJoinFixture(device);
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-source-aligned-lookup'
  });
  const compiled = fixture.left
    .lookup(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-lookup-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(
      await readGPUJoinChunks(compiled.matchMask),
      'missing and explicitly null left keys never report a match'
    ).toEqual([[1, 0, 1], [], [1, 0, 1, 1, 0]]);
    expect(
      await readGPUJoinChunks(compiled.rightRowIndices),
      'bounded lookups retain source-aligned stable right identities and explicit missing markers'
    ).toEqual([
      [501, MISSING_JOIN_ROW, 500],
      [],
      [900, MISSING_JOIN_ROW, 901, 500, MISSING_JOIN_ROW]
    ]);
    expect(
      compiled.probeCounts.data.map(chunk => chunk.length),
      'probe counts preserve the original left chunk topology'
    ).toEqual([3, 0, 5]);
    expect(
      compiled.lookupStatistics.data.map(chunk => chunk.length),
      'lookup diagnostics retain one four-word statistics block per left batch'
    ).toEqual([4, 4, 4]);
    expect(await readGPUJoinChunks(compiled.contractViolation), '').toEqual([[0]]);
  } finally {
    compiled.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  void 0;
});

it('GPUDataFrame left outer joins retain nullable and unmatched left rows with explicit right validity', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUJoinFixture(device);
  const compiled = fixture.left
    .leftJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-left-outer-join'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-left-outer-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(compiled.joinType, '').toBe('left');
    expect(await readGPUJoinChunks(compiled.requiredCounts), '').toEqual([[3], [0], [5]]);
    expect(await readGPUJoinChunks(compiled.selectedCounts), '').toEqual([[3], [0], [5]]);
    expect(
      await readGPUJoinPublishedRows(compiled.rowIndices, compiled.selectedCounts),
      'selected unmatched and nullable left keys retain their stable source identities'
    ).toEqual([[100, 101, 102], [], [800, 801, 802, 803, 804]]);
    expect(
      await readGPUJoinPublishedRows(compiled.rightRowIndices, compiled.selectedCounts),
      'outer joins publish an explicit missing marker without inventing a right row'
    ).toEqual([
      [501, MISSING_JOIN_ROW, 500],
      [],
      [900, MISSING_JOIN_ROW, 901, 500, MISSING_JOIN_ROW]
    ]);
    expect(
      await readGPUJoinPublishedRows(compiled.rightValidity, compiled.selectedCounts),
      'right-side nullability remains explicit and aligned with compacted output pairs'
    ).toEqual([[1, 0, 1], [], [1, 0, 1, 1, 0]]);
  } finally {
    compiled.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  void 0;
});

it('GPUDataFrame semi and anti joins stably partition selected matches and nullable nonmatches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUJoinFixture(device);
  const semi = fixture.left
    .semiJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-semi-join'}));
  const anti = fixture.left
    .antiJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-anti-join'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-semi-and-anti'});
    semi.encode(commandEncoder);
    anti.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(semi.joinType, '').toBe('semi');
    expect(anti.joinType, '').toBe('anti');
    expect(await readGPUJoinChunks(semi.selectedCounts), '').toEqual([[2], [0], [3]]);
    expect(await readGPUJoinPublishedRows(semi.rowIndices, semi.selectedCounts), '').toEqual([
      [100, 102],
      [],
      [800, 802, 803]
    ]);
    expect(await readGPUJoinPublishedRows(semi.rightValidity, semi.selectedCounts), '').toEqual([
      [1, 1],
      [],
      [1, 1, 1]
    ]);
    expect(await readGPUJoinChunks(anti.requiredCounts), '').toEqual([[1], [0], [2]]);
    expect(
      await readGPUJoinPublishedRows(anti.rowIndices, anti.selectedCounts),
      'anti joins include selected nullable left keys as unmatched rows'
    ).toEqual([[101], [], [801, 804]]);
    expect(await readGPUJoinPublishedRows(anti.rightRowIndices, anti.selectedCounts), '').toEqual([
      [MISSING_JOIN_ROW],
      [],
      [MISSING_JOIN_ROW, MISSING_JOIN_ROW]
    ]);
    expect(await readGPUJoinPublishedRows(anti.rightValidity, anti.selectedCounts), '').toEqual([
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

  void 0;
});

it('GPUDataFrame outer and anti joins respect filters, bounded capacity, and invalid-index suppression', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUJoinFixture(device);
  const duplicateFixture = createGPUJoinFixture(device, {duplicateRight: true});
  const bounded = fixture.left
    .filter(column('fare').greaterThan(parameter('minimumFare', 10)))
    .leftJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey', capacity: 2})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-filtered-bounded-left-join'}));
  const invalidOuter = duplicateFixture.left
    .leftJoin(duplicateFixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-invalid-left-join'}));
  const invalidAnti = duplicateFixture.left
    .antiJoin(duplicateFixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-invalid-anti-join'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-richer-join-contracts'});
    bounded.encode(commandEncoder, {minimumFare: 10});
    invalidOuter.encode(commandEncoder);
    invalidAnti.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(await readGPUJoinChunks(bounded.requiredCounts), '').toEqual([[2], [0], [4]]);
    expect(await readGPUJoinChunks(bounded.selectedCounts), '').toEqual([[2], [0], [2]]);
    expect(await readGPUJoinChunks(bounded.overflows), '').toEqual([[0], [0], [1]]);
    expect(
      await readGPUJoinPublishedRows(bounded.rowIndices, bounded.selectedCounts),
      'capacity truncates the stable filtered left prefix independently per source batch'
    ).toEqual([[100, 102], [], [801, 802]]);
    expect(
      await readGPUJoinPublishedRows(bounded.rightValidity, bounded.selectedCounts),
      'nullable unmatched rows remain distinguishable after bounded publication'
    ).toEqual([[1, 1], [], [0, 1]]);

    for (const compiled of [invalidOuter, invalidAnti]) {
      expect(await readGPUJoinChunks(compiled.contractViolation), '').toEqual([[1]]);
      expect(
        await readGPUJoinChunks(compiled.selectedCounts),
        'invalid unique-right indexes never turn into fabricated outer or anti matches'
      ).toEqual([[0], [0], [0]]);
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

  void 0;
});

it('GPUDataFrame reuses filtered joins across two ordered encodings without reading source rows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUJoinFixture(device);
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-parameterized-inner-join'
  });
  const compiled = fixture.left
    .filter(column('fare').greaterThan(parameter('minimumFare', 0)))
    .innerJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(graph);
  const firstCounts = compiled.selectedCounts.data.map((_, batchIndex) =>
    device.createBuffer({
      id: `gpu-dataframe-first-join-count-${batchIndex}`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    })
  );

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-join-two-encodes'});
    compiled.encode(commandEncoder, {minimumFare: 10});
    for (const [batchIndex, count] of compiled.selectedCounts.data.entries()) {
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: getGPUJoinBuffer(count),
        destinationBuffer: firstCounts[batchIndex],
        size: Uint32Array.BYTES_PER_ELEMENT
      });
    }
    compiled.encode(commandEncoder, {minimumFare: 35});
    device.submit(commandEncoder.finish());

    expect(
      await Promise.all(firstCounts.map(buffer => readGPUJoinBuffer(buffer, 1))),
      'the first encoder-ordered parameter update retains matching filtered rows per batch'
    ).toEqual([[2], [0], [2]]);
    expect(
      await readGPUJoinChunks(compiled.selectedCounts),
      'the second update reuses the same index and graph with a stricter source predicate'
    ).toEqual([[0], [0], [1]]);
    expect(
      await readGPUJoinPublishedRows(compiled.rowIndices, compiled.selectedCounts),
      'reused joins publish only the final matching stable left row'
    ).toEqual([[], [], [802]]);
    expect(
      await readGPUJoinPublishedRows(compiled.rightRowIndices, compiled.selectedCounts),
      'reused joins retain the corresponding stable right source identity'
    ).toEqual([[], [], [901]]);
  } finally {
    for (const buffer of firstCounts) buffer.destroy();
    compiled.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  void 0;
});

it('GPUDataFrame reports bounded join overflow and suppresses duplicate, reserved-key, and incomplete right indexes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const boundedFixture = createGPUJoinFixture(device);
  const duplicateFixture = createGPUJoinFixture(device, {duplicateRight: true});
  const invalidFixture = createGPUJoinFixture(device, {invalidRight: true});
  const incompleteFixture = createGPUJoinFixture(device);

  const bounded = boundedFixture.left
    .innerJoin(boundedFixture.right, {leftOn: 'key', rightOn: 'lookupKey', capacity: 1})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-bounded-join'}));
  const duplicate = duplicateFixture.left
    .innerJoin(duplicateFixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-duplicate-join'}));
  const invalid = invalidFixture.left
    .innerJoin(invalidFixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-invalid-join'}));
  const incomplete = incompleteFixture.left
    .innerJoin(incompleteFixture.right, {
      leftOn: 'key',
      rightOn: 'lookupKey',
      indexCapacity: 2,
      maxProbeCount: 2
    })
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-incomplete-join'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-join-contracts'});
    bounded.encode(commandEncoder);
    duplicate.encode(commandEncoder);
    invalid.encode(commandEncoder);
    incomplete.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(await readGPUJoinChunks(bounded.requiredCounts), '').toEqual([[2], [0], [3]]);
    expect(await readGPUJoinChunks(bounded.selectedCounts), '').toEqual([[1], [0], [1]]);
    expect(await readGPUJoinChunks(bounded.overflows), '').toEqual([[1], [0], [1]]);
    expect(
      await readGPUJoinPublishedRows(bounded.rowIndices, bounded.selectedCounts),
      'bounded batches publish their earliest stable matching left row'
    ).toEqual([[100], [], [800]]);
    expect(
      await readGPUJoinPublishedRows(bounded.rightRowIndices, bounded.selectedCounts),
      'bounded partner outputs remain aligned with the published left rows'
    ).toEqual([[501], [], [900]]);

    for (const [compiled, statisticIndex, label] of [
      [duplicate, 1, 'duplicate right keys'],
      [invalid, 3, 'reserved valid right keys'],
      [incomplete, 2, 'incomplete right indexes']
    ] as const) {
      expect(
        Boolean((await readGPUJoinChunks(compiled.indexStatistics))[0][statisticIndex] > 0),
        `${label} remain visible in GPU-resident index diagnostics`
      ).toBe(true);
      expect(
        await readGPUJoinChunks(compiled.contractViolation),
        `${label} raise an explicit GPU contract violation`
      ).toEqual([[1]]);
      expect(
        await readGPUJoinChunks(compiled.selectedCounts),
        `${label} never publish potentially incorrect join matches`
      ).toEqual([[0], [0], [0]]);
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

  void 0;
});

it('GPUDataFrame joins and lookups preserve empty left chunks against a schema-only right source', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUJoinFixture(device, {noRightBatches: true});
  const join = fixture.left
    .innerJoin(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-empty-right-join'}));
  const lookup = fixture.left
    .lookup(fixture.right, {leftOn: 'key', rightOn: 'lookupKey'})
    .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-empty-right-lookup'}));

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-empty-right-queries'});
    join.encode(commandEncoder);
    lookup.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(join.rightTable.batches, 'no right batches are fabricated').toEqual([]);
    expect(await readGPUJoinChunks(join.selectedCounts), '').toEqual([[0], [0], [0]]);
    expect(await readGPUJoinChunks(join.requiredCounts), '').toEqual([[0], [0], [0]]);
    expect(
      await readGPUJoinChunks(lookup.matchMask),
      'empty right indexes leave every preserved left row unmatched'
    ).toEqual([[0, 0, 0], [], [0, 0, 0, 0, 0]]);
    expect(
      (await readGPUJoinChunks(join.indexStatistics))[0].slice(0, 4),
      'empty right sources clear index statistics without reading data back'
    ).toEqual([0, 0, 0, 0]);
  } finally {
    join.destroy();
    lookup.destroy();
    fixture.left.destroy();
    fixture.right.destroy();
  }

  void 0;
});

function createGPUJoinFixture(device: Device, options: GPUJoinFixtureOptions = {}): GPUJoinFixture {
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
      createGPUJoinData(device, leftBuffers, leftValidity[batchIndex], 'uint32')
    );
    return new GPURecordBatch<GPUJoinLeftSchema>({
      gpuData: {
        key: createGPUJoinData(device, leftBuffers, keys, 'uint32'),
        fare: createGPUJoinData(device, leftBuffers, fares[batchIndex], 'float32')
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
      createGPUJoinData(device, rightBuffers, rightValidity[batchIndex], 'uint32')
    );
    return new GPURecordBatch<GPUJoinRightSchema>({
      gpuData: {
        lookupKey: createGPUJoinData(device, rightBuffers, keys, 'uint32'),
        weight: createGPUJoinData(
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
      ? new GPUTable<GPUJoinRightSchema>({batches: rightBatches})
      : new GPUTable<GPUJoinRightSchema>({
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
    left: new GPUDataFrame<GPUJoinLeftSchema>({
      table: new GPUTable<GPUJoinLeftSchema>({batches: leftBatches}),
      validity: {
        key: new GPUVector<'uint32'>({
          type: 'data',
          name: 'gpu-dataframe-left-join-validity',
          format: 'uint32',
          data: leftValidityData,
          ownsData: true
        })
      },
      ownership: 'owned'
    }),
    right: new GPUDataFrame<GPUJoinRightSchema>({
      table: rightTable,
      ...(rightValidityData.length > 0
        ? {
            validity: {
              lookupKey: new GPUVector<'uint32'>({
                type: 'data',
                name: 'gpu-dataframe-right-join-validity',
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

function createGPUJoinData<Format extends 'float32' | 'uint32'>(
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

function getGPUJoinBuffer(data: GPUData): Buffer {
  return data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
}

async function readGPUJoinBuffer(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) return [];
  const bytes = await buffer.readAsync(0, length * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readGPUJoinChunks(vector: GPUVector<'uint32'>): Promise<number[][]> {
  return Promise.all(
    vector.data.map(chunk => readGPUJoinBuffer(getGPUJoinBuffer(chunk), chunk.length))
  );
}

async function readGPUJoinPublishedRows(
  rows: GPUVector<'uint32'>,
  counts: GPUVector<'uint32'>
): Promise<number[][]> {
  const publishedCounts = await readGPUJoinChunks(counts);
  return Promise.all(
    rows.data.map((chunk, batchIndex) =>
      readGPUJoinBuffer(getGPUJoinBuffer(chunk), publishedCounts[batchIndex][0] ?? 0)
    )
  );
}
