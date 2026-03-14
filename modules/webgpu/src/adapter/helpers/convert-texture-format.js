// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Ensure a texture format is WebGPU compatible */
export function getWebGPUTextureFormat(format) {
    if (format.includes('webgl')) {
        throw new Error('webgl-only format');
    }
    return format;
}
