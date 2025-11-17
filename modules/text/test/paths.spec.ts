// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape.js'
import {Vector2} from '@math.gl/core'
import {CurvePath} from '../src/paths/curve-path'
import {CubicBezierCurve, LineCurve, QuadraticBezierCurve, SplineCurve} from '../src/paths/curves'
import {Path} from '../src/paths/path'
import {ShapePath} from '../src/paths/shape-path'
import {ShapeUtils} from '../src/paths/shape-utils'

const unitSquare = [
  new Vector2(0, 0),
  new Vector2(1, 0),
  new Vector2(1, 1),
  new Vector2(0, 1),
  new Vector2(0, 0)
]

const clockwiseSquare = [
  new Vector2(0, 0),
  new Vector2(0, 1),
  new Vector2(1, 1),
  new Vector2(1, 0),
  new Vector2(0, 0)
]

test('Curve subclasses interpolate expected points', t => {
  const line = new LineCurve(new Vector2(0, 0), new Vector2(2, 0))
  t.deepEqual(line.getPoint(0).toArray(), [0, 0], 'line starts at origin')
  t.deepEqual(line.getPoint(1).toArray(), [2, 0], 'line ends at destination')

  const quadratic = new QuadraticBezierCurve(new Vector2(0, 0), new Vector2(2, 2), new Vector2(4, 0))
  const midpoint = quadratic.getPoint(0.5)
  t.deepEqual(midpoint.toArray(), [2, 1], 'quadratic midpoint matches control blend')

  const cubic = new CubicBezierCurve(new Vector2(0, 0), new Vector2(0, 3), new Vector2(3, 3), new Vector2(3, 0))
  const cubicMidpoint = cubic.getPoint(0.5)
  t.deepEqual(cubicMidpoint.toArray(), [1.5, 2.25], 'cubic midpoint matches bezier evaluation')

  const spline = new SplineCurve([new Vector2(0, 0), new Vector2(1, 1), new Vector2(2, 0)])
  const splinePoint = spline.getPoint(0.5)
  t.ok(splinePoint.x > 0.9 && splinePoint.x < 1.1, 'spline x is near middle')
  t.ok(splinePoint.y > 0.4 && splinePoint.y < 0.8, 'spline y reflects curvature')

  t.end()
})

test('CurvePath merges child curve samples without duplicates', t => {
  const path = new CurvePath<Vector2>()
  path.add(new LineCurve(new Vector2(0, 0), new Vector2(1, 0)))
  path.add(new LineCurve(new Vector2(1, 0), new Vector2(1, 1)))

  const points = path.getPoints(2)
  t.equal(points.length, 5, 'points include shared vertex once')
  t.deepEqual(points[0].toArray(), [0, 0], 'first point starts at origin')
  t.deepEqual(points[points.length - 1].toArray(), [1, 1], 'last point ends at path terminus')
  t.end()
})

test('Path updates pen position when adding segments', t => {
  const path = new Path()
  path.moveTo(0, 0)
  path.lineTo(1, 0)
  path.quadraticCurveTo(1, 1, 0, 1)
  path.bezierCurveTo(0, 2, 1, 2, 1, 1)
  t.deepEqual(path.currentPoint.toArray(), [1, 1], 'current point tracks last command')
  t.equal(path.curves.length, 3, 'all curve commands recorded')
  t.end()
})

test('ShapeUtils area and orientation helpers', t => {
  t.equal(ShapeUtils.area(unitSquare), 1, 'counter-clockwise square has positive area')
  t.equal(ShapeUtils.area(clockwiseSquare), -1, 'clockwise square area is negative')
  t.equal(ShapeUtils.isClockWise(unitSquare), false, 'counter-clockwise square is not clockwise')
  t.equal(ShapeUtils.isClockWise(clockwiseSquare), true, 'clockwise square reports clockwise')
  t.end()
})

test('ShapeUtils triangulateShape handles holes', t => {
  const contour = [
    new Vector2(-1, -1),
    new Vector2(1, -1),
    new Vector2(1, 1),
    new Vector2(-1, 1),
    new Vector2(-1, -1)
  ]
  const hole = [
    new Vector2(-0.5, -0.5),
    new Vector2(-0.5, 0.5),
    new Vector2(0.5, 0.5),
    new Vector2(0.5, -0.5),
    new Vector2(-0.5, -0.5)
  ]
  const faces = ShapeUtils.triangulateShape(contour, [hole])
  t.ok(faces.length > 4, 'triangulation produces multiple faces')
  const maxIndex = Math.max(...faces.flat())
  t.ok(maxIndex < contour.length + hole.length - 2, 'triangle indices stay within vertex count')
  t.end()
})

test('ShapePath groups holes with their parent shape', t => {
  const shapePath = new ShapePath()
  shapePath.moveTo(0, 0).lineTo(2, 0).lineTo(2, 2).lineTo(0, 2).lineTo(0, 0)
  shapePath.moveTo(0.5, 0.5).lineTo(0.5, 1.5).lineTo(1.5, 1.5).lineTo(1.5, 0.5).lineTo(0.5, 0.5)

  const shapes = shapePath.toShapes()
  t.equal(shapes.length, 1, 'outer contour collapses to a single shape')
  t.equal(shapes[0].holes.length, 1, 'inner contour is attached as a hole')
  const extracted = shapes[0].extractPoints()
  t.equal(extracted.shape.length > 0, true, 'outer shape points are present')
  t.equal(extracted.holes.length, 1, 'hole points extracted')
  t.end()
})
