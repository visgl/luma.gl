import {ShaderModule as ShaderModuleProps} from '../types';

/**
 * Helper class
 * TODO - confusingly, both this type and its props are called `ShaderModule`
 */
export default class ShaderModule {
  constructor(props: ShaderModuleProps);
  getModuleSource(type: any): string;
  getUniforms(opts: any, uniforms: any): any;
  getDefines(): any;
  checkDeprecations(shaderSource: any, log: any): void;
  _parseDeprecationDefinitions(deprecations: any): any;
  _defaultGetUniforms(opts?: {}): {};
}

export function normalizeShaderModule(module: any): any;
