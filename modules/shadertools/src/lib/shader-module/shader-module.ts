// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumberArray} from '@math.gl/types';
import {UniformFormat} from '../../types';
import {PropType} from '../filters/prop-types';
import {Sampler, Texture} from '@luma.gl/core';

export type UniformValue = number | boolean | Readonly<NumberArray>; // Float32Array> | Readonly<Int32Array> | Readonly<Uint32Array> | Readonly<number[]>;

export type UniformInfo = {
  format?: UniformFormat;
} & PropType;

/**
 * A shader module definition object
 * @note Can be viewed as the ShaderModuleProps for a ShaderModuleInstance
 */
export type ShaderModule<
  PropsT extends Record<string, unknown> = Record<string, unknown>,
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>,
  BindingsT extends Record<string, Buffer | Texture | Sampler> = {}
> = {
  /** Used for type inference not for values */
  props?: Required<PropsT>;
  /** Used for type inference, not currently used for values */
  uniforms?: UniformsT;

  name: string;
  fs?: string;
  vs?: string;

  /** Uniform shader types @note: Both order and types MUST match uniform block declarations in shader */
  uniformTypes?: Record<keyof UniformsT, UniformFormat>;
  /** Uniform JS prop types  */
  uniformPropTypes?: Record<keyof UniformsT, UniformInfo>;
  /** Default uniform values */
  defaultUniforms?: Required<UniformsT>; // Record<keyof UniformsT, UniformValue>;

  /** Function that maps props to uniforms & bindings */
  getUniforms?: (props?: any, oldProps?: any) => Record<string, UniformValue>;

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
