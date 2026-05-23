// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  prepareArrowStoragePathGPUVectors,
  type PreparedArrowStoragePathGPUVectors
} from './arrow-storage-path-gpu-vectors';
import type {ArrowPathSourceVectors, PrepareArrowPathGPUVectorsOptions} from './arrow-path-model';

/** Converts Arrow path and temporal columns into GPU inputs consumed by {@link StorageTripsPathModel}. */
export function convertArrowTripsToStorage(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: PrepareArrowPathGPUVectorsOptions = {}
): Promise<PreparedArrowStoragePathGPUVectors> {
  if (!sourceVectors.timestamps) {
    throw new Error('convertArrowTripsToStorage requires a timestamps column');
  }
  return prepareArrowStoragePathGPUVectors(device, sourceVectors, options);
}

export type {
  ArrowPathSourceVectors,
  PreparedArrowStoragePathGPUVectors,
  PrepareArrowPathGPUVectorsOptions
};
