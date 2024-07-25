// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {UniformFormat} from '../../types';
import {PropType} from '../filters/prop-types';
import type {Buffer, Sampler, Texture} from '@luma.gl/core';
import type {UniformTypes, UniformValue} from '../utils/uniform-types';

type BindingValue = Buffer | Texture | Sampler;

export type UniformInfo = {
  format?: UniformFormat;
} & PropType;

// Helper types
type FilterBindingKeys<T> = {[K in keyof T]: T[K] extends UniformValue ? never : K}[keyof T];
type FilterUniformKeys<T> = {[K in keyof T]: T[K] extends UniformValue ? K : never}[keyof T];
type BindingsOnly<T> = {[K in FilterBindingKeys<Required<T>>]: T[K]};
type UniformsOnly<T> = {[K in FilterUniformKeys<Required<T>>]: T[K]};

/**
 * A shader module definition object
 * @note Can be viewed as the ShaderModuleProps for a ShaderModuleInstance
 */
export type ShaderModule<
  PropsT extends Record<string, any> = Record<string, any>,
  UniformsT extends Record<string, UniformValue> = UniformsOnly<PropsT>,
  BindingsT extends Record<string, BindingValue> = BindingsOnly<PropsT>
> = {
  /** Used for type inference not for values */
  props?: Required<PropsT>;
  /** Used for type inference, not currently used for values */
  uniforms?: UniformsT;

  name: string;
  fs?: string;
  vs?: string;

  /** Uniform shader types @note: Both order and types MUST match uniform block declarations in shader */
  uniformTypes?: Required<UniformTypes<UniformsT>>; // Record<keyof UniformsT, UniformFormat>;
  /** Uniform JS prop types  */
  uniformPropTypes?: Record<keyof UniformsT, UniformInfo>;
  /** Default uniform values */
  defaultUniforms?: Required<UniformsT>; // Record<keyof UniformsT, UniformValue>;

  /** Function that maps props to uniforms & bindings */
  getUniforms?: (
    props?: Partial<PropsT>,
    prevUniforms?: UniformsT
  ) => Record<string, BindingValue | UniformValue>;

  /** uniform buffers, textures, samplers, storage, ... */
  bindings?: Record<keyof BindingsT, {location: number; type: 'texture' | 'sampler' | 'uniforms'}>;

  defines?: Record<string, string | number>;
  /** Injections */
  inject?: Record<string, string | {injection: string; order: number}>;
  dependencies?: ShaderModule<any, any>[];
  /** Information on deprecated properties */
  deprecations?: ShaderModuleDeprecation[];

  /** Internal */
  normalized?: boolean;
};

/** Use to generate deprecations when shader module is used */
export type ShaderModuleDeprecation = {
  type: string;
  regex?: RegExp;
  new: string;
  old: string;
  deprecated?: boolean;
};
