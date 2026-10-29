// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';

export function registerRotatingContactQualification({steps = 600}: {steps?: number} = {}): void {
  it(`sustains rotating contact exits for ${steps} ticks inside a bounded arena`, {
    timeout: 120000
  }, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const material = {restitution: 0.8, friction: 0};
    const world = new GPURigidBodyWorld({
      solver: 'parallel',
      timeStep: 1 / 120,
      iterations: 32,
      broadPhase: 'hierarchical-grid',
      maximumPairs: 128,
      gravity: [0, 0, 0],
      sleepAfter: 0,
      restitutionThreshold: 0,
      failurePolicy: 'rollback',
      continuous: {mode: 'convex', bodies: [0], maximumImpacts: 16, maximumCandidates: 128},
      bodies: [
        {...material, position: [0, 0, 4.2], shape: {type: 'sphere', radius: 0.15}},
        {
          ...material,
          mode: 'kinematic',
          position: [0, 0, 3],
          angularVelocity: [0, 120, 0],
          shape: {type: 'box', halfExtents: [2, 0.15, 0.05]}
        },
        ...[-6, 6].map(horizontal => ({
          ...material,
          mode: 'static' as const,
          position: [horizontal, 0, 4] as const,
          shape: {type: 'box' as const, halfExtents: [0.05, 2, 5] as const}
        })),
        ...[0, 9].map(vertical => ({
          ...material,
          mode: 'static' as const,
          position: [0, 0, vertical] as const,
          shape: {type: 'box' as const, halfExtents: [6, 2, 0.05] as const}
        }))
      ]
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    let maximumDisplacement = 0;
    try {
      for (let step = 0; step < steps; step++) {
        const encoder = device.createCommandEncoder();
        graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect((await world.readSimulationDiagnostics()).complete, `tick ${step}`).toBe(true);
        if (step % 20 === 0) {
          const state = (await world.readState())[0];
          expect(Math.abs(state.position[0])).toBeLessThan(6.05);
          expect(state.position[2]).toBeGreaterThan(-0.05);
          expect(state.position[2]).toBeLessThan(9.05);
          maximumDisplacement = Math.max(
            maximumDisplacement,
            Math.hypot(state.position[0], state.position[2] - 4.2)
          );
        }
      }
      expect(maximumDisplacement).toBeGreaterThan(1);
    } finally {
      graph.destroy();
      world.destroy();
    }
  });
}
