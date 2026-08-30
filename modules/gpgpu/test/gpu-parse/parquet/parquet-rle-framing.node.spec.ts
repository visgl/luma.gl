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

test('parseParquetBitPackedRunPlan adapts legacy encoding to the hybrid GPU decoder', testCase => {
  const plan = parseParquetBitPackedRunPlan(Uint8Array.from([0x88, 0xc6]), 2, 8);
  testCase.equal(plan.bytesConsumed, 2);
  testCase.deepEqual(Array.from(plan.runDescriptors), [0, 8, 0, 1]);
  testCase.throws(
    () => parseParquetBitPackedRunPlan(Uint8Array.from([0x88]), 2, 8),
    /payload is truncated/
  );
  testCase.end();
});
