// luma.gl, MIT license
import test from 'tape-promise/tape';
import {decodeTextureFormat, TextureFormat} from '@luma.gl/api';

// prettier-ignore
const TEST_CASES: {format: TextureFormat, result: any}[] = [
  // 8-bit formats
  {format: 'r8unorm', result: { format: 'r', dataType: 'unorm8', byteLength: 1, integer: true, signed: false, normalized: true }},
  {format: 'r8snorm', result: { format: 'r', dataType: 'snorm8', byteLength: 1, integer: true, signed: true, normalized: true }},
  {format: 'r8uint', result: { format: 'r', dataType: 'uint8', byteLength: 1, integer: true, signed: false, normalized: false }},
  {format: 'r8sint', result: { format: 'r', dataType: 'sint8', byteLength: 1, integer: true, signed: true, normalized: false }},

  // 16-bit formats
  {format: 'r16uint', result: { format: 'r', dataType: 'uint16', byteLength: 2, integer: true, signed: false, normalized: false }},
  {format: 'r16sint', result: { format: 'r', dataType: 'sint16', byteLength: 2, integer: true, signed: true, normalized: false }},
  {format: 'r16float', result: { format: 'r', dataType: 'float16', byteLength: 2, integer: false, signed: false, normalized: false }}
];


test('api#decodeVertexFormat', (t) => {
  for (const tc of TEST_CASES) {
    const decoded = decodeTextureFormat(tc.format);
    t.deepEqual(
      decoded,
      tc.result,
      `decodeVertexFormat('${tc.format}') => ${JSON.stringify(decoded.dataType)}`
    );
  }
  t.end();
});
