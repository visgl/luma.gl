// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Independent polyhedral SAT oracle for qualification; never imported by runtime code.
type Vector = readonly number[];
export type ReferencePolyhedron = {vertices: Vector[]; faces: number[][]};
const subtract = (first: Vector, second: Vector) =>
  first.map((value, axis) => value - second[axis]);
const cross = (first: Vector, second: Vector) => [
  first[1] * second[2] - first[2] * second[1],
  first[2] * second[0] - first[0] * second[2],
  first[0] * second[1] - first[1] * second[0]
];
const dot = (first: Vector, second: Vector) =>
  first.reduce((sum, value, axis) => sum + value * second[axis], 0);
export function getPolyhedronSeparation(first: ReferencePolyhedron, second: ReferencePolyhedron) {
  const normals: number[][] = [],
    edges: number[][][] = [];
  for (const polyhedron of [first, second]) {
    const directions: number[][] = [];
    for (const face of polyhedron.faces) {
      normals.push(
        cross(
          subtract(polyhedron.vertices[face[1]], polyhedron.vertices[face[0]]),
          subtract(polyhedron.vertices[face[2]], polyhedron.vertices[face[0]])
        )
      );
      for (let index = 0; index < face.length; index++)
        directions.push(
          subtract(
            polyhedron.vertices[face[(index + 1) % face.length]],
            polyhedron.vertices[face[index]]
          )
        );
    }
    edges.push(directions);
  }
  for (const firstEdge of edges[0])
    for (const secondEdge of edges[1]) normals.push(cross(firstEdge, secondEdge));
  let separation = -Infinity;
  for (const normal of normals) {
    const magnitude = Math.hypot(...normal);
    if (magnitude < 1e-12) continue;
    const firstProjection = first.vertices.map(vertex => dot(vertex, normal) / magnitude);
    const secondProjection = second.vertices.map(vertex => dot(vertex, normal) / magnitude);
    separation = Math.max(
      separation,
      Math.min(...secondProjection) - Math.max(...firstProjection),
      Math.min(...firstProjection) - Math.max(...secondProjection)
    );
  }
  return separation;
}
