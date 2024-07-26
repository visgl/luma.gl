// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {UniformFormat} from '../../types';
import {PropType} from '../filters/prop-types';
import type {UniformTypes, UniformValue} from '../utils/uniform-types';

// To avoid dependency on core module, do not import `Binding` type.
// The ShaderModule is not concerned with the type of `Binding`,
// it is the repsonsibility of `splitUniformsAndBindings` in
// ShaderInputs to type the result of `getUniforms()`
type Binding = unknown; // import type {Binding} from '@luma.gl/core';

export type UniformInfo = {
  format?: UniformFormat;
} & PropType;

// Helper types
type BindingKeys<T> = {[K in keyof T]: T[K] extends UniformValue ? never : K}[keyof T];
type UniformKeys<T> = {[K in keyof T]: T[K] extends UniformValue ? K : never}[keyof T];
export type PickBindings<T> = {[K in BindingKeys<Required<T>>]: T[K]};
export type PickUniforms<T> = {[K in UniformKeys<Required<T>>]: T[K]};

/**
 * A shader module definition object
 * @note `UniformsT` & `BindingsT` are deduced from `PropsT` by default. If
 * a custom type for `UniformsT` is used, `BindingsT` should be also be provided.
 */
export type ShaderModule<
  PropsT extends Record<string, any> = Record<string, any>,
  UniformsT extends Record<string, UniformValue> = PickUniforms<PropsT>,
  BindingsT extends Record<string, Binding> = PickBindings<PropsT>
> = {
  /** Used for type inference not for values */
  props?: Required<PropsT>;
  /** Used for type inference, not currently used for values */
  uniforms?: UniformsT;
  /** Used for type inference, not currently used for values */
  bindings?: BindingsT;

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
  ) => Partial<UniformsT & BindingsT>;

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
