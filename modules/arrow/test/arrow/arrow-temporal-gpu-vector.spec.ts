// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  convertArrowTemporalToGPUVector,
  convertArrowTemporalToGPUVectors,
  readArrowGPUVectorAsync,
  TEMPORAL_ORIGIN_METADATA_KEY,
  TEMPORAL_ORIGIN_POLICY_METADATA_KEY,
  TEMPORAL_UNIT_METADATA_KEY
} from '@luma.gl/arrow';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

it('convertArrowTemporalToGPUVector emits relative scalar timestamps with persisted origin', async () => {
  const device = new NullDevice({});
  const source = makeTemporalVector(
    new arrow.TimestampMillisecond(),
    new BigInt64Array([1000n, 1005n])
  );
  const prepared = await convertArrowTemporalToGPUVector(device, source, {preferGPU: false});
  const result = await readArrowGPUVectorAsync(prepared.temporal);

  expect(Array.from(result.toArray()), 'subtracts the first valid timestamp').toEqual([0, 5]);
  expect(prepared.field.metadata.get(TEMPORAL_ORIGIN_METADATA_KEY), 'stores origin').toBe('1000');
  expect(prepared.field.metadata.get(TEMPORAL_UNIT_METADATA_KEY), 'stores unit').toBe(
    'millisecond'
  );
  expect(
    prepared.field.metadata.get(TEMPORAL_ORIGIN_POLICY_METADATA_KEY),
    'stores origin policy'
  ).toBe('first-valid');

  prepared.destroy();
  void 0;
});

it('convertArrowTemporalToGPUVectors preserves aligned scalar temporal rows', async () => {
  const device = new NullDevice({});
  const prepared = await convertArrowTemporalToGPUVectors(device, {
    eventDates: makeTemporalVector(new arrow.DateDay(), new Int32Array([20, 21, 21])),
    eventTimes: makeTemporalVector(
      new arrow.TimeMillisecond(),
      new Int32Array([8_000, 10_000, 12_000])
    ),
    eventStarts: makeTemporalVector(
      new arrow.TimestampMillisecond(),
      new BigInt64Array([1_000n, 2_000n, 3_000n])
    ),
    eventDurations: makeTemporalVector(
      new arrow.DurationMillisecond(),
      new BigInt64Array([5n, 10n, 15n])
    )
  });
  const eventDates = await readArrowGPUVectorAsync(prepared.eventDates!.temporal);
  const eventTimes = await readArrowGPUVectorAsync(prepared.eventTimes!.temporal);
  const eventStarts = await readArrowGPUVectorAsync(prepared.eventStarts!.temporal);
  const eventDurations = await readArrowGPUVectorAsync(prepared.eventDurations!.temporal);

  expect(Array.from(eventDates.toArray()), 'keeps DateDay row alignment').toEqual([0, 1, 1]);
  expect(Array.from(eventTimes.toArray()), 'keeps TimeMillisecond row alignment').toEqual([
    0, 2_000, 4_000
  ]);
  expect(Array.from(eventStarts.toArray()), 'keeps TimestampMillisecond row alignment').toEqual([
    0, 1_000, 2_000
  ]);
  expect(Array.from(eventDurations.toArray()), 'keeps DurationMillisecond row alignment').toEqual([
    5, 10, 15
  ]);
  expect(prepared.eventDates!.temporalInfo.origin, 'uses first valid DateDay origin').toBe(20);
  expect(prepared.eventTimes!.temporalInfo.origin, 'uses first valid time origin').toBe(8_000);
  expect(prepared.eventStarts!.temporalInfo.origin, 'uses first valid timestamp origin').toBe(
    1_000n
  );
  expect(prepared.eventDurations!.temporalInfo.origin, 'uses zero duration origin').toBe(0n);

  for (const temporalColumn of Object.values(prepared)) {
    temporalColumn.destroy();
  }
  void 0;
});

it('convertArrowTemporalToGPUVector preserves temporal list offsets for Trips-style streams', async () => {
  const device = new NullDevice({});
  const source = makeTemporalListVector(
    new arrow.TimestampMillisecond(),
    new BigInt64Array([1000n, 1010n, 1025n]),
    new Int32Array([0, 2, 3])
  );
  const prepared = await convertArrowTemporalToGPUVector(device, source, {preferGPU: false});
  const result = await readArrowGPUVectorAsync(prepared.temporal);

  expect(
    Array.from(result.data[0]!.valueOffsets as Int32Array),
    'preserves path-aligned temporal list offsets'
  ).toEqual([0, 2, 3]);
  expect(
    Array.from(result.data[0]!.children[0]!.values as Float32Array),
    'emits relative Float32 temporal values'
  ).toEqual([0, 10, 25]);

  prepared.destroy();
  void 0;
});

