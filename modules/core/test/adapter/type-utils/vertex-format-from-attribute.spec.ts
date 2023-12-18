// luma.gl, MIT license
import test from 'tape-promise/tape';
import {TypedArray, VertexFormat, getVertexFormatFromAttribute} from '@luma.gl/core';

const TEST_CASES: {value: TypedArray, size?: number, result?: VertexFormat, error?: string}[] = [
  {value: new Uint8Array(), size: 4, result: 'uint8x4'},
  {value: new Uint8ClampedArray(), size: 2, result: 'uint8x2'},
  {value: new Int8Array(), size: 4, result: 'sint8x4'},
  {value: new Uint16Array(), size: 4, result: 'uint16x4'},
  {value: new Int16Array(), size: 2, result: 'sint16x2'},
  {value: new Uint32Array(), size: 3, result: 'uint32x3'},
  {value: new Int32Array(), size: 1, result: 'sint32'},
  {value: new Float32Array(), size: 2, result: 'float32x2'},
  {value: new Float32Array(), size: 3, result: 'float32x3'},
  {value: new Float32Array(), size: 4, result: 'float32x4'},

  {value: new Float32Array(), size: 5, error: 'Invalid attribute size 5'},
  {value: new Int32Array(), error: 'Missing attribute size'},
  {value: new Uint8Array(), size: 1, error: 'Bad 16 bit alignment'},
  {value: new Int16Array(), size: 3, error: 'Bad 32 bit alignment'},
  {value: new Float64Array(), size: 2, error: 'Unknown array format'},
];

test('api#getVertexFormatFromAttribute', t => {
  for (const {value, size, result, error} of TEST_CASES) {
    if (result) {
      const vertexFormat = getVertexFormatFromAttribute({value, size});
      t.deepEqual(
        vertexFormat,
        result,
        `Attribute value '${value.constructor.name}, size: ${size}' => ${result}`
      );
    } else {
      t.throws(() => {
        getVertexFormatFromAttribute({value, size});
      }, error);
    }
  }
  t.end();
});
