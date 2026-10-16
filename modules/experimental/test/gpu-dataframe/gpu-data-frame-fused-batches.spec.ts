// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type DeviceLimits} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUDataFrame,
  column,
  literal,
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

type FusedSchema = {fare: 'float32'; category: 'uint32'};

// Unaligned sizes, an empty batch, and a multi-workgroup batch exercise every fused boundary.
const BATCH_ROW_COUNTS = [3, 0, 700, 5, 300, 0];
// Stable source-row IDs with a gap, so batch-local IDs cannot be derived from fused row indices.
const SOURCE_ROW_STARTS = [100, 103, 103, 5000, 5005, 5305];
// Leading rows before the first batch, so the shared buffer does not start at the first row.
const LEADING_ROW_COUNT = 7;

/**
 * How batch chunks map onto buffers: one shared buffer, one buffer per batch, two shared runs,
 * or shared values and categories with separate validity chunks.
 */
type FusedFixtureLayout = 'shared' | 'separate' | 'mixed' | 'shared-values';
type ColumnLayout = 'shared' | 'separate' | 'mixed';

type FusedFixture = {
  frame: GPUDataFrame<FusedSchema>;
  fares: number[][];
  categories: number[][];
  fareValidity: number[][];
  buffers: Buffer[];
};

it('GPUDataFrame fuses contiguous shared-buffer batches without changing per-batch outputs', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }

  const shared = createFusedFixture(device, 'shared');
  const separate = createFusedFixture(device, 'separate');
  const sharedGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-fused-shared'
  });
  const separateGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-fused-separate'
  });
  const predicate = column('fare').greaterThan(parameter('cut', 0));
  const sharedQuery = shared.frame.filter(predicate).compile(sharedGraph);
  const separateQuery = separate.frame.filter(predicate).compile(separateGraph);

  try {
    expect(
      new Set(sharedQuery.selectionMask.data.map(chunk => chunk.buffer)).size,
      'contiguous inputs publish one packed buffer; the trailing empty batch keeps its own'
    ).toBe(2);
    expect(
      sharedQuery.selectionMask.data.map(chunk => chunk.byteOffset),
      'packed chunks keep exact byte offsets in batch order'
    ).toEqual([0, 12, 12, 2812, 2832, 0]);
    expect(
      new Set(separateQuery.selectionMask.data.map(chunk => chunk.buffer)).size,
      'independent input buffers keep independent per-batch outputs'
    ).toBe(BATCH_ROW_COUNTS.length);
    expect(
      sharedQuery.selectionMask.data.map(chunk => chunk.length),
      'packed masks preserve source batch topology'
    ).toEqual(BATCH_ROW_COUNTS);
    expect(
      sharedQuery.selectedCounts.data.map(chunk => chunk.length),
      'packed counts keep one row per source batch'
    ).toEqual(BATCH_ROW_COUNTS.map(() => 1));

    for (const cut of [40, 75]) {
      const commandEncoder = device.createCommandEncoder({id: `gpu-dataframe-fused-${cut}`});
      sharedQuery.encode(commandEncoder, {cut});
      separateQuery.encode(commandEncoder, {cut});
      device.submit(commandEncoder.finish());

      const expected = getExpectedSelection(
        shared,
        (fare, _category, valid) => valid && fare > cut
      );
      const sharedResult = await readSelection(sharedQuery);
      expect(sharedResult.masks, `fused masks match the CPU reference for cut ${cut}`).toEqual(
        expected.masks
      );
      expect(sharedResult.counts, `fused counts match the CPU reference for cut ${cut}`).toEqual(
        expected.counts
      );
      expect(
        sharedResult.rowIndices,
        `fused compaction publishes batch-local stable source IDs for cut ${cut}`
      ).toEqual(expected.rowIndices);
      expect(
        await readSelection(separateQuery),
        `fused and per-batch paths agree for cut ${cut}`
      ).toEqual(sharedResult);
    }

    const outputBuffers = [
      ...sharedQuery.selectionMask.data,
      ...sharedQuery.rowIndices.data,
      ...sharedQuery.selectedCounts.data
    ].map(chunk => chunk.buffer as Buffer);
    sharedQuery.destroy();
    expect(
      outputBuffers.every(buffer => buffer.destroyed),
      'destroying a fused query releases its packed outputs'
    ).toBe(true);
    expect(
      shared.buffers.every(buffer => !buffer.destroyed),
      'fused queries never destroy borrowed shared source buffers'
    ).toBe(true);
  } finally {
    sharedQuery.destroy();
    separateQuery.destroy();
    destroyFixture(shared);
    destroyFixture(separate);
  }
});

