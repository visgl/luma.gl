// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {transpileSlang, transpileSlangWGSL} from '@luma.gl/slang';
import type {ShaderTranspiler} from '@luma.gl/shadertools';

/** Compiler imports belong to this application, keeping the framework independent of Slang. */
export const slangTranspiler: ShaderTranspiler = {
  name: 'slang',
  sourceLanguage: 'slang',
  transpile({source, target, stage, entryPoints}) {
    if (target === 'glsl') {
      return transpileSlang(source, {
        target,
        glslVersion: '300 es',
        stage,
        entryPoint: stage ? entryPoints[stage] : undefined
      });
    }
    const selected = Object.values(entryPoints).filter((entryPoint): entryPoint is string =>
      Boolean(entryPoint)
    );
    const result = transpileSlangWGSL(source, {
      entryPoints: selected.length ? selected : undefined
    });
    return {
      code: result.code,
      entryPoints: Object.fromEntries(
        Object.values(result.entryPoints).map(entry => [entry.stage, entry.entryPoint])
      )
    };
  }
};
