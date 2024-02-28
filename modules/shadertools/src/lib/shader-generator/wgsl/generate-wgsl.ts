// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {capitalize} from '../utils/capitalize';

export type WGSLGenerationOptions = {
  shaderLanguage: 'wgsl';
};

export function generateWGSLForModule(module: ShaderModule, options: WGSLGenerationOptions) {
  return generateWGSLUniformDeclarations(module, options);
}

export function generateWGSLUniformDeclarations(
  module: ShaderModule,
  options: WGSLGenerationOptions
) {
  const wgsl: string[] = [];

  // => uniform UniformBlockName {
  wgsl.push(`struct ${capitalize(module.name)} {`);

  for (const [uniformName, uniformFormat] of Object.entries(module?.uniformTypes || {})) {
    const wgslUniformType = uniformFormat;
    wgsl.push(`  ${uniformName} : ${wgslUniformType};`);
  }
  wgsl.push('};');

  wgsl.push(`var<uniform> ${module.name} : ${capitalize(module.name)};`);

  return wgsl.join('\n');
}
