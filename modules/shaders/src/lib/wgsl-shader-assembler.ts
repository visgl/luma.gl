// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderAssembler} from './shader-assembler-base';
import type {ShaderModule} from './shader-module/shader-module';
import type {AssembleShaderProps, GetUniformsFunc} from './shader-assembly/shader-assembly-types';
import {assembleWGSLSource} from './shader-assembly/assemble-wgsl-shaders';
import {
  getShaderBindingDebugRowsFromWGSL,
  type ShaderBindingDebugRow
} from './shader-assembly/wgsl-binding-debug';
import {preprocess} from './preprocessor/preprocessor';
import {scanWGSLInterface} from './shader-assembly/wgsl-interface-scan';
import type {ShaderLayout} from '@luma.gl/core';
import type {ShaderTranspilerEntryPoints} from './shader-transpiler/shader-transpiler';

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
    entryPoints: ShaderTranspilerEntryPoints;
  } {
    const modules = this._getModuleList(props.modules); // Combine with default modules
    const hookFunctions = this._hookFunctions; // TODO - combine with default hook functions
    const translated = this._transpileShader(
      props,
      modules,
      props.source,
      props.shaderStage ?? (props.computeEntryPoint ? 'compute' : undefined)
    );
    const entryPoints = {
      vertex: translated.entryPoints?.vertex ?? props.vertexEntryPoint,
      fragment: translated.entryPoints?.fragment ?? props.fragmentEntryPoint,
      compute: translated.entryPoints?.compute ?? props.computeEntryPoint
    };
    const defines = WGSLShaderAssembler.getShaderPreprocessorDefines(props, modules);
    const preprocessedApplicationSource =
      props.platformInfo.shaderLanguage === 'wgsl' && translated.code
        ? preprocess(translated.code, {defines})
        : translated.code;
    const {
      source: assembledSource,
      getUniforms,
      bindingAssignments
    } = assembleWGSLSource({
      ...props,
      source: preprocessedApplicationSource,
      vertexEntryPoint: entryPoints.vertex,
      fragmentEntryPoint: entryPoints.fragment,
      defines,
      _bindingRegistry: this._wgslBindingRegistry,
      modules: translated.modules,
      hookFunctions
    });
    // WGSL does not have built-in preprocessing support (just compile time constants)
    const preprocessedSource =
      props.platformInfo.shaderLanguage === 'wgsl'
        ? preprocess(assembledSource, {defines})
        : assembledSource;
    return {
      source: preprocessedSource,
      entryPoints,
      getUniforms,
      modules,
      bindingAssignments,
      bindingTable: getShaderBindingDebugRowsFromWGSL(preprocessedSource, bindingAssignments),
      shaderLayout: scanWGSLInterface(preprocessedSource, {
        vertexEntryPoint: entryPoints.vertex,
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
      // Native tan() does not provide enough precision on all WebGPU implementations.
      LUMA_FP32_TAN_PRECISION_WORKAROUND:
        platformInfo.type === 'webgpu' &&
        platformInfo.gpu.toLowerCase() !== 'nvidia' &&
        platformInfo.gpu.toLowerCase() !== 'amd',
      // Metal may reassociate the floating-point transforms used by classic
      // double-single arithmetic. The integer path makes each rounding point
      // explicit while preserving the public vec2<f32> representation.
      LUMA_FP64_INTEGER_ARITHMETIC:
        platformInfo.type === 'webgpu' && platformInfo.gpu.toLowerCase() === 'apple'
    };
  }
}
