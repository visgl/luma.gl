// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';

/** Per-vertex data used to preserve appearance and deformation during simplification. */
export type MeshSimplificationAttribute = {
  values: ArrayLike<number>;
  size: number;
  weight?: number;
};

/** Describes one indexed triangle mesh without transferring ownership of its vertex data. */
export type MeshSimplificationOptions = {
  positions: ArrayLike<number>;
  indices: Uint8Array | Uint16Array | Uint32Array;
  targetRatio?: number;
  targetIndexCount?: number;
  attributes?: readonly MeshSimplificationAttribute[];
  preserveBoundary?: boolean;
};

/** Simplified indices still reference the immutable source vertex and attribute arrays. */
export type MeshSimplificationResult = {
  indices: Uint8Array | Uint16Array | Uint32Array;
  geometricError: number;
};

type SimplificationVertex = {
  quadric: Float64Array;
  neighbors: Set<number>;
  boundaryNeighbors: Set<number>;
  triangles: Set<number>;
  active: boolean;
  version: number;
};

type SimplificationTriangle = {
  vertices: [number, number, number];
  active: boolean;
};

type EdgeCollapse = {
  retainedVertex: number;
  removedVertex: number;
  retainedVersion: number;
  removedVersion: number;
  geometricCost: number;
  cost: number;
};

const QUADRIC_COMPONENTS = 10;
const BOUNDARY_COLLINEAR_TOLERANCE = 1e-10;

/**
 * Simplifies an indexed triangle mesh through deterministic endpoint-only quadric edge collapses.
 *
 * The returned indices always reference existing source vertices. Positions, UV coordinates,
 * normals, joint indices, joint weights, morph deltas, and other original attributes therefore
 * remain shared and unchanged across every generated detail level.
 */
