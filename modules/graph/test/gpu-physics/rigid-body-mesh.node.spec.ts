// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  makeConvexHullGeometry,
  makeTriangleMeshGeometry
} from '../../src/gpu-physics/rigid-body-mesh';
import {getRigidBodyShapeProperties} from '../../src/gpu-physics/rigid-body-shape-properties';
import {GPURigidBodyWorld} from '../../src/gpu-physics/gpu-rigid-body-world';
import {packRigidBodyShapes} from '../../src/gpu-physics/rigid-body-geometry';
const cube = Array.from({length: 8}, (_, corner) => [
  corner & 1 ? 1 : -1,
  corner & 2 ? 1 : -1,
  corner & 4 ? 1 : -1
]).flat();
it('constructs an outward hull with independent mass integrals and no source mutation', () => {
  const source = [...cube, 0, 0, 0, ...cube];
  const original = [...source];
  const geometry = makeConvexHullGeometry(source);
  expect(geometry.volume).toBeCloseTo(8, 8);
  for (const value of geometry.center) expect(value).toBeCloseTo(0, 12);
  for (const index of [0, 4, 8]) expect(geometry.tensor[index]).toBeCloseTo(16 / 3, 8);
  expect(geometry.positions).toHaveLength(24);
  expect(geometry.indices).toHaveLength(36);
  expect(source).toEqual(original);
  const visited: number[] = [];
  for (let node = 0; node < geometry.nodes.length / 12; node++) {
    expect(geometry.nodes[node * 12 + 3]).toBeGreaterThan(node);
    const count = geometry.nodes[node * 12 + 7],
      start = geometry.nodes[node * 12 + 8];
    for (let triangle = 0; triangle < count; triangle++) visited.push(start + triangle);
  }
  expect(visited.sort((first, second) => first - second)).toEqual(
    Array.from({length: 12}, (_, index) => index)
  );
  expect(() => makeConvexHullGeometry([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0])).toThrow();
});
it('integrates the cone limit and asymmetric primitive center of mass', () => {
  const cone = getRigidBodyShapeProperties({
    type: 'cylinder',
    height: 4,
    radiusBottom: 2,
    radiusTop: 0
  });
  expect(cone.volume).toBeCloseTo((16 * Math.PI) / 3, 9);
  expect(cone.center[1]).toBeCloseTo(-1, 9);
  expect(cone.tensor[4] / cone.volume).toBeCloseTo(1.2, 9);
  expect(cone.tensor[0] / cone.volume).toBeCloseTo(1.2, 9);
  const capsule = getRigidBodyShapeProperties({
    type: 'capsule',
    height: 2,
    radiusBottom: 1,
    radiusTop: 1
  });
  expect(capsule.volume).toBeCloseTo((10 * Math.PI) / 3, 9);
  expect(capsule.center[1]).toBeCloseTo(0, 9);
  expect(capsule.tensor[4]).toBeCloseTo((23 * Math.PI) / 15, 9);
  const tapered = getRigidBodyShapeProperties({
    type: 'capsule',
    height: 1,
    radiusBottom: 0.5,
    radiusTop: 0.25
  });
  expect(tapered.center[1]).toBeLessThan(0);
  const contained = getRigidBodyShapeProperties({
    type: 'capsule',
    height: 0.1,
    radiusBottom: 1,
    radiusTop: 0.1
  });
  expect(contained.volume).toBeCloseTo((4 * Math.PI) / 3, 9);
  expect(contained.center[1]).toBeCloseTo(-0.05, 9);
});
it('accepts moving mesh pairs without a fixed-center separation exception', () => {
  const geometry = makeTriangleMeshGeometry([-1, 0, -1, 1, 0, -1, 0, 0, 1], [0, 1, 2]);
  const fixed = {
    position: [0, 0, 0] as const,
    mass: 0,
    shape: {type: 'triangle-mesh' as const, geometry}
  };
  const wheel = {
    ...fixed,
    mode: 'dynamic' as const,
    inertiaDiagonal: [0, 1, 0] as const,
    gravityFactor: 0
  };
  const overlapping = new GPURigidBodyWorld({bodies: [fixed, wheel]});
  overlapping.destroy();
  const world = new GPURigidBodyWorld({bodies: [fixed, {...wheel, position: [0, 5, 0]}]});
  expect(world.count).toBe(2);
  world.destroy();
});

it('keeps nearly coplanar float32 hull faces manifold', () => {
  const positions: number[] = [];
  for (let latitude = 1; latitude < 12; latitude++) {
    const polar = (latitude * Math.PI) / 12;
    for (let longitude = 0; longitude < 24; longitude++) {
      const azimuth = (longitude * Math.PI) / 12;
      positions.push(
        Math.sin(polar) * Math.cos(azimuth),
        Math.cos(polar),
        Math.sin(polar) * Math.sin(azimuth)
      );
    }
  }
  positions.push(0, 1, 0, 0, -1, 0);
  const geometry = makeConvexHullGeometry(positions);
  expect(geometry.closed).toBe(true);
  expect(geometry.indices.length / 3).toBeLessThanOrEqual((geometry.positions.length / 3) * 2 - 4);
  expect(geometry.volume).toBeGreaterThan(4);
  expect(geometry.volume).toBeLessThan((4 * Math.PI) / 3);
});

