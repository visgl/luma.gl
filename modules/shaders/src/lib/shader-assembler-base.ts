// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from './shader-module/shader-module';
import {initializeShaderModules} from './shader-module/shader-module';
import type {AssembleShaderProps} from './shader-assembly/shader-assembly-types';
import type {ShaderHook, ShaderHookOptions} from './shader-assembly/shader-hooks';
import {assert} from './utils/assert';
import type {
  ShaderTranspiler,
  ShaderTranspileResult,
  ShaderTranspilerEntryPoints
} from './shader-transpiler/shader-transpiler';
import {getShaderModuleDependencies} from './shader-module/shader-module-dependencies';

/**
 * A stateful version of `assembleShaders` that can be used to assemble shaders.
 * Supports setting of default modules and hooks.
 */
export abstract class ShaderAssembler {
  /** Shader language accepted by this assembler. */
  abstract readonly shaderLanguage: 'glsl' | 'wgsl';
  /** Compilers registered by the application, isolated to this assembler. */
  private readonly _shaderTranspilers = new Map<string, ShaderTranspiler>();
  /** Hook functions */
  protected readonly _hookFunctions: (ShaderHook | string)[] = [];
  /** Shader modules */
  protected _defaultModules: ShaderModule[] = [];

  /** Register or replace the compiler for one input language. */
  addShaderTranspiler(transpiler: ShaderTranspiler): void {
    this._shaderTranspilers.set(transpiler.sourceLanguage, transpiler);
  }

  /** Remove the compiler for one input language. */
  removeShaderTranspiler(sourceLanguage: string): void {
    this._shaderTranspilers.delete(sourceLanguage);
  }

  /** Translate application and reusable module source together before native assembly. */
  protected _transpileShader(
    props: AssembleShaderProps,
    modules: ShaderModule[],
    source: string | null | undefined,
    stage?: 'vertex' | 'fragment' | 'compute'
  ): ShaderTranspileResult & {modules: ShaderModule[]} {
    const sourceLanguage = props.sourceLanguage || this.shaderLanguage;
    if (sourceLanguage === this.shaderLanguage) {
      // Foreign module code requires an application translation unit in the same language.
      assert(
        !getShaderModuleDependencies(modules).some(
          module => module.sourceLanguage && module.sourceLanguage !== this.shaderLanguage
        )
      );
      return {code: source || '', modules};
    }
    const transpiler = this._shaderTranspilers.get(sourceLanguage);
    // The application must register a transpiler before assembling a foreign input language.
    assert(transpiler);
    const dependencies = getShaderModuleDependencies(modules);
    // A translation unit can contain only one foreign source language.
    assert(
      !dependencies.some(
        module =>
          module.sourceLanguage &&
          module.sourceLanguage !== sourceLanguage &&
          module.sourceLanguage !== this.shaderLanguage
      )
    );
    const moduleSource = dependencies
      .filter(module => module.sourceLanguage === sourceLanguage)
      .map(module => module.source || '')
      .join('\n');
    const entryPoints: ShaderTranspilerEntryPoints = {
      vertex: props.vertexEntryPoint,
      fragment: props.fragmentEntryPoint,
      compute: props.computeEntryPoint
    };
    const result =
      source === undefined || source === null
        ? {code: ''}
        : transpiler!.transpile({
            source: [moduleSource, source].filter(Boolean).join('\n'),
            target: this.shaderLanguage,
            stage,
            entryPoints,
            platformInfo: props.platformInfo
          });
    // Preserve uniform metadata and target-language code without emitting foreign source twice.
    const nativeModules = dependencies.map(module => ({
      ...module,
      dependencies: undefined,
      ...(module.sourceLanguage === sourceLanguage
        ? {source: undefined, vs: undefined, fs: undefined}
        : {})
    }));
    return {...result, modules: nativeModules};
  }

  /**
   * Add a default module that does not have to be provided with every assembly call.
   * @param module Shader module to include in later assembly calls.
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
   * @param module Shader module to remove from later assembly calls.
   */
  removeDefaultModule(module: ShaderModule): void {
    const moduleName = typeof module === 'string' ? module : module.name;
    this._defaultModules = this._defaultModules.filter(m => m.name !== moduleName);
  }

  /**
   * Register a shader hook
   * @param hook Stage-prefixed hook signature, such as `vs:OFFSET_POSITION(inout vec4 position)`.
   * @param options Optional hook metadata such as always-on header and footer source.
   */
  addShaderHook(hook: string, options?: ShaderHookOptions): void {
    this._hookFunctions.push(options ? {...options, hook} : hook);
  }

  /**
   * Remove all registered shader hooks, for example before re-registering hooks for a new
   * application configuration. Default modules are not affected.
   */
  resetShaderHooks(): void {
    this._hookFunctions.length = 0;
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
