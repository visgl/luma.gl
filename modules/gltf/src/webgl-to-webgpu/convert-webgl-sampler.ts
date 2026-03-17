// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO: convert in loaders.gl?

import type {SamplerProps} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

/** Minimal glTF sampler representation used during conversion. */
type GLTFSampler = {
  /** Horizontal wrap mode. */
  wrapS?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  /** Vertical wrap mode. */
  wrapT?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  /** Magnification filter. */
  magFilter?: GL.NEAREST | GL.LINEAR;
  /** Minification and mip filter combination. */
  minFilter?:
    | GL.NEAREST
    | GL.LINEAR
    | GL.NEAREST_MIPMAP_NEAREST
    | GL.LINEAR_MIPMAP_NEAREST
    | GL.NEAREST_MIPMAP_LINEAR
    | GL.LINEAR_MIPMAP_LINEAR;
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
  mode: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT | undefined
): 'clamp-to-edge' | 'repeat' | 'mirror-repeat' | undefined {
  switch (mode) {
    case GL.CLAMP_TO_EDGE:
      return 'clamp-to-edge';
    case GL.REPEAT:
      return 'repeat';
    case GL.MIRRORED_REPEAT:
      return 'mirror-repeat';
    default:
      return undefined;
  }
}

/** Converts a glTF mag filter enum into a luma.gl mag filter. */
function convertSamplerMagFilter(
  mode: GL.NEAREST | GL.LINEAR | undefined
): 'nearest' | 'linear' | undefined {
  switch (mode) {
    case GL.NEAREST:
      return 'nearest';
    case GL.LINEAR:
      return 'linear';
    default:
      return undefined;
  }
}

/** Converts a glTF min filter enum into luma.gl minification and mipmap filters. */
function convertSamplerMinFilter(
  mode:
    | GL.NEAREST
    | GL.LINEAR
    | GL.NEAREST_MIPMAP_NEAREST
    | GL.LINEAR_MIPMAP_NEAREST
    | GL.NEAREST_MIPMAP_LINEAR
    | GL.LINEAR_MIPMAP_LINEAR
    | undefined
): {minFilter?: 'nearest' | 'linear'; mipmapFilter?: 'nearest' | 'linear'} {
  switch (mode) {
    case GL.NEAREST:
      return {minFilter: 'nearest'};
    case GL.LINEAR:
      return {minFilter: 'linear'};
    case GL.NEAREST_MIPMAP_NEAREST:
      return {minFilter: 'nearest', mipmapFilter: 'nearest'};
    case GL.LINEAR_MIPMAP_NEAREST:
      return {minFilter: 'linear', mipmapFilter: 'nearest'};
    case GL.NEAREST_MIPMAP_LINEAR:
      return {minFilter: 'nearest', mipmapFilter: 'linear'};
    case GL.LINEAR_MIPMAP_LINEAR:
      return {minFilter: 'linear', mipmapFilter: 'linear'};
    default:
      return {};
  }
}