it('GPUDataFrame fuses derived columns and downstream aggregation over shared batches', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }

  const fixture = createFusedFixture(device, 'shared');
  const derivedGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-fused-derived'
  });
  const aggregateGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-fused-aggregate'
  });
  const derived = fixture.frame
    .withColumn('doubleFare', column('fare').multiply(literal(2)), {format: 'float32'})
    .filter(column('doubleFare').greaterThan(literal(100)))
    .select(['doubleFare', 'category'])
    .compile(derivedGraph);
  const aggregate = fixture.frame
    .filter(column('category').lessThan(literal(3)))
    .aggregate({rowCount: 'count', totalFare: {sum: 'fare'}})
    .compile(aggregateGraph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-fused-derived'});
    derived.encode(commandEncoder);
    aggregate.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    const derivedVector = derived.table.gpuVectors.doubleFare as GPUVector<'float32'>;
    expect(
      new Set(derivedVector.data.map(chunk => chunk.buffer)).size,
      'fused derived values are packed per-batch chunks plus the trailing empty batch'
    ).toBe(2);
    const derivedValues = await Promise.all(
      derivedVector.data.map(chunk => readChunk(chunk, Float32Array))
    );
    const derivedValidity = await Promise.all(
      (derived.validity.doubleFare as GPUVector<'uint32'>).data.map(chunk =>
        readChunk(chunk, Uint32Array)
      )
    );
    fixture.fares.forEach((fares, batchIndex) => {
      fares.forEach((fare, rowIndex) => {
        const valid = fixture.fareValidity[batchIndex][rowIndex] === 1;
        expect(derivedValidity[batchIndex][rowIndex], 'derived validity follows fare').toBe(
          valid ? 1 : 0
        );
        if (valid) {
          expect(derivedValues[batchIndex][rowIndex], 'derived values match fare * 2').toBe(
            Math.fround(fare * 2)
          );
        }
      });
    });
    const expected = getExpectedSelection(fixture, (fare, _category, valid) => valid && fare > 50);
    const result = await readSelection(derived);
    expect(result, 'filters over fused derived columns match the CPU reference').toEqual(expected);

    let expectedCount = 0;
    let expectedTotal = 0;
    fixture.categories.forEach((categories, batchIndex) => {
      categories.forEach((category, rowIndex) => {
        if (category < 3) {
          expectedCount++;
          if (fixture.fareValidity[batchIndex][rowIndex] === 1) {
            expectedTotal += fixture.fares[batchIndex][rowIndex];
          }
        }
      });
    });
    const rowCount = await readChunk(aggregate.table.gpuVectors.rowCount.data[0], Uint32Array);
    const totalFare = await readChunk(aggregate.table.gpuVectors.totalFare.data[0], Float32Array);
    expect(rowCount[0], 'aggregation consumes fused per-batch masks').toBe(expectedCount);
    expect(totalFare[0], 'aggregation sums over fused per-batch masks').toBeCloseTo(
      expectedTotal,
      0
    );
  } finally {
    derived.destroy();
    aggregate.destroy();
    destroyFixture(fixture);
  }
});

it('GPUDataFrame per-batch top-K over fused outputs matches the per-batch path', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }

  const shared = createFusedFixture(device, 'shared');
  const separate = createFusedFixture(device, 'separate');
  const compileTopK = (fixture: FusedFixture, id: string) =>
    fixture.frame
      .filter(column('category').greaterThan(literal(0)))
      .topK('fare', 4)
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id}));
  const sharedTopK = compileTopK(shared, 'gpu-dataframe-fused-top-k-shared');
  const separateTopK = compileTopK(separate, 'gpu-dataframe-fused-top-k-separate');

  try {
    expect(
      new Set(sharedTopK.rowIndices.data.map(chunk => chunk.buffer)).size,
      'top-K over shared inputs republishes packed row IDs plus the trailing empty batch'
    ).toBe(2);
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-fused-top-k'});
    sharedTopK.encode(commandEncoder);
    separateTopK.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    const sharedResult = await readSelection(sharedTopK);
    expect(sharedResult.counts, 'top-K clamps every fused batch independently').toEqual([
      2, 0, 4, 4, 4, 0
    ]);
    expect(
      sharedResult,
      'downstream per-batch passes read and rewrite packed outputs like independent ones'
    ).toEqual(await readSelection(separateTopK));
  } finally {
    sharedTopK.destroy();
    separateTopK.destroy();
    destroyFixture(shared);
    destroyFixture(separate);
  }
});

