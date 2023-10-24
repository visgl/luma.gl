// luma.gl, MIT license
// Copyright (c) 2020 OpenJS Foundation
// Copyright (c) vis.gl contributors

import type {ShaderModule} from './shader-module/shader-module';
import type {PlatformInfo} from './shader-assembly/platform-info';
import {ShaderModuleInstance} from './shader-module/shader-module-instance';
import {assembleShaders} from './shader-assembly/assemble-shaders';
import {selectShaders, AssembleShaderProps} from './shader-assembly/select-shaders';

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
    ShaderAssembler.defaultShaderAssembler = ShaderAssembler.defaultShaderAssembler || new ShaderAssembler();
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
   * Assemble a pair of shaders into a single shader program
   * @param platformInfo 
   * @param props 
   * @returns 
   */
  assembleShaders(platformInfo: PlatformInfo, props: AssembleShaderProps) {
    const modules = this._getModuleList(props.modules); // Combine with default modules
    const hookFunctions = this._hookFunctions; // TODO - combine with default hook functions
    const options = selectShaders(platformInfo, props);
    const assembled = assembleShaders(platformInfo, {...options, modules, hookFunctions});
    return assembled;
  }

  /** 
   * Dedupe and combine with default modules 
   */
  _getModuleList(appModules: (ShaderModule | ShaderModuleInstance)[] = []): (ShaderModule | ShaderModuleInstance)[] {
    const modules = new Array(this._defaultModules.length + appModules.length);
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

    return modules;
  }
}
