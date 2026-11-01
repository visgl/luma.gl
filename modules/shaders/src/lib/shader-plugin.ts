// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderInjection} from './shader-assembly/shader-injections';
import type {ShaderModule} from './shader-module/shader-module';
import {shaderTypeDecoder, type AttributeShaderType} from '../types';

/** Named shader anchor or hook target accepted by ShaderPlugin injections. */
export type ShaderPluginInjectionTarget =
  | 'vs:#decl'
  | 'vs:#main-start'
  | 'vs:#main-end'
  | 'fs:#decl'
  | 'fs:#main-start'
  | 'fs:#main-end'
  | `vs:${string}`
  | `fs:${string}`;

/** Named shader source injection contributed by a ShaderPlugin. */
export type ShaderPluginInjection = {
  /** Named shader anchor or hook that receives this source. */
  target: ShaderPluginInjectionTarget;
  /** GLSL source for this target. Omit to skip this injection when assembling GLSL. */
  glsl?: string;
  /** WGSL source for this target. Omit to skip this injection when assembling WGSL. */
  wgsl?: string;
  /** Relative injection order within the target. */
  order?: number;
};

/** Portable interpolation modes for ShaderPlugin inter-stage variables. */
export type ShaderPluginInterStageVariableInterpolation = 'smooth' | 'flat';

/** Cross-stage value contributed by a ShaderPlugin. */
export type ShaderPluginInterStageVariable = {
  /** Portable scalar or vector shader type. */
  type: AttributeShaderType;
  /** Defaults to smooth for floating-point types and flat for integer types. */
  interpolation?: ShaderPluginInterStageVariableInterpolation;
};

/** Fully normalized ShaderPlugin inter-stage variable declaration. */
export type ResolvedShaderPluginInterStageVariable = {
  type: AttributeShaderType;
  interpolation: ShaderPluginInterStageVariableInterpolation;
};

/** Reusable shader assembly descriptor with one portable interface and language-specific source. */
export type ShaderPlugin = {
  /** Stable plugin identifier. */
  name: string;
  /** Primary shader module. Supporting modules belong in its dependencies; omit for injection-only plugins. */
  module?: ShaderModule<any, any, any>;
  /** Boolean or numeric preprocessor defines added to shader assembly. */
  defines?: Record<string, boolean | number>;
  /** Named code injections added to shader assembly. */
  injections?: ShaderPluginInjection[];
  /** Shader-facing vertex inputs added by this plugin. Buffer ownership remains with the caller. */
  vertexInputs?: Record<string, AttributeShaderType>;
  /** Values transported from the selected vertex entry point to the fragment entry point. */
  interStageVariables?: Record<string, ShaderPluginInterStageVariable>;
};

/** ShaderPlugin contributions resolved for one shader language. */
export type ResolvedShaderPlugins = {
  /** Resolved shader modules in plugin declaration order. */
  modules: ShaderModule[];
  /** Resolved boolean or numeric preprocessor defines. */
  defines: Record<string, boolean | number>;
  /** Resolved named code injections grouped by target. */
  injections: Record<string, ShaderInjection[]>;
  /** Resolved shader-facing vertex inputs in plugin declaration order. */
  vertexInputs: Record<string, AttributeShaderType>;
  /** Resolved inter-stage variables in plugin declaration order. */
  interStageVariables: Record<string, ResolvedShaderPluginInterStageVariable>;
};

const SHADER_PLUGIN_INJECTION_TARGET_REGEX =
  /^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][\w-]*)$/;

/** Resolve plugin interfaces and select injection source for one shader language. */
export function resolveShaderPlugins(
  plugins: readonly ShaderPlugin[] = [],
  shaderLanguage: 'glsl' | 'wgsl'
): ResolvedShaderPlugins {
  const resolved: ResolvedShaderPlugins = {
    modules: [],
    defines: {},
    injections: {},
    vertexInputs: {},
    interStageVariables: {}
  };

  for (const plugin of plugins) {
    appendShaderPlugin(resolved, plugin, shaderLanguage);
  }
  const {vertexInputs, interStageVariables} = resolved;

  for (const name of Object.keys(interStageVariables)) {
    if (vertexInputs[name]) {
      throw new Error(`ShaderPlugin name "${name}" cannot be both a vertex input and a varying`);
    }
  }

  return resolved;
}

