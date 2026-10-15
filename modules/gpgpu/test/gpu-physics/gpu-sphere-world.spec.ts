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
    expect((await target.read()).velocities[0]).toBeCloseTo(0.5, 5);
    target.step(2);
    const result = await target.read();
    expect(result.velocities[0]).toBeCloseTo(-0.5, 4);
    expect(result.velocities[4]).toBeCloseTo(0.5, 4);
  } finally {
    target.destroy();
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
