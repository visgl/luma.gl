// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import {
  createArrowStorageTextState,
  type ArrowStorageTextInputProps,
  type ArrowStorageTextState
} from './convert-arrow-text-vectors';
import {
  convertArrowTextToAttribute,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './convert-arrow-text-to-attribute';

/**
 * Uploads Arrow text source vectors to GPUVectors for storage text preparation.
 *
 * Storage text supports row colors only; per-character color lists are rejected because storage
 * models bind row style buffers and do not expand per-character color attributes.
 */
export function convertArrowTextToStorage(
  device: Device,
  props: ConvertArrowTextProps
): ConvertedArrowTextData {
  if (props.sourceVectors.colors && arrow.DataType.isList(props.sourceVectors.colors.type)) {
    throw new Error('convertArrowTextToStorage requires row colors, not per-character colors');
  }
  return convertArrowTextToAttribute(device, props);
}

/**
 * Builds prepared WebGPU storage text state from Arrow-backed GPU inputs.
 *
 * The returned state owns row binding buffers, generated glyph buffers, atlas resources, and
 * render-batch control buffers. Pass it to {@link StorageTextModel} or
 * {@link RowIndexedStorageTextModel}.
 */
export function convertArrowTextToStorageState(
  device: Device,
  props: ArrowStorageTextInputProps
): ArrowStorageTextState {
  return createArrowStorageTextState(device, props);
}

export type {ConvertedArrowTextData, ConvertArrowTextProps};
