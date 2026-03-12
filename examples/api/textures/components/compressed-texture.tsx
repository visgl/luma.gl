// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as React from 'react';

import {load, registerLoaders, selectLoader, fetchFile, type LoaderOptions} from '@loaders.gl/core';
import {
  BasisLoader,
  CompressedTextureLoader,
  CrunchWorkerLoader,
  GL_EXTENSIONS_CONSTANTS,
  selectSupportedBasisFormat
} from '@loaders.gl/textures';
import {ImageLoader, type ImageType} from '@loaders.gl/images';

import {type Device, type TextureFormat, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {type TextureSource} from '../textures-data';

const {
  COMPRESSED_RGB_S3TC_DXT1_EXT,
  COMPRESSED_RGBA_S3TC_DXT1_EXT,
  COMPRESSED_RGBA_S3TC_DXT3_EXT,
  COMPRESSED_RGBA_S3TC_DXT5_EXT,
  COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
  COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,
  COMPRESSED_RGB_ATC_WEBGL,
  COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
  COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL,
  COMPRESSED_RGB_ETC1_WEBGL,
  COMPRESSED_RGBA_ASTC_4X4_KHR,
  COMPRESSED_RGBA_ASTC_5X4_KHR,
  COMPRESSED_RGBA_ASTC_5X5_KHR,
  COMPRESSED_RGBA_ASTC_6X5_KHR,
  COMPRESSED_RGBA_ASTC_6X6_KHR,
  COMPRESSED_RGBA_ASTC_8X5_KHR,
  COMPRESSED_RGBA_ASTC_8X6_KHR,
  COMPRESSED_RGBA_ASTC_8X8_KHR,
  COMPRESSED_RGBA_ASTC_10X5_KHR,
  COMPRESSED_RGBA_ASTC_10X6_KHR,
  COMPRESSED_RGBA_ASTC_10X8_KHR,
  COMPRESSED_RGBA_ASTC_10X10_KHR,
  COMPRESSED_RGBA_ASTC_12X10_KHR,
  COMPRESSED_RGBA_ASTC_12X12_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR,
  COMPRESSED_R11_EAC,
  COMPRESSED_SIGNED_R11_EAC,
  COMPRESSED_RG11_EAC,
  COMPRESSED_SIGNED_RG11_EAC,
  COMPRESSED_RGB8_ETC2,
  COMPRESSED_RGBA8_ETC2_EAC,
  COMPRESSED_SRGB8_ETC2,
  COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
  COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  COMPRESSED_RED_RGTC1_EXT,
  COMPRESSED_SIGNED_RED_RGTC1_EXT,
  COMPRESSED_RED_GREEN_RGTC2_EXT,
  COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,
  COMPRESSED_SRGB_S3TC_DXT1_EXT,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
} = GL_EXTENSIONS_CONSTANTS;

const TEXTURES_BASE_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/textures/test/data/';
const LOADERS_GL_TEXTURES_LIBRARY_PATH = 'https://unpkg.com/@loaders.gl/textures@4.3.2/dist/libs/';

registerLoaders([BasisLoader, CompressedTextureLoader, ImageLoader]);

// TEXTURE SHADERS

const source = /* wgsl */ `\
@group(0) @binding(0) var uTexture: texture_2d<f32>;
@group(0) @binding(1) var uTextureSampler: sampler;

struct VertexInputs {
  @location(0) position: vec2<f32>,
}

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  outputs.position = vec4<f32>(inputs.position, 0.0, 1.0);
  outputs.uv = vec2<f32>(inputs.position.x * 0.5, -inputs.position.y * 0.5) + vec2<f32>(0.5, 0.5);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return vec4<f32>(textureSample(uTexture, uTextureSampler, inputs.uv).rgb, 1.0);
}
`;

const vs = `\
#version 300 es
precision highp float;

in vec2 position;

out vec2 uv;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  uv = vec2(position.x * .5, -position.y * .5) + vec2(.5, .5);
}
`;

const fs = `\
#version 300 es
precision highp float;

uniform sampler2D uTexture;

in vec2 uv;

out vec4 fragColor;

void main() {
  fragColor = vec4(texture(uTexture, uv).rgb, 1.);
}
`;

/** Create a reusable model */
export function createModel(device: Device): Model {
  const data = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
  const position = device.createBuffer({data});

  return new Model(device, {
    source,
    vs,
    fs,
    topology: 'triangle-strip',
    vertexCount: 4,
    bufferLayout: [{name: 'position', format: 'float32x2'}],
    attributes: {position}
  });
}

type CompressedTextureProps = {
  device: Device;
  canvas: HTMLCanvasElement;
  image: TextureSource;
  model: Model;
};

type TextureStat = {
  name: string;
  value: number | string;
  units: string;
};

type CompressedTextureState = {
  loadOptions: LoaderOptions;
  textureError: string | null;
  showStats: boolean;
  stats: TextureStat[];
  dataUrl: string | null;
};

type LoadedTextureData = {
  arrayBuffer: ArrayBuffer;
  length: number;
  src: string;
  useBasis: boolean;
};

type CompressedImageData = {
  data: Uint8Array;
  format: number;
  width: number;
  height: number;
  levelSize?: number;
};

type ImageDataLike = {
  data: Uint8Array;
  width: number;
  height: number;
};

export class CompressedTexture extends React.PureComponent<
  CompressedTextureProps,
  CompressedTextureState
> {
  constructor(props: CompressedTextureProps) {
    super(props);

    const loadOptions = this.getLoadOptions();

    this.state = {
      loadOptions,
      textureError: null,
      showStats: false,
      stats: [],
      dataUrl: null
    };
  }

  async componentDidMount() {
    const dataUrl = await this.getTextureDataUrl(this.props.device);
    this.setState({dataUrl});
  }

  getLoadOptions(): LoaderOptions {
    return {
      basis: {
        format: selectSupportedBasisFormat(),
        containerFormat: 'auto',
        worker: false,
        module: 'transcoder',
        libraryPath: LOADERS_GL_TEXTURES_LIBRARY_PATH
      },
      crunch: {
        worker: false,
        libraryPath: LOADERS_GL_TEXTURES_LIBRARY_PATH
      },
      'compressed-texture': {
        worker: false,
        libraryPath: LOADERS_GL_TEXTURES_LIBRARY_PATH
      }
    };
  }

  // eslint-disable-next-line max-statements
  async getTextureDataUrl(device: Device): Promise<string> {
    const {loadOptions} = this.state;
    const {canvas, model, image} = this.props;

    try {
      const {arrayBuffer, length, src, useBasis} = await this.getLoadedData(image);

      const options: LoaderOptions & {'compressed-texture'?: {useBasis: boolean}} = {
        ...loadOptions
      };
      if (useBasis) {
        options['compressed-texture'] = {
          ...(options['compressed-texture'] || {}),
          useBasis: true
        };
      }

      const loader =
        useBasis || src.endsWith('.basis')
          ? BasisLoader
          : ((await selectLoader(src, [
              CompressedTextureLoader,
              CrunchWorkerLoader,
              ImageLoader
            ])) as {id: string; name: string} | null);
      if (!loader) {
        throw new Error(`No texture loader found for ${src}`);
      }

      const result = await load(arrayBuffer, loader as never, options);

      this.addStat('File Size', Math.floor(length / 1024), 'Kb');

      switch (loader?.id) {
        case 'crunch':
        case 'compressed-texture':
          this.renderEmptyTexture(device, model);
          this.renderCompressedTexture(
            device,
            model,
            result as CompressedImageData[],
            loader.name,
            src
          );
          break;
        case 'image':
          this.renderEmptyTexture(device, model);
          this.renderImageTexture(device, model, result as ImageType);
          break;
        case 'basis': {
          const basisTextures = Array.isArray(result) ? (result[0] as CompressedImageData[]) : null;
          this.renderEmptyTexture(device, model);
          this.renderCompressedTexture(device, model, basisTextures || [], loader.name, src);
          break;
        }
        default:
          throw new Error('Unknown texture loader');
      }
    } catch (error) {
      this.renderEmptyTexture(device, model);
      this.setState({textureError: error instanceof Error ? error.message : String(error)});
    }

    return canvas.toDataURL();
  }

  async getLoadedData(image: TextureSource): Promise<LoadedTextureData> {
    let length = 0;
    let src = '';
    let useBasis = false;
    let arrayBuffer: ArrayBuffer;

    if (image instanceof File) {
      arrayBuffer = await image.arrayBuffer();
      length = image.size;
      src = image.name;
    } else {
      src = `${TEXTURES_BASE_URL}${image.src}`;
      const response = await fetchFile(src);
      arrayBuffer = await response.arrayBuffer();
      length = arrayBuffer.byteLength;
      useBasis = image.useBasis || false;
    }

    return {arrayBuffer, length, src, useBasis};
  }

  createCompressedTexture(device: Device, images: CompressedImageData[]): Texture {
    const baseLevel = images[0];
    const textureFormat = getTextureFormat(baseLevel.format);
    const uploadLevels = getCompressedTextureUploadLevels(device, textureFormat, images);
    const texture = device.createTexture({
      width: baseLevel.width,
      height: baseLevel.height,
      format: textureFormat,
      mipLevels: uploadLevels.length,
      usage: Texture.SAMPLE | Texture.COPY_DST
    });

    for (let mipLevel = 0; mipLevel < uploadLevels.length; mipLevel++) {
      const image = uploadLevels[mipLevel];
      texture.writeData(image.data, {
        width: image.width,
        height: image.height,
        mipLevel
      });
    }

    return texture;
  }

  renderEmptyTexture(device: Device, model: Model): Texture {
    const brownColor = new Uint8Array([68, 0, 0, 255]);
    const emptyTexture = device.createTexture({
      width: 1,
      height: 1,
      data: brownColor,
      mipmaps: true
    } as any);

    const renderPass = beginPreviewRenderPass(device);
    model.setBindings({uTexture: emptyTexture});
    model.draw(renderPass);
    renderPass.end();
    device.submit();

    // model.draw();
    return emptyTexture;
  }

  renderImageTexture(device: Device, model: Model, image: ImageType): void {
    const startTime = performance.now();
    const texture = device.createTexture({
      width: image.width,
      height: image.height,
      format: 'rgba8unorm'
    });

    if (device.isExternalImage(image)) {
      texture.copyExternalImage({
        image,
        width: image.width,
        height: image.height
      });
    } else if (isImageDataLike(image)) {
      texture.writeData(image.data, {
        width: image.width,
        height: image.height
      });
    } else {
      throw new Error('Unsupported image data returned by ImageLoader');
    }

    const renderPass = beginPreviewRenderPass(device);
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();
    device.submit();

    const uploadTime = performance.now() - startTime;

    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${image.width} x ${image.height}`);
    this.addStat(
      'Size in memory (Lvl 0)',
      Math.floor((image.width * image.height * 4) / 1024),
      'Kb'
    );
  }

  renderCompressedTexture(
    device: Device,
    model: Model,
    images: CompressedImageData[],
    loaderName: string,
    texturePath: string
  ): void {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }
    // We take the first image because it has main propeties of compressed image.
    const {format, width, height, levelSize} = images[0];
    const textureFormat = getTextureFormat(format);

    if (!isCompressedImageFormatSupported(device, format) || !device.isTextureFormatSupported(textureFormat)) {
      throw new Error(`${textureFormat} is not supported by your GPU (${getDeviceLabel(device)})`);
    }

    if (!isCompressedTextureRenderableOnDevice(device, textureFormat, width, height)) {
      throw new Error(
        `${textureFormat} cannot be previewed on ${device.type} at ${width} x ${height}`
      );
    }

    const startTime = performance.now();
    const texture = this.createCompressedTexture(device, images);

    const renderPass = beginPreviewRenderPass(device);
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();
    device.submit();

    const uploadTime = performance.now() - startTime;

    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${width} x ${height}`);
    if (levelSize) {
      this.addStat('Size in memory (Lvl 0)', Math.floor(levelSize / 1024), 'Kb');
    }
  }

  addStat(name: string, value: number | string, units = ''): void {
    const newStats = [...this.state.stats, {name, value, units}];
    this.setState({stats: newStats});
  }

  getTextureLabel(): string {
    const {image} = this.props;
    return image instanceof File ? image.name : image.format || image.name || image.src;
  }

  renderStats() {
    const {stats} = this.state;

    if (!stats.length) {
      return null;
    }

    const infoList = [];
    for (let index = 0; index < stats.length; index++) {
      infoList.push(
        <li key={index}>{`${stats[index].name}: ${stats[index].value}${stats[index].units}`}</li>
      );
    }
    return (
      <ul
        style={{
          position: 'absolute',
          transition: 'opacity 0.2s',
          top: 20,
          display: 'flex',
          flexFlow: 'column nowrap',
          alignItems: 'flex-start',
          padding: 10,
          opacity: this.state.showStats ? 0.8 : 0,
          backgroundColor: 'black',
          color: 'white',
          borderRadius: 5,
          minWidth: 200,
          listStyle: 'none',
          fontSize: 14
        }}
      >
        {infoList}
      </ul>
    );
  }

  render() {
    const {dataUrl, textureError} = this.state;
    const textureLabel = this.getTextureLabel();

    return dataUrl ? (
      <button
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          verticalAlign: 'top',
          height: 256,
          width: 256,
          border: '1px solid black',
          margin: '1em',
          position: 'relative',
          marginLeft: 0,
          backgroundImage: `url(${dataUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
        onMouseEnter={() => this.setState({showStats: true})}
        onMouseLeave={() => this.setState({showStats: false})}
      >
        {!textureError ? (
          <h1
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              margin: 0,
              color: 'white',
              fontSize: 16
            }}
          >
            {textureLabel}
          </h1>
        ) : (
          <h1 style={{color: 'red', fontSize: 16}}>{textureError}</h1>
        )}
        {this.renderStats()}
      </button>
    ) : null;
  }
}

function isImageDataLike(image: ImageType): image is ImageDataLike {
  return (
    typeof image === 'object' &&
    image !== null &&
    'data' in image &&
    ArrayBuffer.isView(image.data) &&
    'width' in image &&
    'height' in image
  );
}

function beginPreviewRenderPass(device: Device) {
  const framebuffer = device
    .getDefaultCanvasContext()
    .getCurrentFramebuffer({depthStencilFormat: false});

  return device.beginRenderPass({framebuffer});
}

function getTextureFormat(format: number): TextureFormat {
  switch (format) {
    case COMPRESSED_RGB_S3TC_DXT1_EXT:
      return 'bc1-rgb-unorm-webgl';
    case COMPRESSED_RGBA_S3TC_DXT1_EXT:
      return 'bc1-rgba-unorm';
    case COMPRESSED_RGBA_S3TC_DXT3_EXT:
      return 'bc2-rgba-unorm';
    case COMPRESSED_RGBA_S3TC_DXT5_EXT:
      return 'bc3-rgba-unorm';
    case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
      return 'pvrtc-rgb4unorm-webgl';
    case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
      return 'pvrtc-rgba4unorm-webgl';
    case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
      return 'pvrtc-rbg2unorm-webgl';
    case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
      return 'pvrtc-rgba2unorm-webgl';
    case COMPRESSED_RGB_ATC_WEBGL:
      return 'atc-rgb-unorm-webgl';
    case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
      return 'atc-rgba-unorm-webgl';
    case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
      return 'atc-rgbai-unorm-webgl';
    case COMPRESSED_RGB_ETC1_WEBGL:
      return 'etc1-rbg-unorm-webgl';
    case COMPRESSED_RGBA_ASTC_4X4_KHR:
      return 'astc-4x4-unorm';
    case COMPRESSED_RGBA_ASTC_5X4_KHR:
      return 'astc-5x4-unorm';
    case COMPRESSED_RGBA_ASTC_5X5_KHR:
      return 'astc-5x5-unorm';
    case COMPRESSED_RGBA_ASTC_6X5_KHR:
      return 'astc-6x5-unorm';
    case COMPRESSED_RGBA_ASTC_6X6_KHR:
      return 'astc-6x6-unorm';
    case COMPRESSED_RGBA_ASTC_8X5_KHR:
      return 'astc-8x5-unorm';
    case COMPRESSED_RGBA_ASTC_8X6_KHR:
      return 'astc-8x6-unorm';
    case COMPRESSED_RGBA_ASTC_8X8_KHR:
      return 'astc-8x8-unorm';
    case COMPRESSED_RGBA_ASTC_10X5_KHR:
      return 'astc-10x5-unorm';
    case COMPRESSED_RGBA_ASTC_10X6_KHR:
      return 'astc-10x6-unorm';
    case COMPRESSED_RGBA_ASTC_10X8_KHR:
      return 'astc-10x8-unorm';
    case COMPRESSED_RGBA_ASTC_10X10_KHR:
      return 'astc-10x10-unorm';
    case COMPRESSED_RGBA_ASTC_12X10_KHR:
      return 'astc-12x10-unorm';
    case COMPRESSED_RGBA_ASTC_12X12_KHR:
      return 'astc-12x12-unorm';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR:
      return 'astc-4x4-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR:
      return 'astc-5x4-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR:
      return 'astc-5x5-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR:
      return 'astc-6x5-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR:
      return 'astc-6x6-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR:
      return 'astc-8x5-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR:
      return 'astc-8x6-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR:
      return 'astc-8x8-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR:
      return 'astc-10x5-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR:
      return 'astc-10x6-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR:
      return 'astc-10x8-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR:
      return 'astc-10x10-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR:
      return 'astc-12x10-unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR:
      return 'astc-12x12-unorm-srgb';
    case COMPRESSED_R11_EAC:
      return 'eac-r11unorm';
    case COMPRESSED_SIGNED_R11_EAC:
      return 'eac-r11snorm';
    case COMPRESSED_RG11_EAC:
      return 'eac-rg11unorm';
    case COMPRESSED_SIGNED_RG11_EAC:
      return 'eac-rg11snorm';
    case COMPRESSED_RGB8_ETC2:
      return 'etc2-rgb8unorm';
    case COMPRESSED_RGBA8_ETC2_EAC:
      return 'etc2-rgba8unorm';
    case COMPRESSED_SRGB8_ETC2:
      return 'etc2-rgb8unorm-srgb';
    case COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:
      return 'etc2-rgba8unorm-srgb';
    case COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2:
      return 'etc2-rgb8a1unorm';
    case COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2:
      return 'etc2-rgb8a1unorm-srgb';
    case COMPRESSED_RED_RGTC1_EXT:
      return 'bc4-r-unorm';
    case COMPRESSED_SIGNED_RED_RGTC1_EXT:
      return 'bc4-r-snorm';
    case COMPRESSED_RED_GREEN_RGTC2_EXT:
      return 'bc5-rg-unorm';
    case COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT:
      return 'bc5-rg-snorm';
    case COMPRESSED_SRGB_S3TC_DXT1_EXT:
      return 'bc1-rgb-unorm-srgb-webgl';
    case COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT:
      return 'bc1-rgba-unorm-srgb';
    case COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT:
      return 'bc2-rgba-unorm-srgb';
    case COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT:
      return 'bc3-rgba-unorm-srgb';
    default:
      throw new Error(`No luma.gl texture format mapping for internal format ${format}`);
  }
}

function isCompressedImageFormatSupported(device: Device, format: number): boolean {
  switch (format) {
    case COMPRESSED_RGB_S3TC_DXT1_EXT:
    case COMPRESSED_RGBA_S3TC_DXT1_EXT:
    case COMPRESSED_RGBA_S3TC_DXT3_EXT:
    case COMPRESSED_RGBA_S3TC_DXT5_EXT:
    case COMPRESSED_SRGB_S3TC_DXT1_EXT:
    case COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT:
    case COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT:
    case COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT:
      return device.features.has('texture-compression-bc');

    case COMPRESSED_RED_RGTC1_EXT:
    case COMPRESSED_SIGNED_RED_RGTC1_EXT:
    case COMPRESSED_RED_GREEN_RGTC2_EXT:
    case COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT:
      return device.features.has('texture-compression-bc5-webgl');

    case COMPRESSED_RGBA_ASTC_4X4_KHR:
    case COMPRESSED_RGBA_ASTC_5X4_KHR:
    case COMPRESSED_RGBA_ASTC_5X5_KHR:
    case COMPRESSED_RGBA_ASTC_6X5_KHR:
    case COMPRESSED_RGBA_ASTC_6X6_KHR:
    case COMPRESSED_RGBA_ASTC_8X5_KHR:
    case COMPRESSED_RGBA_ASTC_8X6_KHR:
    case COMPRESSED_RGBA_ASTC_8X8_KHR:
    case COMPRESSED_RGBA_ASTC_10X5_KHR:
    case COMPRESSED_RGBA_ASTC_10X6_KHR:
    case COMPRESSED_RGBA_ASTC_10X8_KHR:
    case COMPRESSED_RGBA_ASTC_10X10_KHR:
    case COMPRESSED_RGBA_ASTC_12X10_KHR:
    case COMPRESSED_RGBA_ASTC_12X12_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR:
    case COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR:
      return device.features.has('texture-compression-astc');

    case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
    case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
    case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
    case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
      return device.features.has('texture-compression-pvrtc-webgl');

    case COMPRESSED_RGB_ETC1_WEBGL:
      return device.features.has('texture-compression-etc1-webgl');

    case COMPRESSED_RGB_ATC_WEBGL:
    case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
    case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
      return device.features.has('texture-compression-atc-webgl');

    default:
      return true;
  }
}

function isCompressedTextureRenderableOnDevice(
  device: Device,
  textureFormat: TextureFormat,
  width: number,
  height: number
): boolean {
  if (device.type !== 'webgpu') {
    return true;
  }

  const {blockWidth = 1, blockHeight = 1} = device.getTextureFormatInfo(textureFormat);
  return width % blockWidth === 0 && height % blockHeight === 0;
}

function getCompressedTextureUploadLevels(
  device: Device,
  textureFormat: TextureFormat,
  images: CompressedImageData[]
): CompressedImageData[] {
  if (device.type !== 'webgpu') {
    return images;
  }

  const {blockWidth = 1, blockHeight = 1} = device.getTextureFormatInfo(textureFormat);
  const uploadLevels: CompressedImageData[] = [];

  for (const image of images) {
    const isBlockAligned = image.width % blockWidth === 0 && image.height % blockHeight === 0;
    if (!isBlockAligned) {
      break;
    }
    uploadLevels.push(image);
  }

  return uploadLevels;
}

function getDeviceLabel(device: Device): string {
  const {vendor, renderer, gpu, gpuType, gpuArchitecture} = device.info;
  const normalizedVendor = vendor && vendor !== 'unknown' ? vendor : '';
  const normalizedArchitecture =
    gpuArchitecture && gpuArchitecture !== 'unknown' ? gpuArchitecture : '';
  const normalizedGpu = gpu && gpu !== 'unknown' ? gpu : '';
  const normalizedGpuType = gpuType && gpuType !== 'unknown' ? gpuType : '';

  const rendererChipMatch = renderer.match(
    /\b(Apple\s+[A-Za-z0-9]+|NVIDIA\s+[^,)]*|AMD\s+[^,)]*|Intel(?:\(R\))?\s+[^,)]*)\b/i
  );

  const shortRenderer = (rendererChipMatch?.[1] || renderer)
    .replace(/\bANGLE\b/gi, '')
    .replace(/\b(inc|corporation|technologies|renderer)\b/gi, '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const compactDeviceLabel =
    shortRenderer ||
    [normalizedVendor, normalizedArchitecture || normalizedGpu, normalizedGpuType]
      .filter(Boolean)
      .join(' ')
      .trim();

  return compactDeviceLabel || 'unknown';
}
