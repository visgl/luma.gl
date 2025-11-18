// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js ShapePath (https://github.com/mrdoob/three.js/) under the MIT License.

import {Vector2} from '@math.gl/core'
import {Path, Shape} from './path'
import {ShapeUtils} from './shape-utils'

/** Collects sub-paths that form a single glyph outline. */
export class ShapePath {
  /** All sub-paths that compose the shape. */
  subPaths: Path[] = []
  /** The path currently receiving drawing commands. */
  currentPath: Path | null = null

  /** Starts a new sub-path at the provided coordinates. */
  moveTo(x: number, y: number): this {
    this.currentPath = new Path()
    this.subPaths.push(this.currentPath)
    this.currentPath.moveTo(x, y)
    return this
  }

  /** Draws a straight line from the current point. */
  lineTo(x: number, y: number): this {
    this.currentPath?.lineTo(x, y)
    return this
  }

  /** Draws a quadratic curve from the current point. */
  quadraticCurveTo(controlPointX: number, controlPointY: number, x: number, y: number): this {
    this.currentPath?.quadraticCurveTo(controlPointX, controlPointY, x, y)
    return this
  }

  /** Draws a cubic bezier curve from the current point. */
  // eslint-disable-next-line max-params
  bezierCurveTo(
    controlPoint1X: number,
    controlPoint1Y: number,
    controlPoint2X: number,
    controlPoint2Y: number,
    x: number,
    y: number
  ): this {
    this.currentPath?.bezierCurveTo(controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, x, y)
    return this
  }

  /** Draws a spline passing through the provided points. */
  splineThru(points: Vector2[]): this {
    this.currentPath?.splineThru(points)
    return this
  }

  /** Converts the set of sub-paths into closed shapes and holes. */
  toShapes(isCounterClockWise?: boolean): Shape[] {
    const subPaths = this.subPaths
    if (subPaths.length === 0) {
      return []
    }

    if (subPaths.length === 1) {
      const shape = new Shape()
      shape.curves = subPaths[0].curves
      return [shape]
    }

    const outerIsClockWise = !(isCounterClockWise ?? false)

    const rings = subPaths
      .map((path) => {
        const points = closePath(path.getPoints())
        return {path, points, area: Math.abs(ShapeUtils.area(points))}
      })
      .sort((firstRing, secondRing) => secondRing.area - firstRing.area)

    const shapes: Shape[] = []
    const boundaries: Vector2[][] = []

    for (const ring of rings) {
      if (ring.points.length > 0) {
        const containerIndex = boundaries.findIndex((boundary) => isPointInsidePolygon(ring.points[0], boundary))
        if (containerIndex >= 0) {
          const containerShape = shapes[containerIndex]
          containerShape.holes.push(ring.path)
        } else {
          const shape = new Shape()
          shape.curves = ring.path.curves
          shapes.push(shape)
          const orientedBoundary =
            ShapeUtils.isClockWise(ring.points) === outerIsClockWise
              ? ring.points
              : ring.points.slice().reverse()
          boundaries.push(orientedBoundary)
        }
      }
    }

    return shapes
  }
}

/** Returns a closed copy of the provided polygon point list. */
function closePath(points: Vector2[]): Vector2[] {
  if (points.length === 0) {
    return points
  }

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  if (firstPoint.equals(lastPoint)) {
    return points
  }

  return [...points, firstPoint.clone()]
}

/** Determines whether a point lies inside a polygon. */
function isPointInsidePolygon(point: Vector2, polygon: Vector2[]): boolean {
  const polygonLength = polygon.length
  let isInside = false

  for (let current = 0, previous = polygonLength - 1; current < polygonLength; previous = current++) {
    const lowerPoint = polygon[previous]
    const higherPoint = polygon[current]
    const edgeDeltaX = higherPoint.x - lowerPoint.x
    const edgeDeltaY = higherPoint.y - lowerPoint.y

    if (Math.abs(edgeDeltaY) <= Number.EPSILON) {
      if (point.y === lowerPoint.y) {
        const withinXBand =
          (higherPoint.x <= point.x && point.x <= lowerPoint.x) ||
          (lowerPoint.x <= point.x && point.x <= higherPoint.x)
        if (withinXBand) {
          return true
        }
      }
    } else {
      const adjustedLower = edgeDeltaY < 0 ? higherPoint : lowerPoint
      const adjustedHigher = edgeDeltaY < 0 ? lowerPoint : higherPoint
      const adjustedDeltaX = edgeDeltaY < 0 ? -edgeDeltaX : edgeDeltaX
      const adjustedDeltaY = edgeDeltaY < 0 ? -edgeDeltaY : edgeDeltaY

      const withinBand = point.y >= adjustedLower.y && point.y <= adjustedHigher.y
      const alignedWithLower = point.y === adjustedLower.y
      if (withinBand && alignedWithLower && point.x === adjustedLower.x) {
        return true
      }
      if (withinBand && !alignedWithLower) {
        const perpendicularEdge =
          adjustedDeltaY * (point.x - adjustedLower.x) - adjustedDeltaX * (point.y - adjustedLower.y)
        if (perpendicularEdge === 0) {
          return true
        }
        if (perpendicularEdge > 0) {
          isInside = !isInside
        }
      }
    }
  }

  return isInside
}
