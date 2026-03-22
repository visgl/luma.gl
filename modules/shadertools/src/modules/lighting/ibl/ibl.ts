// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import {ShaderModule} from '../../../lib/shader-module/shader-module';

export type IBLBindings = {
  pbr_diffuseEnvSampler?: Texture | null;
  pbr_specularEnvSampler?: Texture | null;
  pbr_brdfLUT?: Texture | null;
};

export const iblWGSL = /* wgsl */ `\
#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
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
  firstBindingSlot: 32,
  bindingLayout: [
    {name: 'pbr_diffuseEnvSampler', group: 2},
    {name: 'pbr_specularEnvSampler', group: 2},
    {name: 'pbr_brdfLUT', group: 2}
  ],
  source: iblWGSL,
  vs: iblGLSL,
  fs: iblGLSL
} as const satisfies ShaderModule<IBLBindings, {}, IBLBindings>;
