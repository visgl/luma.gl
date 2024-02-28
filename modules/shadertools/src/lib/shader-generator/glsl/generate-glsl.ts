// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {UniformFormat} from '../../../types';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {capitalize} from '../utils/capitalize';

export type GLSLGenerationOptions = {
  shaderLanguage: 'glsl';
  uniforms: 'scoped-interface-blocks' | 'unscoped-interface-blocks' | 'uniforms';
};

export function generateGLSLForModule(module: ShaderModule, options: GLSLGenerationOptions) {
  return generateGLSLUniformDeclarations(module, options);
}

function generateGLSLUniformDeclarations(
  module: ShaderModule,
  options: GLSLGenerationOptions
): string {
  const glsl: string[] = [];

  // => uniform UniformBlockName {
  switch (options.uniforms) {
    case 'scoped-interface-blocks':
    case 'unscoped-interface-blocks':
      glsl.push(`uniform ${capitalize(module.name)} {`);
      break;
    case 'uniforms':
    // ignore
  }

  for (const [uniformName, uniformFormat] of Object.entries(module.uniformTypes || {})) {
    const glslUniformType = getGLSLUniformType(uniformFormat);
    switch (options.uniforms) {
      case 'scoped-interface-blocks':
        // => uniform UniformBlockName {
        glsl.push(`  ${glslUniformType} ${uniformName};`);
        break;
      case 'unscoped-interface-blocks':
        // => uniform UniformBlockName {
        glsl.push(`  ${glslUniformType} ${module.name}_${uniformName};`);
        break;
      case 'uniforms':
        glsl.push(`uniform ${glslUniformType} ${module.name}_${uniformName};`);
    }
  }

  switch (options.uniforms) {
    case 'scoped-interface-blocks':
      glsl.push(`} ${module.name};`);
      break;
    case 'unscoped-interface-blocks':
      glsl.push('};');
      break;
    case 'uniforms':
    // ignore
  }

  // final new line
  glsl.push('');

  return glsl.join('\n');
}

/** Map a luma.gl WebGPU style uniform type to GLSL */
function getGLSLUniformType(uniformFormat: UniformFormat): string {
  const UNIFORM_TYPE_TO_GLSL: Record<UniformFormat, string> = {
    f32: 'float',
    i32: 'int',
    u32: 'uint',
    'vec2<f32>': 'vec2',
    'vec3<f32>': 'vec3',
    'vec4<f32>': 'vec4',
    'vec2<i32>': 'ivec2',
    'vec3<i32>': 'ivec3',
    'vec4<i32>': 'ivec4',
    'vec2<u32>': 'uvec2',
    'vec3<u32>': 'uvec3',
    'vec4<u32>': 'uvec4',
    'mat2x2<f32>': 'mat2',
    'mat2x3<f32>': 'mat2x3',
    'mat2x4<f32>': 'mat2x4',
    'mat3x2<f32>': 'mat3x2',
    'mat3x3<f32>': 'mat3',
    'mat3x4<f32>': 'mat3x4',
    'mat4x2<f32>': 'mat4x2',
    'mat4x3<f32>': 'mat4x3',
    'mat4x4<f32>': 'mat4'
  };

  const glsl = UNIFORM_TYPE_TO_GLSL[uniformFormat];
  return glsl;
}
