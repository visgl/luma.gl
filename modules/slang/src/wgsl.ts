// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseWGSL} from './wgsl-parser';
import {analyzeWGSL, lowerWGSLInterface} from './wgsl-analysis';
import {ShaderEmitter} from './emitter';
import type {SlangTranspileResult} from './types';

export type WGSLTranspileOptions = {
  entryPoint?: string;
  sourceName?: string;
  glslVersion?: '300 es' | '450';
};
export type WGSLTranspileResult = SlangTranspileResult;

export {SlangTranspileError as WGSLTranspileError} from './diagnostics';

/** Compile the documented WGSL rendering subset to GLSL without a Slang frontend. */
export function transpileWGSL(
  source: string,
  options: WGSLTranspileOptions = {}
): WGSLTranspileResult {
  const sourceName = options.sourceName || 'shader.wgsl';
  const program = parseWGSL(source, sourceName);
  analyzeWGSL(program, sourceName);
  return new ShaderEmitter(
    program,
    {...options, sourceName, target: 'glsl'},
    lowerWGSLInterface,
    () => undefined
  ).emitProgram();
}
