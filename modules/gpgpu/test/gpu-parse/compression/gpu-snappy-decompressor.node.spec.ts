// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseSnappyDecompressionPlan} from '@luma.gl/gpgpu/gpu-parse';
import test from 'test/utils/vitest-tape';

test('parseSnappyDecompressionPlan parses literals and overlapping copies', testCase => {
  const compressed = Uint8Array.from([10, 8, 97, 98, 99, 22, 3, 0, 0, 33]);
  const plan = parseSnappyDecompressionPlan(compressed);
  testCase.equal(plan.outputByteLength, 10);
  testCase.equal(plan.descriptorCount, 3);
  testCase.deepEqual(Array.from(plan.descriptors), [0, 3, 2, 0, 3, 6, 0, 3, 9, 1, 9, 0]);
  testCase.throws(
    () => parseSnappyDecompressionPlan(Uint8Array.from([2, 0, 65])),
    /does not match/
  );
  testCase.throws(
    () => parseSnappyDecompressionPlan(Uint8Array.from([4, 2, 1, 0])),
    /outside the decoded prefix/
  );
  testCase.end();
});
