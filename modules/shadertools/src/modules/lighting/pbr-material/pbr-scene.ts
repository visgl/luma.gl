// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {NumberArray2, NumberArray16} from '@math.gl/core';

import {ShaderModule} from '../../../lib/shader-module/shader-module';

export type PBRSceneBindings = {
  pbr_transmissionFramebufferSampler?: Texture | null;
};

export type PBRSceneUniforms = {
  exposure?: number;
  toneMapMode?: number;
  environmentIntensity?: number;
  environmentRotation?: number;
  framebufferSize?: NumberArray2;
  viewMatrix?: NumberArray16;
  projectionMatrix?: NumberArray16;
};

export type PBRSceneProps = PBRSceneBindings & PBRSceneUniforms;

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const uniformBlock = /* glsl */ `\
layout(std140) uniform pbrSceneUniforms {
  float exposure;
  int toneMapMode;
  float environmentIntensity;
  float environmentRotation;
  vec2 framebufferSize;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} pbrScene;

#ifdef USE_TRANSMISSION_FRAMEBUFFER
uniform sampler2D pbr_transmissionFramebufferSampler;
#endif
`;

const wgslUniformBlock = /* wgsl */ `\
struct pbrSceneUniforms {
  exposure: f32,
  toneMapMode: i32,
  environmentIntensity: f32,
  environmentRotation: f32,
  framebufferSize: vec2<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>
};

@group(1) @binding(auto) var<uniform> pbrScene: pbrSceneUniforms;

#ifdef USE_TRANSMISSION_FRAMEBUFFER
@group(1) @binding(auto) var pbr_transmissionFramebufferSampler: texture_2d<f32>;
@group(1) @binding(auto) var pbr_transmissionFramebufferSamplerSampler: sampler;
#endif
`;

export const pbrScene = {
  name: 'pbrScene',
  bindingLayout: [
    {name: 'pbrScene', group: 1},
    {name: 'pbr_transmissionFramebufferSampler', group: 1}
  ],
  source: wgslUniformBlock,
  vs: uniformBlock,
  fs: uniformBlock,
  getUniforms: (props: PBRSceneProps) => props,
  uniformTypes: {
    exposure: 'f32',
    toneMapMode: 'i32',
    environmentIntensity: 'f32',
    environmentRotation: 'f32',
    framebufferSize: 'vec2<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>'
  },
  defaultUniforms: {
    exposure: 1,
    toneMapMode: 2,
    environmentIntensity: 1,
    environmentRotation: Math.PI * 0.5,
    framebufferSize: [1, 1],
    viewMatrix: IDENTITY_MATRIX,
    projectionMatrix: IDENTITY_MATRIX
  } as Required<PBRSceneUniforms>
} as const satisfies ShaderModule<PBRSceneProps, PBRSceneUniforms, PBRSceneBindings>;
