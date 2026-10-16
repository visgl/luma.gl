// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';
import {
  GPUSphereWorld,
  decodeGPUSphereWorldDiagnostics,
  type GPUSphereWorldProps
} from '../../src/gpu-physics';
import {expect, it} from 'vitest';

async function makeWorld(
  device: Device,
  positionData: number[],
  velocityData: number[],
  options: Partial<GPUSphereWorldProps> = {}
) {
  const create = (data: number[]) =>
    device.createBuffer({
      data: new Float32Array(data),
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
  const positions = create(positionData);
  const velocities = create(velocityData);
  const definition = new GPUCommandGraph(device);
  const world = new GPUSphereWorld({
    count: positionData.length / 4,
    positions,
    velocities,
    gravity: [0, 0, 0],
    plane: {offset: -100},
    rollingResistance: 0,
    sleepAfter: 0,
    ...options
  });
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  return {
    world,
    graph,
    positions,
    velocities,
    step(count = 1) {
      for (let index = 0; index < count; index++) {
        const encoder = device.createCommandEncoder();
        graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
      }
    },
    async read() {
      return {
        positions: new Float32Array((await positions.readAsync()).buffer),
        velocities: new Float32Array((await velocities.readAsync()).buffer),
        angular: new Float32Array((await world.angularVelocities!.readAsync()).buffer),
        orientations: new Float32Array((await world.orientations!.readAsync()).buffer),
        sleep: new Float32Array((await world.sleepStates!.readAsync()).buffer),
        diagnostics: decodeGPUSphereWorldDiagnostics(
          new Uint32Array((await world.diagnostics!.readAsync()).buffer)
        )
      };
    },
    destroy() {
      graph.destroy();
      world.destroy();
      positions.destroy();
      velocities.destroy();
    }
  };
}

it('GPUSphereWorld grid matches bounded all-pairs with variable radii and negative cells', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const positions: number[] = [];
  const velocities: number[] = [];
  for (let index = 0; index < 40; index++) {
    positions.push(
      (index % 5) * 0.6 - 1.7,
      Math.floor(index / 5) * 0.6 - 2.1,
      2,
      0.15 + (index % 4) * 0.1
    );
    velocities.push((index % 3) * 0.1, 0, 0, 1);
  }
  const grid = await makeWorld(device, positions, velocities, {
    iterations: 1,
    staticFriction: 0,
    dynamicFriction: 0
  });
  const reference = await makeWorld(device, positions, velocities, {
    broadPhase: 'all-pairs',
    iterations: 1,
    staticFriction: 0,
    dynamicFriction: 0
  });
  try {
    grid.step();
    reference.step();
    const first = await grid.read();
    const second = await reference.read();
    let referenceContacts = 0;
    for (let firstIndex = 0; firstIndex < 40; firstIndex++) {
      for (let secondIndex = 0; secondIndex < 40; secondIndex++) {
        if (firstIndex === secondIndex) continue;
        const squaredDistance = [0, 1, 2].reduce((sum, axis) => {
          const firstPoint =
            positions[firstIndex * 4 + axis] +
            velocities[firstIndex * 4 + axis] * grid.world.timeStep;
          const secondPoint =
            positions[secondIndex * 4 + axis] +
            velocities[secondIndex * 4 + axis] * grid.world.timeStep;
          return sum + (firstPoint - secondPoint) ** 2;
        }, 0);
        if (
          squaredDistance <=
          (positions[firstIndex * 4 + 3] +
            positions[secondIndex * 4 + 3] +
            grid.world.contactSkin) **
            2
        )
          referenceContacts++;
      }
    }
    expect(first.diagnostics.contacts).toBe(referenceContacts);
    expect(first.diagnostics.contacts).toBe(second.diagnostics.contacts);
    expect(first.diagnostics.droppedContacts).toBe(0);
    for (let index = 0; index < positions.length; index++) {
      expect(first.positions[index]).toBeCloseTo(second.positions[index], 5);
      expect(first.velocities[index]).toBeCloseTo(second.velocities[index], 5);
    }
    expect(first.diagnostics.candidateTests).toBeLessThan(second.diagnostics.candidateTests);
  } finally {
    grid.destroy();
    reference.destroy();
  }
});

it('GPUSphereWorld preserves unequal-mass elastic momentum and energy', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(
    device,
    [-0.49, 0, 2, 0.5, 0.49, 0, 2, 0.5],
    [1, 0, 0, 1, -1, 0, 0, 0.5],
    {restitution: 1, restitutionThreshold: 0, staticFriction: 0, dynamicFriction: 0}
  );
  try {
    fixture.step();
    const result = await fixture.read();
    expect(result.velocities[0]).toBeCloseTo(-5 / 3, 4);
    expect(result.velocities[4]).toBeCloseTo(1 / 3, 4);
    expect(result.velocities[0] + 2 * result.velocities[4]).toBeCloseTo(-1, 4);
    expect(result.velocities[0] ** 2 / 2 + result.velocities[4] ** 2).toBeCloseTo(1.5, 4);
    expect(result.positions[4] - result.positions[0]).toBeCloseTo(
      1 - fixture.world.contactSkin * 0.1,
      5
    );
  } finally {
    fixture.destroy();
  }
});

