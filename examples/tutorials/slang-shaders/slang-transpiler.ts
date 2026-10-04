// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {transpileSlang, transpileSlangWGSL, type SlangReflection} from '@luma.gl/slang';
import type {ShaderTranspiler} from '@luma.gl/shadertools';

/** Compiler imports and resource-name translation belong to this application. */
export function createSlangTranspiler(): ShaderTranspiler & {bindingNames: Record<string, string>} {
  const bindingNames: Record<string, string> = {};
  function collectBindingNames(reflection: SlangReflection): void {
    for (const binding of reflection.bindings) {
      bindingNames[binding.name] = binding.blockName ?? binding.shaderName;
    }
  }
  return {
    name: 'slang',
    sourceLanguage: 'slang',
    bindingNames,
    transpile({source, target, stage, entryPoints}) {
      if (target === 'glsl') {
        const result = transpileSlang(source, {
          target,
          glslVersion: '300 es',
          stage,
          entryPoint: stage ? entryPoints[stage] : undefined
        });
        collectBindingNames(result.reflection);
        return result;
      }
      const selected = Object.values(entryPoints).filter((entryPoint): entryPoint is string =>
        Boolean(entryPoint)
      );
      const result = transpileSlangWGSL(source, {
        entryPoints: selected.length ? selected : undefined
      });
      for (const entry of Object.values(result.entryPoints)) {
        collectBindingNames(entry.reflection);
      }
      return {
        code: result.code,
        entryPoints: Object.fromEntries(
          Object.values(result.entryPoints).map(entry => [entry.stage, entry.entryPoint])
        )
      };
    }
  };
}
