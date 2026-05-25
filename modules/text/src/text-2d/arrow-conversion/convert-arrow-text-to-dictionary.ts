// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import {
  createArrowDictionaryStorageTextState,
  type ArrowDictionaryStorageTextInputProps,
  type ArrowDictionaryStorageTextState
} from './convert-arrow-text-vectors';
import {
  convertArrowTextToStorage,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './convert-arrow-text-to-storage';

/**
 * Uploads dictionary-encoded Arrow text source vectors to GPUVectors for dictionary text state.
 *
 * Plain UTF-8 text is rejected. Use {@link convertArrowTextToStorage} for non-dictionary storage
 * text, or {@link convertArrowTextToAttribute} for the attribute path.
 */
export function convertArrowTextToDictionary(
  device: Device,
  props: ConvertArrowTextProps
): ConvertedArrowTextData {
  if (!arrow.DataType.isDictionary(props.sourceVectors.texts.type)) {
    throw new Error('convertArrowTextToDictionary requires Dictionary<Utf8> text');
  }
  return convertArrowTextToStorage(device, props);
}

/**
 * Builds prepared WebGPU dictionary text state from Arrow-backed GPU inputs.
 *
 * The returned state stores shared glyph records per dictionary value plus per-row dictionary
 * references. Pass it to {@link DictionaryTextModel}.
 */
export function convertArrowTextToDictionaryState(
  device: Device,
  props: ArrowDictionaryStorageTextInputProps
): ArrowDictionaryStorageTextState {
  return createArrowDictionaryStorageTextState(device, props);
}

export type {ConvertedArrowTextData, ConvertArrowTextProps};
