import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseSnappyDecompressionPlan} from '@luma.gl/gpgpu/gpu-parse';

it('parseSnappyDecompressionPlan parses literals and overlapping copies', () => {
  const compressed = Uint8Array.from([10, 8, 97, 98, 99, 22, 3, 0, 0, 33]);
  const plan = parseSnappyDecompressionPlan(compressed);
  expect(plan.outputByteLength).toBe(10);
  expect(plan.descriptorCount).toBe(3);
  expect(Array.from(plan.descriptors)).toEqual([0, 3, 2, 0, 3, 6, 0, 3, 9, 1, 9, 0]);
  expect(() => parseSnappyDecompressionPlan(Uint8Array.from([2, 0, 65]))).toThrow(/does not match/);
  expect(() => parseSnappyDecompressionPlan(Uint8Array.from([4, 2, 1, 0]))).toThrow(
    /outside the decoded prefix/
  );
});