it('GPUSphereWorld keeps static bodies fixed and resolves coincident centers without NaNs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(device, [0, 0, 2, 0.5, 0, 0, 2, 0.5], [0, 0, 0, 0, 0, 0, 0, 1], {
    iterations: 16
  });
  try {
    fixture.step();
    const result = await fixture.read();
    expect(Array.from(result.positions.slice(0, 4))).toEqual([0, 0, 2, 0.5]);
    expect(Array.from(result.orientations.slice(0, 4))).toEqual([0, 0, 0, 1]);
    expect(Math.abs(result.positions[4])).toBeGreaterThan(0.999);
    expect(Array.from(result.positions).every(Number.isFinite)).toBe(true);
  } finally {
    fixture.destroy();
  }
});

it('GPUSphereWorld reports bounded-contact overflow and invalid radii', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const positions: number[] = [];
  const velocities: number[] = [];
  for (let index = 0; index < 12; index++) {
    positions.push(0, 0, 2, index === 11 ? 2 : 0.5);
    velocities.push(0, 0, 0, 1);
  }
  const fixture = await makeWorld(device, positions, velocities, {maximumContacts: 4});
  try {
    fixture.step();
    const result = await fixture.read();
    expect(result.diagnostics.invalidBodies).toBe(1);
    expect(result.diagnostics.maximumContacts).toBe(10);
    expect(result.diagnostics.droppedContacts).toBe(66);
    expect(result.diagnostics.contacts).toBe(44);
    expect(Array.from(result.positions).every(Number.isFinite)).toBe(true);
  } finally {
    fixture.destroy();
  }
});

