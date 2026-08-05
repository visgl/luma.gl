// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO: convert in loaders.gl?

import type {SamplerProps} from '@luma.gl/core';
import {GLEnum} from './gltf-webgl-constants';

/** Minimal glTF sampler representation used during conversion. */
export type GLTFSampler = {
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
  /** Postprocessed loaders.gl samplers preserve authored enums by their WebGL parameter names. */
  parameters?: Partial<Record<number, number>>;
};

/** Converts a glTF sampler into luma.gl sampler props. */
export function convertSampler(gltfSampler: GLTFSampler = {}): SamplerProps {
  const wrapS = gltfSampler.wrapS ?? gltfSampler.parameters?.[GLEnum.TEXTURE_WRAP_S];
  const wrapT = gltfSampler.wrapT ?? gltfSampler.parameters?.[GLEnum.TEXTURE_WRAP_T];
  const magFilter = gltfSampler.magFilter ?? gltfSampler.parameters?.[GLEnum.TEXTURE_MAG_FILTER];
  const minFilter = gltfSampler.minFilter ?? gltfSampler.parameters?.[GLEnum.TEXTURE_MIN_FILTER];
  const addressModeU = convertSamplerWrapMode(wrapS);
  const addressModeV = convertSamplerWrapMode(wrapT);
  const magnificationFilter = convertSamplerMagFilter(magFilter);
  return {
    ...(addressModeU ? {addressModeU} : {}),
    ...(addressModeV ? {addressModeV} : {}),
    ...(magnificationFilter ? {magFilter: magnificationFilter} : {}),
    ...convertSamplerMinFilter(minFilter)
  };
}

/** Converts portable luma.gl sampler settings into glTF's authored WebGL enum values. */
export function convertSamplerToGLTF(sampler: SamplerProps): GLTFSampler {
  const wrapS = convertAddressModeToGLTF(sampler.addressModeU);
  const wrapT = convertAddressModeToGLTF(sampler.addressModeV);
  const magFilter = convertFilterModeToGLTF(sampler.magFilter);
  const minFilter = convertMinFilterToGLTF(sampler.minFilter, sampler.mipmapFilter);

  return {
    ...(wrapS !== undefined ? {wrapS} : {}),
    ...(wrapT !== undefined ? {wrapT} : {}),
    ...(magFilter !== undefined ? {magFilter} : {}),
    ...(minFilter !== undefined ? {minFilter} : {})
  };
}

/** Converts a glTF wrap enum into a luma.gl address mode. */
function convertSamplerWrapMode(
  mode: number | undefined
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

function convertAddressModeToGLTF(addressMode: SamplerProps['addressModeU']): GLTFSampler['wrapS'] {
  switch (addressMode) {
    case 'clamp-to-edge':
      return GLEnum.CLAMP_TO_EDGE;
    case 'repeat':
      return GLEnum.REPEAT;
    case 'mirror-repeat':
      return GLEnum.MIRRORED_REPEAT;
    default:
      return undefined;
  }
}

function convertFilterModeToGLTF(filter: SamplerProps['magFilter']): GLTFSampler['magFilter'] {
  switch (filter) {
    case 'nearest':
      return GLEnum.NEAREST;
    case 'linear':
      return GLEnum.LINEAR;
    default:
      return undefined;
  }
}

function convertMinFilterToGLTF(
  minFilter: SamplerProps['minFilter'],
  mipmapFilter: SamplerProps['mipmapFilter']
): GLTFSampler['minFilter'] {
  if (!minFilter) {
    return undefined;
  }
  if (mipmapFilter === 'nearest') {
    return minFilter === 'nearest' ? GLEnum.NEAREST_MIPMAP_NEAREST : GLEnum.LINEAR_MIPMAP_NEAREST;
  }
  if (mipmapFilter === 'linear') {
    return minFilter === 'nearest' ? GLEnum.NEAREST_MIPMAP_LINEAR : GLEnum.LINEAR_MIPMAP_LINEAR;
  }
  return minFilter === 'nearest' ? GLEnum.NEAREST : GLEnum.LINEAR;
}

/** Converts a glTF mag filter enum into a luma.gl mag filter. */
function convertSamplerMagFilter(mode: number | undefined): 'nearest' | 'linear' | undefined {
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
function convertSamplerMinFilter(mode: number | undefined): {
  minFilter?: 'nearest' | 'linear';
  mipmapFilter?: 'nearest' | 'linear';
} {
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
