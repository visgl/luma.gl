// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {makeTexturePreviewPixels} from '../../examples/gpu-texture-preview';

test('texture display decodes float16, linear float32, and single-channel data', () => {
  expect(
    makeTexturePreviewPixels({
      width: 1,
      height: 1,
      format: 'rgba16float',
      data: new Uint8Array(new Uint16Array([0x3800, 0x3c00, 0, 0x3c00]).buffer)
    })
  ).toEqual(new Uint8ClampedArray([188, 255, 0, 255]));
  expect(
    makeTexturePreviewPixels({
      width: 1,
      height: 1,
      format: 'r32float',
      data: new Uint8Array(new Float32Array([0.5]).buffer)
    })
  ).toEqual(new Uint8ClampedArray([188, 188, 188, 255]));
  expect(
    makeTexturePreviewPixels({
      width: 1,
      height: 1,
      format: 'rgba32float',
      data: new Uint8Array(new Float32Array([NaN, Infinity, -Infinity, 0.5]).buffer)
    })
  ).toEqual(new Uint8ClampedArray([0, 255, 0, 128]));
});

test('texture display preserves sRGB bytes, swaps BGRA, and does not change the readback', () => {
  const data = new Uint8Array([10, 20, 30, 128]);
  expect(makeTexturePreviewPixels({width: 1, height: 1, format: 'bgra8unorm-srgb', data})).toEqual(
    new Uint8ClampedArray([30, 20, 10, 128])
  );
  expect([...data]).toEqual([10, 20, 30, 128]);
  expect(
    makeTexturePreviewPixels({
      width: 1,
      height: 1,
      format: 'rg8snorm',
      data: new Uint8Array([128, 127])
    })
  ).toEqual(new Uint8ClampedArray([0, 255, 0, 255]));
});

test('unsupported formats and truncated data retain numeric inspection without an image', () => {
  expect(
    makeTexturePreviewPixels({width: 1, height: 1, format: 'rgba8uint', data: new Uint8Array(4)})
  ).toBeUndefined();
  expect(
    makeTexturePreviewPixels({width: 1, height: 1, format: 'rgba32float', data: new Uint8Array(4)})
  ).toBeUndefined();
});
