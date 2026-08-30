// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  parseParquetBitPackedRunPlan,
  parseParquetDictionaryIndicesPlan,
  parseParquetLengthPrefixedRleBitPackedRunPlan
} from '@luma.gl/gpgpu/gpu-parse';
import test from 'test/utils/vitest-tape';

test('parseParquetDictionaryIndicesPlan consumes and rebases the bit-width prefix', testCase => {
  const plan = parseParquetDictionaryIndicesPlan(Uint8Array.from([2, 6, 2]), 3);
  testCase.equal(plan.bitWidth, 2);
  testCase.equal(plan.bytesConsumed, 3);
  testCase.deepEqual(Array.from(plan.runPlan.runDescriptors), [0, 3, 2, 0]);
  testCase.end();
});

test('parseParquetLengthPrefixedRleBitPackedRunPlan consumes Data Page V1 framing', testCase => {
  const plan = parseParquetLengthPrefixedRleBitPackedRunPlan(
    Uint8Array.from([2, 0, 0, 0, 6, 1]),
    1,
    3
  );
  testCase.equal(plan.bytesConsumed, 6);
  testCase.deepEqual(Array.from(plan.runDescriptors), [0, 3, 5, 0]);
  testCase.throws(
    () => parseParquetLengthPrefixedRleBitPackedRunPlan(Uint8Array.from([3, 0, 0, 0, 6, 1]), 1, 3),
    /payload is truncated/
  );
  testCase.end();
});

test('parseParquetBitPackedRunPlan validates legacy MSB-first payloads', testCase => {
  const plan = parseParquetBitPackedRunPlan(Uint8Array.from([0x05, 0x39, 0x77]), 3, 8);
  testCase.deepEqual(plan, {bitWidth: 3, valueCount: 8, bytesConsumed: 3});
  testCase.throws(
    () => parseParquetBitPackedRunPlan(Uint8Array.from([0x05, 0x39]), 3, 8),
    /payload is truncated/
  );
  testCase.end();
});
