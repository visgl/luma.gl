// luma.gl, MIT license
// Copyright (c) vis.gl contributors
import { GL } from '@luma.gl/constants';
import { convertCompareFunction } from './device-parameters';
/**
 * Convert WebGPU-style sampler props to WebGL
 * @param props
 * @returns
 */
export function convertSamplerParametersToWebGL(props) {
    const params = {};
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
        params[GL.TEXTURE_MIN_FILTER] = convertMinFilterMode(props.minFilter || 'linear', props.mipmapFilter);
    }
    if (props.lodMinClamp !== undefined) {
        params[GL.TEXTURE_MIN_LOD] = props.lodMinClamp;
    }
    if (props.lodMaxClamp !== undefined) {
        params[GL.TEXTURE_MAX_LOD] = props.lodMaxClamp;
    }
    if (props.type === 'comparison-sampler') {
        // Setting prop.compare turns this into a comparison sampler
        params[GL.TEXTURE_COMPARE_MODE] = GL.COMPARE_REF_TO_TEXTURE;
    }
    if (props.compare) {
        params[GL.TEXTURE_COMPARE_FUNC] = convertCompareFunction('compare', props.compare);
    }
    // Note depends on WebGL extension
    if (props.maxAnisotropy) {
        params[GL.TEXTURE_MAX_ANISOTROPY_EXT] = props.maxAnisotropy;
    }
    return params;
}
/**
 * Override sampler settings that are not supported by Non-Power-of-Two textures in WebGL1.
 */
export function updateSamplerParametersForNPOT(parameters) {
    const newParameters = { ...parameters };
    if (parameters[GL.TEXTURE_MIN_FILTER] !== GL.NEAREST) {
        // log.warn(`texture: ${this} is Non-Power-Of-Two, forcing TEXTURE_MIN_FILTER to LINEAR`)();
        newParameters[GL.TEXTURE_MIN_FILTER] = GL.LINEAR;
    }
    // log.warn(`texture: ${this} is Non-Power-Of-Two, forcing TEXTURE_WRAP_S to CLAMP_TO_EDGE`)();
    newParameters[GL.TEXTURE_WRAP_S] = GL.CLAMP_TO_EDGE;
    newParameters[GL.TEXTURE_WRAP_T] = GL.CLAMP_TO_EDGE;
    return newParameters;
}
// HELPERS
/** Convert address more */
function convertAddressMode(addressMode) {
    switch (addressMode) {
        case 'clamp-to-edge':
            return GL.CLAMP_TO_EDGE;
        case 'repeat':
            return GL.REPEAT;
        case 'mirror-repeat':
            return GL.MIRRORED_REPEAT;
    }
}
function convertMaxFilterMode(maxFilter) {
    switch (maxFilter) {
        case 'nearest':
            return GL.NEAREST;
        case 'linear':
            return GL.LINEAR;
    }
}
/**
 * WebGPU has separate min filter and mipmap filter,
 * WebGL is combined and effectively offers 6 options
 */
function convertMinFilterMode(minFilter, mipmapFilter) {
    if (!mipmapFilter) {
        return convertMaxFilterMode(minFilter);
    }
    switch (minFilter) {
        case 'nearest':
            return mipmapFilter === 'nearest' ? GL.NEAREST_MIPMAP_NEAREST : GL.NEAREST_MIPMAP_LINEAR;
        case 'linear':
            return mipmapFilter === 'nearest' ? GL.LINEAR_MIPMAP_NEAREST : GL.LINEAR_MIPMAP_LINEAR;
    }
}
