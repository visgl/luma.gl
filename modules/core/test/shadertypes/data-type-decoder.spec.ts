// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {TypedArrayConstructor} from '@math.gl/types';
import {dataTypeDecoder} from '@luma.gl/core';

const ARRAY_TEST_CASES: {typedArray: TypedArrayConstructor}[] = [
  {typedArray: Uint8Array},
  {typedArray: Int8Array},
  {typedArray: Uint16Array},
  {typedArray: Int16Array},
  {typedArray: Uint32Array},
  {typedArray: Int32Array},
  {typedArray: Float32Array}
];

test('shadertypes#getDataType', t => {
  for (const {typedArray} of ARRAY_TEST_CASES) {
    const dataType = dataTypeDecoder.getDataType(typedArray);
    const result = dataTypeDecoder.getTypedArrayConstructor(dataType);
    t.deepEqual(
      typedArray,
      result,
      `TypedArray '${typedArray.name}, => ${dataType} => ${result.name}`
    );
  }
  t.end();
});
