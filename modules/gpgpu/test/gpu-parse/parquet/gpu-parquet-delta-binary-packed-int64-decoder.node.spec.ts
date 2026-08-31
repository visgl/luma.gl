// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseParquetDeltaBinaryPackedInt64Plan} from '@luma.gl/gpgpu/gpu-parse';
import {expect, it} from 'vitest';

const ENCODED = Uint8Array.from([
  128, 1, 4, 3, 128, 128, 128, 128, 32, 5, 3, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

it('parseParquetDeltaBinaryPackedInt64Plan retains split signed words', () => {
  const plan = parseParquetDeltaBinaryPackedInt64Plan(ENCODED);
  expect(plan.valueCount).toBe(3);
  expect(plan.firstValueLow).toBe(0);
  expect(plan.firstValueHigh).toBe(1);
  expect(plan.bytesConsumed).toBe(ENCODED.length);
  expect(Array.from(plan.miniBlockDescriptors)).toEqual([1, 2, 14, 3, 0xfffffffd, 0xffffffff]);
});
