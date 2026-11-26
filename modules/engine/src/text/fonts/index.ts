// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {helvetiker} from './helvetiker';
export {type TypefaceFontData, type TypefaceGlyph} from './typeface-font-data';
export {
  type FontAtlas,
  type FontAtlasPage,
  type FontAtlasRenderMode,
  type FontAtlasRenderSettings
} from './atlas/font-atlas';
export {
  measureFontAtlasText,
  type FontAtlasTextMetrics,
  type FontAtlasTextMetricsOptions
} from './atlas/text-metrics';
export {
  buildBitmapFontAtlas,
  type BitmapFontAtlasSettings
} from './build-bitmap-font-atlas';
export {
  buildSdfFontAtlas,
  type SdfFontAtlasSettings
} from './build-sdf-font-atlas';
export {
  buildMsdfFontAtlas,
  loadMsdfFontAtlas,
  type BmFontMsdfCharacter,
  type BmFontMsdfData,
  type BmFontMsdfKerning
} from './build-msdf-font-atlas';
export {
  buildMapping,
  createTextKerning,
  getCharacterAtlasPage,
  getCharacterLayoutOffset,
  getTextKerningOffset,
  nextPowOfTwo,
  type Character,
  type CharacterMapping,
  type TextKerning,
  type TextKerningPair
} from './atlas/text-utils';

export {
  buildBrowserFontAtlas,
  resolveBrowserFontAtlasSettings,
  setFontAtlasCacheLimit,
  type BrowserFontAtlasBuildOptions,
  type BrowserFontAtlasSettings,
  type ResolvedBrowserFontAtlasSettings,
  type BrowserFontRenderer
} from './atlas/browser-font-atlas';

export {parseGlyphRange, type Glyph} from './glyph-pbf';
export {GlyphRangeLoader, type GlyphRangeLoaderOptions} from './glyph-range-loader';
export {buildGlyphFontAtlas, createGlyphFontRenderer} from './build-glyph-font-atlas';
