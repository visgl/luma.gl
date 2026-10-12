// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {isBrowser} from '@probe.gl/env';
import {
  buildBitmapFontAtlas,
  buildSdfFontAtlas,
  type BitmapFontAtlasSettings,
  type FontAtlas
} from '../../src/fonts';

function createFontAtlasSettings(
  fontFamily: string,
  props: BitmapFontAtlasSettings = {}
): BitmapFontAtlasSettings {
  return {
    fontFamily,
    fontSize: 16,
    buffer: 2,
    characterSet: 'AB',
    ...props
  };
}

function assertCommonFontAtlasShape(fontAtlas: FontAtlas, label: string): void {
  expect(fontAtlas.lineHeight, `${label} retains line-height metadata`).toBe(16);
  expect(fontAtlas.pages.length, `${label} exposes image pages`).toBe(1);
  expect(fontAtlas.width, `${label} reports its page width`).toBe(fontAtlas.pages[0]?.width);
  expect(fontAtlas.height, `${label} reports its page height`).toBe(fontAtlas.pages[0]?.height);
  expect(Object.keys(fontAtlas.mapping), `${label} maps requested glyphs`).toEqual(['A', 'B']);
}

it('fonts subpath bitmap and SDF builders return the common FontAtlas format', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const bitmapFontAtlas = buildBitmapFontAtlas(
    createFontAtlasSettings('font-atlas-builder-bitmap')
  );
  const sdfFontAtlas = buildSdfFontAtlas(createFontAtlasSettings('font-atlas-builder-sdf'));

  assertCommonFontAtlasShape(bitmapFontAtlas, 'bitmap atlas');
  assertCommonFontAtlasShape(sdfFontAtlas, 'SDF atlas');
  expect(bitmapFontAtlas.renderSettings.mode, 'bitmap mode travels with its atlas').toBe('bitmap');
  expect(
    bitmapFontAtlas.renderSettings,
    'bitmap sampling needs no renderer-specific settings'
  ).toEqual({mode: 'bitmap', threshold: 0, smoothing: 0});
  expect(sdfFontAtlas.renderSettings.mode, 'SDF mode travels with its atlas').toBe('sdf');
  expect(sdfFontAtlas.renderSettings.threshold, 'SDF cutoff becomes a sampling threshold').toBe(
    0.75
  );
  void 0;
});

it('browser font builders cache and incrementally extend atlases', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const fontFamily = 'font-atlas-builder-cache';
  const initialAtlas = buildBitmapFontAtlas(createFontAtlasSettings(fontFamily));
  const cachedAtlas = buildBitmapFontAtlas(createFontAtlasSettings(fontFamily));
  const extendedAtlas = buildBitmapFontAtlas(
    createFontAtlasSettings(fontFamily, {characterSet: 'ABC'})
  );

  expect(cachedAtlas.pages[0], 'equal inputs reuse the atlas page').toBe(initialAtlas.pages[0]);
  expect(extendedAtlas.pages[0], 'new glyphs extend the cached page').toBe(initialAtlas.pages[0]);
  expect(Object.keys(extendedAtlas.mapping), 'extension adds new glyphs').toEqual(['A', 'B', 'C']);
  void 0;
});

it('browser font builders align glyphs to a shared baseline', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  for (const [label, fontAtlas] of [
    [
      'bitmap',
      buildBitmapFontAtlas(createFontAtlasSettings('descender-bitmap', {characterSet: 'ag'}))
    ],
    ['SDF', buildSdfFontAtlas(createFontAtlasSettings('descender-sdf', {characterSet: 'ag'}))]
  ] as const) {
    expect(
      Boolean(
        (fontAtlas.mapping.g?.layoutOffsetY ?? 0) + (fontAtlas.mapping.g?.height ?? 0) >
          (fontAtlas.mapping.a?.layoutOffsetY ?? 0) + (fontAtlas.mapping.a?.height ?? 0)
      ),
      `${label} g extends below the a baseline`
    ).toBe(true);
  }
  void 0;
});

it('SDF glyph frames contain the full distance field without changing layout', () => {
  if (!isBrowser()) {
    return;
  }
  const characterSet = 'Hgjy_|.';
  const bitmapAtlas = buildBitmapFontAtlas({fontFamily: 'sans-serif', characterSet});
  const sdfAtlas = buildSdfFontAtlas({fontFamily: 'sans-serif', characterSet});
  const canvas = sdfAtlas.pages[0] as HTMLCanvasElement | OffscreenCanvas;
  const context = canvas.getContext('2d')!;
  for (const character of characterSet) {
    const frame = sdfAtlas.mapping[character];
    const bitmapFrame = bitmapAtlas.mapping[character];
    const {data, width, height} = context.getImageData(frame.x, frame.y, frame.width, frame.height);
    let maxEdgeAlpha = 0;
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        if (row === 0 || column === 0 || row === height - 1 || column === width - 1) {
          maxEdgeAlpha = Math.max(maxEdgeAlpha, data[(row * width + column) * 4 + 3]);
        }
      }
    }
    expect(maxEdgeAlpha, character + ' distance field reaches zero at the frame edges').toBe(0);
    expect(frame.advance).toBe(bitmapFrame.advance);
    expect(frame.width).toBe(bitmapFrame.width + 18);
    expect(frame.layoutOffsetX).toBe(-9);
    expect(frame.layoutOffsetY).toBe(bitmapFrame.layoutOffsetY! - 9);
    expect(frame.anchorY).toBe(bitmapFrame.anchorY + 9);
  }
});

it('SDF padding preserves larger caller buffers and caps oversized distance fields', () => {
  if (!isBrowser()) {
    return;
  }
  const bitmapAtlas = buildBitmapFontAtlas({fontFamily: 'sans-serif', characterSet: 'H'});
  const paddedAtlas = buildSdfFontAtlas({fontFamily: 'sans-serif', characterSet: 'H', buffer: 20});
  expect(paddedAtlas.mapping.H.width).toBe(bitmapAtlas.mapping.H.width + 40);
  expect(paddedAtlas.mapping.H.layoutOffsetX).toBe(-20);
  const largeRadiusAtlas = buildSdfFontAtlas({
    fontFamily: 'sans-serif',
    characterSet: 'H',
    radius: 1400
  });
  const frame = largeRadiusAtlas.mapping.H;
  expect(frame.x + frame.width).toBeLessThanOrEqual(largeRadiusAtlas.width);
  expect(frame.anchorX).toBeGreaterThan(0);
  expect(frame.anchorX).toBeLessThan(frame.width);
});
