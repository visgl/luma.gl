// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule, UniformValue} from './shader-module';

/**
 * A ShaderPass is a ShaderModule that can be run "standalone" (e.g. post processing effects)
 * It adds additional information on how to run the module in one or more passes.
 */
export type ShaderPass<
  PropsT extends Record<string, unknown> = Record<string, unknown>,
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>
> = ShaderModule<PropsT, UniformsT> & {
  passes: ShaderPassData[];
};

/** Information on how to run a specific pass */
type ShaderPassData = {
  sampler?: boolean;
  filter?: boolean;
  uniforms?: Record<string, UniformValue>;
};
