// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderAssembler as ShaderAssemblerBase} from './shader-assembler-base';
import {GLSLShaderAssembler} from './glsl-shader-assembler';
import {WGSLShaderAssembler} from './wgsl-shader-assembler';
import {assert} from './utils/assert';

export {GLSLShaderAssembler, WGSLShaderAssembler};
export type ShaderAssembler = ShaderAssemblerBase;

const defaultShaderAssemblers: {glsl?: GLSLShaderAssembler; wgsl?: WGSLShaderAssembler} = {};

/** Shared abstract contract with the deprecated root-only factory. */
export const ShaderAssembler = /* @__PURE__ */ Object.assign(ShaderAssemblerBase, {
  getDefaultShaderAssembler
});

/**
 * Legacy shared shader assembler instance for explicitly configured compatibility callers.
 * @deprecated Construct and pass a GLSLShaderAssembler or WGSLShaderAssembler instead.
 * @param shaderLanguage Shader language whose shared assembler should be returned.
 * @returns Shared default shader assembler for the requested language.
 */
function getDefaultShaderAssembler(shaderLanguage: 'glsl'): GLSLShaderAssembler;
/** @deprecated Construct and pass a language-specific assembler instead. */
function getDefaultShaderAssembler(shaderLanguage: 'wgsl'): WGSLShaderAssembler;
/** @deprecated Construct and pass a language-specific assembler instead. */
function getDefaultShaderAssembler(
  shaderLanguage: 'glsl' | 'wgsl'
): GLSLShaderAssembler | WGSLShaderAssembler;
/** @deprecated Construct and pass a language-specific assembler instead. */
function getDefaultShaderAssembler(
  shaderLanguage: 'glsl' | 'wgsl'
): GLSLShaderAssembler | WGSLShaderAssembler {
  // Shader language must be explicit to avoid mixing GLSL and WGSL hooks.
  assert(shaderLanguage === 'glsl' || shaderLanguage === 'wgsl');

  if (shaderLanguage === 'wgsl') {
    defaultShaderAssemblers.wgsl = defaultShaderAssemblers.wgsl || new WGSLShaderAssembler();
    return defaultShaderAssemblers.wgsl;
  }

  defaultShaderAssemblers.glsl = defaultShaderAssemblers.glsl || new GLSLShaderAssembler();
  return defaultShaderAssemblers.glsl;
}
