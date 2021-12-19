// Inspired by webgpu samples at https://github.com/austinEng/webgpu-samples/blob/master/src/glslang.ts
// under BSD 3-clause license
/// <reference types="@webgpu/types" />
import {Texture, TextureProps, Sampler, SamplerProps, assert} from '@luma.gl/api';
import type WebGPUDevice from '../webgpu-device';
import WebGPUSampler from './webgpu-sampler';

export default class WebGPUTexture extends Texture {
  readonly device: WebGPUDevice;
  readonly handle: GPUTexture;
  sampler;

  // static async createFromImageURL(src, usage = 0) {
  //   const img = document.createElement('img');
  //   img.src = src;
  //   await img.decode();
  //   return WebGPUTexture.createFromImage(img, usage);
  // }

  // static createFromImage(img, usage = 0) {
  //   return new WebGPUTexture({width: img.width, height:img.height, usage}).setImage(image, usage);
  // }

  constructor(device: WebGPUDevice, props: TextureProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle || this.createHandle();
    this.sampler = null;
  }

  protected createHandle(): GPUTexture {
    if (typeof this.props.format === 'number') {
      throw new Error('number format');
    }
    return this.device.handle.createTexture({
      size: {
        width: this.props.width,
        height: this.props.height,
        depthOrArrayLayers: this.props.depth
      },
      format: this.props.format,
      usage: this.props.usage
    });
  }

  destroy(): void {
    this.handle.destroy();
  }

  setSampler(sampler: Sampler | SamplerProps): this {
    // We can accept a sampler instance
    if (!sampler || sampler instanceof WebGPUSampler) {
      this.sampler = sampler;
    }

    // Or a set of props
    const samplerProps = sampler;
    this.sampler = new WebGPUSampler(this.device, samplerProps);
    return this;
  }
  /*

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

  setImage(img, usage): this {
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = img.width;
    imageCanvas.height = img.height;

    const imageCanvasContext = imageCanvas.getContext('2d');
    imageCanvasContext.translate(0, img.height);
    imageCanvasContext.scale(1, -1);
    imageCanvasContext.drawImage(img, 0, 0, img.width, img.height);
    const imageData = imageCanvasContext.getImageData(0, 0, img.width, img.height);

    this.setImageData(imageData, usage);
    return this;
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
  */
}