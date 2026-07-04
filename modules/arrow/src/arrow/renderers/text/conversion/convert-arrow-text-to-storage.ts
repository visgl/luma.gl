// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  supportsGpuUtf8TextExpansion,
  type TextStorageModelProps,
  type TextStorageState
} from '@luma.gl/text/experimental';
import {
  createArrowTextStorageState,
  createTextStorageStateFromGPUVectors,
  type ArrowTextStorageInputProps,
  type GPUVectorTextStorageInputProps
} from './convert-arrow-text-vectors';
import {
  convertArrowTextToAttribute,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './convert-arrow-text-to-attribute';

/**
 * Uploads Arrow text source vectors to GPUVectors for storage text conversion.
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
 * render-batch control buffers. Pass it to {@link TextStorageModel} or
 * {@link TextRowIndexedStorageModel}.
 */
export function convertArrowTextToStorageState(
  device: Device,
  props: ArrowTextStorageInputProps
): TextStorageState {
  if (canUseGPUVectorTextStorageState(device, props)) {
    try {
      return createTextStorageStateFromGPUVectors(device, props);
    } catch (error) {
      if (!isGPUVectorTextStorageFallbackError(error)) {
        throw error;
      }
    }
  }
  return createArrowTextStorageState(device, props);
}

/**
 * Builds model-ready storage text props from Arrow-backed GPU inputs.
 *
 * CPU Arrow source vectors are consumed only by this conversion step and are not exposed on the
 * returned {@link TextStorageModelProps}.
 */
export function convertArrowTextToStorageModelProps(
  device: Device,
  props: ArrowTextStorageInputProps
): TextStorageModelProps {
  const storageState = convertArrowTextToStorageState(device, props);
  const {sourceVectors: _sourceVectors, rowIndexColumn: _rowIndexColumn, ...modelProps} = props;
  return {...modelProps, storageState};
}

export type {ConvertedArrowTextData, ConvertArrowTextProps};

function canUseGPUVectorTextStorageState(
  device: Device,
  props: ArrowTextStorageInputProps
): props is ArrowTextStorageInputProps & GPUVectorTextStorageInputProps & {texts: GPUVector} {
  return (
    device.type === 'webgpu' &&
    supportsGpuUtf8TextExpansion(device) &&
    props.rowIndexColumn !== true &&
    props.texts.format === 'value-list<uint8>'
  );
}

function isGPUVectorTextStorageFallbackError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /row offset metadata|zero-offset byte buffers|textBatches|clipRects batches/.test(error.message)
  );
}
