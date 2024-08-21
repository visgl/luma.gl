// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureFormat} from '@luma.gl/shadertypes';

/** Ensure a texture format is WebGPU compatible */
export function getWebGPUTextureFormat(format: TextureFormat): GPUTextureFormat {
  if (format.includes('webgl')) {
    throw new Error('webgl-only format');
  }
  return format as GPUTextureFormat;
}
