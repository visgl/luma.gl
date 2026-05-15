// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  default as FontAtlasManager,
  DEFAULT_FONT_SETTINGS,
  setFontAtlasCacheLimit,
  type FontAtlas,
  type FontAtlasBuildMetrics,
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
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  buildIndirectArrowGlyphLayout,
  createArrowUtf8TextIndexAccessor,
  decodeArrowUtf8CodePoints,
  isArrowUtf8Vector,
  populateUtf8TextIndices,
  type ArrowGlyphLayout,
  type ArrowUtf8Chunk,
  type ArrowUtf8TextAccessorContext,
  type ArrowUtf8TextIndexAccessor,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type IndirectArrowGlyphLayout,
  type Utf8TextIndexTarget
} from './arrow-text';
export {
  ArrowTextModel,
  GpuExpandedTextModel,
  IndirectTextModel,
  StorageIndexedTextModel,
  StorageTextModel,
  buildArrowTextGlyphTable,
  buildIndirectTextGlyphTable,
  buildStorageIndexedTextGlyphTable,
  buildStorageTextGlyphTable,
  packStorageTextClipRects,
  type ArrowTextGlyphTable,
  type ArrowTextModelProps,
  type GpuExpandedTextModelProps,
  type IndirectTextGlyphTable,
  type StorageIndexedTextGlyphTable,
  type StorageIndexedTextModelProps,
  type StorageTextGlyphTable,
  type StorageTextModelProps
} from './arrow-text-model';
