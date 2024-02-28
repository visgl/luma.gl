// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule, UniformValue} from './shader-module';

/**
 * A shaderpass is a shader module with additional information
 * on how to run
 */
export type ShaderPass<
  PropsT extends Record<string, unknown> = Record<string, unknown>,
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>
> = ShaderModule<PropsT, UniformsT> & {
  passes: ShaderPassData[];
};

type ShaderPassData = {
  sampler?: boolean;
  filter?: boolean;
  uniforms?: Record<string, UniformValue>;
};
