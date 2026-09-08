// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  parseParquetBitPackedRunPlan,
  parseParquetDictionaryIndicesPlan,
  parseParquetLengthPrefixedRleBitPackedRunPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {expect, it} from 'vitest';

it('parseParquetDictionaryIndicesPlan consumes and rebases the bit-width prefix', () => {
  const plan = parseParquetDictionaryIndicesPlan(Uint8Array.from([2, 6, 2]), 3);
  expect(plan.bitWidth).toBe(2);
  expect(plan.bytesConsumed).toBe(3);
  expect(Array.from(plan.runPlan.runDescriptors)).toEqual([0, 3, 2, 0]);
});

it('parseParquetLengthPrefixedRleBitPackedRunPlan consumes Data Page V1 framing', () => {
  const plan = parseParquetLengthPrefixedRleBitPackedRunPlan(
    Uint8Array.from([2, 0, 0, 0, 6, 1]),
    1,
    3
  );
  expect(plan.bytesConsumed).toBe(6);
  expect(Array.from(plan.runDescriptors)).toEqual([0, 3, 5, 0]);
  expect(() =>
    parseParquetLengthPrefixedRleBitPackedRunPlan(Uint8Array.from([3, 0, 0, 0, 6, 1]), 1, 3)
  ).toThrow(/payload is truncated/);
});

it('parseParquetBitPackedRunPlan validates legacy MSB-first payloads', () => {
  const plan = parseParquetBitPackedRunPlan(Uint8Array.from([0x05, 0x39, 0x77]), 3, 8);
  expect(plan).toEqual({bitWidth: 3, valueCount: 8, bytesConsumed: 3});
  expect(() => parseParquetBitPackedRunPlan(Uint8Array.from([0x05, 0x39]), 3, 8)).toThrow(
    /payload is truncated/
  );
});
