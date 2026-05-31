// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  appendArrowDataToGPUVector,
  makeAppendableArrowGPUVector,
  makeArrowGPUVector,
  readArrowGPUVectorAsync
} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type ScalarNestedAttributeType = arrow.List<arrow.Int16>;
type TupleNestedAttributeType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

test('GPUVector uploads nested scalar attributes and round-trips Arrow offsets', async t => {
  const device = new NullDevice({});
  const sourceVector = makeScalarNestedAttributeVector(
    new Int32Array([0, 3, 5]),
    new Int16Array([10, 20, 30, 40, 50])
  );
  const gpuVector = makeArrowGPUVector(device, sourceVector, {name: 'nestedScalars'});
  const result = await readArrowGPUVectorAsync(gpuVector);

  t.equal(gpuVector.length, 2, 'retains one logical GPU row per nested list row');
  t.equal(gpuVector.valueLength, 5, 'tracks flattened nested scalar count');
  t.equal(gpuVector.data[0].valueLength, 5, 'tracks flattened scalar count on the data chunk');
  t.equal(
    gpuVector.format,
    'vertex-list<sint16>',
    'maps scalar nested values to vertex-list format'
  );
  t.equal(gpuVector.stride, 1, 'reports scalar nested elements as stride one');
  t.equal(gpuVector.byteStride, 2, 'reports one Int16 scalar byte stride');
  t.equal(gpuVector.data[0].buffer.byteLength, 10, 'uploads flattened scalar bytes');
  t.deepEqual(
    Array.from(result.data[0].valueOffsets as Int32Array),
    [0, 3, 5],
    'readAsync preserves variable-length scalar offsets'
  );
  t.deepEqual(
    Array.from(getScalarNestedAttributeValues(result)),
    [10, 20, 30, 40, 50],
    'readAsync preserves flattened scalar values'
  );

  gpuVector.destroy();
  t.end();
});

test('GPUVector supports fixed nested attribute widths from one to four components', async t => {
  const device = new NullDevice({});

  for (const dimension of [1, 2, 3, 4] as const) {
    const expectedValues = makeFloatValues(dimension, 3);
    const sourceVector = makeTupleNestedAttributeVector(
      dimension,
      new Int32Array([0, 2, 3]),
      expectedValues
    );
    const gpuVector = makeArrowGPUVector(device, sourceVector, {
      name: `nestedTuple${dimension}`
    });
    const result = await readArrowGPUVectorAsync(gpuVector);

    t.equal(gpuVector.stride, dimension, `reports vec${dimension} nested element stride`);
    t.equal(gpuVector.valueLength, 3, `tracks vec${dimension} flattened element count`);
    t.equal(
      gpuVector.format,
      dimension === 1 ? 'vertex-list<float32>' : `vertex-list<float32x${dimension}>`,
      `reports vec${dimension} nested element format`
    );
    t.equal(
      gpuVector.byteStride,
      dimension * Float32Array.BYTES_PER_ELEMENT,
      `reports vec${dimension} nested element byte stride`
    );
    t.deepEqual(
      Array.from(result.data[0].valueOffsets as Int32Array),
      [0, 2, 3],
      `readAsync preserves vec${dimension} offsets`
    );
    t.deepEqual(
      Array.from(getTupleNestedAttributeValues(result)),
      Array.from(expectedValues),
      `readAsync preserves vec${dimension} flattened values`
    );

    gpuVector.destroy();
  }

  t.end();
});