it('GPUSphereWorld finite floor catches bodies and lets edge bodies fall', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(
    device,
    [0, 0, 1, 0.25, 3, 0, 1, 0.25],
    [0, 0, 0, 1, 0, 0, 0, 1],
    {
      timeStep: 1 / 60,
      gravity: [0, 0, -10],
      plane: {halfExtents: [1, 1]},
      restitution: 0,
      iterations: 2
    }
  );
  try {
    fixture.step(60);
    const result = await fixture.read();
    expect(result.positions[2]).toBeCloseTo(0.25, 4);
    expect(result.positions[6]).toBeLessThan(-3);
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld contact torque produces rolling and unit quaternions', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(device, [0, 0, 0.5, 0.5], [2, 0, 0, 1], {
    timeStep: 1 / 60,
    gravity: [0, 0, -9.81],
    plane: {},
    restitution: 0,
    iterations: 2
  });
  try {
    fixture.step(60);
    const result = await fixture.read();
    expect(result.angular[1]).toBeGreaterThan(1);
    expect(Math.abs(result.velocities[0] - result.angular[1] * 0.5)).toBeLessThan(0.02);
    expect(Math.hypot(...result.orientations)).toBeCloseTo(1, 5);
    expect(Math.abs(result.orientations[1])).toBeGreaterThan(0.1);
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld rolling resistance sleeps bodies and live gravity wakes them', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(device, [0, 0, 0.5, 0.5], [0.1, 0, 0, 1], {
    timeStep: 1 / 60,
    gravity: [0, 0, -9.81],
    plane: {},
    restitution: 0,
    iterations: 2,
    rollingResistance: 0.1,
    sleepAfter: 0.25
  });
  try {
    fixture.step(120);
    const resting = await fixture.read();
    expect(resting.diagnostics.sleepingBodies).toBe(1);
    expect(resting.velocities[0]).toBe(0);
    fixture.world.update({gravity: [3, 0, -9.81]});
    fixture.step(4);
    const awake = await fixture.read();
    expect(awake.diagnostics.awakeBodies).toBe(1);
    expect(awake.velocities[0]).toBeGreaterThan(0);
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld settles a small stack without sinking through the plane', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(
    device,
    [0, 0, 0.5, 0.5, 0, 0, 1.5, 0.5, 0, 0, 2.5, 0.5],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    {timeStep: 1 / 60, gravity: [0, 0, -9.81], plane: {}, restitution: 0, iterations: 16}
  );
  try {
    fixture.step(120);
    const result = await fixture.read();
    for (let index = 0; index < 3; index++) {
      expect(result.positions[index * 4 + 2]).toBeGreaterThan(index + 0.45);
      expect(Math.abs(result.velocities[index * 4 + 2])).toBeLessThan(0.1);
    }
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld 10k separated bodies avoid quadratic candidate enumeration', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const positions: number[] = [];
  const velocities: number[] = [];
  for (let index = 0; index < 10000; index++) {
    positions.push((index % 100) * 3, Math.floor(index / 100) * 3, 2, 0.2);
    velocities.push(0, 0, 0, 1);
  }
  const fixture = await makeWorld(device, positions, velocities, {
    maximumRadius: 0.2,
    iterations: 1
  });
  try {
    fixture.step();
    const result = await fixture.read();
    expect(result.diagnostics.contacts).toBe(0);
    expect(result.diagnostics.invalidBodies).toBe(0);
    expect(result.diagnostics.candidateTests).toBeLessThan(10000 * 27);
    expect(result.diagnostics.awakeBodies).toBe(10000);
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld destroys owned state without destroying borrowed buffers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(device, [0, 0, 2, 0.5], [0, 0, 0, 1]);
  fixture.graph.destroy();
  fixture.world.destroy();
  expect(fixture.world.orientations!.destroyed).toBe(true);
  fixture.positions.write(new Float32Array([0, 0, 3, 0.5]));
  expect(new Float32Array((await fixture.positions.readAsync()).buffer)[2]).toBe(3);
  fixture.positions.destroy();
  fixture.velocities.destroy();
});

it('GPUSphereWorld plane changes wake a sleeping sphere', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const fixture = await makeWorld(device, [0, 0, 0.5, 0.5], [0, 0, 0, 1], {
    gravity: [0, 0, -9.81],
    plane: {},
    restitution: 0,
    iterations: 2,
    sleepAfter: 0.05,
    rollingResistance: 0.01
  });
  try {
    fixture.step(20);
    expect((await fixture.read()).diagnostics.sleepingBodies).toBe(1);
    fixture.world.update({plane: {normal: [0.5, 0, Math.sqrt(0.75)]}});
    fixture.step(10);
    const result = await fixture.read();
    expect(result.diagnostics.awakeBodies).toBe(1);
    expect(result.velocities[0]).toBeGreaterThan(0);
    expect(result.orientations.every(Number.isFinite)).toBe(true);
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld free fall matches a CPU fixed-step reference at two time steps', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  for (const timeStep of [0.01, 0.005]) {
    const fixture = await makeWorld(device, [0, 0, 10, 0.5], [0, 0, 0, 1], {
      timeStep,
      gravity: [0, 0, -10],
      iterations: 1
    });
    try {
      const steps = Math.round(1 / timeStep);
      let position = 10;
      let velocity = 0;
      for (let step = 0; step < steps; step++) {
        velocity -= 10 * timeStep;
        position += velocity * timeStep;
      }
      fixture.step(steps);
      const result = await fixture.read();
      expect(result.positions[2]).toBeCloseTo(position, 4);
      expect(result.velocities[2]).toBeCloseTo(velocity, 4);
      expect(result.angular[0]).toBe(0);
    } finally {
      fixture.destroy();
    }
  }
}, 60000);

