// SAMPLER FILTERS
import {SamplerProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLSamplerParameters} from '../../types/webgl';
import {convertCompareFunction} from './set-device-parameters';

// TODO depends on extension
// props[GL.TEXTURE_MAX_ANISOTROPY] = props.maxAnisotropy;

/**
 * Convert WebGPU-style sampler props to WebGL
 * @param props
 * @returns
 */
export function convertSamplerPropsToWebGL(props: SamplerProps): WebGLSamplerParameters {
  const params: Record<number, number> = {};
  params[GL.TEXTURE_WRAP_S] = convertAddressMode(props.addressModeU);
  params[GL.TEXTURE_WRAP_T] = convertAddressMode(props.addressModeV);
  params[GL.TEXTURE_WRAP_R] = convertAddressMode(props.addressModeW);
  params[GL.TEXTURE_MAG_FILTER] = convertMaxFilterMode(props.magFilter);
  params[GL.TEXTURE_MIN_FILTER] = convertMinFilterMode(props.minFilter, props.mipmapFilter);
  params[GL.TEXTURE_MIN_LOD] = props.lodMinClamp;
  params[GL.TEXTURE_MAX_LOD] = props.lodMaxClamp;
  params[GL.TEXTURE_COMPARE_FUNC] = convertCompareFunction('', props.compare);
  // TODO depends on extension
  // props[GL.TEXTURE_MAX_ANISOTROPY] = props.maxAnisotropy;
  return params;
}

/** Convert address more */
function convertAddressMode(addressMode: 'clamp-to-edge' | 'repeat' | 'mirror-repeat'): number {
  switch (addressMode) {
    case 'clamp-to-edge': return GL.CLAMP_TO_EDGE;
    case 'repeat': return GL.REPEAT;
    case 'mirror-repeat': GL.MIRRORED_REPEAT;
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
    case 'linear': mipmapFilterMode === 'nearest' ? GL.LINEAR_MIPMAP_NEAREST : GL.LINEAR_MIPMAP_LINEAR;
  }
}
