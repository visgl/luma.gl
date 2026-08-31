// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeGPUVectorFromArrow, readArrowGPUVectorAsync} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type ScalarNestedAttributeType = arrow.List<arrow.Int16>;
type TupleNestedAttributeType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

it('GPUVector uploads nested scalar attributes and round-trips Arrow offsets', async () => {
  const device = new NullDevice({});
  const sourceVector = makeScalarNestedAttributeVector(
    new Int32Array([0, 3, 5]),
    new Int16Array([10, 20, 30, 40, 50])
  );
  const gpuVector = makeGPUVectorFromArrow(device, sourceVector, {name: 'nestedScalars'});
  const result = await readArrowGPUVectorAsync(gpuVector);

  expect(gpuVector.length, 'retains one logical GPU row per nested list row').toBe(2);
  expect(gpuVector.valueLength, 'tracks flattened nested scalar count').toBe(5);
  expect(gpuVector.data[0].valueLength, 'tracks flattened scalar count on the data chunk').toBe(5);
  expect(gpuVector.format, 'maps scalar nested values to vertex-list format').toBe(
    'vertex-list<sint16>'
  );
  expect(gpuVector.stride, 'reports scalar nested elements as stride one').toBe(1);
  expect(gpuVector.byteStride, 'reports one Int16 scalar byte stride').toBe(2);
  expect(gpuVector.data[0].buffer.byteLength, 'uploads flattened scalar bytes').toBe(10);
  expect(
    Array.from(result.data[0].valueOffsets as Int32Array),
    'readAsync preserves variable-length scalar offsets'
  ).toEqual([0, 3, 5]);
  expect(
    Array.from(getScalarNestedAttributeValues(result)),
    'readAsync preserves flattened scalar values'
  ).toEqual([10, 20, 30, 40, 50]);

  gpuVector.destroy();
  void 0;
});

it('GPUVector supports fixed nested attribute widths from one to four components', async () => {
  const device = new NullDevice({});

  for (const dimension of [1, 2, 3, 4] as const) {
    const expectedValues = makeFloatValues(dimension, 3);
    const sourceVector = makeTupleNestedAttributeVector(
      dimension,
      new Int32Array([0, 2, 3]),
      expectedValues
    );
    const gpuVector = makeGPUVectorFromArrow(device, sourceVector, {
      name: `nestedTuple${dimension}`
    });
    const result = await readArrowGPUVectorAsync(gpuVector);

    expect(gpuVector.stride, `reports vec${dimension} nested element stride`).toBe(dimension);
    expect(gpuVector.valueLength, `tracks vec${dimension} flattened element count`).toBe(3);
    expect(gpuVector.format, `reports vec${dimension} nested element format`).toBe(
      dimension === 1 ? 'vertex-list<float32>' : `vertex-list<float32x${dimension}>`
    );
    expect(gpuVector.byteStride, `reports vec${dimension} nested element byte stride`).toBe(
      dimension * Float32Array.BYTES_PER_ELEMENT
    );
    expect(
      Array.from(result.data[0].valueOffsets as Int32Array),
      `readAsync preserves vec${dimension} offsets`
    ).toEqual([0, 2, 3]);
    expect(
      Array.from(getTupleNestedAttributeValues(result)),
      `readAsync preserves vec${dimension} flattened values`
    ).toEqual(Array.from(expectedValues));

    gpuVector.destroy();
  }

  void 0;
});

it('GPUVector preserves chunked tuple nested attribute batches', async () => {
  const device = new NullDevice({});
  const firstChunk = makeTupleNestedAttributeVector(
    3,
    new Int32Array([0, 2]),
    new Float32Array([0, 0, 0, 1, 0, 0])
  );
  const secondChunk = makeTupleNestedAttributeVector(
    3,
    new Int32Array([0, 3]),
    new Float32Array([2, 0, 0, 2, 1, 0, 2, 1, 1])
  );
  const sourceVector = new arrow.Vector<TupleNestedAttributeType>([
    ...(firstChunk.data as arrow.Data<TupleNestedAttributeType>[]),
    ...(secondChunk.data as arrow.Data<TupleNestedAttributeType>[])
  ]);
  const gpuVector = makeGPUVectorFromArrow(device, sourceVector, {name: 'nestedTuples'});
  const result = await readArrowGPUVectorAsync(gpuVector);

  expect(gpuVector.data.length, 'keeps one GPUData chunk per Arrow list chunk').toBe(2);
  expect(gpuVector.valueLength, 'tracks flattened vec3 element count across chunks').toBe(5);
  expect(
    gpuVector.data.map(data => data.valueLength),
    'tracks flattened vec3 element count per chunk'
  ).toEqual([2, 3]);
  expect(
    gpuVector.data[0].readbackMetadata?.kind,
    'retains compact nested-list readback metadata'
  ).toBe('variable-length-attribute');
  expect(gpuVector.byteStride, 'reports one vec3 Float32 element byte stride').toBe(12);
  expect(
    result.data.map(data => data.length),
    'readAsync preserves chunk-local nested list row counts'
  ).toEqual([1, 1]);
  expect(
    Array.from(getTupleNestedAttributeValues(result)),
    'readAsync merges flattened vec3 values across chunks'
  ).toEqual([0, 0, 0, 1, 0, 0, 2, 0, 0, 2, 1, 0, 2, 1, 1]);

  gpuVector.destroy();
  void 0;
});

