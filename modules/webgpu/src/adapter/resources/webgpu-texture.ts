// luma.gl, MIT license
import type {
  // Device,
  TextureProps,
  TextureViewProps,
  Sampler,
  SamplerProps,
  // TextureFormat,
  // TextureCubeFace,
  // ExternalImage,
  // TextureLevelData,
  Texture1DData,
  Texture2DData,
  Texture3DData,
  TextureCubeData,
  TextureArrayData,
  TextureCubeArrayData
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

  override height: number = 1;
  override width: number = 1;

  sampler: WebGPUSampler;
  view: WebGPUTextureView;

  // static async createFromImageURL(src, usage = 0) {
  //   const img = document.createElement('img');
  //   img.src = src;
  //   await img.decode();
  //   return WebGPUTexture(img, usage);
  // }

  constructor(device: WebGPUDevice, props: TextureProps) {
    super(device, props);

    this.device = device;

    if (props.data instanceof Promise) {
      props.data.then(resolvedImageData => {
        // @ts-expect-error
        this.props = {...this.props, data: resolvedImageData};
        this.initialize(this.props);
      });
      return;
    }

    this.initialize(props);
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

    if (this.props.data) {
      this.setData({data: this.props.data});
    }

    this.width = this.handle.width;
    this.height = this.handle.height;
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
        : new WebGPUSampler(this.device, props.sampler);

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

  setTexture1DData(data: Texture1DData): void {
    throw new Error('not implemented');
  }

  setTexture2DData(lodData: Texture2DData, depth?: number, target?: number): void {
    throw new Error('not implemented');
  }

  setTexture3DData(lodData: Texture3DData, depth?: number, target?: number): void {
    throw new Error('not implemented');
  }

  setTextureCubeData(data: TextureCubeData, depth?: number): void {
    throw new Error('not implemented');
  }

  setTextureArrayData(data: TextureArrayData): void {
    throw new Error('not implemented');
  }

  setTextureCubeArrayData(data: TextureCubeArrayData): void {
    throw new Error('not implemented');
  }

  setData(options: {data: any}) {
    return this.setImage({source: options.data});
  }

  /** Set image */
  setImage(options: {
    source: ImageBitmap | HTMLCanvasElement | OffscreenCanvas;
    width?: number;
    height?: number;
    depth?: number;
    sourceX?: number;
    sourceY?: number;
    mipLevel?: number;
    x?: number;
    y?: number;
    z?: number;
    aspect?: 'all' | 'stencil-only' | 'depth-only';
    colorSpace?: 'srgb';
    premultipliedAlpha?: boolean;
  }): {width: number; height: number} {
    const {
      source,
      width = options.source.width,
      height = options.source.height,
      depth = 1,
      sourceX = 0,
      sourceY = 0,
      mipLevel = 0,
      x = 0,
      y = 0,
      z = 0,
      aspect = 'all',
      colorSpace = 'srgb',
      premultipliedAlpha = false
    } = options;

    // TODO - max out width

    this.device.handle.queue.copyExternalImageToTexture(
      // source: GPUImageCopyExternalImage
      {
        source,
        origin: [sourceX, sourceY]
      },
      // destination: GPUImageCopyTextureTagged
      {
        texture: this.handle,
        origin: [x, y, z],
        mipLevel,
        aspect,
        colorSpace,
        premultipliedAlpha
      },
      // copySize: GPUExtent3D
      [width, height, depth]
    );
    return {width, height};
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

  setData(data): this {
    const textureDataBuffer = this.device.handle.createBuffer({
      size: data.byteLength,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC,
      mappedAtCreation: true
    });
    new Uint8Array(textureDataBuffer.getMappedRange()).set(data);
    textureDataBuffer.unmap();

    this.setBuffer(textureDataBuffer);

    textureDataBuffer.destroy();
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
