// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseParquetDeltaBinaryPackedInt64Plan} from '@luma.gl/gpgpu/gpu-parse';
import test from 'test/utils/vitest-tape';

const ENCODED = Uint8Array.from([
  128, 1, 4, 3, 128, 128, 128, 128, 32, 5, 3, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

test('parseParquetDeltaBinaryPackedInt64Plan retains split signed words', testCase => {
  const plan = parseParquetDeltaBinaryPackedInt64Plan(ENCODED);
  testCase.equal(plan.valueCount, 3);
  testCase.equal(plan.firstValueLow, 0);
  testCase.equal(plan.firstValueHigh, 1);
  testCase.equal(plan.bytesConsumed, ENCODED.length);
  testCase.deepEqual(Array.from(plan.miniBlockDescriptors), [1, 2, 14, 3, 0xfffffffd, 0xffffffff]);
  testCase.end();
});
