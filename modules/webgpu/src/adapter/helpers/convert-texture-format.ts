// luma.gl, MIT license
import {TextureFormat} from '@luma.gl/core';

/** Ensure a texture format is WebGPU compatible */
export function getWebGPUTextureFormat(format: TextureFormat): GPUTextureFormat {
  if (format.includes('webgl')) {
    throw new Error('webgl-only format');
  }
  return format as GPUTextureFormat;
}
