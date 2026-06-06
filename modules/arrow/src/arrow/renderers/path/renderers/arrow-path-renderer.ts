// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  AttributePathModel,
  StoragePathModel,
  StorageTripsPathModel,
  type AttributePathModelProps,
  type StoragePathModelProps,
  type StorageTripsPathModelProps
} from '@luma.gl/tables';
import {
  makeAttributePathModelProps,
  prepareArrowPathGPUVectors,
  type ArrowPathPreparedGPUVectorProps,
  type ArrowPathSourceVectors,
  type PreparedArrowPathGPUVectors,
  type PrepareArrowPathGPUVectorsOptions
} from '../preparation/arrow-path-gpu-vectors';
import {
  prepareArrowStoragePathGPUVectors,
  type PreparedStoragePathGPUVectors
} from '../preparation/arrow-storage-path-gpu-vectors';

export {
  buildArrowPathSegmentTable,
  createArrowPathPreparedState,
  makeAttributePathModelProps,
  prepareArrowPathGPUVectors,
  type ArrowPathPreparedGPUVectorProps,
  type ArrowPathPreparedState,
  type ArrowPathSegmentTable,
  type ArrowPathSourceVectors,
  type PreparedArrowPathGPUVectors,
  type PrepareArrowPathGPUVectorsOptions
} from '../preparation/arrow-path-gpu-vectors';
export {
  prepareArrowStoragePathGPUVectors,
  type PreparedStoragePathGPUVectors
} from '../preparation/arrow-storage-path-gpu-vectors';
export type {ArrowPathViewOriginUpdateProps} from '../transforms/path-view-origins';

/** GPU path model selected by the Arrow-facing renderer. */
export type ArrowPathRendererModel = 'attribute' | 'storage' | 'trips';

/** Flat GPU props accepted by the Arrow path renderer. */
export type ArrowPathRendererProps =
  | ({model?: 'attribute'} & ArrowPathPreparedGPUVectorProps)
  | ({model: 'storage'} & StoragePathModelProps)
  | ({model: 'trips'} & StorageTripsPathModelProps);

/** Options used when the Arrow renderer prepares GPU vectors for one path model. */
export type PrepareArrowPathRendererGPUVectorsOptions = PrepareArrowPathGPUVectorsOptions & {
  /** GPU path model to prepare vectors for. Defaults to `attribute`. */
  model?: ArrowPathRendererModel;
};

/** Prepared GPU props returned by the Arrow path renderer. */
export type PreparedArrowPathRendererGPUVectors =
  | PreparedArrowPathGPUVectors
  | PreparedStoragePathGPUVectors;

/** Converts Arrow path columns into GPU inputs consumed by {@link AttributePathModel}. */
export function convertArrowPathsToAttribute(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: PrepareArrowPathGPUVectorsOptions = {}
): Promise<PreparedArrowPathGPUVectors> {
  return prepareArrowPathGPUVectors(device, sourceVectors, options);
}

/** Converts Arrow path columns into GPU inputs consumed by {@link StoragePathModel}. */
export function convertArrowPathsToStorage(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: PrepareArrowPathGPUVectorsOptions = {}
): Promise<PreparedStoragePathGPUVectors> {
  return prepareArrowStoragePathGPUVectors(device, sourceVectors, options);
}

/** Converts Arrow path and temporal columns into GPU inputs consumed by {@link StorageTripsPathModel}. */
export function convertArrowTripsToStorage(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: PrepareArrowPathGPUVectorsOptions = {}
): Promise<PreparedStoragePathGPUVectors> {
  if (!sourceVectors.timestamps) {
    throw new Error('convertArrowTripsToStorage requires a timestamps column');
  }
  return prepareArrowStoragePathGPUVectors(device, sourceVectors, options);
}

/** Arrow-aware path renderer that prepares data and selects one GPU-only path model. */
export class ArrowPathRenderer {
  /** Prepares raw Arrow path/style vectors for the selected GPU path model. */
  static async prepareGPUVectors(
    device: Device,
    sourceVectors: ArrowPathSourceVectors,
    options: PrepareArrowPathRendererGPUVectorsOptions = {}
  ): Promise<PreparedArrowPathRendererGPUVectors> {
    const {model = 'attribute', ...prepareOptions} = options;
    switch (model) {
      case 'storage':
        return convertArrowPathsToStorage(device, sourceVectors, prepareOptions);
      case 'trips':
        return convertArrowTripsToStorage(device, sourceVectors, prepareOptions);
      case 'attribute':
        return convertArrowPathsToAttribute(device, sourceVectors, prepareOptions);
    }
  }

  /** Converts prepared attribute-path vectors into props accepted by {@link AttributePathModel}. */
  static makeModelProps(
    device: Device,
    props: ArrowPathPreparedGPUVectorProps
  ): AttributePathModelProps {
    return makeAttributePathModelProps(device, props);
  }

  /** Creates the selected GPU-only path model after Arrow preparation has produced GPU vectors. */
  static createModel(
    device: Device,
    props: {model?: 'attribute'} & ArrowPathPreparedGPUVectorProps
  ): AttributePathModel;
  static createModel(
    device: Device,
    props: {model: 'storage'} & StoragePathModelProps
  ): StoragePathModel;
  static createModel(
    device: Device,
    props: {model: 'trips'} & StorageTripsPathModelProps
  ): StorageTripsPathModel;
  static createModel(
    device: Device,
    props: ArrowPathRendererProps
  ): AttributePathModel | StoragePathModel | StorageTripsPathModel {
    switch (props.model) {
      case 'storage': {
        const {model, ...modelProps} = props;
        void model;
        return new StoragePathModel(device, modelProps);
      }
      case 'trips': {
        const {model, ...modelProps} = props;
        void model;
        return new StorageTripsPathModel(device, modelProps);
      }
      case 'attribute':
      case undefined: {
        const {model, ...modelProps} = props;
        void model;
        return new AttributePathModel(device, makeAttributePathModelProps(device, modelProps));
      }
    }
  }
}
