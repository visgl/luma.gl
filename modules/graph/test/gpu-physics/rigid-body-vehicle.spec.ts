// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';

it('supports chassis weight and transfers load forward under braking', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    timeStep: 1 / 120,
    gravity: [0, 0, -10],
    bodies: [
      {
        mode: 'static',
        mass: 0,
        position: [0, 0, -0.5],
        shape: {type: 'box', halfExtents: [50, 50, 0.5]}
      },
      {mass: 400, position: [0, 0, 1.3], shape: {type: 'box', halfExtents: [1.3, 0.6, 0.16]}}
    ],
    vehicle: {
      chassis: 1,
      terrainCollider: 0,
      radius: 0.4,
      travel: 0.5,
      springRate: 10000,
      damping: 1500,
      grip: 1,
      motorTorque: 250,
      brakeTorque: 600,
      wheelInertia: 1.2,
      wheels: [1, -1].flatMap(x =>
        [0.8, -0.8].map(y => ({mount: [x, y, 0] as const, drive: true, steer: x > 0}))
      )
    }
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  function advance(steps: number) {
    const encoder = device.createCommandEncoder();
    for (let i = 0; i < steps; i++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
  }
  try {
    advance(1);
    expect((await world.readVehicleWheels()).every(wheel => wheel.load === 0)).toBe(true);
    advance(240);
    const wheels = await world.readVehicleWheels();
    for (const wheel of wheels) {
      expect(wheel.load).toBeCloseTo(1000, -1);
      expect(wheel.length).toBeCloseTo(0.4, 2);
    }
    world.setVehicleControls(1, 0, 0);
    advance(90);
    const moving = (await world.readState())[1];
    expect(moving.velocity[0]).toBeGreaterThan(1);
    world.setVehicleControls(0, 0, 1);
    advance(24);
    const braking = (await world.readState())[1];
    const loads = await world.readVehicleWheels();
    expect(braking.velocity[0]).toBeLessThan(moving.velocity[0]);
    expect(loads[0].load).toBeGreaterThan(loads[2].load);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
