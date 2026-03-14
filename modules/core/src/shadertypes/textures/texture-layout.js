// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { textureFormatDecoder } from './texture-format-decoder';
export function getTextureImageView(arrayBuffer, memoryLayout, format, image = 0) {
    const formatInfo = textureFormatDecoder.getInfo(format);
    const bytesPerComponent = formatInfo.bytesPerPixel / formatInfo.components;
    const { bytesPerImage } = memoryLayout;
    const offset = bytesPerImage * image;
    const totalPixels = memoryLayout.bytesPerImage / bytesPerComponent;
    switch (format) {
        case 'rgba8unorm':
        case 'bgra8unorm':
        case 'rgba8uint':
            return new Uint8Array(arrayBuffer, offset, totalPixels);
        case 'r8unorm':
            return new Uint8Array(arrayBuffer, offset, totalPixels);
        case 'r16uint':
        case 'rgba16uint':
            return new Uint16Array(arrayBuffer, offset, totalPixels);
        case 'r32uint':
        case 'rgba32uint':
            return new Uint32Array(arrayBuffer, offset, totalPixels);
        case 'r32float':
            return new Float32Array(arrayBuffer, offset, totalPixels);
        case 'rgba16float':
            return new Uint16Array(arrayBuffer, offset, totalPixels); // 4 channels
        case 'rgba32float':
            return new Float32Array(arrayBuffer, offset, totalPixels);
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}
export function setTextureImageData(arrayBuffer, memoryLayout, format, data, image = 0) {
    const offset = 0; // memoryLayout.bytesPerImage * image;
    const totalPixels = memoryLayout.bytesPerImage / memoryLayout.bytesPerPixel;
    const subArray = data.subarray(0, totalPixels);
    const typedArray = getTextureImageView(arrayBuffer, memoryLayout, format, image);
    typedArray.set(subArray, offset);
}
