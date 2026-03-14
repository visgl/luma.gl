// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
import { Sampler } from './sampler';
import { log } from '../../utils/log';
import { textureFormatDecoder } from '../../shadertypes/textures/texture-format-decoder';
const BASE_DIMENSIONS = {
    '1d': '1d',
    '2d': '2d',
    '2d-array': '2d',
    cube: '2d',
    'cube-array': '2d',
    '3d': '3d'
};
/**
 * Abstract Texture interface
 * Texture Object
 * https://gpuweb.github.io/gpuweb/#gputexture
 */
export class Texture extends Resource {
    /** The texture can be bound for use as a sampled texture in a shader */
    static SAMPLE = 0x04;
    /** The texture can be bound for use as a storage texture in a shader */
    static STORAGE = 0x08;
    /** The texture can be used as a color or depth/stencil attachment in a render pass */
    static RENDER = 0x10;
    /** The texture can be used as the source of a copy operation */
    static COPY_SRC = 0x01;
    /** he texture can be used as the destination of a copy or write operation */
    static COPY_DST = 0x02;
    /** @deprecated Use Texture.SAMPLE */
    static TEXTURE = 0x04;
    /** @deprecated Use Texture.RENDER */
    static RENDER_ATTACHMENT = 0x10;
    /** dimension of this texture */
    dimension;
    /** base dimension of this texture */
    baseDimension;
    /** format of this texture */
    format;
    /** width in pixels of this texture */
    width;
    /** height in pixels of this texture */
    height;
    /** depth of this texture */
    depth;
    /** mip levels in this texture */
    mipLevels;
    /** Rows are multiples of this length, padded with extra bytes if needed */
    byteAlignment;
    /** The ready promise is always resolved. It is provided for type compatibility with DynamicTexture. */
    ready = Promise.resolve(this);
    /** isReady is always true. It is provided for type compatibility with DynamicTexture. */
    isReady = true;
    /** "Time" of last update. Monotonically increasing timestamp. TODO move to DynamicTexture? */
    updateTimestamp;
    get [Symbol.toStringTag]() {
        return 'Texture';
    }
    toString() {
        return `Texture(${this.id},${this.format},${this.width}x${this.height})`;
    }
    /** Do not use directly. Create with device.createTexture() */
    constructor(device, props, backendProps) {
        props = Texture.normalizeProps(device, props);
        super(device, props, Texture.defaultProps);
        this.dimension = this.props.dimension;
        this.baseDimension = BASE_DIMENSIONS[this.dimension];
        this.format = this.props.format;
        // Size
        this.width = this.props.width;
        this.height = this.props.height;
        this.depth = this.props.depth;
        this.mipLevels = this.props.mipLevels;
        if (this.dimension === 'cube') {
            this.depth = 6;
        }
        // Calculate size, if not provided
        if (this.props.width === undefined || this.props.height === undefined) {
            if (device.isExternalImage(props.data)) {
                const size = device.getExternalImageSize(props.data);
                this.width = size?.width || 1;
                this.height = size?.height || 1;
            }
            else {
                this.width = 1;
                this.height = 1;
                if (this.props.width === undefined || this.props.height === undefined) {
                    log.warn(`${this} created with undefined width or height. This is deprecated. Use DynamicTexture instead.`)();
                }
            }
        }
        this.byteAlignment = backendProps?.byteAlignment || 1;
        // TODO - perhaps this should be set on async write completion?
        this.updateTimestamp = device.incrementTimestamp();
    }
    /**
     * Create a new texture with the same parameters and optionally a different size
     * @note Textures are immutable and cannot be resized after creation, but we can create a similar texture with the same parameters but a new size.
     * @note Does not copy contents of the texture
     */
    clone(size) {
        return this.device.createTexture({ ...this.props, ...size });
    }
    /** Set sampler props associated with this texture */
    setSampler(sampler) {
        this.sampler = sampler instanceof Sampler ? sampler : this.device.createSampler(sampler);
    }
    /**
     * Copy raw image data (bytes) into the texture.
     * @deprecated Use writeData()
     */
    copyImageData(options) {
        const { data, depth, ...writeOptions } = options;
        const normalizedWriteOptions = this._normalizeTextureWriteOptions({
            ...writeOptions,
            depthOrArrayLayers: writeOptions.depthOrArrayLayers ?? depth
        });
        this.writeData(data, normalizedWriteOptions);
    }
    /**
     * Calculates the memory layout of the texture, required when reading and writing data.
     * @return the memory layout of the texture, in particular bytesPerRow which includes required padding
     */
    computeMemoryLayout(options_ = {}) {
        const options = this._normalizeTextureReadOptions(options_);
        const { width = this.width, height = this.height, depthOrArrayLayers = this.depth } = options;
        const { format, byteAlignment } = this;
        // TODO - does the overriding above make sense?
        // return textureFormatDecoder.computeMemoryLayout(this);
        return textureFormatDecoder.computeMemoryLayout({
            format,
            width,
            height,
            depth: depthOrArrayLayers,
            byteAlignment
        });
    }
    /**
     * Read the contents of a texture into a GPU Buffer.
     * @returns A Buffer containing the texture data.
     *
     * @note The memory layout of the texture data is determined by the texture format and dimensions.
     * @note The application can call Texture.computeMemoryLayout() to compute the layout.
     * @note The application can call Buffer.readAsync()
     * @note If not supplied a buffer will be created and the application needs to call Buffer.destroy
     */
    readBuffer(options, buffer) {
        throw new Error('readBuffer not implemented');
    }
    /**
     * Reads data from a texture into an ArrayBuffer.
     * @returns An ArrayBuffer containing the texture data.
     *
     * @note The memory layout of the texture data is determined by the texture format and dimensions.
     * @note The application can call Texture.computeMemoryLayout() to compute the layout.
     */
    readDataAsync(options) {
        throw new Error('readBuffer not implemented');
    }
    /**
     * Writes an GPU Buffer into a texture.
     *
     * @param buffer - Source GPU buffer.
     * @param options - Destination subresource, extent, and source layout options.
     * @note The memory layout of the texture data is determined by the texture format and dimensions.
     * @note The application can call Texture.computeMemoryLayout() to compute the layout.
     */
    writeBuffer(buffer, options) {
        throw new Error('readBuffer not implemented');
    }
    /**
     * Writes an array buffer into a texture.
     *
     * @param data - Source texel data.
     * @param options - Destination subresource, extent, and source layout options.
     * @note The memory layout of the texture data is determined by the texture format and dimensions.
     * @note The application can call Texture.computeMemoryLayout() to compute the layout.
     */
    writeData(data, options) {
        throw new Error('readBuffer not implemented');
    }
    // IMPLEMENTATION SPECIFIC
    /**
     * WebGL can read data synchronously.
     * @note While it is convenient, the performance penalty is very significant
     */
    readDataSyncWebGL(options) {
        throw new Error('readDataSyncWebGL not available');
    }
    /** Generate mipmaps (WebGL only) */
    generateMipmapsWebGL() {
        throw new Error('generateMipmapsWebGL not available');
    }
    // HELPERS
    /** Ensure we have integer coordinates */
    static normalizeProps(device, props) {
        const newProps = { ...props };
        // Ensure we have integer coordinates
        const { width, height } = newProps;
        if (typeof width === 'number') {
            newProps.width = Math.max(1, Math.ceil(width));
        }
        if (typeof height === 'number') {
            newProps.height = Math.max(1, Math.ceil(height));
        }
        return newProps;
    }
    /** Initialize texture with supplied props */
    // eslint-disable-next-line max-statements
    _initializeData(data) {
        // Store opts for accessors
        if (this.device.isExternalImage(data)) {
            this.copyExternalImage({
                image: data,
                width: this.width,
                height: this.height,
                depth: this.depth,
                mipLevel: 0,
                x: 0,
                y: 0,
                z: 0,
                aspect: 'all',
                colorSpace: 'srgb',
                premultipliedAlpha: false,
                flipY: false
            });
        }
        else if (data) {
            this.copyImageData({
                data,
                // width: this.width,
                // height: this.height,
                // depth: this.depth,
                mipLevel: 0,
                x: 0,
                y: 0,
                z: 0,
                aspect: 'all'
            });
        }
    }
    _normalizeCopyImageDataOptions(options_) {
        const { data, depth, ...writeOptions } = options_;
        const options = this._normalizeTextureWriteOptions({
            ...writeOptions,
            depthOrArrayLayers: writeOptions.depthOrArrayLayers ?? depth
        });
        return { data, depth: options.depthOrArrayLayers, ...options };
    }
    _normalizeCopyExternalImageOptions(options_) {
        const optionsWithoutUndefined = Texture._omitUndefined(options_);
        const mipLevel = optionsWithoutUndefined.mipLevel ?? 0;
        const mipLevelSize = this._getMipLevelSize(mipLevel);
        const size = this.device.getExternalImageSize(options_.image);
        const options = {
            ...Texture.defaultCopyExternalImageOptions,
            ...mipLevelSize,
            ...size,
            ...optionsWithoutUndefined
        };
        // WebGL will error if we try to copy outside the bounds of the texture
        options.width = Math.min(options.width, mipLevelSize.width - options.x);
        options.height = Math.min(options.height, mipLevelSize.height - options.y);
        options.depth = Math.min(options.depth, mipLevelSize.depthOrArrayLayers - options.z);
        return options;
    }
    _normalizeTextureReadOptions(options_) {
        const optionsWithoutUndefined = Texture._omitUndefined(options_);
        const mipLevel = optionsWithoutUndefined.mipLevel ?? 0;
        const mipLevelSize = this._getMipLevelSize(mipLevel);
        const options = {
            ...Texture.defaultTextureReadOptions,
            ...mipLevelSize,
            ...optionsWithoutUndefined
        };
        // WebGL will error if we try to copy outside the bounds of the texture
        options.width = Math.min(options.width, mipLevelSize.width - options.x);
        options.height = Math.min(options.height, mipLevelSize.height - options.y);
        options.depthOrArrayLayers = Math.min(options.depthOrArrayLayers, mipLevelSize.depthOrArrayLayers - options.z);
        return options;
    }
    /**
     * Normalizes a texture read request and validates the color-only readback contract used by the
     * current texture read APIs. Supported dimensions are `2d`, `cube`, `cube-array`,
     * `2d-array`, and `3d`.
     *
     * @throws if the texture format, aspect, or dimension is not supported by the first-pass
     * color-read implementation.
     */
    _getSupportedColorReadOptions(options_) {
        const options = this._normalizeTextureReadOptions(options_);
        const formatInfo = textureFormatDecoder.getInfo(this.format);
        this._validateColorReadAspect(options);
        this._validateColorReadFormat(formatInfo);
        switch (this.dimension) {
            case '2d':
            case 'cube':
            case 'cube-array':
            case '2d-array':
            case '3d':
                return options;
            default:
                throw new Error(`${this} color readback does not support ${this.dimension} textures`);
        }
    }
    /** Validates that a read request targets the full color aspect of the texture. */
    _validateColorReadAspect(options) {
        if (options.aspect !== 'all') {
            throw new Error(`${this} color readback only supports aspect 'all'`);
        }
    }
    /** Validates that a read request targets an uncompressed color-renderable texture format. */
    _validateColorReadFormat(formatInfo) {
        if (formatInfo.compressed) {
            throw new Error(`${this} color readback does not support compressed formats (${this.format})`);
        }
        switch (formatInfo.attachment) {
            case 'color':
                return;
            case 'depth':
                throw new Error(`${this} color readback does not support depth formats (${this.format})`);
            case 'stencil':
                throw new Error(`${this} color readback does not support stencil formats (${this.format})`);
            case 'depth-stencil':
                throw new Error(`${this} color readback does not support depth-stencil formats (${this.format})`);
            default:
                throw new Error(`${this} color readback does not support format ${this.format}`);
        }
    }
    _normalizeTextureWriteOptions(options_) {
        const optionsWithoutUndefined = Texture._omitUndefined(options_);
        const mipLevel = optionsWithoutUndefined.mipLevel ?? 0;
        const mipLevelSize = this._getMipLevelSize(mipLevel);
        const options = {
            ...Texture.defaultTextureWriteOptions,
            ...mipLevelSize,
            ...optionsWithoutUndefined
        };
        options.width = Math.min(options.width, mipLevelSize.width - options.x);
        options.height = Math.min(options.height, mipLevelSize.height - options.y);
        options.depthOrArrayLayers = Math.min(options.depthOrArrayLayers, mipLevelSize.depthOrArrayLayers - options.z);
        const layout = textureFormatDecoder.computeMemoryLayout({
            format: this.format,
            width: options.width,
            height: options.height,
            depth: options.depthOrArrayLayers,
            byteAlignment: this.byteAlignment
        });
        const minimumBytesPerRow = layout.bytesPerPixel * options.width;
        options.bytesPerRow = optionsWithoutUndefined.bytesPerRow ?? layout.bytesPerRow;
        options.rowsPerImage = optionsWithoutUndefined.rowsPerImage ?? options.height;
        if (options.bytesPerRow < minimumBytesPerRow) {
            throw new Error(`bytesPerRow (${options.bytesPerRow}) must be at least ${minimumBytesPerRow} for ${this.format}`);
        }
        if (options.rowsPerImage < options.height) {
            throw new Error(`rowsPerImage (${options.rowsPerImage}) must be at least ${options.height} for ${this.format}`);
        }
        const bytesPerPixel = this.device.getTextureFormatInfo(this.format).bytesPerPixel;
        if (bytesPerPixel && options.bytesPerRow % bytesPerPixel !== 0) {
            throw new Error(`bytesPerRow (${options.bytesPerRow}) must be a multiple of bytesPerPixel (${bytesPerPixel}) for ${this.format}`);
        }
        return options;
    }
    _getMipLevelSize(mipLevel) {
        const width = Math.max(1, this.width >> mipLevel);
        const height = this.baseDimension === '1d' ? 1 : Math.max(1, this.height >> mipLevel);
        const depthOrArrayLayers = this.dimension === '3d' ? Math.max(1, this.depth >> mipLevel) : this.depth;
        return { width, height, depthOrArrayLayers };
    }
    static _omitUndefined(options) {
        return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
    }
    static defaultProps = {
        ...Resource.defaultProps,
        data: null,
        dimension: '2d',
        format: 'rgba8unorm',
        usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
        width: undefined,
        height: undefined,
        depth: 1,
        mipLevels: 1,
        samples: undefined,
        sampler: {},
        view: undefined
    };
    static defaultCopyDataOptions = {
        data: undefined,
        byteOffset: 0,
        bytesPerRow: undefined,
        rowsPerImage: undefined,
        width: undefined,
        height: undefined,
        depthOrArrayLayers: undefined,
        depth: 1,
        mipLevel: 0,
        x: 0,
        y: 0,
        z: 0,
        aspect: 'all'
    };
    /** Default options */
    static defaultCopyExternalImageOptions = {
        image: undefined,
        sourceX: 0,
        sourceY: 0,
        width: undefined,
        height: undefined,
        depth: 1,
        mipLevel: 0,
        x: 0,
        y: 0,
        z: 0,
        aspect: 'all',
        colorSpace: 'srgb',
        premultipliedAlpha: false,
        flipY: false
    };
    static defaultTextureReadOptions = {
        x: 0,
        y: 0,
        z: 0,
        width: undefined,
        height: undefined,
        depthOrArrayLayers: 1,
        mipLevel: 0,
        aspect: 'all'
    };
    static defaultTextureWriteOptions = {
        byteOffset: 0,
        bytesPerRow: undefined,
        rowsPerImage: undefined,
        x: 0,
        y: 0,
        z: 0,
        width: undefined,
        height: undefined,
        depthOrArrayLayers: 1,
        mipLevel: 0,
        aspect: 'all'
    };
}
