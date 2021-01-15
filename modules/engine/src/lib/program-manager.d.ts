export default class ProgramManager {
  static getDefaultProgramManager(gl: WebGLRenderingContext): any;
  constructor(gl: WebGLRenderingContext);
  addDefaultModule(module: any): void;
  removeDefaultModule(module: any): void;
  addShaderHook(hook: any, opts: any): void;
  get(props?: {}): any;
  getUniforms(program: any): any;
  release(program: any): void;
}

/*
import {
  VertexShader,
  FragmentShader,
  Program
} from '@luma.gl/webgl';

import {
  Uniforms,
  UniformsOptions
} from '@luma.gl/webgl/src/classes/uniforms'

import {
  ShaderModule,
  ShaderModuleObject,
  InjectionMap
} from '@luma.gl/shadertools/src/lib/shader-module'

import {
  DefineMap
} from '@luma.gl/shadertools/src/lib/assemble-shaders'

interface ProgramManagerProps {
  vs?: VertexShader | string
  fs?: FragmentShader | string
  modules?: Array<ShaderModuleObject | string>
  defines?: DefineMap
  inject?: InjectionMap
  varyings?: Array<string>
  bufferMode?: number
  transpileToGLSL100?: boolean
}

export default class ProgramManager {
  stateHash: number
  gl: WebGLRenderingContext
  _programCache: {
    [programHash: string]: Program
  }
  _getUniforms: {
    [programHash: string]: (opts: UniformsOptions, context: Uniforms) => Uniforms
  }
  _registeredModules: {} // TODO: Remove? This isn't used anywhere in luma.gl
  _hookFunctions: Array<{
    hook: string
    header?: string
    footer?: string
  }>
  _defaultModules: Array<ShaderModuleObject | ShaderModule>
  _hashes: {
    [key: string]: number
  }
  _hashCounter: number
  _useCounts: {
    [programHash: string]: number
  }
  static getDefaultProgramManager(gl: WebGLRenderingContext): ProgramManager;
  constructor(gl: WebGLRenderingContext);
  addDefaultModule(module: ShaderModuleObject | ShaderModule): void;
  removeDefaultModule(module: ShaderModuleObject | ShaderModule | string): void;
  addShaderHook(hook: string, opts?: {header?: string, footer?: string}): void;
  get(props?: ProgramManagerProps): Program;
  getUniforms(program: Program): ((opts: UniformsOptions, context: Uniforms) => Uniforms) | null;
  release(program: Program): void;
  _getHash(key: string): number;
  _getModuleList(appModules?: Array<ShaderModuleObject | ShaderModule>): Array<ShaderModuleObject | ShaderModule>;
}
*/
