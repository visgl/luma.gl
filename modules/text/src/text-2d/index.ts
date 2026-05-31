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
} from './atlas/font-atlas-manager';
export {
  autoWrapping,
  buildMapping,
  getTextFromBuffer,
  nextPowOfTwo,
  transformParagraph,
  type Character,
  type CharacterMapping
} from './atlas/text-utils';
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
  type Utf8TextIndexTarget
} from './arrow-conversion/arrow-text';
export {
  type GpuDictionaryCompressedTextStream,
  type GpuDictionaryUtf8TextInput,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type TextGlyphLayout,
  type Utf8Dictionary,
  type Utf8DictionaryIndexType,
  type Utf8TextType,
  type Utf8TextVector
} from './model-utils/gpu-text-types';
export {
  createGpuDictionaryUtf8ExpandedInput,
  createGpuDictionaryUtf8ExpansionConfig,
  createGpuExpandedCompactInput,
  createGpuExpandedGeneratedState,
  createGpuUtf8ExpandedInput,
  createGpuUtf8ExpandedInputFromBuffers,
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
} from './model-utils/gpu-text-expansion';
export {
  DEFAULT_GPU_UTF8_MAP_BINDING_NAMES,
  getGpuUtf8MapShaderBindings,
  getGpuUtf8MapShaderSource,
  type GpuUtf8MapBindingNames,
  type GpuUtf8MapBindingOptions,
  type GpuUtf8MapShaderSourceOptions
} from './model-utils/gpu-utf8-map';
export {
  DEFAULT_ARROW_TEXT_FS,
  DEFAULT_ARROW_TEXT_SHADER_LAYOUT,
  DEFAULT_ARROW_TEXT_VS,
  DEFAULT_CLIPPED_ARROW_TEXT_SHADER_LAYOUT,
  DEFAULT_CLIPPED_ARROW_TEXT_VS,
  DEFAULT_DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
  DEFAULT_DICTIONARY_STORAGE_TEXT_SOURCE,
  DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
  DEFAULT_STORAGE_INDEXED_TEXT_SOURCE
} from './model-utils/text-shaders';
export {createArrowTextDefaultFragmentShaderUniforms} from './model-utils/text-fragment-uniforms';
export {
  buildArrowTextGlyphTable,
  createArrowAttributeTextState,
  createArrowDictionaryStorageTextState,
  createArrowStorageTextState,
  createStorageTextStateFromGPUVectors,
  packStorageTextClipRects,
  type ArrowAttributeTextInputProps,
  type ArrowAttributeTextRenderProps,
  type ArrowAttributeTextState,
  type ArrowDictionaryStorageTextBatchState,
  type ArrowDictionaryStorageTextInputProps,
  type ArrowDictionaryStorageTextRenderBatchState,
  type ArrowDictionaryStorageTextRenderProps,
  type ArrowDictionaryStorageTextSourceVectors,
  type ArrowDictionaryStorageTextState,
  type ArrowStorageTextBatchState,
  type ArrowStorageTextInputProps,
  type ArrowStorageTextRenderBatchState,
  type ArrowStorageTextRenderProps,
  type ArrowStorageTextSourceVectors,
  type ArrowStorageTextState,
  type ArrowTextGlyphTable,
  type ArrowTextRenderBatchState,
  type ArrowTextSourceVectors,
  type GPUVectorStorageTextBatch,
  type GPUVectorStorageTextInputProps
} from './arrow-conversion/convert-arrow-text-vectors';
export {
  AttributeTextModel,
  type AttributeTextModelProps,
  type AttributeTextRenderBatchState,
  type AttributeTextState,
  type PreparedAttributeTextModelProps
} from './models/attribute-text-model';
export {
  StorageTextModel,
  RowIndexedStorageTextModel,
  type StorageTextBatchState,
  type StorageTextModelProps,
  type PreparedStorageTextModelProps,
  type StorageTextRenderBatchState,
  type StorageTextRenderProps,
  type StorageTextState
} from './models/storage-text-model';
export {
  DictionaryTextModel,
  type DictionaryTextBatchState,
  type DictionaryTextModelProps,
  type PreparedDictionaryTextModelProps,
  type DictionaryTextRenderBatchState,
  type DictionaryTextRenderProps,
  type DictionaryTextState
} from './models/dictionary-text-model';
export {
  type AttributeTextInputProps,
  type DictionaryTextInputProps,
  type StorageTextInputProps
} from './model-utils/text-model-props';
export {
  convertArrowTextToAttribute,
  convertArrowTextToAttributeModelProps,
  convertArrowTextToAttributeState,
  type ArrowTextConversionColumns,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './arrow-conversion/convert-arrow-text-to-attribute';
export {
  convertArrowTextToStorage,
  convertArrowTextToStorageModelProps,
  convertArrowTextToStorageState
} from './arrow-conversion/convert-arrow-text-to-storage';
export {
  convertArrowTextToDictionary,
  convertArrowTextToDictionaryModelProps,
  convertArrowTextToDictionaryState
} from './arrow-conversion/convert-arrow-text-to-dictionary';
