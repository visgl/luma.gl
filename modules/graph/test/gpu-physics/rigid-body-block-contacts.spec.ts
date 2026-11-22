// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {registerStackQualification} from './rigid-body-stack-qualification';
import {STACK_QUALIFICATION_SCENARIOS} from './rigid-body-stack-scenarios';

for (const scenario of Object.values(STACK_QUALIFICATION_SCENARIOS)) {
  registerStackQualification(scenario, {
    durationSeconds: 2,
    contactSolver: 'block',
    iterations: 24
  });
}

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';

it.for([true, false])(
  'retains compound static friction with block contacts, compact=%s',
  async (compactContacts, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const angle = 0.15;
    const orientation = [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)] as const;
    const normal = [Math.sin(angle), 0, Math.cos(angle)] as const;
    const world = new GPURigidBodyWorld({
      solver: 'parallel',
      parallelContactSolver: 'block',
      compactContacts,
      broadPhase: 'hierarchical-grid',
      iterations: 16,
      timeStep: 1 / 120,
      gravity: [0, 0, -9.81],
      sleepAfter: 0,
      bodies: [
        {
          shape: {type: 'box', halfExtents: [5, 5, 0.5]},
          position: [-normal[0] / 2, 0, -normal[2] / 2],
          orientation,
          mass: 0,
          restitution: 0,
          friction: 0.8
        },
        {
          position: [normal[0] / 2, 0, normal[2] / 2],
          orientation,
          mass: 1,
          restitution: 0,
          friction: 0.8,
          colliders: [-0.3, 0.3].map(horizontal => ({
            shape: {type: 'box', halfExtents: [0.3, 0.5, 0.5]},
            position: [horizontal, 0, 0]
          }))
        }
      ]
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    try {
      for (let batch = 0; batch < 8; batch++) {
        const encoder = device.createCommandEncoder();
        for (let step = 0; step < 30; step++) graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const state = (await world.readState())[1];
        expect(
          Math.hypot(
            state.position[0] - normal[0] / 2,
            state.position[1],
            state.position[2] - normal[2] / 2
          )
        ).toBeLessThan(0.03);
        expect(Math.hypot(...state.velocity)).toBeLessThan(0.04);
        expect(Math.hypot(...state.angularVelocity)).toBeLessThan(0.04);
        expect(state.sleeping).toBe(false);
      }
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    } finally {
      graph.destroy();
      world.destroy();
    }
  },
  120000
);
