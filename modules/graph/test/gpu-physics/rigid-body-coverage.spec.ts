// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  type GPURigidBodyShape
} from '../../src/gpu-physics';

const kinds = ['sphere', 'box', 'capsule', 'cylinder', 'convex-hull', 'triangle-mesh'] as const;
type ShapeKind = (typeof kinds)[number];
function makeShape(kind: ShapeKind): GPURigidBodyShape {
  if (kind === 'sphere') return {type: kind, radius: 0.5};
  if (kind === 'box') return {type: kind, halfExtents: [0.5, 0.5, 0.5]};
  if (kind === 'capsule' || kind === 'cylinder')
    return {type: kind, radiusBottom: 0.5, radiusTop: 0.5, height: 1};
  const hull = makeConvexHullGeometry(
    Array.from({length: 8}, (_, corner) => [
      corner & 1 ? 0.5 : -0.5,
      corner & 2 ? 0.5 : -0.5,
      corner & 4 ? 0.5 : -0.5
    ]).flat()
  );
  return {
    type: kind,
    geometry: kind === 'convex-hull' ? hull : makeTriangleMeshGeometry(hull.positions, hull.indices)
  };
}

// Ordered pairs deliberately cover both kernel orderings. This is response coverage,
// not penetration-depth qualification or a complete adversarial geometry reference.
it.for(
  kinds.flatMap(first => kinds.map(second => ({first, second})))
)('records initial-overlap response for $first / $second', async ({first, second}, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    failurePolicy: 'rollback',
    bodies: [
      {position: [0, 0, 0], shape: makeShape(first)},
      {position: [0.8, 0, 0], shape: makeShape(second)}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const initial = await world.captureState();
    const separated = structuredClone(initial);
    const positions = separated.buffers.find(buffer => buffer.name === 'positions')!.data;
    new DataView(positions.buffer, positions.byteOffset, positions.byteLength).setFloat32(
      16,
      4,
      true
    );
    world.restoreState(separated);
    const separatedEncoder = device.createCommandEncoder();
    graph.encode(separatedEncoder, {parameters: undefined});
    device.submit(separatedEncoder.finish());
    for (const state of await world.readState()) expect(state.velocity).toEqual([0, 0, 0]);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    world.restoreState(initial);
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const states = await world.readState();
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    if (first === 'triangle-mesh' && second === 'triangle-mesh') {
      // Known surface-only limitation: intersecting stationary meshes do not provide
      // a solid-volume penetration depth. Keep this gap visible, not a supported pass.
      expect(states[1].velocity[0] - states[0].velocity[0]).toBe(0);
      return;
    }
    expect(states[1].velocity[0] - states[0].velocity[0]).toBeGreaterThan(0.001);
    expect(states[1].position[0] - states[0].position[0]).toBeGreaterThan(0.8);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
