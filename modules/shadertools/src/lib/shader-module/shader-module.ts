// luma.gl, MIT license
import {PropType} from '../filters/prop-types';

/** 
 * A shader module definition object
 * @note Can be viewed as the ShaderModuleProps for a ShaderModuleInstance
 */
export type ShaderModule = {
  name: string;
  fs?: string;
  vs?: string;
  uniforms?: Record<string, PropType>;
  getUniforms?: any;
  defines?: Record<string, string | number>;
  inject?: Record<string, string | {injection: string; order: number;}>;
  dependencies?: ShaderModule[];
  deprecations?: ShaderModuleDeprecation[];
  /** @deprecated Use vs */
  vertexShader?: string;
  /** @deprecated Use fs */
  fragmentShader?: string;
};

/** Use to generate deprecations when shader module is used */
export type ShaderModuleDeprecation = {
  type: string;
  regex?: RegExp;
  new: string;
  old: string;
  deprecated?: boolean;
};
