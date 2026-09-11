// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {planGPUValueLifetimes} from '../../src/gpu-core/gpu-value-lifetime-planner';

describe('planGPUValueLifetimes', () => {
  it('reuses slots for non-overlapping lifetimes', () => {
    const plan = planGPUValueLifetimes([
      {id: 'alpha', format: 'float32', lifetime: {firstNode: 0, lastNode: 3}},
      {id: 'beta', format: 'float32', lifetime: {firstNode: 1, lastNode: 5}},
      {id: 'later', format: 'uint32', lifetime: {firstNode: 4, lastNode: 7}}
    ]);
    expect(plan.byteLength).toBe(8);
    expect(plan.reusedSlotCount).toBe(1);
    expect(plan.allocations[0].byteOffset).toBe(0);
    expect(plan.allocations[1].byteOffset).toBe(4);
    expect(plan.allocations[2].byteOffset).toBe(0);
  });

  it('does not reuse a slot while lifetimes overlap at a boundary node', () => {
    const plan = planGPUValueLifetimes([
      {id: 'a', format: 'float32', lifetime: {firstNode: 2, lastNode: 4}},
      {id: 'b', format: 'float32', lifetime: {firstNode: 4, lastNode: 6}}
    ]);
    expect(plan.byteLength).toBe(8);
    expect(plan.reusedSlotCount).toBe(0);
  });
});
