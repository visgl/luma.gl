// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Vector2} from '@math.gl/core';
import {CurvePath} from '../../src/text-3d/paths/curve-path';
import {
  CubicBezierCurve,
  LineCurve,
  QuadraticBezierCurve,
  SplineCurve
} from '../../src/text-3d/paths/curves';
import {Path} from '../../src/text-3d/paths/path';
import {ShapePath} from '../../src/text-3d/paths/shape-path';
import {ShapeUtils} from '../../src/text-3d/paths/shape-utils';

const unitSquare = [
  new Vector2(0, 0),
  new Vector2(1, 0),
  new Vector2(1, 1),
  new Vector2(0, 1),
  new Vector2(0, 0)
];

const clockwiseSquare = [
  new Vector2(0, 0),
  new Vector2(0, 1),
  new Vector2(1, 1),
  new Vector2(1, 0),
  new Vector2(0, 0)
];

it('Curve subclasses interpolate expected points', () => {
  const line = new LineCurve(new Vector2(0, 0), new Vector2(2, 0));
  expect(line.getPoint(0).toArray(), 'line starts at origin').toEqual([0, 0]);
  expect(line.getPoint(1).toArray(), 'line ends at destination').toEqual([2, 0]);

  const quadratic = new QuadraticBezierCurve(
    new Vector2(0, 0),
    new Vector2(2, 2),
    new Vector2(4, 0)
  );
  const midpoint = quadratic.getPoint(0.5);
  expect(midpoint.toArray(), 'quadratic midpoint matches control blend').toEqual([2, 1]);

  const cubic = new CubicBezierCurve(
    new Vector2(0, 0),
    new Vector2(0, 3),
    new Vector2(3, 3),
    new Vector2(3, 0)
  );
  const cubicMidpoint = cubic.getPoint(0.5);
  expect(cubicMidpoint.toArray(), 'cubic midpoint matches bezier evaluation').toEqual([1.5, 2.25]);

  const spline = new SplineCurve([new Vector2(0, 0), new Vector2(1, 1), new Vector2(2, 0)]);
  const splinePoint = spline.getPoint(0.5);
  expect(Boolean(splinePoint.x > 0.9 && splinePoint.x < 1.1), 'spline x is near middle').toBe(true);
  expect(Boolean(splinePoint.y > 0.4 && splinePoint.y < 0.8), 'spline y reflects curvature').toBe(
    true
  );

  void 0;
});

it('CurvePath merges child curve samples without duplicates', () => {
  const path = new CurvePath<Vector2>();
  path.add(new LineCurve(new Vector2(0, 0), new Vector2(1, 0)));
  path.add(new LineCurve(new Vector2(1, 0), new Vector2(1, 1)));

  const points = path.getPoints(2);
  expect(points.length, 'points include shared vertex once').toBe(5);
  expect(points[0].toArray(), 'first point starts at origin').toEqual([0, 0]);
  expect(points[points.length - 1].toArray(), 'last point ends at path terminus').toEqual([1, 1]);
  void 0;
});

it('Path updates pen position when adding segments', () => {
  const path = new Path();
  path.moveTo(0, 0);
  path.lineTo(1, 0);
  path.quadraticCurveTo(1, 1, 0, 1);
  path.bezierCurveTo(0, 2, 1, 2, 1, 1);
  expect(path.currentPoint.toArray(), 'current point tracks last command').toEqual([1, 1]);
  expect(path.curves.length, 'all curve commands recorded').toBe(3);
  void 0;
});

it('ShapeUtils area and orientation helpers', () => {
  expect(ShapeUtils.area(unitSquare), 'counter-clockwise square has positive area').toBe(1);
  expect(ShapeUtils.area(clockwiseSquare), 'clockwise square area is negative').toBe(-1);
  expect(ShapeUtils.isClockWise(unitSquare), 'counter-clockwise square is not clockwise').toBe(
    false
  );
  expect(ShapeUtils.isClockWise(clockwiseSquare), 'clockwise square reports clockwise').toBe(true);
  void 0;
});

