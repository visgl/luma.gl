// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import type {TextDictionaryModelProps, TextDictionaryState} from '@luma.gl/text';
import {
  createArrowTextDictionaryStorageState,
  type ArrowTextDictionaryStorageInputProps
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
 * references. Pass it to {@link TextDictionaryModel}.
 */
export function convertArrowTextToDictionaryState(
  device: Device,
  props: ArrowTextDictionaryStorageInputProps
): TextDictionaryState {
  return createArrowTextDictionaryStorageState(device, props);
}

/**
 * Builds model-ready dictionary text props from Arrow-backed GPU inputs.
 *
 * CPU Arrow source vectors are consumed only by this conversion step and are not exposed on the
 * returned {@link TextDictionaryModelProps}.
 */
export function convertArrowTextToDictionaryModelProps(
  device: Device,
  props: ArrowTextDictionaryStorageInputProps
): TextDictionaryModelProps & TextDictionaryState {
  const storageState = convertArrowTextToDictionaryState(device, props);
  const {
    sourceVectors: _sourceVectors,
    rowIndexColumn: _rowIndexColumn,
    fontAtlasManager: _fontAtlasManager,
    ...modelProps
  } = props;
  return {
    ...modelProps,
    ...storageState,
    ownsStorageState: true
  } as TextDictionaryModelProps & TextDictionaryState;
}

export type {ConvertedArrowTextData, ConvertArrowTextProps};
