// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BindingsOnly, BindingValue, ShaderModule, UniformsOnly} from './shader-module';
import type {UniformValue} from '../utils/uniform-types';

/**
 * A shaderpass is a shader module with additional information
 * on how to run
 */
export type ShaderPass<
  PropsT extends Record<string, any> = Record<string, any>,
  UniformsT extends Record<string, UniformValue> = UniformsOnly<PropsT>,
  BindingsT extends Record<string, BindingValue> = BindingsOnly<PropsT>
> = ShaderModule<PropsT, UniformsT, BindingsT> & {
  passes: ShaderPassData[];
};

type ShaderPassData = {
  sampler?: boolean;
  filter?: boolean;
  uniforms?: Record<string, UniformValue>;
};