it('ShapeUtils triangulateShape handles holes', () => {
  const contour = [
    new Vector2(-1, -1),
    new Vector2(1, -1),
    new Vector2(1, 1),
    new Vector2(-1, 1),
    new Vector2(-1, -1)
  ];
  const hole = [
    new Vector2(-0.5, -0.5),
    new Vector2(-0.5, 0.5),
    new Vector2(0.5, 0.5),
    new Vector2(0.5, -0.5),
    new Vector2(-0.5, -0.5)
  ];
  const faces = ShapeUtils.triangulateShape(contour, [hole]);
  expect(Boolean(faces.length > 4), 'triangulation produces multiple faces').toBe(true);
  const maxIndex = Math.max(...faces.flat());
  expect(
    Boolean(maxIndex < contour.length + hole.length - 2),
    'triangle indices stay within vertex count'
  ).toBe(true);
  void 0;
});

it('ShapeUtils triangulateShape drops duplicate vertices before earcut', () => {
  const contour = [
    new Vector2(-1, -1),
    new Vector2(-1, -1),
    new Vector2(1, -1),
    new Vector2(1, 1),
    new Vector2(-1, 1),
    new Vector2(-1, 1),
    new Vector2(-1, -1)
  ];
  const hole = [
    new Vector2(-0.5, -0.5),
    new Vector2(0.5, -0.5),
    new Vector2(0.5, 0.5),
    new Vector2(-0.5, 0.5),
    new Vector2(-0.5, -0.5)
  ];

  const faces = ShapeUtils.triangulateShape(contour, [hole]);
  const cleanedContour = contour.filter(
    (point, index, points) => index === 0 || !point.equals(points[index - 1])
  );
  if (
    cleanedContour.length > 2 &&
    cleanedContour[0].equals(cleanedContour[cleanedContour.length - 1])
  ) {
    cleanedContour.pop();
  }
  const cleanedHole = hole.filter(
    (point, index, points) => index === 0 || !point.equals(points[index - 1])
  );
  if (cleanedHole.length > 2 && cleanedHole[0].equals(cleanedHole[cleanedHole.length - 1])) {
    cleanedHole.pop();
  }
  const vertexList = [...cleanedContour, ...cleanedHole];
  const expectedArea =
    Math.abs(ShapeUtils.area(cleanedContour)) - Math.abs(ShapeUtils.area(cleanedHole));

  const totalArea = faces.reduce((sum, face) => sum + faceArea(face, vertexList), 0);
  expect(Boolean(totalArea > 0), 'triangulation produced measurable area').toBe(true);
  expect(
    Boolean(Math.abs(totalArea - expectedArea) < expectedArea * 0.02),
    'triangulation respects hole after deduplication'
  ).toBe(true);
  void 0;
});

/** Computes the area of a single triangle from indexed vertices. */
function faceArea(face: number[], vertices: Vector2[]): number {
  const pointA = vertices[face[0]];
  const pointB = vertices[face[1]];
  const pointC = vertices[face[2]];
  const area =
    pointA.x * (pointB.y - pointC.y) +
    pointB.x * (pointC.y - pointA.y) +
    pointC.x * (pointA.y - pointB.y);
  return Math.abs(area) * 0.5;
}

it('ShapePath groups holes with their parent shape', () => {
  const shapePath = new ShapePath();
  shapePath.moveTo(0, 0).lineTo(2, 0).lineTo(2, 2).lineTo(0, 2).lineTo(0, 0);
  shapePath.moveTo(0.5, 0.5).lineTo(0.5, 1.5).lineTo(1.5, 1.5).lineTo(1.5, 0.5).lineTo(0.5, 0.5);

  const shapes = shapePath.toShapes();
  expect(shapes.length, 'outer contour collapses to a single shape').toBe(1);
  expect(shapes[0].holes.length, 'inner contour is attached as a hole').toBe(1);
  const extracted = shapes[0].extractPoints();
  expect(extracted.shape.length > 0, 'outer shape points are present').toBe(true);
  expect(extracted.holes.length, 'hole points extracted').toBe(1);
  void 0;
});