it('convertArrowTemporalToGPUVector reads sliced temporal list rows', async () => {
  const device = new NullDevice({});
  const source = makeTemporalListVector(
    new arrow.TimestampMillisecond(),
    new BigInt64Array([900n, 901n, 1000n, 1010n, 1025n]),
    new Int32Array([0, 2, 4, 5])
  ).slice(1) as arrow.Vector<arrow.List<arrow.TimestampMillisecond>>;
  const prepared = await convertArrowTemporalToGPUVector(device, source, {preferGPU: false});
  const result = await readArrowGPUVectorAsync(prepared.temporal);

  expect(
    Array.from(result.data[0]!.valueOffsets as Int32Array),
    'normalizes sliced path-aligned temporal list offsets'
  ).toEqual([0, 2, 3]);
  expect(
    Array.from(result.data[0]!.children[0]!.values as Float32Array),
    'reads the sliced temporal leaf values'
  ).toEqual([0, 10, 25]);
  expect(prepared.temporalInfo.origin, 'uses the first sliced timestamp as origin').toBe(1000n);

  prepared.destroy();
  void 0;
});

it('convertArrowTemporalToGPUVector keeps durations relative to zero', async () => {
  const device = new NullDevice({});
  const source = makeTemporalVector(new arrow.DurationMillisecond(), new BigInt64Array([5n, 10n]));
  const prepared = await convertArrowTemporalToGPUVector(device, source, {preferGPU: false});
  const result = await readArrowGPUVectorAsync(prepared.temporal);

  expect(Array.from(result.toArray()), 'leaves duration magnitudes unchanged').toEqual([5, 10]);
  expect(prepared.field.metadata.get(TEMPORAL_ORIGIN_METADATA_KEY), 'stores zero origin').toBe('0');
  expect(
    prepared.field.metadata.get(TEMPORAL_ORIGIN_POLICY_METADATA_KEY),
    'stores zero-origin policy'
  ).toBe('zero');

  prepared.destroy();
  void 0;
});

it('convertArrowTemporalToGPUVector WebGPU matches CPU fallback', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const source = makeTemporalVector(
    new arrow.TimestampMillisecond(),
    new BigInt64Array([1000n, 1005n])
  );
  const gpuPrepared = await convertArrowTemporalToGPUVector(device, source);
  const cpuPrepared = await convertArrowTemporalToGPUVector(device, source, {preferGPU: false});
  const gpuResult = await readArrowGPUVectorAsync(gpuPrepared.temporal);
  const cpuResult = await readArrowGPUVectorAsync(cpuPrepared.temporal);

  expect(Array.from(gpuResult.toArray()), 'matches CPU').toEqual(Array.from(cpuResult.toArray()));

  gpuPrepared.destroy();
  cpuPrepared.destroy();
  void 0;
});

it('convertArrowTemporalToGPUVector rejects nullable temporal payloads', async () => {
  const device = new NullDevice({});
  const source = makeNullableTimestampVector();

  try {
    await convertArrowTemporalToGPUVector(device, source, {preferGPU: false});
    expect(false, 'rejects nullable temporal rows').toBe(true);
  } catch (error) {
    expect((error as Error).message, 'rejects nullable temporal rows').toMatch(
      /does not support nullable temporal rows/
    );
  }

  void 0;
});

function makeTemporalVector<T extends arrow.Date_ | arrow.Time | arrow.Timestamp | arrow.Duration>(
  type: T,
  values: Int32Array | BigInt64Array
): arrow.Vector<T> {
  const data = arrow.makeData({
    type,
    length: values.length,
    data: values
  }) as arrow.Data<T>;
  return new arrow.Vector([data]);
}

function makeTemporalListVector<
  T extends arrow.Date_ | arrow.Time | arrow.Timestamp | arrow.Duration
>(
  childType: T,
  values: Int32Array | BigInt64Array,
  valueOffsets: Int32Array
): arrow.Vector<arrow.List<T>> {
  const childData = arrow.makeData({
    type: childType,
    length: values.length,
    data: values
  }) as arrow.Data<T>;
  const listType = new arrow.List(new arrow.Field('values', childType, false));
  const listData = arrow.makeData({
    type: listType,
    length: valueOffsets.length - 1,
    nullCount: 0,
    nullBitmap: null,
    valueOffsets,
    child: childData
  }) as arrow.Data<arrow.List<T>>;
  return new arrow.Vector([listData]);
}

function makeNullableTimestampVector(): arrow.Vector<arrow.TimestampMillisecond> {
  const nullBitmap = new Uint8Array([0b10]);
  const data = arrow.makeData({
    type: new arrow.TimestampMillisecond(),
    length: 2,
    nullCount: 1,
    nullBitmap,
    data: new BigInt64Array([1000n, 1005n])
  }) as arrow.Data<arrow.TimestampMillisecond>;
  return new arrow.Vector([data]);
}
