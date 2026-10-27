// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderInjection} from './shader-injections';

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

/** Shader hook declarations grouped by shader stage. */
export type ShaderHookRegistry = {
  vertex: Record<string, Required<ShaderHook>>;
  fragment: Record<string, Required<ShaderHook>>;
};

/** Generate hook source code */
export function getShaderHooks(
  hookFunctions: Record<string, Required<ShaderHook>>,
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
 * Parse string based hook functions and split them per shader stage.
 * A later declaration of the same stage-prefixed hook name replaces an earlier one.
 */
export function normalizeShaderHooks(
  hookFunctions: readonly (ShaderHook | string)[]
): ShaderHookRegistry {
  const result: ShaderHookRegistry = {vertex: {}, fragment: {}};

  for (const hookFunction of hookFunctions) {
    addShaderHookToRegistry(result, hookFunction);
  }

  return result;
}

/** Returns true if a stage-prefixed hook name such as `vs:MY_HOOK` is declared. */
export function isShaderHookRegistered(registry: ShaderHookRegistry, hookName: string): boolean {
  const stageRegistry = hookName.startsWith('vs:') ? registry.vertex : registry.fragment;
  return Boolean(stageRegistry[hookName]);
}

/**
 * Throws if a named hook injection targets a hook that is not declared for this assembly.
 * @param stage Only validate injections for this GLSL stage. WGSL validates both stages.
 */
export function validateShaderHookInjections(
  registry: ShaderHookRegistry,
  hookInjections: Record<string, ShaderInjection[]>,
  stage?: 'vertex' | 'fragment'
): void {
  const stagePrefix = stage === 'vertex' ? 'vs:' : stage === 'fragment' ? 'fs:' : null;

  for (const hookName in hookInjections) {
    if (stagePrefix && !hookName.startsWith(stagePrefix)) {
      continue;
    }

    if (!isShaderHookRegistered(registry, hookName)) {
      // The injection targets a hook that was not declared for this stage.
      throw new Error(`Unknown shader hook ${hookName}`);
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
  const normalizedHook: Required<ShaderHook> = {
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