export function simplifyMesh(options: MeshSimplificationOptions): MeshSimplificationResult {
  const {positions, indices, attributes = [], preserveBoundary = true} = options;

  // Triangle indices and XYZ positions must describe complete source elements.
  assert(indices.length % 3 === 0 && positions.length % 3 === 0);

  const targetIndexCount = Math.max(
    0,
    Math.min(
      indices.length,
      Math.floor((options.targetIndexCount ?? indices.length * (options.targetRatio ?? 0.5)) / 3) *
        3
    )
  );
  if (indices.length === 0 || targetIndexCount >= indices.length) {
    return {indices: indices.slice(), geometricError: 0};
  }

  const vertexCount = positions.length / 3;
  const vertices: SimplificationVertex[] = Array.from({length: vertexCount}, () => ({
    quadric: new Float64Array(QUADRIC_COMPONENTS),
    neighbors: new Set<number>(),
    boundaryNeighbors: new Set<number>(),
    triangles: new Set<number>(),
    active: false,
    version: 0
  }));
  const triangles: SimplificationTriangle[] = [];
  const edgeCounts = new Map<number, number>();
  const triangleKeys = new Map<string, number>();
  const queue = new EdgeCollapseQueue();
  let activeTriangleCount = 0;
  let geometricErrorSquared = 0;

  const updateEdge = (firstVertex: number, secondVertex: number, change: number): void => {
    const minimumVertex = Math.min(firstVertex, secondVertex);
    const maximumVertex = Math.max(firstVertex, secondVertex);
    const edgeKey = minimumVertex * vertexCount + maximumVertex;
    const previousCount = edgeCounts.get(edgeKey) || 0;
    const nextCount = previousCount + change;

    if (nextCount <= 0) {
      edgeCounts.delete(edgeKey);
      vertices[firstVertex].neighbors.delete(secondVertex);
      vertices[secondVertex].neighbors.delete(firstVertex);
    } else {
      edgeCounts.set(edgeKey, nextCount);
      vertices[firstVertex].neighbors.add(secondVertex);
      vertices[secondVertex].neighbors.add(firstVertex);
    }

    if (nextCount === 1) {
      vertices[firstVertex].boundaryNeighbors.add(secondVertex);
      vertices[secondVertex].boundaryNeighbors.add(firstVertex);
    } else {
      vertices[firstVertex].boundaryNeighbors.delete(secondVertex);
      vertices[secondVertex].boundaryNeighbors.delete(firstVertex);
    }
  };

  const removeTriangle = (triangleIndex: number): void => {
    const triangle = triangles[triangleIndex];
    if (!triangle.active) {
      return;
    }
    const [firstVertex, secondVertex, thirdVertex] = triangle.vertices;
    triangleKeys.delete(getTriangleKey(firstVertex, secondVertex, thirdVertex));
    updateEdge(firstVertex, secondVertex, -1);
    updateEdge(secondVertex, thirdVertex, -1);
    updateEdge(thirdVertex, firstVertex, -1);
    vertices[firstVertex].triangles.delete(triangleIndex);
    vertices[secondVertex].triangles.delete(triangleIndex);
    vertices[thirdVertex].triangles.delete(triangleIndex);
    triangle.active = false;
    activeTriangleCount--;
  };

  const addTriangle = (triangleIndex: number): boolean => {
    const triangle = triangles[triangleIndex];
    const [firstVertex, secondVertex, thirdVertex] = triangle.vertices;
    if (
      firstVertex === secondVertex ||
      secondVertex === thirdVertex ||
      thirdVertex === firstVertex
    ) {
      return false;
    }

    const triangleKey = getTriangleKey(firstVertex, secondVertex, thirdVertex);
    if (triangleKeys.has(triangleKey)) {
      return false;
    }

    triangleKeys.set(triangleKey, triangleIndex);
    updateEdge(firstVertex, secondVertex, 1);
    updateEdge(secondVertex, thirdVertex, 1);
    updateEdge(thirdVertex, firstVertex, 1);
    vertices[firstVertex].triangles.add(triangleIndex);
    vertices[secondVertex].triangles.add(triangleIndex);
    vertices[thirdVertex].triangles.add(triangleIndex);
    vertices[firstVertex].active = true;
    vertices[secondVertex].active = true;
    vertices[thirdVertex].active = true;
    triangle.active = true;
    activeTriangleCount++;
    return true;
  };

  for (let indexOffset = 0; indexOffset < indices.length; indexOffset += 3) {
    const firstVertex = indices[indexOffset];
    const secondVertex = indices[indexOffset + 1];
    const thirdVertex = indices[indexOffset + 2];
    // Index-only simplification cannot represent references outside the source vertex array.
    assert(firstVertex < vertexCount && secondVertex < vertexCount && thirdVertex < vertexCount);

    const triangle: SimplificationTriangle = {
      vertices: [firstVertex, secondVertex, thirdVertex],
      active: false
    };
    const triangleIndex = triangles.push(triangle) - 1;
    if (addTriangle(triangleIndex)) {
      addTriangleQuadric(vertices, positions, firstVertex, secondVertex, thirdVertex);
    }
  }

  const enqueueEdge = (firstVertex: number, secondVertex: number): void => {
    if (!vertices[firstVertex].active || !vertices[secondVertex].active) {
      return;
    }

    const attributeCost = getAttributeCost(attributes, firstVertex, secondVertex);
    if (!Number.isFinite(attributeCost)) {
      return;
    }

    for (const [retainedVertex, removedVertex] of [
      [firstVertex, secondVertex],
      [secondVertex, firstVertex]
    ]) {
      if (
        preserveBoundary &&
        !canCollapseBoundary(vertices, positions, retainedVertex, removedVertex)
      ) {
        continue;
      }
      const geometricCost = Math.max(
        0,
        evaluateCombinedQuadric(vertices, positions, firstVertex, secondVertex, retainedVertex)
      );
      queue.add({
        retainedVertex,
        removedVertex,
        retainedVersion: vertices[retainedVertex].version,
        removedVersion: vertices[removedVertex].version,
        geometricCost,
        cost: geometricCost + attributeCost
      });
    }
  };

  for (let vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
    for (const neighbor of vertices[vertexIndex].neighbors) {
      if (vertexIndex < neighbor) {
        enqueueEdge(vertexIndex, neighbor);
      }
    }
  }

  while (activeTriangleCount * 3 > targetIndexCount) {
    const candidate = queue.remove();
    if (!candidate) {
      break;
    }
    const {retainedVertex, removedVertex} = candidate;
    const retained = vertices[retainedVertex];
    const removed = vertices[removedVertex];
    if (
      !retained.active ||
      !removed.active ||
      retained.version !== candidate.retainedVersion ||
      removed.version !== candidate.removedVersion ||
      !retained.neighbors.has(removedVertex) ||
      (preserveBoundary &&
        !canCollapseBoundary(vertices, positions, retainedVertex, removedVertex)) ||
      !preservesTriangleOrientation(triangles, vertices, positions, retainedVertex, removedVertex)
    ) {
      continue;
    }

    const affectedVertices = new Set<number>([
      retainedVertex,
      removedVertex,
      ...retained.neighbors,
      ...removed.neighbors
    ]);
    const affectedTriangles = [...removed.triangles];
    for (const triangleIndex of affectedTriangles) {
      removeTriangle(triangleIndex);
    }
    for (const triangleIndex of affectedTriangles) {
      const triangle = triangles[triangleIndex];
      for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
        if (triangle.vertices[cornerIndex] === removedVertex) {
          triangle.vertices[cornerIndex] = retainedVertex;
        }
      }
      addTriangle(triangleIndex);
    }

    for (let quadricIndex = 0; quadricIndex < QUADRIC_COMPONENTS; quadricIndex++) {
      retained.quadric[quadricIndex] += removed.quadric[quadricIndex];
    }
    removed.active = false;
    geometricErrorSquared = Math.max(geometricErrorSquared, candidate.geometricCost);

    for (const affectedVertex of affectedVertices) {
      vertices[affectedVertex].version++;
    }
    for (const affectedVertex of affectedVertices) {
      if (!vertices[affectedVertex].active) {
        continue;
      }
      for (const neighbor of vertices[affectedVertex].neighbors) {
        enqueueEdge(affectedVertex, neighbor);
      }
    }
  }

  const IndexArray = indices.constructor as
    | Uint8ArrayConstructor
    | Uint16ArrayConstructor
    | Uint32ArrayConstructor;
  const simplifiedIndices = new IndexArray(activeTriangleCount * 3);
  let indexOffset = 0;
  for (const triangle of triangles) {
    if (triangle.active) {
      simplifiedIndices[indexOffset++] = triangle.vertices[0];
      simplifiedIndices[indexOffset++] = triangle.vertices[1];
      simplifiedIndices[indexOffset++] = triangle.vertices[2];
    }
  }
  return {indices: simplifiedIndices, geometricError: Math.sqrt(geometricErrorSquared)};
}

