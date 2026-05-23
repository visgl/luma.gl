// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import {
  createArrowStorageTextState,
  type ArrowStorageTextInputProps,
  type ArrowStorageTextState
} from './arrow-text-model';
import {
  convertArrowTextToAttribute,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './convert-arrow-text-to-attribute';

/** Converts Arrow text columns into GPU inputs consumed by {@link StorageTextModel}. */
export function convertArrowTextToStorage(
  device: Device,
  props: ConvertArrowTextProps
): ConvertedArrowTextData {
  if (props.sourceVectors.colors && arrow.DataType.isList(props.sourceVectors.colors.type)) {
    throw new Error('convertArrowTextToStorage requires row colors, not per-character colors');
  }
  return convertArrowTextToAttribute(device, props);
}

/** Builds prepared storage text state from Arrow-backed GPU inputs. */
export function convertArrowTextToStorageState(
  device: Device,
  props: ArrowStorageTextInputProps
): ArrowStorageTextState {
  return createArrowStorageTextState(device, props);
}

export type {ConvertedArrowTextData, ConvertArrowTextProps};
