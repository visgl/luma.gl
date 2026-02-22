// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  VertexFormat,
  getDataType,
  getTypedArrayConstructor,
  getVertexFormatFromAttribute
} from '@luma.gl/core';
import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';

const TEST_CASES: {
  typedArray: TypedArray;
  size?: number;
  normalized?: boolean;
  result?: VertexFormat;
  error?: string;
}[] = [
  {typedArray: new Uint8Array(), size: 4, result: 'uint8x4'},
  {typedArray: new Uint8ClampedArray(), size: 2, result: 'uint8x2'},
  {typedArray: new Int8Array(), size: 4, result: 'sint8x4'},
  {typedArray: new Uint16Array(), size: 4, result: 'uint16x4'},
  {typedArray: new Int16Array(), size: 2, result: 'sint16x2'},
  {typedArray: new Uint32Array(), size: 3, result: 'uint32x3'},
  {typedArray: new Int32Array(), size: 1, result: 'sint32'},
  {typedArray: new Float32Array(), size: 2, result: 'float32x2'},
  {typedArray: new Float32Array(), size: 3, result: 'float32x3'},
  {typedArray: new Float32Array(), size: 4, result: 'float32x4'},

  {typedArray: new Uint8Array(), size: 2, normalized: true, result: 'unorm8x2'},
  {typedArray: new Uint8ClampedArray(), size: 4, normalized: true, result: 'unorm8x4'},
  {typedArray: new Int8Array(), size: 2, normalized: true, result: 'snorm8x2'},
  {typedArray: new Uint16Array(), size: 2, normalized: true, result: 'unorm16x2'},
  {typedArray: new Int16Array(), size: 4, normalized: true, result: 'snorm16x4'},

  // WebGL-only formats (not supported in WebGPU)
  {typedArray: new Int16Array(), size: 3, result: 'sint16x3-webgl'},
  {typedArray: new Uint16Array(), size: 3, result: 'uint16x3-webgl'},
  {typedArray: new Uint16Array(), size: 3, normalized: true, result: 'unorm16x3-webgl'},
  {typedArray: new Int16Array(), size: 3, normalized: true, result: 'snorm16x3-webgl'},
  {typedArray: new Uint8Array(), size: 3, normalized: true, result: 'unorm8x3-webgl'},
  {typedArray: new Int8Array(), size: 3, normalized: true, result: 'snorm8x3-webgl'},

  // Error cases
  {typedArray: new Float32Array(), size: 5, error: 'Invalid attribute size 5'},
  {typedArray: new Int32Array(), error: 'Missing attribute size'},
  {typedArray: new Uint8Array(), size: 1, error: 'Bad 16 bit alignment'},
  {typedArray: new Float64Array(), size: 2, error: 'Unknown array format'}
];

test('shadertypes#getVertexFormatFromAttribute', t => {
  for (const {typedArray, size, normalized, result, error} of TEST_CASES) {
    if (result) {
      const vertexFormat = getVertexFormatFromAttribute(typedArray, size, normalized);
      t.deepEqual(
        vertexFormat,
        result,
        `Typed array: '${typedArray.constructor.name}, size: ${size}' => ${result}`
      );
    } else {
      t.throws(() => {
        getVertexFormatFromAttribute(typedArray, size);
      }, error);
    }
  }
  t.end();
});

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
    const dataType = getDataType(typedArray);
    const result = getTypedArrayConstructor(dataType);
    t.deepEqual(
      typedArray,
      result,
      `TypedArray '${typedArray.name}, => ${dataType} => ${result.name}`
    );
  }
  t.end();
});
