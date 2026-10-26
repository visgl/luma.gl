// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';

it.for(['ordered', 'parallel'] as const)(
  'qualifies high constant world spin for dynamic and kinematic spheres with %s',
  async (solver, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const axis = [1 / Math.sqrt(14), 2 / Math.sqrt(14), 3 / Math.sqrt(14)];
    for (const timeStep of [1 / 60, 1 / 120]) {
      const speeds = [20, 80, 200, 20, 80, 200];
      const world = new GPURigidBodyWorld({
        solver,
        timeStep,
        gravity: [0, 0, 0],
        sleepAfter: 0,
        maximumPairs: 8,
        bodies: speeds.map((speed, index) => ({
          mode: index < 3 ? 'dynamic' : 'kinematic',
          position: [index * 4, 0, 0],
          shape: {type: 'sphere', radius: 0.5},
          orientation: [Math.sin(0.2), 0, 0, Math.cos(0.2)],
          angularVelocity: [axis[0] * speed, axis[1] * speed, axis[2] * speed]
        }))
      });
      const definition = new GPUCommandGraph(device);
      world.addToGraph(definition);
      const graph = await definition.compileAsync();
      try {
        for (let batch = 0; batch < 1 / timeStep; batch += 20) {
          const encoder = device.createCommandEncoder();
          for (let tick = 0; tick < 20; tick++) graph.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          await world.readSimulationDiagnostics();
        }
        expect((await world.readSimulationDiagnostics()).complete).toBe(true);
        for (const [index, state] of (await world.readState()).entries()) {
          const sine = Math.sin(speeds[index] / 2),
            cosine = Math.cos(speeds[index] / 2);
          // q(world axis, one second) * q(initial X rotation), independent analytic solution.
          const reference = [
            axis[0] * sine * Math.cos(0.2) + cosine * Math.sin(0.2),
            axis[1] * sine * Math.cos(0.2) + axis[2] * sine * Math.sin(0.2),
            axis[2] * sine * Math.cos(0.2) - axis[1] * sine * Math.sin(0.2),
            cosine * Math.cos(0.2) - axis[0] * sine * Math.sin(0.2)
          ];
          const alignment = Math.abs(
            reference.reduce(
              (sum, value, component) => sum + value * state.orientation[component],
              0
            )
          );
          expect(alignment).toBeGreaterThan(0.99999);
          expect(Math.abs(Math.hypot(...state.angularVelocity) - speeds[index])).toBeLessThan(0.01);
          expect(Math.abs(Math.hypot(...state.orientation) - 1)).toBeLessThan(1e-5);
        }
      } finally {
        graph.destroy();
        world.destroy();
      }
    }
  },
  120000
);