function addTriangleQuadric(
  vertices: SimplificationVertex[],
  positions: ArrayLike<number>,
  firstVertex: number,
  secondVertex: number,
  thirdVertex: number
): void {
  const normal = getTriangleNormal(positions, firstVertex, secondVertex, thirdVertex);
  const length = Math.hypot(normal[0], normal[1], normal[2]);
  if (length === 0) {
    return;
  }
  const planeX = normal[0] / length;
  const planeY = normal[1] / length;
  const planeZ = normal[2] / length;
  const planeOffset = -(
    planeX * positions[firstVertex * 3] +
    planeY * positions[firstVertex * 3 + 1] +
    planeZ * positions[firstVertex * 3 + 2]
  );
  const plane = [planeX, planeY, planeZ, planeOffset];

  for (const vertexIndex of [firstVertex, secondVertex, thirdVertex]) {
    let quadricIndex = 0;
    for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
      for (let columnIndex = rowIndex; columnIndex < 4; columnIndex++) {
        vertices[vertexIndex].quadric[quadricIndex++] += plane[rowIndex] * plane[columnIndex];
      }
    }
  }
}

function evaluateCombinedQuadric(
  vertices: SimplificationVertex[],
  positions: ArrayLike<number>,
  firstVertex: number,
  secondVertex: number,
  targetVertex: number
): number {
  const point = [
    positions[targetVertex * 3],
    positions[targetVertex * 3 + 1],
    positions[targetVertex * 3 + 2],
    1
  ];
  let quadricIndex = 0;
  let error = 0;
  for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
    for (let columnIndex = rowIndex; columnIndex < 4; columnIndex++) {
      const quadric =
        vertices[firstVertex].quadric[quadricIndex] + vertices[secondVertex].quadric[quadricIndex];
      error += quadric * point[rowIndex] * point[columnIndex] * (rowIndex === columnIndex ? 1 : 2);
      quadricIndex++;
    }
  }
  return error;
}

function getAttributeCost(
  attributes: readonly MeshSimplificationAttribute[],
  firstVertex: number,
  secondVertex: number
): number {
  let error = 0;
  for (const attribute of attributes) {
    const weight = attribute.weight ?? 1;
    if (weight === 0) {
      continue;
    }
    const discrete =
      attribute.values instanceof Uint8Array ||
      attribute.values instanceof Uint16Array ||
      attribute.values instanceof Uint32Array;
    for (let componentIndex = 0; componentIndex < attribute.size; componentIndex++) {
      const difference =
        attribute.values[firstVertex * attribute.size + componentIndex] -
        attribute.values[secondVertex * attribute.size + componentIndex];
      if (discrete && difference !== 0) {
        return Infinity;
      }
      error += difference * difference * weight;
    }
  }
  return error;
}

