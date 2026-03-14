// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as React from 'react';

import {load, registerLoaders, selectLoader, fetchFile, type LoaderOptions} from '@loaders.gl/core';
import {
  BASIS_EXTERNAL_LIBRARIES,
  BasisLoader,
  CRUNCH_EXTERNAL_LIBRARIES,
  CompressedTextureLoader,
  CrunchWorkerLoader,
  GL_EXTENSIONS_CONSTANTS
} from '@loaders.gl/textures';
import type {GPUTextureFormat} from '@loaders.gl/schema';
import {ImageLoader, type ImageType} from '@loaders.gl/images';

import {type Device, type TextureFormat, Texture, textureFormatDecoder} from '@luma.gl/core';
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
const BASIS_TRANSCODER_JS_URL = new URL(
  '../../../../node_modules/@loaders.gl/textures/dist/libs/basis_transcoder.js',
  import.meta.url
).href;
const BASIS_TRANSCODER_WASM_URL = new URL(
  '../../../../node_modules/@loaders.gl/textures/dist/libs/basis_transcoder.wasm',
  import.meta.url
).href;
const BASIS_ENCODER_JS_URL = new URL(
  '../../../../node_modules/@loaders.gl/textures/dist/libs/basis_encoder.js',
  import.meta.url
).href;
const BASIS_ENCODER_WASM_URL = new URL(
  '../../../../node_modules/@loaders.gl/textures/dist/libs/basis_encoder.wasm',
  import.meta.url
).href;
const CRUNCH_JS_URL = new URL(
  '../../../../node_modules/@loaders.gl/textures/dist/libs/crunch.js',
  import.meta.url
).href;

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
  loadOptions: TextureLoaderOptions;
  textureError: string | null;
  textureFormatLabel: string | null;
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
  format?: number;
  textureFormat?: string;
  width: number;
  height: number;
  levelSize?: number;
};

type ImageDataLike = {
  data: Uint8Array;
  width: number;
  height: number;
};

type SupportedCompressedTextureDevice = Device & {
  getSupportedCompressedTextureFormats(): string[];
};

type TextureLoaderOptions = LoaderOptions & {
  modules?: Record<string, string>;
  supportedTextureFormats?: GPUTextureFormat[];
  'compressed-texture'?: {
    useBasis?: boolean;
  };
};

export class CompressedTexture extends React.PureComponent<
  CompressedTextureProps,
  CompressedTextureState
