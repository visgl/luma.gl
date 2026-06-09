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
  type GpuDictionaryCompressedTextStream,
  type GpuDictionaryUtf8TextInput,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type TextGlyphLayout
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
  DEFAULT_TEXT_FS,
  DEFAULT_TEXT_SHADER_LAYOUT,
  DEFAULT_TEXT_VS,
  DEFAULT_CLIPPED_TEXT_SHADER_LAYOUT,
  DEFAULT_CLIPPED_TEXT_VS,
  DEFAULT_DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
  DEFAULT_DICTIONARY_STORAGE_TEXT_SOURCE,
  DEFAULT_ROW_INDEXED_STORAGE_TEXT_SHADER_LAYOUT,
  DEFAULT_ROW_INDEXED_STORAGE_TEXT_SOURCE,
  ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
  DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
  DEFAULT_STORAGE_INDEXED_TEXT_SOURCE
} from './model-utils/text-shaders';
export {createTextDefaultFragmentShaderUniforms} from './model-utils/text-fragment-uniforms';
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
  assertAttributeTextGPUVectorInputs,
  assertDictionaryTextGPUVectorInputs,
  assertStorageTextGPUVectorInputs,
  ATTRIBUTE_TEXT_GPU_INPUT_SCHEMA,
  DICTIONARY_TEXT_GPU_INPUT_SCHEMA,
  STORAGE_TEXT_GPU_INPUT_SCHEMA,
  type AttributeTextInputProps,
  type DictionaryTextInputProps,
  type StorageTextInputProps,
  type TextInputProps
} from './model-utils/text-model-props';
