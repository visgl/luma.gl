// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {UniformValue} from '../utils/uniform-types';
import type {ShaderPass, ShaderPassInputSource, ShaderPassRenderTarget} from './shader-pass';

/** One ordered step in a {@link CompositeShaderPass}. */
export type CompositeShaderPassStep<TargetNameT extends string = string> = {
  shaderPass: ShaderPass<any, any, any, any>;
  inputs?: Record<string, ShaderPassInputSource<TargetNameT>>;
  output?: 'previous' | TargetNameT;
  uniforms?: Record<string, UniformValue>;
};

/** Optional WebGPU compute stage that replaces equivalent fragment-only fallback passes. */
export type CompositeShaderPassComputeOptimization<TargetNameT extends string = string> = {
  /** Stable identifier used for compute resources and command labels. */
  name: string;
  /** Complete WGSL compute entry point with explicit binding locations. */
  source: string;
  /** Existing fragment module that owns the scalar runtime uniforms. */
  uniformModule: string;
  /** Explicit WGSL uniform-buffer binding name used by the compute entry point. */
  uniformBinding: string;
  /** Scalar uniform packing order used by the compute shader. */
  uniformNames: readonly string[];
  /** Composite-pass scalar defaults layered below per-frame runtime overrides. */
  uniforms: Record<string, number>;
  /** Logical source image consumed by the fused compute dispatch. */
  input: ShaderPassInputSource<TargetNameT>;
  /** Mapping from compute storage-texture names to owned render targets. */
  outputs: Record<string, TargetNameT>;
  /** Fragment pass names removed when the WebGPU optimization is supported. */
  replacedPasses: readonly string[];
  /** Compute workgroup width and height in highest-resolution output texels. */
  workgroupSize: readonly [number, number];
};

/** Declarative composition of shader passes with owned targets and optional compute execution. */
export type CompositeShaderPass<TargetNameT extends string = string> = {
  name: string;
  renderTargets?: Record<TargetNameT, ShaderPassRenderTarget>;
  steps: CompositeShaderPassStep<TargetNameT>[];
  /** Optional fused WebGPU dispatch; existing fragment steps remain the portable fallback. */
  compute?: CompositeShaderPassComputeOptimization<TargetNameT>;
};
