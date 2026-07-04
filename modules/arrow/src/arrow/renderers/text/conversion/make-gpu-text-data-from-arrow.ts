// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {GPUTextData, GPUTextResources, GPUTextStrategy} from '@luma.gl/text';
import {createGPUTextData, supportsGpuTextExpansion} from '@luma.gl/text/experimental';
import {GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {supportsVertexStorageBuffers} from '../../arrow-renderer-utils';
import type {
  ArrowTextDictionaryStorageInputProps,
  ArrowTextModelProps,
  ArrowTextSourceVectors,
  ArrowTextStorageInputProps
} from './convert-arrow-text-vectors';
import {convertArrowTextToAttributeModelProps} from './convert-arrow-text-to-attribute';
import {convertArrowTextToDictionaryModelProps} from './convert-arrow-text-to-dictionary';
import {convertArrowTextToStorageModelProps} from './convert-arrow-text-to-storage';

const TEXT_STORAGE_VERTEX_STORAGE_BUFFER_COUNT = 8;
const TEXT_DICTIONARY_VERTEX_STORAGE_BUFFER_COUNT = 10;

/** Arrow-backed GPU text inputs and shared atlas resources. */
export type MakeGPUTextDataFromArrowProps = Omit<ArrowTextModelProps, 'fontAtlas' | 'resources'> & {
  /** Shared GPU atlas resources borrowed by every returned batch. */
  resources: GPUTextResources;
  /** Releases source GPUVectors after every returned batch has been destroyed. */
  destroy?: () => void;
};

type ResolvedMakeGPUTextDataFromArrowProps = Omit<ArrowTextModelProps, 'resources'> & {
  resources: GPUTextResources;
} & Pick<MakeGPUTextDataFromArrowProps, 'destroy'>;

/** One already-uploaded Arrow text input in an incremental source. */
export type GPUTextArrowStreamBatch = Omit<MakeGPUTextDataFromArrowProps, 'resources'>;

/** Shared preparation options for an incremental Arrow text source. */
export type MakeGPUTextDataFromArrowStreamOptions = {
  /** Shared uploaded atlas resources borrowed by every yielded batch. */
  resources: GPUTextResources;
};

/**
 * Prepares independently owned GPU text batches from uploaded Arrow columns.
 *
 * Existing Arrow and GPUVector chunk boundaries become distinct {@link GPUTextData} objects.
 * Destroy every borrowing renderer before destroying the returned batches, then destroy their
 * shared {@link GPUTextResources}.
 */
export function makeGPUTextDataFromArrow(
  device: Device,
  props: MakeGPUTextDataFromArrowProps
): GPUTextData[] {
  const resolvedProps: ResolvedMakeGPUTextDataFromArrowProps = {
    ...props,
    fontAtlas: props.resources.fontAtlas
  };
  return makeGPUTextDataFromArrowWithBases(device, resolvedProps, {
    sourceBatchIndex: 0,
    rowIndexBase: props.rowIndexBase ?? 0,
    glyphIndexBase: 0
  }).data;
}

function makeGPUTextDataFromArrowWithBases(
  device: Device,
  props: ResolvedMakeGPUTextDataFromArrowProps,
  bases: {sourceBatchIndex: number; rowIndexBase: number; glyphIndexBase: number}
): {data: GPUTextData[]; nextBases: typeof bases} {
  const strategy = resolveGPUTextStrategy(device, props);
  const batchCount = props.positions.data.length;
  if (batchCount === 0) {
    throw new Error('makeGPUTextDataFromArrow requires at least one source batch');
  }
  let remainingSourceOwners = batchCount;
  let sourceReleased = false;
  const releaseAllSources = () => {
    if (!sourceReleased) {
      sourceReleased = true;
      props.destroy?.();
    }
  };
  const releaseSource = props.destroy
    ? () => {
        remainingSourceOwners--;
        if (remainingSourceOwners === 0) {
          releaseAllSources();
        }
      }
    : undefined;
  const data: GPUTextData[] = [];
  let sourceBatchIndex = bases.sourceBatchIndex;
  let rowIndexBase = bases.rowIndexBase;
  let glyphIndexBase = bases.glyphIndexBase;
  try {
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const batchProps = getArrowTextBatchProps(props, batchIndex, rowIndexBase);
      const batch = makeGPUTextDataBatch(device, batchProps, strategy, {
        resources: props.resources,
        sourceBatchIndex,
        rowIndexBase,
        glyphIndexBase,
        destroySource: releaseSource
      });
      data.push(batch);
      sourceBatchIndex++;
      rowIndexBase += batch.rowCount;
      glyphIndexBase += batch.glyphCount;
    }
  } catch (error) {
    for (const batch of data) {
      batch.destroy();
    }
    releaseAllSources();
    throw error;
  }
  return {
    data,
    nextBases: {sourceBatchIndex, rowIndexBase, glyphIndexBase}
  };
}

