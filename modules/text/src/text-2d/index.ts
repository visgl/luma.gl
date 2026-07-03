// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {type FontAtlas} from './atlas/font-atlas';
export {
  buildBitmapFontAtlas,
  type BitmapFontAtlasSettings
} from './build-bitmap-font-atlas';
export {buildSdfFontAtlas, type SdfFontAtlasSettings} from './build-sdf-font-atlas';
export {
  buildMsdfFontAtlas,
  loadMsdfFontAtlas,
  type BmFontMsdfCharacter,
  type BmFontMsdfData,
  type BmFontMsdfKerning
} from './build-msdf-font-atlas';
export {
  autoWrapping,
  buildMapping,
  getCharacterAtlasPage,
  getCharacterLayoutOffset,
  getTextKerningOffset,
  getTextFromBuffer,
  nextPowOfTwo,
  transformParagraph,
  type Character,
  type CharacterMapping,
  type TextKerning
} from './atlas/text-utils';
export {
  type GpuTextDictionaryCompressedStream,
  type GpuTextDictionaryUtf8Input,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type TextGlyphLayout
} from './model-utils/gpu-text-types';
export {
  buildTextGlyphLayout,
  buildTextGpuDictionaryCompressedStream,
  buildTextGpuExpandedStream,
  buildTextGpuGlyphDefinitions,
  type TextCodePointSource,
  type TextDictionaryCodePointSource,
  type TextGpuGlyphDefinitions,
  type TextLayoutOptions
} from './model-utils/text-layout';
export {
  createGpuTextDictionaryUtf8ExpandedInput,
  createGpuTextDictionaryUtf8ExpansionConfig,
  createGpuExpandedCompactInput,
  createGpuExpandedGeneratedState,
  createGpuUtf8ExpandedInput,
  createGpuUtf8ExpandedInputFromBuffers,
  GPU_TEXT_EXPANSION_STORAGE_BUFFER_COUNT,
  GPU_UTF8_TEXT_EXPANSION_STORAGE_BUFFER_COUNT,
  createTextStorageGlyphKernings,
  createTextStorageGlyphLookup,
  createTextStorageGlyphMetrics,
  createTextStorageGlyphPages,
  dispatchGpuTextDictionaryUtf8ExpandedCompute,
  dispatchGpuExpandedTextCompute,
  dispatchGpuUtf8ExpandedTextCompute,
  supportsGpuTextExpansion,
  supportsGpuUtf8TextExpansion,
  type GpuTextDictionaryUtf8ExpandedInputState,
  type GpuTextDictionaryUtf8ExpansionConfigState,
  type GpuExpandedCompactInputState,
  type GpuExpandedGeneratedState,
  type GpuTextAlignmentExpansionOptions,
  type GpuTextExpansionResourceOptions,
  type GpuUtf8ExpandedInputState,
  type TextStorageGlyphLookupState,
  type TextStorageGlyphKerningState,
  type TextStorageGlyphMetricState,
  type TextStorageGlyphPageState
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
  GLYPH_PAGES_COLUMN,
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
export {
  createTextDefaultFragmentShaderUniforms,
  getFontAtlasShaderProps,
  type FontAtlasShaderProps
} from './model-utils/text-fragment-uniforms';
export {
  makeTextGlyphAlphaGlsl,
  makeTextGlyphAlphaWgsl,
  type TextGlyphAlphaShaderProps,
  type TextGlyphAlphaShaderRenderMode,
  type TextGlyphAlphaShaderSettings
} from './model-utils/text-fragment-shaders';
export {
  getFirstTextDictionaryBatch,
  getFirstTextDictionaryRenderBatch,
  getFirstTextStorageBatch,
  getFirstTextStorageRenderBatch,
  getTextStorageRowGlyphStartsBuffer,
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
