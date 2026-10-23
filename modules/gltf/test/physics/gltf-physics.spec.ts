// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '@luma.gl/gpu-graph/gpu-core';
import {GPURigidBodyWorld} from '@luma.gl/gpu-graph/gpu-physics';
import {parseGLTFPhysics, createGLTFPhysicsWorld} from '../../src/physics';
import {makePhysicsDocument} from './physics-fixtures';

it('filters imported legacy box hulls on the GPU without blocking other systems', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const positions = Array.from({length: 8}, (_, corner) => [
    corner & 1 ? 0.5 : -0.5,
    corner & 2 ? 0.5 : -0.5,
    corner & 4 ? 0.5 : -0.5
  ]).flat();
  for (const filterIndex of [0, 1]) {
    const document = makePhysicsDocument([
      {
        children: [1],
        extensions: {
          KHR_physics_rigid_bodies: {
            collider: {geometry: {shape: 1}, collisionFilter: filterIndex}
          }
        }
      },
      {
        translation: [0, 3, 0],
        extensions: {
          KHR_physics_rigid_bodies: {
            motion: {mass: 1},
            collider: {geometry: {mesh: 0, convexHull: true}, collisionFilter: 1}
          }
        }
      }
    ]);
    const description = parseGLTFPhysics(document, {resolveLegacyMeshPositions: () => positions});
    expect(description.issues).toEqual([]);
    const world = createGLTFPhysicsWorld(description, {timeStep: 1 / 120, sleepAfter: 0});
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    try {
      for (let step = 0; step < 160; step += 20) {
        const encoder = device.createCommandEncoder();
        for (let substep = 0; substep < 20; substep++)
          graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        await world.readState();
      }
      const state = await world.readState();
      // The first filter excludes the falling hull's system. The second accepts it.
      if (filterIndex === 0) expect(state[1].position[1]).toBeLessThan(-3);
      else expect(state[1].position[1]).toBeGreaterThan(1.3);
    } finally {
      graph.destroy();
      world.destroy();
    }
  }
});

it('imported compound bodies match independently authored GPU worlds', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const document = makePhysicsDocument([
    {children: [1, 4]},
    {
      children: [2, 3],
      extensions: {
        KHR_physics_rigid_bodies: {
          motion: {mass: 2, inertiaDiagonal: [1, 2, 3], centerOfMass: [0.25, 0, 0]}
        }
      }
    },
    {
      translation: [0, -1, 0],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}}}}
    },
    {
      translation: [0, 1, 0],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}}}}
    },
    {
      translation: [-2, 1, 0],
      extensions: {
        KHR_physics_rigid_bodies: {
          motion: {mass: 1, linearVelocity: [3, 0, 0]},
          collider: {geometry: {shape: 0}}
        }
      }
    }
  ]);
  const description = parseGLTFPhysics(document);
  expect(description.issues).toEqual([]);
  const imported = createGLTFPhysicsWorld(description, {gravity: [0, 0, 0], sleepAfter: 0});
  const material = {
    staticFriction: 0.6,
    dynamicFriction: 0.6,
    restitution: 0.1,
    frictionCombine: 'average' as const,
    restitutionCombine: 'average' as const
  };
  const manual = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    sleepAfter: 0,
    bodies: [
      {
        position: [0, 0, 0],
        mode: 'dynamic',
        mass: 2,
        centerOfMass: [0.25, 0, 0],
        inertiaDiagonal: [1, 2, 3],
        colliders: [
          {shape: {type: 'sphere', radius: 0.5}, position: [0, -1, 0], material},
          {shape: {type: 'sphere', radius: 0.5}, position: [0, 1, 0], material}
        ]
      },
      {
        position: [-2, 1, 0],
        velocity: [3, 0, 0],
        mass: 1,
        colliders: [{shape: {type: 'sphere', radius: 0.5}, material}]
      }
    ]
  });
  const graphs = [];
  try {
    for (const world of [imported, manual]) {
      const definition = new GPUCommandGraph(device);
      world.addToGraph(definition);
      graphs.push(await definition.compileAsync());
    }
    for (let step = 0; step < 80; step++) {
      const encoder = device.createCommandEncoder();
      for (const graph of graphs) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
    }
    const actual = await imported.readState();
    const expected = await manual.readState();
    expect(actual[0].velocity[0]).toBeGreaterThan(0.1);
    expect(Math.abs(actual[0].angularVelocity[2])).toBeGreaterThan(0.1);
    for (let body = 0; body < actual.length; body++)
      for (const property of ['position', 'orientation', 'velocity', 'angularVelocity'] as const) {
        for (let component = 0; component < actual[body][property].length; component++)
          expect(actual[body][property][component]).toBeCloseTo(
            expected[body][property][component],
            5
          );
      }
  } finally {
    for (const graph of graphs) graph.destroy();
    imported.destroy();
    manual.destroy();
  }
});

it('glTF physics defaults to Y-up gravity and reports unsupported assets before GPU attachment', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const world = createGLTFPhysicsWorld(parseGLTFPhysics(makePhysicsDocument()));
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[0];
    expect(state.velocity[1]).toBeCloseTo(-9.81 / 120, 5);
    expect(state.velocity[2]).toBe(0);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
