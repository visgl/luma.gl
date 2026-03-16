// luma.gl, MIT license
import {
  type TextureProps,
  type TextureViewProps,
  type CopyExternalImageOptions,
  type TextureReadOptions,
  type TextureWriteOptions,
  type SamplerProps,
  Buffer,
  Texture,
  log,
  textureFormatDecoder
} from '@luma.gl/core';

import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import type {WebGPUDevice} from '../webgpu-device';
import {WebGPUSampler} from './webgpu-sampler';
import {WebGPUTextureView} from './webgpu-texture-view';

/** WebGPU implementation of the luma.gl core Texture resource */
export class WebGPUTexture extends Texture {
  readonly device: WebGPUDevice;
  readonly handle: GPUTexture;
  sampler: WebGPUSampler;
  view: WebGPUTextureView;
  private _allocatedByteLength: number = 0;

  constructor(device: WebGPUDevice, props: TextureProps) {
    // WebGPU buffer copies use 256-byte row alignment. queue.writeTexture() can use tightly packed rows.
    super(device, props, {byteAlignment: 256});
    this.device = device;

    if (props.sampler instanceof WebGPUSampler) {
      this.sampler = props.sampler;
    } else if (props.sampler === undefined) {
      this.sampler = this.device.getDefaultSampler();
    } else {
      this.sampler = new WebGPUSampler(this.device, (props.sampler as SamplerProps) || {});
      this.attachResource(this.sampler);
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

    if (this.props.handle) {
      this.handle.label ||= this.id;
      // @ts-expect-error readonly
      this.width = this.handle.width;
      // @ts-expect-error readonly
      this.height = this.handle.height;
    }

    this.view = new WebGPUTextureView(this.device, {
      ...this.props,
      texture: this,
      mipLevelCount: this.mipLevels,
      // Note: arrayLayerCount controls the view of array textures, but does not apply to 3d texture depths
      arrayLayerCount: this.dimension !== '3d' ? this.depth : 1
    });
    this.attachResource(this.view);

    // Set initial data
    // Texture base class strips out the data prop from this.props, so we need to handle it here
    this._initializeData(props.data);

    this._allocatedByteLength = this.getAllocatedByteLength();

    if (!this.props.handle) {
      this.trackAllocatedMemory(this._allocatedByteLength, 'Texture');
    } else {
      this.trackReferencedMemory(this._allocatedByteLength, 'Texture');
    }
  }

  override destroy(): void {
    if (this.destroyed) {
      return;
    }

    if (!this.props.handle && this.handle) {
      this.trackDeallocatedMemory('Texture');
      this.handle.destroy();
    } else if (this.handle) {
      this.trackDeallocatedReferencedMemory('Texture');
    }

    this.destroyResource();
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
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`copyExternalImage: ${error.message}`), this)();
      this.device.debug();
    });

    // TODO - should these be clipped to the texture size minus x,y,z?
    return {width: options.width, height: options.height};
  }

  override generateMipmapsWebGL(): void {
    log.warn(`${this}: generateMipmaps not supported in WebGPU`)();
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
    const {x, y, z, width, height, depthOrArrayLayers, mipLevel, aspect} =
      this._getSupportedColorReadOptions(options);

    const layout = this.computeMemoryLayout({x, y, z, width, height, depthOrArrayLayers, mipLevel});

    const {bytesPerRow, rowsPerImage, byteLength} = layout;

    // Create a GPUBuffer to hold the copied pixel data.
    const readBuffer =
      buffer ||
      this.device.createBuffer({
        byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });

    if (readBuffer.byteLength < byteLength) {
      throw new Error(
        `${this} readBuffer target is too small (${readBuffer.byteLength} < ${byteLength})`
      );
    }

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

  override writeBuffer(buffer: Buffer, options_: TextureWriteOptions = {}) {
    const options = this._normalizeTextureWriteOptions(options_);
    const {
      x,
      y,
      z,
      width,
      height,
      depthOrArrayLayers,
      mipLevel,
      aspect,
      byteOffset,
      bytesPerRow,
      rowsPerImage
    } = options;

    const gpuDevice = this.device.handle;

    this.device.pushErrorScope('validation');
    const commandEncoder = gpuDevice.createCommandEncoder();
    commandEncoder.copyBufferToTexture(
      {
        buffer: buffer.handle as GPUBuffer,
        offset: byteOffset,
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

  override writeData(
    data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView,
    options_: TextureWriteOptions = {}
  ): void {
    const device = this.device;
    const options = this._normalizeTextureWriteOptions(options_);
    const {x, y, z, width, height, depthOrArrayLayers, mipLevel, aspect, byteOffset} = options;
    const source = data as GPUAllowSharedBufferSource;
    const formatInfo = this.device.getTextureFormatInfo(this.format);
    // queue.writeTexture() defaults to tightly packed rows, unlike WebGPU buffer copy paths.
    const packedSourceLayout = textureFormatDecoder.computeMemoryLayout({
      format: this.format,
      width,
      height,
      depth: depthOrArrayLayers,
      byteAlignment: 1
    });
    const bytesPerRow = options_.bytesPerRow ?? packedSourceLayout.bytesPerRow;
    const rowsPerImage = options_.rowsPerImage ?? packedSourceLayout.rowsPerImage;
    let copyWidth = width;
    let copyHeight = height;

    if (formatInfo.compressed) {
      const blockWidth = formatInfo.blockWidth || 1;
      const blockHeight = formatInfo.blockHeight || 1;
      copyWidth = Math.ceil(width / blockWidth) * blockWidth;
      copyHeight = Math.ceil(height / blockHeight) * blockHeight;
    }

    this.device.pushErrorScope('validation');
    device.handle.queue.writeTexture(
      {
        texture: this.handle,
        mipLevel,
        aspect,
        origin: {x, y, z}
      },
      source,
      {
        offset: byteOffset,
        bytesPerRow,
        rowsPerImage
      },
      {width: copyWidth, height: copyHeight, depthOrArrayLayers}
    );
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} writeData: ${error.message}`), this)();
      this.device.debug();
    });
  }

  /**
   * Internal-only hook for the cached CanvasContext/PresentationContext swapchain path.
   * Rebinds this handle-backed texture wrapper to the current per-frame canvas texture
   * without allocating a new luma.gl Texture or TextureView wrapper.
   */
  _reinitialize(handle: GPUTexture, props?: Partial<TextureProps>): void {
    const nextWidth = props?.width ?? handle.width ?? this.width;
    const nextHeight = props?.height ?? handle.height ?? this.height;
    const nextDepth = props?.depth ?? this.depth;
    const nextFormat = props?.format ?? this.format;
    const allocationMayHaveChanged =
      nextWidth !== this.width ||
      nextHeight !== this.height ||
      nextDepth !== this.depth ||
      nextFormat !== this.format;
    handle.label ||= this.id;

    // @ts-expect-error readonly
    this.handle = handle;
    // @ts-expect-error readonly
    this.width = nextWidth;
    // @ts-expect-error readonly
    this.height = nextHeight;

    if (props?.depth !== undefined) {
      // @ts-expect-error readonly
      this.depth = nextDepth;
    }
    if (props?.format !== undefined) {
      // @ts-expect-error readonly
      this.format = nextFormat;
    }

    this.props.handle = handle;
    if (props?.width !== undefined) {
      this.props.width = props.width;
    }
    if (props?.height !== undefined) {
      this.props.height = props.height;
    }
    if (props?.depth !== undefined) {
      this.props.depth = props.depth;
    }
    if (props?.format !== undefined) {
      this.props.format = props.format;
    }

    if (allocationMayHaveChanged) {
      const nextAllocation = this.getAllocatedByteLength();
      if (nextAllocation !== this._allocatedByteLength) {
        this._allocatedByteLength = nextAllocation;
        this.trackReferencedMemory(nextAllocation, 'Texture');
      }
    }
    this.view._reinitialize(this);
  }

}