/**
 * Converts an asynchronous sequence of already-uploaded Arrow batches without retaining earlier
 * inputs or rebuilding earlier GPU text data.
 */
export async function* makeGPUTextDataFromArrowStream(
  device: Device,
  source: AsyncIterable<GPUTextArrowStreamBatch>,
  options: MakeGPUTextDataFromArrowStreamOptions
): AsyncIterable<GPUTextData> {
  let sourceBatchIndex = 0;
  let rowIndexBase = 0;
  let glyphIndexBase = 0;
  for await (const batch of source) {
    const props: ResolvedMakeGPUTextDataFromArrowProps = {
      ...batch,
      fontAtlas: options.resources.fontAtlas,
      resources: options.resources
    };
    const prepared = makeGPUTextDataFromArrowWithBases(device, props, {
      sourceBatchIndex,
      rowIndexBase,
      glyphIndexBase
    });
    for (const batch of prepared.data) {
      yield batch;
    }
    ({sourceBatchIndex, rowIndexBase, glyphIndexBase} = prepared.nextBases);
  }
}

/** Chooses a text strategy without exposing concrete model classes. */
export function resolveGPUTextStrategy(
  device: Device,
  props: MakeGPUTextDataFromArrowProps | ResolvedMakeGPUTextDataFromArrowProps
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

function makeGPUTextDataBatch(
  device: Device,
  props: ArrowTextModelProps,
  strategy: GPUTextStrategy,
  options: {
    resources: GPUTextResources;
    sourceBatchIndex: number;
    rowIndexBase: number;
    glyphIndexBase: number;
    destroySource?: () => void;
  }
): GPUTextData {
  const dataOptions = {...options, rowCount: props.positions.length};
  if (strategy === 'dictionary') {
    const prepared = convertArrowTextToDictionaryModelProps(
      device,
      props as ArrowTextDictionaryStorageInputProps
    );
    const {storageState, ...modelProps} = prepared;
    return createGPUTextData({strategy, modelProps, state: storageState}, dataOptions);
  }
  if (strategy === 'storage' || strategy === 'storage-row-indexed') {
    const prepared = convertArrowTextToStorageModelProps(device, {
      ...(props as ArrowTextStorageInputProps),
      rowIndexColumn: strategy === 'storage-row-indexed'
    });
    const {storageState, ...modelProps} = prepared;
    return createGPUTextData({strategy, modelProps, state: storageState}, dataOptions);
  }
  const prepared = convertArrowTextToAttributeModelProps(device, props);
  const {attributeState, ...modelProps} = prepared;
  return createGPUTextData({strategy: 'attribute', modelProps, state: attributeState}, dataOptions);
}

function getArrowTextBatchProps(
  props: ResolvedMakeGPUTextDataFromArrowProps,
  batchIndex: number,
  rowIndexBase: number
): ArrowTextModelProps {
  const sourceVectors = getArrowTextSourceBatch(props.sourceVectors, batchIndex);
  const batchProps: Record<string, unknown> = {
    ...props,
    rowIndexBase,
    positions: getGPUVectorBatch(props.positions, batchIndex),
    texts: getGPUVectorBatch(props.texts, batchIndex),
    sourceVectors
  };
  for (const name of [
    'clipRects',
    'colors',
    'angles',
    'sizes',
    'pixelOffsets',
    'textAnchors',
    'alignmentBaselines'
  ]) {
    const vector = (props as unknown as Record<string, GPUVector | undefined>)[name];
    if (vector) {
      batchProps[name] = getGPUVectorBatch(vector, batchIndex);
    }
  }
  delete batchProps['destroy'];
  return batchProps as ArrowTextModelProps;
}

function getGPUVectorBatch(vector: GPUVector, batchIndex: number): GPUVector {
  const data = vector.data[batchIndex];
  if (!data) {
    throw new Error(`GPU text vector "${vector.name}" is missing source batch ${batchIndex}`);
  }
  return new GPUVector({
    type: 'data',
    name: vector.name,
    data: [data],
    format: vector.format,
    stride: vector.stride,
    valueLength: data.valueLength,
    byteStride: vector.byteStride,
    rowByteLength: vector.rowByteLength,
    bufferLayout: vector.bufferLayout,
    ownsData: false,
    dataType: vector.dataType
  });
}

function getArrowTextSourceBatch(
  sourceVectors: ArrowTextSourceVectors,
  batchIndex: number
): ArrowTextSourceVectors {
  return Object.fromEntries(
    Object.entries(sourceVectors).map(([name, vector]) => {
      const data = vector.data[batchIndex];
      if (!data) {
        throw new Error(`Arrow text source vector "${name}" is missing batch ${batchIndex}`);
      }
      return [name, new arrow.Vector([data as never])];
    })
  ) as unknown as ArrowTextSourceVectors;
}