it('GPUDataFrame fuses each contiguous run and keeps per-batch passes where inputs diverge', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }

  const separate = createFusedFixture(device, 'separate');
  const mixed = createFusedFixture(device, 'mixed');
  const sharedValues = createFusedFixture(device, 'shared-values');
  const predicate = column('fare')
    .greaterThan(parameter('cut', 0))
    .and(column('category').notEqual(literal(2)));
  const compileFilter = (fixture: FusedFixture, id: string) =>
    fixture.frame
      .filter(predicate)
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id}));
  const separateQuery = compileFilter(separate, 'gpu-dataframe-fused-runs-separate');
  const mixedQuery = compileFilter(mixed, 'gpu-dataframe-fused-runs-mixed');
  const sharedValuesQuery = compileFilter(sharedValues, 'gpu-dataframe-fused-runs-shared-values');

  try {
    expect(
      getBufferCount(mixedQuery.selectionMask),
      'two contiguous input runs publish one packed buffer per run, plus the trailing empty batch'
    ).toBe(3);
    expect(getBufferCount(mixedQuery.selectedCounts), 'per-batch counts follow the same runs').toBe(
      3
    );
    expect(
      getBufferCount(sharedValuesQuery.selectionMask),
      'separate validity chunks keep every batch on the per-batch path'
    ).toBe(BATCH_ROW_COUNTS.length);

    for (const cut of [30, 80]) {
      const commandEncoder = device.createCommandEncoder({id: `gpu-dataframe-fused-runs-${cut}`});
      separateQuery.encode(commandEncoder, {cut});
      mixedQuery.encode(commandEncoder, {cut});
      sharedValuesQuery.encode(commandEncoder, {cut});
      device.submit(commandEncoder.finish());

      const expected = getExpectedSelection(
        separate,
        (fare, category, valid) => valid && fare > cut && category !== 2
      );
      expect(await readSelection(separateQuery), `per-batch reference for cut ${cut}`).toEqual(
        expected
      );
      expect(await readSelection(mixedQuery), `fused runs match for cut ${cut}`).toEqual(expected);
      expect(
        await readSelection(sharedValuesQuery),
        `partially contiguous inputs match for cut ${cut}`
      ).toEqual(expected);
    }
  } finally {
    separateQuery.destroy();
    mixedQuery.destroy();
    sharedValuesQuery.destroy();
    destroyFixture(separate);
    destroyFixture(mixed);
    destroyFixture(sharedValues);
  }
});

it('GPUDataFrame splits fused runs at the device storage-binding limit', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }

  const shared = createFusedFixture(device, 'shared');
  const separate = createFusedFixture(device, 'separate');
  const predicate = column('fare').greaterThan(parameter('cut', 0));
  // The fixture's batches start 28 bytes past an aligned offset, so a 3200-byte binding holds
  // (3200 - 28) / 4 = 793 rows: [3, 0, 700, 5] fuse and [300, 0] stay per batch.
  const limitedQuery = withDeviceLimits(device, {maxStorageBufferBindingSize: 3200}, () =>
    shared.frame.filter(predicate).compile(
      new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
        id: 'gpu-dataframe-fused-limited'
      })
    )
  );
  const separateQuery = separate.frame.filter(predicate).compile(
    new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
      id: 'gpu-dataframe-fused-limited-separate'
    })
  );

  try {
    expect(
      limitedQuery.selectionMask.data.map(
        chunk => chunk.buffer === limitedQuery.selectionMask.data[0].buffer
      ),
      'only the batches that fit one binding share a packed output buffer'
    ).toEqual([true, true, true, true, false, false]);
    expect(getBufferCount(limitedQuery.selectionMask), 'one fused run plus two batches').toBe(3);

    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-fused-limited'});
    limitedQuery.encode(commandEncoder, {cut: 60});
    separateQuery.encode(commandEncoder, {cut: 60});
    device.submit(commandEncoder.finish());

    const expected = getExpectedSelection(shared, (fare, _category, valid) => valid && fare > 60);
    expect(await readSelection(limitedQuery), 'split runs match the CPU reference').toEqual(
      expected
    );
    expect(await readSelection(separateQuery), 'split runs match the per-batch path').toEqual(
      expected
    );
  } finally {
    limitedQuery.destroy();
    separateQuery.destroy();
    destroyFixture(shared);
    destroyFixture(separate);
  }
});

