// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';

it('constructs deck viewports with public math.gl 5 imports', async () => {
  const {FirstPersonViewport, OrbitViewport, OrthographicViewport, WebMercatorViewport} =
    await vi.importActual<typeof import('@deck.gl/core')>('@deck.gl/core');

  const viewports = [
    new FirstPersonViewport({width: 800, height: 600, longitude: -122, latitude: 38, pitch: 15}),
    new OrbitViewport({width: 800, height: 600, target: [0, 0, 0], zoom: 1}),
    new OrthographicViewport({width: 800, height: 600, target: [0, 0, 0], zoom: 1}),
    new WebMercatorViewport({width: 800, height: 600, longitude: -122, latitude: 38, zoom: 10})
  ];

  for (const viewport of viewports) {
    expect(viewport.viewProjectionMatrix.every(Number.isFinite)).toBe(true);
    expect(viewport.pixelUnprojectionMatrix.every(Number.isFinite)).toBe(true);
  }
});
