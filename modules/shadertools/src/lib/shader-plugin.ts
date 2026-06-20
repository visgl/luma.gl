// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderInjection} from './shader-assembly/shader-injections';
import type {ShaderModule} from './shader-module/shader-module';
import {shaderTypeDecoder, type AttributeShaderType} from '@luma.gl/core';

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
  /** Shader source to inject at the target. */
  injection: string;
  /** Relative injection order within the target. */
  order?: number;
};

/** Portable interpolation modes for ShaderPlugin varyings. */
export type ShaderPluginVaryingInterpolation = 'smooth' | 'flat';

/** Cross-stage value contributed by a ShaderPlugin. */
export type ShaderPluginVarying = {
  /** Portable scalar or vector shader type. */
  type: AttributeShaderType;
  /** Defaults to smooth for floating-point types and flat for integer types. */
  interpolation?: ShaderPluginVaryingInterpolation;
};

/** Fully normalized ShaderPlugin varying declaration. */
export type ResolvedShaderPluginVarying = {
  type: AttributeShaderType;
  interpolation: ShaderPluginVaryingInterpolation;
};

/** Shared or backend-specific shader assembly contributions. */
export type ShaderPluginVariant = {
  /** Shader modules added to shader assembly. */
  modules?: ShaderModule[];
  /** Boolean preprocessor defines added to shader assembly. */
  defines?: Record<string, boolean>;
  /** Named code injections added to shader assembly. */
  injections?: ShaderPluginInjection[];
  /** Shader-facing vertex inputs added by this plugin. Buffer ownership remains with the caller. */
  vertexInputs?: Record<string, AttributeShaderType>;
  /** Values transported from the selected vertex entry point to the fragment entry point. */
  varyings?: Record<string, ShaderPluginVarying>;
};

/** Reusable cross-backend shader assembly descriptor. */
export type ShaderPlugin = ShaderPluginVariant & {
  /** Stable plugin identifier. */
  name: string;
  /** GLSL-only shader assembly contributions. */
  glsl?: ShaderPluginVariant;
  /** WGSL-only shader assembly contributions. */
  wgsl?: ShaderPluginVariant;
};

/** ShaderPlugin contributions resolved for one shader language. */
export type ResolvedShaderPlugins = {
  /** Resolved shader modules in plugin declaration order. */
  modules: ShaderModule[];
  /** Resolved boolean preprocessor defines. */
  defines: Record<string, boolean>;
  /** Resolved named code injections grouped by target. */
  injections: Record<string, ShaderInjection[]>;
  /** Resolved shader-facing vertex inputs in plugin declaration order. */
  vertexInputs: Record<string, AttributeShaderType>;
  /** Resolved cross-stage varyings in plugin declaration order. */
  varyings: Record<string, ResolvedShaderPluginVarying>;
};

const SHADER_PLUGIN_INJECTION_TARGET_REGEX =
  /^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][\w-]*)$/;

/** Resolve shared and backend-specific contributions from shader plugins. */
export function resolveShaderPlugins(
  plugins: readonly ShaderPlugin[] = [],
  shaderLanguage: 'glsl' | 'wgsl'
): ResolvedShaderPlugins {
  const modules: ShaderModule[] = [];
  const defines: Record<string, boolean> = {};
  const injections: Record<string, ShaderInjection[]> = {};
  const vertexInputs: Record<string, AttributeShaderType> = {};
  const varyings: Record<string, ResolvedShaderPluginVarying> = {};

  for (const plugin of plugins) {
    appendShaderPluginVariant({modules, defines, injections, vertexInputs, varyings}, plugin);
    appendShaderPluginVariant(
      {modules, defines, injections, vertexInputs, varyings},
      plugin[shaderLanguage]
    );
  }

  for (const name of Object.keys(varyings)) {
    if (vertexInputs[name]) {
      throw new Error(`ShaderPlugin name "${name}" cannot be both a vertex input and a varying`);
    }
  }

  return {modules, defines, injections, vertexInputs, varyings};
}

/** Preserve explicit module inputs while appending plugin modules by first-seen name. */
export function mergeShaderPluginModules(
  modules: readonly ShaderModule[] = [],
  pluginModules: readonly ShaderModule[] = []
): ShaderModule[] {
  const mergedModules: ShaderModule[] = [...modules];
  const seenModuleNames = new Set(mergedModules.map(module => module.name));

  for (const pluginModule of pluginModules) {
    if (!seenModuleNames.has(pluginModule.name)) {
      mergedModules.push(pluginModule);
      seenModuleNames.add(pluginModule.name);
    }
  }

  return mergedModules;
}

function appendShaderPluginVariant(
  resolved: ResolvedShaderPlugins,
  variant: ShaderPluginVariant | undefined
): void {
  if (!variant) {
    return;
  }

  if (variant.modules?.length) {
    resolved.modules.push(...variant.modules);
  }
  if (variant.defines) {
    Object.assign(resolved.defines, variant.defines);
  }
  for (const [name, type] of Object.entries(variant.vertexInputs || {})) {
    assertShaderPluginInterfaceName(name, 'vertex input');
    const existingType = resolved.vertexInputs[name];
    if (existingType && existingType !== type) {
      throw new Error(
        `ShaderPlugin vertex input "${name}" has conflicting types "${existingType}" and "${type}"`
      );
    }
    resolved.vertexInputs[name] = type;
  }
  for (const [name, varying] of Object.entries(variant.varyings || {})) {
    assertShaderPluginInterfaceName(name, 'varying');
    const normalizedVarying = normalizeShaderPluginVarying(name, varying);
    const existingVarying = resolved.varyings[name];
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
    resolved.varyings[name] = normalizedVarying;
  }

  for (const injection of variant.injections || []) {
    assertNamedShaderPluginInjectionTarget(injection.target);
    if (!resolved.injections[injection.target]) {
      resolved.injections[injection.target] = [];
    }
    const injections = resolved.injections[injection.target];
    injections.push({
      injection: injection.injection,
      order: injection.order ?? 0
    });
  }
}

function assertShaderPluginInterfaceName(name: string, kind: 'vertex input' | 'varying'): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || name.startsWith('_luma_')) {
    throw new Error(`ShaderPlugin ${kind} "${name}" must be a valid non-reserved identifier`);
  }
}

function normalizeShaderPluginVarying(
  name: string,
  varying: ShaderPluginVarying
): ResolvedShaderPluginVarying {
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
