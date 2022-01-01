// SAMPLER FILTERS
import {SamplerParameters} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLSamplerParameters} from '../../types/webgl';
import {convertCompareFunction} from './device-parameters';

// TODO depends on extension
// props[GL.TEXTURE_MAX_ANISOTROPY] = props.maxAnisotropy;

/**
 * Convert WebGPU-style sampler props to WebGL
 * @param props
 * @returns
 */
export function convertSamplerParametersToWebGL(props: SamplerParameters): WebGLSamplerParameters {
  const params: Record<number, number> = {};
  if (props.addressModeU) {
    params[GL.TEXTURE_WRAP_S] = convertAddressMode(props.addressModeU);
  }
  if (props.addressModeV) {
    params[GL.TEXTURE_WRAP_T] = convertAddressMode(props.addressModeV);
  }
  if (props.addressModeW) {
    params[GL.TEXTURE_WRAP_R] = convertAddressMode(props.addressModeW);
  }
  if (props.magFilter) {
    params[GL.TEXTURE_MAG_FILTER] = convertMaxFilterMode(props.magFilter);
  }
  if (props.minFilter || props.mipmapFilter) {
    // TODO - arbitrary choice of linear?
    params[GL.TEXTURE_MIN_FILTER] = convertMinFilterMode(props.minFilter || 'linear', props.mipmapFilter || 'linear');
  }
  if (props.lodMinClamp !== undefined) {
    params[GL.TEXTURE_MIN_LOD] = props.lodMinClamp;
  }
  if (props.lodMaxClamp !== undefined) {
    params[GL.TEXTURE_MAX_LOD] = props.lodMaxClamp;
  }
  // TODO - not fully treated
  if (props.compare) {
    params[GL.TEXTURE_COMPARE_FUNC] = convertCompareFunction('', props.compare);
  }
  // Note depends on WebGL extension
  if (props.maxAnisotropy) {
    props[GL.TEXTURE_MAX_ANISOTROPY_EXT] = props.maxAnisotropy;
  }
  return params;
}

/** Convert address more */
function convertAddressMode(addressMode: 'clamp-to-edge' | 'repeat' | 'mirror-repeat'): number {
  switch (addressMode) {
    case 'clamp-to-edge': return GL.CLAMP_TO_EDGE;
    case 'repeat': return GL.REPEAT;
    case 'mirror-repeat': return GL.MIRRORED_REPEAT;
  }
}

function convertMaxFilterMode(filterMode: 'nearest' | 'linear'): number {
  switch (filterMode) {
    case 'nearest': return GL.NEAREST;
    case 'linear': return GL.LINEAR;
  }
}

/** WebGPU has separate min filter and mipmap filter, WebGL is combined */
function convertMinFilterMode(filterMode: 'nearest' | 'linear', mipmapFilterMode: 'nearest' | 'linear'): number {
  switch (filterMode) {
    case 'nearest': return mipmapFilterMode === 'nearest' ? GL.NEAREST_MIPMAP_NEAREST : GL.NEAREST_MIPMAP_LINEAR;
    case 'linear': return mipmapFilterMode === 'nearest' ? GL.LINEAR_MIPMAP_NEAREST : GL.LINEAR_MIPMAP_LINEAR;
  }
}

// Convert from WebGL to WebGPU

