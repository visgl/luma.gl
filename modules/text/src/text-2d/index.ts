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
  type GpuTextAlignmentExpansionOptions,
  type GpuTextExpansionResourceOptions,
  type GpuUtf8ExpandedInputState,
  type StorageGlyphLookupState,
  type StorageGlyphMetricState
} from './gpu-text-expansion';
export {
  DEFAULT_GPU_UTF8_MAP_BINDING_NAMES,
  getGpuUtf8MapShaderBindings,
  getGpuUtf8MapShaderSource,
  type GpuUtf8MapBindingNames,
  type GpuUtf8MapBindingOptions,
  type GpuUtf8MapShaderSourceOptions
} from './gpu-utf8-map';
export {
  ArrowTextModel,
  ArrowStorageTextModel,
  buildArrowTextGlyphTable,
  createArrowStorageTextState,
  packStorageTextClipRects,
  type ArrowStorageTextBatchState,
  type ArrowStorageTextInputProps,
  type ArrowStorageTextModelProps,
  type ArrowStorageTextRenderBatchState,
  type ArrowStorageTextState,
  type ArrowTextGlyphTable,
  type ArrowTextModelProps,
  type ArrowTextRenderBatchState
} from './arrow-text-model';
