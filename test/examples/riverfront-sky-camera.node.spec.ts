// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {WebMercatorViewport} from '@deck.gl/core';
import {expect, test} from 'vitest';
import {getSkyCameraState, SKY_FIELD_OF_VIEW} from '../../examples/deck/soft-shadows/sky-camera';

for (const [width, height, zoom] of [
  [1000, 800, 15],
  [600, 1200, 18],
  [1200, 600, 12]
]) {
  test(`sky camera stays above ground across the horizon at ${width}x${height}, zoom ${zoom}`, () => {
    for (const pitch of [80, 89.99, 90, 90.01, 110, 165]) {
      const state = getSkyCameraState(
        {longitude: -74, latitude: 40.7, zoom, pitch, bearing: 45},
        width,
        height
      );
      const viewport = new WebMercatorViewport({...state, width, height, fovy: SKY_FIELD_OF_VIEW});
      const cameraHeight =
        viewport.cameraPosition[2] / viewport.getDistanceScales().unitsPerMeter[2];
      expect(state.pitch).toBe(pitch);
      expect(cameraHeight).toBeGreaterThanOrEqual(19.999);
      if (pitch >= 90) expect(cameraHeight).toBeCloseTo(20, 3);
      expect(viewport.projectionMatrix.every(Number.isFinite)).toBe(true);
      expect(viewport.viewMatrix.every(Number.isFinite)).toBe(true);
      expect(state.nearZ).toBeLessThan(state.farZ!);
    }
  });
}

test('sky camera returns to normal map orbit and recomputes lift after resize and zoom', () => {
  const upward = getSkyCameraState(
    {longitude: -74, latitude: 40.7, zoom: 15, pitch: 120},
    800,
    600
  );
  const resized = getSkyCameraState(upward, 800, 1000);
  expect(resized.position![2]).toBeGreaterThan(upward.position![2]);
  const downward = getSkyCameraState({...resized, pitch: 45}, 800, 1000);
  expect(downward.position).toEqual([0, 0, 0]);
  expect(downward.longitude).toBe(-74);
  expect(downward.zoom).toBe(15);
  expect(getSkyCameraState({...upward, pitch: 180}, 800, 600).pitch).toBe(165);
});
