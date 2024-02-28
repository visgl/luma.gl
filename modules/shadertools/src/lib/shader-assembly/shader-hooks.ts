// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderInjection} from './shader-injections';

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
  header: string;
  /** Code always included at the end of a hook function */
  footer: string;
  /** To Be Documented */
  signature?: string;
};

/** Normalized shader hooks per shader */
export type ShaderHooks = {
  /** Normalized shader hooks for vertex shader */
  vertex: Record<string, ShaderHook>;
  /** Normalized shader hooks for fragment shader */
  fragment: Record<string, ShaderHook>;
};

/** Generate hook source code */
export function getShaderHooks(
  hookFunctions: Record<string, ShaderHook>,
  hookInjections: Record<string, ShaderInjection[]>
): string {
  let result = '';
  for (const hookName in hookFunctions) {
    const hookFunction = hookFunctions[hookName];
    result += `void ${hookFunction.signature} {\n`;
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
export function normalizeShaderHooks(hookFunctions: (string | ShaderHook)[]): ShaderHooks {
  const result: ShaderHooks = {vertex: {}, fragment: {}};

  for (const hookFunction of hookFunctions) {
    let opts: ShaderHook;
    let hook: string;
    if (typeof hookFunction !== 'string') {
      opts = hookFunction;
      hook = opts.hook;
    } else {
      opts = {} as ShaderHook;
      hook = hookFunction;
    }
    hook = hook.trim();
    const [shaderStage, signature] = hook.split(':');
    const name = hook.replace(/\(.+/, '');
    const normalizedHook: ShaderHook = Object.assign(opts, {signature});
    switch (shaderStage) {
      case 'vs':
        result.vertex[name] = normalizedHook;
        break;
      case 'fs':
        result.fragment[name] = normalizedHook;
        break;
      default:
        throw new Error(shaderStage);
    }
  }

  return result;
}
