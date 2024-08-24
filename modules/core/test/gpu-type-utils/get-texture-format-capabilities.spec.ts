// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  getTextureFormatCapabilities,
  TextureFormat,
  TextureFormatCapabilities
} from '@luma.gl/core';

// prettier-ignore
const TEST_CASES: {format: TextureFormat, result: Omit<TextureFormatCapabilities, 'format'>}[] = [
  // 8-bit formats
  {format: 'r8unorm', result: {create: true, render: true, filter: true, blend: true, store: true}},

  // 16-bit formats
  {format: 'r16uint', result: {create: true, render: true, filter: true, blend: true, store: true}},
];

test('shadertype#getTextureFormatCapabilities', t => {
  for (const tc of TEST_CASES) {
    const decoded = getTextureFormatCapabilities(tc.format);

    t.deepEqual(
      decoded,
      {format: tc.format, ...tc.result},
      `decodeVertexFormat('${tc.format}') => ${JSON.stringify(decoded)}`
    );
  }
  t.end();
});
