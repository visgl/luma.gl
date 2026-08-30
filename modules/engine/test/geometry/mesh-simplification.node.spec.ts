// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {simplifyMesh} from '@luma.gl/engine';

const CUBE_POSITIONS = new Float32Array([
  -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1
]);
const CUBE_INDICES = new Uint16Array([
  0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6,
  1, 6, 5
]);

function makeGrid(columns: number, rows: number, curved = false) {
  const positions = new Float32Array(columns * rows * 3);
  const indices: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const vertexOffset = (row * columns + column) * 3;
      positions[vertexOffset] = column;
      positions[vertexOffset + 1] = row;
      positions[vertexOffset + 2] = curved ? (column * row) / (columns * rows) : 0;
      if (row + 1 < rows && column + 1 < columns) {
        const first = row * columns + column;
        indices.push(first, first + 1, first + columns);
        indices.push(first + 1, first + columns + 1, first + columns);
      }
    }
  }
  return {positions, indices: new Uint32Array(indices)};
}

function expectValidTriangles(positions: ArrayLike<number>, indices: ArrayLike<number>): void {
  expect(indices.length % 3).toBe(0);
  for (let indexOffset = 0; indexOffset < indices.length; indexOffset += 3) {
    const first = indices[indexOffset];
    const second = indices[indexOffset + 1];
    const third = indices[indexOffset + 2];
    expect(new Set([first, second, third]).size).toBe(3);
    expect(first).toBeLessThan(positions.length / 3);
    expect(second).toBeLessThan(positions.length / 3);
    expect(third).toBeLessThan(positions.length / 3);
  }
}

