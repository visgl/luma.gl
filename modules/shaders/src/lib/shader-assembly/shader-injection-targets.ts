// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ResolvedShaderInjection} from './shader-injections';

/** A named callable target for shader source injections. */
export type ShaderInjectionTarget = {
  /** Function name shared by both shader languages. */
  name: string;
  /** Shader stage that calls the target. */
  stage: 'vertex' | 'fragment';
  /** GLSL signature and source surrounding injected statements. */
  glsl?: {
    parameters: string;
    returnType?: string;
    header?: string;
    footer?: string;
  };
  /** WGSL signature and source surrounding injected statements. */
  wgsl?: {
    parameters: string;
    returnType?: string;
    header?: string;
    footer?: string;
  };
};

/** Language-selected target ready for source generation. */
type ResolvedShaderInjectionTarget = NonNullable<ShaderInjectionTarget['glsl']> & {
  signature: string;
};

/** Normalized shader injection targets per shader */
export type ShaderInjectionTargetRegistry = {
  /** Normalized shader injection targets for vertex shader */
  vertex: Record<string, ResolvedShaderInjectionTarget>;
  /** Normalized shader injection targets for fragment shader */
  fragment: Record<string, ResolvedShaderInjectionTarget>;
};

/** Generate injection target source code */
export function getShaderInjectionTargets(
  injectionTargets: Record<string, ResolvedShaderInjectionTarget>,
  targetInjections: Record<string, ResolvedShaderInjection[]>,
  shaderLanguage: 'glsl' | 'wgsl' = 'glsl'
): string {
  let result = '';
  for (const targetName in injectionTargets) {
    const targetFunction = injectionTargets[targetName];
    const returnType = targetFunction.returnType || 'void';
    const functionPrefix = shaderLanguage === 'wgsl' ? 'fn' : returnType;
    const returnSuffix =
      shaderLanguage === 'wgsl' && returnType !== 'void' ? ` -> ${returnType}` : '';
    result += `${functionPrefix} ${targetFunction.signature}${returnSuffix} {\n`;
    if (targetFunction.header) {
      result += `  ${targetFunction.header}`;
    }
    if (targetInjections[targetName]) {
      const injections = targetInjections[targetName];
      injections.sort((a: {order: number}, b: {order: number}): number => a.order - b.order);
      for (const injection of injections) {
        result += `  ${injection.injection}\n`;
      }
    }
    if (targetFunction.footer) {
      result += `  ${targetFunction.footer}`;
    }
    result += '}\n';
  }

  return result;
}

/** Select language syntax and merge compatible plugin declarations without mutating descriptors. */
export function normalizeShaderInjectionTargets(
  injectionTargets: readonly ShaderInjectionTarget[],
  pluginInjectionTargets: readonly ShaderInjectionTarget[] = [],
  language: 'glsl' | 'wgsl' = 'glsl'
): ShaderInjectionTargetRegistry {
  const result: ShaderInjectionTargetRegistry = {vertex: {}, fragment: {}};
  for (const injectionTarget of injectionTargets) {
    const implementation = injectionTarget[language];
    if (implementation) {
      const prefix = injectionTarget.stage === 'vertex' ? 'vs' : 'fs';
      result[injectionTarget.stage][`${prefix}:${injectionTarget.name}`] = {
        ...implementation,
        signature: `${injectionTarget.name}(${implementation.parameters})`
      };
    }
  }
  for (const injectionTarget of pluginInjectionTargets) {
    const selected = normalizeShaderInjectionTargets([injectionTarget], [], language);
    for (const stage of ['vertex', 'fragment'] as const) {
      for (const [name, declaration] of Object.entries(selected[stage])) {
        const existing = result[stage][name];
        if (
          existing &&
          (existing.signature !== declaration.signature ||
            (existing.returnType || 'void') !== (declaration.returnType || 'void'))
        ) {
          throw new Error(`Conflicting ShaderPlugin injection target ${name}`);
        }
        result[stage][name] = existing || declaration;
      }
    }
  }
  return result;
}

/** Returns true if a stage-prefixed target name such as `vs:MY_HOOK` is declared. */
export function isShaderInjectionTargetRegistered(
  registry: ShaderInjectionTargetRegistry,
  targetName: string
): boolean {
  const stageRegistry = targetName.startsWith('vs:') ? registry.vertex : registry.fragment;
  return Boolean(stageRegistry[targetName]);
}

/**
 * Throws if an injection into a named target refers to one that is not declared for this assembly.
 * @param stage Only validate injections for this GLSL stage. WGSL validates both stages.
 */
export function validateShaderInjectionTargetInjections(
  registry: ShaderInjectionTargetRegistry,
  targetInjections: Record<string, ResolvedShaderInjection[]>,
  stage?: 'vertex' | 'fragment'
): void {
  const stagePrefix = stage === 'vertex' ? 'vs:' : stage === 'fragment' ? 'fs:' : null;

  for (const targetName in targetInjections) {
    if (stagePrefix && !targetName.startsWith(stagePrefix)) {
      continue;
    }

    if (!isShaderInjectionTargetRegistered(registry, targetName)) {
      // The named target was not declared for this stage.
      const pluginNames = [
        ...new Set(
          targetInjections[targetName].map(injection => injection.pluginName).filter(Boolean)
        )
      ];
      throw new Error(
        `Unknown shader injection target ${targetName}${pluginNames.length ? ` (plugins: ${pluginNames.join(', ')})` : ''}`
      );
    }
  }
}
