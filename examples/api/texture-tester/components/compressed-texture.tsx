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
  CrunchWorkerLoader
} from '@loaders.gl/textures';
import type {GPUTextureFormat} from '@loaders.gl/schema';
import {ImageLoader, type ImageType} from '@loaders.gl/images';

import {
  type Device,
  type PresentationContext,
  type Texture,
  type TextureFormat,
  textureFormatDecoder
} from '@luma.gl/core';
import {DynamicTexture, Model} from '@luma.gl/engine';
import {type TextureSource} from '../textures-data';

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
@group(0) @binding(auto) var uTexture: texture_2d<f32>;
@group(0) @binding(auto) var uTextureSampler: sampler;

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
  isReady: boolean;
};

type LoadedTextureData = {
  arrayBuffer: ArrayBuffer;
  length: number;
  src: string;
  useBasis: boolean;
};

type RawCompressedTextureLevel = {
  data: Uint8Array;
  textureFormat?: string;
  width: number;
  height: number;
  levelSize?: number;
};

type CompressedTextureLevel = RawCompressedTextureLevel & {
  textureFormat: TextureFormat;
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

type TexturePreviewResult = {
  textureFormatLabel: string;
  stats: TextureStat[];
};

type CompressedTexturePreviewSource = {
  loaderName: string;
  texturePath: string;
};

// TODO(ibgreen): remove when fixed in loaders.gl
const LEGACY_TEXTURE_FORMAT_ALIASES: Partial<Record<string, TextureFormat>> = {
  'pvrtc-rbg2unorm-webgl': 'pvrtc-rgb2unorm-webgl'
};

const WEBGPU_TEXTURE_FORMAT_ALIASES: Partial<Record<string, TextureFormat>> = {
  'bc1-rgb-unorm-webgl': 'bc1-rgba-unorm',
  'bc1-rgb-unorm-srgb-webgl': 'bc1-rgba-unorm-srgb'
};

let basisLoadChain: Promise<void> = Promise.resolve();

export class CompressedTexture extends React.PureComponent<
  CompressedTextureProps,
  CompressedTextureState
> {
  readonly canvasRef = React.createRef<HTMLCanvasElement>();
  presentationContext: PresentationContext | null = null;
  private isComponentMounted = false;
  private previewGeneration = 0;

  constructor(props: CompressedTextureProps) {
    super(props);

    const loadOptions = this.getLoadOptions(props.device);

    this.state = {
      loadOptions,
      textureError: null,
      textureFormatLabel: null,
      showStats: false,
      stats: [],
      isReady: false
    };
  }

  async componentDidMount() {
    this.isComponentMounted = true;
    const canvas = this.canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = 256;
    canvas.height = 256;
    // Each visible texture tile owns one PresentationContext.
    // The shared device renders into this context's current framebuffer
    // and then `present()` displays the frame in the tile canvas.
    this.presentationContext = this.props.device.createPresentationContext({
      canvas,
      width: 256,
      height: 256,
      autoResize: false,
      useDevicePixels: false
    });

    await this.renderTexturePreview(this.props.device);
  }

  componentWillUnmount(): void {
    this.isComponentMounted = false;
    this.previewGeneration++;
    this.presentationContext?.destroy();
    this.presentationContext = null;
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
  async renderTexturePreview(device: Device): Promise<void> {
    const previewGeneration = ++this.previewGeneration;
    const {loadOptions} = this.state;
    const {model, image} = this.props;

    if (this.isComponentMounted) {
      this.setState({
        isReady: false,
        textureError: null,
        textureFormatLabel: null,
        stats: []
      });
    }

    try {
      const {arrayBuffer, length, src, useBasis} = await this.getLoadedData(image);
      if (!this.isPreviewActive(previewGeneration)) {
        return;
      }

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
        ? await loadBasisTextureSerially(() => load(arrayBuffer, loader as never, options))
        : await load(arrayBuffer, loader as never, options);
      if (!this.isPreviewActive(previewGeneration)) {
        return;
      }

      const stats: TextureStat[] = [
        {name: 'File Size', value: Math.floor(length / 1024), units: 'Kb'}
      ];
      let previewResult: TexturePreviewResult;

      switch (loader?.id) {
        case 'crunch':
        case 'compressed-texture':
          this.renderEmptyTexture(device, model);
          previewResult = await this.renderCompressedTexture(
            device,
            model,
            result,
            {loaderName: loader.name, texturePath: src},
            previewGeneration
          );
          break;
        case 'image':
          this.renderEmptyTexture(device, model);
          previewResult = this.renderImageTexture(
            device,
            model,
            result as ImageType,
            previewGeneration
          );
          break;
        case 'basis': {
          const basisTextures = Array.isArray(result) ? result[0] : null;
          this.renderEmptyTexture(device, model);
          previewResult = await this.renderCompressedTexture(
            device,
            model,
            basisTextures || [],
            {loaderName: loader.name, texturePath: src},
            previewGeneration
          );
          break;
        }
        default:
          throw new Error('Unknown texture loader');
      }

      if (!this.isPreviewActive(previewGeneration)) {
        return;
      }

      this.setState({
        isReady: true,
        textureError: null,
        textureFormatLabel: previewResult.textureFormatLabel,
        stats: [...stats, ...previewResult.stats]
      });
    } catch (error) {
      if (!this.isPreviewActive(previewGeneration)) {
        return;
      }
      this.renderEmptyTexture(device, model);
      this.setState({
        isReady: true,
        textureError: error instanceof Error ? error.message : String(error),
        textureFormatLabel: null,
        stats: []
      });
    }
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

  renderEmptyTexture(device: Device, model: Model): Texture {
    const brownColor = new Uint8Array([68, 0, 0, 255]);
    const emptyTexture = device.createTexture({
      width: 1,
      height: 1,
      data: brownColor,
      mipmaps: true
    } as any);

    this.renderTextureToPresentationContext(device, model, emptyTexture);

    return emptyTexture;
  }

  renderImageTexture(
    device: Device,
    model: Model,
    image: ImageType,
    previewGeneration: number
  ): TexturePreviewResult {
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

    if (!this.isPreviewActive(previewGeneration)) {
      throw new Error('Texture preview was interrupted');
    }

    this.renderTextureToPresentationContext(device, model, texture);

    const uploadTime = performance.now() - startTime;

    return {
      textureFormatLabel: textureFormat,
      stats: [
        {name: 'Upload time', value: `${Math.floor(uploadTime)} ms`, units: ''},
        {name: 'luma.gl Texture Format', value: textureFormat, units: ''},
        {name: 'Dimensions', value: `${image.width} x ${image.height}`, units: ''},
        {
          name: 'Size in memory (Total)',
          value: formatTextureByteSize(levelZeroByteSize),
          units: ''
        },
        {name: 'Mip 0', value: formatTextureByteSize(levelZeroByteSize), units: ''}
      ]
    };
  }

  async renderCompressedTexture(
    device: Device,
    model: Model,
    rawLevels: unknown,
    previewSource: CompressedTexturePreviewSource,
    previewGeneration: number
  ): Promise<TexturePreviewResult> {
    const levels = getCompressedTextureLevels(
      device.type,
      rawLevels,
      previewSource.loaderName,
      previewSource.texturePath
    );
    const [{textureFormat, width, height}] = levels;

    if (!device.isTextureFormatSupported(textureFormat)) {
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
    const texture = new DynamicTexture(device, {
      data: levels,
      format: textureFormat,
      mipmaps: false
    });
    await texture.ready;
    if (!this.isPreviewActive(previewGeneration)) {
      throw new Error('Texture preview was interrupted');
    }

    const uploadedLevels = levels.slice(0, texture.texture.mipLevels);

    this.renderTextureToPresentationContext(device, model, texture);

    const uploadTime = performance.now() - startTime;
    const mipLevelStats = getCompressedTextureLevelStats(textureFormat, uploadedLevels);

    return {
      textureFormatLabel: textureFormat,
      stats: [
        {name: 'Upload time', value: `${Math.floor(uploadTime)} ms`, units: ''},
        {name: 'luma.gl Texture Format', value: textureFormat, units: ''},
        {name: 'Dimensions', value: `${width} x ${height}`, units: ''},
        {
          name: 'Size in memory (Total)',
          value: formatTextureByteSize(mipLevelStats.totalByteSize),
          units: ''
        },
        ...mipLevelStats.levels.map(level => ({
          name: `Mip ${level.mipLevel}`,
          value: formatTextureByteSize(level.byteSize),
          units: ''
        }))
      ]
    };
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

    const formatStat = stats.find(stat => stat.name === 'luma.gl Texture Format');
    const dimensionsStat = stats.find(stat => stat.name === 'Dimensions');
    const fileSizeStat = stats.find(stat => stat.name === 'File Size');
    const uploadTimeStat = stats.find(stat => stat.name === 'Upload time');
    const memorySizeStat = stats.find(stat => stat.name === 'Size in memory (Total)');
    const mipStats = stats.filter(stat => stat.name.startsWith('Mip '));
    const additionalStats = stats.filter(
      stat =>
        stat.name !== 'luma.gl Texture Format' &&
        stat.name !== 'Dimensions' &&
        stat.name !== 'File Size' &&
        stat.name !== 'Upload time' &&
        stat.name !== 'Size in memory (Total)' &&
        !stat.name.startsWith('Mip ')
    );
    return (
      <ul
        style={{
          position: 'absolute',
          transition: 'opacity 0.2s',
          top: 20,
          display: 'flex',
          flexFlow: 'column nowrap',
          alignItems: 'flex-start',
          gap: 4,
          padding: '8px 9px',
          opacity: this.state.showStats ? 0.8 : 0,
          backgroundColor: 'black',
          color: 'white',
          borderRadius: 5,
          minWidth: 200,
          listStyle: 'none',
          fontSize: 12,
          lineHeight: 1.1
        }}
      >
        {formatStat ? (
          <li
            style={{
              fontWeight: 700,
              fontFamily: 'monospace',
              marginBottom: 1
            }}
          >
            {String(formatStat.value)}
          </li>
        ) : null}
        {dimensionsStat ? (
          <li>{`Dimensions: ${dimensionsStat.value}${dimensionsStat.units}`}</li>
        ) : null}
        {uploadTimeStat ? (
          <li>{`Upload time: ${uploadTimeStat.value}${uploadTimeStat.units}`}</li>
        ) : null}
        <li>{`Mip levels: ${mipStats.length}`}</li>
        <li style={{width: '100%'}}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              lineHeight: 1.05
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: '0 8px 1px 0',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    fontWeight: 700
                  }}
                >
                  Chunk
                </th>
                <th
                  style={{
                    padding: '0 0 1px 0',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    fontWeight: 700
                  }}
                >
                  Size
                </th>
              </tr>
            </thead>
            <tbody>
              {fileSizeStat ? (
                <tr>
                  <td style={{padding: '0 8px 1px 0', whiteSpace: 'nowrap', textAlign: 'left'}}>
                    File Size
                  </td>
                  <td style={{padding: '0 0 1px 0', whiteSpace: 'nowrap', textAlign: 'right'}}>
                    {`${fileSizeStat.value}${fileSizeStat.units}`}
                  </td>
                </tr>
              ) : null}
              {memorySizeStat ? (
                <tr>
                  <td style={{padding: '0 8px 1px 0', whiteSpace: 'nowrap', textAlign: 'left'}}>
                    Memory Size
                  </td>
                  <td style={{padding: '0 0 1px 0', whiteSpace: 'nowrap', textAlign: 'right'}}>
                    {`${memorySizeStat.value}${memorySizeStat.units}`}
                  </td>
                </tr>
              ) : null}
              {additionalStats.map((stat, index) => (
                <tr key={`${stat.name}-${index}`}>
                  <td
                    colSpan={2}
                    style={{
                      paddingTop: 1,
                      whiteSpace: 'nowrap',
                      textAlign: 'left'
                    }}
                  >
                    {`${stat.name}: ${stat.value}${stat.units}`}
                  </td>
                </tr>
              ))}
              {mipStats.map((stat, index) => (
                <tr key={`${stat.name}-${index}`}>
                  <td
                    style={{
                      padding: '0 8px 0 0',
                      verticalAlign: 'top',
                      whiteSpace: 'nowrap',
                      textAlign: 'left'
                    }}
                  >
                    {stat.name}
                  </td>
                  <td
                    style={{
                      padding: 0,
                      verticalAlign: 'top',
                      textAlign: 'right',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {`${stat.value}${stat.units}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </li>
      </ul>
    );
  }

  render() {
    const {isReady, textureError, textureFormatLabel} = this.state;
    const textureLabel = this.getTextureLabel();

    return (
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
          padding: 0,
          overflow: 'hidden'
        }}
        onMouseEnter={() => this.setState({showStats: true})}
        onMouseLeave={() => this.setState({showStats: false})}
      >
        <canvas
          ref={this.canvasRef}
          width={256}
          height={256}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            opacity: isReady ? 1 : 0
          }}
        />
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
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
              background: 'rgba(0, 0, 0, 0.55)'
            }}
          >
            <h1
              style={{
                margin: 0,
                color: 'red',
                fontSize: 16,
                lineHeight: 1.15,
                textAlign: 'center'
              }}
            >
              {textureError}
            </h1>
          </div>
        )}
        {this.renderStats()}
      </button>
    );
  }

  private renderTextureToPresentationContext(
    device: Device,
    model: Model,
    texture: Texture | DynamicTexture
  ): void {
    if (!this.isPresentationAvailable()) {
      return;
    }

    const presentationContext = this.presentationContext;
    if (!presentationContext) {
      return;
    }
    const framebuffer = presentationContext.getCurrentFramebuffer({
      depthStencilFormat: false
    });
    const renderPass = device.beginRenderPass({framebuffer});

    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();

    presentationContext.present();
  }

  private isPresentationAvailable(): boolean {
    const canvas = this.canvasRef.current;
    return Boolean(
      this.isComponentMounted &&
        this.presentationContext &&
        canvas &&
        (typeof canvas.isConnected !== 'boolean' || canvas.isConnected)
    );
  }

  private isPreviewActive(previewGeneration: number): boolean {
    return this.previewGeneration === previewGeneration && this.isPresentationAvailable();
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
  images: CompressedTextureLevel[]
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

async function loadBasisTextureSerially<T>(loadTexture: () => Promise<T>): Promise<T> {
  const previousBasisLoad = basisLoadChain.catch(() => {});
  let releaseBasisLoad = () => {};
  basisLoadChain = new Promise<void>(resolve => {
    releaseBasisLoad = resolve;
  });

  // Basis startup is sensitive to many tiles kicking off transcoding at once.
  await previousBasisLoad;

  try {
    return await loadWithHandledBasisRuntimeRejections(loadTexture);
  } finally {
    releaseBasisLoad();
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

function getCompressedTextureLevels(
  deviceType: Device['type'],
  rawLevels: unknown,
  loaderName: string,
  texturePath: string
): CompressedTextureLevel[] {
  if (!Array.isArray(rawLevels) || rawLevels.length === 0) {
    throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
  }

  return rawLevels.map((rawLevel, mipLevel) =>
    normalizeCompressedTextureLevel(rawLevel, deviceType, loaderName, texturePath, mipLevel)
  );
}

function normalizeCompressedTextureLevel(
  rawLevel: unknown,
  deviceType: Device['type'],
  loaderName: string,
  texturePath: string,
  mipLevel: number
): CompressedTextureLevel {
  if (!rawLevel || typeof rawLevel !== 'object' || !('data' in rawLevel)) {
    throw new Error(`${loaderName} loader returned invalid mip ${mipLevel} for ${texturePath}`);
  }

  const {data, textureFormat, width, height, levelSize} = rawLevel as RawCompressedTextureLevel;
  if (!textureFormat) {
    throw new Error(
      `${loaderName} loader returned mip ${mipLevel} for ${texturePath} without textureFormat`
    );
  }

  return {
    data,
    textureFormat: normalizeTextureFormat(textureFormat, deviceType),
    width,
    height,
    levelSize
  };
}

function normalizeTextureFormat(textureFormat: string, deviceType: Device['type']): TextureFormat {
  const legacyTextureFormat = LEGACY_TEXTURE_FORMAT_ALIASES[textureFormat];
  if (legacyTextureFormat) {
    return legacyTextureFormat;
  }

  if (deviceType === 'webgpu') {
    return WEBGPU_TEXTURE_FORMAT_ALIASES[textureFormat] || (textureFormat as TextureFormat);
  }

  return textureFormat as TextureFormat;
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
