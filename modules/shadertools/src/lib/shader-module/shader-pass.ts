// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding, TextureFormat} from '@luma.gl/core';
import type {PickBindings, PickUniforms, ShaderModule} from './shader-module';
import type {UniformValue} from '../utils/uniform-types';

export type ShaderPassRenderTarget = {
  /** Width and height scale relative to the renderer output size. */
  scale?: [number, number];
  /** Render target format. Defaults to the device preferred color format. */
  format?: TextureFormat;
};

export type ShaderPassInputSource<TargetNameT extends string = string> =
  | 'original'
  | 'previous'
  | TargetNameT;

/**
 * A ShaderPass is a ShaderModule that can be run "standalone" (e.g. post processing effects)
 * It adds additional information on how to run the module.
 * A ShaderPass can require one or more sub passes.
 */
export type ShaderPass<
  PropsT extends Record<string, any> = Record<string, any>,
  UniformsT extends Record<string, UniformValue> = PickUniforms<PropsT>,
  BindingsT extends Record<string, Binding> = PickBindings<PropsT>,
  RenderTargetNameT extends string = never
> = ShaderModule<PropsT, UniformsT, BindingsT> & {
  /** A shader pass can run multiple sub passes */
  passes?: ShaderSubPass<UniformsT, Extract<keyof BindingsT, string>, RenderTargetNameT>[];
  // TODO better name
  // subPasses?: ShaderSubPass[];
};

/** Information on how to run a specific sub pass */
export type ShaderSubPass<
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>,
  BindingNameT extends string = string,
  RenderTargetNameT extends string = string
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
  /** Mapping from shader binding name to the logical texture source. */
  inputs?: Partial<
    Record<BindingNameT | 'sourceTexture', ShaderPassInputSource<RenderTargetNameT>>
  >;
  /** Output target for this sub pass. Defaults to the shared "previous" chain. */
  output?: 'previous' | RenderTargetNameT;
};
