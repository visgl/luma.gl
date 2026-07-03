// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  buildBrowserFontAtlas,
  resolveBrowserFontAtlasSettings,
  type BrowserFontAtlasSettings
} from './atlas/browser-font-atlas';
import type {FontAtlas} from './atlas/font-atlas';

/** Browser font and packing options accepted by {@link buildBitmapFontAtlas}. */
export type BitmapFontAtlasSettings = BrowserFontAtlasSettings;

/**
 * Builds a browser-font bitmap atlas in the common {@link FontAtlas} format.
 *
 * Repeated calls with the same font settings reuse the generated canvas. Supplying additional
 * characters incrementally extends that canvas and its mapping.
 */
export function buildBitmapFontAtlas(props: BitmapFontAtlasSettings = {}): FontAtlas {
  const settings = resolveBrowserFontAtlasSettings(props);
  const {fontFamily, fontWeight, fontSize, buffer} = settings;
  return buildBrowserFontAtlas({
    settings,
    cacheKey: `bitmap ${fontFamily} ${fontWeight} ${fontSize} ${buffer}`,
    renderSettings: {mode: 'bitmap', threshold: 0, smoothing: 0}
  });
}
