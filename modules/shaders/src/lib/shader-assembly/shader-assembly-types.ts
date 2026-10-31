// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type PlatformInfo} from './platform-info';
import {type ShaderModule} from '../shader-module/shader-module';
import {type ShaderHook} from './shader-hooks';
import {type ShaderInjection} from './shader-injections';
import {type AttributeShaderType} from '../../types';
import {type ResolvedShaderPluginVarying} from '../shader-plugin';

export type ShaderAssemblyLog = {
  deprecated?: (...args: unknown[]) => () => unknown;
  removed?: (...args: unknown[]) => () => unknown;
  warn?: (...args: unknown[]) => () => unknown;
};

/** Props accepted by `ShaderAssembler` assembly methods. */
export type AssembleShaderProps = AssembleShaderOptions & {
  platformInfo: PlatformInfo;
  /** WGSL: single shader source. */
  source?: string | null;
  /** GLSL vertex shader source. */
  vs?: string | null;
  /** GLSL fragment shader source. */
  fs?: string | null;
};

/** Shared shader assembly options. */
export type AssembleShaderOptions = {
  /** information about the platform (which shader language & version, extensions etc.) */
  platformInfo: PlatformInfo;
  /** Inject shader id #defines */
  id?: string;
  /** Input language compiled by a registered ShaderAssembler transpiler. Defaults to the target language. */
  sourceLanguage?: string;
  /** Select compute compilation independently of an optional WGSL entry-point name. */
  shaderStage?: 'compute';
  /** WGSL compute entry point selected by the compute pipeline. */
  computeEntryPoint?: string;
  /** Modules to be injected */
  modules?: ShaderModule[];
  /** Boolean or numeric preprocessor defines evaluated before shader assembly. */
  defines?: Record<string, boolean | number>;
  /** GLSL only: Overrides to be injected. In WGSL these are supplied during Pipeline creation time */
  constants?: Record<string, number>;
  /** Per-call hooks, appended after registered assembler hooks; matching names override for this call. */
  hookFunctions?: readonly (ShaderHook | string)[];
  /** Code injections */
  inject?: Record<string, string | ShaderInjection>;
  /** Ordered code injections contributed by ShaderPlugin descriptors. */
  pluginInjections?: Record<string, ShaderInjection[]>;
  /** Vertex inputs contributed by ShaderPlugin descriptors. */
  pluginVertexInputs?: Record<string, AttributeShaderType>;
  /** Cross-stage varyings contributed by ShaderPlugin descriptors. */
  pluginVaryings?: Record<string, ResolvedShaderPluginVarying>;
  /** WGSL vertex entry point selected by the render pipeline. */
  vertexEntryPoint?: string;
  /** Whether WGSL interface scanning should include vertex attributes. */
  scanVertexAttributes?: boolean;
  /** WGSL fragment entry point selected by the render pipeline. */
  fragmentEntryPoint?: string;
  /** Whether to inject prologue */
  prologue?: boolean;
  /** logger object */
  log?: ShaderAssemblyLog;
};

export type AssembleStageOptions = {
  /** Inject shader id #defines */
  id?: string;
  /** Vertex shader */
  source: string;
  stage: 'vertex' | 'fragment';
  /** Modules to be injected */
  modules: any[];
  /** Boolean or numeric preprocessor defines evaluated before shader assembly. */
  defines?: Record<string, boolean | number>;
  /** GLSL only: Overrides to be injected. In WGSL these are supplied during Pipeline creation time */
  constants?: Record<string, number>;
  /** Per-call hooks, appended after registered assembler hooks; matching names override for this call. */
  hookFunctions?: readonly (ShaderHook | string)[];
  /** Code injections */
  inject?: Record<string, string | ShaderInjection>;
  /** Ordered code injections contributed by ShaderPlugin descriptors. */
  pluginInjections?: Record<string, ShaderInjection[]>;
  /** Vertex inputs contributed by ShaderPlugin descriptors. */
  pluginVertexInputs?: Record<string, AttributeShaderType>;
  /** Cross-stage varyings contributed by ShaderPlugin descriptors. */
  pluginVaryings?: Record<string, ResolvedShaderPluginVarying>;
  /** WGSL vertex entry point selected by the render pipeline. */
  vertexEntryPoint?: string;
  /** WGSL fragment entry point selected by the render pipeline. */
  fragmentEntryPoint?: string;
  /** Whether to inject prologue */
  prologue?: boolean;
  /** logger object */
  log?: ShaderAssemblyLog;
  /** @internal Stable per-assembler WGSL binding assignments. */
  _bindingRegistry?: Map<string, number>;
};

/**
 * getUniforms function returned from the shader module system
 */
export type GetUniformsFunc = (opts: Record<string, any>) => Record<string, any>;

export type AssembleWGSLShaderOptions = AssembleShaderOptions & {
  /** Single WGSL shader */
  source: string;
  /** @internal Stable per-assembler WGSL binding assignments. */
  _bindingRegistry?: Map<string, number>;
};

export type BindingRelocationContext = {
  usedBindingsByGroup: Map<number, Set<number>>;
  bindingRegistry?: Map<string, number>;
  reservedBindingKeysByGroup: Map<number, Map<number, string>>;
};

export type WGSLBindingAssignment = {
  moduleName: string;
  name: string;
  group: number;
  location: number;
};

export type WGSLApplicationRelocationState = {
  sawSupportedBindingDeclaration: boolean;
};

export type WGSLRelocationState = {
  sawSupportedBindingDeclaration: boolean;
  nextHintedBindingLocation: number | null;
};

export type WGSLRelocationParams = {
  module: ShaderModule;
  context: BindingRelocationContext;
  bindingAssignments: WGSLBindingAssignment[];
  relocationState: WGSLRelocationState;
};
