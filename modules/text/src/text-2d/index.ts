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
  buildGpuDictionaryCompressedTextStream,
  buildGpuDictionaryUtf8TextInput,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  createArrowUtf8TextIndexAccessor,
  decodeArrowUtf8CodePoints,
  isArrowUtf8DictionaryType,
  isArrowUtf8DictionaryVector,
  isArrowUtf8TextVector,
  isArrowUtf8Vector,
  populateUtf8TextIndices,
  type ArrowGlyphLayout,
  type ArrowUtf8Dictionary,
  type ArrowUtf8DictionaryIndexType,
  type ArrowUtf8Chunk,
  type ArrowUtf8TextAccessorContext,
  type ArrowUtf8TextIndexAccessor,
  type ArrowUtf8TextType,
  type ArrowUtf8TextVector,
  type GpuDictionaryCompressedTextStream,
  type GpuDictionaryUtf8TextInput,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type Utf8TextIndexTarget
} from './arrow-text';
export {
  createGpuDictionaryUtf8ExpandedInput,
  createGpuDictionaryUtf8ExpansionConfig,
  createGpuExpandedCompactInput,
  createGpuExpandedGeneratedState,
  createGpuUtf8ExpandedInput,
  createStorageGlyphLookup,
  createStorageGlyphMetrics,
  dispatchGpuDictionaryUtf8ExpandedTextCompute,
  dispatchGpuExpandedTextCompute,
  dispatchGpuUtf8ExpandedTextCompute,
  type GpuDictionaryUtf8ExpandedInputState,
  type GpuDictionaryUtf8ExpansionConfigState,
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
  ArrowAttributeTextModel,
  ArrowDictionaryStorageTextModel,
  ArrowDictionaryTextModel,
  ArrowTextModel,
  ArrowStorageTextModel,
  buildArrowTextGlyphTable,
  createArrowAttributeTextState,
  createArrowDictionaryStorageTextState,
  createArrowStorageTextState,
  packStorageTextClipRects,
  type ArrowAttributeTextModelStateProps,
  type ArrowAttributeTextModelProps,
  type ArrowAttributeTextRenderProps,
  type ArrowAttributeTextRenderBatchState,
  type ArrowAttributeTextSourceVectors,
  type ArrowAttributeTextState,
  type ArrowDictionaryStorageTextBatchState,
  type ArrowDictionaryStorageTextInputProps,
  type ArrowDictionaryStorageTextModelProps,
  type ArrowDictionaryStorageTextRenderBatchState,
  type ArrowDictionaryStorageTextRenderProps,
  type ArrowDictionaryStorageTextSourceVectors,
  type ArrowDictionaryStorageTextState,
  type ArrowDictionaryTextBatchState,
  type ArrowDictionaryTextInputProps,
  type ArrowDictionaryTextModelProps,
  type ArrowDictionaryTextRenderBatchState,
  type ArrowDictionaryTextSourceVectors,
  type ArrowDictionaryTextState,
  type ArrowStorageTextBatchState,
  type ArrowStorageTextInputProps,
  type ArrowStorageTextModelProps,
  type ArrowStorageTextRenderBatchState,
  type ArrowStorageTextRenderProps,
  type ArrowStorageTextSourceVectors,
  type ArrowStorageTextState,
  type ArrowTextGlyphTable,
  type ArrowTextModelProps,
  type ArrowTextRenderBatchState,
  type ArrowTextSourceVectors
} from './arrow-text-model';
export {
  AttributeTextModel,
  createArrowAttributeTextState as createAttributeTextState,
  type AttributeTextModelProps,
  type AttributeTextRenderProps,
  type AttributeTextRenderBatchState,
  type AttributeTextState,
  type AttributeTextSourceVectors
} from './attribute-text-model';
export {
  StorageTextModel,
  createArrowStorageTextState as createStorageTextState,
  type StorageTextBatchState,
  type StorageTextInputProps,
  type StorageTextModelProps,
  type StorageTextRenderBatchState,
  type StorageTextSourceVectors,
  type StorageTextState
} from './storage-text-model';
export {
  DictionaryTextModel,
  createArrowDictionaryStorageTextState as createDictionaryTextState,
  type DictionaryTextBatchState,
  type DictionaryTextInputProps,
  type DictionaryTextModelProps,
  type DictionaryTextRenderBatchState,
  type DictionaryTextSourceVectors,
  type DictionaryTextState
} from './dictionary-text-model';
export {
  convertArrowTextToAttribute,
  convertArrowTextToAttributeState,
  type ArrowTextConversionColumns,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './convert-arrow-text-to-attribute';
export {
  convertArrowTextToStorage,
  convertArrowTextToStorageState
} from './convert-arrow-text-to-storage';
export {
  convertArrowTextToDictionary,
  convertArrowTextToDictionaryState
} from './convert-arrow-text-to-dictionary';
