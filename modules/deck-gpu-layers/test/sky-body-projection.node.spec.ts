// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {OrthographicViewport, WebMercatorViewport} from '@deck.gl/core';
import {expect, test} from 'vitest';
import {getSkyBodyClipPosition} from '../src/layers/sky-body-layer';

const DIRECTION = [0, Math.cos(Math.PI / 18), Math.sin(Math.PI / 18)] as const;
const ORIGIN = [-74, 40.7, 0] as const;
function getViewport(longitude = -74, latitude = 40.7, zoom = 15, bearing = 0) {
  return new WebMercatorViewport({
    width: 800,
    height: 600,
    longitude,
    latitude,
    zoom,
    pitch: 80,
    bearing,
    fovy: 50
  });
}

test('sky directions ignore map translation and zoom but follow camera rotation', () => {
  const original = getSkyBodyClipPosition(getViewport(), DIRECTION, ORIGIN)!;
  for (const viewport of [getViewport(-73, 41), getViewport(-74, 40.7, 10)]) {
    const moved = getSkyBodyClipPosition(viewport, DIRECTION, ORIGIN)!;
    expect(moved[0]).toBeCloseTo(original[0], 6);
    expect(moved[1]).toBeCloseTo(original[1], 6);
    expect(moved[2]).toBe(1);
  }
  expect(
    getSkyBodyClipPosition(getViewport(-74, 40.7, 15, 20), DIRECTION, ORIGIN)![0]
  ).not.toBeCloseTo(original[0], 3);
});

test('sky bodies do not render below the horizon, behind the eye, or on orthographic maps', () => {
  expect(getSkyBodyClipPosition(getViewport(), [0, 1, -0.1], ORIGIN)).toBeNull();
  expect(getSkyBodyClipPosition(getViewport(), [0, -1, 0.1], ORIGIN)).toBeNull();
  expect(
    getSkyBodyClipPosition(new OrthographicViewport({width: 800, height: 600}), DIRECTION, ORIGIN)
  ).toBeNull();
});
