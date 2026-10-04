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
  access: 'read' | 'read_write' | 'write';
  /** Target buffer layout; uniform buffers use a shared std140-compatible representation. */
  layout?: SlangTypeLayout;
  /** Byte stride of a StructuredBuffer element. */
  elementStride?: number;
  texture?: SlangTextureLayout;
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
  sourceMap: SlangSourceMapEntry[];
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
  sourceMap: SlangSourceMapEntry[];
  target: 'wgsl';
  /** Per-source-entry metadata, including generated pipeline entry-point names. */
  entryPoints: Record<string, Omit<SlangTranspileResult, 'code' | 'target' | 'sourceMap'>>;
};

/** Offsets are relative to the containing aggregate. Matrices store Slang rows as target columns. */
export type SlangTypeLayout = {
  type: string;
  name?: string;
  offset: number;
  size: number;
  alignment: number;
  arrayStride?: number;
  matrixStride?: number;
  length?: number;
  rows?: number;
  columns?: number;
  element?: SlangTypeLayout;
  members?: SlangTypeLayout[];
};
export type SlangUniformValue =
  | number
  | boolean
  | ArrayLike<number | boolean>
  | readonly SlangUniformValue[]
  | {[name: string]: SlangUniformValue};
export type SlangSourceMapEntry = {
  generatedLine: number;
  sourceName: string;
  offset: number;
  line: number;
  column: number;
};

export type SlangTextureLayout = {
  dimension: '2d' | '2d-array' | 'cube' | '3d';
  sampleType: 'float' | 'sint' | 'uint' | 'depth';
  components: number;
  format?: string;
  glslFormat?: string;
  access?: 'write' | 'read_write';
};