it('GPUDataFrame bounds lookup buffers independently across many tiny batches', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }
  const buffers = Array.from({length: 2}, () =>
    device.createBuffer({
      usage: Buffer.STORAGE,
      data: new Float32Array(128).fill(1)
    })
  );
  const batches = buffers.flatMap(buffer =>
    Array.from(
      {length: 128},
      (_, index) =>
        new GPURecordBatch({
          gpuData: {
            value: new GPUData({buffer, format: 'float32', length: 1, byteOffset: index * 4})
          },
          fields: [{name: 'value', format: 'float32', nullable: false}]
        })
    )
  );
  const frame = new GPUDataFrame({table: new GPUTable({batches}), ownership: 'owned'});
  try {
    const query = withDeviceLimits(
      device,
      {maxBufferSize: 1024, maxStorageBufferBindingSize: 1024},
      () =>
        frame.filter(column('value').greaterThan(literal(0))).compile(new GPUCommandGraph(device))
    );
    try {
      const commandEncoder = device.createCommandEncoder();
      query.encode(commandEncoder);
      device.submit(commandEncoder.finish());
      const result = await readSelection(query);
      expect(result.counts).toEqual(Array(256).fill(1));
      expect(result.rowIndices).toEqual(Array.from({length: 256}, (_, index) => [index]));
      expect(getBufferCount(query.selectionMask)).toBe(4);
    } finally {
      query.destroy();
    }
  } finally {
    frame.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
});

/** Builds identical batches as contiguous views of shared buffers, separate buffers, or a mix. */
function createFusedFixture(device: Device, layout: FusedFixtureLayout): FusedFixture {
  const fares: number[][] = [];
  const categories: number[][] = [];
  const fareValidity: number[][] = [];
  let row = 0;
  for (const rowCount of BATCH_ROW_COUNTS) {
    const batchFares: number[] = [];
    const batchCategories: number[] = [];
    const batchValidity: number[] = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      batchFares.push((row * 37) % 101);
      batchCategories.push(row % 5);
      batchValidity.push(row % 11 === 0 ? 0 : 1);
      row++;
    }
    fares.push(batchFares);
    categories.push(batchCategories);
    fareValidity.push(batchValidity);
  }

  const buffers: Buffer[] = [];
  const createColumn = <Format extends 'float32' | 'uint32'>(
    name: string,
    values: number[][],
    format: Format,
    columnLayout: ColumnLayout
  ): GPUData<Format>[] => {
    const ArrayType = format === 'float32' ? Float32Array : Uint32Array;
    const data: GPUData<Format>[] = [];
    for (const [groupIndex, group] of getBatchGroups(columnLayout).entries()) {
      // Separate buffers start at the first row; shared buffers skip leading rows.
      const leadingRowCount = columnLayout === 'separate' ? 0 : LEADING_ROW_COUNT;
      const packed = ArrayType.from([
        ...new Array(leadingRowCount).fill(0),
        ...group.flatMap(batchIndex => values[batchIndex]),
        // Keeps empty separate batches from creating zero-length buffers.
        0
      ]);
      const buffer = device.createBuffer({
        id: `${name}-${groupIndex}`,
        byteLength: packed.byteLength,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
        data: packed
      });
      buffers.push(buffer);
      let rowOffset = leadingRowCount;
      for (const batchIndex of group) {
        data.push(
          new GPUData({
            buffer,
            format,
            length: values[batchIndex].length,
            byteOffset: rowOffset * 4,
            ownsBuffer: false
          })
        );
        rowOffset += values[batchIndex].length;
      }
    }
    return data;
  };

  const valueLayout = layout === 'shared-values' ? 'shared' : layout;
  const validityLayout = layout === 'shared-values' ? 'separate' : layout;
  const fareData = createColumn('fused-fare', fares, 'float32', valueLayout);
  const categoryData = createColumn('fused-category', categories, 'uint32', valueLayout);
  const validityData = createColumn('fused-fare-validity', fareValidity, 'uint32', validityLayout);
  const batches = BATCH_ROW_COUNTS.map(
    (rowCount, batchIndex) =>
      new GPURecordBatch<FusedSchema>({
        gpuData: {fare: fareData[batchIndex], category: categoryData[batchIndex]},
        fields: [
          {name: 'fare', format: 'float32', nullable: true},
          {name: 'category', format: 'uint32', nullable: false}
        ],
        sourceInfo: {
          sourceBatchIndex: batchIndex,
          sourceRowIndexOffset: SOURCE_ROW_STARTS[batchIndex],
          sourceRowCount: rowCount
        }
      })
  );
  return {
    frame: new GPUDataFrame<FusedSchema>({
      table: new GPUTable<FusedSchema>({batches}),
      validity: {
        fare: new GPUVector<'uint32'>({
          type: 'data',
          name: 'fused-fare-validity',
          format: 'uint32',
          data: validityData,
          ownsData: true
        })
      },
      ownership: 'owned'
    }),
    fares,
    categories,
    fareValidity,
    buffers
  };
}

