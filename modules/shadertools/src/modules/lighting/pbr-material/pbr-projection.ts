// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import type {NumberArray3, NumberArray16} from '../../../lib/utils/uniform-types';

import {ShaderModule} from '../../../lib/shader-module/shader-module';

import {glsl} from '../../../lib/glsl-utils/highlight';

const uniformBlock = glsl`\
uniform pbrProjectionUniforms {
  mat4 u_MVPMatrix;
  mat4 u_ModelMatrix;
  mat4 u_NormalMatrix;
  // Projection
  vec3 u_Camera;
} proj;
`;

export type PBRProjectionProps = {
  u_MVPMatrix: NumberArray16;
  u_ModelMatrix: NumberArray16;
  u_NormalMatrix: NumberArray16;
  u_Camera: NumberArray3;
};

export const pbrProjection: ShaderModule<PBRProjectionProps> = {
  name: 'pbrProjection',
  vs: uniformBlock,
  fs: uniformBlock,
  // TODO why is this needed?
  getUniforms: props => props,
  uniformTypes: {
    u_MVPMatrix: 'mat4x4<f32>',
    u_ModelMatrix: 'mat4x4<f32>',
    u_NormalMatrix: 'mat4x4<f32>',
    u_Camera: 'vec3<i32>'
  }
};
