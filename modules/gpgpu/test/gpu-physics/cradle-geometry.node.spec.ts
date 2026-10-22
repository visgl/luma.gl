// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {CubeGeometry, GroupNode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {
  CradleGeometryNode,
  makeCradleFrame,
  makeCradleFrameBodies
} from '../../../../examples/experimental/gpu-rigid-body-world/cradle-geometry';

it('cradle colliders follow authored parent transforms and support explicit overrides', () => {
  const frame = makeCradleFrame();
  frame.matrix.translate([2, 1, 0]);
  const bodies = makeCradleFrameBodies(frame);
  expect(bodies).toHaveLength(3);
  expect(bodies[0].position).toEqual([-2.2, 1, 1.95]);
  expect(bodies[0].shape?.type).toBe('box');
  if (bodies[0].shape?.type === 'box') {
    bodies[0].shape.halfExtents.forEach((value, index) =>
      expect(value).toBeCloseTo([0.3, 0.3, 1.95][index])
    );
  }
  const replacement = {
    mode: 'static' as const,
    position: [0, 0, 0] as const,
    shape: {type: 'sphere' as const, radius: 1}
  };
  const customized = new GroupNode({
    children: [
      new CradleGeometryNode('ignored', new CubeGeometry(), new Matrix4(), false),
      new CradleGeometryNode('custom', new CubeGeometry(), new Matrix4(), replacement)
    ]
  });
  expect(makeCradleFrameBodies(customized)).toEqual([replacement]);
});

it('rotated frame geometry produces world-space hull vertices under a transformed parent', () => {
  const frame = new GroupNode({
    matrix: new Matrix4().translate([3, 4, 5]),
    children: [
      new CradleGeometryNode(
        'rotated',
        new CubeGeometry(),
        new Matrix4().rotateZ(Math.PI / 4).scale([2, 1, 0.5])
      )
    ]
  });
  const [body] = makeCradleFrameBodies(frame);
  expect(body.position).toEqual([0, 0, 0]);
  expect(body.shape?.type).toBe('convex-hull');
  if (body.shape?.type !== 'convex-hull') return;
  const vertices = body.shape.geometry.positions;
  for (const horizontal of [-1, 1])
    for (const vertical of [-1, 1])
      for (const depth of [-1, 1]) {
        const expected = [
          3 + (2 * horizontal - vertical) * Math.SQRT1_2,
          4 + (2 * horizontal + vertical) * Math.SQRT1_2,
          5 + depth * 0.5
        ];
        let nearest = Infinity;
        for (let index = 0; index < vertices.length; index += 3) {
          nearest = Math.min(
            nearest,
            Math.hypot(
              vertices[index] - expected[0],
              vertices[index + 1] - expected[1],
              vertices[index + 2] - expected[2]
            )
          );
        }
        expect(nearest).toBeLessThan(1e-5);
      }
});
