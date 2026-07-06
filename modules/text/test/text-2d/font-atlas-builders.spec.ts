// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {isBrowser} from '@probe.gl/env';
import {
  buildBitmapFontAtlas,
  buildSdfFontAtlas,
  type BitmapFontAtlasSettings,
  type FontAtlas
} from '../../src';

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

function assertCommonFontAtlasShape(t: any, fontAtlas: FontAtlas, label: string): void {
  t.equal(fontAtlas.lineHeight, 16, `${label} retains line-height metadata`);
  t.equal(fontAtlas.pages.length, 1, `${label} exposes image pages`);
  t.equal(fontAtlas.width, fontAtlas.pages[0]?.width, `${label} reports its page width`);
  t.equal(fontAtlas.height, fontAtlas.pages[0]?.height, `${label} reports its page height`);
  t.deepEqual(Object.keys(fontAtlas.mapping), ['A', 'B'], `${label} maps requested glyphs`);
}

test('bitmap and SDF builders return the common FontAtlas format', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const bitmapFontAtlas = buildBitmapFontAtlas(
    createFontAtlasSettings('font-atlas-builder-bitmap')
  );
  const sdfFontAtlas = buildSdfFontAtlas(createFontAtlasSettings('font-atlas-builder-sdf'));

  assertCommonFontAtlasShape(t, bitmapFontAtlas, 'bitmap atlas');
  assertCommonFontAtlasShape(t, sdfFontAtlas, 'SDF atlas');
  t.equal(bitmapFontAtlas.renderSettings.mode, 'bitmap', 'bitmap mode travels with its atlas');
  t.deepEqual(
    bitmapFontAtlas.renderSettings,
    {mode: 'bitmap', threshold: 0, smoothing: 0},
    'bitmap sampling needs no renderer-specific settings'
  );
  t.equal(sdfFontAtlas.renderSettings.mode, 'sdf', 'SDF mode travels with its atlas');
  t.equal(sdfFontAtlas.renderSettings.threshold, 0.75, 'SDF cutoff becomes a sampling threshold');
  t.end();
});

test('browser font builders cache and incrementally extend atlases', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const fontFamily = 'font-atlas-builder-cache';
  const initialAtlas = buildBitmapFontAtlas(createFontAtlasSettings(fontFamily));
  const cachedAtlas = buildBitmapFontAtlas(createFontAtlasSettings(fontFamily));
  const extendedAtlas = buildBitmapFontAtlas(
    createFontAtlasSettings(fontFamily, {characterSet: 'ABC'})
  );

  t.equal(cachedAtlas.pages[0], initialAtlas.pages[0], 'equal inputs reuse the atlas page');
  t.equal(extendedAtlas.pages[0], initialAtlas.pages[0], 'new glyphs extend the cached page');
  t.deepEqual(Object.keys(extendedAtlas.mapping), ['A', 'B', 'C'], 'extension adds new glyphs');
  t.end();
});

test('browser font builders align glyphs to a shared baseline', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  for (const [label, fontAtlas] of [
    [
      'bitmap',
      buildBitmapFontAtlas(createFontAtlasSettings('descender-bitmap', {characterSet: 'ag'}))
    ],
    ['SDF', buildSdfFontAtlas(createFontAtlasSettings('descender-sdf', {characterSet: 'ag'}))]
  ] as const) {
    t.ok(
      (fontAtlas.mapping.g?.layoutOffsetY ?? 0) + (fontAtlas.mapping.g?.height ?? 0) >
        (fontAtlas.mapping.a?.layoutOffsetY ?? 0) + (fontAtlas.mapping.a?.height ?? 0),
      `${label} g extends below the a baseline`
    );
  }
  t.end();
});