> {
  constructor(props: CompressedTextureProps) {
    super(props);

    const loadOptions = this.getLoadOptions(props.device);

    this.state = {
      loadOptions,
      textureError: null,
      textureFormatLabel: null,
      showStats: false,
      stats: [],
      dataUrl: null
    };
  }

  async componentDidMount() {
    try {
      const dataUrl = await this.getTextureDataUrl(this.props.device);
      this.setState({dataUrl});
    } catch (error) {
      const {canvas, device, model} = this.props;
      this.renderEmptyTexture(device, model);
      this.setState({
        dataUrl: canvas.toDataURL(),
        textureError: error instanceof Error ? error.message : String(error),
        textureFormatLabel: null
      });
    }
  }

  componentDidUpdate(previousProps: CompressedTextureProps): void {
    if (previousProps.device !== this.props.device) {
      this.setState({loadOptions: this.getLoadOptions(this.props.device)});
    }
  }

  getLoadOptions(device: Device): TextureLoaderOptions {
    return {
      modules: {
        [BASIS_EXTERNAL_LIBRARIES.TRANSCODER]: BASIS_TRANSCODER_JS_URL,
        [BASIS_EXTERNAL_LIBRARIES.TRANSCODER_WASM]: BASIS_TRANSCODER_WASM_URL,
        [BASIS_EXTERNAL_LIBRARIES.ENCODER]: BASIS_ENCODER_JS_URL,
        [BASIS_EXTERNAL_LIBRARIES.ENCODER_WASM]: BASIS_ENCODER_WASM_URL,
        [CRUNCH_EXTERNAL_LIBRARIES.DECODER]: CRUNCH_JS_URL
      },
      supportedTextureFormats: getSupportedGPUTextureFormatFamilies(device),
      basis: {
        format: 'auto',
        containerFormat: 'auto',
        module: 'transcoder'
      },
      'compressed-texture': {}
    };
  }

  // eslint-disable-next-line max-statements
  async getTextureDataUrl(device: Device): Promise<string> {
    const {loadOptions} = this.state;
    const {canvas, model, image} = this.props;

    try {
      const {arrayBuffer, length, src, useBasis} = await this.getLoadedData(image);

      const options: TextureLoaderOptions = {
        ...loadOptions
      };
      const usesBasisLoader = useBasis || src.endsWith('.basis');

      if (useBasis) {
        options['compressed-texture'] = {
          ...(options['compressed-texture'] || {}),
          useBasis: true
        };
      }
      if (usesBasisLoader) {
        options.worker = false;
      }

      const loader = usesBasisLoader
        ? BasisLoader
        : ((await selectLoader(src, [
            CompressedTextureLoader,
            CrunchWorkerLoader,
            ImageLoader
          ])) as {id: string; name: string} | null);
      if (!loader) {
        throw new Error(`No texture loader found for ${src}`);
      }

      const result = usesBasisLoader
        ? await loadWithHandledBasisRuntimeRejections(() =>
            load(arrayBuffer, loader as never, options)
          )
        : await load(arrayBuffer, loader as never, options);

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
    const textureFormat = resolveCompressedTextureFormat(baseLevel);
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
      if (!canUploadCompressedTextureLevel(device, textureFormat, image)) {
        break;
      }
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
    const textureFormat = 'rgba8unorm';
    const levelZeroByteSize = image.width * image.height * 4;
    const texture = device.createTexture({
      width: image.width,
      height: image.height,
      format: textureFormat
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

    this.setState({textureFormatLabel: textureFormat});
    this.addStats([
      {name: 'Upload time', value: `${Math.floor(uploadTime)} ms`, units: ''},
      {name: 'luma.gl Texture Format', value: textureFormat, units: ''},
      {name: 'Dimensions', value: `${image.width} x ${image.height}`, units: ''},
      {name: 'Size in memory (Total)', value: formatTextureByteSize(levelZeroByteSize), units: ''},
      {name: 'Level 0', value: formatTextureByteSize(levelZeroByteSize), units: ''}
    ]);
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
    const {format, width, height} = images[0];
    const textureFormat = resolveCompressedTextureFormat(images[0]);

    if (
      (typeof format === 'number' && !isCompressedImageFormatSupported(device, format)) ||
      !device.isTextureFormatSupported(textureFormat)
    ) {
      throw new Error(`${textureFormat} is not supported by your GPU (${getDeviceLabel(device)})`);
    }

    const webgpuPreviewError = getCompressedTexturePreviewError(
      device,
      textureFormat,
      width,
      height
    );
    if (webgpuPreviewError) {
      throw new Error(webgpuPreviewError);
    }

    const startTime = performance.now();
    const uploadLevels = getCompressedTextureUploadLevels(device, textureFormat, images);
    const texture = this.createCompressedTexture(device, images);

    const renderPass = beginPreviewRenderPass(device);
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();
    device.submit();

    const uploadTime = performance.now() - startTime;
    const mipLevelStats = getCompressedTextureLevelStats(textureFormat, uploadLevels);

    this.setState({textureFormatLabel: textureFormat});
    this.addStats([
      {name: 'Upload time', value: `${Math.floor(uploadTime)} ms`, units: ''},
      {name: 'luma.gl Texture Format', value: textureFormat, units: ''},
      {name: 'Dimensions', value: `${width} x ${height}`, units: ''},
      {
        name: 'Size in memory (Total)',
        value: formatTextureByteSize(mipLevelStats.totalByteSize),
        units: ''
      },
      ...mipLevelStats.levels.map(level => ({
        name: `Level ${level.mipLevel}`,
        value: formatTextureByteSize(level.byteSize),
        units: ''
      }))
    ]);
  }

  addStat(name: string, value: number | string, units = ''): void {
    this.addStats([{name, value, units}]);
  }

  addStats(stats: TextureStat[]): void {
    this.setState(previousState => ({stats: [...previousState.stats, ...stats]}));
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
    const {dataUrl, textureError, textureFormatLabel} = this.state;
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
          <>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                padding: '2px 4px',
                background: 'rgba(0, 0, 0, 0.45)'
              }}
            >
              <h1
                style={{
                  margin: 0,
                  color: 'white',
                  fontSize: 16,
                  lineHeight: 1.1
                }}
              >
                {textureLabel}
              </h1>
              {textureFormatLabel ? (
                <div
                  style={{
                    color: 'white',
                    fontSize: 11,
                    lineHeight: 1.1,
                    fontFamily: 'monospace'
                  }}
                >
                  {textureFormatLabel}
                </div>
              ) : null}
            </div>
          </>
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

function getSupportedGPUTextureFormatFamilies(device: Device): GPUTextureFormat[] {
  const supportedFormats = new Set<GPUTextureFormat>();

  for (const textureFormat of (
    device as SupportedCompressedTextureDevice
  ).getSupportedCompressedTextureFormats()) {
    const gpuTextureFormat = getGPUTextureFormatFamily(textureFormat);
    if (gpuTextureFormat) {
      supportedFormats.add(gpuTextureFormat);
    }
  }

  return [...supportedFormats];
}

function formatTextureByteSize(byteSize: number): string {
  if (byteSize >= 1024 * 1024) {
    return `${(byteSize / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (byteSize >= 1024) {
    return `${(byteSize / 1024).toFixed(1)} KB`;
  }
  return `${byteSize} B`;
}

function getCompressedTextureLevelStats(
  textureFormat: TextureFormat,
  images: CompressedImageData[]
): {
  totalByteSize: number;
  levels: Array<{mipLevel: number; byteSize: number}>;
} {
  const levels = images.map((image, mipLevel) => {
    const levelByteSize =
      image.levelSize ??
      textureFormatDecoder.computeMemoryLayout({
        format: textureFormat,
        width: image.width,
        height: image.height,
        depth: 1,
        byteAlignment: 1
      }).byteLength;

    return {mipLevel, byteSize: levelByteSize};
  });

  const totalByteSize = levels.reduce((total, level) => total + level.byteSize, 0);

  return {totalByteSize, levels};
}

function getGPUTextureFormatFamily(textureFormat: string): GPUTextureFormat | null {
  if (textureFormat.startsWith('astc-')) {
    return 'astc';
  }
  if (textureFormat.startsWith('pvrtc-')) {
    return 'pvrtc';
  }
  if (textureFormat.startsWith('atc-')) {
    return 'atc';
  }
  if (textureFormat.startsWith('etc1-')) {
    return 'etc1';
  }
  if (textureFormat.startsWith('etc2-') || textureFormat.startsWith('eac-')) {
    return 'etc2';
  }
  if (textureFormat.startsWith('bc4-') || textureFormat.startsWith('bc5-')) {
    return 'rgtc';
  }
  if (
    textureFormat.startsWith('bc1-') ||
    textureFormat.startsWith('bc2-') ||
    textureFormat.startsWith('bc3-')
  ) {
    return textureFormat.includes('-srgb') ? 'dxt-srgb' : 'dxt';
  }

  return null;
}

function beginPreviewRenderPass(device: Device) {
  const framebuffer = device
    .getDefaultCanvasContext()
    .getCurrentFramebuffer({depthStencilFormat: false});

  return device.beginRenderPass({framebuffer});
}

async function loadWithHandledBasisRuntimeRejections<T>(loadTexture: () => Promise<T>): Promise<T> {
  if (typeof window === 'undefined') {
    return await loadTexture();
  }

  const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    if (isBasisRuntimeInitializationError(event.reason)) {
      event.preventDefault();
    }
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  try {
    const result = await loadTexture();
    await Promise.resolve();
    return result;
  } finally {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }
}

function isBasisRuntimeInitializationError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    errorMessage.includes('RuntimeError: null function') ||
    errorMessage.includes('LinkError: WebAssembly.instantiate()') ||
    errorMessage.includes('memory import has 256 pages') ||
    errorMessage.includes('Failed to asynchronously prepare wasm')
  );
}

function resolveCompressedTextureFormat(image: CompressedImageData): TextureFormat {
  if (image.textureFormat) {
    return image.textureFormat as TextureFormat;
  }

  if (typeof image.format === 'number') {
    return getTextureFormatFromInternalFormat(image.format);
  }

  throw new Error('Compressed texture level is missing both textureFormat and format');
}

function getTextureFormatFromInternalFormat(format: number): TextureFormat {
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
      throw new Error(
        `No luma.gl texture format mapping for internal format ${format}. This loader result should provide textureFormat and the example should use that first.`
      );
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

function getCompressedTextureUploadLevels(
  device: Device,
  textureFormat: TextureFormat,
  images: CompressedImageData[]
): CompressedImageData[] {
  if (device.type !== 'webgpu') {
    return images;
  }

  const uploadLevels: CompressedImageData[] = [];

  for (const image of images) {
    if (!canUploadCompressedTextureLevel(device, textureFormat, image)) {
      break;
    }
    uploadLevels.push(image);
  }

  return uploadLevels;
}

function getCompressedTexturePreviewError(
  device: Device,
  textureFormat: TextureFormat,
  width: number,
  height: number
): string | null {
  if (device.type !== 'webgpu') {
    return null;
  }

  const {blockWidth = 1, blockHeight = 1} = textureFormatDecoder.getInfo(textureFormat);
  if (width % blockWidth === 0 && height % blockHeight === 0) {
    return null;
  }

  const alignedWidth = Math.ceil(width / blockWidth) * blockWidth;
  const alignedHeight = Math.ceil(height / blockHeight) * blockHeight;

  return `${textureFormat} works in WebGL because drivers pad compressed textures to block boundaries, but WebGPU requires explicit ${blockWidth} x ${blockHeight} alignment. Round ${width} x ${height} up to ${alignedWidth} x ${alignedHeight} for WebGPU.`;
}

function canUploadCompressedTextureLevel(
  device: Device,
  textureFormat: TextureFormat,
  image: CompressedImageData
): boolean {
  if (device.type !== 'webgpu') {
    return true;
  }

  const layout = textureFormatDecoder.computeMemoryLayout({
    format: textureFormat,
    width: image.width,
    height: image.height,
    depth: 1,
    byteAlignment: 1
  });
  const hasCompleteLevelData = image.data.byteLength >= layout.byteLength;
  return hasCompleteLevelData;
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
