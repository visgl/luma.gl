// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, NumberArray, TextureFormat, VariableShaderType} from '@luma.gl/core';
import {UniformStore} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model, CubeGeometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {
  read as readKTX2,
  VKFormat,
  VK_FORMAT_R8G8B8A8_SRGB,
  VK_FORMAT_R8G8B8A8_UNORM,
  VK_FORMAT_ASTC_4x4_SRGB_BLOCK,
  VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK,
  VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK,
  VK_FORMAT_BC1_RGB_SRGB_BLOCK,
  VK_FORMAT_BC5_UNORM_BLOCK,
  VK_FORMAT_BC3_SRGB_BLOCK
} from 'ktx-parse';

export const title = 'Texture Compressed';
export const description = 'Shows rendering a compressed texture.';

const WGSL_SHADER = /* WGSL */ `\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> app : Uniforms;
@group(0) @binding(1) var uTexture : texture_2d<f32>;
@group(0) @binding(2) var uTextureSampler : sampler;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) texCoords : vec2<f32>,
  @location(2) colors : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.modelViewProjectionMatrix * inputs.positions;
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = 0.5 * (inputs.positions + vec4(1.0, 1.0, 1.0, 1.0));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  // return inputs.fragPosition;
  return textureSample(uTexture, uTextureSampler, inputs.fragUV);
  // TODO: apply sRGB OETF
}
`;

// GLSL

export const VS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

layout(location=0) in vec3 positions;
layout(location=1) in vec2 texCoords;

out vec2 fragUV;
out vec4 fragPosition;

void main() {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  fragUV = texCoords;
  fragPosition = 0.5 * (vec4(positions, 1.) + vec4(1., 1., 1., 1.));
}
`;

export const FS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;

uniform sampler2D uTexture;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

in vec2 fragUV;
in vec4 fragPosition;

layout (location=0) out vec4 fragColor;

vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

void main() {
  fragColor = fragPosition;
  fragColor = texture(uTexture, vec2(fragUV.x, 1.0 - fragUV.y));
  fragColor = sRGBTransferOETF( fragColor );
}
`;

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
  static info = `\
<p>
Drawing a compressed texture
</p>

<p>
Rendered using the luma.gl <code>Model</code>, <code>CubeGeometry</code> and <code>AnimationLoop</code> classes.
</p>
`;

  mvpMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition}).rotateZ(Math.PI);
  model: Model | null = null;
  device: Device;

  uniformStore = new UniformStore<{app: AppUniforms}>({app});

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.initialize();
  }

  async initialize() {
    const device = this.device;

    // failing: 2d_etc2.ktx2
    const buffer = await fetch('2d_astc.ktx2').then(res => res.arrayBuffer());
    const container = readKTX2(new Uint8Array(buffer));

    const texture = device.createTexture({
      format: getFormat(container.vkFormat),
      data: container.levels[0].levelData,
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
        app: this.uniformStore.getManagedUniformBuffer(device, 'app'),
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

function getFormat(vkFormat: VKFormat): TextureFormat {
  switch (vkFormat) {
    case VK_FORMAT_R8G8B8A8_UNORM:
      return 'rgba8unorm';

    case VK_FORMAT_R8G8B8A8_SRGB:
      return 'rgba8unorm-srgb';

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

    default:
      throw new Error(`Unknown vkFormat, ${vkFormat}`);
  }
}