/**
 * Preserve explicit module inputs while appending plugin modules by first-seen name.
 * Optional diagnostics report distinct descriptors sharing a name, without changing selection.
 * Descriptor identity is checked; equivalent independently-created descriptors also report a conflict.
 */
export function mergeShaderPluginModules(
  modules: readonly ShaderModule[] = [],
  pluginModules: readonly ShaderModule[] = [],
  options: {onConflict?: (name: string, selected: ShaderModule, ignored: ShaderModule) => void} = {}
): ShaderModule[] {
  const mergedModules: ShaderModule[] = [...modules];
  const selectedModules = new Map<string, ShaderModule>();
  for (const module of mergedModules) {
    const selected = selectedModules.get(module.name);
    if (selected && selected !== module) options.onConflict?.(module.name, selected, module);
    if (!selected) selectedModules.set(module.name, module);
  }

  for (const pluginModule of pluginModules) {
    const selected = selectedModules.get(pluginModule.name);
    if (selected && selected !== pluginModule) {
      options.onConflict?.(pluginModule.name, selected, pluginModule);
    }
    if (!selected) {
      mergedModules.push(pluginModule);
      selectedModules.set(pluginModule.name, pluginModule);
    }
  }

  return mergedModules;
}

function appendShaderPlugin(
  resolved: ResolvedShaderPlugins,
  plugin: ShaderPlugin,
  shaderLanguage: 'glsl' | 'wgsl'
): void {
  if (plugin.module) {
    resolved.modules.push(plugin.module);
  }
  if (plugin.defines) {
    Object.assign(resolved.defines, plugin.defines);
  }
  for (const [name, type] of Object.entries(plugin.vertexInputs || {})) {
    assertShaderPluginInterfaceName(name, 'vertex input');
    const existingType = resolved.vertexInputs[name];
    if (existingType && existingType !== type) {
      throw new Error(
        `ShaderPlugin vertex input "${name}" has conflicting types "${existingType}" and "${type}"`
      );
    }
    resolved.vertexInputs[name] = type;
  }
  for (const [name, varying] of Object.entries(plugin.interStageVariables || {})) {
    assertShaderPluginInterfaceName(name, 'varying');
    const normalizedVarying = normalizeShaderPluginInterStageVariable(name, varying);
    const existingVarying = resolved.interStageVariables[name];
    if (
      existingVarying &&
      (existingVarying.type !== normalizedVarying.type ||
        existingVarying.interpolation !== normalizedVarying.interpolation)
    ) {
      throw new Error(
        `ShaderPlugin varying "${name}" has conflicting declarations ` +
          `"${existingVarying.type}/${existingVarying.interpolation}" and ` +
          `"${normalizedVarying.type}/${normalizedVarying.interpolation}"`
      );
    }
    resolved.interStageVariables[name] = normalizedVarying;
  }

  for (const injection of plugin.injections || []) {
    const source = injection[shaderLanguage];
    if (source === undefined) continue;
    assertNamedShaderPluginInjectionTarget(injection.target);
    if (!resolved.injections[injection.target]) {
      resolved.injections[injection.target] = [];
    }
    const injections = resolved.injections[injection.target];
    injections.push({
      pluginName: plugin.name,
      injection: source,
      order: injection.order ?? 0
    });
  }
}

function assertShaderPluginInterfaceName(name: string, kind: 'vertex input' | 'varying'): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || name.startsWith('_luma_')) {
    throw new Error(`ShaderPlugin ${kind} "${name}" must be a valid non-reserved identifier`);
  }
}

function normalizeShaderPluginInterStageVariable(
  name: string,
  varying: ShaderPluginInterStageVariable
): ResolvedShaderPluginInterStageVariable {
  const {primitiveType} = shaderTypeDecoder.getAttributeShaderTypeInfo(varying.type);
  const integerType = primitiveType === 'i32' || primitiveType === 'u32';
  const interpolation = varying.interpolation || (integerType ? 'flat' : 'smooth');
  if (integerType && interpolation === 'smooth') {
    throw new Error(`ShaderPlugin integer varying "${name}" must use flat interpolation`);
  }
  return {type: varying.type, interpolation};
}

function assertNamedShaderPluginInjectionTarget(target: ShaderPluginInjectionTarget): void {
  if (!SHADER_PLUGIN_INJECTION_TARGET_REGEX.test(target)) {
    throw new Error(
      `ShaderPlugin injection target "${target}" must be a named shader anchor or hook`
    );
  }
}
