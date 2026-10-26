// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBody} from '../../src/gpu-physics';

it('supports finite, unbounded, single-sided and double-sided plane contacts', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const fixtures: {
    plane: GPURigidBody;
    position: [number, number, number];
    gravity: [number, number, number];
    rests: boolean;
  }[] = [
    {
      plane: {position: [0, 0, 0], mass: 0, shape: {type: 'plane'}},
      position: [0, 1, 0],
      gravity: [0, -9.81, 0],
      rests: true
    },
    {
      plane: {position: [0, 0, 0], mass: 0, shape: {type: 'plane', sizeX: 2, sizeZ: 2}},
      position: [0, 1, 0],
      gravity: [0, -9.81, 0],
      rests: true
    },
    {
      plane: {position: [0, 0, 0], mass: 0, shape: {type: 'plane', sizeX: 2}},
      position: [3, 1, 0],
      gravity: [0, -9.81, 0],
      rests: false
    },
    {
      plane: {position: [0, 0, 0], mass: 0, shape: {type: 'plane'}},
      position: [0, -1, 0],
      gravity: [0, 9.81, 0],
      rests: false
    },
    {
      plane: {position: [0, 0, 0], mass: 0, shape: {type: 'plane', doubleSided: true}},
      position: [0, -1, 0],
      gravity: [0, 9.81, 0],
      rests: true
    }
  ];
  for (const fixture of fixtures) {
    const world = new GPURigidBodyWorld({
      bodies: [
        fixture.plane,
        {shape: {type: 'sphere', radius: 0.25}, mass: 1, position: fixture.position, restitution: 0}
      ],
      gravity: fixture.gravity,
      sleepAfter: 0
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    try {
      for (let start = 0; start < 180; start += 20) {
        const encoder = device.createCommandEncoder();
        for (let index = 0; index < 20; index++) graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        await world.readState();
      }
      const state = (await world.readState())[1];
      expect(state.position.every(Number.isFinite)).toBe(true);
      if (fixture.rests) {
        expect(Math.abs(state.position[1])).toBeCloseTo(0.25, 1);
        expect(Math.abs(state.velocity[1])).toBeLessThan(0.2);
      } else {
        expect(Math.abs(state.position[1])).toBeGreaterThan(2);
      }
      const diagnostics = await world.readCollisionDiagnostics();
      expect(diagnostics.unresolvedQueries).toBe(0);
    } finally {
      graph.destroy();
      world.destroy();
    }
  }
}, 120000);
