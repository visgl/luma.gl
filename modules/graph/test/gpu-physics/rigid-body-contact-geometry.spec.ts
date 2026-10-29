// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeTriangleMeshGeometry,
  type GPURigidBody,
  type GPURigidBodyShape
} from '../../src/gpu-physics';

// Closed-form signed separations, independent of the runtime SAT/GJK implementations.
const cases = [
  {
    name: 'sphere/sphere',
    first: {type: 'sphere', radius: 0.5},
    second: {type: 'sphere', radius: 0.3},
    distance: 0.8
  },
  {
    name: 'box/box aligned faces',
    first: {type: 'box', halfExtents: [0.5, 0.7, 0.4]},
    second: {type: 'box', halfExtents: [0.3, 0.4, 0.2]},
    distance: 0.8
  },
  {
    name: 'box/sphere face',
    first: {type: 'box', halfExtents: [0.5, 0.7, 0.4]},
    second: {type: 'sphere', radius: 0.3},
    distance: 0.8
  },
  {
    name: 'capsule/sphere side',
    first: {type: 'capsule', radiusBottom: 0.5, radiusTop: 0.5, height: 1},
    second: {type: 'sphere', radius: 0.3},
    distance: 0.8
  }
] satisfies {name: string; first: GPURigidBodyShape; second: GPURigidBodyShape; distance: number}[];

it.for(cases)(
  'qualifies signed contact depths and reversed normals for $name',
  async (fixture, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    for (const scale of [0.25, 1, 4])
      for (const gap of [-0.04, 0.03])
        for (const reverse of [false, true]) {
          const angle = 0.63,
            normal = [Math.cos(angle), Math.sin(angle), 0];
          const scaleShape = (shape: GPURigidBodyShape): GPURigidBodyShape => {
            if (shape.type === 'sphere') return {...shape, radius: shape.radius * scale};
            if (shape.type === 'box')
              return {
                ...shape,
                halfExtents: shape.halfExtents.map(value => value * scale) as [
                  number,
                  number,
                  number
                ]
              };
            if (shape.type === 'capsule')
              return {
                ...shape,
                radiusBottom: shape.radiusBottom * scale,
                radiusTop: shape.radiusTop * scale,
                height: shape.height * scale
              };
            throw new Error('Unsupported reference shape');
          };
          const orientation: [number, number, number, number] = [
            0,
            0,
            Math.sin(angle / 2),
            Math.cos(angle / 2)
          ];
          const bodies: GPURigidBody[] = [
            {position: [1, -2, 0.3], orientation, shape: scaleShape(fixture.first)},
            {
              position: [
                1 + normal[0] * (fixture.distance + gap) * scale,
                -2 + normal[1] * (fixture.distance + gap) * scale,
                0.3
              ],
              orientation,
              shape: scaleShape(fixture.second)
            }
          ];
          if (reverse) bodies.reverse();
          const world = new GPURigidBodyWorld({
            bodies,
            gravity: [0, 0, 0],
            contactSlop: 0,
            broadPhase: 'hierarchical-grid',
            maximumPairs: 16,
            penetrationRecoveryFraction: 0,
            sleepAfter: 0
          });
          const definition = new GPUCommandGraph(device);
          world.addToGraph(definition);
          const graph = await definition.compileAsync();
          try {
            const encoder = device.createCommandEncoder();
            graph.encode(encoder, {parameters: undefined});
            device.submit(encoder.finish());
            expect((await world.readSimulationDiagnostics()).complete).toBe(true);
            const capture = await world.captureState();
            const bytes = capture.buffers.find(buffer => buffer.name === 'manifolds')!.data;
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            let contacts = 0;
            for (let offset = 0; offset < bytes.byteLength; offset += 416) {
              const count = view.getUint32(offset + 384, true);
              for (let slot = 0; slot < count; slot++) {
                contacts++;
                const contact = offset + slot * 96;
                const depth = view.getFloat32(contact + 12, true);
                expect(
                  Math.abs(depth + gap * scale),
                  `${fixture.name} depth at scale ${scale}`
                ).toBeLessThan(0.003 * scale);
                const projection = normal.reduce(
                  (sum, value, axis) =>
                    sum + value * view.getFloat32(contact + 16 + axis * 4, true),
                  0
                );
                expect(projection * (reverse ? -1 : 1)).toBeGreaterThan(0.98);
              }
            }
            expect(contacts > 0).toBe(gap < 0);
          } finally {
            graph.destroy();
            world.destroy();
          }
        }
  },
  120000
);

