//
import {Resource, ResourceProps} from './resource';
import {BindingDeclaration} from '../types/shader-layout';
import type {Device} from '../device';
import type {Shader} from './shader';

/**
 * Properties for a compute pipeline
 */
export type ComputePipelineProps = ResourceProps & {
  handle?: unknown;
  cs: Shader;
  csEntryPoint?: string;
  csConstants?: Record<string, number>; // WGSL only
  shaderLayout?: BindingDeclaration[];
};

/**
 * A compiled and linked shader program for compute
 */
export abstract class ComputePipeline extends Resource<ComputePipelineProps> {
  static override defaultProps: Required<ComputePipelineProps> = {
    ...Resource.defaultProps,
    cs: undefined,
    csEntryPoint: undefined,
    csConstants: {},
    shaderLayout: []
  };  

  override get [Symbol.toStringTag](): string {
    return 'ComputePipeline';
  }

  hash: string = '';

  constructor(device: Device, props: ComputePipelineProps) {
    super(device, props, ComputePipeline.defaultProps);
  }
}
