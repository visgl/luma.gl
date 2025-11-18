// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js ShapeUtils (https://github.com/mrdoob/three.js/) under the MIT License.

import {earcut} from '@math.gl/polygon'
import {Vector2} from '@math.gl/core'

/** Utilities for working with polygonal shapes. */
export const ShapeUtils = {
  /** Computes the signed area of a polygon. */
  area(points: Vector2[]): number {
    let area = 0
    for (let current = 0, previous = points.length - 1; current < points.length; previous = current++) {
      area += points[previous].x * points[current].y - points[current].x * points[previous].y
    }
    return area * 0.5
  },

  /** Determines whether a polygon is oriented clockwise. */
  isClockWise(points: Vector2[]): boolean {
    return ShapeUtils.area(points) < 0
  },

  /** Triangulates a contour with optional holes into faces. */
  triangulateShape(contour: Vector2[], holes: Vector2[][]): number[][] {
    const vertices: number[] = []
    const holeIndices: number[] = []

    const cleanedContour = removeDuplicateEndPoints([...contour])
    addContour(vertices, cleanedContour)

    let holeIndex = cleanedContour.length
    holes.map((hole) => removeDuplicateEndPoints([...hole])).forEach((cleanHole) => {
      holeIndices.push(holeIndex)
      holeIndex += cleanHole.length
      addContour(vertices, cleanHole)
    })

    const triangles = earcut(vertices, holeIndices, 2)
    const faces: number[][] = []
    for (let i = 0; i < triangles.length; i += 3) {
      faces.push([triangles[i], triangles[i + 1], triangles[i + 2]])
    }
    return faces
  }
}

/** Removes a duplicate endpoint if the contour is closed. */
function removeDuplicateEndPoints(points: Vector2[]): Vector2[] {
  const cleaned: Vector2[] = []
  for (const point of points) {
    const previous = cleaned[cleaned.length - 1]
    if (!previous || !point.equals(previous)) {
      cleaned.push(point)
    }
  }

  if (cleaned.length > 2 && cleaned[0].equals(cleaned[cleaned.length - 1])) {
    cleaned.pop()
  }

  return cleaned
}

/** Writes contour coordinates into the earcut vertex array. */
function addContour(vertices: number[], contour: Vector2[]): void {
  for (const point of contour) {
    vertices.push(point.x, point.y)
  }
}
