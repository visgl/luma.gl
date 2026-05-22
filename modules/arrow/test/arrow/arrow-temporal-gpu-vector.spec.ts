// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  prepareArrowTemporalGPUVector,
  prepareArrowTemporalGPUVectors,
  readArrowGPUVectorAsync,
  TEMPORAL_ORIGIN_METADATA_KEY,
  TEMPORAL_ORIGIN_POLICY_METADATA_KEY,
  TEMPORAL_UNIT_METADATA_KEY
} from '@luma.gl/arrow';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  Data,
  DateDay,
  Date_,
  Duration,
  DurationMillisecond,
  Field,
  List,
  Time,
  TimeMillisecond,
  Timestamp,
  TimestampMillisecond,
  Vector,
  makeData
} from 'apache-arrow';

test('prepareArrowTemporalGPUVector emits relative scalar timestamps with persisted origin', async t => {
  const device = new NullDevice({});
  const source = makeTemporalVector(new TimestampMillisecond(), new BigInt64Array([1000n, 1005n]));
  const prepared = await prepareArrowTemporalGPUVector(device, source, {preferGPU: false});
  const result = await readArrowGPUVectorAsync(prepared.temporal);

  t.deepEqual(Array.from(result.toArray()), [0, 5], 'subtracts the first valid timestamp');
  t.equal(prepared.field.metadata.get(TEMPORAL_ORIGIN_METADATA_KEY), '1000', 'stores origin');
  t.equal(prepared.field.metadata.get(TEMPORAL_UNIT_METADATA_KEY), 'millisecond', 'stores unit');
  t.equal(
    prepared.field.metadata.get(TEMPORAL_ORIGIN_POLICY_METADATA_KEY),
    'first-valid',
    'stores origin policy'
  );

  prepared.destroy();
  t.end();
});

test('prepareArrowTemporalGPUVectors preserves aligned scalar temporal rows', async t => {
  const device = new NullDevice({});
  const prepared = await prepareArrowTemporalGPUVectors(device, {
    eventDates: makeTemporalVector(new DateDay(), new Int32Array([20, 21, 21])),
    eventTimes: makeTemporalVector(new TimeMillisecond(), new Int32Array([8_000, 10_000, 12_000])),
    eventStarts: makeTemporalVector(
      new TimestampMillisecond(),
      new BigInt64Array([1_000n, 2_000n, 3_000n])
    ),
    eventDurations: makeTemporalVector(new DurationMillisecond(), new BigInt64Array([5n, 10n, 15n]))
  });
  const eventDates = await readArrowGPUVectorAsync(prepared.eventDates!.temporal);
  const eventTimes = await readArrowGPUVectorAsync(prepared.eventTimes!.temporal);
  const eventStarts = await readArrowGPUVectorAsync(prepared.eventStarts!.temporal);
  const eventDurations = await readArrowGPUVectorAsync(prepared.eventDurations!.temporal);

  t.deepEqual(Array.from(eventDates.toArray()), [0, 1, 1], 'keeps DateDay row alignment');
  t.deepEqual(
    Array.from(eventTimes.toArray()),
    [0, 2_000, 4_000],
    'keeps TimeMillisecond row alignment'
  );
  t.deepEqual(
    Array.from(eventStarts.toArray()),
    [0, 1_000, 2_000],
    'keeps TimestampMillisecond row alignment'
  );
  t.deepEqual(
    Array.from(eventDurations.toArray()),
    [5, 10, 15],
    'keeps DurationMillisecond row alignment'
  );
  t.equal(prepared.eventDates!.temporalInfo.origin, 20, 'uses first valid DateDay origin');
  t.equal(prepared.eventTimes!.temporalInfo.origin, 8_000, 'uses first valid time origin');
  t.equal(prepared.eventStarts!.temporalInfo.origin, 1_000n, 'uses first valid timestamp origin');
  t.equal(prepared.eventDurations!.temporalInfo.origin, 0n, 'uses zero duration origin');

  for (const temporalColumn of Object.values(prepared)) {
    temporalColumn.destroy();
  }
  t.end();
});

test('prepareArrowTemporalGPUVector preserves temporal list offsets for Trips-style streams', async t => {
  const device = new NullDevice({});
  const source = makeTemporalListVector(
    new TimestampMillisecond(),
    new BigInt64Array([1000n, 1010n, 1025n]),
    new Int32Array([0, 2, 3])
  );
  const prepared = await prepareArrowTemporalGPUVector(device, source, {preferGPU: false});
  const result = await readArrowGPUVectorAsync(prepared.temporal);

  t.deepEqual(
    Array.from(result.data[0]!.valueOffsets as Int32Array),
    [0, 2, 3],
    'preserves path-aligned temporal list offsets'
  );
  t.deepEqual(
    Array.from(result.data[0]!.children[0]!.values as Float32Array),
    [0, 10, 25],
    'emits relative Float32 temporal values'
  );

  prepared.destroy();
  t.end();
});

