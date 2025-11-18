// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js Path and Shape (https://github.com/mrdoob/three.js/) under the MIT License.

import {Vector2} from '@math.gl/core'
import {CurvePath} from './curve-path'
import {CubicBezierCurve, LineCurve, QuadraticBezierCurve, SplineCurve} from './curves'

/** Represents an ordered set of connected curve segments. */
export class Path extends CurvePath<Vector2> {
  /** Tracks the current pen position while constructing the path. */
  currentPoint = new Vector2()

  /** Creates a path initialized from an optional set of points. */
  constructor(points?: Vector2[]) {
    super()
    if (points?.length) {
      this.setFromPoints(points)
    }
  }

  /** Replaces the path contents with straight segments through points. */
  setFromPoints(points: Vector2[]): this {
    this.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      this.lineTo(points[i].x, points[i].y)
    }
    return this
  }

  /** Moves the cursor to the provided coordinates. */
  moveTo(x: number, y: number): this {
    this.currentPoint.set(x, y)
    return this
  }

  /** Adds a straight line segment to the path. */
  lineTo(x: number, y: number): this {
    const curve = new LineCurve(this.currentPoint.clone(), new Vector2(x, y))
    this.curves.push(curve)
    this.currentPoint.set(x, y)
    return this
  }

  /** Adds a quadratic bezier segment to the path. */
  quadraticCurveTo(controlPointX: number, controlPointY: number, x: number, y: number): this {
    const curve = new QuadraticBezierCurve(
      this.currentPoint.clone(),
      new Vector2(controlPointX, controlPointY),
      new Vector2(x, y)
    )
    this.curves.push(curve)
    this.currentPoint.set(x, y)
    return this
  }

  /** Adds a cubic bezier segment to the path. */
  // eslint-disable-next-line max-params
  bezierCurveTo(
    controlPoint1X: number,
    controlPoint1Y: number,
    controlPoint2X: number,
    controlPoint2Y: number,
    x: number,
    y: number
  ): this {
    const curve = new CubicBezierCurve(
      this.currentPoint.clone(),
      new Vector2(controlPoint1X, controlPoint1Y),
      new Vector2(controlPoint2X, controlPoint2Y),
      new Vector2(x, y)
    )
    this.curves.push(curve)
    this.currentPoint.set(x, y)
    return this
  }

  /** Adds a Catmull-Rom spline segment passing through points. */
  splineThru(points: Vector2[]): this {
    const controlPoints = [this.currentPoint.clone(), ...points]
    const curve = new SplineCurve(controlPoints)
    this.curves.push(curve)
    if (points.length > 0) {
      this.currentPoint.copy(points[points.length - 1])
    }
    return this
  }
}

/** Represents a closed path with optional holes. */
export class Shape extends Path {
  /** Child paths that carve holes out of the shape. */
  holes: Path[] = []

  /** Creates a new shape initialized with optional points. */
  constructor(points?: Vector2[]) {
    super(points)
    this.holes = []
  }

  /** Returns sampled points along the shape perimeter. */
  override getPoints(divisions = 12): Vector2[] {
    return super.getPoints(divisions)
  }

  /** Extracts sampled points for the outer contour and holes. */
  extractPoints(divisions = 12): {shape: Vector2[]; holes: Vector2[][]} {
    const shape = this.getPoints(divisions)
    const holes = this.holes.map((holePath) => holePath.getPoints(divisions))
    return {shape, holes}
  }
}
