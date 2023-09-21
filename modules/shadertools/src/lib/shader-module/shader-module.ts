// luma.gl, MIT license
import {UniformFormat} from '../../types';
import {PropType} from '../filters/prop-types';

export type UniformInfo = {
  format: UniformFormat; 
} & PropType;

/** 
 * A shader module definition object
 * @note Can be viewed as the ShaderModuleProps for a ShaderModuleInstance
 */
export type ShaderModule<UniformsT extends Record<string, unknown> = Record<string, unknown>, SettingsT extends Record<string, unknown> = UniformsT> = {
  name: string;
  fs?: string;
  vs?: string;
  defines?: Record<string, string | number>;
  uniforms?: Record<keyof UniformsT, UniformInfo>;
  uniformTypes?: Record<keyof UniformsT, UniformFormat>;
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