it('GPUSphereWorld repeats seeded grid contacts deterministically on one device', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const data = [0, 0, 2, 0.5, 0.9, 0, 2, 0.5, 0, 0.9, 2, 0.5];
  const velocities = [0.5, 0, 0, 1, -0.5, 0, 0, 1, 0, -0.5, 0, 1];
  const first = await makeWorld(device, data, velocities);
  const second = await makeWorld(device, data, velocities);
  try {
    first.step(10);
    second.step(10);
    const result = await first.read();
    const repeat = await second.read();
    expect(result.positions).toEqual(repeat.positions);
    expect(result.velocities).toEqual(repeat.velocities);
    expect(result.orientations).toEqual(repeat.orientations);
  } finally {
    first.destroy();
    second.destroy();
  }
});

it('GPUSphereWorld validates capacities, materials, aliases and borrowed buffer sizes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const positions = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
  const velocities = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
  const props = {count: 1, positions, velocities};
  try {
    for (const count of [0, -1, 1.5, NaN, Infinity])
      expect(() => new GPUSphereWorld({...props, count})).toThrow();
    expect(() => new GPUSphereWorld({...props, positions: velocities})).toThrow();
    expect(() => new GPUSphereWorld({...props, count: 2})).toThrow();
    expect(() => new GPUSphereWorld({...props, restitution: 2})).toThrow();
    expect(
      () => new GPUSphereWorld({...props, staticFriction: 0.1, dynamicFriction: 0.9})
    ).toThrow();
    expect(() => new GPUSphereWorld({...props, plane: {normal: [0, 0, 0]}})).toThrow();
    expect(() => new GPUSphereWorld({...props, timeStep: 0})).toThrow();
    expect(() => new GPUSphereWorld({...props, maximumContacts: 0})).toThrow();
    expect(() => new GPUSphereWorld({...props, count: 257, broadPhase: 'all-pairs'})).toThrow();
  } finally {
    positions.destroy();
    velocities.destroy();
  }
});

