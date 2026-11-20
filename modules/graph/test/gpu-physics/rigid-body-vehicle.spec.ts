// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeTriangleMeshGeometry,
  rotateRigidBodyVector
} from '../../src/gpu-physics';

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
    const poses = world.vehicleWheelPoses!;
    const matrices = new Float32Array(
      (await poses.buffer.readAsync(poses.byteOffset, poses.byteLength)).buffer
    );
    expect(Array.from(matrices.slice(12, 14))).toEqual([1, Math.fround(0.8)]);
    expect(matrices[14]).toBeCloseTo(-0.4, 2);
    world.setBodyParameters(1, {centerOfMass: [0, 0, 0.12]});
    advance(1);
    const shifted = await world.readVehicleWheels();
    for (const wheel of shifted) expect(wheel.length).toBeCloseTo(0.4, 2);
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

it('steers with loaded wheels over sloped triangle terrain', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const geometry = makeTriangleMeshGeometry(
    [-16, -16, -0.4, 16, -16, 0, 16, 16, 1.2, -16, 16, 0],
    [0, 1, 2, 0, 2, 3]
  );
  const world = new GPURigidBodyWorld({
    timeStep: 1 / 120,
    gravity: [0, 0, -10],
    bodies: [
      {mass: 0, position: [0, 0, 0], shape: {type: 'triangle-mesh', geometry}},
      {mass: 400, position: [0, 0, 1.45], shape: {type: 'box', halfExtents: [1.3, 0.6, 0.16]}}
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
  try {
    world.setVehicleControls(1, 0.32, 0);
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 180; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const chassis = (await world.readState())[1];
    expect(chassis.position[0]).toBeGreaterThan(1);
    expect(chassis.orientation[2]).toBeGreaterThan(0.05);
    expect(
      (await world.readVehicleWheels()).filter(wheel => wheel.load > 0).length
    ).toBeGreaterThanOrEqual(3);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

/** Shared four-wheel fixture with the left/right wheels of each axle adjacent. */
const FLEET_WHEELS = [1, -1].flatMap(longitudinal =>
  [0.8, -0.8].map(lateral => ({
    mount: [longitudinal, lateral, 0] as const,
    drive: true,
    steer: longitudinal > 0
  }))
);

/** Shared vehicle tuning for fleet and towing qualification. */
const FLEET_SUSPENSION = {
  terrainCollider: 0,
  wheels: FLEET_WHEELS,
  radius: 0.4,
  travel: 0.5,
  springRate: 10000,
  damping: 1500,
  grip: 1,
  motorTorque: 250,
  brakeTorque: 600,
  wheelInertia: 1.2,
  steeringWheelbase: 2
};

/** Exercise chassis isolation, wheel publication and opt-in road handling at one fixed step. */
it('batches independently driven chassis and qualifies Ackermann steering and axle load transfer', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ground = {
    mass: 0,
    position: [0, 0, -0.5] as const,
    shape: {type: 'box' as const, halfExtents: [25, 25, 0.5] as const}
  };
  const chassis = [-4, 4].map(lateral => ({
    mass: 400,
    position: [0, lateral, 0.74] as const,
    orientation: [Math.sin(0.04), 0, 0, Math.cos(0.04)] as const,
    shape: {type: 'box' as const, halfExtents: [1.3, 0.6, 0.16] as const}
  }));

  const props = {
    timeStep: 1 / 120,
    gravity: [0, 0, -10] as const,
    bodies: [ground, ...chassis]
  };
  expect(
    () =>
      new GPURigidBodyWorld({
        ...props,
        vehicles: [
          {...FLEET_SUSPENSION, chassis: 1},
          {...FLEET_SUSPENSION, chassis: 1}
        ]
      })
  ).toThrow('Invalid vehicle configuration');
  const world = new GPURigidBodyWorld({
    ...props,
    vehicles: [
      {...FLEET_SUSPENSION, chassis: 1},
      {...FLEET_SUSPENSION, chassis: 2, antiRollRate: 2000, slipGain: [1, 1.3]}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const checkpoint = world.createGPUCheckpoint();
  /** Advance both chassis within a single suspension pass per fixed step. */
  function advanceFleet(steps: number): void {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < steps; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
  }
  try {
    expect(graph.stats.nodeOrder.filter(id => id.endsWith('-suspension'))).toHaveLength(1);
    const firstPoses = world.vehicleWheelPoses!;
    const secondPoses = world.getVehicleWheelPoses(1)!;
    expect(secondPoses.buffer).toBe(firstPoses.buffer);
    expect(secondPoses.byteOffset - firstPoses.byteOffset).toBe(512);
    expect(world.getVehicleWheelPoses(2)).toBeNull();

    checkpoint.save();
    world.setVehicleControls(0, 0.36, 0);
    world.setVehicleControls(0, -0.36, 0, 1);
    advanceFleet(1);
    const [first, second] = await Promise.all([
      world.readVehicleWheels(),
      world.readVehicleWheels(1)
    ]);
    expect(first[0].steering).toBeGreaterThan(0.36);
    expect(first[1].steering).toBeLessThan(0.36);
    expect(second[1].steering).toBeLessThan(-0.36);
    expect(second[0].steering).toBeGreaterThan(-0.36);
    expect(second[2].steering).toBe(0);
    expect(second[0].load).toBeLessThan(first[0].load);
    expect(second[1].load).toBeGreaterThan(first[1].load);
    expect(second[0].load + second[1].load).toBeCloseTo(first[0].load + first[1].load, 1);

    world.setVehicleControls(0, 1.5, 0);
    world.setVehicleControls(0, -1.5, 0, 1);
    advanceFleet(1);
    const [hardLeft, hardRight] = await Promise.all([
      world.readVehicleWheels(),
      world.readVehicleWheels(1)
    ]);
    expect(hardLeft[0].steering).toBeGreaterThan(hardLeft[1].steering);
    expect(hardRight[1].steering).toBeLessThan(hardRight[0].steering);
    expect(hardLeft[0].steering).toBeLessThan(Math.PI / 2);
    expect(hardRight[1].steering).toBeGreaterThan(-Math.PI / 2);

    checkpoint.restore();
    expect((await world.readVehicleWheels(1)).every(wheel => wheel.steering === 0)).toBe(true);
    world.setVehicleControls(1, 0, 0);
    world.setVehicleControls(-1, 0, 0, 1);
    advanceFleet(100);
    const [, forward, reverse] = await world.readState();
    expect(forward.velocity[0]).toBeGreaterThan(1);
    expect(reverse.velocity[0]).toBeLessThan(-1);
  } finally {
    checkpoint.destroy();
    graph.destroy();
    world.destroy();
  }
});

it('keeps a passive four-wheel trailer coupled to a powered chassis through a turn', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    solver: 'ordered',
    iterations: 24,
    timeStep: 1 / 120,
    gravity: [0, 0, -10],
    bodies: [
      {mass: 0, position: [0, 0, -0.5], shape: {type: 'box', halfExtents: [25, 25, 0.5]}},
      {mass: 400, position: [0, 0, 0.75], shape: {type: 'box', halfExtents: [1.3, 0.6, 0.16]}},
      {mass: 300, position: [-3, 0, 0.75], shape: {type: 'box', halfExtents: [1.3, 0.6, 0.16]}}
    ],
    joints: [
      {
        type: 'hinge',
        first: 1,
        second: 2,
        firstFrame: {position: [-1.5, 0, 0]},
        secondFrame: {position: [1.5, 0, 0]},
        limits: [-0.85, 0.85]
      }
    ],
    vehicles: [
      {...FLEET_SUSPENSION, chassis: 1},
      {
        ...FLEET_SUSPENSION,
        chassis: 2,
        wheels: FLEET_WHEELS.map(wheel => ({
          mount: wheel.mount,
          drive: false,
          steer: false
        }))
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    world.setVehicleControls(0.55, 0.25, 0);
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 220; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const [, towing, trailer] = await world.readState();
    const rearHitch = rotateRigidBodyVector(towing.orientation, [-1.5, 0, 0]);
    const frontHitch = rotateRigidBodyVector(trailer.orientation, [1.5, 0, 0]);
    const hitchError = Math.hypot(
      ...rearHitch.map(
        (offset, axis) => towing.position[axis] + offset - trailer.position[axis] - frontHitch[axis]
      )
    );
    expect(trailer.position[0]).toBeGreaterThan(-1);
    expect(Math.abs(towing.orientation[2] - trailer.orientation[2])).toBeGreaterThan(0.025);
    expect(hitchError).toBeLessThan(0.12);
    const trailerWheels = await world.readVehicleWheels(1);
    expect(trailerWheels.filter(wheel => wheel.load > 0).length).toBeGreaterThanOrEqual(3);
    expect(trailerWheels.every(wheel => wheel.steering === 0)).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
