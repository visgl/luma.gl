// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import type {PickBindings, PickUniforms, ShaderModule} from './shader-module';
import type {UniformValue} from '../utils/uniform-types';

/**
 * A shaderpass is a shader module with additional information
 * on how to run
 */
export type ShaderPass<
  PropsT extends Record<string, any> = Record<string, any>,
  UniformsT extends Record<string, UniformValue> = PickUniforms<PropsT>,
  BindingsT extends Record<string, Binding> = PickBindings<PropsT>
> = ShaderModule<PropsT, UniformsT, BindingsT> & {
  passes: ShaderPassData[];
};

type ShaderPassData = {
  sampler?: boolean;
  filter?: boolean;
  uniforms?: Record<string, UniformValue>;
};
