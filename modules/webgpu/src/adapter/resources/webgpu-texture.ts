// luma.gl, MIT license
import {
  type TextureFormat,
  type TextureProps,
  type TextureViewProps,
  type CopyExternalImageOptions,
  type CopyImageDataOptions,
  type TextureReadOptions,
  type TextureWriteOptions,
  type SamplerProps,
  Buffer,
  Texture,
  getTextureMemoryLayout,
  log
} from '@luma.gl/core';

import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import type {WebGPUDevice} from '../webgpu-device';
import {WebGPUSampler} from './webgpu-sampler';
import {WebGPUTextureView} from './webgpu-texture-view';

// Move to core/texture

export class WebGPUTexture extends Texture {
  readonly device: WebGPUDevice;
  readonly handle: GPUTexture;
  sampler: WebGPUSampler;
  view: WebGPUTextureView;

  constructor(device: WebGPUDevice, props: TextureProps) {
    super(device, props);
    this.device = device;

    if (this.dimension === 'cube') {
      this.depth = 6;
    }

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
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} constructor: ${error.message}`), this)();
      this.device.debug();
    });
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} out of memory: ${error.message}`), this)();
      this.device.debug();
    });

    // Update props if external handle was supplied - used mainly by CanvasContext.getDefaultFramebuffer()
    // TODO - Read all properties directly from the supplied handle?
    if (this.props.handle) {
      this.handle.label ||= this.id;
      this.width = this.handle.width;
      this.height = this.handle.height;
    }

    this.sampler =
      props.sampler instanceof WebGPUSampler
        ? props.sampler
        : new WebGPUSampler(this.device, (props.sampler as SamplerProps) || {});

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

  override destroy(): void {
    this.handle?.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }

  createView(props: TextureViewProps): WebGPUTextureView {
    return new WebGPUTextureView(this.device, {...props, texture: this});
  }

  copyExternalImage(options_: CopyExternalImageOptions): {width: number; height: number} {
    const options = this._normalizeCopyExternalImageOptions(options_);

    this.device.pushErrorScope('validation');
    this.device.handle.queue.copyExternalImageToTexture(
      // source: GPUImageCopyExternalImage
      {
        source: options.image,
        origin: [options.sourceX, options.sourceY],
        flipY: options.flipY
      },
      // destination: GPUImageCopyTextureTagged
      {
        texture: this.handle,
        origin: [options.x, options.y, options.depth],
        mipLevel: options.mipLevel,
        aspect: options.aspect,
        colorSpace: options.colorSpace,
        premultipliedAlpha: options.premultipliedAlpha
      },
      // copySize: GPUExtent3D
      [options.width, options.height, 0] // options.depth
    );
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`copyExternalImage: ${error.message}`), this)();
      this.device.debug();
    });

    // TODO - should these be clipped to the texture size minus x,y,z?
    return {width: options.width, height: options.height};
  }

  copyImageData(options_: CopyImageDataOptions): void {
    const {width, height, depth} = this;
    const options = this._normalizeCopyImageDataOptions(options_);
    this.device.pushErrorScope('validation');
    this.device.handle.queue.writeTexture(
      // destination: GPUImageCopyTexture
      {
        // texture subresource
        texture: this.handle,
        mipLevel: options.mipLevel,
        aspect: options.aspect,
        // origin to write to
        origin: [options.x, options.y, options.z]
      },
      // data
      options.data,
      // dataLayout: GPUImageDataLayout
      {
        offset: options.byteOffset,
        bytesPerRow: options.bytesPerRow,
        rowsPerImage: options.rowsPerImage
      },
      // size: GPUExtent3D - extents of the content to write
      [width, height, depth]
    );
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`copyImageData: ${error.message}`), this)();
      this.device.debug();
    });
  }

  override generateMipmapsWebGL(): void {
    log.warn(`${this}: generateMipmaps not supported in WebGPU`)();
  }

  override _getRowByteAlignment(format: TextureFormat): number {
    // WebGPU requires row width to be a multiple of 256 bytes
    return 256;
  }

  getImageDataLayout(options: TextureReadOptions): {
    byteLength: number;
    bytesPerRow: number;
    rowsPerImage: number;
  } {
    return {
      byteLength: 0,
      bytesPerRow: 0,
      rowsPerImage: 0
    };
  }

  override readBuffer(options: TextureReadOptions = {}, buffer?: Buffer): Buffer {
    const {
      x = 0,
      y = 0,
      z = 0,
      width = this.width,
      height = this.height,
      depthOrArrayLayers = this.depth,
      mipLevel = 0,
      aspect = 'all'
    } = options;

    const layout = this.getMemoryLayout(options);

    const {bytesPerRow, rowsPerImage, byteLength} = layout;

    // Create a GPUBuffer to hold the copied pixel data.
    const readBuffer =
      buffer ||
      this.device.createBuffer({
        byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
    const gpuReadBuffer = readBuffer.handle as GPUBuffer;

    // Record commands to copy from the texture to the buffer.
    const gpuDevice = this.device.handle;

    this.device.pushErrorScope('validation');
    const commandEncoder = gpuDevice.createCommandEncoder();
    commandEncoder.copyTextureToBuffer(
      // source
      {
        texture: this.handle,
        origin: {x, y, z},
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
      }
    );

    // Submit the command.
    const commandBuffer = commandEncoder.finish();
    this.device.handle.queue.submit([commandBuffer]);
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} readBuffer: ${error.message}`), this)();
      this.device.debug();
    });

    return readBuffer;
  }

  override async readDataAsync(options: TextureReadOptions = {}): Promise<ArrayBuffer> {
    const buffer = this.readBuffer(options);
    const data = await buffer.readAsync();
    buffer.destroy();
    return data.buffer as ArrayBuffer;
  }

  override writeBuffer(buffer: Buffer, options: TextureWriteOptions = {}) {
    const {
      x = 0,
      y = 0,
      z = 0,
      width = this.width,
      height = this.height,
      depthOrArrayLayers = this.depth,
      mipLevel = 0,
      aspect = 'all'
    } = options;

    const layout = this.getMemoryLayout(options);

    // Get the data on the CPU.
    // await buffer.mapAndReadAsync();

    const {bytesPerRow, rowsPerImage} = layout;

    const gpuDevice = this.device.handle;

    this.device.pushErrorScope('validation');
    const commandEncoder = gpuDevice.createCommandEncoder();
    commandEncoder.copyBufferToTexture(
      {
        buffer: buffer.handle as GPUBuffer,
        offset: 0,
        bytesPerRow,
        rowsPerImage
      },
      {
        texture: this.handle,
        origin: {x, y, z},
        mipLevel,
        aspect
      },
      {width, height, depthOrArrayLayers}
    );
    const commandBuffer = commandEncoder.finish();
    this.device.handle.queue.submit([commandBuffer]);
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} writeBuffer: ${error.message}`), this)();
      this.device.debug();
    });
  }

  override writeData(data: ArrayBuffer | ArrayBufferView, options: TextureWriteOptions = {}): void {
    const device = this.device;

    const {
      x = 0,
      y = 0,
      z = 0,
      width = this.width,
      height = this.height,
      depthOrArrayLayers = this.depth,
      mipLevel = 0,
      aspect = 'all'
    } = options;

    const layout = getTextureMemoryLayout({
      textureWidth: this.width,
      rows: this.height,
      bytesPerPixel: 4,
      depthOrArrayLayers: this.depth,
      byteAlignment: this._getRowByteAlignment(this.format)
    });

    const {bytesPerRow, rowsPerImage} = layout;

    this.device.pushErrorScope('validation');
    device.handle.queue.writeTexture(
      {
        texture: this.handle,
        mipLevel,
        aspect,
        origin: {x, y, z}
      },
      data,
      {
        offset: 0,
        bytesPerRow,
        rowsPerImage
      },
      {width, height, depthOrArrayLayers}
    );
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} writeData: ${error.message}`), this)();
      this.device.debug();
    });
  }
}
