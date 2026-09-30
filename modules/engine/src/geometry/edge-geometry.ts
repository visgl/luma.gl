// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {Geometry} from './geometry';

export type MakeEdgeGeometryOptions = {
  /** Keep coplanar internal edges to inspect the original triangulation. Defaults to false. */
  includeCoplanarEdges?: boolean;
  /** Minimum angle between adjacent face normals, in degrees. Defaults to 30. */
  angleThreshold?: number;
  /** Position welding distance in source units. Zero (default) welds exact duplicates. */
  weldTolerance?: number;
  /** Packed three-component CPU position attribute. Defaults to POSITION. */
  positionAttribute?: string;
};

type Position = [number, number, number];
type Edge = {start: number; end: number; normal: Position; faceCount: number; crease: boolean};

/** Extracts boundary, crease, and non-manifold edges from a triangle-list CPU geometry. */
export function makeEdgeGeometry(
  geometry: Geometry,
  options: MakeEdgeGeometryOptions = {}
): Geometry {
  const {angleThreshold = 30, weldTolerance = 0, positionAttribute = 'POSITION'} = options;
  const positions = geometry.attributes[positionAttribute];
  // Edge extraction requires packed xyz positions and complete triangle-list primitives.
  assert(geometry.topology === 'triangle-list' && positions?.size === 3);
  assert(positions.value.length % 3 === 0 && geometry.vertexCount % 3 === 0);
  assert(
    !positions['byteStride'] || positions['byteStride'] === positions.value.BYTES_PER_ELEMENT * 3
  );
  // Thresholds use source units and degrees, respectively.
  assert(Number.isFinite(weldTolerance) && weldTolerance >= 0);
  assert(Number.isFinite(angleThreshold) && angleThreshold >= 0 && angleThreshold <= 180);

  const sourceIndices = geometry.indices?.value;
  const sourceCount = positions.value.length / 3;
  assert(geometry.vertexCount <= (sourceIndices?.length ?? sourceCount));
  const representatives = new Map<number, number>();
  const buckets = new Map<string, number[]>();
  const faces = new Set<string>();
  const edges = new Map<string, Edge>();
  const cosineThreshold = Math.cos((angleThreshold * Math.PI) / 180);
  const toleranceSquared = weldTolerance * weldTolerance;

  function readPosition(index: number): Position {
    return [
      positions!.value[index * 3],
      positions!.value[index * 3 + 1],
      positions!.value[index * 3 + 2]
    ];
  }

  function weldPosition(index: number): number {
    const cached = representatives.get(index);
    if (cached !== undefined) return cached;
    // Invalid source indices must not silently produce NaN geometry.
    assert(Number.isInteger(index) && index >= 0 && index < sourceCount);
    const position = readPosition(index);
    assert(position.every(Number.isFinite));
    const cell =
      weldTolerance > 0 ? position.map(value => Math.floor(value / weldTolerance)) : position;
    const radius = weldTolerance > 0 ? 1 : 0;
    for (let east = -radius; east <= radius; east++) {
      for (let north = -radius; north <= radius; north++) {
        for (let up = -radius; up <= radius; up++) {
          const candidates = buckets.get(`${cell[0] + east},${cell[1] + north},${cell[2] + up}`);
          for (const candidate of candidates || []) {
            const other = readPosition(candidate);
            const distanceSquared =
              (position[0] - other[0]) ** 2 +
              (position[1] - other[1]) ** 2 +
              (position[2] - other[2]) ** 2;
            if (distanceSquared <= toleranceSquared) {
              representatives.set(index, candidate);
              return candidate;
            }
          }
        }
      }
    }
    const key = cell.join(',');
    const bucket = buckets.get(key) || [];
    bucket.push(index);
    buckets.set(key, bucket);
    representatives.set(index, index);
    return index;
  }

  function addEdge(first: number, second: number, normal: Position): void {
    const start = Math.min(first, second);
    const end = Math.max(first, second);
    const key = `${start},${end}`;
    const edge = edges.get(key);
    if (edge) {
      edge.faceCount++;
      const cosine =
        normal[0] * edge.normal[0] + normal[1] * edge.normal[1] + normal[2] * edge.normal[2];
      // Suppress numerical noise on coplanar triangles, including a zero-degree threshold.
      edge.crease ||= cosine < 1 - 1e-7 && cosine <= cosineThreshold + 1e-7;
    } else {
      edges.set(key, {start, end, normal, faceCount: 1, crease: false});
    }
  }

  for (let offset = 0; offset < geometry.vertexCount; offset += 3) {
    const first = weldPosition(sourceIndices?.[offset] ?? offset);
    const second = weldPosition(sourceIndices?.[offset + 1] ?? offset + 1);
    const third = weldPosition(sourceIndices?.[offset + 2] ?? offset + 2);
    if (first === second || second === third || third === first) continue;
    const faceKey = [first, second, third].sort((left, right) => left - right).join(',');
    if (faces.has(faceKey)) continue;
    faces.add(faceKey);
    const start = readPosition(first);
    const end = readPosition(second);
    const corner = readPosition(third);
    const firstDirection = end.map((value, axis) => value - start[axis]);
    const secondDirection = corner.map((value, axis) => value - start[axis]);
    const normal: Position = [
      firstDirection[1] * secondDirection[2] - firstDirection[2] * secondDirection[1],
      firstDirection[2] * secondDirection[0] - firstDirection[0] * secondDirection[2],
      firstDirection[0] * secondDirection[1] - firstDirection[1] * secondDirection[0]
    ];
    const magnitude = Math.hypot(...normal);
    if (magnitude === 0) continue;
    normal[0] /= magnitude;
    normal[1] /= magnitude;
    normal[2] /= magnitude;
    addEdge(first, second, normal);
    addEdge(second, third, normal);
    addEdge(third, first, normal);
  }

  const selected = [...edges.values()]
    .filter(edge => options.includeCoplanarEdges || edge.faceCount !== 2 || edge.crease)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  return new Geometry({
    id: `${geometry.id}-edges`,
    topology: 'line-list',
    attributes: {[positionAttribute]: positions},
    indices: new Uint32Array(selected.flatMap(edge => [edge.start, edge.end]))
  });
}
