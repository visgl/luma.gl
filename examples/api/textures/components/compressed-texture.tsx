// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as React from 'react';
import styled from 'styled-components';

import {load, registerLoaders, selectLoader, fetchFile, LoaderOptions} from '@loaders.gl/core';
import {
  BasisLoader,
  CompressedTextureLoader,
  CrunchWorkerLoader,
  GL_EXTENSIONS_CONSTANTS,
  getSupportedGPUTextureFormats,
  selectSupportedBasisFormat
} from '@loaders.gl/textures';
import {ImageLoader, ImageType} from '@loaders.gl/images';

import {Device, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

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
  COMPRESSED_SIGNED,
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

const TextureButton = styled.button`
  height: 256px;
  width: 256px;
  border: 1px solid black;
  margin: 1em;
  position: relative;
  margin-left: 0;
`;

const ImageFormatHeader = styled.h1`
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  color: white;
  font-size: 16px;
`;
const ErrorFormatHeader = styled.h1`
  color: red;
  font-size: 16px;
`;

const TextureInfo = styled.ul`
  position: absolute;
  transition: opacity 0.2s;
  top: 20px;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  padding: 10px;
  opacity: 0.8;
  background-color: black;
  color: white;
  border-radius: 5px;
  min-width: 200px;
  list-style: none;
  font-size: 14px;
`;

registerLoaders([BasisLoader, CompressedTextureLoader, ImageLoader]);

// TEXTURE SHADERS

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
  image: ImageType;
  model: Model;
};

type CompressedTextureState = {
  loadOptions: LoaderOptions;
  textureError: Error | null;
  showStats: boolean;
  stats: any[];
  dataUrl: string | null;
};

export class CompressedTexture extends React.PureComponent<
  CompressedTextureProps,
  CompressedTextureState
