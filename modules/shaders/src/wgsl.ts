// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  scanWGSLInterface,
  type ScanWGSLInterfaceOptions
} from './lib/shader-assembly/wgsl-interface-scan';

export {WGSLShaderAssembler} from './lib/wgsl-shader-assembler';
export type {ShaderAssembler} from './lib/shader-assembler-base';
export type {
  AssembleShaderProps,
  AssembleShaderOptions,
  GetUniformsFunc
} from './lib/shader-assembly/shader-assembly-types';
export {assembleWGSLShader} from './lib/shader-assembly/assemble-wgsl-shaders';
export {
  getShaderBindingDebugRowsFromWGSL,
  type ShaderBindingDebugRow
} from './lib/shader-assembly/wgsl-binding-debug';

export * from './lib/shader-assembly/wgsl-binding-scan';
