// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from './shader-module/shader-module';
import {initializeShaderModules} from './shader-module/shader-module';
import {
  AssembleShaderProps,
  GetUniformsFunc,
  assembleWGSLShader,
  assembleGLSLShaderPair
} from './shader-assembly/assemble-shaders';
import {preprocess} from './preprocessor/preprocessor';

/**
 * A stateful version of `assembleShaders` that can be used to assemble shaders.
 * Supports setting of default modules and hooks.
 */
export class ShaderAssembler {
  /** Default ShaderAssembler instance */
  static defaultShaderAssembler: ShaderAssembler;
  /** Hook functions */
  private readonly _hookFunctions: any[] = [];
  /** Shader modules */
  private _defaultModules: ShaderModule[] = [];

  /**
   * A default shader assembler instance - the natural place to register default modules and hooks
   * @returns
   */
  static getDefaultShaderAssembler(): ShaderAssembler {
    ShaderAssembler.defaultShaderAssembler =
      ShaderAssembler.defaultShaderAssembler || new ShaderAssembler();
    return ShaderAssembler.defaultShaderAssembler;
  }

  /**
   * Add a default module that does not have to be provided with every call to assembleShaders()
   */
  addDefaultModule(module: ShaderModule): void {
    if (
      !this._defaultModules.find(
        m => m.name === (typeof module === 'string' ? module : module.name)
      )
    ) {
      this._defaultModules.push(module);
    }
  }

  /**
   * Remove a default module
   */
  removeDefaultModule(module: ShaderModule): void {
    const moduleName = typeof module === 'string' ? module : module.name;
    this._defaultModules = this._defaultModules.filter(m => m.name !== moduleName);
  }

  /**
   * Register a shader hook
   * @param hook
   * @param opts
   */
  addShaderHook(hook: string, opts?: any): void {
    if (opts) {
      hook = Object.assign(opts, {hook});
    }
    this._hookFunctions.push(hook);
  }

  /**
   * Assemble a WGSL unified shader
   * @param platformInfo
   * @param props
   * @returns
   */
  assembleWGSLShader(props: AssembleShaderProps): {
    source: string;
    getUniforms: GetUniformsFunc;
    modules: ShaderModule[];
  } {
    const modules = this._getModuleList(props.modules); // Combine with default modules
    const hookFunctions = this._hookFunctions; // TODO - combine with default hook functions
    const {source, getUniforms} = assembleWGSLShader({
      ...props,
      // @ts-expect-error
      source: props.source,
      modules,
      hookFunctions
    });
    // WGSL does not have built-in preprocessing support (just compile time constants)
    const preprocessedSource =
      props.platformInfo.shaderLanguage === 'wgsl' ? preprocess(source) : source;
    return {source: preprocessedSource, getUniforms, modules};
  }

  /**
   * Assemble a pair of shaders into a single shader program
   * @param platformInfo
   * @param props
   * @returns
   */
  assembleGLSLShaderPair(props: AssembleShaderProps): {
    vs: string;
    fs: string;
    getUniforms: GetUniformsFunc;
    modules: ShaderModule[];
  } {
    const modules = this._getModuleList(props.modules); // Combine with default modules
    const hookFunctions = this._hookFunctions; // TODO - combine with default hook functions
    const assembled = assembleGLSLShaderPair({
      ...props,
      // @ts-expect-error
      vs: props.vs,
      // @ts-expect-error
      fs: props.fs,
      modules,
      hookFunctions
    });

    return {...assembled, modules};
  }

  /**
   * Dedupe and combine with default modules
   */
  _getModuleList(appModules: ShaderModule[] = []): ShaderModule[] {
    const modules = new Array<ShaderModule>(this._defaultModules.length + appModules.length);
    const seen: Record<string, boolean> = {};
    let count = 0;

    for (let i = 0, len = this._defaultModules.length; i < len; ++i) {
      const module = this._defaultModules[i];
      const name = module.name;
      modules[count++] = module;
      seen[name] = true;
    }

    for (let i = 0, len = appModules.length; i < len; ++i) {
      const module = appModules[i];
      const name = module.name;
      if (!seen[name]) {
        modules[count++] = module;
        seen[name] = true;
      }
    }

    modules.length = count;

    initializeShaderModules(modules);
    return modules;
  }
}
