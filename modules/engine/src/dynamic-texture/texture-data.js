import { isExternalImage, getExternalImageSize } from '@luma.gl/core';
/** Array of cube texture faces. @note: index in array is the face index */
// prettier-ignore
export const TEXTURE_CUBE_FACES = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];
/** Map of cube texture face names to face indexes */
// prettier-ignore
export const TEXTURE_CUBE_FACE_MAP = { '+X': 0, '-X': 1, '+Y': 2, '-Y': 3, '+Z': 4, '-Z': 5 };
/** Check if texture data is a typed array */
export function isTextureSliceData(data) {
    const typedArray = data?.data;
    return ArrayBuffer.isView(typedArray);
}
export function getFirstMipLevel(layer) {
    if (!layer)
        return null;
    return Array.isArray(layer) ? (layer[0] ?? null) : layer;
}
export function getTextureSizeFromData(props) {
    const { dimension, data } = props;
    if (!data) {
        return null;
    }
    switch (dimension) {
        case '1d': {
            const mipLevel = getFirstMipLevel(data);
            if (!mipLevel)
                return null;
            const { width } = getTextureMipLevelSize(mipLevel);
            return { width, height: 1 };
        }
        case '2d': {
            const mipLevel = getFirstMipLevel(data);
            return mipLevel ? getTextureMipLevelSize(mipLevel) : null;
        }
        case '3d':
        case '2d-array': {
            if (!Array.isArray(data) || data.length === 0)
                return null;
            const mipLevel = getFirstMipLevel(data[0]);
            return mipLevel ? getTextureMipLevelSize(mipLevel) : null;
        }
        case 'cube': {
            const face = Object.keys(data)[0] ?? null;
            if (!face)
                return null;
            const faceData = data[face];
            const mipLevel = getFirstMipLevel(faceData);
            return mipLevel ? getTextureMipLevelSize(mipLevel) : null;
        }
        case 'cube-array': {
            if (!Array.isArray(data) || data.length === 0)
                return null;
            const firstCube = data[0];
            const face = Object.keys(firstCube)[0] ?? null;
            if (!face)
                return null;
            const mipLevel = getFirstMipLevel(firstCube[face]);
            return mipLevel ? getTextureMipLevelSize(mipLevel) : null;
        }
        default:
            return null;
    }
}
function getTextureMipLevelSize(data) {
    if (isExternalImage(data)) {
        return getExternalImageSize(data);
    }
    if (typeof data === 'object' && 'width' in data && 'height' in data) {
        return { width: data.width, height: data.height };
    }
    throw new Error('Unsupported mip-level data');
}
/** Type guard: is a mip-level `TextureImageData` (vs ExternalImage) */
function isTextureImageData(data) {
    return (typeof data === 'object' &&
        data !== null &&
        'data' in data &&
        'width' in data &&
        'height' in data);
}
/** Resolve size for a single mip-level datum */
// function getTextureMipLevelSizeFromData(data: TextureMipLevelData): {
//   width: number;
//   height: number;
// } {
//   if (this.device.isExternalImage(data)) {
//     return this.device.getExternalImageSize(data);
//   }
//   if (this.isTextureImageData(data)) {
//     return {width: data.width, height: data.height};
//   }
//   // Fallback (should not happen with current types)
//   throw new Error('Unsupported mip-level data');
// }
/** Convert cube face label to depth index */
export function getCubeFaceIndex(face) {
    const idx = TEXTURE_CUBE_FACE_MAP[face];
    if (idx === undefined)
        throw new Error(`Invalid cube face: ${face}`);
    return idx;
}
/** Convert cube face label to texture slice index. Index can be used with `setTexture2DData()`. */
export function getCubeArrayFaceIndex(cubeIndex, face) {
    return 6 * cubeIndex + getCubeFaceIndex(face);
}
// ------------------ Upload helpers ------------------
/** Experimental: Set multiple mip levels (1D) */
export function getTexture1DSubresources(data) {
    // Not supported in WebGL; left explicit
    throw new Error('setTexture1DData not supported in WebGL.');
    // const subresources: TextureSubresource[] = [];
    // return subresources;
}
/** Normalize 2D layer payload into an array of mip-level items */
function _normalizeTexture2DData(data) {
    return Array.isArray(data) ? data : [data];
}
/** Experimental: Set multiple mip levels (2D), optionally at `z` (depth/array index) */
export function getTexture2DSubresources(slice, lodData) {
    const lodArray = _normalizeTexture2DData(lodData);
    const z = slice;
    const subresources = [];
    for (let mipLevel = 0; mipLevel < lodArray.length; mipLevel++) {
        const imageData = lodArray[mipLevel];
        if (isExternalImage(imageData)) {
            subresources.push({
                type: 'external-image',
                image: imageData,
                z,
                mipLevel
            });
        }
        else if (isTextureImageData(imageData)) {
            subresources.push({
                type: 'texture-data',
                data: imageData,
                z,
                mipLevel
            });
        }
        else {
            throw new Error('Unsupported 2D mip-level payload');
        }
    }
    return subresources;
}
/** 3D: multiple depth slices, each may carry multiple mip levels */
export function getTexture3DSubresources(data) {
    const subresources = [];
    for (let depth = 0; depth < data.length; depth++) {
        subresources.push(...getTexture2DSubresources(depth, data[depth]));
    }
    return subresources;
}
/** 2D array: multiple layers, each may carry multiple mip levels */
export function getTextureArraySubresources(data) {
    const subresources = [];
    for (let layer = 0; layer < data.length; layer++) {
        subresources.push(...getTexture2DSubresources(layer, data[layer]));
    }
    return subresources;
}
/** Cube: 6 faces, each may carry multiple mip levels */
export function getTextureCubeSubresources(data) {
    const subresources = [];
    for (const [face, faceData] of Object.entries(data)) {
        const faceDepth = getCubeFaceIndex(face);
        subresources.push(...getTexture2DSubresources(faceDepth, faceData));
    }
    return subresources;
}
/** Cube array: multiple cubes (faces×layers), each face may carry multiple mips */
export function getTextureCubeArraySubresources(data) {
    const subresources = [];
    data.forEach((cubeData, cubeIndex) => {
        for (const [face, faceData] of Object.entries(cubeData)) {
            const faceDepth = getCubeArrayFaceIndex(cubeIndex, face);
            subresources.push(...getTexture2DSubresources(faceDepth, faceData));
        }
    });
    return subresources;
}
