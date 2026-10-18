// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {isBrowser} from '@probe.gl/env';
import {
  GlyphRangeLoader,
  buildGlyphFontAtlas,
  createGlyphFontRenderer,
  parseGlyphRange,
  measureFontAtlasText
} from '../../src/fonts';
import {makeGlyphRange, makeGlyphResponse} from './glyph-range-fixture';

test('packs server glyph pixels and metrics into independent atlas pages', async () => {
  if (!isBrowser()) return;
  const fetch = vi.fn(async () => makeGlyphResponse([65]));
  const loader = new GlyphRangeLoader({url: 'https://example.com/{fontstack}/{range}', fetch});
  const [first, second] = await Promise.all([
    buildGlyphFontAtlas(loader, 'Regular', 'A'),
    buildGlyphFontAtlas(loader, 'Regular', ['A'])
  ]);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(first.pages[0]).not.toBe(second.pages[0]);
  expect(first.mapping.A.advance).toBe(5);
  expect(first.mapping.A.width).toBe(7);
  expect(first.baselineOffset).toBe(-17);
  expect(first.lineHeight).toBe(24);
  expect(first.renderSettings).toEqual({mode: 'sdf', threshold: 0.75, smoothing: 0.1});
  expect(measureFontAtlasText('A', first).advance).toBe(5);
  const canvas = first.pages[0] as HTMLCanvasElement;
  const mapping = first.mapping.A;
  const pixels = canvas.getContext('2d')!.getImageData(mapping.x, mapping.y, 7, 7).data;
  expect([...pixels].filter((_, index) => index % 4 === 3)).toEqual(Array(49).fill(255));
  const renderer = createGlyphFontRenderer(
    new Map(parseGlyphRange(makeGlyphRange([65])).map(glyph => [glyph.id, glyph]))
  );
  expect(renderer.draw('A').left).toBe(5);
  expect(renderer.draw('B').data.width).toBe(1);
});
