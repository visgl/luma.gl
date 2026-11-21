// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@math.gl/geometry/primitives';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, makeStaticTriangleMeshGeometry} from '../../src/gpu-physics';

it('preserves terrain seams and omitted triangles across origin shifts', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');

  // Two Z-up grid cells with the same gradient and matching seam. The east cell omits
  // its northeast triangle, as produced by a math.gl height field with a missing sample.
  const makeCell = (height: number, missingCorner: boolean) =>
    makeStaticTriangleMeshGeometry(
      new Geometry({
        topology: 'triangle-list',
        indices: new Uint16Array(missingCorner ? [0, 1, 2] : [0, 1, 2, 1, 3, 2]),
        attributes: {
          POSITION: {
            size: 3,
            value: new Float32Array([
              0,
              0,
              height,
              1,
              0,
              height + 0.25,
              0,
              1,
              height,
              1,
              1,
              height + 0.25
            ])
          }
        }
      })
    );
  const west = makeCell(0, false);
  const east = makeCell(0.25, true);
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    bodies: [
      {mass: 0, position: [511, 0, 0], shape: {type: 'triangle-mesh', geometry: west}},
      {mass: 0, position: [512, 0, 0], shape: {type: 'triangle-mesh', geometry: east}}
    ]
  });
  world.addToGraph(new GPUCommandGraph(device));
  /** Sample a terrain triangle with a downward ray in simulation-local coordinates. */
  const sample = (eastCoordinate: number, northCoordinate: number) =>
    world.raycast({
      origin: [eastCoordinate, northCoordinate, 2],
      direction: [0, 0, -1],
      maximumDistance: 4
    });
  try {
    expect((await sample(511.75, 0.125)).hits[0].point[2]).toBeCloseTo(0.1875, 5);
    expect((await sample(512.25, 0.125)).hits[0].point[2]).toBeCloseTo(0.3125, 5);
    expect((await sample(512.75, 0.75)).hits).toEqual([]);

    world.shiftOrigin([512, 0, 0]);
    for (const [eastCoordinate, expectedHeight] of [
      [-0.25, 0.1875],
      [0, 0.25],
      [0.25, 0.3125]
    ]) {
      const result = await sample(eastCoordinate, 0.125);
      expect(result.complete).toBe(true);
      expect(result.hits[0].point[2]).toBeCloseTo(expectedHeight, 5);
      expect(result.hits[0].normal[2]).toBeCloseTo(1 / Math.hypot(1, 0.25), 5);
    }
    expect((await sample(0.75, 0.75)).hits).toEqual([]);
  } finally {
    world.destroy();
  }
}, 120000);
