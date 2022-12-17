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
export type ShaderModule<Uniforms extends Record<string, unknown> = {}> = {
  name: string;
  fs?: string;
  vs?: string;
  uniforms?: Record<string, PropType>;
  uniformFormats?: Record<string, UniformFormat>;
  getUniforms?: any;
  defines?: Record<string, string | number>;
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
