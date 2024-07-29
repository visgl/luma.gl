// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import type {PickBindings, PickUniforms, ShaderModule} from './shader-module';
import type {UniformValue} from '../utils/uniform-types';

/**
 * A ShaderPass is a ShaderModule that can be run "standalone" (e.g. post processing effects)
 * It adds additional information on how to run the module.
 * A ShaderPass can require one or more sub passes.
 */
export type ShaderPass<
  PropsT extends Record<string, any> = Record<string, any>,
  UniformsT extends Record<string, UniformValue> = PickUniforms<PropsT>,
  BindingsT extends Record<string, Binding> = PickBindings<PropsT>
> = ShaderModule<PropsT, UniformsT, BindingsT> & {
  /** A shader pass can run multiple sub passes */
  passes?: ShaderSubPass<UniformsT>[];
  // TODO better name
  // subPasses?: ShaderSubPass[];
};

/** Information on how to run a specific sub pass */
export type ShaderSubPass<
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>
> = {
  /**
   * Action indicates whether this pass:
   * - filters the color in each pixel (provides a `<pass.name>_filterColor()` shader function)
   * - performs its own sampling (provides a `<pass.name>_sampleColor()` shader function)
   */
  action?: 'filter' | 'sample';
  sampler?: boolean;
  filter?: boolean;
  uniforms?: UniformsT;
};
