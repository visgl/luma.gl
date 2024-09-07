// luma.gl, MIT license
import type {
  // Device,
  TextureProps,
  TextureViewProps,
  Sampler,
  SamplerProps,
  CopyExternalImageOptions,
  CopyImageDataOptions
} from '@luma.gl/core';
import {Texture} from '@luma.gl/core';

import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import type {WebGPUDevice} from '../webgpu-device';
import {WebGPUSampler} from './webgpu-sampler';
import {WebGPUTextureView} from './webgpu-texture-view';

const BASE_DIMENSIONS: Record<string, '1d' | '2d' | '3d'> = {
  '1d': '1d',
  '2d': '2d',
  '2d-array': '2d',
  cube: '2d',
  'cube-array': '2d',
  '3d': '3d'
};

export class WebGPUTexture extends Texture {
  readonly device: WebGPUDevice;
  readonly handle: GPUTexture;

  sampler: WebGPUSampler;
  view: WebGPUTextureView;

  constructor(device: WebGPUDevice, props: TextureProps) {
    super(device, props);
    this.device = device;

    // Texture base class strips out the data prop, so we need to add it back in
    const propsWithData = {...this.props};
    if (props.data) {
      propsWithData.data = props.data;
    }

    this.initialize(propsWithData);
  }

  override destroy(): void {
    this.handle?.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }

  createView(props: TextureViewProps): WebGPUTextureView {
    return new WebGPUTextureView(this.device, {...props, texture: this});
  }

  protected initialize(props: TextureProps): void {
    // @ts-expect-error
    this.handle = this.props.handle || this.createHandle();
    this.handle.label ||= this.id;
    if (this.props.handle) {
      this.width = this.handle.width;
      this.height = this.handle.height;
    }

    if (this.props.data) {
      if (this.device.isExternalImage(this.props.data)) {
        this.copyExternalImage({image: this.props.data, flipY: this.props.flipY});
      } else {
        this.setData({data: this.props.data});
      }
    }

    // Why not just read all properties directly from the texture
    // this.depthOrArrayLayers = this.handle.depthOrArrayLayers;
    // this.mipLevelCount = this.handle.mipLevelCount;
    // this.sampleCount = this.handle.sampleCount;
    // this.dimension = this.handle.dimension;
    // this.format = this.handle.format;
    // this.usage = this.handle.usage;

    // Create a default sampler. This mimics the WebGL1 API where sampler props are stored on the texture
    // this.setSampler(props.sampler);
    this.sampler =
      props.sampler instanceof WebGPUSampler
        ? props.sampler
        : new WebGPUSampler(this.device, props.sampler || {});

    // TODO - To support texture arrays we need to create custom views...
    // But we are not ready to expose TextureViews to the public API.
    // @ts-expect-error

    this.view = new WebGPUTextureView(this.device, {...this.props, texture: this});
    // format: this.props.format,
    // dimension: this.props.dimension,
    // aspect = "all";
    // baseMipLevel: 0;
    // mipLevelCount;
    // baseArrayLayer = 0;
    // arrayLayerCount;
  }

  protected createHandle(): GPUTexture {
    // Deduce size from data - TODO this is a hack
    // @ts-expect-error
    const width = this.props.width || this.props.data?.width || 1;
    // @ts-expect-error
    const height = this.props.height || this.props.data?.height || 1;

    return this.device.handle.createTexture({
      label: this.id,
      size: {
        width,
        height,
        depthOrArrayLayers: this.depth
      },
      usage: this.props.usage || Texture.TEXTURE | Texture.COPY_DST,
      dimension: BASE_DIMENSIONS[this.dimension],
      format: getWebGPUTextureFormat(this.format),
      mipLevelCount: this.mipLevels,
      sampleCount: this.props.samples
    });
  }

  /** @deprecated - intention is to use the createView public API */
  createGPUTextureView(): GPUTextureView {
    return this.handle.createView({label: this.id});
  }

  /**
   * Set default sampler
   * Accept a sampler instance or set of props;
   */
  setSampler(sampler: Sampler | SamplerProps): this {
    this.sampler =
      sampler instanceof WebGPUSampler ? sampler : new WebGPUSampler(this.device, sampler);
    return this;
  }

  setData(options: {data: any}): {width: number; height: number} {
    if (ArrayBuffer.isView(options.data)) {
      const clampedArray = new Uint8ClampedArray(options.data.buffer);
      // TODO - pass through src data color space as ImageData Options?
      const image = new ImageData(clampedArray, this.width, this.height);
      return this.copyExternalImage({image});
    }

    throw new Error('Texture.setData: Use CommandEncoder to upload data to texture in WebGPU');
  }

  copyImageData(options: CopyImageDataOptions): void {
    const {width, height, depth} = this;
    const opts = {...Texture.defaultCopyDataOptions, width, height, depth, ...options};
    this.device.handle.queue.writeTexture(
      // destination: GPUImageCopyTexture
      {
        // texture subresource
        texture: this.handle,
        mipLevel: opts.mipLevel,
        aspect: opts.aspect,
        // origin to write to
        origin: [opts.x, opts.y, opts.z]
      },
      // data
      opts.data,
      // dataLayout: GPUImageDataLayout
      {
        offset: opts.byteOffset,
        bytesPerRow: opts.bytesPerRow,
        rowsPerImage: opts.rowsPerImage
      },
      // size: GPUExtent3D - extents of the content to write
      [opts.width, opts.height, opts.depth]
    );
  }

  copyExternalImage(options: CopyExternalImageOptions): {width: number; height: number} {
    const size = this.device.getExternalImageSize(options.image);
    const opts = {...Texture.defaultCopyExternalImageOptions, ...size, ...options};

    // TODO - apply max to width etc

    this.device.handle.queue.copyExternalImageToTexture(
      // source: GPUImageCopyExternalImage
      {
        source: opts.image,
        origin: [opts.sourceX, opts.sourceY],
        flipY: opts.flipY
      },
      // destination: GPUImageCopyTextureTagged
      {
        texture: this.handle,
        origin: [opts.x, opts.y, opts.z],
        mipLevel: opts.mipLevel,
        aspect: opts.aspect,
        colorSpace: opts.colorSpace,
        premultipliedAlpha: opts.premultipliedAlpha
      },
      // copySize: GPUExtent3D
      [opts.width, opts.height, opts.depth]
    );

    // TODO - should these be clipped to the texture size minus x,y,z?
    return {width: opts.width, height: opts.height};
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
