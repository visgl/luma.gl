// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {runRigidBodyWorld} from './rigid-body-stability-test-utils';

export function registerStackStability({steps = 600}: {steps?: number} = {}): void {
  it.for(['ordered', 'parallel'] as const)(
    'bounds eight-box stack drift and penetration with %s solving',
    async (solver, context) => {
      const state = await runRigidBodyWorld(
        {
          solver,
          broadPhase: 'hierarchical-grid',
          iterations: 64,
          gravity: [0, 0, -9.81],
          bodies: [
            {
              position: [0, 0, -0.5],
              mass: 0,
              shape: {type: 'box', halfExtents: [10, 10, 0.5]},
              friction: 0.8,
              restitution: 0
            },
            ...Array.from({length: 8}, (_, level) => ({
              position: [0, 0, 0.5 + level] as [number, number, number],
              mass: 1,
              shape: {type: 'box' as const, halfExtents: [0.5, 0.5, 0.5] as const},
              restitution: 0,
              friction: 0.8
            }))
          ]
        },
        steps
      );
      if (!state) return context.skip('WebGPU is unavailable');
      for (let index = 1; index < state.length; index++) {
        expect(Math.hypot(state[index].position[0], state[index].position[1])).toBeLessThan(0.1);
        expect(Math.abs(state[index].position[2] - (index - 0.5))).toBeLessThan(0.12);
        expect(Math.hypot(...state[index].velocity)).toBeLessThan(0.1);
      }
    },
    120000
  );
}
