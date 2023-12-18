// luma.gl, MIT license
import test from 'tape-promise/tape';
import {TypedArray, VertexFormat, getVertexFormatFromAttribute} from '@luma.gl/core';

const TEST_CASES: {value: TypedArray, size?: number, result: VertexFormat}[] = [
  {value: new Uint8Array(), size: 4, result: 'uint8x4'},
  {value: new Uint8ClampedArray(), size: 2, result: 'uint8x2'},
  {value: new Int8Array(), size: 4, result: 'sint8x4'},
  {value: new Uint16Array(), size: 4, result: 'uint16x4'},
  {value: new Int16Array(), size: 2, result: 'sint16x2'},
  {value: new Uint32Array(), size: 3, result: 'uint32x3'},
  {value: new Int32Array(), size: 1, result: 'sint32'},
  {value: new Float32Array(), size: 2, result: 'float32x2'},
  {value: new Float32Array(), size: 3, result: 'float32x3'},
  {value: new Float32Array(), size: 4, result: 'float32x4'}
];

test.only('api#getVertexFormatFromAttribute', t => {
  for (const {value, size, result} of TEST_CASES) {
    const vertexFormat = getVertexFormatFromAttribute({value, size});
    t.deepEqual(
      vertexFormat,
      result,
      `Attribute value '${value.constructor.name}, size: ${size}' => ${result}`
    );
  }
  t.end();
});