/** Groups consecutive batch indices that share one buffer. */
function getBatchGroups(layout: ColumnLayout): number[][] {
  const batchIndices = BATCH_ROW_COUNTS.map((_, batchIndex) => batchIndex);
  switch (layout) {
    case 'shared':
      return [batchIndices];
    case 'separate':
      return batchIndices.map(batchIndex => [batchIndex]);
    case 'mixed':
      return [batchIndices.slice(0, 3), batchIndices.slice(3)];
  }
}

function getBufferCount(vector: GPUVector): number {
  return new Set(vector.data.map(chunk => chunk.buffer)).size;
}

/** Runs `callback` while the device reports smaller limits, restoring the real limits after. */
function withDeviceLimits<Result>(
  device: Device,
  overrides: Partial<DeviceLimits>,
  callback: () => Result
): Result {
  const limits = device.limits;
  const limitedLimits = new Proxy(limits, {
    get: (target, key) =>
      key in overrides ? overrides[key as keyof DeviceLimits] : Reflect.get(target, key)
  });
  Object.defineProperty(device, 'limits', {value: limitedLimits, configurable: true});
  try {
    return callback();
  } finally {
    Object.defineProperty(device, 'limits', {value: limits, configurable: true});
  }
}

function destroyFixture(fixture: FusedFixture): void {
  fixture.frame.destroy();
  for (const buffer of fixture.buffers) {
    buffer.destroy();
  }
}

type Selection = {masks: number[][]; counts: number[]; rowIndices: number[][]};

function getExpectedSelection(
  fixture: FusedFixture,
  accept: (fare: number, category: number, valid: boolean) => boolean
): Selection {
  const masks = fixture.fares.map((fares, batchIndex) =>
    fares.map((fare, rowIndex) =>
      accept(
        Math.fround(fare),
        fixture.categories[batchIndex][rowIndex],
        fixture.fareValidity[batchIndex][rowIndex] === 1
      )
        ? 1
        : 0
    )
  );
  const rowIndices = masks.map((mask, batchIndex) =>
    mask.flatMap((flag, rowIndex) => (flag ? [SOURCE_ROW_STARTS[batchIndex] + rowIndex] : []))
  );
  return {masks, counts: rowIndices.map(ids => ids.length), rowIndices};
}

async function readSelection(query: {
  selectionMask: GPUVector<'uint32'>;
  rowIndices: GPUVector<'uint32'>;
  selectedCounts: GPUVector<'uint32'>;
}): Promise<Selection> {
  const masks = await Promise.all(
    query.selectionMask.data.map(async chunk => Array.from(await readChunk(chunk, Uint32Array)))
  );
  const counts = await Promise.all(
    query.selectedCounts.data.map(async chunk => (await readChunk(chunk, Uint32Array))[0])
  );
  const rowIndices = await Promise.all(
    query.rowIndices.data.map(async (chunk, batchIndex) =>
      Array.from(await readChunk(chunk, Uint32Array, counts[batchIndex]))
    )
  );
  return {masks, counts, rowIndices};
}

async function readChunk<ArrayType extends Float32ArrayConstructor | Uint32ArrayConstructor>(
  chunk: GPUData,
  ArrayType: ArrayType,
  length: number = chunk.length
): Promise<InstanceType<ArrayType>> {
  if (length === 0) {
    return new ArrayType(0) as InstanceType<ArrayType>;
  }
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, length * 4);
  return new ArrayType(
    bytes.buffer as ArrayBuffer,
    bytes.byteOffset,
    length
  ) as InstanceType<ArrayType>;
}
