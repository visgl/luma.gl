// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GroupNode} from '@luma.gl/engine';
import {ScenegraphPhysicsInstance, type ScenegraphPhysicsDefinition} from '../../src/gpu-physics';

it('rebuilds geometry transactionally by scene references and resets only authored physics', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const node = new GroupNode({id: 'body'});
  const definition: ScenegraphPhysicsDefinition = {
    bodies: new Map([[node, 0]]),
    world: {
      gravity: [0, 0, 0],
      timeStep: 0.01,
      publishPoses: true,
      bodies: [{position: [0, 0, 0], velocity: [1, 0, 0], shape: {type: 'sphere', radius: 0.2}}]
    }
  };
  const instance = await ScenegraphPhysicsInstance.create(device, definition);
  try {
    await instance.advance();
    const before = (await instance.world.readState())[0];
    const previousWorld = instance.world;
    const larger: ScenegraphPhysicsDefinition = {
      bodies: definition.bodies,
      world: {
        ...definition.world,
        bodies: [{position: [5, 0, 0], mass: 2, shape: {type: 'sphere', radius: 0.4}}]
      }
    };
    await instance.rebuild(larger);
    expect(instance.world).not.toBe(previousWorld);
    expect((await instance.world.readState())[0].position).toEqual(before.position);
    expect(instance.revision).toBe(1);
    const acceptedWorld = instance.world;
    await expect(
      instance.rebuild({
        bodies: definition.bodies,
        world: {
          ...definition.world,
          bodies: [{position: [0, 0, 0], mass: -1, shape: {type: 'sphere', radius: 0.2}}]
        }
      })
    ).rejects.toThrow();
    expect(instance.world).toBe(acceptedWorld);
    expect(instance.revision).toBe(1);
    await instance.reset();
    expect((await instance.world.readState())[0].position).toEqual([5, 0, 0]);
    expect(node.position).toEqual([0, 0, 0]);
    expect(instance.revision).toBe(2);
  } finally {
    await instance.destroy();
  }
});

it('isolates instances sharing a scene and waits for an in-flight step before destruction', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const node = new GroupNode();
  const definition: ScenegraphPhysicsDefinition = {
    bodies: new Map([[node, 0]]),
    world: {
      gravity: [0, 0, 0],
      bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: 0.2}}]
    }
  };
  const first = await ScenegraphPhysicsInstance.create(device, definition);
  const second = await ScenegraphPhysicsInstance.create(device, definition);
  try {
    first.world.applyImpulse(0, [1, 0, 0]);
    await first.advance();
    expect((await first.world.readState())[0].position[0]).toBeGreaterThan(0);
    expect((await second.world.readState())[0].position[0]).toBe(0);
    const step = first.advance();
    const destroyed = first.destroy();
    await step;
    await destroyed;
    await expect(first.advance()).rejects.toThrow();
    await second.advance();
    expect((await second.world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    await first.destroy();
    await second.destroy();
  }
});
