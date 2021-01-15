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

/*
import {
  Uniforms,
  UniformsOptions
} from '@luma.gl/webgl/src/classes/uniforms'

interface ShaderModuleDeprecatedApi {
  type: 'function' | string
  old: string
  new: string
  deprecated: boolean
}

interface Injection {
  injection: string
  order: number
}

// https://luma.gl/docs/api-reference/shadertools/assemble-shaders#injection-map
interface InjectionMap {
  [shaderHook: string]: string | Injection
}

// https://luma.gl/docs/developer-guide/shader-modules#shader-module-descriptor
interface ShaderModuleObject {
  name: string
  fs?: string
  vs?: string
  inject?: InjectionMap
  getUniforms: (opts: UniformsOptions, context: Uniforms) => Uniforms
  uniforms: Uniforms
  dependencies: Array<ShaderModuleObject>
  deprecations: Array<ShaderModuleDeprecatedApi>
}
*/
