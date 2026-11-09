// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBody, type GPURigidBodyState} from '../../src/gpu-physics';

export function registerStackQualification(
  scenario: {
    name: string;
    levels: number;
    load: number;
    centerOffset: number;
  },
  {durationSeconds = 6}: {durationSeconds?: number} = {}
): void {
  it.for(
    (['ordered', 'parallel'] as const).flatMap(solver =>
      [1 / 120, 1 / 240].map(timeStep => ({...scenario, solver, timeStep, durationSeconds}))
    )
  )(
    'bounds sustained penetration, drift and residual energy for $name with $solver at $timeStep s for $durationSeconds s',
    async (scenario, context) => {
      const device = await getWebGPUTestDevice();
      if (!device) return context.skip('WebGPU unavailable');
      const timeStep = scenario.timeStep;
      const bodies: GPURigidBody[] = [
        {
          position: [0, 0, -0.5],
          mode: 'static',
          shape: {type: 'box', halfExtents: [5, 5, 0.5]},
          friction: 0.8,
          restitution: 0
        },
        ...Array.from(
          {length: scenario.levels},
          (_, level): GPURigidBody => ({
            position: [0, 0, level + 0.5],
            centerOfMass: [scenario.centerOffset, 0, 0],
            shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
            mass: level === scenario.levels - 1 ? scenario.load : 1,
            friction: 0.8,
            restitution: 0
          })
        )
      ];
      const world = new GPURigidBodyWorld({
        bodies,
        solver: scenario.solver,
        broadPhase: 'hierarchical-grid',
        timeStep,
        iterations: 64,
        maximumPairs: 64,
        warmStartFactor: 0.8,
        penetrationRecoveryFraction: 0.1,
        sleepAfter: 0,
        failurePolicy: 'rollback'
      });
      const definition = new GPUCommandGraph(device);
      world.addToGraph(definition);
      const graph = await definition.compileAsync();
      let finalState: GPURigidBodyState[] = [];
      try {
        const steps = Math.round(scenario.durationSeconds / timeStep);
        for (let start = 0; start < steps; start += 60) {
          const encoder = device.createCommandEncoder();
          for (let step = 0; step < Math.min(60, steps - start); step++)
            graph.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          expect(await world.readSimulationDiagnostics()).toMatchObject({
            complete: true,
            incompleteSteps: 0
          });
          finalState = await world.readState();
          for (let level = 1; level < finalState.length; level++) {
            const body = finalState[level];
            expect(body.position.every(Number.isFinite)).toBe(true);
            expect(
              Math.hypot(body.position[0] - scenario.centerOffset, body.position[1])
            ).toBeLessThan(0.12);
            expect(Math.abs(body.position[2] - (level - 0.5))).toBeLessThan(0.12);
            const supportHeight = level === 1 ? -0.5 : finalState[level - 1].position[2];
            expect(body.position[2] - supportHeight).toBeGreaterThan(0.94);
          }
        }
        let kineticEnergy = 0;
        for (let level = 1; level < finalState.length; level++) {
          const mass = level === scenario.levels ? scenario.load : 1;
          const body = finalState[level];
          // Unit-cube inertia about the authored COM: the parallel-axis term affects Y/Z.
          // Rotate world angular velocity back to that body frame before contracting the tensor.
          const localAngularVelocity = new Matrix4()
            .fromQuaternion(body.orientation)
            .invert()
            .transformAsVector(body.angularVelocity);
          const inertia = [
            mass / 6,
            mass * (1 / 6 + scenario.centerOffset ** 2),
            mass * (1 / 6 + scenario.centerOffset ** 2)
          ];
          kineticEnergy +=
            0.5 *
            (mass * body.velocity.reduce((sum, value) => sum + value * value, 0) +
              localAngularVelocity.reduce(
                (sum, value, axis) => sum + inertia[axis] * value * value,
                0
              ));
          expect(body.sleeping).toBe(false);
        }
        expect(kineticEnergy).toBeLessThan(0.02);
      } finally {
        graph.destroy();
        world.destroy();
      }
    },
    // Six simulated seconds at 240 Hz remains substantial work on CPU-backed adapters.
    240000
  );
}
