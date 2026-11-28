// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  makeGripperTrial,
  REACH,
  DESTINATION_ANGLE
} from '../../../../examples/experimental/gpu-rigid-body-world/gripper';
import {expect, it} from 'vitest';
import {makeArmContactTrial} from '../../../../examples/experimental/gpu-rigid-body-world/robot-arm-contact';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, GPUArticulationTree} from '../../src/gpu-physics';
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

it.for([
  0.9, 0
])('can lift and release the free gripper payload only with pad friction (%s)', async (friction, context) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const trial = makeGripperTrial(true, friction, true);
  const definition = new GPUCommandGraph(device);
  trial.world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (let phase = 0; phase < 6; phase++) {
      for (let step = 0; step < 180; step += 4) {
        if (step <= 120) trial.command(phase, step);
        const encoder = device.createCommandEncoder();
        for (let substep = 0; substep < 4; substep++)
          graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
      }
      const positions = await trial.positions();
      const [x, y, z] = positions[4];
      if (phase === 2 || phase === 3) {
        if (friction) expect(z).toBeGreaterThan(0.58);
        else expect(z).toBeLessThan(0.32);
      }
      if (phase === 5 && friction) {
        expect(
          Math.hypot(
            x - REACH * Math.cos(DESTINATION_ANGLE),
            y - REACH * Math.sin(DESTINATION_ANGLE)
          )
        ).toBeLessThan(0.25);
        expect(z).toBeCloseTo(0.24, 1);
        const bytes = await trial.world.poseMatrices!.readAsync(4 * 64, 64);
        const matrix = new Float32Array(bytes.buffer, bytes.byteOffset, 16);
        expect([...matrix.slice(12, 15)]).toEqual([x, y, z]);
      }
    }
    expect(await trial.world.readSimulationDiagnostics()).toMatchObject({
      complete: true,
      steps: 1080
    });
  } finally {
    graph.destroy();
    trial.world.destroy();
  }
});

it('keeps light and heavy grasp trials independent in one graph', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const definition = new GPUCommandGraph(device);
  const trials = [0.5, 3].map(mass =>
    makeGripperTrial(true, 0.35, false, {id: 'grasp-' + mass, mass, torque: 32})
  );
  for (const trial of trials) trial.world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (let phase = 0; phase <= 2; phase++) {
      for (let step = 0; step < 180; step += 4) {
        if (step <= 120) for (const trial of trials) trial.command(phase, step);
        const encoder = device.createCommandEncoder();
        for (let substep = 0; substep < 4; substep++)
          graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
      }
    }
    const [light, heavy] = await Promise.all(trials.map(trial => trial.positions()));
    expect(light[4][2]).toBeGreaterThan(0.58);
    expect(heavy[4][2]).toBeLessThan(0.32);
    for (const {world} of trials)
      expect(await world.readSimulationDiagnostics()).toMatchObject({steps: 540, complete: true});
  } finally {
    graph.destroy();
    for (const {world} of trials) world.destroy();
  }
});

it.for([
  'center',
  'split',
  'crowded',
  'drop'
] as const)('discovers box identities through pad contact in the %s bin', async (scenario, context) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const trial = makeGripperTrial(true, 0.9, true, {
    bin: {
      target: 1,
      parts: scenario === 'crowded' ? 64 : undefined,
      obstructed: scenario === 'split',
      drop: scenario === 'drop'
    }
  });
  const definition = new GPUCommandGraph(device);
  trial.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    let totalSteps = 0;
    for (let phase = 0; phase < trial.phaseNames.length; phase++) {
      const travel = trial.travelSteps(phase);
      for (let step = 0; step < travel + 60; step += 4) {
        if (step <= travel) trial.command(phase, step);
        const encoder = device.createCommandEncoder();
        for (let substep = 0; substep < 4; substep++)
          graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
      }
      totalSteps += travel + 60;
      const state = await trial.world.readSimulationDiagnostics();
      expect(state).toMatchObject({steps: totalSteps, complete: true});
      const blocks = (await trial.positions()).slice(4, 7);
      if (phase === 1)
        expect(state).toMatchObject({padContactMasks: scenario === 'split' ? [2, 4] : [4, 4]});
      if (phase === 3 && scenario === 'crowded') {
        expect(state).toMatchObject({contactOverflow: false, activeContacts: 2, reusedContacts: 2});
        expect('candidatePairs' in state && Number(state.candidatePairs)).toBeLessThan(40);
        expect(trial.binWorld!.count).toBe(69);
      }
      if (phase === 2 && scenario !== 'split') expect(blocks[1][2]).toBeGreaterThan(0.58);
      if (phase === 5) {
        expect(state).toMatchObject({padContactMasks: [0, 0]});
        if (scenario === 'drop') {
          expect(blocks[1][2]).toBeGreaterThan(blocks[2][2] + 0.3);
          expect(blocks[1][2]).toBeLessThan(0.8);
        }
        if (scenario === 'center' || scenario === 'crowded') {
          expect(
            Math.hypot(blocks[1][0] - REACH * Math.cos(1.65), blocks[1][1] - REACH * Math.sin(1.65))
          ).toBeLessThan(0.25);
          expect(Math.abs(blocks[1][2] - 0.24)).toBeLessThan(0.06);
        }
      }
      if (phase === 7) {
        expect(state).toMatchObject({padContactMasks: [4, 4]});
        expect(blocks[1][2]).toBeGreaterThan(0.58);
        const bytes = await trial.binWorld!.poseMatrices!.readAsync(2 * 64, 64);
        expect([...new Float32Array(bytes.buffer, bytes.byteOffset, 16).slice(12, 15)]).toEqual(
          blocks[1]
        );
      }
    }
    expect(await trial.binWorld!.readSimulationDiagnostics()).toMatchObject({
      complete: true,
      steps: totalSteps
    });
  } finally {
    graph.destroy();
    trial.world.destroy();
    trial.binWorld!.destroy();
  }
});

