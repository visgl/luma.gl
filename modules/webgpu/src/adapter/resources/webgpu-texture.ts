// luma.gl, MIT license
import {Texture, TextureProps, Sampler, SamplerProps, assert} from '@luma.gl/api';
import type WebGPUDevice from '../webgpu-device';
import WebGPUSampler from './webgpu-sampler';

const BASE_DIMENSIONS: Record<string, '1d' | '2d' | '3d'> = {
  '1d': '1d',
  '2d': '2d',
  '2d-array': '2d',
  'cube': '2d',
  'cube-array': '2d',
  '3d': '3d'
};

export default class WebGPUTexture extends Texture {
  readonly device: WebGPUDevice;
  readonly handle: GPUTexture;
  readonly view: GPUTextureView;
  sampler: WebGPUSampler;

  // static async createFromImageURL(src, usage = 0) {
  //   const img = document.createElement('img');
  //   img.src = src;
  //   await img.decode();
  //   return WebGPUTexture(img, usage);
  // }

  constructor(device: WebGPUDevice, props: TextureProps) {
    super(device, props);

    if (typeof this.props.format === 'number') {
      throw new Error('number format');
    }

    this.device = device;
    this.handle = this.props.handle || this.createHandle();

    if (this.props.data) {
      this.setData({data: this.props.data}  );
    }

    // Create a default sampler. This mimics the WebGL1 API where sampler props are stored on the texture
    this.setSampler(props.sampler);

    // TODO - To support texture arrays we need to create custom views...
    // But we are not ready to expose TextureViews to the public API.
    this.view = this.handle.createView({
      // format: this.props.format,
      // dimension: this.props.dimension,
      // aspect = "all";
      // baseMipLevel: 0;
      // mipLevelCount;
      // baseArrayLayer = 0;
      // arrayLayerCount;
    });
  }

  protected createHandle(): GPUTexture {
    if (typeof this.props.format === 'number') {
      throw new Error('number format');
    }

    // Deduce size from data - TODO this is a hack
    // @ts-expect-error
    const width = this.props.width || this.props.data?.width || 1;
    // @ts-expect-error
    const height = this.props.height || this.props.data?.height || 1;

    return this.device.handle.createTexture({
      size: {
        width,
        height,
        depthOrArrayLayers: this.props.depth
      },
      dimension: BASE_DIMENSIONS[this.props.dimension],
      format: this.props.format,
      usage: this.props.usage,
      mipLevelCount: this.props.mipLevels,
      sampleCount: this.props.samples
    });
  }

  destroy(): void {
    this.handle.destroy();
  }

  /**
   * Set default sampler
   * Accept a sampler instance or set of props;
   */
  setSampler(sampler: Sampler | SamplerProps): this {
    this.sampler = sampler instanceof WebGPUSampler ? sampler : new WebGPUSampler(this.device, sampler);
    return this;
  }

  setData(options: {
    data: any;
  }) {
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
  }): this {
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
      [
        width,
        height,
        depth
      ]
    );
    return this;
  }

  /*
  async readPixels() {
    const readbackBuffer = device.createBuffer({
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
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
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
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
