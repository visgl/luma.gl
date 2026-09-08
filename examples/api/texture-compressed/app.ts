// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Device,
  NumberArray,
  TextureFormat,
  TypedArray,
  VariableShaderType
} from '@luma.gl/core';
import {UniformStore} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model, CubeGeometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {TEXTURE_COMPRESSED_INFO_HTML} from './app-ui';
import {
  read as readKTX2,
  KHR_SUPERCOMPRESSION_NONE,
  VKFormat,
  VK_FORMAT_R8G8B8A8_SRGB,
  VK_FORMAT_R8G8B8A8_UNORM,
  VK_FORMAT_R16G16B16A16_SFLOAT,
  VK_FORMAT_R32G32B32A32_SFLOAT,
  VK_FORMAT_ASTC_4x4_SRGB_BLOCK,
  VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK,
  VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK,
  VK_FORMAT_BC1_RGB_SRGB_BLOCK,
  VK_FORMAT_BC3_SRGB_BLOCK,
  VK_FORMAT_BC5_UNORM_BLOCK,
  VK_FORMAT_BC7_SRGB_BLOCK,
  KTX2Container
} from 'ktx-parse';

export const title = 'Texture Compressed';
export const description = 'Shows rendering a compressed texture.';

import {FS_GLSL, VS_GLSL, WGSL_SHADER} from './shaders';

type AppUniforms = {
  mvpMatrix: NumberArray;
};

const app: {uniformTypes: Record<keyof AppUniforms, VariableShaderType>} = {
  uniformTypes: {
    mvpMatrix: 'mat4x4<f32>'
  }
};

const eyePosition = [0, 0, -4];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = TEXTURE_COMPRESSED_INFO_HTML;

  mvpMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition}).rotateZ(Math.PI);
  model: Model | null = null;
  device: Device;
  uniformStore: UniformStore<{app: AppUniforms}>;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.uniformStore = new UniformStore(device, {app});
    this.initialize();
  }

  async initialize() {
    const device = this.device;

    let filename = '';
    if (device.features.has('texture-compression-astc')) {
      filename = '2d_astc4x4.ktx2';
    } else if (device.features.has('texture-compression-bc')) {
      filename = '2d_bc5.ktx2';
    } else {
      throw new Error('compressed formats not supported');
    }

    // failing: 2d_etc2, 2d_rgba16_linear, 2d_rgba32_linear
    const response = await fetch(filename);
    const arrayBuffer = await response.arrayBuffer();
    const container = readKTX2(new Uint8Array(arrayBuffer));
    if (container.supercompressionScheme !== KHR_SUPERCOMPRESSION_NONE) {
      throw new Error(`Supercompression not implemented: ${container.supercompressionScheme}`);
    }

    const texture = device.createTexture({
      data: getData(container),
      format: getFormat(container.vkFormat),
      mipLevels: 1,
      width: container.pixelWidth,
      height: container.pixelHeight,
      sampler: device.createSampler({
        minFilter: 'nearest',
        magFilter: 'nearest',
        mipmapFilter: 'none'
      })
    });

    const geometry = new CubeGeometry({indices: false});

    this.model = new Model(device, {
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      geometry,
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer('app'),
        uTexture: texture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  onFinalize() {
    this.model?.destroy();
    this.uniformStore.destroy();
  }

  onRender({device, aspect, tick}: AnimationProps) {
    this.mvpMatrix.perspective({fovy: Math.PI / 3, aspect}).multiplyRight(this.viewMatrix);
    this.uniformStore.setUniforms({app: {mvpMatrix: this.mvpMatrix}});

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    this.model?.draw(renderPass);
    renderPass.end();
  }
}

function getData(container: KTX2Container): TypedArray {
  const data: TypedArray = container.levels[0].levelData;

  switch (container.vkFormat) {
    case VK_FORMAT_R32G32B32A32_SFLOAT:
      return new Float32Array(data.buffer);

    case VK_FORMAT_R16G16B16A16_SFLOAT:
      return new Uint16Array(data.buffer);

    default:
      return data;
  }
}

function getFormat(vkFormat: VKFormat): TextureFormat {
  switch (vkFormat) {
    case VK_FORMAT_R8G8B8A8_UNORM:
      return 'rgba8unorm';

    case VK_FORMAT_R8G8B8A8_SRGB:
      return 'rgba8unorm-srgb';

    case VK_FORMAT_R16G16B16A16_SFLOAT:
      return 'rgba16float';

    case VK_FORMAT_R32G32B32A32_SFLOAT:
      return 'rgba32float';

    case VK_FORMAT_ASTC_4x4_SRGB_BLOCK:
      return 'astc-4x4-unorm-srgb';

    case VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK:
      return 'etc2-rgb8unorm-srgb';

    case VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK:
      return 'etc2-rgba8unorm-srgb';

    case VK_FORMAT_BC1_RGB_SRGB_BLOCK:
      return 'bc1-rgb-unorm-srgb-webgl';

    case VK_FORMAT_BC3_SRGB_BLOCK:
      return 'bc3-rgba-unorm-srgb';

    case VK_FORMAT_BC5_UNORM_BLOCK:
      return 'bc5-rg-unorm';

    case VK_FORMAT_BC7_SRGB_BLOCK:
      return 'bc7-rgba-unorm-srgb';

    default:
      throw new Error(`Unknown vkFormat, ${vkFormat}`);
  }
}
