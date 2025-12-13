// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js CurvePath (https://github.com/mrdoob/three.js/) under the MIT License.

import {Curve} from './curves'

/** Container for a sequence of curves that form a continuous path. */
export class CurvePath<TPoint> extends Curve<TPoint> {
  /** Ordered list of curves composing the path. */
  curves: Curve<TPoint>[] = []

  /** Appends a curve to the path. */
  add(curve: Curve<TPoint>): this {
    this.curves.push(curve)
    return this
  }

  /** Returns interpolated points across all child curves. */
  override getPoints(divisions = 12): TPoint[] {
    const points: TPoint[] = []
    for (let i = 0; i < this.curves.length; i++) {
      const curve = this.curves[i]
      const resolution = divisions
      const curvePoints = curve.getPoints(resolution)
      if (i > 0) {
        curvePoints.shift()
      }
      points.push(...curvePoints)
    }
    return points
  }
}
