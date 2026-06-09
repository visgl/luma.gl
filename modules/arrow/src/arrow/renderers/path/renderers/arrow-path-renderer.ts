// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  PathAttributeModel,
  PathStorageModel,
  PathTripsStorageModel,
  type PathAttributeModelProps,
  type PathStorageModelProps,
  type PathTripsStorageModelProps
} from '@luma.gl/tables';
import {
  makePathAttributeModelProps,
  convertArrowPathToGPUVectors,
  type ArrowPathPreparedGPUVectorProps,
  type ArrowPathSourceVectors,
  type PreparedArrowPathGPUVectors,
  type ConvertArrowPathToGPUVectorsOptions
} from '../conversion/arrow-path-gpu-vectors';
import {
  convertArrowPathStorageToGPUVectors,
  type PreparedPathStorageGPUVectors
} from '../conversion/arrow-path-storage-gpu-vectors';

export {
  buildArrowPathSegmentTable,
  createArrowPathPreparedState,
  makePathAttributeModelProps,
  convertArrowPathToGPUVectors,
  type ArrowPathPreparedGPUVectorProps,
  type ArrowPathPreparedState,
  type ArrowPathSegmentTable,
  type ArrowPathSourceVectors,
  type PreparedArrowPathGPUVectors,
  type ConvertArrowPathToGPUVectorsOptions
} from '../conversion/arrow-path-gpu-vectors';
export {
  convertArrowPathStorageToGPUVectors,
  type PreparedPathStorageGPUVectors
} from '../conversion/arrow-path-storage-gpu-vectors';
export type {ArrowPathViewOriginUpdateProps} from '../transforms/path-view-origins';

/** GPU path model selected by the Arrow-facing renderer. */
export type ArrowPathRendererModel = 'attribute' | 'storage' | 'trips';

/** Flat GPU props accepted by the Arrow path renderer. */
export type ArrowPathRendererProps =
  | ({model?: 'attribute'} & ArrowPathPreparedGPUVectorProps)
  | ({model: 'storage'} & PathStorageModelProps)
  | ({model: 'trips'} & PathTripsStorageModelProps);

/** Options used when the Arrow renderer converts GPU vectors for one path model. */
export type ConvertArrowPathRendererGPUVectorsOptions = ConvertArrowPathToGPUVectorsOptions & {
  /** GPU path model to convert vectors for. Defaults to `attribute`. */
  model?: ArrowPathRendererModel;
};

/** Prepared GPU props returned by the Arrow path renderer. */
export type PreparedArrowPathRendererGPUVectors =
  | PreparedArrowPathGPUVectors
  | PreparedPathStorageGPUVectors;

/** Converts Arrow path columns into GPU inputs consumed by {@link PathAttributeModel}. */
export function convertArrowPathsToAttribute(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: ConvertArrowPathToGPUVectorsOptions = {}
): Promise<PreparedArrowPathGPUVectors> {
  return convertArrowPathToGPUVectors(device, sourceVectors, options);
}

/** Converts Arrow path columns into GPU inputs consumed by {@link PathStorageModel}. */
export function convertArrowPathsToStorage(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: ConvertArrowPathToGPUVectorsOptions = {}
): Promise<PreparedPathStorageGPUVectors> {
  return convertArrowPathStorageToGPUVectors(device, sourceVectors, options);
}

/** Converts Arrow path and temporal columns into GPU inputs consumed by {@link PathTripsStorageModel}. */
export function convertArrowTripsToStorage(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: ConvertArrowPathToGPUVectorsOptions = {}
): Promise<PreparedPathStorageGPUVectors> {
  if (!sourceVectors.timestamps) {
    throw new Error('convertArrowTripsToStorage requires a timestamps column');
  }
  return convertArrowPathStorageToGPUVectors(device, sourceVectors, options);
}

/** Arrow-aware path renderer that converts data and selects one GPU-only path model. */
export class ArrowPathRenderer {
  /** Converts raw Arrow path/style vectors for the selected GPU path model. */
  static async convertToGPUVectors(
    device: Device,
    sourceVectors: ArrowPathSourceVectors,
    options: ConvertArrowPathRendererGPUVectorsOptions = {}
  ): Promise<PreparedArrowPathRendererGPUVectors> {
    const {model = 'attribute', ...conversionOptions} = options;
    switch (model) {
      case 'storage':
        return convertArrowPathsToStorage(device, sourceVectors, conversionOptions);
      case 'trips':
        return convertArrowTripsToStorage(device, sourceVectors, conversionOptions);
      case 'attribute':
        return convertArrowPathsToAttribute(device, sourceVectors, conversionOptions);
    }
  }

  /** Converts prepared path-attribute vectors into props accepted by {@link PathAttributeModel}. */
  static makeModelProps(
    device: Device,
    props: ArrowPathPreparedGPUVectorProps
  ): PathAttributeModelProps {
    return makePathAttributeModelProps(device, props);
  }

  /** Creates the selected GPU-only path model after Arrow conversion has produced GPU vectors. */
  static createModel(
    device: Device,
    props: {model?: 'attribute'} & ArrowPathPreparedGPUVectorProps
  ): PathAttributeModel;
  static createModel(
    device: Device,
    props: {model: 'storage'} & PathStorageModelProps
  ): PathStorageModel;
  static createModel(
    device: Device,
    props: {model: 'trips'} & PathTripsStorageModelProps
  ): PathTripsStorageModel;
  static createModel(
    device: Device,
    props: ArrowPathRendererProps
  ): PathAttributeModel | PathStorageModel | PathTripsStorageModel {
    switch (props.model) {
      case 'storage': {
        const {model, ...modelProps} = props;
        void model;
        return new PathStorageModel(device, modelProps);
      }
      case 'trips': {
        const {model, ...modelProps} = props;
        void model;
        return new PathTripsStorageModel(device, modelProps);
      }
      case 'attribute':
      case undefined: {
        const {model, ...modelProps} = props;
        void model;
        return new PathAttributeModel(device, makePathAttributeModelProps(device, modelProps));
      }
    }
    throw new Error('ArrowPathRenderer received unsupported model');
  }
}
