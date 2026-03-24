// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureFormat} from '@luma.gl/core';

/** Ensure a texture format is WebGPU compatible */
export function getWebGPUTextureFormat(format: TextureFormat): GPUTextureFormat {
  if (format.endsWith('-ext')) {
    throw new Error('extension-only format');
  }
  return format as GPUTextureFormat;
}