function canCollapseBoundary(
  vertices: SimplificationVertex[],
  positions: ArrayLike<number>,
  retainedVertex: number,
  removedVertex: number
): boolean {
  const retainedBoundary = vertices[retainedVertex].boundaryNeighbors.size > 0;
  const removedBoundary = vertices[removedVertex].boundaryNeighbors.size > 0;
  if (retainedBoundary !== removedBoundary) {
    return false;
  }
  if (!removedBoundary) {
    return true;
  }

  const boundaryNeighbors = vertices[removedVertex].boundaryNeighbors;
  if (boundaryNeighbors.size !== 2 || !boundaryNeighbors.has(retainedVertex)) {
    return false;
  }
  const otherNeighbor = [...boundaryNeighbors].find(neighbor => neighbor !== retainedVertex);
  if (otherNeighbor === undefined) {
    return false;
  }

  const retainedOffset = getPositionDifference(positions, retainedVertex, removedVertex);
  const otherOffset = getPositionDifference(positions, otherNeighbor, removedVertex);
  const retainedLengthSquared = squaredLength(retainedOffset);
  const otherLengthSquared = squaredLength(otherOffset);
  const cross = [
    retainedOffset[1] * otherOffset[2] - retainedOffset[2] * otherOffset[1],
    retainedOffset[2] * otherOffset[0] - retainedOffset[0] * otherOffset[2],
    retainedOffset[0] * otherOffset[1] - retainedOffset[1] * otherOffset[0]
  ] as const;
  const dot =
    retainedOffset[0] * otherOffset[0] +
    retainedOffset[1] * otherOffset[1] +
    retainedOffset[2] * otherOffset[2];

  return (
    dot <= 0 &&
    squaredLength(cross) <=
      BOUNDARY_COLLINEAR_TOLERANCE * retainedLengthSquared * otherLengthSquared
  );
}

function preservesTriangleOrientation(
  triangles: SimplificationTriangle[],
  vertices: SimplificationVertex[],
  positions: ArrayLike<number>,
  retainedVertex: number,
  removedVertex: number
): boolean {
  for (const triangleIndex of vertices[removedVertex].triangles) {
    const triangle = triangles[triangleIndex];
    if (triangle.vertices.includes(retainedVertex)) {
      continue;
    }
    const originalNormal = getTriangleNormal(positions, ...triangle.vertices);
    const replacement = triangle.vertices.map(vertex =>
      vertex === removedVertex ? retainedVertex : vertex
    ) as [number, number, number];
    const replacementNormal = getTriangleNormal(positions, ...replacement);
    const normalAlignment =
      originalNormal[0] * replacementNormal[0] +
      originalNormal[1] * replacementNormal[1] +
      originalNormal[2] * replacementNormal[2];
    if (normalAlignment <= 0) {
      return false;
    }
  }
  return true;
}

function getTriangleNormal(
  positions: ArrayLike<number>,
  firstVertex: number,
  secondVertex: number,
  thirdVertex: number
): readonly [number, number, number] {
  const firstEdge = getPositionDifference(positions, secondVertex, firstVertex);
  const secondEdge = getPositionDifference(positions, thirdVertex, firstVertex);
  return [
    firstEdge[1] * secondEdge[2] - firstEdge[2] * secondEdge[1],
    firstEdge[2] * secondEdge[0] - firstEdge[0] * secondEdge[2],
    firstEdge[0] * secondEdge[1] - firstEdge[1] * secondEdge[0]
  ];
}

function getPositionDifference(
  positions: ArrayLike<number>,
  firstVertex: number,
  secondVertex: number
): readonly [number, number, number] {
  return [
    positions[firstVertex * 3] - positions[secondVertex * 3],
    positions[firstVertex * 3 + 1] - positions[secondVertex * 3 + 1],
    positions[firstVertex * 3 + 2] - positions[secondVertex * 3 + 2]
  ];
}

function squaredLength(vector: readonly [number, number, number]): number {
  return vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2];
}

function getTriangleKey(firstVertex: number, secondVertex: number, thirdVertex: number): string {
  return [firstVertex, secondVertex, thirdVertex].sort((first, second) => first - second).join(':');
}

/** Binary min-heap keeps repeated edge collapses practical for real production meshes. */
class EdgeCollapseQueue {
  private readonly entries: EdgeCollapse[] = [];

  add(candidate: EdgeCollapse): void {
    this.entries.push(candidate);
    let index = this.entries.length - 1;
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (compareCollapses(this.entries[parentIndex], candidate) <= 0) {
        break;
      }
      this.entries[index] = this.entries[parentIndex];
      this.entries[parentIndex] = candidate;
      index = parentIndex;
    }
  }

  remove(): EdgeCollapse | undefined {
    const first = this.entries[0];
    const last = this.entries.pop();
    if (!first || !last || this.entries.length === 0) {
      return first;
    }
    this.entries[0] = last;
    let index = 0;
    while (true) {
      const firstChild = index * 2 + 1;
      if (firstChild >= this.entries.length) {
        break;
      }
      const secondChild = firstChild + 1;
      const child =
        secondChild < this.entries.length &&
        compareCollapses(this.entries[secondChild], this.entries[firstChild]) < 0
          ? secondChild
          : firstChild;
      if (compareCollapses(this.entries[index], this.entries[child]) <= 0) {
        break;
      }
      [this.entries[index], this.entries[child]] = [this.entries[child], this.entries[index]];
      index = child;
    }
    return first;
  }
}

function compareCollapses(first: EdgeCollapse, second: EdgeCollapse): number {
  return (
    first.cost - second.cost ||
    first.retainedVertex - second.retainedVertex ||
    first.removedVertex - second.removedVertex
  );
}
