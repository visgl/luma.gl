// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderInjection} from './shader-injections';

// A normalized hook function
/**
 * The shader hook mechanism allows the application to create shaders
 * that can be automatically extended by the shader modules the application
 * includes.
 *
 * A shader hook function that shader modules can inject code into.
 * Shaders can call these functions, which will be no-ops by default.
 *
 * If a shader module injects code it will be executed upon the hook
 * function call.
 */
export type ShaderHook = {
  /** `vs:` or `fs:` followed by the name and arguments of the function, e.g. `vs:MYHOOK_func(inout vec4 value)`. Hook name without arguments
  will also be used as the name of the shader hook */
  hook: string;
  /** Code always included at the beginning of a hook function */
  header?: string;
  /** Code always included at the end of a hook function */
  footer?: string;
  /** To Be Documented */
  signature?: string;
};

/** Optional source included before or after every injection in a hook function. */
export type ShaderHookOptions = Pick<ShaderHook, 'header' | 'footer'>;

/** A parsed shader hook declaration. */
export type NormalizedShaderHook = {
  /** Stage-prefixed hook name without its function signature. */
  hook: string;
  /** Parsed function signature without the shader stage prefix. */
  signature: string;
  /** Code always included at the beginning of a hook function. */
  header: string;
  /** Code always included at the end of a hook function. */
  footer: string;
};

/** Normalized shader hook declarations grouped by shader stage. */
export type ShaderHookRegistry = {
  /** Normalized shader hooks for vertex shader */
  vertex: Record<string, NormalizedShaderHook>;
  /** Normalized shader hooks for fragment shader */
  fragment: Record<string, NormalizedShaderHook>;
};

/** Hook declarations accepted by the legacy shader assembly API. */
export type ShaderHookDeclarations = readonly (ShaderHook | string)[];

/** Normalized or legacy hook declarations accepted by shader assembly. */
export type ShaderHookInput = ShaderHookDeclarations | ShaderHookRegistry;

/** Create an empty typed hook registry. */
export function createShaderHookRegistry(): ShaderHookRegistry {
  return {vertex: {}, fragment: {}};
}

/** Register a stage-prefixed hook declaration in a typed registry. */
export function registerShaderHook(
  registry: ShaderHookRegistry,
  hook: string,
  options: ShaderHookOptions = {}
): void {
  addShaderHookToRegistry(registry, {hook, ...options});
}

/** Generate hook source code */
export function getShaderHooks(
  hookFunctions: Record<string, NormalizedShaderHook>,
  hookInjections: Record<string, ShaderInjection[]>,
  shaderLanguage: 'glsl' | 'wgsl' = 'glsl'
): string {
  let result = '';
  for (const hookName in hookFunctions) {
    const hookFunction = hookFunctions[hookName];
    const functionPrefix = shaderLanguage === 'wgsl' ? 'fn' : 'void';
    result += `${functionPrefix} ${hookFunction.signature} {\n`;
    if (hookFunction.header) {
      result += `  ${hookFunction.header}`;
    }
    if (hookInjections[hookName]) {
      const injections = hookInjections[hookName];
      injections.sort((a: {order: number}, b: {order: number}): number => a.order - b.order);
      for (const injection of injections) {
        result += `  ${injection.injection}\n`;
      }
    }
    if (hookFunction.footer) {
      result += `  ${hookFunction.footer}`;
    }
    result += '}\n';
  }

  return result;
}

/**
 * Parse string based hook functions
 * And split per shader
 */
export function normalizeShaderHooks(hookFunctions: ShaderHookInput): ShaderHookRegistry {
  if (!Array.isArray(hookFunctions)) {
    return hookFunctions as ShaderHookRegistry;
  }

  const result = createShaderHookRegistry();

  for (const hookFunction of hookFunctions) {
    addShaderHookToRegistry(result, hookFunction);
  }

  return result;
}

/** Validate named hook injections against the declarations active for this assembly. */
export function validateShaderHookInjections(
  registry: ShaderHookRegistry,
  hookInjections: Record<string, ShaderInjection[]>,
  stage?: 'vertex' | 'fragment'
): void {
  const validHookNames = [
    ...Object.keys(registry.vertex),
    ...Object.keys(registry.fragment)
  ].sort();
  const stagePrefix = stage === 'vertex' ? 'vs:' : stage === 'fragment' ? 'fs:' : null;

  for (const hookName of Object.keys(hookInjections)) {
    if (stagePrefix && !hookName.startsWith(stagePrefix)) {
      continue;
    }

    const stageRegistry = hookName.startsWith('vs:') ? registry.vertex : registry.fragment;
    if (!stageRegistry[hookName]) {
      const validHooks = validHookNames.length
        ? validHookNames.map(name => `"${name}"`).join(', ')
        : '(none)';
      throw new Error(`Unknown shader hook "${hookName}". Valid shader hooks: ${validHooks}.`);
    }
  }
}

function addShaderHookToRegistry(
  registry: ShaderHookRegistry,
  hookFunction: ShaderHook | string
): void {
  const options: ShaderHookOptions = typeof hookFunction === 'string' ? {} : hookFunction;
  const hook = (typeof hookFunction === 'string' ? hookFunction : hookFunction.hook).trim();
  const stageSeparatorIndex = hook.indexOf(':');
  const shaderStage = hook.slice(0, stageSeparatorIndex);
  const signature = hook.slice(stageSeparatorIndex + 1);
  const name = hook.replace(/\(.+/, '');
  const normalizedHook: NormalizedShaderHook = {
    hook: name,
    signature,
    header: options.header || '',
    footer: options.footer || ''
  };

  switch (shaderStage) {
    case 'vs':
      registry.vertex[name] = normalizedHook;
      break;
    case 'fs':
      registry.fragment[name] = normalizedHook;
      break;
    default:
      throw new Error(shaderStage);
  }
}
