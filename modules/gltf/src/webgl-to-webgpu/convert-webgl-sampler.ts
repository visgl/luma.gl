// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO: convert in loaders.gl?

import type {SamplerProps} from '@luma.gl/core';
import {GLEnum} from './gltf-webgl-constants';

/** Minimal glTF sampler representation used during conversion. */
type GLTFSampler = {
  /** Horizontal wrap mode. */
  wrapS?: GLEnum.CLAMP_TO_EDGE | GLEnum.REPEAT | GLEnum.MIRRORED_REPEAT;
  /** Vertical wrap mode. */
  wrapT?: GLEnum.CLAMP_TO_EDGE | GLEnum.REPEAT | GLEnum.MIRRORED_REPEAT;
  /** Magnification filter. */
  magFilter?: GLEnum.NEAREST | GLEnum.LINEAR;
  /** Minification and mip filter combination. */
  minFilter?:
    | GLEnum.NEAREST
    | GLEnum.LINEAR
    | GLEnum.NEAREST_MIPMAP_NEAREST
    | GLEnum.LINEAR_MIPMAP_NEAREST
    | GLEnum.NEAREST_MIPMAP_LINEAR
    | GLEnum.LINEAR_MIPMAP_LINEAR;
};

/** Converts a glTF sampler into luma.gl sampler props. */
export function convertSampler(gltfSampler: GLTFSampler): SamplerProps {
  return {
    addressModeU: convertSamplerWrapMode(gltfSampler.wrapS),
    addressModeV: convertSamplerWrapMode(gltfSampler.wrapT),
    magFilter: convertSamplerMagFilter(gltfSampler.magFilter),
    ...convertSamplerMinFilter(gltfSampler.minFilter)
  };
}

/** Converts a glTF wrap enum into a luma.gl address mode. */
function convertSamplerWrapMode(
  mode: GLEnum.CLAMP_TO_EDGE | GLEnum.REPEAT | GLEnum.MIRRORED_REPEAT | undefined
): 'clamp-to-edge' | 'repeat' | 'mirror-repeat' | undefined {
  switch (mode) {
    case GLEnum.CLAMP_TO_EDGE:
      return 'clamp-to-edge';
    case GLEnum.REPEAT:
      return 'repeat';
    case GLEnum.MIRRORED_REPEAT:
      return 'mirror-repeat';
    default:
      return undefined;
  }
}

/** Converts a glTF mag filter enum into a luma.gl mag filter. */
function convertSamplerMagFilter(
  mode: GLEnum.NEAREST | GLEnum.LINEAR | undefined
): 'nearest' | 'linear' | undefined {
  switch (mode) {
    case GLEnum.NEAREST:
      return 'nearest';
    case GLEnum.LINEAR:
      return 'linear';
    default:
      return undefined;
  }
}

/** Converts a glTF min filter enum into luma.gl minification and mipmap filters. */
function convertSamplerMinFilter(
  mode:
    | GLEnum.NEAREST
    | GLEnum.LINEAR
    | GLEnum.NEAREST_MIPMAP_NEAREST
    | GLEnum.LINEAR_MIPMAP_NEAREST
    | GLEnum.NEAREST_MIPMAP_LINEAR
    | GLEnum.LINEAR_MIPMAP_LINEAR
    | undefined
): {minFilter?: 'nearest' | 'linear'; mipmapFilter?: 'nearest' | 'linear'} {
  switch (mode) {
    case GLEnum.NEAREST:
      return {minFilter: 'nearest'};
    case GLEnum.LINEAR:
      return {minFilter: 'linear'};
    case GLEnum.NEAREST_MIPMAP_NEAREST:
      return {minFilter: 'nearest', mipmapFilter: 'nearest'};
    case GLEnum.LINEAR_MIPMAP_NEAREST:
      return {minFilter: 'linear', mipmapFilter: 'nearest'};
    case GLEnum.NEAREST_MIPMAP_LINEAR:
      return {minFilter: 'nearest', mipmapFilter: 'linear'};
    case GLEnum.LINEAR_MIPMAP_LINEAR:
      return {minFilter: 'linear', mipmapFilter: 'linear'};
    default:
      return {};
  }
}
