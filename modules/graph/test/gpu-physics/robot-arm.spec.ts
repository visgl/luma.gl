// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeArmContactTrial} from '../../../../examples/experimental/gpu-rigid-body-world/robot-arm-contact';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';
import {
  ARM_STIFFNESS,
  makeRobotArm,
  measureRobotArm
} from '../../../../examples/experimental/gpu-rigid-body-world/robot-arm';

it.for([
  60, 120
])('holds a calibrated load and responds to a new actuator target at %s Hz', async (frequency, context) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    ...makeRobotArm(0.5, 1, false),
    gravity: [0, 0, -9.81],
    iterations: 32,
    timeStep: 1 / frequency
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = (steps: number) => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < steps; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
  };
  try {
    expect(() => world.setAngularActuator('missing', 1, {angle: 0})).toThrow();
    expect(() => world.setAngularActuator('shoulder', 0, {angle: 0})).toThrow();
    // One kilogram-meter of total moment arm: half from the link and half from its payload.
    world.setAngularActuator('shoulder', 1, {angle: -9.81 / ARM_STIFFNESS, maximumTorque: 35});
    advance(2 * frequency);
    expect(await world.readAngularActuatorTorque('shoulder', 1)).toBeCloseTo(-9.81, 1);
    expect(measureRobotArm(await world.readState(), 1, 0).tipError).toBeLessThan(0.01);
    const target = -0.35;
    world.setAngularActuator('shoulder', 1, {
      angle: target - (9.81 * Math.cos(target)) / ARM_STIFFNESS
    });
    let lastOutsideTolerance = 0;
    let overshoot = 0;
    for (let sample = 1; sample <= 20; sample++) {
      advance(frequency / 10);
      const measurement = measureRobotArm(await world.readState(), 1, target);
      overshoot = Math.max(overshoot, target - measurement.angle);
      if (measurement.tipError > 0.02) lastOutsideTolerance = sample / 10;
    }
    expect(lastOutsideTolerance).toBeLessThan(1.5);
    expect(overshoot).toBeLessThan(0.15);
    world.setAngularActuator('shoulder', 1, {angle: 0.5, maximumTorque: 1});
    advance(1);
    expect(await world.readAngularActuatorTorque('shoulder', 1)).toBeCloseTo(1, 2);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('loads the work stop and lifts away on a new elbow command', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    ...makeRobotArm(1),
    gravity: [0, 0, -9.81],
    iterations: 64,
    timeStep: 1 / 120
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async () => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 120; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return (await world.readState())[6];
  };
  try {
    world.setAngularActuator('elbow', 1, {angle: 0.65, maximumTorque: 25});
    await advance();
    const supported = await advance();
    // The 0.25 m payload rests on the 1.04 m-high work stop.
    expect(supported.position[0]).toBeGreaterThan(3);
    expect(supported.position[2]).toBeCloseTo(1.29, 1);
    world.setAngularActuator('elbow', 1, {angle: -0.3, maximumTorque: 150});
    await advance();
    expect((await advance()).position[2]).toBeGreaterThan(2);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('transmits a compressive reaction through the tree and releases it on lift', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const trial = makeArmContactTrial(true);
  const definition = new GPUCommandGraph(device);
  trial.world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (const press of [true, false]) {
      trial.command(press);
      const encoder = device.createCommandEncoder();
      for (let step = 0; step < 240; step++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      const status = await trial.world.readSimulationDiagnostics();
      expect(status.complete).toBe(true);
      expect(status.steps).toBe(press ? 240 : 480);
      const force = 'normalForce' in status ? status.normalForce : undefined;
      if (press) {
        expect(await trial.payloadHeight()).toBeCloseTo(trial.seatHeight, 2);
        expect(force).toBeGreaterThan(1);
      } else {
        expect(await trial.payloadHeight()).toBeGreaterThan(2);
        expect(force).toBe(0);
      }
    }
  } finally {
    graph.destroy();
    trial.world.destroy();
  }
});
