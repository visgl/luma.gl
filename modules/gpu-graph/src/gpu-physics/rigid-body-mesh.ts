// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeExactOrientation} from './rigid-body-orientation';

export type RigidBodyMeshGeometry = {
  positions: number[];
  indices: number[];
  minimum: [number, number, number];
  maximum: [number, number, number];
  /** Three vec4s per depth-first node: minimum/escape, maximum/count, start/padding. */
  nodes: number[];
  /** Every geometric edge has two opposite directed uses. Required for dynamic mass integration. */
  closed: boolean;
  volume: number;
  center: [number, number, number];
  /** Unit-density tensor about the center, row-major. */
  tensor: number[];
};
type Point = [number, number, number];
const subtract = (first: Point, second: Point): Point =>
  first.map((value, axis) => value - second[axis]) as Point;
const cross = (first: Point, second: Point): Point => [
  first[1] * second[2] - first[2] * second[1],
  first[2] * second[0] - first[0] * second[2],
  first[0] * second[1] - first[1] * second[0]
];
const dot = (first: Point, second: Point): number =>
  first.reduce((sum, value, axis) => sum + value * second[axis], 0);

/** Load-time hull construction; simulation never reads geometry back to the CPU. */
export function makeConvexHullGeometry(positions: ArrayLike<number>): RigidBodyMeshGeometry {
  if (
    !Number.isSafeInteger(positions.length) ||
    positions.length % 3 ||
    positions.length > 3_000_000
  )
    throw new Error('Invalid hull capacity');
  const unique = new Map<string, Point>();
  for (let offset = 0; offset < positions.length; offset += 3) {
    const point: Point = [
      Math.fround(positions[offset]),
      Math.fround(positions[offset + 1]),
      Math.fround(positions[offset + 2])
    ];
    if (!point.every(Number.isFinite)) throw new Error('Invalid hull positions');
    unique.set(point.join(','), point);
  }
  const points = [...unique.values()];
  const orient = makeExactOrientation(points);
  if (points.length < 4) throw new Error('A hull requires four noncoplanar vertices');
  if (points.length > 16384) throw new Error('Convex hull vertex capacity exceeded');
  const first = 0;
  let second = 1;
  for (let index = 2; index < points.length; index++)
    if (
      dot(subtract(points[index], points[first]), subtract(points[index], points[first])) >
      dot(subtract(points[second], points[first]), subtract(points[second], points[first]))
    )
      second = index;
  const line = subtract(points[second], points[first]);
  let third = 0;
  let maximum = 0;
  for (let index = 0; index < points.length; index++) {
    const normal = cross(line, subtract(points[index], points[first]));
    const distance = dot(normal, normal);
    if (distance > maximum) {
      maximum = distance;
      third = index;
    }
  }
  const normal = cross(line, subtract(points[third], points[first]));
  let fourth = 0;
  maximum = 0;
  for (let index = 0; index < points.length; index++) {
    const distance = Math.abs(dot(normal, subtract(points[index], points[first])));
    if (distance > maximum) {
      maximum = distance;
      fourth = index;
    }
  }
  const scale = Math.max(...line.map(Math.abs), 1e-12);
  if (maximum < 1e-10 * scale ** 3) throw new Error('Degenerate convex hull');
  const center: Point = [0, 1, 2].map(
    axis =>
      (points[first][axis] + points[second][axis] + points[third][axis] + points[fourth][axis]) / 4
  ) as Point;
  type HullFace = {indices: number[]; normal: Point; constant: number; epsilon: number};
  const face = (firstIndex: number, secondIndex: number, thirdIndex: number): HullFace => {
    const direction = cross(
      subtract(points[secondIndex], points[firstIndex]),
      subtract(points[thirdIndex], points[firstIndex])
    );
    const flipped = dot(direction, subtract(center, points[firstIndex])) > 0;
    if (flipped) for (let axis = 0; axis < 3; axis++) direction[axis] = -direction[axis];
    return {
      indices: flipped
        ? [firstIndex, thirdIndex, secondIndex]
        : [firstIndex, secondIndex, thirdIndex],
      normal: direction,
      constant: dot(direction, points[firstIndex]),
      epsilon: 1e-8 * scale * Math.sqrt(dot(direction, direction))
    };
  };
  let faces = [
    face(first, second, third),
    face(first, fourth, second),
    face(first, third, fourth),
    face(second, fourth, third)
  ];
  for (let index = 0; index < points.length; index++) {
    if ([first, second, third, fourth].includes(index)) continue;
    const edges = new Map<string, [number, number]>();
    const retained: HullFace[] = [];
    for (const current of faces) {
      const triangle = current.indices;
      const point = points[index];
      const origin = points[triangle[0]];
      const distance =
        current.normal[0] * (point[0] - origin[0]) +
        current.normal[1] * (point[1] - origin[1]) +
        current.normal[2] * (point[2] - origin[2]);
      if (
        Math.abs(distance) <= current.epsilon
          ? orient(triangle[0], triangle[1], triangle[2], index) > 0
          : distance > 0
      ) {
        for (let side = 0; side < 3; side++) {
          const start = triangle[side],
            end = triangle[(side + 1) % 3];
          if (!edges.delete(`${end},${start}`)) edges.set(`${start},${end}`, [start, end]);
        }
      } else retained.push(current);
    }
    for (const [start, end] of edges.values()) retained.push(face(start, end, index));
    faces = retained;
    if (faces.length > points.length * 2 - 4) throw new Error('Non-manifold convex hull');
  }
  const triangles = faces.flatMap(current => current.indices);
  const used = [...new Set(triangles)];
  const remap = new Map(used.map((index, offset) => [index, offset]));
  return makeTriangleMeshGeometry(
    used.flatMap(index => points[index]),
    triangles.map(index => remap.get(index)!)
  );
}

