// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  getDataTypeByteLength,
  getDataTypeFromTypedArray,
  getTypedArrayFromDataType,
  NativeFloat16ArrayConstructor
} from '@luma.gl/core';

it('data-type-utils maps typed array constructors', () => {
  expect(getTypedArrayFromDataType('float16'), '').toBe(
    NativeFloat16ArrayConstructor ?? Uint16Array
  );
  expect(getTypedArrayFromDataType('float32'), '').toBe(Float32Array);
  expect(getTypedArrayFromDataType('uint8'), '').toBe(Uint8Array);
  expect(getTypedArrayFromDataType('unorm8'), '').toBe(Uint8Array);
  expect(getTypedArrayFromDataType('sint16'), '').toBe(Int16Array);
  expect(getTypedArrayFromDataType('snorm16'), '').toBe(Int16Array);
  expect(getDataTypeFromTypedArray(Uint16Array), 'Uint16Array remains uint16').toBe('uint16');
  expect(getDataTypeFromTypedArray(new Uint16Array(1)), 'Uint16Array view remains uint16').toBe(
    'uint16'
  );

  if (NativeFloat16ArrayConstructor) {
    expect(
      getDataTypeFromTypedArray(NativeFloat16ArrayConstructor),
      'native Float16Array maps to float16'
    ).toBe('float16');
  }

  void 0;
});

it('data-type-utils reports scalar byte lengths', () => {
  expect(getDataTypeByteLength('uint8'), 'uint8 byte length').toBe(1);
  expect(getDataTypeByteLength('sint8'), 'sint8 byte length').toBe(1);
  expect(getDataTypeByteLength('uint16'), 'uint16 byte length').toBe(2);
  expect(getDataTypeByteLength('snorm16'), 'snorm16 byte length').toBe(2);
  expect(getDataTypeByteLength('float16'), 'float16 byte length').toBe(2);
  expect(getDataTypeByteLength('uint32'), 'uint32 byte length').toBe(4);
  expect(getDataTypeByteLength('float32'), 'float32 byte length').toBe(4);

  void 0;
});
