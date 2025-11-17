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

    let holesFirst = !ShapeUtils.isClockWise(subPaths[0].getPoints())
    holesFirst = isCounterClockWise ? !holesFirst : holesFirst

    const betterShapeHoles: {h: Path; p: Vector2}[] = []
    const newShapes: ({s: Shape; p: Vector2[] | undefined} | undefined)[] = []
    const newShapeHoles: {h: Path; p: Vector2}[][] = []
    let mainIndex = 0

    newShapes[mainIndex] = undefined
    newShapeHoles[mainIndex] = []

    for (let i = 0, l = subPaths.length; i < l; i++) {
      const tmpPath = subPaths[i]
      const tmpPoints = closePath(tmpPath.getPoints())
      let solid = ShapeUtils.isClockWise(tmpPoints)
      solid = isCounterClockWise ? !solid : solid

      if (solid) {
        if (!holesFirst && newShapes[mainIndex]) {
          mainIndex++
        }
        newShapes[mainIndex] = {s: new Shape(), p: tmpPoints}
        newShapes[mainIndex]!.s.curves = tmpPath.curves

        if (holesFirst) {
          mainIndex++
        }
        newShapeHoles[mainIndex] = []
      } else {
        newShapeHoles[mainIndex].push({h: tmpPath, p: tmpPoints[0]})
      }
    }

    if (!newShapes[mainIndex]) {
      newShapes.splice(mainIndex, 1)
    }
    if (newShapeHoles[mainIndex].length === 0) {
      newShapeHoles.splice(mainIndex, 1)
    }

    for (let i = 0, l = newShapes.length; i < l; i++) {
      const baseShape = newShapes[i]!
      const holes = newShapeHoles[i] ?? []
      const holesForShape: Path[] = []
      betterShapeHoles.push(...holes)

      for (let j = 0, jl = holes.length; j < jl; j++) {
        const hole = holes[j]
        const cavity = hole.h
        holesForShape.push(cavity)
      }
      baseShape.s.holes = holesForShape
    }

    if (holesFirst) {
      return newShapes.map((entry) => entry!.s)
    }

    // Rearrange holes when they are not ordered first
    for (const hole of betterShapeHoles) {
      const placement = findShapePlacement(hole, newShapes)
      if (placement >= 0) {
        newShapes[placement]!.s.holes.push(hole.h)
      }
    }

    return newShapes.map((entry) => entry!.s)
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

/** Finds the shape index that should contain the provided hole. */
function findShapePlacement(hole: {h: Path; p: Vector2}, shapes: ({s: Shape; p: Vector2[] | undefined} | undefined)[]): number {
  for (let i = 0; i < shapes.length; i++) {
    const shapePoints = shapes[i]?.p
    if (shapePoints && isPointInsidePolygon(hole.p, shapePoints)) {
      return i
    }
  }
  return -1
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