it('qualifies sphere/box edge and corner depths with compound collider offsets', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  for (const center of [
    [0.65, 0.65, 0],
    [0.62, 0.62, 0.62],
    [0.85, 0.85, 0]
  ]) {
    const closest = center.map(value => Math.max(-0.5, Math.min(0.5, value)));
    const separation = center.map((value, axis) => value - closest[axis]);
    const distance = Math.hypot(...separation),
      depth = 0.3 - distance;
    const world = new GPURigidBodyWorld({
      gravity: [0, 0, 0],
      contactSlop: 0,
      penetrationRecoveryFraction: 0,
      bodies: [
        {
          position: [0, 0, 0],
          colliders: [
            {position: [0.2, -0.1, 0.3], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}}
          ]
        },
        {
          position: [center[0] + 0.2, center[1] - 0.1, center[2] + 0.3],
          shape: {type: 'sphere', radius: 0.3}
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
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
      const bytes = (await world.captureState()).buffers.find(
        buffer => buffer.name === 'manifolds'
      )!.data;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let contacts = 0;
      for (let offset = 0; offset < bytes.byteLength; offset += 416)
        for (let slot = 0; slot < view.getUint32(offset + 384, true); slot++) {
          const contact = offset + slot * 96;
          contacts++;
          expect(view.getFloat32(contact + 12, true)).toBeCloseTo(depth, 4);
          const alignment = separation.reduce(
            (sum, value, axis) =>
              sum + (value / distance) * view.getFloat32(contact + 16 + axis * 4, true),
            0
          );
          expect(alignment).toBeGreaterThan(0.999);
        }
      expect(contacts > 0).toBe(depth > 0);
    } finally {
      graph.destroy();
      world.destroy();
    }
  }
}, 120000);

it('preserves nonconvex mesh openings and two-sided ray distances across scale and winding', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  // Four rectangular strips surround a real square hole. The reference is rectangle membership,
  // independent of the cooked triangle ordering, BVH and GPU ray/triangle implementation.
  for (const scale of [0.1, 1, 10])
    for (const reverse of [false, true]) {
      const positions: number[] = [],
        indices: number[] = [];
      for (const [minimumX, maximumX, minimumY, maximumY] of [
        [-2, -0.5, -2, 2],
        [0.5, 2, -2, 2],
        [-0.5, 0.5, -2, -0.5],
        [-0.5, 0.5, 0.5, 2]
      ]) {
        const base = positions.length / 3;
        positions.push(
          minimumX * scale,
          minimumY * scale,
          0,
          maximumX * scale,
          minimumY * scale,
          0,
          maximumX * scale,
          maximumY * scale,
          0,
          minimumX * scale,
          maximumY * scale,
          0
        );
        indices.push(
          ...(reverse
            ? [base + 2, base + 1, base, base + 3, base + 2, base]
            : [base, base + 1, base + 2, base, base + 2, base + 3])
        );
      }
      const angle = 0.4,
        cosine = Math.cos(angle),
        sine = Math.sin(angle);
      const world = new GPURigidBodyWorld({
        enableQueries: true,
        bodies: [
          {
            mode: 'static',
            position: [1, -2, 0.5],
            orientation: [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)],
            shape: {type: 'triangle-mesh', geometry: makeTriangleMeshGeometry(positions, indices)}
          }
        ]
      });
      world.addToGraph(new GPUCommandGraph(device));
      try {
        for (const [horizontal, vertical] of [
          [0, 0],
          [0.45, 0],
          [0.55, 0],
          [0.2, 1.3],
          [-1.7, 0.3],
          [2.1, 0]
        ])
          for (const side of [-1, 1]) {
            const ray = await world.raycast({
              origin: [
                1 + horizontal * scale,
                -2 + (vertical * cosine - side * 3 * sine) * scale,
                0.5 + (vertical * sine + side * 3 * cosine) * scale
              ],
              direction: [0, side * sine, -side * cosine],
              maximumDistance: 4 * scale
            });
            const expected =
              Math.abs(horizontal) < 2 &&
              Math.abs(vertical) < 2 &&
              (Math.abs(horizontal) > 0.5 || Math.abs(vertical) > 0.5);
            expect(ray.complete).toBe(true);
            expect(ray.hits.length > 0).toBe(expected);
            if (expected)
              expect(Math.abs(ray.hits[0].distance - 3 * scale)).toBeLessThan(0.0001 * scale);
          }
      } finally {
        world.destroy();
      }
    }
}, 120000);
