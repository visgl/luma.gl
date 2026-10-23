// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getPolyhedronSeparation} from './convex-reference';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, makeConvexHullGeometry, type GPURigidBody} from '../../src/gpu-physics';

// Independent 2D rectangle SAT plus the common Z axis. Neither GJK nor EPA is used.
function getReferenceDepth(angle: number, center: number[]): number {
  const axes = [
    [1, 0],
    [0, 1],
    [Math.cos(angle), Math.sin(angle)],
    [-Math.sin(angle), Math.cos(angle)]
  ];
  return Math.min(
    1,
    ...axes.map(axis => {
      const firstRadius = 0.5 * (Math.abs(axis[0]) + Math.abs(axis[1]));
      const secondRadius =
        0.5 *
        (Math.abs(axis[0] * Math.cos(angle) + axis[1] * Math.sin(angle)) +
          Math.abs(-axis[0] * Math.sin(angle) + axis[1] * Math.cos(angle)));
      return firstRadius + secondRadius - Math.abs(axis[0] * center[0] + axis[1] * center[1]);
    })
  );
}

it.for([0.001, 1, 1000])(
  'qualifies convex penetration against independent SAT at scale %s',
  async (scale, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const geometry = makeConvexHullGeometry(
      Array.from({length: 8}, (_, corner) =>
        [corner & 1 ? 0.5 : -0.5, corner & 2 ? 0.5 : -0.5, corner & 4 ? 0.5 : -0.5].map(
          value => value * scale
        )
      ).flat()
    );
    for (const angle of [0.19, 0.71])
      for (const center of [
        [0.85, 0.2],
        [1.3, 0.4]
      ])
        for (const reverse of [false, true]) {
          const expected = getReferenceDepth(angle, center) * scale;
          const bodies: GPURigidBody[] = [
            {position: [0, 0, 0], shape: {type: 'convex-hull', geometry}},
            {
              position: [center[0] * scale, center[1] * scale, 0],
              orientation: [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)],
              shape: {type: 'box', halfExtents: [0.5 * scale, 0.5 * scale, 0.5 * scale]}
            }
          ];
          if (reverse) bodies.reverse();
          const world = new GPURigidBodyWorld({
            bodies,
            gravity: [0, 0, 0],
            maximumPairs: 8,
            contactSlop: 0,
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
            const bytes = (await world.captureState()).buffers.find(
              buffer => buffer.name === 'manifolds'
            )!.data;
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            let count = 0;
            for (let offset = 0; offset < bytes.byteLength; offset += 288)
              for (let slot = 0; slot < view.getUint32(offset + 256, true); slot++) {
                count++;
                expect(
                  Math.abs(view.getFloat32(offset + slot * 64 + 12, true) - expected) / scale
                ).toBeLessThan(0.001);
              }
            expect(count > 0).toBe(expected > 0);
          } finally {
            graph.destroy();
            world.destroy();
          }
        }
  },
  120000
);

it('qualifies exact sphere casts at tangency and nearly parallel unbounded planes', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  for (const scale of [0.001, 1, 1000]) {
    const world = new GPURigidBodyWorld({
      enableQueries: true,
      bodies: [
        {mode: 'static', position: [0, 0, 0], shape: {type: 'sphere', radius: scale}},
        {mode: 'static', position: [0, -5 * scale, 0], shape: {type: 'plane', doubleSided: true}}
      ]
    });
    world.addToGraph(new GPUCommandGraph(device));
    try {
      for (const height of [1.2, 1.25, 1.26]) {
        const result = await world.castSphere({
          origin: [-3 * scale, height * scale, 0],
          direction: [1, 0, 0],
          radius: 0.25 * scale,
          maximumDistance: 6 * scale,
          colliderIndices: [0]
        });
        expect(result.complete).toBe(true);
        expect(result.hits.length).toBe(height > 1.25 ? 0 : 1);
        if (height <= 1.25)
          expect(
            Math.abs(result.hits[0].distance / scale - (3 - Math.sqrt(1.25 ** 2 - height ** 2)))
          ).toBeLessThan(0.001);
      }
      const direction = [1, -1e-4, 0] as const;
      const result = await world.castSphere({
        origin: [0, -4.5 * scale, 0],
        direction,
        radius: 0.25 * scale,
        maximumDistance: 3000 * scale,
        colliderIndices: [1]
      });
      expect(result.complete).toBe(true);
      expect(result.hits).toHaveLength(1);
      expect(Math.abs(result.hits[0].distance / scale - 2500)).toBeLessThan(0.01);
    } finally {
      world.destroy();
    }
  }
}, 120000);

