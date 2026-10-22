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
