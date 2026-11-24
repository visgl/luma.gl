// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  normalizeByteColor3,
  normalizeByteColor4
} from '../../../src/lib/color/normalize-byte-colors';

it('preserves plain-array conventions and opaque fallback', () => {
  expect(normalizeByteColor3()).toEqual([0, 0, 0]);
  expect(normalizeByteColor3([255, 128, 0])).toEqual([1, 128 / 255, 0]);
  expect(normalizeByteColor4([255, 128, 0])).toEqual([1, 128 / 255, 0, 1]);
  expect(normalizeByteColor4([1, 0.5, 0], false)).toEqual([1, 0.5, 0, 1]);
  for (const alpha of [NaN, Infinity, -Infinity]) {
    expect(normalizeByteColor4([255, 128, 0, alpha])).toEqual([1, 128 / 255, 0, 1]);
  }
  expect(normalizeByteColor4([255, 128, 0, 0])).toEqual([1, 128 / 255, 0, 0]);
  expect(normalizeByteColor3([2, -1, 0], false)).toEqual([2, -1, 0]);
});

for (const Constructor of [Uint8Array, Uint8ClampedArray]) {
  it(`decodes ${Constructor.name} independently of the array convention`, () => {
    const input = new Constructor([255, 128, 64, 0]);
    for (const useByteColors of [true, false]) {
      expect(normalizeByteColor3(input, useByteColors)).toEqual([1, 128 / 255, 64 / 255]);
      expect(normalizeByteColor4(input, useByteColors)).toEqual([1, 128 / 255, 64 / 255, 0]);
      expect(normalizeByteColor4(input.subarray(0, 3), useByteColors)).toEqual([
        1,
        128 / 255,
        64 / 255,
        1
      ]);
    }
    expect(Array.from(input)).toEqual([255, 128, 64, 0]);
  });
}

const floatConstructors = [Float32Array, Float64Array];
if (typeof Float16Array !== 'undefined') {
  floatConstructors.push(Float16Array);
}
for (const Constructor of floatConstructors) {
  it(`borrows exactly sized ${Constructor.name} inputs`, () => {
    const rgb = new Constructor([1, 0.5, 0]);
    const rgba = new Constructor([1, 0.5, 0, 0]);
    for (const useByteColors of [true, false]) {
      expect(normalizeByteColor3(rgb, useByteColors)).toBe(rgb);
      expect(normalizeByteColor4(rgba, useByteColors)).toBe(rgba);
      expect(normalizeByteColor4(rgb, useByteColors)).toEqual([1, 0.5, 0, 1]);
      expect(normalizeByteColor3(rgba, useByteColors)).toEqual([1, 0.5, 0]);
    }
    expect(normalizeByteColor4(new Constructor([1, 0.5, 0, NaN]))).toEqual([1, 0.5, 0, 1]);
    expect(normalizeByteColor4(new Constructor([1, 0.5, 0, 1, 2]))).toEqual([1, 0.5, 0, 1]);
    expect(Array.from(rgb)).toEqual([1, 0.5, 0]);
  });
}
