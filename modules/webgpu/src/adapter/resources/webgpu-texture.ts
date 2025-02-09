// luma.gl, MIT license
import type {
  TextureProps,
  TextureViewProps,
  CopyExternalImageOptions,
  CopyImageDataOptions
} from '@luma.gl/core';
import {Texture, log} from '@luma.gl/core';

import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import type {WebGPUDevice} from '../webgpu-device';
import {WebGPUSampler} from './webgpu-sampler';
import {WebGPUTextureView} from './webgpu-texture-view';

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

    this.device.handle.pushErrorScope('out-of-memory');
    this.device.handle.pushErrorScope('validation');

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
    this.device.handle.popErrorScope().then((error: GPUError | null) => {
      if (error) {
        this.device.reportError(new Error(`Texture validation failed: ${error.message}`), this)();
        this.device.debug();
      }
    });
    this.device.handle.popErrorScope().then((error: GPUError | null) => {
      if (error) {
        this.device.reportError(new Error(`Texture out of memory: ${error.message}`), this)();
        this.device.debug();
      }
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

  override destroy(): void {
    this.handle?.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }

  createView(props: TextureViewProps): WebGPUTextureView {
    return new WebGPUTextureView(this.device, {...props, texture: this});
  }

  copyImageData(options_: CopyImageDataOptions): void {
    const {width, height, depth} = this;
    const options = this._normalizeCopyImageDataOptions(options_);
    this.device.handle.pushErrorScope('validation');
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
    this.device.handle.popErrorScope().then((error: GPUError | null) => {
      if (error) {
        this.device.reportError(new Error(`copyImageData validation failed: ${error.message}`))();
        this.device.debug();
      }
    });
  }

  copyExternalImage(options_: CopyExternalImageOptions): {width: number; height: number} {
    const options = this._normalizeCopyExternalImageOptions(options_);

    this.device.handle.pushErrorScope('validation');
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
      [options.width, options.height, 1]
    );
    this.device.handle.popErrorScope().then((error: GPUError | null) => {
      if (error) {
        this.device.reportError(
          new Error(`copyExternalImage validation failed: ${error.message}`)
        )();
        this.device.debug();
      }
    });

    // TODO - should these be clipped to the texture size minus x,y,z?
    return {width: options.width, height: options.height};
  }

  override generateMipmapsWebGL(): void {
    log.warn(`${this}: generateMipmaps not supported in WebGPU`)();
  }

  // WebGPU specific

  /*
  async readPixels() {
    const readbackBuffer = device.createBuffer({
        usage: Buffer.COPY_DST | Buffer.MAP_READ,
        size: 4 * textureWidth * textureHeight,
    });

    // Copy data from the texture to the buffer.
    const encoder = device.createCommandEncoder();
    encoder.copyTextureToBuffer(
        { texture },
        { buffer, rowPitch: textureWidth * 4 },
        [textureWidth, textureHeight],
    );
    device.submit([encoder.finish()]);

    // Get the data on the CPU.
    await buffer.mapAsync(GPUMapMode.READ);
    saveScreenshot(buffer.getMappedRange());
    buffer.unmap();
  }

  setImageData(imageData, usage): this {
    let data = null;

    const bytesPerRow = Math.ceil((img.width * 4) / 256) * 256;
    if (bytesPerRow == img.width * 4) {
      data = imageData.data;
    } else {
      data = new Uint8Array(bytesPerRow * img.height);
      let imagePixelIndex = 0;
      for (let y = 0; y < img.height; ++y) {
        for (let x = 0; x < img.width; ++x) {
          const i = x * 4 + y * bytesPerRow;
          data[i] = imageData.data[imagePixelIndex];
          data[i + 1] = imageData.data[imagePixelIndex + 1];
          data[i + 2] = imageData.data[imagePixelIndex + 2];
          data[i + 3] = imageData.data[imagePixelIndex + 3];
          imagePixelIndex += 4;
        }
      }
    }
    return this;
  }

  setBuffer(textureDataBuffer, {bytesPerRow}): this {
    const commandEncoder = this.device.handle.createCommandEncoder();
    commandEncoder.copyBufferToTexture(
      {
        buffer: textureDataBuffer,
        bytesPerRow
      },
      {
        texture: this.handle
      },
      {
        width,
        height,
        depth
      }
    );

    this.device.handle.defaultQueue.submit([commandEncoder.finish()]);
    return this;
  }
  */
}