it('allows open static triangles but rejects their use for dynamic volume integration', () => {
  const geometry = makeTriangleMeshGeometry([1, 0, 0, 0, 1, 0, 0, 0, 1], [0, 1, 2]);
  expect(geometry.volume).toBeGreaterThan(0);
  expect(geometry.closed).toBe(false);
  expect(
    () =>
      new GPURigidBodyWorld({
        bodies: [{position: [0, 0, 0], mass: 1, shape: {type: 'triangle-mesh', geometry}}]
      })
  ).toThrow('closed');
});

it('keeps volume and COM inertia invariant under a large local translation', () => {
  const translation = [1_000_000, 2_000_000, -3_000_000];
  const geometry = makeConvexHullGeometry(
    cube.map((value, index) => value + translation[index % 3])
  );
  expect(geometry.closed).toBe(true);
  expect(geometry.volume).toBeCloseTo(8, 10);
  expect(geometry.center).toEqual(translation);
  for (const index of [0, 4, 8]) expect(geometry.tensor[index]).toBeCloseTo(16 / 3, 10);
  for (const index of [1, 2, 3, 5, 6, 7]) expect(geometry.tensor[index]).toBeCloseTo(0, 10);
});

it('rejects invalid masses while permitting gravity-driven mesh pairs', () => {
  for (const mass of [NaN, Infinity, -1]) {
    expect(
      () =>
        new GPURigidBodyWorld({
          bodies: [{position: [0, 0, 0], mass, shape: {type: 'sphere', radius: 1}}]
        })
    ).toThrow('mass');
  }
  const geometry = makeTriangleMeshGeometry([-1, 0, -1, 1, 0, -1, 0, 0, 1], [0, 1, 2]);
  const world = new GPURigidBodyWorld({
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'triangle-mesh', geometry}},
      {
        position: [0, 5, 0],
        mode: 'dynamic',
        mass: 0,
        inertiaDiagonal: [0, 1, 0],
        shape: {type: 'triangle-mesh', geometry}
      }
    ]
  });
  world.destroy();
});

it('packs sparse collider exclusions in sorted unique ranges', () => {
  const colliders = Array.from({length: 1000}, (_, index) => ({
    shape: {type: 'sphere' as const, radius: 1},
    excludedColliders: index === 0 ? [999, 1, 999] : []
  }));
  const packed = packRigidBodyShapes(colliders);
  expect(packed.filters).toHaveLength(1000);
  expect(packed.filters[0]).toEqual([0, 2]);
  expect(packed.geometry.slice(0, 2)).toEqual([1, 999]);
  expect(packed.geometry).toHaveLength(4);
});

it('rejects invalid mesh traversal budgets before GPU attachment', () => {
  for (const maximumMeshTraversalTestsPerPair of [0, -1, 1.5, NaN, Infinity, 1048577]) {
    expect(
      () =>
        new GPURigidBodyWorld({
          maximumMeshTraversalTestsPerPair,
          bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: 1}}]
        })
    ).toThrow('mesh traversal');
  }
});

it('cooks thin noncoplanar hulls using exact float32 orientation instead of an aspect-ratio cutoff', () => {
  for (const scale of [0.001, 1, 1000]) {
    const geometry = makeConvexHullGeometry([
      0,
      0,
      0,
      scale,
      0,
      0,
      0,
      scale,
      0,
      0,
      0,
      scale * 1e-11
    ]);
    expect(geometry.closed).toBe(true);
    expect(geometry.indices).toHaveLength(12);
    expect(Math.abs(geometry.volume / ((scale ** 3 * 1e-11) / 6) - 1)).toBeLessThan(1e-6);
  }
});

it('rejects invalid mesh capacities before touching source elements', () => {
  for (const length of [-3, 3.5, Infinity, 3_000_003]) {
    const source = {
      length,
      get 0(): number {
        throw new Error('source accessed');
      }
    };
    expect(() => makeTriangleMeshGeometry(source, [0, 1, 2])).toThrow(/geometry/);
    expect(() => makeTriangleMeshGeometry([0, 0, 0], source)).toThrow(/geometry/);
  }
  expect(() => makeTriangleMeshGeometry([0, 0, 0, 1e40, 0, 0, 0, 1, 0], [0, 1, 2])).toThrow(
    'Invalid mesh'
  );
  expect(() => makeTriangleMeshGeometry([0, 0, 0, 1, 0, 0, 1 + 1e-10, 0, 0], [0, 1, 2])).toThrow(
    'Degenerate'
  );
});

it('packs shared cooked geometry once while retaining per-collider exclusion lists', () => {
  const geometry = makeConvexHullGeometry(cube);
  const shape = {type: 'convex-hull' as const, geometry};
  const single = packRigidBodyShapes([{shape}]);
  const shared = packRigidBodyShapes([{shape, excludedColliders: [1]}, {shape}]);
  expect(shared.shapes[0]).toEqual(shared.shapes[1]);
  expect(shared.geometry.length).toBe(single.geometry.length + 4);
  expect(shared.geometry[shared.filters[0][0]]).toBe(1);
  const distinct = packRigidBodyShapes([
    {shape},
    {shape: {...shape, geometry: structuredClone(geometry)}}
  ]);
  expect(distinct.geometry.length).toBe(single.geometry.length * 2);
});