/** Exact indexed triangle geometry with a balanced, stackless local-space BVH. */
export function makeTriangleMeshGeometry(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>
): RigidBodyMeshGeometry {
  if (positions.length % 3 || indices.length % 3 || !positions.length || !indices.length)
    throw new Error('Incomplete mesh geometry');
  const vertices = Array.from(positions, Math.fround);
  const triangles = Array.from(indices);
  if (
    !vertices.every(Number.isFinite) ||
    triangles.some(index => !Number.isInteger(index) || index < 0 || index >= vertices.length / 3)
  )
    throw new Error('Invalid mesh geometry');
  if (vertices.length / 3 > 1_000_000 || triangles.length / 3 > 1_000_000)
    throw new Error('Mesh geometry capacity exceeded');
  const point = (index: number): Point => [
    vertices[index * 3],
    vertices[index * 3 + 1],
    vertices[index * 3 + 2]
  ];
  for (let triangle = 0; triangle < triangles.length; triangle += 3) {
    const first = point(triangles[triangle]);
    const normal = cross(
      subtract(point(triangles[triangle + 1]), first),
      subtract(point(triangles[triangle + 2]), first)
    );
    if (normal.every(value => value === 0)) throw new Error('Degenerate mesh triangle');
  }
  const minimum: Point = [Infinity, Infinity, Infinity],
    maximum: Point = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < vertices.length; index++) {
    const axis = index % 3;
    minimum[axis] = Math.min(minimum[axis], vertices[index]);
    maximum[axis] = Math.max(maximum[axis], vertices[index]);
  }
  const nodes: number[] = [];
  const ordered: number[] = [];
  const build = (faces: number[]): void => {
    const offset = nodes.length;
    nodes.push(...Array<number>(12).fill(0));
    const lower: Point = [Infinity, Infinity, Infinity],
      upper: Point = [-Infinity, -Infinity, -Infinity];
    for (const triangle of faces)
      for (let corner = 0; corner < 3; corner++) {
        const vertex = point(triangles[triangle * 3 + corner]);
        for (let axis = 0; axis < 3; axis++) {
          lower[axis] = Math.min(lower[axis], vertex[axis]);
          upper[axis] = Math.max(upper[axis], vertex[axis]);
        }
      }
    if (faces.length <= 4) {
      nodes[offset + 7] = faces.length;
      nodes[offset + 8] = ordered.length / 3;
      for (const triangle of faces)
        ordered.push(...triangles.slice(triangle * 3, triangle * 3 + 3));
    } else {
      let axis = 0;
      for (let candidate = 1; candidate < 3; candidate++)
        if (upper[candidate] - lower[candidate] > upper[axis] - lower[axis]) axis = candidate;
      const centroid = (triangle: number) =>
        triangles
          .slice(triangle * 3, triangle * 3 + 3)
          .reduce((sum, index) => sum + vertices[index * 3 + axis], 0);
      faces.sort((first, second) => centroid(first) - centroid(second));
      const middle = faces.length >> 1;
      build(faces.slice(0, middle));
      build(faces.slice(middle));
    }
    nodes.splice(offset, 3, ...lower);
    nodes.splice(offset + 4, 3, ...upper);
    nodes[offset + 3] = nodes.length / 12;
  };
  build(Array.from({length: triangles.length / 3}, (_, index) => index));
  // Weld by coordinates for topology checks: glTF often splits vertices at UV seams.
  const vertexKeys = Array.from({length: vertices.length / 3}, (_, index) =>
    point(index).join(',')
  );
  const edges = new Map<string, {count: number; balance: number}>();
  for (let index = 0; index < triangles.length; index += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const first = vertexKeys[triangles[index + corner]];
      const second = vertexKeys[triangles[index + ((corner + 1) % 3)]];
      const forward = first < second;
      const key = forward ? `${first}/${second}` : `${second}/${first}`;
      const edge = edges.get(key) ?? {count: 0, balance: 0};
      edge.count++;
      edge.balance += forward ? 1 : -1;
      edges.set(key, edge);
    }
  }
  const closed = [...edges.values()].every(edge => edge.count === 2 && edge.balance === 0);
  // Integrate near the geometry, not the scene origin: large local translations
  // otherwise cancel large tetrahedral moments into an inaccurate COM tensor.
  const origin: Point = minimum.map((value, axis) => (value + maximum[axis]) / 2) as Point;
  let volume = 0;
  const moment = [0, 0, 0];
  const secondMoment = Array<number>(9).fill(0);
  for (let index = 0; index < triangles.length; index += 3) {
    const corners = [
      subtract(point(triangles[index]), origin),
      subtract(point(triangles[index + 1]), origin),
      subtract(point(triangles[index + 2]), origin)
    ];
    const signed = dot(corners[0], cross(corners[1], corners[2])) / 6;
    volume += signed;
    for (let row = 0; row < 3; row++) {
      moment[row] += (signed * corners.reduce((sum, corner) => sum + corner[row], 0)) / 4;
      for (let column = 0; column < 3; column++) {
        let sum = 0;
        for (let first = 0; first < 3; first++)
          for (let second = 0; second < 3; second++)
            sum += corners[first][row] * corners[second][column] * (first === second ? 2 : 1);
        secondMoment[row * 3 + column] += (signed * sum) / 20;
      }
    }
  }
  const center: Point = volume !== 0 ? (moment.map(value => value / volume) as Point) : [0, 0, 0];
  const sign = Math.sign(volume);
  volume = Math.abs(volume);
  const tensor = secondMoment.map((value, index) => {
    const row = Math.floor(index / 3),
      column = index % 3;
    return (
      sign * ((row === column ? secondMoment[0] + secondMoment[4] + secondMoment[8] : 0) - value) -
      volume * ((row === column ? dot(center, center) : 0) - center[row] * center[column])
    );
  });
  return {
    positions: vertices,
    indices: ordered,
    minimum,
    maximum,
    nodes,
    closed,
    volume,
    center: center.map((value, axis) => value + origin[axis]) as Point,
    tensor
  };
}
