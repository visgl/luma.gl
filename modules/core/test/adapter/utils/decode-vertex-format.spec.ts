// luma.gl, MIT license
import test from 'tape-promise/tape';
import {decodeVertexFormat, VertexFormat} from '@luma.gl/core';

// prettier-ignore
const TEST_CASES: {format: VertexFormat, result: any}[] = [
  {format: 'float32', result: {type: 'float32', components: 1, byteLength: 4, integer: false, signed: false, normalized: false}},
  {format: 'uint32', result: {type: 'uint32', components: 1, byteLength: 4, integer: true, signed: false, normalized: false}},
  {format: 'sint32', result: {type: 'sint32', components: 1, byteLength: 4, integer: true, signed: true, normalized: false}},

  {format: 'uint8x2', result: {type: 'uint8', components: 2, byteLength: 2, integer: true, signed: false, normalized: false}},
  {format: 'sint8x2', result: {type: 'sint8', components: 2, byteLength: 2, integer: true, signed: true, normalized: false}},
  {format: 'unorm8x2', result: {type: 'unorm8', components: 2, byteLength: 2, integer: false, signed: false, normalized: true}},
  {format: 'snorm8x2', result: {type: 'snorm8', components: 2, byteLength: 2, integer: false, signed: true, normalized: true}},
  {format: 'uint16x2', result: {type: 'uint16', components: 2, byteLength: 4, integer: true, signed: false, normalized: false}},
  {format: 'sint16x2', result: {type: 'sint16', components: 2, byteLength: 4, integer: true, signed: true, normalized: false}},
  {format: 'unorm16x2', result: {type: 'unorm16', components: 2, byteLength: 4, integer: false, signed: false, normalized: true}},
  {format: 'snorm16x2', result: {type: 'snorm16', components: 2, byteLength: 4, integer: false, signed: true, normalized: true}},
  {format: 'float16x2', result: {type: 'float16', components: 2, byteLength: 4, integer: false, signed: false, normalized: false}},
  {format: 'float32x2', result: {type: 'float32', components: 2, byteLength: 8, integer: false, signed: false, normalized: false}},
  {format: 'uint32x2', result: {type: 'uint32', components: 2, byteLength: 8, integer: true, signed: false, normalized: false}},
  {format: 'sint32x2', result: {type: 'sint32', components: 2, byteLength: 8, integer: true, signed: true, normalized: false}},
];

test('api#decodeVertexFormat', (t) => {
  for (const tc of TEST_CASES) {
    const decoded = decodeVertexFormat(tc.format);
    t.deepEqual(
      decoded,
      tc.result,
      `decodeVertexFormat('${tc.format}') => ${JSON.stringify(decoded.type)}`
    );
  }
  t.end();
});
