// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderInjection} from './shader-assembly/shader-injections';
import type {ShaderModule} from './shader-module/shader-module';

export type ShaderExtensionInjectionTarget =
  | 'vs:#decl'
  | 'vs:#main-start'
  | 'vs:#main-end'
  | 'fs:#decl'
  | 'fs:#main-start'
  | 'fs:#main-end'
  | `vs:${string}`
  | `fs:${string}`;

export type ShaderExtensionInjection = {
  target: ShaderExtensionInjectionTarget;
  injection: string;
  order?: number;
};

export type ShaderExtensionVariant = {
  modules?: ShaderModule[];
  defines?: Record<string, boolean>;
  injections?: ShaderExtensionInjection[];
};

export type ShaderExtension = ShaderExtensionVariant & {
  name: string;
  glsl?: ShaderExtensionVariant;
  wgsl?: ShaderExtensionVariant;
};

export type ResolvedShaderExtensions = {
  modules: ShaderModule[];
  defines: Record<string, boolean>;
  injections: Record<string, ShaderInjection[]>;
};

const SHADER_EXTENSION_INJECTION_TARGET_REGEX =
  /^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][\w-]*)$/;

/** Resolve shared and backend-specific contributions from shader extensions. */
export function resolveShaderExtensions(
  extensions: readonly ShaderExtension[] = [],
  shaderLanguage: 'glsl' | 'wgsl'
): ResolvedShaderExtensions {
  const modules: ShaderModule[] = [];
  const defines: Record<string, boolean> = {};
  const injections: Record<string, ShaderInjection[]> = {};

  for (const extension of extensions) {
    appendShaderExtensionVariant({modules, defines, injections}, extension);
    appendShaderExtensionVariant({modules, defines, injections}, extension[shaderLanguage]);
  }

  return {modules, defines, injections};
}

/** Preserve explicit module inputs while appending extension modules by first-seen name. */
export function mergeShaderExtensionModules(
  modules: readonly ShaderModule[] = [],
  extensionModules: readonly ShaderModule[] = []
): ShaderModule[] {
  const mergedModules: ShaderModule[] = [...modules];
  const seenModuleNames = new Set(mergedModules.map(module => module.name));

  for (const extensionModule of extensionModules) {
    if (!seenModuleNames.has(extensionModule.name)) {
      mergedModules.push(extensionModule);
      seenModuleNames.add(extensionModule.name);
    }
  }

  return mergedModules;
}

function appendShaderExtensionVariant(
  resolved: ResolvedShaderExtensions,
  variant: ShaderExtensionVariant | undefined
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

  for (const injection of variant.injections || []) {
    assertNamedShaderExtensionInjectionTarget(injection.target);
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

function assertNamedShaderExtensionInjectionTarget(target: ShaderExtensionInjectionTarget): void {
  if (!SHADER_EXTENSION_INJECTION_TARGET_REGEX.test(target)) {
    throw new Error(
      `ShaderExtension injection target "${target}" must be a named shader anchor or hook`
    );
  }
}