describe('simplifyMesh', () => {
  test('collapses real cube edges while preserving existing vertices and source winding', () => {
    const result = simplifyMesh({
      positions: CUBE_POSITIONS,
      indices: CUBE_INDICES,
      targetRatio: 0.5
    });

    expect(result.indices).toBeInstanceOf(Uint16Array);
    expect(result.indices.length).toBeLessThanOrEqual(CUBE_INDICES.length / 2);
    expect(result.indices.length).toBeGreaterThan(0);
    expect(result.geometricError).toBeGreaterThanOrEqual(0);
    expectValidTriangles(CUBE_POSITIONS, result.indices);
  });

  test('simplifies a grid without removing its four silhouette corners', () => {
    const {positions, indices} = makeGrid(6, 6);
    const result = simplifyMesh({positions, indices, targetRatio: 0.3});
    const survivingIndices = new Set(result.indices);

    expect(result.indices.length).toBeLessThanOrEqual(indices.length * 0.3);
    for (const corner of [0, 5, 30, 35]) {
      expect(survivingIndices.has(corner)).toBe(true);
    }
    expectValidTriangles(positions, result.indices);

    for (let indexOffset = 0; indexOffset < result.indices.length; indexOffset += 3) {
      const first = result.indices[indexOffset] * 3;
      const second = result.indices[indexOffset + 1] * 3;
      const third = result.indices[indexOffset + 2] * 3;
      const signedArea =
        (positions[second] - positions[first]) * (positions[third + 1] - positions[first + 1]) -
        (positions[second + 1] - positions[first + 1]) * (positions[third] - positions[first]);
      expect(signedArea).toBeGreaterThan(0);
    }
  });

  test('reduces an all-boundary skinned strip by collapsing only straight boundary edges', () => {
    const {positions, indices} = makeGrid(2, 6);
    const result = simplifyMesh({positions, indices, targetRatio: 0.4});
    const survivingIndices = new Set(result.indices);

    expect(result.indices.length).toBeLessThan(indices.length);
    for (const corner of [0, 1, 10, 11]) {
      expect(survivingIndices.has(corner)).toBe(true);
    }
    expectValidTriangles(positions, result.indices);
  });

  test('requires explicit opt-in before collapsing noncollinear boundary corners', () => {
    const {positions, indices} = makeGrid(2, 2);
    const protectedResult = simplifyMesh({positions, indices, targetRatio: 0.5});
    const relaxedResult = simplifyMesh({
      positions,
      indices,
      targetRatio: 0.5,
      preserveBoundary: false
    });

    expect(protectedResult.indices).toEqual(indices);
    expect(relaxedResult.indices).toHaveLength(3);
    expectValidTriangles(positions, relaxedResult.indices);
  });

  test('protects discrete skin-joint seams while retaining the original joint arrays', () => {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const indices = new Uint8Array([0, 1, 2]);
    const jointIndices = new Uint16Array([0, 1, 2]);
    const protectedResult = simplifyMesh({
      positions,
      indices,
      targetIndexCount: 0,
      preserveBoundary: false,
      attributes: [{values: jointIndices, size: 1}]
    });
    const unprotectedResult = simplifyMesh({
      positions,
      indices,
      targetIndexCount: 0,
      preserveBoundary: false
    });

    expect(protectedResult.indices).toEqual(indices);
    expect(unprotectedResult.indices).toHaveLength(0);
    expect(jointIndices).toEqual(new Uint16Array([0, 1, 2]));
  });

  test('preserves source positions, typed indices, and weighted UV attributes', () => {
    const {positions, indices} = makeGrid(5, 5, true);
    const originalPositions = positions.slice();
    const originalIndices = indices.slice();
    const textureCoordinates = new Float32Array(
      Array.from({length: (positions.length / 3) * 2}, (_, component) => component / 10)
    );
    const originalTextureCoordinates = textureCoordinates.slice();
    const result = simplifyMesh({
      positions,
      indices,
      targetRatio: 0.5,
      attributes: [{values: textureCoordinates, size: 2, weight: 4}]
    });

    expect(result.indices).toBeInstanceOf(Uint32Array);
    expect(result.indices.length).toBeLessThan(indices.length);
    expect(positions).toEqual(originalPositions);
    expect(indices).toEqual(originalIndices);
    expect(textureCoordinates).toEqual(originalTextureCoordinates);
    expectValidTriangles(positions, result.indices);
  });

  test('returns deterministic indices and nondecreasing geometric error across LOD levels', () => {
    const {positions, indices} = makeGrid(7, 7, true);
    const detailed = simplifyMesh({positions, indices, targetRatio: 0.75});
    const medium = simplifyMesh({positions, indices, targetRatio: 0.5});
    const coarse = simplifyMesh({positions, indices, targetRatio: 0.25});
    const repeated = simplifyMesh({positions, indices, targetRatio: 0.25});

    expect(medium.indices.length).toBeLessThanOrEqual(detailed.indices.length);
    expect(coarse.indices.length).toBeLessThanOrEqual(medium.indices.length);
    expect(medium.geometricError).toBeGreaterThanOrEqual(detailed.geometricError);
    expect(coarse.geometricError).toBeGreaterThanOrEqual(medium.geometricError);
    expect(repeated.indices).toEqual(coarse.indices);
    expect(repeated.geometricError).toBe(coarse.geometricError);
  });

  test('gives an explicit index-count target precedence over the target ratio', () => {
    const {positions, indices} = makeGrid(5, 5);
    const result = simplifyMesh({
      positions,
      indices,
      targetRatio: 1,
      targetIndexCount: 24
    });

    expect(result.indices.length).toBeLessThanOrEqual(24);
    expect(result.indices.length).toBeGreaterThan(0);
  });

  test('handles empty meshes and unchanged ratios without aliasing source indices', () => {
    for (const IndexArray of [Uint8Array, Uint16Array, Uint32Array]) {
      const indices = new IndexArray();
      const result = simplifyMesh({positions: [], indices});
      expect(result.indices).toBeInstanceOf(IndexArray);
      expect(result.indices).not.toBe(indices);
      expect(result.indices).toHaveLength(0);
      expect(result.geometricError).toBe(0);
    }

    const unchanged = simplifyMesh({
      positions: CUBE_POSITIONS,
      indices: CUBE_INDICES,
      targetRatio: 1
    });
    expect(unchanged.indices).toEqual(CUBE_INDICES);
    expect(unchanged.indices).not.toBe(CUBE_INDICES);
    expect(unchanged.geometricError).toBe(0);
  });

  test('removes duplicate and degenerate source triangles rather than emitting invalid faces', () => {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const indices = new Uint16Array([0, 1, 2, 0, 0, 1, 2, 1, 0]);
    const result = simplifyMesh({positions, indices, targetIndexCount: 3});

    expect(result.indices).toEqual(new Uint16Array([0, 1, 2]));
    expectValidTriangles(positions, result.indices);
  });
});
