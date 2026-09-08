// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  makeArrowFixedSizeListVector,
  makeGPUDataFromArrowData,
  readArrowGPUDataAsync
} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type ArrowUtf8Dictionary = arrow.Dictionary<arrow.Utf8, arrow.Int32>;
type TupleNestedAttributeType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

it('makeGPUDataFromArrowData uploads numeric Arrow Data chunks', async () => {
  const device = new NullDevice({});
  const source = arrow.makeVector(new Float32Array([1, 2, 3])) as arrow.Vector<arrow.Float32>;
  const gpuData = makeGPUDataFromArrowData(device, source.data[0], {format: 'float32'});
  const result = await readArrowGPUDataAsync<arrow.Float32>(gpuData);

  expect(gpuData.length, 'keeps numeric row count').toBe(3);
  expect(gpuData.byteStride, 'keeps numeric byte stride').toBe(4);
  expect(Array.from(result.values as Float32Array), 'round-trips numeric values').toEqual([
    1, 2, 3
  ]);

  gpuData.destroy();
  void 0;
});

it('makeGPUDataFromArrowData uploads FixedSizeList Arrow Data chunks', async () => {
  const device = new NullDevice({});
  const source = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 1, 2, 3])
  );
  const gpuData = makeGPUDataFromArrowData(device, source.data[0], {format: 'float32x2'});
  const result = await readArrowGPUDataAsync<arrow.FixedSizeList<arrow.Float32>>(gpuData);
  const childData = result.children[0] as arrow.Data<arrow.Float32>;

  expect(gpuData.length, 'keeps FixedSizeList row count').toBe(2);
  expect(gpuData.stride, 'keeps FixedSizeList scalar stride').toBe(2);
  expect(
    Array.from(childData.values as Float32Array),
    'round-trips FixedSizeList child values'
  ).toEqual([0, 1, 2, 3]);

  gpuData.destroy();
  void 0;
});

it('makeGPUDataFromArrowData uploads UTF-8 Arrow Data chunks with readback metadata', async () => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray(['a', 'luma'], new arrow.Utf8());
  const gpuData = makeGPUDataFromArrowData(device, source.data[0]);
  const result = await readArrowGPUDataAsync<arrow.Utf8>(gpuData);

  expect(gpuData.length, 'keeps UTF-8 logical row count').toBe(2);
  expect(gpuData.format, 'declares UTF-8 byte-list storage format').toBe('value-list<uint8>');
  expect(gpuData.valueLength, 'keeps flattened UTF-8 byte value length').toBe(5);
  expect(Array.from(gpuData.valueOffsets ?? []), 'keeps generic row offsets').toEqual([0, 1, 5]);
  expect(gpuData.readbackMetadata?.kind, 'keeps UTF-8 readback metadata').toBe('utf8');
  expect(Array.from(result.valueOffsets as Int32Array), 'round-trips UTF-8 value offsets').toEqual([
    0, 1, 5
  ]);
  expect(Array.from(result.values as Uint8Array), 'round-trips UTF-8 bytes').toEqual(
    Array.from(new TextEncoder().encode('aluma'))
  );

  gpuData.destroy();
  void 0;
});

it('makeGPUDataFromArrowData uploads Dictionary<Utf8> index rows', async () => {
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

  expect(gpuData.length, 'keeps sliced dictionary row count').toBe(2);
  expect(Array.from(uploadedIndices), 'uploads sliced dictionary index rows').toEqual([1, 2]);

  gpuData.destroy();
  void 0;
});

it('makeGPUDataFromArrowData uploads variable-length attribute Arrow Data chunks', async () => {
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

  expect(gpuData.length, 'keeps nested list row count').toBe(2);
  expect(gpuData.valueLength, 'keeps flattened nested element count').toBe(3);
  expect(gpuData.readbackMetadata?.kind, 'keeps variable-length readback metadata').toBe(
    'variable-length-attribute'
  );
  expect(Array.from(result.valueOffsets as Int32Array), 'round-trips nested list offsets').toEqual([
    0, 2, 3
  ]);
  expect(Array.from(numericData.values as Float32Array), 'round-trips nested list values').toEqual([
    0, 0, 1, 1, 2, 2
  ]);

  gpuData.destroy();
  void 0;
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
