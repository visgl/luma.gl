// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** The supported textual shader targets. GLSL defaults to WebGL 2 / GLSL ES 3.00. */
export type SlangTarget = 'glsl' | 'wgsl';
export type SlangShaderStage = 'vertex' | 'fragment' | 'compute';
export type SlangTranspileOptions = {
  target: SlangTarget;
  /** Select one source entry point. Omit for a single [shader(...)] entry point. */
  entryPoint?: string;
  /** Required when the entry point has no [shader(...)] attribute. */
  stage?: SlangShaderStage;
  /** Use 450 for compute shaders and structured buffers. */
  glslVersion?: '300 es' | '450';
  sourceName?: string;
  /** Explicit semantic locations, shared by separately compiled vertex and fragment shaders. */
  locations?: Record<string, number>;
};
export type SlangInterfaceVariable = {
  name: string;
  semantic: string;
  type: string;
  location?: number;
  builtin?: string;
};
export type SlangResourceBinding = {
  name: string;
  shaderName: string;
  group: number;
  binding: number;
  kind: 'uniform' | 'storage' | 'texture' | 'sampler';
  access: 'read' | 'read_write';
  /** GLSL block name for uniform/storage buffer binding. */
  blockName?: string;
  /** Source sampler combined with a GLSL texture uniform. */
  sampler?: string;
};
export type SlangReflection = {
  inputs: SlangInterfaceVariable[];
  outputs: SlangInterfaceVariable[];
  bindings: SlangResourceBinding[];
  workgroupSize?: [number, number, number];
};
export type SlangTranspileResult = {
  code: string;
  target: SlangTarget;
  entryPoint: string;
  stage: SlangShaderStage;
  reflection: SlangReflection;
};

/** Compile multiple entry points into one WGSL translation unit. */
export type SlangWGSLProgramOptions = {
  /** Source function names. Omit to compile every [shader(...)] entry point. */
  entryPoints?: readonly string[];
  sourceName?: string;
  locations?: Record<string, number>;
};
export type SlangWGSLProgramResult = {
  code: string;
  target: 'wgsl';
  /** Per-source-entry metadata, including generated pipeline entry-point names. */
  entryPoints: Record<string, Omit<SlangTranspileResult, 'code' | 'target'>>;
};
