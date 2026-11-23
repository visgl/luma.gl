// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {makeExactOrientation} from './rigid-body-orientation';
import type {RigidBodyMeshGeometry} from './rigid-body-mesh';

/** Exact coplanarity in cooked float32 coordinates; no welding across gaps or creases. */
export function makeCoplanarFeatures(mesh: RigidBodyMeshGeometry): {
  features: number[];
  internalEdges: number[];
} {
  const count = mesh.indices.length / 3;
  const parents = Array.from({length: count}, (_, index) => index);
  const find = (index: number): number => {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  };
  const point = (vertex: number) => mesh.positions.slice(vertex * 3, vertex * 3 + 3);
  const internalEdges = new Array<number>(count).fill(0);
  const edges = new Map<string, {triangle: number; opposite: number; side: number}[]>();
  // Use the exact orientation predicate rather than an angle threshold that can flatten a crease.
  const orientation = makeExactOrientation(
    Array.from(
      {length: mesh.positions.length / 3},
      (_, index) => point(index) as [number, number, number]
    )
  );
  for (let triangle = 0; triangle < count; triangle++) {
    const vertices = mesh.indices.slice(triangle * 3, triangle * 3 + 3);
    for (let side = 0; side < 3; side++) {
      const first = point(vertices[side]).join(',');
      const second = point(vertices[(side + 1) % 3]).join(',');
      const key = first < second ? `${first}/${second}` : `${second}/${first}`;
      const uses = edges.get(key) ?? [];
      uses.push({triangle, side, opposite: vertices[(side + 2) % 3]});
      edges.set(key, uses);
    }
  }
  for (const uses of edges.values()) {
    // Nonmanifold edges are deliberately not welded.
    if (uses.length !== 2) continue;
    const [first, second] = uses;
    const vertices = mesh.indices.slice(first.triangle * 3, first.triangle * 3 + 3);
    if (orientation(vertices[0], vertices[1], vertices[2], second.opposite) !== 0) continue;
    // The shared edge can be a different pair of corners; recover it from both triangles.
    const firstVertices = mesh.indices.slice(first.triangle * 3, first.triangle * 3 + 3);
    const edgeStart = point(firstVertices[first.side]);
    const edgeEnd = point(firstVertices[(first.side + 1) % 3]);
    const edge = edgeEnd.map((value, axis) => value - edgeStart[axis]);
    const crossEdge = (vertex: number) => {
      const offset = point(vertex).map((value, axis) => value - edgeStart[axis]);
      return [
        edge[1] * offset[2] - edge[2] * offset[1],
        edge[2] * offset[0] - edge[0] * offset[2],
        edge[0] * offset[1] - edge[1] * offset[0]
      ];
    };
    const firstNormal = crossEdge(first.opposite);
    const secondNormal = crossEdge(second.opposite);
    if (firstNormal.reduce((sum, value, axis) => sum + value * secondNormal[axis], 0) >= 0)
      continue;
    internalEdges[first.triangle] |= 1 << first.side;
    internalEdges[second.triangle] |= 1 << second.side;
    const firstRoot = find(first.triangle);
    const secondRoot = find(second.triangle);
    parents[Math.max(firstRoot, secondRoot)] = Math.min(firstRoot, secondRoot);
  }
  return {features: parents.map((_, index) => find(index) + 1), internalEdges};
}