it('GPUVector nested list readAsync normalizes sliced offsets', async () => {
  const device = new NullDevice({});
  const sourceVector = makeTupleNestedAttributeVector(
    2,
    new Int32Array([0, 2, 3]),
    new Float32Array([0, 0, 1, 1, 2, 2])
  );
  const slicedVector = sourceVector.slice(1) as arrow.Vector<TupleNestedAttributeType>;
  const gpuVector = makeGPUVectorFromArrow(device, slicedVector, {name: 'slicedNestedTuples'});
  const result = await readArrowGPUVectorAsync(gpuVector);

  expect(
    Array.from(result.data[0].valueOffsets as Int32Array),
    'reconstructs local compact nested-list offsets'
  ).toEqual([0, 1]);
  expect(
    Array.from(getTupleNestedAttributeValues(result)),
    'reads the sliced nested tuple payload'
  ).toEqual([2, 2]);

  gpuVector.destroy();
  void 0;
});

it('GPUVector rejects nullable variable-length nested attribute rows', () => {
  const device = new NullDevice({});
  const nullableData = makeTupleNestedAttributeData(
    2,
    new Int32Array([0, 2]),
    new Float32Array([0, 0, 1, 1]),
    1,
    new Uint8Array([0])
  );
  const vector = new arrow.Vector<TupleNestedAttributeType>([nullableData]);

  expect(
    () => makeGPUVectorFromArrow(device, vector, {name: 'nestedTuples'}),
    'nested uploads fail before GPU allocation when top-level row nulls are present'
  ).toThrow(/does not support nullable data/);
  void 0;
});

function makeScalarNestedAttributeVector(
  valueOffsets: Int32Array,
  values: Int16Array
): arrow.Vector<ScalarNestedAttributeType> {
  const scalarType = new arrow.Int16();
  const listType = new arrow.List(
    new arrow.Field('values', scalarType, false)
  ) as ScalarNestedAttributeType;
  const scalarData = new arrow.Data<arrow.Int16>(scalarType, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const listData = new arrow.Data<ScalarNestedAttributeType>(
    listType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [scalarData]
  );
  return new arrow.Vector<ScalarNestedAttributeType>([listData]);
}

function makeTupleNestedAttributeVector(
  dimension: 1 | 2 | 3 | 4,
  valueOffsets: Int32Array,
  values: Float32Array
): arrow.Vector<TupleNestedAttributeType> {
  return new arrow.Vector<TupleNestedAttributeType>([
    makeTupleNestedAttributeData(dimension, valueOffsets, values)
  ]);
}

function makeTupleNestedAttributeData(
  dimension: 1 | 2 | 3 | 4,
  valueOffsets: Int32Array,
  values: Float32Array,
  nullCount = 0,
  nullBitmap?: Uint8Array
): arrow.Data<TupleNestedAttributeType> {
  const tupleType = new arrow.FixedSizeList(
    dimension,
    new arrow.Field('values', new arrow.Float32(), false)
  );
  const listType = new arrow.List(
    new arrow.Field('attributes', tupleType, false)
  ) as TupleNestedAttributeType;
  const numericData = new arrow.Data<arrow.Float32>(new arrow.Float32(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const tupleData = new arrow.Data<arrow.FixedSizeList<arrow.Float32>>(
    tupleType,
    0,
    values.length / dimension,
    0,
    {},
    [numericData]
  );
  return new arrow.Data<TupleNestedAttributeType>(
    listType,
    0,
    valueOffsets.length - 1,
    nullCount,
    {
      [arrow.BufferType.OFFSET]: valueOffsets,
      ...(nullBitmap ? {[arrow.BufferType.VALIDITY]: nullBitmap} : {})
    },
    [tupleData]
  );
}

function makeFloatValues(dimension: 1 | 2 | 3 | 4, elementCount: number): Float32Array {
  return new Float32Array(
    Array.from({length: dimension * elementCount}, (_, valueIndex) => valueIndex + 0.5)
  );
}

function getScalarNestedAttributeValues(
  vector: arrow.Vector<ScalarNestedAttributeType>
): Int16Array {
  const values: number[] = [];
  for (const data of vector.data as arrow.Data<ScalarNestedAttributeType>[]) {
    const scalarData = data.children[0] as arrow.Data<arrow.Int16>;
    values.push(...Array.from(scalarData.values as Int16Array));
  }
  return new Int16Array(values);
}

function getTupleNestedAttributeValues(
  vector: arrow.Vector<TupleNestedAttributeType>
): Float32Array {
  const values: number[] = [];
  for (const data of vector.data as arrow.Data<TupleNestedAttributeType>[]) {
    const tupleData = data.children[0] as arrow.Data<arrow.FixedSizeList<arrow.Float32>>;
    const numericData = tupleData.children[0] as arrow.Data<arrow.Float32>;
    values.push(...Array.from(numericData.values as Float32Array));
  }
  return new Float32Array(values);
}
