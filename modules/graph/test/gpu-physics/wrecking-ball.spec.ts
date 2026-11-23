// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';
import {
  makeWreckingBall,
  WRECKING_BALL_PHYSICS,
  WRECKING_BALL_ANCHOR,
  WRECKING_BALL_LENGTH
} from '../../../../examples/experimental/gpu-rigid-body-world/wrecking-ball';

it.each([60, 120])(
  'swings the constrained wrecking ball through the block pyramid at %s Hz',
  async (frequency, context) => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return context.skip('WebGPU unavailable');
    const mechanism = makeWreckingBall();
    const world = new GPURigidBodyWorld({
      ...mechanism,
      ...WRECKING_BALL_PHYSICS,
      solver: 'parallel',
      timeStep: 1 / frequency,
      failurePolicy: 'rollback',
      broadPhase: 'hierarchical-grid',
      gravity: [0, 0, -9.81]
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    const started = performance.now();
    let maximumJointError = 0;
    try {
      for (let second = 0; second < 8; second++) {
        const encoder = device.createCommandEncoder();
        for (let step = 0; step < frequency; step++) graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const states = await world.readState();
        const ball = states[2];
        maximumJointError = Math.max(
          maximumJointError,
          Math.abs(
            Math.hypot(
              ball.position[0] - WRECKING_BALL_ANCHOR[0],
              ball.position[1],
              ball.position[2] - WRECKING_BALL_ANCHOR[2]
            ) - WRECKING_BALL_LENGTH
          )
        );
        if (second === 0) {
          for (const [index, body] of states.slice(6).entries()) {
            expect(
              Math.hypot(
                ...body.position.map(
                  (value, axis) => value - mechanism.bodies[index + 6].position[axis]
                )
              )
            ).toBeLessThan(0.15);
          }
        }
      }
      const states = await world.readState();
      const displaced = states
        .slice(6)
        .filter(
          (body, index) =>
            Math.hypot(
              ...body.position.map(
                (value, axis) => value - mechanism.bodies[index + 6].position[axis]
              )
            ) > 0.75
        ).length;
      console.log({
        frequency,
        displaced,
        maximumJointError,
        milliseconds: performance.now() - started
      });
      expect(states.every(body => body.position.every(Number.isFinite))).toBe(true);
      expect(displaced).toBeGreaterThan(30);
      expect(maximumJointError).toBeLessThan(0.15);
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    } finally {
      graph.destroy();
      world.destroy();
    }
  },
  180000
);
