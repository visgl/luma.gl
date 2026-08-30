// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from './shader-module/shader-module';
import {initializeShaderModules} from './shader-module/shader-module';
import {
  AssembleShaderProps,
  GetUniformsFunc,
  assembleWGSLShader,
  assembleGLSLShaderPair
} from './shader-assembly/assemble-shaders';
import {
  getShaderBindingDebugRowsFromWGSL,
  type ShaderBindingDebugRow
} from './shader-assembly/wgsl-binding-debug';
import {preprocess} from './preprocessor/preprocessor';
import {scanWGSLInterface} from './shader-assembly/wgsl-interface-scan';
import {assert} from './utils/assert';
import type {ShaderLayout} from '@luma.gl/core';

/**
 * A stateful version of `assembleShaders` that can be used to assemble shaders.
 * Supports setting of default modules and hooks.
 */
export abstract class ShaderAssembler {
  /** Shared assemblers, with independent module and hook state for each shader language. */
  private static readonly defaultShaderAssemblers: {
    glsl?: GLSLShaderAssembler;
    wgsl?: WGSLShaderAssembler;
  } = {};
  /** Shader language accepted by this assembler. */
  abstract readonly shaderLanguage: 'glsl' | 'wgsl';
  /** Hook functions */
  protected readonly _hookFunctions: any[] = [];
  /** Shader modules */
  protected _defaultModules: ShaderModule[] = [];

  /**
   * A default shader assembler instance - the natural place to register default modules and hooks
   * @param shaderLanguage Shader language whose shared assembler should be returned.
   * @returns Shared default shader assembler for the requested language.
   */
  static getDefaultShaderAssembler(shaderLanguage: 'glsl'): GLSLShaderAssembler;
  static getDefaultShaderAssembler(shaderLanguage: 'wgsl'): WGSLShaderAssembler;
  static getDefaultShaderAssembler(
    shaderLanguage: 'glsl' | 'wgsl'
  ): GLSLShaderAssembler | WGSLShaderAssembler;
  static getDefaultShaderAssembler(
    shaderLanguage: 'glsl' | 'wgsl'
  ): GLSLShaderAssembler | WGSLShaderAssembler {
    // Shader language must be explicit to avoid mixing GLSL and WGSL hooks.
    assert(shaderLanguage === 'glsl' || shaderLanguage === 'wgsl');

    if (shaderLanguage === 'wgsl') {
      ShaderAssembler.defaultShaderAssemblers.wgsl =
        ShaderAssembler.defaultShaderAssemblers.wgsl || new WGSLShaderAssembler();
      return ShaderAssembler.defaultShaderAssemblers.wgsl;
    }

    ShaderAssembler.defaultShaderAssemblers.glsl =
      ShaderAssembler.defaultShaderAssemblers.glsl || new GLSLShaderAssembler();
    return ShaderAssembler.defaultShaderAssemblers.glsl;
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
   * @param opts Optional hook metadata such as always-on header and footer source.
   */
  addShaderHook(hook: string, opts?: any): void {
    if (opts) {
      hook = Object.assign(opts, {hook});
    }
    this._hookFunctions.push(hook);
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

/** Stateful assembler for GLSL vertex and fragment shaders. */
export class GLSLShaderAssembler extends ShaderAssembler {
  readonly shaderLanguage: 'glsl' = 'glsl';

  /**
   * Assemble a pair of shaders into a single shader program.
   * @param props GLSL vertex and fragment source, platform information, shader modules, defines, and injections.
   * @returns Assembled GLSL source, resolved modules, and combined uniform getter.
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
}

/** Stateful assembler for unified WGSL shaders. */
export class WGSLShaderAssembler extends ShaderAssembler {
  readonly shaderLanguage: 'wgsl' = 'wgsl';
  /** Stable per-run WGSL auto-binding assignments keyed by group/module/binding. */
  private readonly _wgslBindingRegistry = new Map<string, number>();

  /**
   * Assemble a WGSL unified shader.
   * @param props WGSL source, platform information, shader modules, defines, and injections.
   * @returns Assembled WGSL source, resolved modules, uniforms, and binding debug metadata.
   */
  assembleWGSLShader(props: AssembleShaderProps): {
    source: string;
    getUniforms: GetUniformsFunc;
    modules: ShaderModule[];
    bindingAssignments: {moduleName: string; name: string; group: number; location: number}[];
    bindingTable: ShaderBindingDebugRow[];
    shaderLayout: ShaderLayout | null;
  } {
    const modules = this._getModuleList(props.modules); // Combine with default modules
    const hookFunctions = this._hookFunctions; // TODO - combine with default hook functions
    const defines = WGSLShaderAssembler.getShaderPreprocessorDefines(props, modules);
    const preprocessedApplicationSource =
      props.platformInfo.shaderLanguage === 'wgsl' && props.source
        ? preprocess(props.source, {defines})
        : props.source;
    const {
      source: assembledSource,
      getUniforms,
      bindingAssignments
    } = assembleWGSLShader({
      ...props,
      // @ts-expect-error
      source: preprocessedApplicationSource,
      defines,
      _bindingRegistry: this._wgslBindingRegistry,
      modules,
      hookFunctions
    });
    // WGSL does not have built-in preprocessing support (just compile time constants)
    const preprocessedSource =
      props.platformInfo.shaderLanguage === 'wgsl'
        ? preprocess(assembledSource, {defines})
        : assembledSource;
    return {
      source: preprocessedSource,
      getUniforms,
      modules,
      bindingAssignments,
      bindingTable: getShaderBindingDebugRowsFromWGSL(preprocessedSource, bindingAssignments),
      shaderLayout: scanWGSLInterface(preprocessedSource, {
        vertexEntryPoint: props.vertexEntryPoint,
        scanVertexAttributes: props.scanVertexAttributes
      })
    };
  }

  private static getShaderPreprocessorDefines(
    props: AssembleShaderProps,
    modules: ShaderModule[]
  ): Record<string, boolean | number> {
    return {
      ...WGSLShaderAssembler.getPlatformPreprocessorDefines(props.platformInfo),
      ...modules.reduce<Record<string, boolean | number>>((accumulator, module) => {
        Object.assign(accumulator, module.defines);
        return accumulator;
      }, {}),
      ...props.defines
    };
  }

  private static getPlatformPreprocessorDefines(
    platformInfo: AssembleShaderProps['platformInfo']
  ): Record<string, boolean> {
    const limits = platformInfo.limits || {};
    return {
      LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:
        platformInfo.type === 'webgpu' && (limits['maxStorageBuffersInVertexStage'] || 0) > 0,
      // Metal may reassociate the floating-point transforms used by classic
      // double-single arithmetic. The integer path makes each rounding point
      // explicit while preserving the public vec2<f32> representation.
      LUMA_FP64_INTEGER_ARITHMETIC:
        platformInfo.type === 'webgpu' && platformInfo.gpu.toLowerCase() === 'apple'
    };
  }
}
