// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import {
  createArrowDictionaryStorageTextState,
  type ArrowDictionaryStorageTextInputProps,
  type ArrowDictionaryStorageTextState
} from './arrow-text-model';
import {
  convertArrowTextToStorage,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './convert-arrow-text-to-storage';

/** Converts dictionary-encoded Arrow text columns into GPU inputs consumed by {@link DictionaryTextModel}. */
export function convertArrowTextToDictionary(
  device: Device,
  props: ConvertArrowTextProps
): ConvertedArrowTextData {
  if (!arrow.DataType.isDictionary(props.sourceVectors.texts.type)) {
    throw new Error('convertArrowTextToDictionary requires Dictionary<Utf8> text');
  }
  return convertArrowTextToStorage(device, props);
}

/** Builds prepared dictionary text state from Arrow-backed GPU inputs. */
export function convertArrowTextToDictionaryState(
  device: Device,
  props: ArrowDictionaryStorageTextInputProps
): ArrowDictionaryStorageTextState {
  return createArrowDictionaryStorageTextState(device, props);
}

export type {ConvertedArrowTextData, ConvertArrowTextProps};