it('GPUSphereWorld body commands apply impulses once with mass and point torque', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(device, [2, 3, 4, 0.5, 5, 3, 4, 0.5], [0, 0, 0, 0.5, 0, 0, 0, 0], {
    substeps: 3
  });
  try {
    target.world.applyImpulse(0, [2, 0, 0], [2, 3.5, 4]);
    target.world.applyAngularImpulse(0, [0, 0, 0.2]);
    target.world.applyImpulse(1, [10, 0, 0]);
    let states = await target.world.readState();
    expect(states[0].velocity).toEqual([1, 0, 0]);
    expect(states[0].angularVelocity[2]).toBeCloseTo(-4, 5);
    expect(states[1].velocity).toEqual([0, 0, 0]);
    target.step(2);
    states = await target.world.readState();
    expect(states[0].velocity[0]).toBeCloseTo(1, 5);
    expect(states[0].position[0]).toBeCloseTo(2.05, 4);
    target.world.teleportBody(0, [0, 0, 5], [0, 0, 2, 2]);
    states = await target.world.readState();
    expect(states[0].position).toEqual([0, 0, 5]);
    expect(states[0].velocity).toEqual([0, 0, 0]);
    expect(states[0].angularVelocity).toEqual([0, 0, 0]);
    expect(Math.hypot(...states[0].orientation)).toBeCloseTo(1, 5);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld small-body impulses preserve solid-sphere inertia', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(device, [0, 0, 0, 0.0005], [0, 0, 0, 1]);
  try {
    target.world.applyAngularImpulse(0, [0, 0, 0.0000001]);
    let states = await target.world.readState();
    expect(states[0].angularVelocity[2]).toBeCloseTo(1, 5);
    target.world.applyImpulse(0, [0.0002, 0, 0], [0, 0.0005, 0]);
    states = await target.world.readState();
    expect(states[0].angularVelocity[2]).toBeCloseTo(0, 5);
    expect(states[0].velocity[0]).toBeCloseTo(0.0002, 7);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld disabled bodies do not collide and can be restored and woken', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(
    device,
    [0, 0, 0.5, 0.5, 0.8, 0, 0.5, 0.5],
    [0, 0, 0, 1, 0, 0, 0, 1],
    {plane: {}, gravity: [0, 0, -9.81], sleepAfter: 0.05}
  );
  try {
    target.world.setBodyEnabled(1, false);
    target.world.applyImpulse(1, [1, 0, 0]);
    target.step(30);
    let states = await target.world.readState();
    expect(states[0].position[0]).toBe(0);
    expect(states[0].sleeping).toBe(true);
    expect(states[1].enabled).toBe(false);
    expect(states[1].radius).toBe(0.5);
    expect(states[1].velocity).toEqual([0, 0, 0]);
    expect((await target.read()).diagnostics.invalidBodies).toBe(0);
    target.world.wakeBody(0);
    expect((await target.world.readState())[0].sleeping).toBe(false);
    target.world.setBodyEnabled(1, true);
    target.step();
    states = await target.world.readState();
    expect(states[1].enabled).toBe(true);
    expect(states[0].position[0]).toBeLessThan(0);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld finite cushions use their own material and leave pocket gaps', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(
    device,
    [0, 0.7, 1, 0.25, 2, 0.7, 1, 0.25],
    [0, 12, 0, 1, 0, 12, 0, 1],
    {
      restitution: 0,
      staticFriction: 0,
      dynamicFriction: 0,
      planes: [{normal: [0, -1, 0], center: [0, 1, 1], halfExtents: [0.5, 0.8], restitution: 0.75}]
    }
  );
  try {
    target.step(12);
    const states = await target.world.readState();
    expect(states[0].velocity[1]).toBeCloseTo(-9, 4);
    expect(states[0].position[1]).toBeLessThan(0.75);
    expect(states[1].velocity[1]).toBeCloseTo(12, 4);
    expect(states[1].position[1]).toBeGreaterThan(0.8);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld corner contacts rebound on both axes and resolve below-plane starts', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(device, [0.8, 0.8, -0.1, 0.25], [2, 2, 0, 1], {
    iterations: 1,
    staticFriction: 0,
    dynamicFriction: 0,
    restitution: 1,
    planes: [{}, {normal: [-1, 0, 0], center: [1, 0, 0]}, {normal: [0, -1, 0], center: [0, 1, 0]}]
  });
  try {
    target.step();
    const [state] = await target.world.readState();
    expect(state.position).toEqual([0.75, 0.75, 0.25]);
    expect(state.velocity).toEqual([-2, -2, 0]);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld skin does not stop a pair before impact', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(
    device,
    [-0.507, 0, 1, 0.5, 0.507, 0, 1, 0.5],
    [0.5, 0, 0, 1, -0.5, 0, 0, 1],
    {
      restitution: 1,
      restitutionThreshold: 0,
      contactSkin: 0.01,
      staticFriction: 0,
      dynamicFriction: 0
    }
  );
  try {
    target.step();
    expect((await target.world.readState())[0].velocity[0]).toBeCloseTo(0.5, 5);
    target.step(2);
    expect((await target.world.readState())[0].velocity[0]).toBeCloseTo(-0.5, 5);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld throw switches independently gate linear and angular contact slip', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  for (const spin of [false, true]) {
    const results: number[] = [];
    for (const enabled of [false, true]) {
      const target = await makeWorld(
        device,
        [-0.49, spin ? 0 : -0.005, 1, 0.5, 0.49, 0, 1, 0.5],
        [1, spin ? 0 : 0.6, 0, 1, -1, 0, 0, 1],
        {cutInducedThrow: spin ? false : enabled, spinInducedThrow: spin ? enabled : false}
      );
      try {
        if (spin) target.world.applyAngularImpulse(0, [0, 0, 0.2]);
        target.step();
        results.push((await target.world.readState())[0].velocity[1]);
      } finally {
        target.destroy();
      }
    }
    expect(results[0]).toBeCloseTo(spin ? 0 : 0.6, 4);
    expect(results[1]).toBeLessThan(results[0] - 0.02);
  }
});