test('prepareArrowTemporalGPUVector reads sliced temporal list rows', async t => {
  const device = new NullDevice({});
  const source = makeTemporalListVector(
    new TimestampMillisecond(),
    new BigInt64Array([900n, 901n, 1000n, 1010n, 1025n]),
    new Int32Array([0, 2, 4, 5])
  ).slice(1) as Vector<List<TimestampMillisecond>>;
  const prepared = await prepareArrowTemporalGPUVector(device, source, {preferGPU: false});
  const result = await readArrowGPUVectorAsync(prepared.temporal);

  t.deepEqual(
    Array.from(result.data[0]!.valueOffsets as Int32Array),
    [0, 2, 3],
    'normalizes sliced path-aligned temporal list offsets'
  );
  t.deepEqual(
    Array.from(result.data[0]!.children[0]!.values as Float32Array),
    [0, 10, 25],
    'reads the sliced temporal leaf values'
  );
  t.equal(prepared.temporalInfo.origin, 1000n, 'uses the first sliced timestamp as origin');

  prepared.destroy();
  t.end();
});

test('prepareArrowTemporalGPUVector keeps durations relative to zero', async t => {
  const device = new NullDevice({});
  const source = makeTemporalVector(new DurationMillisecond(), new BigInt64Array([5n, 10n]));
  const prepared = await prepareArrowTemporalGPUVector(device, source, {preferGPU: false});
  const result = await readArrowGPUVectorAsync(prepared.temporal);

  t.deepEqual(Array.from(result.toArray()), [5, 10], 'leaves duration magnitudes unchanged');
  t.equal(prepared.field.metadata.get(TEMPORAL_ORIGIN_METADATA_KEY), '0', 'stores zero origin');
  t.equal(
    prepared.field.metadata.get(TEMPORAL_ORIGIN_POLICY_METADATA_KEY),
    'zero',
    'stores zero-origin policy'
  );

  prepared.destroy();
  t.end();
});

test('prepareArrowTemporalGPUVector WebGPU matches CPU fallback', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('Skipping temporal WebGPU preparation test without hardware WebGPU');
    t.end();
    return;
  }
  const source = makeTemporalVector(new TimestampMillisecond(), new BigInt64Array([1000n, 1005n]));
  const gpuPrepared = await prepareArrowTemporalGPUVector(device, source);
  const cpuPrepared = await prepareArrowTemporalGPUVector(device, source, {preferGPU: false});
  const gpuResult = await readArrowGPUVectorAsync(gpuPrepared.temporal);
  const cpuResult = await readArrowGPUVectorAsync(cpuPrepared.temporal);

  t.deepEqual(Array.from(gpuResult.toArray()), Array.from(cpuResult.toArray()), 'matches CPU');

  gpuPrepared.destroy();
  cpuPrepared.destroy();
  t.end();
});

test('prepareArrowTemporalGPUVector rejects nullable temporal payloads', async t => {
  const device = new NullDevice({});
  const source = makeNullableTimestampVector();

  try {
    await prepareArrowTemporalGPUVector(device, source, {preferGPU: false});
    t.fail('rejects nullable temporal rows');
  } catch (error) {
    t.match(
      (error as Error).message,
      /does not support nullable temporal rows/,
      'rejects nullable temporal rows'
    );
  }

  t.end();
});

function makeTemporalVector<T extends Date_ | Time | Timestamp | Duration>(
  type: T,
  values: Int32Array | BigInt64Array
): Vector<T> {
  const data = makeData({
    type,
    length: values.length,
    data: values
  }) as Data<T>;
  return new Vector([data]);
}

function makeTemporalListVector<T extends Date_ | Time | Timestamp | Duration>(
  childType: T,
  values: Int32Array | BigInt64Array,
  valueOffsets: Int32Array
): Vector<List<T>> {
  const childData = makeData({
    type: childType,
    length: values.length,
    data: values
  }) as Data<T>;
  const listType = new List(new Field('values', childType, false));
  const listData = makeData({
    type: listType,
    length: valueOffsets.length - 1,
    nullCount: 0,
    nullBitmap: null,
    valueOffsets,
    child: childData
  }) as Data<List<T>>;
  return new Vector([listData]);
}

function makeNullableTimestampVector(): Vector<TimestampMillisecond> {
  const nullBitmap = new Uint8Array([0b10]);
  const data = makeData({
    type: new TimestampMillisecond(),
    length: 2,
    nullCount: 1,
    nullBitmap,
    data: new BigInt64Array([1000n, 1005n])
  }) as Data<TimestampMillisecond>;
  return new Vector([data]);
}
