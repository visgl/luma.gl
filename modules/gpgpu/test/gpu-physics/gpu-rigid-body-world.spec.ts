// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';
import {
  GPURigidBodyWorld,
  type GPURigidBody,
  type GPURigidBodyWorldProps
} from '../../src/gpu-physics';

async function makeWorld(bodies: GPURigidBody[], options: Partial<GPURigidBodyWorldProps> = {}) {
  const device = await getWebGPUTestDevice();
  if (!device) return null;
  const world = new GPURigidBodyWorld({bodies, gravity: [0, 0, 0], sleepAfter: 0, ...options});
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  return {
    world,
    graph,
    async step(count: number) {
      // Bound command buffers and yield to the queue between batches.
      for (let start = 0; start < count; start += 20) {
        const encoder = device.createCommandEncoder();
        for (let index = start; index < Math.min(count, start + 20); index++)
          graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        await world.readState();
      }
      return world.readState();
    },
    destroy() {
      graph.destroy();
      world.destroy();
    }
  };
}
const floor: GPURigidBody = {
  shape: {type: 'box', halfExtents: [10, 10, 0.5]},
  position: [0, 0, -0.5],
  mass: 0,
  friction: 0.7,
  restitution: 0
};
const box = (position: [number, number, number]): GPURigidBody => ({
  shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
  position,
  friction: 0.7,
  restitution: 0
});

it('GPURigidBodyWorld applies off-center impulses using rotated principal inertia', async () => {
  const fixture = await makeWorld([
    {
      ...box([0, 0, 0]),
      shape: {type: 'box', halfExtents: [1, 0.5, 0.25]},
      mass: 2,
      orientation: [0, 0, Math.SQRT1_2, Math.SQRT1_2]
    }
  ]);
  if (!fixture) return;
  try {
    await fixture.step(1);
    fixture.world.applyImpulse(0, [2, 0, 0], [0, 0, 0.25]);
    const state = (await fixture.world.readState())[0];
    expect(state.velocity[0]).toBeCloseTo(1, 4);
    // World y is local x after a quarter-turn: Ixx = m*(hy²+hz²)/3.
    expect(state.angularVelocity[1]).toBeCloseTo(2.4, 3);
    expect(state.angularVelocity[0]).toBeCloseTo(0, 4);
  } finally {
    fixture.destroy();
  }
});

it('GPURigidBodyWorld resolves sphere impact against an oriented box with angular response', async () => {
  const fixture = await makeWorld([
    {...box([0, 0, 0]), mass: 2, orientation: [0, 0, Math.sin(0.15), Math.cos(0.15)]},
    {
      shape: {type: 'sphere', radius: 0.25},
      position: [-1.5, 0.35, 0],
      velocity: [3, 0, 0],
      restitution: 0.4
    }
  ]);
  if (!fixture) return;
  try {
    const states = await fixture.step(70);
    expect(states[0].velocity[0]).toBeGreaterThan(0.3);
    expect(Math.abs(states[0].angularVelocity[2])).toBeGreaterThan(0.1);
    expect(states[0].velocity[0] * 2 + states[1].velocity[0]).toBeCloseTo(3, 3);
    for (const state of states)
      expect(state.orientation.reduce((sum, value) => sum + value * value, 0)).toBeCloseTo(1, 4);
  } finally {
    fixture.destroy();
  }
});

it('GPURigidBodyWorld holds a rotated box stack and sleeps and wakes the connected stack', async () => {
  const fixture = await makeWorld(
    [
      floor,
      ...Array.from({length: 4}, (_, level) => ({
        ...box([0, 0, 0.5 + level]),
        orientation: [0, 0, Math.sin(0.1), Math.cos(0.1)] as const
      }))
    ],
    {gravity: [0, 0, -9.81], iterations: 24, sleepAfter: 0.4}
  );
  if (!fixture) return;
  try {
    const states = await fixture.step(360);
    for (let index = 1; index < states.length; index++) {
      expect(Math.abs(states[index].position[2] - (index - 0.5))).toBeLessThan(0.08);
      expect(Math.hypot(...states[index].velocity)).toBeLessThan(0.1);
      expect(states[index].sleeping).toBe(true);
    }
    fixture.world.applyImpulse(4, [2, 0, 0], states[4].position);
    const awake = await fixture.step(1);
    expect(awake.slice(1).every(state => !state.sleeping)).toBe(true);
    expect(awake[0].position).toEqual([0, 0, -0.5]);
  } finally {
    fixture.destroy();
  }
});

it('GPURigidBodyWorld friction slows a sliding box without changing static colliders', async () => {
  const fixture = await makeWorld([floor, {...box([0, 0, 0.5]), velocity: [1, 0, 0]}], {
    gravity: [0, 0, -9.81]
  });
  if (!fixture) return;
  try {
    const states = await fixture.step(180);
    expect(Math.abs(states[1].velocity[0])).toBeLessThan(0.05);
    expect(states[1].position[0]).toBeGreaterThan(0.01);
    expect(states[1].position[0]).toBeLessThan(1);
    expect(states[0].orientation).toEqual([0, 0, 0, 1]);
  } finally {
    fixture.destroy();
  }
});

