// luma.gl, MIT license
// Copyright (c) vis.gl contributors
import { Texture, Sampler, log } from '@luma.gl/core';
// import {loadImageBitmap} from '../application-utils/load-file';
import { uid } from '../utils/uid';
import { TEXTURE_CUBE_FACE_MAP, 
// Helpers
getTextureSizeFromData, getTexture1DSubresources, getTexture2DSubresources, getTexture3DSubresources, getTextureCubeSubresources, getTextureArraySubresources, getTextureCubeArraySubresources } from './texture-data';
import { generateMipmap } from './mipmaps';
/**
 * Dynamic Textures
 *
 * - Mipmaps - DynamicTexture can generate mipmaps for textures (WebGPU does not provide built-in mipmap generation).
 *
 * - Texture initialization and updates - complex textures (2d array textures, cube textures, 3d textures) need multiple images
 *   `DynamicTexture` provides an API that makes it easy to provide the required data.
 *
 * - Texture resizing - Textures are immutable in WebGPU, meaning that they cannot be resized after creation.
 *   DynamicTexture provides a `resize()` method that internally creates a new texture with the same parameters
 *   but a different size.
 *
 * - Async image data initialization - It is often very convenient to be able to initialize textures with promises
 *   returned by image or data loading functions, as it allows a callback-free linear style of programming.
 *
 * @note GPU Textures are quite complex objects, with many subresources and modes of usage.
 * The `DynamicTexture` class allows luma.gl to provide some support for working with textures
 * without accumulating excessive complexity in the core Texture class which is designed as an immutable nature of GPU resource.
 */
