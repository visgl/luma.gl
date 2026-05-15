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
  type Utf8TextIndexTarget
} from './arrow-text';
export {
  createGpuExpandedCompactInput,
  createGpuExpandedGeneratedState,
  createGpuUtf8ExpandedInput,
  createStorageGlyphLookup,
  createStorageGlyphMetrics,
  dispatchGpuExpandedTextCompute,
  dispatchGpuUtf8ExpandedTextCompute,
  type GpuExpandedCompactInputState,
  type GpuExpandedGeneratedState,
  type GpuTextExpansionResourceOptions,
  type GpuUtf8ExpandedInputState,
  type StorageGlyphLookupState,
  type StorageGlyphMetricState
} from './gpu-text-expansion';
export {
  ArrowTextModel,
  ArrowStorageTextModel,
  buildArrowTextGlyphTable,
  createArrowStorageTextState,
  packStorageTextClipRects,
  type ArrowStorageTextModelProps,
  type ArrowStorageTextState,
  type ArrowTextGlyphTable,
  type ArrowTextModelProps
} from './arrow-text-model';
