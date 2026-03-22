// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {GROUP_2_IBL_BASE_BINDING} from '../group-2-bindings';

export type IBLBindings = {
  pbr_diffuseEnvSampler?: Texture | null;
  pbr_specularEnvSampler?: Texture | null;
  pbr_brdfLUT?: Texture | null;
};

export const iblWGSL = /* wgsl */ `\
#ifdef USE_IBL
@binding(${GROUP_2_IBL_BASE_BINDING}) @group(2) var pbr_diffuseEnvSampler: texture_cube<f32>;
@binding(${GROUP_2_IBL_BASE_BINDING + 1}) @group(2) var pbr_diffuseEnvSamplerSampler: sampler;
@binding(${GROUP_2_IBL_BASE_BINDING + 2}) @group(2) var pbr_specularEnvSampler: texture_cube<f32>;
@binding(${GROUP_2_IBL_BASE_BINDING + 3}) @group(2) var pbr_specularEnvSamplerSampler: sampler;
@binding(${GROUP_2_IBL_BASE_BINDING + 4}) @group(2) var pbr_brdfLUT: texture_2d<f32>;
@binding(${GROUP_2_IBL_BASE_BINDING + 5}) @group(2) var pbr_brdfLUTSampler: sampler;
#endif
`;

export const iblGLSL = /* glsl */ `\
#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`;

export const ibl = {
  name: 'ibl',
  bindingLayout: [
    {name: 'pbr_diffuseEnvSampler', group: 2},
    {name: 'pbr_specularEnvSampler', group: 2},
    {name: 'pbr_brdfLUT', group: 2}
  ],
  source: iblWGSL,
  vs: iblGLSL,
  fs: iblGLSL
} as const satisfies ShaderModule<IBLBindings, {}, IBLBindings>;
