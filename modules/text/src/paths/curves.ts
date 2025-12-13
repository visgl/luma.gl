// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js curve utilities (https://github.com/mrdoob/three.js/) under the MIT License.

import {Vector2} from '@math.gl/core'

/** Factory for creating new point instances when sampling curves. */
type PointFactory<T> = () => T

/** Base class for 2D and 3D parameterized curves. */
export class Curve<TPoint> {
  /** Returns a point on the curve at the provided t value. */
  getPoint(_t: number, _target?: TPoint): TPoint {
    throw new Error('Curve.getPoint() must be implemented by subclasses')
  }

  /** Samples the curve at evenly spaced intervals. */
  getPoints(divisions = 5, create?: PointFactory<TPoint>): TPoint[] {
    const points: TPoint[] = []
    for (let i = 0; i <= divisions; i++) {
      const point = this.getPoint(i / divisions, create?.())
      points.push(point)
    }
    return points
  }
}

/** Represents a straight line between two points. */
export class LineCurve extends Curve<Vector2> {
  /** Starting point of the line segment. */
  readonly v1: Vector2
  /** Ending point of the line segment. */
  readonly v2: Vector2

  /** Creates a line curve between the provided endpoints. */
  constructor(v1: Vector2, v2: Vector2) {
    super()
    this.v1 = v1
    this.v2 = v2
  }

  /** Returns a point on the line for the given t. */
  override getPoint(t: number, target = new Vector2()): Vector2 {
    return target.copy(this.v2).sub(this.v1).multiplyScalar(t).add(this.v1)
  }
}

/** Represents a quadratic bezier curve defined by three control points. */
export class QuadraticBezierCurve extends Curve<Vector2> {
  /** Starting control point for the curve. */
  readonly v0: Vector2
  /** Midpoint control defining curvature. */
  readonly v1: Vector2
  /** Endpoint control for the curve. */
  readonly v2: Vector2

  /** Creates a quadratic bezier with the provided controls. */
  constructor(v0: Vector2, v1: Vector2, v2: Vector2) {
    super()
    this.v0 = v0
    this.v1 = v1
    this.v2 = v2
  }

  /** Returns a point along the quadratic curve for the given t. */
  override getPoint(t: number, target = new Vector2()): Vector2 {
    const oneMinusT = 1 - t
    target.set(0, 0)
    target.addScaledVector(this.v0, oneMinusT * oneMinusT)
    target.addScaledVector(this.v1, 2 * oneMinusT * t)
    target.addScaledVector(this.v2, t * t)
    return target
  }
}

/** Represents a cubic bezier curve defined by four control points. */
export class CubicBezierCurve extends Curve<Vector2> {
  /** First control point defining the curve origin. */
  readonly v0: Vector2
  /** Second control point shaping the curve start. */
  readonly v1: Vector2
  /** Third control point shaping the curve end. */
  readonly v2: Vector2
  /** Fourth control point at the curve terminus. */
  readonly v3: Vector2

  /** Creates a cubic bezier with the provided controls. */
  constructor(v0: Vector2, v1: Vector2, v2: Vector2, v3: Vector2) {
    super()
    this.v0 = v0
    this.v1 = v1
    this.v2 = v2
    this.v3 = v3
  }

  /** Returns a point along the cubic curve for the given t. */
  override getPoint(t: number, target = new Vector2()): Vector2 {
    const oneMinusT = 1 - t
    const oneMinusTSquared = oneMinusT * oneMinusT
    const tSquared = t * t

    target.set(0, 0)
    target.addScaledVector(this.v0, oneMinusTSquared * oneMinusT)
    target.addScaledVector(this.v1, 3 * oneMinusTSquared * t)
    target.addScaledVector(this.v2, 3 * oneMinusT * tSquared)
    target.addScaledVector(this.v3, tSquared * t)
    return target
  }
}

/** Represents a Catmull-Rom spline through a list of points. */
export class SplineCurve extends Curve<Vector2> {
  /** Ordered list of points the spline passes through. */
  readonly points: Vector2[]

  /** Creates a spline passing through the provided points. */
  constructor(points: Vector2[]) {
    super()
    this.points = points
  }

  /** Returns a point interpolated along the spline for the given t. */
  override getPoint(t: number, target = new Vector2()): Vector2 {
    const lastPointIndex = this.points.length - 1
    const scaledT = lastPointIndex * t
    const baseIndex = Math.floor(scaledT)
    const weight = scaledT - baseIndex

    const point0 = this.points[baseIndex === 0 ? baseIndex : baseIndex - 1]
    const point1 = this.points[baseIndex]
    const point2 = this.points[Math.min(baseIndex + 1, lastPointIndex)]
    const point3 = this.points[Math.min(baseIndex + 2, lastPointIndex)]

    const atInteriorKnot = weight === 0 && baseIndex > 0 && baseIndex < lastPointIndex
    const sampleWeight = atInteriorKnot ? 0.5 : weight

    target.set(
      atInteriorKnot ? point1.x : catmullRom(point0.x, point1.x, point2.x, point3.x, sampleWeight),
      catmullRom(point0.y, point1.y, point2.y, point3.y, sampleWeight)
    )

    return target
  }
}

/** Performs Catmull-Rom interpolation for a weight. */
function catmullRom(point0: number, point1: number, point2: number, point3: number, t: number): number {
  const velocity0 = (point2 - point0) * 0.5
  const velocity1 = (point3 - point1) * 0.5
  const tSquared = t * t
  const tCubed = tSquared * t

  return (
    (2 * (point1 - point2) + velocity0 + velocity1) * tCubed +
    (-3 * (point1 - point2) - 2 * velocity0 - velocity1) * tSquared +
    velocity0 * t +
    point1
  )
}