it('GPUSphereWorld cloth spinning resistance dissipates side spin', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(device, [0, 0, 0.5, 0.5], [0, 0, 0, 1], {
    gravity: [0, 0, -9.81],
    plane: {spinningResistance: 0.5},
    restitution: 0
  });
  try {
    target.world.applyAngularImpulse(0, [0, 0, 1]);
    target.step(120);
    const [state] = await target.world.readState();
    expect(state.angularVelocity[2]).toBeCloseTo(0.19, 3);
    expect(state.position).toEqual([0, 0, 0.5]);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld cloth turns retained topspin into follow and backspin into draw', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const results: number[] = [];
  for (const spin of [-8, 0, 8]) {
    const target = await makeWorld(
      device,
      [0, 0, 0.5, 0.5, 0.99, 0, 0.5, 0.5],
      [4, 0, 0, 1, 0, 0, 0, 1],
      {
        gravity: [0, 0, -9.81],
        timeStep: 1 / 240,
        restitution: 1,
        staticFriction: 0,
        dynamicFriction: 0,
        plane: {restitution: 0, staticFriction: 0.25, dynamicFriction: 0.2},
        contactSkin: 0.001
      }
    );
    try {
      target.world.applyAngularImpulse(0, [0, spin * 0.1, 0]);
      target.step(120);
      const states = await target.world.readState();
      results.push(states[0].velocity[0]);
      expect(states[1].position[0]).toBeGreaterThan(1.5);
    } finally {
      target.destroy();
    }
  }
  expect(results[0]).toBeLessThan(-0.5);
  expect(Math.abs(results[1])).toBeLessThan(0.1);
  expect(results[2]).toBeGreaterThan(0.5);
});

it('GPUSphereWorld rolling resistance preserves independent sidespin', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(device, [0, 0, 0.5, 0.5], [1, 0, 0, 1], {
    gravity: [0, 0, -9.81],
    plane: {restitution: 0, staticFriction: 0.25, dynamicFriction: 0.2, rollingResistance: 0.1}
  });
  try {
    target.world.applyAngularImpulse(0, [0, 0.2, 1]);
    target.step(30);
    const [state] = await target.world.readState();
    expect(state.velocity[0]).toBeLessThan(0.9);
    expect(state.angularVelocity[1] * state.radius).toBeCloseTo(state.velocity[0], 4);
    expect(state.angularVelocity[2]).toBeCloseTo(10, 4);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld cushions exchange spin and dissipate more rebound pace at high speed', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  async function rebound(speed: number, topSpin: number, sideSpin: number, height: number) {
    const target = await makeWorld(device, [-0.499, 0, 1, 0.5], [speed, 0, 0, 1], {
      gravity: [0, 0, -9.81],
      timeStep: 1 / 240,
      iterations: 1,
      planes: [
        {
          normal: [-1, 0, 0],
          restitution: 0.9,
          restitutionVelocityScale: 0.05,
          contactHeightRatio: height,
          staticFriction: 0.2,
          dynamicFriction: 0.15
        }
      ]
    });
    try {
      target.world.applyAngularImpulse(0, [0, topSpin * 0.1, sideSpin * 0.1]);
      target.step();
      return (await target.world.readState())[0];
    } finally {
      target.destroy();
    }
  }
  const slow = await rebound(2, 0, 0, 0);
  const fast = await rebound(8, 0, 0, 0);
  expect(-slow.velocity[0] / 2).toBeCloseTo(0.9 / 1.1, 4);
  expect(-fast.velocity[0] / 8).toBeCloseTo(0.9 / 1.4, 4);
  const left = await rebound(4, 0, -8, 0.35);
  const right = await rebound(4, 0, 8, 0.35);
  expect(left.velocity[1] * right.velocity[1]).toBeLessThan(0);
  expect(left.velocity[1]).toBeCloseTo(-right.velocity[1], 4);
  const follow = await rebound(4, 8, 0, 0.35);
  const draw = await rebound(4, -8, 0, 0.35);
  expect(Math.abs(follow.velocity[0] - draw.velocity[0])).toBeGreaterThan(0.2);
  for (const state of [left, right, follow, draw]) {
    const energy =
      0.5 * state.velocity.reduce((sum, value) => sum + value * value, 0) +
      0.05 * state.angularVelocity.reduce((sum, value) => sum + value * value, 0);
    expect(energy).toBeLessThan(11.21);
    expect(state.velocity[0]).toBeLessThan(0);
  }
});

