// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4, Vector3} from '@math.gl/core';
import type {NumericArray} from '@math.gl/core';

/** Axis-aligned bounds in a scenegraph node's local coordinate system. */
export type ScenegraphBounds = [[number, number, number], [number, number, number]];

export function makeEmptyScenegraphBounds(): ScenegraphBounds {
  return [
    [Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, -Infinity]
  ];
}

export function expandScenegraphBounds(
  targetBounds: ScenegraphBounds,
  sourceBounds: [number[], number[]],
  transform: NumericArray
): void {
  const transformMatrix = new Matrix4(transform);

  for (let cornerIndex = 0; cornerIndex < 8; cornerIndex++) {
    const corner = new Vector3(
      sourceBounds[cornerIndex & 0b001 ? 1 : 0][0],
      sourceBounds[cornerIndex & 0b010 ? 1 : 0][1],
      sourceBounds[cornerIndex & 0b100 ? 1 : 0][2]
    );
    transformMatrix.transformAsPoint(corner, corner);

    for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
      targetBounds[0][componentIndex] = Math.min(
        targetBounds[0][componentIndex],
        corner[componentIndex]
      );
      targetBounds[1][componentIndex] = Math.max(
        targetBounds[1][componentIndex],
        corner[componentIndex]
      );
    }
  }
}

export function areScenegraphBoundsDefined(bounds: ScenegraphBounds): boolean {
  return Number.isFinite(bounds[0][0]);
}
