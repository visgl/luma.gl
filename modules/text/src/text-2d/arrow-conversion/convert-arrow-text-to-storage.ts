// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import type {StorageTextModelProps} from '../models/storage-text-model';
import {
  createArrowStorageTextState,
  createStorageTextStateFromGPUVectors,
  type ArrowStorageTextInputProps,
  type ArrowStorageTextState,
  type GPUVectorStorageTextInputProps
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
  if (canUseGPUVectorStorageTextState(device, props)) {
    try {
      return createStorageTextStateFromGPUVectors(device, props);
    } catch (error) {
      if (!isGPUVectorStorageTextFallbackError(error)) {
        throw error;
      }
    }
  }
  return createArrowStorageTextState(device, props);
}

/**
 * Builds model-ready storage text props from Arrow-backed GPU inputs.
 *
 * CPU Arrow source vectors are consumed only by this conversion step and are not exposed on the
 * returned {@link StorageTextModelProps}.
 */
export function convertArrowTextToStorageModelProps(
  device: Device,
  props: ArrowStorageTextInputProps
): StorageTextModelProps {
  const storageState = convertArrowTextToStorageState(device, props);
  const {
    sourceVectors: _sourceVectors,
    rowIndexColumn: _rowIndexColumn,
    fontAtlasManager: _fontAtlasManager,
    ...modelProps
  } = props;
  return {
    ...modelProps,
    storageState,
    ownsStorageState: true
  } as StorageTextModelProps;
}

export type {ConvertedArrowTextData, ConvertArrowTextProps};

function canUseGPUVectorStorageTextState(
  device: Device,
  props: ArrowStorageTextInputProps
): props is ArrowStorageTextInputProps & GPUVectorStorageTextInputProps & {texts: GPUVector} {
  return (
    device.type === 'webgpu' &&
    props.rowIndexColumn !== true &&
    props.texts.type instanceof arrow.Utf8 &&
    props.characterSet !== 'auto' &&
    (props.characterMapping !== undefined || props.characterSet !== undefined)
  );
}

function isGPUVectorStorageTextFallbackError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /row offset metadata|zero-offset byte buffers|textBatches|clipRects batches/.test(error.message)
  );
}
