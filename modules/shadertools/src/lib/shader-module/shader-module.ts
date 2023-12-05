// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {NumberArray} from '@math.gl/types';
import {UniformFormat} from '../../types';
import {PropType} from '../filters/prop-types';

export type UniformValue = number | boolean | Readonly<NumberArray>; // Float32Array> | Readonly<Int32Array> | Readonly<Uint32Array> | Readonly<number[]>;

export type UniformInfo = {
  format?: UniformFormat; 
} & PropType;

/** 
 * A shader module definition object
 * @note Can be viewed as the ShaderModuleProps for a ShaderModuleInstance
 */
export type ShaderModule<UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>, SettingsT extends Record<string, unknown> = UniformsT, BindingsT extends Record<string, unknown> = {}> = {
  name: string;
  fs?: string;
  vs?: string;
  
  /** Used for type inference, not currently used for values */
  uniforms?: UniformsT;

  /** Uniform shader types */
  uniformTypes?: Record<keyof UniformsT, UniformFormat>;
  /** Uniform JS prop types  */
  uniformPropTypes?: Record<keyof UniformsT, UniformInfo>;
  /** Default uniform values */
  defaultUniforms?: Required<UniformsT>; // Record<keyof UniformsT, UniformValue>;
  /** Function that maps settings to uniforms */
  getUniforms?: (settings: Partial<SettingsT>, prevUniforms?: any /* UniformsT */) => UniformsT;

  /** uniform buffers, textures, samplers, storage, ... */
  bindings?: Record<keyof BindingsT, {location: number; type: 'texture' | 'sampler' | 'uniforms'}>;

  defines?: Record<string, string | number>;
  /** Injections */
  inject?: Record<string, string | {injection: string; order: number;}>;
  dependencies?: ShaderModule[];
  /** Information on deprecated properties */
  deprecations?: ShaderModuleDeprecation[];
};

/** Use to generate deprecations when shader module is used */
export type ShaderModuleDeprecation = {
  type: string;
  regex?: RegExp;
  new: string;
  old: string;
  deprecated?: boolean;
};
