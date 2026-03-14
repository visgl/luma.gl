// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { GL } from '@luma.gl/constants';
export function convertSampler(gltfSampler) {
    return {
        addressModeU: convertSamplerWrapMode(gltfSampler.wrapS),
        addressModeV: convertSamplerWrapMode(gltfSampler.wrapT),
        magFilter: convertSamplerMagFilter(gltfSampler.magFilter),
        ...convertSamplerMinFilter(gltfSampler.minFilter)
    };
}
function convertSamplerWrapMode(mode) {
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
function convertSamplerMagFilter(mode) {
    switch (mode) {
        case GL.NEAREST:
            return 'nearest';
        case GL.LINEAR:
            return 'linear';
        default:
            return undefined;
    }
}
function convertSamplerMinFilter(mode) {
    switch (mode) {
        case GL.NEAREST:
            return { minFilter: 'nearest' };
        case GL.LINEAR:
            return { minFilter: 'linear' };
        case GL.NEAREST_MIPMAP_NEAREST:
            return { minFilter: 'nearest', mipmapFilter: 'nearest' };
        case GL.LINEAR_MIPMAP_NEAREST:
            return { minFilter: 'linear', mipmapFilter: 'nearest' };
        case GL.NEAREST_MIPMAP_LINEAR:
            return { minFilter: 'nearest', mipmapFilter: 'linear' };
        case GL.LINEAR_MIPMAP_LINEAR:
            return { minFilter: 'linear', mipmapFilter: 'linear' };
        default:
            return {};
    }
}