test('GPUVector preserves chunked tuple nested attribute batches', async t => {
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
  const gpuVector = makeArrowGPUVector(device, sourceVector, {name: 'nestedTuples'});
  const result = await readArrowGPUVectorAsync(gpuVector);

  t.equal(gpuVector.data.length, 2, 'keeps one GPUData chunk per Arrow list chunk');
  t.equal(gpuVector.valueLength, 5, 'tracks flattened vec3 element count across chunks');
  t.deepEqual(
    gpuVector.data.map(data => data.valueLength),
    [2, 3],
    'tracks flattened vec3 element count per chunk'
  );
  t.equal(
    gpuVector.data[0].readbackMetadata?.kind,
    'variable-length-attribute',
    'retains compact nested-list readback metadata'
  );
  t.equal(gpuVector.byteStride, 12, 'reports one vec3 Float32 element byte stride');
  t.deepEqual(
    result.data.map(data => data.length),
    [1, 1],
    'readAsync preserves chunk-local nested list row counts'
  );
  t.deepEqual(
    Array.from(getTupleNestedAttributeValues(result)),
    [0, 0, 0, 1, 0, 0, 2, 0, 0, 2, 1, 0, 2, 1, 1],
    'readAsync merges flattened vec3 values across chunks'
  );

  gpuVector.destroy();
  t.end();
});

test('GPUVector nested list readAsync normalizes sliced offsets', async t => {
  const device = new NullDevice({});
  const sourceVector = makeTupleNestedAttributeVector(
    2,
    new Int32Array([0, 2, 3]),
    new Float32Array([0, 0, 1, 1, 2, 2])
  );
  const slicedVector = sourceVector.slice(1) as arrow.Vector<TupleNestedAttributeType>;
  const gpuVector = makeArrowGPUVector(device, slicedVector, {name: 'slicedNestedTuples'});
  const result = await readArrowGPUVectorAsync(gpuVector);

  t.deepEqual(
    Array.from(result.data[0].valueOffsets as Int32Array),
    [0, 1],
    'reconstructs local compact nested-list offsets'
  );
  t.deepEqual(
    Array.from(getTupleNestedAttributeValues(result)),
    [2, 2],
    'reads the sliced nested tuple payload'
  );

  gpuVector.destroy();
  t.end();
});

test('GPUVector appendable nested lists retain compact readback metadata', async t => {
  const device = new NullDevice({});
  const firstData = makeTupleNestedAttributeData(
    2,
    new Int32Array([0, 2]),
    new Float32Array([0, 0, 1, 1])
  );
  const secondData = makeTupleNestedAttributeData(
    2,
    new Int32Array([0, 1]),
    new Float32Array([2, 2])
  );
  const gpuVector = makeAppendableArrowGPUVector(device, firstData.type, {
    name: 'appendableNestedTuples',
    initialCapacityRows: 1
  });

  appendArrowDataToGPUVector(gpuVector, firstData);
  appendArrowDataToGPUVector(gpuVector, secondData);
  const result = await readArrowGPUVectorAsync(gpuVector);

  t.equal(gpuVector.length, 2, 'tracks appended nested list rows');
  t.equal(gpuVector.valueLength, 3, 'tracks appended flattened nested elements');
  t.equal(gpuVector.data.length, 2, 'keeps one GPUData chunk per nested append');
  t.equal(
    gpuVector.data[0].readbackMetadata?.kind,
    'variable-length-attribute',
    'stores copied nested-list readback metadata'
  );
  t.deepEqual(
    result.data.map(data => Array.from(data.valueOffsets as Int32Array)),
    [
      [0, 2],
      [0, 1]
    ],
    'round-trips chunk-local appended nested offsets'
  );
  t.deepEqual(
    Array.from(getTupleNestedAttributeValues(result)),
    [0, 0, 1, 1, 2, 2],
    'round-trips appended nested tuple values'
  );

  gpuVector.destroy();
  t.end();
});

test('GPUVector rejects nullable variable-length nested attribute rows', t => {
  const device = new NullDevice({});
  const nullableData = makeTupleNestedAttributeData(
    2,
    new Int32Array([0, 2]),
    new Float32Array([0, 0, 1, 1]),
    1,
    new Uint8Array([0])
  );
  const vector = new arrow.Vector<TupleNestedAttributeType>([nullableData]);

  t.throws(
    () => makeArrowGPUVector(device, vector, {name: 'nestedTuples'}),
    /does not support nullable data/,
    'nested uploads fail before GPU allocation when top-level row nulls are present'
  );
  t.end();
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
