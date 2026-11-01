// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';
import {
  makeDominoSpiral,
  DOMINO_PHYSICS
} from '../../../../examples/experimental/gpu-rigid-body-world/scenes';

it.each([120, 60])(
  'propagates one initial nudge through the spiral at %s Hz',
  async (frequency, context) => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return context.skip('WebGPU unavailable');
    const bodies = makeDominoSpiral();
    const world = new GPURigidBodyWorld({
      bodies,
      solver: 'parallel',
      iterations: 32,
      ...DOMINO_PHYSICS,
      timeStep: 1 / frequency,
      gravity: [0, 0, -9.81],
      failurePolicy: 'rollback'
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    try {
      const started = performance.now();
      let encodingMilliseconds = 0;
      let steps = 0;
      let earlyPositions: number[][] | undefined;
      for (let second = 0; second < 90; second++) {
        const encoder = device.createCommandEncoder();
        const encodingStarted = performance.now();
        for (let step = 0; step < frequency; step++) graph.encode(encoder, {parameters: undefined});
        encodingMilliseconds += performance.now() - encodingStarted;
        steps += frequency;
        device.submit(encoder.finish());
        const states = await world.readState();
        if (second === 9) earlyPositions = states.slice(1, 6).map(body => [...body.position]);
        if (second === 11) {
          console.log(
            'early wobble',
            frequency,
            states
              .slice(1, 6)
              .map((body, index) =>
                Math.hypot(
                  ...body.position.map((value, axis) => value - earlyPositions![index][axis])
                )
              )
          );
          for (let index = 0; index < 5; index++) {
            const body = states[index + 1];
            expect(
              Math.hypot(
                ...body.position.map((value, axis) => value - earlyPositions![index][axis])
              )
            ).toBeLessThan(0.01);
          }
        }
        if (second === 0) {
          expect(states[1].position[2]).toBeLessThan(0.74);
          expect(states.at(-1)!.position[2]).toBeGreaterThan(0.7);
        }
        if (states.at(-1)!.position[2] < 0.4 && states.slice(1).every(body => body.sleeping)) break;
      }
      console.log(
        JSON.stringify({
          diagnostics: await world.readSimulationDiagnostics(),
          frequency,
          steps,
          elapsedMilliseconds: performance.now() - started,
          encodingMilliseconds,
          millisecondsPerStep: (performance.now() - started) / steps
        })
      );
      const states = await world.readState();
      expect(states.slice(1).filter(body => body.sleeping).length).toBeGreaterThan(
        bodies.length * 0.9
      );
      expect(states.at(-1)!.position[2]).toBeLessThan(0.4);
      expect(
        states
          .slice(1)
          .filter(body => 1 - 2 * (body.orientation[0] ** 2 + body.orientation[1] ** 2) < 0.7)
          .length
      ).toBeGreaterThan(bodies.length * 0.9);
      for (let index = 1; index <= 10; index++) {
        const initial = bodies[index].orientation!;
        const heading = Math.atan2(
          2 * (initial[3] * initial[2] + initial[0] * initial[1]),
          1 - 2 * (initial[1] ** 2 + initial[2] ** 2)
        );
        const rotation = states[index].orientation;
        const forward =
          2 * (rotation[0] * rotation[2] + rotation[3] * rotation[1]) * Math.cos(heading) +
          2 * (rotation[1] * rotation[2] - rotation[3] * rotation[0]) * Math.sin(heading);
        expect(forward).toBeGreaterThan(0.6);
      }
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
      const resting = device.createCommandEncoder();
      for (let step = 0; step < frequency * 2; step++)
        graph.encode(resting, {parameters: undefined});
      device.submit(resting.finish());
      expect(await world.readState()).toEqual(states);
    } finally {
      graph.destroy();
      world.destroy();
    }
  },
  600000
);
