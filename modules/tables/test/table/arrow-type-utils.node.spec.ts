// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  getArrowDataType,
  getArrowScalarByteLength,
  getArrowScalarType,
  getDataTypeFromTypedArray,
  getScalarArrowType,
  getSignedDataType,
  getTypedArrayFromDataType,
  validateArrowDataType
} from '@luma.gl/tables';
import {NativeFloat16ArrayConstructor} from '@luma.gl/core';
import * as arrow from 'apache-arrow';

test('arrow-type-utils maps luma scalar types to Arrow types', t => {
  t.ok(
    arrow.util.compareTypes(getArrowScalarType('float16'), new arrow.Float16()),
    'float16 maps to Arrow Float16'
  );
  t.ok(
    arrow.util.compareTypes(getArrowScalarType('float32'), new arrow.Float32()),
    'float32 maps to Arrow Float32'
  );
  t.ok(
    arrow.util.compareTypes(getArrowScalarType('uint8'), new arrow.Uint8()),
    'uint8 maps to Arrow Uint8'
  );
  t.ok(
    arrow.util.compareTypes(getArrowDataType('float16', 4), makeListType(new arrow.Float16(), 4)),
    'synthesizes FixedSizeList<Float16, 4>'
  );

  t.end();
});

test('arrow-type-utils maps Arrow scalar types to luma scalar types', t => {
  t.equal(getSignedDataType(new arrow.Float16()), 'float16', 'Arrow Float16 maps to float16');
  t.equal(getSignedDataType(new arrow.Float32()), 'float32', 'Arrow Float32 maps to float32');
  t.equal(getSignedDataType(new arrow.Uint8()), 'uint8', 'Arrow Uint8 maps to uint8');
  t.equal(getSignedDataType(new arrow.Int8()), 'sint8', 'Arrow Int8 maps to sint8');
  t.equal(getSignedDataType(new arrow.Uint16()), 'uint16', 'Arrow Uint16 maps to uint16');
  t.equal(getSignedDataType(new arrow.Int16()), 'sint16', 'Arrow Int16 maps to sint16');
  t.equal(getSignedDataType(new arrow.Uint32()), 'uint32', 'Arrow Uint32 maps to uint32');
  t.equal(getSignedDataType(new arrow.Int32()), 'sint32', 'Arrow Int32 maps to sint32');
  t.throws(() => getSignedDataType(new arrow.Float64()), /Unsupported GPUVector logical type/);

  t.end();
});

test('arrow-type-utils extracts scalar type and byte length', t => {
  const listType = makeListType(new arrow.Float16(), 3);

  t.ok(
    arrow.util.compareTypes(getScalarArrowType(listType), new arrow.Float16()),
    'extracts FixedSizeList child type'
  );
  t.equal(getArrowScalarByteLength(new arrow.Float16()), 2, 'Float16 byte length');
  t.equal(getArrowScalarByteLength(new arrow.Float32()), 4, 'Float32 byte length');
  t.equal(getArrowScalarByteLength(new arrow.Float64()), 8, 'Float64 byte length');
  t.equal(getArrowScalarByteLength(new arrow.Uint8()), 1, 'Uint8 byte length');
  t.equal(getArrowScalarByteLength(new arrow.Int16()), 2, 'Int16 byte length');
  t.equal(getArrowScalarByteLength(new arrow.Uint32()), 4, 'Uint32 byte length');

  t.end();
});

test('arrow-type-utils maps typed array constructors', t => {
  t.equal(getTypedArrayFromDataType('float16'), NativeFloat16ArrayConstructor ?? Uint16Array);
  t.equal(getTypedArrayFromDataType('float32'), Float32Array);
  t.equal(getTypedArrayFromDataType('uint8'), Uint8Array);
  t.equal(getTypedArrayFromDataType('unorm8'), Uint8Array);
  t.equal(getTypedArrayFromDataType('sint16'), Int16Array);
  t.equal(getTypedArrayFromDataType('snorm16'), Int16Array);
  t.equal(getDataTypeFromTypedArray(Uint16Array), 'uint16', 'Uint16Array remains uint16');
  t.equal(
    getDataTypeFromTypedArray(new Uint16Array(1)),
    'uint16',
    'Uint16Array view remains uint16'
  );

  if (NativeFloat16ArrayConstructor) {
    t.equal(
      getDataTypeFromTypedArray(NativeFloat16ArrayConstructor),
      'float16',
      'native Float16Array maps to float16'
    );
  }

  t.end();
});

test('arrow-type-utils validates Arrow data type allow-lists', t => {
  const supportedTypes = [makeListType(new arrow.Float32(), 3), makeListType(new arrow.Uint8(), 4)];

  t.doesNotThrow(() => validateArrowDataType(makeListType(new arrow.Float32(), 3), supportedTypes));
  t.throws(
    () => validateArrowDataType(makeListType(new arrow.Uint16(), 4), supportedTypes, 'colors'),
    /colors type .* is not supported/
  );

  t.end();
});

function makeListType(type: arrow.DataType, size: number): arrow.DataType {
  return new arrow.FixedSizeList(size, new arrow.Field('value', type, false));
}
