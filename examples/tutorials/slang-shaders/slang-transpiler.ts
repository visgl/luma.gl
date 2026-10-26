// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {transpileSlang, transpileSlangWGSL, type SlangModuleOptions} from '@luma.gl/slang';
import {
  getSlangBindingNames,
  getSlangUniformBufferLayouts,
  type SlangCompiledShader,
  type SlangUniformBufferLayout
} from '@luma.gl/slang/luma';
import type {ShaderTranspiler} from '@luma.gl/shadertools';

/** Compiler imports and resource-name translation belong to this application. */
export function createSlangTranspiler(options: SlangModuleOptions = {}): ShaderTranspiler & {
  bindingNames: Record<string, string>;
  uniformBufferLayouts: Record<string, SlangUniformBufferLayout>;
} {
  const bindingNames: Record<string, string> = {};
  const uniformBufferLayouts: Record<string, SlangUniformBufferLayout> = {};
  function collectReflection(shader: SlangCompiledShader): void {
    Object.assign(bindingNames, getSlangBindingNames(shader));
    Object.assign(uniformBufferLayouts, getSlangUniformBufferLayouts(shader));
  }
  return {
    name: 'slang',
    sourceLanguage: 'slang',
    bindingNames,
    uniformBufferLayouts,
    transpile({source, target, stage, entryPoints}) {
      if (target === 'glsl') {
        const result = transpileSlang(source, {
          ...options,
          target,
          glslVersion: '300 es',
          stage,
          entryPoint: stage ? entryPoints[stage] : undefined
        });
        collectReflection(result);
        return result;
      }
      const selected = Object.values(entryPoints).filter((entryPoint): entryPoint is string =>
        Boolean(entryPoint)
      );
      const result = transpileSlangWGSL(source, {
        ...options,
        entryPoints: selected.length ? selected : undefined
      });
      collectReflection(result);
      return {
        code: result.code,
        entryPoints: Object.fromEntries(
          Object.values(result.entryPoints).map(entry => [entry.stage, entry.entryPoint])
        )
      };
    }
  };
}
