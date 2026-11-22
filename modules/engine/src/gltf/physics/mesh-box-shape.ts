// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Recognize an exact box hull, never an approximate bounding-box collider. */
export function getMeshBoxBounds(positions: ArrayLike<number>): {
  center: [number, number, number];
  size: [number, number, number];
} {
  if (positions.length < 24 || positions.length % 3 !== 0)
    throw new Error('Mesh positions must contain complete XYZ vertices');
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < positions.length; index++) {
    const value = positions[index];
    if (!Number.isFinite(value)) throw new Error('Mesh positions must be finite');
    const axis = index % 3;
    minimum[axis] = Math.min(minimum[axis], value);
    maximum[axis] = Math.max(maximum[axis], value);
  }
  if (minimum.some((value, axis) => !(maximum[axis] > value)))
    throw new Error('Mesh box must have positive volume');
  let corners = 0;
  for (let index = 0; index < positions.length; index += 3) {
    let corner = 0;
    let isCorner = true;
    for (let axis = 0; axis < 3; axis++) {
      const value = positions[index + axis];
      if (value === maximum[axis]) corner |= 1 << axis;
      else if (value !== minimum[axis]) isCorner = false;
    }
    if (isCorner) corners |= 1 << corner;
  }
  // All points are within these extrema. All eight exact corners make the hull a box.
  if (corners !== 255) throw new Error('Mesh convex hull is not an exact axis-aligned box');
  return {
    center: [
      minimum[0] / 2 + maximum[0] / 2,
      minimum[1] / 2 + maximum[1] / 2,
      minimum[2] / 2 + maximum[2] / 2
    ],
    size: [maximum[0] - minimum[0], maximum[1] - minimum[1], maximum[2] - minimum[2]]
  };
}
