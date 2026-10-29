// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GroupNode} from '@luma.gl/engine';
import {ScenegraphPhysicsInstance, type ScenegraphPhysicsDefinition} from '@luma.gl/engine/physics';

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

it('roundtrips live scene state while retaining authored reset state and rejecting corrupt captures', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const node = new GroupNode();
  const instance = await ScenegraphPhysicsInstance.create(device, {
    bodies: new Map([[node, 0]]),
    world: {
      gravity: [0, 0, 0],
      timeStep: 0.1,
      bodies: [{position: [3, 0, 0], mass: 1, shape: {type: 'sphere', radius: 0.5}}]
    }
  });
  try {
    instance.world.setColliderShapes([{collider: 0, shape: {type: 'sphere', radius: 1}}]);
    instance.world.setBodyParameters(0, {mass: 2});
    instance.world.applyImpulse(0, [4, 0, 0]);
    await instance.advance();
    const state = await instance.world.readState();
    const capture = await instance.capture();
    await instance.advance();
    await instance.restore(capture);
    expect(await instance.world.readState()).toEqual(state);
    expect(instance.world.getBodyParameters(0).mass).toBe(2);
    expect(instance.world.getColliderShape(0)).toEqual({type: 'sphere', radius: 1});
    expect(instance.bodies.get(node)).toBe(0);
    const accepted = instance.world;
    const malformed = {...capture, state: {...capture.state, buffers: []}};
    await expect(instance.restore(malformed)).rejects.toThrow();
    expect(instance.world).toBe(accepted);
    expect(instance.revision).toBe(1);
    await instance.advance();
    expect((await instance.world.readState())[0].position[0]).toBeCloseTo(3.4, 5);
    await instance.reset();
    expect((await instance.world.readState())[0].position).toEqual([3, 0, 0]);
    expect(instance.world.getColliderShape(0)).toEqual({type: 'sphere', radius: 0.5});
    expect(instance.world.getBodyParameters(0).mass).toBe(1);
  } finally {
    await instance.destroy();
  }
});

it('holds borrowed world lifetime until tracked asynchronous queries complete', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const instance = await ScenegraphPhysicsInstance.create(device, {
    bodies: new Map(),
    world: {
      enableQueries: true,
      bodies: [{position: [0, 0, 0], mode: 'static', shape: {type: 'sphere', radius: 1}}]
    }
  });
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  try {
    const query = instance.withWorld(async world => {
      await expect(instance.reset()).rejects.toThrow();
      await gate;
      return world.raycast({origin: [-3, 0, 0], direction: [1, 0, 0], maximumDistance: 5});
    });
    await expect(instance.reset()).rejects.toThrow();
    const disposal = instance.destroy();
    release();
    expect((await query).hits[0].distance).toBeCloseTo(2, 4);
    await disposal;
    await expect(instance.capture()).rejects.toThrow();
  } finally {
    release();
    await instance.destroy();
  }
});

it('publishes COM-correct matrices and authored bounds without a CPU state bridge', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {vi} = await import('vitest');
  const instance = await ScenegraphPhysicsInstance.create(device, {
    bodies: new Map(),
    world: {
      gravity: [0, 0, 0],
      timeStep: 0.1,
      publicationBounds: [
        [
          [-1, -2, -3],
          [1, 2, 3]
        ]
      ],
      bodies: [
        {
          position: [2, 3, 4],
          centerOfMass: [0.5, 0, 0],
          velocity: [1, 0, 0],
          shape: {type: 'sphere', radius: 0.5}
        }
      ]
    }
  });
  try {
    const readback = vi
      .spyOn(instance.world, 'readState')
      .mockRejectedValue(new Error('Unexpected pose bridge'));
    await instance.advance();
    await instance.advance();
    expect(readback).not.toHaveBeenCalled();
    const matrices = new Float32Array((await instance.world.poseMatrices!.readAsync()).buffer);
    const bounds = new Float32Array((await instance.world.poseBounds!.readAsync()).buffer);
    expect(matrices[12]).toBeCloseTo(2.2, 5);
    expect(Array.from(matrices.slice(13, 15))).toEqual([3, 4]);
    expect(bounds[0]).toBeCloseTo(1.2, 5);
    expect(bounds[4]).toBeCloseTo(3.2, 5);
    expect(Array.from(bounds.slice(1, 3))).toEqual([1, 1]);
    expect(Array.from(bounds.slice(5, 7))).toEqual([5, 7]);
    readback.mockRestore();
  } finally {
    await instance.destroy();
  }
});