it('GPURigidBodyWorld preserves separated rotated boxes and conserves unequal-mass impact momentum', async () => {
  const fixture = await makeWorld(
    [
      {...box([-1, 0, 0]), mass: 2, velocity: [1, 0, 0], restitution: 1},
      {...box([0.1, 0, 0]), restitution: 1}
    ],
    {restitutionThreshold: 0.01, iterations: 32}
  );
  if (!fixture) return;
  try {
    const states = await fixture.step(80);
    expect(states[0].velocity[0] * 2 + states[1].velocity[0]).toBeCloseTo(2, 3);
    const energy =
      states[0].velocity.reduce((sum, value) => sum + value * value, 0) +
      states[1].velocity.reduce((sum, value) => sum + value * value, 0) * 0.5;
    expect(energy).toBeLessThan(1.05);
    expect(states[1].velocity[0]).toBeGreaterThan(0.8);
  } finally {
    fixture.destroy();
  }
});

it('GPURigidBodyWorld keeps separated parallel rotated boxes apart without false contacts', async () => {
  const orientation = [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)] as const;
  const fixture = await makeWorld([
    {...box([0, 0, 0]), shape: {type: 'box', halfExtents: [2, 0.1, 0.1]}, orientation},
    {...box([-0.3, 0.3, 0]), shape: {type: 'box', halfExtents: [2, 0.1, 0.1]}, orientation}
  ]);
  if (!fixture) return;
  try {
    const states = await fixture.step(20);
    expect(states[0].position).toEqual([0, 0, 0]);
    expect(states[1].position[0]).toBeCloseTo(-0.3, 5);
    expect(states.every(state => Math.hypot(...state.velocity) < 1e-6)).toBe(true);
  } finally {
    fixture.destroy();
  }
});

it('GPURigidBodyWorld settled stacks converge across timestep and iteration budgets', async () => {
  const results: number[][] = [];
  for (const [timeStep, iterations] of [
    [1 / 120, 12],
    [1 / 240, 24]
  ]) {
    const fixture = await makeWorld([floor, box([0, 0, 0.5]), box([0, 0, 1.5]), box([0, 0, 2.5])], {
      gravity: [0, 0, -9.81],
      timeStep,
      iterations
    });
    if (!fixture) return;
    try {
      const states = await fixture.step(Math.round(1.5 / timeStep));
      results.push(states.map(state => state.position[2]));
      for (const state of states) expect(Math.hypot(...state.velocity)).toBeLessThan(0.1);
    } finally {
      fixture.destroy();
    }
  }
  for (let index = 1; index < 4; index++)
    expect(Math.abs(results[0][index] - results[1][index])).toBeLessThan(0.025);
});

it('GPURigidBodyWorld preserves free spin with large principal inertia', async () => {
  const fixture = await makeWorld([
    {
      shape: {type: 'sphere', radius: 10},
      position: [0, 0, 0],
      mass: 100000,
      angularVelocity: [1, 2, 0.5]
    }
  ]);
  if (!fixture) return;
  try {
    const state = (await fixture.step(120))[0];
    for (const [index, value] of [1, 2, 0.5].entries())
      expect(state.angularVelocity[index]).toBeCloseTo(value, 3);
  } finally {
    fixture.destroy();
  }
});

it('GPURigidBodyWorld preserves world angular momentum for a freely tumbling asymmetric box', async () => {
  const fixture = await makeWorld(
    [
      {
        ...box([0, 0, 0]),
        shape: {type: 'box', halfExtents: [1, 0.5, 0.25]},
        angularVelocity: [1, 2, 0.5]
      }
    ],
    {timeStep: 1 / 240}
  );
  if (!fixture) return;
  const rotate = (rotation: readonly number[], vector: readonly number[]) => {
    const cross = (first: readonly number[], second: readonly number[]) => [
      first[1] * second[2] - first[2] * second[1],
      first[2] * second[0] - first[0] * second[2],
      first[0] * second[1] - first[1] * second[0]
    ];
    const firstCross = cross(rotation, vector);
    const secondCross = cross(
      rotation,
      firstCross.map((value, index) => value + rotation[3] * vector[index])
    );
    return vector.map((value, index) => value + 2 * secondCross[index]);
  };
  try {
    const state = (await fixture.step(240))[0];
    const principal = [(0.25 + 0.0625) / 3, (1 + 0.0625) / 3, (1 + 0.25) / 3];
    const initialMomentum = principal.map((value, index) => value * [1, 2, 0.5][index]);
    const localAngular = rotate(
      [-state.orientation[0], -state.orientation[1], -state.orientation[2], state.orientation[3]],
      state.angularVelocity
    );
    const finalMomentum = rotate(
      state.orientation,
      localAngular.map((value, index) => value * principal[index])
    );
    for (let index = 0; index < 3; index++)
      expect(finalMomentum[index]).toBeCloseTo(initialMomentum[index], 3);
    const initialEnergy = initialMomentum.reduce(
      (sum, value, index) => sum + value * [1, 2, 0.5][index],
      0
    );
    const finalEnergy = finalMomentum.reduce(
      (sum, value, index) => sum + value * state.angularVelocity[index],
      0
    );
    expect(Math.abs(finalEnergy / initialEnergy - 1)).toBeLessThan(0.03);
  } finally {
    fixture.destroy();
  }
});
