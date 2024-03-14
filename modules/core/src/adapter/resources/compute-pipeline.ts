// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Resource, ResourceProps} from './resource';
import type {ComputeShaderLayout, Binding} from '../types/shader-layout';
import type {Device} from '../device';
import type {Shader} from './shader';

/**
 * Properties for a compute pipeline
 */
export type ComputePipelineProps = ResourceProps & {
  handle?: unknown;
  /** Compiled shader object */
  shader: Shader;
  /** The entry point, defaults to main */
  entryPoint?: string;
  /** These are WGSL constant values - different from GLSL defines in that shader does not need to be recompiled */
  constants?: Record<string, number>;
  /** Describes the attributes and bindings exposed by the pipeline shader(s). */
  shaderLayout?: ComputeShaderLayout | null;
};

/**
 * A compiled and linked shader program for compute
 */
export abstract class ComputePipeline extends Resource<ComputePipelineProps> {
  static override defaultProps: Required<ComputePipelineProps> = {
    ...Resource.defaultProps,
    shader: undefined!,
    entryPoint: undefined!,
    constants: {},
    shaderLayout: undefined!
  };

  override get [Symbol.toStringTag](): string {
    return 'ComputePipeline';
  }

  hash: string = '';
  /** The merged shader layout */
  shaderLayout: ComputeShaderLayout;

  constructor(device: Device, props: ComputePipelineProps) {
    super(device, props, ComputePipeline.defaultProps);
    this.shaderLayout = props.shaderLayout!;
  }

  /**
   * @todo Use renderpass.setBindings() ?
   * @todo Do we want to expose BindGroups in the API and remove this?
   */
  abstract setBindings(bindings: Record<string, Binding>): void;
}