/**
 * Convert WebGL-style sampler props to WebGPU
 * @param props
 * @returns
 */
 export function convertToSamplerParameters(params: WebGLSamplerParameters): SamplerParameters {
  const props: SamplerParameters = {};
  if (params[GL.TEXTURE_WRAP_S]) {
    props.addressModeU = convertToAddressMode(params[GL.TEXTURE_WRAP_S]);
  }
  if (params[GL.TEXTURE_WRAP_T]) {
    props.addressModeV = convertToAddressMode(params[GL.TEXTURE_WRAP_T]);
  }
  if (params[GL.TEXTURE_WRAP_R]) {
    props.addressModeW = convertToAddressMode(params[GL.TEXTURE_WRAP_R]);
  }
  if (params[GL.TEXTURE_MAG_FILTER]) {
    props.magFilter = convertToMaxFilterMode(params[GL.TEXTURE_MAG_FILTER]);
  }
  if (params[GL.TEXTURE_MIN_FILTER]) {
    props.minFilter = convertToMinFilterMode(params[GL.TEXTURE_MIN_FILTER]);
  }
  if (params[GL.TEXTURE_MIN_FILTER]) {
    props.mipmapFilter = convertToMipmapFilterMode(params[GL.TEXTURE_MIN_FILTER]);
  }
  if (params[GL.TEXTURE_MIN_LOD]) {
    props.lodMinClamp = params[GL.TEXTURE_MIN_LOD];
  }
  if (params[GL.TEXTURE_MAX_LOD]) {
    props.lodMaxClamp = params[GL.TEXTURE_MAX_LOD];
  }
  // props = convertToCompareFunction('', params[GL.TEXTURE_COMPARE_FUNC]);
  // TODO depends on extension
  // props[GL.TEXTURE_MAX_ANISOTROPY] = props.maxAnisotropy;
  return props;
}

/** Convert address more */
function convertToAddressMode(addressMode: number): 'clamp-to-edge' | 'repeat' | 'mirror-repeat' {
  switch (addressMode) {
    case GL.CLAMP_TO_EDGE: return 'clamp-to-edge';
    case GL.REPEAT: return 'repeat';
    case GL.MIRRORED_REPEAT: return 'mirror-repeat';
  }
}

function convertToMaxFilterMode(filterMode: number): 'nearest' | 'linear' {
  switch (filterMode) {
    case GL.NEAREST: return 'nearest';
    case GL.LINEAR: return 'linear';
  }
}

/** WebGPU has separate min filter and mipmap filter, WebGL is combined */
function convertToMinFilterMode(filterMode: number): 'nearest' | 'linear' {
  switch (filterMode) {
    // TODO is this correct?
    case GL.NEAREST: return 'nearest';
    case GL.LINEAR: return 'linear';
    case GL.NEAREST_MIPMAP_NEAREST: return 'nearest';
    case GL.LINEAR_MIPMAP_NEAREST: return 'linear';
    case GL.NEAREST_MIPMAP_LINEAR: return 'nearest';
    case GL.LINEAR_MIPMAP_LINEAR: return 'linear';
  }
}

function convertToMipmapFilterMode(filterMode: number): 'nearest' | 'linear' {
  switch (filterMode) {
    // TODO is this correct?
    case GL.NEAREST: return 'nearest';
    case GL.LINEAR: return 'linear';
    case GL.NEAREST_MIPMAP_NEAREST: return 'nearest';
    case GL.LINEAR_MIPMAP_NEAREST: return 'nearest';
    case GL.NEAREST_MIPMAP_LINEAR: return 'linear';
    case GL.LINEAR_MIPMAP_LINEAR: return 'linear';
  }
}

/**
 * Override sampler settings that are not supported by Non-Power-of-Two textures in WebGL1.
*/
export function updateSamplerParametersForNPOT(parameters: WebGLSamplerParameters): WebGLSamplerParameters {
  const newParameters = {...parameters};
  if (parameters[GL.TEXTURE_MIN_FILTER] !== GL.NEAREST) {
    // log.warn(`texture: ${this} is Non-Power-Of-Two, forcing TEXTURE_MIN_FILTER to LINEAR`)();
    newParameters[GL.TEXTURE_MIN_FILTER] = GL.LINEAR;
  }
  // log.warn(`texture: ${this} is Non-Power-Of-Two, forcing TEXTURE_WRAP_S to CLAMP_TO_EDGE`)();
  newParameters[GL.TEXTURE_WRAP_S] = GL.CLAMP_TO_EDGE;
  newParameters[GL.TEXTURE_WRAP_T] = GL.CLAMP_TO_EDGE;
  return newParameters;
}