export class DynamicTexture {
    device;
    id;
    /** Props with defaults resolved (except `data` which is processed separately) */
    props;
    /** Created resources */
    _texture = null;
    _sampler = null;
    _view = null;
    /** Ready when GPU texture has been created and data (if any) uploaded */
    ready;
    isReady = false;
    destroyed = false;
    resolveReady = () => { };
    rejectReady = () => { };
    get texture() {
        if (!this._texture)
            throw new Error('Texture not initialized yet');
        return this._texture;
    }
    get sampler() {
        if (!this._sampler)
            throw new Error('Sampler not initialized yet');
        return this._sampler;
    }
    get view() {
        if (!this._view)
            throw new Error('View not initialized yet');
        return this._view;
    }
    get [Symbol.toStringTag]() {
        return 'DynamicTexture';
    }
    toString() {
        return `DynamicTexture:"${this.id}":${this.texture.width}x${this.texture.height}px:(${this.isReady ? 'ready' : 'loading...'})`;
    }
    constructor(device, props) {
        this.device = device;
        const id = uid('dynamic-texture');
        // NOTE: We avoid holding on to data to make sure it can be garbage collected.
        const originalPropsWithAsyncData = props;
        this.props = { ...DynamicTexture.defaultProps, id, ...props, data: null };
        this.id = this.props.id;
        this.ready = new Promise((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
        });
        this.initAsync(originalPropsWithAsyncData);
    }
    /** @note Fire and forget; caller can await `ready` */
    async initAsync(originalPropsWithAsyncData) {
        try {
            // TODO - Accept URL string for 2D: turn into ExternalImage promise
            // const dataProps =
            //   typeof props.data === 'string' && (props.dimension ?? '2d') === '2d'
            //     ? ({dimension: '2d', data: loadImageBitmap(props.data)} as const)
            //     : {};
            const propsWithSyncData = await this._loadAllData(originalPropsWithAsyncData);
            this._checkNotDestroyed();
            // Deduce size when not explicitly provided
            // TODO - what about depth?
            const deduceSize = () => {
                if (this.props.width && this.props.height) {
                    return { width: this.props.width, height: this.props.height };
                }
                const size = getTextureSizeFromData(propsWithSyncData);
                if (size) {
                    return size;
                }
                return { width: this.props.width || 1, height: this.props.height || 1 };
            };
            const size = deduceSize();
            if (!size || size.width <= 0 || size.height <= 0) {
                throw new Error(`${this} size could not be determined or was zero`);
            }
            // Create a minimal TextureProps and validate via `satisfies`
            const baseTextureProps = {
                ...this.props,
                ...size,
                mipLevels: 1, // temporary; updated below
                data: undefined
            };
            if (this.device.type === 'webgpu' && this.props.mipmaps) {
                const requiredUsage = this.props.dimension === '3d'
                    ? Texture.SAMPLE | Texture.STORAGE | Texture.COPY_DST | Texture.COPY_SRC
                    : Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC;
                baseTextureProps.usage |= requiredUsage;
            }
            // Compute mip levels (auto clamps to max)
            const maxMips = this.device.getMipLevelCount(baseTextureProps.width, baseTextureProps.height);
            const desired = this.props.mipLevels === 'auto'
                ? maxMips
                : Math.max(1, Math.min(maxMips, this.props.mipLevels ?? 1));
            const finalTextureProps = { ...baseTextureProps, mipLevels: desired };
            this._texture = this.device.createTexture(finalTextureProps);
            this._sampler = this.texture.sampler;
            this._view = this.texture.view;
            // Upload data if provided
            if (propsWithSyncData.data) {
                switch (propsWithSyncData.dimension) {
                    case '1d':
                        this.setTexture1DData(propsWithSyncData.data);
                        break;
                    case '2d':
                        this.setTexture2DData(propsWithSyncData.data);
                        break;
                    case '3d':
                        this.setTexture3DData(propsWithSyncData.data);
                        break;
                    case '2d-array':
                        this.setTextureArrayData(propsWithSyncData.data);
                        break;
                    case 'cube':
                        this.setTextureCubeData(propsWithSyncData.data);
                        break;
                    case 'cube-array':
                        this.setTextureCubeArrayData(propsWithSyncData.data);
                        break;
                    default: {
                        throw new Error(`Unhandled dimension ${propsWithSyncData.dimension}`);
                    }
                }
            }
            if (this.props.mipmaps) {
                this.generateMipmaps();
            }
            this.isReady = true;
            this.resolveReady(this.texture);
            log.info(0, `${this} created`)();
        }
        catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            this.rejectReady(err);
            throw err;
        }
    }
    destroy() {
        if (this._texture) {
            this._texture.destroy();
            this._texture = null;
            this._sampler = null;
            this._view = null;
        }
        this.destroyed = true;
    }
    generateMipmaps() {
        if (this.device.type === 'webgl') {
            this.texture.generateMipmapsWebGL();
        }
        else if (this.device.type === 'webgpu') {
            generateMipmap(this.device, this.texture);
        }
        else {
            log.warn(`${this} mipmaps not supported on ${this.device.type}`);
        }
    }
    /** Set sampler or create one from props */
    setSampler(sampler = {}) {
        this._checkReady();
        const s = sampler instanceof Sampler ? sampler : this.device.createSampler(sampler);
        this.texture.setSampler(s);
        this._sampler = s;
    }
    /**
     * Resize by cloning the underlying immutable texture.
     * Does not copy contents; caller may need to re-upload and/or regenerate mips.
     */
    resize(size) {
        this._checkReady();
        if (size.width === this.texture.width && size.height === this.texture.height) {
            return false;
        }
        const prev = this.texture;
        this._texture = prev.clone(size);
        this._sampler = this.texture.sampler;
        this._view = this.texture.view;
        prev.destroy();
        log.info(`${this} resized`);
        return true;
    }
    /** Convert cube face label to texture slice index. Index can be used with `setTexture2DData()`. */
    getCubeFaceIndex(face) {
        const index = TEXTURE_CUBE_FACE_MAP[face];
        if (index === undefined)
            throw new Error(`Invalid cube face: ${face}`);
        return index;
    }
    /** Convert cube face label to texture slice index. Index can be used with `setTexture2DData()`. */
    getCubeArrayFaceIndex(cubeIndex, face) {
        return 6 * cubeIndex + this.getCubeFaceIndex(face);
    }
    /** @note experimental: Set multiple mip levels (1D) */
    setTexture1DData(data) {
        this._checkReady();
        if (this.texture.props.dimension !== '1d') {
            throw new Error(`${this} is not 1d`);
        }
        const subresources = getTexture1DSubresources(data);
        this._setTextureSubresources(subresources);
    }
    /** @note experimental: Set multiple mip levels (2D), optionally at `z`, slice (depth/array level) index */
    setTexture2DData(lodData, z = 0) {
        this._checkReady();
        if (this.texture.props.dimension !== '2d') {
            throw new Error(`${this} is not 2d`);
        }
        const subresources = getTexture2DSubresources(z, lodData);
        this._setTextureSubresources(subresources);
    }
    /** 3D: multiple depth slices, each may carry multiple mip levels */
    setTexture3DData(data) {
        if (this.texture.props.dimension !== '3d') {
            throw new Error(`${this} is not 3d`);
        }
        const subresources = getTexture3DSubresources(data);
        this._setTextureSubresources(subresources);
    }
    /** 2D array: multiple layers, each may carry multiple mip levels */
    setTextureArrayData(data) {
        if (this.texture.props.dimension !== '2d-array') {
            throw new Error(`${this} is not 2d-array`);
        }
        const subresources = getTextureArraySubresources(data);
        this._setTextureSubresources(subresources);
    }
    /** Cube: 6 faces, each may carry multiple mip levels */
    setTextureCubeData(data) {
        if (this.texture.props.dimension !== 'cube') {
            throw new Error(`${this} is not cube`);
        }
        const subresources = getTextureCubeSubresources(data);
        this._setTextureSubresources(subresources);
    }
    /** Cube array: multiple cubes (faces×layers), each face may carry multiple mips */
    setTextureCubeArrayData(data) {
        if (this.texture.props.dimension !== 'cube-array') {
            throw new Error(`${this} is not cube-array`);
        }
        const subresources = getTextureCubeArraySubresources(data);
        this._setTextureSubresources(subresources);
    }
    /** Sets multiple mip levels on different `z` slices (depth/array index) */
    _setTextureSubresources(subresources) {
        // If user supplied multiple mip levels, warn if auto-mips also requested
        // if (lodArray.length > 1 && this.props.mipmaps !== false) {
        //   log.warn(
        //     `Texture ${this.id}: provided multiple LODs and also requested mipmap generation.`
        //   )();
        // }
        for (const subresource of subresources) {
            const { z, mipLevel } = subresource;
            switch (subresource.type) {
                case 'external-image':
                    const { image, flipY } = subresource;
                    this.texture.copyExternalImage({ image, z, mipLevel, flipY });
                    break;
                case 'texture-data':
                    const { data } = subresource;
                    // TODO - we are throwing away some of the info in data.
                    // Did we not need it in the first place? Can we use it to validate?
                    this.texture.writeData(getAlignedUploadData(this.texture, data), {
                        x: 0,
                        y: 0,
                        z,
                        width: data.width,
                        height: data.height,
                        depthOrArrayLayers: 1,
                        mipLevel
                    });
                    break;
                default:
                    throw new Error('Unsupported 2D mip-level payload');
            }
        }
    }
    // ------------------ helpers ------------------
    /** Recursively resolve all promises in data structures */
    async _loadAllData(props) {
        const syncData = await awaitAllPromises(props.data);
        const dimension = (props.dimension ?? '2d');
        return { dimension, data: syncData ?? null };
    }
    _checkNotDestroyed() {
        if (this.destroyed) {
            log.warn(`${this} already destroyed`);
        }
    }
    _checkReady() {
        if (!this.isReady) {
            log.warn(`${this} Cannot perform this operation before ready`);
        }
    }
    static defaultProps = {
        ...Texture.defaultProps,
        dimension: '2d',
        data: null,
        mipmaps: false
    };
}
function getAlignedUploadData(texture, data) {
    const { width, height, data: uploadData } = data;
    const { bytesPerPixel } = texture.device.getTextureFormatInfo(texture.format);
    const bytesPerRow = width * bytesPerPixel;
    const alignedBytesPerRow = Math.ceil(bytesPerRow / texture.byteAlignment) * texture.byteAlignment;
    if (alignedBytesPerRow === bytesPerRow) {
        return uploadData;
    }
    const sourceBytes = new Uint8Array(uploadData.buffer, uploadData.byteOffset, uploadData.byteLength);
    const paddedBytes = new Uint8Array(alignedBytesPerRow * height);
    for (let row = 0; row < height; row++) {
        const sourceOffset = row * bytesPerRow;
        const destinationOffset = row * alignedBytesPerRow;
        paddedBytes.set(sourceBytes.subarray(sourceOffset, sourceOffset + bytesPerRow), destinationOffset);
    }
    return paddedBytes;
}
// HELPERS
/** Resolve all promises in a nested data structure */
async function awaitAllPromises(x) {
    x = await x;
    if (Array.isArray(x)) {
        return await Promise.all(x.map(awaitAllPromises));
    }
    if (x && typeof x === 'object' && x.constructor === Object) {
        const object = x;
        const values = await Promise.all(Object.values(object));
        const keys = Object.keys(object);
        const resolvedObject = {};
        for (let i = 0; i < keys.length; i++) {
            resolvedObject[keys[i]] = values[i];
        }
        return resolvedObject;
    }
    return x;
}
// /** @note experimental: Set multiple mip levels (2D), optionally at `z`, slice (depth/array level) index */
// setTexture2DData(lodData: Texture2DData, z: number = 0): void {
//   this._checkReady();
//   const lodArray = this._normalizeTexture2DData(lodData);
//   // If user supplied multiple mip levels, warn if auto-mips also requested
//   if (lodArray.length > 1 && this.props.mipmaps !== false) {
//     log.warn(
//       `Texture ${this.id}: provided multiple LODs and also requested mipmap generation.`
//     )();
//   }
//   for (let mipLevel = 0; mipLevel < lodArray.length; mipLevel++) {
//     const imageData = lodArray[mipLevel];
//     if (this.device.isExternalImage(imageData)) {
//       this.texture.copyExternalImage({image: imageData, z, mipLevel, flipY: true});
//     } else if (this._isTextureImageData(imageData)) {
//       this.texture.copyImageData({data: imageData.data, z, mipLevel});
//     } else {
//       throw new Error('Unsupported 2D mip-level payload');
//     }
//   }
// }
// /** Normalize 2D layer payload into an array of mip-level items */
// private _normalizeTexture2DData(data: Texture2DData): (TextureImageData | ExternalImage)[] {
//   return Array.isArray(data) ? data : [data];
// }
