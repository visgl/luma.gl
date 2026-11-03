// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderInjection} from './shader-injections';

/** Language-specific source for a callable shader hook. */
export type ShaderHookImplementation = {
  /** Function parameters in the selected shader language, without parentheses. */
  parameters: string;
  /** Return type in this language. Omit for a hook that returns no value. */
  returnType?: string;
  /** Source included before injected code. */
  header?: string;
  /** Source included after injected code. */
  footer?: string;
};

/** One logical extension point with independent GLSL and WGSL syntax. */
export type ShaderHook = {
  /** Function name shared by both shader languages. */
  name: string;
  /** Shader stage that owns the hook. */
  stage: 'vertex' | 'fragment';
  /** GLSL implementation. Omit to skip this hook during GLSL assembly. */
  glsl?: ShaderHookImplementation;
  /** WGSL implementation. Omit to skip this hook during WGSL assembly. */
  wgsl?: ShaderHookImplementation;
};

/** Language-selected hook ready for source generation. */
type ResolvedShaderHook = ShaderHookImplementation & {signature: string};

/** Normalized shader hooks per shader */
export type ShaderHookRegistry = {
  /** Normalized shader hooks for vertex shader */
  vertex: Record<string, ResolvedShaderHook>;
  /** Normalized shader hooks for fragment shader */
  fragment: Record<string, ResolvedShaderHook>;
};

/** Generate hook source code */
export function getShaderHooks(
  hookFunctions: Record<string, ResolvedShaderHook>,
  hookInjections: Record<string, ShaderInjection[]>,
  shaderLanguage: 'glsl' | 'wgsl' = 'glsl'
): string {
  let result = '';
  for (const hookName in hookFunctions) {
    const hookFunction = hookFunctions[hookName];
    const returnType = hookFunction.returnType || 'void';
    const functionPrefix = shaderLanguage === 'wgsl' ? 'fn' : returnType;
    const returnSuffix =
      shaderLanguage === 'wgsl' && returnType !== 'void' ? ` -> ${returnType}` : '';
    result += `${functionPrefix} ${hookFunction.signature}${returnSuffix} {\n`;
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

/** Select language syntax and merge compatible plugin declarations without mutating descriptors. */
export function normalizeShaderHooks(
  hookFunctions: readonly ShaderHook[],
  pluginHooks: readonly ShaderHook[] = [],
  language: 'glsl' | 'wgsl' = 'glsl'
): ShaderHookRegistry {
  const result: ShaderHookRegistry = {vertex: {}, fragment: {}};
  for (const hook of hookFunctions) {
    const implementation = hook[language];
    if (implementation) {
      const prefix = hook.stage === 'vertex' ? 'vs' : 'fs';
      result[hook.stage][`${prefix}:${hook.name}`] = {
        ...implementation,
        signature: `${hook.name}(${implementation.parameters})`
      };
    }
  }
  for (const hook of pluginHooks) {
    const selected = normalizeShaderHooks([hook], [], language);
    for (const stage of ['vertex', 'fragment'] as const) {
      for (const [name, declaration] of Object.entries(selected[stage])) {
        const existing = result[stage][name];
        if (
          existing &&
          (existing.signature !== declaration.signature ||
            (existing.returnType || 'void') !== (declaration.returnType || 'void'))
        ) {
          throw new Error(`Conflicting ShaderPlugin hook ${name}`);
        }
        result[stage][name] = existing || declaration;
      }
    }
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
      const pluginNames = [
        ...new Set(hookInjections[hookName].map(injection => injection.pluginName).filter(Boolean))
      ];
      throw new Error(
        `Unknown shader hook ${hookName}${pluginNames.length ? ` (plugins: ${pluginNames.join(', ')})` : ''}`
      );
    }
  }
}
