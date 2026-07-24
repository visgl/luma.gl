// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  getDataTypeByteLength,
  getDataTypeFromTypedArray,
  getTypedArrayFromDataType,
  NativeFloat16ArrayConstructor
} from '@luma.gl/core';

test('data-type-utils maps typed array constructors', t => {
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

test('data-type-utils reports scalar byte lengths', t => {
  t.equal(getDataTypeByteLength('uint8'), 1, 'uint8 byte length');
  t.equal(getDataTypeByteLength('sint8'), 1, 'sint8 byte length');
  t.equal(getDataTypeByteLength('uint16'), 2, 'uint16 byte length');
  t.equal(getDataTypeByteLength('snorm16'), 2, 'snorm16 byte length');
  t.equal(getDataTypeByteLength('float16'), 2, 'float16 byte length');
  t.equal(getDataTypeByteLength('uint32'), 4, 'uint32 byte length');
  t.equal(getDataTypeByteLength('float32'), 4, 'float32 byte length');

  t.end();
});