it('qualifies rounded box face, edge and corner casts without inflated-box false positives', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  for (const scale of [0.001, 1, 1000]) {
    const world = new GPURigidBodyWorld({
      enableQueries: true,
      bodies: [
        {
          mode: 'static',
          position: [0, 0, 0],
          shape: {type: 'box', halfExtents: [0.5 * scale, 0.5 * scale, 0.5 * scale]}
        }
      ]
    });
    world.addToGraph(new GPUCommandGraph(device));
    try {
      for (const [height, depth, expected] of [
        [0, 0, 2.25],
        [0.65, 0, 2.3],
        [0.5 + 0.25 / Math.sqrt(2), 0.5 + 0.25 / Math.sqrt(2), 2.5],
        [0.76, 0, -1],
        [0.7, 0.7, -1]
      ]) {
        const result = await world.castSphere({
          origin: [-3 * scale, height * scale, depth * scale],
          direction: [1, 0, 0],
          radius: 0.25 * scale,
          maximumDistance: 6 * scale
        });
        expect(result.complete).toBe(true);
        expect(result.hits.length, `height ${height}, depth ${depth}`).toBe(expected < 0 ? 0 : 1);
        if (expected >= 0) {
          expect(Math.abs(result.hits[0].distance / scale - expected)).toBeLessThan(0.002);
          expect(Math.abs(Math.hypot(...result.hits[0].normal) - 1)).toBeLessThan(0.001);
          const short = await world.castSphere({
            origin: [-3 * scale, height * scale, depth * scale],
            direction: [1, 0, 0],
            radius: 0.25 * scale,
            maximumDistance: (expected - 0.01) * scale
          });
          expect(short.hits).toHaveLength(0);
        }
      }
    } finally {
      world.destroy();
    }
  }
}, 120000);

it('qualifies tetrahedral convex depths against independent face and edge SAT', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [0, 1, -1],
    [0, 0, 1]
  ];
  const faces = [
    [0, 1, 2],
    [0, 1, 3],
    [1, 2, 3],
    [2, 0, 3]
  ];
  for (const scale of [0.01, 1, 100])
    for (const horizontal of [0.4, 2.4]) {
      const angle = 0.39,
        cosine = Math.cos(angle),
        sine = Math.sin(angle);
      const secondVertices = vertices.map(point => [
        point[0] * cosine - point[1] * sine + horizontal,
        point[0] * sine + point[1] * cosine + 0.1,
        point[2] + 0.17
      ]);
      const expected =
        -getPolyhedronSeparation({vertices, faces}, {vertices: secondVertices, faces}) * scale;
      const world = new GPURigidBodyWorld({
        gravity: [0, 0, 0],
        contactSlop: 0,
        penetrationRecoveryFraction: 0,
        maximumPairs: 8,
        bodies: [
          {
            position: [0, 0, 0],
            shape: {
              type: 'convex-hull',
              geometry: makeConvexHullGeometry(vertices.flat().map(value => value * scale))
            }
          },
          {
            position: [0, 0, 0],
            shape: {
              type: 'convex-hull',
              geometry: makeConvexHullGeometry(secondVertices.flat().map(value => value * scale))
            }
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
        let count = 0;
        for (let offset = 0; offset < bytes.byteLength; offset += 288)
          for (let slot = 0; slot < view.getUint32(offset + 256, true); slot++) {
            count++;
            expect(
              Math.abs(view.getFloat32(offset + slot * 64 + 12, true) - expected) / scale
            ).toBeLessThan(0.002);
          }
        expect(count > 0).toBe(expected > 0);
      } finally {
        graph.destroy();
        world.destroy();
      }
    }
}, 120000);