> {
  static defaultProps = {
    device: null,
    canvas: null,
    image: null,
    model: null
  };

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

  getExtension(name) {
    const {device} = this.props;
    const vendorPrefixes = ['', 'WEBKIT_', 'MOZ_'];
    let ext = null;

    for (const vendorPrefix of vendorPrefixes) {
      ext = Boolean(device.getExtension(vendorPrefix + name));
      if (ext) {
        break;
      }
    }
    return ext;
  }

  getLoadOptions() {
    return {
      basis: {
        format: selectSupportedBasisFormat()
      }
    };
  }

  // eslint-disable-next-line max-statements
  async getTextureDataUrl(device: Device) {
    const {loadOptions} = this.state;
    const {canvas, model, image} = this.props;

    try {
      const {arrayBuffer, length, src, useBasis} = await this.getLoadedData(image);

      const options = {...loadOptions};
      if (useBasis) {
        options['compressed-texture'] = {useBasis: true};
      }

      const loader = await selectLoader(src, [
        CompressedTextureLoader,
        CrunchWorkerLoader,
        BasisLoader,
        ImageLoader
      ]);

      const result = loader && (await load(arrayBuffer, loader, options));

      this.addStat('File Size', Math.floor(length / 1024), 'Kb');

      switch (loader?.id) {
        case 'crunch':
        case 'compressed-texture':
          this.renderEmptyTexture(device, model);
          this.renderCompressedTexture(device, model, result, loader.name, src);
          break;
        case 'image':
          this.renderEmptyTexture(device, model);
          this.renderImageTexture(device, model, result);
          break;
        case 'basis':
          const basisTextures = result[0];
          this.renderEmptyTexture(device, model);
          this.renderCompressedTexture(device, model, basisTextures, loader.name, src);
          break;
        default:
          throw new Error('Unknown texture loader');
      }
    } catch (error) {
      console.error(error); // eslint-disable-line
      this.renderEmptyTexture(device, model);
      this.setState({textureError: error.message});
    }

    return canvas.toDataURL();
  }

  async getLoadedData(image) {
    let length = 0;
    let src = '';
    let useBasis = false;
    let arrayBuffer: ArrayBuffer;

    // eslint-disable-next-line no-undef
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

  createCompressedTexture(device: Device, images: any): Texture {
    const texture = device.createTexture({
      data: images,
      compressed: true,
      mipmaps: false
      // parameters: {
      //   [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_MIN_FILTER]: images.length > 1 ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR,
      //   [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
      //   [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      // }
    });

    return texture;
  }

  renderEmptyTexture(device: Device, model: Model): Texture {
    const brownColor = new Uint8Array([68, 0, 0, 255]);
    const emptyTexture = device.createTexture({
      width: 1,
      height: 1,
      data: brownColor,
      mipmaps: true
      // parameters: {
      //   [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
      //   [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      // }
    });

    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: emptyTexture});
    model.draw(renderPass);
    renderPass.end();

    // model.draw();
    return emptyTexture;
  }

  renderImageTexture(device: Device, model: Model, image: any) {
    const texture = device.createTexture({
      data: image
      // parameters: {
      //   [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
      //   [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      // }
    });

    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();

    const startTime = new Date();

    const uploadTime = Date.now() - startTime.getMilliseconds();

    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${image.width} x ${image.height}`);
    this.addStat(
      'Size in memory (Lvl 0)',
      Math.floor((image.width * image.height * 4) / 1024),
      'Kb'
    );
  }

  renderCompressedTexture(device, model, images, loaderName, texturePath) {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }
    // We take the first image because it has main propeties of compressed image.
    const {format, width, height, levelSize} = images[0];

    if (!this.isFormatSupported(format)) {
      throw new Error(`Texture format ${format} not supported by this GPU`);
    }

    const startTime = new Date();
    const texture = this.createCompressedTexture(device, images);

    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();

    const uploadTime = Date.now() - startTime.getMilliseconds();

    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${width} x ${height}`);
    if (levelSize) {
      this.addStat('Size in memory (Lvl 0)', Math.floor(levelSize / 1024), 'Kb');
    }
  }

  // eslint-disable-next-line complexity
  isFormatSupported(format: any): boolean {
    if (typeof format !== 'number') {
      throw new Error('Invalid internal format of compressed texture');
    }
    const supportedFormats = getSupportedGPUTextureFormats(this.props.gl);

    switch (format) {
      case COMPRESSED_RGB_S3TC_DXT1_EXT:
      case COMPRESSED_RGBA_S3TC_DXT3_EXT:
      case COMPRESSED_RGBA_S3TC_DXT5_EXT:
      case COMPRESSED_RGBA_S3TC_DXT1_EXT:
        return supportedFormats.has('dxt');

      case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
        return supportedFormats.has('pvrtc');

      case COMPRESSED_RGB_ATC_WEBGL:
      case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
      case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
        return supportedFormats.has('atc');

      case COMPRESSED_RGB_ETC1_WEBGL:
        return supportedFormats.has('etc1');

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
        return supportedFormats.has('astc');

      case COMPRESSED_R11_EAC:
      case COMPRESSED_SIGNED:
      case COMPRESSED_RG11_EAC:
      case COMPRESSED_SIGNED_RG11_EAC:
      case COMPRESSED_RGB8_ETC2:
      case COMPRESSED_RGBA8_ETC2_EAC:
      case COMPRESSED_SRGB8_ETC2:
      case COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:
      case COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2:
      case COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2:
        return supportedFormats.has('etc2');

      case COMPRESSED_RED_RGTC1_EXT:
      case COMPRESSED_SIGNED_RED_RGTC1_EXT:
      case COMPRESSED_RED_GREEN_RGTC2_EXT:
      case COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT:
        return supportedFormats.has('rgtc');

      case COMPRESSED_SRGB_S3TC_DXT1_EXT:
      case COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT:
      case COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT:
      case COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT:
        return supportedFormats.has('dxt-srgb');
      default:
        return false;
    }
  }

  addStat(name, value, units = '') {
    const newStats = [...this.state.stats, {name, value, units}];
    this.setState({stats: newStats});
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
    return <TextureInfo style={{opacity: this.state.showStats ? 0.8 : 0}}>{infoList}</TextureInfo>;
  }

  render() {
    const {dataUrl, textureError} = this.state;
    const {format, name} = this.props.image;

    return dataUrl ? (
      <TextureButton
        style={{backgroundImage: `url(${dataUrl})`}}
        onMouseEnter={() => this.setState({showStats: true})}
        onMouseLeave={() => this.setState({showStats: false})}
      >
        {!textureError ? (
          <ImageFormatHeader>{format || name}</ImageFormatHeader>
        ) : (
          <ErrorFormatHeader style={{color: 'red'}}>{textureError}</ErrorFormatHeader>
        )}
        {this.renderStats()}
      </TextureButton>
    ) : null;
  }
}
