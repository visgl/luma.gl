// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  getTextureFormatInfo,
  TextureFormat,
  getTextureFormatCapabilities,
  TextureFormatCapabilities
} from '@luma.gl/core';

// prettier-ignore
const TEST_CASES: {format: TextureFormat, result: any}[] = [
  // 8-bit formats
  {format: 'r8unorm', result: {attachment: 'color', dataType: 'uint8', components: 1, channels: 'r', integer: false, signed: false, normalized: true, bitsPerChannel: [8, 0, 0, 0], bytesPerPixel: 1, packed: false, srgb: false}},
  {format: 'r8snorm', result: {attachment: 'color', dataType: 'sint8', components: 1, channels: 'r', integer: false, signed: true, normalized: true, bitsPerChannel: [8, 0, 0, 0], bytesPerPixel: 1, packed: false, srgb: false}},
  {format: 'r8uint', result: {attachment: 'color', dataType: 'uint8', components: 1, channels: 'r', integer: true, signed: false, normalized: false, bitsPerChannel: [8, 0, 0, 0], bytesPerPixel: 1, packed: false, srgb: false}},
  {format: 'r8sint', result: {attachment: 'color', dataType: 'sint8', components: 1, channels: 'r', integer: true, signed: true, normalized: false, bitsPerChannel: [8, 0, 0, 0], bytesPerPixel: 1, packed: false, srgb: false}},

  // 16-bit formats
  {format: 'r16uint', result: {attachment: 'color', dataType: 'uint16', components: 1, channels: 'r', integer: true, signed: false, normalized: false, bitsPerChannel: [16, 0, 0, 0], bytesPerPixel: 2, packed: false, srgb: false}},
  {format: 'r16sint', result: {attachment: 'color', dataType: 'sint16', components: 1, channels: 'r', integer: true, signed: true, normalized: false, bitsPerChannel: [16, 0, 0, 0], bytesPerPixel: 2, packed: false, srgb: false}},
  {format: 'r16float', result: {attachment: 'color', dataType: 'float16', components: 1, channels: 'r', integer: false, signed: false, normalized: false, bitsPerChannel: [16, 0, 0, 0], bytesPerPixel: 2, packed: false, srgb: false }}
];

test('shadertype#getTextureFormatInfo', t => {
  for (const tc of TEST_CASES) {
    const decoded = getTextureFormatInfo(tc.format);

    t.deepEqual(
      decoded,
      {format: tc.format, ...tc.result},
      `getTextureFormatInfo('${tc.format}') => ${JSON.stringify(decoded.dataType)}`
    );
  }
  t.end();
});

// prettier-ignore
const TEST_CASES_CAPABILITIES: {format: TextureFormat, result: Omit<TextureFormatCapabilities, 'format'>}[] = [
  // 8-bit formats
  {format: 'r8unorm', result: {create: true, render: true, filter: true, blend: true, store: true}},

  // 16-bit formats
  {format: 'r16uint', result: {create: true, render: true, filter: false, blend: true, store: true}},
];

test('shadertype#getTextureFormatCapabilities', t => {
  for (const tc of TEST_CASES_CAPABILITIES) {
    const decoded = getTextureFormatCapabilities(tc.format);

    t.deepEqual(
      decoded,
      {format: tc.format, ...tc.result},
      `getVertexFormatInfo('${tc.format}') => ${JSON.stringify(decoded)}`
    );
  }
  t.end();
});
