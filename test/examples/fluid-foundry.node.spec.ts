// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {getFoundryNozzleCycleState} from '../../examples/experimental/fluid-foundry/app';

describe('Fluid Foundry nozzle schedule', () => {
  test('stages staggered automatic nozzle pressure cycles', () => {
    expect(getFoundryNozzleCycleState(2, 0)).toEqual({
      activity: 0,
      emissionProgress: 0,
      firing: false,
      cycleIndex: -1
    });

    const primaryCharge = getFoundryNozzleCycleState(3.45, 0);
    expect(primaryCharge.activity).toBeGreaterThan(0);
    expect(primaryCharge.activity).toBeLessThan(1);
    expect(primaryCharge.firing).toBe(false);

    const primaryBurst = getFoundryNozzleCycleState(4.2, 0);
    expect(primaryBurst.firing).toBe(true);
    expect(primaryBurst.emissionProgress).toBeGreaterThan(0);
    expect(primaryBurst.emissionProgress).toBeLessThan(1);
    expect(primaryBurst.activity).toBeGreaterThan(1);
    expect(getFoundryNozzleCycleState(4.2, 1).firing).toBe(false);

    const primaryCooldown = getFoundryNozzleCycleState(4.8, 0);
    expect(primaryCooldown.emissionProgress).toBe(1);
    expect(primaryCooldown.activity).toBeGreaterThan(0);
    expect(primaryCooldown.firing).toBe(false);

    const secondaryBurst = getFoundryNozzleCycleState(7.7, 1);
    expect(secondaryBurst.firing).toBe(true);
    expect(secondaryBurst.activity).toBeGreaterThan(1);
  });
});
