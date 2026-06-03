// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  prepareArrowPathGPUVectors,
  type ArrowPathSourceVectors,
  type PreparedArrowPathGPUVectors,
  type PrepareArrowPathGPUVectorsOptions
} from './arrow-path-model';

/** Converts Arrow path columns into GPU inputs consumed by {@link AttributePathModel}. */
export function convertArrowPathsToAttribute(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: PrepareArrowPathGPUVectorsOptions = {}
): Promise<PreparedArrowPathGPUVectors> {
  return prepareArrowPathGPUVectors(device, sourceVectors, options);
}

export type {
  ArrowPathSourceVectors,
  PreparedArrowPathGPUVectors,
  PrepareArrowPathGPUVectorsOptions
};
