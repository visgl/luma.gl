// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../shader-module/shader-module';

import type {GLSLGenerationOptions} from './glsl/generate-glsl';
import {generateGLSLForModule} from './glsl/generate-glsl';

import type {WGSLGenerationOptions} from './wgsl/generate-wgsl';
import {generateWGSLForModule} from './wgsl/generate-wgsl';

/** Options for how to generate shader code from a module */
export type ShaderGenerationOptions = GLSLGenerationOptions | WGSLGenerationOptions;

/** Generates shader code for a module */
export function generateShaderForModule(
  module: ShaderModule<Record<string, unknown>>,
  options: ShaderGenerationOptions
): string {
  switch (options.shaderLanguage) {
    case 'glsl':
      return generateGLSLForModule(module, options);
    case 'wgsl':
      return generateWGSLForModule(module, options);
  }
}
