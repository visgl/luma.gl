// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  makeArrowFixedSizeListVector,
  makeGPUDataFromArrowData,
  readArrowGPUDataAsync
} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type ArrowUtf8Dictionary = arrow.Dictionary<arrow.Utf8, arrow.Int32>;
type TupleNestedAttributeType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

test('makeGPUDataFromArrowData uploads numeric Arrow Data chunks', async t => {
  const device = new NullDevice({});
  const source = arrow.makeVector(new Float32Array([1, 2, 3])) as arrow.Vector<arrow.Float32>;
  const gpuData = makeGPUDataFromArrowData(device, source.data[0], {format: 'float32'});
  const result = await readArrowGPUDataAsync<arrow.Float32>(gpuData);

  t.equal(gpuData.length, 3, 'keeps numeric row count');
  t.equal(gpuData.byteStride, 4, 'keeps numeric byte stride');
  t.deepEqual(Array.from(result.values as Float32Array), [1, 2, 3], 'round-trips numeric values');

  gpuData.destroy();
  t.end();
});

test('makeGPUDataFromArrowData uploads FixedSizeList Arrow Data chunks', async t => {
  const device = new NullDevice({});
  const source = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 1, 2, 3])
  );
  const gpuData = makeGPUDataFromArrowData(device, source.data[0], {format: 'float32x2'});
  const result = await readArrowGPUDataAsync<arrow.FixedSizeList<arrow.Float32>>(gpuData);
  const childData = result.children[0] as arrow.Data<arrow.Float32>;

  t.equal(gpuData.length, 2, 'keeps FixedSizeList row count');
  t.equal(gpuData.stride, 2, 'keeps FixedSizeList scalar stride');
  t.deepEqual(
    Array.from(childData.values as Float32Array),
    [0, 1, 2, 3],
    'round-trips FixedSizeList child values'
  );

  gpuData.destroy();
  t.end();
});

test('makeGPUDataFromArrowData uploads UTF-8 Arrow Data chunks with readback metadata', async t => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray(['a', 'luma'], new arrow.Utf8());
  const gpuData = makeGPUDataFromArrowData(device, source.data[0], {format: 'uint8'});
  const result = await readArrowGPUDataAsync<arrow.Utf8>(gpuData);

  t.equal(gpuData.length, 2, 'keeps UTF-8 logical row count');
  t.equal(gpuData.valueLength, 2, 'keeps UTF-8 logical row value length');
  t.equal(gpuData.readbackMetadata?.kind, 'utf8', 'keeps UTF-8 readback metadata');
  t.deepEqual(
    Array.from(result.valueOffsets as Int32Array),
    [0, 1, 5],
    'round-trips UTF-8 value offsets'
  );
  t.deepEqual(
    Array.from(result.values as Uint8Array),
    Array.from(new TextEncoder().encode('aluma')),
    'round-trips UTF-8 bytes'
  );

  gpuData.destroy();
  t.end();
});

test('makeGPUDataFromArrowData uploads Dictionary<Utf8> index rows', async t => {
  const device = new NullDevice({});
  const source = makeExplicitArrowDictionaryVector(
    ['skip', 'alpha', 'beta'],
    new Int32Array([0, 1, 2, 1]),
    1,
    2
  );
  const data = source.data[0];
  const gpuData = makeGPUDataFromArrowData(device, data, {format: 'sint32'});
  const bytes = await gpuData.buffer.readAsync(
    gpuData.byteOffset,
    gpuData.length * gpuData.byteStride
  );
  const uploadedIndices = new Int32Array(bytes.buffer, bytes.byteOffset, gpuData.length);

  t.equal(gpuData.length, 2, 'keeps sliced dictionary row count');
  t.deepEqual(Array.from(uploadedIndices), [1, 2], 'uploads sliced dictionary index rows');

  gpuData.destroy();
  t.end();
});

test('makeGPUDataFromArrowData uploads variable-length attribute Arrow Data chunks', async t => {
  const device = new NullDevice({});
  const source = makeTupleNestedAttributeVector(
    2,
    new Int32Array([0, 2, 3]),
    new Float32Array([0, 0, 1, 1, 2, 2])
  );
  const gpuData = makeGPUDataFromArrowData(device, source.data[0], {
    format: 'vertex-list<float32x2>'
  });
  const result = await readArrowGPUDataAsync<TupleNestedAttributeType>(gpuData);
  const tupleData = result.children[0] as arrow.Data<arrow.FixedSizeList<arrow.Float32>>;
  const numericData = tupleData.children[0] as arrow.Data<arrow.Float32>;

  t.equal(gpuData.length, 2, 'keeps nested list row count');
  t.equal(gpuData.valueLength, 3, 'keeps flattened nested element count');
  t.equal(
    gpuData.readbackMetadata?.kind,
    'variable-length-attribute',
    'keeps variable-length readback metadata'
  );
  t.deepEqual(
    Array.from(result.valueOffsets as Int32Array),
    [0, 2, 3],
    'round-trips nested list offsets'
  );
  t.deepEqual(
    Array.from(numericData.values as Float32Array),
    [0, 0, 1, 1, 2, 2],
    'round-trips nested list values'
  );

  gpuData.destroy();
  t.end();
});

function makeExplicitArrowDictionaryVector(
  dictionaryValues: readonly string[],
  indices: Int32Array,
  offset = 0,
  length = indices.length - offset
): arrow.Vector<ArrowUtf8Dictionary> {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  const dictionary = arrow.vectorFromArray(
    dictionaryValues,
    new arrow.Utf8()
  ) as arrow.Vector<arrow.Utf8>;
  const data = arrow.makeData({
    type: dictionaryType,
    length,
    offset,
    data: indices,
    dictionary
  });
  return new arrow.Vector([data]) as arrow.Vector<ArrowUtf8Dictionary>;
}

function makeTupleNestedAttributeVector(
  dimension: 1 | 2 | 3 | 4,
  valueOffsets: Int32Array,
  values: Float32Array
): arrow.Vector<TupleNestedAttributeType> {
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
  const listData = new arrow.Data<TupleNestedAttributeType>(
    listType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [tupleData]
  );
  return new arrow.Vector<TupleNestedAttributeType>([listData]);
}