it('latches link contact capacity before publishing partial impulses and clears it on reset', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const tree = new GPUArticulationTree({
    base: [0, 0, 0],
    links: [
      {
        id: 'tool',
        parent: -1,
        parentAnchor: [0, 0, 0],
        childAnchor: [0, 0, 0],
        axis: [0, 0, 1],
        mass: 1,
        inertia: [1, 1, 1]
      }
    ]
  });
  const world = new GPURigidBodyWorld({
    timeStep: tree.timeStep,
    bodies: Array.from({length: 25}, () => ({
      position: [0, 0, 0],
      mass: 0,
      shape: {type: 'box', halfExtents: [1, 1, 1]}
    }))
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition, {
    tree,
    colliders: [{link: 'tool', shape: {type: 'box', halfExtents: [0.1, 0.1, 0.1]}}],
    friction: 0.5
  });
  const graph = await definition.compileAsync();
  try {
    world.setColliderTransform(24, [5, 0, 0], [0, 0, 0, 1]);
    const accepted = device.createCommandEncoder();
    graph.encode(accepted, {parameters: undefined});
    device.submit(accepted.finish());
    expect(await tree.readSimulationDiagnostics()).toMatchObject({steps: 1, activeContacts: 24});
    const before = await tree.readState();
    world.setColliderTransform(24, [0, 0, 0], [0, 0, 0, 1]);
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await tree.readSimulationDiagnostics()).toMatchObject({
      steps: 1,
      complete: false,
      contactOverflow: true,
      activeContacts: 0,
      contactPairs: [],
      padContactMasks: [0, 0]
    });
    expect(await tree.readState()).toEqual(before);
    tree.reset();
    expect(await tree.readSimulationDiagnostics()).toMatchObject({
      steps: 0,
      complete: true,
      contactOverflow: false,
      reusedContacts: 0
    });
  } finally {
    graph.destroy();
    tree.destroy();
    world.destroy();
  }
});

it('drives a prismatic carriage along the parent axis and supports its payload against gravity', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const tree = new GPUArticulationTree({
    links: [
      {
        id: 'rail',
        parent: -1,
        parentAnchor: [0, 0, 0],
        childAnchor: [0, 0, 0],
        restOrientation: [0, -Math.SQRT1_2, 0, Math.SQRT1_2],
        mass: 1,
        inertia: [1, 1, 1]
      },
      {
        id: 'slide',
        parent: 0,
        parentAnchor: [0, 0, 0],
        childAnchor: [0, 0, 0],
        jointType: 'prismatic',
        axis: [1, 0, 0],
        mass: 2,
        inertia: [1, 1, 1]
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  tree.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (const position of [0.6, 0.2]) {
      tree.setLinearDrive('slide', {position, stiffness: 1000, damping: 60, maximumForce: 80});
      const encoder = device.createCommandEncoder();
      for (let step = 0; step < 150; step++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      const [, carriage] = await tree.readState();
      expect(carriage.position[0]).toBeCloseTo(0, 3);
      expect(carriage.position[2]).toBeCloseTo(position - (2 * 9.81) / 1000, 3);
      expect(await tree.readForce('slide')).toBeCloseTo(2 * 9.81, 1);
    }
  } finally {
    graph.destroy();
    tree.destroy();
  }
});
