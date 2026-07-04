// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {GPUTextData, GPUTextStrategy} from '@luma.gl/text';
import {createGPUTextData, supportsGpuTextExpansion} from '@luma.gl/text/experimental';
import * as arrow from 'apache-arrow';
import {supportsVertexStorageBuffers} from '../../arrow-renderer-utils';
import type {
  ArrowTextDictionaryStorageInputProps,
  ArrowTextModelProps,
  ArrowTextStorageInputProps
} from './convert-arrow-text-vectors';
import {convertArrowTextToAttributeModelProps} from './convert-arrow-text-to-attribute';
import {convertArrowTextToDictionaryModelProps} from './convert-arrow-text-to-dictionary';
import {convertArrowTextToStorageModelProps} from './convert-arrow-text-to-storage';

const TEXT_STORAGE_VERTEX_STORAGE_BUFFER_COUNT = 8;
const TEXT_DICTIONARY_VERTEX_STORAGE_BUFFER_COUNT = 10;

/** Arrow-backed GPU text inputs and optional source-resource cleanup. */
export type MakeGPUTextDataFromArrowProps = ArrowTextModelProps & {
  /** Releases source GPUVectors when the resulting GPUTextData is destroyed. */
  destroy?: () => void;
};

/**
 * Prepares caller-owned GPU text data from uploaded Arrow columns.
 *
 * @returns Data that owns its generated GPU resources. The caller must destroy all borrowing
 * renderers before calling {@link GPUTextData.destroy}.
 */
export function makeGPUTextDataFromArrow(
  device: Device,
  props: MakeGPUTextDataFromArrowProps
): GPUTextData {
  const strategy = resolveGPUTextStrategy(device, props);
  const options = {
    rowCount: props.positions.length,
    ...(props.destroy ? {destroySource: props.destroy} : {})
  };

  if (strategy === 'dictionary') {
    const prepared = convertArrowTextToDictionaryModelProps(
      device,
      props as ArrowTextDictionaryStorageInputProps
    );
    const {storageState, ...modelProps} = prepared;
    return createGPUTextData({strategy, modelProps, state: storageState}, options);
  }
  if (strategy === 'storage' || strategy === 'storage-row-indexed') {
    const prepared = convertArrowTextToStorageModelProps(device, {
      ...(props as ArrowTextStorageInputProps),
      rowIndexColumn: strategy === 'storage-row-indexed'
    });
    const {storageState, ...modelProps} = prepared;
    return createGPUTextData({strategy, modelProps, state: storageState}, options);
  }
  const prepared = convertArrowTextToAttributeModelProps(device, props);
  const {attributeState, ...modelProps} = prepared;
  return createGPUTextData({strategy: 'attribute', modelProps, state: attributeState}, options);
}

/**
 * Chooses a text strategy from device capabilities and the Arrow input representation.
 *
 * Attribute rendering is used for WebGL, per-character colors, and fallback. Supported WebGPU
 * dictionary input uses dictionary storage; other supported WebGPU text uses storage.
 */
export function resolveGPUTextStrategy(
  device: Device,
  props: MakeGPUTextDataFromArrowProps
): GPUTextStrategy {
  const hasCharacterColors = Boolean(
    props.sourceVectors.colors && arrow.DataType.isList(props.sourceVectors.colors.type)
  );
  const supportsStorage =
    device.type === 'webgpu' &&
    supportsVertexStorageBuffers(device, TEXT_STORAGE_VERTEX_STORAGE_BUFFER_COUNT) &&
    supportsGpuTextExpansion(device);
  const supportsDictionary =
    device.type === 'webgpu' &&
    supportsVertexStorageBuffers(device, TEXT_DICTIONARY_VERTEX_STORAGE_BUFFER_COUNT);
  if (hasCharacterColors) {
    return 'attribute';
  }
  if (supportsDictionary && arrow.DataType.isDictionary(props.sourceVectors.texts.type)) {
    return 'dictionary';
  }
  return supportsStorage ? 'storage' : 'attribute';
}
