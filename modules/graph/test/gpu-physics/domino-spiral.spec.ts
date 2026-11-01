// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
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
            ).toBeLessThan(0.015);
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
      console.log(
        'Settled',
        frequency,
        states.filter(body => body.sleeping).length,
        states.length,
        'linear',
        states
          .slice(1)
          .map(body => Math.hypot(...body.velocity))
          .sort((first, second) => first - second)
          .filter((_, index) => index % 15 === 0),
        'angular',
        states
          .slice(1)
          .map(body => Math.hypot(...body.angularVelocity))
          .sort((first, second) => first - second)
          .filter((_, index) => index % 15 === 0)
      );
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
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    } finally {
      graph.destroy();
      world.destroy();
    }
  },
  600000
);
