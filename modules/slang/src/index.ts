// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SlangParser} from './parser';
import {SlangEmitter} from './emitter';
import type {
  SlangTranspileOptions,
  SlangTranspileResult,
  SlangWGSLProgramOptions,
  SlangWGSLProgramResult
} from './types';
import {mapSlangSource} from './source-map';
import {SlangTranspileError} from './diagnostics';

export type {
  SlangTextureLayout,
  SlangTypeLayout,
  SlangUniformValue,
  SlangSourceMapEntry,
  SlangTarget,
  SlangShaderStage,
  SlangTranspileOptions,
  SlangTranspileResult,
  SlangReflection,
  SlangInterfaceVariable,
  SlangResourceBinding,
  SlangWGSLProgramOptions,
  SlangWGSLProgramResult
} from './types';
export type {SlangDiagnostic} from './diagnostics';
export {packSlangUniforms} from './layout';
export {mapSlangDiagnostic} from './source-map';
export {SlangTranspileError} from './diagnostics';

/** Transpile a self-contained Slang shader in TypeScript, without native or WASM dependencies. */
export function transpileSlang(
  source: string,
  options: SlangTranspileOptions
): SlangTranspileResult {
  const program = new SlangParser(source, options.sourceName || 'shader.slang').parseProgram();
  return new SlangEmitter(program, options).emitProgram();
}

/** Emit shared declarations once and retain every selected WGSL stage entry point. */
export function transpileSlangWGSL(
  source: string,
  options: SlangWGSLProgramOptions = {}
): SlangWGSLProgramResult {
  const sourceName = options.sourceName || 'shader.slang';
  const program = new SlangParser(source, sourceName).parseProgram();
  const entryPoints =
    options.entryPoints ||
    program.declarations
      .filter(
        declaration =>
          declaration.kind === 'function' &&
          declaration.attributes.some(attribute => attribute.name === 'shader')
      )
      .map(declaration => declaration.name);
  if (!entryPoints.length || new Set(entryPoints).size !== entryPoints.length) {
    throw new SlangTranspileError(
      'Select distinct shader entry points',
      {offset: 0, line: 1, column: 1},
      sourceName
    );
  }
  const declarations = new Set<string>();
  const entries: string[] = [];
  const metadata: SlangWGSLProgramResult['entryPoints'] = {};
  for (const entryPoint of entryPoints) {
    const parts = new SlangEmitter(program, {
      ...options,
      target: 'wgsl',
      entryPoint
    }).emitProgramParts();
    parts.declarations.forEach(declaration => declarations.add(declaration));
    // Entry interface types and their local variables must be unique across stages.
    entries.push(
      parts.entry.replace(/\b_slang_(input|output)\b/g, name => `${name}_${entryPoint}`)
    );
    metadata[entryPoint] = {
      entryPoint: parts.result.entryPoint,
      stage: parts.result.stage,
      reflection: parts.result.reflection
    };
  }
  return {
    ...mapSlangSource([...declarations, ...entries].join('\n\n') + '\n', sourceName),
    target: 'wgsl',
    entryPoints: metadata
  };
}
