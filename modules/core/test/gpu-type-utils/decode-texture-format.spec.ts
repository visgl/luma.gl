// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {decodeTextureFormat, TextureFormat} from '@luma.gl/core';

// prettier-ignore
const TEST_CASES: {format: TextureFormat, result: any}[] = [
  // 8-bit formats
  {format: 'r8unorm', result: {channels: 'r', components: 1, dataType: 'uint8', byteLength: 1, integer: false, signed: false, normalized: true}},
  {format: 'r8snorm', result: {channels: 'r', components: 1, dataType: 'sint8', byteLength: 1, integer: false, signed: true, normalized: true}},
  {format: 'r8uint', result: {channels: 'r', components: 1, dataType: 'uint8', byteLength: 1, integer: true, signed: false, normalized: false}},
  {format: 'r8sint', result: {channels: 'r', components: 1, dataType: 'sint8', byteLength: 1, integer: true, signed: true, normalized: false}},

  // 16-bit formats
  {format: 'r16uint', result: {channels: 'r', components: 1, dataType: 'uint16', byteLength: 2, integer: true, signed: false, normalized: false}},
  {format: 'r16sint', result: {channels: 'r', components: 1, dataType: 'sint16', byteLength: 2, integer: true, signed: true, normalized: false}},
  {format: 'r16float', result: {channels: 'r', components: 1, dataType: 'float16', byteLength: 2, integer: false, signed: false, normalized: false }}
];

test('api#decodeTextureFormat', t => {
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
