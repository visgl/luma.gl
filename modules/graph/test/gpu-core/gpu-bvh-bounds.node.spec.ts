// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, expectTypeOf, it} from 'vitest';
import {packGPUBVHBounds} from '../../src/gpu-core';

it('splits BoxIndex records in order without mutating the CPU input', () => {
  /** Two packed planar boxes, including a point box. */
  const bounds = new Float64Array([4, 5, 7, 11, -1, -2, -1, -2]);
  /** An origin translates both corners without changing source row order. */
  const packed = packGPUBVHBounds({dimension: 2, bounds, origin: [1, 2]});
  expectTypeOf(packed.format).toEqualTypeOf<'float32x2'>();
  expect(packed.format).toBe('float32x2');
  expect(packed.length).toBe(2);
  expect([...packed.minima]).toEqual([3, 3, -2, -4]);
  expect([...packed.maxima]).toEqual([6, 9, -2, -4]);
  expect([...bounds]).toEqual([4, 5, 7, 11, -1, -2, -1, -2]);
});

it('rebases large coordinates before narrowing and rounds corner bounds outward', () => {
  /** Narrowing a billion-unit position first would lose its local offset. */
  const packed = packGPUBVHBounds({
    dimension: 3,
    bounds: [1000000000.25, 0.1, -0.1, 1000000000.75, 0.1, -0.1],
    origin: [1000000000, 0, 0]
  });
  expectTypeOf(packed.format).toEqualTypeOf<'float32x3'>();
  expect(packed.minima[0]).toBe(0.25);
  expect(packed.maxima[0]).toBe(0.75);
  expect(packed.minima[1]).toBeLessThan(0.1);
  expect(packed.maxima[1]).toBe(Math.fround(0.1));
  expect(packed.minima[2]).toBe(Math.fround(-0.1));
  expect(packed.maxima[2]).toBeGreaterThan(-0.1);
});

it('handles empty inputs and avoids inward rounding on GPUs that flush subnormals', () => {
  /** Negative and positive subnormal coordinates become conservative normal bounds. */
  const packed = packGPUBVHBounds({dimension: 2, bounds: [-(2 ** -147), 2 ** -147, 0, 2 ** -147]});
  expect([...packed.minima]).toEqual([-(2 ** -126), 0]);
  expect([...packed.maxima]).toEqual([0, 2 ** -126]);
  expect(packGPUBVHBounds({dimension: 3, bounds: []})).toEqual({
    format: 'float32x3',
    length: 0,
    minima: new Float32Array(),
    maxima: new Float32Array()
  });
});

it('rejects partial records, reversed bounds, nonfinite values and narrowing overflow', () => {
  expect(() => packGPUBVHBounds({dimension: 2, bounds: [0, 0, 1]})).toThrow('layout');
  expect(() => packGPUBVHBounds({dimension: 2, bounds: [1, 0, 0, 1], origin: [1e30, 0]})).toThrow(
    'order'
  );
  expect(() => packGPUBVHBounds({dimension: 2, bounds: [], origin: [Infinity, 0]})).toThrow(
    'origin'
  );
  expect(() => packGPUBVHBounds({dimension: 3, bounds: [], origin: [0, 0]})).toThrow('origin');
  expect(() => packGPUBVHBounds({dimension: 2, bounds: [NaN, 0, 1, 1]})).toThrow('float32');
  expect(() => packGPUBVHBounds({dimension: 2, bounds: [0, 0, 3.5e38, 1]})).toThrow('float32');
});
