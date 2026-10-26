// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** The supported textual shader targets. GLSL defaults to WebGL 2 / GLSL ES 3.00. */
export type SlangTarget = 'glsl' | 'wgsl';
export type SlangShaderStage = 'vertex' | 'fragment' | 'compute';

/** Native code implements these Slang declarations; the compiler emits shared types/resources. */
export type SlangNativeModule = {
  declarations: string;
  wgsl?: string;
  glsl?: string;
  /** Function prototypes required from explicitly exported Slang helpers. */
  imports?: string;
  /** Source declaration name to public target identifier; defaults to the source name. */
  names?: Readonly<Record<string, string>>;
};
/** Exact named modules, loaded by the application. No filesystem or network resolution. */
export type SlangModuleRegistry = Readonly<Record<string, string | SlangNativeModule>>;
export type SlangModuleOptions = {
  modules?: SlangModuleRegistry;
  /** Source declaration name to stable public shader identifier. Overloads are not exported. */
  exports?: Readonly<Record<string, string>>;
};
/** Source-language type contracts for public target declarations. */
export type SlangExport = {
  shaderName: string;
  kind: 'function' | 'struct' | 'variable';
  type: string;
  parameters?: {name: string; type: string; direction: 'in' | 'out' | 'inout'}[];
};
export type SlangTranspileOptions = SlangModuleOptions & {
  target: SlangTarget;
  /** Select one source entry point. Omit for a single [shader(...)] entry point. */
  entryPoint?: string;
  /** Required when the entry point has no [shader(...)] attribute. */
  stage?: SlangShaderStage;
  /** Use 450 for compute shaders and structured buffers. */
  glslVersion?: '300 es' | '450';
  /** Omit unused resource declarations, useful with automatic pipeline layout scanners. */
  omitUnusedResources?: boolean;
  sourceName?: string;
  /** Explicit semantic locations, shared by separately compiled vertex and fragment shaders. */
  locations?: Record<string, number>;
};
export type SlangInterfaceVariable = {
  name: string;
  semantic: string;
  /** Emitted interface field name, for shader-facing attribute layouts. */
  shaderName: string;
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
  /** WebGPU stage mask: vertex=1, fragment=2, compute=4; zero means unused. */
  visibility: number;
  /** Fixed resource arrays are lowered to individual, contiguous bindings. */
  resourceArray?: {name: string; index: number; length: number};
  samplerType?: 'filtering' | 'comparison';
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
  /** Declared workgroup storage in bytes; compare with device limits. */
  workgroupStorageSize?: number;
};
export type SlangTranspileResult = {
  code: string;
  sourceMap: SlangSourceMapEntry[];
  exports?: Record<string, SlangExport>;
  target: SlangTarget;
  /** Actual GLSL version, omitted for WGSL. */
  glslVersion?: '300 es' | '450';
  entryPoint: string;
  stage: SlangShaderStage;
  reflection: SlangReflection;
};

/** Compile multiple entry points into one WGSL translation unit. */
export type SlangWGSLProgramOptions = SlangModuleOptions & {
  /** Source function names. Omit to compile every [shader(...)] entry point. */
  entryPoints?: readonly string[];
  /** Omit unused resource declarations, useful with automatic pipeline layout scanners. */
  omitUnusedResources?: boolean;
  sourceName?: string;
  locations?: Record<string, number>;
};
export type SlangWGSLProgramResult = {
  code: string;
  sourceMap: SlangSourceMapEntry[];
  exports?: Record<string, SlangExport>;
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
  dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  multisampled?: boolean;
  sampleType: 'float' | 'sint' | 'uint' | 'depth';
  components: number;
  format?: SlangStorageTextureFormat;
  glslFormat?: string;
  access?: 'write' | 'read_write';
};

export type SlangStorageTextureFormat =
  | 'rgba8unorm'
  | 'rgba8snorm'
  | 'rgba16float'
  | 'rgba32float'
  | 'rgba32sint'
  | 'rgba32uint'
  | 'r32float'
  | 'r32sint'
  | 'r32uint';