it('GPUSphereWorld partial plane updates retain normal and finite extents', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const target = await makeWorld(
    device,
    [0, 0.2, 0.5, 0.25, 2, 0.2, 0.5, 0.25],
    [0, 0, 0, 1, 0, 0, 0, 1],
    {
      plane: {normal: [0, 1, 0], halfExtents: [1, 1]},
      iterations: 1
    }
  );
  try {
    target.world.update({plane: {offset: 0.1}});
    target.step();
    const result = await target.read();
    expect(result.positions[1]).toBeCloseTo(0.35, 5);
    expect(result.positions[5]).toBeCloseTo(0.2, 5);
  } finally {
    target.destroy();
  }
});

it('GPUSphereWorld wakes an unsupported sleeping stack instead of floating', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(
    device,
    [0, 0, 0.5, 0.5, 0, 0, 1.5, 0.5, 0, 0, 2.5, 0.5],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    {gravity: [0, 0, -9.81], plane: {}, restitution: 0, iterations: 16, sleepAfter: 0.05}
  );
  try {
    fixture.step();
    const initial = await fixture.read();
    // Preserve the current wake revision while simulating an already sleeping stack.
    for (let index = 0; index < 3; index++) initial.sleep[index * 4] = 1;
    fixture.world.sleepStates!.write(initial.sleep);
    fixture.velocities.write(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]));
    fixture.positions.write(new Float32Array([5, 0, 0.5, 0.5, 0, 0, 1.5, 0.5, 0, 0, 2.5, 0.5]));
    fixture.step(8);
    const result = await fixture.read();
    expect(result.positions[6]).toBeLessThan(1.49);
    expect(result.positions[10]).toBeLessThan(2.49);
    expect(result.velocities[6]).toBeLessThan(-0.1);
    expect(result.velocities[10]).toBeLessThan(-0.1);
    expect(result.diagnostics.sleepingBodies).toBe(1);
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld below-plane edge contacts push outward while interior penetration recovers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(
    device,
    [1.3, 0, -0.1, 0.5, 0, 0, -0.1, 0.5],
    [0, 0, 0, 1, 0, 0, 0, 1],
    {
      plane: {halfExtents: [1, 1]},
      iterations: 1,
      staticFriction: 0
    }
  );
  try {
    fixture.step();
    const result = await fixture.read();
    expect(result.positions[0]).toBeGreaterThan(1.3);
    expect(result.positions[2]).toBeLessThan(-0.1);
    expect(result.positions[6]).toBeCloseTo(0.5, 5);
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld floor contact skin does not bounce spheres before contact', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = await makeWorld(device, [0, 0, 0.507, 0.5], [0, 0, -0.5, 1], {
    plane: {},
    restitution: 1,
    restitutionThreshold: 0,
    staticFriction: 0,
    iterations: 1
  });
  try {
    fixture.step();
    const approaching = await fixture.read();
    expect(approaching.positions[2]).toBeGreaterThan(0.5);
    expect(approaching.velocities[2]).toBeCloseTo(-0.5, 5);
    fixture.step();
    const touching = await fixture.read();
    expect(touching.positions[2]).toBeCloseTo(0.5, 5);
    expect(touching.velocities[2]).toBeCloseTo(0.5, 5);
  } finally {
    fixture.destroy();
  }
}, 60000);

it('GPUSphereWorld explicit plane centers wake bodies when replacing offset placement', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  for (const multiplePlanes of [false, true]) {
    const plane = {normal: [0, 0, 2] as const, offset: 1};
    const fixture = await makeWorld(device, [0, 0, 1.5, 0.5], [0, 0, 0, 1], {
      gravity: [0, 0, -9.81],
      plane,
      ...(multiplePlanes ? {planes: [plane]} : {}),
      restitution: 0,
      sleepAfter: 0.05
    });
    try {
      fixture.step(12);
      expect((await fixture.read()).diagnostics.sleepingBodies).toBe(1);
      const movedPlane = {...plane, center: [0, 0, 0] as const};
      fixture.world.update(multiplePlanes ? {planes: [movedPlane]} : {plane: movedPlane});
      fixture.step();
      const result = await fixture.read();
      expect(result.velocities[2]).toBeLessThan(0);
      expect(result.positions[2]).toBeLessThan(1.5);
      expect(result.diagnostics.sleepingBodies).toBe(0);
    } finally {
      fixture.destroy();
    }
  }
}, 60000);
