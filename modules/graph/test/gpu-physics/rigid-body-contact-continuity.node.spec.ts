// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {makeTriangleMeshGeometry, makeConvexHullGeometry} from '../../src/gpu-physics';
import {makeCoplanarFeatures} from '../../src/gpu-physics/rigid-body-contact-features';

it('welds shared exact coplanar edges, including duplicated vertices, without closing gaps', () => {
  const mesh = makeTriangleMeshGeometry(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8]
  );
  const {features, internalEdges} = makeCoplanarFeatures(mesh);
  expect(internalEdges.filter(mask => mask > 0)).toHaveLength(2);
  expect(new Set(features).size).toBe(2);
  const counts = features.map(feature => features.filter(other => other === feature).length).sort();
  expect(counts).toEqual([1, 2, 2]);
});
it('keeps a tiny authored crease and nonmanifold edges separate', () => {
  const crease = makeTriangleMeshGeometry(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1e-7],
    [0, 1, 2, 1, 3, 2]
  );
  expect(new Set(makeCoplanarFeatures(crease).features).size).toBe(2);
  const nonmanifold = makeTriangleMeshGeometry(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0.5, -1, 0],
    [0, 1, 2, 1, 0, 3, 0, 1, 4]
  );
  expect(new Set(makeCoplanarFeatures(nonmanifold).features).size).toBe(3);
});
it('gives a triangulated convex box six persistent surface features', () => {
  const hull = makeConvexHullGeometry([
    -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1
  ]);
  expect(new Set(makeCoplanarFeatures(hull).features).size).toBe(6);
});

it('does not suppress the boundary of overlapping same-side triangles', () => {
  const geometry = makeTriangleMeshGeometry(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0.5, 1, 0],
    [0, 1, 2, 0, 1, 3]
  );
  const result = makeCoplanarFeatures(geometry);
  expect(new Set(result.features).size).toBe(2);
  expect(result.internalEdges).toEqual([0, 0]);
});
