// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Unstable text strategy APIs intended for diagnostics and benchmarks. */
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
export * from './model-utils/gpu-text-expansion';
export * from './model-utils/gpu-text-types';
export * from './model-utils/gpu-utf8-map';
export * from './model-utils/text-fragment-shaders';
export * from './model-utils/text-fragment-uniforms';
export {
  buildTextGpuDictionaryCompressedStream,
  buildTextGpuExpandedStream,
  buildTextGpuGlyphDefinitions,
  type TextDictionaryCodePointSource,
  type TextGpuGlyphDefinitions
} from './model-utils/text-layout';
export * from './model-utils/text-model-props';
export * from './model-utils/text-shaders';
export * from './model-utils/text-storage-state';
export {getTextRendererModel} from './text-renderer';
export {
  createGPUTextData,
  getGPUTextDataProps,
  GPUTextDataImpl,
  type GPUTextDataProps
} from './gpu-text-data';
