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
  type GpuTextDictionaryCompressedStream,
  type GpuTextDictionaryUtf8Input,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type TextGlyphLayout
} from './model-utils/gpu-text-types';
export {
  createGpuTextDictionaryUtf8ExpandedInput,
  createGpuTextDictionaryUtf8ExpansionConfig,
  createGpuExpandedCompactInput,
  createGpuExpandedGeneratedState,
  createGpuUtf8ExpandedInput,
  createGpuUtf8ExpandedInputFromBuffers,
  createTextStorageGlyphLookup,
  createTextStorageGlyphMetrics,
  dispatchGpuTextDictionaryUtf8ExpandedCompute,
  dispatchGpuExpandedTextCompute,
  dispatchGpuUtf8ExpandedTextCompute,
  type GpuTextDictionaryUtf8ExpandedInputState,
  type GpuTextDictionaryUtf8ExpansionConfigState,
  type GpuExpandedCompactInputState,
  type GpuExpandedGeneratedState,
  type GpuTextAlignmentExpansionOptions,
  type GpuTextExpansionResourceOptions,
  type GpuUtf8ExpandedInputState,
  type TextStorageGlyphLookupState,
  type TextStorageGlyphMetricState
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
  DEFAULT_TEXT_DICTIONARY_STORAGE_SHADER_LAYOUT,
  DEFAULT_TEXT_DICTIONARY_STORAGE_SOURCE,
  DEFAULT_TEXT_ROW_INDEXED_STORAGE_SHADER_LAYOUT,
  DEFAULT_TEXT_ROW_INDEXED_STORAGE_SOURCE,
  ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
  DEFAULT_TEXT_STORAGE_INDEXED_SHADER_LAYOUT,
  DEFAULT_TEXT_STORAGE_INDEXED_SOURCE
} from './model-utils/text-shaders';
export {createTextDefaultFragmentShaderUniforms} from './model-utils/text-fragment-uniforms';
export {
  getFirstTextDictionaryBatch,
  getFirstTextDictionaryRenderBatch,
  getFirstTextStorageBatch,
  getFirstTextStorageRenderBatch,
  getTextStorageRowGlyphStartsBuffer,
  type TextSdfRenderSettings,
  type TextStorageBuffer
} from './model-utils/text-storage-state';
export {
  TextAttributeModel,
  type TextAttributeModelProps,
  type TextAttributeRenderBatchState,
  type TextAttributeState,
  type PreparedTextAttributeModelProps
} from './models/text-attribute-model';
export {
  TextStorageModel,
  TextRowIndexedStorageModel,
  type TextStorageBatchState,
  type TextStorageModelProps,
  type PreparedTextStorageModelProps,
  type TextStorageRenderBatchState,
  type TextStorageRenderProps,
  type TextStorageState
} from './models/text-storage-model';
export {
  TextDictionaryModel,
  type TextDictionaryBatchState,
  type TextDictionaryModelProps,
  type PreparedTextDictionaryModelProps,
  type TextDictionaryRenderBatchState,
  type TextDictionaryRenderProps,
  type TextDictionaryState
} from './models/text-dictionary-model';
export {
  assertTextAttributeGPUVectorInputs,
  assertTextDictionaryGPUVectorInputs,
  assertTextStorageGPUVectorInputs,
  TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA,
  TEXT_DICTIONARY_GPU_INPUT_SCHEMA,
  TEXT_STORAGE_GPU_INPUT_SCHEMA,
  type TextAttributeInputProps,
  type TextDictionaryInputProps,
  type TextStorageInputProps,
  type TextInputProps
} from './model-utils/text-model-props';
