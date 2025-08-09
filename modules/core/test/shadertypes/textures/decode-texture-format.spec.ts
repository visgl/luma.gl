// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  textureFormatDecoder,
  type TextureFormat,
  type TextureFormatCapabilities
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

test('shadertype#textureFormatDecoder.getInfo', t => {
  for (const tc of TEST_CASES) {
    const decoded = textureFormatDecoder.getInfo(tc.format);

    t.deepEqual(
      decoded,
      {format: tc.format, ...tc.result},
      `textureFormatDecoder.getInfo('${tc.format}') => ${JSON.stringify(decoded.dataType)}`
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

test('shadertype#textureFormatDecoder.getCapabilities', t => {
  for (const tc of TEST_CASES_CAPABILITIES) {
    const decoded = textureFormatDecoder.getCapabilities(tc.format);

    t.deepEqual(
      decoded,
      {format: tc.format, ...tc.result},
      `getVertexFormatInfo('${tc.format}') => ${JSON.stringify(decoded)}`
    );
  }
  t.end();
});

/**
 * Compute bytesPerPixel from format metadata.
 * If you prefer not to pass `bytesPerPixel` into `textureFormatDecoder.computeMemoryLayout`,
 * you can derive it from `TextureFormat` via this helper.
 */
const bytesPerPixelFromFormat = (format: TextureFormat) =>
  textureFormatDecoder.getInfo(format).bytesPerPixel;

test('bytesPerPixelFromFormat', t => {
  t.equal(bytesPerPixelFromFormat('r8unorm'), 1, 'r8unorm = 1 B/px');
  t.equal(bytesPerPixelFromFormat('rgba8unorm'), 4, 'rgba8unorm = 4 B/px');
  t.equal(bytesPerPixelFromFormat('bgra8unorm'), 4, 'bgra8unorm = 4 B/px');
  t.equal(bytesPerPixelFromFormat('r16uint'), 2, 'r16uint = 2 B/px');
  t.equal(bytesPerPixelFromFormat('rgba16uint'), 8, 'rgba16uint = 8 B/px');
  t.equal(bytesPerPixelFromFormat('rgba16float'), 8, 'rgba16float = 8 B/px');
  t.equal(bytesPerPixelFromFormat('r32uint'), 4, 'r32uint = 4 B/px');
  t.equal(bytesPerPixelFromFormat('rgba32uint'), 16, 'rgba32uint = 16 B/px');
  t.equal(bytesPerPixelFromFormat('r32float'), 4, 'r32float = 4 B/px');
  t.equal(bytesPerPixelFromFormat('rgba32float'), 16, 'rgba32float = 16 B/px');
  t.end();
});
