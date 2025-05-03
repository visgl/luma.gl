// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO: convert in loaders.gl?

import type {SamplerProps} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

type GLTFSampler = {
  wrapS?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  wrapT?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  magFilter?: GL.NEAREST | GL.LINEAR;
  minFilter?:
    | GL.NEAREST
    | GL.LINEAR
    | GL.NEAREST_MIPMAP_NEAREST
    | GL.LINEAR_MIPMAP_NEAREST
    | GL.NEAREST_MIPMAP_LINEAR
    | GL.LINEAR_MIPMAP_LINEAR;
};

export function convertSampler(gltfSampler: GLTFSampler): SamplerProps {
  return {
    addressModeU: convertSamplerWrapMode(gltfSampler.wrapS),
    addressModeV: convertSamplerWrapMode(gltfSampler.wrapT),
    magFilter: convertSamplerMagFilter(gltfSampler.magFilter),
    ...convertSamplerMinFilter(gltfSampler.minFilter)
  };
}

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
