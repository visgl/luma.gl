// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, makeTriangleMeshGeometry} from '../../src/gpu-physics';

it.for(['ordered', 'parallel'] as const)(
  'slides across a triangulated seam without a ridge impulse (%s)',
  {timeout: 120000},
  async (solver, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const geometry = makeTriangleMeshGeometry(
      [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0],
      [0, 1, 2, 0, 2, 3]
    );
    const world = new GPURigidBodyWorld({
      solver,
      timeStep: 1 / 120,
      gravity: [0, 0, -10],
      sleepAfter: 0,
      contactMatchDistance: 0.1,
      contactSlop: 0.001,
      failurePolicy: 'rollback',
      bodies: [
        {
          mode: 'static',
          position: [0, 0, 0],
          shape: {type: 'triangle-mesh', geometry},
          friction: 0
        },
        {
          position: [-0.5, 0, 0.5],
          velocity: [2, 0, 0],
          shape: {type: 'sphere', radius: 0.5},
          friction: 0
        }
      ]
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    let feature: number | undefined;
    let matchedAcrossSeam = false;
    try {
      for (let step = 0; step < 80; step++) {
        const encoder = device.createCommandEncoder();
        graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const state = await world.readState();
        expect(state[1].velocity[0]).toBeCloseTo(2, 3);
        expect(state[1].velocity[1]).toBeCloseTo(0, 4);
        expect(state[1].position[2]).toBeCloseTo(0.5, 2);
        const bytes = (await world.captureState()).buffers.find(
          buffer => buffer.name === 'manifolds'
        )!.data;
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        for (let offset = 0; offset < bytes.byteLength; offset += 416) {
          for (let slot = 0; slot < view.getUint32(offset + 384, true); slot++) {
            const start = offset + slot * 96;
            const current = view.getFloat32(start + 76, true);
            if (feature === undefined) feature = current;
            expect(current).toBe(feature);
            expect(Math.abs(view.getFloat32(start + 16, true))).toBeLessThan(1e-5);
            expect(Math.abs(view.getFloat32(start + 20, true))).toBeLessThan(1e-5);
            if (step > 30 && view.getFloat32(start + 36, true) > 0) matchedAcrossSeam = true;
          }
        }
      }
      expect(matchedAcrossSeam).toBe(true);
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    } finally {
      graph.destroy();
      world.destroy();
    }
  }
);

it.for([
  {kind: 'edge', position: [2.2, 0, 0.4]},
  {kind: 'corner', position: [2.2, 2.2, 0.4]}
] as const)(
  'preserves authored boundary $kind contacts',
  {timeout: 120000},
  async ({position}, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const geometry = makeTriangleMeshGeometry(
      [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0],
      [0, 1, 2, 0, 2, 3]
    );
    const world = new GPURigidBodyWorld({
      gravity: [0, 0, 0],
      sleepAfter: 0,
      penetrationRecoveryFraction: 0,
      bodies: [
        {mode: 'static', position: [0, 0, 0], shape: {type: 'triangle-mesh', geometry}},
        {position, shape: {type: 'sphere', radius: 0.5}}
      ]
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    try {
      const encoder = device.createCommandEncoder();
      graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      const capture = await world.captureState();
      const bytes = capture.buffers.find(buffer => buffer.name === 'manifolds')!.data;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let contacts = 0;
      for (let offset = 0; offset < bytes.byteLength; offset += 416)
        for (let slot = 0; slot < view.getUint32(offset + 384, true); slot++) {
          const start = offset + slot * 96;
          expect(view.getFloat32(start + 12, true)).toBeGreaterThan(0);
          expect(view.getFloat32(start + 16, true)).toBeGreaterThan(0.4);
          if (position[1] > 0) expect(view.getFloat32(start + 20, true)).toBeGreaterThan(0.4);
          contacts++;
        }
      expect(contacts).toBeGreaterThan(0);
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    } finally {
      graph.destroy();
      world.destroy();
    }
  }
);

it('normalizes tiny triangle face witnesses before closest-point evaluation', {
  timeout: 120000
}, async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const scale = 1e-6;
  const geometry = makeTriangleMeshGeometry(
    [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0].map(value => value * scale),
    [0, 1, 2, 0, 2, 3]
  );
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    contactSlop: 0,
    sleepAfter: 0,
    penetrationRecoveryFraction: 0,
    bodies: [
      {mode: 'static', position: [0, 0, 0], shape: {type: 'triangle-mesh', geometry}},
      {
        position: [0.5 * scale, 0, 0.49 * scale],
        mass: 1,
        inertiaDiagonal: [1, 1, 1],
        shape: {type: 'sphere', radius: 0.5 * scale}
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const bytes = (await world.captureState()).buffers.find(
      buffer => buffer.name === 'manifolds'
    )!.data;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let contacts = 0;
    for (let offset = 0; offset < bytes.byteLength; offset += 416)
      for (let slot = 0; slot < view.getUint32(offset + 384, true); slot++) {
        const start = offset + slot * 96;
        expect(view.getFloat32(start + 12, true)).toBeCloseTo(0.01 * scale, 12);
        expect(view.getFloat32(start + 24, true)).toBeCloseTo(1, 5);
        expect(Math.abs(view.getFloat32(start + 16, true))).toBeLessThan(1e-5);
        contacts++;
      }
    expect(contacts).toBeGreaterThan(0);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
