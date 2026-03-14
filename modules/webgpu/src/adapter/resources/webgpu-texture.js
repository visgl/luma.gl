// luma.gl, MIT license
import { Buffer, Texture, log, textureFormatDecoder } from '@luma.gl/core';
import { getWebGPUTextureFormat } from '../helpers/convert-texture-format';
import { WebGPUSampler } from './webgpu-sampler';
import { WebGPUTextureView } from './webgpu-texture-view';
/** WebGPU implementation of the luma.gl core Texture resource */
export class WebGPUTexture extends Texture {
    device;
    handle;
    sampler;
    view;
    constructor(device, props) {
        super(device, props, { byteAlignment: 256 }); // WebGPU requires row width to be a multiple of 256 bytes
        this.device = device;
        this.device.pushErrorScope('out-of-memory');
        this.device.pushErrorScope('validation');
        this.handle =
            this.props.handle ||
                this.device.handle.createTexture({
                    label: this.id,
                    size: {
                        width: this.width,
                        height: this.height,
                        depthOrArrayLayers: this.depth
                    },
                    usage: this.props.usage || Texture.TEXTURE | Texture.COPY_DST,
                    dimension: this.baseDimension,
                    format: getWebGPUTextureFormat(this.format),
                    mipLevelCount: this.mipLevels,
                    sampleCount: this.props.samples
                });
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`${this} constructor: ${error.message}`), this)();
            this.device.debug();
        });
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`${this} out of memory: ${error.message}`), this)();
            this.device.debug();
        });
        // Update props if external handle was supplied - used mainly by CanvasContext.getDefaultFramebuffer()
        // TODO - Read all properties directly from the supplied handle?
        if (this.props.handle) {
            this.handle.label ||= this.id;
            // @ts-expect-error readonly
            this.width = this.handle.width;
            // @ts-expect-error readonly
            this.height = this.handle.height;
        }
        this.sampler =
            props.sampler instanceof WebGPUSampler
                ? props.sampler
                : new WebGPUSampler(this.device, props.sampler || {});
        this.view = new WebGPUTextureView(this.device, {
            ...this.props,
            texture: this,
            mipLevelCount: this.mipLevels,
            // Note: arrayLayerCount controls the view of array textures, but does not apply to 3d texture depths
            arrayLayerCount: this.dimension !== '3d' ? this.depth : 1
        });
        // Set initial data
        // Texture base class strips out the data prop from this.props, so we need to handle it here
        this._initializeData(props.data);
    }
    destroy() {
        this.handle?.destroy();
        // @ts-expect-error readonly
        this.handle = null;
    }
    createView(props) {
        return new WebGPUTextureView(this.device, { ...props, texture: this });
    }
    copyExternalImage(options_) {
        const options = this._normalizeCopyExternalImageOptions(options_);
        this.device.pushErrorScope('validation');
        this.device.handle.queue.copyExternalImageToTexture(
        // source: GPUImageCopyExternalImage
        {
            source: options.image,
            origin: [options.sourceX, options.sourceY],
            flipY: false // options.flipY
        }, 
        // destination: GPUImageCopyTextureTagged
        {
            texture: this.handle,
            origin: [options.x, options.y, options.z],
            mipLevel: options.mipLevel,
            aspect: options.aspect,
            colorSpace: options.colorSpace,
            premultipliedAlpha: options.premultipliedAlpha
        }, 
        // copySize: GPUExtent3D
        [options.width, options.height, options.depth] // depth is always 1 for 2D textures
        );
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`copyExternalImage: ${error.message}`), this)();
            this.device.debug();
        });
        // TODO - should these be clipped to the texture size minus x,y,z?
        return { width: options.width, height: options.height };
    }
    generateMipmapsWebGL() {
        log.warn(`${this}: generateMipmaps not supported in WebGPU`)();
    }
    getImageDataLayout(options) {
        return {
            byteLength: 0,
            bytesPerRow: 0,
            rowsPerImage: 0
        };
    }
    readBuffer(options = {}, buffer) {
        const { x, y, z, width, height, depthOrArrayLayers, mipLevel, aspect } = this._getSupportedColorReadOptions(options);
        const layout = this.computeMemoryLayout({ x, y, z, width, height, depthOrArrayLayers, mipLevel });
        const { bytesPerRow, rowsPerImage, byteLength } = layout;
        // Create a GPUBuffer to hold the copied pixel data.
        const readBuffer = buffer ||
            this.device.createBuffer({
                byteLength,
                usage: Buffer.COPY_DST | Buffer.MAP_READ
            });
        if (readBuffer.byteLength < byteLength) {
            throw new Error(`${this} readBuffer target is too small (${readBuffer.byteLength} < ${byteLength})`);
        }
        const gpuReadBuffer = readBuffer.handle;
        // Record commands to copy from the texture to the buffer.
        const gpuDevice = this.device.handle;
        this.device.pushErrorScope('validation');
        const commandEncoder = gpuDevice.createCommandEncoder();
        commandEncoder.copyTextureToBuffer(
        // source
        {
            texture: this.handle,
            origin: { x, y, z },
            // origin: [options.x, options.y, 0], // options.depth],
            mipLevel,
            aspect
            // colorSpace: options.colorSpace,
            // premultipliedAlpha: options.premultipliedAlpha
        }, 
        // destination
        {
            buffer: gpuReadBuffer,
            offset: 0,
            bytesPerRow,
            rowsPerImage
        }, 
        // copy size
        {
            width,
            height,
            depthOrArrayLayers
        });
        // Submit the command.
        const commandBuffer = commandEncoder.finish();
        this.device.handle.queue.submit([commandBuffer]);
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`${this} readBuffer: ${error.message}`), this)();
            this.device.debug();
        });
        return readBuffer;
    }
    async readDataAsync(options = {}) {
        const buffer = this.readBuffer(options);
        const data = await buffer.readAsync();
        buffer.destroy();
        return data.buffer;
    }
    writeBuffer(buffer, options_ = {}) {
        const options = this._normalizeTextureWriteOptions(options_);
        const { x, y, z, width, height, depthOrArrayLayers, mipLevel, aspect, byteOffset, bytesPerRow, rowsPerImage } = options;
        const gpuDevice = this.device.handle;
        this.device.pushErrorScope('validation');
        const commandEncoder = gpuDevice.createCommandEncoder();
        commandEncoder.copyBufferToTexture({
            buffer: buffer.handle,
            offset: byteOffset,
            bytesPerRow,
            rowsPerImage
        }, {
            texture: this.handle,
            origin: { x, y, z },
            mipLevel,
            aspect
        }, { width, height, depthOrArrayLayers });
        const commandBuffer = commandEncoder.finish();
        this.device.handle.queue.submit([commandBuffer]);
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`${this} writeBuffer: ${error.message}`), this)();
            this.device.debug();
        });
    }
    writeData(data, options_ = {}) {
        const device = this.device;
        const options = this._normalizeTextureWriteOptions(options_);
        const { x, y, z, width, height, depthOrArrayLayers, mipLevel, aspect, byteOffset, bytesPerRow: normalizedBytesPerRow, rowsPerImage: normalizedRowsPerImage } = options;
        const source = data;
        const formatInfo = this.device.getTextureFormatInfo(this.format);
        let bytesPerRow = normalizedBytesPerRow;
        let rowsPerImage = normalizedRowsPerImage;
        let copyWidth = width;
        let copyHeight = height;
        if (formatInfo.compressed) {
            const blockWidth = formatInfo.blockWidth || 1;
            const blockHeight = formatInfo.blockHeight || 1;
            const sourceLayout = textureFormatDecoder.computeMemoryLayout({
                format: this.format,
                width,
                height,
                depth: depthOrArrayLayers,
                byteAlignment: 1
            });
            bytesPerRow = options_.bytesPerRow ?? sourceLayout.bytesPerRow;
            rowsPerImage = options_.rowsPerImage ?? sourceLayout.rowsPerImage;
            copyWidth = Math.ceil(width / blockWidth) * blockWidth;
            copyHeight = Math.ceil(height / blockHeight) * blockHeight;
        }
        this.device.pushErrorScope('validation');
        device.handle.queue.writeTexture({
            texture: this.handle,
            mipLevel,
            aspect,
            origin: { x, y, z }
        }, source, {
            offset: byteOffset,
            bytesPerRow,
            rowsPerImage
        }, { width: copyWidth, height: copyHeight, depthOrArrayLayers });
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`${this} writeData: ${error.message}`), this)();
            this.device.debug();
        });
    }
}
