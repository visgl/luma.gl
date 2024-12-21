// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import type {NumberArray3, NumberArray16} from '@math.gl/core';

import {ShaderModule} from '../../../lib/shader-module/shader-module';

const uniformBlock = /* glsl */ `\
uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`;

export type PBRProjectionProps = {
  modelViewProjectionMatrix: NumberArray16;
  modelMatrix: NumberArray16;
  normalMatrix: NumberArray16;
  camera: NumberArray3;
};

export const pbrProjection: ShaderModule<PBRProjectionProps> = {
  name: 'pbrProjection',
  vs: uniformBlock,
  fs: uniformBlock,
  // TODO why is this needed?
  getUniforms: props => props,
  uniformTypes: {
    modelViewProjectionMatrix: 'mat4x4<f32>',
    modelMatrix: 'mat4x4<f32>',
    normalMatrix: 'mat4x4<f32>',
    camera: 'vec3<i32>'
  }
};
