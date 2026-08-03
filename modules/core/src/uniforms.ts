// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Narrow entry point for portable uniform buffer utilities. */

export {
  makeShaderBlockLayout,
  type ShaderBlockLayout,
  type ShaderBlockLayoutEntry,
  type ShaderBlockLayoutOptions
} from './shadertypes/shader-types/shader-block-layout';
export {ShaderBlockWriter} from './portable/shader-block-writer';
export {UniformBlock} from './portable/uniform-block';
export {UniformStore} from './portable/uniform-store';
export type {
  UniformValue,
  CompositeUniformValue,
  CompositeUniformValueArray,
  CompositeUniformValueStruct
} from './adapter/types/uniforms';
