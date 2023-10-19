// luma.gl, MIT license
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
  defines?: Record<string, string | number>;
  uniforms?: Record<keyof UniformsT, UniformInfo>;
  uniformTypes?: Record<keyof UniformsT, UniformFormat>;
  bindings?: Record<keyof BindingsT, {location: number; type: 'texture' | 'sampler' | 'uniforms'}>;
  defaultUniforms?: Required<UniformsT>; // Record<keyof UniformsT, UniformValue>;
  getUniforms?: (settings: Partial<SettingsT>, prevUniforms?: any /* UniformsT */) => UniformsT;
  inject?: Record<string, string | {injection: string; order: number;}>;
  dependencies?: ShaderModule[];
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
