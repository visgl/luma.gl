// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  default as FontAtlasManager,
  DEFAULT_FONT_SETTINGS,
  setFontAtlasCacheLimit,
  type FontAtlas,
  type FontRenderer,
  type FontSettings
} from './font-atlas-manager';
export {
  autoWrapping,
  buildMapping,
  getTextFromBuffer,
  nextPowOfTwo,
  transformParagraph,
  type Character,
  type CharacterMapping
} from './text-utils';
export {
  buildArrowGlyphLayout,
  buildArrowUtf8Chunks,
  buildIndirectArrowGlyphLayout,
  createArrowUtf8TextIndexAccessor,
  decodeArrowUtf8CodePoints,
  isArrowUtf8Vector,
  populateUtf8TextIndices,
  type ArrowGlyphLayout,
  type ArrowUtf8Chunk,
  type ArrowUtf8TextAccessorContext,
  type ArrowUtf8TextIndexAccessor,
  type IndirectArrowGlyphLayout,
  type Utf8TextIndexTarget
} from './arrow-text';
export {
  ArrowTextModel,
  IndirectTextModel,
  buildArrowTextGlyphTable,
  buildIndirectTextGlyphTable,
  type ArrowTextGlyphTable,
  type ArrowTextModelProps,
  type IndirectTextGlyphTable
} from './arrow-text-model';
