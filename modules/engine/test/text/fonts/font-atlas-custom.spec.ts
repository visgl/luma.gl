// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {isBrowser} from 'probe.gl/env';
import {
  buildBitmapFontAtlas,
  buildBrowserFontAtlas,
  resolveBrowserFontAtlasSettings,
  setFontAtlasCacheLimit
} from '../../../src/text/fonts';

it('custom atlases without a cache key keep renderer-specific glyph metrics', () => {
  if (!isBrowser()) {
    return;
  }
  const settings = resolveBrowserFontAtlasSettings({characterSet: 'A'});
  const buildCustomAtlas = (advance: number) =>
    buildBrowserFontAtlas({
      settings,
      renderSettings: {mode: 'bitmap', threshold: 0, smoothing: 0},
      createRenderer: () => ({
        measure: () => ({advance, width: 10, ascent: 8, descent: 2}),
        draw: () => ({data: new ImageData(10, 10)})
      })
    });
  const first = buildCustomAtlas(12);
  const second = buildCustomAtlas(20);
  expect(second.pages[0]).not.toBe(first.pages[0]);
  expect(first.mapping.A.advance).toBe(12);
  expect(second.mapping.A.advance).toBe(20);
  expect(second.baselineOffset).toBe(3);
});

it('public cache limit validates capacity and resets generated browser atlases', () => {
  expect(() => setFontAtlasCacheLimit(2)).toThrow();
  expect(() => setFontAtlasCacheLimit(Number.NaN)).toThrow();
  if (!isBrowser()) {
    return;
  }
  const settings = {fontFamily: 'cache-limit-test', characterSet: 'A'};
  const first = buildBitmapFontAtlas(settings);
  setFontAtlasCacheLimit(4);
  const second = buildBitmapFontAtlas(settings);
  expect(second.pages[0]).not.toBe(first.pages[0]);
  expect(buildBitmapFontAtlas(settings).pages[0]).toBe(second.pages[0]);
  setFontAtlasCacheLimit(3);
});
