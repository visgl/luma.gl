// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GPURigidBodyWorld, decodeRigidBodySimulationDiagnostics} from '../../src/gpu-physics';

it('reports sparse owned allocation capacities without attaching a device', () => {
  for (const solver of ['ordered', 'parallel'] as const) {
    const world = new GPURigidBodyWorld({
      solver,
      broadPhase: 'hierarchical-grid',
      maximumPairs: 64,
      bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: 1}}]
    });
    const report = world.getCapacityInfo();
    expect(report.maximumPairs).toBe(64);
    expect(report.buffers.find(buffer => buffer.name === 'manifolds')?.byteLength).toBe(64 * 416);
    expect(report.buffers.some(buffer => buffer.name === 'parallel-state')).toBe(
      solver === 'parallel'
    );
    expect(report.ownedBufferBytes).toBe(
      report.buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    );
    expect(world.positions).toBe(null);
    world.destroy();
  }
});

it('rejects invalid stability parameters before allocating GPU resources', () => {
  for (const settings of [
    {warmStartFactor: -1},
    {warmStartFactor: 1.1},
    {penetrationRecoveryFraction: NaN},
    {maximumRecoverySpeed: -1},
    {parallelRelaxation: 0},
    {parallelRelaxation: 1.01}
  ]) {
    expect(
      () =>
        new GPURigidBodyWorld({
          ...settings,
          bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: 1}}]
        })
    ).toThrow('stability');
  }
});

it('does not label saturated or previously incomplete simulation counters complete', () => {
  const counters = new Uint32Array(16);
  counters[0] = 10;
  expect(decodeRigidBodySimulationDiagnostics(counters).complete).toBe(true);
  counters[1] = 1;
  expect(decodeRigidBodySimulationDiagnostics(counters).complete).toBe(false);
  counters[1] = 0;
  counters[15] = 1;
  expect(decodeRigidBodySimulationDiagnostics(counters).complete).toBe(false);
});

it('rejects device capacity before allocating or marking the world attached', () => {
  const world = new GPURigidBodyWorld({
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    maximumPairs: 64,
    bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: 1}}]
  });
  const definition = {
    device: {
      limits: {
        maxComputeWorkgroupsPerDimension: 65535,
        maxBufferSize: 1024,
        maxStorageBufferBindingSize: 1024,
        maxUniformBufferBindingSize: 65536
      }
    }
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    expect(() =>
      world.addToGraph(definition as unknown as import('../../src/gpu-core').GPUCommandGraph)
    ).toThrow('storage exceeds');
    expect(world.positions).toBe(null);
  }
});

it('accounts for bounded convex queues without allocating unused mesh task storage', () => {
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    continuous: {mode: 'convex', bodies: [0], maximumCandidates: 17},
    bodies: [{position: [0, 0, 0], shape: {type: 'box', halfExtents: [1, 1, 1]}}]
  });
  const buffers = world.getCapacityInfo().buffers;
  expect(buffers.find(buffer => buffer.name === 'continuous-work')?.byteLength).toBe(
    64 + 32 + 64 + 17 * 48
  );
  expect(buffers.find(buffer => buffer.name === 'continuous-dispatch')?.byteLength).toBe(16);
  expect(buffers.some(buffer => ['mesh-tasks', 'continuous-previous'].includes(buffer.name))).toBe(
    false
  );
  world.destroy();
});

it('rejects undeclared convex CCD geometries and invalid work capacities', () => {
  for (const maximumCandidates of [0, 1.5, NaN, Infinity])
    expect(
      () =>
        new GPURigidBodyWorld({
          failurePolicy: 'rollback',
          continuous: {mode: 'convex', bodies: [0], maximumCandidates},
          bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: 1}}]
        })
    ).toThrow('continuous');
  expect(
    () =>
      new GPURigidBodyWorld({
        failurePolicy: 'rollback',
        continuous: {mode: 'convex', bodies: [0]},
        bodies: [
          {position: [0, 0, 1], shape: {type: 'box', halfExtents: [1, 1, 1]}},
          {mode: 'static', position: [0, 0, 0], shape: {type: 'plane'}}
        ]
      })
  ).toThrow('continuous');
});
