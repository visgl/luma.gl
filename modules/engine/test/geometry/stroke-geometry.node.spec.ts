// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Geometry, makeStrokeGeometry} from '@luma.gl/engine';

function measureGeometry(geometry: Geometry) {
  const positions = Array.from(geometry.attributes.POSITION!.value);
  const coordinates = Array.from(geometry.attributes.TEXCOORD_0!.value);
  let area = 0;
  for (let index = 0; index < positions.length; index += 9) {
    const twiceArea =
      (positions[index + 3] - positions[index]) * (positions[index + 7] - positions[index + 1]) -
      (positions[index + 4] - positions[index + 1]) * (positions[index + 6] - positions[index]);
    expect(twiceArea).toBeGreaterThan(0);
    area += twiceArea / 2;
  }
  expect(positions.every(Number.isFinite)).toBe(true);
  expect(coordinates.every(Number.isFinite)).toBe(true);
  return {area, positions, coordinates};
}

test('stroke caps have correct bounds and area without overlapping triangles', () => {
  for (const [cap, expectedArea, minimum, maximum] of [
    ['butt', 20, 0, 10],
    ['square', 24, -1, 11],
    ['round', 20 + Math.PI, -1, 11]
  ] as const) {
    const geometry = makeStrokeGeometry(
      [
        [0, 0, 3],
        [10, 0, 3]
      ],
      {width: 2, cap, roundSegments: 64}
    );
    const {area, positions} = measureGeometry(geometry);
    expect(area).toBeCloseTo(expectedArea, 2);
    const horizontal = positions.filter((_, index) => index % 3 === 0);
    expect(Math.min(...horizontal)).toBe(minimum);
    expect(Math.max(...horizontal)).toBe(maximum);
    expect(positions.filter((_, index) => index % 3 === 2).every(value => value === 3)).toBe(true);
    expect(Object.keys(geometry.attributes)).toEqual(['POSITION', 'TEXCOORD_0']);
  }
});

test('left and right corner joins fill their expected footprint once', () => {
  for (const sign of [-1, 1]) {
    for (const [join, expectedArea] of [
      ['miter', 40],
      ['bevel', 39.5],
      ['round', 39 + Math.PI / 4]
    ] as const) {
      const geometry = makeStrokeGeometry(
        [
          [0, 0],
          [10, 0],
          [10, 10 * sign]
        ],
        {width: 2, join, roundSegments: 64}
      );
      expect(measureGeometry(geometry).area).toBeCloseTo(expectedArea, 2);
    }
  }
});

test('distance coordinates are continuous through a multi-segment path', () => {
  const geometry = makeStrokeGeometry(
    [
      [0, 0],
      [3, 0],
      [3, 4]
    ],
    {width: 1, join: 'round'}
  );
  const {coordinates} = measureGeometry(geometry);
  const distances = coordinates.filter((_, index) => index % 2 === 0);
  expect(new Set(distances)).toEqual(new Set([0, 3, 7]));
});

test('closed strokes omit endpoint caps and retain total distance at the closing seam', () => {
  const path = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0]
  ] as const;
  const geometry = makeStrokeGeometry(path, {width: 2, closed: true, cap: 'round'});
  const {area, coordinates} = measureGeometry(geometry);
  expect(area).toBe(80);
  expect(Math.max(...coordinates.filter((_, index) => index % 2 === 0))).toBe(40);
  expect(geometry.attributes.POSITION!.value).toEqual(
    makeStrokeGeometry(path, {width: 2, closed: true, cap: 'butt'}).attributes.POSITION!.value
  );
});

test('zero width and collapsed paths are empty; duplicates and reversals stay finite', () => {
  for (const geometry of [
    makeStrokeGeometry([]),
    makeStrokeGeometry([
      [1, 1],
      [1, 1]
    ]),
    makeStrokeGeometry(
      [
        [0, 0],
        [1, 1]
      ],
      {width: 0}
    )
  ]) {
    expect(geometry.vertexCount).toBe(0);
  }
  const simple = makeStrokeGeometry([
    [0, 0],
    [10, 0]
  ]);
  const repeated = makeStrokeGeometry([
    [0, 0],
    [0, 0],
    [10, 0],
    [10, 0]
  ]);
  expect(simple.attributes.POSITION!.value).toEqual(repeated.attributes.POSITION!.value);
  measureGeometry(
    makeStrokeGeometry(
      [
        [0, 0],
        [10, 0],
        [0, 0]
      ],
      {join: 'round'}
    )
  );
});

test('miter limits bound acute corners and fall back to bevel geometry', () => {
  const path = [
    [0, 0],
    [10, 0],
    [0, 0.1]
  ] as const;
  const limited = makeStrokeGeometry(path, {width: 2, miterLimit: 2});
  const bevel = makeStrokeGeometry(path, {width: 2, join: 'bevel'});
  expect(limited.attributes.POSITION!.value).toEqual(bevel.attributes.POSITION!.value);
  const {positions} = measureGeometry(limited);
  expect(Math.max(...positions.map(Math.abs))).toBeLessThan(12);
});
